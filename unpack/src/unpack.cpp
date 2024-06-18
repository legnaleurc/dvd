#include "unpack.hpp"

#include <cerrno>
#include <memory>
#include <sstream>

#include <archive.h>
#include <archive_entry.h>

#include "stream.hpp"
#include "unpack.hxx"

namespace {

unpack::archive_handle
create_archive_reader(unpack::context_handle context)
{
  using unpack::archive_context;
  using unpack::archive_error;
  using unpack::archive_handle;

  int rv = 0;

  archive_handle handle{ archive_read_new(),
                         [](archive_handle::element_type* p) -> void {
                           archive_read_free(p);
                         } };

  rv = archive_read_support_filter_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_support_filter_all");
  }
  rv = archive_read_support_format_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_support_format_all");
  }

  rv = archive_read_set_open_callback(handle.get(), archive_context::open);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_open_callback");
  }
  rv = archive_read_set_close_callback(handle.get(), archive_context::close);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_close_callback");
  }
  rv = archive_read_set_read_callback(handle.get(), archive_context::read);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle, "archive_read_set_read_callback");
  }
  rv = archive_read_set_seek_callback(handle.get(), archive_context::seek);
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
create_archive_writer()
{
  using unpack::archive_handle;

  archive_handle handle{ archive_write_disk_new(),
                         [](archive_handle::element_type* p) -> void {
                           archive_write_free(p);
                         } };
  return handle;
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

}

void
unpack::unpack_to(uint16_t port,
                  const std::string& id,
                  const std::string& local_path)
{
  context_handle context =
    std::make_shared<archive_context>(port, id, local_path);
  auto reader = create_archive_reader(context);
  auto writer = create_archive_writer();

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

    context->update_entry_path(entry);

    rv = archive_write_header(writer.get(), entry);
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer, "archive_write_header");
    }

    extract_archive(reader, writer);

    rv = archive_write_finish_entry(writer.get());
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer, "archive_write_finish_entry");
    }
  }
}
