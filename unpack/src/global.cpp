#include "global.hpp"

#ifndef _WIN32
#include <locale.h>
#endif

void
unpack::initialize()
{
  // libarchive/libarchive#587
#ifndef _WIN32
  setlocale(LC_ALL, "");
#endif
}
