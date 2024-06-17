#ifndef TYPES_HPP
#define TYPES_HPP

#include <memory>

struct archive;

namespace unpack {
using ArchiveHandle = std::shared_ptr<struct archive>;
}

#endif
