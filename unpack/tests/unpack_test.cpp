#include <boost/test/unit_test.hpp>

#include <archive_entry.h>

#include <memory>
#include <stdexcept>

#include "../src/unpack.hpp"
#include "../src/unpack.hxx"
#include "helper.hpp"

namespace {

using unpack::test::archive_item;
using unpack::test::encode;
using unpack::test::read_file;

using entry_handle = std::unique_ptr<archive_entry, void (*)(archive_entry*)>;

entry_handle
make_entry()
{
  return { archive_entry_new(), archive_entry_free };
}

std::string
pathname_utf8(archive_entry* entry)
{
  auto name = archive_entry_pathname_utf8(entry);
  return name ? name : "(null)";
}

struct entry_fixture
{
  entry_fixture()
    : context("unused", "/out")
  {
  }

  // Raw bytes, as libarchive sets them for names in an undeclared charset.
  std::string update_raw(const std::string& raw_name)
  {
    auto entry = make_entry();
    archive_entry_copy_pathname(entry.get(), raw_name.c_str());
    context.update_entry_path(entry.get());
    return pathname_utf8(entry.get());
  }

  std::string update_utf8(const std::string& name)
  {
    auto entry = make_entry();
    archive_entry_update_pathname_utf8(entry.get(), name.c_str());
    context.update_entry_path(entry.get());
    return pathname_utf8(entry.get());
  }

  unpack::archive_context context;
};

struct unpack_fixture
{
  unpack_fixture()
    : directory()
    , archive_path(directory.path() / "archive")
    , output_path(directory.path() / "output")
  {
    std::filesystem::create_directory(output_path);
  }

  void extract(const std::string& data)
  {
    unpack::test::write_file(archive_path, data);
    unpack::unpack_to(archive_path.string(), output_path.string());
  }

  unpack::test::temporary_directory directory;
  std::filesystem::path archive_path;
  std::filesystem::path output_path;
};

}

BOOST_FIXTURE_TEST_SUITE(entry_path, entry_fixture)

BOOST_AUTO_TEST_CASE(utf8_name)
{
  BOOST_TEST(update_utf8("日本語.txt") == "/out/日本語.txt");
  BOOST_TEST(update_utf8("a/b/c.txt") == "/out/a/b/c.txt");
}

BOOST_AUTO_TEST_CASE(raw_name_is_decoded)
{
  BOOST_TEST(update_raw(encode("表示テスト.txt", "CP932")) ==
             "/out/表示テスト.txt");
}

// Unicode names must not go through the decoder, which may have stuck to a
// legacy codec because of an earlier entry.
BOOST_AUTO_TEST_CASE(utf8_name_after_legacy_name)
{
  BOOST_TEST(update_raw(encode("日本語のファイル", "EUC-JP")) ==
             "/out/日本語のファイル");
  BOOST_TEST(update_utf8("日本語テスト") == "/out/日本語テスト");
}

BOOST_AUTO_TEST_CASE(absolute_name_stays_inside)
{
  BOOST_TEST(update_utf8("/etc/passwd") == "/out/etc/passwd");
}

BOOST_AUTO_TEST_CASE(dot_dot_name_throws)
{
  BOOST_CHECK_THROW(update_utf8("../escape.txt"), std::runtime_error);
  BOOST_CHECK_THROW(update_utf8("a/../../escape.txt"), std::runtime_error);
  BOOST_CHECK_THROW(update_utf8("/../escape.txt"), std::runtime_error);
}

BOOST_AUTO_TEST_CASE(inner_dot_dot_name_is_normalized)
{
  BOOST_TEST(update_utf8("a/b/c/../../d.txt") == "/out/a/d.txt");
  BOOST_TEST(update_utf8("a/./b/../c.txt") == "/out/a/c.txt");
}

BOOST_AUTO_TEST_SUITE_END()

BOOST_FIXTURE_TEST_SUITE(unpack_to, unpack_fixture)

BOOST_AUTO_TEST_CASE(zip_with_utf8_names)
{
  extract(unpack::test::make_zip({
    { "a.txt", "hello", true },
    { "日本語/", "", true },
    { "日本語/テスト.txt", "world", true },
  }));
  BOOST_TEST(read_file(output_path / "a.txt") == "hello");
  BOOST_TEST(read_file(output_path / "日本語" / "テスト.txt") == "world");
}

BOOST_AUTO_TEST_CASE(zip_with_legacy_names)
{
  extract(unpack::test::make_zip({
    { encode("表示/", "CP932"), "", false },
    { encode("表示/テスト①.txt", "CP932"), "hello", false },
  }));
  BOOST_TEST(read_file(output_path / "表示" / "テスト①.txt") == "hello");
}

BOOST_AUTO_TEST_CASE(zip_with_mixed_names)
{
  extract(unpack::test::make_zip({
    { encode("日本語のファイル", "EUC-JP"), "legacy", false },
    { "日本語テスト", "unicode", true },
  }));
  BOOST_TEST(read_file(output_path / "日本語のファイル") == "legacy");
  BOOST_TEST(read_file(output_path / "日本語テスト") == "unicode");
}

BOOST_AUTO_TEST_CASE(empty_entries)
{
  extract(unpack::test::make_zip({
    { "empty.txt", "", true },
  }));
  BOOST_TEST(std::filesystem::is_regular_file(output_path / "empty.txt"));
  BOOST_TEST(std::filesystem::file_size(output_path / "empty.txt") == 0u);
}

BOOST_AUTO_TEST_CASE(tar)
{
  extract(unpack::test::make_archive(archive_write_set_format_pax_restricted,
                                     {
                                       { "a.txt", "hello", true },
                                       { "日本語/テスト.txt", "world", true },
                                     }));
  BOOST_TEST(read_file(output_path / "a.txt") == "hello");
  BOOST_TEST(read_file(output_path / "日本語" / "テスト.txt") == "world");
}

BOOST_AUTO_TEST_CASE(seven_zip)
{
  extract(unpack::test::make_archive(archive_write_set_format_7zip,
                                     {
                                       { "a.txt", "hello", true },
                                       { "日本語/テスト.txt", "world", true },
                                     }));
  BOOST_TEST(read_file(output_path / "a.txt") == "hello");
  BOOST_TEST(read_file(output_path / "日本語" / "テスト.txt") == "world");
}

BOOST_AUTO_TEST_CASE(dot_dot_entry_is_rejected)
{
  BOOST_CHECK_THROW(extract(unpack::test::make_zip({
                      { "../escape.txt", "evil", true },
                    })),
                    std::runtime_error);
  BOOST_TEST(!std::filesystem::exists(directory.path() / "escape.txt"));
}

BOOST_AUTO_TEST_CASE(inner_dot_dot_entry_is_extracted)
{
  extract(unpack::test::make_zip({
    { "a/b/c/../../d.txt", "hello", true },
  }));
  BOOST_TEST(read_file(output_path / "a" / "d.txt") == "hello");
}

BOOST_AUTO_TEST_CASE(absolute_entry_stays_inside)
{
  auto outside = directory.path() / "outside.txt";
  extract(unpack::test::make_zip({
    { outside.string(), "evil", true },
  }));
  BOOST_TEST(!std::filesystem::exists(outside));
  BOOST_TEST(read_file(output_path / outside.relative_path()) == "evil");
}

BOOST_AUTO_TEST_CASE(symlink_entry_is_skipped)
{
  auto outside = directory.path() / "outside";
  std::filesystem::create_directory(outside);
  extract(unpack::test::make_archive(archive_write_set_format_pax_restricted,
                                     {
                                       { "link", "", true, outside.string() },
                                       { "link/escape.txt", "evil", true },
                                     }));
  BOOST_TEST(!std::filesystem::exists(outside / "escape.txt"));
  BOOST_TEST(!std::filesystem::is_symlink(output_path / "link"));
  BOOST_TEST(read_file(output_path / "link" / "escape.txt") == "evil");
}

BOOST_AUTO_TEST_CASE(hardlink_entry_is_skipped)
{
  auto secret = directory.path() / "secret.txt";
  unpack::test::write_file(secret, "secret");
  extract(
    unpack::test::make_archive(archive_write_set_format_pax_restricted,
                               {
                                 { "a.txt", "hello", true },
                                 { "b.txt", "", true, "", "a.txt" },
                                 { "leak.txt", "", true, "", secret.string() },
                               }));
  BOOST_TEST(read_file(output_path / "a.txt") == "hello");
  BOOST_TEST(!std::filesystem::exists(output_path / "b.txt"));
  BOOST_TEST(!std::filesystem::exists(output_path / "leak.txt"));
  BOOST_TEST(std::filesystem::hard_link_count(secret) == 1u);
}

// ustar has no charset declaration, so the link target comes back as raw
// bytes, which must still be detected.
BOOST_AUTO_TEST_CASE(hardlink_entry_with_legacy_target_is_skipped)
{
  auto target = encode("表示.txt", "CP932");
  extract(unpack::test::make_archive(archive_write_set_format_ustar,
                                     {
                                       { target, "hello", false },
                                       { "b.txt", "", false, "", target },
                                     }));
  BOOST_TEST(read_file(output_path / "表示.txt") == "hello");
  BOOST_TEST(!std::filesystem::exists(output_path / "b.txt"));
}

BOOST_AUTO_TEST_CASE(not_an_archive_throws)
{
  BOOST_CHECK_THROW(extract("this is not an archive"), unpack::archive_error);
}

BOOST_AUTO_TEST_CASE(missing_archive_throws)
{
  BOOST_CHECK_THROW(unpack::unpack_to((directory.path() / "missing").string(),
                                      output_path.string()),
                    unpack::archive_error);
}

BOOST_AUTO_TEST_SUITE_END()
