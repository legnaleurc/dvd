#ifndef STREAM_HPP
#define STREAM_HPP

#include <memory>
#include <string>
#include <vector>

class Stream
{
public:
  explicit Stream(const std::string& url);

  Stream(const Stream&) = delete;
  Stream& operator=(const Stream&) = delete;

  void open();
  void close();
  std::vector<uint8_t> read();
  int64_t seek(int64_t offset, int whence);

private:
  class Private;
  std::shared_ptr<Private> self;
};

#endif
