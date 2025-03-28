RM := rm -rf
NPM := npm

SRC_FILES := $(shell find src static -type f -print)
CFG_FILES := vite.config.ts tsconfig.json svelte.config.js
PKG_FILES := package.json package-lock.json
OBJ_FILES := .svelte-kit
ENV_DIR := node_modules
ENV_LOCK := $(ENV_DIR)/.package-lock.json
BLD_DIR := build
BLD_LOCK := $(BLD_DIR)/index.html

.PHONY: release debug clean purge test build setup

release: build
debug: setup
clean:
	$(RM) $(OBJ_FILES) $(BLD_DIR)
purge: clean
	$(RM) $(ENV_DIR)
test: setup
	npm run lint
	npm run check
	npm test -- --run

build: $(BLD_LOCK)

$(BLD_LOCK): $(ENV_LOCK) $(SRC_FILES) $(CFG_FILES)
	$(NPM) run build

setup: $(ENV_LOCK)

$(ENV_LOCK): $(PKG_FILES)
	$(NPM) install
	$(RM) $(OBJ_FILES) $(BLD_DIR)
