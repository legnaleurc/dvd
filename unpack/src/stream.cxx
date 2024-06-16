#include "stream.hxx"

#include <algorithm>
#include <sstream>
#include <stdexcept>

EasyHandle
createEasyHandle()
{
  auto handle = curl_easy_init();
  if (!handle) {
    throw std::runtime_error("curl_easy_init");
  }
  return EasyHandle{ handle, curl_easy_cleanup };
}

MultiHandle
createMultiHandle()
{
  auto handle = curl_multi_init();
  if (!handle) {
    throw std::runtime_error("curl_multi_init");
  }
  return MultiHandle{ handle, curl_multi_cleanup };
}

CurlGlobal::CurlGlobal()
{
  auto rv = curl_global_init(CURL_GLOBAL_DEFAULT);
  if (rv != 0) {
    throw std::runtime_error("curl_global_init");
  }
}

CurlGlobal::~CurlGlobal()
{
  curl_global_cleanup();
}

CurlEasy::CurlEasy(MultiHandle multi, EasyHandle easy)
  : multi(multi)
  , easy(easy)
  , statusCode(0)
  , contentLength(-1)
{
  auto rv = curl_multi_add_handle(multi.get(), easy.get());
  if (rv != CURLM_OK) {
    throw std::runtime_error("curl_multi_add_handle");
  }

  this->statusCode = this->readUntilStatusCode();
  this->contentLength = this->readUntilContentLength();
}

CurlEasy::~CurlEasy()
{
  curl_multi_remove_handle(this->multi.get(), this->easy.get());
}

void
CurlEasy::read()
{
  CURLMcode multi_code;
  int still_running;
  int numfds;
  multi_code = curl_multi_wait(this->multi.get(), NULL, 0, 1000, &numfds);
  if (multi_code != CURLM_OK) {
    throw std::runtime_error("curl_multi_wait");
  }
  multi_code = curl_multi_perform(this->multi.get(), &still_running);
  if (multi_code != CURLM_OK) {
    throw std::runtime_error("curl_multi_perform");
  }
}

long
CurlEasy::readUntilStatusCode()
{
  long statusCode = 0;
  do {
    auto rv =
      curl_easy_getinfo(this->easy.get(), CURLINFO_RESPONSE_CODE, &statusCode);
    if (rv != CURLE_OK) {
      throw std::runtime_error("curl_easy_getinfo");
    }
    this->read();
  } while (statusCode == 0);
  return statusCode;
}

int64_t
CurlEasy::readUntilContentLength()
{
  curl_off_t contentLength = -1;
  do {
    auto rv = curl_easy_getinfo(
      this->easy.get(), CURLINFO_CONTENT_LENGTH_DOWNLOAD_T, &contentLength);
    if (rv != CURLE_OK) {
      throw std::runtime_error("curl_easy_getinfo");
    }
    this->read();
  } while (contentLength < 0);
  return contentLength;
}

Stream::Private::Private(const std::string& url)
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
Stream::Private::isLengthValid() const
{
  return this->length >= 0;
}

bool
Stream::Private::isRangeValid() const
{
  return this->isLengthValid() && this->offset < this->length;
}

void
Stream::Private::open(bool range)
{
  auto easy = createEasyHandle();
  CURLcode rv = CURLE_OK;

  rv = curl_easy_setopt(easy.get(), CURLOPT_URL, this->url.c_str());
  if (rv != CURLE_OK) {
    throw std::runtime_error("CURLOPT_URL");
  }

  rv = curl_easy_setopt(
    easy.get(), CURLOPT_WRITEFUNCTION, Stream::Private::writeCallback);
  if (rv != CURLE_OK) {
    throw std::runtime_error("CURLOPT_WRITEFUNCTION");
  }

  rv = curl_easy_setopt(easy.get(), CURLOPT_WRITEDATA, this);
  if (rv != CURLE_OK) {
    throw std::runtime_error("CURLOPT_WRITEDATA");
  }

  if (range && this->isRangeValid()) {
    std::ostringstream sout;
    sout << this->offset << "-" << (this->length - 1);
    auto value = sout.str();

    rv = curl_easy_setopt(easy.get(), CURLOPT_RANGE, value.c_str());
    if (rv != CURLE_OK) {
      throw std::runtime_error("CURLOPT_WRITEDATA");
    }
  }

  this->easy = std::make_shared<CurlEasy>(this->multi, easy);
  auto statusCode = this->easy->statusCode;

  if (statusCode != 200 && statusCode != 206) {
    throw std::runtime_error("status_code");
  }

  if (statusCode == 200) {
    this->length = this->easy->contentLength;
  }
}

void
Stream::Private::close()
{
  this->blocks.clear();
  this->easy.reset();
}

std::vector<uint8_t>
Stream::Private::read()
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
Stream::Private::seek(int64_t offset, int whence)
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
        return -1;
      }
      this->offset = this->length + offset;
      break;
    default:
      return -1;
  }

  this->open(true);
  return this->offset;
}

size_t
Stream::Private::writeCallback(char* ptr,
                               size_t size,
                               size_t nmemb,
                               void* userdata)
{
  auto self = static_cast<Stream::Private*>(userdata);

  size_t length = size * nmemb;
  std::vector<uint8_t> chunk(length);
  std::copy(ptr, ptr + length, &chunk[0]);

  self->blocks.push_back(std::move(chunk));
  return length;
}
