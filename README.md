## edbrowse, a line oriented editor browser

Written and maintained by Karl Dahlke and others.

See our [home page][1]  for current releases and contact information.

See the [license file][2] for licensing agreements.

See the [build and installation instructions][3] for info on building and installing Edbrowse.

### Disclaimer

this software is provided as-is,
with no guarantee that it will perform as expected.
It might trash your precious files.
It might send bad data across the Internet,
causing you to buy a $37,000 elephant instead of
$37 worth of printer supplies.
It may delete all the rows in your mysql customer table.
Use this program at your own risk.

### Overview

Chrome and Firefox are graphical browsers.
Lynx and Links are full screen terminal based browsers.
This is a fully command based browser, the only one of its kind as far as we
know.

For information on how to use the software please see the [user's guide][4] in
this package, or the [online version][5]. The online guide corresponds to the
latest stable release.

Of course this reasoning is a bit circular.
You need to use a browser to read the documentation,
which describes how to use the browser.
Well you can always do this:

```shell
cd doc; lynx -dump usersguide.html >usersguide.txt
```

This produces the documentation in text form,
which you can read using your favorite editor.
Of course we hope edbrowse will eventually become your
favorite editor, whence you can browse the documentation directly.
The [doc directory][6] also includes a sample config file.

If you are interested in contributing to the project, the [development instructions][7]
contain notes and information for Edbrowse development and debugging.

The [history directory][8] contains information on the history of edbrowse,
how it came to be and what it is trying to accomplish.
This includes a wikipedia article, written in markup.
It was deleted by the wikipedia maintainers, for lack of sources.
If edbrowse is described in a book or mainstream magazine in the future,
perhaps this article can be reintroduced.

[1]: http://edbrowse.org/
[2]: LICENSE
[3]: doc/installing.md
[4]: doc/usersguide.html
[5]: http://edbrowse.org/usersguide.html
[6]: doc/
[7]: doc/developing.md
[8]: doc/history/
