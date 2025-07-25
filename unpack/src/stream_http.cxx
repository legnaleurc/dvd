#include "stream_http.hxx"

#include <stdexcept>

#include "format.hpp"

namespace {

const long HTTP_STATUS_OK = 200L;
const long HTTP_STATUS_PARTIAL_CONTENT = 206L;

unpack::easy_handle
create_easy_handle()
{
  auto handle = curl_easy_init();
  if (!handle) {
    throw std::runtime_error("curl_easy_init");
  }
  return unpack::easy_handle{ handle, curl_easy_cleanup };
}

unpack::multi_handle
create_multi_handle()
{
  auto handle = curl_multi_init();
  if (!handle) {
    throw std::runtime_error("curl_multi_init");
  }
  return unpack::multi_handle{ handle, curl_multi_cleanup };
}

}

unpack::curl_easy::curl_easy(multi_handle multi, easy_handle easy)
  : multi(multi)
  , easy(easy)
  , is_eof(false)
  , status_code(0)
  , content_length(-1)
{
  auto rv = curl_multi_add_handle(multi.get(), easy.get());
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }

  this->read_until_status_code();
  this->read_until_content_length();
}

unpack::curl_easy::~curl_easy()
{
  curl_multi_remove_handle(this->multi.get(), this->easy.get());
}

void
unpack::curl_easy::read()
{
  if (this->is_eof) {
    throw std::runtime_error("read after eof");
  }

  CURLMcode rv;
  int n_active;
  int n_fd;
  rv = curl_multi_wait(this->multi.get(), NULL, 0, 1000, &n_fd);
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }
  rv = curl_multi_perform(this->multi.get(), &n_active);
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }

  this->is_eof = n_active <= 0;
}

void
unpack::curl_easy::update_status_code()
{
  auto rv = curl_easy_getinfo(
    this->easy.get(), CURLINFO_RESPONSE_CODE, &this->status_code);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }
}

void
unpack::curl_easy::read_until_status_code()
{
  this->update_status_code();
  while (this->status_code == 0) {
    this->read();
    this->update_status_code();
  }
}

void
unpack::curl_easy::update_content_length()
{
  auto rv = curl_easy_getinfo(this->easy.get(),
                              CURLINFO_CONTENT_LENGTH_DOWNLOAD_T,
                              &this->content_length);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }
}

void
unpack::curl_easy::read_until_content_length()
{
  this->update_content_length();
  while (this->content_length < 0) {
    this->read();
    this->update_content_length();
  }
}

unpack::input_stream::detail::http_detail::http_detail(const std::string& url)
  : multi(create_multi_handle())
  , url(url)
  , easy(nullptr)
  , offset(0)
  , length(-1)
  , blocks()
{
}

bool
unpack::input_stream::detail::http_detail::is_length_valid() const
{
  return this->length >= 0;
}

bool
unpack::input_stream::detail::http_detail::is_range_valid() const
{
  return this->is_length_valid() && this->offset < this->length;
}

void
unpack::input_stream::detail::http_detail::open()
{
  this->open(false);
}

void
unpack::input_stream::detail::http_detail::open(bool range)
{
  auto easy = create_easy_handle();
  CURLcode rv = CURLE_OK;

  rv = curl_easy_setopt(easy.get(), CURLOPT_URL, this->url.c_str());
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  rv = curl_easy_setopt(easy.get(),
                        CURLOPT_WRITEFUNCTION,
                        input_stream::detail::http_detail::write);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  rv = curl_easy_setopt(easy.get(), CURLOPT_WRITEDATA, this);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  if (range) {
    auto value = ("%1%-%2%"_f % this->offset % (this->length - 1)).str();

    rv = curl_easy_setopt(easy.get(), CURLOPT_RANGE, value.c_str());
    if (rv != CURLE_OK) {
      throw std::runtime_error(curl_easy_strerror(rv));
    }
  }

  this->easy = std::make_shared<curl_easy>(this->multi, easy);
  auto status_code = this->easy->status_code;

  if (status_code != HTTP_STATUS_OK &&
      status_code != HTTP_STATUS_PARTIAL_CONTENT) {
    throw http_error(status_code);
  }

  if (status_code == HTTP_STATUS_OK) {
    this->length = this->easy->content_length;
  }
}

void
unpack::input_stream::detail::http_detail::close()
{
  this->blocks.clear();
  this->easy.reset();
}

unpack::binary_chunk
unpack::input_stream::detail::http_detail::read()
{
  while (this->blocks.empty()) {
    this->easy->read();
  }

  auto top = std::move(this->blocks.front());
  this->blocks.pop_front();

  this->offset += top.size();

  return top;
}

std::int64_t
unpack::input_stream::detail::http_detail::seek(std::int64_t offset, int whence)
{
  this->close();

  switch (whence) {
    case SEEK_SET:
      this->offset = offset;
      break;
    case SEEK_CUR:
      this->offset += offset;
      break;
    case SEEK_END:
      if (!this->is_length_valid()) {
        throw std::runtime_error("invalid length for seeking");
      }
      this->offset = this->length + offset;
      break;
    default:
      throw std::invalid_argument("unknown seek direction");
  }

  if (this->is_range_valid()) {
    this->open(true);
  }
  return this->offset;
}

std::size_t
unpack::input_stream::detail::http_detail::write(char* ptr,
                                                 std::size_t size,
                                                 std::size_t nmemb,
                                                 void* userdata)
{
  auto self = static_cast<input_stream::detail::http_detail*>(userdata);
  auto chunk = static_cast<const std::uint8_t*>(static_cast<void*>(ptr));
  std::size_t length = size * nmemb;
  self->blocks.emplace_back(chunk, chunk + length);
  return length;
}

unpack::http_error::http_error(long status) noexcept
  : std::runtime_error(("HTTP status code: %1%"_f % status).str())
{
}
