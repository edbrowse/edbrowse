/* trace the execution of a large javascript file.
This assumes the file has been deminimized, with trace points added.
That is something we do in edbrowse.
So the file is ready to go.
Trace messages come out on alerts - that is hardly useful for batch processing.
That might be 200,000 trace messages.
Also, alert doesn't work in headless chrome.
So we capture the output in a string instead.
Then put it in a textarea so it will not be parsed by html.
Then put that in the show paragraph. */

tlog = ""; // trace log
show = document.getElementById("show");
showmsg = "";
// In case we have to do some things differently in the two browsers.
isedbrowse = navigator.userAgent.substr(0, 8) == "edbrowse";

// This is a stripped down vertion of the trace replacement string that edbrowse uses.
// Because we always know step$l = 1.
// And a simpler version of trace$ch()

$zct = {}; // counters for trace points
step$l = 1;
function trace$ch(k) {
let c=($zct[k]>=0?++$zct[k]:($zct[k]=1));
return k+":"+c;
}

const trace_string = ";(function(l$ne){ let v = trace$ch(l$ne); alert(v); })(\"";

function traceBreakReplace(all, precomma, operator, name, postcomma) {
var r = precomma ? precomma : ';';
r += operator == "bp" ? bp_string : trace_string;
r += name + "\")";
r += postcomma ? postcomma : ';';
return r;
}

function traceExpand(src)
{
return src.replace(/(,?) *(trace|bp)@\((\w+)\) *([,;]?)/g, traceBreakReplace);
}

/* We want to pull in a js source file, process it using the above, then execute it.
The only way to get a file is through the xhr system.
That's fine for edbrowse, but chrome has cross origin restrictions.
Sometimes it just fails - silently. Very frustrating.
I usually have to put these files on my website,
and write the url on a line in a buffer,
then use the chromeline function.
The base file, and this file, and the javascript library you are debugging,
are all on the same website, and there's no cross origin problems.
So here comes the xhr. */

function traceFetch(sourcefile)
{
const xhr = new XMLHttpRequest;
// sourcefile should come from the script src attribute,
// and should be resolved against the base, and should already be a url.
xhr.open("get", sourcefile, false);
xhr.send("", 0);
return traceExpand(xhr.responseText);
}

// these displace the edbrowse versions. They are simpler,
// and more portable.
function showarg(x) { 
let l;
if(x === null) return "null";
switch(typeof x) {
case "undefined": return "undefined";
case "number": case "boolean": return x.toString();
case "function": return x.name;
case "string":
l = x.length;
if(l > 60) x = x.substr(0,60) + "...";
return x.replace(/\n/g, "\\n");
case "object":
if(Array.isArray(x)) {
l = x.length;
var i, r = "array[" + x.length + "]{";
if(l > 20) l = 20;
for(i=0; i<l; ++i)
r += showarg(x[i]) + ',';
if(l < x.length) r += "...";
r += '}';
return r;
}
if(x instanceof URL) return "URL(" + x.toString() + ")";
if(x.nodeType == 1 && x.childNodes && x.nodeName) { // html element
var s = "<" + x.nodeName + ">";
var y = x.getAttribute("id");
if(y) s += " id=" + y;
y = x.getAttribute("class");
if(y) s += " class=" + y;
return s;
}
if(typeof x.HTMLDivElement == "function" && typeof x.HTMLTableElement == "function") {
var r = "window";
if(x.location && x.location.href) r += " " + x.location.href;
return r;
}
return "object";
default: return "?";
}
}

function showarglist(a) { 
if(typeof a != "object" ||
typeof a.length != "number")
return "not an array";
var s = "";
for(var i = 0; i < a.length; ++i) {
if(i) s += ", ";
s += showarg(a[i]);
}
return s;
}

// the modified source runs alert upon function entry, showing the arguments.
// alerts are useless in headless chrome, and impractical for building files.
// This one displaces the edbrowse alert, or the chrome alert.
alert = (h)=>{ tlog += `${h}\n`; }

function traceRun(src) {
const s = document.createElement("script");
s.text = src;
// attaching it to the tree will cause it to run
document.body.appendChild(s);
}

function traceShow()
{
show.innerHTML = "<textarea>\n" + tlog + "</textarea>";
}

function traceAll(src)
{
let ss = traceFetch(src);
traceRun(ss);
traceShow();
}
