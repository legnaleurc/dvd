#ifndef UNPACK_FORMAT_HPP
#define UNPACK_FORMAT_HPP

#include <boost/format.hpp>

namespace unpack {

boost::format operator""_f(const char* literal, std::size_t size);

}

#endif
