#ifndef UNPACK_STREAM_HTTP_HXX
#define UNPACK_STREAM_HTTP_HXX

#include "stream.hxx"

#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/beast.hpp>

#include <atomic>
#include <condition_variable>
#include <deque>
#include <mutex>
#include <stdexcept>
#include <string>
#include <thread>

namespace unpack {

class http_error : public std::runtime_error
{
public:
  explicit http_error(unsigned int status) noexcept;
  explicit http_error(const std::string& message) noexcept;
};

class input_stream::detail::http_detail : public input_stream::detail
{
public:
  explicit http_detail(const std::string& url);
  ~http_detail();

  http_detail(const http_detail&) = delete;
  http_detail& operator=(const http_detail&) = delete;
  http_detail(http_detail&&) = delete;
  http_detail& operator=(http_detail&&) = delete;

  void open() override;
  void close() override;
  binary_chunk read() override;
  std::int64_t seek(std::int64_t offset, int whence) override;

private:
  // URL components
  std::string url;
  std::string host;
  std::string port;
  std::string target;
  bool is_https;

  // Async infrastructure
  std::unique_ptr<boost::asio::io_context> io_ctx;
  std::unique_ptr<boost::asio::ssl::context> ssl_ctx;
  std::jthread io_thread;

  // Thread-safe buffer
  static constexpr std::size_t MAX_BUFFER_SIZE = 4 * 1024 * 1024; // 4MB
  std::deque<binary_chunk> buffer;
  std::mutex buffer_mtx;
  std::condition_variable buffer_cv;
  std::atomic<bool> should_stop{ false };
  std::atomic<bool> has_error{ false };
  std::string error_message;

  // State
  std::int64_t offset;
  std::int64_t length;
  std::atomic<bool> is_open{ false };

  // Helper functions
  void parse_url();
  std::size_t get_buffer_size() const;
  void start_fetch();
  void stop_fetch();

  // Coroutines for async HTTP/HTTPS
  boost::asio::awaitable<void> fetch_http();
  boost::asio::awaitable<void> fetch_https();
};

}

#endif
