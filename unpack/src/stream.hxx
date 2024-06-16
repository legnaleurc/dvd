#ifndef STREAM_HXX
#define STREAM_HXX

#include "stream.hpp"

#include <deque>
#include <vector>

#include <curl/curl.h>

using EasyHandle = std::shared_ptr<CURL>;
using MultiHandle = std::shared_ptr<CURLM>;

class CurlGlobal
{
public:
  CurlGlobal();
  ~CurlGlobal();
  CurlGlobal(const CurlGlobal&) = delete;
  CurlGlobal& operator=(const CurlGlobal&) = delete;
  CurlGlobal(CurlGlobal&&) = delete;
  CurlGlobal& operator=(CurlGlobal&&) = delete;
};

class CurlEasy
{
public:
  CurlEasy(MultiHandle multi, EasyHandle easy);
  ~CurlEasy();

  void read();

  long readUntilStatusCode();
  int64_t readUntilContentLength();

private:
  MultiHandle multi;
  EasyHandle easy;

public:
  long statusCode;
  int64_t contentLength;
};

class Stream::Private
{
public:
  static size_t writeCallback(char* ptr,
                              size_t size,
                              size_t nmemb,
                              void* userdata);

  Private(const std::string& url);

  Private(const Private&) = delete;
  Private& operator=(const Private&) = delete;
  Private(Private&&) = delete;
  Private& operator=(Private&&) = delete;

  void open(bool range);
  void close();
  std::vector<uint8_t> read();
  int64_t seek(int64_t offset, int whence);

  bool isLengthValid() const;
  bool isRangeValid() const;

  CurlGlobal global;
  MultiHandle multi;
  std::string url;
  std::shared_ptr<CurlEasy> easy;
  int64_t offset;
  int64_t length;
  std::deque<std::vector<uint8_t>> blocks;
};

#endif
