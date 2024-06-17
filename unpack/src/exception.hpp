#ifndef EXCEPTION_HPP
#define EXCEPTION_HPP

#include <stdexcept>
#include <string>

#include "types.hpp"

namespace unpack {

class archive_error : public std::runtime_error
{
public:
  archive_error(archive_handle handle, const std::string& name) noexcept;
};

class archive_entry_error : public std::runtime_error
{
public:
  archive_entry_error(const std::string& name,
                      const std::string& detail) noexcept;
};

class http_error : public std::runtime_error
{
public:
  explicit http_error(long status) noexcept;
};

}

#endif
