#ifndef TYPES_HPP
#define TYPES_HPP

#include <memory>

struct archive;

namespace unpack {
using archive_handle = std::shared_ptr<struct archive>;
}

#endif
