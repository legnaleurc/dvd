#include "stream.hpp"
#include "format.hpp"
#include "stream.hxx"

unpack::input_stream::input_stream(std::uint16_t port, const std::string& id)
  : self(std::make_shared<detail>(
      ("http://localhost:%1%/api/v1/nodes/%2%/stream"_f % port % id).str()))
{
}

void
unpack::input_stream::open()
{
  self->open(false);
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
