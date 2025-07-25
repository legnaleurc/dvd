#include "unpack.hpp"

#include <archive.h>
#include <archive_entry.h>

#include <cerrno>
#include <memory>

#include "unpack.hxx"

namespace {

unpack::archive_handle
create_archive_reader(unpack::archive_context& context)
{
  using unpack::archive_context;
  using unpack::archive_error;
  using unpack::archive_handle;

  int rv = 0;

  archive_handle handle{ archive_read_new(), archive_read_free };

  rv = archive_read_support_filter_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_support_filter_all");
  }
  rv = archive_read_support_format_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_support_format_all");
  }

  rv = archive_read_set_open_callback(handle.get(), archive_context::open);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_set_open_callback");
  }
  rv = archive_read_set_close_callback(handle.get(), archive_context::close);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_set_close_callback");
  }
  rv = archive_read_set_read_callback(handle.get(), archive_context::read);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_set_read_callback");
  }
  rv = archive_read_set_seek_callback(handle.get(), archive_context::seek);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_set_seek_callback");
  }

  rv = archive_read_set_callback_data(handle.get(), &context);
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_set_callback_data");
  }

  rv = archive_read_open1(handle.get());
  if (rv != ARCHIVE_OK) {
    throw archive_error(handle.get(), "archive_read_open1");
  }

  return handle;
}

unpack::archive_handle
create_archive_writer()
{
  using unpack::archive_handle;

  archive_handle handle{ archive_write_disk_new(), archive_write_free };
  return handle;
}

void
extract_archive(archive* reader, archive* writer)
{
  using unpack::archive_error;

  for (;;) {
    int rv = 0;
    const void* chunk = nullptr;
    std::size_t length = 0;
    la_int64_t offset = 0;

    rv = archive_read_data_block(reader, &chunk, &length, &offset);
    if (rv == ARCHIVE_EOF) {
      break;
    }
    if (rv != ARCHIVE_OK) {
      throw archive_error(reader, "archive_read_data_block");
    }

    rv = archive_write_data_block(writer, chunk, length, offset);
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer, "archive_write_data_block");
    }
  }
}

void
unpack_to(unpack::archive_context& context)
{
  using unpack::archive_error;

  auto reader = create_archive_reader(context);
  auto writer = create_archive_writer();

  for (;;) {
    archive_entry* entry = nullptr;
    int rv = archive_read_next_header(reader.get(), &entry);
    if (rv == ARCHIVE_EOF) {
      break;
    }
    if (rv != ARCHIVE_OK) {
      throw archive_error(reader.get(), "archive_read_next_header");
    }

    // skip folders
    auto file_type = archive_entry_filetype(entry);
    if (file_type & AE_IFDIR) {
      continue;
    }

    context.update_entry_path(entry);

    rv = archive_write_header(writer.get(), entry);
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer.get(), "archive_write_header");
    }

    extract_archive(reader.get(), writer.get());

    rv = archive_write_finish_entry(writer.get());
    if (rv != ARCHIVE_OK) {
      throw archive_error(writer.get(), "archive_write_finish_entry");
    }
  }
}

}

void
unpack::unpack_to(const std::string& archive_uri, const std::string& local_path)
{
  auto context = unpack::archive_context{ archive_uri, local_path };
  ::unpack_to(context);
}
