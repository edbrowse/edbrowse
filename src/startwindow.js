// stringname=startWindowJS
/*********************************************************************
This file contains support javascript functions used by a browser.
They are easier to write here in javascript than in C using the js api.
And it is portable amongst all js engines.
This file is converted into a C string and compiled and run
at the start of each javascript window.
Please take advantage of this machinery and put functions here,
including prototypes and getter / setter support functions,
whenever it makes sense to do so.

edbrowse support functions and native methods often start with eb$,
hoping they will not accidentally collide with js functions in the wild.
Example: eb$newLocation, a native method that redirects this web page to another.

It would be nice to run this file stand-alone, outside of edbrowse,
even if the functionality is limited.
To this end, I create the window object if it isn't already there,
using the obvious window = this.
*********************************************************************/
"use strict";
if(!this.window) {
this.window = this;
this.document = {};
this.eb$ctx = 77;
// Stubs for native methods that are normally provided by edbrowse.
// Example: alert, which we can replace with print,
// or console.log, or anything present in the command line js interpreter.
if(!window.print) this.print = console.log;
this.alert = print;
this.eb$nullfunction = function() { return null}
this.eb$voidfunction = function() { }
this.eb$truefunction = function() { return true}
this.eb$falsefunction = function() { return false}
this.db$flags = eb$falsefunction;
this.eb$newLocation = function (s) { print("new location " + s)}
this.eb$logElement = function(o, tag) { print("pass tag " + tag + " to edbrowse")}
this.eb$getcook = function() { return "cookies"}
this.eb$setcook = function(value) { print(" new cookie " + value)}
this.eb$parent = function() { return this}
this.eb$top = function() { return this}
this.eb$frameElement = function() { return this}
this.eb$getter_cd = function() { return null}
this.eb$getter_cw = function() { return null}
;(function() { let void_functions = ["addEventListener",
    "removeEventListener", "eb$apch1", "eb$apch2", "eb$rmch2", "eb$insbf",
    "eb$hasFocus", "eb$write", "eb$writeln"];
for (let i in void_functions) window[void_functions[i]] = eb$voidfunction; })();
this.my$win = function() { return window}
this.my$doc = function() { return document}

// document.eb$apch2 = function(c) { alert("append " + c.node<Name  + " to " + this.nodeName); this.childNodes.push(c); }
// other browsers don't have querySelectorAll under window
this.querySelectorAll = function() { return [] }
this.querySelector = function() { return {} }
this.querySelector0 = function() { return false}
}

// the third party deminimization stuff is in mw$, the master window.
// Other stuff too, that can be shared.
// The window should just be there from C, but in case it isn't.
if(!window.mw$) {
// mw$.share = 0 means I made up that window out of thin air
    this.mw$ = {share:0, URL:{}};
this.mw$.alert = this.mw$.alert3 = this.mw$.alert4 = print
    this.mw$.url_hrefset = () => undefined;
    this.mw$.dispatchEvent = () => undefined;
    this.mw$.addEventListener = () => undefined;
    this.mw$.removeEventListener = () => undefined;
    this.mw$.getComputedStyle = () => {};
    this.mw$.structuredClone = () => {};
    this.mw$.setupClasses = () => {};
// classes that setupClasses would have built, but didn't.
    this.URL = function(){}
    this.HTMLElement = function(){}
    this.SVGElement = function(){}
    this.HTMLBodyElement = function(){}
    this.CSSStyleDeclaration = function(){}
}

// We need some shorthand for this rather large file.
// Think of these as macros; they are deleted at the end so they don't persist.
this.odp = Object.defineProperty;
// remember, we can't use odp inside function that run later:
// constructors, setters, methods, etc.

// set a window member, unseen, unchanging
this.swm = function(k, v) { odp(window, k, {value:v})}
// visible (enumerable), but still protected
this.swm1 = function(k, v) { odp(window, k, {value:v,enumerable:true})}
// unseen, but changeable
this.swm2 = function(k, v) { odp(window, k, {value:v, writable:true, configurable:true})}

// establish the prototype for inheritance, then set dom$class
// this is called as each html element is built
// If our made-up class is z$Foo, dom$class becomes Foo
// Letters mean set window member prototype
this.swmp = function(c, inherit) {
    const v = c.replace(/^z\$/, "");
    if(inherit)
        odp(window[c], "prototype", {value:new inherit})
    odp(window[c].prototype, "dom$class", {value:v})
}

// set document member, analogs of the set window member functions
this.sdm = function(k, v) { odp(document, k, {value:v})}
this.sdm1 = function(k, v) { odp(document, k, {value:v,enumerable:true})}
this.sdm2 = function(k, v) { odp(document, k, {value:v, writable:true, configurable:true})}

/* Extremely useful even if non-standard hence the Eb$ prefix but use a named
    class as if people see it it really doesn't matter and makes the definition
    work better.

    Mostly based on the IterableWeakMap example from
    https://github.com/tc39/proposal-weakrefs with some reformatting.

    It needs to be in here so that the private properties end up as this
    window's versions of the objects.
*/
class Eb$IterableWeakMap {
    #weakMap = new WeakMap();
    #refSet = new Set();
    #finalizationGroup = new FinalizationRegistry(Eb$IterableWeakMap.#cleanup);

    static #cleanup({ set, ref }) {
        set.delete(ref);
    }

    constructor(iterable) {
        if (iterable)
            for (const [key, value] of iterable) this.set(key, value);
    }

    set(key, value) {
        const ref = new WeakRef(key);
        this.#weakMap.set(key, { value, ref });
        this.#refSet.add(ref);
        this.#finalizationGroup.register(key, {
            set: this.#refSet,
            ref
        }, ref);
    }

    get(key) {
        const entry = this.#weakMap.get(key);
        return entry && entry.value;
    }

    delete(key) {
        const entry = this.#weakMap.get(key);
        if (!entry) return false;
        this.#weakMap.delete(key);
        this.#refSet.delete(entry.ref);
        this.#finalizationGroup.unregister(entry.ref);
        return true;
    }

    has(key) {
        return this.#weakMap.has(key);
    }

    /* Use generators so that we don't end up holding a list of strong refs
        during iteration */

    *[Symbol.iterator]() {
        for (const ref of this.#refSet) {
            const key = ref.deref();
            if (!key) continue;
            const { value } = this.#weakMap.get(key);
            yield [key, value];
        }
    }

    entries() {
        return this[Symbol.iterator]();
    }

    *keys() {
        for (const [key, value] of this)  yield key;
    }

    *values() {
        for (const [key, value] of this)  yield value;
    }

    // This may not be accurate as we don't deref the keys
    get size() {
        return this.#refSet.size;
    }
}

// * don't understand all the error codes and subcodes.
// This is just a stub for now, to make acid 25 work.
Error.prototype.NAMESPACE_ERR = 1;

// The first DOM class is Node, at the head of all else.
swm("Node", function(){})
swmp("Node", null)

/*********************************************************************
a node list is and isn't an array; I don't really understand it.
I'll just have it inherit from array, until someone tells me I'm wrong.
Similarly for HTMLCollection.
I seed it with an optional array, for my own convenience.
Users aren't suppose to instantiate anyways, so I can't get in trouble by doing this.
*********************************************************************/
swm("NodeList", function(v){
if(Array.isArray(v))
for(var i=0; i<v.length; ++i)
this.push(v[i])
})
swmp("NodeList", Array)
NodeList.prototype.toString = function(){return "[object NodeList]"}
swm("HTMLCollection", function(v){
if(Array.isArray(v))
for(var i=0; i<v.length; ++i)
this.push(v[i])
})
swmp("HTMLCollection", Array)
HTMLCollection.prototype.toString = function(){return "[object HTMLCollection]"}

// make sure to wrap global dispatchEvent, so this becomes this window,
// and not the shared window.
swm("dispatchEvent", mw$.dispatchEvent.bind(window))
swm("addEventListener", mw$.addEventListener.bind(window))
swm("removeEventListener", mw$.removeEventListener.bind(window))

swm("EventTarget", function() {})
swmp("EventTarget", Node)
EventTarget.prototype.addEventListener = mw$.addEventListener;
EventTarget.prototype.removeEventListener = mw$.removeEventListener;
EventTarget.prototype.dispatchEvent = mw$.dispatchEvent;

swm("Document", function() {
    Object.defineProperty(this, "childNodes", {value:[],writable:true,configurable:true});
    Object.defineProperty(this, "id$hash", {value: new Map});
    Object.defineProperty(this, "id$registry", {value: new FinalizationRegistry(
        (i) => {
            alert3(`GC triggers delete of element with id ${i} from id hash`);
            this.id$hash.delete(i);
        }
    )});
});
swmp("Document", EventTarget)
this.docp = Document.prototype; // shorthand
// We may abbreviate prototypes for the various classes when building them,
// but we'll always delete it once the class is built.
docp.activeElement = null;
odp(docp, "children", {get:function(){return this.childNodes}})
odp(docp, "childElementCount", {get:function(){return this.children.length}})
docp.querySelector = querySelector
docp.querySelectorAll = function(c,s) { return new NodeList(querySelectorAll.call(this,c,s)) }
odp(docp, "documentElement", {get: mw$.getElement});
odp(docp, "head", {get: mw$.getHead,set:mw$.setHead});
odp(docp, "body", {get: mw$.getBody,set:mw$.setBody});
// scrollingElement makes no sense in edbrowse, I think body is our best bet
odp(docp, "scrollingElement", {get: mw$.getBody});
odp(docp, "URL", {get: function(){return this.location ? this.location.toString() : null}})
odp(docp, "documentURI", {get: function(){return this.URL}})
odp(docp, "cookie", {
get: eb$getcook, set: eb$setcook});
docp.defaultView = window
docp.readyState = "interactive"
docp.visibilityState = "visible"
docp.getElementById = mw$.getElementById
// the other getElementsBy we inherit from Node
docp.nodeName = "#document"
docp.tagName = "document"
docp.nodeType = 9
delete window.docp;

// the most important line is right here
swm1("document", new Document)

/* Apparently people want to muck with DOMException so can't be shared as
otherwise we end up with read-only prototype chain issues */
this.DOMException = function(message, name) {
    this.message = message
    this.name = name
    var error = Error(message)
    this.stack = error.stack
}
DOMException.prototype = Object.create(Error.prototype)
DOMException.prototype.constructor = DOMException

// point to shared methods in the master window
swm("UnsupportedError", mw$.UnsupportedError);
swm("my$win", mw$.my$win)
swm("my$doc", mw$.my$doc)
swm("natok", mw$.natok)
swm("db$flags", mw$.db$flags)
swm("eb$voidfunction", mw$.eb$voidfunction)
swm("eb$nullfunction", mw$.eb$nullfunction)
swm("eb$truefunction", mw$.eb$truefunction)
swm("eb$falsefunction", mw$.eb$falsefunction)
swm1("close", mw$.win$close)
swm("eb$visible", mw$.eb$visible)
swm2("atob", mw$.atob)
swm2("btoa", mw$.btoa)
swm1("prompt", mw$.prompt)
swm1("confirm", mw$.confirm)
swm("eb$newLocation", mw$.eb$newLocation)
swm("eb$logElement", mw$.eb$logElement)
swm1("alert", mw$.alert)
swm("alert3", mw$.alert3)
swm("alert4", mw$.alert4)
this.print = function() { alert("javascript is trying to print this document")}
this.stop = function() { alert("javascript is trying to stop the browse process")}
swm("dumptree", mw$.dumptree)
swm("uptrace", mw$.uptrace)
swm("by_esn", mw$.by_esn)
swm("showscripts", mw$.showscripts)
swm("searchscripts", mw$.searchscripts)
swm("showframes", mw$.showframes)
swm("snapshot", mw$.snapshot)
swm("aloop", mw$.aloop)
swm("showarg", mw$.showarg)
swm("showarglist", mw$.showarglist)
swm("set_location_hash", mw$.set_location_hash)
sdm("getRootNode", mw$.getRootNode)
sdm("nodeContains", mw$.nodeContains)
sdm("dispatchEvent", mw$.dispatchEvent)
swm("NodeFilter", mw$.NodeFilter)
sdm2("createNodeIterator", mw$.createNodeIterator)
sdm2("createTreeWalker", mw$.createTreeWalker)
swm("rowReindex", mw$.rowReindex)
swm1("getComputedStyle", mw$.getComputedStyle.bind(window))
swm("mutFixup", mw$.mutFixup)
swm("makeSheets", mw$.makeSheets)
swm2("structuredClone", mw$.structuredClone.bind(window))

swm("dom$class", "Window")
// next two are overwritten if xml
sdm2("eb$xml", false)
sdm2("dom$class", "HTMLDocument")
// use dom$class to make our own toString function, so that
// document.createElement("div").toString() says "[object HTMLDiv?Element]" as it should
// This is important to some websites!
swm("toString$nat", toString);
/* toString has to be replaceable by other websites, which happens more often
than you think. Apparently sometimes people also want to grab the toString
function directly from an object and expect to be able to call it without the
lack of a this binding causing problems. */
this.toString = Object.prototype.toString = function() {
    return this ? (
        this.dom$class ? "[object "+this.dom$class+"]" : toString$nat.call(this)
    ) : toString$nat.call(this);
}
odp(window, "toString", {enumerable:false})

swm1("scroll", eb$voidfunction)
swm1("scrollTo", eb$voidfunction)
swm1("scrollBy", eb$voidfunction)
swm1("scrollByLines", eb$voidfunction)
swm1("scrollByPages", eb$voidfunction)
sdm("close", eb$voidfunction)
sdm("blur", function(){document.activeElement=null})
sdm("focus", function(){document.activeElement=document.body})
swm1("blur", document.blur)
swm1("focus", document.focus)

swm1("self", window)
odp(window, "parent", {get: eb$parent,enumerable:true});
odp(window, "top", {get: eb$top,enumerable:true});
odp(window, "frameElement", {get: eb$frameElement,enumerable:true});

sdm("write", eb$write)
sdm("writeln", eb$writeln)
sdm("hasFocus", eb$hasFocus)
sdm("eb$apch1", eb$apch1)
sdm("eb$apch2", eb$apch2)
sdm("eb$insbf", eb$insbf)
sdm("eb$rmch2", eb$rmch2)
sdm("eb$ctx", eb$ctx)
sdm("eb$seqno", 0)

/* An ok (object keys) function for javascript/dom debugging.
 * This is in concert with the jdb command in edbrowse.
 * I know, it doesn't start with eb$ but I wanted an easy,
 * mnemonic command that I could type in quickly.
 * If a web page creates an ok function it will override this one.
And that does happen, e.g. the react system, so $ok is an alias for this. */
swm2("ok", Object.keys)
swm2("$ok", ok)

swm("nodeName", "WINDOW") // in case you want to start at the top.
sdm2("ownerDocument", null)

// produce a stack for debugging purposes
swm("step$stack", function(){
var s = "you shouldn't see this";
try { 'use strict'; eval("yyz$"); } catch(e) { s = e.stack; }
// Lop off some leading lines that don't mean anything.
for(var i = 0; i<5; ++i)
s = s.replace(/^.*\n/, "");
return s;
})

if(top == window) {
swm2("step$l", 0)
swm2("step$val", "")
swm2("step$go", "")
// First line of js in the base file of your snapshot might be
// step$l = 0, step$go = "c275";
// to start tracing at c275
} else {
// step$l should control the entire session, all frames.
// This is a trick to have a global variable across all frames.
odp(window, "step$l", {get:function(){return top.step$l}, set:function(x){top.step$l=x}});
odp(window, "step$go", {get:function(){return top.step$go}, set:function(x){top.step$go=x}});
// I don't use this trick on step$exp, because an expression should really live within its frame
}

swm("$zct", {}) // counters for trace points
function trace$ch(k) {
var c=($zct[k]>=0?++$zct[k]:($zct[k]=1));
step$val = k+":"+c;
var trip=false;
if(k === step$go||typeof step$exp==='string'&&eval(step$exp)) trip = true;
return trip ? 2 : step$l;
}

sdm("open", function() { return this })

/* Some visual attributes of the window.
 * These are simulations as edbrowse has no screen.
 * Better to have something than nothing at all. */
swm("height", 768)
swm("width", 1024)
swm1("pageXOffset", 0)
swm1("scrollX", 0)
swm1("pageYOffset", 0)
swm1("scrollY", 0)
swm1("devicePixelRatio", 1.0)
// document.status is removed because it creates a conflict with
// the status property of the XMLHttpRequest implementation
swm("defaultStatus", 0)
swm("returnValue", true)
swm1("menubar", mw$.generalbar)
swm1("statusbar", mw$.generalbar)
swm1("scrollbars", mw$.generalbar)
swm1("toolbar", mw$.generalbar)
swm1("personalbar", mw$.generalbar)
swm("resizable", true)
swm("directories", false)
if(window == top) {
swm1("name", "unspecifiedFrame")
} else {
odp(window, "name", {get:function(){return frameElement.name}});
// there is no setter here, should there be? Can we set name to something?
// Should it propagate back up to the frame element name?
}

sdm("bgcolor", "white")
sdm("contentType", "text/html")
function readyStateComplete() { document.readyState = "complete"; document.activeElement = document.body;
if(document.onreadystatechange$$fn) {
var e = new Event;
e.initEvent("readystatechange", true, true);
e.target = e.currentTarget = document;
e.eventPhase = 2;
document.onreadystatechange$$fn(e);
}
}

swm1("screen", {
height: 768, width: 1024,
availHeight: 768, availWidth: 1024, availTop: 0, availLeft: 0,
colorDepth: 24})

swm("console", {
debug: function(obj) { mw$.logtime(3, "debug", obj)},
log: function(obj) { mw$.logtime(3, "log", obj)},
info: function(obj) { mw$.logtime(3, "info", obj)},
warn: function(obj) { mw$.logtime(3, "warn", obj)},
error: function(obj) { mw$.logtime(3, "error", obj)},
timeStamp: function(label) { if(label === undefined) label = "x"; return label.toString() + (new Date).getTime(); }
})

// document should always have children, but...
sdm("hasChildNodes", mw$.hasChildNodes)

swm1("navigator", {})
navigator.appName = "edbrowse";
navigator["appCode Name"] = "edbrowse C/quickjs";
/* not sure what product is about */
navigator.product = "edbrowse";
navigator.productSub = "3.7";
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
// might be useful to pretend like we have low bandwidth,
// so the website doesn't send down all sorts of visual crap.
navigator.connection = {
downlink: 50,
downlinkMax: 100,
effectiveType: "2g",
rtt: 8,
saveData: false,
type: "unknown",
addEventListener: eb$voidfunction,
removeEventListener: eb$voidfunction,
};

// There's no history in edbrowse.
// Only the current file is known, hence length is 1.
swm1("history", {
length: 1,
next: "",
previous: "",
back: eb$voidfunction,
forward: eb$voidfunction,
go: eb$voidfunction,
pushState: eb$voidfunction,
replaceState: eb$voidfunction,
toString: function() {  return "Sorry, edbrowse does not maintain a browsing history."}
})

swm("CSS", mw$.CSS)
swm("Intl", mw$.Intl)

// some base arrays - lists of things we'll probably need
sdm("heads", [])
sdm("bases", [])
sdm("links", [])
sdm("metas", [])
sdm("styles", [])
sdm("bodies", [])
sdm("forms", [])
sdm("elements", [])
sdm("divs", [])
sdm("labels", [])
sdm("htmlobjs", [])
sdm("scripts", [])
sdm("paragraphs", [])
sdm("headers", [])
sdm("footers", [])
sdm("tables", [])
sdm("spans", [])
sdm("images", [])
// styleSheets is a placeholder for now; I don't know what to do with it.
sdm("styleSheets", [])

swm2("frames$2", []);
swm1("frames", {})
odp(frames, "length", {get:function(){return frames$2.length}})
odp(window, "length", {get:function(){return frames$2.length},enumerable:true})

// pending jobs, mostly to debug promise functions.
swm("$pjobs", [])

sdm("cloneNode", function(deep) {
    window.cloneRoot1 = this;
    return mw$.clone1 (this,deep, false);
})

// This should be in the native string class
String.prototype.at = function(n) {
if(typeof n != "number") return undefined;
var l = this.length;
if(n >= 0) {
if(n >= l) return undefined;
return this.charAt(n);
}
n = -n;
if(n > l) return undefined;
return this.charAt(l-n);
}

/*********************************************************************
    Originally I developed the shared window for efficiency.
    There's no point in "compiling" the entire dom every time we bring up a new web page. Other browsers don't do that!
    That still holds but now there is another consideration: the context that holds startwindow.js never goes away, even if we free it.
    So the less in startwindow, the better.
    To this end I will try to move more stuff to the shared window.
This includes the definition of most of the DOM classes.
They still have to be "built" at runtime however; it's not a true compile.
Here's why - using URL as an example.
There are websites that replace URL.prototype.toString with their own function.
They want to change the way URLs stringify, or whatever. I can't
prevent sites from doing that, things might not work properly without it!
So, if site A does that in the shared window, and site B invokes
a.href.toString, directly or indirectly, B is calling a function from
the unrelated website A.
This could screw things up, or worse, site A could use it to hack into
site B, hoping site B is your banking site or something important.
So I can't define URL over there and say URL = mw$.url over here.
However, the shared window can "build" the URL class over here,
when asked to do so, and then the user is free to muck with the class
or its prototype methods or anything else.
So here is the line that does a lot!
*********************************************************************/

mw$.setupClasses(window);

swm("ShadowRoot", function(){})
swmp("ShadowRoot", HTMLElement)

// setupClasses doesn't establish the shadow root properties,
// mostly cause I don't understand them.
// Let's approximate them here.
HTMLElement.prototype.attachShadow = function(o){
// I should have a list of allowed tags here, but custom tags are allowed,
// and I don't know how to determine that,
// so I'll just reject a few tags.
var nn = this.nodeName;
if(nn == "A" || nn == "FRAME" || nn == "IFRAME" | nn == "#document" || nn == "#text" || nn == "#comment" ||
nn == "TABLE" || nn == "TH" || nn == "TD" || nn == "TR" || nn == "FORM" || nn == "INPUT" ||
nn == "SHADOWROOT") // no shadow root within a shadow root
return null;
var r = document.createElement("ShadowRoot");
this.appendChild(r); // are we suppose to do this?
r.mode = "open";
r.delegatesFocus = false;
r.slotAssignment = "";
if(typeof o == "object") {
if(o.mode) r.mode = o.mode;
if(o.delegatesFocus) r.delegatesFocus = o.delegatesFocus;
if(o.slotAssignment) r.slotAssignment = o.slotAssignment;
}
return r;
}
odp(HTMLElement.prototype, "shadowRoot", {
get:function(){
var r = this.firstChild;
if(r && r.nodeName == "SHADOWROOT" && r.mode == "open") return r;
return null;
}});

/*********************************************************************
This is a special routine for textarea.innerHTML = "some html text";
I assume, with very little data to go on, that the html is rendered
in some fashion, i.e. turned into text, then pushed into the text area.
This is just a first step. If there is a text node below then I
cross that over to textarea.value. If it's anything more complicated
than that, I throw up my hands and give up.
Yes, I found this in the real world when trying to unsubscribe from
	https://www.credomobile.com
I remove the textNode below, because it would be rendered by edbrowse,
and the text that was just put in the buffer would also be on the main page.
Note the chain of setters.
Javascript calls innerHTML, which is a setter written in C.
That calls this routine, which pushes the rendered string into value,
which is another setter, writtten in C.
If all this works I'll be amazed.
*********************************************************************/

swm("textarea$html$crossover", function(t) {
if(!t || t.dom$class != "HTMLElement" || t.type != "textarea")
return;
t.value = "";
// It's a textarea - what is below?
if(t.childNodes.length == 0) return; // nothing below
var tn; // our textNode
if(t.childNodes.length == 1 && (tn = t.firstChild) &&
tn.dom$class == "TextNode") {
var d = (tn.data ? tn.data : "");
t.value = d;
t.removeChild(tn);
return;
}
alert3("textarea.innerHTML is too complicated for me to render");
})

// the performance registry
swm("pf$registry", {mark:{},measure:{},measure0:{},resourceTiming:{}})
odp(pf$registry, "measure0", {enumerable:false});
swm1("Performance", function(){})
Performance.prototype = {
// timeOrigin is the start time of this window, I guess
timeOrigin: Date.now(),
now:function(){ return Date.now()},
mark: function(name) { pf$registry.mark[name] = Date.now()},
clearMarks: function(e) { var m = pf$registry.mark; if(e) delete m[e]; else for(var i in m) delete m[i];},
measure:function(name,s,e) { var m = pf$registry.mark,  n = m[s] && m[e] ? m[e]-m[s] : 0; pf$registry.measure[name] = n; pf$registry.measure0[name] = this.now();},
clearMeasures: function(e) { var m = pf$registry.measure, m0 = pf$registry.measure0; if(e) delete m[e],delete m0[e]; else for(var i in m) delete m[i],delete m0[i];},
clearResourceTimings: function(e) { var m = pf$registry.resourceTiming; if(e) delete m[e]; else for(var i in m) delete m[i];},
getEntriesByType:function(type){var top = pf$registry[type];
var list = []; if(!top) return list;
for(var i in top) list.push({name:i, entryType:type, timeStamp:(type==="measure"?pf$registry.measure0[i]:top[i]), duration:(type==="measure"?top[i]:0)})
mw$.sortTime(list);
return list;
},
getEntriesByName:function(name,type){
var list = [];
if(type) {
var top = pf$registry[type];
if(top && top[name])
list.push({name:name, entryType:type, timeStamp:(type==="measure"?pf$registry.measure0[name]:top[name]), duration:(type==="measure"?top[name]:0)})
} else {
for(type in pf$registry) {
var m = pf$registry[type];
if(m[name])
list.push({name:name, entryType:type, timeStamp:(type==="measure"?pf$registry.measure0[name]:m[name]), duration:(type==="measure"?m[name]:0)})
}
mw$.sortTime(list);
}
return list;
},
getEntries:function(){
var list = [], r = pf$registry;
for(var type in r) {
var m = r[type];
for(var i in m) list.push({name:i, entryType:type, timeStamp:(type==="measure"?r.measure0[i]:m[i]), duration:(type==="measure"?m[i]:0)})
}
mw$.sortTime(list);
return list;
},
// at least have the object, even if it doesn't have any timestamps in it
timing:{navigationStart:0},
}
odp(window, "performance", {get: function(){return new Performance}});

// this is a stub, I hope I don't have to implement this stuff.
swm("PerformanceObserver", {
supportedEntryTypes: {
// no types are supported
includes: eb$falsefunction
}
})

swm("cel$registry", new Map) // custom elements registry
odp(window, "customElements", {get:function(){ return {
define:mw$.cel_define,
get:mw$.cel_get,
}},enumerable:true});

/*********************************************************************
When a script runs it may call document.write. But where to put those nodes?
I think they belong under the script object, I think that's intuitive,
but most browsers put them under body,
or at least under the parent of the script object,
but always in position, as though they were right here in place of the script.
This function lifts the nodes from the script object to its parent,
in position, just after the script.
Watch out! If the script has inline text, it is a proper child of the script,
and should not be moved. Check for eb$nomove.
*********************************************************************/

swm("eb$uplift", function(s) {
var p = s.parentNode;
if(!p) return; // should never happen
var before = s.nextSibling;
var c = s.firstChild;
if(c && c.nodeType == 3 && c.eb$nomove) c = c.nextSibling;
while(c) {
var hold = c.nextSibling;
if(before) p.insertBefore(c, before);
else p.appendChild(c);
c = hold;
}
})

swm("onmessage$$queue", []);
swm1("postMessage", function (message,target_origin, transfer) {
    let locstring = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    if(!window.location.port)
        locstring += window.mw$.setDefaultPort(window.location.protocol);
    const my_win = my$win();
    if (!target_origin || target_origin == '/') {
        let l = my_win.location;
        target_origin = l.protocol + "//" + l.hostname;
    }

    if(target_origin != '*' && !target_origin.match(/:\d*$/)) {
        // We need a port but don't have one
        let target_protocol = target_origin.replace(/:.*/, ":");
        let standard_port = window.mw$.setDefaultPort(target_protocol);
        target_origin += ":" + standard_port;
    }
    if (target_origin == locstring || target_origin == "*") {
        const me = new Event;
        me.name = me.type = "message";
        let w = my$win();
        let l = w.location;
        me.origin = l.protocol + "//" + l.hostname;
        me.data = window.structuredClone(message);
        me.source = w;
        if(transfer) {
            me.ports = transfer;
            // If these objects had a context, they are now owned by this one.
            for(let i = 0; i < transfer.length; ++i)
                if(transfer[i].eb$ctx) transfer[i].eb$ctx = window.eb$ctx;
        }
        window.onmessage$$queue.push(me);
        alert3("posting message of length " + message.length + " to window context " + window.eb$ctx + " ↑" +
            (message.length >= 200 ? "long" : message)
            + "↑");
    } else {
        alert3("postMessage mismatch " + locstring + " | " + target_origin + " carrying ↑" +
            (message.length >= 200 ? "long" : message)
            + "↑");
    }
})
swm("onmessage$$running", mw$.onmessage$$running)

sdm("getBoundingClientRect", function(){
return {
top: 0, bottom: 0, left: 0, right: 0,
x: 0, y: 0,
width: 0, height: 0
}
})

// The Attr class and getAttributeNode().
swm("Attr", function(){ this.owner = null; this.name = ""})
swmp("Attr", null)
Attr.prototype.isId = function() { return this.name === "id"; }
Attr.prototype.cloneNode = mw$.cloneAttr

// this is sort of an array and sort of not.
// For one thing, you can call setAttribute("length", "snork"), so I can't use length.
swm("NamedNodeMap", function() { this.length = 0})
swmp("NamedNodeMap", null)
NamedNodeMap.prototype.push = function(s) { this[this.length++] = s; }
NamedNodeMap.prototype.item = function(n) { return this[n]; }
NamedNodeMap.prototype.getNamedItem = function(name) { return this[name.toLowerCase()]; }
NamedNodeMap.prototype.setNamedItem = function(name, v) { this.owner.setAttribute(name, v);}
NamedNodeMap.prototype.removeNamedItem = function(name) { this.owner.removeAttribute(name);}

/*********************************************************************
importNode is the same as cloneNode, except it is copying a tree
of objects from another context into the current context.
Set the second parameter to true to indicate this.
*********************************************************************/

sdm("importNode", function(start,deep) {
    window.cloneRoot1 = start;
    return mw$.clone1 (start,deep, true);
})

swm1("Event", function(etype){
    // event state is kept read-only by forcing
    // a new object for each event.  This may not
    // be appropriate in the long run and we'll
    // have to decide if we simply dont adhere to
    // the read-only restriction of the specification
    this.bubbles =     this.cancelable = true;
    this.cancelled = this.defaultPrevented = false;
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
if(typeof etype == "string") this.type = etype;
})
swmp("Event", null)

Event.prototype.preventDefault = function(){ this.defaultPrevented = true; }

Event.prototype.stopPropagation = function(){ if(this.cancelable)this.cancelled = true; }

// deprecated - I guess - but a lot of people still use it.
Event.prototype.initEvent = function(t, bubbles, cancel) {
this.type = t, this.bubbles = bubbles, this.cancelable = cancel; this.defaultPrevented = false; }

Event.prototype.initUIEvent = function(t, bubbles, cancel, unused, detail) {
this.type = t, this.bubbles = bubbles, this.cancelable = cancel, this.detail = detail; this.defaultPrevented = false; }
Event.prototype.initCustomEvent = function(t, bubbles, cancel, detail) {
this.type = t, this.bubbles = bubbles, this.cancelable = cancel, this.detail = detail; }

sdm2("createEvent", function(unused) { return new Event; })

swm("HashChangeEvent", function(){
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
this.type = "hashchange";
})
HashChangeEvent.prototype = new Event;

swm("MouseEvent", function(etype){
    this.bubbles =     this.cancelable = true;
    this.cancelled = this.defaultPrevented = false;
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
if(typeof etype == "string") this.type = etype;
})
MouseEvent.prototype = new Event;
MouseEvent.prototype.altKey = false;
MouseEvent.prototype.ctrlKey = false;
MouseEvent.prototype.shiftKey = false;
MouseEvent.prototype.metaKey = false;
MouseEvent.prototype.initMouseEvent = function() { this.initEvent.apply(this, arguments)}

swm("PromiseRejectionEvent", function(etype){
    this.bubbles =     this.cancelable = true;
    this.cancelled = this.defaultPrevented = false;
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
if(typeof etype == "string") this.type = etype;
})
PromiseRejectionEvent.prototype = new Event;

swm("CustomEvent", function(etype, o){
alert3("customEvent " + etype + " " + typeof o);
    this.bubbles =     this.cancelable = true;
    this.cancelled = this.defaultPrevented = false;
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
if(typeof etype == "string") this.type = etype;
// This is nowhere documented.
// I'm basing it on some js I saw in the wild.
if(typeof o == "object")
this.name = o.name, this.detail = o.detail;
})
CustomEvent.prototype = new Event;

swm("MediaQueryList", function() {
    this.matches = false;
    this.media = "";
});
swmp("MediaQueryList", null)
MediaQueryList.prototype.addEventListener = mw$.addEventListener;
MediaQueryList.prototype.removeEventListener = mw$.removeEventListener;
MediaQueryList.prototype.nodeName = "MediaQueryList";
MediaQueryList.prototype.addListener = function(f) { this.addEventListener("mediaChange", f, false); };
MediaQueryList.prototype.removeListener = function(f) { this.removeEventListener("mediaChange", f, false); };

swm1("matchMedia", function(s) {
var q = new MediaQueryList;
q.media = s;
q.matches = eb$media(s);
return q;
})

sdm("insertAdjacentHTML", mw$.insertAdjacentHTML)

// Most of the instance method for the Node class are defined
// in the shared window. These are here because they reference
// NodeList or HTMLCollection.

swm("live$wrapper", function(f, start, arg) {
// get the result as an array
var a = f.call(start, arg)
var c = new HTMLCollection(a)
// set an observer to watch the subtree based at start,
// and when children are added or removed, recompute the array.
// This is called a live array.
// It is not yet implemented.
return c})

this.nodep = Node.prototype;
nodep.getElementsByTagName = function(t) { return live$wrapper(mw$.getElementsByTagName, this, t)}
nodep.getElementsByName = function(t) { return live$wrapper(mw$.getElementsByName, this, t)}
nodep.getElementsByClassName = function(t) { return live$wrapper(mw$.getElementsByClassName, this, t)}

nodep.querySelector = querySelector
nodep.querySelectorAll = function(c,s) { return new NodeList(querySelectorAll.call(this,c,s)) }

/*********************************************************************
acid test 48 sets frame.onclick to a string, then expects that function to run
when the frame loads. There are two designs, both are complicated and subtle,
and I'm not sure which one I like better. I implemented the first.
1. Use a setter so that onload = function just carries the function through,
but onload = string compiles the string into a function then sets onload
to the function, as though you had done that in the first place.
2. Allow functions or strings, but dispatch event, and the C event driver,
check to see if it is a function or a string. If a string then compile it.
There is probably a right answer here.
Maybe there is some javascript somewhere that says
a.onclick = "some_function(7,8,9)"; a.onclick();
That would clinch it; 1 is the right answer.
I don't know, but for now I implemented (1),
and hope I don't have to recant some day and switch to (2).
The compiled function has to run bound to this as the current node,
and the current window as global, and trust me, it wasn't easy to set that up!
You can see what I did in handle$cc().
Then there's another complication. For onclick, the code just runs,
but for onsubmit the code is suppose to return true or false.
Mozilla had no trouble compiling and running  return true  at top level.
Duktape won't do that. Return has to be in a function.
So I wrap the code in (function (){ code })
Then it doesn't matter if the code is just expression, or return expression.
Again, look at handle$cc().
*********************************************************************/

; (function() {
var cnlist = ["HTMLElement.prototype", "document", "window"];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i];
// there are lots more events, onmouseout etc, that we don't responnd to,
// should we watch for them anyways?
var evs = ["onload", "onunload", "onclick", "onchange", "oninput",
"onsubmit", "onreset", "onmessage"];
for(var j=0; j<evs.length; ++j) {
var evname = evs[j];
eval('odp(' + cn + ', "' + evname + '$$watch", {value:true})');
// I tried to make this property enumerable within its own set method,
// you assign body.onload and then you should see body.onload, but I couldn't make that work.
// So you don't see body.oonload even if you set it,
// but at least you don't see my mythical body.onload$2
eval('odp(' + cn + ', "' + evname + '", { \
get: function() { return this.' + evname + '$2}, \
set: function(f) { if(db$flags(1)) alert3((this.'+evname+'?"clobber ":"create ") + (this.nodeName ? this.nodeName : "+"+this.dom$class) + ".' + evname + '"); \
if(typeof f == "string") f = my$win().handle$cc(f, this); \
if(typeof f == "function") { Object.defineProperty(this, "' + evname + '$2", {value:f}); \
}}})')
}}})();

// onhashchange from certain places
; (function() {
// also HTMLFrameSetElement which we have not yet implemented
var cnlist = ["HTMLBodyElement.prototype", "SVGElement", "window"];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i];
eval('odp(' + cn + ', "onhashchange$$watch", {value:true})');
eval('odp(' + cn + ', "onhashchange", { \
get: function() { return this.onhashchange$2; }, \
set: function(f) { if(db$flags(1)) alert3((this.onhashchange?"clobber ":"create ") + (this.nodeName ? this.nodeName : "+"+this.dom$class) + ".onhashchange"); \
if(typeof f == "string") f = my$win().handle$cc(f, this); \
if(typeof f == "function") { this.onhashchange$2 = f}}})')
}})();

// Some website expected an onhashchange handler from the get-go.
// Don't know what website, and didn't write it down, but it makes no sense to me!
// Handlers aren't there unless the website puts them there.
// onhashchange = eb$voidfunction;
// If we do need a default handler don't create it as above,
// that leads to confusion; use the get  method.
// get: function() { return this.onhashchange$2 ? this.onhashchange$2 : eb$voidfunction; }

sdm2("createElementNS", function(nsurl,s) {
var mismatch = false;
var u = this.createElement(s);
if(!u) return null;
if(!nsurl) nsurl = "";
u.namespaceURI = new z$URL(nsurl);
// prefix and url have to fit together, I guess.
// I don't understand any of this.
if(!s.match(/:/)) {
// no colon, let it pass
u.prefix = "";
u.localName = s.toLowerCase();
u.tagName = u.nodeName = u.nodeName.toLowerCase();
return u;
}
// There's a colon, and a prefix, and it has to be real.
if(u.prefix == "prefix") {
; // ok
} else if(u.prefix == "html") {
if(nsurl != "http://www.w3.org/1999/xhtml") mismatch = true;
} else if(u.prefix == "svg") {
if(nsurl != "http://www.w3.org/2000/svg") mismatch = true;
} else if(u.prefix == "xbl") {
if(nsurl != "http://www.mozilla.org/xbl") mismatch = true;
} else if(u.prefix == "xul") {
if(nsurl != "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul") mismatch = true;
} else if(u.prefix == "xmlns") {
if(nsurl != "http://www.w3.org/2000/xmlns/") mismatch = true;
} else mismatch = true;
if(mismatch) {
alert3("bad createElementNS(" + nsurl + "," + s + ')');
// throw error code 14
return null;
}
return u;
})

sdm("implementation", {
owner: document,
/*********************************************************************
This is my tentative implementation of hasFeature:
hasFeature: function(mod, v) {
// I'll say edbrowse supports html5
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
if(!tag.match(/^\w+:\w+$/) &&
!tag.match(/^https?:\/\//)) {
// acid 25 says we throw an exception
let e = new Error;
e.code = e.NAMESPACE_ERR;
e.INVALID_ACCESS_ERR = 15;
throw(e);
}
let d = new DocumentType;
// need to set the properties of d based on the parameters of this function
return d;
},
// https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createHTMLDocument
createHTMLDocument: function(t) {
if(t == undefined) t = "Empty"; // the title
var f = this.owner.createElement("iframe");
var d = f.contentDocument; // this is the created document
d.title = t;
return d;
},
createDocument: function(uri, str, t) {
// I don't know if this is right at all, but it's quick and easy
var doc = document.createElementNS(uri, "document");
if(str) {
var below = document.createElementNS(uri, str);
doc.appendChild(below);
}
return doc;
}
})

swm("XMLHttpRequest", mw$.XMLHttpRequest)
// Request, Response, Headers, fetch; link to third party code in master window.
// fetch calls XMLHttpRequest, but puts the Response in a Promise
swm2("Headers", mw$.Headers)
swm2("Request", mw$.Request)
swm2("Response", mw$.Response)
swm2("fetch", mw$.fetch)
// Next function is needed to support await fetch asynchronous
// See the comments in shared.js - look for fetch$onload.
swm2("fetch$onload", function(resolve, x){resolve(x)})

// pages seem to want document.style to exist
sdm("style", new CSSStyleDeclaration)
document.style.element = document;
document.style.bgcolor = "white";

sdm("ELEMENT_NODE", 1)
sdm("TEXT_NODE", 3)
sdm("COMMENT_NODE", 8)
sdm("DOCUMENT_NODE", 9)
sdm("DOCUMENT_TYPE_NODE", 10)
sdm("DOCUMENT_FRAGMENT_NODE", 11)

// originally ms extension pre-DOM, we don't fully support it
//but offer the legacy document.all.tags method.
sdm("all", {})
document.all.tags = function(s) {
return mw$.gebtn(document.body, s.toLowerCase(), false, true);
}

/*********************************************************************
We may want to capture the mod time from the http headers, when we download,
and remember it and use it here. It would be more efficient,
and obviate the case where the head request didn't work for some reason.
But retain only the base html modification time, not js files, css files,
frames on the page, etc.
And update if the page is replaced with another page.
So we have to be a bit careful.
There is also the matter of a local html file. It would be good to grab
the modification time on the file, stat().
That requires a native method, that we could put in the master window;
is there any security risk in doing that?
Meantime, this should serve.
We may want to put it on Document.prototype, not just the primary document,
I don't know if that makes sense.
*********************************************************************/
odp(document, "lastModified", {
get: function() {
return mw$.lastModifiedByHead(this.location);
}});

swm("eb$demin", mw$.deminimize)
swm("eb$watch", mw$.addTrace)
/*
swm("$uv", [])
swm("$uv$sn", 0)
*/
swm2("$jt$c", 'z')
swm2("$jt$sn", 0)

sdm("childNodes", [])
// We'll make another childNodes array belowe every node in the tree.
// document should always and only have two children: DOCTYPE and HTML
odp(document, "firstChild", {
get: function() { return this.childNodes[0]; }});
odp(document, "firstElementChild", {
get: function() { return this.childNodes[1]; }});
odp(document, "lastChild", {
get: function() { return this.childNodes[document.childNodes.length-1]; }});
odp(document, "lastElementChild", {
get: function() { return this.childNodes[document.childNodes.length-1]; }});
odp(document, "nextSibling", {
get: function() { return mw$.getSibling(this,"next"); }});
odp(document, "nextElementSibling", {
get: function() { return mw$.getElementSibling(this,"next"); }});
odp(document, "previousSibling", {
get: function() { return mw$.getSibling(this,"previous"); }});
odp(document, "previousElementSibling", {
get: function() { return mw$.getElementSibling(this,"previous"); }});

/*********************************************************************
Compile a string for a handler such as onclick or onload.
Warning: this is not protected.
set_property_string(anchorObject, "onclick", "snork 7 7")
will run through a setter, which says this is a string to be compiled into
a function, whence a syntax error will cause duktape to abort.
Perhaps every call, or some calls, to set_property_string should be protected,
as I had to do with typeof_property_nat in jseng_duk.c.
Maybe I should bite the bullet and protect the calls to set_property_string.
I already had to work around an abort when setting readyState = "complete",
see this in html.c. It's ugly.
On the other hand, I may want to do something specific when a handler doesn't compile.
Put in a stub handler that returns true or something.
So maybe it's worth having a specific try catch here.
*********************************************************************/

swm("handle$cc", function(f, t) {
var cf; // the compiled function
try {
cf = eval("(function(){" + f + " }.bind(t))");
} catch(e) {
// don't just use eb$nullfunction, cause I'm going to put the source
// onto cf.body, which might help with debugging.
cf = eval("(function(){return true;})");
alert3("handler syntax error <" + f + ">");
}
cf.body = f;
cf.toString = function() { return this.body; }
return cf;
})

// Local storage, this is per window.
// Then there's sessionStorage, and honestly I don't understand the difference.
// This is NamedNodeMap, to take advantage of preexisting methods.
swm("localStorage", {})
swm("sessionStorage", {})
; (function() {
var cnlist = [localStorage, sessionStorage];
for(var i=0; i<cnlist.length; ++i) {
var cn = cnlist[i];
odp( cn, "attributes", { get: function(){ if(!this.attributes$2) {
Object.defineProperty(this, "attributes$2", {value:new NamedNodeMap})
this.attributes$2.owner = this
this.attributes$2.ownerDocument = my$doc()
}
return this.attributes$2}})
// tell me we don't have to do NS versions of all these.
cn.getAttribute = cn.getItem = mw$.getAttribute;
cn.setAttribute = cn.setItem = mw$.setAttribute;
cn.removeAttribute = cn.removeItem = mw$.removeAttribute;
cn.clear = function() {
var l;
while(l = this.attributes.length)
this.removeItem(this.attributes[l-1].name);
}
}
})()

// we seem to be missing Array.item
Array.prototype.item = function(x) { return this[x] };
odp(Array.prototype, "item", { enumerable: false});

// On the first call this setter just creates the url, the location of the
// current web page, But on the next call it has the side effect of replacing
// the web page with the new url.
odp(window, "location", {
get: function() { return window.location$2; },
set: function(h) {
if(!window.location$2) {
window.location$2 = new z$URL(h);
} else {
window.location$2.href = h;
}
}, enumerable:true});
// We need location$2 so we can define origin and replace etc
swm2("location$2", new URL)
odp(location$2, "origin", {get:function(){
return this.protocol ? this.protocol + "//" + this.host : null}});
odp(window, "origin", {get: function(){return location.origin}});
sdm("location$2", new URL)
odp(document, "location", {
get: function() { return this.location$2; },
set: function(h) {
if(!this.location$2) {
this.location$2 = new z$URL(h);
} else {
this.location$2.href = h;
}
}, enumerable:true});
    location.replace = document.location.replace = function(s) { this.href = s};
odp(window.location,'replace',{enumerable:false});
odp(document.location,'replace',{enumerable:false});
odp(window.location,'eb$ctx',{value:eb$ctx});
odp(document.location,'eb$ctx',{value:eb$ctx});

// Window constructor, passes the url back to edbrowse
// so it can open a new web page.
swm("Window", function() {
var newloc = "";
var winname = "";
if(arguments.length > 0) newloc = arguments[0];
if(arguments.length > 1) winname = arguments[1];
// I only do something if opening a new web page.
// If it's just a blank window, I don't know what to do with that.
if(newloc.length)
eb$newLocation('p' + eb$ctx + newloc+ '\n' + winname);
this.opener = window;
})

// window.open is the same as new window, just pass the args through
swm1("open", function() {
return Window.apply(this, arguments);
})

// nasa.gov and perhaps other sites check for self.constructor == Window.
// That is, Window should be the constructor of window.
// The constructor is Object by default.
swm("constructor", Window)

swm("eb$qs$start", function() { mw$.cssGather(true); mw$.frames$rebuild(window);})
swm("frames$rebuild", function() {mw$.frames$rebuild(window);})

swm("DOMParser", mw$.DOMParser)

swm("XMLSerializer", function(){})
XMLSerializer.prototype.serializeToString = function(root) {
alert3("trying to use XMLSerializer");
return "<div>XMLSerializer not yet implemented</div>"; }

swm2("css$ver", 0)
swm2("css_all", "")
swm2("last$css_all", "")
swm2("cssSource", [])
sdm("xmlVersion", 0)

swm("MutationObserver", function(f) {
    // We need to know what window we're in to queue the callback microtask
    this.observed$window = my$win();
    if (typeof f !== "function") throw new TypeError("not a function");
    this.callback = f;
    this.active = false;
    this.targets = new Eb$IterableWeakMap;
    this.async = true; // run as microtask by default
    this.notification$queue = [];
})
swmp("MutationObserver", null)
MutationObserver.prototype.disconnect = function() {
    const ts = this.targets.size;
    const nl = this.notification$queue.length;
    alert3(`MutationObserver disconnecting from ${ts} targets with ${nl} unprocessed records`);
    this.notification$queue.length =  0;
    this.active = false;
    for (const t of this.targets.keys()) {
        alert4(`MutationObserver disconnecting ${t.dom$class} tag ${t.eb$seqno}`);
        // Clear the strong reference in case the observer is being dropped
        t.eb$observers.delete(this);
        // Clear the weak reference in case the observer is being reused
        this.targets.delete(t);
    }
}
MutationObserver.prototype.observe = function(target, cfg) {
    this.observe$target(target, cfg);
    if(cfg.subtree)
        this.observe$subtree(target, cfg);
}
MutationObserver.prototype.observe$target = function (target, cfg, dbg=alert3) {
    // May have other valid targets so don't disconnect
    if(typeof cfg != "object" || !(target instanceof Node))
        throw new TypeError("invalid argument types");
    dbg(`observing ${target.dom$class} tag ${target.eb$seqno} config ${JSON.stringify(cfg)}`)
    this.targets.set(target, cfg);
    this.active = true;
    if (!target.eb$observers) {
        dbg("Attaching first observer");
        Object.defineProperty(target, "eb$observers", {value: new Set});
    }
    target.eb$observers.add(this);
}
MutationObserver.prototype.observe$subtree = function(target, cfg) {
    /* If we're observing subtrees then we need to directly observe those
        targets as well as the idea is that if a subtree is moved we keep
        observing that. We will fix appended children in mutFixup. This also
        means that, if the surrounding scripting doesn't care about this
        observer (i.e. doesn't hold any other strong references) and all its
        targets go away then it'll be cleaned up also. This is per spec, avoids
        a memory leak and makes the mutFixup code much simpler when it comes
        to handling advanced observer use-cases.
    */
    if (target.is$frame) return;
    let a = target.childNodes.slice();
    let i = 0;
    let n;
    while (i < a.length) {
        n = a[i++];
        if (!this.targets.has(n)) this.observe$target(n, cfg, alert4);
        if (n.is$frame) continue;
        if (n.childNodes) a.push(...n.childNodes);
    }
}
MutationObserver.prototype.takeRecords = function() {
    // Shallow clone as the records must refer to the DOM and are otherwise safe
    const ret = this.notification$queue.slice();
    /* Drop our copy of the records as we've processed them now and don't want
        to be impacted by external changes. */
    this.notification$queue.length = 0;
    return ret;
}

swm("MutationRecord", function(){})
swmp("MutationRecord", null)
swm1("crypto", {})
crypto.getRandomValues = function(a) {
if(typeof a != "object") return NULL;
var l = a.length;
for(var i=0; i<l; ++i) a[i] = Math.floor(Math.random()*0x100000000);
return a;
}

swm2("ra$step", 0)
swm1("requestAnimationFrame", function() {
// This absolutely doesn't do anything. What is edbrowse suppose to do with animation?
return ++ra$step;
})

swm1("cancelAnimationFrame", eb$voidfunction)

// link in the blob code
swm("Blob", mw$.Blob)
swm("File", mw$.File)
swm("FileReader", mw$.FileReader)
URL.createObjectURL = mw$.URL.createObjectURL
URL.revokeObjectURL = mw$.URL.revokeObjectURL
swm("FormData", mw$.FormData)
swm("TextEncoder", mw$.TextEncoder)
swm("TextDecoder", mw$.TextDecoder)
swm("MessagePort", mw$.MessagePort)
swm("MessageChannel", mw$.MessageChannel)
swm("mp$registry", []) // MessagePort registry
swm2("URLSearchParams", mw$.URLSearchParams)

swm("trustedTypes", function(){})
trustedTypes.createPolicy = function(pn,po){
var x = {policyName: pn};
for (var i in po) { x[i] = po[i]}
return x;
}
swm("AbortSignal", function(){})
AbortSignal.prototype = new EventTarget;
AbortSignal.prototype.aborted = false;
AbortSignal.prototype.reason = 0;
AbortSignal.prototype.throwIfAborted = eb$voidfunction;
AbortSignal.abort = function(){ var c = new AbortSignal(); c.aborted = true; return c; }
AbortSignal.timeout = function(ms){ var c = new AbortSignal();
// this is suppose to abort after a timeout period but I don't know how to do that
if(typeof ms == "number") alert3("abort after " + ms + "ms not implemented");
return c; }

swm("AbortController", function(){})
odp(AbortController.prototype, "signal",
{get:function(){return new AbortSignal}});
AbortController.prototype.abort = function(){
alert3("abort dom request not implemented"); }

/* quickjs-ng has a native implementation of queueMicrotask but quickjs
doesn't currently */
if (!window.queueMicrotask) {
    alert3("Using fallback for queueMicrotask");
    swm1("queueMicrotask", function(f) {
        if (typeof f !== "function") throw new TypeError("not a function");
/* Per the spec we need to wait until after the caller's executed but before
timers. This means we need to simulate with promises but the error handling
isn't quite right as I can't find a way to rethrow outside the promise chain.
This is simple and closer to the spec than we have been but better is to use the
implementation provided by quickjs-ng. */
        Promise.resolve().then(f).catch(
            (e) => alert3("Error in microtask: " + e)
        );
    });
}

swm("IntersectionObserverEntry", function(){})
swm("IntersectionObserver", function(callback, o){
this.callback = callback, this.root = null;
var h = 1.0;
if(typeof o == "object") {
if(o.root) this.root = o.root;
if(o.threshold) h = o.threshold;
}
var alertstring = "intersecting " + (this.root ? this.root : "viewport");
if(typeof h == "number") alertstring += " with threshold " + h;
else if(Array.isArray(h)) {
alertstring += " with threshold [";
for(var i = 0; i < h.length; ++i) {
var n = h[i];
if(i) alertstring += ',';
if(typeof n == "number") alertstring += n;
}
alertstring += ']';
}
alert3(alertstring);
})
/*********************************************************************
This is just trying to get something off the ground.
Assume our target is always visible.
I don't even know what visible means in edbrowse.
You have printed, or asked for, a line in the target area?
And what percentage of that target area is visible,
just because you printed a line therein?
This stuff is so visual it's almost impossible to simulate with any fidelity.
So for a start, everything is visible, and that might cause the
website to load anything you might ever look at or scroll down to,
making edbrowse even slower than it already is. But it's a start.
*********************************************************************/
IntersectionObserver.prototype.observe = function(t) {
var alertstring = "intersect with " + t;
if(t.eb$seqno) alertstring += "." + t.eb$seqno;
alert3(alertstring);
var e = new IntersectionObserverEntry;
e.target = t;
e.isIntersecting = true; // target is visible
e.intersectingRatio = 1.0; // the whole target is visible
// bounding rectangle is just the whole damn screen,
// hope nobody ever looks at it or expects it to be real.
e.boundingClientRect = this.root ? this.root.getBoundingClientRect() : document.getBoundingClientRect();
// I don't even know what these are!
e.rootBounds = e.intersectionRect = e.boundingClientRect;
// I guess we're ready to roll
queueMicrotask(() => this.callback([e]));
// in edbrowse the target remains visible forever, callback will never be called again.
// We don't have to remember target or the conditions of intersection etc.
}
IntersectionObserver.prototype.disconnect = eb$voidfunction
IntersectionObserver.prototype.unobserve = eb$voidfunction

// more visual stuff. But nothing resizes in edbrowse, ever,
// so this should be easy to stub out.
swm("ResizeObserver", function(){})
ResizeObserver.prototype.disconnect = eb$voidfunction;
ResizeObserver.prototype.observe = eb$voidfunction;
ResizeObserver.prototype.unobserve = eb$voidfunction;

// don't need these any more
;(function() {
    let names_to_delete = ["odp",
    "swm", "swm1", "swm2", "swmp",
    "sdm", "sdm1", "sdm2", "nodep"];
    for (let i in names_to_delete) delete window[names_to_delete[i]];
})();
