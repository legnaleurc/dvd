CD := cd
RM := rm -rf
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake

BLD_FILES := CMakeLists.txt
HDR_FILES := src/*.hpp
SRC_FILES := src/*.cpp

.PHONY: release debug clean purge

release: release/unpack
debug: debug/unpack
clean:
	if [ -d release ]; then $(MAKE) -C release clean; fi
	if [ -d debug ]; then $(MAKE) -C debug clean; fi
purge:
	$(RM) release debug

release/unpack: release/Makefile
	$(MAKE) -C release

release/Makefile: $(BLD_FILES) $(BLD_FILES) $(BLD_FILES)
	$(MKDIR) -p release
	$(CD) release && $(CMAKE) -DCMAKE_BUILD_TYPE=Release ..

debug/unpack: debug/Makefile
	$(MAKE) -C debug

debug/Makefile: $(BLD_FILES) $(BLD_FILES) $(BLD_FILES)
	$(MKDIR) -p debug
	$(CD) debug && $(CMAKE) -DCMAKE_BUILD_TYPE=Debug ..
