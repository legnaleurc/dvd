#include "text.hpp"

#include <boost/locale.hpp>

#include <iterator>
#include <optional>

namespace {

std::optional<std::string>
decode(const std::string& encoded, const char* codec)
{
  namespace conv = boost::locale::conv;

  try {
    return conv::to_utf<char>(encoded, codec, conv::stop);
  } catch (const std::exception& e) {
    return std::nullopt;
  }
}

bool
is_shift_jis_lead_byte(unsigned char c)
{
  return (c >= 0x81 && c <= 0x9F) || (c >= 0xE0 && c <= 0xFC);
}

// Some archivers blindly replace 0x5C ('\') with '/', which breaks Shift-JIS
// characters whose trail byte is 0x5C (e.g. 表, ソ, 能). Put them back.
std::string
restore_shift_jis_backslash(const std::string& encoded)
{
  std::string restored = encoded;
  for (std::size_t i = 0; i < restored.size(); ++i) {
    auto c = static_cast<unsigned char>(restored[i]);
    if (!is_shift_jis_lead_byte(c) || i + 1 >= restored.size()) {
      continue;
    }
    if (restored[i + 1] == '/') {
      restored[i + 1] = '\\';
    }
    ++i;
  }
  return restored;
}

using decode_function = std::optional<std::string> (*)(const std::string&);

// Order matters: byte ranges overlap, so the first codec that accepts the
// bytes wins.
// - CP932 instead of Shift-JIS: Japanese names come from Windows, and
//   Shift-JIS accepts the same bytes but maps some differently (e.g. '~' to
//   U+203E, '\' to U+00A5, U+FF5E to U+301C).
// - The 0x5C fallback goes right after CP932: a lead byte followed by '/' is
//   never valid CP932, but EUC-JP would accept it as C1 control + '/'.
// - EUC-JP and GB2312 share the same byte grid, so whichever comes first
//   takes most names of the other; Japanese is preferred here.
const decode_function DECODER_LIST[] = {
  [](const std::string& s) { return decode(s, "UTF-8"); },
  [](const std::string& s) { return decode(s, "CP932"); },
  // fallback for broken archives
  [](const std::string& s) {
    return decode(restore_shift_jis_backslash(s), "CP932");
  },
  [](const std::string& s) { return decode(s, "EUC-JP"); },
  [](const std::string& s) { return decode(s, "GBK"); },
  [](const std::string& s) { return decode(s, "GB18030"); },
};

}

unpack::text_codec::text_codec()
  : index(0)
{
}

std::string
unpack::text_codec::to_utf8(const std::string& encoded)
{
  for (auto i = index; i < std::size(DECODER_LIST); ++i) {
    auto decoded = DECODER_LIST[i](encoded);
    if (decoded) {
      index = i;
      return *decoded;
    }
  }
  return encoded;
}
