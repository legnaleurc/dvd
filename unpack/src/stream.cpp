#include "stream.hpp"

#include <cassert>

#include <curl/curl.h>

#include "stream.hxx"

Stream::Stream(const std::string& url)
  : self(std::make_shared<Private>(url))
{
}

void
Stream::open()
{
  self->open(false);
}

void
Stream::close()
{
  self->close();
}

std::vector<uint8_t>
Stream::read()
{
  return self->read();
}

int64_t
Stream::seek(int64_t offset, int whence)
{
  return self->seek(offset, whence);
}
