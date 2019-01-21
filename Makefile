CD := cd
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake
YARN := yarn

VIEWER_ALL_FILES = $(shell find viewer -type d \( -name node_modules -o -name dist \) -prune -o -type f -print)
VIEWER_CONF_FILES = viewer/package.json

.PHONY: debug unpack-release viewer-release

all: release

release: unpack-release viewer-release

unpack-release: unpack/build/unpack

unpack/build/unpack: unpack/build unpack/CMakeLists.txt unpack/src/*.cpp unpack/src/*.hpp
	$(CD) unpack/build && $(CMAKE) -DCMAKE_BUILD_TYPE=Release .. && $(MAKE)

unpack/build:
	$(MKDIR) "$@"

viewer-release: viewer/dist

viewer/dist: viewer/node_modules $(VIEWER_ALL_FILES)
	$(CD) viewer && $(YARN) build
	$(TOUCH) "$@"

viewer/node_modules: $(VIEWER_CONF_FILES)
	$(CD) viewer && $(YARN) install
	$(RM) -rf 'viewer/dist'
	$(TOUCH) "$@"

# TODO there is no need to debug unpack for now
debug: unpack-release viewer/node_modules
