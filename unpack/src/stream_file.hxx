#ifndef UNPACK_STREAM_FILE_HXX
#define UNPACK_STREAM_FILE_HXX

#include "stream.hxx"

#include <fstream>

namespace unpack {

class input_stream::detail::file_detail : public input_stream::detail
{
public:
  explicit file_detail(const std::string& file_path);

  file_detail(const file_detail&) = delete;
  file_detail& operator=(const file_detail&) = delete;
  file_detail(file_detail&&) = delete;
  file_detail& operator=(file_detail&&) = delete;

  void open() override;
  void close() override;
  binary_chunk read() override;
  std::int64_t seek(std::int64_t offset, int whence) override;

  std::string file_path;
  std::ifstream file;
  std::int64_t offset;
  std::int64_t length;
};

}

#endif
