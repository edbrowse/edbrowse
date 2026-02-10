## Building and installing Edbrowse

### From a package manager

If Edbrowse is packaged for your environment and you are happy with the
available version then you can simply use your package manager to install the
software. Currently Edbrowse is known to be packaged for:

- Debian
- Ubuntu
- Arch and derivitives via AUR
- Homebrew
- MacPorts
- FreeBSD

Please note that the maintenance of the above packages is separate to the
Edbrowse project.

### Compilation

The following instructions should apply to most Unix-like environments using GNU
compatible tools and libraries. If you encounter issues then Further
platform-specific instructions and notes may be found on the [wiki][1].

#### Requirements

##### pcre

As you may know, edbrowse was originally a perl script.
As such, it was only natural to use perl regular expressions for
the search/substitute functions in the editor.
Once you've experienced the power of perl regexp, you'll never
go back to ed.  So I use the perl-compatible regular expression
library, /lib/libpcre2-8
If you don't have this file, check your available packages.
the pcre and pcre-devel packages might be there, just not installed.
As of this writing, you need pcre2-8, which is generally available.

Note that buffers.c includes <pcre2.h>.
Some distributions put it in /usr/include/pcre2/pcre2.h,
so you'll have to adjust the source, the -I path, or make a link.

##### libcurl

You need libcurl and libcurl-devel,
which are included in almost every Linux distro.
This is used for ftp, http, and https.
Check for /usr/include/curl/curl.h
Edbrowse requires version 7.55.0 or later.
It will not compile against earlier versions.

##### unixODBC

Edbrowse provides database access through odbc.
Thus you need unixODBC and unixODBC-devel.
ODBC has been stable for quite some time.
unixODBC version 2.2.14 seems to satisfy edbrowse with odbc.

##### quickjs-ng

This is the javascript engine for edbrowse.
Edbrowse is known to build against version 0.10.1 or later. At the time of writing the current version is 0.11.0.
Earlier versions have not been tested.

If it is already packaged then you can move on to the next step.
If it is not packaged you will need to build it from source.
```shell
git clone https://github.com/quickjs-ng/quickjs
```

the make process assumes cmake on your system, so be sure that is installed. From the cloned directory execute:

```shell
make
make install
```

If header and library are not installed in the usual places,
you may need to set the `$PREFIX`,
or `$QUICKJS_INCLUDE` and `$QUICKJS_LIB` variables appropriately, when you make edbrowse.
Under normal circumstances, make will just work.

quickjs-ng is a fork of the original project quickjs.
You can, as an alternative, build edbrowse against the original project
quickjs. Unfortunately versioning in quickjs is less clear and thus it is
difficult to give exact version requirements other than that the version must
be released after June 2025.
the preprocessing symbol `Q_NG` is set to 1 for quickjs-ng, or 0 for quickjs.
This is only used by the sourcefile `jseng-quick.c`,
which is the gateway between edbrowse and quickjs.

It is not possible to install both simultaneously.
There is a conflict with the executable qjs.

##### readline

Edbrowse supports using GNU readline for handling input. As such you need
the readline library and headers installed e.g. readline and readline-devel.

#### Compiling edbrowse

For a time, edbrowse could be built on windows, but this is no longer supported.
On all other systems, you should be able to use the GNU version of make.

First of all switch to the src directory under the main Edbrowse directory.
then, if quickjs-ng is installed, just type:

```shell
make
```

However if quickjs is installed, use:

```shell
CPPFLAGS=-DQ_NG=0 QUICKJS_LIB_NAME=quickjs make
```

To build edbrowse against a quickjs project that is built locally, but not installed,
set `QUICKJS_INCLUDE` and `QUICKJS_LIB` appropriately.
Your make command might look like this:

```shell
CPPFLAGS=-DQ_NG=0 QUICKJS_LIB_NAME=quickjs  QUICKJS_INCLUDE=/home/your_login/programs/qorig QUICKJS_LIB=/home/your_login/programs/qorig make
```

In addition to quickjs-related variables,
the makefile supports the following variables:

- `EBDEBUG` - symbolic debugging via gdb
- `EBPROF - profiling via gprof
- `EBDEMIN` - adds javascript deminimization support

To set any of these simply set them to any non-empty string. Distributors should
not set these flags.

### Installation

After compilation you can use:

```shell
make install
```

to install the executable. Note that if you used `PREFIX` when building you
probably also want to specify that variable in the above installation command.

### Testing

You can test the installed executable by edbrowse src/jsrt
jsrt means javascript regression test.
You will get a number, the size of the file, just as you would from /bin/ed.
Then type b for browse.
You should get something like this; if you do then all is well.
```
relative
body loading
complete
835
lines 36 through 41 have been added
```

	[after a delay of 10 seconds]

```
10 seconds have passed!
lines 42 through 43 have been added
```

Type ,p to see the page, if you wish, as though it were ed.
Type q to exit.

Note that you do not need to install the executable to run correctly thus you
can test the compiled executable prior to installation.

### Notes

It's rare, but curl, and hence edbrowse, cannot access certain websites,
giving the message
Cannot communicate securely with peer: no common encryption algorithm(s).
You can even see this from the command line.
```shell
curl https://weloveanimals.me
```

You'll either get the communication error or not.
This happens if openssl is too old,
or doesn't support the ciphers that the website expects.
This is beyond edbrowse, and beyond curl; you have to upgrade openssl.

[1]: https://github.com/edbrowse/edbrowse/wiki/
