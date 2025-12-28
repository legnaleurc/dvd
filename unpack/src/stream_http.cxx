#include "stream_http.hxx"

#include <boost/asio/ip/tcp.hpp>
#include <boost/url/parse.hpp>
#include <boost/url/url_view.hpp>

#include <chrono>
#include <format>
#include <limits>

namespace unpack {

namespace {
constexpr unsigned HTTP_STATUS_OK = 200;
constexpr unsigned HTTP_STATUS_PARTIAL_CONTENT = 206;
}

// http_error implementation
http_error::http_error(unsigned status) noexcept
  : std::runtime_error(std::format("HTTP status code: {}", status))
{
}

// http_detail implementation
input_stream::detail::http_detail::http_detail(const std::string& url)
  : url_(url)
  , host_()
  , port_()
  , target_()
  , io_ctx_()
  , stream_()
  , buffer_()
  , parser_()
  , headers_received_(false)
  , eof_(false)
  , pending_read_(false)
  , error_()
  , offset_(0)
  , length_(-1)
  , blocks_()
{
  parse_url();
}

input_stream::detail::http_detail::~http_detail()
{
  try {
    close();
  } catch (...) {
    // Destructor must not throw
  }
}

void
input_stream::detail::http_detail::parse_url()
{
  auto result = boost::urls::parse_uri(url_);
  if (!result) {
    throw std::runtime_error(std::format("Invalid URL: {}", url_));
  }

  auto url = *result;

  // Only accept http:// (no https://)
  if (url.scheme() != "http") {
    throw std::runtime_error(
      std::format("Only HTTP supported, got scheme: {}", std::string(url.scheme())));
  }

  host_ = std::string(url.host());
  port_ = url.has_port() ? std::string(url.port()) : "80";

  // Construct target (path + query)
  auto path_str = std::string(url.path());
  if (!path_str.empty()) {
    target_ = path_str;
  } else {
    target_ = "/";
  }

  if (url.has_query()) {
    target_ += "?";
    target_ += std::string(url.query());
  }
}

void
input_stream::detail::http_detail::open()
{
  open_impl(false);
}

void
input_stream::detail::http_detail::open_impl(bool use_range)
{
  namespace beast = boost::beast;

  // Reset state
  io_ctx_.restart();
  buffer_.clear();
  blocks_.clear();
  headers_received_ = false;
  eof_ = false;
  pending_read_ = false;
  error_.reset();

  // Create fresh TCP stream
  stream_.emplace(io_ctx_);

  // Perform connection and header exchange
  tcp_connect();
  send_request(use_range);
  receive_headers();
}

void
input_stream::detail::http_detail::tcp_connect()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  // Resolve hostname
  tcp::resolver resolver(io_ctx_);
  boost::system::error_code ec;

  auto results = resolver.resolve(host_, port_, ec);
  if (ec) {
    throw std::runtime_error(
      std::format("DNS resolution failed: {}", ec.message()));
  }

  // Connect to server with timeout
  stream_->expires_after(std::chrono::seconds(30));
  stream_->connect(results, ec);
  if (ec) {
    throw std::runtime_error(std::format("Connection failed: {}", ec.message()));
  }
}

void
input_stream::detail::http_detail::send_request(bool use_range)
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  // Build HTTP request
  http::request<http::empty_body> req{ http::verb::get, target_, 11 };
  req.set(http::field::host, host_);
  req.set(http::field::user_agent, "dvd-unpack/1.0");
  req.set(http::field::connection, "keep-alive");

  if (use_range && is_range_valid()) {
    // Format: "bytes=offset-end"
    auto range_value = std::format("bytes={}-{}", offset_, length_ - 1);
    req.set(http::field::range, range_value);
  }

  // Send request
  boost::system::error_code ec;
  http::write(*stream_, req, ec);
  if (ec) {
    throw std::runtime_error(std::format("Request send failed: {}", ec.message()));
  }
}

void
input_stream::detail::http_detail::receive_headers()
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  // Create response parser
  parser_.emplace();
  parser_->body_limit(std::numeric_limits<std::uint64_t>::max());

  // Read headers only
  boost::system::error_code ec;
  http::read_header(*stream_, buffer_, *parser_, ec);
  if (ec) {
    throw std::runtime_error(std::format("Header read failed: {}", ec.message()));
  }

  headers_received_ = true;

  // Validate status code
  auto status = parser_->get().result_int();
  if (status != HTTP_STATUS_OK && status != HTTP_STATUS_PARTIAL_CONTENT) {
    throw http_error(status);
  }

  // Extract Content-Length (for 200 OK)
  if (status == HTTP_STATUS_OK) {
    auto& headers = parser_->get();
    auto it = headers.find(http::field::content_length);
    if (it != headers.end()) {
      try {
        length_ = std::stoll(std::string(it->value()));
      } catch (...) {
        length_ = -1; // Invalid Content-Length
      }
    }
  }
}

binary_chunk
input_stream::detail::http_detail::read()
{
  // Check for async errors
  if (error_) {
    throw std::runtime_error(
      std::format("HTTP read error: {}", error_->message()));
  }

  // Fast path: return buffered chunk
  if (!blocks_.empty()) {
    auto chunk = std::move(blocks_.front());
    blocks_.pop_front();
    offset_ += chunk.size();

    // Start fetching next chunk for pipelining (with backpressure check)
    if (should_start_read()) {
      start_async_read();
    }

    // Make progress on async operations without blocking
    io_ctx_.poll();

    return chunk;
  }

  // No buffered data, need to fetch
  if (!eof_ && stream_ && parser_) {
    if (!pending_read_) {
      start_async_read();
    }

    // Block until data arrives
    io_ctx_.run();
    io_ctx_.restart();

    // Check for errors after blocking
    if (error_) {
      throw std::runtime_error(
        std::format("HTTP read error: {}", error_->message()));
    }

    // Try again after running
    if (!blocks_.empty()) {
      auto chunk = std::move(blocks_.front());
      blocks_.pop_front();
      offset_ += chunk.size();

      // Start next read immediately (with backpressure check)
      if (should_start_read()) {
        start_async_read();
      }

      return chunk;
    }
  }

  return {}; // EOF
}

void
input_stream::detail::http_detail::start_async_read()
{
  namespace beast = boost::beast;
  namespace http = beast::http;
  namespace asio = boost::asio;

  pending_read_ = true;

  http::async_read_some(
    *stream_,
    buffer_,
    *parser_,
    [this](boost::system::error_code ec, std::size_t) {
      pending_read_ = false;

      if (ec == http::error::end_of_stream || ec == asio::error::eof) {
        eof_ = true;
        return;
      }

      if (ec) {
        error_ = ec; // Store error to throw later
        return;
      }

      // Extract body and add to queue
      auto& body = parser_->get().body();
      if (!body.empty()) {
        blocks_.push_back(binary_chunk(body.begin(), body.end()));
        body.clear();
      }

      if (parser_->is_done()) {
        eof_ = true;
      }
    });
}

bool
input_stream::detail::http_detail::should_start_read() const
{
  return !pending_read_ && !eof_ && stream_.has_value() &&
         parser_.has_value() && blocks_.size() < MAX_BUFFERED_CHUNKS;
}

std::int64_t
input_stream::detail::http_detail::seek(std::int64_t new_offset, int whence)
{
  // Close current connection
  close();

  // Calculate new offset
  switch (whence) {
    case SEEK_SET:
      offset_ = new_offset;
      break;
    case SEEK_CUR:
      offset_ += new_offset;
      break;
    case SEEK_END:
      if (!is_length_valid()) {
        throw std::runtime_error(
          "Cannot seek from end without Content-Length");
      }
      offset_ = length_ + new_offset;
      break;
    default:
      throw std::invalid_argument("Invalid seek whence");
  }

  // Reopen with Range header if valid
  if (is_range_valid()) {
    open_impl(true);
  }

  return offset_;
}

bool
input_stream::detail::http_detail::is_length_valid() const
{
  return length_ >= 0;
}

bool
input_stream::detail::http_detail::is_range_valid() const
{
  return is_length_valid() && offset_ >= 0 && offset_ < length_;
}

void
input_stream::detail::http_detail::close()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  blocks_.clear();
  buffer_.clear();
  parser_.reset();
  headers_received_ = false;
  eof_ = false;
  pending_read_ = false;
  error_.reset();

  if (stream_) {
    boost::system::error_code ec;
    stream_->socket().shutdown(tcp::socket::shutdown_both, ec);
    // Ignore errors on shutdown
    stream_.reset();
  }
}

}
