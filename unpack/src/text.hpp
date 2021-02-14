#ifndef TEXT_HPP
#define TEXT_HPP

#include <string>


class Text {
public:
    Text();

    std::string toUtf8(const std::string & encoded);

private:
    const char ** index;
};

#endif
