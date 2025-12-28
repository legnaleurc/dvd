cmake_minimum_required(VERSION 3.11)
project(unpack)

find_package(Boost CONFIG REQUIRED locale url)
find_package(LibArchive REQUIRED)

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
target_link_libraries(unpack PRIVATE
    Boost::locale
    Boost::url
    LibArchive::LibArchive)
target_sources(unpack PRIVATE ${SOURCES})
