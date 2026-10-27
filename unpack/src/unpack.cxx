#include "unpack.hxx"

#include <archive_entry.h>

#include <filesystem>
#include <format>

int
unpack::archive_context::open(archive* handle, void* context) noexcept
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    ctx->stream.open();
  } catch (const std::exception& e) {
    archive_set_error(handle, EIO, "failed to open stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

int
unpack::archive_context::close(archive* handle, void* context) noexcept
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    ctx->chunk.clear();
    ctx->stream.close();
  } catch (const std::exception& e) {
    archive_set_error(handle, EIO, "failed to close stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
  return ARCHIVE_OK;
}

la_ssize_t
unpack::archive_context::read(archive* handle,
                              void* context,
                              const void** buffer) noexcept
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    ctx->chunk = ctx->stream.read();
    *buffer = ctx->chunk.data();
    return ctx->chunk.size();
  } catch (const std::exception& e) {
    archive_set_error(handle, EIO, "failed to read stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

la_int64_t
unpack::archive_context::seek(archive* handle,
                              void* context,
                              la_int64_t offset,
                              int whence) noexcept
{
  auto ctx = static_cast<archive_context*>(context);
  try {
    return ctx->stream.seek(offset, whence);
  } catch (const std::exception& e) {
    archive_set_error(handle, EIO, "failed to seek stream: %s", e.what());
    return ARCHIVE_FATAL;
  }
}

unpack::archive_context::archive_context(const std::string& archive_uri,
                                         const std::string& local_path)
  : local_path(local_path)
  , decoder()
  , stream(archive_uri)
  , chunk()
{
}

void
unpack::archive_context::update_entry_path(archive_entry* entry)
{
  auto entry_name = this->get_entry_name(entry);
  auto entry_path = this->to_output_path(entry_name);
  int rv = archive_entry_update_pathname_utf8(entry, entry_path.c_str());
  if (!rv) {
    throw std::runtime_error(std::format("utf-8 failure: {}", entry_path));
  }
}

std::string
unpack::archive_context::get_entry_name(archive_entry* entry)
{
  // Names declared as Unicode (or already valid UTF-8) are returned as-is,
  // so they never go through the decoder, whose codec choice is sticky
  // across entries.
  auto utf8_name = archive_entry_pathname_utf8(entry);
  if (utf8_name) {
    return utf8_name;
  }

  // Otherwise these are raw bytes in an undeclared charset, guess it.
  auto raw_name = archive_entry_pathname(entry);
  if (!raw_name) {
    throw std::runtime_error("entry name is null");
  }
  return this->decoder.to_utf8(raw_name);
}

std::string
unpack::archive_context::to_output_path(const std::string& entry_name)
{
  std::filesystem::path path = this->local_path;
  path /= entry_name;
  return path.string();
}

namespace {
std::string
format_archive_error(archive* handle, const std::string& name)
{
  auto msg = archive_error_string(handle);
  if (!msg) {
    msg = "(empty error message)";
  }
  return name + ": " + msg;
}
}

unpack::archive_error::archive_error(archive* handle,
                                     const std::string& name) noexcept
  : std::runtime_error(format_archive_error(handle, name))
{
}
