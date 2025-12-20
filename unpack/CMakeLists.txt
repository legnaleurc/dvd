cmake_minimum_required(VERSION 3.11)
project(unpack)

find_package(Boost CONFIG REQUIRED locale)
find_package(LibArchive REQUIRED)
find_package(OpenSSL REQUIRED)

set(SOURCES
    "src/global.cpp"
    "src/stream.cpp"
    "src/stream.cxx"
    "src/stream_file.cxx"
    "src/stream_http.cxx"
    "src/text.cpp"
    "src/unpack.cpp"
    "src/unpack.cxx"
    "src/main.cpp")

add_executable(unpack)
target_compile_features(unpack PUBLIC cxx_std_20)
target_compile_options(unpack PRIVATE -Wall -Wextra -pedantic)

# Enable experimental library features for Clang (needed for std::jthread on macOS)
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(unpack PRIVATE -fexperimental-library)
    target_link_options(unpack PRIVATE -fexperimental-library)
endif()
target_link_libraries(unpack PRIVATE
    Boost::locale
    LibArchive::LibArchive
    OpenSSL::Crypto
    OpenSSL::SSL)
target_sources(unpack PRIVATE ${SOURCES})
