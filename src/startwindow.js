/*********************************************************************
This file contains support javascript functions used by a browser.
They are easier to write here in javascript, then in C using the js api.
And it is portable amongst all js engines.
This file is converted into a C string and compiled and run
at the start of each javascript window.
Please take advantage of this machinery and put functions here,
including prototypes and getter / setter support functions,
whenever it makes sense to do so.

edbrowse support functions and native methods will always start with eb$,
hoping they will not accidentally collide with js functions in the wild.
Example: eb$newLocation, a native method that redirects this web page to another.

It would be nice to run this file stand-alone, outside of edbrowse,
even if the functionality is limited.
To this end, I create the window object if it isn't already there,
using the obvious window = this.
*********************************************************************/

if(typeof window === "undefined") {
window = this;
mw0 = {compiled: false};
document = new Object;
// Stubs for native methods that are normally provided by edbrowse.
// Example: eb$puts, which we can replace with print,
// which is native to the duktape shell.
eb$puts = print;
eb$logputs = function(a,b) { print(b); }
eb$newLocation = function (s) { print("new location " + s); }
eb$logElement = function(o, tag) { print("pass tag " + tag + " to edbrowse"); }
eb$getcook = function(member) { return "cookies"; }
eb$setcook = function(value, member) { print(" new cookie " + value); }
eb$formSubmit = function() { print("submit"); }
eb$formReset = function() { print("reset"); }
my$win = function() { return window; }
my$doc = function() { return document; }
document.eb$apch2 = function(c) { alert("append " + c.nodeName  + " to " + this.nodeName); this.childNodes.push(c); }
querySelectorAll = function() { return [] ; }
querySelector = function() { return {} ; }
eb$cssText = function(){}
}

// other names for window
self = top = parent = window;
frameElement = null;
// parent and top and frameElement could be changed
// if this is a frame in a larger frameset.

/* An ok (object keys) function for javascript/dom debugging.
 * This is in concert with the jdb command in edbrowse.
 * I know, it doesn't start with eb$ but I wanted an easy,
 * mnemonic command that I could type in quickly.
 * If a web page creates an ok function it will override this one. */
ok = Object.keys = Object.keys || (function () { 
		var hasOwnProperty = Object.prototype.hasOwnProperty, 
		hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
		DontEnums = [ 
		'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 
		'isPrototypeOf', 'propertyIsEnumerable', 'constructor' 
		], 
		DontEnumsLength = DontEnums.length; 
		return function (o) { 
		if (typeof o !== "object" && typeof o !== "function" || o === null) 
		throw new TypeError("Object.keys called on a non-object");
		var result = []; 
		for (var name in o) { 
		if (hasOwnProperty.call(o, name)) 
		result.push(name); 
		} 
		if (hasDontEnumBug) { 
		for (var i = 0; i < DontEnumsLength; i++) { 
		if (hasOwnProperty.call(o, DontEnums[i]))
		result.push(DontEnums[i]);
		}
		}
		return result; 
		}; 
		})(); 

// print an error inline, at debug level 3 or higher.
function alert3(s) { eb$logputs(3, s); }
function alert4(s) { eb$logputs(4, s); }

// Dump the tree below a node, this is for debugging.
document.nodeName = "DOCUMENT"; // in case you want to start at the top.
window.nodeName = "WINDOW";

// Print the first line of text for a text node, and no braces
// because nothing should be below a text node.
// You can make this more elaborate and informative if you wish.
if(!mw0.compiled) {

mw0.dumptree = function(top) {
var nn = top.nodeName.toLowerCase();
var extra = "";
if(nn === "#text" && top.data) {
extra = top.data;
extra = extra.replace(/^[ \t\n]*/, "");
var l = extra.indexOf('\n');
if(l >= 0) extra = extra.substr(0,l);
if(extra.length > 120) extra = extra.substr(0,120);
}
if(nn === "option" && top.text)
extra = top.text;
if(nn === "a" && top.href)
extra = top.href.toString();
if(nn === "base" && top.href)
extra = top.href.toString();
if(extra.length) extra = ' ' + extra;
// some tags should never have anything below them so skip the parentheses notation for these.
if((nn == "base" || nn == "meta" || nn == "link" ||nn == "#text" || nn == "image" || nn == "option" || nn == "input" || nn == "script") &&
(!top.childNodes || top.childNodes.length == 0)) {
alert(nn + extra);
return;
}
alert(nn + " {" + extra);
if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
dumptree(c);
}
}
alert("}");
}

/*********************************************************************
Show the scripts, where they come from, type, length, whether deminimized.
This uses getElementsByTagname() so you see all the scripts,
not just those that were in the original html.
The list is left in $ss for convenient access.
Careful! This is compiled only once in the master window,
so how do I get at your document, and leave $ss in your window?
The native functions my$doc() and my$win() help with that.
*********************************************************************/

mw0.showscripts = function()
{
var i, s, m;
var d = my$doc();
var w = my$win();
var slist = d.getElementsByTagName("script");
for(i=0; i<slist.length; ++i) {
s = slist[i];
m = i + ": ";
if(s.type) m += s.type;
else m += "default";
m += " ";
if(s.src) {
var ss = s.src.toString();
if(ss.match(/^data:/)) ss = "data";
m += ss;
} else {
m += "inline";
}
if(typeof s.data === "string")
m += " length " + s.data.length;
else
m += " length ?";
if(s.expanded) m += " deminimized";
alert(m);
}
w.$ss = slist;
}

mw0.searchscripts = function(t)
{
var w = my$win();
if(!w.$ss) mw0.showscripts();
for(var i=0; i<w.$ss.length; ++i)
if(w.$ss[i].data && w.$ss[i].data.indexOf(t) >= 0) alert(i);
}

// run an expression in a loop.
mw0.aloop = function(s$$, t$$, exp$$)
{
if(Array.isArray(s$$)) {
mw0.aloop(0, s$$.length, t$$);
return;
}
if(typeof s$$ !== "number" || typeof t$$ !== "number" || typeof exp$$ !== "string") {
alert("aloop(array, expression) or aloop(start, end, expression)");
return;
}
exp$$ = "for(var i=" + s$$ +"; i<" + t$$ +"; ++i){" + exp$$ + "}";
my$win().eval(exp$$);
}

} // master compile

dumptree = mw0.dumptree;
showscripts = mw0.showscripts;
searchscripts = mw0.searchscripts;
aloop = mw0.aloop;

// This is our bailout function, it references a variable that does not exist.
function eb$stopexec() { return javascript$interrupt; }

eb$nullfunction = function() { return null; }
eb$voidfunction = function() { }
eb$truefunction = function() { return true; }
eb$falsefunction = function() { return false; }

focus = blur = scroll = eb$voidfunction;
document.focus = document.blur = document.open = document.close = eb$voidfunction;

/* Some visual attributes of the window.
 * These are just guesses.
 * Better to have something than nothing at all. */
height = 768;
width = 1024;
// document.status is removed because it creates a conflict with
// the status property of the XMLHttpRequest implementation
defaultStatus = 0;
returnValue = true;
menubar = true;
scrollbars = true;
toolbar = true;
resizable = true;
directories = false;
name = "unspecifiedFrame";
eb$base = "";

document.bgcolor = "white";
document.readyState = "loading";
document.nodeType = 9;

screen = {
height: 768, width: 1024,
availHeight: 768, availWidth: 1024, availTop: 0, availLeft: 0};

// window.alert is a simple wrapper around native puts.
// Some web pages overwrite alert.
alert = eb$puts;

// The web console, one argument, print based on debugLevel.
// First a helper function, then the console object.
if(!mw0.compiled) {
mw0.eb$logtime = function(debug, level, obj) {
var today=new Date;
var h=today.getHours();
var m=today.getMinutes();
var s=today.getSeconds();
// add a zero in front of numbers<10
if(h < 10) h = "0" + h;
if(m < 10) m = "0" + m;
if(s < 10) s = "0" + s;
eb$logputs(debug, "console " + level + " [" + h + ":" + m + ":" + s + "] " + obj);
}

mw0.console = {
log: function(obj) { mw0.eb$logtime(3, "log", obj); },
info: function(obj) { mw0.eb$logtime(3, "info", obj); },
warn: function(obj) { mw0.eb$logtime(3, "warn", obj); },
error: function(obj) { mw0.eb$logtime(3, "error", obj); },
timeStamp: function(label) { if(label === undefined) label = "x"; return label.toString() + (new Date).getTime(); }
};

} // master compile
console = mw0.console;

Object.defineProperty(document, "cookie", {
get: eb$getcook, set: eb$setcook});

Object.defineProperty(document, "documentElement", {
get: function() { var e = this.lastChild;
if(!e) { alert3("missing html node"); return null; }
if(e.nodeName != "HTML") alert3("html node name " + e.nodeName);
return e; }});
Object.defineProperty(document, "head", {
get: function() { var e = this.documentElement;
if(!e) return null;
// In case somebody adds extra nodes under <html>, I search for head and body.
// But it should always be head, body.
for(var i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName == "HEAD") return e.childNodes[i];
alert3("missing head node"); return null;},
set: function(h) { var e = this.documentElement;
if(!e) return;
var i;
for(i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName == "HEAD") break;
if(i < e.childNodes.length) e.removeChild(e.childNodes[i]); else i=0;
if(h) {
if(h.nodeName != "HEAD") { alert3("head replaced with node " + h.nodeName); h.nodeName = "HEAD"; }
if(i == e.childNodes.length) e.appendChild(h);
else e.insertBefore(h, e.childNodes[i]);
}
}});
Object.defineProperty(document, "body", {
get: function() { var e = this.documentElement;
if(!e) return null;
for(var i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName == "BODY") return e.childNodes[i];
alert3("missing body node"); return null;},
set: function(b) { var e = this.documentElement;
if(!e) return;
var i;
for(i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName == "BODY") break;
if(i < e.childNodes.length) e.removeChild(e.childNodes[i]);
if(b) {
if(b.nodeName != "BODY") { alert3("body replaced with node " + b.nodeName); b.nodeName = "BODY"; }
if(i == e.childNodes.length) e.appendChild(b);
else e.insertBefore(b, e.childNodes[i]);
}
}});

navigator = new Object;
navigator.appName = "edbrowse";
navigator["appCode Name"] = "edbrowse C/duktape";
/* not sure what product is about */
navigator.product = "duktape";
navigator.productSub = "2.1";
navigator.vendor = "Karl Dahlke";
navigator.javaEnabled = eb$falsefunction;
navigator.taintEnabled = eb$falsefunction;
navigator.cookieEnabled = true;
navigator.onLine = true;
navigator.mimeTypes = [];
navigator.plugins = [];
// the rest of navigator, and of course the plugins,
// must be filled in at run time based on the config file.
// This is overwritten at startup by edbrowse.
navigator.userAgent = "edbrowse/3.0.0";

/* There's no history in edbrowse. */
/* Only the current file is known, hence length is 1. */
history = new Object;
history.length = 1;
history.next = "";
history.previous = "";
history.back = eb$voidfunction;
history.forward = eb$voidfunction;
history.go = eb$voidfunction;
history.pushState = eb$voidfunction;
history.replaceState = eb$voidfunction;
history.toString = function() {
 return "Sorry, edbrowse does not maintain a browsing history.";
} 

/* some base arrays - lists of things we'll probably need */
document.heads = [];
document.bases = [];
document.links = [];
document.metas = [];
document.styles = [];
document.bodies = [];
document.forms = [];
document.elements = [];
document.divs = [];
document.htmlobjs = [];
document.scripts = [];
document.paragraphs = [];
document.headers = [];
document.footers = [];
document.tables = [];
document.spans = [];
document.images = [];
// styleSheets is a placeholder for now; I don't know what to do with it.
document.styleSheets = [];

frames = [];
// to debug a.href = object or other weird things.
hrefset$p = []; hrefset$a = [];

// symbolic constants for compareDocumentPosition
DOCUMENT_POSITION_DISCONNECTED = 1;
DOCUMENT_POSITION_PRECEDING = 2;
DOCUMENT_POSITION_FOLLOWING = 4;
DOCUMENT_POSITION_CONTAINS = 8;
DOCUMENT_POSITION_CONTAINED_BY = 16;

/*********************************************************************
The URL class is head-spinning in its complexity and its side effects.
Almost all of these can be handled in JS,
except for setting window.location or document.location to a new url,
which replaces the web page you are looking at.
This side effect does not take place in the constructor, which establishes the initial url.
*********************************************************************/

if(!mw0.compiled) {
mw0.URL = function() {
var h = "";
if(arguments.length > 0) h= arguments[0];
this.href = h;
}

/* rebuild the href string from its components.
 * Call this when a component changes.
 * All components are strings, except for port,
 * and all should be defined, even if they are empty. */
mw0.URL.prototype.rebuild = function() {
var h = "";
if(this.protocol$val.length) {
// protocol includes the colon
h = this.protocol$val;
var plc = h.toLowerCase();
if(plc != "mailto:" && plc != "telnet:" && plc != "javascript:")
h += "//";
}
if(this.host$val.length) {
h += this.host$val;
} else if(this.hostname$val.length) {
h += this.hostname$val;
if(this.port$val != 0)
h += ":" + this.port$val;
}
if(this.pathname$val.length) {
// pathname should always begin with /, should we check for that?
if(!this.pathname$val.match(/^\//))
h += "/";
h += this.pathname$val;
}
if(this.search$val.length) {
// search should always begin with ?, should we check for that?
h += this.search$val;
}
if(this.hash$val.length) {
// hash should always begin with #, should we check for that?
h += this.hash$val;
}
this.href$val = h;
};

// No idea why we can't just assign the property directly.
// URL.prototype.protocol = { ... };
Object.defineProperty(mw0.URL.prototype, "protocol", {
  get: function() {return this.protocol$val; },
  set: function(v) { this.protocol$val = v; this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "pathname", {
  get: function() {return this.pathname$val; },
  set: function(v) { this.pathname$val = v; this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "search", {
  get: function() {return this.search$val; },
  set: function(v) { this.search$val = v; this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "hash", {
  get: function() {return this.hash$val; },
  set: function(v) { this.hash$val = v; this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "port", {
  get: function() {return this.port$val; },
  set: function(v) { this.port$val = v;
if(this.hostname$val.length)
this.host$val = this.hostname$val + ":" + v;
this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "hostname", {
  get: function() {return this.hostname$val; },
  set: function(v) { this.hostname$val = v;
if(this.port$val)
this.host$val = v + ":" +  this.port$val;
this.rebuild(); }
});

Object.defineProperty(mw0.URL.prototype, "host", {
  get: function() {return this.host$val; },
  set: function(v) { this.host$val = v;
if(v.match(/:/)) {
this.hostname$val = v.replace(/:.*/, "");
this.port$val = v.replace(/^.*:/, "");
/* port has to be an integer */
this.port$val = parseInt(this.port$val);
} else {
this.hostname$val = v;
this.port$val = 0;
}
this.rebuild(); }
});

mw0.eb$defport = {
http: 80,
https: 443,
pop3: 110,
pop3s: 995,
imap: 220,
imaps: 993,
smtp: 25,
submission: 587,
smtps: 465,
proxy: 3128,
ftp: 21,
sftp: 22,
scp: 22,
ftps: 990,
tftp: 69,
gopher: 70,
finger: 79,
telnet: 23,
smb: 139
};

/* returns default port as an integer, based on protocol */
mw0.eb$setDefaultPort = function(p) {
var port = 0;
p = p.toLowerCase().replace(/:/, "");
if(mw0.eb$defport.hasOwnProperty(p))
port = mw0.eb$defport[p];
return port;
}

Object.defineProperty(mw0.URL.prototype, "href", {
  get: function() {return this.href$val; },
  set: function(v) {
var inconstruct = true;
if(v instanceof URL) v = v.toString();
if(v === null || v === undefined) v = "";
if(typeof v != "string") return;
if(this.href$val) {
// Ok, we already had a url, and here's nother one.
// I think we're suppose to resolve it against what was already there,
// so that /foo against www.xyz.com becomes www.xyz.com/foobar
if(v) v = eb$resolveURL(this.href$val, v);
inconstruct = false;
}
this.href$val = v;
// initialize components to empty,
// then fill them in from href if they are present */
this.protocol$val = "";
this.hostname$val = "";
this.port$val = 0;
this.host$val = "";
this.pathname$val = "";
this.search$val = "";
this.hash$val = "";
if(v.match(/^[a-zA-Z]*:/)) {
this.protocol$val = v.replace(/:.*/, "");
this.protocol$val += ":";
v = v.replace(/^[a-zA-z]*:\/*/, "");
}
if(v.match(/[/#?]/)) {
/* contains / ? or # */
this.host$val = v.replace(/[/#?].*/, "");
v = v.replace(/^[^/#?]*/, "");
} else {
/* no / ? or #, the whole thing is the host, www.foo.bar */
this.host$val = v;
v = "";
}
if(this.host$val.match(/:/)) {
this.hostname$val = this.host$val.replace(/:.*/, "");
this.port$val = this.host$val.replace(/^.*:/, "");
/* port has to be an integer */
this.port$val = parseInt(this.port$val);
} else {
this.hostname$val = this.host$val;
// should we be filling in a default port here?
this.port$val = mw0.eb$setDefaultPort(this.protocol$val);
}
// perhaps set protocol to http if it looks like a url?
// as in edbrowse foo.bar.com
// Ends in standard tld, or looks like an ip4 address, or starts with www.
if(this.protocol$val == "" &&
(this.hostname$val.match(/\.(com|org|net|info|biz|gov|edu|us|uk|ca|au)$/) ||
this.hostname$val.match(/^\d+\.\d+\.\d+\.\d+$/) ||
this.hostname$val.match(/^www\..*\.[a-zA-Z]{2,}$/))) {
this.protocol$val = "http:";
if(this.port$val == 0)
this.port$val = 80;
}
if(v.match(/[#?]/)) {
this.pathname$val = v.replace(/[#?].*/, "");
v = v.replace(/^[^#?]*/, "");
} else {
this.pathname$val = v;
v = "";
}
if(this.pathname$val == "")
this.pathname$val = "/";
if(v.match(/#/)) {
this.search$val = v.replace(/#.*/, "");
this.hash$val = v.replace(/^[^#]*/, "");
} else {
this.search$val = v;
}
if(!inconstruct && (this == my$win().location || this == my$doc().location)) {
// replace the web page
eb$newLocation('r' + this.href$val + '\n');
}
}
});

mw0.URL.prototype.toString = function() { 
return this.href$val;
}

Object.defineProperty(mw0.URL.prototype, "length", { get: function() { return this.toString().length; }});

mw0.URL.prototype.concat = function(s) { 
return this.toString().concat(s);
}

mw0.URL.prototype.startsWith = function(s) { 
return this.toString().startsWith(s);
}

mw0.URL.prototype.endsWith = function(s) { 
return this.toString().endsWith(s);
}

mw0.URL.prototype.includes = function(s) { 
return this.toString().includes(s);
}

/*
Can't turn URL.search into String.search, because search is already a property
of URL, that is, the search portion of the URL.
mw0.URL.prototype.search = function(s) { 
return this.toString().search(s);
}
*/

mw0.URL.prototype.indexOf = function(s) { 
return this.toString().indexOf(s);
}

mw0.URL.prototype.lastIndexOf = function(s) { 
return this.toString().lastIndexOf(s);
}

mw0.URL.prototype.substring = function(from, to) { 
return this.toString().substring(from, to);
}

mw0.URL.prototype.substr = function(from, to) {
return this.toString().substr(from, to);
}

mw0.URL.prototype.toLowerCase = function() { 
return this.toString().toLowerCase();
}

mw0.URL.prototype.toUpperCase = function() { 
return this.toString().toUpperCase();
}

mw0.URL.prototype.match = function(s) { 
return this.toString().match(s);
}

mw0.URL.prototype.replace = function(s, t) { 
return this.toString().replace(s, t);
}

mw0.URL.prototype.split = function(s) {
return this.toString().split(s);
}

mw0.URL.prototype.slice = function(from, to) {
return this.toString().slice(from, to);
}

mw0.URL.prototype.charAt = function(n) {
return this.toString().charAt(n);
}

mw0.URL.prototype.charCodeAt = function(n) {
return this.toString().charCodeAt(n);
}

mw0.URL.prototype.trim = function() {
return this.toString().trim();
}

/*********************************************************************
Here are the DOM classes with generic constructors.
But first, the Node class, which is suppose to be the parent class
of all the others. Javascript can't inherit like that, which is a bummer.
Still, I include Node because some javascript will interrogate Node to see
which methods all the nodes possess?
Do we support appendchild?   etc.
*********************************************************************/

mw0.Node = function(){}

mw0.HTML = function(){}
// Some screen attributes that are suppose to be there.
mw0.HTML.prototype = {
clientHeight: 768,  clientWidth: 1024,  offsetHeight: 768,  offsetWidth: 1024,
 scrollHeight: 768,  scrollWidth: 1024,  scrollTop: 0,  scrollLeft: 0};
mw0.DocType = function(){ this.nodeType = 10, this.nodeName = "DOCTYPE";}
mw0.Head = function(){}
mw0.Meta = function(){}
mw0.Title = function(){}
mw0.Link = function(){}
// It's a list but why would it ever be more than one?
Object.defineProperty(mw0.Link.prototype, "relList", {
get: function() { var a = this.rel ? [this.rel] : [];
// edbrowse only supports stylesheet
a.supports = function(s) { return s === "stylesheet"; }
return a;
}});
mw0.Body = function(){}
mw0.Body.prototype = {
clientHeight: 768,  clientWidth: 1024,  offsetHeight: 768,  offsetWidth: 1024,
 scrollHeight: 768,  scrollWidth: 1024,  scrollTop: 0,  scrollLeft: 0};
mw0.Base = function(){}
mw0.Form = function(){}
mw0.Form.prototype = {
submit: eb$formSubmit, reset: eb$formReset};
mw0.Element = function(){}
mw0.HTMLElement = function(){}
mw0.Image = function(){}
mw0.Frame = function(){}
mw0.Anchor = function(){}
mw0.Lister = function(){}
mw0.Listitem = function(){}
mw0.Tbody = function(){}
mw0.Table = function(){}
mw0.Div = function(){}
mw0.HtmlObj = function(){}
mw0.Area = function(){}
mw0.Span = function(){}
mw0.Trow = function(){}
mw0.Cell = function(){}
mw0.P = function(){}
mw0.Header = function(){}
mw0.Footer = function(){}
mw0.Script = function(){}
mw0.HTMLScriptElement = mw0.Script; // alias for Script, I guess
mw0.Timer = function(){this.nodeName = "TIMER";}
mw0.Audio = function(){}

/*********************************************************************
If foo is an anchor, then foo.href = blah
builds the url object; there are a lot of side effects here.
Same for form.action, script.src, etc.
I believe that a new URL should be resolved against the base, that is,
/foobar becomes www.xyz.com/foobar, though I'm not sure.
We ought not do this in the generic URL class, but for these assignments, I think yes.
The URL class already resolves when updating a URL,
so this is just for a new url A.href = "/foobar";
There is no base when html is first processed, so start with an empty string,
so we don't seg fault. resolveURL does nothing in this case.
This is seen by eb$base = "" above.
When base is set, and more html is generated and parsed, the url is resolved
in html, and then again here in js.
The first time it becomes its own url, then remains so,
I don't think this is a problem, but not entirely sure.
There may be shortcuts associated with these url members.
Some websites refer to A.protocol, which has not explicitly been set.
I assume they mean A.href.protocol, the protocol of the url object.
Do we have to do this for every component of the URL object,
and for every class that has such an object?
I don't know, but here we go.
This is a loop over classes, then a loop over url components.
Leading ; averts a javascript parsing ambiguity.
*********************************************************************/

; (function() {
var cnlist = ["Anchor", "Image", "Script", "Link", "Area", "Form", "Frame"];
var ulist = ["href", "src", "src", "href", "href", "action", "src"];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i]; // class name
var u = ulist[i]; // url name
eval('Object.defineProperty(mw0.' + cn + '.prototype, "' + u + '", { get: function() { if(!this.href$2) this.href$2 = new URL; return this.href$2; }, set: function(h) { if(h instanceof URL) h = h.toString(); if(h === null || h === undefined) h = ""; var w = my$win(); if(typeof h !== "string") { alert3("hrefset " + typeof h); w.hrefset$p.push("' + cn + '"); w.hrefset$a.push(h); return; } if(!this.href$2) { this.href$2 = new mw0.URL(h ? eb$resolveURL(w.eb$base,h) : h) } else { if(!this.href$2.href$val && h) h =  eb$resolveURL(w.eb$base,h); this.href$2.href = h; } }});');
var piecelist = ["protocol", "pathname", "host", "search", "hostname", "port"];
for(var j=0; j<piecelist.length; ++j) {
var piece = piecelist[j];
eval('Object.defineProperty(mw0.' + cn + '.prototype, "' + piece + '", {get: function() { return this.href$2 ? this.href$2.' + piece + ' : null},set: function(x) { if(this.href$2) this.href$2.' + piece + ' = x; }});');
}
}
})();

/*********************************************************************
When a script runs it may call document.write. But where to put those nodes?
I think they belong under the script object, I think that's intuitive,
but most browsers put them under body,
or at least under the parent of the script object,
but always in position, as though they were right here in place of the script.
This function lifts the nodes from the script object to its parent,
in position, just after the script.
*********************************************************************/

mw0.eb$uplift = function(s)
{
var p = s.parentNode;
if(!p) return; // should never happen
var before = s.nextSibling;
while(s.firstChild)
if(before) p.insertBefore(s.firstChild, before);
else p.appendChild(s.firstChild);
}

// Canvas method draws a picture. That's meaningless for us,
// but it still has to be there.
mw0.Canvas = function() {
this.getContext = function(x) { return { addHitRegion: eb$nullfunction, arc: eb$nullfunction, arcTo: eb$nullfunction, beginPath: eb$nullfunction, bezierCurveTo: eb$nullfunction, clearHitRegions: eb$nullfunction, clearRect: eb$nullfunction, clip: eb$nullfunction, closePath: eb$nullfunction, createImageData: eb$nullfunction, createLinearGradient: eb$nullfunction, createPattern: eb$nullfunction, createRadialGradient: eb$nullfunction, drawFocusIfNeeded: eb$nullfunction, drawImage: eb$nullfunction, drawWidgetAsOnScreen: eb$nullfunction, drawWindow: eb$nullfunction, ellipse: eb$nullfunction, fill: eb$nullfunction, fillRect: eb$nullfunction, fillText: eb$nullfunction, getImageData: eb$nullfunction, getLineDash: eb$nullfunction, isPointInPath: eb$nullfunction, isPointInStroke: eb$nullfunction, lineTo: eb$nullfunction, measureText: eb$nullfunction, moveTo: eb$nullfunction, putImageData: eb$nullfunction, quadraticCurveTo: eb$nullfunction, rect: eb$nullfunction, removeHitRegion: eb$nullfunction, resetTransform: eb$nullfunction, restore: eb$nullfunction, rotate: eb$nullfunction, save: eb$nullfunction, scale: eb$nullfunction, scrollPathIntoView: eb$nullfunction, setLineDash: eb$nullfunction, setTransform: eb$nullfunction, stroke: eb$nullfunction, strokeRect: eb$nullfunction, strokeText: eb$nullfunction, transform: eb$nullfunction, translate: eb$nullfunction }};
}

/*********************************************************************
AudioContext, for playing music etc.
This one we could implement, but I'm not sure if we should.
If speech comes out of the same speakers as music, as it often does,
you might not want to hear it, you might rather see the url, or have a button
to push, and then you call up the music only if / when you want it.
Not sure what to do, so it's pretty much stubs for now.
*********************************************************************/
mw0.AudioContext = function() {
this.outputLatency = 1.0;
this.createMediaElementSource = eb$voidfunction;
this.createMediaStreamSource = eb$voidfunction;
this.createMediaStreamDestination = eb$voidfunction;
this.createMediaStreamTrackSource = eb$voidfunction;
this.suspend = eb$voidfunction;
this.close = eb$voidfunction;
}

// Document class, I don't know what to make of this,
// but my stubs for frames needs it.
mw0.Document = function(){}

mw0.CSSStyleSheet = function() {
this.cssRules = [];
}
mw0.CSSStyleSheet.prototype.insertRule = function(r, idx)
{
var list = this.cssRules;
(typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = 0));
if(idx == list.length)
list.push(r);
else
list.splice(idx, 0, r);
// There may be side effects here, I don't know.
// For now I just want the method to exist so js will march on.
}
mw0.CSSStyleSheet.prototype.addRule = function(sel, r, idx)
{
var list = this.cssRules;
(typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = list.length));
r = sel + "{" + r + "}";
if(idx == list.length)
list.push(r);
else
list.splice(idx, 0, r);
}

mw0.CSSStyleDeclaration = function(){
        this.element = null;
        this.style = this;
	 this.attributes = new mw0.NamedNodeMap;
this.attributes.owner = this;
this.sheet = new mw0.CSSStyleSheet;
};
mw0.CSSStyleDeclaration.prototype.toString = function() { return "style object"; }
mw0.CSSStyleDeclaration.prototype.getPropertyValue = function(p) {
                if (this[p] == undefined)                
                        this[p] = "";
                        return this[p];
}

mw0.getComputedStyle = function(e,pe) {
	// disregarding pseudoelements for now
var s = new CSSStyleDeclaration;
s.element = e;
eb$cssApply(e, s);
return s;
}

// insert row into a table or tbody
mw0.insertRow = function(idx) {
if(idx === undefined) idx = -1;
if(typeof idx !== "number") return null;
var t = this;
if(this.nodeName == "TABLE") {
// check for table bodies
if(t.lastChild && t.lastChild.nodeName == "TBODY")
t = t.lastChild;
}
var nrows = t.childNodes.length;
if(idx < 0) idx = nrows;
if(idx > nrows) return null;
var r = document.createElement("tr");
if(idx == nrows)
t.appendChild(r);
else
t.insertBefore(r, t.childNodes[idx]);
return r;
}
mw0.Table.prototype.insertRow = mw0.insertRow;
mw0.Tbody.prototype.insertRow = mw0.insertRow;

mw0.deleteRow = function(r) {
if(!(r instanceof mw0.Trow)) return;
this.removeChild(r);
}
mw0.Table.prototype.deleteRow = mw0.deleteRow;
mw0.Tbody.prototype.deleteRow = mw0.deleteRow;

mw0.insertCell = function(idx) {
if(idx === undefined) idx = -1;
if(typeof idx !== "number") return null;
var t = this;
var n = t.childNodes.length;
if(idx < 0) idx = n;
if(idx > n) return null;
var r = document.createElement("td");
if(idx == n)
t.appendChild(r);
else
t.insertBefore(r, t.childNodes[idx]);
return r;
}
mw0.Trow.prototype.insertCell = mw0.insertCell;

mw0.deleteCell = function(r) {
if(!(r instanceof mw0.Cell)) return;
this.removeChild(r);
}
mw0.Trow.prototype.deleteCell = mw0.deleteCell;

mw0.TextNode = function() {
this.data$2 = "";
if(arguments.length > 0) {
// data always has to be a string
this.data$2 += arguments[0];
}
this.nodeName = "#text";
this.nodeValue = this.data$2;
this.nodeType = 3;
this.ownerDocument = my$doc();
this.style = new CSSStyleDeclaration;
this.style.element = this;
this.class = "";
/* A text node chould never have children, and does not need childNodes array,
 * but there is improper html out there <text> <stuff> </text>
 * which has to put stuff under the text node, so against this
 * unlikely occurence, I have to create the array.
 * I have to treat a text node like an html node. */
this.childNodes = [];
this.attributes = new mw0.NamedNodeMap;
this.attributes.owner = this;
}

// setter insures data is always a string, because roving javascript might
// node.data = 7;  ...  if(node.data.match(/x/) ...
// and boom! It blows up because Number doesn't have a match function.
Object.defineProperty(mw0.TextNode.prototype, "data", {
get: function() { return this.data$2; },
set: function(s) { this.data$2 = s + ""; }});

mw0.createTextNode = function(t) {
if(t == undefined) t = "";
var c = new TextNode(t);
eb$logElement(c, "text");
return c;
}

// The Option class, these are choices in a dropdown list.
mw0.Option = function() {
this.nodeName = "OPTION";
this.text = this.value = "";
if(arguments.length > 0)
this.text = arguments[0];
if(arguments.length > 1)
this.value = arguments[1];
this.selected = false;
this.defaultSelected = false;
}

// implementation of getElementsByTagName, getElementsByName, and getElementsByClassName.
// These are recursive as they descend through the tree of nodes.

mw0.getElementsByTagName = function(s) { 
s = s.toLowerCase();
return mw0.eb$gebtn(this, s);
}

mw0.eb$gebtn = function(top, s) { 
var a = [];
if(s === '*' || (top.nodeName && top.nodeName.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
// don't descend into another frame.
// Look for iframe.document.html, meaning the frame is expanded.
if(!(top instanceof Frame) || !top.firstChild.firstChild)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(mw0.eb$gebtn(c, s));
}
}
return a;
}

mw0.getElementsByName = function(s) { 
s = s.toLowerCase();
return mw0.eb$gebn(this, s);
}

mw0.eb$gebn = function(top, s) { 
var a = [];
if(s === '*' || (top.name && top.name.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
if(!(top instanceof Frame) || !top.firstChild.firstChild)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(mw0.eb$gebn(c, s));
}
}
return a;
}

mw0.getElementsByClassName = function(s) { 
s = s.toLowerCase();
return mw0.eb$gebcn(this, s);
}

mw0.eb$gebcn = function(top, s) { 
var a = [];
if(s === '*' || (top.class && top.class.toLowerCase() === s))
a.push(top);
if(top.childNodes) {
if(!(top instanceof Frame) || !top.firstChild.firstChild)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(mw0.eb$gebcn(c, s));
}
}
return a;
}

/*********************************************************************
Here comes a bunch of stuff regarding the childNodes array,
holding the children under a given html node.
The functions eb$apch1 and eb$apch2 are native. They perform appendChild in js.
The first has no side effects, because the linkage was already performed
within edbrowse via html, and a linkage side effect would only confuse things.
The second, eb$apch2, has side effects, as js code calls appendChild
and those links have to pass back to edbrowse.
But, the wrapper function appendChild makes another check;
if the child is already linked into the tree, then we have to unlink it first,
before we put it somewhere else.
This is a call to removeChild, also native, which unlinks in js,
and passses the remove side effect back to edbrowse.
The same reasoning holds for insertBefore.
These functions also check for a hierarchy error using isabove().
In fact we may as well throw the exception here.
*********************************************************************/

mw0.isabove = function(a, b)
{
var j = 0;
while(b) {
if(b == a) { e = new Error; e.HIERARCHY_REQUEST_ERR = e.code = 3; throw e; }
if(++j == 1000) { alert3("isabove loop"); break; }
b = b.parentNode;
}
}

mw0.appendChild = function(c) {
mw0.isabove(c, this);
if(c.parentNode) c.parentNode.removeChild(c);
return this.eb$apch2(c);
}

mw0.prependChild = function(c) {
mw0.isabove(c, this);
if(this.childNodes.length) this.insertBefore(c, this.childNodes[0]);
else this.appendChild(c);
}

mw0.insertBefore = function(c, t) {
mw0.isabove(c, this);
if(c.parentNode) c.parentNode.removeChild(c);
return this.eb$insbf(c, t);
}

mw0.replaceChild = function(newc, oldc) {
var lastentry;
var l = this.childNodes.length;
var nextinline;
for(var i=0; i<l; ++i) {
if(this.childNodes[i] != oldc)
continue;
if(i == l-1)
lastentry = true;
else {
lastentry = false;
nextinline = this.childNodes[i+1];
}
this.removeChild(oldc);
if(lastentry)
this.appendChild(newc);
else
this.insertBefore(newc, nextinline);
break;
}
}

mw0.hasChildNodes = function() { return (this.childNodes.length > 0); }

mw0.eb$getSibling = function (obj,direction)
{
if (typeof obj.parentNode === 'undefined') {
// need calling node to have parent and it doesn't, error
return null;
}
var pn = obj.parentNode;
var j, l;
l = pn.childNodes.length;
for (j=0; j<l; ++j)
if (pn.childNodes[j] == obj) break;
if (j == l) {
// child not found under parent, error
return null;
}
switch(direction) {
case "previous":
return (j > 0 ? pn.childNodes[j-1] : null);
break;
case "next":
return (j < l-1 ? pn.childNodes[j+1] : null);
break;
default:
// the function should always have been called with either 'previous' or 'next' specified
return null;
}
}

// The Attr class and getAttributeNode().
mw0.Attr = function(){ this.specified = false; this.owner = null; this.name = ""; }

Object.defineProperty(mw0.Attr.prototype, "value", {
get: function() { return this.owner[this.name]; },
set: function(v) {
this.owner.setAttribute(this.name, v);
this.specified = true;
return;
}});

mw0.Attr.prototype.isId = function() { return this.name === "id"; }

// this is sort of an array and sort of not
mw0.NamedNodeMap = function() { this.length = 0; }
mw0.NamedNodeMap.prototype.push = function(s) { this[this.length++] = s; }
mw0.NamedNodeMap.prototype.item = function(n) { return this[n]; }
mw0.NamedNodeMap.prototype.getNamedItem = function(name) { return this[name.toLowerCase()]; }
mw0.NamedNodeMap.prototype.setNamedItem = function(name, v) { this.owner.setAttribute(name, v);}
mw0.NamedNodeMap.prototype.removeNamedItem = function(name) { this.owner.removeAttribute(name);}

/*********************************************************************
Set and clear attributes. This is done in 3 different ways,
the third using attributes as a NamedNodeMap.
This may be overkill - I don't know.
*********************************************************************/

mw0.getAttribute = function(name) { var v = this[name.toLowerCase()]; return typeof(v) == "undefined" ? null : v; }
mw0.hasAttribute = function(name) { if (this[name.toLowerCase()]) return true; else return false; }
mw0.setAttribute = function(name, v) { 
var n = name.toLowerCase();
this[n] = v; 
if(this.attributes[n]) return;
var a = new Attr();
a.owner = this;
a.name = n;
a.specified = true;
// don't have to set value because there is a getter that grabs value
// from the html node, see Attr class.
this.attributes.push(a);
// easy hash access
this.attributes[n] = a;
}
mw0.removeAttribute = function(name) {
    var n = name.toLowerCase();
    if (this[n]) delete this[n];
var a = this.attributes[n]; // hash access
if(!a) return;
// Have to roll our own splice.
var found = false;
for(var i=0; i<this.attributes.length-1; ++i) {
if(!found && this.attributes[i] == a) found = true;
if(found) this.attributes[i] = this.attributes[i+1];
}
this.attributes.length--;
delete this.attributes[n];
}

mw0.getAttributeNode = function(name) {
    var n = name.toLowerCase();
// this returns null if no such attribute, is that right,
// or should we return a new Attr node with no value?
return this.attributes[n] ? this.attributes[n] : null;
/*
a = new Attr;
a.owner = this;
a.name = n;
return a;
*/
}

/*********************************************************************
This creates a copy of the node and its children recursively.
The argument 'deep' refers to whether or not the clone will recurs.
eb$clone is a helper function that is not tied to any particular prototype.
It's frickin complicated, so set cloneDebug to debug it.
*********************************************************************/

mw0.eb$clone = function(node1,deep)
{
var node2;
var i, j;
var kids = null;
var debug = my$win().cloneDebug;

// WARNING: don't use instanceof Array here.
// See the comments in the Array.prototype section.
if(Array.isArray(node1.childNodes))
kids = node1.childNodes;

// We should always be cloning a node.
if(debug) alert3("clone " + node1.nodeName + " {");
if(debug) {
if(kids) alert3("kids " + kids.length);
else alert3("no kids, type " + typeof node1.childNodes);
}

// special case for array, which is a select node or a list of radio buttons.
if(Array.isArray(node1)) {
node2 = [];
node2.childNodes = node2;
if(deep) {
if(debug) alert3("self children length " + node1.length);
for(i = 0; i < node1.length; ++i)
node2.push(mw0.eb$clone(node1[i], true));
}
} else {

node2 = mw0.createElement(node1.nodeName);
if (deep && kids) {
for(i = 0; i < kids.length; ++i) {
var current_item = kids[i];
node2.appendChild(mw0.eb$clone(current_item,true));
}
}
}

var lostElements = false;

// now for strings and functions and stuff.
for (var item in node1) {
// don't copy the things that come from prototype
if(!node1.hasOwnProperty(item)) continue;

// children already handled
if(item === "childNodes" || item === "parentNode") continue;

if (typeof node1[item] === 'function') {
if(debug) alert3("copy function " + item);
node2[item] = node1[item];
continue;
}

if(node1[item] === node1) {
if(debug) alert3("selflink through " + item);
node2[item] = node2;
continue;
}

// An array of event handlers etc.
if(Array.isArray(node1[item])) {
node2[item] = [];

/*********************************************************************
Ok we need some special code here for form.elements,
an array of input nodes within the form.
We are preserving links, rather like tar or cpio.
The same must be done for an array of rows beneath <table>,
or an array of cells in a row, and perhaps others.
*********************************************************************/

if(item === "elements" && node1.nodeName === "FORM" ||
item === "rows" && (node1.nodeName === "TABLE" || node1.nodeName === "TBODY") ||
item === "cells" && node1.nodeName === "TR") {
if(debug) alert3("linking " + node1.nodeName + "." + item + " with " + node1[item].length + " members");
for(i = 0; i < node1[item].length; ++i) {
var p = mw0.findObject(node1, node1[item][i], "");
if(p.length) {
node2[item].push(mw0.correspondingObject(node2, p));
} else {
node2[item].push(null);
if(debug) alert3("oops, member " + i + " not linked");
if(item === "elements") lostElements = true;
}
}
continue;
}

// special code here for an array of radio buttons within a form.
if(node1.nodeName === "FORM" && node1[item].nodeName === "RADIO") {
var a1 = node1[item];
var a2 = node2[item];
if(debug) alert3("linking form.radio " + item + " with " + a1.length + " buttons");
a2.type = a1.type;
a2.nodeName = a1.nodeName;
a2.class = a1.class;
a2.last$class = a1.last$class;
a2.nodeValue = a1.nodeValue;
for(i = 0; i < a1.length; ++i) {
var p = mw0.findObject(node1, a1[i], "");
if(p.length) {
a2.push(mw0.correspondingObject(node2, p));
} else {
a2.push(null);
if(debug) alert3("oops, button " + i + " not linked");
}
}
continue;
}

// We could link from a form through a name
// to an array of options.  <select name = color>
// I'll test for a self-link to options.
if(node1[item].options && node1[item].options === node1[item]) {
; // don't do anything
} else {
// It's a regular array.
if(debug) alert3("copy array " + item + " with " + node1[item].length + " members");
node2[item] = [];
for(i = 0; i < node1[item].length; ++i) {
node2[item].push(node1[item][i]);
}
continue;
}
}

if(typeof node1[item] === "object") {
// An object, not an array.

if(item === "style") continue; // handled later
if(item === "attributes") continue; // handled later
if(item === "ownerDocument") continue; // handled by createElement
if(item.match(/^\d+$/)) continue; // option index in a select array

// Check for URL objects.
if(node1[item] instanceof URL) {
var u = node1[item];
if(debug) alert3("copy URL " + item);
node2[item] = new URL(u.href);
continue;
}

// Look for a link from A to B within the tree of nodes,
// A.foo = B, and try to preserve that link in the new tree, A1.foo = B1,
// rather like tar or cpio preserving hard links.
var p = mw0.findObject(node1, node1[item], "");
if(p.length) {
if(debug) alert3("link " + item + " " + p.substr(1));
node2[item] = mw0.correspondingObject(node2, p);
} else {
// I don't think we should point to a generic object that we don't know anything about.
if(debug) alert3("unknown object " + item);
}
continue;
}

if (typeof node1[item] === 'string') {
// don't copy strings that are really setters; we'll be copying inner$html
// as a true string so won't need to copy innerHTML, and shouldn't.
if(item == "innerHTML")
continue;
if(item == "innerText")
continue;
if(item == "value" &&
!Array.isArray(node1) && !(node1 instanceof Option))
continue;
if(debug) {
var showstring = node1[item];
if(showstring.length > 20) showstring = "long";
alert3("copy string " + item + " = " + showstring);
}
node2[item] = node1[item];
continue;
}

if (typeof node1[item] === 'number') {
if(debug) alert3("copy number " + item + " = " + node1[item]);
node2[item] = node1[item];
continue;
}

if (typeof node1[item] === 'boolean') {
if(debug) alert3("copy boolean " + item + " = " + node1[item]);
node2[item] = node1[item];
continue;
}
}

// copy style object if present and its subordinate strings.
if (node1.style instanceof CSSStyleDeclaration) {
if(debug) alert3("copy style");
node2.style = new CSSStyleDeclaration;
node2.style.element = node2;
for (var item in node1.style){
if (typeof node1.style[item] === 'string' ||
typeof node1.style[item] === 'number') {
if(debug) alert3("copy stattr " + item);
node2.style[item] = node1.style[item];
}
}
}

if (node1.attributes instanceof NamedNodeMap) {
if(debug) alert3("copy attributes");
node2.attributes = new NamedNodeMap;
node2.attributes.owner = node2;
for(var l=0; l<node1.attributes.length; ++l) {
if(debug) alert3("copy attribute " + node1.attributes[l].name);
node2.setAttribute(node1.attributes[l].name, node1.attributes[l].value);
}
}

// This is an ugly patch for radio button arrays that don't get linked into the elements array.
if(lostElements) {
var e1 = node1.elements;
var e2 = node2.elements;
if(debug) alert3("looking for lost radio elements");
for(i=0; i<e2.length; ++i) {
if(e2[i]) continue;
if(e1[i].nodeName !== "RADIO") {
if(debug) alert3("oops, lost element " + i + " is type " + e1[i].nodeName);
continue;
}
for (var item in node1) {
if(!node1.hasOwnProperty(item)) continue;
if(node1[item] !== e1[i]) continue;
e2[i] = node2[item];
if(debug) alert3("patching element " + i + " through to " + item);
break;
}
}
}

if(debug) alert3("}");
return node2;
}

mw0.cloneNode = function(deep) {
return mw0.eb$clone (this,deep);
}

// Look recursively down the tree for an object.
// This is a helper function for cloneNode.
mw0.findObject = function(top, obj, path) {
if(!Array.isArray(top.childNodes))
return "";
var kids = top.childNodes;
for(var i=0; i<kids.length; ++i) {
var c = kids[i];
var p = path + "," + i;
if(c === obj) return p; // found it!
var r = mw0.findObject(c, obj, p);
if(r.length) return r;
}
return "";
}

// The inverse of the above.
mw0.correspondingObject = function(top, p) {
var c = top;
while(p.length) {
p = p.substr(1);
c = c.childNodes[parseInt(p.replace(/,.*/, ""))];
p = p.replace(/^\d+/, "");
}
return c;
}

/*********************************************************************
importNode seems to be the same as cloneNode, except it is copying a tree
of objects from another context into the current context.
But this is how duktape works by default.
foo.s = cloneNode(bar.s);
If bar is in another context that's ok, we read those objects and create
copies of them in the current context.
*********************************************************************/

mw0.importNode = function(src, deep) { return src.cloneNode(deep); }

/*********************************************************************
compareDocumentPosition:
The documentation I found was entirely unclear as to the meaning
of preceding and following.
Does A precede B if it appears first in a depth first search of the tree,
or if it appears first wherein they have the same parent,
or if they are siblings?
I have no clue, so I'm going for the latter, partly because it's easy.
That means the relationships are disjoint.
A can't contain B and precede B simultaneously.
So I don't know why they say these are bits in a bitmask.
*********************************************************************/

mw0.compareDocumentPosition = function(w)
{
if(this === w) return DOCUMENT_POSITION_DISCONNECTED;
if(this.parentNode === w.parentNode) {
if(this.nextSibling === w) return DOCUMENT_POSITION_FOLLOWING;
if(this.previousSibling === w) return DOCUMENT_POSITION_PRECEDING;
return DOCUMENT_POSITION_DISCONNECTED;
}
var t = this;
while(t.parentNode) {
t = t.parentNode;
if(t === w) return DOCUMENT_POSITION_CONTAINED_BY;
}
var t = w;
while(t.parentNode) {
t = t.parentNode;
if(t === this) return DOCUMENT_POSITION_CONTAINS;
}
return DOCUMENT_POSITION_DISCONNECTED;
}

// classList
// First the functions that will hang off the array to be returned.
mw0.classListRemove = function() {
for(var i=0; i<arguments.length; ++i) {
for(var j=0; j<this.length; ++j) {
if(arguments[i] != this[j]) continue;
this.splice(j, 1);
--j;
}
}
this.node.class = this.join(' ');
}

mw0.classList = function(node) {
var c = node.class;
if(!c) c = "";
// turn string into array
var a = c.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
// remember the node you came from
a.node = node;
// attach functions
a.remove = mw0.classListRemove;
return a;
}

// The Event class and various handlers.
mw0.Event = function(options){
    // event state is kept read-only by forcing
    // a new object for each event.  This may not
    // be appropriate in the long run and we'll
    // have to decide if we simply dont adhere to
    // the read-only restriction of the specification
    this.bubbles = true;
    this.cancelable = true;
    this.cancelled = false;
    this.currentTarget = null;
    this.target = null;
    this.eventPhase = Event.AT_TARGET;
    this.timeStamp = new Date().getTime();
};

mw0.Event.prototype.preventDefault = function(){
      this.preventDefault = true;
}

mw0.Event.prototype.stopPropagation = function(){
        if(this.cancelable){
            this.cancelled = true;
            this.bubbles = false;
        }
    }

// deprecated!
mw0.Event.prototype.initEvent = function(t, bubbles, cancel) {
this.type = t, this.bubbles = bubbles, this.cancelable = cancel; }

mw0.Event.prototype.initCustomEvent = function(t, bubbles, cancel, details) {
// don't know what to do with details.
this.initEvent(t, bubbles, cancel); }

mw0.createEvent = function(unused) { return new Event; }

mw0.dispatchEvent = function (e) {
if(my$win().eventDebug) alert3("dispatch " + this.nodeName + "." + e.type);
var eval_string = "try { this['" + e.type + "']()} catch (e) {alert3('event not found')}";
eval(eval_string);
};

/*********************************************************************
This is our addEventListener function.
It is bound to window, which is ok because window has such a function
to listen to load and unload.
Later on we will bind it to document and to other nodes via
class.prototype.addEventListener = addEventListener,
to cover all the instantiated objects in one go.
first arg is a string like click, second arg is a js handler,
Third arg is not used cause I don't understand it.
It calls a lower level function to do the work, which is also called by
attachEvent, as these are almost exactly the same functions.
A similar design applies for removeEventListener and detachEvent.
However, attachEvent is deprecated, and disabled by default.
This is frickin complicated, so set eventDebug to debug it.
*********************************************************************/

mw0.attachOn = false;

mw0.addEventListener = function(ev, handler, notused) { this.eb$listen(ev,handler, true); }
mw0.removeEventListener = function(ev, handler, notused) { this.eb$unlisten(ev,handler, true); }
if(mw0.attachOn) {
mw0.attachEvent = function(ev, handler) { this.eb$listen(ev,handler, false); }
mw0.detachEvent = function(ev, handler) { this.eb$unlisten(ev,handler, false); }
}

mw0.eb$listen = function(ev, handler, addon)
{
var ev_before_changes = ev;
if(my$win().eventDebug)  alert3((addon ? "listen " : "attach ") + this.nodeName + "." + ev);
if(addon) {
ev = "on" + ev;
} else {
// for attachEvent, if onclick is passed in, you are actually listening for 'click'
ev = ev.replace(/^on/, "");
}

var evarray = ev + "$$array"; // array of handlers
var evorig = ev + "$$orig"; // original handler from html
if(!this[evarray]) {
/* attaching the first handler */
var a = [];
/* was there already a function from before? */
if(this[ev]) {
this[evorig] = this[ev];
this[ev] = undefined;
}
this[evarray] = a;
eval(
'this["' + ev + '"] = function(){ var a = this["' + evarray + '"]; var rc; if(this["' + evorig + '"]) { rc = this["' + evorig + '"](); if(!rc) return false; } for(var i = 0; i<a.length; ++i) a[i].did$run = false; for(var i = 0; i<a.length; ++i) {if(a[i].did$run) continue; a[i].did$run = true; var tempEvent = new Event; tempEvent.type = "' + ev_before_changes + '"; rc = a[i](tempEvent); if(!rc) return false; i = -1; } return true; };');
}
this[evarray].push(handler);
}

// here is unlisten, the opposite of listen.
// what if every handler is removed and there is an empty array?
// the assumption is that this is not a problem.
mw0.eb$unlisten = function(ev, handler, addon)
{
var ev_before_changes = ev;
if(my$win().eventDebug)  alert3((addon ? "unlisten " : "detach ") + this.nodeName + "." + ev);
if(addon) {
ev = "on" + ev;
} else {
ev = ev.replace(/^on/, "");
}

var evarray = ev + "$$array"; // array of handlers
var evorig = ev + "$$orig"; // original handler from html
// remove original html handler after other events have been added.
if(this[evorig] == handler) {
delete this[evorig];
return;
}
// remove original html handler when no other events have been added.
if(this[ev] == handler) {
delete this[ev];
return;
}
// If other events have been added, check through the array.
if(this[evarray]) {
var a = this[evarray]; // shorthand
for(var i = 0; i<a.length; ++i)
if(a[i] == handler) {
a.splice(i, 1);
return;
}
}
}

/*********************************************************************
Add prototype methods to the standard nodes, nodes that have children,
and the normal set of methods to go with those children.
Form has children for sure, but if we add <input> to Form,
we also have to add it to the array Form.elements.
So there are some nodes that we have to do outside this loop.
Again, leading ; to avert a parsing ambiguity.
*********************************************************************/

; (function() {
var cnlist = ["HTML", "HtmlObj", "Head", "Title", "Body", "CSSStyleDeclaration", "Frame",
"Anchor", "Element","HTMLElement", "Lister", "Listitem", "Tbody", "Table", "Div",
"Form", "Span", "Trow", "Cell", "P", "Script", "Header", "Footer",
// The following nodes shouldn't have any children, but the various
// children methods could be called on them anyways.
// And getAttribute applies to just about everything.
"Node", "Area", "TextNode", "Image", "Option", "Link", "Meta", "Audio", "Canvas"];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i];
var c = mw0[cn];
// c is class and cn is classname.
// get elements below
c.prototype.getElementsByTagName = mw0.getElementsByTagName;
c.prototype.getElementsByName = mw0.getElementsByName;
c.prototype.getElementsByClassName = mw0.getElementsByClassName;
c.prototype.querySelectorAll = querySelectorAll;
c.prototype.querySelector = querySelector;
// children
c.prototype.hasChildNodes = mw0.hasChildNodes;
c.prototype.appendChild = mw0.appendChild;
c.prototype.prependChild = mw0.prependChild;
c.prototype.insertBefore = mw0.insertBefore;
c.prototype.replaceChild = mw0.replaceChild;
// These are native, so it's ok to bounce off of document.
c.prototype.eb$apch1 = document.eb$apch1;
c.prototype.eb$apch2 = document.eb$apch2;
c.prototype.eb$insbf = document.eb$insbf;
c.prototype.removeChild = document.removeChild;
Object.defineProperty(c.prototype, "firstChild", { get: function() { return this.childNodes[0]; } });
Object.defineProperty(c.prototype, "lastChild", { get: function() { return this.childNodes[this.childNodes.length-1]; } });
Object.defineProperty(c.prototype, "nextSibling", { get: function() { return mw0.eb$getSibling(this,"next"); } });
Object.defineProperty(c.prototype, "previousSibling", { get: function() { return mw0.eb$getSibling(this,"previous"); } });
// attributes
c.prototype.hasAttribute = mw0.hasAttribute;
c.prototype.getAttribute = mw0.getAttribute;
c.prototype.setAttribute = mw0.setAttribute;
c.prototype.removeAttribute = mw0.removeAttribute;
Object.defineProperty(c.prototype, "className", { get: function() { return this.getAttribute("class"); }, set: function(h) { this.setAttribute("class", h); }});
c.prototype.getAttributeNode = mw0.getAttributeNode;
// clone
c.prototype.cloneNode = mw0.cloneNode;
c.prototype.importNode = mw0.importNode;
c.prototype.compareDocumentPosition = mw0.compareDocumentPosition;
// visual
c.prototype.focus = focus;
c.prototype.blur = blur;
// events
c.prototype.eb$listen = mw0.eb$listen;
c.prototype.eb$unlisten = mw0.eb$unlisten;
c.prototype.addEventListener = mw0.addEventListener;
c.prototype.removeEventListener = mw0.removeEventListener;
if(mw0.attachOn) {
c.prototype.attachEvent = mw0.attachEvent;
c.prototype.detachEvent = mw0.detachEvent;
}
c.prototype.dispatchEvent = mw0.dispatchEvent;
// constants
c.prototype.ELEMENT_NODE = 1, c.prototype.TEXT_NODE = 3, c.prototype.COMMENT_NODE = 8, c.prototype.DOCUMENT_NODE = 9, c.prototype.DOCUMENT_TYPE_NODE = 10, c.prototype.DOCUMENT_FRAGMENT_NODE = 11;
Object.defineProperty(c.prototype, "classList", { get : function() { return mw0.classList(this);}});
}
})();

// nodes that we don't want to add children to, even if asked to do so.
; (function() {
var cnlist = ["HtmlObj", "Title", "Script",
"Node", "Area", "TextNode", "Image", "Option", "Link", "Meta", "Audio", "Canvas"];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i];
var c = mw0[cn];
eval('c.prototype.appendChild = function() { alert3("adding children to ' + cn + '");}');
eval('c.prototype.prependChild = function() { alert3("adding children to ' + cn + '");}');
}
})();

/*********************************************************************
As promised, Form is weird.
If you add an input to a form, it adds under childNodes in the usual way,
but also must add in the elements[] array.
Same for insertBefore and removeChild.
When adding an input element to a form,
linnk form[element.name] to that element.
*********************************************************************/

mw0.eb$formname = function(parent, child)
{
var s;
if(typeof child.name === "string")
s = child.name;
else if(typeof child.id === "string")
s = child.id;
else return;
// Is it ok if name is "action"? I'll assume it is,
// but then there is no way to submit the form. Oh well.
parent[s] = child;
}

mw0.Form.prototype.appendChildNative = mw0.appendChild;
mw0.Form.prototype.appendChild = function(newobj) {
this.appendChildNative(newobj);
if(newobj.nodeName === "INPUT" || newobj.nodeName === "SELECT") {
this.elements.push(newobj);
mw0.eb$formname(this, newobj);
}
}
mw0.Form.prototype.insertBeforeNative = mw0.insertBefore;
mw0.Form.prototype.insertBefore = function(newobj, item) {
this.insertBeforeNative(newobj, item);
if(newobj.nodeName === "INPUT" || newobj.nodeName === "SELECT") {
for(var i=0; i<this.elements.length; ++i)
if(this.elements[i] == item) {
this.elements.splice(i, 0, newobj);
break;
}
mw0.eb$formname(this, newobj);
}
}
mw0.Form.prototype.removeChildNative = document.removeChild;
mw0.Form.prototype.removeChild = function(item) {
this.removeChildNative(item);
if(item.nodeName === "INPUT" || item.nodeName === "SELECT")
for(var i=0; i<this.elements.length; ++i)
if(this.elements[i] == item) {
this.elements.splice(i, 1);
break;
}
return item;
}

mw0.createElementNS = function(nsurl,s) {
var u = mw0.createElement(s);
u.namespaceURI = new mw0.URL(nsurl);
return u;
}

mw0.createElement = function(s) { 
var c;
var t = s.toLowerCase();
if(!t.match(/^[a-z\d_]+$/)) {
alert3("createElement argument " + t);
// acid3 says we should throw an exception if string contains null,
// but what about bogus strings. www.oranges.com sends us some very
// strange strings that I don't know what to do with.
if(t.match(/\0/)) { e = new Error; e.code = 5; throw e; }
t = "xyz";
}
switch(t) { 
case "body":
c = new Body;
break;
case "object":
c = new HtmlObj;
break;
case "a":
c = new Anchor;
break;
case "image":
t = "img";
case "img":
c = new Image;
break;
case "link":
c = new Link;
break;
case "cssstyledeclaration":
case "style":
c = new CSSStyleDeclaration;
break;
case "script":
c = new Script;
break;
case "div":
c = new Div;
break;
case "p":
c = new P;
break;
case "header":
c = new Header;
break;
case "footer":
c = new Footer;
break;
case "table":
c = new Table;
break;
case "tbody":
c = new Tbody;
break;
case "tr":
c = new Trow;
break;
case "td":
c = new Cell;
break;
case "canvas":
c = new Canvas;
break;
case "audio":
c = new Audio;
break;
case "document":
c = new Document;
break;
case "iframe":
case "frame":
c = new Frame;
break;
case "select":
/* select and radio are special form elements in that they are intrinsically
 * arrays, with all the options as array elements,
 * and also "options" or "childNodes" linked to itself
 * so it looks like it has children in the usual way. */
c = [];
c.nodeName = c.tagName = t.toUpperCase();
c.options = c;
c.childNodes = c;
c.style = new CSSStyleDeclaration;
c.selectedIndex = -1;
c.value = "";
eb$logElement(c, t);
return c;
case "option":
c = new Option;
c.nodeName = c.tagName = "OPTION";
c.childNodes = [];
// we don't log options because rebuildSelectors() checks
// the dropdown lists after every js run.
return c;
default:
/* eb$puts("createElement default " + s); */
c = new Span;
}

/* ok, for some element types this perhaps doesn't make sense,
* but for most visible ones it does and I doubt it matters much */
if(c instanceof CSSStyleDeclaration) {
c.element = c;
} else {
c.style = new CSSStyleDeclaration;
c.style.element = c;
}
c.childNodes = [];
c.attributes = new NamedNodeMap;
c.attributes.owner = c;
c.nodeName = c.tagName = t.toUpperCase();
c.nodeType = 1;
if(t == "document")
c.nodeType = 9;
c.nodeValue = undefined;
c.class = "";
c.ownerDocument = my$doc();
eb$logElement(c, t);

if(c instanceof Frame) {
var d = mw0.createElement("document");
c.content$Document = c.content$Window = d;
Object.defineProperty(c, "contentDocument", { get: eb$getter_cd });
Object.defineProperty(c, "contentWindow", { get: eb$getter_cw });
c.appendChild(d);
}

return c;
} 

mw0.createDocumentFragment = function() {
var c = mw0.createElement("fragment");
c.nodeType = 11;
return c;
}

mw0.createComment = function() {
var c = mw0.createElement("comment");
c.nodeType = 8;
return c;
}

mw0.implementation = {
/*********************************************************************
This is my tentative implementation of hasFeature:
hasFeature: function(mod, v) {
// tidy claims html5 so we'll run with that
var supported = { "html": "5", "Core": "?", "XML": "?"};
if(!supported[mod]) return false;
if(v == undefined) return true; // no version specified
return (v <= supported[mod]);
},
But this page says we're moving to a world where this function is always true,
https://developer.mozilla.org/en-US/docs/Web/API/Document/implementation
so I don't know what the point is.
*********************************************************************/
hasFeature: eb$truefunction,
createDocumentType: function(tag, pubid, sysid) {
// I really don't know what this function is suppose to do.
var tagstrip = tag.replace(/:.*/, "");
return mw0.createElement(tagstrip);
},
// https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createHTMLDocument
createHTMLDocument: function(t) {
if(t == undefined) t = "Empty"; // the title
// put it in a paragraph, just cause we have to put it somewhere.
var p = mw0.createElement("p");
p.innerHTML = "<iframe></iframe>";
var d = p.firstChild; // this is the created document
// This reference will expand the document via the setter.
d.contentDocument.title = t;
return d.contentDocument;
}
};

// @author Originally implemented by Yehuda Katz
// And since then, from envjs, by Thatcher et al

mw0.XMLHttpRequest = function(){
    this.headers = {};
    this.responseHeaders = {};
    this.aborted = false;//non-standard
};

// defined by the standard: http://www.w3.org/TR/XMLHttpRequest/#xmlhttprequest
// but not provided by Firefox.  Safari and others do define it.
mw0.XMLHttpRequest.UNSENT = 0;
mw0.XMLHttpRequest.OPEN = 1;
mw0.XMLHttpRequest.HEADERS_RECEIVED = 2;
mw0.XMLHttpRequest.LOADING = 3;
mw0.XMLHttpRequest.DONE = 4;

mw0.XMLHttpRequest.prototype = {
open: function(method, url, async, user, password){
this.readyState = 1;
this.async = false;
// Note: async is currently hardcoded to false
// In the implementation in envjs, the line here was:
// this.async = (async === false)?false:true;
this.method = method || "GET";
this.url = eb$resolveURL(my$win().eb$base, url);
this.status = 0;
this.statusText = "";
// When the major libraries are used, they overload XHR left and right.
// Some versions use onreadystatechange.  This has been replaced by onload in,
// for instance, newer versions of jquery.  It can cause problems to call the
// one that is not being used at that moment, so my remedy here is to attempt
// both of them inside of a try-catch
try { this.onreadystatechange(); } catch (e) { }
try { this.onload(); } catch (e) {}
},
setRequestHeader: function(header, value){
this.headers[header] = value;
},
send: function(data, parsedoc/*non-standard*/){
var headerstring = "";
for (var item in this.headers) {
var v1=item;
var v2=this.headers[item];
headerstring+=v1;
headerstring+=": ";
headerstring+=v2;
headerstring+=",";
}
var entire_http_response =  eb$fetchHTTP(this.url,this.method,headerstring,data);
var responsebody_array = entire_http_response.split("\r\n\r\n");
var http_headers = responsebody_array[0];
responsebody_array[0] = "";
var responsebody = responsebody_array.join("\r\n\r\n");
responsebody = responsebody.trim();
this.responseText = responsebody;
var hhc = http_headers.split("\r\n");
var i=0;
while (i < hhc.length) {
var value1 = hhc[i]+":";
var value2 = value1.split(":")[0];
var value3 = value1.split(":")[1];
this.responseHeaders[value2] = value3.trim();
i++;
}

try{
this.readyState = 4;
}catch(e){
}

if ((!this.aborted) && this.responseText.length > 0){
this.readyState = 4;
this.status = 200;
this.statusText = "OK";
// When the major libraries are used, they overload XHR left and right.
// Some versions use onreadystatechange.  This has been replaced by onload in,
// for instance, newer versions of jquery.  It can cause problems to call the
// one that is not being used at that moment, so my remedy here is to attempt
// both of them inside of a try-catch
try { this.onreadystatechange(); } catch (e) { }
try { this.onload(); } catch (e) {}
}

},
abort: function(){
this.aborted = true;
},
onreadystatechange: function(){
//Instance specific
},
onload: function(){
},
getResponseHeader: function(header){
var rHeader, returnedHeaders;
if (this.readyState < 3){
throw new Error("INVALID_STATE_ERR");
} else {
returnedHeaders = [];
for (rHeader in this.responseHeaders) {
if (rHeader.match(new RegExp(header, "i"))) {
returnedHeaders.push(this.responseHeaders[rHeader]);
}
}

if (returnedHeaders.length){
return returnedHeaders.join(", ");
}
}
return null;
},
getAllResponseHeaders: function(){
var header, returnedHeaders = [];
if (this.readyState < 3){
throw new Error("INVALID_STATE_ERR");
} else {
for (header in this.responseHeaders) {
returnedHeaders.push( header + ": " + this.responseHeaders[header] );
}
}
return returnedHeaders.join("\r\n");
},
async: false,
readyState: 0,
responseText: "",
status: 0,
statusText: ""
};

// Deminimize javascript for debugging purposes.
// Then the line numbers in the error messages actually mean something.
// This is only called when debugging is on. Users won't invoke this machinery.
// Argument is the script object.
// escodegen.generate and esprima.parse are found in third.js.
mw0.eb$demin = function(s)
{
if(! s instanceof Script) return;
if(s.demin) return; // already expanded
s.demin = true;
s.expanded = false;
if(! s.data) return;

// Don't deminimize if short, or if average line length is less than 1000.
if(s.data.length < 1000) return;
var i, linecount = 1;
for(i=0; i<s.data.length; ++i)
if(s.data.substr(i,1) === '\n') ++linecount;
if(s.data.length / linecount <= 1000) return;

// Ok, run it through the deminimizer.
s.original = s.data;
s.data = escodegen.generate(esprima.parse(s.data));
s.expanded = true;
}

// Watch for an undefined variable in the running javascript.
// If it tries to call foo.getAttribute() or some such,
// push foo and a sequence number onto the $uv stack.
// trace is a reserved word that traces the code with alert3.
mw0.eb$watch = function(s)
{
if(! s instanceof Script) return;
if(! s.data) return;
var w = my$win();
var v = w.$uv$watch;
if(!v) return; // should never happen

if(v == "trace") {
if(w.$jt$c == 'z') w.$jt$c = 'a';
else w.$jt$c = String.fromCharCode(w.$jt$c.charCodeAt(0) + 1);
w.$jt$sn = 0;
s.data = s.data.replace(/(\n *)(var )/g, mw0.jtfn2);
return;
}

// Build the regular expression with v folded in.
// It's a string, so every \ has to be doubled.
var c1 = "[\\w.]+";
var c2 = "[\\w.]*";
var rs = "(" + c1 + "|" + c1 + "\\[" + c1 + "\\]" + c2 + "|" + c1 + "\\[" + c1 + "\\]" +  c2 + "\\[" + c1 + "\\]" + c2 + ")\\." + v + " *([(.\\[])";
var r = RegExp(rs, "g");
// functio nfor the right hand side
function rhs(all, pre, post) {
var w = my$win();
var sn = w.$uv$sn;
++sn;
w.$uv$sn = sn;
return "((" + pre + "." + v + "||mw0.eb$watch2(" + pre + "," + sn + "))," + pre +")." + v + post;
}
s.data = s.data.replace(r, rhs); // boom!
}

mw0.eb$watch2 = function(p, sn)
{
var w = my$win();
w.$uv.push({parent:p, sn:sn});
}

// trace functions; these only work on deminimized js.
mw0.jtfn0 = function (a, b, punct)
{
var w = my$win();
var c = w.$jt$c;
var sn = w.$jt$sn;
++sn;
w.$jt$sn = sn;
return a + "alert3('" + c + sn + "')" + punct + b;
}
mw0.jtfn1 = function (all, a, b) { return mw0.jtfn0(a, b, ','); }
mw0.jtfn2 = function (all, a, b) { return mw0.jtfn0(a, b, ';'); }

} // master compile

URL = mw0.URL;
Node = mw0.Node;
HTML = mw0.HTML;
DocType = mw0.DocType;
Head = mw0.Head;
Meta = mw0.Meta;
Title = mw0.Title;
Link = mw0.Link;
Body = mw0.Body;
Base = mw0.Base;
Form = mw0.Form;
Element = mw0.Element;
HTMLElement = mw0.HTMLElement;
Image = mw0.Image;
Frame = mw0.Frame;
Anchor = mw0.Anchor;
Lister = mw0.Lister;
Listitem = mw0.Listitem;
Tbody = mw0.Tbody;
Table = mw0.Table;
Div = mw0.Div;
HtmlObj = mw0.HtmlObj;
Area = mw0.Area;
Span = mw0.Span;
Trow = mw0.Trow;
Cell = mw0.Cell;
P = mw0.P;
Header = mw0.Header;
Footer = mw0.Footer;
Script = mw0.Script;
HTMLScriptElement = mw0.HTMLScriptElement;
Timer = mw0.Timer;
Audio = mw0.Audio;
Canvas = mw0.Canvas;
AudioContext = mw0.AudioContext;
Document = mw0.Document;
CSSStyleSheet = mw0.CSSStyleSheet;
CSSStyleDeclaration = mw0.CSSStyleDeclaration;
// pages seem to want document.style to exist
document.style = new CSSStyleDeclaration;
document.style.bgcolor = "white";
document.defaultView = window;
document.defaultView.getComputedStyle = mw0.getComputedStyle;

TextNode = mw0.TextNode;
document.createTextNode = mw0.createTextNode;

Event = mw0.Event;
eb$listen = mw0.eb$listen;
eb$unlisten = mw0.eb$unlisten;
addEventListener = mw0.addEventListener;
removeEventListener = mw0.removeEventListener;
dispatchEvent = mw0.dispatchEvent;
document.eb$listen = mw0.eb$listen;
document.eb$unlisten = mw0.eb$unlisten;
document.addEventListener = mw0.addEventListener;
document.removeEventListener = mw0.removeEventListener;
if(mw0.attachOn) {
attachEvent = mw0.attachEvent;
detachEvent = mw0.detachEvent;
document.attachEvent = mw0.attachEvent;
document.detachEvent = mw0.detachEvent;
}
document.dispatchEvent = mw0.dispatchEvent;
document.createEvent = mw0.createEvent;
eventDebug = false;
document.ELEMENT_NODE = 1, document.TEXT_NODE = 3, document.COMMENT_NODE = 8, document.DOCUMENT_NODE = 9, document.DOCUMENT_TYPE_NODE = 10, document.DOCUMENT_FRAGMENT_NODE = 11;

document.createElement = mw0.createElement;
document.createElementNS = mw0.createElementNS;
document.createDocumentFragment = mw0.createDocumentFragment;
document.createComment = mw0.createComment;
document.implementation = mw0.implementation;
document.idMaster = {};
document.getElementById = function(s) { 
return document.idMaster[s]; 
}
// originally ms extension pre-DOM, we don't fully support it
//but offer the legacy document.all.tags method.
document.all = {};
document.all.tags = function(s) { 
return mw0.eb$gebtn(document.body, s.toLowerCase());
}

Option = mw0.Option;
XMLHttpRequest = mw0.XMLHttpRequest;
eb$demin = mw0.eb$demin;
eb$watch = mw0.eb$watch;
$uv = [];
$uv$sn = 0;
$jt$c = 'z';
$jt$sn = 0;
eb$uplift = mw0.eb$uplift;

document.getElementsByTagName = mw0.getElementsByTagName;
document.getElementsByClassName = mw0.getElementsByClassName;
document.getElementsByName = mw0.getElementsByName;
document.querySelectorAll = querySelectorAll;
document.querySelector = querySelector;
document.appendChild = mw0.appendChild;
document.prependChild = mw0.prependChild;
document.insertBefore = mw0.insertBefore;
document.replaceChild = mw0.replaceChild;
document.hasChildNodes = mw0.hasChildNodes;
document.childNodes = [];
// We'll make another childNodes array belowe every node in the tree.
Object.defineProperty(document, "firstChild", {
get: function() { return document.childNodes[0]; }
});
Object.defineProperty(document, "lastChild", {
get: function() { return document.childNodes[document.childNodes.length-1]; }
});
Object.defineProperty(document, "nextSibling", {
get: function() { return mw0.eb$getSibling(this,"next"); }
});
Object.defineProperty(document, "previousSibling", {
get: function() { return mw0.eb$getSibling(this,"previous"); }
});

Attr = mw0.Attr;
NamedNodeMap = mw0.NamedNodeMap;
document.getAttribute = mw0.getAttribute;
document.setAttribute = mw0.setAttribute;
document.hasAttribute = mw0.hasAttribute;
document.removeAttribute = mw0.removeAttribute;
document.getAttributeNode = mw0.getAttributeNode;
document.cloneNode = mw0.cloneNode;
cloneDebug = false;
document.importNode = mw0.importNode;
document.compareDocumentPosition = mw0.compareDocumentPosition;

// Local storage, this is per window.
// Then there's sessionStorage, and honestly I don't understand the difference.
// This is NamedNodeMap, to take advantage of preexisting methods.
localStorage = {}
localStorage.attributes = new NamedNodeMap;
localStorage.attributes.owner = localStorage;
localStorage.getAttribute = mw0.getAttribute;
localStorage.getItem = localStorage.getAttribute;
localStorage.setAttribute = mw0.setAttribute;
localStorage.setItem = localStorage.setAttribute;
localStorage.removeAttribute = mw0.removeAttribute;
localStorage.removeItem = localStorage.removeAttribute;
localStorage.clear = function() {
var l;
while(l = localStorage.attributes.length)
localStorage.removeItem(localStorage.attributes[l-1].name);
}

sessionStorage = {}
sessionStorage.attributes = new NamedNodeMap;
sessionStorage.attributes.owner = sessionStorage;
sessionStorage.getAttribute = mw0.getAttribute;
sessionStorage.getItem = sessionStorage.getAttribute;
sessionStorage.setAttribute = mw0.setAttribute;
sessionStorage.setItem = sessionStorage.setAttribute;
sessionStorage.removeAttribute = mw0.removeAttribute;
sessionStorage.removeItem = sessionStorage.removeAttribute;
sessionStorage.clear = function() {
var l;
while(l = sessionStorage.attributes.length)
sessionStorage.removeItem(sessionStorage.attributes[l-1].name);
}

/*********************************************************************
The select element in a form is itself an array, so the children functions have
to be on array prototype, except appendchild is to have no side effects,
because select options are maintained by rebuildSelectors(), so appendChild
is just array.push().
Why am I setting these prototype methods here, instead of the master window?
Because Array in one window is different from Array in another.
Try it in jdb:
Array === frames[0].contentWindow.Array;
Array is a native method, but different per context - so says duktape.
Thus Array.prototype is different in each context as well.
That's good in a way, since a web page will on occasion add something
to Array.prototype and we wouldn't want that to spill over into
unrelated web pages.
But it means I have to set these Array.prototype methods per context.
In contrast, our classes, like Div and URL,
are defined in the master window and global across edbrowse.
When I set Form.prototype.appendChild that's good for everyone.
But what if a web page mucks with Form.prototype?
That affects all the other pages!
Well such a behavior would be very nonstandard, other browsers don't make dom
classes with prototypes the way we do, so websites
aren't going to use that mechanism, so I think we're ok.
But I could be wrong, and some day we may find this spillover
unacceptable, and at that point I would have to move
all our classes out of the master window and back into each context.
Another consequence of separate Arrays is that a function in the
master window should never use instanceof Array.
It may work when called from one context and fail when called from another.
If I built our classes per context, and not in the master window,
that would be problematic because then I couldn't use instanceof URL
and instanceof Option, as I do today.
*********************************************************************/

Array.prototype.appendChild = function(child) {
// check to see if it's already there
for(var i=0; i<this.length; ++i)
if(this[i] == child)
return child;
this.push(child); child.parentNode = this;return child; }
/* insertBefore maps to splice, but we have to find the element. */
/* This prototype assumes all elements are objects. */
Array.prototype.insertBefore = function(newobj, item) {
// check to see if it's already there
for(var i=0; i<this.length; ++i)
if(this[i] == newobj)
return newobj;
for(var i=0; i<this.length; ++i)
if(this[i] == item) {
this.splice(i, 0, newobj);
newobj.parentNode = this;
return newobj;
}
}
Array.prototype.prependChild = mw0.prependChild;
Array.prototype.removeChild = function(item) {
for(var i=0; i<this.length; ++i)
if(this[i] == item) {
this.splice(i, 1);
delete this.parentNode;
break;
}
return item;
}
Array.prototype.hasChildNodes = mw0.hasChildNodes;
Array.prototype.replaceChild = mw0.replaceChild;
Object.defineProperty(Array.prototype, "firstChild", { get: function() { return this[0]; } });
Object.defineProperty(Array.prototype, "lastChild", { get: function() { return this[this.length-1]; } });
Object.defineProperty(Array.prototype, "nextSibling", { get: function() { return mw0.eb$getSibling(this,"next"); } });
Object.defineProperty(Array.prototype, "previousSibling", { get: function() { return mw0.eb$getSibling(this,"previous"); } });

Array.prototype.getAttribute = mw0.getAttribute;
Array.prototype.setAttribute = mw0.setAttribute;
Array.prototype.hasAttribute = mw0.hasAttribute;
Array.prototype.removeAttribute = mw0.removeAttribute;
Array.prototype.getAttributeNode = mw0.getAttributeNode;
Array.prototype.ELEMENT_NODE = 1, Array.prototype.TEXT_NODE = 3, Array.prototype.COMMENT_NODE = 8, Array.prototype.DOCUMENT_NODE = 9, Array.prototype.DOCUMENT_TYPE_NODE = 10, Array.prototype.DOCUMENT_FRAGMENT_NODE = 11;
Object.defineProperty(Array.prototype, "classList", { get : function() { return mw0.classList(this);}});
Array.prototype.item = function(x) { return this[x] };
Array.prototype.includes = function(x, start) {
if(typeof start != "number") start = 0;
var l = this.length;
if(start < 0) start += l;
if(start < 0) start = 0;
for(var i=start; i<l; ++i)
if(this[i] === x) return true;
return false;
}

// On the first call this setter just creates the url, the location of the
// current web page, But on the next call it has the side effect of replacing
// the web page with the new url.
Object.defineProperty(window, "location", {
get: function() { return window.location$2; },
set: function(h) {
if(!window.location$2) {
window.location$2 = new URL(h);
} else {
window.location$2.href = h;
}
}});
Object.defineProperty(document, "location", {
get: function() { return document.location$2; },
set: function(h) {
if(!document.location$2) {
document.location$2 = new URL(h);
} else {
document.location$2.href = h;
}
}});

// Window constructor, passes the url back to edbrowse
// so it can open a new web page.
Window = function() {
var newloc = "";
var winname = "";
if(arguments.length > 0) newloc = arguments[0];
if(arguments.length > 1) winname = arguments[1];
// I only do something if opening a new web page.
// If it's just a blank window, I don't know what to do with that.
if(newloc.length)
eb$newLocation('p' + newloc+ '\n' + winname);
this.opener = window;
}

/* window.open is the same as new window, just pass the args through */
function open() {
return Window.apply(this, arguments);
}

// Some websites expect an onhashchange handler from the get-go.
onhashchange = eb$truefunction;

if(!mw0.compiled) {

mw0.cssGather = function()
{
var w = my$win();
var d = my$doc();
var css_all = "";
w.cssSource = [];
// <style> tags in the html.
var a = d.getElementsByTagName("style");
var i, t;
if(a.length)
css_all += "@ebdelim0" + w.eb$base + "{}\n";
for(i=0; i<a.length; ++i) {
t = a[i];
if(t.data) w.cssSource.push({data: t.data, src:w.eb$base}), css_all += t.data;
}
// <link type=text/css> tags in the html.
a = d.getElementsByTagName("link");
for(i=0; i<a.length; ++i) {
t = a[i];
if(t.data && (
t.type && t.type.toLowerCase() == "text/css" ||
t.rel && t.rel.toLowerCase() == "stylesheet")) {
w.cssSource.push({data: t.data, src:t.href});
css_all += "@ebdelim0" + t.href + "{}\n";
css_all += t.data;
}
}
eb$cssDocLoad(css_all);
}

// Apply rules to a given style object, which is this.
Object.defineProperty(mw0.CSSStyleDeclaration.prototype, "cssText", { set: eb$cssText });

mw0.eb$qs$start = function()
{
// This is a stub for now.
my$doc().prependChild(new DocType);
mw0.cssGather();
}

/*********************************************************************
This function doesn't do all it should, and I'm not even sure what it should do.
If class changes from x to y, it throws out the old style completely,
and rebuilds a new style using getComputedStyle().
If prior javascript had specifically set style.foo = "bar", that's gone.
Maybe that's the right thing to do, maybe not.
Styles for other nodes are not recomputed.
Maybe they should be, maybe not.
We might have selectors .x P and .y P, thus changing P below,
but that change is not made.
Thing is, we'd have to recompute every node in the tree if we wanted to be sure.
I'm assuming the class change does not ripple up or down or sideways,
and affects only the current node.
Finally, any hover effects from .y are not considered, just as they are not
considered in getComputedStyle().
And any hover effects from .x are lost.
Injected text, as in .x:before { content:hello } remains.
I don't know if that's right either.
*********************************************************************/

mw0.eb$visible = function(t)
{
var rc = 2; // show by default
var so; // style object
if(!t || !(so = t.style)) return 0;
// If class has changed, recompute style
var c1 = t.last$class;
var c2 = t.class;
if(!c1) c1 = "";
if(!c2) c2 = "";
if(c1 != c2) {
t.last$class = c2;
var so = getComputedStyle(t, 0);
t.style = so;
}
if(so.display == "none" || so.visibility == "hidden") {
rc = 1;
// It is hidden, does it come to light on hover?
if(so.hov$vis) rc = 3;
}
return rc;
}

// This is a stub.
mw0.DOMParser = function() {
return {parseFromString: function(t,y) {
var d = my$doc();
if(y == "text/html" || y == "text/xml") {
var v = d.createElement("div");
v.innerHTML = t;
return v;
}
if(y == "text/plain") {
return d.createTextNode(t);
}
alert3("trying to use the DOM parser\n" + y + " <<< ");
alert4(t);
alert3(">>>");
return d.createTextNode("DOMParser not yet implemented");
}}};

mw0.XMLSerializer = function(){}
mw0.XMLSerializer.prototype.serializeToString = function(root) {
alert3("trying to use XMLSerializer");
return "<div>XMLSerializer not yet implemented</div>"; }

} // master compile

eb$qs$start = mw0.eb$qs$start;
eb$visible = mw0.eb$visible;
DOMParser = mw0.DOMParser;
XMLSerializer = mw0.XMLSerializer;
document.xmlVersion = 0;

// if debugThrow is set, see all errors, even caught errors.
Duktape.errCreate = function (e) {
if(throwDebug) {
var n = e.lineNumber;
var msg = "";
if(typeof n === "number")
msg += "line " + n + ": ";
msg += e.toString();
alert3(msg);
}
    return e;
}
throwDebug = false;

// here comes the Iterator and Walker
if(!mw0.compiled) {
mw0.NodeFilter = {
SHOW_ALL:-1,
SHOW_ELEMENT:1,
SHOW_ATTRIBUTE:2,
SHOW_TEXT:4,
SHOW_CDATA_SECTION:8,
SHOW_ENTITY_REFERENCE:16,
SHOW_ENTITY:32,
SHOW_PROCESSING_INSTRUCTION:64,
SHOW_COMMENT:128,
SHOW_DOCUMENT:256,
SHOW_DOCUMENT_TYPE:512,
SHOW_DOCUMENT_FRAGMENT:1024,
SHOW_NOTATION:2048,
// not sure of the values for these
FILTER_ACCEPT:1,
FILTER_REJECT:2,
FILTER_SKIP:3,
};

// This implementation only works on the nodes of a tree
mw0.createNodeIterator = function(root, mask, callback, unused)
{
o = {}; // the created iterator object
if(typeof callback != "function") callback = null;
o.callback = callback;
if(typeof mask != "number")
mask = 0xffffffff;
// let's reuse some software
if(root instanceof Object) {
o.list = mw0.eb$gebtn(root, "*");
if(!root.nodeType)
alert3("NodeIterator root object is not a node");
} else {
o.list = [];
alert3("NodeIterator root is not an object");
}
// apply filters
var i, j;
for(i=j=0; i<o.list.length; ++i) {
var alive = true;
var nt = o.list[i].nodeType;
if(nt == 9 && !(mask&NodeFilter.SHOW_DOCUMENT))
alive = false;
if(nt == 3 && !(mask&NodeFilter.SHOW_TEXT))
alive = false;
if(nt == 1 && !(mask&NodeFilter.SHOW_ELEMENT))
alive = false;
if(nt == 11 && !(mask&NodeFilter.SHOW_DOCUMENT_FRAGMENT))
alive = false;
if(nt == 8 && !(mask&NodeFilter.SHOW_COMMENT))
alive = false;
if(alive)
o.list[j++] = o.list[i];
}
o.list.length = j;
o.idx = 0;
o.bump = function(incr) {
var n = this.idx;
if(incr > 0) --n;
while(true) {
n += incr;
if(n < 0 || n >= this.list.length) return null;
var a = this.list[n];
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { if(incr > 0) ++n; this.idx = n; return a; }
// I don't understand the difference between skip and reject
}
}
o.nextNode = function() { return this.bump(1); }
o.previousNode = function() { return this.bump(-1); }
return o;
}

mw0.createTreeWalker = function(root, mask, callback, unused)
{
o = {}; // the created iterator object
if(typeof callback != "function") callback = null;
o.callback = callback;
if(typeof mask != "number")
mask = 0xffffffff;
if(root instanceof Object) {
o.list = mw0.eb$gebtn(root, "*");
if(!root.nodeType)
alert3("TreeWalker root object is not a node");
o.currentNode = root;
} else {
o.list = [];
alert3("TreeWalker root is not an object");
o.currentNode = null;
}
// apply filters
var i, j;
for(i=j=0; i<o.list.length; ++i) {
var alive = true;
var nt = o.list[i].nodeType;
if(nt == 9 && !(mask&NodeFilter.SHOW_DOCUMENT))
alive = false;
if(nt == 3 && !(mask&NodeFilter.SHOW_TEXT))
alive = false;
if(nt == 1 && !(mask&NodeFilter.SHOW_ELEMENT))
alive = false;
if(nt == 11 && !(mask&NodeFilter.SHOW_DOCUMENT_FRAGMENT))
alive = false;
if(nt == 8 && !(mask&NodeFilter.SHOW_COMMENT))
alive = false;
if(alive)
o.list[j++] = o.list[i];
}
o.list.length = j;
o.bump = function(incr) {
var n = this.list.indexOf(this.currentNode);
if(n < 0 || n >= this.list.length) return null;
while(true) {
n += incr;
if(n < 0 || n >= this.list.length) return null;
var a = this.list[n];
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
}
o.nextNode = function() { return this.bump(1); }
o.previousNode = function() { return this.bump(-1); }
o.endkid = function(incr) {
if(!(this.currentNode instanceof Object)) return null;
var a = incr > 0 ? this.currentNode.firstChild : this.currentNode.lastChild;
while(a) {
if(this.list.indexOf(a) >= 0) {
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
a = incr > 0 ? a.nextSibling() : a.previousSibling();
}
return null;
}
o.firstChild = function() { return this.endkid(1); }
o.lastChild = function() { return this.endkid(-1); }
o.nextkid = function(incr) {
if(!(this.currentNode instanceof Object)) return null;
var a = incr > 0 ? this.currentNode.nextSibling : this.currentNode.previousSibling;
while(a) {
if(this.list.indexOf(a) >= 0) {
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
a = incr > 0 ? a.nextSibling() : a.previousSibling();
}
return null;
}
o.nextSibling = function() { return this.nextkid(1); }
o.previousSibling = function() { return this.nextkid(-1); }
o.parentNode = function() {
if(!(this.currentNode instanceof Object)) return null;
var a = this.currentNode.parentNode;
if(a && this.list.indexOf(a) >= 0) {
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
return null;
}
return o;
}

} // master compile

NodeFilter = mw0.NodeFilter;
document.createNodeIterator = mw0.createNodeIterator;
document.createTreeWalker = mw0.createTreeWalker;

