CD := cd
MKDIR := mkdir
TOUCH := touch
CMAKE := cmake
NPM := npm
PYTHON := python3
PIP := pip3

VIEWER_ALL_FILES = $(shell find viewer -type d \( -name node_modules -o -name build \) -prune -o -type f -print)
VIEWER_CONF_FILES = viewer/package.json
ENGINE_LOCK_FILE = engine/.lock

.PHONY: debug unpack-release viewer-release engine-release

all: release

release: unpack-release viewer-release engine-release

unpack-release: unpack/build/unpack

unpack/build/unpack: unpack/build unpack/CMakeLists.txt unpack/src/*.cpp unpack/src/*.hpp
	$(CD) unpack/build && $(CMAKE) -DCMAKE_BUILD_TYPE=Release .. && $(MAKE)

unpack/build:
	$(MKDIR) "$@"

viewer-release: viewer/build

viewer/build: viewer/node_modules $(VIEWER_ALL_FILES)
	$(CD) viewer && $(NPM) run build
	$(TOUCH) "$@"

viewer/node_modules: $(VIEWER_CONF_FILES)
	$(CD) viewer && $(NPM) install
	$(RM) -rf 'viewer/build'
	$(TOUCH) "$@"

engine-release: engine-install

engine-install: $(ENGINE_LOCK_FILE)

$(ENGINE_LOCK_FILE): engine/requirements.txt
	$(PIP) install -r engine/requirements.txt
	touch $(ENGINE_LOCK_FILE)

# TODO there is no need to debug unpack for now
debug: unpack-release viewer/node_modules engine-debug

engine-debug: engine-install

test: engine-test viewer-test

engine-test:
	$(CD) engine && $(PYTHON) -m compileall engine
	$(CD) engine && $(PYTHON) -m unittest

viewer-test:
	$(CD) viewer && $(YARN) test
