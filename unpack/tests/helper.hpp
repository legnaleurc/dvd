#ifndef UNPACK_TESTS_HELPER_HPP
#define UNPACK_TESTS_HELPER_HPP

#include <archive.h>

#include <filesystem>
#include <string>
#include <vector>

namespace unpack::test {

class temporary_directory
{
public:
  temporary_directory();
  ~temporary_directory();

  temporary_directory(const temporary_directory&) = delete;
  temporary_directory& operator=(const temporary_directory&) = delete;
  temporary_directory(temporary_directory&&) = delete;
  temporary_directory& operator=(temporary_directory&&) = delete;

  const std::filesystem::path& path() const;

private:
  std::filesystem::path root;
};

struct archive_item
{
  std::string name;
  std::string content;
  // Whether names are given in UTF-8. Without it they are stored as raw bytes.
  // For zip this sets the language encoding flag (bit 11).
  bool utf8;
  // make_archive only: write a symlink or a hardlink instead of a file.
  std::string symlink = {};
  std::string hardlink = {};
};

// A zip with stored (uncompressed) entries, built byte by byte so the test
// controls exactly how names are stored.
std::string
make_zip(const std::vector<archive_item>& items);

// An archive written by libarchive.
std::string
make_archive(int (*set_format)(archive*),
             const std::vector<archive_item>& items);

std::string
encode(const std::string& text, const char* codec);

void
write_file(const std::filesystem::path& path, const std::string& data);

std::string
read_file(const std::filesystem::path& path);

}

#endif
