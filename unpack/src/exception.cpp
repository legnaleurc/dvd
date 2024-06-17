#include "exception.hpp"

#include <archive.h>

#include <sstream>

namespace {
std::string
format_archive_error(unpack::archive_handle handle, const std::string& name)
{
  std::ostringstream sout;
  auto msg = archive_error_string(handle.get());
  if (!msg) {
    msg = "(empty error message)";
  }
  sout << name << ": " << msg;
  return sout.str();
}
}

unpack::archive_error::archive_error(archive_handle handle,
                                     const std::string& name) noexcept
  : std::runtime_error(format_archive_error(handle, name))
{
}

namespace {
std::string
format_entry_error(const std::string& name, const std::string& detail)
{
  std::ostringstream sout;
  sout << name << ": " << detail;
  return sout.str();
}
}

unpack::archive_entry_error::archive_entry_error(
  const std::string& name,
  const std::string& detail) noexcept
  : std::runtime_error(format_entry_error(name, detail))
{
}

namespace {
std::string
format_http_error(long status)
{
  std::ostringstream sout;
  sout << "HTTP status code: " << status;
  return sout.str();
}
}

unpack::http_error::http_error(long status) noexcept
  : std::runtime_error(format_http_error(status))
{
}
