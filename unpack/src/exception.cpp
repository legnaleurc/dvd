#include "exception.hpp"

#include <archive.h>

#include <sstream>

ArchiveError::ArchiveError(ArchiveHandle handle,
                           const std::string& name) noexcept
  : std::exception()
  , msg()
{
  std::ostringstream sout;
  const char* msg = archive_error_string(handle.get());
  if (!msg) {
    msg = "(empty error message)";
  }
  sout << name << ": " << msg;
  this->msg = sout.str();
}

const char*
ArchiveError::what() const noexcept
{
  return this->msg.c_str();
}

EntryError::EntryError(const std::string& name,
                       const std::string& detail) noexcept
  : std::exception()
  , msg()
{
  std::ostringstream sout;
  sout << name << ": " << detail;
  this->msg = sout.str();
}

const char*
EntryError::what() const noexcept
{
  return this->msg.c_str();
}

std::string
formatHttpError(long status)
{
  std::ostringstream sout;
  sout << "HTTP status code: " << status;
  return sout.str();
}

HttpError::HttpError(long status) noexcept
  : std::runtime_error(formatHttpError(status))
{
}
