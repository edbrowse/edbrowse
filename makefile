# Simple makefile to move to the src directory.
# This only works if you are making the default target.

all: build

build:
	$(MAKE) -C src

clean:
	$(MAKE) -C src clean

install:
	$(MAKE) -C src install

test: build
	@./tests/runtests \
		$(if $(LOCAL),-l)

.PHONY: all build clean install test
