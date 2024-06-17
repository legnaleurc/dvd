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

class Context
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

  Context(uint16_t port, const std::string& id);

private:
  Stream stream;
  std::vector<uint8_t> chunk;
};
using ContextHandle = std::shared_ptr<Context>;

ArchiveHandle
createArchiveReader(ContextHandle context);
ArchiveHandle
createDiskWriter();
std::string
resolvePath(Text& text,
            const std::string& localPath,
            const std::string& id,
            const std::string& entryName);
void
extractArchive(ArchiveHandle reader, ArchiveHandle writer);
std::string
makeUrl(uint16_t port, const std::string& id);

void
unpackTo(uint16_t port, const std::string& id, const std::string& localPath)
{
  ContextHandle context = std::make_shared<Context>(port, id);
  Text text;
  auto reader = createArchiveReader(context);
  auto writer = createDiskWriter();

  for (;;) {
    struct archive_entry* entry = nullptr;
    int rv = archive_read_next_header(reader.get(), &entry);
    if (rv == ARCHIVE_EOF) {
      break;
    }
    if (rv != ARCHIVE_OK) {
      throw ArchiveError(reader, "archive_read_next_header");
    }

    // skip folders
    auto fileType = archive_entry_filetype(entry);
    if (fileType & AE_IFDIR) {
      continue;
    }

    const char* entryName = archive_entry_pathname(entry);
    if (!entryName) {
      throw EntryError("archive_entry_pathname", "nullptr");
    }

    auto entryPath = resolvePath(text, localPath, id, entryName);
    rv = archive_entry_update_pathname_utf8(entry, entryPath.c_str());
    if (!rv) {
      throw EntryError("archive_entry_update_pathname_utf8", entryPath);
    }

    rv = archive_write_header(writer.get(), entry);
    if (rv != ARCHIVE_OK) {
      throw ArchiveError(writer, "archive_write_header");
    }

    extractArchive(reader, writer);

    rv = archive_write_finish_entry(writer.get());
    if (rv != ARCHIVE_OK) {
      throw ArchiveError(writer, "archive_write_finish_entry");
    }
  }
}

ArchiveHandle
createArchiveReader(ContextHandle context)
{
  int rv = 0;

  ArchiveHandle handle(
    archive_read_new(),
    [](ArchiveHandle::element_type* p) -> void { archive_read_free(p); });

  rv = archive_read_support_filter_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_support_filter_all");
  }
  rv = archive_read_support_format_all(handle.get());
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_support_format_all");
  }

  rv = archive_read_set_open_callback(handle.get(), Context::open);
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_set_open_callback");
  }
  rv = archive_read_set_close_callback(handle.get(), Context::close);
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_set_close_callback");
  }
  rv = archive_read_set_read_callback(handle.get(), Context::read);
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_set_read_callback");
  }
  rv = archive_read_set_seek_callback(handle.get(), Context::seek);
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_set_seek_callback");
  }

  rv = archive_read_set_callback_data(handle.get(), context.get());
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_set_callback_data");
  }

  rv = archive_read_open1(handle.get());
  if (rv != ARCHIVE_OK) {
    throw ArchiveError(handle, "archive_read_open1");
  }

  return handle;
}

ArchiveHandle
createDiskWriter()
{
  ArchiveHandle handle(
    archive_write_disk_new(),
    [](ArchiveHandle::element_type* p) -> void { archive_write_free(p); });
  return handle;
}

void
extractArchive(ArchiveHandle reader, ArchiveHandle writer)
{
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
      throw ArchiveError(reader, "archive_read_data_block");
    }

    rv = archive_write_data_block(writer.get(), chunk, length, offset);
    if (rv != ARCHIVE_OK) {
      throw ArchiveError(writer, "archive_write_data_block");
    }
  }
}

int
Context::open(struct archive* handle, void* context)
{
  auto ctx = static_cast<Context*>(context);
  try {
    ctx->stream.open();
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to open stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

int
Context::close(struct archive* handle, void* context)
{
  auto ctx = static_cast<Context*>(context);
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
Context::read(struct archive* handle, void* context, const void** buffer)
{
  auto ctx = static_cast<Context*>(context);
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
Context::seek(struct archive* handle,
              void* context,
              la_int64_t offset,
              int whence)
{
  auto ctx = static_cast<Context*>(context);
  try {
    return ctx->stream.seek(offset, whence);
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to seek stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

std::string
makeUrl(uint16_t port, const std::string& id)
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
resolvePath(Text& text,
            const std::string& localPath,
            const std::string& id,
            const std::string& entryName)
{
  auto newEntryName = text.toUtf8(entryName);
  std::filesystem::path path = localPath;
  path /= id;
  path /= newEntryName;
  return path.string();
}

Context::Context(uint16_t port, const std::string& id)
  : stream(makeUrl(port, id))
  , chunk()
{
}
