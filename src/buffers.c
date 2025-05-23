/* buffers.c, Text buffer support routines, manage text and edit sessions. */

#include "eb.h"

#include <libgen.h>
#include <sys/select.h>

/* If this include file is missing, you need the pcre package,
 * and the pcre-devel package. */
#define PCRE2_CODE_UNIT_WIDTH 8
#include <pcre2.h>
static bool bad_utf8_alert;

#include <readline/readline.h>
#include <readline/history.h>

#define selfFrame() ( cf = &(cw->f0), cf->owner = cw )

// Static variables for this file

// The valid edbrowse commands
static const char valid_cmd[] = "aAbBcdDefghHijJklmMnpPqrstuvwWXz=^&<";
// Commands that can be done in browse mode
// m and t are only here for moving an imap email that you are browsing
static const char browse_cmd[] = "AbBdDefghHiklmMnpPqtsvwXz=^&<";
// Commands for sql mode
static const char sql_cmd[] = "AadDefghHiklmnpPqrsvwXz=^<";
// Commands for directory mode
static const char dir_cmd[] = "AbdDefghHklLMmnpPqstvwXz=^<";
// Commands for irc input mode
static const char irci_cmd[] = "aBcdDefghHijJklmnpPrstuvwWXz=&<";
// Commands for irc output mode
static const char irco_cmd[] = "BdDefghHklnpPvwXz=<";
// commands for imap folders
static const char imap1_cmd[] = "adefghHklnpPqsvwXz^=<";
// commands for imap envelopes
static const char imap2_cmd[] = "dDefghHklmnpPqtvXz^=<";
// Commands that work at line number 0, in an empty file
static const char zero_cmd[] = "aAbefhHkMPqruwz=^<";
// Commands that expect a space afterward
static const char spaceplus_cmd[] = "befPrwW";
// Commands that should have no text after them
static const char nofollow_cmd[] = "aAcdDhHjlmnptuX=";
// Commands that can be done after a g// global directive
static const char global_cmd[] = "<!dDijJlLmnprstwWX=";
static bool *gflag;
static Window *gflag_w;

static int startRange, endRange;	// as in 57,89p
static int destLine;		// as in 57,89m226
static int last_z = 1;
static char cmd, scmd;
static uchar subPrint;		/* print lines after substitutions */
static char *undoSpecial;
int undo1line;
static int undoField;
void undoSpecialClear(void) { nzFree(undoSpecial), undoSpecial = 0, undo1line = 0; }
static uchar noStack;		// don't stack up edit sessions
static bool globSub;		/* in the midst of a g// command */
static bool inscript;		/* run from inside an edbrowse function */
static int lastq, lastqq;
static char icmd;		/* input command, usually the same as cmd */
static bool promptOn;		/* show prompt */
static char *promptString;
static bool uriEncoded;

/*********************************************************************
If a rendered line contains a hyperlink, the link is indicated
by a code that is stored inline.
If the hyperlink is number 17 on the list of hyperlinks for this window,
it is indicated by InternalCodeChar 17 { text }.
The "text" is what you see on the page, what you click on.
{Click here for more information}.
And the braces tell you it's a hyperlink.
That's just my convention.
The prior chars are for internal use only.
I'm assuming these chars don't/won't appear on the rendered page.
Yeah, sometimes nonascii chars appear, especially if the page is in
a European language, but I just assume a rendered page will not contain
the sequence: InternalCodeChar number {
In fact I assume the rendered text won't contain InternalCodeChar at all.
So I use this char to demark encoded constructs within the lines.
And why do I encode things right in the text?
Well it took me a few versions to reach this point.
But it makes so much sense!
If I move a line, the referenced hyperlink moves with it.
I don't have to update some other structure that says,
"At line 73, characters 29 through 47, that's hyperlink 17."
I use to do it that way, and wow, what a lot of overhead
when you move lines about, or delete them, or make substitutions.
Yes, you really need to change rendered html text,
because that's how you fill out forms.
Add just one letter to the first name in your fill out form,
and the hyperlink that comes later on in the line shifts down.
I use to go back and update the pointers,
so that the hyperlink started at offset 30, rather than 29.
That was a lot of work, and very error prone.
Finally I got smart, and coded the html tags inline.
They can't get lost as text is modified.  They move with the text.
So now, certain sequences in the text are for internal use only.
This routine strips out these sequences for display.
After all, you don't want to see those code characters.
You just want to see {Click here for more information}.
This also checks for special input fields that are masked and
displays stars instead, whenever we would display formatted text.
*********************************************************************/

void removeHiddenNumbers(pst p, uchar terminate, int cx, const Window *w)
{
	pst s, t, u;
	uchar c, d;
	int field;

	if(!w) w = sessionList[cx].lw;
	s = t = p;
	while ((c = *s) != terminate) {
		if (c != InternalCodeChar) {
addchar:
			*t++ = c;
			++s;
			continue;
		}
		u = s + 1;
		d = *u;
		if (!isdigitByte(d))
			goto addchar;
		field = strtol((char *)u, (char **)&u, 10);
		d = *u;
		if (d == '*') {
			s = u + 1;
			continue;
		}
		if (d == '<') {
			if (w->tags[field]->masked) {
				*t++ = d;
				while (*++u != InternalCodeChar)
					*t++ = '*';
			}
			s = u;
			continue;
		}
		if (strchr(">{}", d)) {
			s = u;
			continue;
		}
// This is not a code sequence I recognize.
// This should never happen; just move along.
		goto addchar;
	}			// loop over p
	*t = c;			/* terminating character */
}

/* Fetch line n from the current buffer, or perhaps another buffer.
 * This returns an allocated copy of the string,
 * and you need to free it when you're done.
 * Good grief, how inefficient!
 * I know, but perl use to do it, and I never noticed the slowdown.
 * This is not the Linux kernel, we don't need to be ultra-efficient.
 * We just need to be consistent in our programming efforts.
 * Sometimes the returned line is changed,
 * and if it happens sometimes, we may as well make the new copy
 * all the time, even if the line doesn't change, to be consistent.
 * You can suppress the copy feature with -1. */

pst fetchLineWindow(int n, int show, const Window *w)
{
	struct lineMap *map, *t;
	int dol;
	pst p;			// the resulting copy of the string
	map = w->map;
	dol = w->dol;
	if (n <= 0 || n > dol)
		i_printfExit(MSG_InvalidLineNb, n);
	t = map + n;
	if (show < 0)
		return t->text;
	p = clonePstring(t->text);
	if (show && w->browseMode)
		removeHiddenNumbers(p, '\n', 0, w);
	return p;
}

pst fetchLineContext(int n, int show, int cx)
{
	const Window *w = sessionList[cx].lw;
	if (!w)
		i_printfExit(MSG_InvalidSession, cx);
	return fetchLineWindow(n, show, w);
}

pst fetchLine(int n, int show)
{
	return fetchLineContext(n, show, context);
}

/* Display a line to the screen, with a limit on output length. */
void displayLine(int n)
{
	pst line = fetchLine(n, 1);
	pst s = line;
	int cnt = 0;
	uchar c;
	int output_l = 0;
	char *output = initString(&output_l);
	char buf[10];

	if (cmd == 'n') {
		stringAndNum(&output, &output_l, n);
		stringAndChar(&output, &output_l, ' ');
	}
	if (endMarks && cmd == 'l')
		stringAndChar(&output, &output_l, '^');

	while ((c = *s++) != '\n') {
		bool expand = false;
		if (c == 0 || c == '\r' || c == '\x1b' || c == '\x0e'
		    || c == '\x0f')
			expand = true;
		if (cmd == 'l') {
// show tabs and backspaces via > <
			if (c == '\b')
				c = '<';
			if (c == '\t')
				c = '>';
			if (c < ' ' || c == 0x7f || (c >= 0x80 && listNA))
				expand = true;
		}
		if (expand) {
			sprintf(buf, "~%02X", c), cnt += 3;
			stringAndString(&output, &output_l, buf);
		} else
			stringAndChar(&output, &output_l, c), ++cnt;
		if (cnt >= displayLength)
			break;
	}			// loop over line

	if (cnt >= displayLength)
		stringAndString(&output, &output_l, "...");
	if (cw->dirMode) {
		stringAndString(&output, &output_l, dirSuffix(n));
		if (cw->r_map) {
			s = cw->r_map[n].text;
			if (*s) {
				stringAndChar(&output, &output_l, ' ');
				stringAndString(&output, &output_l, (char *)s);
			}
		}
	}
	if (endMarks && cmd == 'l')
		stringAndChar(&output, &output_l, '$');
	eb_puts(output);

	free(line);
	nzFree(output);
}

void printDot(void)
{
	if (cw->dot)
		displayLine(cw->dot);
	else
		i_puts(MSG_Empty);
}

// Print the string argument if the prompt is on.
// Print the promptString if the string argument is NULL.
void printPrompt(void)
{
	if (promptOn && promptString && isInteractive) {
		printf("%s", promptString);
		fflush(stdout);
	}
}

// These commands pass through jdb and on to normal edbrowse processing.
static bool jdb_passthrough(const char *s)
{
	static const char *const oklist[] = {
		"dberr", "dberr+", "dberr-",
		"dbcn", "dbcn+", "dbcn-",
		"dbev", "dbev+", "dbev-",
		"dbcss", "dbcss+", "dbcss-", "db",
		"P", "P+", "P-",
		"timers", "timers+", "timers-", "tmlist",
		"demin", "demin+", "demin-",
		"jsbg", "jsbg+", "jsbg-",
		"e+", "e-", "eret",
		"bflist", "bglist", "hist", "help", 0
	};
	int i;
	if (s[0] == '!') return true;
	if(s[0] == '<' && (s[1] == '+' || s[1] == '-' || isdigitByte(s[1]))) return true;
	if (s[0] == 'd' && s[1] == 'b' && isdigitByte(s[2]) && s[3] == 0)
		return true;
	if (stringInList(oklist, s) >= 0)
		return true;
// I could pass e through, but e is often a variable.
// Bad enough I pass e3 through; if that is a variable you want to see,
// put a space after it.
	if (s[0] == 'e' && isdigitByte(s[1])) {
		for (i = 2; s[i]; ++i)
			if (!isdigitByte(s[i]))
				break;
		if (!s[i])
			return true;
	}
	if (!strncmp(s, "speed=", 6) && isdigitByte(s[6])) {
		for (i = 6; s[i]; ++i)
			if (!isdigitByte(s[i]))
				break;
		if (!s[i])
			return true;
	}
	if(!strncmp(s, "bflist/", 7) || !strncmp(s, "bflist?", 7) ||
	!strncmp(s, "hist/", 5) || !strncmp(s, "hist?", 5) ||
	!strncmp(s, "P ", 2) || !strncmp(s, "P=", 2))
		return true;
	return false;
}

void passToJdb(char *s)
{
	char *resfile = NULL;
	char *result;
	FILE *f = NULL;
// ^> indicates redirection, since > might be a greater than operator.
	resfile = strstr(s, "^>");
	if (resfile) {
		*resfile = 0;
		resfile += 2;
		while (isspaceByte(*resfile))
			++resfile;
	}
	cf = cw->jdb_frame;
	result = jsRunScriptWinResult(s, "jdb", 1);
	if (resfile)
		f = fopen(resfile, "we");
	if (result) {
		if (f) {
			fprintf(f, "%s\n", result);
			printf("%zu bytes\n", strlen(result));
		} else
			puts(result);
	}
	nzFree(result);
	if (f)
		fclose(f);
	if (newlocation) {
		puts("sorry, page redirection is not honored under jdb.");
		nzFree(newlocation);
		newlocation = 0;
		newlocation = 0;
	}
}

/* By default, readline's filename completion appends a single space
 * character to a filename when there are no alternative completions.
 * Since the r, w, and e commands treat spaces literally, this default
 * causes tab completion to behave unintuitively in edbrowse.
 * Solution: write our own completion function,
 * which wraps readline's filename completer.  */

static char *edbrowse_completion(const char *text, int state)
{
	rl_completion_append_character = '\0';
	return rl_filename_completion_function(text, state);
}

static uchar histcontrol;
void initializeReadline(void)
{
	rl_completion_entry_function = edbrowse_completion;
	promptString = cloneString("*");
	const char *hc = getenv("HISTCONTROL");
	const char *s;
	if(!hc) return;
	s = strstr(hc, "ignorespace");
	if(s && (s == hc || s[-1] == ':') &&
	(s[11] == ':' || s[11] == 0))
		histcontrol |= 1;
	s = strstr(hc, "ignoredups");
	if(s && (s == hc || s[-1] == ':') &&
	(s[10] == ':' || s[10] == 0))
		histcontrol |= 2;
	s = strstr(hc, "ignoreboth");
	if(s && (s == hc || s[-1] == ':') &&
	(s[10] == ':' || s[10] == 0))
		histcontrol |= 3;
}

/*********************************************************************
Get a line from standard in.  Need not be a terminal.
This routine returns the line in a string, which is allocated,
but nonetheless you should not free it; I free it upon the next input call.
It has to be allocated because of readline().

~xx is converted from hex, a way to enter nonascii chars.
This is the opposite of displayLine() above.
But you can't enter a newline this way; I won't permit it.
The only newline is the one corresponding to the end of your text,
when you hit enter. This terminates the line.
As we described earlier, this is a perl string.
It may contain nulls, and is terminated by newline.
Enter ~u hex digits for higher unicodes, emojis etc.
The program exits on EOF.
If you hit interrupt at this point, I print a message
and ask for your line again.

Here are some thoughts on when to rerender and announce any changes to the user.
I rerender here because this is the foreground window, and I'm looking for input.
Other buffers could be changing, but that can wait; you're not looking at those right now.
If you switch to one of those, you may get a change message after the context switch.
So here's what I want.
If you have pushed a button or made a change to a form that invokes js,
then you want to see any changes, right now, that result from that action.
However, timers can also change the buffer in the background.
A line could be updating every second, but no one wants to see that.
So only rerender every 20 seconds.
mustrender is set if any js happens, and cleared after rerender.
It starts out clear when the buffer is first browsed.
nextrender is the suggested time to render again, if js changes have been made.
It is generally 20 seconds after the last render.
*********************************************************************/

pst inputLine(const bool textEntry)
{
	static char line[MAXTTYLINE];
	int i, j, len;
	uchar c, d, e;
	static char *last_rl, *s;
	int delay_sec, delay_ms;

top:
	intFlag = false;
	inInput = true;
	intStart = 0;
	nzFree(last_rl), last_rl = 0;
	s = 0;

	if (timerWait(&delay_sec, &delay_ms)) {
/* timers are pending, use select to wait on input or run the first timer. */
		fd_set channels;
		int rc;
		struct timeval tv;

/* a false timer will fire when time to rerender */
		if (cw->mustrender) {
			time_t now;
			time(&now);
			if (now >= cw->nextrender) {
				jSyncup(true, 0);
				rerender(0);
			}
		}

		tv.tv_sec = delay_sec;
		tv.tv_usec = delay_ms * 1000;

/*********************************************************************
This will take some explaining.
There is a surprising interaction between readline() and javascript timers.
It is not a problem in cooked mode, i.e., with readline turned off.
Watch what happens in cooked mode.
select() waits for input, and also has a timeout for the next timer.
select() returns which ever happens first.
The input is the line that the tty device driver gathers,
after you typed it in and hit return.
Until you hit return, the device driver is managing everything,
echo, backspace, etc.
edbrowse is free to respond to a timer, if it is ready to run before you have
finished typing your line.
Think of the tty, and your input, as a separate thread.
All good, but turn readline on and see what happens.
When readline is running, and gathering input, it puts the tty in raw mode.
It responds to each character, and can complete words or lines based on earlier
input, and other such magic.
But readline is not in control when we are waiting in select,
and we are waiting in select whenever there is a timer pending,
and thanks to promise polling and interframe messages and such,
there is always a timer pending, thus we are always in select.
The tty is in cooked mode, and readline is not doing its job.
Finally, with none of the readline features working, and in frustration,
you hit return, just to enter something.
That completes the line and the tty passes it to edbrowse.
select sees input, and responds.
Since we are in readline mode, it calls readline().
readline puts the tty in raw mode, but no matter, the keystrokes are already
queued up; they come pouring in as though you typed them in just now.
readline re-echos the keystrokes, which were already echoed in cooked mode,
so you see your input line twice.
Plus, you don't get to use the readline interactive features,
which is why you turned on readline mode in the first place.
Ok, here is how I work around it.
	if(inputReadLine) ttyRaw();
	select();
	if(inputReadLine) ttyCooked();
So what does that do?
The first character you type passes to edbrowse, since the tty is raw.
This triggers select, and we are headed down the input path.
We call readline, and it is in control.
It puts the tty back into raw mode,
and responds in the usual way as you enter your line of input.
While you are doing this, timers do not run, promise jobs do not run,
all of edbrowse stops.
I don't think this is a terrible thing, and some might say it's a good thing.
Once you complete your line,
readline passes it back to edbrowse, which acts upon it in the usual way.
At this point, timers and pending jobs resume.
Back around to top, tty back into raw mode, wait for the next timer
or the first keystroke, and repeat.
There - 50 lines of comments to explain 2 lines of code.
-
Now, here is a followup from the future.
I said it was no problem if all the javascript timers stopped while we were
in readline, but then I implemented the irc client, which receives pings from
the server, and must pong back in a timely fashion.
If you are stuck in readline for 2 minutes composing your thoughts,
pong does not go back, and the irc connection drops.
There is a work around for this, which is documented in isup.c.
thus the call to ircReadlineControl().
*********************************************************************/

		memset(&channels, 0, sizeof(channels));
		FD_SET(0, &channels);
		if(inputReadLine) ttyRaw(1, 0, false);
		rc = select(1, &channels, 0, 0, &tv);
		if(inputReadLine) ttyRestoreSettings();

		if (rc < 0)
			goto interrupt;
		if (rc == 0) {	/* timeout */
			inInput = false;
			runTimer();
			inInput = true;
			intFlag = false;

// in case a timer set document.location to a new page, or opens a new window
			if (newlocation) {
				debugPrint(2, "redirect %s", newlocation);
				if (newloc_f->owner != cw) {
// background window; we shouldn't even be here!
					printf((newloc_r ?
						"redirection of a background window to %s is not implemented\n"
						:
						"background window opening %s is not implemented\n"),
					       newlocation);
					nzFree(newlocation);
					newlocation = 0;
				} else {
					s = allocMem(strlen(newlocation) + 8);
					sprintf(s, "%sb %s\n",
						(newloc_r ? "ReF@" : ""),
						newlocation);
					nzFree(newlocation);
					newlocation = 0;
/* to free next time */
					last_rl = s;
					return (uchar *) s;
				}
			}
			goto top;
		}
	}

	if (cw->mustrender) {
/* in case jSyncup runs again */
		rebuildSelectors();
	}

	if (inputReadLine && isInteractive) {
		ircReadlineControl();
		if(promptOn && promptString && !textEntry) {
			printf("\r");
			last_rl = readline(promptString);
		} else {
			last_rl = readline("");
		}
		ircReadlineRelease();
		if (last_rl != NULL && *last_rl &&
		(!(histcontrol&1) || *last_rl != ' ')) {
			if(!(histcontrol&2)) {
				add_history(last_rl);
			} else {
				HIST_ENTRY *last_history_entry = history_get(history_length);
				if (last_history_entry == NULL || strcmp(last_rl, last_history_entry->line))
					add_history(last_rl);
			}
		}
		s = last_rl;
	} else {
		while (fgets(line, sizeof(line), stdin)) {
// A bug in my keyboard causes nulls to be entered from time to time.
			c = 0;
			i = 0;
			while ((unsigned)i < sizeof(line) - 1 && (c = line[i]) != '\n') {
				if (c == 0)
					line[i] = ' ';
				++i;
			}
			if (last_rl) {
// paste this line piece onto the growing line.
// This is not very efficient, but it hardly ever happens.
				len = strlen(last_rl);
// with nulls transliterated, strlen() returns the right answer
				i = strlen(line);
				last_rl = reallocMem(last_rl, len + i + 1);
				strcpy(last_rl + len, line);
			}
			if (c == '\n')
				goto tty_complete;
			if (!last_rl)
				last_rl = cloneString(line);
		}
		goto interrupt;
tty_complete:
		if (last_rl)
			s = last_rl;
		else
			s = line;
	}

	if (!s) {
interrupt:
		if (intFlag)
			goto top;
		i_puts(MSG_EndFile);
		ebClose(1);
	}
	inInput = false;
	intFlag = false;

	i = j = 0;
	len = strlen(s);
// no matter what, the last char, at len-1, should be \n

	if (debugFile)
		fprintf(debugFile, "* ");
	while (i < len && (c = s[i]) != '\n') {
		if (debugFile)
			fputc(c, debugFile);

		if (c != '~') {
addchar:
			s[j++] = c;
			++i;
			continue;
		}

// various encodings indicated by ~
		d = s[i + 1];
// ~~ becomes a literal ~
		if (d == '~') {
			++i;
			goto addchar;
		}

		e = 0;
		if (d)
			e = s[i + 2];
		if (d == 'u' && isxdigit(e)) { // unicode
			unsigned int unicode;
			char *t;
			int l;
			unicode = strtol((char *)s + i + 2, &t, 16);
			if (*t == ';')
				++t;
			i = t - s;
			if (cons_utf8) {
				t = uni2utf8(unicode);
				l = strlen(t);
				memcpy(s + j, t, l);
				j += l;
			} else {
				t[j++] = ((c&0x80) ? '?' : c);
			}
			continue;
		}

		if (d == 'j' && isalnumByte(e)) { // emoji
			char *response;
			int k = i + 1, l;
			while(isalnumByte(s[k])) ++k;
			if(s[k] == '.' && isalnumByte(s[k+1])) {
				k += 2;
				while(isalnumByte(s[k])) ++k;
			}
			response = selectEmoji(s + i + 2, k - i - 2);
			if(!response) {
				i_puts(MSG_Stop);
// @@ is our symbol for giving up on the emoji, you can fix it later
				i = k, s[j++] = '@', s[j++] = '@';
				continue;
			}
			debugPrint(3, "%s", response);
			l = strlen(response);
			if(j + l <= k) {
				memcpy(s + j, response, l);
				i = k, j += l;
				nzFree(response);
				continue;
			}
// This is the case that gives me a headache!
// The emoji string doesn't fit in the line; we have to expand the line.
			if(last_rl) {
// already allocated, cool, just realloc
				last_rl = s = reallocMem(s, len + 1 + l);
			} else {
				last_rl = s = allocMem(len + l + 1);
				strcpy(s, line);
			}
			strmove(s + i + l, s + i);
			memcpy(s + j, response, l);
			i = k + l, j += l, len += l;
			nzFree(response);
			continue;
		}

		if (!isxdigit(d) || !isxdigit(e))
			goto addchar;

		c = fromHex(d, e);
		if (c == '\n')
			c = 7;
		i += 2;
		goto addchar;
	}			// loop over input chars

	s[j] = 0;
	if (debugFile)
		fputc('\n', debugFile);

	if (cw->jdb_frame) {
// some edbrowse commands pass through.
		if (jdb_passthrough(s))
			goto eb_line;
		if (stringEqual(s, "bye")) {
			cw->jdb_frame = NULL;
			puts("bye");
			jSideEffects();
// in case you changed objects that in turn change the screen.
			rerender(0);
		} else {
			passToJdb(s);
		}
		printPrompt();
		goto top;
	}

eb_line:
/* rest of edbrowse expects this line to be nl terminated */
	s[j] = '\n';
	return (uchar *) s;
}

static struct {
	char lhs[MAXRE], rhs[MAXRE];
	bool lhs_yes, lhs_bang, lhs_ci, rhs_yes;
	char temp_lhs[MAXRE], temp_rhs[MAXRE];
} globalSubs;

void saveSubstitutionStrings(void)
{
	if (!searchStringsAll)
		return;
	if (!cw)
		return;
	globalSubs.lhs_yes = cw->lhs_yes;
	globalSubs.lhs_bang = cw->lhs_bang;
	globalSubs.lhs_ci = cw->lhs_ci;
	strcpy(globalSubs.lhs, cw->lhs);
	globalSubs.rhs_yes = cw->rhs_yes;
	strcpy(globalSubs.rhs, cw->rhs);
}

void restoreSubstitutionStrings(Window *nw)
{
	if (!searchStringsAll)
		return;
	if (!nw)
		return;
	nw->lhs_yes = globalSubs.lhs_yes;
	nw->lhs_bang = globalSubs.lhs_bang;
	nw->lhs_ci = globalSubs.lhs_ci;
	strcpy(nw->lhs, globalSubs.lhs);
	nw->rhs_yes = globalSubs.rhs_yes;
	strcpy(nw->rhs, globalSubs.rhs);
}

/* Create a new window, with default variables. */
Window *createWindow(void)
{
	Window *nw;	// the new window
	nw = allocZeroMem(sizeof(Window));
	saveSubstitutionStrings();
	restoreSubstitutionStrings(nw);
	nw->f0.gsn = ++gfsn;
	return nw;
}

// For debugging only, print a line, could be null or nl terminated.
// Thus a line with embedded null will be chopped.
static void print_pst(pst p)
{
	do {
		if (debugFile)
			fprintf(debugFile, "%c", *p);
		else
			printf("%c", *p);
		if(*p == '\n') return;
	} while (*++p);
	if (debugFile)
		fprintf(debugFile, "\n");
		else
			printf("\n");
}

static void freeLine(struct lineMap *t)
{
	if(!t->text || t->text == (uchar*)emptyString) return;
	if (debugLevel >= 8) {
		if (debugFile)
			fprintf(debugFile, "free ");
		else
			printf("free ");
		print_pst(t->text);
	}
	nzFree(t->text);
}

void freeWindowLines(struct lineMap *map)
{
	struct lineMap *t;
	int cnt = 0;

	if ((t = map)) {
		for (++t; t->text; ++t) {
			freeLine(t);
			++cnt;
		}
		free(map);
	}

	debugPrint(6, "freeWindowLines = %d", cnt);
}

/*********************************************************************
Garbage collection for text lines.
There is an undo window that holds a snapshot of the buffer as it was before.
not a copy of all the text, but a copy of map,
and dot and dollar and some other things.
This starts out with map = 0.
The u command swaps undoWindow and current window (cw).
Thus another u undoes your undo.
You cannot step back through all your changes,
popping a stack like a modern editor. Sorry.
Just don't screw up more than once,
and don't save your file til you're sure it's ok.
No autosave feature here, I never liked that anyways.
So at the start of every command not under g//, set madeChanges = false.
If we're about to change something in the buffer, set madeChanges = true.
But if madeChanges was false, i.e. this is the first change coming,
call undoPush().
This pushes the undo window off the cliff,
and that means we have to free the text first.
Call undoCompare().
This finds any lines in the undo window that aren't in cw and frees them.
That is a quicksort on both maps and then a comm -23.
Then it frees undoWindow.map just to make sure we don't free things twice.
Then undoPush copies cw onto undoWindow, ready for the u command.
Return, and the calling function makes its change.
But we call undoCompare at other times, like switching buffers,
pop the window stack, browse, or quit.
These make undo impossible, so free the lines in the undo window.
*********************************************************************/

static bool madeChanges;
static Window undoWindow;

/* quick sort compare */
static int qscmp(const void *s, const void *t)
{
	return memcmp(s, t, sizeof(char *));
}

/* Free undo lines not used by the current session. */
void undoCompare(void)
{
	const struct lineMap *cmap = cw->map;
	struct lineMap *map = undoWindow.map;
	struct lineMap *cmap2;
	struct lineMap *s, *t;
	int diff, cnt = 0;

	if (!cmap) {
		debugPrint(6, "undoCompare no current map");
		freeWindowLines(undoWindow.map);
		undoWindow.map = 0;
		return;
	}

	if (!map) {
		debugPrint(6, "undoCompare no undo map");
		return;
	}

/* sort both arrays, run comm, and find out which lines are not needed any more,
then free them.
 * Use quick sort; some files are a million lines long.
 * I have to copy the second array, so I can sort it.
 * The first I can sort in place, cause it's going to get thrown away. */

	cmap2 = allocMem((cw->dol + 2) * LMSIZE);
	memcpy(cmap2, cmap, (cw->dol + 2) * LMSIZE);
	debugPrint(8, "qsort %d %d", undoWindow.dol, cw->dol);
	qsort(map + 1, undoWindow.dol, LMSIZE, qscmp);
	qsort(cmap2 + 1, cw->dol, LMSIZE, qscmp);

	s = map + 1;
	t = cmap2 + 1;
	while (s->text && t->text) {
		diff = memcmp(s, t, sizeof(char *));
		if (!diff) {
			++s, ++t;
			continue;
		}
		if (diff > 0) {
			++t;
			continue;
		}
		freeLine(s);
		++s;
		++cnt;
	}

	while (s->text) {
		freeLine(s);
		++s;
		++cnt;
	}

	free(cmap2);
	free(map);
	undoWindow.map = 0;
	debugPrint(6, "undoCompare strip %d", cnt);
}

static void undoPush(void)
{
	Window *uw;

// if in browse mode, we really shouldn't be here at all!
// But we could if substituting on an input field, since substitute is also
// a regular ed command.
	if (cw->browseMode | cw->sqlMode | cw->dirMode | cw->ircoMode | cw->imapMode1 | cw->imapMode2)
		return;
	if (madeChanges)
		return;
	madeChanges = true;
	debugPrint(6, "undoPush");

	cw->undoable = true;
	if (!cw->quitMode)  cw->changeMode = true;

	undoCompare();

	uw = &undoWindow;
	uw->dot = cw->dot;
	uw->dol = cw->dol;
	memcpy(uw->labels, cw->labels, MARKLETTERS * sizeof(int));
	uw->binMode = cw->binMode;
	uw->nlMode = cw->nlMode;
	uw->dirMode = cw->dirMode;
	uw->dnoMode = cw->dnoMode;
	if (cw->map) {
		uw->map = allocMem((cw->dol + 2) * LMSIZE);
		memcpy(uw->map, cw->map, (cw->dol + 2) * LMSIZE);
	}
}

static void freeWindow(Window *w)
{
	Frame *f, *fnext;
	struct histLabel *label, *lnext;
	freeTags(w);
	for (f = &w->f0; f; f = fnext) {
		fnext = f->next;
		delTimers(f);
		freeJSContext(f);
		nzFree(f->dw), f->dw = 0;
		nzFree(f->hbase), f->hbase = 0;
		nzFree(f->fileName), f->fileName = 0;
		nzFree(f->firstURL), f->firstURL = 0;
		if (f != &w->f0)
			free(f);
	}
	lnext = w->histLabel;
	while ((label = lnext)) {
		lnext = label->prev;
		free(label);
	}
	freeWindowLines(w->map);
	freeWindowLines(w->r_map);
	nzFree(w->dmap);
	nzFree(w->htmltitle);
	nzFree(w->htmlauthor);
	nzFree(w->htmldesc);
	nzFree(w->htmlgen);
	nzFree(w->htmlkey);
	nzFree(w->saveURL);
	nzFree(w->mailInfo);
	nzFree(w->referrer);
	nzFree(w->baseDirName);
	nzFree(w->mail_raw);
// only cleanup the curl handle on imapmode 1, if you try it again on 2 it will blow up.
	if(w->imapMode1 && w->imap_h) imapCleanupInBackground(w->imap_h);
	if(w->irciMode) {
		Window *w2 = sessionList[w->ircOther].lw;
// w2 should always be there
		if(w2 && w2->ircoMode) {
			if(--w2->ircCount == 0) {
				w2->ircoMode = false;
				nzFree(w2->f0.fileName), w2->f0.fileName = 0;
			} else {
// I have to clear the channel here so the file name comes out right.
				nzFree(w->ircChannel), w->ircChannel = 0;
				ircSetFileName(w2);
			}
		}
		ircClose(w);
	}
	if(w->ircoMode) {
		int i;
		Window *w2;
		for(i = 1; i <= maxSession; ++i) {
			w2 = sessionList[i].lw;
			if(!w2 || !w2->irciMode || w2->ircOther != w->sno) continue;
			ircClose(w2);
		}
	}
	free(w);
}

void freeWindows(int cx, bool all)
{
	struct ebSession *s = &sessionList[cx];
	Window *w = s->lw2;
while (w) {
		Window *p = w->prev;
		freeWindow(w);
		w = p;
	}
	s->fw2 = s->lw2 = 0;
	if(!all) return;
	w = s->lw;
	while (w) {
		Window *p = w->prev;
		freeWindow(w);
		w = p;
	}
	s->fw = s->lw = 0;
}

/*********************************************************************
Here are a few routines to switch contexts from one session to another.
This is how the user edits multiple sessions, or browses multiple
web pages, simultaneously.
*********************************************************************/

bool cxCompare(int cx)
{
	if (cx == 0) {
		setError(MSG_Session0);
		return false;
	}
	if (cx >= MAXSESSION) {
		setError(MSG_SessionHigh, cx, MAXSESSION - 1);
		return false;
	}
	if (cx != context)
		return true;	/* ok */
	setError(MSG_SessionCurrent, cx);
	return false;
}

// is a context active?
// If error is true then record an error if not active.
bool cxActive(int cx, bool error)
{
	if (cx > 0 && cx <= maxSession && sessionList[cx].lw)
		return true;
	if(error)
		setError(MSG_SessionInactive, cx);
	return false;
}

static void cxInit(int cx)
{
	Window *lw = createWindow();
	if (sessionList[cx].lw)
		i_printfExit(MSG_DoubleInit, cx);
	sessionList[cx].fw = sessionList[cx].lw = lw;
	lw->sno = cx;
	if (cx > maxSession)
		maxSession = cx;
}

bool cxQuit(int cx, int action)
{
	Window *w = sessionList[cx].lw;
	if (!w)
		i_printfExit(MSG_QuitNoActive, cx);

// action = 3 means we can trash data
	if (action == 3)
		w->changeMode = false, action = 2;

// We might be trashing data, make sure that's ok.
	if (w->changeMode && // something has changed
	    lastq != cx && // last command was not q
	    !ismc && // not in fetch mail mode, which reuses the same buffer
	    !(w->dirMode | w->sqlMode | w->ircoMode) &&
	    (!w->f0.fileName || !isURL(w->f0.fileName))) { // not a URL
		lastqq = cx;
		setError(MSG_ExpectW);
		if (cx != context)
			setError(MSG_ExpectWX, cx);
		return false;
	}

	if (!action)
		return true;	// just a test

	if (cx == context) {
/* Don't need to retain the undo lines. */
		undoCompare();
	}

	if (action == 2)
		freeWindows(cx, true);
	else
		freeWindow(w);

	if (cx == context) {
		cw = 0;
		cf = 0;
	}

	return true;
}

/* Switch to another edit session.
 * This assumes cxCompare has succeeded - we're moving to a different context.
 * Pass the context number and an interactive flag. */
void cxSwitch(int cx, bool interactive)
{
	bool created = false;
	Window *nw = sessionList[cx].lw;	// the new window
	if (!nw) {
		cxInit(cx);
		nw = sessionList[cx].lw;
		created = true;
	} else {
		saveSubstitutionStrings();
		restoreSubstitutionStrings(nw);
	}

	if (cw) {
		undoCompare();
		cw->undoable = false;
	}
	cw = nw;
	selfFrame();
	cs = sessionList + cx;
	cx_previous = context, context = cx;
// You could switch sessions, update a textarea, which is technically an input
// field, then switch back to the window that contains that form.
// We need to sync up javascript before taking any action.
	jClearSync();
	if (interactive && debugLevel) {
		if (created)
			i_printf(MSG_SessionNew);
		else if (cw->htmltitle)
			i_printf(MSG_String, cw->htmltitle);
		else if (cf->fileName)
			i_printf(MSG_String, cf->fileName);
		else
			i_printf(MSG_NoFile);
		if (cw->jdb_frame)
			i_printf(MSG_String, " jdb");
		eb_puts("");
	}

// The next line is required when this function is called from main(),
// when the first arg is a url and there is a second arg.
	startRange = endRange = cw->dot;
}

static struct lineMap *newpiece;

/* Adjust the map of line numbers -- we have inserted text.
 * Also shift the downstream labels.
 * Pass the string containing the new line numbers, and the dest line number. */
static int *nextLabel(int *label);
void addToMap(int nlines, int destl)
{
	struct lineMap *newmap;
	bool *newg;
	int svdol = cw->dol;
	int *label = NULL;

	if (nlines == 0)
		i_printfExit(MSG_EmptyPiece);

	if (nlines > MAXLINES - cw->dol)
		i_printfExit(MSG_LineLimit);

// browse has no undo command
	if (!(cw->browseMode | cw->dirMode | cw->ircoMode | cw->imapMode1 | cw->imapMode2))
		undoPush();

/* move the labels */
	while ((label = nextLabel(label))) {
		if (*label > destl)
			*label += nlines;
	}
	cw->dol += nlines;
	if(!cw->ircoMode)
		cw->dot = destl + nlines;
	else if(!cw->dot) cw->dot = 1;

	newmap = allocMem((cw->dol + 2) * LMSIZE);
	if (destl)
		memcpy(newmap, cw->map, (destl + 1) * LMSIZE);
	else
		memset(newmap, 0, LMSIZE);
// insert new piece here
	memcpy(newmap + destl + 1, newpiece, nlines * LMSIZE);
// put on the last piece
	if (destl < svdol)
		memcpy(newmap + destl + nlines + 1, cw->map + destl + 1,
		       (svdol - destl + 1) * LMSIZE);
	else
		memset(newmap + destl + nlines + 1, 0, LMSIZE);
	nzFree(cw->map);
	cw->map = newmap;
	free(newpiece);
	newpiece = 0;

	if(cw->ircoMode1) {
// capture the time stamp of the added lines in irc mode.
// This isn't very space efficient, but an irc buffer isn't going to get very large.
		int i;
		time_t t;
		const char *timestring;
		time(&t);
		timestring = conciseTime(t);
// this is just like what we did above with map
		newmap = allocZeroMem((cw->dol + 2) * LMSIZE);
		if (destl) {
// part that was already there
			if(cw->r_map) {
				memcpy(newmap, cw->r_map, (destl + 1) * LMSIZE);
			} else {
				for(i = 1; i <= destl; ++i)
					newmap[i].text = (uchar*)emptyString;
			}
		}
// the added lines
		for(i = 1; i <= nlines; ++i)
			newmap[destl + i].text = cw->ircoMode ? (uchar*)cloneString(timestring) : (uchar*)emptyString;
// put on the last piece
		if (destl < svdol) {
// Stuff is not going in at the end, means this is not the first irc,
// or the first imap, means r_map should be there!
			memcpy(newmap + destl + nlines + 1, cw->r_map + destl + 1,
			       (svdol - destl + 1) * LMSIZE);
		}
		nzFree(cw->r_map);
		cw->r_map = newmap;
	}

	if(!gflag) return;
// Next line is for g/pattern/ .w2@.
// We have switched to session 2 to write the line. Now in addToMap, session 2.
// gflag is still there, but it is for session 1.
	if(gflag_w != cw) return;

	newg = allocMem(cw->dol + 1);
	if (destl)
		memcpy(newg, gflag, destl + 1);
	memset(newg + destl + 1, 0, nlines);
	if (destl < svdol)
		memcpy(newg + destl + nlines + 1, gflag + destl + 1,
		       (svdol - destl));
	free(gflag), gflag = newg;
}

static int text2linemap(const uchar *inbuf, int length, bool *nlflag)
{
	int i, j, lines = 0;
	struct lineMap *t;

	*nlflag = false;
	if (!length)		// nothing to add
		return lines;

	for (i = 0; i < length; ++i)
		if (inbuf[i] == '\n') {
			++lines;
			if (lines + cw->dol > MAXLINES)
				i_printfExit(MSG_LineLimit);
		}

	if (inbuf[length - 1] != '\n') {
// doesn't end in newline
		++lines, *nlflag = true;
	}

	newpiece = t = allocZeroMem(lines * LMSIZE);
	i = 0;
	while (i < length) {	// another line
		j = i;
		while (i < length)
			if (inbuf[i++] == '\n')
				break;
		if (inbuf[i - 1] == '\n') {
// normal line
			t->text = allocMem(i - j);
		} else {
// last line with no nl
			t->text = allocMem(i - j + 1);
			t->text[i - j] = '\n';
		}
		memcpy(t->text, inbuf + j, i - j);
		++t;
	}			// loop breaking inbuf into lines
	return lines;
}

// Add a block of text into the buffer; uses text2linemap() and addToMap().
bool addTextToBuffer(const uchar *inbuf, int length, int destl, bool showtrail)
{
	bool nlflag;
	int lines = text2linemap(inbuf, length, &nlflag);
	if(!lines) return true;
	if (destl == cw->dol)
		cw->nlMode = false;
	if (nlflag && destl == cw->dol) {
		cw->nlMode = true;
		if (cmd != 'b' && !cw->binMode && showtrail)
			i_puts(MSG_NoTrailing);
	}
	addToMap(lines, destl);
	return true;
}

void addTextToBackend(const char *inbuf)
{
	bool nlflag;
	int length = strlen(inbuf);
	int i, lines = text2linemap((const uchar *)inbuf, length, &nlflag);
	if(!lines) return;
	struct lineMap *newmap = allocMem((cw->dol + 2) * LMSIZE);
	memset(newmap, 0, LMSIZE);
	memcpy(newmap + 1, newpiece, lines * LMSIZE);
	memset(newmap + lines + 1, 0, LMSIZE);
// these should be c strings not perl strings
	for(i = 1; i <= lines; ++i) {
		char *s = strchr((char*)newmap[i].text, '\n');
		if(s) *s = 0;
	}
	if(cw->r_map) puts("r_map overwrite!");
	cw->r_map = newmap;
	nzFree(newpiece);
	newpiece = 0;
}

// Pass input lines straight into the buffer until the user enters .

static bool inputLinesIntoBuffer(void)
{
	uchar *line;
	int linecount = 0, cap;
	struct lineMap *t;
/* I would use the static variable newpiece to build the new map of lines,
 * as other routines do, but this one is multiline input, and a javascript
 * timer can sneak in and add text, thus clobbering newpiece,
 * so I need a local variable. */
	struct lineMap *np;

	cap = 128;
	np = t = allocZeroMem(cap * LMSIZE);

	if(!inscript) {
		if (linePending) line = linePending;
		else line = inputLine(true);
	} else {
		line = (uchar *)getInputLineFromScript();
		if(!line) goto fail;
	}

	while (line[0] != '.' || line[1] != '\n') {
		if (linecount == cap) {
			cap *= 2;
			np = reallocMem(np, cap * LMSIZE);
			t = np + linecount;
		}
		if(inscript) {
			if(!memcmp(line, "*.@sub~$`corner", 15))
				line = (uchar*)cloneString(".\n");
		} else line = clonePstring(line);
		t->text = line;
		++t, ++linecount;
		if(!inscript)  line = inputLine(true);
		else line = (uchar *)getInputLineFromScript();
		if(!line) goto fail;
	}

	nzFree(linePending);
	linePending = 0;

	if (!linecount) {	/* no lines entered */
		free(np);
		cw->dot = endRange;
		if (!cw->dot && cw->dol)
			cw->dot = 1;
		return true;
	}

	if (endRange == cw->dol)
		cw->nlMode = false;
	newpiece = np;
	addToMap(linecount, endRange);
	return true;

fail:
	for(t = np; t < np + linecount; ++t)
		free(t->text);
	free(np);
	nzFree(linePending);
	linePending = 0;
	return false;
}

// Compress a/b/.. back to a, when going to a parent directory
static void stripDotDot(char *path)
{
	int l = strlen(path);
	char *u;
	if (l < 3 || strncmp(path + l - 3, "/..", 3))
		return;
	if (l == 3) {		// parent of root is root
		path[1] = 0;
		return;
	}
	if (stringEqual(path, "./..")) {
		strcpy(path, "..");
		return;
	}
// lop it off; I may have to put it back later
	l -= 3;
	path[l] = 0;
	if (l >= 2 && path[l - 1] == '.' && path[l - 2] == '.' &&
	    (l == 2 || path[l - 3] == '/')) {
		path[l] = '/';
		return;
	}
	u = strrchr(path, '/');
	if (u && u[1]) {
// in case it was /bin
		if (u == path)
			u[1] = 0;
		else
			u[0] = 0;
		return;
	}
// at this point it should be a directory in the current directory.
	strcpy(path, ".");
}

static int *nextLabel(int *label)
{
	if (label == NULL)
		return cw->labels;

	if (label >= cw->labels && label < cw->labels + MARKLETTERS - 1)
		return label + 1;

	/* first history label */
	if (label == cw->labels + MARKLETTERS - 1)
		return (int *)cw->histLabel;

	/* previous history label. */
	/* in both case we rely on label being first element of the struct */
	return (int *)((struct histLabel *)label)->prev;
}

/* Delete a block of text. */
void delText(int start, int end)
{
	int i, ln;
	int *label = NULL;

// browse / sql / irc has no undo command.
	if (cw->browseMode | cw->sqlMode | cw->ircoMode | cw->imapMode1 | cw->imapMode2) {
		for (ln = start; ln <= end; ++ln)
			nzFree(cw->map[ln].text);
	} else {
		undoPush();
	}

	if (end == cw->dol)
		cw->nlMode = false;
	i = end - start + 1;
	memmove(cw->map + start, cw->map + end + 1,
		(cw->dol - end + 1) * LMSIZE);

	if ((cw->dirMode | cw->ircoMode1 | cw->imapMode1 | cw->imapMode2) && cw->r_map) {
// if you are looking at directories with ls-s or some such,
// we have to delete the corresponding stat information.
		for (ln = start; ln <= end; ++ln)
			nzFree(cw->r_map[ln].text);
		memmove(cw->r_map + start, cw->r_map + end + 1,
			(cw->dol - end + 1) * LMSIZE);
	}

	if (cw->dirMode && cw->dmap && end < cw->dol) {
		memmove(cw->dmap + DTSIZE*start, cw->dmap + DTSIZE*(end + 1),
			(cw->dol - end) * DTSIZE);
	}

	if(gflag && end < cw->dol) {
	memmove(gflag + start, gflag + end + 1, cw->dol - end);
	}

/* move the labels */
	while ((label = nextLabel(label))) {
		if ((ln = *label) < start)
			continue;
		if (ln <= end) {
			*label = 0;
			continue;
		}
		*label -= i;
	}

	cw->dol -= i;
	cw->dot = start;
	if (cw->dot > cw->dol)
		cw->dot = cw->dol;
// by convention an empty buffer has no map
	if (!cw->dol) {
		free(cw->map);
		cw->map = 0;
		if ((cw->dirMode | cw->ircoMode1 | cw->imapMode1 | cw->imapMode2) && cw->r_map) {
			free(cw->r_map);
			cw->r_map = 0;
		}
		if (cw->dirMode && cw->dmap) {
			free(cw->dmap);
			cw->dmap = 0;
		}
	}
}

// for g/re/d or v/re/d,  only a text file
// Algorithm is linear not quadratic.
// n+1 is number of lines to delete.
// It is a challenge to make this function behave exactly as edbrowse would,
// if we were running d on each marked line.
static bool delTextG(char action, int n, int back)
{
	int i, j, k;
	int *label;
	struct lineMap *t, *t2 = 0;
	char *t1 = 0;
	bool rc = true;

	debugPrint(3, "mass delete %d %d", back, n);

	 t = cw->map + 1;
	if(cw->dirMode) t1 = cw->dmap + DTSIZE;
	if((cw->dirMode | cw->ircoMode1) && cw->r_map) t2 = cw->r_map + 1;
	for(i = j = 1; i <= cw->dol; ++i, ++t, t1 ? t1 += DTSIZE : 0, t2 ? ++t2 : 0) {
		if(gflag[i] && rc && j - back <= 0) {
			cw->dot = j;
			setError(j - back < 0 ? MSG_LineLow : MSG_AtLine0);
			rc = false;
		}
		if(gflag[i] && rc && i + n > cw->dol) {
			cw->dot = j;
			setError(MSG_LineHigh);
			rc = false;
		}
		if(gflag[i] && rc && i + n <= cw->dol) { // goodbye
		if(cw->dirMode) {
// mass delete in directory mode is only deleting a single line.
// Honestly what other kind of global delete would you ever do
// in directory mode?
			rc = delFiles(i, i, false, icmd, &cmd);
// in case this fails, set dot to where we are
			cw->dot = j;
		}
	}
		if(gflag[i] && rc && i + n <= cw->dol) {
// did these lines have a label?
			label = NULL;
			while ((label = nextLabel(label)))
				if((*label >= i && *label <= i + n) ||
				(*label < j && *label >= j - back))
					*label = 0;
			undoPush();
			if(i + n == cw->dol)
				cw->nlMode = false;
			j -= back, i += n, t += n;
			if(t1) t1 += n * DTSIZE;
			if(t2) {
				int n2;
				for(n2 = 1; n2 <= back; ++n2)
					nzFree(cw->r_map[j + n2].text);
				for(n2 = 0; n2 <= n; ++n2)
					nzFree(t2[n2].text);
				t2 += n;
			}
			cw->dot = j;
			if(action == 'd') continue;
			k = i + 1;
			if(k <= cw->dol) { displayLine(k); continue; }
			k = j - 1;
			if(k) { displayLine(k); continue; }
			i_puts(MSG_Empty);
			continue;
		}
		if(i > j) {
			cw->map[j] = *t;
			if(t1) memcpy(cw->dmap + j*DTSIZE, t1, DTSIZE);
			if(t2) cw->r_map[j] = *t2;
			label = NULL;
			while ((label = nextLabel(label)))
				if(*label == i)
					*label = j;
		}
		++j;
	}

// map of lines has to null terminate
	cw->map[j] = *t;
// dmap (t1) does not null terminate
	if(t2) cw->r_map[j] = *t2;

	cw->dol = j - 1;
	if (cw->dot > cw->dol)
		cw->dot = cw->dol;
// by convention an empty buffer has no map
	if (!cw->dol) {
		free(cw->map);
		cw->map = 0;
		if(t1) {
			free(cw->dmap);
			cw->dmap = 0;
		}
		if(t2) {
			free(cw->r_map);
			cw->r_map = 0;
		}
	}
	return rc;
}

/* Move or copy a block of text. */
/* Uses range variables, hence no parameters. */
static bool moveCopy(void)
{
	int sr = startRange;
	int er = endRange + 1;
	int dl = destLine + 1;
	int i_sr = sr * LMSIZE;	/* indexes into map */
	int i_er = er * LMSIZE;
	int i_dl = dl * LMSIZE;
	int n_lines = er - sr;
	struct lineMap *map = cw->map;
	struct lineMap *newmap, *t;
	bool *newg;
	int lowcut, highcut, diff, i, ln;
	int *label = NULL;

	if (cmd == 'm' && dl > sr && dl < er) {
		setError(MSG_DestInBlock);
		return false;
	}
	if(!(unfoldRowCheck(startRange)&1) ||
	!(unfoldRowCheck(endRange)&2) ||
	!(unfoldRowCheck(destLine)&2)) {
		setError(MSG_BreakRow);
		return false;
	}
	if (cmd == 'm' && (dl == er || dl == sr)) {
		return true;
	}

	undoPush();

	if (cmd == 't') {
		newpiece = t = allocZeroMem(n_lines * LMSIZE);
		for (i = sr; i < er; ++i, ++t)
			t->text = fetchLine(i, 0);
		addToMap(n_lines, destLine);
		return true;
	}

	if (destLine == cw->dol || endRange == cw->dol)
		cw->nlMode = false;

// All we really need do is rearrange the map.
	newmap = allocMem((cw->dol + 2) * LMSIZE);
	memcpy(newmap, map, (cw->dol + 2) * LMSIZE);
	if (dl < sr) {
		memcpy(newmap + dl, map + sr, i_er - i_sr);
		memcpy(newmap + dl + er - sr, map + dl, i_sr - i_dl);
	} else {
		memcpy(newmap + sr, map + er, i_dl - i_er);
		memcpy(newmap + sr + dl - er, map + sr, i_er - i_sr);
	}
	free(cw->map);
	cw->map = newmap;

	if(gflag) {
		newg = allocMem(cw->dol + 1);
		memcpy(newg, gflag, cw->dol + 1);
		if (dl < sr) {
			memcpy(newg + dl, gflag + sr, er - sr);
			memcpy(newg + dl + er - sr, gflag + dl, sr - dl);
		} else {
			memcpy(newg + sr, gflag + er, dl - er);
			memcpy(newg + sr + dl - er, gflag + sr, er - sr);
		}
		free(gflag);
		gflag = newg;
	}
	
/* now for the labels */
	if (dl < sr) {
		lowcut = dl;
		highcut = er;
		diff = sr - dl;
	} else {
		lowcut = sr;
		highcut = dl;
		diff = dl - er;
	}
	while ((label = nextLabel(label))) {
		ln = *label;
		if (ln < lowcut)
			continue;
		if (ln >= highcut)
			continue;
		if (ln >= startRange && ln <= endRange) {
			ln += (dl < sr ? -diff : diff);
		} else {
			ln += (dl < sr ? n_lines : -n_lines);
		}
		*label = ln;
	}			/* loop over labels */

	cw->dot = endRange;
	cw->dot += (dl < sr ? -diff : diff);
	return true;
}

/* Join lines from startRange to endRange. */
static bool joinText(const char *fs)
{
	int j, size;
	int fslen; // length of field separator
	pst newline, t;

	if (startRange == endRange) {
		setError(MSG_Join1);
		return false;
	}

	if(!fs || !*fs) fs = " ";
	fslen = strlen(fs);
	if(cmd == 'j') fslen = 1;
	size = 0;

	for (j = startRange; j <= endRange; ++j)
		size += pstLength(fetchLine(j, -1)) + fslen - 1;

	t = newline = allocMem(size);
	for (j = startRange; j <= endRange; ++j) {
		pst p = fetchLine(j, -1);
		size = pstLength(p);
		memcpy(t, p, size);
		t += size;
		if (j == endRange) break;
		--t;
		if(cmd == 'J')
			memcpy(t, fs, fslen), t += fslen;
	}

	delText(startRange, endRange);

	newpiece = allocZeroMem(LMSIZE);
	newpiece->text = newline;
	addToMap(1, startRange - 1);

	cw->dot = startRange;
	return true;
}

// for g/re/j or J
// Algorithm is linear not quadratic.
// n+1 is number of lines to join.
static bool joinTextG(char action, int n, int back, const char *fs)
{
	int i, j, k, size;
	int fslen; // length of field separator
	int *label;
	struct lineMap *t;
	pst p1, p2, newline;
	bool rc = true;

	debugPrint(3, "mass join %d %d", back, n);

	if(!(back + n)) {
		setError(MSG_Join1);
		return false;
	}

	if(!fs || !*fs) fs = " ";
	fslen = strlen(fs);
	if(action == 'j') fslen = 1;

	 t = cw->map + 1;
	for(i = j = 1; i <= cw->dol; ++i, ++t) {
		if(i > j) {
			cw->map[j] = *t;
			label = NULL;
			while ((label = nextLabel(label)))
				if(*label == i)
					*label = j;
		}
		if(gflag[i] && rc && j - back <= 0) {
			cw->dot = j;
			setError(j - back < 0 ? MSG_LineLow : MSG_AtLine0);
			rc = false;
		}
		if(gflag[i] && rc && i + n > cw->dol) {
			cw->dot = j;
			setError(MSG_EndJoin);
			rc = false;
		}
		if(gflag[i] && rc && i + n <= cw->dol) { // join
// did the next lines have a label?
			label = NULL;
			while ((label = nextLabel(label)))
				if((*label > i && *label <= i + n) ||
				(*label <= j && *label > j - back))
					*label = 0;
			undoPush();
			for(k = size = 0; k <= n; ++k)
				size += pstLength(fetchLine(i + k, -1)) + fslen - 1;
			for(k = 1; k <= back; ++k)
				size += pstLength(fetchLine(j - k, -1)) + fslen - 1;
			newline = p2 = allocMem(size);
			for(k = back; k > 0; --k) {
				p1 = fetchLine(j - k, -1);
				size = pstLength(p1);
				memcpy(p2, p1, size);
				p2 += size;
				--p2;
				if(action == 'J')
					memcpy(p2, fs, fslen), p2 += fslen;
			}
			for(k = 0; k <= n; ++k) {
				p1 = fetchLine(i + k, -1);
				size = pstLength(p1);
				memcpy(p2, p1, size);
				p2 += size;
				if(k == n) break;
				--p2;
				if(action == 'J')
					memcpy(p2, fs, fslen), p2 += fslen;
			}
			j -= back;
			cw->map[j].text = newline;
			cw->dot = j;
			i += n, t += n; // skip past joined lines
		}
		++j;
	}

// map of lines has to null terminate
	cw->map[j] = *t;

	cw->dol = j - 1;
	if (cw->dot > cw->dol)
		cw->dot = cw->dol;
	return rc;
}

// Read a file, or url, into the current buffer.
static bool readFile(const char *filename, bool newwin,
		     int fromframe, const char *fromthis, const char *orig_head,
uchar prebrowse, const Tag *gotag)
{
	char *rbuf;		// the read buffer
	int readSize;		// should agree with fileSize
	bool rc;		// return code
	bool fileprot = false;
	const char *hash;
	char *h;
	char filetype;
	int inparts = 0;
	int partSize = 0;
	bool firstPart;

	serverData = 0;
	serverDataLen = 0;

	if (newwin) {
		nzFree(cw->saveURL);
		cw->saveURL = cloneString(filename);
	}

	if(memEqualCI(filename, "file:", 5)) {
		filename += 5;
		if(filename[0] == '/' && filename[1] == '/')
			filename += 2;
		if (!*filename) {
			setError(MSG_MissingFileName);
			return false;
		}
		fileprot = true;
		changeFileName = cloneString(filename);
		unpercentString(changeFileName);
		if (stringEqual(filename, changeFileName)) {
			free(changeFileName);
			changeFileName = 0;
		} else
			filename = changeFileName;
		goto fromdisk;
	}

	const bool fromURL = isURL(filename);
	if (fromURL) {
		const char *newfile;
		const struct MIMETYPE *mt;
		uchar sxfirst;
		struct i_get g;
		memset(&g, 0, sizeof(g));
		g.gotag = gotag;
		if (newwin)
			g.down_ok = true;
		if (fromframe <= 1) {
			g.foreground = true;
			g.pg_ok = pluginsOn;
		}
		if (g.pg_ok && fromframe == 1)
			g.playonly = true;
// If the url matches on protocol, (and you should never write a plugin
// that matches on the standard transport protocols), then we need this plugin
// just to get the data.
		if (!g.pg_ok && !fromframe) {
			sxfirst = 2;
			if ((mt = findMimeByURL(filename, &sxfirst))
			    && mt->outtype)
				g.pg_ok = true;
		}
		if (fromframe)
			g.uriEncoded = true;
		else
			g.uriEncoded = uriEncoded;
		g.url = filename;
		g.thisfile = fromthis;
		g.custom_h = orig_head;
		g.cf = cf;
		rc = httpConnect(&g);
		serverData = g.buffer;
		serverDataLen = g.length;
		if (!rc)
			return false;
// pass responsibility for the allocated string to changeFileName
		changeFileName = g.cfn;

		if(changeFileName &&
		(hash = findHash(filename)) &&
		!findHash(changeFileName)) {
// carry the hash after redirection
			changeFileName = realloc(changeFileName,
			strlen(changeFileName) + strlen(hash) + 1);
			strcat(changeFileName, hash);
		}

		if (newwin) {
// pass responsibility for the allocated string to cw->referrer
			cw->referrer = g.referrer;
			if (changeFileName) {
				nzFree(cw->saveURL);
				cw->saveURL = cloneString(changeFileName);
			}
		} else
			nzFree(g.referrer);

/* We got some data.  Any warnings along the way have been printed,
 * like 404 file not found, but it's still worth continuing. */
		rbuf = serverData;
		fileSize = readSize = serverDataLen;
		if (g.code != 200 && g.code != 210)
			cf->render1 = cf->render2 = true;

// Don't print "this doesn't look like browsable text"
// if the content type is plain text.
		if (memEqualCI(g.content, "text/plain", 10) && cmd == 'b')
			cmd = 'e';

		if (fileSize == 0) {	// empty file
			nzFree(rbuf);
			if (!fromframe)
				cw->dot = endRange;
			return true;
		}

		if (g.csp) {
			cf->mt = 0;
			cf->render1 = cf->render2 = true;
		}
// acid says a frame has to be text/html, not even text/plain.
		if (fromframe && g.content[0]
		    && !stringEqual(g.content, "text/html")
		    && !stringEqual(g.content, "text/xml")) {
			debugPrint(3,
				   "frame suppressed because content type is %s",
				   g.content);
			strcpy(frameContent, g.content);
			nzFree(serverData);
			serverData = 0;
			serverDataLen = 0;
			return false;
		}

		newfile = (changeFileName ? changeFileName : filename);
		if (cf->mt && cf->mt->outtype &&
		    pluginsOn && !cf->render1 && cmd == 'b' && newwin) {
			sxfirst = 0;
			rc = runPluginCommand(cf->mt, newfile, 0,
					      rbuf, readSize, &rbuf, &readSize);
			if (!rc) {
				nzFree(rbuf);
				fileSize = -1;
				return false;
			}
			cf->render1 = true;
// we have to look again, to see if it matched by suffix.
// This call should always succeed.
			if (findMimeByURL(cf->fileName, &sxfirst) && sxfirst)
				cf->render2 = true;
// browse command ran the plugin, but if it generates text,
// then there's no need to browse the result.
			if (cf->mt->outtype == 't')
				cmd = 'e';
			fileSize = readSize;
		}

/*********************************************************************
Almost all music players take a url, but if one doesn't, whence down_url is set,
then here we are with data in buffer.
Yes, browseCurrent Buffer checks the suffix, but only to render, not to play.
We have to play here.
This also comes up when the protocol is used to get the data into buffer,
like extracting from a zip or tar archive.
Again the data is in buffer and we need to play it here.
*********************************************************************/

		sxfirst = 1;
		mt = findMimeByURL(newfile, &sxfirst);
		if (mt && !mt->outtype && sxfirst &&
		    pluginsOn && (g.code == 200 || g.code == 201) &&
		    cmd == 'b' && newwin) {
			rc = runPluginCommand(mt, newfile, 0,
					      rbuf, readSize, 0, 0);
// rbuf has been freed by this command even if it didn't succeed.
			serverData = NULL;
			serverDataLen = 0;
			cf->render2 = true;
			return rc;
		}
// If we would browse this data but plugins are off then turn b into e.
		if (mt && mt->outtype && sxfirst &&
		    !pluginsOn &&
		    (g.code == 200 || g.code == 201) && cmd == 'b' && newwin)
			cmd = 'e';
		if (mt && !mt->outtype && !pluginsOn && cmd == 'b' && newwin)
			cf->render2 = true;

		goto gotdata;
	}

	if (isSQL(filename) && !fromframe) {
		const char *t1, *t2;
		if (!cw->sqlMode) {
			setError(MSG_DBOtherFile);
			return false;
		}
		t1 = strchr(cf->fileName + 1, ']');
		t2 = strchr(filename + 1, ']');
		if (t1 - cf->fileName != t2 - filename ||
		    memcmp(cf->fileName, filename, t2 - filename)) {
			setError(MSG_DBOtherTable);
			return false;
		}
		rc = sqlReadRows(filename, &rbuf);
		if (!rc) {
			nzFree(rbuf);
			if (!cw->dol && newwin) {
				cw->sqlMode = false;
				nzFree(cf->fileName);
				cf->fileName = 0;
			}
			return false;
		}
		serverData = rbuf;
		fileSize = strlen(rbuf);
		if (rbuf == emptyString)
			return true;
		goto intext;
	}

fromdisk:
// reading a file from disk.
	fileSize = 0;
// for security reasons, this cannot be a frame in a web page.
	if (!frameSecurityFile(filename)) {
badfile:
		nzFree(changeFileName);
		changeFileName = 0;
		return false;
	}

	filetype = fileTypeByName(filename, 0);
	if (filetype == 'd') {
		if (!fromframe)
			return readDirectory(filename, endRange, cmd, &newpiece);
		setError(MSG_FrameNotHTML);
		goto badfile;
	}

	if (newwin && !fileprot && !cf->mt)
		cf->mt = findMimeByFile(filename);

// Optimize; don't read a file into buffer if you're
// just going to process it.
	if (cf->mt && cf->mt->outtype && pluginsOn && !access(filename, 4)
	    && !fileprot && cmd == 'b' && newwin) {
		rc = runPluginCommand(cf->mt, 0, filename, 0, 0, &rbuf, &readSize);
		fileSize = readSize;
		cf->render1 = cf->render2 = true;
// browse command ran the plugin, but if it generates text,
// then there's no need to browse the result.
		if (cf->mt->outtype == 't')
			cmd = 'e';
	} else {

		inparts = 1, fileSize = 0;
// set inparts to 0 if you don't want reading by parts or if it causes trouble,
// as it can when a single line is 100 megabytes long. So turn it off?
// Careful! We need integration by parts if the file is more than 2 gig, and
// an int is 4 bytes. On my pi, size_t is also 4 bytes, so switching my string
// management system over to size_t wouldn't help.

nextpart:
// some code to lop off hash for a local file when browsing locally,
// <a href=foo.html#bar>go to the bar section</a>
		h = 0;
		if(prebrowse && icmd == 'g')
			h = strchr(filename, '#');
		if(h) *h = 0;
		rc = fileIntoMemory(filename, &rbuf, &partSize, inparts);
		if(h) *h = '#'; // put it back
		inparts = (rc == 2 ? 2 : 0);
		if(rc) fileSize += partSize;
	}

	if (!rc)
		goto badfile;
// anyone using serverData will not be reading in parts
	serverData = rbuf;
	serverDataLen = fileSize;
	if (fileSize == 0) {	// empty file
		if (!fromframe) {
			cw->dot = endRange;
			nzFree(rbuf);
		}
		return true;
	}

gotdata:
// if we came here from another path, not reading from disk...
	if(!partSize) partSize = fileSize;
	firstPart = (partSize == fileSize);

	if (!looksBinary((uchar *) rbuf, partSize)) {
		bool isAllocated = true;
		diagnoseAndConvert(&rbuf, &isAllocated, &partSize, firstPart, !fromURL);
// in case the conversion changed the read buffer
		serverData = rbuf, serverDataLen = fileSize;
	} else if (fromframe) {
		nzFree(rbuf);
		setError(MSG_FrameNotHTML);
		goto badfile;
	} else if (binaryDetect & !cw->binMode) {
		if(debugLevel >= 1)
			i_puts(MSG_BinaryData);
		cw->binMode = true;
	}

	if (fromframe) {
/* serverData holds the html text to browse */
		return true;
	}

intext:
	rc = addTextToBuffer((const pst)rbuf, partSize, endRange, !fromURL);
	nzFree(rbuf);
	endRange = cw->dot;
	if(rc && inparts == 2) goto nextpart;
	return rc;
}

// from the command line or from a frame
bool readFileArgv(const char *filename, int fromframe, const char *orig_head)
{
	bool newwin = !fromframe;
	cmd = 'e';
	return readFile(filename, newwin, fromframe,
			(newwin ? 0 : cw->f0.fileName), orig_head, 0, 0);
}

// Skip the file: protocol, if present.
static char *skipFileProtocol(const char *name)
{
	if (memEqualCI(name, "file://", 7))
		name += 7;
	else if (memEqualCI(name, "file:", 5))
		name += 5;
return (char *) name;
}

/* Write a range to a file. */
bool writeFile(const char *name, int mode)
{
	int i;
	FILE *fh;
	char *modeString;
	int modeString_l;

	fileSize = -1;

	name = skipFileProtocol(name);

	if (!*name) {
		setError(MSG_MissingFileName);
		return false;
	}

	if (isSQL(name)) {
		setError(MSG_WriteDB);
		return false;
	}

	if (isURL(name)) {
		if (mode & O_APPEND) {
			setError(MSG_NoAppendURL);
			return false;
		}
		if(!strncmp(name, "ftp://", 6) ||
		!strncmp(name, "ftps://", 7) ||
		!strncmp(name, "sftp://", 7) ||
		!strncmp(name, "tftp://", 7) ||
		!strncmp(name, "scp://", 6))
			return ftpWrite(name);
		setError(MSG_NoWriteURL);
		return false;
	}

/* mode should be TRUNC or APPEND */
	modeString = initString(&modeString_l);
	if (mode & O_APPEND)
		stringAndChar(&modeString, &modeString_l, 'a');
	else
		stringAndChar(&modeString, &modeString_l, 'w');
	if (cw->binMode | cw->utf16Mode | cw->utf32Mode)
		stringAndChar(&modeString, &modeString_l, 'b');

	stringAndChar(&modeString, &modeString_l, 'e'); // O_CLOEXEC
	fh = fopen(name, modeString);
	nzFree(modeString);
	if (fh == NULL) {
	setError(MSG_NoCreate2, name, strerror(errno));
		return false;
	}
// If writing to the same file and converting, print message,
// and perhaps write the byte order mark.
	if (name == cf->fileName && iuConvert) {
		if (cw->iso8859Mode && cons_utf8)
			if (debugLevel >= 1)
				i_puts(MSG_Conv8859);
		if (cw->utf8Mode && !cons_utf8)
			if (debugLevel >= 1)
				i_puts(MSG_ConvUtf8);
		if (cw->utf8Mark) {
			if (debugLevel >= 1)
				i_puts(MSG_RestoringBOM);
			if (fwrite    ("\xef\xbb\xbf", 3, 1, fh) <= 0)
				goto badwrite;
		}
		if (cw->utf16Mode) {
			if (debugLevel >= 1)
				i_puts(MSG_ConvUtf16);
			if (fwrite
			    ((cw->bigMode ? "\xfe\xff" : "\xff\xfe"), 2, 1,
			     fh) <= 0) {
badwrite:
					setError(MSG_NoWrite2, name, strerror(errno));
				fclose(fh);
				return false;
			}
		}
		if (cw->utf32Mode) {
			if (debugLevel >= 1)
				i_puts(MSG_ConvUtf32);
			if (fwrite
			    ((cw->bigMode ? "\x00\x00\xfe\xff" :
			      "\xff\xfe\x00\x00"), 4, 1, fh) <= 0)
				goto badwrite;
		}
		if (cw->dosMode && debugLevel >= 1)
			i_puts(MSG_ConvDos);
	}

// special code for empty file
	fileSize = 0;
	if(startRange == 0) {
		fclose(fh);
		cw->changeMode = false;
		return true;
	}

	for (i = startRange; i <= endRange; ++i) {
		pst p = fetchLine(i, (cw->browseMode ? 1 : -1));
		int len = pstLength(p);
		char *suf = dirSuffix(i);
		char *tp;
		int tlen;
		bool alloc_p = cw->browseMode;
		bool rc = true;

		if (!cw->dirMode) {
			if (i == cw->dol && cw->nlMode)
				--len;

			if (name == cf->fileName && iuConvert) {
				if (cw->dosMode && len && p[len - 1] == '\n') {
					tp = allocMem(len + 2);
					memcpy(tp, p, len - 1);
					memcpy(tp + len - 1, "\r\n", 3);
					if (alloc_p)
						free(p);
					alloc_p = true;
					p = (pst) tp;
					++len;
				}

				if (cw->iso8859Mode && cons_utf8) {
					utf2iso((uchar *) p, len,
						(uchar **) & tp, &tlen);
					if (alloc_p)
						free(p);
					alloc_p = true;
					p = (pst) tp;
					if (fwrite(p, tlen, 1, fh) <= 0)
						rc = false;
					len = tlen;
					goto endline;
				}

				if (cw->utf8Mode && !cons_utf8) {
					iso2utf((uchar *) p, len,
						(uchar **) & tp, &tlen);
					if (alloc_p)
						free(p);
					alloc_p = true;
					p = (pst) tp;
					if (fwrite(p, tlen, 1, fh) <= 0)
						rc = false;
					len = tlen;
					goto endline;
				}

				if (cw->utf16Mode || cw->utf32Mode) {
					utfHigh((char *)p, len, &tp, &tlen,
						cons_utf8, cw->utf32Mode, cw->bigMode);
					if (alloc_p)
						free(p);
					alloc_p = true;
					p = (pst) tp;
					if (fwrite(p, tlen, 1, fh) <= 0)
						rc = false;
					len = tlen;
					goto endline;
				}
			}

			if (fwrite(p, len, 1, fh) <= 0)
				rc = false;
			goto endline;
		}

// Write this line with directory suffix, and possibly attributes
		--len;
		if (fwrite(p, len, 1, fh) <= 0) {
badline:
			rc = false;
			goto endline;
		}
		fileSize += len;

		if (cw->r_map) {
			int l;
/* extra ls stats to write */
			char *extra;
			len = strlen(suf);
			if (len && fwrite(suf, len, 1, fh) <= 0)
				goto badline;
			++len;	/* for nl */
			extra = (char *)cw->r_map[i].text;
			l = strlen(extra);
			if (l) {
				if (fwrite(" ", 1, 1, fh) <= 0)
					goto badline;
				++len;
				if (fwrite(extra, l, 1, fh) <= 0)
					goto badline;
				len += l;
			}
			if (fwrite("\n", 1, 1, fh) <= 0)
				goto badline;
			goto endline;
		}

		strcat(suf, "\n");
		len = strlen(suf);
		if (fwrite(suf, len, 1, fh) <= 0)
			goto badline;

endline:
		if (alloc_p)
			free(p);
		if (!rc)
			goto badwrite;
		fileSize += len;
	} // loop over lines

	fclose(fh);
// This is not an undoable operation, nor does it change data.
// In fact the data is "no longer modified" if we have written all of it.
	if (startRange == 1 && endRange == cw->dol)
		cw->changeMode = false;
	return true;
}

static int readContext0(int entry, int cx, const Window *w, int readLine1, int readLine2)
{
	if(!w) w = sessionList[cx].lw;
	int i, fardol = w->dol, lines;
	struct lineMap *t;
	bool at_the_end = cw->dol == entry;
	fileSize = 0;
	if (!fardol)
		return 0;
	if(at_the_end)
		cw->nlMode = false;
	if(readLine1 < 0)
		readLine1 = 1, readLine2 = fardol;
	lines = readLine2 + 1 - readLine1;
	newpiece = t = allocZeroMem(lines * LMSIZE);
	for (i = readLine1; i <= readLine2; ++i, ++t) {
		pst p = fetchLineWindow(i, (w->dirMode ? -1 : 1), w);
		int len = pstLength(p);
		if (w->dirMode) {
			char *suf = dirSuffixWindow(i, w);
			char *q;
			if (w->r_map) {
				char *extra = (char *)w->r_map[i].text;
				int elen = strlen(extra);
				q = allocMem(len + 4 + elen);
				memcpy(q, p, len);
				--len;
				strcpy(q + len, suf);
				if (elen) {
					strcat(q, " ");
					strcat(q, extra);
				}
				strcat(q, "\n");
			} else {
				q = allocMem(len + 3);
				memcpy(q, p, len);
				--len;
				strcat(suf, "\n");
				strcpy(q + len, suf);
			}
			len = strlen(q);
			p = (pst) q;
		}
		t->text = p;
		fileSize += len;
	}			// loop over lines in the other context
	if (w->nlMode && readLine2 == w->dol) {
		--fileSize;
		if (at_the_end)
			cw->nlMode = true;
	}
	if (binaryDetect & !cw->binMode && w->binMode) {
		cw->binMode = true;
		if(debugLevel)
			i_puts(MSG_BinaryData);
	}
	return lines;
}

static bool readContext(int cx, const Window *w, int readLine1, int readLine2)
{
	int lines;
	if(!w) {
		if (!cxCompare(cx) || !cxActive(cx, true))
			return false;
		w = sessionList[cx].lw;
	}
	lines = readContext0(endRange, cx, w, readLine1, readLine2);
	if(lines)
		addToMap(lines, endRange);
	return true;
}

static void readContextG(int cx, const Window *w, int readLine1, int readLine2)
{
	if(!w) w = sessionList[cx].lw; else cx = context;
	int i, j;
	int *label;
	struct lineMap *t, *newmap;
	int g_count, g_last;
	int fardol = w->dol, lines;

	debugPrint(3, "mass read  %d %d %d %d", cx, readLine1, readLine2, fardol);

	g_count = g_last = 0;
	 t = cw->map + 1;
	for(i = 1; i <= cw->dol; ++i, ++t)
		if(gflag[i]) ++g_count, g_last = i;

// reading from an empty buffer changes nothing
	if(!fardol) {
		cw->dot = g_last;
		fileSize = 0;
		return;
	}

	if(readLine1 < 0)
		readLine1 = 1, readLine2 = fardol;
	lines = readLine2 + 1 - readLine1;

	newmap = allocMem(LMSIZE * (cw->dol + 2 + lines * g_count));
	 t = cw->map;
	*newmap = *t++;
	for(i = j = 1; i <= cw->dol; ++i, ++t) {
		newmap[j] = *t;
		if(i > j) {
			label = NULL;
			while ((label = nextLabel(label)))
				if(*label == i)
					*label = j;
		}
		if(gflag[i]) { // read
			undoPush();
			readContext0(i, cx, w, readLine1, readLine2);
			memcpy(newmap + j + 1, newpiece, LMSIZE*lines);
			free(newpiece), newpiece = 0;
			j += lines;
			cw->dot = j;
		}
		++j;
	}

// map of lines has to null terminate
	newmap[j] = *t;
	free(cw->map), cw->map = newmap;
	cw->dol = j - 1;
}

static bool writeContext(int cx, Window *w, int writeLine)
{
	Window *save_cw;
	int i, len;
	struct lineMap *t;
	pst p;
	int fardol = endRange - startRange + 1;
	bool at_the_end, lost_nl;

// You might be writing into a textarea, which is an input field on the
// current page. We need to sync this change with javascript.
	jClearSync();

	if(writeLine < 0) {
		if (!cxCompare(cx))
			return false;
		if (cxActive(cx, false) && !cxQuit(cx, 2))
			return false;
		cxInit(cx);
		w = sessionList[cx].lw;
	}
	at_the_end = (writeLine < 0 || writeLine == w->dol);
	lost_nl = (cw->nlMode && endRange == cw->dol);
	fileSize = 0;

	if (!startRange) {
// just blowing away the buffer with emptiness.
// This can't happen through the at syntax.
// dot and dol should already be 0, but ok.
		w->dot = w->dol = 0;
		return true;
	}

	newpiece = t = allocZeroMem(fardol * LMSIZE);
	for (i = startRange; i <= endRange; ++i, ++t) {
		p = fetchLine(i, (cw->dirMode ? -1 : 1));
		len = pstLength(p);
		if (cw->dirMode) {
			char *q;
			char *suf = dirSuffix(i);
			if (cw->r_map) {
				char *extra = (char *)cw->r_map[i].text;
				int elen = strlen(extra);
				q = allocMem(len + 4 + elen);
				memcpy(q, p, len);
				--len;
				strcpy(q + len, suf);
				if (elen) {
					strcat(q, " ");
					strcat(q, extra);
				}
				strcat(q, "\n");
			} else {
				q = allocMem(len + 3);
				memcpy(q, p, len);
				--len;
				strcat(suf, "\n");
				strcpy(q + len, suf);
			}
			len = strlen(q);
			p = (pst) q;
		}
		t->text = p;
		fileSize += len;
	}

	fileSize -= lost_nl;

	save_cw = cw, cw = w;
// pretend like browsing, so addToMap doesn't mess with the undo machinery
	cw->browseMode = true;
	addToMap(fardol, (writeLine >= 0 ? writeLine : 0));
	if(writeLine < 0)
		cw->binMode = save_cw->binMode;
	if(!cw->quitMode) cw->changeMode = true;
	if(at_the_end)
		cw->nlMode = lost_nl;
	cw->browseMode = false;
	cw = save_cw;

	return true;
}

static void debrowseSuffix(char *s)
{
	if (!s)
		return;
	while (*s) {
		if (*s == '.' && stringEqual(s, ".browse")) {
			*s = 0;
			return;
		}
		++s;
	}
}

// Set various environment variables before a shell command
static void p_setenv(const char *var, const char *val) // protected setenv
{
// something bad happens on some platforms if env variable is too long (limit comes from MAX_ARG_STRLEN)
	if(strlen(var) + strlen(val) > 131070) {
		unsetenv(var);
		debugPrint(1, " variable %s too long", var);
	} else if(setenv(var, val, 1))
		debugPrint(1, " variable %s not set", var);
}

static void eb_file_name_variables(const char *file_name, const bool browsing, const char *file_var, const char *base_var, const char *dir_var)
{
	char var[8];
	char *s0 = cloneString(file_name);
	char *s = s0;

	if(!s) s = emptyString;
	s = skipFileProtocol(s);

	strcpy(var, file_var);
	p_setenv(var, s);
	if(browsing) debrowseSuffix(s);
	strcpy(var, base_var);
	p_setenv(var, s);

	strcpy(var, dir_var);
	if (isURL(s)) {
		char *t = cloneString(s);
		char *u = dirname(s);
		if (isURL(u))
			p_setenv(var, u);
		else
			p_setenv(var, t);
		nzFree(t);
	} else {
		p_setenv(var, dirname(s));
	}
	nzFree(s0);
}

// Set environment variables for filename, content of the current line,
// etc, before running a shell command, or expanding env variables inline.
void eb_variables(void)
{
	if(!ebvar) return;
	pst p;
	int n, rc, i;
	char var[12], numbuf[12];
	static const char *hasnull = "line contains nulls";
	eb_file_name_variables(cf->fileName, cw->browseMode, "EB_FILE", "EB_BASE", "EB_DIR");

	strcpy(var, "EB_DOT");
	unsetenv(var);
	if((n = cw->dot)) {
		p = fetchLine(n, 1);
		rc = perl2c((char *)p);
		p_setenv(var, rc ? hasnull : (char*)p);
		free(p);
	}

	sprintf(numbuf, "%d", n);
	strcpy(var, "EB_LN");
	p_setenv(var, numbuf);

	sprintf(numbuf, "%d", cw->dol);
	strcpy(var, "EB_LINES");
	p_setenv(var, numbuf);

	sprintf(numbuf, "%d", context);
	strcpy(var, "EB_SESSION");
	p_setenv(var, numbuf);

	strcpy(var, "EB_PLUS");
	unsetenv(var);
	n = cw->dot + 1;
	if(n <= cw->dol) {
		p = fetchLine(n, 1);
		rc = perl2c((char *)p);
		p_setenv(var, rc ? hasnull : (char*)p);
		free(p);
	}

	strcpy(var, "EB_MINUS");
	unsetenv(var);
	n = cw->dot - 1;
	if(n > 0) {
		p = fetchLine(n, 1);
		rc = perl2c((char *)p);
		p_setenv(var, rc ? hasnull : (char*)p);
		free(p);
	}

	for(i=0; i<26; ++i) {
		sprintf(var, "EB_LN%c", 'a' + i);
	unsetenv(var);
		n = cw->labels[i];
// n should always be in range.... but
		if(!n || n > cw->dol)
			continue;
		p = fetchLine(n, 1);
		rc = perl2c((char *)p);
		p_setenv(var, rc ? hasnull : (char*)p);
		free(p);
	}
}

static char *get_interactive_shell(const char *sh)
{
	char *ishell = NULL;
	if (asprintf(&ishell, "exec %s -i", sh) == -1)
		i_printfExit(MSG_NoMem);
	return ishell;
}

static char *ascmd = emptyString; // allocated shell command
static char *bangbang(const char *line)
{
	char *s;
	int n;
	if(line[0] != '!') {
		nzFree(ascmd);
		return (ascmd = cloneString(line));
	}
	if(!line[1]) // just !!
		return ascmd;
// put more stuff on the end
	n = strlen(ascmd) + strlen(line);
	s = allocMem(n);
	sprintf(s, "%s%s", ascmd, line + 1);
	nzFree(ascmd);
	return (ascmd = s);
}

// replace '. with $EB_DOT, '_ with $EB_FILE, etc
static char *apostropheMacros(const char *line)
{
	char *newline = 0, *s = 0;
	const char *t;
	char key;
	int linesize = 0, pass, n;

	for (pass = 1; pass <= 2; ++pass) {
		for (t = line; *t; ++t) {
			if (*t != '\'')
				goto addchar;
			if (t > line && isalnumByte(t[-1]))
				goto addchar;
			key = t[1];
			if (key && isalnumByte(t[2]))
				goto addchar;

			if (key == '_') {
				++t;
				if (pass == 1) {
					linesize += 10;
				} else {
					strcpy(s, "\"$EB_FILE\"");
					s += strlen(s);
				}
				continue;
			}

			if (key == '.') {
				++t;
				if (pass == 1) {
					linesize += 9;
				} else {
					strcpy(s, "\"$EB_DOT\"");
					s += strlen(s);
				}
				continue;
			}

			if (key == '-') {
				++t;
				if (pass == 1) {
					linesize += 11;
				} else {
					strcpy(s, "\"$EB_MINUS\"");
					s += strlen(s);
				}
				continue;
			}

			if (key == '+') {
				++t;
				if (pass == 1) {
					linesize += 10;
				} else {
					strcpy(s, "\"$EB_PLUS\"");
					s += strlen(s);
				}
				continue;
			}

			if (islowerByte(key)) {
				++t;
				if (pass == 1) {
					linesize += 10;
				} else {
					strcpy(s, "\"$EB_LN");
					s += strlen(s);
					*s++ = key;
					*s++ = '"';
				}
				continue;
			}

addchar:
			if (pass == 1)
				++linesize;
			else
				*s++ = *t;
		}		// loop over chars

		if (pass == 1)
			s = newline = allocMem(linesize + 1);
		else
			*s = 0;
	}			// two passes

	return newline;
}

static bool shellEscape(const char *line)
{
	char *sh, *line1, *line2;
	char *interactive_shell_cmd = NULL;
	bool rc;

/* preferred shell */
	sh = getenv("SHELL");
	if (!sh || !*sh)
		sh = "/bin/sh";

	if (!line[0]) {
/* interactive shell */
		if (!isInteractive) {
			setError(MSG_SessionBackground);
			return false;
		}
		eb_variables();
		interactive_shell_cmd = get_interactive_shell(sh);
		eb_system(interactive_shell_cmd, false);
		i_puts(MSG_OK);
		nzFree(interactive_shell_cmd);
		return true;
	}

	line1 = bangbang(line);
	line2 = apostropheMacros(line1);
	eb_variables();

	rc = !eb_system(line2, !globSub);
	free(line2);
	return rc;
}

// parse portion syntax as in 7@'a,'b. ASsume context has been cracked,
// and line begins with @.
// If relative is nonzero then cx is not context but an offset in the stack.
// This is not yet implemented.
static Window *atWindow;
static bool atPartCracker(char relative, int cx, bool writeMode, char *p, int *lp1, int *lp2)
{
	int lno1 = 0, lno2 = -1; // line numbers
	Window *w2; // far window
	char *q = strchr(p, ',');
	if(q && writeMode) {
		setError(MSG_AtSyntax);
		return globSub = false;
	}
	if(q) *q = 0;
// check syntax first, then validate session number
	if(((p[1] == 0 && q) ||
	(p[1] == '\'' && p[2] >= 'a' && p[2] <= 'z' && p[3] == 0) ||
	(p[1] && strchr(".-+$", p[1]) && p[2] == 0) ||
	(p[1] == ';' && p[2] == 0 && !q) ||
	(isdigitByte(p[1]) && (lno1 = stringIsNum(p+1)) >= 0)) &&
	(!q || q[1] == 0 ||
	((q[1] == '\'' && q[2] >= 'a' && q[2] <= 'z' && q[3] == 0) ||
	(strchr(".-+$", q[1]) && q[2] == 0) ||
	(isdigitByte(q[1]) && (lno2 = stringIsNum(q+1)) >= 0)))) {
// syntax is good
		if(!relative) {
			if(!cxCompare(cx) || !cxActive(cx, true))
				return globSub = false;
			w2 = sessionList[cx].lw;
		} else {
			int k;
			if(!cx) {
				setError(MSG_SessionCurrent, context);
				return globSub = false;
			}
			if(relative == '+') {
				for(k = 0, w2 = cw; w2; w2 = w2->prev, ++k) ;
				if(cx >= k) {
					setError(MSG_NoUp);
					return globSub = false;
				}
				for(w2 = cw; cx; w2 = w2->prev, --cx)  ;
			} else {
				for(k = 0, w2 = cs->lw2; w2; w2 = w2->prev, ++k) ;
				if(cx > k) {
					setError(MSG_NoDown);
					return globSub = false;
				}
				k -= cx;
				for(w2 = cs->lw2; k; w2 = w2->prev, --k)  ;
			}
		}
		if(!w2->dol && !writeMode) {
			setError(MSG_EmptyBuffer);
			return globSub = false;
		}
// session is ok, how about the line numbers?
		if(p[1] == 0)
			lno1 = 1;
		if(p[1] == '\'' &&
		 !(lno1 = w2->labels[p[2] - 'a'])) {
			setError(MSG_NoLabel, p[2]);
			return globSub = false;
		}
		if(p[1] == '$')
			lno1 = w2->dol;
		if(p[1] == '.')
			lno1 = w2->dot;
		if(p[1] == ';')
			lno1 = w2->dot, lno2 = w2->dol;
		if(p[1] == '+')
			lno1 = w2->dot + 1;
		if(p[1] == '-')
			lno1 = w2->dot - 1;
		if(q) {
			if(q[1] == '\'' &&
			 !(lno2 = w2->labels[q[2] - 'a'])) {
				setError(MSG_NoLabel, q[2]);
				return globSub = false;
			}
			if(q[1] == 0 || q[1] == '$')
				lno2 = w2->dol;
			if(q[1] == '.')
				lno2 = w2->dot;
			if(q[1] == '+')
				lno2 = w2->dot + 1;
			if(q[1] == '-')
				lno2 = w2->dot - 1;
		}
		if(lno2 < 0)
			lno2 = lno1;
		if((lno1 == 0 || lno2 == 0) && !writeMode) {
			setError(MSG_AtLine0);
			return globSub = false;
		}
		if(lno1 > w2->dol || lno2 > w2->dol) {
			setError(MSG_LineHigh);
			return globSub = false;
		}
		if(lno1 > lno2) {
			setError(MSG_BadRange);
			return globSub = false;
		}
		*lp1 = lno1, *lp2 = lno2;
		atWindow = w2;
		return true;
	}
	setError(MSG_AtSyntax);
	return globSub = false;
}

/* Valid delimiters for search/substitute.
 * note that \ is conspicuously absent, not a valid delimiter.
 * I also avoid nestable delimiters such as parentheses.
 * And no alphanumerics please -- too confusing.
 * ed allows it, but I don't. */
static const char valid_delim[] = "_=!;:`\"',/?@-";
/* And a valid char for starting a line address */
static const char valid_laddr[] = "0123456789-'.$+/?";

/* Check the syntax of a regular expression, before we pass it to pcre.
 * The first char is the delimiter -- we stop at the next delimiter.
 * A pointer to the second delimiter is returned, along with the
 * (possibly reformatted) regular expression. */

static bool
regexpCheck(const char *line, bool isleft,
// result parameters
	    char **rexp, const char **split)
{
	static char re[MAXRE + 20];
	const char *start;
	char *e = re;
	char c, d;
/* Remember whether a char is "on deck", ready to be modified by * etc. */
	bool ondeck = false;
	bool was_ques = true;	/* previous modifier was ? */
	bool cc = false;	/* are we in a [...] character class */
	int mod;		/* length of modifier */
	int paren = 0;		/* nesting level of parentheses */
	char delim = *line;
	*rexp = re;
	if(delim) {
		if (!strchr(valid_delim, delim)) {
			setError(MSG_BadDelimit);
			return false;
		}
		++line;
	} else delim = '/';
	start = line;
	c = *line;

// empty expression becomes remembered expression
	if (isleft && (c == delim || c == 0)) {
		if (!cw->lhs_yes) {
			setError(MSG_NoSearchString);
			return false;
		}
		strcpy(re, cw->lhs);
		strcpy(globalSubs.temp_lhs, cw->lhs);
		globalSubs.lhs_bang = cw->lhs_bang;
		globalSubs.lhs_ci = cw->lhs_ci;
		*split = line;
		return true;
	}

// % becomes remembered expression
	if (!isleft && c == '%' && (line[1] == delim || line[1] == 0)) {
		if (!cw->rhs_yes) {
			setError(MSG_NoReplaceString);
			return false;
		}
		strcpy(re, cw->rhs);
		strcpy(globalSubs.temp_rhs, cw->rhs);
		*split = line + 1;
		return true;
	}

	if (ebre && isleft) {
// Interpret lead * or other special characters as literal
		if (strchr("*?+{", c)) {
			*e++ = '\\';
			*e++ = c;
			++line;
			ondeck = true;
		}
// and similarly for /^*
		if (c == '^' && (c = line[1]) && strchr("*?+{", c)) {
			*e++ = '^';
			*e++ = '\\';
			*e++ = c;
			line += 2;
			ondeck = true;
		}
	}

	bool named_cc = false;
	bool first_character_in_cc = false;
	bool complemented_cc = false;
	while ((c = *line)) {
		if (e >= re + MAXRE - 3) {
			setError(MSG_RexpLong);
			return false;
		}
		d = line[1];

		if (c == '\\') {
			line += 2;
			first_character_in_cc = false;
			if (d == 0) {
				setError(MSG_LineBackslash);
				return false;
			}
			ondeck = true;
			was_ques = false;
// I can't think of any reason to remove the escaping \ from any character,
// except ()|, where we reverse the sense of escape.
			if (ebre && isleft && !cc
			    && strchr("()|", d)) {
				if (d == '|')
					ondeck = false, was_ques = true;
				else if (d == '(')
					++paren, ondeck = false, was_ques = false;
				else if (d == ')')
				if (--paren < 0) {
					setError(MSG_UnexpectedRight);
					return false;
				}
				*e++ = d;
				continue;
			}
			if (d == delim || (ebre && !isleft && d == '&')) {
// this next line is for ?\?? searching backwards for ?
// We can't pass bare ? to pcre or it is interpreted
				if(d == '?')
					*e++ = '\\';
				*e++ = d;
				continue;
			}
// Nothing special, retain the escape character.
			*e++ = c;
#if 0
// I don't know what this was for...
// Like I had to turn \3 into \03,   but why?
			if (isleft && d >= '0' && d <= '7'
			    && (*line < '0' || *line > '7'))
				*e++ = '0';
#endif
			*e++ = d;
			continue;
		}

// Break out if we hit the delimiter.
		if (c == delim && !cc)
			break;

		if (isleft) {
// Remember, I reverse the sense of ()|
			if (ebre && strchr("()|", c))
				*e++ = '\\';
// treat [ as a literal [ if there is no ]
			if(ebre && !cc && c == '[' && !strchr(line, ']')) {
				*e++ = '\\';
				*e++ = c;
				++line;
				continue;
			}
// treat ^ as a literal ^ when it is not at the start of a group
			if(ebre && c == '^' && !cc && (ondeck ||
			(e > re && (e[-1] != '(' && e[-1] != '|'))))
				*e++ = '\\';
// treat $ as a literal $ when it is not at the end of a group
			if (ebre && c == '$' && d && d != delim &&
			(d != '\\' || (line[2] != ')' && line[2] != '|')))
				*e++ = '\\';
			if (!ebre && !cc
			    && strchr("()|", c)) {
				if (c == '|')
					ondeck = false, was_ques = true;
				if (c == '(')
					++paren, ondeck = false, was_ques = false;
				if (c == ')')
				if (--paren < 0) {
					setError(MSG_UnexpectedRight);
					return false;
				}
			}
		}

// $10 or higher produces an allocation error, so I guess we need to check for this
		if (c == '$' && !isleft && isdigitByte(d)) {
			if (isdigitByte(line[2])) {
				setError(MSG_RexpDollar);
				return false;
			}
		}

		if (!isleft && c == '&' && ebre) {
			*e++ = '$';
			*e++ = '0';
			++line;
			continue;
		}

/* push the character */
		*e++ = c;
		++line;

/* No more checks for the rhs */
		if (!isleft) continue;

		if (cc) {	/* character class */
			if (c == '[' && *line == ':') {
				const char *next = line + 1;
				if (!strncmp(next, "ascii:]", 7) || !strncmp(next, "alnum:]", 7)
				|| !strncmp(next, "alpha:]", 7) || !strncmp(next, "blank:]", 7)
				|| !strncmp(next, "cntrl:]", 7) || !strncmp(next, "digit:]", 7)
				|| !strncmp(next, "graph:]", 7) || !strncmp(next, "lower:]", 7)
				|| !strncmp(next, "print:]", 7) || !strncmp(next, "punct:]", 7)
				|| !strncmp(next, "space:]", 7) || !strncmp(next, "upper:]", 7)
				|| !strncmp(next, "xdigit:]", 8) || !strncmp(next, "word:]", 6))
					named_cc = true;
			}
			if (c == ']') {
				if (named_cc) named_cc = false;
				else if (!first_character_in_cc) cc = complemented_cc = false;
			}
			if (first_character_in_cc) {
				if (c == '^' && !complemented_cc)
					complemented_cc = true;
				else first_character_in_cc = false;
			}
			continue;
		}
		if (c == '[')
			cc = first_character_in_cc = true;

/* Modifiers must have a preceding character.
 * Except ? which can reduce the greediness of the others. */
		if (c == '?' && !was_ques) {
			ondeck = false;
			was_ques = true;
			continue;
		}

		mod = 0;
		if (strchr("?+*", c))
			mod = 1;
		if (c == '{' && isdigitByte(d)) {
			const char *t = line + 1;
			while (isdigitByte(*t))
				++t;
			if (*t == ',')
				++t;
			while (isdigitByte(*t))
				++t;
			if (*t == '}')
				mod = t + 2 - line;
		}
		if (mod) {
			--mod;
			if (mod) {
				strncpy(e, line, mod);
				e += mod;
				line += mod;
			}
			if (!ondeck) {
				*e = 0;
				setError(MSG_RexpModifier, e - mod - 1);
				return false;
			}
			ondeck = false;
			continue;
		}

		ondeck = true;
		was_ques = false;
	}			// loop over chars in the pattern
	*e = 0;

	*split = line;

	if (cc) {
		setError(MSG_NoBracket);
		return false;
	}
	if (paren) {
		setError(MSG_NoParen);
		return false;
	}

	if (isleft)
		strcpy(globalSubs.temp_lhs, re);
	else
		strcpy(globalSubs.temp_rhs, re);

	debugPrint(6, "%s regexp %s", (isleft ? "search" : "replace"), re);
	return true;
}

/* regexp variables */
static int re_count;
static PCRE2_SIZE *re_vector;
static pcre2_match_data *match_data;
static pcre2_code *re_cc;	/* compiled */
bool re_utf8 = true;

static void regexpCompile(const char *re, bool ci)
{
	static signed char try8 = 0;	/* 1 is utf8 on, -1 is utf8 off */
	int re_error;
	PCRE2_SIZE re_offset;
	int re_opt;

top:
/* Do we need PCRE_NO_AUTO_CAPTURE? */
	re_opt = 0;
	if (ci)
		re_opt |= PCRE2_CASELESS;

	if (re_utf8) {
		if (cons_utf8 && !cw->binMode && try8 >= 0) {
			if (try8 == 0) {
				const char *s = getenv("PCREUTF8");
				if (s && stringEqual(s, "off")) {
					try8 = -1;
					goto top;
				}
			}
			try8 = 1;
			re_opt |= PCRE2_UTF;
		}
	}

	re_cc = pcre2_compile((uchar*)re, PCRE2_ZERO_TERMINATED, re_opt, &re_error, &re_offset, 0);
	if (!re_cc && try8 > 0 && re_error == PCRE2_ERROR_UTF_IS_DISABLED) {
		i_puts(MSG_PcreUtf8);
		try8 = -1;
		goto top;
	}
	if (!re_cc && try8 > 0 && (PCRE2_ERROR_UTF32_ERR2 <= re_error && re_error <= PCRE2_ERROR_UTF8_ERR1)) {
		i_puts(MSG_BadUtf8String);
	}

	if (!re_cc)
		setError(MSG_RexpError, "ERROR");
	else
// re_cc and match_data rise and fall together.
		match_data = pcre2_match_data_create_from_pattern(re_cc, NULL);
}

/* Get the start or end of a range.
 * Pass the line containing the address. */
static bool getRangePart(const char *line, int *lineno,
// result parameters
const char **split)
{
	int ln = cw->dot;	/* this is where we start */
	char first = *line;

	if (isdigitByte(first)) {
		ln = strtol(line, (char **)&line, 10);
	} else if (first == '.') {
		++line;
/* ln is already set */
	} else if (first == '$') {
		++line;
		ln = cw->dol;
	} else if (first == '\'' && islowerByte(line[1])) {
		ln = cw->labels[line[1] - 'a'];
		if (!ln) {
			setError(MSG_NoLabel, line[1]);
			return false;
		}
		line += 2;
	} else if (first == '/' || first == '?') {

		char *re;	/* regular expression */
		bool ci = caseInsensitive;
		bool unmatch = false;
		bool forget = false;
		signed char incr;	/* forward or back */
// Don't look through an empty buffer.
		if (cw->dol == 0) {
			setError(MSG_EmptyBuffer);
			return false;
		}
		if(!line[1] && cw->lhs_yes)
			unmatch = cw->lhs_bang, ci = (cw->lhs_ci | caseInsensitive);
		if (!regexpCheck(line, true, &re, &line))
			return false;
		if (*line == first) {
			++line;
			while(*line == 'i' || *line == 'f' || *line == '!') {
				if (*line == 'i')
					ci = true;
				if (*line == 'f')
					forget = true;
				if (*line == '!')
					unmatch = true;
				++line;
			}
		}

		if(!forget) {
			cw->lhs_yes = true;
			cw->lhs_bang = unmatch;
			cw->lhs_ci = ci;
			strcpy(cw->lhs, globalSubs.temp_lhs);
		}

		regexpCompile(re, ci);
		if (!re_cc)
			return false;
/* We should probably study the pattern, if the file is large.
 * But then again, it's probably not worth it,
 * since the expressions are simple, and the lines are short. */
		incr = (first == '/' ? 1 : -1);
		while (true) {
			char *subject;
			ln += incr;
			if (!searchWrap && (ln == 0 || ln > cw->dol)) {
				pcre2_match_data_free(match_data);
				pcre2_code_free(re_cc);
				setError(MSG_NotFound);
				return false;
			}
			if (ln > cw->dol)
				ln = 1;
			if (ln == 0)
				ln = cw->dol;
			subject = (char *)fetchLine(ln, 1);
			re_count =
			    pcre2_match(re_cc, (uchar*)subject,
				      pstLength((pst) subject) - 1, 0, 0,
				      match_data, NULL);
//  {uchar snork[300]; pcre2_get_error_message(re_count, snork, 300); puts(snork); }
			re_vector = pcre2_get_ovector_pointer(match_data);
			free(subject);
// An error in evaluation  usually happens because this line has invalid utf8
			if (re_count < -1 && re_utf8 && !bad_utf8_alert) {
				i_puts(MSG_BadUtf8);
				bad_utf8_alert = true;
			}
			if ((re_count >= 0) ^ unmatch)
				break;
			if (ln == cw->dot) {
				pcre2_match_data_free(match_data);
				pcre2_code_free(re_cc);
				setError(MSG_NotFound);
				return false;
			}
		}		/* loop over lines */
		pcre2_match_data_free(match_data);
		pcre2_code_free(re_cc);
/* and ln is the line that matches */
	}
	/* Now add or subtract from this number */
	while ((first = *line) == '+' || first == '-') {
		int add = 1;
		++line;
		if (isdigitByte(*line))
			add = strtol(line, (char **)&line, 10);
		ln += (first == '+' ? add : -add);
	}

	if (ln > cw->dol) {
		setError(MSG_LineHigh);
		return false;
	}
	if (ln < 0) {
		setError(MSG_LineLow);
		return false;
	}

	*lineno = ln;
	*split = line;
	return true;
}

/* Apply a regular expression to each line, and then execute
 * a command for each matching, or nonmatching, line.
 * This is the global feature, g/re/p, which gives us the word grep. */
static bool doGlobal(const char *line)
{
	int gcnt = 0;		/* global count */
	bool ci = caseInsensitive;
	bool forget = false;
	bool change;
	char delim = *line;
	char *re;		/* regular expression */
	int i, origdot, yesdot, nodot;

	if (!delim) {
		setError(MSG_RexpMissing, icmd);
		return false;
	}

	if (!regexpCheck(line, true, &re, &line))
		return false;
	if (*line && *line != delim) {
		setError(MSG_NoDelimit);
		return false;
	}
	if(*line) ++line;
	while(*line == 'i' || *line == 'f') {
		if (*line == 'i')
			ci = true;
		else
			forget = true;
		++line;
	}
	skipWhite(&line);

	if(!forget) {
		cw->lhs_yes = true;
		cw->lhs_bang = false;
		cw->lhs_ci = false;
		strcpy(cw->lhs, globalSubs.temp_lhs);
	}

// Find the lines that match the pattern
	regexpCompile(re, ci);
	if (!re_cc)
		return false;
	gflag = allocZeroMem(sizeof(char*) * (cw->dol+1));
	gflag_w = cw;
	for (i = startRange; i <= endRange; ++i) {
		char *subject = (char *)fetchLine(i, 1);
		re_count =
		    pcre2_match(re_cc, (uchar*)subject, pstLength((pst) subject) - 1,
			      0, 0, match_data, NULL);
		re_vector = pcre2_get_ovector_pointer(match_data);
		free(subject);
		if (re_count < -1 && re_utf8 && !bad_utf8_alert) {
			i_puts(MSG_BadUtf8);
		bad_utf8_alert = true;
		}
		if ((re_count < 0 && cmd == 'v')
		    || (re_count >= 0 && cmd == 'g'))
			gflag[i] = true, ++gcnt;
	}
	pcre2_match_data_free(match_data);
	pcre2_code_free(re_cc);

	if (!gcnt) {
		setError((cmd == 'v') + MSG_NoMatchG);
		return false;
	}

	setError(-1);

// check for mass delete or mass join
	if(cw->browseMode | cw->sqlMode | cw->ircoMode | cw->imapMode1 | cw->imapMode2 | cw->imapMode3) goto nomass;
	int block = -1, back = 0; // range for mass delete
// atPartCracker() might overwrite comma with null, so p has to be char*
	char *p = (char*)line;
	if(*p == '.' && p[1] == 'r') ++p;
	if(*p == 'r' && isdigitByte(p[1])) {
		if(cw->dirMode) goto nomass;
// mass read must read from a buffer
		block = strtol(p + 1, &p, 10);
		if(!*p) {
			cmd = 'e'; // show errors
			if (!cxCompare(block) || !cxActive(block, true))
				return false;
			readContextG(block, 0, -1, -1);
			return true;
		}
		if(*p != '@') goto nomass;
		cmd = 'e'; // show errors
		int lno1, lno2 = -1;
		if(!atPartCracker(0, block, false, p, &lno1, &lno2))
			return false;
		readContextG(block, 0, lno1, lno2);
		return true;
	}

	if(*p == 'r' && (p[1] == '-' || p[1] == '+') && isdigitByte(p[2])) {
		if(cw->dirMode) goto nomass;
		char relative = p[1];
		block = strtol(p + 2, &p, 10);
		if(!*p) {
			static char shorthand[4];
			strcpy(shorthand, "@,");
			p = shorthand;
		}
		if(*p != '@') goto nomass;
		cmd = 'e'; // show errors
		int lno1, lno2 = -1;
		if(!atPartCracker(relative, block, false, p, &lno1, &lno2))
			return false;
		readContextG(0, atWindow, lno1, lno2);
		return true;
	}

// Now check for d or j
// prior lines must begin with - or .-
	if(*p == '-' || (*p == '.' && p[1] == '-')) {
		if(*p == '.') ++p;
		++p;
		back = 1;
		while(*p == '-') ++back, ++p;
		if(isdigitByte(*p))
			back = strtol(p, &p, 10) + (back-1);
// special case for -j, which is ok cause it still involves the current line.
		if(back <= 1 && (*p == 'j' || *p == 'J')) {
			block = 1 - back;
			goto masscommand;
		}
// at this point we need a comma
		if(*p != ',') goto nomass;
		++p;
// now we need . alone or + or .+
		if(*p != '.' && *p != '+') goto nomass;
		if(*p == '.') ++p;
		block = 0;
		if(*p != '+') goto masscommand;
		block = 1, ++p;
		while(*p == '+') ++block, ++p;
		if(isdigitByte(*p))
			block = strtol(p, &p, 10) + (block-1);
		goto masscommand;
	}
	if(*p == '.' && isalphaByte(p[1])) { ++p; goto masscommand; }
	if(!strncmp(p, ".,+", 3)) { p += 3; goto massnumber; }
	if(!strncmp(p, ".,.+", 4)) { p += 4; goto massnumber; }
	goto masscommand;
massnumber:
	block = 1;
	while(*p == '+') ++block, ++p;
	if(isdigitByte(*p))
		block = strtol(p, &p, 10) + (block-1);
masscommand:
	if(*p == 'd' || *p == 'D') {
		if(p[1]) goto nomass;
		if(block < 0) block = 0;
		if(cw->dirMode && (block > 1 || back > 0)) goto nomass;
		return delTextG(*p, block, back);
}
	if(cw->dirMode) goto nomass;
	if(*p == 'j') {
		const char *q = p + 1;
		while(isspaceByte(*q)) ++q;
		if(*q) goto nomass;
	}
	if(*p == 'j' || *p == 'J') {
		if(block < 0) block = 1;
		return joinTextG(*p, block, back, p+1);
}
nomass:

// apply the subcommand to every marked line 
	globSub = true;
	if (!*line)
		line = "p";
	origdot = cw->dot;
	yesdot = nodot = 0;
	change = true;
	while (gcnt && change) {
		change = false;	/* kinda like bubble sort */
		for (i = 1; i <= cw->dol; ++i) {
			int i2 = i;
			if (!gflag[i]) continue;
			if (intFlag)
				goto done;
			change = true, --gcnt;
			gflag[i] = false;
			cw->dot = i;	/* so we can run the command at this line */
			if (runCommand(line)) {
				yesdot = cw->dot;
/* try this line again, in case we deleted or moved it somewhere else */
				--i;
			}
// error in subcommand might turn global flag off
			if (!globSub) {
				nodot = i2, yesdot = 0;
				goto done;
			}
		}		// loop over lines
	}			// loop making changes

done:
	globSub = false;
/* yesdot could be 0, even on success, if all lines are deleted via g/re/d */
	if (yesdot || !cw->dol) {
		cw->dot = yesdot;
		if ((cmd == 's' || cmd == 'i') && subPrint == 1)
			printDot();
	} else if (nodot) {
		cw->dot = nodot;
	} else {
		cw->dot = origdot;
		if (!errorMsg[0])
			setError(MSG_NotModifiedG);
	}
	if (!errorMsg[0] && intFlag)
		setError(MSG_Interrupted);
	if(cw->dot > cw->dol)
		cw->dot = cw->dol;
	return (errorMsg[0] == 0);
}

static void fieldNumProblem(int desc, char *c, int n, int nt, int nrt)
{
	if (!nrt) {
		setError(MSG_NoInputFields + desc);
		return;
	}
	if (!n) {
		setError(MSG_ManyInputFields + desc, c, c, nt);
		return;
	}
	if (nt > 1)
		setError(MSG_InputRange, n, c, c, nt);
	else
		setError(MSG_InputRange2, n, c, c);
}

/* Perform a substitution on a given line.
 * The lhs has been compiled, and the rhs is passed in for replacement.
 * Refer to the static variable re_cc for the compiled lhs.
 * Return true for a replacement, false for no replace, and -1 for a problem. */

static char *replaceString;
static int replaceStringLength;
static char *replaceStringEnd;

static int replaceText(const char *line, int len, const char *rhs,
	    int nth, bool global, bool last, int ln)
{
	int offset = 0, lastoffset = -1, instance = 0;
	int span;
	char *r;
	int rlen;
	const char *s = line, *s_end, *t;
	char c, d;

	r = initString(&rlen);

	while (true) {
// find the next match
		re_count =
		    pcre2_match(re_cc, (uchar*)line, len, offset, 0, match_data, NULL);
		re_vector = pcre2_get_ovector_pointer(match_data);
		if (re_count < -1 && re_utf8 && !bad_utf8_alert) {
			i_puts(MSG_BadUtf8);
			bad_utf8_alert = true;
		}

		if (re_count < 0) {
			if(!last) break;
			if(lastoffset < 0) break;
			nth = instance + 1;
			offset = lastoffset;
			continue;
		}

		++instance;	// found another match
		lastoffset = offset;
		offset = re_vector[1];	/* ready for next iteration */
		debugPrint(7, "nth %d,%d offset %d,%d", nth, instance, offset, lastoffset);
		if (offset == lastoffset && (nth > 1 || (global|last))) {
// if offset = 0 then we are replacing nothingness at the start of the line
// if offset > 0 then this is the second time we are replacing the same nothingness
			if(offset < len) {
				setError(MSG_ManyEmptyStrings);
				nzFree(r);
				return -1;
			}
// replace emptiness at the end is ok   s/f\|$/z/g
			nth = instance, global = last = false;
			if(offset > 0) break;
		}

		if (!global &&instance != nth)
			continue;
		if (global && nth &&instance != nth)
			continue;

// copy up to the match point
		s_end = line + re_vector[0];
		span = s_end - s;
		stringAndBytes(&r, &rlen, s, span);
		s = line + offset;

// Now copy over the rhs
// Special case lc mc uc
		if (ebre && (rhs[0] == 'l' || rhs[0] == 'm' || rhs[0] == 'u')
		    && rhs[1] == 'c' && rhs[2] == 0) {
			int savelen = rlen;
			span = re_vector[1] - re_vector[0];
			stringAndBytes(&r, &rlen, line + re_vector[0], span);
			i_caseShift(r + savelen, rhs[0]);
			if (!global) break;
			nth = 0;
			continue;
		}

		// copy rhs, watching for $n
		t = rhs;
		while ((c = *t)) {
			d = t[1];
			if (c == '\\') {
				t += 2;
				if (d == '$') {
					stringAndChar(&r, &rlen, d);
					continue;
				}
				if (d == 'n') {
					stringAndChar(&r, &rlen, '\n');
					continue;
				}
				if (d == 't') {
					stringAndChar(&r, &rlen, '\t');
					continue;
				}
				if (d == 'b') {
					stringAndChar(&r, &rlen, '\b');
					continue;
				}
				if (d == 'r') {
					stringAndChar(&r, &rlen, '\r');
					continue;
				}
				if (d == 'f') {
					stringAndChar(&r, &rlen, '\f');
					continue;
				}
				if (d == 'a') {
					stringAndChar(&r, &rlen, '\a');
					continue;
				}
				if (d >= '0' && d <= '7') {
					int octal = d - '0';
					d = *t;
					if (d >= '0' && d <= '7') {
						++t;
						octal = 8 * octal + d - '0';
						d = *t;
						if (d >= '0' && d <= '7') {
							++t;
							octal =
							    8 * octal + d - '0';
						}
					}
					stringAndChar(&r, &rlen, octal);
					continue;
				}	/* octal */
				if (!ebre)
					stringAndChar(&r, &rlen, '\\');
				stringAndChar(&r, &rlen, d);
				continue;
			}	// \ cases

			if (c == '$' && isdigitByte(d)) {
				int y, z;
				t += 2;
				d -= '0';
				if (d >= re_count)
					continue;
				y = re_vector[2 * d];
				z = re_vector[2 * d + 1];
				if (y < 0)
					continue;
				span = z - y;
				stringAndBytes(&r, &rlen, line + y, span);
				continue;
			}

			if (c == '%' && d == 'l' &&
			    !strncmp(t + 2, "ine", 3) && !isalnumByte(t[5])) {
				char numstring[12];
				sprintf(numstring, "%d", ln);
				stringAndString(&r, &rlen, numstring);
				t += 5;
				continue;
			}

			stringAndChar(&r, &rlen, c);
			++t;
		}

		if (!global) break;
		nth = 0;
	}			// loop matching the regular expression

	if (!instance) {
		nzFree(r);
		return false;
	}

	if (!global &&instance < nth) {
		nzFree(r);
		return false;
	}

/* We got a match, copy the last span. */
	s_end = line + len;
	span = s_end - s;
	stringAndBytes(&r, &rlen, s, span);

	replaceString = r;
	replaceStringLength = rlen;
	undoSpecialClear();
	return true;
}

// find the open textarea on the current line.
static int openTA(pst s)
{
	uchar c;
	bool hascodes = false;
	int tag = 0, lev = 0;
	const Tag *t;
	while((c = *s) != '\n') {
		if(c != InternalCodeChar || !isdigitByte(s[1])) { ++s; continue; }
		hascodes = true;
		tag = strtol((char*)s + 1, (char**)&s, 10);
		c = *s;
		if(c == '<') ++lev;
		if(c == '>') --lev;
	}
// lev should always be 0 or 1
	if(lev != 1) return hascodes ? -1 : 0;
	t = tagList[tag];
	if(t->action == TAGACT_INPUT && t->itype == INP_TA) return tag;
	debugPrint(3, "tag %d should be the start of a textarea", tag);
	return -1;
}

// find the open textarea, if you are editing that textarea.
static int findOpenTA(int ln)
{
	pst p;
	int tag;
	for(--ln; ln; --ln) {
		p = fetchLine(ln, -1);
		tag = openTA(p);
		if(tag < 0) return 0;
		if(tag > 0) return tag;
	}
// all the way back to the start of the buffer
	return 0;
}

// ftype = 0 look for hyperlinks, from the g command
// ftype = 1 look for buttons, from the i* command
// ftype = 2 look for entry fields, from the i= command
// ftype = 3 look for input fields, from the i? command
// ftype = 4 look for images, from the img command

static void
findField(const char *line, int ftype, int n,
	  int *total, int *realtotal, int *tagno, char **href,
	  const Tag **tagp)
{
	const Tag *t;
	int nt = 0;		/* number of fields total */
	int nrt = 0;		/* the real total, for input fields */
	int nm = 0;		/* number match */
	int j;
	const char *s, *ss;
	char *h, *nmh;
	char c;
	static const char urlok[] =
	    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,./?@#%&-_+=:~*()'";

	if (href) *href = 0;
	if (tagp) *tagp = 0;

	if (cw->browseMode) {

		s = line;
		while ((c = *s) != '\n') {
			++s;
			if (c != InternalCodeChar)
				continue;
			j = strtol(s, (char **)&s, 10);
			if (ftype == 0) {
				if (*s != '{')
					continue;
				++nt, ++nrt;
				if (n == nt || n < 0)
					nm = j;
				if (!n) {
					if (!nm)
						nm = j;
					else
						nm = -1;
				}
			} else if (ftype == 4) {
				if (*s != '*' || s[1] != '[')
					continue;
// don't know why tag might be other than image, but it might be.
				if(tagList[j]->action != TAGACT_IMAGE)
					continue;
				++nt, ++nrt;
				if (n == nt || n < 0)
					nm = j;
				if (!n) {
					if (!nm)
						nm = j;
					else
						nm = -1;
				}
			} else { // 1 2 or 3
				if (*s != '<')
					continue;
				if (n > 0) {
					++nt, ++nrt;
					if (n == nt)
						nm = j;
					continue;
				}
				if (n < 0) {
					nm = j;
					++nt, ++nrt;
					continue;
				}
				++nrt;
				t = tagList[j];
				if (ftype == 1 && t->itype && t->itype <= INP_SUBMIT)
					continue;
				if (ftype == 2 && t->itype > INP_SUBMIT)
					continue;
				++nt;
				if (!nm)
					nm = j;
				else
					nm = -1;
			}
		}		// loop over line

// see if we're in the midst of a textarea
		if(!nt && ftype == 1 &&
		(n < 0 || n == 1) &&
		(j = findOpenTA(endRange))) {
// at present there should be no way to get here
			debugPrint(1, "open textarea %d shouldn't exist", j);
			if (total) *total = 1;
			if (realtotal) *realtotal = 1;
			if (tagno) *tagno = j;
			return;
		}

	}

	if (nm < 0)
		nm = 0;
	if (total) *total = nrt;
	if (realtotal) *realtotal = nt;
	if (tagno) *tagno = nm;
	if ((ftype == 0 || ftype == 4) && nm) {
		t = tagList[nm];
		if (tagp)
			*tagp = t;
		if (t->action == TAGACT_A || t->action == TAGACT_FRAME ||
		t->action == TAGACT_IMAGE ||
		    t->action == TAGACT_MUSIC || t->action == TAGACT_AREA) {
			if (href)
				*href = cloneString(t->href);
			if (href && !*href) {
// nothing yet, defer to the js variable for href
				*href = get_property_url_t(t, false);
			}
		} else {
// This link is not an anchor or frame, it's onclick on something else.
			if (href)
				*href = cloneString("#");
		}
	}

	if (nt || ftype)
		return;

// Second time through, maybe the url is in plain text.
	nmh = 0;
	s = line;
	while (true) {
// skip ahead to a letter, like http
		while ((c = *s) != '\n') {
			if (isalphaByte(c))
				break;
			++s;
		}
		if (c == '\n')
			break;
		ss = s;
		while (strchr(urlok, *s))
			++s;
		h = pullString1(ss, s);
// act upon the llinks we create, href='blah'
		if(memEqualCI(h, "href=", 5)) strmove(h, h + 5);
		if(memEqualCI(h, "src=", 4)) strmove(h, h + 4);
		if(*h == '\'' || *h == ':') strmove(h, h + 1);
		int l = strlen(h);
		if(!l) { free(h); continue; }
// When a url ends in period, that is almost always the end of the sentence,
// as in please check out www.foobar.com/snork.
// and rarely part of the url.
// Similarly for comma and apostrophe
		c = h[l - 1];
		if (c == '.' || c == ',' || c == '\'')
			h[l - 1] = 0;
		if(c == ')') {
// an unbalanced ) is probably not part of the url
			l = 0;
// we can use ss here, we don't need it as a marker any more
			for(ss = h + strlen(h) - 1; ss > h; --ss) {
				if(*ss == ')') { ++l; continue; }
				if(*ss == '(') { --l;
					if(!l) break; // balanced
				}
			}
			if(ss == h) // unbalanced
				h[strlen(h) - 1] = 0;
		}
		if (!isURL(h)) {
			free(h);
			continue;
		}
		++nt;
		if (n == nt || n < 0) {
			nm = nt;
			nzFree(nmh);
			nmh = h;
			continue;
		}
		if (n) {
			free(h);
			continue;
		}
		if (!nm) {
			nm = nt;
			nmh = h;
			continue;
		}
		free(h);
		nm = -1;
		free(nmh);
		nmh = 0;
	}			// loop over line

	if (nm < 0)
		nm = 0;
	if (total)
		*total = nt;
	if (realtotal)
		*realtotal = nt;
	if (href)
		*href = nmh;
	else
		nzFree(nmh);
}

static void
findInputField(const char *line, int ftype, int n, int *total, int *realtotal,
	       int *tagno)
{
	findField(line, ftype, n, total, realtotal, tagno, 0, 0);
}

/*********************************************************************
Substitute text on the lines in startRange through endRange.
We could be changing the text in an input field.
If so, we'll call infReplace().
Or we might be indirectory mode, whence we must rename the file.
It clears the undoSpecial line if the substitute seems to be working,
and sets up for the next special one-line undo command if in
directory or browse mode, and the substitute happens, acting on just one line,
and not in global mode.
This is a complicated function!
The return can be true or false, with the usual meaning,
but also a return of -1, which is failure,
and an indication that we need to abort any g// in progress.
-1 is a serious problem.
If a line becomes more than one line after substitution, s/doghouse/dog\nhouse/
we switch to newmap mode for efficiency. In case this happens
thousands of times in a million line file.
realloc newmap as necessary, adding 10% each time.
There is always enough for dol2 lines and zero on each end.
Like the other mass operations, this does not happen if in
directory or browse or sql mode.
None of those should inject newlines anyways.
*********************************************************************/

static int substituteText(const char *line)
{
	int whichField = 0;
	bool bl_mode = false;	// running the bl command
	bool g_mode = false;	// s/x/y/g
	bool last_mode = false;	// s/x/y/$
	bool ci = caseInsensitive;
	bool forget = false;
	bool ok = true; // substitutions ok so far
	char c, *s, *t;
	int nth = 0;		// s/x/y/7
	int lastSubst = 0;	// last successful substitution
	char *re;		// the parsed regular expression
	int ln, ln2;			// line number
	int dol2 = 0, alloc2 = 0;
	int j, linecount, slashcount, nullcount, foldercount, tagno, total, realtotal;
	char lhs[MAXRE], rhs[MAXRE];
	struct lineMap *mptr, *newmap = 0;
	bool *newg = 0;
	bool hasMoved[MARKLETTERS];

	replaceString = 0;
	memset(hasMoved, 0, sizeof(hasMoved));

	re_cc = 0;
	if (stringEqual(line, "`bl")) {
		bl_mode = true, breakLineSetup(), subPrint = 0;
	} else {
		subPrint = 1;	// default is to print the last line substituted
// watch for s2/x/y/ for the second input field
		if (isdigitByte(*line))
			whichField = strtol(line, (char **)&line, 10);
		else if (*line == '$')
			whichField = -1, ++line;
		if (!*line) {
			setError(MSG_RexpMissing, icmd);
			return -1;
		}
		if (cw->dirMode && !dirWrite) {
			setError(MSG_DirNoWrite);
			return -1;
		}
		if (!regexpCheck(line, true, &re, &line))
			return -1;
		strcpy(lhs, re);
		if (!regexpCheck(line, false, &re, &line))
			return -1;
		strcpy(rhs, re);

		if (*line) {	// third delimiter
			++line;
			subPrint = 0;
			while ((c = *line)) {
				if (c == 'g') {
					g_mode = true, ++line;
					continue;
				}
				if (c == '$') {
					last_mode = true, ++line;
					continue;
				}
				if (c == 'i') {
					ci = true, ++line;
					continue;
				}
				if (c == 'f') {
					forget = true, ++line;
					continue;
				}
				if (c == 'p') {
					subPrint = 2, ++line;
					continue;
				}
				if (isdigitByte(c)) {
					if (nth) {
						setError(MSG_SubNumbersMany);
						return -1;
					}
					nth = strtol(line, (char **)&line, 10);
					continue;
				}	// number
				setError(MSG_SubSuffixBad);
				return -1;
			}	// loop gathering suffix flags
			if ((g_mode & last_mode) ||
			(nth && last_mode)) {
				setError(MSG_SubNumberG);
				return -1;
			}
		}		// closing delimiter

		if (nth == 0 && !(g_mode|last_mode))
			nth = 1;

		if(!forget) {
			cw->lhs_yes = true;
			cw->lhs_bang = false;
			cw->lhs_ci = false;
			strcpy(cw->lhs, globalSubs.temp_lhs);
			cw->rhs_yes = true;
			strcpy(cw->rhs, globalSubs.temp_rhs);
		}

		regexpCompile(lhs, ci);
		if (!re_cc)
			return -1;
	}

	if (!globSub)
		setError(-1);

	ln2 = 0;
	for (ln = startRange; ln <= endRange; ++ln) {
		char *p;
		int len, imaplen = 0;

		if(newmap) {
			newmap[ln2] = cw->map[ln];
			if(newg) newg[ln2] = gflag[ln];
			for(j = 0; j < MARKLETTERS; ++j)
				if(cw->labels[j] == ln && !hasMoved[j])
					cw->labels[j] = ln2, hasMoved[j] = true;
		}

		replaceString = 0;
		if(intFlag) goto abort;
		if(!ok) { ++ln2; continue; }

		p = (char *)fetchLine(ln, -1);
		len = pstLength((pst) p);
		if(cw->imapMode1)
			imaplen = strrchr(p,':') - p; // this should always work

		if (bl_mode) {
			int newlen;
			if (!breakLine(p, len, &newlen)) {
// you just should never be here
				setError(MSG_BreakLong, 0);
				nzFree(breakLineResult), breakLineResult = 0;
				goto abort;
			}
// empty line is not allowed
			if (!newlen)
				breakLineResult[newlen++] = '\n';
// perhaps no changes were made
			if (newlen == len && !memcmp(p, breakLineResult, len)) {
				nzFree(breakLineResult), breakLineResult = 0;
				++ln2;
				continue;
			}
			replaceString = breakLineResult;
			undoSpecialClear();
// But the regular substitute doesn't have the \n on the end.
// We need to make this one conform.
			replaceStringLength = newlen - 1;
		} else {

			if (cw->browseMode) {
				char search[20];
				char searchend[4];
				findInputField(p, 1, whichField, &total,
					       &realtotal, &tagno);
				if (!tagno) {
					fieldNumProblem(0, "i", whichField,
							total, realtotal);
					continue;
				}
				sprintf(search, "%c%d<", InternalCodeChar,
					tagno);
				sprintf(searchend, "%c0>", InternalCodeChar);
// Ok, if the line contains a null, this ain't gonna work.
// There should be no nulls in a browsed file.
				s = strstr(p, search);
				if (!s) // should never happen
					continue;
				s = strchr(s, '<') + 1;
				t = strstr(s, searchend);
				if (!t)
					continue;
				j = replaceText(s, t - s, rhs, nth,
						g_mode, last_mode, ln);
			} else {
				j = replaceText(p, (cw->imapMode1 ? imaplen : len - 1), rhs, nth,
						g_mode, last_mode, ln);
			}
			if (j < 0)
				goto abort;
			if (!j) { ++ln2; continue; }
		}

// Did we split this line into many lines?
		replaceStringEnd = replaceString + replaceStringLength;
		linecount = slashcount = nullcount = foldercount = 0;
		for (t = replaceString; t < replaceStringEnd; ++t) {
			c = *t;
			if (c == '\n')
				++linecount;
			if (c == 0)
				++nullcount;
			if (c == '/')
				++slashcount;
			if ((uchar)c < ' ' || c == '"')
				++foldercount;
		}

		if (cw->sqlMode) {
			if (linecount) {
				setError(MSG_ReplaceNewline);
				goto abort;
			}
			if (nullcount) {
				setError(MSG_ReplaceNull);
				goto abort;
			}
			*replaceStringEnd = '\n';
			if (!sqlUpdateRow(ln, (pst) p, len - 1,
			(pst) replaceString, replaceStringLength))
				goto abort;
		} // sql mode

		if (cw->dirMode) {
// move the file, then update the text
			char src[ABSPATH], *dest;
			if (slashcount + nullcount + linecount) {
				setError(MSG_DirNameBad);
				goto abort;
			}
			p[len - 1] = 0;	// temporary
			t = makeAbsPath(p);
			p[len - 1] = '\n';
			if (!t)
				goto abort;
			strcpy(src, t);
			*replaceStringEnd = 0;
			dest = makeAbsPath(replaceString);
			if (!dest)
				goto abort;
			if (!stringEqual(src, dest)) {
				if (fileTypeByName(dest, 1)) {
					setError(MSG_DestFileExists, dest);
					goto abort;
				}
				if (rename(src, dest)) {
					setError(MSG_NoRename, dest, strerror(errno));
					goto abort;
				}
// if substituting one line, remember it for undo
				if(startRange == endRange && !globSub) {
					p[len - 1] = 0;
					undoSpecial = cloneString(p), undo1line = ln, undoField = 0;
					p[len - 1] = '\n';
				}
				cw->dot = ln;
			}	// source and dest are different
} // dir mode

		if (cw->imapMode1) {
			if (foldercount || replaceStringEnd == replaceString) {
				setError(MSG_FolderNameBad);
				goto abort;
			}
			p[imaplen] = 0;	// temporary
			*replaceStringEnd = 0;
			if (!stringEqual(p, replaceString)) {
				if (!renameFolder(p, replaceString)) {
// renameFolder will set the error
					p[imaplen] = ':';
					goto abort;
				}
				cw->dot = ln;
			}	// source and dest are different
			p[imaplen] = ':';
// this function will replace foo: 127 with bar, no message count,
// but it doesn't matter cause we're going to refresh anyways.
		} // imap mode

		if (cw->browseMode) {
			if (nullcount) {
				setError(MSG_InputNull2);
				goto abort;
			}
			if (linecount) {
				setError(MSG_InputNewline2);
				goto abort;
			}
			*replaceStringEnd = 0;
// if substituting one line, remember it for undo
			if(startRange == endRange && !globSub)
				undoSpecial = getFieldFromBuffer(tagno, 0), undo1line = ln, undoField = whichField;
// We're managing our own printing, so leave notify = 0
			if (!infReplace(tagno, replaceString, false))
				goto abort;
			undoCompare();
			cw->undoable = false;
		} else {

// time to update the text in the buffer
			undoPush();
			*replaceStringEnd = '\n';
			if (!linecount) {
// normal substitute
				mptr = newmap ? newmap + ln2 : cw->map + ln;
				if(cw->sqlMode | cw->imapMode1)
					nzFree(mptr->text);
				mptr->text = allocMem(replaceStringLength + 1);
				memcpy(mptr->text, replaceString,
				       replaceStringLength + 1);
				if (cw->dirMode)
					undoCompare(), cw->undoable = false;
				++ln2;
			} else {
// Becomes many lines, this is the tricky case.
				bool notused;
				text2linemap((pst) replaceString,
				replaceStringLength + 1, &notused);
				if(!newmap) {
// switching over to newmap
					debugPrint(3, "mass substitute");
					dol2 = cw->dol;
					alloc2 = dol2 / 9 * 10 + 60;
					newmap = allocMem(LMSIZE * alloc2);
					memcpy(newmap, cw->map,LMSIZE*(ln2 = ln));
					if(gflag) {
						newg = allocMem(alloc2);
						memcpy(newg, gflag, ln);
					}
				}
				dol2 += linecount;
				if(dol2 + 2 > alloc2) {
					alloc2 = dol2 / 9 * 10 + 20;
					newmap = realloc(newmap, LMSIZE*alloc2);
					if(newg) newg = realloc(newg, alloc2);
				}
				++linecount;
				memcpy(newmap + ln2, newpiece, linecount*LMSIZE);
				free(newpiece), newpiece = 0;
				if(newg) memset(newg + ln2, 0, linecount);
				ln2 += linecount;
// There's a quirk when adding newline to the end of a buffer
// that had no newline at the end before.
				if (cw->nlMode && ln == cw->dol
				    && replaceStringEnd[-1] == '\n')
					--ln2, --dol2;
			}
		}		// browse or not

		if (subPrint == 2) {
			if(!newmap) {
				displayLine(ln);
			} else {
// this is hinky as hell, swap newmap in just to display the line
				mptr = cw->map, cw->map = newmap;
				j = cw->dol, cw->dol = dol2;
				displayLine(ln2 - 1);
				cw->map = mptr, cw->dol = j;
			}
		}
		lastSubst = newmap ? ln2 - 1 : ln;
		nzFree(replaceString);
// we may have just freed the result of a breakline command
		breakLineResult = 0;
		continue;

abort:
		if (re_cc) {
			pcre2_match_data_free(match_data);
			pcre2_code_free(re_cc);
		}
		nzFree(replaceString);
	// we may have just freed the result of a breakline command
		breakLineResult = 0;
		ok = false;
		++ln2;
	}			// loop over lines in the range

	if(newmap) { // close it out
		for(; ln <= cw->dol; ++ln, ++ln2) {
			newmap[ln2] = cw->map[ln];
			if(newg) newg[ln2] = gflag[ln];
			for(j = 0; j < MARKLETTERS; ++j)
				if(cw->labels[j] == ln && !hasMoved[j])
					cw->labels[j] = ln2, hasMoved[j] = true;
		}
		newmap[ln2] = cw->map[ln]; // null terminate
		free(cw->map), cw->map = newmap;
		if(newg) free(gflag), gflag = newg;
cw->dol = ln2 - 1;
	}

	if (intFlag && !ok) {
		setError(MSG_Interrupted);
		return -1;
	}

	if(!ok) return -1;

	if (re_cc) {
		pcre2_match_data_free(match_data);
		pcre2_code_free(re_cc);
	}

	if (!lastSubst) {
		if (!globSub) {
			if (!errorMsg[0])
				setError(bl_mode ? MSG_NoChange : MSG_NoMatch);
		}
		return false;
	}
	cw->dot = lastSubst;
	if (subPrint == 1 && !globSub)
		printDot();
	return true;
}

static char *lessFile(const char *line, bool tamode)
{
	bool fromfile = false;
	int j, k, n, plen, dol;
	int lno1, lno2;
	const Window *w2; // far window
	char *line2, *p;
	int line2len;
	skipWhite(&line);
	if (!*line) {
		setError(MSG_NoFileSpecified);
		return 0;
	}
	if(isdigitByte(line[0]) && (n = strtol(line, (char**)&p, 10)) >= 0 &&
	(*p == 0 || *p == '@')) {
		if(!*p) {
			if (!cxCompare(n) || !cxActive(n, true))
				return 0;
			dol = sessionList[n].lw->dol;
			if (!dol) {
				setError(MSG_BufferXEmpty, n);
				return 0;
			}
				if (dol > 1 && !tamode) {
					setError(MSG_BufferXLines, n);
					return 0;
				}
			lno1 = 1, lno2 = dol;
		} else {
			if(!atPartCracker(0, n, false, p, &lno1, &lno2))
				return false;
			if (lno2 > lno1 && !tamode) {
				setError(MSG_BufferXLines, n);
				return 0;
			}
		}
		line2 = initString(&line2len);
		while(lno1 <= lno2) {
			p = (char *)fetchLineContext(lno1, 1, n);
			plen = pstLength((pst) p);
			stringAndBytes(&line2, &line2len, p, plen);
			nzFree(p);
			++lno1;
		}
		n = line2len;
	} else if((line[0] == '-' || line[0] == '+') && isdigitByte(line[1]) && (n = strtol(line + 1, (char**)&p, 10)) >= 0 && (*p == '@' || *p == 0)) {
		if(!*p) {
			static char shorthand[4];
			strcpy(shorthand, "@,");
			p = shorthand;
		}
		if(!atPartCracker(line[0], n, false, p, &lno1, &lno2))
			return false;
		if (lno2 > lno1 && !tamode) {
			setError(MSG_BufferXLines, n);
			return 0;
		}
		line2 = initString(&line2len);
		while(lno1 <= lno2) {
			p = (char *)fetchLineWindow(lno1, 1, atWindow);
			plen = pstLength((pst) p);
			stringAndBytes(&line2, &line2len, p, plen);
			nzFree(p);
			++lno1;
		}
		n = line2len;
	} else {
		if (!envFile(line, &line))
			return 0;
		if (!fileIntoMemory(line, &line2, &n, 0))
			return 0;
		fromfile = true;
	}
	for (j = k = 0; j < n; ++j) {
		if(line2[j] == '\r' && j < n - 1 && line2[j+1] == '\n')
			continue;
		line2[k++] = line2[j];
	}
	n = k;
	for (j = 0; j < n; ++j) {
		if (line2[j] == 0) {
			setError(MSG_InputNull2);
			nzFree(line2);
			return 0;
		}
		if (line2[j] == '\n' && !tamode)
			break;
	}
	line2[j] = 0;
	return line2;
}

// Find the frame for the current line.
// jdb wants to debug in the frame of the current line.
// Also used when frames are expanded and contracted.
Tag *line2frame(int ln)
{
	const char *line;
	int n, opentag = 0, ln1 = ln;
	const char *s;
	for (; ln; --ln) {
		line = (char *)fetchLine(ln, -1);
		if (!opentag && ln < ln1
		    && (s = stringInBufLine(line, "*--`\n"))) {
			for (--s; s > line && *s != InternalCodeChar; --s) ;
			if (*s == InternalCodeChar)
				opentag = atoi(s + 1);
			continue;
		}
		s = stringInBufLine(line, "*`--\n");
		if (!s)
			continue;
		for (--s; s > line && *s != InternalCodeChar; --s) ;
		if (*s != InternalCodeChar)
			continue;
		n = atoi(s + 1);
		if (!opentag)
			return tagList[n];
		if (n == opentag)
			opentag = 0;
	}
	return 0;
}

// return the title of a web page, or the file name
static const char *windowTitle(const Window *w)
{
	if (w->htmltitle) return w->htmltitle;
	if (w->f0.fileName) return w->f0.fileName;
	return emptyString;
}

// Check whether two sessions have the same mode.
static bool sameMode(const Window *const w1, const Window *const w2)
{
	if (!w1 || !w2) return false;
	if(w1->browseMode != w2->browseMode) return false;
	if(w1->dirMode != w2->dirMode) return false;
	if(w1->sqlMode != w2->sqlMode) return false;
	if((w1->imapMode1 | w1->imapMode2 | w1->imapMode3) !=
	(w2->imapMode1 | w2->imapMode2 | w2->imapMode3)) return false;
	if((w1->irciMode | w1->ircoMode) !=
	(w2->irciMode | w2->ircoMode)) return false;
	return true;
}

// Search by substring. We could search by regexp, which brings more power,
// but perhaps more confusion as well.
static int sessionByText(const char *s, int dir)
{
	int n = context;
	const Window *lw;
	while(true) {
		if(dir > 0) {
			if(++n > maxSession) {
				if(!searchWrap) goto fail;
				n = 1;
			}
		} else {
			if(--n == 0) {
				if(!searchWrap) goto fail;
				n = maxSession;
			}
		}
		if(!(lw = sessionList[n].lw)) continue;
		if (searchSameMode && !sameMode(lw, cw)) continue;
		if(!s || !*s || strcasestr(windowTitle(lw), s)) return n; // found it
		if(n == context) break;
	}
fail:
	setError(MSG_NotFound);
	return 0;
}

/*********************************************************************
Implement various two letter commands.
Most of these set and clear modes.
Return 1 or 0 for success or failure as usual.
But return 2 if there is a new command to run.
The second parameter is a result parameter, the new command to run.
In rare cases we might allocate a new (longer) command line to run,
like rf (refresh), which could be a long url.
*********************************************************************/

static char shortline[60];
static int twoLetter(const char *line, const char **runThis)
{
	char c;
	bool rc, ub;
	int i, n;
	char *allocatedLine;

	*runThis = shortline;

	if (stringEqual(line, "qt"))
		ebClose(0);

	if(!strncmp(line, "var ", 4))
		return varCommand(line + 4);

	if(line[0] == '[' && line[1] == ' ' &&
	(n = strlen(line)) >= 5 &&
	line[n-1] == ']' && line[n - 2] == ' ') {
		const char *eq = strstr(line, " = ");
		const char *neq = strstr(line, " != ");
		int sign = 0;
		if(eq && (!neq || neq > eq)) sign = 1;
		if(neq && (!eq || eq > neq)) sign = -1;
		if(sign) {
			if(sign < 0) eq = neq;
			const char *s = eq + 3;
			while(isspace(eq[-1])) --eq;
			while(isspace(*s)) ++s;
			bool emptyleft = (eq == line + 1);
			bool emptyright = (s == line + n - 1);
			if(emptyleft & emptyright) {
				if(sign > 0) return true;
test_false:
				setError(MSG_False);
				return false;
			}
			if(emptyleft | emptyright) {
				if(sign > 0) goto test_false;
				return true;
			}
			const char *t = line + n - 2;
			while(isspace(t[-1])) --t;
			const char *u = line + 2;
			while(isspace(*u)) ++u;
			if(eq - u == t - s && !memcmp(u, s, t-s)) {
				if(sign > 0) return true;
				goto test_false;
			}
			if(sign > 0) goto test_false;
			return true;
		}
	}

	if(!strncmp(line, "sleep", 5) && (line[5] == 0 || line[5] == ' ')) {
		int pause, rc;
		time_t start, now;
		int delay_sec, delay_ms;
		fd_set channels;
		struct timeval tv;
		const char *p = line + 5;
		while(*p == ' ') ++p;
		pause = stringIsNum(p);
		if(pause <= 0) return true;
// This is a stripped down version of the input loop that runs timers,
// I hope not too stripped down.
		time(&start);
		while (timerWait(&delay_sec, &delay_ms)) {
			time(&now);
			if(now + delay_sec >= start + pause) break;
// timers are pending, use select to pause
			memset(&channels, 0, sizeof(channels));
			tv.tv_sec = delay_sec;
			tv.tv_usec = delay_ms * 1000;
			rc = select(0, &channels, 0, 0, &tv);
			if (rc < 0) return true; // interrupt
			runTimer();
		}
		time(&now);
		pause = now - (start + pause);
		if(pause > 0) sleep(pause);
		return true;
	}

	if (stringEqual(line, "P")) {
		promptOn ^= 1;
		return true;
	}

	if (stringEqual(line, "P+") || stringEqual(line, "P-")) {
		promptOn = (line[1] == '+');
		return true;
	}

	if(cw->imapMode1 && stringEqual(line, "imask")) {
		struct MACCOUNT *a = accounts + cw->imap_n - 1;
		if(!a->maskon) { setError(MSG_NoMask); return false; }
		a->maskactive ^= 1;
		if(debugLevel > 0)
			i_puts(MSG_ImaskOff + a->maskactive);
		return true;
	}

	if((cw->imapMode1 | cw->imapMode2) && line[0] == 'l' && (line[1] == ' ' || line[1] == '=')) {
		const char *p = line + 2;
		skipWhite(&p);
		if(*p == '-') ++p;
		if(stringIsNum(p) >= 0) {
			Window *w = 0;
			setFetchLimit(line + 2);
// find the other window
			if(cw->imapMode2) w = cw->prev;
			else w = sessionList[context].fw2;
// and copy to the other window
			if(w) w->imap_l = cw->imap_l;
			return true;
		}
	}

	if((cw->imapMode1 | cw->imapMode2) && line[0] == 'e' && (line[1] == ' ' || line[1] == '=')) {
	const char *p = line + 2;
	while(*p) {
		if(!strchr("fstzdu", *p)) break;
		++p;
	}
	if(*p) goto no_action; // doesn't look like envelope format
		Window *w = 0;
		setEnvelopeFormat(line + 2);
// find the other window
		if(cw->imapMode2) w = cw->prev;
		else w = sessionList[context].fw2;
// and copy to the other window
		if(w) strcpy(w->imap_env, cw->imap_env);
		return true;
	}

	if(cw->imapMode2 && line[0] && strchr("wWuU", line[0]) && (line[1] == 0 || line[1] == ' ')) {
		char key = *line++;
		skipWhite(&line);
		if(!cw->dot) { setError(MSG_AtLine0); return false; }
		return saveEmailWhileEnvelopes(key, line);
	}

	if(cw->imapMode3 && line[0] && strchr("wWuU", line[0]) && (line[1] == 0 || line[1] == ' ')) {
		char key = *line++;
		skipWhite(&line);
		return saveEmailWhileReading(key, line);
	}

	if(!strncmp(line, "up", 2) ||
	!strncmp(line, "down", 4)) {
		struct ebSession *s = &sessionList[context];
		int k;
		const Window *w;
		const bool down = (line[0] == 'd');
		const char *v = line + (down ? 4 : 2);
		if(!*v) {
			n = 1;
		} else if(*v == '/') {
			bool found = false;
			++v;
			if (down) {
				n = -1;
				for(k = 0, w = s->lw2; w; w = w->prev, ++k)
					if((!searchSameMode || sameMode(w, cw)) && (!*v || strcasestr(windowTitle(w), v))) {
						found = true;
						n = k;
					}
				n = k - n;
			} else { // up/
				for(n = 1, w = cw->prev; w; w = w->prev, ++n)
					if((!searchSameMode || sameMode(w, cw)) && (!*v || strcasestr(windowTitle(w), v))) {
						found = true;
						break;
					}
			}
			if(!found) {
					cmd = 'e';
					setError(MSG_NotFound);
					return false;
			}
		} else {
			n = stringIsNum(v);
			if(n < 0) goto no_action;
			if(!n) return true;
		}
		if(cw->irciMode | cw->ircoMode) {
			cmd = 'e';
			setError(MSG_IrcCommandS, line);
			return false;
		}
		undoCompare();
		cw->undoable = false;
		undoSpecialClear();
		cmd = 'e';
		if(!down) { // up
			for(k = 0, w = cw; w; w = w->prev, ++k) ;
			if(n >= k) {
				setError(MSG_NoUp);
				return false;
			}
up_again:
		s->lw = cw->prev;
			cw->prev = 0;
			if(!s->lw2) {
				s->fw2 = s->lw2 = cw;
			} else {
				s->fw2->prev = cw;
				s->fw2 = cw;
			}
			cw = s->lw;
			if(--n) goto up_again;
		} else { // down
			for(k = 0, w = s->lw2; w; w = w->prev, ++k) ;
			if(n > k) {
				setError(MSG_NoDown);
				return false;
			}
down_again:
			s->lw = s->fw2;
			s->fw2->prev = cw;
			if(s->fw2 == s->lw2) {
				s->fw2 = s->lw2 = 0;
			} else {
				Window *x = s->lw2;
				while(x->prev != s->fw2) x = x->prev;
				x->prev = 0;
				s->fw2 = x;
			}
			cw = s->lw;
			if(--n) goto down_again;
		}
		selfFrame();
		if (debugLevel >= 1) {
			const char *title = windowTitle(cw);
			if(title[0]) eb_printf("%s", title);
			else i_printf(MSG_NoFile);
			nl();
		}
		return true;
	}

	if(stringEqual(line, "e+")) {
		for(n = context + 1; n <= maxSession; ++n)
			if(sessionList[n].lw) {
					cxSwitch(n, true);
					return true;
				}
		cmd = 'e';
		setError(MSG_EPlus, context);
		return false;
	}

	if(stringEqual(line, "e-")) {
		for(n = context - 1; n > 0; --n)
			if(sessionList[n].lw) {
					cxSwitch(n, true);
					return true;
				}
		cmd = 'e';
		setError(MSG_EMinus, context);
		return false;
	}

	if(stringEqual(line, "enum")) {
		pst p, p0;
		cmd = 'e';
		if(!cw->dol) {
			setError(MSG_AtLine0);
			return false;
		}
		 p0 = p = fetchLine(cw->dot, 1);
		n = -1;
		while(*p != '\n') {
			if(isdigitByte(*p)) {
				n = atoi((char*)p);
				break;
			}
			++p;
		}
		free(p0);
		if(n < 0) {
			setError(MSG_NumberExpected);
			return false;
		}
		sprintf(shortline, "e%d", n);
		return 2;
	}

	if (!strncmp(line, "db>", 3)) {
		setDebugFile(line + 3);
		return true;
	}

	if (stringEqual(line, "rr")) {
		cmd = 'e';
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			return false;
		}
		rerender(1);
		return true;
	}

	if (!strncmp(line, "rr=", 3) && isdigitByte(line[3])) {
		rr_interval = atoi(line + 3);
		if(rr_interval < 5) // even 5 is prettty unreasonable
			rr_interval = 5;
		return true;
	}

	if(stringEqual(line, "rr=")) {
		eb_printf("%d\n", rr_interval);
		return true;
	}

	if (line[0] == 'u' && line[1] == 'a' && isdigitByte(line[2])
	    && (!line[3] || (isdigitByte(line[3]) && !line[4]))) {
		char *t = 0;
		n = atoi(line + 2);
		if (n < MAXAGENT)
			t = userAgents[n];
		cmd = 'e';
		if (!t) {
			setError(MSG_NoAgent, n);
			return false;
		}
		agentIndex = n, currentAgent = t;
		if (helpMessagesOn || debugLevel >= 1)
			eb_puts(currentAgent);
		return true;
	}

	if(stringEqual(line, "ua")) {
		eb_printf("%d: %s\n", agentIndex, currentAgent);
		return true;
	}

	if (stringEqual(line, "re") || stringEqual(line, "rea")) {
		undoCompare();
		cw->undoable = false;
		cmd = 'e';	// so error messages are printed
		if(cw->imapMode2 && cw->dol) {
// basically g and re
			char *p = (char *)cw->r_map[cw->dot].text; // uid and subject for the email
			if(! mailDescend(p, 'g')) return false;
		}
		rc = setupReply(line[2] == 'a');
		if (rc && cw->browseMode) {
			ub = false;
			cw->browseMode = cf->browseMode = false;
			goto et_go;
		}
		return rc;
	}

/* ^^^^ is the same as ^4; same with & */
	if ((line[0] == '^' || line[0] == '&') && line[1] == line[0]) {
		const char *t = line + 2;
		while (*t == line[0])
			++t;
		if (!*t) {
			sprintf(shortline, "%c%ld", line[0], (long)(t - line));
			return 2;
		}
	}

	if (!strncmp(line, "sort", 4)
	    && (line[4] == '+' || line[4] == '-' || line[4] == '=') &&
	    line[5] && !line[6] && strchr("ast", line[5])) {
		ls_sort = 0;
		if (line[5] == 's')
			ls_sort = 1;
		if (line[5] == 't')
			ls_sort = 2;
		ls_reverse = false;
		if (line[4] == '-')
			ls_reverse = true;
		if (helpMessagesOn) {
			if (ls_reverse)
				i_printf(MSG_Reverse);
			i_puts(MSG_SortAlpha + ls_sort);
		}
		return true;
	}

	if(stringEqual(line, "pwd"))
		line = "cd";
	if (line[0] == 'c' && line[1] == 'd') {
		c = line[2];
		if (!c || isspaceByte(c)) {
			const char *t = line + 2;
			skipWhite(&t);
			c = *t;
			cmd = 'e';	/* so error messages are printed */
			if (!c) {
				char cwdbuf[ABSPATH];
pwd:
				if (!getcwd(cwdbuf, sizeof(cwdbuf))) {
					setError(c ? MSG_CDGetError :
						 MSG_CDSetError);
					return false;
				}
				eb_puts(cwdbuf);
				return true;
			}
			if (!envFile(t, &t))
				return false;
			if (!chdir(t))
				goto pwd;
			setError(MSG_CDInvalid);
			return false;
		}
	}

	if (line[0] == 'l' && line[1] == 'l') {
		c = line[2];
		if (!c) {
			eb_printf("%d\n", displayLength);
			return true;
		}
		if ((isspaceByte(c) || c == '=') && isdigitByte(line[3])) {
			displayLength = atoi(line + 3);
			if (displayLength < 80)
				displayLength = 80;
			return true;
		}
		setError(MSG_NoSpaceAfter);
		return false;
	}

	if (line[0] == 'f' && line[1] == 'l' && line[2] == 'l') {
		char *s;
		c = line[3];
		if (!c) {
			eb_printf("%d%s\n", formatLineLength,
			       (formatOverflow ? "+" : ""));
			return true;
		}
		if ((isspaceByte(c) || c == '=') && isdigitByte(line[4])) {
			formatLineLength = strtol(line + 4, &s, 10);
			if (formatLineLength < 32)
				formatLineLength = 32;
			formatOverflow = (*s == '+');
			return true;
		}
		setError(MSG_NoSpaceAfter);
		return false;
	}

	if (line[0] == 'p' && line[1] == 'b') {
		rc = playBuffer(line, NULL);
		if (rc == 2)
			goto no_action;
		cmd = 'e';	// to see the error right away
		return rc;
	}

	if (stringEqual(line, "rf")) {
		cmd = 'e';
		selfFrame();
		if (!cf->fileName) {
			setError(MSG_NoRefresh);
			return false;
		}
// refresh the imap folders is special
		if(cw->imapMode1) return imap1rf();
		if(cw->imapMode2) {
			if(cw->mail_raw) // result of a search
				return folderSearch(0, cw->mail_raw, true);
			else
				return folderDescend(0, true);
		}
		if(cw->imapMode3)
			return rfWhileReading();
		if (cw->irciMode | cw->ircoMode1) {
			setError(MSG_IrcCommandS, "rf");
			return false;
		}
		if (cw->browseMode)
			cmd = 'b';
		noStack = 2;
		allocatedLine = allocMem(strlen(cf->fileName) + 3);
		sprintf(allocatedLine, "%c %s", cmd, cf->fileName);
		debrowseSuffix(allocatedLine);
		*runThis = allocatedLine;
		uriEncoded = cf->uriEncoded;
		return 3;
	}

	if(!strncmp(line, "img", 3) &&
	(line[3] == 0 || strchr("0123456789$?", line[3]))) {
	char *h, *p;
	const char *s;
	int tagno, n, j;
	bool lookmode = false;
	s = line + 3;
	j = 0;
	if (isdigitByte(*s))
		j = strtol(s, (char **)&s, 10);
	else if (*s == '$')
		j = -1, ++s;
	if(*s == '?') lookmode = true, ++s;
	if(*s) goto no_action;
	cmd = 'e'; // show errors
	if(cw->dot == 0) {
		setError(MSG_AtLine0);
		return false;
	}
	p = (char *)fetchLine(cw->dot, -1);
	findField(p, 4, j, &n, 0, &tagno, &h, 0);
	debugPrint(5, "findField returns %d, %s", tagno, h);
	if (!h) {
		fieldNumProblem(3, "img", j, n, n);
		return false;
	}
	if(lookmode) {
		if(!strncmp(h, "data:", 5)) eb_puts("data:");
		else eb_puts(h);
		if(debugLevel >= 3) eb_printf("%d\n", tagList[tagno]->seqno);
		return true;
	}
	uriEncoded = true;
	if(!*h) { // why would this ever happen?
		*runThis = "?";
		return 2;
	}
	allocatedLine = allocMem(strlen(h) + 3);
	sprintf(allocatedLine, "e %s", h);
	*runThis = allocatedLine;
	nzFree(h);
		return 3;
	}

	if (stringEqual(line, "config")) {
		if(imapBufferPresent()) {
			setError(MSG_ImapConfig);
			return false;
		}
		readConfigFile();
		setupEdbrowseCache();
		if (curlActive) {
			if (cookieFile)
				curl_easy_setopt(global_http_handle,
						 CURLOPT_COOKIEJAR, cookieFile);
		}
		return true;
	}

	if (stringEqual(line, "shc")) {
		cmd = 'e'; // trick to always show the errors
		if(!cw->dot) {
			setError(MSG_EmptyBuffer);
			return 0;
		}
		if (!cw->sqlMode) {
			if (!cw->browseMode) {
				setError(MSG_NoBrowse);
				return false;
			}
		return showHeaders(cw->dot);
		}
		showColumns();
		return true;
	}

	if (stringEqual(line, "shf")) {
		if (!cw->sqlMode) {
			setError(MSG_NoDB);
			return false;
		}
		showForeign();
		return true;
	}

	if (stringEqual(line, "sht")) {
		if (!ebConnect())
			return false;
		return showTables();
	}

	if (stringEqual(line, "jdb")) {
		const Tag *t;
		cmd = 'e';
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			return false;
		}
		if (!isJSAlive) {
			setError(MSG_JavaOff);
			return false;
		}
/* debug the js context of the frame you are in */
		t = line2frame(cw->dot);
		if (t)
			cf = t->f1;
		else
			selfFrame();
		cw->jdb_frame = cf;
		debugPrint(1, "cx%d %s", cf->gsn, cf->fileName ? cf->fileName : "?");
		jSyncup(false, 0);
		return true;
	}

	if (stringEqual(line, "ub") || stringEqual(line, "et")) {
		Frame *f, *fnext;
		struct histLabel *label, *lnext;
		ub = (line[0] == 'u');
		cmd = 'e';
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			return false;
		}
		undoCompare();
		cw->undoable = false;
		undoSpecialClear();
		cw->browseMode = cf->browseMode = false;
		cf->render2 = false;
		if (cf->render1b)
			cf->render1 = cf->render1b = false;
		cf->charset = 0;
		if (ub) {
			debrowseSuffix(cf->fileName);
			cw->nlMode = cw->rnlMode;
			cw->f_dot = cw->dot;
			cw->dot = cw->r_dot, cw->dol = cw->r_dol;
			memcpy(cw->labels, cw->r_labels, sizeof(cw->labels));
			freeWindowLines(cw->map);
			cw->map = cw->r_map;
			cw->r_map = 0;
		} else {
et_go:
			cw->f_dot = 0;
			for (i = 1; i <= cw->dol; ++i)
				removeHiddenNumbers(cw->map[i].text, '\n', context, 0);
			freeWindowLines(cw->r_map);
			cw->r_map = 0;
		}
		freeTags(cw);
		cw->mustrender = false;
		cw->imapMode3 = false;
		for (f = &cw->f0; f; f = fnext) {
			fnext = f->next;
			delTimers(f);
			freeJSContext(f);
			nzFree(f->dw);
			nzFree(f->hbase);
			nzFree(f->firstURL);
			if (f != &cw->f0) {
				nzFree(f->fileName);
				free(f);
			} else {
				f->dw = 0;
				f->dw_l = 0;
				f->hbase = 0;
				f->firstURL = 0;
			}
		}
		cw->f0.next = 0;
		lnext = cw->histLabel;
		while ((label = lnext)) {
			lnext = label->prev;
			free(label);
		}
		cw->histLabel = 0;
		nzFree(cw->htmltitle);
		cw->htmltitle = 0;
		nzFree(cw->htmlauthor);
		cw->htmlauthor = 0;
		nzFree(cw->htmldesc);
		cw->htmldesc = 0;
		nzFree(cw->htmlgen);
		cw->htmlgen = 0;
		nzFree(cw->htmlkey);
		cw->htmlkey = 0;
		nzFree(cw->mailInfo), cw->mailInfo = 0;
		if (ub)
			fileSize = bufferSize(context, false);
		return true;
	}

	if (stringEqual(line, "f/") || stringEqual(line, "w/") || stringEqual(line, "w+/")) {
		char *t;
		cmd = line[0];
		if (!cf->fileName) {
			setError(MSG_NoFileName);
			return false;
		}
		t = strrchr(cf->fileName, '/');
		if (!t) {
			setError(MSG_NoSlash);
			return false;
		}
		++t;
		if (!*t) {
			setError(MSG_YesSlash);
			return false;
		}
		t = getFileURL(cf->fileName, false);
		allocatedLine = allocMem(strlen(t) + 8);
// ` prevents wildcard expansion, which normally happens on an f command
		if (line[1] == '+')
			sprintf(allocatedLine, "%c+ `%s", cmd, t);
		else
			sprintf(allocatedLine, "%c `%s", cmd, t);
		*runThis = allocatedLine;
		return 3;
	}

// If you want this feature, e< f< b< w< r<, uncomment this,
// and be sure to document it in usersguide.
#if 0
	if (strchr("bwref", line[0]) && line[1] == '<') {
		allocatedLine = lessFile(line + 2, false);
		if (allocatedLine == 0)
			return false;
		n = strlen(allocatedLine);
		allocatedLine = reallocMem(allocatedLine, n + 4);
		strmove(allocatedLine + 3, allocatedLine);
		allocatedLine[0] = line[0];
		allocatedLine[1] = ' ';
		allocatedLine[2] = ' ';
		if (!isURL(allocatedLine + 3))
			allocatedLine[2] = '`';	// suppress wildcard expansion
		*runThis = allocatedLine;
		return 3;
	}
#endif

	if (stringEqual(line, "ft") || stringEqual(line, "fa") ||
	    stringEqual(line, "fd") || stringEqual(line, "fg") ||
	    stringEqual(line, "fk") || stringEqual(line, "fu")) {
		const char *s = 0;
		int t;
		cmd = 'e';
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			return false;
		}
		if (line[1] == 't')
			s = cw->htmltitle, t = MSG_NoTitle;
		if (line[1] == 'a')
			s = cw->htmlauthor, t = MSG_NoAuthor;
		if (line[1] == 'd')
			s = cw->htmldesc, t = MSG_NoDesc;
		if (line[1] == 'g')
			s = cw->htmlgen, t = MSG_NoGenerator;
		if (line[1] == 'k')
			s = cw->htmlkey, t = MSG_NoKeywords;
		if (line[1] == 'u')
			s = cw->saveURL, t = MSG_NoFileName;
		if (s)
			eb_puts(s);
		else
			i_puts(t);
		return true;
	}

	if (line[0] == 's' && line[1] == 'm') {
		const char *t = line + 2;
		bool dosig = true;
		int account = 0;
		cmd = 'e';
		if (*t == '-') { dosig = false;
			++t;
		}
		if (isdigitByte(*t))
			account = strtol(t, (char **)&t, 10);
		if (!*t) {
// In case we haven't started curl yet.
			if (!curlActive) {
				eb_curl_global_init();
// we don't need cookies and cache for email, but http might follow.
				cookiesFromJar();
				setupEdbrowseCache();
			}
			return sendMailCurrent(account, dosig);
		} else {
			setError(MSG_SMBadChar);
			return false;
		}
	}

	if (stringEqual(line, "ci")) {
		caseInsensitive ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(caseInsensitive + MSG_CaseSen);
		return true;
	}

	if (stringEqual(line, "ci+") || stringEqual(line, "ci-")) {
		caseInsensitive = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(caseInsensitive + MSG_CaseSen);
		return true;
	}

	if (stringEqual(line, "sg")) {
		searchStringsAll ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(searchStringsAll + MSG_SubLocal);
		return true;
	}

	if (stringEqual(line, "sg+") || stringEqual(line, "sg-")) {
		searchStringsAll = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(searchStringsAll + MSG_SubLocal);
		return true;
	}

	if (stringEqual(line, "ebre")) {
		ebre ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(ebre + MSG_EbreOff);
		return true;
	}

	if (stringEqual(line, "ebre+") || stringEqual(line, "ebre-")) {
		ebre = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(ebre + MSG_EbreOff);
		return true;
	}

	if (stringEqual(line, "dr")) {
		dirWrite = 0;
		if (helpMessagesOn)
			i_puts(MSG_DirReadonly);
		return true;
	}

	if (stringEqual(line, "dw")) {
		dirWrite = 1;
		if (helpMessagesOn)
			i_puts(MSG_DirWritable);
		return true;
	}

	if (stringEqual(line, "dx")) {
		dirWrite = 2;
		if (helpMessagesOn)
			i_puts(MSG_DirX);
		return true;
	}

	if (stringEqual(line, "dno")) {
		dno ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(dno + MSG_DirNamesOnlyOff);
		return true;
	}

	if (stringEqual(line, "dno+") || stringEqual(line, "dno-")) {
		dno = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(dno + MSG_DirNamesOnlyOff);
		return true;
	}

	if (stringEqual(line, "flow")) {
		flow ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(flow + MSG_FormatFlowedOff);
		return true;
	}

	if (stringEqual(line, "flow+") || stringEqual(line, "flow-")) {
		flow = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(flow + MSG_FormatFlowedOff);
		return true;
	}

	if (stringEqual(line, "hr")) {
		allowRedirection ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(allowRedirection + MSG_RedirectionOff);
		return true;
	}

	if (stringEqual(line, "hr+") || stringEqual(line, "hr-")) {
		allowRedirection = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(allowRedirection + MSG_RedirectionOff);
		return true;
	}

	if (stringEqual(line, "pg")) {
		pluginsOn ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(pluginsOn + MSG_PluginsOff);
		return true;
	}

	if (stringEqual(line, "pg+") || stringEqual(line, "pg-")) {
		pluginsOn = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(pluginsOn + MSG_PluginsOff);
		return true;
	}

	if (stringEqual(line, "bg")) {
		down_bg ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(down_bg + MSG_DownForeground);
		return true;
	}

	if (stringEqual(line, "bg+") || stringEqual(line, "bg-")) {
		down_bg = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(down_bg + MSG_DownForeground);
		return true;
	}
	if (stringEqual(line, "jsbg")) {
		down_jsbg ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(down_jsbg + MSG_JSDownForeground);
		return true;
	}

	if (stringEqual(line, "jsbg+") || stringEqual(line, "jsbg-")) {
		down_jsbg = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(down_jsbg + MSG_JSDownForeground);
		return true;
	}

	if (stringEqual(line, "bglist")) {
		bg_jobs(false);
		return true;
	}

	if (stringEqual(line, "bflist") || !strncmp(line, "bflist/", 7) || !strncmp(line, "bflist?", 7)) {
		const char c = line[6];
		const char *s = line + 7;
		for (i = 1; i <= maxSession; ++i) {
			const char *title;
			n = (!c || c == '/') ? i : 1 + maxSession -i;
			Window *lw = sessionList[n].lw;
			if (!lw) continue;
			if (searchSameMode && !sameMode(lw, cw)) continue;
			title = windowTitle(lw);
			if (c && *s && !strcasestr(title, s))
				continue;
			eb_printf("%d%c %s\n", n, (n == context ? '*' : ':'), title);
		}
		return true;
	}

	if (stringEqual(line, "hist") || !strncmp(line, "hist/", 5) || !strncmp(line, "hist?", 5)) {
		const char c = line[4];
		const char *str = line + 5;
		const Window *w, *x;
		struct ebSession *s = sessionList + context;
		if (!c || c == '/') {
// This is the only place where not having a next link is a pain in the ass!
			for(n = -1, w = cw; w; w = w->prev, ++n) ;
			w = s->fw;
			while(true) {
				const char *title = windowTitle(w);
				if (!c || ((!searchSameMode || sameMode(w, cw)) && (!*str || strcasestr(title, str))))
					eb_printf("%c%d: %s\n", (n) ? '+' : '*', n, title);
				if(w == cw) break;
				--n;
				for(x = s->lw; x->prev != w; x = x->prev) ;
				w = x;
			}
			w = s->fw2;
			if(!w) return true;
			while(true) {
				const char *title = windowTitle(w);
				if (!c || ((!searchSameMode || sameMode(w, cw)) && (!*str || strcasestr(title, str))))
					eb_printf("-%d: %s\n", ++n, title);
				if(w == s->lw2) break;
				for(x = s->lw2; x->prev != w; x = x->prev) ;
				w = x;
			}
		} else {
			for(n = 0, w = s->lw2; w != s->fw2; ++n, w = w->prev) ;
			++n;
			for(w = s->lw2; w; --n, w = w->prev) {
				const char *title = windowTitle(w);
				if (!c || ((!searchSameMode || sameMode(w, cw)) && (!*str || strcasestr(title, str))))
					eb_printf("-%d: %s\n", n, title);
			}
			for(n = 0, w = cw; w; ++n, w = w->prev) {
				const char *title = windowTitle(w);
				if (!c || ((!searchSameMode || sameMode(w, cw)) && (!*str || strcasestr(title, str))))
					eb_printf("%c%d: %s\n", (n) ? '+' : '*', n, title);
			}
		}
		return true;
	}

	if (stringEqual(line, "help")) {
		return helpUtility();
	}

	if (stringEqual(line, "iu")) {
		iuConvert ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(iuConvert + MSG_IUConvertOff);
		return true;
	}

	if (stringEqual(line, "iu+") || stringEqual(line, "iu-")) {
		iuConvert = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(iuConvert + MSG_IUConvertOff);
		return true;
	}

	if (stringEqual(line, "sr")) {
		sendReferrer ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(sendReferrer + MSG_RefererOff);
		return true;
	}

	if (stringEqual(line, "sr+") || stringEqual(line, "sr-")) {
		sendReferrer = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(sendReferrer + MSG_RefererOff);
		return true;
	}

	if (stringEqual(line, "js")) {
#if 0
		if (blockJS) {
			i_puts(MSG_JavaBlock);
			return true;
		}
#endif
		allowJS ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(allowJS + MSG_JavaOff);
		return true;
	}

	if (stringEqual(line, "js+") || stringEqual(line, "js-")) {
#if 0
		if (blockJS) {
			i_puts(MSG_JavaBlock);
			return true;
		}
#endif
		allowJS = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(allowJS + MSG_JavaOff);
		return true;
	}

	if (stringEqual(line, "bd")) {
		binaryDetect ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(binaryDetect + MSG_BinaryIgnore);
		return true;
	}

	if (stringEqual(line, "bd+") || stringEqual(line, "bd-")) {
		binaryDetect = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(binaryDetect + MSG_BinaryIgnore);
		return true;
	}

	if (stringEqual(line, "sss")) {
		searchSameMode ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(searchSameMode + MSG_SearchSameModeOff);
		return true;
	}

	if (stringEqual(line, "sss+") || stringEqual(line, "sss-")) {
		searchSameMode = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(searchSameMode + MSG_SearchSameModeOff);
		return true;
	}

	if (stringEqual(line, "sw")) {
		searchWrap ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(searchWrap + MSG_WrapOff);
		return true;
	}

	if (stringEqual(line, "sw+") || stringEqual(line, "sw-")) {
		searchWrap = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(searchWrap + MSG_WrapOff);
		return true;
	}

	if (stringEqual(line, "rl")) {
		inputReadLine ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(inputReadLine + MSG_InputTTY);
		return true;
	}

	if (stringEqual(line, "rl+") || stringEqual(line, "rl-")) {
		inputReadLine = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(inputReadLine + MSG_InputTTY);
		return true;
	}

	if (stringEqual(line, "crs")) {
		if (curlActive) {
			mergeCookies();
			eb_curl_global_cleanup();
		}
		curlActive = false;
		return true;
	}

	if (stringEqual(line, "can")) {
		curlAuthNegotiate ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(curlAuthNegotiate + MSG_CurlNoAuthNegotiate);
		return true;
	}

	if (stringEqual(line, "can+") || stringEqual(line, "can-")) {
		curlAuthNegotiate = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(curlAuthNegotiate + MSG_CurlNoAuthNegotiate);
		return true;
	}

	if (stringEqual(line, "lna")) {
		listNA ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(listNA + MSG_ListControl);
		return true;
	}

	if (stringEqual(line, "lna+") || stringEqual(line, "lna-")) {
		listNA = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(listNA + MSG_ListControl);
		return true;
	}

	if (stringEqual(line, "ftpa")) {
		ftpActive ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(MSG_PassiveMode + ftpActive);
		return true;
	}

	if (stringEqual(line, "ftpa+") || stringEqual(line, "ftpa-")) {
		ftpActive = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(ftpActive + MSG_PassiveMode);
		return true;
	}

	if (line[0] == 'p' && line[1] == 'd' &&
	    line[2] && strchr("qdc", line[2]) && !line[3]) {
		showProgress = line[2];
		if (helpMessagesOn || debugLevel >= 1) {
			if (showProgress == 'q')
				i_puts(MSG_ProgressQuiet);
			if (showProgress == 'd')
				i_puts(MSG_ProgressDots);
			if (showProgress == 'c')
				i_puts(MSG_ProgressCount);
		}
		return true;
	}

	if (stringEqual(line, "vs")) {
		verifyCertificates ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(verifyCertificates + MSG_CertifyOff);
		return true;
	}

	if (stringEqual(line, "vs+") || stringEqual(line, "vs-")) {
		verifyCertificates = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(verifyCertificates + MSG_CertifyOff);
		return true;
	}

	if (stringEqual(line, "local")) {
		hlocal ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(hlocal + MSG_HttpInternet);
		return true;
	}

	if (stringEqual(line, "local+") || stringEqual(line, "local-")) {
		hlocal = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(hlocal + MSG_HttpInternet);
		return true;
	}

	if (stringEqual(line, "dbcn")) {
		debugClone ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugClone + MSG_DebugCloneOff);
		return true;
	}

	if (stringEqual(line, "dbcn+") || stringEqual(line, "dbcn-")) {
		debugClone = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(debugClone + MSG_DebugCloneOff);
		return true;
	}

	if (stringEqual(line, "dbev")) {
		debugEvent ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugEvent + MSG_DebugEventOff);
		return true;
	}

	if (stringEqual(line, "dbev+") || stringEqual(line, "dbev-")) {
		debugEvent = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(debugEvent + MSG_DebugEventOff);
		return true;
	}

	if (stringEqual(line, "dberr")) {
		debugThrow ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugThrow + MSG_DebugThrowOff);
		return true;
	}

	if (stringEqual(line, "dberr+") || stringEqual(line, "dberr-")) {
		debugThrow = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(debugThrow + MSG_DebugThrowOff);
		return true;
	}

	if (stringEqual(line, "dbcss")) {
		debugCSS ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugCSS + MSG_DebugCSSOff);
		if (debugCSS)
			unlink(cssDebugFile);
		return true;
	}

	if (stringEqual(line, "dbcss+") || stringEqual(line, "dbcss-")) {
		debugCSS = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(debugCSS + MSG_DebugCSSOff);
		if (debugCSS)
			unlink(cssDebugFile);
		return true;
	}

	if (stringEqual(line, "dbtags")) {
		debugScanner ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugScanner + MSG_DebugTagsOff);
		return true;
	}

	if (stringEqual(line, "dbtags+") || stringEqual(line, "dbtags-")) {
		debugScanner = (line[6] == '+');
		if (helpMessagesOn)
			i_puts(debugScanner + MSG_DebugTagsOff);
		return true;
	}

	if (stringEqual(line, "dblay")) {
		debugLayout ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(debugLayout + MSG_DebugLayOff);
		return true;
	}

	if (stringEqual(line, "dblay+") || stringEqual(line, "dblay-")) {
		debugLayout = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(debugLayout + MSG_DebugLayOff);
		return true;
	}

	if (stringEqual(line, "demin")) {
		demin ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(demin + MSG_DeminOff);
		return true;
	}

	if (stringEqual(line, "demin+") || stringEqual(line, "demin-")) {
		demin = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(demin + MSG_DeminOff);
		return true;
	}

	if (stringEqual(line, "trace")) {
		uvw ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(uvw + MSG_DebugTraceOff);
		return true;
	}

	if (stringEqual(line, "trace+") || stringEqual(line, "trace-")) {
		uvw = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(uvw + MSG_DebugTraceOff);
		return true;
	}

	if (stringEqual(line, "tmlist")) {
		showTimers();
		return true;
	}

	if (stringEqual(line, "timers")) {
		gotimers ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(gotimers + MSG_TimersOff);
		return true;
	}

	if (stringEqual(line, "timers+") || stringEqual(line, "timers-")) {
		gotimers = (line[6] == '+');
		if (helpMessagesOn)
			i_puts(gotimers + MSG_TimersOff);
		return true;
	}

	if(!strncmp(line, "selsep=", 7)) {
		char oldsep = selsep;
		if(!(c = line[7])) {
			eb_printf("%c\n", selsep);
			return true;
		}
		if(c == selsep)
			return true;
		if(charInOptions(c)) {
			setError(MSG_OptionC, c);
			return 0;
		}
		if(charInFiles(c)) {
			setError(MSG_FileC, c);
			return 0;
		}
		selsep = c;
// FixFiles has to be first, as FixOptions runs rerender
		charFixFiles(oldsep);
		charFixOptions(oldsep);
		return true;
	}

	if(!strncmp(line, "speed=", 6)) {
		char *t;
		if(!(c = line[6])) {
			eb_printf("%d\n", timerspeed);
			return true;
		}
		n = strtol(line + 6, &t, 10);
		if(n < 0 || *t)
			return 2; // wrong syntax
		timerspeed = n ? n : 1;
		return true;
	}

	if (stringEqual(line, "hf")) {
		showHiddenFiles ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(showHiddenFiles + MSG_HiddenOff);
		return true;
	}

	if (stringEqual(line, "hf+") || stringEqual(line, "hf-")) {
		showHiddenFiles = (line[2] == '+');
		if (helpMessagesOn)
			i_puts(showHiddenFiles + MSG_HiddenOff);
		return true;
	}

	if (stringEqual(line, "attimg")) {
		attimg ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(attimg + MSG_AttImgOff);
		rerender(0);
		return true;
	}

	if (stringEqual(line, "attimg+") || stringEqual(line, "attimg-")) {
		attimg = (line[6] == '+');
		if (helpMessagesOn)
			i_puts(attimg + MSG_AttImgOff);
		rerender(0);
		return true;
	}

	if (stringEqual(line, "showchan")) {
		if(!cw->irciMode) { setError(MSG_NotIrcSend); return false; }
		cw->ircChannels ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(cw->ircChannels + MSG_ShowChanOff);
		return true;
	}

	if (stringEqual(line, "showchan+") || stringEqual(line, "showchan-")) {
		if(!cw->irciMode) { setError(MSG_NotIrcSend); return false; }
		cw->ircChannels = (line[8] == '+');
		if (helpMessagesOn)
			i_puts(cw->ircChannels + MSG_ShowChanOff);
		return true;
	}

	if (stringEqual(line, "showall")) {
		showall ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(showall + MSG_HoverOff);
		if (cw->browseMode)
			rerender(0);
		return true;
	}

	if (stringEqual(line, "showall+") || stringEqual(line, "showall-")) {
		showall = (line[7] == '+');
		if (helpMessagesOn)
			i_puts(showall + MSG_HoverOff);
		if (cw->browseMode && isJSAlive)
			rerender(0);
		return true;
	}

	if (stringEqual(line, "colors")) {
		doColors ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(doColors + MSG_ColorOff);
		if (cw->browseMode && isJSAlive)
			rerender(0);
		return true;
	}

	if (stringEqual(line, "colors+") || stringEqual(line, "colors-")) {
		doColors = (line[6] == '+');
		if (helpMessagesOn)
			i_puts(doColors + MSG_ColorOff);
		if (cw->browseMode && isJSAlive)
			rerender(0);
		return true;
	}

	if (stringEqual(line, "su8")) {
		re_utf8 ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(re_utf8 + MSG_ReAscii);
		return true;
	}

	if (stringEqual(line, "su8+") || stringEqual(line, "su8-")) {
		re_utf8 = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(re_utf8 + MSG_ReAscii);
		return true;
	}

	if (!strncmp(line, "ds=", 3)) {
		if (!line[3]) {
			if (!dbarea || !*dbarea) {
				i_puts(MSG_DBNoSource);
			} else {
				eb_printf("%s", dbarea);
				if (dblogin)
					eb_printf(",%s", dblogin);
				if (dbpw)
					eb_printf(",%s", dbpw);
				nl();
			}
			return true;
		}
		dbClose();
		setDataSource(cloneString(line + 3));
		return true;
	}

	if (stringEqual(line, "fbc")) {
		fetchBlobColumns ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(MSG_FetchBlobOff + fetchBlobColumns);
		return true;
	}

	if (stringEqual(line, "fbc+") || stringEqual(line, "fbc-")) {
		fetchBlobColumns = (line[3] == '+');
		if (helpMessagesOn)
			i_puts(fetchBlobColumns + MSG_FetchBlobOff);
		return true;
	}

	if (stringEqual(line, "endm")) {
		endMarks ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(endMarks + MSG_MarkersOff);
		return true;
	}

	if (stringEqual(line, "endm+") || stringEqual(line, "endm-")) {
		endMarks = (line[4] == '+');
		if (helpMessagesOn)
			i_puts(endMarks + MSG_MarkersOff);
		return true;
	}

	if (stringEqual(line, "enew") || stringEqual(line, "etmp")) {
		bool etmp = (line[1] == 't');
		Window *w;
		cmd = 'e';
		if(cw->irciMode | cw->ircoMode) {
			setError(MSG_IrcCommand, 'e');
			return false;
		}
		if(!etmp && !cxQuit( context, 0))
			return false;
		undoCompare();
		cw->undoable = false;
		undoSpecialClear();
		freeWindows(context, false);
		w = createWindow();
		w->sno = context;
		w->prev = cw;
		cw = w;
		if(etmp) cw->quitMode = true;
		selfFrame();
		cs->lw = w;
		debugPrint(1, "0");
		return true;
	}

	if(!strncmp(line, "irc", 3) && (isspaceByte(line[3]) || line[3] == 0)) {
		cmd = 'e';
		char *p = cloneString(line);
		rc = ircSetup(p);
		nzFree(p);
		if(rc && cw->ircoMode) {
			cw->changeMode = false;
		}
		return rc;
	}

	if(!strncmp(line, "imap", 4) && (isspaceByte(line[4]) || line[4] == 0)) {
		cmd = 'e';
		if(!cxQuit(context, 0)) return false;
		undoCompare();
		cw->changeMode = cw->undoable = false;
		char *p = cloneString(line);
		rc = imapBuffer(p);
		nzFree(p);
		return rc;
	}

no_action:
	*runThis = line;
	return 2;		/* no change */
}

// these two-letter commands are ok to run even in a g/re/ construct.
// There aren't very many of them.
static int twoLetterG(const char *line, const char **runThis)
{
	bool rc;

	if (stringEqual(line, "bw") || !strncmp(line, "bw/", 3) || !strncmp(line, "bw?", 3) || (!strncmp(line, "bw", 2) && isdigitByte(line[2]))) {
		Window *lw;
		if(!line[2]) lw = cw;
		else if(line[2] == '/' || line[2] == '?') {
			const int n = sessionByText(line + 3, line[2] == '/' ? 1 : -1);
			if(!n) return false;
			lw = sessionList[n].lw;
		} else {
			const char *s = line + 2;
			const int n = strtol(s, (char **)&s, 10);
			if(*s) {
				setError(MSG_BWAfter);
				return false;
			}
			if (!cxCompare(n))
				return false;
			if (!cxActive(n, true))
				return false;
			lw = sessionList[n].lw;
		}
		lw->changeMode = false;
		lw->quitMode = true;
		return true;
	}

	if(!strncmp(line, "dld=", 4)) {
		nzFree(down_prefile);
		if(line[4]) down_prefile = cloneString(line+4);
		else down_prefile = 0;
		return true;
	}

	if (line[0] == 'l' && line[1] == 's') {
		char lsmode[12];
		bool setmode = false;
		char *file, *path, *t;
		const char *s = line + 2;
		skipWhite(&s);
		if (*s == '=') {
			setmode = true;
			++s;
			skipWhite(&s);
		} else if (stringEqual(s, "X")) {
			if (!cw->dirMode) {
				setError(MSG_NoDir);
				return globSub = false;
			} else
				return true;
		}
		if (!lsattrChars(s, lsmode)) {
			setError(MSG_LSBadChar);
			return globSub = false;
		}
		if (setmode) {
			strcpy(lsformat, lsmode);
			return true;
		}
// default ls mode is size time
		if (!lsmode[0])
			strcpy(lsmode, "st");
		if(cw->ircoMode1 && stringEqual(lsmode, "t")) {
			if (cw->dot == 0) {
				setError(MSG_AtLine0);
				return false;
			}
			const char *timestring = cw->r_map ? (char*)cw->r_map[cw->dot].text : emptyString;
			puts(timestring == emptyString ? "-" : timestring);
			return true;
		}
		if (cw->dirMode) {
			if (cw->dot == 0) {
				setError(MSG_AtLine0);
				return false;
			}
			file = (char *)fetchLine(cw->dot, -1);
			t = strchr(file, '\n');
			if (!t) i_printfExit(MSG_NoNlOnDir, file);
			*t = 0;
			path = makeAbsPath(file);
			*t = '\n';	// put it back
		} else {
			path = cloneString(cf->fileName);
			if(cw->browseMode) debrowseSuffix(path);
			path = skipFileProtocol(path);
			if(!path || !*path) {
				setError(MSG_MissingFileName);
				return false;
			}
		}
		if (path && fileTypeByName(path, 1))
			t = lsattr(path, lsmode);
		else
			t = emptyString;
		if (*t)
			eb_puts(t);
		else
			i_puts(MSG_Inaccess);
		return true;
	}

	if (line[0] == 'd' && line[1] == 'b' && isdigitByte(line[2])
	    && !line[3]) {
		if(!inInitFunction)
			debugLevel = line[2] - '0';
		return true;
	}

	if(stringEqual(line, "db")) {
		eb_printf("%d\n", debugLevel);
		return true;
	}

	if (stringEqual(line, "ebvar")) {
		ebvar ^= 1;
		if (helpMessagesOn || debugLevel >= 1)
			i_puts(ebvar + MSG_UpdateEBVarOff);
		return true;
	}

	if (stringEqual(line, "ebvar+") || stringEqual(line, "ebvar-")) {
		ebvar = (line[5] == '+');
		if (helpMessagesOn)
			i_puts(ebvar + MSG_UpdateEBVarOff);
		return true;
	}

	if (stringEqual(line, "H")) {
		if (helpMessagesOn ^= 1)
			if (debugLevel >= 1)
				i_puts(MSG_HelpOn);
		return true;
	}

	if (stringEqual(line, "H+") || stringEqual(line, "H-")) {
		helpMessagesOn = (line[1] == '+');
		if (helpMessagesOn && debugLevel >= 1)
			i_puts(MSG_HelpOn);
		return true;
	}

	if(!strncmp(line, "P ", 2) || !strncmp(line, "P=", 2)) {
		nzFree(promptString);
		if(line[2]) promptString = cloneString(line+2);
		else promptString = 0;
		return true;
	}

	if(!strncmp(line, "p ", 2)) {
		eb_puts(line + 2);
		return true;
	}

	return 2;		/* no change */
}

static char *showLinks(void)
{
	int a_l;
	char *a = initString(&a_l);
	bool click, dclick;
	char c, *p, *s, *t, *q, *line, *h, *h2;
	int j, k, ln, tagno;
	const Tag *tag;

	if (cw->browseMode && endRange) {
	    for(ln = startRange; ln <= endRange; ++ln) {
		line = (char *)fetchLine(ln, -1);
		k = 0;
		for (p = line; (c = *p) != '\n'; ++p) {
			if (c != InternalCodeChar)
				continue;
			if (!isdigitByte(p[1]))
				continue;
			j = strtol(p + 1, &s, 10);
			if (*s != '{')
				continue;
			p = s;
			++k;
			findField(line, 0, k, 0, 0, &tagno, &h, &tag);
			if (tagno != j)
				continue;	// should never happen

			click = tagHandler(tagno, "onclick");
			dclick = tagHandler(tagno, "ondblclick");

// find the closing brace
// It might not be there, could be on the next line.
			for (s = p + 1; (c = *s) != '\n'; ++s)
				if (c == InternalCodeChar && s[1] == '0'
				    && s[2] == '}')
					break;
// Ok, everything between p and s exclusive is the description
			if (!h)
				h = emptyString;
			if (stringEqual(h, "#"))
				nzFree(h), h = emptyString;

			if (memEqualCI(h, "mailto:", 7)) {
				stringAndBytes(&a, &a_l, p + 1, s - p - 1);
				stringAndChar(&a, &a_l, ':');
				s = h + 7;
				t = s + strcspn(s, "?");
				stringAndBytes(&a, &a_l, s, t - s);
				stringAndChar(&a, &a_l, '\n');
				nzFree(h);
				continue;
			}
// quotes may be permitted in encoded urls, apostrophes never.
			stringAndString(&a, &a_l, "<br><a href='");

			if (memEqualCI(h, "javascript:", 11)) {
				stringAndString(&a, &a_l, "javascript:'>\n");
			} else if (!*h && (click | dclick)) {
				char buf[20];
				sprintf(buf, "%s'>\n",
					click ? "onclick" : "ondblclick");
				stringAndString(&a, &a_l, buf);
			} else {
				if (*h) {
					h2 = htmlEscape(h);
					stringAndString(&a, &a_l, h2);
					nzFree(h2);
				}
				stringAndString(&a, &a_l, "'>\n");
			}

			nzFree(h);
// next line is the description of the bookmark
			h = pullString(p + 1, s - p - 1);
			if(*s == '\n' && ln < cw->dol) {
// description continues on the next line, and maybe beyond
// but I'm only going to look at the next line.
				int l;
				char *p1 = (char*)fetchLine(ln+1, -1), *s1;
				for (s1 = p1; (c = *s1) != '\n'; ++s1)
					if (c == InternalCodeChar && s1[1] == '0'
					    && s1[2] == '}')
						break;
				l = strlen(h);
				h = reallocMem(h, l + 1 + (s1-p1) + 1);
				h[l] = ' ';
				memcpy(h + l + 1, p1, s1-p1);
				h[l + 1 + (s1-p1)] = 0;
			}
			h2 = htmlEscape(h);
			stringAndString(&a, &a_l, h2);
			stringAndString(&a, &a_l, "\n</a>\n");
			nzFree(h), nzFree(h2);
		}		// loop looking for hyperlinks
	    }
	}

	if (!a_l && endRange == startRange) {		/* nothing found yet */
		if (!(h = cw->saveURL)) {
			setError(MSG_NoFileName);
			return 0;
		}
		h = htmlEscape(h);
		stringAndString(&a, &a_l, "<br><a href='");
		stringAndString(&a, &a_l, h);
		stringAndString(&a, &a_l, "'>\n");
/* get text from the html title if you can */
		s = cw->htmltitle;
		if (s && *s) {
			h2 = htmlEscape(s);
			stringAndString(&a, &a_l, h2);
			nzFree(h2);
		} else {
/* no title - getting the text from the url, very kludgy */
			s = (char *)getDataURL(h);
			if (!s || !*s)
				s = h;
			t = findHash(s);
			if (t)
				*t = 0;
			t = s + strcspn(s, "\1?");
			if (t > s && t[-1] == '/')
				--t;
			*t = 0;
			q = strrchr(s, '/');
			if (q && q < t)
				s = q + 1;
			stringAndBytes(&a, &a_l, s, t - s);
		}
		stringAndString(&a, &a_l, "\n</a>\n");
		nzFree(h);
	}

	if(a_l) removeHiddenNumbers((pst) a, 0, context, 0);
	return a;
}

static bool lineHasTag(const char *p, int tagno)
{
	char c;
	int j;
	while ((c = *p++) != '\n') {
		if (c != InternalCodeChar)
			continue;
		j = strtol(p, (char **)&p, 10);
		if(j == tagno)
			return true;
	}
	return false;
}

bool jump2anchor(const Tag *jumptag, const char *newhash)
{
	int i;
	const Tag *tag;
	const Tag *jump0 = jumptag;

// If we got here by clicking on <a href=#stuff> then jumptag is set.
// If  from b www.xyz.com#stuff, then it is not set,
// and we have to find the body of what we just browsed.
	if(!jumptag)
		jumptag = cf->bodytag;
// but what if we aren't running js, and bodytag is not set?
	if(!jumptag) {
		for(i = cw->numTags - 1; i >= 0; --i) {
			tag = tagList[i];
			if(tag->action == TAGACT_BODY) {
				jumptag = tag;
				break;
			}
		}
	}
	if(jumptag)
		jumptag = gebi_c(jumptag, newhash, true);
	if(!jumptag)
		goto hashnotfound;

	for (i = 1; i <= cw->dol; ++i) {
		char *p = (char *)fetchLine(i, -1);
		if (lineHasTag(p, jumptag->seqno)) {
			if(jump0) {
				struct histLabel *label =
				    allocMem(sizeof(struct histLabel));
				label->label = cw->dot;
				label->prev = cw->histLabel;
				cw->histLabel = label;
			}
			cw->dot = i;
			if(debugLevel >= 1)
				printDot();
			return true;
		}
	}

hashnotfound:
	setError(MSG_NoLabel2, newhash);
	return false;
}

/*********************************************************************
Run the entered edbrowse command.
This is recursive, as in g/x/d or <func
Pass in the ed command, and return success or failure.
We assume it has been turned into a C string.
This means no embedded nulls.
If you want to use null in a search or substitute, use \0.
*********************************************************************/

bool runCommand(const char *line)
{
	int i, j, n;
	int writeMode = O_TRUNC; // could change to append
	int writeLine = -1; // write text into a session
	int readLine1 = -1, readLine2 = -1; // read lines from a session
	bool wrc = false; // read write command
	bool wq = false; // the wq command, as in ed
	const char *wrc_file = 0;
	char *atsave = 0;
	Window *w = NULL;
	const Tag *tag = 0, *jumptag = 0;
	bool nogo = true, rc = true;
	bool emode = false;	// force e, not browse
	bool postSpace = false, didRange = false;
	char first;
	int cx = 0;		// numeric suffix as in s/x/y/3 or w2
	const Tag *gotag = 0;
	int tagno;
	int newloc_count = 0;
	const char *s = NULL;
		char *p;
	char *thisfile;
	const char *browseSuffix = 0;
	bool plainMail = false;
		char *allocatedLine;
	static char newline[MAXTTYLINE];

	selfFrame();
	redirect_count = 0;
	js_redirects = false;
	cmd = icmd = 'p';
	uriEncoded = false;
	if(!globSub) bad_utf8_alert = false;

// Here is where we initialize allocatedLine, by possibly expanding variables.
	if(!varExpand(line, &allocatedLine))
		return false;
	if(allocatedLine) line = allocatedLine;

	skipWhite(&line);
	first = *line;
	noStack = 0;

	debugPrint(8, "in:%s", line);
	if (!strncmp(line, "ReF@b", 5)) {
		line += 4;
		noStack = 1;
		uriEncoded = true;
		if (cf != newloc_f) {
/* replace a frame, not the whole window */
			newlocation = cloneString(line + 2);
			goto replaceframe;
		}
	}

		if (first == '#')
			goto success;

	if (!globSub) {
		madeChanges = false;

/* Watch for successive q commands. */
		lastq = lastqq, lastqq = 0;

// force a noStack
		if (!strncmp(line, "nostack ", 8))
			noStack = 2, line += 8, first = *line;
		if (!strncmp(line, "^ ", 2))
			noStack = 2, line += 2, first = *line;

/* special 2 letter commands - most of these change operational modes */
		j = twoLetter(line, &line);
		if (j < 2) goto donej;
		if(j == 3) allocatedLine = (char*)line;
	}

	j = twoLetterG(line, &line);
	if (j < 2) goto donej;
	if(j == 3) allocatedLine = (char*)line;

	if (first == '!') {
		rc = shellEscape(line + 1);
		goto done;
	}

	if(stringEqual(line, "eret")) {
		sprintf(newline, "e%d", cx_previous);
		line = newline;
	}

	startRange = endRange = cw->dot;	// default range
	first = *line;
	if (first == 0) {
		didRange = true;
		++startRange, ++endRange;
		if (endRange > cw->dol) {
			setError(MSG_EndBuffer);
			goto fail;
		}
	}

// search the imap server, not a local regexp search
	if(cw->imapMode1 && first == '/' && cw->dot &&
// there are some different syntaxes here
	(stringEqual(line, "/u") ||
	(line[1] && strchr("fstb", line[1]) && line[2] == ' ')  ||
	(line[1] == 'u' && line[2] && strchr("fstb", line[2]) && line[3] == ' '))) {
		rc = folderSearch((char*)cw->r_map[cw->dot].text, (char*)line + 1, false);
		goto done;
	}

	if (first == ',') {
		startRange = 1;
		if (cw->dol == 0)
			startRange = 0;
		goto range2;
	}

	if (first == ';') {
		didRange = true;
		++line;
		startRange = cw->dot;
		endRange = cw->dol;
	}

	if (first == 'j' || first == 'J') {
		didRange = true;
		endRange = startRange + 1;
		if (endRange > cw->dol) {
			setError(MSG_EndJoin);
			goto fail;
		}
	}

	if (first == '=') {
		didRange = true;
		startRange = endRange = cw->dol;
	}

	if (first == 'w' || first == 'W' || first == 'v' || (first == 'g' && line[1]
					     && strchr(valid_delim, line[1])
					     && !stringEqual(line, "g-")
					     && !stringEqual(line, "g?"))) {
		didRange = true;
		startRange = 1;
		if (cw->dol == 0)
			startRange = 0;
		endRange = cw->dol;
	}

	if (!didRange) {
		if (!getRangePart(line, &startRange, &line))
			goto failg;
		endRange = startRange;
		if(line[0] == 'j' || line[0] == 'J') { // special case, 5j
			endRange = startRange + 1;
			if (endRange > cw->dol) {
				setError(MSG_EndJoin);
				goto fail;
			}
		}
		if (line[0] == ',') {
range2:
			++line;
			endRange = cw->dol;	/* new default */
			first = *line;
			if (first && strchr(valid_laddr, first)) {
				if (!getRangePart(line, &endRange, &line))
					goto failg;
			}
		}
	}
	if (endRange < startRange) {
		setError(MSG_BadRange);
		goto fail;
	}

	skipWhite(&line);
	first = *line;
/* change uc into a substitute command, converting the whole line */
	if ((first == 'u' || first == 'l' || first == 'm') && line[1] == 'c' &&
	    line[2] == 0) {
		sprintf(newline, "s/.*/%cc/fp", first);
		line = newline;
	}

	if (stringEqual(line, "ur") ||
	stringEqual(line, "ur+") ||
	stringEqual(line, "ur-")) {
		Tag *w;
		char c = line[2];
		cmd = 'e'; // trick to always show the errors
		if(!cw->dot) {
			setError(MSG_EmptyBuffer);
			goto fail;
		}
		if (cw->sqlMode) {
			sql_unfold(startRange, endRange, c);
			goto success;
		}
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			goto fail;
		}
		for(i = startRange; i <= endRange; ++i)
			if((w = line2tr(i)))
				w->inur = false;
		for(i = startRange; i <= endRange; ++i)
			if((w = line2tr(i)) && !w->inur) {
				w->inur = true;
// could be a <th> row
				if(all_th(w)) continue;
				if(c == 0)
					w->ur ^= 1;
				if(c == '+')
					w->ur = 1;
				if(c == '-')
					w->ur = 0;
			}
		rerender(1);
		goto success;
	}

// Breakline is actually a substitution of lines
	if (stringEqual(line, "bl")) {
		if (cw->dirMode) {
			setError(MSG_BreakDir);
			goto fail;
		}
		if (cw->sqlMode) {
			setError(MSG_BreakDB);
			goto fail;
		}
		if (cw->ircoMode) {
			setError(MSG_BreakIrc);
			goto fail;
		}
		if (cw->imapMode1 || cw->imapMode2) {
			setError(MSG_BreakImap);
			goto fail;
		}
		if (cw->browseMode) {
			setError(MSG_BreakBrowse);
			goto fail;
		}
		line = "s`bl";
	}

// [eqwr<][/?] and w+[/?] commands
	if((first == 'e' || first == 'q') && (line[1] == '/' || line[1] == '?')) {
		cmd = 'e';
		n = sessionByText(line + 2, line[1] == '/' ? 1 : -1);
		if(!n) goto failg;
		sprintf(newline, "%c%d", first, n);
		line = newline;
	}

	if((first == 'r' || first == 'w' || first == '<') && (line[1] == '/' || line[1] == '?') && !stringEqual(line, "w/")) {
		char *at = strchr(line, '@'); // look for at syntax
		if(at) *at = 0; // I'll put it back
		cmd = 'e';
		n = sessionByText(line + 2, line[1] == '/' ? 1 : -1);
		if(at) *at = '@';
		if(!n) goto failg;
		sprintf(newline, "%c%d", first, n);
		if(at) {
// check for buffer overrun, albeit extremely unlikely
// Proper at syntax will always fit in the buffer.
			i = sizeof(newline) - strlen(newline) - 1;
			n = strlen(at);
			if(n > i) n = i;
			char *e = newline + strlen(newline);
			strncpy(e, at, n);
			e[n] = 0;
		}
		line = newline;
	}

	if(first == '<' && line[1] == '*' && (line[2] == '/' || line[2] == '?')) {
		char *at = strchr(line, '@'); // look for at syntax
		if(at) *at = 0; // I'll put it back
		cmd = 'e';
		n = sessionByText(line + 3, line[1] == '/' ? 1 : -1);
		if(at) *at = '@';
		if(!n) goto failg;
		sprintf(newline, "<*%d", n);
		if(at) {
// check for buffer overrun, albeit extremely unlikely
// Proper at syntax will always fit in the buffer.
			i = sizeof(newline) - strlen(newline) - 1;
			n = strlen(at);
			if(n > i) n = i;
			char *e = newline + strlen(newline);
			strncpy(e, at, n);
			e[n] = 0;
		}
		line = newline;
	}

expctr:
/* special commands to expand and contract frames */
	if (stringEqual(line, "exp") || stringEqual(line, "ctr")) {
		if (globSub) {
			cmd = 'g';
			setError(MSG_GlobalCommand2, line);
			goto fail;
		}
		cmd = 'e';
		if (endRange == 0) {
			setError(MSG_EmptyBuffer);
			goto fail;
		}
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			goto fail;
		}
		jSyncup(false, 0);
		undoSpecialClear();
		cw->dot = startRange;
		if (!frameExpand((line[0] == 'e'), startRange, endRange))
			showError();
/* meta http refresh could send to another page */
		if (newlocation) {
replaceframe:
			if (!shortRefreshDelay(newlocation, newloc_d)) {
				nzFree(newlocation);
				newlocation = 0;
			} else {
				jSyncup(false, 0);
				if (!reexpandFrame())
					showError();
				if (newlocation)
					goto replaceframe;
			}
		}
/* even if one frame failed to expand, another might, so always rerender */
		selfFrame();
		rerender(0);
		goto success;
	}

	// special command for hidden input
	if (!strncmp(line, "ipass", 5)) {
		char buffer[MAXUSERPASS];
		int realtotal;
		bool old_masked;
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			goto fail;
		}
		if (endRange > startRange) {
			setError(MSG_RangeCmd, "ipass");
			goto fail;
		}

		s = line + 5;
		if (isdigitByte(*s))
			cx = strtol(s, (char **)&s, 10);
		else if (*s == '$')
			cx = -1, ++s;
		/* XXX try to guess cx if only one password input field? */

		cw->dot = endRange;
		p = (char *)fetchLine(cw->dot, -1);
		findInputField(p, 1, cx, &n, &realtotal, &tagno);
		debugPrint(5, "findField returns %d.%d", n, tagno);
		if (!tagno) {
			fieldNumProblem(0, "ipass", cx, n, realtotal);
			goto fail;
		}

		undoSpecialClear();
		prompt_and_read(MSG_Password, buffer, MAXUSERPASS,
				MSG_PasswordLong, true);

		old_masked = tagList[tagno]->masked;
		tagList[tagno]->masked = true;

		rc = infReplace(tagno, buffer, true);
		if (!rc)
			tagList[tagno]->masked = old_masked;
		goto done;
	}

// special code for textareas into sessions
	if(line[0] == 'i' && line[1] == 'b' && (!line[2] || isdigitByte(line[2]))) {
		int d = 0;
		char *s;
		if(isdigitByte(line[2])) {
			d = strtol(line + 2, &s, 10);
			if(*s)
				goto after_ib;
		}
		cmd = 'e';
		if (!cw->browseMode) {
			setError(MSG_NoBrowse);
			goto fail;
		}
		if (globSub) {
			setError(MSG_GlobalCommand2, "ib");
			goto fail;
		}
		if (endRange > startRange) {
			setError(MSG_RangeCmd, "ib");
			goto fail;
		}
		cw->dot = endRange;
		if (!cw->dot) {	// should never happen
			setError(MSG_EmptyBuffer);
			goto fail;
		}
		if(d) {
			if(!cxCompare(d) || (cxActive(d, false) && !cxQuit(d, 0)))
				goto fail;
		}
		rc = itext(d);
		goto done;
	}
after_ib:

// get the command
	cmd = *line;
	if (cmd) ++line;
	else cmd = 'p';
	icmd = cmd;
	if(cw->imapMode2 && cmd == 't' && !*line) cmd = 'g';

	if(cw->dirMode && cmd == 'L') {
		; // L is allowed here
	} else if (!strchr(valid_cmd, cmd)) {
		setError(MSG_UnknownCommand, cmd);
		goto failg;
	}

	if (cw->irciMode && !strchr(irci_cmd, cmd)) {
		setError(MSG_IrcCommand, cmd);
		goto failg;
	}

	if (cw->ircoMode && !strchr(irco_cmd, cmd)) {
		setError(MSG_IrcCommand, cmd);
		goto failg;
	}

	if (cw->imapMode1 && !strchr(imap1_cmd, cmd)) {
		setError(MSG_ImapCommand, cmd);
		goto failg;
	}

	if(cmd == 'r' && cw->imapMode2 && (!*line || (*line == '-' && !line[1]))) {
		cw->dot = endRange;
		rc = imapMarkRead(startRange, endRange, *line);
		goto done;
	}

	if (cw->imapMode2 && !strchr(imap2_cmd, cmd)) {
		setError(MSG_ImapCommand, cmd);
		goto failg;
	}

	first = *line;
	atWindow = 0;

	if(cmd == 'w' && first == 'q' && !line[1]) {
		wq = true;
		++line, first = 0;
	}

	if(cmd == 'w' && isdigitByte(first)) {
// check for at syntax
		int sno = strtol(line, &p, 10);
		int writeLine2;
		if(*p == '@') {
			if(!atPartCracker(0, sno, true, p, &writeLine, &writeLine2))
				goto fail;
			if(!cw->dol) {
				setError(MSG_EmptyBuffer);
				goto failg;
			}
			if(atWindow->dirMode | atWindow->binMode | atWindow->browseMode | atWindow->sqlMode | atWindow->ircoMode) {
				setError(MSG_TextRec, sno);
				goto failg;
			}
			writeLine = writeLine2;
// by being positive, writeLine will remember that this happened.
// Clobber @, so it looks like writing to a session,
// and we'll set cx and go down that path,
// then writeLine will send us down another path at the last minute.
			*p = 0, atsave = p;
		}
	}

	if(cmd == 'w' && (first == '-' || first == '+') && isdigitByte(line[1])) {
// check for at syntax
		int sno = strtol(line + 1, &p, 10);
		int writeLine2;
		if(*p == '@') {
			if(!atPartCracker(first, sno, true, p, &writeLine, &writeLine2))
				goto fail;
			if(!cw->dol) {
				setError(MSG_EmptyBuffer);
				goto failg;
			}
			if(atWindow->dirMode | atWindow->binMode | atWindow->browseMode | atWindow->sqlMode | atWindow->ircoMode) {
				setError(MSG_TextRecBuf);
				goto failg;
			}
			writeLine = writeLine2;
// by being positive, writeLine will remember that this happened.
// Clobber @, so it looks like writing to a session,
// and we'll set cx and go down that path,
// then writeLine will send us down another path at the last minute.
			*p = 0, atsave = p;
// skip past + or -
			first = *++line;
		}
	}

// w+ file means append to file
	if (cmd == 'w' && first == '+')
		writeMode = O_APPEND, first = *++line;

// may as well check r at syntax while we're at it.
	if(cmd == 'r' && isdigitByte(first)) {
		int sno = strtol(line, &p, 10);
		if(*p == '@') { // at syntax
			if(!atPartCracker(0, sno, false, p, &readLine1, &readLine2))
				goto fail;
// by being positive, readLine1 will remember that this happened.
// Clobber @, so it looks like reading from a session,
// and we'll set cx and go down that path,
// then readLine will send us down another path at the last minute.
			*p = 0, atsave = p;
		}
	}

	if(cmd == 'r' && (first == '-' || first == '+') && isdigitByte(line[1])) {
		int sno = strtol(line + 1, &p, 10);
		if(!*p) {
			static char shorthand[4];
			strcpy(shorthand, "@,");
			p = shorthand;
		}
		if(*p == '@') { // at syntax
			if(!atPartCracker(first, sno, false, p, &readLine1, &readLine2))
				goto fail;
// by being positive, readLine1 will remember that this happened.
// Clobber @, so it looks like reading from a session,
// and we'll set cx and go down that path,
// then readLine will send us down another path at the last minute.
			*p = 0, atsave = p;
// skip past + or -
			first = *++line;
		}
	}

	if(cmd == 'u' && cw->dirMode && undoSpecial) {
		char *oldline = undoSpecial;
		int len;
		char src[ABSPATH], *dest, *t;
		struct lineMap *mptr;
		cw->dot = undo1line;
		p = (char *)fetchLine(cw->dot, -1);
		len = pstLength((pst) p);
		p[len - 1] = 0;	/* temporary */
		t = makeAbsPath(p);
		p[len - 1] = '\n';
		if (!t)
			goto fail;
		strcpy(src, t);
		dest = makeAbsPath(oldline);
		if (!dest)
			goto fail;
		if (fileTypeByName(dest, 1)) {
			setError(MSG_DestFileExists, dest);
			goto fail;
		}
		if (rename(src, dest)) {
			setError(MSG_NoRename, dest, strerror(errno));
			goto fail;
		}
		p[len - 1] = 0;
		undoSpecial = cloneString(p);
		p[len - 1] = '\n';
		mptr = cw->map + cw->dot;
		len = strlen(oldline);
		oldline[len] = '\n';
		mptr->text = (pst)oldline;
		printDot();
		goto success;
	}

	if (cw->dirMode && !strchr(dir_cmd, cmd)) {
		setError(MSG_DirCommand, icmd);
		goto failg;
	}

	if (cw->sqlMode && !strchr(sql_cmd, cmd)) {
		setError(MSG_DBCommand, icmd);
		goto failg;
	}

	if(cmd == 'u' && cw->browseMode && undoSpecial) {
		char *oldline = undoSpecial;
		const char *t;
		int total, realtotal;
		char search[20];
		char searchend[4];
		cw->dot = undo1line;
		p = (char *)fetchLine(cw->dot, -1);
		findInputField(p, 1, undoField, &total,        &realtotal, &tagno);
		if (!tagno) {
			fieldNumProblem(0, "i", undoField, total, realtotal);
			goto fail;
		}
		sprintf(search, "%c%d<", InternalCodeChar, tagno);
		sprintf(searchend, "%c0>", InternalCodeChar);
		if(!(s = strstr(p, search)))
			goto fail;
		s = strchr(s, '<') + 1;
		if(!(t = strstr(s, searchend)))
			goto fail;
		undoSpecial = getFieldFromBuffer(tagno, 0);
		rc = infReplace(tagno, oldline, true);
		nzFree(oldline);
		if(!rc)
			undoSpecialClear();
		goto done;
	}

	if (cw->browseMode && !strchr(browse_cmd, cmd)) {
		setError(MSG_BrowseCommand, icmd);
		goto failg;
	}
	if (cw->browseMode && (cmd  == 'm' || cmd == 't') && !cw->imapMode3) {
		setError(MSG_BrowseCommand, icmd);
		goto failg;
	}

	if (startRange == 0 && !strchr(zero_cmd, cmd)) {
		setError(MSG_AtLine0);
		goto failg;
	}

// code for b.pdf and g.pdf
	if((cmd == 'b' || cmd == 'g')
	&& !(cw->browseMode | cw->sqlMode | cw->imapMode1 | cw->imapMode2 | cw->irciMode | cw->ircoMode)
	&& first == '.') {
		browseSuffix = line + 1;
		first = 0;
		line += strlen(line);
// let's check suffix here.
		if(strlen(browseSuffix) > 5) {
			setError(MSG_SuffixLong);
			cmd = 'e';
			goto fail;
		}
		if(stringEqual(browseSuffix, "plain"))
			browseSuffix = NULL, plainMail = true;
		else if(!findMimeBySuffix(browseSuffix)) {
			setError(MSG_SuffixBad, browseSuffix);
			cmd = 'e';
			goto fail;
		}
	}

// eat spaces after the command, but not after J
	if(cmd != 'J') {
		while (isspaceByte(first))
			postSpace = true, first = *++line;
	}

	if (strchr(spaceplus_cmd, cmd) && !postSpace && first) {
		s = line;
		while (isdigitByte(*s))
			++s;
		if (*s) {
			setError(MSG_NoSpaceAfter);
			goto failg;
		}
	}

	if (globSub && !strchr(global_cmd, cmd)) {
		setError(MSG_GlobalCommand, icmd);
		goto failg;
	}

// i as text insert cannot be global, but i for a fill-out form can.
// g/re/ i=+ to set a bunch of checkboxes.
// However, g/re/ i* probably should be disallowed. We need to refine this a bit.
	if (globSub && icmd == 'i' && (!cw->browseMode || line[0] == '*')) {
		setError(MSG_GlobalCommand, icmd);
		goto failg;
	}

// move/copy destination, the third address
	if (cmd == 't' || cmd == 'm') {

// move or copy email to another folder
		if(cw->imapMode2 && postSpace) {
			rc = imapMovecopy(startRange, endRange, cmd, (char*)line);
			if(!rc) globSub = false;
			goto done;
		}

// move or copy the current mail to another folder
		if(cw->imapMode3 && postSpace) {
			rc = imapMovecopyWhileReading(cmd, (char*)line);
			if(!rc) globSub = false;
			goto done;
		}

		if(cw->imapMode2) {
			setError(MSG_ImapCommand, cmd);
			goto failg;
		}

		if(cw->browseMode) {
			setError(MSG_BrowseCommand, cmd);
			goto failg;
		}
	} // m or t

	if (cmd == 't' || cmd == 'm' ||
	(cw->dirMode && ((cmd == 'l' && first) || cmd == 'L'))) {
		if (!first) {
			if (cw->dirMode) {
				setError(MSG_BadDest);
				goto failg;
			}
			destLine = cw->dot;
		} else {
			if (!strchr(valid_laddr, first)) {
				setError(MSG_BadDest);
				goto failg;
			}

// destination has special meaning in directory mode
			if (cw->dirMode) {
				char relative = 0;
				if(first == '+' || first == '-') {
					relative = first, first = *++line;
					if(!first) { j = 1; goto dest_ok; }
				}
				if (!relative && (first == '/' || first == '?')) {
					j = sessionByText(line + 1, first == '/' ? 1 : -1);
					if(!j) goto failg;
					goto dest_ok;
				}
				if(!isdigitByte(first) || (j = stringIsNum(line)) < 0) {
					setError(MSG_BadDest);
					goto failg;
				}
dest_ok:
				cmd = 'e';
				rc = moveFiles(startRange, endRange, j, icmd, relative);
				undoCompare();
				cw->undoable = false;
				undoSpecialClear();
				goto done;
			}

// normal destination for move or copy in a text file
			if (!getRangePart(line, &destLine, &line))
				goto failg;
			first = *line;
		}		// was there something after m or t
	} // m or t

	if(cmd == 'W') {
		if(first != '!') {
			setError(MSG_WBang);
			goto failg;
		}
		wrc = true;
		wrc_file = edbrowseTempFilename("txt", true);
		cmd = 'w';
	}

	if((cmd == 'e' || cmd == 'b') && (cw->irciMode | cw->ircoMode) && postSpace) {
		setError(MSG_IrcCommand, cmd);
		goto fail;
	}

/* -c is the config file */
	if ((cmd == 'b' || cmd == 'e') && stringEqual(line, "-c"))
		line = configFile;

// env variable and wild card expansion
	if (strchr("brewf", cmd) && // command looks right
	first && // reading or writing or editing something
	!isURL(line) && // not a url
	!isSQL(line) && // not an sql table
// don't expand if in sql mode, we must be reading a table
	(cmd != 'r' || !cw->sqlMode)  &&
// don't expand variables if r ! or W ! will run through the shell;
// let the shell do it via popen().
	(first != '!' || strchr("bef", cmd))) {
		if (!envFile(line, &line))
			goto fail;
		first = *line;
	}

	if (cmd == 'z') {
		if (isdigitByte(first)) {
			last_z = strtol(line, (char **)&line, 10);
			if (!last_z)
				last_z = 1;
			first = *line;
		}
		startRange = endRange + 1;
		endRange = startRange;
		if (startRange > cw->dol) {
			startRange = endRange = 0;
			setError(MSG_LineHigh);
			goto fail;
		}
		cmd = 'p';
		endRange += last_z - 1;
		if (endRange > cw->dol)
			endRange = cw->dol;
	}

	// the a+ feature, when you thought you were in append mode
	if (cmd == 'a') {
		if (stringEqual(line, "+")) {
			++line, first = 0;
		} else {
			nzFree(linePending), linePending = 0;
		}
	} else {
		nzFree(linePending), linePending = 0;
	}

	if (first && strchr(nofollow_cmd, cmd)) {
		setError(MSG_TextAfter, icmd);
		goto failg;
	}

	if (cmd == 'h') {
		showError();
		goto success;
	}

	if (cmd == 'X') {
		cw->dot = endRange;
		goto success;
	}

	if (strchr("Llpn", cmd)) {
		for (i = startRange; i <= endRange; ++i) {
			displayLine(i);
			cw->dot = i;
			if (intFlag)
				break;
		}
		goto success;
	}

	if (cmd == '=') {
		eb_printf("%d\n", endRange);
		goto success;
	}

	if (cmd == 'B') {
		rc = balanceLine(line, endRange);
		goto done;
	}

	if (cmd == 'u') {
		Window *uw = &undoWindow;
		struct lineMap *swapmap;
		if (!cw->undoable) {
			setError(MSG_NoUndo);
			goto fail;
		}
/* swap, so we can undo our undo, if need be */
		i = uw->dot, uw->dot = cw->dot, cw->dot = i;
		i = uw->dol, uw->dol = cw->dol, cw->dol = i;
		for (j = 0; j < MARKLETTERS; ++j) {
			i = uw->labels[j], uw->labels[j] =
			    cw->labels[j], cw->labels[j] = i;
		}
		swapmap = uw->map, uw->map = cw->map, cw->map = swapmap;
		goto success;
	}

	if (cmd == 'k') {
		if (!islowerByte(first) || line[1]) {
			setError(MSG_EnterKAZ);
			goto fail;
		}
		if (startRange < endRange) {
			setError(MSG_RangeLabel);
			goto fail;
		}
		cw->labels[first - 'a'] = endRange;
		goto success;
	}

	/* Find suffix, as in 27,59w2 */
	if (!postSpace) {
		cx = stringIsNum(line);
		if (!cx &&
		strchr("qwer^&", cmd)) {
			setError((cmd == '^'
				  || cmd == '&') ? MSG_Backup0 : MSG_Session0);
			goto fail;
		}
		if (cx < 0)
			cx = 0;
	}

	if (cmd == 'q') {
doquit:
		if (cx) {
			if (!cxCompare(cx))
				goto fail;
			if (!cxActive(cx, true))
				goto fail;
		} else {
			cx = context;
			if (first) {
				setError(MSG_QAfter);
				goto fail;
			}
		}
		saveSubstitutionStrings();
		if (!cxQuit(cx, 2)) goto fail;
		if (cx != context)
			goto success;
/* look around for another active session */
		while (true) {
			if (++cx > maxSession)
				cx = 1;
			if (cx == context) {
// A controled shutdown; try to close down javascript; see if it blows up.
				jsClose();
				ebClose(0);
			}
			if (!sessionList[cx].lw)
				continue;
			cxSwitch(cx, true);
			goto success;
		}		/* loop over sessions */
	}

	if (cmd == 'f') {
		selfFrame();
		if (cx) {
			if (!cxCompare(cx))
				goto fail;
			if (!cxActive(cx, true))
				goto fail;
			s = sessionList[cx].lw->f0.fileName;
			if (s)
				i_printf(MSG_String, s);
			else
				i_printf(MSG_NoFile);
			if (sessionList[cx].lw->binMode)
				i_printf(MSG_BinaryBrackets);
			if (cw->jdb_frame)
				i_printf(MSG_String, " jdb");
			eb_puts("");
			goto success;
		}		// another session
		if (first) {
			if (cw->dirMode) {
				setError(MSG_DirRename);
				goto fail;
			}
			if (cw->sqlMode) {
				setError(MSG_TableRename);
				goto fail;
			}
			if (cw->irciMode | cw->ircoMode) {
				setError(MSG_IrcRename);
				goto fail;
			}
			if (cw->imapMode1 | cw->imapMode2 | cw->imapMode3) {
				setError(MSG_ImapRename);
				goto fail;
			}
			nzFree(cf->fileName);
			if(stringEqual(line, "clear"))
				cf->fileName = 0;
			else
				cf->fileName = cloneString(line);
		}
		s = cf->fileName;
		if(!first || debugLevel >= 1) {
			if (s)
				eb_printf("%s", s);
			else
				i_printf(MSG_NoFile);
			if (cw->binMode)
				i_printf(MSG_BinaryBrackets);
			nl();
		}
		goto success;
	}

	if (cmd == 'w') {
		if (cx) {	// write to another session
			if (writeMode == O_APPEND) {
				setError(MSG_NoSpaceAfter);
				goto fail;
			}
			if(atsave) *atsave = '@';
			rc = writeContext(cx, atWindow, writeLine);
			goto done;
		}
		selfFrame();

		if(first == '!') { // write to a command, like ed
			int l = 0, pexit, outlen;
			char *outdata;
			char *wrapline = 0;
			FILE *p;
			char *newline = bangbang(line + 1);
			eb_variables();
			newline = apostropheMacros(newline);
// W command must write to a temp file, then read back in
			if(wrc)
				ignore = asprintf(&wrapline, "( %s ) > %s", newline, wrc_file);
			p = popen(wrapline ? wrapline : newline, "w");
			nzFree(wrapline);
			nzFree(newline);
			if (!p) {
				setError(MSG_NoSpawn, line + 1, errno);
				goto fail;
			}
// Compute file size ahead of time; shell command could start
// printing stuff before we send it all the lines.
			for (i = startRange; i <= endRange; ++i) {
				if(i == 0) // empty buffer
					continue;
				pst s = fetchLine(i, (cw->browseMode ? 1 : -1));
				int len = pstLength(s);
				if (i == cw->dol && cw->nlMode)
					--len;
				l += len;
				if (cw->browseMode)
					free(s);
			}
			if(!globSub && debugLevel >= 1)
				eb_printf("%d\n", l);
			for (i = startRange; i <= endRange; ++i) {
				if(i == 0) // empty buffer
					continue;
				pst s = fetchLine(i, (cw->browseMode ? 1 : -1));
				int len = pstLength(s);
				if (i == cw->dol && cw->nlMode)
					--len;
// in directory mode we don't write the suffix or attribute information
				if (fwrite(s, len, 1, p) <= 0) {
		// This could happen if the system doesn't accept all the input and closes the pipe.
		// I don't know what to do here, so just return.
					if (cw->browseMode)
						free(s);
					break;
				}
				if (cw->browseMode)
					free(s);
			}
			pexit = pclose(p);
			if(!globSub && debugLevel > 0 && !pexit && !wrc)
				i_puts(MSG_OK);
			if(pexit) {
				if(wrc) unlink(wrc_file);
				setError(MSG_CmdFail);
				goto fail;
			}
			if(!wrc) goto success;
			rc = fileIntoMemory(wrc_file, &outdata, &outlen, 0);
			unlink(wrc_file);
			if(!rc) goto fail;
			delText(startRange, endRange);
// Warning, we don't convert output from iso8859 or other formats to utf8,
// like we do when reading from a file; just assume it is proper.
			rc = addTextToBuffer((pst)outdata, outlen, startRange - 1, true);
			nzFree(outdata);
			if(rc)
				debugPrint(1, "%d", outlen);
			goto success;
		}

		if(!first && cw->irciMode) {
// write the buffer to the irc server
			if(!startRange) {
				setError(MSG_AtLine0);
				goto fail;
			}
			if(startRange != 1 || endRange != cw->dol || globSub) {
				setError(MSG_IrcEntire);
				goto fail;
			}
			if(!ircWrite()) goto fail;
			delText(startRange, endRange);
			cw->changeMode = cw->undoable = false;
			goto success;
		}

		if (!first)
			line = cf->fileName;
		if (!line) {
			setError(MSG_NoFileSpecified);
			goto fail;
		}
		if (cw->dirMode && stringEqual(line, cf->fileName)) {
			setError(MSG_NoDirWrite);
			goto fail;
		}
		if (cw->sqlMode && stringEqual(line, cf->fileName)) {
			setError(MSG_NoDBWrite);
			goto fail;
		}
		rc = writeFile(line, writeMode);
		if(!wq) goto done;
		if(!rc) goto done;
		debugPrint(1, "%lld", fileSize);
		fileSize = -1;
		goto doquit;
	}

	if (cmd == '&') {	// jump back key
		if (first && !cx) {
			setError(MSG_ArrowAfter);
			goto fail;
		}
		if (!cx)
			cx = 1;
		while (cx) {
			struct histLabel *label = cw->histLabel;
			if (!label) {
				setError(MSG_NoPrevious);
				goto fail;
			}
			cw->histLabel = label->prev;
			if (label->label)	/* this could be 0 because of line deletion */
				cw->dot = label->label, --cx;
			free(label);
		}
		if(debugLevel >= 1)
			printDot();
		goto success;

	}

	if (cmd == '^') {	// back key, pop the stack
		if (first && !cx) {
			setError(MSG_ArrowAfter);
			goto fail;
		}
		if (!cx)
			cx = 1;
		undoSpecialClear();
		while (cx) {
			Window *prev = cw->prev;
			if (!prev) {
				setError(MSG_NoPrevious);
				goto fail;
			}
			saveSubstitutionStrings();
			if (!cxQuit(context, 1))
				goto fail;
			sessionList[context].lw = cw = prev;
			selfFrame();
			restoreSubstitutionStrings(cw);
			--cx;
		}
		if(debugLevel >= 1)
			printDot();
		goto success;
	}

	if (cmd == 'M') {	// move this to another session
		int scx = cx; // remember
		if (first && (first != '0' || line[1]) && !cx) {
			setError(MSG_MAfter);
			goto fail;
		}
		if (!cw->prev) {
			setError(MSG_NoBackup);
			goto fail;
		}
		if (cx) {
			if (!cxCompare(cx))
				goto fail;
		} else {
			cx = sideBuffer(0, emptyString, 0, NULL);
			if (cx == 0)
				goto fail;
		}
/* we likely just created it; now quit it */
		if (cxActive(cx, false) && !cxQuit(cx, 2))
			goto fail;
// If changes were made to this buffer, they are undoable after the move
		undoCompare();
		cw->undoable = false;
		undoSpecialClear();
		if((!scx && first != '0') || debugLevel >= 1)
			i_printf(MSG_MovedSession, cx);
// Magic with pointers, hang on to your hat.
		cw->imapMode3 = false;
		sessionList[cx].fw = sessionList[cx].lw = cw;
		cs->lw = cw->prev;
		cw->prev = 0;
		cw = cs->lw;
		if(cx > maxSession) maxSession = cx;
		cx_previous = cx;
		selfFrame();
		if(debugLevel >= 1)
			printDot();
		goto success;
	}

	if (cmd == 'A') {
		char *a;
		if (!cxQuit(context, 0))
			goto fail;
		if (!(a = showLinks()))
			goto fail;
		undoCompare();
		cw->undoable = cw->changeMode = false;
		undoSpecialClear();
		w = createWindow();
		w->sno = context;
		w->prev = cw;
		cw = w;
		selfFrame();
		cs->lw = w;
		rc = addTextToBuffer((pst) a, strlen(a), 0, false);
		nzFree(a);
		cw->changeMode = false;
		fileSize = bufferSize(context, false);
		goto done;
	}

	if (cmd == '<') {	// run a function
		cw->dot = endRange;
		p = (char*)line;
		bool stopflag = false;
		char relative = 0;
		if(*p == '*' && isdigit(p[1])) ++p, stopflag = true;
		if(*p == '*' && (p[1] == '-' || p[1] == '+') && isdigit(p[2])) ++p, stopflag = true;
		if(p[0] == '-' || p[0] == '+') relative = *p;
		int b = strtol((relative ? p+1 : p), &p, 10);
		if(b >= 0 && (*p == 0 || *p == '@')) {
			int ln1 = 0, ln2 = 0;
			atWindow = 0;
			if(!*p && relative) {
				static char shorthand[4];
				strcpy(shorthand, "@,");
				p = shorthand;
			}
			if(*p == '@') {
				if(!atPartCracker(relative, b, false, p, &ln1, &ln2))
					goto fail;
			}
			j = runBuffer(b, atWindow, stopflag, ln1, ln2);
			if(!j) j = -1;
		} else {
			j =  runEbFunction(line);
		}
		if(j < 0)
			globSub = false, j = 0;
		goto donej;
	}

	// go to a folder in an imap listing
	if (cmd == 'g' && cw->imapMode1 && !first) {
		if (endRange > startRange) {
			setError(MSG_RangeCmd, "g");
			goto fail;
		}
		cw->dot = endRange;
		p = (char *)cw->r_map[endRange].text; // path for the folder
		cmd = 'e';
		rc = folderDescend(p, false);
		goto done;
	}

	// go to an email in an envelope listing
	if (cmd == 'g' && cw->imapMode2 && (!first || (first == '-' && !line[1]))) {
		if (endRange > startRange) {
			setError(MSG_RangeCmd, "g");
			goto fail;
		}
		cw->dot = endRange;
		p = (char *)cw->r_map[endRange].text; // uid and subject for the email
		cmd = 'e';
		if(first) icmd = 'u'; // code to leave the email unformatted
		rc = mailDescend(p, icmd);
		goto done;
	}

// Go to a file if in directory mode, or text mode and the line
// exactly matches the name of a local file.
	if (cmd == 'g' && (!first || stringEqual(line, "-")) &&
	!(cw->binMode | cw->browseMode | cw->binMode | cw->sqlMode)) {
		char *dirline;
		const struct MIMETYPE *gmt = 0;	/* the go mime type */
		emode = (first == '-');
		if (endRange > startRange) {
			setError(MSG_RangeCmd, "g");
			cmd = 'e';
			goto fail;
		}
		p = (char *)fetchLine(endRange, -1);
		j = pstLength((pst) p);
		--j;
		for(i = 0; i < j; ++i)
			if(!p[i])
				goto past_g_file;
		p[j] = 0;	// temporary
		dirline = makeAbsPath(p);
		p[j] = '\n';
		if(cw->dirMode) {
			cw->dot = endRange, cmd = 'e';
			if(!dirline) goto fail;
		} else {
			if(!dirline || access(dirline, 4))
				goto past_g_file;
		}
		cw->dot = endRange, cmd = 'e';
		stripDotDot(dirline);
		if (emode) goto regular_g_file;
		if(!pluginsOn) goto regular_g_file;
// don't run a plugin on directory or special file
		char ftype = fileTypeByName(dirline, 0);
		if (ftype && ftype != 'f') goto regular_g_file;
		if(browseSuffix)
			gmt = findMimeBySuffix(browseSuffix);
		else
			gmt = findMimeByFile(dirline);
		if (!gmt) goto regular_g_file;
		if (!gmt->outtype) {
			char pb_how[12];
			strcpy(pb_how, "pb");
			if(browseSuffix)
				sprintf(pb_how, "pb.%s", browseSuffix);
			rc = playBuffer(pb_how, dirline);
			goto done;
		}
// need to call runPluginCommand directly here, because the data is already in a local file
		char *outbuf;
		int outlen;
		if (!cxQuit(context, 0)) goto fail;
		undoCompare();
		cw->undoable = cw->changeMode = false;
		undoSpecialClear();
		if(!noStack) freeWindows(context, false);
		if(!runPluginCommand(gmt, 0, dirline, 0, 0, &outbuf, &outlen))
			goto fail;
// unfortunately this replicates some push&load code below
		w = createWindow();
		w->sno = context;
		cw = w;		// we might wind up putting this back
		selfFrame();
			cf->fileName = (char*)fetchLine(endRange, 0);
			cf->fileName[j] = 0;
		addTextToBuffer((uchar*)outbuf, outlen, 0, false);
		debugPrint(1, "%d", outlen); fileSize = -1;
		cw->undoable = cw->changeMode = false;
		nzFree(outbuf);
		cw = cs->lw;	// put it back, for now
		selfFrame();
		if (noStack) {
			w->prev = cw->prev;
			nzFree(w->f0.firstURL);
			w->f0.firstURL = cf->firstURL;
			cf->firstURL = 0;
			cxQuit(context, 1);
		} else {
			w->prev = cw;
		}
		cs->lw = cw = w;
		selfFrame();
		if (!w->prev)
			cs->fw = w;
		cf->render2 = cf->render3 = true;
		if(gmt->outtype == 'h') browseCurrentBuffer(NULL, false);
		goto success;
regular_g_file:
// I don't think we need to make a copy here
		line = dirline;
		first = *line;
	}
past_g_file:

	if (cmd == 'e') {
		if (cx) {
// switchsession:
			if (!cxCompare(cx))
				goto fail;
			undoSpecialClear();
			cxSwitch(cx, true);
			goto success;
		}
		if (!first) {
			i_printf(MSG_SessionX, context);
			goto success;
		}
/* more e to come */
	}

	// see if it's a go command
	if (cmd == 'g' && !(cw->sqlMode | cw->binMode | cw->ircoMode)) {
		char *h;
		int tagno;
		bool click, dclick;
// jsdead javascript is not running
// jsh the href is javascript:
// jsgo going to this link definitely entails javascript, e.g. onclick
		bool jsh, jsgo, jsdead;
		bool lookmode = false;

		j = strlen(line);
		if (j && line[j - 1] == '?')
			lookmode = true;
		if (j && line[j - 1] == '-')
			emode = true;

		/* Check to see if g means run an sql command. */
		if (!first) {
			char *rbuf;
			j = goSelect(&startRange, &rbuf);
			if (j >= 0) {
				cmd = 'e';	/* for autoprint of errors */
				cw->dot = startRange;
				if (*rbuf) {
					int savedol = cw->dol;
					addTextToBuffer((pst) rbuf,
							strlen(rbuf), cw->dot,
							true);
					nzFree(rbuf);
					if (cw->dol > savedol) {
						cw->labels[0] = startRange + 1;
						cw->labels[1] =
						    startRange + cw->dol -
						    savedol;
					}
					cw->dot = startRange;
				}
				rc = !!j;
				goto done;
			}
		}

/* Now try to go to a hyperlink */
		s = line;
		j = 0;
		if (first) {
			if (isdigitByte(first))
				j = strtol(s, (char **)&s, 10);
			else if (first == '$')
				j = -1, ++s;
		}
		cw->nextrender = 0;
		if (*s == '?' || *s == '-')
			++s;
		if (!*s) {
			if (cw->sqlMode) {
				setError(MSG_DBG);
				goto fail;
			}
			jsh = jsgo = nogo = false;
			jsdead = !isJSAlive;
// remember we can go to a file or url from a text file
			if(!cw->browseMode) jsdead = true;
			click = dclick = false;
			cmd = (emode ? 'e' : 'b');
			uriEncoded = true;
			if (endRange > startRange) {
				setError(MSG_RangeCmd, "g");
				goto fail;
			}
			p = (char *)fetchLine(endRange, -1);
			findField(p, 0, j, &n, 0, &tagno, &h, &tag);
			debugPrint(5, "findField returns %d, %s", tagno, h);

			if (!h) {
				fieldNumProblem(1, "g", j, n, n);
				goto fail;
			}
			cw->dot = endRange;
			jumptag = gotag = tag;
			if (cw->browseMode && h[0] == '#')
				emode = false, cmd = 'b';
			jsh = memEqualCI(h, "javascript:", 11);

			if (lookmode) {
				if(!strncmp(h, "data:", 5)) eb_puts("data:");
				else eb_puts(h);
				nzFree(h);
				if(debugLevel >= 3) eb_printf("%d\n", tag->seqno);
				goto success;
			}

			if (tag && tag->action == TAGACT_FRAME) {
				nzFree(h);
				line = "exp";
				goto expctr;
			}

			if (tagno) {
				click = tagHandler(tagno, "onclick");
				dclick = tagHandler(tagno, "ondblclick");
			}
			if (click)
				jsgo = true;
			jsgo |= jsh;
			nogo = stringEqual(h, "#");
			if (!*h)
				nogo = true;
			nogo |= jsh;
			debugPrint(5, "go %d nogo %d jsh %d dead %d", jsgo,
				   nogo, jsh, jsdead);
			debugPrint(5, "click %d dclick %d", click, dclick);
			if (jsgo & jsdead) {
				if (nogo)
					i_puts(MSG_NJNoAction);
				else
					i_puts(MSG_NJGoing);
				jsgo = jsh = false;
			}
// because I am setting allocatedLine to h, it will get freed on the next go round.
			nzFree(allocatedLine);
			line = allocatedLine = h;
			first = *line;
			setError(-1);
			if(!cw->browseMode) goto past_js;

// The website should not depend on the mouseover code running first.
// edbrowse is more like a touchscreen, and there are such devices, so just go.
// No mouseEnter, mouseOver, mouseExit, etc.
			if (!jsdead)
				set_property_string_win(cf, "status", h);
// jsgo means running javascript or at least some onclick code,
// but we should generate the click event whether jsgo is set or not.
// A containing object could have an event handler capturing click.
			jSyncup(false, tag);
			rc = bubble_event_t(tag, "onclick");
			jSideEffects();
		if (newlocation)
				goto redirect;
			if (!rc)
				goto success;

			if (jsh) {
/* actually running the url, not passing it to http etc, need to unescape */
				unpercentString(h);
				cf = tag->f0;
				jsRunScriptWin(h, "a.href", 1);
				jSideEffects();
				if (newlocation)
					goto redirect;
				goto success;
			}

past_js:
			if (nogo)
				goto success;
// to access local files
// but not for a fragment
			if (!isURL(h) && *h != '#')
				unpercentString(h);
		}
	}

	if (cmd == 's') {
// Some shorthand, like s,2 to split the line at the second comma
		if (!first) {
			strcpy(newline, "//%");
			line = newline;
		} else if (first == '$' && !line[1]) {
			strcpy(newline, "//%/$p");
			line = newline;
		} else if(isdigitByte(first) && !line[1]) {
			sprintf(newline, "//%%/%cp", first);
			line = newline;
// cx was set, like a context, like w2, but it shouldn't be
			cx = 0;
		} else if (strchr(",.;:!?)-\"", first) &&
			   (!line[1] || ((isdigitByte(line[1]) || line[1] == '$') && !line[2]))) {
			char esc[2];
			esc[0] = esc[1] = 0;
			if (first == '.' || first == '?')
				esc[0] = '\\';
			sprintf(newline, "/%s%c +/%c\\n%s%s",
				esc, first, first, (line[1] ? "/p" : ""),
				line + 1);
			debugPrint(6, "shorthand regexp %s", newline);
			line = newline;
		}
		first = *line;
	}

	scmd = ' ';
	if ((cmd == 'i' || cmd == 's') && first) {
		char c;
		s = line;
		if (isdigitByte(*s))
			cx = strtol(s, (char **)&s, 10);
		else if (*s == '$')
			cx = -1, ++s;
		c = *s;
		if (c &&
		    (strchr(valid_delim, c) ||
		     (cmd == 'i' && strchr("*<?=", c)))) {
			if (!cw->browseMode && (cmd == 'i' || cx)) {
				setError(MSG_NoBrowse);
				goto fail;
			}
			if (endRange > startRange && cmd == 'i') {
				setError(MSG_RangeI, c);
				goto fail;
			}

			if (cmd == 'i' && strchr("?=<*", c)) {
				int realtotal;
				scmd = c;
				line = s + 1;
				first = *line;
				debugPrint(5, "scmd = %c", scmd);
				cw->dot = endRange;

				p = (char *)fetchLine(cw->dot, -1);
				j = 1;
				if (scmd == '*')
					j = 2;
				if (scmd == '?')
					j = 3;
				findInputField(p, j, cx, &n, &realtotal,
					       &tagno);
				debugPrint(5, "findField returns %d.%d", n,
					   tagno);
				if (!tagno) {
					fieldNumProblem((c == '*' ? 2 : 0), "i",
							cx, n, realtotal);
					goto fail;
				}

				if (scmd == '?') {
					infShow(tagno, line);
					if(debugLevel >= 3) eb_printf("%d\n", tagList[tagno]->seqno);
					goto success;
				}

				cw->undoable = false;
				undoSpecialClear();

				if (c == '<') {
					Tag *t = tagList[tagno];
					if (globSub) {
						setError(MSG_IG);
						goto failg;
					}
					nzFree(allocatedLine);
					allocatedLine = lessFile(line, (t->itype == INP_TA));
					if (!allocatedLine)
						goto fail;
					line = allocatedLine;
					scmd = '=';
				}

				if (scmd == '=') {
					rc = infReplace(tagno, (char*)line, true);
					if (newlocation)
						goto redirect;
					goto done;
				}

				if (c == '*') {
					Frame *save_cf = cf;
					jSyncup(false, tagList[tagno]);
					nzFree(allocatedLine), allocatedLine = 0;
					c = infPush(tagno, &allocatedLine);
					jSideEffects();
					cf = save_cf;
					if (!c)
						goto fail;
					if (newlocation) goto redirect;
// No url means it was a reset button
					if (!allocatedLine) goto success;
					line = allocatedLine;
					first = *line;
					cmd = 'b';
					uriEncoded = true;
				}

			} else
				cmd = 's';
		} else {
			setError(MSG_TextAfter, icmd);
			goto fail;
		}
	}

	if(cmd == 'e' && first == '!') {
// did you make changes that you didn't write?
		if (!cxQuit(context, 0)) goto fail;
		undoCompare();
		cw->undoable = cw->changeMode = false;
		undoSpecialClear();
		char *outdata;
		int outlen, pexit;
		FILE *p;
		char *newline = bangbang(line + 1);
		eb_variables();
		newline = apostropheMacros(newline);
		p = popen(newline, "r");
		nzFree(newline);
		if (!p) {
			setError(MSG_NoSpawn, line + 1, errno);
			goto fail;
		}
		rc = fdIntoMemory(fileno(p), &outdata, &outlen, 0);
		if(!rc) {
			pclose(p);
			goto fail;
		}
		pexit = pclose(p);
		if(pexit) {
			setError(MSG_CmdFail);
			nzFree(outdata);
			goto fail;
		}
// Warning, we don't convert output from iso8859 or other formats to utf8,
// like we do when reading from a file; just assume it is proper.
		if(!noStack) freeWindows(context, false);
		w = createWindow();
		w->sno = context;
		cw = w;		// we might wind up putting this back
		selfFrame();
		rc = addTextToBuffer((pst)outdata, outlen, 0, true);
		nzFree(outdata);
		if(!rc) goto done; // should never happen
		debugPrint(1, "%d", outlen);
		w->undoable = w->changeMode = false;
		cw = cs->lw;	// put it back, for now
		selfFrame();
		if (noStack) {
			w->prev = cw->prev;
			nzFree(w->f0.firstURL);
			w->f0.firstURL = cf->firstURL;
			cf->firstURL = 0;
			cxQuit(context, 1);
		} else {
			w->prev = cw;
		}
		cs->lw = cw = w;
		selfFrame();
		if (!w->prev)
			cs->fw = w;
		goto done;
	}

rebrowse:
	debugPrint(4, "edbrowse command %c %s first %c count %d", cmd, line, first, redirect_count);
	if (cmd == 'e' || (cmd == 'b' && first && first != '#')) {
		debugPrint(4, "ifetch %d %s", uriEncoded, line);

// If we got here from typing g in directory mode, and directory had /
// at the end, and if the file starts with #, then the sameURL test passes,
// and we go down a completely unintended path.
		if (noStack < 2 && sameURL(line, cf->fileName) && !cw->dirMode) {
			if (stringEqual(line, cf->fileName)) {
				setError(MSG_AlreadyInBuffer);
				goto fail;
			}
/* Same url, but a different #section */
			s = findHash(line);
			if (!s) {	// no section specified
// jump to line 1, if there is a line 1
				if(!cw->dot) {
					if(debugLevel >= 1)
						i_puts(MSG_Empty);
					goto success;
				}
				if(cw->dot == 1) {
					if(debugLevel >= 1)
						printDot();
					goto success;
				}
				struct histLabel *label =
				    allocMem(sizeof(struct histLabel));
				label->label = cw->dot;
				label->prev = cw->histLabel;
				cw->histLabel = label;
				cw->dot = 1;
				if(debugLevel >= 1)
					printDot();
				goto success;
			}
			line = s;
			first = '#';
			cmd = 'b';
			emode = false;
			debugPrint(2, " hash replace %s", line);
			goto browse;
		}

// Different URL, go get it.
// did you make changes that you didn't write?
		if (!cxQuit(context, 0)) goto fail;
		undoCompare();
		cw->undoable = cw->changeMode = false;
		uchar prebrowse = cw->browseMode;
		undoSpecialClear();
		startRange = endRange = 0;
		if(!noStack) freeWindows(context, false);
		changeFileName = 0;	// should already be zero
		thisfile = ((icmd == 'g' || icmd == 'i') ? cf->fileName : 0);
		jumptag = 0;
		w = createWindow();
		w->sno = context;
		cw = w;		// we might wind up putting this back
		selfFrame();
		cf->uriEncoded = uriEncoded;
/* Check for sendmail link */
		if (cmd == 'b' && memEqualCI(line, "mailto:", 7)) {
			char *addr, *subj, *body;
			char *q;
			int ql;
			decodeMailURL(line, &addr, &subj, &body);
			ql = strlen(addr);
			ql += 4;	/* to:\n */
			ql += subj ? strlen(subj) : 5;
			ql += 9;	/* subject:\n */
			if (body)
				ql += strlen(body);
			q = allocMem(ql + 1);
			sprintf(q, "to:%s\nsubject:%s\n%s", addr,
				subj ? subj : "Hello", body ? body : "");
			j = addTextToBuffer((pst) q, ql, 0, false);
			nzFree(q);
			nzFree(addr);
			nzFree(subj);
			nzFree(body);
			if (j)
				i_puts(MSG_MailHowto);
// serverData doesn't mean anything here, but it has to be not null
// for some code that is coming up.
			serverData = emptyString;
		} else {
			bool save_pg;

/*********************************************************************
Before we set the new file name, and before we call up the next web page,
we have to make sure it has a protocol. Every url needs a protocol.
*********************************************************************/

			if (missingProtURL(line)) {
				char *w = allocMem(strlen(line) + 8);
				sprintf(w, "http://%s", line);
				nzFree(allocatedLine);
				line = allocatedLine = w;
			}

			cf->fileName = cloneString(line);
			cf->firstURL = cloneString(line);
			if (isSQL(line))
				cw->sqlMode = true;
			if (icmd == 'g' && !nogo && isURL(line))
				debugPrint(2, "*%s", (strncmp(line, "data:", 5) ? line : "data:"));
// emode suppresses plugins, as well as browsing
			save_pg = pluginsOn;
			if (emode) pluginsOn = false;
			j = readFile(line, (cmd != 'r'), 0,
				     thisfile, 0, prebrowse,
			(icmd == 'g' ? gotag : 0));
			pluginsOn = save_pg;
		}
		w->undoable = w->changeMode = false;
		cw = cs->lw;	// put it back, for now
		selfFrame();
/* Don't push a new session if we were trying to read a url,
 * and didn't get anything. */
// it's possible to get here in directory mode, with serverData == NULL
//  file:///var/log
		if (!serverData && (isURL(line) || isSQL(line)) && !w->dirMode) {
			fileSize = -1;
			freeWindow(w);
			if (noStack && cw->prev) {
				w = cw;
				cw = w->prev;
				selfFrame();
				cs->lw = cw;
				freeWindow(w);
			}
			goto donej;
		}
		if (noStack) {
			w->prev = cw->prev;
			nzFree(w->f0.firstURL);
			w->f0.firstURL = cf->firstURL;
			cf->firstURL = 0;
			cxQuit(context, 1);
		} else {
			w->prev = cw;
		}
		cs->lw = cw = w;
		selfFrame();
		if (!w->prev)
			cs->fw = w;
		if (!j)
			goto fail;
		if (changeFileName) {
// If not browsing, and redriected here by 302, lop of the hash,
// only cause that is consistent with no redirection.
			if(redirect_count && cmd != 'b' &&
			(p = findHash(changeFileName)))
				*p = 0;
			nzFree(w->f0.fileName);
			w->f0.fileName = changeFileName;
			w->f0.uriEncoded = true;
			changeFileName = 0;
		}
/* Some files we just can't browse */
		if (!cw->dol || cw->dirMode)
			cmd = 'e';
		if (cw->binMode && (!cf->mt || !cf->mt->outtype))
			cmd = 'e';
		if (cmd == 'e')
			goto success;
	}

browse:
	if (cmd == 'b') {
		char *newhash;
		if (cw->dirMode) {
			setError(MSG_DirCommand, cmd);
			goto fail;
		}
		if (!cw->browseMode) {
			int save_count = redirect_count;
			if (!cw->dol) {
				setError(MSG_BrowseEmpty);
				goto fail;
			}
			if (fileSize >= 0) {
				debugPrint(1, "%lld", fileSize);
				fileSize = -1;
			}
			if (!browseCurrentBuffer(browseSuffix, plainMail)) {
				if (icmd == 'b')
					goto fail;
				goto success;
			}
			redirect_count = save_count;
			if(cw->f_dot && cw->f_dot <= cw->dol)
				cw->dot = cw->f_dot;
		} else if (!first) {
			setError(MSG_BrowseAlready);
			goto fail;
		}

		if (newlocation) {
			if (!shortRefreshDelay(newlocation, newloc_d)) {
				nzFree(newlocation);
				newlocation = 0;
			} else {
redirect:
// sanity check for infinite loop
				if(++newloc_count == 3) {
				debugPrint(1, "more than 2 redirects, stop at %s", newlocation);
				nzFree(newlocation), newlocation = 0;
				goto success;
			}
				selfFrame();
				noStack = newloc_r;
				if (newloc_f != cf)
					goto replaceframe;
				nzFree(allocatedLine);
				line = allocatedLine = newlocation;
				newlocation = 0;
				debugPrint(2, "redirect %s", line);
				icmd = cmd = 'b';
				uriEncoded = true;
				first = *line;
				if (intFlag) {
					i_puts(MSG_RedirectionInterrupted);
					goto success;
				}
				goto rebrowse;
			}
		}

/* Jump to the #section if specified in the url */
		if(!redirect_count) {
			if(!(p = findHash(line)))
				goto success;
			newhash = cloneString(p + 1);
		} else {
			if(!(p = findHash(cw->f0.fileName)))
				goto success;
// have to pull #stuff out and still leave the .browse at the end.
			s = p + strlen(p) - 7;
			if(s <= p) // should never happen
				goto success;
			newhash = pullString1(p + 1, s);
			strmove(p, s);
		}

/* Print the file size before we print the line. */
		if (fileSize >= 0) {
			debugPrint(1, "%lld", fileSize);
			fileSize = -1;
		}
		debugPrint(3, "set hash %s", newhash);
		set_location_hash(newhash);
		unpercentString(newhash);
		rc = jump2anchor(jumptag, newhash);
		nzFree(newhash);
		goto done;
	}

	if (cmd == 'g' || cmd == 'v') {
		undoSpecialClear();
		rc = doGlobal(line);
		nzFree(gflag), gflag = 0;
		goto done;
	}

	if (cmd == 'm' || cmd == 't') {
		rc = moveCopy();
		goto done;
	}

	if (cmd == 'i') {
		if (cw->browseMode) {
			setError(MSG_BrowseCommand, 'i');
			goto fail;
		}
		cmd = 'a';
		--startRange, --endRange;
	}

	if (cmd == 'c') {
		delText(startRange, endRange);
		endRange = --startRange;
		cmd = 'a';
	}

	if (cmd == 'a') {
		if (inscript && cw->sqlMode) {
			setError(MSG_InsertFunction);
			goto fail;
		}

		if (cw->sqlMode) {
			rc = sqlAddRows(endRange);
			goto done;
		}

		if (cw->imapMode1) {
			rc = addFolders();
			goto done;
		}

		rc = inputLinesIntoBuffer();
		goto done;
	}

	if (cmd == 'd' || cmd == 'D') {
		if (cw->imapMode1) {
			if (globSub) {
				setError(MSG_GlobalCommand, icmd);
				goto failg;
			}
			if (endRange > startRange) {
				setError(MSG_RangeCmd, "d");
				goto fail;
			}
			rc = deleteFolder(endRange);
			goto done;
		}

		if (cw->imapMode2) {
			rc = imapDelete(startRange, endRange, cmd);
			if(!rc) globSub = false;
			goto done;
		}

		if (cw->imapMode3) {
			globSub = false;
			if(endRange > startRange) {
				setError(MSG_RangeCmd, "d");
				goto fail;
			}
			rc = imapDeleteWhileReading();
			goto done;
		}

		if (cw->dirMode) {
			j = delFiles(startRange, endRange, true, icmd, &cmd);
			undoCompare();
			cw->undoable = false;
			undoSpecialClear();
			goto afterdelete;
		}

		if (cw->sqlMode) {
			j = sqlDelRows(startRange, endRange);
			undoCompare();
			cw->undoable = false;
			goto afterdelete;
		}

		if (cw->browseMode) {
			delTags(startRange, endRange);
			undoSpecialClear();
		}

		delText(startRange, endRange);
		j = 1;
afterdelete:
		if (!j)
			globSub = false;
		else if (cmd == 'D')
			printDot();
		if(cw->ircoMode) cw->undoable = true;
		goto donej;
	}

	if (cmd == 'j' || cmd == 'J') {
		rc = joinText(line);
		goto done;
	}

	if (cmd == 'r') {
		if (cx) {
			if(atsave) *atsave = '@';
			rc = readContext(cx, atWindow, readLine1, readLine2);
			goto done;
		}

		if(first == '!') { // read from a command, like ed
			char *outdata;
			int outlen, pexit;
			FILE *p;
			char *newline = bangbang(line + 1);
			eb_variables();
			newline = apostropheMacros(newline);
			p = popen(newline, "r");
			nzFree(newline);
			if (!p) {
				setError(MSG_NoSpawn, line + 1, errno);
				goto fail;
			}
			rc = fdIntoMemory(fileno(p), &outdata, &outlen, 0);
			if(!rc) {
				pclose(p);
				goto fail;
			}
			pexit = pclose(p);
			if(pexit) {
				setError(MSG_CmdFail);
				nzFree(outdata);
				goto fail;
			}
// Warning, we don't convert output from iso8859 or other formats to utf8,
// like we do when reading from a file; just assume it is proper.
			rc = addTextToBuffer((pst)outdata, outlen, endRange, true);
			nzFree(outdata);
			if(rc)
				debugPrint(1, "%d", outlen);
			goto done;
		}

		if (first) {
			if (cw->sqlMode && !isSQL(line)) {
				strcpy(newline, cf->fileName);
				strmove(strchr(newline + 1, ']') + 1, line);
				line = newline;
			}
			rc = readFile(line, false, 0, 0, 0, cw->browseMode, 0);
			if (!serverData)
				fileSize = -1;
			goto done;
		}
		setError(MSG_NoFileSpecified);
		goto fail;
	}

	if (cmd == 's') {
		if (cw->imapMode1) {
			if (globSub) {
				setError(MSG_GlobalCommand, icmd);
				goto failg;
			}
			if (endRange > startRange) {
				setError(MSG_RangeCmd, "s");
				goto fail;
			}
// substituteText will handle the imap folder rename
			j = substituteText(line);
			if(j <= 0) goto fail;
// success, but we have to refresh.
			rc = imap1rf();
			goto done;
		}

		pst p;
		j = substituteText(line);
// special case, if last line became empty and nlMode is true.
		if (cw->dol && cw->nlMode &&
		    (p = fetchLine(cw->dol, -1)) && p[0] == '\n')
			delText(cw->dol, cw->dol);
		if (j < 0) {
			globSub = false;
			j = false;
		}
		if (newlocation)
			goto redirect;
		goto donej;
	}

	setError(MSG_CNYI, icmd);
	goto failg;

// If this was C++ then I'd set this up so return would free allocatedLine,
// but it's not so we have to jump to one of these cases.

success:
	nzFree(allocatedLine);
	return true;

fail:
	nzFree(allocatedLine);
	return false;

failg:
	nzFree(allocatedLine);
	return globSub = false;

donej:
	rc = j;
done:
	nzFree(allocatedLine);
	return rc;
}

bool edbrowseCommand(const char *line, bool script)
{
	bool rc;
	intFlag = false;
	inscript = script;
	fileSize = -1;
	skipWhite(&line);
	rc = runCommand(line);
	if (fileSize >= 0)
		debugPrint(1, "%lld", fileSize);
	fileSize = -1;
	if (!rc) {
		if (!script)
			showErrorConditional(cmd);
		eeCheck();
	}
	if (!script) printPrompt();
	return rc;
}

// Take some text, usually empty, and put it in a side buffer
// in a different session.
int sideBuffer(int cx, const char *text, int textlen, const char *bufname)
{
	int svcx = context;
	bool rc;
	if (cx) {
		if(cxActive(cx, false))
			cxQuit(cx, 3);
	} else {
		for (cx = 1; cx < MAXSESSION; ++cx)
			if (!sessionList[cx].lw)
				break;
		if (cx == MAXSESSION) {
			i_puts(MSG_NoBufferExtraWindow);
			return 0;
		}
	}
	cxSwitch(cx, false);
	if (bufname) {
		cf->fileName = cloneString(bufname);
		debrowseSuffix(cf->fileName);
	}
	if (textlen < 0) {
		textlen = strlen(text);
	} else {
		cw->binMode = looksBinary((uchar *) text, textlen);
	}
	if (textlen) {
		rc = addTextToBuffer((pst) text, textlen, 0, false);
		cw->changeMode = false;
		if (!rc)
			i_printf(MSG_BufferPreload, cx);
	}
	/* back to original context */
	cxSwitch(svcx, false);
	return cx;
}

void freeEmptySideBuffer(int n)
{
	Window *side;
	if (!(side = sessionList[n].lw))
		return;
	if (side->f0.fileName)
		return;
	if (side->dol)
		return;
	if (side != sessionList[n].fw)
		return;
/* We could have added a line, then deleted it */
	cxQuit(n, 3);
}

bool locateTagInBuffer(int tagno, int *ln1_p, int *ln2_p,
char **p1_p, char **p2_p,
char **s_p, char **t_p)
{
	int ln, n;
	char *p, *s = 0, *t, c;
	char search[20];
	char searchend[4];

	sprintf(search, "%c%d<", InternalCodeChar, tagno);
	sprintf(searchend, "%c0>", InternalCodeChar);
	n = strlen(search);
	for (ln = 1; ln <= cw->dol; ++ln) {
		p = (char *)fetchLine(ln, -1);
		if(s) goto look4end;
		for (s = p; (c = *s) != '\n'; ++s) {
			if (c != InternalCodeChar)
				continue;
			if (!strncmp(s, search, n))
				break;
		}
		if (c == '\n') { s = 0; continue; }
		s = strchr(s, '<') + 1;
		*ln1_p = ln;
		*p1_p = p;
		*s_p = s;
look4end:
		t = (ln == *ln1_p ? s : p);
		for (; (c = *t) != '\n'; ++t)
			if(!strncmp(t, searchend, 3)) break;
		if(c == '\n') continue;
		*t_p = t;
		*ln2_p = ln;
		*p2_p = p;
		return true;
	}

	return false;
}

char *getFieldFromBuffer(int tagno, int ln0)
{
	int ln1, ln2;
	char *p1, *p2, *s, *t;
	char *a;
	int len, j;
	if (!locateTagInBuffer(tagno, &ln1, &ln2, &p1, &p2, &s, &t))
		return 0; 	// apparently the line has been deleted
	if(ln1 == ln2) // high runner case
		return pullString1(s, t);

// fold the textarea into one string
	a = initString(&len);
	while(*s != '\n')
		stringAndChar(&a, &len, *s++);
// in this context we need crlf
	stringAndChar(&a, &len, '\r');
	stringAndChar(&a, &len, '\n');
	for(; ln1 < ln2; ++ln1) {
		p1 = (char*)fetchLine(ln1, -1);
		j = pstLength((pst)p1);
		stringAndBytes(&a, &len, p1, j);
		a[len-1] = '\r';
	stringAndChar(&a, &len, '\n');
	}
	while(p2 != t)
		stringAndChar(&a, &len, *p2++);
	return a;
}

int fieldIsChecked(int tagno)
{
	int ln1, ln2;
	char *p1, *p2, *s, *t;
	if (locateTagInBuffer(tagno, &ln1, &ln2, &p1, &p2, &s, &t))
		return (*s == '+');
	return -1;
}
