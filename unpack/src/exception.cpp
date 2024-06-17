#include "exception.hpp"

#include <archive.h>

#include <sstream>

std::string
formatArchiveError(ArchiveHandle handle, const std::string& name)
{
  std::ostringstream sout;
  auto msg = archive_error_string(handle.get());
  if (!msg) {
    msg = "(empty error message)";
  }
  sout << name << ": " << msg;
  return sout.str();
}

ArchiveError::ArchiveError(ArchiveHandle handle,
                           const std::string& name) noexcept
  : std::runtime_error(formatArchiveError(handle, name))
{
}

std::string
formatEntryError(const std::string& name, const std::string& detail)
{
  std::ostringstream sout;
  sout << name << ": " << detail;
  return sout.str();
}

EntryError::EntryError(const std::string& name,
                       const std::string& detail) noexcept
  : std::runtime_error(formatEntryError(name, detail))
{
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
