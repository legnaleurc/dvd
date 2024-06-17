#include "stream.hpp"

#include <cassert>

#include <curl/curl.h>

#include "stream.hxx"

unpack::Stream::Stream(const std::string& url)
  : self(std::make_shared<Private>(url))
{
}

void
unpack::Stream::open()
{
  self->open(false);
}

void
unpack::Stream::close()
{
  self->close();
}

std::vector<uint8_t>
unpack::Stream::read()
{
  return self->read();
}

int64_t
unpack::Stream::seek(int64_t offset, int whence)
{
  return self->seek(offset, whence);
}
