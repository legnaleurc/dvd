#include "stream.hpp"
#include "format.hpp"
#include "stream.hxx"

unpack::stream::stream(uint16_t port, const std::string& id)
  : self(std::make_shared<detail>(
      ("http://localhost:%1%/api/v1/nodes/%2%/stream"_f % port % id).str()))
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
