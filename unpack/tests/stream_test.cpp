#include <boost/test/unit_test.hpp>

#include <cstdio>
#include <stdexcept>

#include "../src/stream.hpp"
#include "helper.hpp"

namespace {

constexpr std::size_t CHUNK_SIZE = 64 * 1024;

std::string
make_content(std::size_t size)
{
  std::string content(size, '\0');
  for (std::size_t i = 0; i < size; ++i) {
    content[i] = static_cast<char>(i % 251);
  }
  return content;
}

std::string
to_string(const unpack::binary_chunk& chunk)
{
  return { chunk.begin(), chunk.end() };
}

std::string
read_all(unpack::input_stream& stream)
{
  std::string data;
  for (;;) {
    auto chunk = stream.read();
    if (chunk.empty()) {
      break;
    }
    data += to_string(chunk);
  }
  return data;
}

struct file_fixture
{
  file_fixture()
    : directory()
    , content(make_content(CHUNK_SIZE * 2 + 10))
    , file_path(directory.path() / "data.bin")
  {
    unpack::test::write_file(file_path, content);
  }

  unpack::test::temporary_directory directory;
  std::string content;
  std::filesystem::path file_path;
};

}

BOOST_FIXTURE_TEST_SUITE(file_stream, file_fixture)

BOOST_AUTO_TEST_CASE(reads_in_chunks_until_eof)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_TEST(stream.read().size() == CHUNK_SIZE);
  BOOST_TEST(stream.read().size() == CHUNK_SIZE);
  BOOST_TEST(stream.read().size() == 10u);
  BOOST_TEST(stream.read().empty());
  BOOST_TEST(stream.read().empty());
}

BOOST_AUTO_TEST_CASE(reads_whole_content)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_TEST(read_all(stream) == content);
}

BOOST_AUTO_TEST_CASE(empty_file)
{
  auto empty_path = directory.path() / "empty.bin";
  unpack::test::write_file(empty_path, "");
  unpack::input_stream stream(empty_path.string());
  stream.open();
  BOOST_TEST(stream.read().empty());
}

BOOST_AUTO_TEST_CASE(seek_set)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_TEST(stream.seek(100, SEEK_SET) == 100);
  BOOST_TEST(read_all(stream) == content.substr(100));
}

BOOST_AUTO_TEST_CASE(seek_cur)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  stream.read();
  BOOST_TEST(stream.seek(-10, SEEK_CUR) == CHUNK_SIZE - 10);
  BOOST_TEST(read_all(stream) == content.substr(CHUNK_SIZE - 10));
}

BOOST_AUTO_TEST_CASE(seek_end)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_TEST(stream.seek(-4, SEEK_END) == content.size() - 4);
  BOOST_TEST(read_all(stream) == content.substr(content.size() - 4));
}

BOOST_AUTO_TEST_CASE(seek_to_end_then_read)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_TEST(stream.seek(0, SEEK_END) == content.size());
  BOOST_TEST(stream.read().empty());
}

// libarchive seeks back after it has read to the end, e.g. for zip.
BOOST_AUTO_TEST_CASE(seek_after_eof)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  read_all(stream);
  BOOST_TEST(stream.seek(0, SEEK_SET) == 0);
  BOOST_TEST(read_all(stream) == content);
}

BOOST_AUTO_TEST_CASE(reopen_starts_over)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  stream.read();
  stream.close();
  stream.open();
  BOOST_TEST(read_all(stream) == content);
}

BOOST_AUTO_TEST_CASE(unknown_seek_direction_throws)
{
  unpack::input_stream stream(file_path.string());
  stream.open();
  BOOST_CHECK_THROW(stream.seek(0, 42), std::invalid_argument);
}

BOOST_AUTO_TEST_CASE(use_before_open_throws)
{
  unpack::input_stream stream(file_path.string());
  BOOST_CHECK_THROW(stream.read(), std::runtime_error);
  BOOST_CHECK_THROW(stream.seek(0, SEEK_SET), std::runtime_error);
}

BOOST_AUTO_TEST_CASE(missing_file_throws)
{
  unpack::input_stream stream((directory.path() / "missing").string());
  BOOST_CHECK_THROW(stream.open(), std::runtime_error);
}

BOOST_AUTO_TEST_SUITE_END()
