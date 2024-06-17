#include "unpack.hpp"

#include <cerrno>
#include <filesystem>
#include <memory>
#include <sstream>

#include <archive.h>
#include <archive_entry.h>

#include "exception.hpp"
#include "stream.hpp"
#include "text.hpp"
#include "types.hpp"

class context_t
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

  context_t(uint16_t port, const std::string& id);

private:
  unpack::stream stream;
  std::vector<uint8_t> chunk;
};
using context_handle = std::shared_ptr<context_t>;

unpack::archive_handle
create_archive_reader(context_handle context);
unpack::archive_handle
create_disk_writer();
std::string
resolve_path(unpack::text_decoder& text,
             const std::string& local_path,
             const std::string& id,
             const std::string& entry_name);
void
prepare_entry(unpack::archive_handle writer,
              struct archive_entry* entry,
              unpack::text_decoder& text,
              const std::string& local_path,
              const std::string& id);
void
extract_archive(unpack::archive_handle reader, unpack::archive_handle writer);
std::string
make_url(uint16_t port, const std::string& id);

void
unpack::unpack_to(uint16_t port,
                  const std::string& id,
                  const std::string& local_path)
{
  context_handle context = std::make_shared<context_t>(port, id);
  text_decoder text;
  auto reader = create_archive_reader(context);
  auto writer = create_disk_writer();

  for (;;) {
    struct archive_entry* entry = nullptr;
    int rv = archive_read_next_header(reader.get(), &entry);
    if (rv == ARCHIVE_EOF) {
      break;
    }
    if (rv != ARCHIVE_OK) {
      throw archive_error(reader, "archive_read_next_header");
    }

    // skip folders
    auto file_type = archive_entry_filetype(entry);
    if (file_type & AE_IFDIR) {
      continue;
    }

    prepare_entry(writer, entry, text, local_path, id);

    extract_archive(reader, writer);

    rv = archive_write_finish_entry(writer.get());
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer, "archive_write_finish_entry");
    }
  }
}

unpack::archive_handle
create_archive_reader(context_handle context)
{
  using unpack::archive_error;
  using unpack::archive_handle;

  int rv = 0;

  archive_handle handle(
    archive_read_new(),
    [](archive_handle::element_type* p) -> void { archive_read_free(p); });

  rv = archive_read_support_filter_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_support_filter_all");
  }
  rv = archive_read_support_format_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_support_format_all");
  }

  rv = archive_read_set_open_callback(handle.get(), context_t::open);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_open_callback");
  }
  rv = archive_read_set_close_callback(handle.get(), context_t::close);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_close_callback");
  }
  rv = archive_read_set_read_callback(handle.get(), context_t::read);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_read_callback");
  }
  rv = archive_read_set_seek_callback(handle.get(), context_t::seek);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_seek_callback");
  }

  rv = archive_read_set_callback_data(handle.get(), context.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_callback_data");
  }

  rv = archive_read_open1(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_open1");
  }

  return handle;
}

unpack::archive_handle
create_disk_writer()
{
  using unpack::archive_handle;

  archive_handle handle(
    archive_write_disk_new(),
    [](archive_handle::element_type* p) -> void { archive_write_free(p); });
  return handle;
}

void
prepare_entry(unpack::archive_handle writer,
              struct archive_entry* entry,
              unpack::text_decoder& text,
              const std::string& local_path,
              const std::string& id)
{
  using unpack::archive_entry_error;
  using unpack::archive_error;

  auto entry_name = archive_entry_pathname(entry);
  if (!entry_name) {
    throw archive_entry_error("archive_entry_pathname", "nullptr");
  }

  auto entry_path = resolve_path(text, local_path, id, entry_name);
  int rv = archive_entry_update_pathname_utf8(entry, entry_path.c_str());
  if (!rv) {
    throw archive_entry_error("archive_entry_update_pathname_utf8", entry_path);
  }

  rv = archive_write_header(writer.get(), entry);
  if (rv != ARCHIVE_OK) {
    throw archive_error(writer, "archive_write_header");
  }
}

void
extract_archive(unpack::archive_handle reader, unpack::archive_handle writer)
{
  using unpack::archive_error;

  for (;;) {
    int rv = 0;
    const void* chunk = nullptr;
    size_t length = 0;
    la_int64_t offset = 0;

    rv = archive_read_data_block(reader.get(), &chunk, &length, &offset);
    if (rv == ARCHIVE_EOF) {
      break;
    }
    if (rv != ARCHIVE_OK) {
      throw archive_error(reader, "archive_read_data_block");
    }

    rv = archive_write_data_block(writer.get(), chunk, length, offset);
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer, "archive_write_data_block");
    }
  }
}

int
context_t::open(struct archive* handle, void* context)
{
  auto ctx = static_cast<context_t*>(context);
  try {
    ctx->stream.open();
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to open stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

int
context_t::close(struct archive* handle, void* context)
{
  auto ctx = static_cast<context_t*>(context);
  try {
    ctx->chunk.clear();
    ctx->stream.close();
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to close stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

la_ssize_t
context_t::read(struct archive* handle, void* context, const void** buffer)
{
  auto ctx = static_cast<context_t*>(context);
  try {
    ctx->chunk = ctx->stream.read();
    *buffer = &ctx->chunk[0];
    return ctx->chunk.size();
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to read stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

la_int64_t
context_t::seek(struct archive* handle,
                void* context,
                la_int64_t offset,
                int whence)
{
  auto ctx = static_cast<context_t*>(context);
  try {
    return ctx->stream.seek(offset, whence);
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to seek stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

std::string
make_url(uint16_t port, const std::string& id)
{
  std::ostringstream sout;
  sout << "http://localhost";
  sout << ":" << port;
  sout << "/api/v1/nodes";
  sout << "/" << id;
  sout << "/stream";
  return sout.str();
}

std::string
resolve_path(unpack::text_decoder& text,
             const std::string& local_path,
             const std::string& id,
             const std::string& entry_name)
{
  auto new_entry_name = text.toUtf8(entry_name);
  std::filesystem::path path = local_path;
  path /= id;
  path /= new_entry_name;
  return path.string();
}

context_t::context_t(uint16_t port, const std::string& id)
  : stream(make_url(port, id))
  , chunk()
{
}
