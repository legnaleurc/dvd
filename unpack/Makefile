CD := cd
RM := rm -rf
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake
CLANG_FORMAT := clang-format

BLD_FILES := CMakeLists.txt
HDR_FILES := src/*.hpp
SRC_FILES := src/*.cpp

.PHONY: release debug clean purge format

release: release/unpack
debug: debug/unpack
clean:
	if [ -d release ]; then $(MAKE) -C release clean; fi
	if [ -d debug ]; then $(MAKE) -C debug clean; fi
purge:
	$(RM) release debug
format:
	$(CLANG_FORMAT) -i $(HDR_FILES) $(SRC_FILES)

release/unpack: release/Makefile $(HDR_FILES) $(SRC_FILES)
	$(MAKE) -C release

release/Makefile: $(BLD_FILES)
	$(MKDIR) -p release
	$(CD) release && $(CMAKE) -DCMAKE_BUILD_TYPE=Release ..

debug/unpack: debug/Makefile $(HDR_FILES) $(SRC_FILES)
	$(MAKE) -C debug

debug/Makefile: $(BLD_FILES)
	$(MKDIR) -p debug
	$(CD) debug && $(CMAKE) -DCMAKE_BUILD_TYPE=Debug ..
