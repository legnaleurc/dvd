#ifndef UNPACK_STREAM_HXX
#define UNPACK_STREAM_HXX

#include "stream.hpp"

namespace unpack {
class input_stream::detail
{
public:
  virtual ~detail() = default;
  virtual void open() = 0;
  virtual void close() = 0;
  virtual binary_chunk read() = 0;
  virtual std::int64_t seek(std::int64_t offset, int whence) = 0;

  class file_detail;
  class http_detail;
};

}

#endif
