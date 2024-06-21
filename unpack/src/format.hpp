#ifndef FORMAT_HPP
#define FORMAT_HPP

#include <boost/format.hpp>

namespace unpack {

boost::format operator""_f(const char* s, size_t l);

}

#endif
