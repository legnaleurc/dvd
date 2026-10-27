#include <boost/test/unit_test.hpp>

#include "../src/text.hpp"
#include "helper.hpp"

using unpack::test::encode;

BOOST_AUTO_TEST_SUITE(text)

BOOST_AUTO_TEST_CASE(utf8_passes_through)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8("plain.txt") == "plain.txt");
  BOOST_TEST(codec.to_utf8("日本語テスト.txt") == "日本語テスト.txt");
}

BOOST_AUTO_TEST_CASE(cp932)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("表示テスト①.txt", "CP932")) ==
             "表示テスト①.txt");
}

// Shift-JIS accepts these bytes too, but maps them to different characters.
BOOST_AUTO_TEST_CASE(cp932_is_preferred_over_shift_jis)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("ファイル名～.txt", "CP932")) ==
             "ファイル名～.txt");
  BOOST_TEST(codec.to_utf8(encode("a~b\\c日本.txt", "CP932")) ==
             "a~b\\c日本.txt");
}

// 表 is 0x95 0x5C in CP932.
BOOST_AUTO_TEST_CASE(cp932_with_backslash_mangled_to_slash)
{
  unpack::text_codec codec;
  auto mangled = encode("表示.txt", "CP932");
  BOOST_TEST_REQUIRE(mangled[1] == '\\');
  mangled[1] = '/';
  BOOST_TEST(codec.to_utf8(mangled) == "表示.txt");
}

BOOST_AUTO_TEST_CASE(euc_jp)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("日本語のファイル", "EUC-JP")) ==
             "日本語のファイル");
}

BOOST_AUTO_TEST_CASE(gbk)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("簡體.txt", "GBK")) == "簡體.txt");
}

// Known limitation: many GBK names are also valid CP932, which is tried first.
// U+E26B comes from the CP932 user-defined area.
BOOST_AUTO_TEST_CASE(gbk_is_taken_by_cp932)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("繁體中文", "GBK")) == "ｷｱ\uE26Bﾖﾐﾎﾄ");
}

// Known limitation: EUC-JP and GB2312 share the same byte grid, and EUC-JP is
// tried first.
BOOST_AUTO_TEST_CASE(gb2312_is_taken_by_euc_jp)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("中文文件名", "GB2312")) == "嶄猟猟周兆");
}

// The codec choice is sticky: once a later codec is needed, earlier ones are
// not tried again for the following names.
BOOST_AUTO_TEST_CASE(codec_choice_is_sticky)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8(encode("日本語のファイル", "EUC-JP")) ==
             "日本語のファイル");
  BOOST_TEST(codec.to_utf8(encode("日本語テスト", "CP932")) == "擔杮岅僥僗僩");
}

BOOST_AUTO_TEST_CASE(undecodable_bytes_are_returned_as_is)
{
  unpack::text_codec codec;
  BOOST_TEST(codec.to_utf8("\xff\xff") == "\xff\xff");
}

BOOST_AUTO_TEST_SUITE_END()
