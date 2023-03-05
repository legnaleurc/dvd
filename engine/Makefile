RM := rm -rf
POETRY := poetry
PYTHON := $(POETRY) run -- python3
BLACK := $(POETRY) run -- black

PKG_FILES := pyproject.toml poetry.lock
PKG_DIR := .venv
BLD_LOCK := $(PKG_DIR)/pyvenv.cfg

.PHONY: release debug clean purge test setup

release: setup
debug: setup
clean:
	$(RM) .coverage
purge: clean
	$(RM) $(PKG_DIR)
test: setup
	$(PYTHON) -m compileall engine
	$(PYTHON) -m unittest

setup: $(BLD_LOCK)

$(BLD_LOCK): $(PKG_FILES)
	$(POETRY) install
	touch $@

auth: setup
	$(PYTHON) -m wcpan.drive.cli auth

sync: setup
	$(PYTHON) -m wcpan.drive.cli sync

lint: setup
	$(BLACK) --check engine tests

format: setup
	$(BLACK) engine tests
