#include "unpack.hxx"

#include <archive_entry.h>

#include <filesystem>
#include <sstream>

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

namespace {
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
}

unpack::archive_context::archive_context(uint16_t port,
                                         const std::string& id,
                                         const std::string& local_path)
  : id(id)
  , local_path(local_path)
  , decoder()
  , stream(make_url(port, id))
  , chunk()
{
}

void
unpack::archive_context::update_entry_path(struct archive_entry* entry)
{
  auto entry_name = archive_entry_pathname(entry);
  if (!entry_name) {
    throw archive_entry_error("archive_entry_pathname", "nullptr");
  }

  auto entry_path = this->to_output_path(entry_name);
  int rv = archive_entry_update_pathname_utf8(entry, entry_path.c_str());
  if (!rv) {
    throw archive_entry_error("archive_entry_update_pathname_utf8", entry_path);
  }
}

std::string
unpack::archive_context::to_output_path(const std::string& entry_name)
{
  auto new_entry_name = this->decoder.to_utf8(entry_name);
  std::filesystem::path path = local_path;
  path /= id;
  path /= new_entry_name;
  return path.string();
}

namespace {
std::string
format_archive_error(unpack::archive_handle handle, const std::string& name)
{
  std::ostringstream sout;
  auto msg = archive_error_string(handle.get());
  if (!msg) {
    msg = "(empty error message)";
  }
  sout << name << ": " << msg;
  return sout.str();
}
}

unpack::archive_error::archive_error(archive_handle handle,
                                     const std::string& name) noexcept
  : std::runtime_error(format_archive_error(handle, name))
{
}

namespace {
std::string
format_entry_error(const std::string& name, const std::string& detail)
{
  std::ostringstream sout;
  sout << name << ": " << detail;
  return sout.str();
}
}

unpack::archive_entry_error::archive_entry_error(
  const std::string& name,
  const std::string& detail) noexcept
  : std::runtime_error(format_entry_error(name, detail))
{
}
