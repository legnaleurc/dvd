#include "format.hpp"

boost::format unpack::operator""_f(const char* s, std::size_t l)
{
  return boost::format{ std::string{ s, l } };
}
