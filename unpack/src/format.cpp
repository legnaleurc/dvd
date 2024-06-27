#include "format.hpp"

boost::format unpack::operator""_f(const char* literal, std::size_t size)
{
  return boost::format{ std::string{ literal, size } };
}
