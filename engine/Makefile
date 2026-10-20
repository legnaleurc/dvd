RM := rm -rf
UV := uv
PYTHON := $(UV) run -- python3
RUFF := $(UV) run -- ruff

PKG_FILES := pyproject.toml
PKG_LOCK := uv.lock
ENV_DIR := .venv
ENV_LOCK := $(ENV_DIR)/pyvenv.cfg

.PHONY: setup clean purge test

setup: $(ENV_LOCK)
clean:
	$(RM) .coverage
purge: clean
	$(RM) $(ENV_DIR)
test: setup
	$(PYTHON) -m compileall engine
	$(PYTHON) -m unittest

$(ENV_LOCK): $(PKG_LOCK)
	$(UV) sync
	touch "$@"

$(PKG_LOCK): $(PKG_FILES)
	$(UV) lock
	touch "$@"

auth: setup
	$(PYTHON) -m wcpan.drive.cli auth

sync: setup
	$(PYTHON) -m wcpan.drive.cli sync

lint: setup
	$(RUFF) check engine tests
	$(RUFF) format --check engine tests

format: setup
	$(RUFF) check --fix engine tests
	$(RUFF) format engine tests
