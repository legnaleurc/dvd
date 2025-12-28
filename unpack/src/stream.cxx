#include "stream.hxx"
#include "stream_file.hxx"
#include "stream_http.hxx"

namespace unpack {

std::unique_ptr<input_stream::detail>
input_stream::detail::create(const std::string& uri)
{
  if (uri.starts_with("http://")) {
    return std::make_unique<http_detail>(uri);
  } else {
    return std::make_unique<file_detail>(uri);
  }
}

}
