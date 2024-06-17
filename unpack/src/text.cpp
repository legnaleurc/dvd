#include "text.hpp"

#include <boost/locale.hpp>

#include <iterator>

namespace {

const char* TEXT_CODEC_LIST[] = {
  "UTF-8", "Shift-JIS", "CP932", "EUC-JP", "GB2312", "GBK", "GB18030",
};

}

unpack::text_decoder::text_decoder()
  : index(std::begin(TEXT_CODEC_LIST))
{
}

unpack::text_decoder::text_decoder(unpack::text_decoder&& that)
  : index(that.index)
{
}

unpack::text_decoder&
unpack::text_decoder::operator=(unpack::text_decoder&& that)
{
  this->index = that.index;
  return *this;
}

std::string
unpack::text_decoder::toUtf8(const std::string& encoded)
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
