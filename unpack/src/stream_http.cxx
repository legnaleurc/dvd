#include "stream_http.hxx"

#include <boost/asio/co_spawn.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/use_awaitable.hpp>

#include <format>
#include <regex>
#include <stdexcept>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
namespace ssl = net::ssl;
using tcp = net::ip::tcp;

namespace {

const unsigned int HTTP_STATUS_OK = 200;
const unsigned int HTTP_STATUS_PARTIAL_CONTENT = 206;

}

unpack::http_error::http_error(unsigned int status) noexcept
  : std::runtime_error(std::format("HTTP status code: {}", status))
{
}

unpack::http_error::http_error(const std::string& message) noexcept
  : std::runtime_error(message)
{
}

unpack::input_stream::detail::http_detail::http_detail(const std::string& url)
  : url(url)
  , host()
  , port()
  , target()
  , is_https(false)
  , io_ctx(nullptr)
  , ssl_ctx(nullptr)
  , io_thread()
  , buffer()
  , buffer_mtx()
  , buffer_cv()
  , should_stop(false)
  , has_error(false)
  , error_message()
  , offset(0)
  , length(-1)
  , is_open(false)
{
  parse_url();
}

unpack::input_stream::detail::http_detail::~http_detail()
{
  if (is_open) {
    stop_fetch();
  }
}

void
unpack::input_stream::detail::http_detail::parse_url()
{
  std::regex url_regex(
    R"(^(https?)://([^:/]+)(?::(\d+))?(/.*)?$)",
    std::regex::icase);
  std::smatch match;

  if (!std::regex_match(url, match, url_regex)) {
    throw std::runtime_error("Invalid URL format");
  }

  std::string scheme = match[1];
  is_https = (scheme == "https" || scheme == "HTTPS");
  host = match[2];
  port = match[3].matched ? match[3].str() : (is_https ? "443" : "80");
  target = match[4].matched ? match[4].str() : "/";
}

std::size_t
unpack::input_stream::detail::http_detail::get_buffer_size() const
{
  std::size_t size = 0;
  for (const auto& chunk : buffer) {
    size += chunk.size();
  }
  return size;
}

void
unpack::input_stream::detail::http_detail::start_fetch()
{
  should_stop = false;
  has_error = false;
  error_message.clear();

  io_ctx = std::make_unique<net::io_context>();

  if (is_https) {
    ssl_ctx = std::make_unique<ssl::context>(ssl::context::tlsv12_client);
    ssl_ctx->set_default_verify_paths();
    ssl_ctx->set_verify_mode(ssl::verify_peer);
  }

  // Start background thread
  io_thread = std::jthread([this]([[maybe_unused]] std::stop_token stoken) {
    try {
      // Spawn coroutine
      net::co_spawn(
        *io_ctx,
        is_https ? fetch_https() : fetch_http(),
        net::detached);

      // Run event loop
      io_ctx->run();
    } catch (const std::exception& e) {
      std::lock_guard lock(buffer_mtx);
      has_error = true;
      error_message = e.what();
      buffer_cv.notify_all();
    }
  });

  is_open = true;
}

void
unpack::input_stream::detail::http_detail::stop_fetch()
{
  if (!is_open) {
    return;
  }

  should_stop = true;

  if (io_ctx) {
    io_ctx->stop();
  }

  // Wake up any waiting condition variables
  buffer_cv.notify_all();

  // jthread automatically joins on destruction
  io_thread = std::jthread();

  {
    std::lock_guard lock(buffer_mtx);
    buffer.clear();
  }

  io_ctx.reset();
  ssl_ctx.reset();
  is_open = false;
}

net::awaitable<void>
unpack::input_stream::detail::http_detail::fetch_http()
{
  try {
    tcp::resolver resolver(co_await net::this_coro::executor);
    beast::tcp_stream stream(co_await net::this_coro::executor);

    // Resolve
    auto const results = co_await resolver.async_resolve(
      host, port, net::use_awaitable);

    // Connect
    stream.expires_after(std::chrono::seconds(30));
    co_await stream.async_connect(results, net::use_awaitable);

    // Prepare request
    http::request<http::empty_body> req{ http::verb::get, target, 11 };
    req.set(http::field::host, host);
    req.set(http::field::user_agent, "unpack/1.0");

    // Add Range header if seeking
    if (offset > 0) {
      if (length > 0) {
        req.set(http::field::range,
                std::format("bytes={}-{}", offset, length - 1));
      } else {
        req.set(http::field::range, std::format("bytes={}-", offset));
      }
    }

    // Send request
    co_await http::async_write(stream, req, net::use_awaitable);

    // Receive response
    beast::flat_buffer buffer_temp;
    http::response_parser<http::buffer_body> parser;
    parser.body_limit((std::numeric_limits<std::uint64_t>::max)());

    // Read header
    co_await http::async_read_header(stream, buffer_temp, parser, net::use_awaitable);

    auto status = parser.get().result_int();
    if (status != HTTP_STATUS_OK && status != HTTP_STATUS_PARTIAL_CONTENT) {
      throw http_error(status);
    }

    // Get content length
    if (parser.get().has_content_length()) {
      length = offset + parser.get().payload_size().value();
    }

    // Read body in chunks
    while (!parser.is_done() && !should_stop) {
      // Check buffer size
      {
        std::unique_lock lock(buffer_mtx);
        buffer_cv.wait(lock, [&] {
          return get_buffer_size() < MAX_BUFFER_SIZE || should_stop;
        });
        if (should_stop) {
          break;
        }
      }

      // Prepare buffer for body chunk
      parser.get().body().data = nullptr;
      parser.get().body().size = 0;

      co_await http::async_read(stream, buffer_temp, parser, net::use_awaitable);

      // Extract data from buffer_temp
      if (buffer_temp.size() > 0) {
        auto data = buffer_temp.data();
        binary_chunk chunk;
        chunk.reserve(beast::buffer_bytes(data));
        for (auto const& buf : beast::buffers_range(data)) {
          const auto* ptr = static_cast<const std::uint8_t*>(buf.data());
          chunk.insert(chunk.end(), ptr, ptr + buf.size());
        }
        buffer_temp.consume(buffer_temp.size());

        {
          std::lock_guard lock(buffer_mtx);
          buffer.push_back(std::move(chunk));
        }
        buffer_cv.notify_one();
      }
    }

    // Graceful shutdown
    beast::error_code ec;
    stream.socket().shutdown(tcp::socket::shutdown_both, ec);

  } catch (const std::exception& e) {
    std::lock_guard lock(buffer_mtx);
    has_error = true;
    error_message = e.what();
    buffer_cv.notify_all();
  }
}

net::awaitable<void>
unpack::input_stream::detail::http_detail::fetch_https()
{
  try {
    tcp::resolver resolver(co_await net::this_coro::executor);
    ssl::stream<beast::tcp_stream> stream(
      co_await net::this_coro::executor, *ssl_ctx);

    // Set SNI hostname
    if (!SSL_set_tlsext_host_name(stream.native_handle(), host.c_str())) {
      throw std::runtime_error("Failed to set SNI hostname");
    }

    // Resolve
    auto const results = co_await resolver.async_resolve(
      host, port, net::use_awaitable);

    // Connect
    beast::get_lowest_layer(stream).expires_after(std::chrono::seconds(30));
    co_await beast::get_lowest_layer(stream).async_connect(
      results, net::use_awaitable);

    // SSL handshake
    co_await stream.async_handshake(ssl::stream_base::client, net::use_awaitable);

    // Prepare request
    http::request<http::empty_body> req{ http::verb::get, target, 11 };
    req.set(http::field::host, host);
    req.set(http::field::user_agent, "unpack/1.0");

    // Add Range header if seeking
    if (offset > 0) {
      if (length > 0) {
        req.set(http::field::range,
                std::format("bytes={}-{}", offset, length - 1));
      } else {
        req.set(http::field::range, std::format("bytes={}-", offset));
      }
    }

    // Send request
    co_await http::async_write(stream, req, net::use_awaitable);

    // Receive response
    beast::flat_buffer buffer_temp;
    http::response_parser<http::buffer_body> parser;
    parser.body_limit((std::numeric_limits<std::uint64_t>::max)());

    // Read header
    co_await http::async_read_header(stream, buffer_temp, parser, net::use_awaitable);

    auto status = parser.get().result_int();
    if (status != HTTP_STATUS_OK && status != HTTP_STATUS_PARTIAL_CONTENT) {
      throw http_error(status);
    }

    // Get content length
    if (parser.get().has_content_length()) {
      length = offset + parser.get().payload_size().value();
    }

    // Read body in chunks
    while (!parser.is_done() && !should_stop) {
      // Check buffer size
      {
        std::unique_lock lock(buffer_mtx);
        buffer_cv.wait(lock, [&] {
          return get_buffer_size() < MAX_BUFFER_SIZE || should_stop;
        });
        if (should_stop) {
          break;
        }
      }

      // Prepare buffer for body chunk
      parser.get().body().data = nullptr;
      parser.get().body().size = 0;

      co_await http::async_read(stream, buffer_temp, parser, net::use_awaitable);

      // Extract data from buffer_temp
      if (buffer_temp.size() > 0) {
        auto data = buffer_temp.data();
        binary_chunk chunk;
        chunk.reserve(beast::buffer_bytes(data));
        for (auto const& buf : beast::buffers_range(data)) {
          const auto* ptr = static_cast<const std::uint8_t*>(buf.data());
          chunk.insert(chunk.end(), ptr, ptr + buf.size());
        }
        buffer_temp.consume(buffer_temp.size());

        {
          std::lock_guard lock(buffer_mtx);
          buffer.push_back(std::move(chunk));
        }
        buffer_cv.notify_one();
      }
    }

    // Graceful shutdown
    beast::error_code ec;
    stream.shutdown(ec);

  } catch (const std::exception& e) {
    std::lock_guard lock(buffer_mtx);
    has_error = true;
    error_message = e.what();
    buffer_cv.notify_all();
  }
}

void
unpack::input_stream::detail::http_detail::open()
{
  start_fetch();
}

void
unpack::input_stream::detail::http_detail::close()
{
  stop_fetch();
}

unpack::binary_chunk
unpack::input_stream::detail::http_detail::read()
{
  std::unique_lock lock(buffer_mtx);

  // Wait until buffer has data or error occurs
  buffer_cv.wait(lock, [&] { return !buffer.empty() || has_error; });

  if (has_error) {
    throw http_error(error_message);
  }

  if (buffer.empty()) {
    // EOF
    return binary_chunk();
  }

  auto chunk = std::move(buffer.front());
  buffer.pop_front();
  offset += chunk.size();

  // Notify fetch thread that buffer space is available
  buffer_cv.notify_one();

  return chunk;
}

std::int64_t
unpack::input_stream::detail::http_detail::seek(std::int64_t new_offset,
                                                 int whence)
{
  stop_fetch();

  switch (whence) {
    case SEEK_SET:
      offset = new_offset;
      break;
    case SEEK_CUR:
      offset += new_offset;
      break;
    case SEEK_END:
      if (length < 0) {
        throw std::runtime_error("invalid length for seeking");
      }
      offset = length + new_offset;
      break;
    default:
      throw std::invalid_argument("unknown seek direction");
  }

  // Restart fetch with new offset (range request)
  if (length < 0 || offset < length) {
    start_fetch();
  }

  return offset;
}
