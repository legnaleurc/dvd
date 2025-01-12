RM := rm -rf
POETRY := poetry
PYTHON := $(POETRY) run -- python3
BLACK := $(POETRY) run -- black

PKG_FILES := pyproject.toml
PKG_LOCK := poetry.lock
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
	$(POETRY) install --no-root --only=main
	touch "$@" "$(ENV_TAG)"

$(DEBUG_TAG): $(PKG_LOCK)
	$(call check_env_debug)
	$(POETRY) install
	touch "$@" "$(ENV_TAG)"

$(PKG_LOCK): $(PKG_FILES)
	$(POETRY) lock --no-update
	touch "$@"

auth: $(ENV_TAG)
	$(PYTHON) -m wcpan.drive.cli auth

sync: $(ENV_TAG)
	$(PYTHON) -m wcpan.drive.cli sync

lint: debug
	$(BLACK) --check engine tests

format: debug
	$(BLACK) engine tests
