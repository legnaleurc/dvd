CD := cd
RM := rm -rf
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake
CLANG_FORMAT := clang-format

BLD_FILES := CMakeLists.txt
HDR_FILES := src/*.hpp src/*.hxx
SRC_FILES := src/*.cpp src/*.cxx
TST_FILES := tests/*.hpp tests/*.cpp

.PHONY: release debug test clean purge format

release: release/unpack
debug: debug/unpack
test: debug/Makefile $(HDR_FILES) $(SRC_FILES) $(TST_FILES)
	$(MAKE) -C debug
	$(CD) debug && ctest --output-on-failure
clean:
	if [ -d release ]; then $(MAKE) -C release clean; fi
	if [ -d debug ]; then $(MAKE) -C debug clean; fi
purge:
	$(RM) release debug
format:
	$(CLANG_FORMAT) -i $(HDR_FILES) $(SRC_FILES) $(TST_FILES)

release/unpack: release/Makefile $(HDR_FILES) $(SRC_FILES)
	$(MAKE) -C release

release/Makefile: $(BLD_FILES)
	$(MKDIR) -p release
	$(CD) release && $(CMAKE) -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF ..

debug/unpack: debug/Makefile $(HDR_FILES) $(SRC_FILES)
	$(MAKE) -C debug

debug/Makefile: $(BLD_FILES)
	$(MKDIR) -p debug
	$(CD) debug && $(CMAKE) -DCMAKE_BUILD_TYPE=Debug ..
