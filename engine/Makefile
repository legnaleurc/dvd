RM := rm -rf
POETRY := poetry
PYTHON := $(POETRY) run -- python3
BLACK := $(POETRY) run -- black

PKG_FILES := pyproject.toml
PKG_LOCK := poetry.lock
ENV_DIR := .venv
ENV_LOCK := $(ENV_DIR)/pyvenv.cfg

.PHONY: release debug clean purge test setup

release: setup
debug: setup
clean:
	$(RM) .coverage
purge: clean
	$(RM) $(ENV_DIR)
test: setup
	$(PYTHON) -m compileall engine
	$(PYTHON) -m unittest

setup: $(ENV_LOCK)

$(ENV_LOCK): $(PKG_LOCK)
	$(POETRY) install
	touch $@

$(PKG_LOCK): $(PKG_FILES)
	$(POETRY) lock
	touch $@

auth: setup
	$(PYTHON) -m wcpan.drive.cli auth

sync: setup
	$(PYTHON) -m wcpan.drive.cli sync

lint: setup
	$(BLACK) --check engine tests

format: setup
	$(BLACK) engine tests
