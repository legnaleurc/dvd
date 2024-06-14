cmake_minimum_required(VERSION 3.11)
project(unpack)

find_package(Boost REQUIRED filesystem locale)
find_package(LibArchive REQUIRED)
find_package(CURL REQUIRED)
find_package(OpenSSL REQUIRED)

set(SOURCES
    "src/exception.cpp"
    "src/global.cpp"
    "src/unpack.cpp"
    "src/stream.cpp"
    "src/stream.cxx"
    "src/text.cpp"
    "src/main.cpp")

add_executable(unpack)
target_compile_features(unpack PUBLIC cxx_std_11)
target_compile_options(unpack PRIVATE -Wall -Wextra -pedantic)
target_link_libraries(unpack PRIVATE
    Boost::filesystem
    Boost::locale
    CURL::libcurl
    LibArchive::LibArchive
    OpenSSL::Crypto)
target_sources(unpack PRIVATE ${SOURCES})
