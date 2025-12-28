#ifndef UNPACK_STREAM_HTTP_HXX
#define UNPACK_STREAM_HTTP_HXX

#include "stream.hxx"

#include <boost/asio/io_context.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/system/error_code.hpp>

#include <deque>
#include <optional>
#include <stdexcept>
#include <string>

namespace unpack {

class http_error : public std::runtime_error
{
public:
  explicit http_error(unsigned status) noexcept;
};

class input_stream::detail::http_detail : public input_stream::detail
{
public:
  explicit http_detail(const std::string& url);
  ~http_detail() override;

  http_detail(const http_detail&) = delete;
  http_detail& operator=(const http_detail&) = delete;
  http_detail(http_detail&&) = delete;
  http_detail& operator=(http_detail&&) = delete;

  void open() override;
  void close() override;
  binary_chunk read() override;
  std::int64_t seek(std::int64_t offset, int whence) override;

private:
  // Helper methods
  void open_impl(bool use_range);
  void parse_url();
  void tcp_connect();
  void send_request(bool use_range);
  void receive_headers();
  void start_async_read();
  bool should_start_read() const;
  bool is_length_valid() const;
  bool is_range_valid() const;

  // Parsed URL components
  std::string url_;
  std::string host_;
  std::string port_;
  std::string target_;

  // Boost.Beast/Asio components
  boost::asio::io_context io_ctx_;
  std::optional<boost::beast::tcp_stream> stream_;
  boost::beast::flat_buffer buffer_;
  std::optional<boost::beast::http::response_parser<
    boost::beast::http::string_body>>
    parser_;

  // HTTP state
  bool headers_received_;
  bool eof_;
  bool pending_read_;
  std::optional<boost::system::error_code> error_;

  // Stream state
  std::int64_t offset_;
  std::int64_t length_;
  std::deque<binary_chunk> blocks_;

  // Backpressure limit
  static constexpr std::size_t MAX_BUFFERED_CHUNKS = 2;
};

}

#endif
