#ifndef UNPACK_UNPACK_HPP
#define UNPACK_UNPACK_HPP

#include <cstdint>
#include <string>

namespace unpack {

void
unpack_to(std::uint16_t port,
          const std::string& id,
          const std::string& local_path);

void
unpack_to(const std::string& archive_path, const std::string& local_path);

}

#endif
