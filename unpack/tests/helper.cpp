#include "helper.hpp"

#include <archive_entry.h>
#include <boost/locale.hpp>
#include <unistd.h>

#include <cstdint>
#include <fstream>
#include <iterator>
#include <memory>
#include <stdexcept>

namespace {

void
put16(std::string& out, std::uint16_t value)
{
  out.push_back(static_cast<char>(value & 0xFF));
  out.push_back(static_cast<char>(value >> 8));
}

void
put32(std::string& out, std::uint32_t value)
{
  put16(out, static_cast<std::uint16_t>(value & 0xFFFF));
  put16(out, static_cast<std::uint16_t>(value >> 16));
}

std::uint32_t
crc32(const std::string& data)
{
  std::uint32_t crc = 0xFFFFFFFF;
  for (unsigned char c : data) {
    crc ^= c;
    for (int i = 0; i < 8; ++i) {
      crc = (crc >> 1) ^ (0xEDB88320 & (0 - (crc & 1)));
    }
  }
  return ~crc;
}

la_ssize_t
append_to_string(archive*, void* context, const void* buffer, size_t length)
{
  auto out = static_cast<std::string*>(context);
  out->append(static_cast<const char*>(buffer), length);
  return static_cast<la_ssize_t>(length);
}

}

unpack::test::temporary_directory::temporary_directory()
  : root()
{
  auto pattern =
    (std::filesystem::temp_directory_path() / "unpack_test.XXXXXX").string();
  if (!mkdtemp(pattern.data())) {
    throw std::runtime_error("mkdtemp");
  }
  this->root = pattern;
}

unpack::test::temporary_directory::~temporary_directory()
{
  std::error_code ec;
  std::filesystem::remove_all(this->root, ec);
}

const std::filesystem::path&
unpack::test::temporary_directory::path() const
{
  return this->root;
}

std::string
unpack::test::make_zip(const std::vector<archive_item>& items)
{
  constexpr std::uint16_t VERSION = 20;
  constexpr std::uint16_t FLAG_UTF8 = 0x0800;
  constexpr std::uint16_t METHOD_STORE = 0;
  // 1980-01-01 00:00:00 in MS-DOS format.
  constexpr std::uint16_t TIME = 0;
  constexpr std::uint16_t DATE = (1 << 5) | 1;

  std::string body;
  std::string directory;
  for (const auto& item : items) {
    auto offset = static_cast<std::uint32_t>(body.size());
    std::uint16_t flags = item.utf8 ? FLAG_UTF8 : 0;
    auto crc = crc32(item.content);
    auto size = static_cast<std::uint32_t>(item.content.size());
    auto name_size = static_cast<std::uint16_t>(item.name.size());

    // local file header
    put32(body, 0x04034B50);
    put16(body, VERSION);
    put16(body, flags);
    put16(body, METHOD_STORE);
    put16(body, TIME);
    put16(body, DATE);
    put32(body, crc);
    put32(body, size);
    put32(body, size);
    put16(body, name_size);
    put16(body, 0);
    body += item.name;
    body += item.content;

    // central directory file header
    put32(directory, 0x02014B50);
    put16(directory, VERSION);
    put16(directory, VERSION);
    put16(directory, flags);
    put16(directory, METHOD_STORE);
    put16(directory, TIME);
    put16(directory, DATE);
    put32(directory, crc);
    put32(directory, size);
    put32(directory, size);
    put16(directory, name_size);
    put16(directory, 0);
    put16(directory, 0);
    put16(directory, 0);
    put16(directory, 0);
    put32(directory, 0);
    put32(directory, offset);
    directory += item.name;
  }

  auto count = static_cast<std::uint16_t>(items.size());
  std::string end;
  put32(end, 0x06054B50);
  put16(end, 0);
  put16(end, 0);
  put16(end, count);
  put16(end, count);
  put32(end, static_cast<std::uint32_t>(directory.size()));
  put32(end, static_cast<std::uint32_t>(body.size()));
  put16(end, 0);

  return body + directory + end;
}

std::string
unpack::test::make_archive(int (*set_format)(archive*),
                           const std::vector<archive_item>& items)
{
  std::string out;
  std::unique_ptr<archive, int (*)(archive*)> writer{ archive_write_new(),
                                                      archive_write_free };
  if (set_format(writer.get()) != ARCHIVE_OK) {
    throw std::runtime_error(archive_error_string(writer.get()));
  }
  if (archive_write_open(
        writer.get(), &out, nullptr, append_to_string, nullptr) != ARCHIVE_OK) {
    throw std::runtime_error(archive_error_string(writer.get()));
  }

  for (const auto& item : items) {
    std::unique_ptr<archive_entry, void (*)(archive_entry*)> entry{
      archive_entry_new(), archive_entry_free
    };
    if (item.utf8) {
      archive_entry_set_pathname_utf8(entry.get(), item.name.c_str());
    } else {
      archive_entry_copy_pathname(entry.get(), item.name.c_str());
    }
    archive_entry_set_filetype(entry.get(), AE_IFREG);
    archive_entry_set_perm(entry.get(), 0644);
    archive_entry_set_size(entry.get(), item.content.size());
    if (!item.symlink.empty()) {
      archive_entry_set_filetype(entry.get(), AE_IFLNK);
      if (item.utf8) {
        archive_entry_set_symlink_utf8(entry.get(), item.symlink.c_str());
      } else {
        archive_entry_copy_symlink(entry.get(), item.symlink.c_str());
      }
      archive_entry_set_size(entry.get(), 0);
    }
    if (!item.hardlink.empty()) {
      if (item.utf8) {
        archive_entry_set_hardlink_utf8(entry.get(), item.hardlink.c_str());
      } else {
        archive_entry_copy_hardlink(entry.get(), item.hardlink.c_str());
      }
      archive_entry_set_size(entry.get(), 0);
    }
    if (archive_write_header(writer.get(), entry.get()) != ARCHIVE_OK) {
      throw std::runtime_error(archive_error_string(writer.get()));
    }
    if (archive_write_data(
          writer.get(), item.content.data(), item.content.size()) < 0) {
      throw std::runtime_error(archive_error_string(writer.get()));
    }
  }

  if (archive_write_close(writer.get()) != ARCHIVE_OK) {
    throw std::runtime_error(archive_error_string(writer.get()));
  }
  return out;
}

std::string
unpack::test::encode(const std::string& text, const char* codec)
{
  return boost::locale::conv::from_utf<char>(
    text, codec, boost::locale::conv::stop);
}

void
unpack::test::write_file(const std::filesystem::path& path,
                         const std::string& data)
{
  std::ofstream file(path, std::ios::binary);
  file.write(data.data(), static_cast<std::streamsize>(data.size()));
  if (!file) {
    throw std::runtime_error("failed to write file: " + path.string());
  }
}

std::string
unpack::test::read_file(const std::filesystem::path& path)
{
  std::ifstream file(path, std::ios::binary);
  if (!file) {
    throw std::runtime_error("failed to read file: " + path.string());
  }
  return { std::istreambuf_iterator<char>(file),
           std::istreambuf_iterator<char>() };
}
