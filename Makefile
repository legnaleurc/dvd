CD := cd
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake
NPM := npm

VIEWER_ALL_FILES = $(shell find viewer -type d \( -name node_modules -o -name build \) -prune -o -type f -print)
VIEWER_PKG_FILES = viewer/package.json viewer/package-lock.json

all: release

release: unpack-release viewer-release engine-release

# TODO there is no need to debug unpack for now
debug: unpack-release viewer/node_modules engine-debug

unpack-release: unpack/build/unpack

unpack/build/unpack: unpack/build unpack/CMakeLists.txt unpack/src/*.cpp unpack/src/*.hpp
	$(CD) unpack/build && $(CMAKE) -DCMAKE_BUILD_TYPE=Release .. && $(MAKE)

unpack/build:
	$(MKDIR) "$@"

viewer-release: viewer/build

viewer/build: viewer/node_modules $(VIEWER_ALL_FILES)
	$(CD) viewer && $(NPM) run build
	$(TOUCH) "$@"

viewer/node_modules: $(VIEWER_PKG_FILES)
	$(CD) viewer && $(NPM) install
	$(RM) -rf 'viewer/build'
	$(TOUCH) "$@"

engine-release:
	$(MAKE) -C engine release

engine-debug:
	$(MAKE) -C engine debug

test: engine-test viewer-test

engine-test:
	$(MAKE) -C engine test

viewer-test:
	$(CD) viewer && $(NPM) test
