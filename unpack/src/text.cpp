#include "text.hpp"

#include <boost/locale.hpp>

#include <iterator>

namespace {

const char* TEXT_CODEC_LIST[] = {
  "UTF-8", "Shift-JIS", "CP932", "EUC-JP", "GB2312", "GBK", "GB18030",
};

}

unpack::text_codec::text_codec()
  : index(std::begin(TEXT_CODEC_LIST))
{
}

std::string
unpack::text_codec::to_utf8(const std::string& encoded)
{
  namespace conv = boost::locale::conv;

  while (index != std::end(TEXT_CODEC_LIST)) {
    const auto codec = *index;
    try {
      auto decoded = conv::to_utf<char>(encoded, codec, conv::stop);
      return decoded;
    } catch (std::exception& e) {
      std::advance(index, 1);
    }
  }
  return encoded;
}
