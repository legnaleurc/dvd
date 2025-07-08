#include "stream_file.hxx"

#include <stdexcept>

unpack::input_stream::detail::file_detail::file_detail(
  const std::string& file_path)
  : file_path(file_path)
  , file()
  , offset(0)
  , length(-1)
{
}

void
unpack::input_stream::detail::file_detail::open()
{
  this->file.open(this->file_path, std::ios::binary);
  if (!this->file) {
    throw std::runtime_error("failed to open file: " + this->file_path);
  }
  this->file.seekg(0, std::ios::end);
  this->length = this->file.tellg();
  this->file.seekg(0, std::ios::beg);
  this->offset = 0;
}

void
unpack::input_stream::detail::file_detail::close()
{
  if (this->file.is_open()) {
    this->file.close();
  }
  this->offset = 0;
}

unpack::binary_chunk
unpack::input_stream::detail::file_detail::read()
{
  constexpr std::size_t chunk_size = 64 * 1024;
  if (!this->file.is_open()) {
    throw std::runtime_error("file not open");
  }
  if (this->file.eof() || this->offset >= this->length) {
    return {};
  }
  unpack::binary_chunk chunk(chunk_size);
  this->file.read(reinterpret_cast<char*>(chunk.data()), chunk_size);
  std::size_t n = this->file.gcount();
  chunk.resize(n);
  this->offset += n;
  return chunk;
}

std::int64_t
unpack::input_stream::detail::file_detail::seek(std::int64_t off, int whence)
{
  if (!this->file.is_open()) {
    throw std::runtime_error("file not open");
  }
  std::ios_base::seekdir dir;
  switch (whence) {
    case SEEK_SET:
      dir = std::ios::beg;
      break;
    case SEEK_CUR:
      dir = std::ios::cur;
      break;
    case SEEK_END:
      dir = std::ios::end;
      break;
    default:
      throw std::invalid_argument("unknown seek direction");
  }
  this->file.clear(); // clear eof flag if set
  this->file.seekg(off, dir);
  this->offset = this->file.tellg();
  return this->offset;
}
