#ifndef EXCEPTION_HPP
#define EXCEPTION_HPP

#include <stdexcept>
#include <string>

#include "types.hpp"

class ArchiveError : public std::runtime_error
{
public:
  ArchiveError(ArchiveHandle handle, const std::string& name) noexcept;
};

class EntryError : public std::runtime_error
{
public:
  EntryError(const std::string& name, const std::string& detail) noexcept;
};

class HttpError : public std::runtime_error
{
public:
  explicit HttpError(long status) noexcept;
};

#endif
