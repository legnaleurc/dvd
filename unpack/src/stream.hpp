#ifndef UNPACK_STREAM_HPP
#define UNPACK_STREAM_HPP

#include <memory>
#include <string>
#include <vector>

namespace unpack {

using binary_chunk = std::vector<std::uint8_t>;

class input_stream
{
public:
  input_stream(std::uint16_t port, const std::string& id);

  input_stream(const input_stream&) = delete;
  input_stream& operator=(const input_stream&) = delete;
  input_stream(input_stream&&) = delete;
  input_stream& operator=(input_stream&&) = delete;

  void open();
  void close();
  binary_chunk read();
  std::int64_t seek(std::int64_t offset, int whence);

private:
  class detail;
  std::shared_ptr<detail> self;
};

}

#endif
