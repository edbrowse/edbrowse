# compiler and flags
CC ?= cc
PERL ?= perl
INSTALL ?= install -C
PREFIX ?= /usr/local
QUICKJS_INCLUDE ?= $(PREFIX)/include
QUICKJS_LIB ?= $(PREFIX)/lib
QUICKJS_LIB_NAME ?= qjs
CFLAGS +=	-Wall -D_FILE_OFFSET_BITS=64
INSTALLBASE ?= $(shell realpath "$(DESTDIR)/$(PREFIX)")
DOCDIR ?= $(INSTALLBASE)/share/doc/edbrowse
BINDIR ?= $(INSTALLBASE)/bin
PLUGINSDIR ?= $(INSTALLBASE)/share/edbrowse/plugins
# determine includes and linker flags
DEPENDENCIES = libcurl:curl odbc libpcre2-8:pcre2-8 readline openssl
INCLUDES = $(shell ./make-helper.sh pkg-config-includes $(DEPENDENCIES))
LINKER_LIBS = $(shell ./make-helper.sh pkg-config-libs $(DEPENDENCIES))
CPPFLAGS += $(INCLUDES) -I$(QUICKJS_INCLUDE)

#  Set EBDEMIN=on to support dynamic js deminimization
ifneq ($(EBDEMIN),)
	EDBR_JS_ASSETS = shared.js startwindow.js demin.js
else
	EDBR_JS_ASSETS = shared.js startwindow.js endwindow.js
endif

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
QUICKJS_LDFLAGS = -L$(QUICKJS_LIB) -l$(QUICKJS_LIB_NAME) -ldl
ifeq ($(shell uname),Linux)
	QUICKJS_LDFLAGS += -latomic
endif
LDFLAGS += $(QUICKJS_LDFLAGS)
#  and the other loader flags
LDFLAGS += $(STRIP) $(LINKER_LIBS) -lpthread -lm -lssl -lcrypto

#  ESQL C load flags
#ESQLDFLAGS = $(STRIP) -Xlinker -rpath -Xlinker $(INFORMIXDIR)/lib:$(INFORMIXDIR)/lib/esql
#  but it's better to put those two directories into /etc/ld.so.conf and then run ldconfig
ESQLDFLAGS = $(STRIP)

#  Make the dynamically linked executable program by default.
all: edbrowse

#  edbrowse objects
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

startwindow.c: $(EDBR_JS_ASSETS)
	$(PERL) ../tools/buildsourcestring.pl $(EDBR_JS_ASSETS) startwindow.c

ebrc.c: ../lang/ebrc-* ../doc/usersguide*.html
	cd .. ; $(PERL) ./tools/buildebrcstring.pl

msg-strings.c: ../lang/msg-*
	cd .. ; $(PERL) ./tools/buildmsgstrings.pl

# The implicit linking rule isn't good enough, because we don't have an
# edbrowse.o object, and it expects one.
edbrowse: $(EBOBJS)
	$(CC) $(EBOBJS) $(LDFLAGS)  -o $@


#  You probably need to be root to do this.
install: install-dirs install-edbrowse install-docs install-plugins

install-dirs:
	mkdir -p -m 755 $(BINDIR) $(DOCDIR) $(PLUGINSDIR)

install-edbrowse: edbrowse
	$(INSTALL) -m755 edbrowse $(BINDIR)

install-docs: $(DOCS)
	$(INSTALL) -m644 $^ $(DOCDIR)

install-plugins: $(PLUGIN_SCRIPTS) $(PLUGIN_CONFIG)
	$(INSTALL) -m755 $(PLUGIN_SCRIPTS) $(BINDIR)
	$(INSTALL) -m644 $(PLUGIN_CONFIG) $(PLUGINSDIR)

# native Informix library for database access.
# Others could be built, e.g. Oracle, but odbc is the most general.
dbinfx.o : dbinfx.ec
	esql -c dbinfx.ec

#  Informix executable
#edbrowse-infx: $(EBOBJS) dbops.o dbinfx.o jseng-duk.o
#	esql $(ESQLDFLAGS) -o edbrowse-infx $(EBOBJS) dbops.o dbinfx.o $(LDFLAGS) -lduktape

clean:
	rm -f *.o edbrowse \
	startwindow.c ebrc.c msg-strings.c

# some hello world targets, for testing and debugging

# need packages nodejs and libnode-dev
js_hello_v8 : js_hello_v8.cpp
	g++ -I/usr/include/v8 js_hello_v8.cpp -lv8 -lstdc++ -o js_hello_v8

js_hello_quick : js_hello_quick.c stringfile.o msg-strings.o ebrc.o format.o
	$(CC) -I$(QUICKJS_INCLUDE) $(CFLAGS) js_hello_quick.c stringfile.o msg-strings.o ebrc.o format.o $(QUICKJS_LDFLAGS) -o js_hello_quick -lm -lpthread

js0: js0.c
	$(CC) -I$(QUICKJS_INCLUDE) js0.c $(QUICKJS_LIB)/libquickjs.a -lm -latomic -o js0

hello: js_hello_quick js0
