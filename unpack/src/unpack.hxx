#ifndef UNPACK_UNPACK_HXX
#define UNPACK_UNPACK_HXX

#include <archive.h>

#include <stdexcept>
#include <string>
#include <vector>

#include "stream.hpp"
#include "text.hpp"

namespace unpack {

using archive_handle = std::shared_ptr<struct archive>;

class archive_error : public std::runtime_error
{
public:
  archive_error(archive_handle handle, const std::string& name) noexcept;
};

class archive_context
{
public:
  static int open(struct archive* handle, void* context);
  static int close(struct archive* handle, void* context);
  static la_ssize_t read(struct archive* handle,
                         void* context,
                         const void** buffer);
  static la_int64_t seek(struct archive* handle,
                         void* context,
                         la_int64_t offset,
                         int whence);

  archive_context(std::uint16_t port,
                  const std::string& id,
                  const std::string& local_path);

  archive_context(const std::string& archive_path,
                  const std::string& local_path);

  void update_entry_path(struct archive_entry* entry);

private:
  std::string to_output_path(const std::string& entry_name);

  std::string id;
  std::string local_path;
  text_codec decoder;
  input_stream stream;
  binary_chunk chunk;
};

using context_handle = std::shared_ptr<archive_context>;

}

#endif
