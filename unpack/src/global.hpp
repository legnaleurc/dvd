#ifndef GLOBAL_HPP
#define GLOBAL_HPP

namespace unpack {

class application
{
public:
  application();
  ~application();

  application(const application&) = delete;
  application& operator=(const application&) = delete;
  application(application&&) = delete;
  application& operator=(application&&) = delete;

private:
  const char* locale;
};

}

#endif
