# Simple makefile to move to the src directory.

all: build

build:
	$(MAKE) -C src

clean:
	$(MAKE) -C src clean

install:
	$(MAKE) -C src install

test: build
	+$(MAKE) -s -k --output-sync=target -C tests \
		$(if $(LOCAL),LOCAL=1) $(if $(TRACE),TRACE=1) test

# Finish cleaning before launching a recursive build, even with -j.
ifneq ($(filter clean,$(MAKECMDGOALS)),)
build install: | clean
endif

.PHONY: all build clean install test
