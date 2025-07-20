#include "stream.hxx"
#include "stream_file.hxx"
#include "stream_http.hxx"

namespace {

bool
starts_with(const std::string& str, const std::string& prefix)
{
  return str.rfind(prefix, 0) == 0;
}

}

namespace unpack {

std::shared_ptr<input_stream::detail>
input_stream::detail::create(const std::string& uri)
{
  if (starts_with(uri, "http://") || starts_with(uri, "https://")) {
    return std::make_shared<http_detail>(uri);
  } else {
    return std::make_shared<file_detail>(uri);
  }
}

}
