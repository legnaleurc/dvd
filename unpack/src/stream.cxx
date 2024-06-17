#include "stream.hxx"

#include <algorithm>
#include <sstream>
#include <stdexcept>

#include "exception.hpp"

namespace {
const long HTTP_STATUS_OK = 200L;
const long HTTP_STATUS_PARTIAL_CONTENT = 206L;
}

unpack::EasyHandle
createEasyHandle()
{
  auto handle = curl_easy_init();
  if (!handle) {
    throw std::runtime_error("curl_easy_init");
  }
  return unpack::EasyHandle{ handle, curl_easy_cleanup };
}

unpack::MultiHandle
createMultiHandle()
{
  auto handle = curl_multi_init();
  if (!handle) {
    throw std::runtime_error("curl_multi_init");
  }
  return unpack::MultiHandle{ handle, curl_multi_cleanup };
}

unpack::CurlGlobal::CurlGlobal()
{
  auto rv = curl_global_init(CURL_GLOBAL_DEFAULT);
  if (rv != 0) {
    throw std::runtime_error("curl_global_init");
  }
}

unpack::CurlGlobal::~CurlGlobal()
{
  curl_global_cleanup();
}

unpack::CurlEasy::CurlEasy(MultiHandle multi, EasyHandle easy)
  : multi(multi)
  , easy(easy)
  , statusCode(0)
  , contentLength(-1)
{
  auto rv = curl_multi_add_handle(multi.get(), easy.get());
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }

  this->readUntilStatusCode();
  this->readUntilContentLength();
}

unpack::CurlEasy::~CurlEasy()
{
  curl_multi_remove_handle(this->multi.get(), this->easy.get());
}

void
unpack::CurlEasy::read()
{
  CURLMcode rv;
  int nRunning;
  int nFD;
  rv = curl_multi_wait(this->multi.get(), NULL, 0, 1000, &nFD);
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }
  rv = curl_multi_perform(this->multi.get(), &nRunning);
  if (rv != CURLM_OK) {
    throw std::runtime_error(curl_multi_strerror(rv));
  }
}

void
unpack::CurlEasy::readStatusCode()
{
  auto rv = curl_easy_getinfo(
    this->easy.get(), CURLINFO_RESPONSE_CODE, &this->statusCode);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }
}

void
unpack::CurlEasy::readUntilStatusCode()
{
  this->readStatusCode();
  while (this->statusCode == 0) {
    this->read();
    this->readStatusCode();
  }
}

void
unpack::CurlEasy::readContentLength()
{
  auto rv = curl_easy_getinfo(
    this->easy.get(), CURLINFO_CONTENT_LENGTH_DOWNLOAD_T, &this->contentLength);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }
}

void
unpack::CurlEasy::readUntilContentLength()
{
  this->readContentLength();
  while (this->contentLength < 0) {
    this->read();
    this->readContentLength();
  }
}

unpack::Stream::Private::Private(const std::string& url)
  : global()
  , multi(createMultiHandle())
  , url(url)
  , easy(nullptr)
  , offset(0)
  , length(-1)
  , blocks()
{
}

bool
unpack::Stream::Private::isLengthValid() const
{
  return this->length >= 0;
}

bool
unpack::Stream::Private::isRangeValid() const
{
  return this->isLengthValid() && this->offset < this->length;
}

void
unpack::Stream::Private::open(bool range)
{
  auto easy = createEasyHandle();
  CURLcode rv = CURLE_OK;

  rv = curl_easy_setopt(easy.get(), CURLOPT_URL, this->url.c_str());
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  rv =
    curl_easy_setopt(easy.get(), CURLOPT_WRITEFUNCTION, Stream::Private::write);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  rv = curl_easy_setopt(easy.get(), CURLOPT_WRITEDATA, this);
  if (rv != CURLE_OK) {
    throw std::runtime_error(curl_easy_strerror(rv));
  }

  if (range) {
    std::ostringstream sout;
    sout << this->offset << "-" << (this->length - 1);
    auto value = sout.str();

    rv = curl_easy_setopt(easy.get(), CURLOPT_RANGE, value.c_str());
    if (rv != CURLE_OK) {
      throw std::runtime_error(curl_easy_strerror(rv));
    }
  }

  this->easy = std::make_shared<CurlEasy>(this->multi, easy);
  auto statusCode = this->easy->statusCode;

  if (statusCode != HTTP_STATUS_OK &&
      statusCode != HTTP_STATUS_PARTIAL_CONTENT) {
    throw HttpError(statusCode);
  }

  if (statusCode == HTTP_STATUS_OK) {
    this->length = this->easy->contentLength;
  }
}

void
unpack::Stream::Private::close()
{
  this->blocks.clear();
  this->easy.reset();
}

std::vector<uint8_t>
unpack::Stream::Private::read()
{
  while (this->blocks.empty()) {
    this->easy->read();
  }

  auto top = std::move(this->blocks.front());
  this->blocks.pop_front();

  this->offset += top.size();

  return top;
}

int64_t
unpack::Stream::Private::seek(int64_t offset, int whence)
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
      if (!this->isLengthValid()) {
        throw std::runtime_error("invalid length for seeking");
      }
      this->offset = this->length + offset;
      break;
    default:
      throw std::invalid_argument("unknown seek direction");
  }

  if (this->isRangeValid()) {
    this->open(true);
  }
  return this->offset;
}

size_t
unpack::Stream::Private::write(char* ptr,
                               size_t size,
                               size_t nmemb,
                               void* userdata)
{
  auto self = static_cast<Stream::Private*>(userdata);
  auto chunk = static_cast<const uint8_t*>(static_cast<void*>(ptr));
  size_t length = size * nmemb;
  self->blocks.emplace_back(chunk, chunk + length);
  return length;
}
