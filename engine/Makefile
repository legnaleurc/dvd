RM := rm -rf
UV := uv
PYTHON := $(UV) run -- python3
RUFF := $(UV) run -- ruff

PKG_FILES := pyproject.toml
PKG_LOCK := uv.lock
ENV_DIR := .venv
RELEASE_TAG := $(ENV_DIR)/DVD_RELEASE
DEBUG_TAG := $(ENV_DIR)/DVD_DEBUG
ENV_TAG := $(ENV_DIR)/DVD_ENV

check_env_release = \
	@if [ -f $(DEBUG_TAG) ] ; then \
		echo "Debug environment detected, please run 'make purge' first."; \
		exit 1; \
	fi

check_env_debug = \
	@if [ -f $(RELEASE_TAG) ] ; then \
		echo "Release environment detected, please run 'make purge' first."; \
		exit 1; \
	fi

.PHONY: clean purge test

release: $(RELEASE_TAG)
debug: $(DEBUG_TAG)
clean:
	$(RM) .coverage
purge: clean
	$(RM) $(ENV_DIR)
test: $(ENV_TAG)
	$(PYTHON) -m compileall engine
	$(PYTHON) -m unittest

$(RELEASE_TAG): $(PKG_LOCK)
	$(call check_env_release)
	$(UV) sync --no-dev
	touch "$@" "$(ENV_TAG)"

$(DEBUG_TAG): $(PKG_LOCK)
	$(call check_env_debug)
	$(UV) sync
	touch "$@" "$(ENV_TAG)"

$(PKG_LOCK): $(PKG_FILES)
	$(UV) lock
	touch "$@"

auth: $(ENV_TAG)
	$(PYTHON) -m wcpan.drive.cli auth

sync: $(ENV_TAG)
	$(PYTHON) -m wcpan.drive.cli sync

lint: debug
	$(RUFF) check engine tests
	$(RUFF) format --check engine tests

format: debug
	$(RUFF) check --fix engine tests
	$(RUFF) format engine tests
