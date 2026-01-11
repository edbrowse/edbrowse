## edbrowse, a line oriented editor browser

Written and maintained by Karl Dahlke and others.

See our home page <http://edbrowse.org/> for current releases and contact information.

See <LICENSE> for licensing agreements.

See <doc/building.md> for info on building and installing Edbrowse.

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
The user's guide can be found as doc/usersguide.html in this package,
or online at <http://edbrowse.org/usersguide.html>.
The online guide corresponds to the latest stable release.
Of course this reasoning is a bit circular.
You need to use a browser to read the documentation,
which describes how to use the browser.
Well you can always do this:

```shell
cd doc ; lynx -dump usersguide.html >usersguide.txt
```

This produces the documentation in text form,
which you can read using your favorite editor.
Of course we hope edbrowse will eventually become your
favorite editor, whence you can browse the documentation directly.
The <doc/> directory also includes a sample config file.

If you are interested in contributing to the project the n <doc/development.md>
contains notes and ifnormation for Edbrowse development and debugging.

The <doc/history/> directory contains information on the history of edbrowse,
how it came to be and what it is trying to accomplish.
<doc/history/article.wikipedia> is our wikipedia article, written in markup.
It was deleted by the wikipedia maintainers, for lack of sources.
If edbrowse is described in a book or mainstream magazine in the future,
perhaps this article can be reintroduced.
