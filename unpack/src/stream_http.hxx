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

// Per-connection state - isolated for clean RAII cleanup
struct connection
{
  boost::asio::io_context io_ctx;
  std::optional<boost::beast::tcp_stream> stream;
  boost::beast::flat_buffer buffer;
  std::optional<boost::beast::http::response_parser<
    boost::beast::http::string_body>>
    parser;
  bool headers_received;
  bool eof;
  bool pending_read;
  std::optional<boost::system::error_code> error;
  std::deque<binary_chunk> blocks;

  connection();
  ~connection();
  connection(const connection&) = delete;
  connection& operator=(const connection&) = delete;
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
  void open(bool use_range);
  void close() override;
  binary_chunk read() override;
  std::int64_t seek(std::int64_t offset, int whence) override;

  void parse_url();
  void tcp_connect();
  void send_request(bool use_range);
  void receive_headers();
  void start_async_read();
  bool should_start_read() const;
  bool is_length_valid() const;
  bool is_range_valid() const;

  // Parsed URL components (constant across connections)
  std::string url;
  std::string host;
  std::string port;
  std::string target;

  // Current connection (nullptr = closed)
  std::unique_ptr<connection> link;

  // Stream state (persists across reconnections)
  std::int64_t offset;
  std::int64_t length;
};

}

#endif
