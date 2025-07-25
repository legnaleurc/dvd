#ifndef UNPACK_UNPACK_HXX
#define UNPACK_UNPACK_HXX

#include <archive.h>

#include <stdexcept>
#include <string>
#include <vector>

#include "stream.hpp"
#include "text.hpp"

namespace unpack {

using archive_handle = std::unique_ptr<archive, int (*)(archive*)>;

class archive_error : public std::runtime_error
{
public:
  archive_error(archive* handle, const std::string& name) noexcept;
};

class archive_context
{
public:
  static int open(archive* handle, void* context);
  static int close(archive* handle, void* context);
  static la_ssize_t read(archive* handle, void* context, const void** buffer);
  static la_int64_t seek(archive* handle,
                         void* context,
                         la_int64_t offset,
                         int whence);

  archive_context(const std::string& archive_uri,
                  const std::string& local_path);

  archive_context(const archive_context&) = delete;
  archive_context& operator=(const archive_context&) = delete;
  archive_context(archive_context&&) = delete;
  archive_context& operator=(archive_context&&) = delete;

  void update_entry_path(archive_entry* entry);

private:
  std::string to_output_path(const std::string& entry_name);

  std::string local_path;
  text_codec decoder;
  input_stream stream;
  binary_chunk chunk;
};

}

#endif
