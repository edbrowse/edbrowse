##Edbrowse regression tests

There are two regression tests in the edbrowse package.
They are both in the src directory.
Please run these tests before committing a significant software change.
Note however that they don't test everything.
It is possible to pass both of these tests and still break something.

The first test is acid3, which is a snapshot of http://acid3.acidtests.org.acid3.org.
It has been much modified.
It consists of 100 tests, but I only run the first 69.
The latter tests seemed to have little relevance to websites in the real world,
and quite frankly, I ran out of steam.
8 of the earlier tests also didn't seem that relevant, and are skipped.
Even if acid3 passes, it will remind you, "8 tests were skipped."
So 61 tests in practice.
I'd like to go back to these some day, the 8 that were skipped and the latter 31.
I'm sure they would be valuable as part of the regression test.

My modifications are indicated by the characters @`.
Look for comments containing @`; they explain how and why I modified the file.

acid3 is entirely passive. There are no interactive features.
Simply edit and browse, and watch what happens.
If, after a few seconds, line 3 says 69/69, you're good.
If the first number, the number of tests passed, is less than 69,
then there is a problem.
Those failures are displayed: the tests that failed, and why.
If the failure is caused by a javascript error, it is caught, and printed.
You should be able to track down what happened.

The second file is jsrt, for javascript regression test.
It is entirely home-grown.

It starts out the same way: edit, then browse.
If it says "failed 125", then you need to unbrowse,
and search for fail(125), and figure out what went wrong.

Most of this file is in a try catch block, so that javascript errors are also caught.
It prints the error and the stack, although the stack is often not very helpful.
Line numbers in jsrt can be off. At times they are relative to the start of the script, rather than the file itself.
Hopefully the error message gives you a clue, and you can track it down.

I often browse at db3, and sometimes dbev+.
Sometimes I direct the output into a file and compare it with the previous run.
any error, from one of my tests or from javascript itself, will show up in the diff.
also, the javascript error is printed in the db3 stream; you can see how far jsrt got before it produced the error.

After it browses successfully, there is still one more thing it will do on its own.
It creates a timer that fires in 10 seconds.
The function (on the timer) tells you that 10 seconds have passed,
and then it calls document.body.apendChild to add a TextNode to the tree of objects.
The text simply says, "and the timer text".
The alert tells you that the timer fired.
Then, a periodic rerender should take place, (there could be a small delay), and edbrowse will detect a change in the buffer, something that is there that wasn't there before.
(This is a diff between this rerender and the last one.)
It notifies you by saying "lines 42 through 43 have been added"
You may be somewhere else in the file, but you can go down to line 43 to see what is new.
There you will find the timer text.
This is how edbrowse presents a web page that dynamically changes in the real world.

There is another way to browse jsrt - with javascript turned off.
Needless to say, this does not test any javascript, but it does test the &lt;noscript&gt; feature.
The noscript tag includes a numbered list with one item, and this appears at or near the top of the file.

1. This is a regression test without javascript.

Some of the features, such as filling out the form, can still be tested without javascript,
and that has value.

Now let's take it from the top.
There is a link to Background Music.
This comes from the bgsound tag, which is probably deprecated.
edbrowse never plays music automatically, as other browsers do.
Your speech probably comes out of the same speakers, and I don't want to overrun it with music or a podcast or whatever is available.
So there is a link, in this case going to a url that doesn't exist.

Next is another link, this time from a new window.
It would be a popup window on another browser.
It invites you to buy something, just to illustrate.
The link goes no where.

The next link is an ftp link, which we should test / verify now and then,
although ftp sites are becoming scarce.
Go to it if you wish, descend into a directory or file, then ^ back.

Next is a line with 5 buttons, 4 submit and a checkbox.
The first button waits 5 seconds then sends you to a gopher site, to test the gopher protocol.
This is a page replacement, you cannot return.

The second button runs an xhr test.
xhr is a system where javascript can go get a file from the internet.
In this case it gets the home page from edbrowse.org.
When the page is loaded it prints " base onload" from its onload function.
If the data looks right it will say "looks good".
It may print more debugging messages at db3.

The third button is an await test.
await is a special command in javascript; connected with Promise objects.
This is designed to await 5 seconds.
It should say "done waiting", and "your 5 seconds are up, baby".

The fourth button is an await fetch test.
The javascript fetch command uses await internally.
Once again this command fetches the home page of edbrowse.org.
If it succeeds it will print "camp Granada".

Finally the fifth input field is a check box.
Turn it on with i5=+.
This activates an observer, which watches the entire page.
It reports any changes to the tree of objects, or to the attributes.
If you are quick on the draw, and activate it before the 10 second timer fires,
then it will report that the TextNode was added to the page.
You can test it yourself by changing the tree or the attributes.
I assume you are familiar with jdb, the javascript debugger.
Once you have entered the jdb world, type

f = document.forms[0];

It will print the result of this expression, which is the form object, or [object HTMLFormElement].
Type dumptree(f) to see this form as a tree of objects.
You will see the buttons with their text messages inside.
Now set an attribute to trigger the observer.

f.setAttribute("sky","gray")

The observer sees this right away and reports, "The sky attribute was modified."

Next we come to Frame {butterfly}, and there are lot of things to test here.
Type exp to expand the frame, or g to go to the frame, the commands are equivalent.
The frame is a file on edbrowse.org.
It prints "script in frame", and presents a small web page, just 4 lines long.
There are several things you can do in this frame.
The first line is a simple hyperlink, to go to space.com.
The next link is a frame inside a frame.
Expand this and get a derivation of the number of arrangements of the Rubix cube.
The point is, this is a frame within a frame, and that's what we are testing.
You can contract the inner frame, or the outer frame, then reexpand them again if you wish.

Be mindful of the context when you enter jdb.
It depends on where you are in the file.
Type jdb from line 1 and you are in the first context, the first web page.
It even introduces itself with cx1.
You can confirm by looking at the variable eb$ctx, which is an edbrowse variable of our own making.
type jdb from the line that says Spaced Out, and you are in the second frame,
which you might think is the second context.
It is actually the fourth context, because the jsrt tests create two contexts internally.
So jdb introduces itself as cx4.
Go farther down, into the math of the Rubix cube, and type jdb, and you are in the fifth context.
The tree of objects is different in each context, because it reflects the web page of that frame.
for example, there are no forms in this innermost context.
document.forms[0] produces an error.
However, top.document.forms[0] gives you the form with all the buttons, as before,
because top is a variable that takes us up to the top frame.

There is another frame test you can perform, which is rather a corner case,
does not come up often in the wild.
Replace this frame with the Munsters.
This is not a hyperlink, where you can go and come back.
Nor is it a frame within a frame.
It replaces the frame completely.
Now you are reading the Munsters alphabet poem.
There is no way to go back. this is now the frame, and the web page.

Below the frame are three interactive tests you can perform.
g1 dips into the frame above and displays the type of the first node under the body of that web page.
This is div, because I wrote that web page, on edbrowse.org, to begin with div.
However, if you replace the frame with the Munsters, it is a traditional web page, and begins with h1.

The second and third links send messages to the other frame, and that frame prints the contents of those messages when it receives them.
Thus we are testing both messaging systems.
And why are there two such systems?
Well, I don't know.
The great thing about standards is, there are so many of them.

Now we come to a sprawling fill-out form.
The idea is to enter fields, and choose from dropdown lists, and click on checkboxes and radio buttons, and submit the form, and see if everything is transmitted correctly.
Do that at db3 so you can see the fields as they are sent - because the url goes no where.

There are some side effects within the form.
For example, if you click on cat, to say that you own a cat, one of the event handlers says, "Dude you clicked on cat."
Furthermore, if dog is checked, it also says, "chased by dog".
The most interesting interaction takes place when you select a state.
The colors in the next menu down will change, depending on whether the state starts with A through M, or N through Z.
The next rerender will tell you if that line changed, bringing your attention to the new colors.
Type i? on that select field to see the colors.
They will depend on the state.
Some web sites do this, and edbrowse has to follow along.

Finally we come to the action buttons.
Reset and submit are as you expect.
Rewrite changes the text in the TextArea.
This does not issue an alert, for lines that have changed on the current page, because the text area is in another buffer, probably session 2.
Type e2 and notice that the text has changed.

When you submit, a required field and an event handler insist that the subject be nonempty, and the side buffer be nonempty.
If those conditions hold, then edbrowse tries to send, and it prints out all the fields at db3.

there is another test for the layout of the page.
showall+ changes the subject line, the state line, and the White Album line.
These lines have pieces of css injected into them.
these pieces are typically not shown, because they are usually bullets or marks or other small punctuations.
But you can see them with the showall command, and jsrt facilitates this test.

I'm sure jsrt will evolve,
in its many tests during the browse process, and more tests that are done interactively.
We will keep this guide up to date as new tests are added.
