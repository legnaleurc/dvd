release: unpack-release engine-release viewer-release
debug: unpack-debug engine-debug viewer-debug
clean: unpack-clean engine-clean viewer-clean
purge: unpack-purge engine-purge viewer-purge
test: engine-test viewer-test

unpack-release:
	$(MAKE) -C unpack release
unpack-debug:
	$(MAKE) -C unpack debug
unpack-clean:
	$(MAKE) -C unpack clean
unpack-purge:
	$(MAKE) -C unpack purge

engine-release:
	$(MAKE) -C engine release
engine-debug:
	$(MAKE) -C engine debug
engine-clean:
	$(MAKE) -C engine clean
engine-purge:
	$(MAKE) -C engine purge
engine-test:
	$(MAKE) -C engine test

viewer-release:
	$(MAKE) -C viewer release
viewer-debug:
	$(MAKE) -C viewer debug
viewer-clean:
	$(MAKE) -C viewer clean
viewer-purge:
	$(MAKE) -C viewer purge
viewer-test:
	$(MAKE) -C viewer test
