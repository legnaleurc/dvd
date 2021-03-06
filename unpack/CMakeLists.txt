cmake_minimum_required(VERSION 3.11)
project(unpack)

find_package(LibArchive REQUIRED)
find_package(cpprestsdk REQUIRED)
find_package(Boost REQUIRED filesystem chrono locale)

set(SOURCES
    "src/exception.cpp"
    "src/unpack.cpp"
    "src/text.cpp"
    "src/main.cpp")

add_executable(unpack)
target_compile_features(unpack PUBLIC cxx_std_11)
target_include_directories(unpack PRIVATE ${LibArchive_INCLUDE_DIRS})
target_link_libraries(unpack PRIVATE
    ${LibArchive_LIBRARIES}
    cpprestsdk::cpprest
    Boost::filesystem
    Boost::chrono
    Boost::locale)
target_sources(unpack PRIVATE ${SOURCES})
