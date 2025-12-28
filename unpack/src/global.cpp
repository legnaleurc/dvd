#include "global.hpp"

#include <clocale>

unpack::application::application()
  : locale(nullptr)
{
  // libarchive/libarchive#587
  this->locale = std::setlocale(LC_ALL, "");
}

unpack::application::~application()
{
  std::setlocale(LC_ALL, this->locale);
}
