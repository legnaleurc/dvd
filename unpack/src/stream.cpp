#include "stream.hpp"
#include "stream.hxx"

unpack::stream::stream(const std::string& url)
  : self(std::make_shared<detail>(url))
{
}

void
unpack::stream::open()
{
  self->open(false);
}

void
unpack::stream::close()
{
  self->close();
}

std::vector<uint8_t>
unpack::stream::read()
{
  return self->read();
}

int64_t
unpack::stream::seek(int64_t offset, int whence)
{
  return self->seek(offset, whence);
}
