#include "global.hpp"
#include "unpack.hpp"

int
main(int argc, char* argv[])
{
  if (argc != 4) {
    return 1;
  }

  unpack::application app;
  (void)app;

  auto port = std::stoul(argv[1]);
  unpack::unpack_to(port, argv[2], argv[3]);

  return 0;
}
