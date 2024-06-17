#ifndef TEXT_HPP
#define TEXT_HPP

#include <string>

namespace unpack {

// Only provides move semantic, no copy semantic to avoid race condition.
class Text
{
public:
  Text();
  Text(const Text& that) = delete;
  Text& operator=(const Text& that) = delete;
  Text(Text&& that);
  Text& operator=(Text&& that);

  std::string toUtf8(const std::string& encoded);

private:
  const char** index;
};

}

#endif
