#ifndef TEXT_HPP
#define TEXT_HPP

#include <string>

namespace unpack {

class text_codec
{
public:
  text_codec();
  text_codec(const text_codec& that) = delete;
  text_codec& operator=(const text_codec& that) = delete;
  text_codec(text_codec&& that) = delete;
  text_codec& operator=(text_codec&& that) = delete;

  std::string to_utf8(const std::string& encoded);

private:
  const char** index;
};

}

#endif
