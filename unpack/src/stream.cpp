#include "stream.hpp"
#include "format.hpp"
#include "stream_file.hxx"
#include "stream_http.hxx"

unpack::input_stream::input_stream(std::uint16_t port, const std::string& id)
  : self(std::make_shared<detail::http_detail>(
      ("http://localhost:%1%/api/v1/nodes/%2%/stream"_f % port % id).str()))
{
}

unpack::input_stream::input_stream(const std::string& file_path)
  : self(std::make_shared<detail::file_detail>(file_path))
{
}

void
unpack::input_stream::open()
{
  self->open();
}

void
unpack::input_stream::close()
{
  self->close();
}

unpack::binary_chunk
unpack::input_stream::read()
{
  return self->read();
}

std::int64_t
unpack::input_stream::seek(std::int64_t offset, int whence)
{
  return self->seek(offset, whence);
}
