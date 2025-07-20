#include "global.hpp"
#include "unpack.hpp"

#include <iostream>

int
main(int argc, char* argv[])
{
  if (argc != 3) {
    return 1;
  }

  unpack::application app;
  (void)app;

  try {
    unpack::unpack_to(argv[1], argv[2]);
  } catch (const std::exception& e) {
    std::cerr << "Error: " << e.what() << std::endl;
    return 1;
  }

  return 0;
}
