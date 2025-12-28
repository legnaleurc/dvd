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
  : url(url)
  , host()
  , port()
  , target()
  , io_ctx()
  , stream()
  , buffer()
  , parser()
  , headers_received(false)
  , eof(false)
  , pending_read(false)
  , error()
  , offset(0)
  , length(-1)
  , blocks()
{
  this->parse_url();
}

input_stream::detail::http_detail::~http_detail()
{
  try {
    this->close();
  } catch (...) {
    // Destructor must not throw
  }
}

void
unpack::input_stream::detail::http_detail::parse_url()
{
  auto result = boost::urls::parse_uri(this->url);
  if (!result) {
    throw std::runtime_error(std::format("Invalid URL: {}", this->url));
  }

  auto url = *result;

  // Only accept http:// (no https://)
  if (url.scheme() != "http") {
    throw std::runtime_error(
      std::format("Only HTTP supported, got scheme: {}", std::string(url.scheme())));
  }

  this->host = std::string(url.host());
  this->port = url.has_port() ? std::string(url.port()) : "80";

  // Construct target (path + query)
  auto path_str = std::string(url.path());
  if (!path_str.empty()) {
    this->target = path_str;
  } else {
    this->target = "/";
  }

  if (url.has_query()) {
    this->target += "?";
    this->target += std::string(url.query());
  }
}

void
unpack::input_stream::detail::http_detail::open()
{
  this->open(false);
}

void
unpack::input_stream::detail::http_detail::open(bool use_range)
{
  namespace beast = boost::beast;

  // Reset state
  this->io_ctx.restart();
  this->buffer.clear();
  this->blocks.clear();
  this->headers_received = false;
  this->eof = false;
  this->pending_read = false;
  this->error.reset();

  // Create fresh TCP stream
  this->stream.emplace(this->io_ctx);

  // Perform connection and header exchange
  this->tcp_connect();
  this->send_request(use_range);
  this->receive_headers();
}

void
unpack::input_stream::detail::http_detail::tcp_connect()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  // Resolve hostname
  tcp::resolver resolver(this->io_ctx);
  boost::system::error_code ec;

  auto results = resolver.resolve(this->host, this->port, ec);
  if (ec) {
    throw std::runtime_error(
      std::format("DNS resolution failed: {}", ec.message()));
  }

  // Connect to server with timeout
  this->stream->expires_after(std::chrono::seconds(30));
  this->stream->connect(results, ec);
  if (ec) {
    throw std::runtime_error(std::format("Connection failed: {}", ec.message()));
  }
}

void
unpack::input_stream::detail::http_detail::send_request(bool use_range)
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  // Build HTTP request
  http::request<http::empty_body> req{ http::verb::get, this->target, 11 };
  req.set(http::field::host, this->host);
  req.set(http::field::user_agent, "dvd-unpack/1.0");
  req.set(http::field::connection, "keep-alive");

  if (use_range && this->is_range_valid()) {
    // Format: "bytes=offset-end"
    auto range_value = std::format("bytes={}-{}", this->offset, this->length - 1);
    req.set(http::field::range, range_value);
  }

  // Send request
  boost::system::error_code ec;
  http::write(*this->stream, req, ec);
  if (ec) {
    throw std::runtime_error(std::format("Request send failed: {}", ec.message()));
  }
}

void
unpack::input_stream::detail::http_detail::receive_headers()
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  // Create response parser
  this->parser.emplace();
  this->parser->body_limit(std::numeric_limits<std::uint64_t>::max());

  // Read headers only
  boost::system::error_code ec;
  http::read_header(*this->stream, this->buffer, *this->parser, ec);
  if (ec) {
    throw std::runtime_error(std::format("Header read failed: {}", ec.message()));
  }

  this->headers_received = true;

  // Validate status code
  auto status = this->parser->get().result_int();
  if (status != HTTP_STATUS_OK && status != HTTP_STATUS_PARTIAL_CONTENT) {
    throw http_error(status);
  }

  // Extract Content-Length (for 200 OK)
  if (status == HTTP_STATUS_OK) {
    auto& headers = this->parser->get();
    auto it = headers.find(http::field::content_length);
    if (it != headers.end()) {
      try {
        this->length = std::stoll(std::string(it->value()));
      } catch (...) {
        this->length = -1; // Invalid Content-Length
      }
    }
  }
}

binary_chunk
unpack::input_stream::detail::http_detail::read()
{
  // Check for async errors
  if (this->error) {
    throw std::runtime_error(
      std::format("HTTP read error: {}", this->error->message()));
  }

  // Fast path: return buffered chunk
  if (!this->blocks.empty()) {
    auto chunk = std::move(this->blocks.front());
    this->blocks.pop_front();
    this->offset += chunk.size();

    // Start fetching next chunk for pipelining (with backpressure check)
    if (this->should_start_read()) {
      this->start_async_read();
    }

    // Make progress on async operations without blocking
    this->io_ctx.poll();

    return chunk;
  }

  // No buffered data, need to fetch
  if (!this->eof && this->stream && this->parser) {
    if (!this->pending_read) {
      this->start_async_read();
    }

    // Block until data arrives
    this->io_ctx.run();
    this->io_ctx.restart();

    // Check for errors after blocking
    if (this->error) {
      throw std::runtime_error(
        std::format("HTTP read error: {}", this->error->message()));
    }

    // Try again after running
    if (!this->blocks.empty()) {
      auto chunk = std::move(this->blocks.front());
      this->blocks.pop_front();
      this->offset += chunk.size();

      // Start next read immediately (with backpressure check)
      if (this->should_start_read()) {
        this->start_async_read();
      }

      return chunk;
    }
  }

  return {}; // EOF
}

void
unpack::input_stream::detail::http_detail::start_async_read()
{
  namespace beast = boost::beast;
  namespace http = beast::http;
  namespace asio = boost::asio;

  this->pending_read = true;

  http::async_read_some(
    *this->stream,
    this->buffer,
    *this->parser,
    [this](boost::system::error_code ec, std::size_t) {
      this->pending_read = false;

      if (ec == http::error::end_of_stream || ec == asio::error::eof) {
        this->eof = true;
        return;
      }

      if (ec) {
        this->error = ec; // Store error to throw later
        return;
      }

      // Extract body and add to queue
      auto& body = this->parser->get().body();
      if (!body.empty()) {
        this->blocks.push_back(binary_chunk(body.begin(), body.end()));
        body.clear();
      }

      if (this->parser->is_done()) {
        this->eof = true;
      }
    });
}

bool
unpack::input_stream::detail::http_detail::should_start_read() const
{
  return !this->pending_read && !this->eof && this->stream.has_value() &&
         this->parser.has_value() && this->blocks.size() < MAX_BUFFERED_CHUNKS;
}

std::int64_t
unpack::input_stream::detail::http_detail::seek(std::int64_t new_offset, int whence)
{
  // Close current connection
  this->close();

  // Calculate new offset
  switch (whence) {
    case SEEK_SET:
      this->offset = new_offset;
      break;
    case SEEK_CUR:
      this->offset += new_offset;
      break;
    case SEEK_END:
      if (!this->is_length_valid()) {
        throw std::runtime_error(
          "Cannot seek from end without Content-Length");
      }
      this->offset = this->length + new_offset;
      break;
    default:
      throw std::invalid_argument("Invalid seek whence");
  }

  // Reopen with Range header if valid
  if (this->is_range_valid()) {
    this->open(true);
  }

  return this->offset;
}

bool
unpack::input_stream::detail::http_detail::is_length_valid() const
{
  return this->length >= 0;
}

bool
unpack::input_stream::detail::http_detail::is_range_valid() const
{
  return this->is_length_valid() && this->offset >= 0 && this->offset < this->length;
}

void
unpack::input_stream::detail::http_detail::close()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  this->blocks.clear();
  this->buffer.clear();
  this->parser.reset();
  this->headers_received = false;
  this->eof = false;
  this->pending_read = false;
  this->error.reset();

  if (this->stream) {
    boost::system::error_code ec;
    this->stream->socket().shutdown(tcp::socket::shutdown_both, ec);
    // Ignore errors on shutdown
    this->stream.reset();
  }
}

}
