#include "global.hpp"
#include "unpack.hpp"

#include <iostream>

int
main(int argc, char* argv[])
{
  if (argc != 3 && argc != 4) {
    return 1;
  }

  unpack::application app;
  (void)app;

  try {
    if (argc == 3) {
      unpack::unpack_to(argv[1], argv[2]);
    } else if (argc == 4) {
      auto port = std::stoul(argv[1]);
      unpack::unpack_to(port, argv[2], argv[3]);
    }
  } catch (const std::exception& e) {
    std::cerr << "Error: " << e.what() << std::endl;
    return 1;
  }

  return 0;
}
