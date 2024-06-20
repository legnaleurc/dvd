#ifndef STREAM_HXX
#define STREAM_HXX

#include "stream.hpp"

#include <deque>
#include <stdexcept>
#include <vector>

#include <curl/curl.h>

namespace unpack {

class http_error : public std::runtime_error
{
public:
  explicit http_error(long status) noexcept;
};

using easy_handle = std::shared_ptr<CURL>;
using multi_handle = std::shared_ptr<CURLM>;

class curl_global
{
public:
  curl_global();
  ~curl_global();
  curl_global(const curl_global&) = delete;
  curl_global& operator=(const curl_global&) = delete;
  curl_global(curl_global&&) = delete;
  curl_global& operator=(curl_global&&) = delete;
};

class curl_easy
{
public:
  curl_easy(multi_handle multi, easy_handle easy);
  ~curl_easy();

  bool read();

private:
  void update_status_code();
  void read_until_status_code();
  void update_content_length();
  void read_until_content_length();

  multi_handle multi;
  easy_handle easy;

public:
  long status_code;
  int64_t content_length;
};

class stream::detail
{
public:
  static size_t write(char* ptr, size_t size, size_t nmemb, void* userdata);

  detail(const std::string& url);

  detail(const detail&) = delete;
  detail& operator=(const detail&) = delete;
  detail(detail&&) = delete;
  detail& operator=(detail&&) = delete;

  void open(bool range);
  void close();
  std::vector<uint8_t> read();
  int64_t seek(int64_t offset, int whence);

  bool is_length_valid() const;
  bool is_range_valid() const;

  curl_global global;
  multi_handle multi;
  std::string url;
  std::shared_ptr<curl_easy> easy;
  int64_t offset;
  int64_t length;
  std::deque<std::vector<uint8_t>> blocks;
};

}

#endif
