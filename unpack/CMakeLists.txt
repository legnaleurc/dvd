cmake_minimum_required(VERSION 3.11)
project(unpack)

include(CTest)

find_package(Boost CONFIG REQUIRED locale)
find_package(LibArchive REQUIRED)
find_package(CURL REQUIRED)
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
target_link_libraries(unpack PRIVATE
    Boost::locale
    CURL::libcurl
    LibArchive::LibArchive
    OpenSSL::Crypto)
target_sources(unpack PRIVATE ${SOURCES})

if(BUILD_TESTING)
    set(TEST_SOURCES
        ${SOURCES}
        "tests/helper.cpp"
        "tests/main.cpp"
        "tests/stream_test.cpp"
        "tests/text_test.cpp"
        "tests/unpack_test.cpp")
    list(REMOVE_ITEM TEST_SOURCES "src/main.cpp")

    add_executable(unpack_test)
    target_compile_features(unpack_test PUBLIC cxx_std_20)
    target_compile_options(unpack_test PRIVATE -Wall -Wextra -pedantic)
    target_link_libraries(unpack_test PRIVATE
        Boost::locale
        CURL::libcurl
        LibArchive::LibArchive
        OpenSSL::Crypto)
    target_sources(unpack_test PRIVATE ${TEST_SOURCES})
    add_test(NAME unpack_test COMMAND unpack_test)
endif()
