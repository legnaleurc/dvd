#include "global.hpp"

#include <curl/curl.h>

#include <clocale>
#include <stdexcept>

unpack::application::application()
  : locale(nullptr)
{
  auto rv = curl_global_init(CURL_GLOBAL_DEFAULT);
  if (rv != 0) {
    throw std::runtime_error("curl_global_init");
  }

  // libarchive/libarchive#587
  this->locale = std::setlocale(LC_ALL, "");
}

unpack::application::~application()
{
  std::setlocale(LC_ALL, this->locale);
  curl_global_cleanup();
}
