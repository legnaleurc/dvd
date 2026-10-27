release: unpack-release engine-setup viewer-build
debug: unpack-debug engine-setup viewer-setup
clean: unpack-clean engine-clean viewer-clean
purge: unpack-purge engine-purge viewer-purge
test: unpack-test engine-test viewer-test

unpack-release:
	$(MAKE) -C unpack release
unpack-debug:
	$(MAKE) -C unpack debug
unpack-clean:
	$(MAKE) -C unpack clean
unpack-purge:
	$(MAKE) -C unpack purge
unpack-test:
	$(MAKE) -C unpack test

engine-setup:
	$(MAKE) -C engine setup
engine-clean:
	$(MAKE) -C engine clean
engine-purge:
	$(MAKE) -C engine purge
engine-test:
	$(MAKE) -C engine test

viewer-setup:
	$(MAKE) -C viewer setup
viewer-build:
	$(MAKE) -C viewer build
viewer-clean:
	$(MAKE) -C viewer clean
viewer-purge:
	$(MAKE) -C viewer purge
viewer-test:
	$(MAKE) -C viewer test
