#ifndef UNPACK_STREAM_HPP
#define UNPACK_STREAM_HPP

#include <memory>
#include <string>
#include <vector>

namespace unpack {

class stream
{
public:
  stream(uint16_t port, const std::string& id);

  stream(const stream&) = delete;
  stream& operator=(const stream&) = delete;
  stream(stream&&) = delete;
  stream& operator=(stream&&) = delete;

  void open();
  void close();
  std::vector<uint8_t> read();
  int64_t seek(int64_t offset, int whence);

private:
  class detail;
  std::shared_ptr<detail> self;
};

}

#endif
