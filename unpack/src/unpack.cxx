#include "unpack.hxx"

#include <archive_entry.h>

#include <filesystem>

#include "format.hpp"

int
unpack::archive_context::open(struct archive* handle, void* context)
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    ctx->stream.open();
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to open stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

int
unpack::archive_context::close(struct archive* handle, void* context)
{
  auto ctx = static_cast<archive_context*>(context);
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
unpack::archive_context::read(struct archive* handle,
                              void* context,
                              const void** buffer)
{
  auto ctx = static_cast<archive_context*>(context);
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
unpack::archive_context::seek(struct archive* handle,
                              void* context,
                              la_int64_t offset,
                              int whence)
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    return ctx->stream.seek(offset, whence);
  } catch (std::exception& e) {
    archive_set_error(handle, EIO, "failed to seek stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

unpack::archive_context::archive_context(std::uint16_t port,
                                         const std::string& id,
                                         const std::string& local_path)
  : id(id)
  , local_path(local_path)
  , decoder()
  , stream(port, id)
  , chunk()
{
}

unpack::archive_context::archive_context(const std::string& archive_path,
                                         const std::string& local_path)
  : id()
  , local_path(local_path)
  , decoder()
  , stream(archive_path)
  , chunk()
{
  auto path = std::filesystem::path(archive_path);
  if (path.has_filename()) {
    if (path.has_extension()) {
      this->id = path.stem().string();
    } else {
      this->id = path.filename().string();
    }
  } else {
    throw std::runtime_error("archive path does not have a filename");
  }
}

void
unpack::archive_context::update_entry_path(struct archive_entry* entry)
{
  auto entry_name = archive_entry_pathname(entry);
  if (!entry_name) {
    throw std::runtime_error("entry name is null");
  }

  auto entry_path = this->to_output_path(entry_name);
  int rv = archive_entry_update_pathname_utf8(entry, entry_path.c_str());
  if (!rv) {
    throw std::runtime_error(("utf-8 failure: %1%"_f % entry_path).str());
  }
}

std::string
unpack::archive_context::to_output_path(const std::string& entry_name)
{
  auto new_entry_name = this->decoder.to_utf8(entry_name);
  std::filesystem::path path = local_path;
  path /= this->id;
  path /= new_entry_name;
  return path.string();
}

namespace {
std::string
format_archive_error(unpack::archive_handle handle, const std::string& name)
{
  auto msg = archive_error_string(handle.get());
  if (!msg) {
    msg = "(empty error message)";
  }
  return name + ": " + msg;
}
}

unpack::archive_error::archive_error(archive_handle handle,
                                     const std::string& name) noexcept
  : std::runtime_error(format_archive_error(handle, name))
{
}
