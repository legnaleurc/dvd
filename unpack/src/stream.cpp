#include "stream.hpp"
#include "stream.hxx"

unpack::input_stream::input_stream(const std::string& uri)
  : self(detail::create(uri))
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
