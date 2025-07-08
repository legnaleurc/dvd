#ifndef UNPACK_STREAM_HTTP_HXX
#define UNPACK_STREAM_HTTP_HXX

#include "stream.hxx"

#include <curl/curl.h>

#include <deque>
#include <stdexcept>

namespace unpack {

class http_error : public std::runtime_error
{
public:
  explicit http_error(long status) noexcept;
};

using easy_handle = std::shared_ptr<CURL>;
using multi_handle = std::shared_ptr<CURLM>;

class curl_easy
{
public:
  curl_easy(multi_handle multi, easy_handle easy);
  ~curl_easy();

  void read();

private:
  void update_status_code();
  void read_until_status_code();
  void update_content_length();
  void read_until_content_length();

  multi_handle multi;
  easy_handle easy;
  bool is_eof;

public:
  long status_code;
  std::int64_t content_length;
};

class input_stream::detail::http_detail : public input_stream::detail
{
public:
  static std::size_t write(char* ptr,
                           std::size_t size,
                           std::size_t nmemb,
                           void* userdata);

  explicit http_detail(const std::string& url);

  http_detail(const http_detail&) = delete;
  http_detail& operator=(const http_detail&) = delete;
  http_detail(http_detail&&) = delete;
  http_detail& operator=(http_detail&&) = delete;
  void open() override;
  void close() override;
  binary_chunk read() override;
  std::int64_t seek(std::int64_t offset, int whence) override;

  bool is_length_valid() const;
  bool is_range_valid() const;
  void open(bool range);

  multi_handle multi;
  std::string url;
  std::shared_ptr<curl_easy> easy;
  std::int64_t offset;
  std::int64_t length;
  std::deque<binary_chunk> blocks;
};

}

#endif
