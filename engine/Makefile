TOUCH := touch
RM := rm -rf
PYTHON := python3
POETRY := poetry
BLACK := black

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
	$(POETRY) run $(PYTHON) -m compileall engine
	$(POETRY) run $(PYTHON) -m unittest

setup: $(BLD_LOCK)

$(BLD_LOCK): $(PKG_FILES)
	$(POETRY) install
	$(TOUCH) $@

auth: setup
	$(POETRY) run $(PYTHON) -m wcpan.drive.cli auth

sync: setup
	$(POETRY) run $(PYTHON) -m wcpan.drive.cli sync

lint: setup
	$(POETRY) run $(BLACK) --check engine

format: setup
	$(POETRY) run $(BLACK) engine
