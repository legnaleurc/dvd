#include "global.hpp"

#include <clocale>

void
unpack::initialize()
{
  // libarchive/libarchive#587
  std::setlocale(LC_ALL, "");
}
