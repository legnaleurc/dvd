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
// Backpressure limit
constexpr std::size_t MAX_BUFFERED_CHUNKS = 8;
}

// http_error implementation
http_error::http_error(unsigned status) noexcept
  : std::runtime_error(std::format("HTTP status code: {}", status))
{
}

// http_connection_state implementation
connection::connection()
  : io_ctx()
  , stream()
  , buffer()
  , parser()
  , headers_received(false)
  , eof(false)
  , pending_read(false)
  , error()
  , blocks()
{
}

connection::~connection()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  // Mark connection as closing
  this->pending_read = false;
  this->eof = true;

  // Close stream (cancels pending async ops)
  if (this->stream) {
    boost::system::error_code ec;
    this->stream->socket().shutdown(tcp::socket::shutdown_both, ec);
    this->stream.reset();
  }

  // Drain queued handlers (they'll see stream=nullptr and bail)
  while (this->io_ctx.poll_one() > 0) {
    // Continue draining
  }

  // Now safe to destroy buffer, parser, blocks via automatic cleanup
}

void
connection::start_read_loop()
{
  namespace beast = boost::beast;
  namespace http = beast::http;
  namespace asio = boost::asio;

  if (!this->stream || !this->parser || this->eof || this->pending_read) {
    return;
  }

  this->pending_read = true;

  // Capture shared_ptr to keep connection alive while handler is pending
  auto self = shared_from_this();

  http::async_read_some(
    *this->stream,
    this->buffer,
    *this->parser,
    [self](boost::system::error_code ec, std::size_t) {
      self->pending_read = false;

      // If connection was closed, don't process data
      if (!self->stream || !self->parser) {
        return;
      }

      if (ec == http::error::end_of_stream || ec == asio::error::eof) {
        self->eof = true;
        return;
      }

      if (ec) {
        self->error = ec;
        return;
      }

      // Extract body and add to queue
      auto& body = self->parser->get().body();
      if (!body.empty()) {
        self->blocks.push_back(binary_chunk(body.begin(), body.end()));
        body.clear();
      }

      if (self->parser->is_done()) {
        self->eof = true;
        return;
      }

      // Keep pipeline full: recursively chain if buffer not full
      if (self->blocks.size() < MAX_BUFFERED_CHUNKS) {
        self->start_read_loop();
      }
    });
}

// http_detail implementation
input_stream::detail::http_detail::http_detail(const std::string& url)
  : url(url)
  , host()
  , port()
  , target()
  , link()
  , offset(0)
  , length(-1)
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

  // Extract host (strip IPv6 brackets if present)
  auto host_str = std::string(url.host());
  if (host_str.size() >= 2 && host_str.front() == '[' && host_str.back() == ']') {
    // IPv6 address - strip brackets for resolver
    this->host = host_str.substr(1, host_str.size() - 2);
  } else {
    this->host = host_str;
  }

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
  // Create fresh connection (destroys old one automatically via shared_ptr)
  this->link = std::make_shared<connection>();

  // Create fresh TCP stream
  this->link->stream.emplace(this->link->io_ctx);

  // Perform connection and header exchange
  this->tcp_connect();
  this->send_request(use_range);
  this->receive_headers();

  // Start async read loop - connection manages its own lifetime
  this->link->start_read_loop();
}

void
unpack::input_stream::detail::http_detail::tcp_connect()
{
  namespace asio = boost::asio;
  using tcp = asio::ip::tcp;

  if (!this->link) {
    throw std::runtime_error("No connection state");
  }

  // Resolve hostname
  tcp::resolver resolver(this->link->io_ctx);
  boost::system::error_code ec;

  auto results = resolver.resolve(this->host, this->port, ec);
  if (ec) {
    throw std::runtime_error(
      std::format("DNS resolution failed: {}", ec.message()));
  }

  // Connect to server with timeout
  this->link->stream->expires_after(std::chrono::seconds(30));
  this->link->stream->connect(results, ec);
  if (ec) {
    throw std::runtime_error(std::format("Connection failed: {}", ec.message()));
  }
}

void
unpack::input_stream::detail::http_detail::send_request(bool use_range)
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  if (!this->link) {
    throw std::runtime_error("No connection state");
  }

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
  http::write(*this->link->stream, req, ec);
  if (ec) {
    throw std::runtime_error(std::format("Request send failed: {}", ec.message()));
  }
}

void
unpack::input_stream::detail::http_detail::receive_headers()
{
  namespace beast = boost::beast;
  namespace http = beast::http;

  if (!this->link) {
    throw std::runtime_error("No connection state");
  }

  // Create response parser
  this->link->parser.emplace();
  this->link->parser->body_limit(std::numeric_limits<std::uint64_t>::max());

  // Read headers only
  boost::system::error_code ec;
  http::read_header(*this->link->stream, this->link->buffer, *this->link->parser, ec);
  if (ec) {
    throw std::runtime_error(std::format("Header read failed: {}", ec.message()));
  }

  this->link->headers_received = true;

  // Validate status code
  auto status = this->link->parser->get().result_int();
  if (status != HTTP_STATUS_OK && status != HTTP_STATUS_PARTIAL_CONTENT) {
    throw http_error(status);
  }

  // Extract Content-Length (for 200 OK)
  if (status == HTTP_STATUS_OK) {
    auto& headers = this->link->parser->get();
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
unpack::input_stream::detail::http_detail::try_extract_chunk()
{
  // Check for async errors
  if (this->link->error) {
    throw std::runtime_error(
      std::format("HTTP read error: {}", this->link->error->message()));
  }

  // Extract chunk if available
  if (!this->link->blocks.empty()) {
    auto chunk = std::move(this->link->blocks.front());
    this->link->blocks.pop_front();
    this->offset += chunk.size();

    // Kick off next read if buffer draining (connection manages the loop)
    if (this->link->blocks.size() < MAX_BUFFERED_CHUNKS) {
      this->link->start_read_loop();
    }

    return chunk;
  }

  return {}; // No chunk available
}

binary_chunk
unpack::input_stream::detail::http_detail::read()
{
  if (!this->link) {
    return {}; // No connection
  }

  // Drain any completed async operations (non-blocking)
  // This allows chunks to accumulate in the queue for pipelining
  while (this->link->io_ctx.poll_one() > 0) {
    // Continue draining completed handlers
  }

  // Try to extract chunk
  auto chunk = this->try_extract_chunk();
  if (!chunk.empty()) {
    return chunk;
  }

  // No buffered data, need to fetch
  if (!this->link->eof && this->link->stream && this->link->parser) {
    if (!this->link->pending_read) {
      this->link->start_read_loop();
    }

    // Block until data arrives
    this->link->io_ctx.run();
    this->link->io_ctx.restart();

    // Try again after running
    return this->try_extract_chunk();
  }

  return {}; // EOF
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
  this->link.reset();
}

}
