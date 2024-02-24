cmake_minimum_required(VERSION 3.11)
project(unpack)

find_package(LibArchive REQUIRED)
find_package(cpprestsdk REQUIRED)
find_package(Boost REQUIRED filesystem locale)

set(SOURCES
    "src/exception.cpp"
    "src/unpack.cpp"
    "src/text.cpp"
    "src/main.cpp")

add_executable(unpack)
target_compile_features(unpack PUBLIC cxx_std_11)
target_compile_options(unpack PRIVATE -Wall -Wextra -pedantic)
target_link_libraries(unpack PRIVATE
    LibArchive::LibArchive
    cpprestsdk::cpprest
    Boost::filesystem
    Boost::locale
    OpenSSL::Crypto)
target_sources(unpack PRIVATE ${SOURCES})
