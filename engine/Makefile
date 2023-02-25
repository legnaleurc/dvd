TOUCH = touch
PYTHON := python3
POETRY := poetry
BLACK := black

PKG_FILES = pyproject.toml poetry.lock
PKG_DIR = .venv

debug: setup
release: setup

setup: $(PKG_DIR)

$(PKG_DIR): $(PKG_FILES)
	$(POETRY) install
	$(TOUCH) $@

clean:
	$(RM) -rf .coverage

distclean: clean
	$(RM) -rf $(PKG_DIR)

test: setup
	$(POETRY) run $(PYTHON) -m compileall engine
	$(POETRY) run $(PYTHON) -m unittest

auth: setup
	$(POETRY) run $(PYTHON) -m wcpan.drive.cli auth

sync: setup
	$(POETRY) run $(PYTHON) -m wcpan.drive.cli sync

lint: setup
	$(POETRY) run $(BLACK) --check engine

format: setup
	$(POETRY) run $(BLACK) engine
