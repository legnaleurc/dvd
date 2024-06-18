#ifndef TEXT_HPP
#define TEXT_HPP

#include <string>

namespace unpack {

class text_decoder
{
public:
  text_decoder();
  text_decoder(const text_decoder& that) = delete;
  text_decoder& operator=(const text_decoder& that) = delete;
  text_decoder(text_decoder&& that) = delete;
  text_decoder& operator=(text_decoder&& that) = delete;

  std::string to_utf8(const std::string& encoded);

private:
  const char** index;
};

}

#endif
