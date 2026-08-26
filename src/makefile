# compiler and flags
CC ?= cc
PERL ?= perl
INSTALL ?= install
MKDIR ?= mkdir
# may need to be set to pkgconf on some systems but most still come with the
# link to the older name
PKG_CONFIG ?= pkg-config

#  Where is quickjs-ng?
#  It isn't always under $(PREFIX). Debian puts the headers in
#  /usr/include/qjs and the library in the multiarch directory, and ships a
#  pkg-config file that says so, so ask pkg-config and save everybody the
#  trouble of setting variables by hand.
#  If pkg-config doesn't know either, we fall back to $(PREFIX) as always.
#  Naming any of PREFIX, QUICKJS_INCLUDE, QUICKJS_LIB or QUICKJS_LIB_NAME
#  turns this off; if you have said where quickjs is then that is where it is.
#  This has to be decided before the ?= lines below, because ?= would make an
#  unset variable look as though it had been set right here.
QUICKJS_PKG ?= qjs
quickjs_told ::= $(strip $(foreach v,PREFIX QUICKJS_INCLUDE QUICKJS_LIB QUICKJS_LIB_NAME,\
$(filter-out undefined default,$(origin $(v)))))
ifeq ($(quickjs_told),)
quickjs_from_pkg ::= $(shell $(PKG_CONFIG) --exists $(QUICKJS_PKG) 2>/dev/null && echo yes)
endif

PREFIX ?= /usr/local
QUICKJS_INCLUDE ?= $(PREFIX)/include
QUICKJS_LIB ?= $(PREFIX)/lib
QUICKJS_LIB_NAME ?= qjs

ifeq ($(quickjs_from_pkg),yes)
quickjs_cflags ::= $(shell $(PKG_CONFIG) --cflags $(QUICKJS_PKG))
quickjs_libs ::= $(shell $(PKG_CONFIG) --libs $(QUICKJS_PKG))
else
quickjs_cflags = -I$(QUICKJS_INCLUDE)
quickjs_libs = -L$(QUICKJS_LIB) -l$(QUICKJS_LIB_NAME)
endif
INSTALLBASE ?= $(shell realpath "$(DESTDIR)/$(PREFIX)")
DOCDIR ?= $(INSTALLBASE)/share/doc/edbrowse
BINDIR ?= $(INSTALLBASE)/bin
FILESDIR ?= $(INSTALLBASE)/share/edbrowse
PLUGINSDIR ?= $(FILESDIR)/plugins
# Some systems want to install with different permissions
DIRMODE ?= 755
EXECMODE ?= 755
FILEMODE ?= 644
# install macros
define install_generic
$(MKDIR) -p -m $(DIRMODE) $(1); $(INSTALL) -C -m $(2) $(3) $(1)
endef
install_exec = $(call install_generic,$(1),$(EXECMODE),$(2))
install_file = $(call install_generic,$(1),$(FILEMODE),$(2))

# determine includes and linker flags
DEPENDENCIES ?= libcurl odbc libpcre2-8 readline openssl
dependency_cflags ::= $(shell $(PKG_CONFIG) --cflags $(DEPENDENCIES))
dependency_libs ::= $(shell $(PKG_CONFIG) --libs $(DEPENDENCIES))
CFLAGS += -Wall -D_FILE_OFFSET_BITS=64 -Wno-trigraphs $(dependency_cflags) $(quickjs_cflags)

EDBR_JS_ASSETS = shared.js startwindow.js demin.js

# If EBDEBUG is set to on, or a non-empty string, build with debug flags and
# don't strip executables.
	STRIP = -s
ifneq ($(EBDEBUG),)
	CFLAGS += -g -ggdb
	STRIP =
endif

#  EBPROF=on for profiling, probably shouldn't combine with EBDEBUG
ifneq ($(EBPROF),)
	CFLAGS += -g -pg
	STRIP = -pg
endif

# LDFLAGS for quickjs loading.
QUICKJS_LDFLAGS = $(quickjs_libs) -ldl
ifeq ($(shell uname),Linux)
	QUICKJS_LDFLAGS += -latomic
endif
LDFLAGS += $(dependency_libs) $(QUICKJS_LDFLAGS) -lpthread -lm $(STRIP)

#  ESQL C load flags
#ESQLDFLAGS = $(STRIP) -Xlinker -rpath -Xlinker $(INFORMIXDIR)/lib:$(INFORMIXDIR)/lib/esql
#  but it's better to put those two directories into /etc/ld.so.conf and then run ldconfig
ESQLDFLAGS = $(STRIP)

#  Make the dynamically linked executable program by default.
all: edbrowse

# edbrowse objects
EBOBJS = main.o buffers.o sendmail.o fetchmail.o \
	html.o html-tags.o format.o stringfile.o ebrc.o \
	msg-strings.o http.o isup.o css.o startwindow.o dbops.o dbodbc.o \
	jseng-quick.o
PLUGIN_SCRIPTS := $(wildcard ../plugins/scripts/edbrowse-plugin-*)
PLUGIN_CONFIG := $(wildcard ../plugins/config/*.rc)
DOCS := ../doc/usersguide.html ../doc/usersguide_fr.html
#  Header file dependencies.
$(EBOBJS) : eb.h ebprot.h messages.h
dbodbc.o dbinfx.o dbops.o : dbapi.h

%.js-ok: %.js
	qjs -C $< && touch $@

startwindow.c: $(patsubst %.js,%.js-ok,$(EDBR_JS_ASSETS))
	$(PERL) ../tools/buildsourcestring.pl $(EDBR_JS_ASSETS) startwindow.c

ebrc.c: ../lang/ebrc-* ../doc/usersguide*.html
	cd .. ; $(PERL) ./tools/buildebrcstring.pl

msg-strings.c: ../lang/msg-*
	cd .. ; $(PERL) ./tools/buildmsgstrings.pl

# The implicit linking rule isn't good enough, because we don't have an
# edbrowse.o object, and it expects one.
edbrowse: $(EBOBJS)
	$(CC) $^ $(LDFLAGS) -o $@

#  You probably need to be root to do this.
install: install-edbrowse install-docs install-emojis install-plugins

install-edbrowse: edbrowse
	$(call install_exec,$(BINDIR),$^)

install-docs: $(DOCS)
	$(call install_file,$(DOCDIR),$^)

install-plugins: $(PLUGIN_SCRIPTS) $(PLUGIN_CONFIG)
	$(call install_exec,$(BINDIR),$(PLUGIN_SCRIPTS))
	$(call install_file,$(PLUGINSDIR),$(PLUGIN_CONFIG))

install-emojis: emojis.txt
	$(call install_file,$(FILESDIR),$^)

# native Informix library for database access.
# Others could be built, e.g. Oracle, but odbc is the most general.
dbinfx.o : dbinfx.ec
	esql -c dbinfx.ec

#  Informix executable
#edbrowse-infx: $(EBOBJS) dbops.o dbinfx.o jseng-duk.o
#	esql $(ESQLDFLAGS) -o edbrowse-infx $(EBOBJS) dbops.o dbinfx.o $(LDFLAGS) -lduktape

clean:
	rm -f *.o *.js-ok edbrowse \
	startwindow.c ebrc.c msg-strings.c

# some hello world targets, for testing and debugging

# need packages nodejs and libnode-dev
js_hello_v8 : js_hello_v8.cpp
	g++ -I/usr/include/v8 js_hello_v8.cpp -lv8 -lstdc++ -o js_hello_v8

js_hello_quick : js_hello_quick.c stringfile.o msg-strings.o ebrc.o format.o
	$(CC) $(CFLAGS) js_hello_quick.c stringfile.o msg-strings.o ebrc.o format.o -o js_hello_quick $(quickjs_libs) -lm -lpthread

js0: js0.c
	$(CC) $(quickjs_cflags) js0.c $(quickjs_libs) -lm -o js0

hello: js_hello_quick js0

.PHONY: all clean install install-docs install-plugins install-edbrowse
.PHONY: install-emojis
