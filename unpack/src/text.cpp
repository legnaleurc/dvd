#include "text.hpp"

#include <boost/locale.hpp>

#include <iterator>


const char * TEXT_CODEC_LIST[] = {
    "UTF-8",
    "Shift-JIS",
    "CP932",
    "EUC-JP",
    "GB2312",
    "GBK",
    "GB18030",
};


Text::Text(): index(std::begin(TEXT_CODEC_LIST)) {}


std::string Text::toUtf8(const std::string & encoded) {
    namespace Conv = boost::locale::conv;

    while (index != std::end(TEXT_CODEC_LIST)) {
        const auto codec = *index;
        try {
            auto decoded = Conv::to_utf<char>(encoded, codec, Conv::stop);
            return decoded;
        } catch (std::exception & e) {
            std::advance(index, 1);
        }
    }
    return encoded;
}
