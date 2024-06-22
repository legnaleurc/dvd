#ifndef UNPACK_FORMAT_HPP
#define UNPACK_FORMAT_HPP

#include <boost/format.hpp>

namespace unpack {

boost::format operator""_f(const char* s, std::size_t l);

}

#endif
