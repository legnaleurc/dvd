#include "text.hpp"

#include <boost/locale.hpp>

#include <iterator>


const char * TEXT_CODEC_LIST[] = {
    "UTF-8",
    "Shift-JIS",
    "CP932",
    "EUC-JP",
    "GB2312",
};


Text::Text(): index(std::begin(TEXT_CODEC_LIST)) {}


std::string Text::toUtf8(const std::string & encoded) {
    while (index != std::end(TEXT_CODEC_LIST)) {
        const auto codec = *index;
        try {
            auto decoded = boost::locale::conv::to_utf<char>(encoded, codec, boost::locale::conv::stop);
            return decoded;
        } catch (std::exception & e) {
            std::advance(index, 1);
        }
    }
    return encoded;
}
