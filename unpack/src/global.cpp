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

  // libarchive converts entry names between their stored charset and the
  // current locale. Names stored as Unicode (zip with the UTF-8 flag, pax,
  // 7z, rar5) are converted to the locale charset by
  // archive_entry_pathname(), and archive_write_disk converts the UTF-8 path
  // we set back to it. Under the default "C" locale (ASCII) both fail for
  // non-ASCII names, and any other locale charset would not match the UTF-8
  // paths we produce, so force C.UTF-8 instead of inheriting the environment.
  // Names stored as legacy bytes (e.g. Shift-JIS) are passed through as-is
  // regardless of locale; text_codec guesses their charset.
  // See libarchive/libarchive#587.
  this->locale = std::setlocale(LC_CTYPE, "C.UTF-8");
  if (!this->locale) {
    throw std::runtime_error("setlocale C.UTF-8");
  }
}

unpack::application::~application()
{
  std::setlocale(LC_CTYPE, this->locale);
  curl_global_cleanup();
}
