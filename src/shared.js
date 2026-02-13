// stringname=sharedJS
/*********************************************************************
Javascript that loads and runs in the master window.
Functions and classses defined here can be shared by all the edbrowse windows,
if we're very careful!
We have to make sure nothing can be hijacked, starting with the Object.
Nail down all functions and prototypes in this window.
First, some code that lets you run this stand alone, as a syntax check.
qjs -C shared.js
*********************************************************************/
"use strict";

// share = 2 means this is run from edbrowse, share is created natively
// share = 1 means we are running this standalone
// share = 0 means we are running startwindow standalone and it created share = 0
if(!this.share) this.share = 1;

if(!this.puts) {
    this.puts = (s) => undefined;
}

Object.defineProperty(this, "self",{writable:false,configurable:false,value:this});

Object.defineProperty(this, "Object",{writable:false,configurable:false});
Object.defineProperty(Object, "prototype",{writable:false,configurable:false});
// URLSearchParams displaces toString, so we can't nail down
// Object.prototype.toString until that has run.
// Object.defineProperty(Object.prototype, "toString",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Object.prototype, "toLocaleString",{enumerable:false,writable:false,configurable:false});
// demin.js sets constructor to Object, which it was before, but that means,
// I can't nail this down until demin.js has run its course.
// Object.defineProperty(Object.prototype, "constructor",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Object.prototype, "valueOf",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Object.prototype, "hasOwnProperty",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Object.prototype, "isPrototypeOf",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Object.prototype, "propertyIsEnumerable",{enumerable:false,writable:false,configurable:false});

Object.defineProperty(this, "Function",{writable:false,configurable:false});
Object.defineProperty(Function, "prototype",{writable:false,configurable:false});
Object.defineProperty(Function.prototype, "call",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Function.prototype, "apply",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Function.prototype, "bind",{enumerable:false,writable:false,configurable:false});
// I overwrite toString in some cases, so can't nail this down until later
// Object.defineProperty(Function.prototype, "toString",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Function.prototype, "constructor",{enumerable:false,writable:false,configurable:false});

this.alert = puts;
// print an error inline, at debug level 3 or higher.
function alert3(s) { logputs(3, s); }
function alert4(s) { logputs(4, s); }

// Dump the tree below a node, this is for debugging.
// Print the first line of text for a text node, and no braces
// because nothing should be below a text node.
// You can make this more elaborate and informative if you wish.
function dumptree(top) {
var nn = top.nodeName;
var r = "";
var extra = "";
if(nn === "#text" && top.data) {
extra = top.data;
extra = extra.replace(/^[ \t\n]*/, "");
var l = extra.indexOf('\n');
if(l >= 0) extra = extra.substr(0,l);
if(extra.length > 120) extra = extra.substr(0,120);
}
if(nn === "OPTION" && top.value)
extra = top.value;
if(nn === "OPTION" && top.text) {
if(extra.length) extra += ' ';
extra += top.text;
}
if(nn === "A" && top.href)
extra = top.href.toString();
if(nn === "BASE" && top.href)
extra = top.href.toString();
if(extra.length) extra = ' ' + extra;
// some tags should never have anything below them so skip the parentheses notation for these.
if((nn == "BASE" || nn == "META" || nn == "LINK" ||nn == "#text" || nn == "IMAGE" || nn == "OPTION" || nn == "INPUT" || nn == "SCRIPT") &&
(!top.childNodes || top.childNodes.length == 0)) {
r += nn + extra + '\n';
return r;
}
r += nn + "{" + extra + '\n';
if(top.is$frame) {
if(top.eb$expf) r += top.contentWindow.dumptree(top.contentDocument);
} else if(top.childNodes) {
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
r += dumptree(c);
}
}
r += '}\n';
return r;
}

function uptrace(t) {
var r = "";
while(t) {
var msg = t.nodeName;
let tc = t.getAttribute("class")
if(tc) msg += "." + tc;
if(t.id) msg += "#" + t.id;
r += msg + '\n'
t = t.parentNode;
}
return r;
}

function by_esn(n) {
if(typeof n != "number") { alert("numeric argument expected"); return; }
var a = gebtn(my$doc(), "*", true, true)
for(var i = 0; i < a.length; ++i)
if(a[i].eb$seqno === n) return a[i];
return null;
}

/*********************************************************************
Show the scripts, where they come from, type, length, whether deminimized.
This uses document.scripts and getElementsByTagname() so you see
all the scripts, hopefully, not just those that were in the original html.
The list is left in $ss for convenient access.
my$win() is used to get the window of the running context, where you are,
rather than this window, which is often not what you want.
*********************************************************************/

function showscripts() {
var i, s, m;
var w = my$win(), d = my$doc();
var slist = [];
for(i=0; i<d.scripts.length; ++i) {
s = d.scripts[i];
s.from$html = true;
slist.push(s);
}
var getlist = gebtn(d, "script", true, true)
for(i=0; i<getlist.length; ++i) {
s = getlist[i];
if(!s.from$html) slist.push(s);
}
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
if(typeof s.text === "string")
m += " length " + s.text.length;
else
m += " length ?";
if(s.expanded) m += " deminimized";
alert(m);
}
w.$ss = slist;
}

function showframes() {
var i, s, m;
var w = my$win(), d = my$doc();
var slist = gebtn(d, "iframe", true, true);
for(i=0; i<slist.length; ++i) {
s = slist[i];
m = i + ": cx" + (s.eb$expf ? s.contentWindow.eb$ctx : "?") + " " + s.src;
// anything else worth printing here?
alert(m);
}
w.$ff = slist;
}

function searchscripts(t) {
var w = my$win();
if(!w.$ss) showscripts();
for(var i=0; i<w.$ss.length; ++i)
if(w.$ss[i].text && w.$ss[i].text.indexOf(t) >= 0) alert(i);
}

function snapshot() {
var w = my$win();
// wlf is native to support the snapshot functionality: write local file.
wlf('<base href="' + w.eb$base + '">\n', "from");
var jslocal = "";
var idx = 0;
if(!w.$ss) showscripts();
for(var i=0; i<w.$ss.length; ++i) {
var s = w.$ss[i];
if(typeof s.text === "string" &&
(s.src && s.src.length || s.expanded)) {
var ss = "inline";
if(s.src && s.src.length) ss = s.src.toString();
if(ss.match(/^data:/)) continue;
++idx;
wlf(s.text, "f" + idx + ".js");
jslocal += "f" + idx + ".js:" + ss + "\n";
}
}
idx = 0;
for(var i=0; i<w.cssSource.length; ++i) {
var s = w.cssSource[i];
if(typeof s.data === "string" && s.data.length &&
s.src && s.src.length) {
var ss = s.src.toString();
++idx;
wlf(s.data, "f" + idx + ".css");
jslocal += "f" + idx + ".css:" + ss + "\n";
}
}
wlf(jslocal, "jslocal");
alert("bye   ub   ci+   /<head/r from   w base   q");
}

function set_location_hash(h)
{
    h = `#${h}`;
    const w = my$win();
    const d = my$doc();
    const body = d.body;
    let loc = w.location$2;
    // save the old url, but I don't know if it's a URL or a string
    const oldURL = loc.toString();
    loc.hash$val = h;
    loc.href$val = loc.href$val.replace(/#.*/, "") + h;
    const newURL = loc.toString();
    loc = d.location$2;
    loc.hash$val = h;
    loc.href$val = loc.href$val.replace(/#.*/, "") + h;
    let e = new w.HashChangeEvent;
    e.oldURL = oldURL;
    e.newURL = newURL;
    w.dispatchEvent(e);
    body.dispatchEvent(e);
}

// run an expression in a loop.
function aloop(s$$, t$$, exp$$) {
if(Array.isArray(s$$)) {
aloop(0, s$$.length, t$$);
return;
}
if(typeof s$$ !== "number" || typeof t$$ !== "number" || typeof exp$$ !== "string") {
alert("aloop(array, expression) or aloop(start, end, expression)");
return;
}
exp$$ = "for(var i=" + s$$ +"; i<" + t$$ +"; ++i){" + exp$$ + "}";
my$win().eval(exp$$);
}

function showarg(x) { 
var l, w = my$win ? my$win() : window;
// null comes out as an object
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
if(x.dom$class === "URL") return "URL(" + x.toString() + ")";
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

// document.head, document.body; shortcuts to head and body.
function getElement() {
  var e = this.lastChild;
if(!e) { alert3("missing documentElement node"); return null; }
if(e.nodeName.toUpperCase() != "HTML") alert3("html node name " + e.nodeName);
return e
}

function getHead() {
 var e = this.documentElement;
if(!e) return null;
// In case somebody adds extra nodes under <html>, I search for head and body.
// But it should always be head, body.
for(var i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName.toUpperCase() == "HEAD") return e.childNodes[i];
alert3("missing head node"); return null;
}

function setHead(h) {
 var i, e = this.documentElement;
if(!e) return;
for(i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName.toUpperCase() == "HEAD") break;
if(i < e.childNodes.length) e.removeChild(e.childNodes[i]); else i=0;
if(h) {
if(h.nodeName.toUpperCase() != "HEAD") { alert3("head replaced with node " + h.nodeName); h.nodeName = "HEAD"; }
if(i == e.childNodes.length) e.appendChild(h);
else e.insertBefore(h, e.childNodes[i]);
}
}

function getBody() {
 var e = this.documentElement;
if(!e) return null;
for(var i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName.toUpperCase() == "BODY") return e.childNodes[i];
alert3("missing body node"); return null;
}

function setBody(b) {
 var i, e = this.documentElement;
if(!e) return;
for(i=0; i<e.childNodes.length; ++i)
if(e.childNodes[i].nodeName.toUpperCase() == "BODY") break;
if(i < e.childNodes.length) e.removeChild(e.childNodes[i]);
if(b) {
if(b.nodeName.toUpperCase() != "BODY") { alert3("body replaced with node " + b.nodeName); b.nodeName = "BODY"; }
if(i == e.childNodes.length) e.appendChild(b);
else e.insertBefore(b, e.childNodes[i]);
}
}

function getRootNode(o) {
var composed = false;
if(typeof o == "object" && o.composed)
composed = true;
var t = this;
while(t) {
if(t.nodeName == "#document") return t;
if(!composed && t.nodeName == "SHADOWROOT") return t;
t = t.parentNode;
}
alert3("getRootNode no root found");
return null;
}

// wrapper to turn function blah{ my js code } into function blah{ [native code] }
// This is required by sanity tests in jquery and other libraries.
function wrapString() {
return Object.toString.bind(this)().replace(/\([\u0000-\uffff]*/, "() {\n    [native code]\n}");
}

// implementation of getElementsByTagName, getElementsByName, and getElementsByClassName.
// The return is an array, and you might put weird things on Array.prototype,
// and then expect to use them, so let's return your Array.

function getElementsByTagName(s) {
if(!s) { // missing or null argument
alert3("getElementsByTagName(type " + typeof s + ")");
return new (my$win().Array);
}
s = s.toLowerCase();
return gebtn(this, s, true, false);
}

function gebtn(top, s, first, all) {
var a = new (my$win().Array);
// The result should be all nodes, no texts, no comments.
// And I don't believe we should descend into a document or document fragment,
// although that is not clear. Of course the top node
// can be document, we call document.getElementsByTagName all the time.
// That said, sometimes I want all the nodes, for internal use.
if(!first && !all && top.nodeType != 1) return a;
if(!first && (s === '*' || (top.nodeName && top.nodeName.toLowerCase() === s)))
a.push(top);
if(top.childNodes) {
// don't descend into another frame.
// The frame has no children through childNodes, so we don't really need this line.
if(!top.is$frame)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(gebtn(c, s, false, all));
}
}
return a;
}

function getElementsByName(s) {
if(!s) { // missing or null argument
alert3("getElementsByName(type " + typeof s + ")");
return new (my$win().Array);
}
return gebn(this, s, true);
}

function gebn(top, s, first) {
var a = new (my$win().Array);
if(!first && top.nodeType != 1) return a;
if(!first && (s === '*' || top.name === s))
a.push(top);
if(top.childNodes) {
if(!top.is$frame)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(gebn(c, s, false));
}
}
return a;
}

function getElementById(s) {
    if(!s) { // missing or null argument
        alert3("getElementById(type " + typeof s + ")");
        return null;
    }
    // this is the document object here
    const gebi_hash = this.id$hash;
    // efficiency, see if we have hashed this id
    const r = gebi_hash.get(s);
    if(r) {
        // Does it still exist?
        let t = r.deref();
        if (t) {
            // is it still rooted?
            for(let u = t.parentNode; u; u = u.parentNode)
                if(u == this) return t;
        }
        gebi_hash.delete(s);
    }
    // look for nonsense to build up the hash
    alert3("getElementById triggering id hash build");
    gebi(this, this, "*@%impossible`[]")
    let ref = gebi_hash.get(s);
    let e;
    if(ref) e = ref.deref();
    return e ? e : null;
}

function gebi(d, top, s) {
    if (top.id) {
        const gebi_hash = d.id$hash;
        const gebi_registry = d.id$registry;
        gebi_hash.set(top.id, new (my$win()).WeakRef(top));
        gebi_registry.register(top, top.id);
        if (top.id == s) return top;
    }
    if (top.childNodes) {
        // don't descend into another frame.
        // The frame has no children through childNodes, so we don't really need this line.
        if (top.is$frame) return null;
        for (let i in top.childNodes) {
            let c = top.childNodes[i];
            let res = gebi(d, c, s);
            if (res) return res;
        }
    }
    return null;
}

function getElementsByClassName(s) {
if(!s) { // missing or null argument
alert3("getElementsByClassName(type " + typeof s + ")");
return new (my$win().Array);
}
s = s . replace (/^\s+/, '') . replace (/\s+$/, '');
if(s === "") return new (my$win().Array);
var sa = s.split(/\s+/);
return gebcn(this, sa, true);
}

function gebcn(top, sa, first) {
var a = new (my$win().Array);
if(!first && top.nodeType != 1) return a;
if(!first && top.cl$present) {
var ok = true;
for(var i=0; i<sa.length; ++i) {
var w = sa[i];
if(w === '*') { ok = true; break; }
if(!top.classList.contains(w)) { ok = false; break; }
}
if(ok) a.push(top);
}
if(top.childNodes) {
if(!top.is$frame)
for(var i=0; i<top.childNodes.length; ++i) {
var c = top.childNodes[i];
a = a.concat(gebcn(c, sa, false));
}
}
return a;
}

function nodeContains(n) {  return cont(this, n); }

function cont(top, n) {
if(top === n) return true;
if(!top.childNodes) return false;
if(top.is$frame) return false;
for(var i=0; i<top.childNodes.length; ++i)
if(cont(top.childNodes[i], n)) return true;
return false;
}

function dispatchEvent (e) {
    let dbg = () => undefined;
    const runEventHandler = (n, h) => {
        e.currentTarget = n;
        const inline = typeof h == "function";
        // handler info for debug
        const hd = inline ? "inline handler" : `handler ${h.ehsn}`;
        let f;
        if (inline) {
            // already bound or caller doesn't want it to be
            if (typeof h == "function") f = h;
            // Ensure the binding is correct
            else if (typeof h == "string") f = () => eval.call(n, h);
        }
        // Should be bound to the node
        else if (typeof h.callback == "function") f = h.callback.bind(n);
        // An object method, don't muck with the binding
        else if (typeof h.callback == "object") f = h.callback.handleEvent;
        if (!f) {
            dbg(`could not find callback for ${hd}`, n);
            return !e.stop$propagating$immediate; // null listeners are allowed
        }
        if (!(inline || h.do$phases.has(e.eventPhase))) {
            dbg(`Unsupported phase ${e.eventPhase} for ${hd}`, n, 4);
            dbg(
                `${hd} supported: ${JSON.stringify(Array.from(h.do$phases))}`,
                n, 4);
            return !e.stop$propagating$immediate;
        }
        dbg(`fires ${hd}`, n);
        let r = f(e);
        // Events added by listeners ignore return values these days
        if (inline) {
            const special = e.type === "error";
            if (r === undefined) r = true;
            if ((!special && !r) || (special && r)) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            return !e.stop$propagating$immediate;
        }
        h.ran = true;
        if (h.do$once) {
            dbg(`Remove one-shot ${hd}`, n);
            n.removeEventListener(e.type, h.callback, h.do$phases.has(1));
        }
        return !e.stop$propagating$immediate;
    }

    const runHandlerArray = (n) => {
        const prop = `on${e.type}$$array`;
        const handlers = n[prop];
        if (handlers) {
            // We want to log which handlers ran for debugging
            handlers.forEach((h) => h.ran = false);
            handlers.slice().every((h) => runEventHandler(n, h));
        }
        return !e.stop$propagating;
    }

const runAllHandlers = (n) => {
        const ep = `on${e.type}`;
        const hi = n[ep];
        if (hi && !runEventHandler(n, hi)) return false;
        return runHandlerArray(n);
    }

    if(db$flags(1))
        dbg = (m, n=this, l=3) => {
            const phases = ["dispatch", "capture", "target", "bubble"];
            const prefix = `dispatchEvent ${n.nodeName}.${e.type}`;
            const phase = phases[e.eventPhase];
            logputs(l, `${prefix} tag ${n.eb$seqno} phase ${phase}: ${m}`);
        };
    e.eventPhase = 0;
    e.target = this;
    const pathway = [];
    if (this.nodeType !== undefined) {
        let t;
        for (t = this; t; t = t.parentNode) {
            pathway.push(t);
            // don't go past document up to a higher frame
            if(t.nodeType == 9) break;
        }
        /* Allow events to bubble up to the window. We need to use defaultView
        from the document object (which we should be looking at) because we may
        be in a frame but dispatchEvent is running in the main window and we
        want to stop bubbling at the frame boundary not the window returned by
        my$win(). */
        pathway.push(t.defaultView);
    } else {
        // no node type so assume it's a window or similar, just a target
        pathway.push(this);
    }
    const states = [
        // Initial phase, nothing to do here
        () => true,
        // Capture phase: outer to inner elements
        () => {
            if (e.eb$captures)
                return pathway.slice(1).reverse().every(runHandlerArray);
            else {
                dbg("not capturing");
                return true;
            }
        },
        // target phase
        () => runAllHandlers(pathway[0]),
        // Bubble phase, inner to outer
        () => {
            if (e.bubbles)
                return pathway.slice(1).every(runAllHandlers);
            else {
                dbg("not bubbling");
                return true;
            }
        }
    ];
    states.every((cb, i) => {
        e.eventPhase = i;
        dbg("start");
        const rc = cb();
        dbg(`end (${rc})`);
        return rc;
    });

    /* We return the logical negation of defaultPrevented as per spec a false
        return means to prevent the default action whereas the
        defaultPrevented property is specified to be true if the default action
        was, or is to be, prevented
    */
    dbg(`default prevented ${e.defaultPrevented}`);
    return !e.defaultPrevented;
}

/*********************************************************************
This is our addEventListener function.
It needs to be bound to window, document and to other nodes via
class.prototype.addEventListener = addEventListener,
to cover all the instantiated objects in one go. A similar design applies for removeEventListener.
This is frickin complicated, so use dbev+ to debug it.
*********************************************************************/

function addEventListener(ev, handler, iscapture) {
    return eb$listen.call(this, ev, handler, iscapture);
}
function removeEventListener(ev, handler, iscapture) {
    return eb$unlisten.call(this, ev, handler, iscapture, true);
}

function eb$listen(evtype, handler, iscapture)
{
    const h = {};
    h.do$phases = new Set;
    if (typeof handler == "function") h.callback = handler;
    else if (typeof handler == "object" && typeof h.handleEvent == "function")
        h.callback = handler;
    else throw TypeError("Invalid event handler");
    h.do$phases.add(2);
    const ev = `on${evtype}`;
    const evarray = `${ev}$$array`; // array of handlers
    // legacy, iscapture could be boolean, or object, or missing
    let captype = typeof iscapture;
    if (captype == "boolean" && iscapture) h.do$phases.add(1);
    if (captype == "object") {
        if (iscapture.capture || iscapture.useCapture) h.do$phases.add(1);
        if (iscapture.once) h.do$once = true;
        if (iscapture.passive) h.do$passive = true; // don't know how to implement this yet
    }
    if (!h.do$phases.has(1)) h.do$phases.add(3);
    // event handler serial number, for debugging
    if (!h.ehsn) h.ehsn = db$flags(4);
    if (db$flags(1))
        alert3(`listen ${this.nodeName}.${ev} tag ${this.eb$seqno} handler ${h.ehsn} for ${(h.do$phases.has(1)?"capture":"bubble")}`);

    if (!this[evarray])
        Object.defineProperty(this, evarray, {value: []})

    /* Duplicate handlers are allowed and are sometimes deliberately used although
    they're generally not recommended. It's also really hard to reliably deduplicate
    handlers these days with modern coding practices. As such I'm not sure what
    other sanity checks we can or should do which won't break things. */
    this[evarray].push(h);
}

// here is unlisten, the opposite of listen.
// what if every handler is removed and there is an empty array?
// the assumption is that this is not a problem.
function eb$unlisten(evtype, handler, iscapture, addon)
{
    let dbg = () => undefined;
    const ev = `on${evtype}`;
    if (db$flags(1))
        dbg = (m) => alert3(
            `unlisten ${this.nodeName}.${ev} tag ${this.eb$seqno}: ${m}`
        );
    const evarray = ev + "$$array";
    if(this[ev] == handler) {
        dbg("removing inline handler");
        delete this[ev];
        return;
    }
    // If other events have been added, check through the array.
    const target_phase = iscapture ? 1 : 3;
    if(this[evarray]) {
        const a = this[evarray];
        for(let i = 0; i < a.length; ++i) {
            const h = a[i];
            if(h.callback == handler && h.do$phases.has(target_phase)) {
                dbg(`removing handler ${h.ehsn}`);
                a.splice(i, 1);
                return;
            }
        }
    }
}

// Here comes the Iterator and Walker.
// I wouldn't bother, except for some tests in acid3.
this.NodeFilter = {
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
// created object is in the master context; is that ever a problem?
function createNodeIterator(root, mask, callback, unused) {
var o = {}; // the created iterator object
if(typeof callback != "function") callback = null;
o.callback = callback;
if(typeof mask != "number")
mask = 0xffffffff;
// let's reuse some software
if(typeof root == "object") {
o.list = gebtn(root, "*", false, true)
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
if(nt == 9 && !(mask&NodeFilter.SHOW_DOCUMENT)) alive = false;
if(nt == 3 && !(mask&NodeFilter.SHOW_TEXT)) alive = false;
if(nt == 1 && !(mask&NodeFilter.SHOW_ELEMENT)) alive = false;
if(nt == 11 && !(mask&NodeFilter.SHOW_DOCUMENT_FRAGMENT)) alive = false;
if(nt == 8 && !(mask&NodeFilter.SHOW_COMMENT)) alive = false;
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

function createTreeWalker(root, mask, callback, unused) {
var o = {}; // the created iterator object
if(typeof callback != "function") callback = null;
o.callback = callback;
if(typeof mask != "number")
mask = 0xffffffff;
if(typeof root == "object") {
o.list = gebtn(root, "*", false, true)
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
if(nt == 9 && !(mask&NodeFilter.SHOW_DOCUMENT)) alive = false;
if(nt == 3 && !(mask&NodeFilter.SHOW_TEXT)) alive = false;
if(nt == 1 && !(mask&NodeFilter.SHOW_ELEMENT)) alive = false;
if(nt == 11 && !(mask&NodeFilter.SHOW_DOCUMENT_FRAGMENT)) alive = false;
if(nt == 8 && !(mask&NodeFilter.SHOW_COMMENT)) alive = false;
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
if(typeof this.currentNode != "object") return null;
var a = incr > 0 ? this.currentNode.firstChild : this.currentNode.lastChild;
while(a) {
if(this.list.indexOf(a) >= 0) {
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
a = incr > 0 ? a.nextSibling : a.previousSibling;
}
return null;
}
o.firstChild = function() { return this.endkid(1); }
o.lastChild = function() { return this.endkid(-1); }
o.nextkid = function(incr) {
if(typeof this.currentNode != "object") return null;
var a = incr > 0 ? this.currentNode.nextSibling : this.currentNode.previousSibling;
while(a) {
if(this.list.indexOf(a) >= 0) {
var rc = NodeFilter.FILTER_ACCEPT;
if(this.callback) rc = this.callback(a);
if(rc == NodeFilter.FILTER_ACCEPT) { this.currentNode = a; return a; }
}
a = incr > 0 ? a.nextSibling : a.previousSibling;
}
return null;
}
o.nextSibling = function() { return this.nextkid(1); }
o.previousSibling = function() { return this.nextkid(-1); }
o.parentNode = function() {
if(typeof this.currentNode != "object") return null;
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

function logtime (debug, level, obj) {
var today=new Date;
var h=today.getHours();
var m=today.getMinutes();
var s=today.getSeconds();
// add a zero in front of numbers<10
if(h < 10) h = "0" + h;
if(m < 10) m = "0" + m;
if(s < 10) s = "0" + s;
logputs(debug, "console " + level + " [" + h + ":" + m + ":" + s + "] " + obj);
}

this.defport = {
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

// use by the css system and the dataset system
function camelCase(t) {
return t.replace(/-./g, function(f){return f[1].toUpperCase()});
}
function dataCamel(t) { return camelCase(t.replace(/^data-/,"")); }
function uncamelCase(t) {
return t.replace(/([a-z])([A-Z])/g, function(f,a,b){return a+'-'+b.toLowerCase()});
}

function isabove(a, b) {
var j = 0;
while(b) {
if(b == a) { var e = new Error; e.HIERARCHY_REQUEST_ERR = e.code = 3; throw e; }
if(++j == 1000) { alert3("isabove loop"); break; }
b = b.parentNode;
}
}

// Functions that support classList
function classListRemove() {
for(var i=0; i<arguments.length; ++i) {
for(var j=0; j<this.length; ++j) {
if(arguments[i] != this[j]) continue;
this.splice(j, 1);
--j;
}
}
this.node.setAttribute("class", this.join(' '));
}

function classListAdd() {
for(var i=0; i<arguments.length; ++i) {
for(var j=0; j<this.length; ++j)
if(arguments[i] == this[j]) break;
if(j == this.length) this.push(arguments[i]);
}
this.node.setAttribute("class", this.join(' '));
}

function classListReplace(o, n) {
if(!o) return;
if(!n) { this.remove(o); return; }
for(var j=0; j<this.length; ++j)
if(o == this[j]) { this[j] = n; break; }
this.node.setAttribute("class", this.join(' '));
}

function classListContains(t) {
if(!t) return false;
for(var j=0; j<this.length; ++j)
if(t == this[j]) return true;
return false;
}

function classListToggle(t, force) {
if(!t) return false;
if(arguments.length > 1) {
if(force) this.add(t); else this.remove(t);
return force;
}
if(this.contains(t)) { this.remove(t); return false; }
this.add(t); return true;
}

function classList(node) {
var c = node.getAttribute("class");
if(!c) c = "";
// turn string into array
var a = c.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/);
// remember the node you came from
a.node = node;
// attach functions
a.remove = classListRemove;
a.add = classListAdd;
a.replace = classListReplace;
a.contains = classListContains;
a.toggle = classListToggle;
return a;
}

/*********************************************************************
I'm going to call Fixup from appendChild, removeChild, setAttribute,
anything that changes something we might be observing.

Gather the list of mutation records (notifications from some perspectives) in
the observer and queue the callback if needed. Importantly the callback happens
async to the current script but before timers etc as a microtask. This means
that multiple calls to this function from various parts of the currently running
script (task) will gather records. The idea is that this happens and then the
callback fires once and handles the lot. This is important because there are
cases where takeRecords can be called prior to the callback being called which
then means the records are not acted upon.

Support functions mrKids and mrList are below.
*********************************************************************/

function mutFixup(b, isattr, y, z) {
    const w = my$win();
    let w2; // might not be the same window as w
    // frames is a live array of windows.
    // Test: a change to the tree, and the base node is rooted,
    // and the thing added or removed is a frame or an array or it has frames below.
    if(!isattr && (w2 = isRooted(b))) {
        const j = typeof y == "object" ? y : z;
        if(Array.isArray(j) || j.is$frame || (j.childNodes&&gebtn(j, "iframe", true, false).length))
            frames$rebuild(w2);
    }
    /* Observers only look downward through the tree and we know that we will
        have propagated them because, on construction, we handle subtrees and
        then this function is called on targets with changed children. We don't
        need to handle removing targets because either a removed node is gone
        and will drop out of the observer or it's been moved and we should keep
        observing it anyway. What this means is that we can safely just check
        the list of observers on target and fix the subtree ones as we go.
    */
    const observers = b.eb$observers
    if (!observers) return;

    /* No need to make a copy since even if a sync observer disconnects itself
        the set iteration is specified to be consistent
    */
    for(const o of observers) {
        if(!o.active) {
            // not sure if this happens now but may be someone did something
            // unfortunate
            alert3("mutFixup: disconnecting inactive observer");
            o.disconnect();
            continue;
        }

        const record = (function() {
            let target_cfg = o.targets.get(b);
            if (!target_cfg) return null;
            const r = new o.observed$window.MutationRecord;
            if(isattr) { // the easy case
                if(target_cfg.attributes) {
                    r.type = "attributes";
                    r.attributeName = y;
                    r.target = b;
                    if (target_cfg.attributeOldValue) r.oldValue = z;
                    return r;
                }
                return null;
            }
            // ok a child of b has changed; fix up the subtree even if we aren't observing child node changes
            if (target_cfg.subtree) o.observe$subtree(b, target_cfg);
            if(target_cfg.childList) {
                mrKids(r, b, y, z);
                return r;
            }
            return null;
        })();
        if (!record) continue;
        const nl = o.notification$queue.length;
        if(isattr) alert3(`notify[${nl}] ${b.dom$class} tag ${b.eb$seqno} attribute ${y}`);
        else alert3(`notify[${nl}] ${b.dom$class} tag ${b.eb$seqno} children`);
        o.notification$queue.push(record);
        if (o.callback$queued) {
            alert3("mutFixup: callback already queued");
            continue;
        }
        if(!o.async) {
            // Only for our internal use in implementing live collections.
            alert3(`mutFixup: synchronously processing ${nl+1} records`);
            o.callback.call(o, o.takeRecords(), o);
            continue;
        }
        // the default behavior, call microtask and do it asynchronously
        o.observed$window.queueMicrotask(
            () => {
                o.callback$queued = false;
                const nl = o.notification$queue.length;
                if (!o.active) {
                    alert3("mutFixup: observer disconnected prior to callback");
                    if (nl) alert3(`mutFixup: clearing ${nl} unprocessed records`);
                    o.notification$queue.length = 0;
                    return; // can just return undefined here
                }
                if (!nl) {
                    alert3("mutFixup: callback queued but records cleared, not calling");
                    return;
                }
                alert3(`mutFixup: callback on ${nl} records`);
                // Assume callback wants the observer as this for now
                o.callback.call(o, o.takeRecords(), o);
            }
        );
        o.callback$queued = true;
        alert3("mutFixup: callback queued");
    }
}

// support functions for mutation records
function mrList(x) {
if(Array.isArray(x)) {
// return a copy of the array
return [].concat(x);
}
if(typeof x == "number") return [];
return x ? [x] : [];
}

function mrKids(r, b, y, z) {
r.target = b;
r.type = "childList";
r.oldValue = null;
r.addedNodes = mrList(y);
r.removedNodes = mrList(z);
r.nextSibling = r.previousSibling = null; // this is for innerHTML
// if adding a single node then we can just compute the siblings
if(y && y.nodeType && y.parentNode)
r.previousSibling = y.previousSibling, r.nextSibling = y.nextSibling;
// if z is a node it is removeChild(), and is gone,
// and y is the integer where it was.
if(z && z.nodeType && typeof y == "number") {
var c = b.childNodes;
var l = c.length;
r.nextSibling = y < l ? c[y] : null;
--y;
r.previousSibling = y >= 0 ? c[y] : null;
}
}

/*********************************************************************
If you append a documentFragment you're really appending all its kids.
This is called by the various appendChild routines.
Since we are appending many nodes, I'm not sure what to return.
*********************************************************************/

// The return is completely undocumented. I have determined it is not null.
// I assume it is the appended fragment.
function appendFragment(p,  frag) { var c; while(c = frag.firstChild) p.appendChild(c); return frag; }
function insertFragment(p, frag, l) { var c; while(c = frag.firstChild) p.insertBefore(c, l); return frag; }

// if t is linkd into the tree, return the containing window
// This is similar to though not identical to the C version in html.c
function isRooted(t) {
while(t) {
if(t.nodeName == "HTML") return t.eb$win;
// don't break out of a template
if(t.dom$class == "HTMLTemplateElement") return undefined;
t = t.parentNode;
}
return undefined;
}

function frames$rebuild(w) {
var i, f, l, f2, l2;
// unlink the name references
for(i=0; i<(l=w.frames$2.length); ++i) {
f = w.frames$2[i];
if(f.name) delete w.frames[f.name];
}
f2 = gebtn(w.document, "iframe", true, false);
l2 = f2.length;
if(l2 != l)
alert3("rebuild frames in context " + w.eb$ctx + " lengths " + l + " and " + l2);
if(l2 < l) for(i=l2; i<l; ++i) delete w.frames[i];
if(l2 > l) for(i=l; i<l2; ++i)
w.eval('Object.defineProperty(frames,"'+i+'",{get:function(){return frames$2['+i+'].contentWindow},configurable:true})')
// and relink the names
for(i=0; i<l2; ++i) {
f = f2[i];
if(f.name) {
if(f.name.match(/^[\w_ +=,.-]+$/))
w.eval('Object.defineProperty(frames,"'+f.name+'",{get:function(){return frames$2['+i+'].contentWindow},configurable:true})')
else
alert3("invalid frame["+i+"].name.length " + f.name.length);
}
}
w.frames$2 = f2;
}

/*********************************************************************
If a script is attached to the tree, it is suppose to be executed right then.
The getScript functioni in the jquery library builds a script, attaches
it to document.head, then removes it, all in one js statement.
That action runs the script.
We can't drop back and wait for html.c to see it in the tree and run it
in its next cycle, we have to run it now.
This is called from appendChild and insertBefore.
eval() is the key, but there are a lot of details.
We can't run it twice, so set eb$step = 5, so that runScriptsPending()
in html.c doesn't see it and run it again; after all, we might not detach it.
It might still be hanging around. Or we might attach it again later.
For now I don't run it if we are still browsing.
I assume the scripts so attached are going to stay in the tree,
and will be found by html.c.
Thus the first check is on readyState, to see if we are browsing.
What happens, you may ask, if they call getScript from one of the scripts
in the base - that is, while we are still browsing.
We don't run it here, and it isn't in the tree for runScriptsPending().
Well, I don't think people do that, and if they do,
we'll cross that bridge when we come to it.
It seems like we should just run it all the time,
but then it could run out of order relative to the other scripts in the base.
It's complicated!
For you developers, you might want to use our breakpoint trace feature,
and that means you can't just shove the script through eval.
You have to do the macro expansion that is done in jseng-quick.c.
Look for bp_string and trace_string.
I do that here, using the power of js regexp, somewhat easier.
The script could be megabytes long, so I don't do it unless I have to,
just like the C version, pay-to-play.
This should mirror what happens in C, so if you change something in one place,
change it in the other.
*********************************************************************/

function traceBreakReplace(all, precomma, operator, name, postcomma) {
var r = precomma ? precomma : ';'
r += operator == "bp" ? bp_string : trace_string
r += name + "\")";
r += postcomma ? postcomma : ';'
return r
}

function runScriptWhenAttached(s) {
if(s.dom$class != "HTMLScriptElement") return; // not a script
const w = isRooted(s); // the rooting window
if(!w) return;
const d = w.document;
const n = s.eb$step
const inbrowse = (d.readyState != "complete");
alert3(`script ${s.eb$seqno} attached ${inbrowse?"during":"after"} browse type ${s.type} src ${s.src} length ${s.text.length} step ${n}`);
if(n >= 5) return; // already run
if(inbrowse) return;
s.eb$step = 5
if(s.type && !s.type.match(/javascript$/i)) {
alert3(`script type ${s.type} not executed`);
return;
}
alert3("exec attached")
d.currentScript = s;
if(s.text.match(/(bp|trace)@\(/)) {
// Oops, have to expand for tracing
w.eval(s.text.replace(/(,?) *(trace|bp)@\((\w+)\) *([,;]?)/g, traceBreakReplace))
} else {
w.eval(s.text)
}
d.currentScript = null
alert3("exec complete")
/*
in case the script has an onload handler
but this doesn't run unless, perhaps, the script is loaded from src,
which we don't even support at this time.
If you need to support that some day, use XMLHttpRequest.
Then execute then follow up with this onload code.
var e = new w.Event("load")
s.dispatchEvent(e)
*/
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
These functions also check for a hierarchy error using isabove(),
which throws an exception.
*********************************************************************/

function appendChild(c) {
if(!c) return null;
if(c.nodeType == 11) return appendFragment(this, c);
isabove(c, this);
if(c.parentNode) c.parentNode.removeChild(c);
var r = this.eb$apch2(c);
runScriptWhenAttached(r);
if(r) mutFixup(this, false, c, null);
return r;
}

function prependChild(c) {
var v;
isabove(c, this);
if(this.childNodes.length) v = this.insertBefore(c, this.childNodes[0]);
else v = this.appendChild(c);
return v;
}

function insertBefore(c, t) {
if(!c) return null;
if(!t) return this.appendChild(c);
isabove(c, this);
if(c.nodeType == 11) return insertFragment(this, c, t);
if(c.parentNode) c.parentNode.removeChild(c);
var r = this.eb$insbf(c, t);
runScriptWhenAttached(r);
if(r) mutFixup(this, false, r, null);
return r;
}

function removeChild(c) {
if(!c) return null;
var r = this.eb$rmch2(c);
return r;
}

function replaceChild(newc, oldc) {
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

function hasChildNodes() { return (this.childNodes.length > 0); }

function getSibling (obj,direction) {
var pn = obj.parentNode;
if(!pn) return null;
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
case "next":
return (j < l-1 ? pn.childNodes[j+1] : null);
default:
// the function should always have been called with either 'previous' or 'next' specified
return null;
}
}

function getElementSibling (obj,direction) {
var pn = obj.parentNode;
if(!pn) return null;
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
for(--j; j>=0; --j)
if(pn.childNodes[j].nodeType == 1) return pn.childNodes[j];
return null;
case "next":
for(++j; j<l; ++j)
if(pn.childNodes[j].nodeType == 1) return pn.childNodes[j];
return null;
default:
// the function should always have been called with either 'previous' or 'next' specified
return null;
}
}

/*********************************************************************
The attribute system is complex, with many functions
and many surprising side effects.
Most of these functions could be private node methods in setupClasses(),.
but it's a lof ot code, and would disrupt the flow.
So instead I gather them all here in one attr object.
along with some helper functions to manage spillup and spilldown.
Spill up means we set the property and it sets the attribute.
This has to be done by setters, it is not done here.
Spilldown means we set the attribute and it spills down to the property.
This has to be done by setAttribute, and sometimes additional processing
is involved. Example: script.setAttribute("src", "file.html")
is resolved against the base url as it spills down to the property.
getATtribute still gets "file.html".
But before we get to that, implicitMember() is a workaround,
when setAttribute is doing something it shouldn't,
like form.setAttribute("elements", "xx") or some such.
I call these implicit members, we shouldn't overwrite them.
*********************************************************************/

this.attr = {

implicitMember: function(o, name) {
return name === "elements" && o.dom$class == "HTMLFormElement" ||
name === "rows" && (o.dom$class == "HTMLTableElement" || o.dom$class == "tBody" || o.dom$class == "tHead" || o.dom$class == "tFoot") ||
name === "tBodies" && o.dom$class == "HTMLTableElement" ||
(name === "cells" || name === "rowIndex" || name === "sectionRowIndex") && o.dom$class == "HTMLTableRowElement" ||
name === "className" ||
// no clue what getAttribute("style") is suppose to do
name === "style" ||
name === "htmlFor" && o.dom$class == "HTMLLabelElement" ||
name === "httpEquiv" && o.dom$class == "HTMLMetaElement" ||
name === "options" && o.dom$class == "HTMLSelectElement" ||
name === "selectedOptions" && o.dom$class == "HTMLSelectElement";
},

spilldown: function(name) {
// Ideally I should have a list of all the on functions, but I'm gonna say
// any word that starts with on spills down.
if(name.match(/^on[a-zA-Z]*$/)) return true;
// I'm not sure if value should spill down, setAttribute("value","blah")
return name == "value";
},

spilldownResolveURL: function(t, name) {
if(!t.nodeName) return false;
var nn = t.nodeName.toLowerCase();
return name == "src" && (nn == "frame" || nn == "iframe") ||
name == "href" && (nn == "a" || nn == "area");
},

spilldownResolve: function(t, name) {
if(!t.nodeName) return false;
var nn = t.nodeName.toLowerCase();
return name == "action" && nn == "form" ||
name == "data" && (nn == "object") ||
name == "src" && (nn == "img" || nn == "script" || nn == "audio" || nn == "video") ||
name == "href" && (nn == "link" || nn == "base");
},

spilldownBool: function(t, name) {
if(!t.nodeName) return false;
var nn = t.nodeName.toLowerCase();
return name == "aria-hidden" ||
name == "selected" && nn == "option" ||
name == "checked" && nn == "input";
},

getAttribute: function(name) {
var a, w = my$win();
if(!this.eb$xml) name = name.toLowerCase();
if(attr.implicitMember(this, name)) return null;
// has to be a real attribute
if(!this.attributes$2) return null;
if(name === "length") {
a = null
for(var i=0; i<this.attributes.length; ++i)
if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
} else a = this.attributes[name]
if(!a) return null;
var v = a.value;
var t = typeof v;
if(t == "undefined" || v == null) return null;
// I stringify URL objects, should we do that to other objects?
if(t == 'object' && (v.dom$class == "URL" || v instanceof w.URL)) return v.toString();
// number, boolean, object; it goes back as it was put in.
return v; },

hasAttribute: function(name) { return this.getAttribute(name) !== null; },

getAttributeNames: function(name) {
var w = my$win();
var a = new w.Array;
if(!this.attributes$2) return a;
for(var l = 0; l < this.attributes$2.length; ++l) {
var z = this.attributes$2[l].name;
a.push(z);
}
return a;
},

getAttributeNS: function(space, name) {
if(space && !name.match(/:/)) name = space + ":" + name;
return this.getAttribute(name);
},

hasAttributeNS: function(space, name) { return this.getAttributeNS(space, name) !== null;},

setAttribute: function(name, v) {
var a, w = my$win();
if(!this.eb$xml) name = name.toLowerCase();
// special code for style
if(name == "style" && this.style.dom$class == "CSSStyleDeclaration") {
this.style.cssText = v;
return;
}
if(attr.implicitMember(this, name)) return;
var oldv = null;
if(name === "length") {
a = null
for(var i=0; i<this.attributes.length; ++i)
if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
} else a = this.attributes[name]
if(!a) {
a = new w.Attr();
a.owner = this;
a.name = name;
this.attributes.push(a);
if(name !== "length") this.attributes[name] = a
} else {
oldv = a.value;
}
a.value = v;
if(name.substr(0,5) == "data-") {
this.dataset[dataCamel(name)] = v;
}
// names that spill down into the actual property
// should we be doing any of this for xml nodes?
if(attr.spilldown(name)) this[name] = v;
// href$2 not enumerable. cloneNode still works because it finds
// href in the attributes and copies it there,
// whence spilldown puts href$2 in node2.
if(attr.spilldownResolve(this, name))
Object.defineProperty(this, "href$2", {value:resolveURL(w.eb$base, v),configurable:true,writable:true})
if(attr.spilldownResolveURL(this, name))
Object.defineProperty(this, "href$2", {value:new (w.URL)(resolveURL(w.eb$base, v)),configurable:true,writable:true})
if(attr.spilldownBool(this, name)) {
// This one is required by acid test 43, I don't understand it at all.
if(name == "checked" && v == "checked")
this.defaultChecked = true;
else {
// is a nonsense string like blah, true or false? I don't know.
// For now I'll assume it's true.
v = (v === "false" ? false : true);
this[name] = v;
}
}
mutFixup(this, true, name, oldv);
},

setAttributeNS: function(space, name, v) {
if(space && !name.match(/:/)) name = space + ":" + name;
this.setAttribute(name, v);
},

removeAttribute: function(name) {
if(!this.eb$xml)     name = name.toLowerCase();
// special code for style
if(name == "style") {
if(this.style$2 && this.style$2.dom$class == "CSSStyleDeclaration")
delete this.style$2;
}
if(!this.attributes$2) return;
if(name.substr(0,5) == "data-") {
var n = dataCamel(name);
if(this.dataset$2 && this.dataset$2[n]) delete this.dataset$2[n];
}
// should we be doing any of this for xml nodes?
if(attr.spilldown(name)) delete this[name];
if(attr.spilldownResolve(this, name)) delete this[name];
if(attr.spilldownResolveURL(this, name)) delete this[name];
if(attr.spilldownBool(this, name)) delete this[name];
var a;
if(name === "length") {
a = null
for(var i=0; i<this.attributes.length; ++i)
if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
} else a = this.attributes[name]
if(!a) return;
// Have to roll our own splice.
var i, found = false;
for(i=0; i<this.attributes.length-1; ++i) {
if(!found && this.attributes[i] == a) found = true;
if(found) this.attributes[i] = this.attributes[i+1];
}
this.attributes.length = i;
delete this.attributes[i];
if(name !== "length") delete this.attributes[name]
mutFixup(this, true, name, a.value);
},

removeAttributeNS: function(space, name) {
if(space && !name.match(/:/)) name = space + ":" + name;
this.removeAttribute(name);
},

// this returns null if no such attribute.
getAttributeNode: function(name) {
if(!this.attributes$2) return null;
    name = name.toLowerCase();
var a;
if(name === "length") {
a = null
for(var i=0; i<this.attributes.length; ++i)
if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
} else a = this.attributes[name]
if(!a) return null;
return a;
},

// b replaces a if a is present
setAttributeNode: function(b) {
if(typeof b != "object" || typeof b.name != "string") return null;
var     a, name = b.name.toLowerCase();
if(name === "length") {
a = null
for(var i=0; i<this.attributes.length; ++i)
if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
} else a = this.attributes[name];
if(!a) a = null; else this.removeAttribute(name);
b.owner = this;
this.attributes.push(b);
if(name !== "length") this.attributes[name] = b
// there are a lot of side effects I don't want to repeat here,
// like dataset and mutFixup and so on, so just invoke
this.setAttribute(name, b.value)
return a
},

removeAttributeNode: function(b) {
if(typeof b != "object" || typeof b.name != "string") return null;
var     name = b.name.toLowerCase();
if(name === "length") {
let i;
for(i=0; i<this.attributes.length; ++i)
if(this.attributes[i] == b) break;
if(i == this.attributes.length) return null;
} else {
if(this.attributes[name] != b) return null;
}
this.removeAttribute(b.name)
return b
},

}

/*********************************************************************
cloneNode creates a copy of the node and its children recursively.
The argument 'deep' refers to whether or not the clone will recurs.
clone1 is a helper function that is not tied to any particular prototype.
into means we are cloning into this context, as in importNode().
It's frickin complicated, so set cloneDebug to debug it.
*********************************************************************/

function clone1(node1,deep, into) {
var node2;
var i, j;
var kids = null;
var debug = db$flags(2)
var w0 = my$win()
var w = w0
// if cloneNode then refer to the window that created the node
if(!into && node1.ownerDocument && node1.ownerDocument.defaultView)
w = node1.ownerDocument.defaultView
var d = w.document

// WARNING: don't use instanceof Array here.
// Array is a different class in another frame.
if(Array.isArray(node1.childNodes))
kids = node1.childNodes;

// We should always be cloning a node.
if(debug) alert3("clone " + node1.nodeName + " {");
if(debug) {
if(kids) {
if(kids.length) alert3("kids " + kids.length);
} else alert3("no childNodes, type " + typeof node1.childNodes);
}

if(node1.nodeName == "#text")
node2 = d.createTextNode(node1.data);
else if(node1.nodeName == "#comment")
node2 = d.createComment();
else if(node1.nodeName == "#document-fragment")
node2 = d.createDocumentFragment();
else if(node1.dom$class == "CSSStyleDeclaration") {
if(debug) alert3("skipping style object");
return null;
} else
node2 = d.createElement(node1.nodeName);
if(node1 == w0.cloneRoot1) w0.cloneRoot2 = node2;

var lostElements = false;

// now for strings and functions and such.
for (var item in node1) {
// don't copy the things that come from prototype
if(!node1.hasOwnProperty(item)) continue;

// children already handled
if(item === "childNodes" || item === "parentNode") continue;

if(attr.implicitMember(node1, item)) continue;

if (typeof node1[item] === 'function') {
// event handlers shouldn't carry across.
if(item.match(/^on[a-zA-Z]+(\$\$fn|\$2|)$/)) continue;
if(debug) alert3("copy function " + item);
node2[item] = node1[item];
continue;
}

if(node1[item] === node1) {
if(debug) alert3("selflink through " + item);
node2[item] = node2;
continue;
}

// various kinds of arrays
if(Array.isArray(node1[item])) {

// event handlers shouldn't carry across.
if(item.match(/^on[a-zA-Z]+\$\$array$/)) continue;

// live arrays
if((item == "options" || item == "selectedOptions") && node1.dom$class == "HTMLSelectElement") continue;

/*********************************************************************
Ok we need some special code here for form.elements,
an array of input nodes within the form.
We are preserving links, rather like tar or cpio.
The same must be done for an array of rows beneath <table>,
or an array of cells in a row, and perhaps others.
But the thing is, we don't have to do that, because appendChild
does it for us, as side effects, for these various classes.
*********************************************************************/

node2[item] = new w.Array;

// special code here for an array of radio buttons within a form.
if(node1.dom$class == "HTMLFormElement" && node1[item].length &&
node1[item][0].dom$class == "HTMLInputElement" && node1[item][0].name == item) {
var a1 = node1[item];
var a2 = node2[item];
if(debug) alert3("linking form.radio " + item + " with " + a1.length + " buttons");
a2.type = a1.type;
a2.nodeName = a1.nodeName;
if(a1.hasAttribute("class")) a2.setAttribute("class", a1.getAttribute("class"));
for(i = 0; i < a1.length; ++i) {
var p = findObject(a1[i]);
if(p.length) {
a2.push(correspondingObject(p));
} else {
a2.push(null);
if(debug) alert3("oops, button " + i + " not linked");
}
}
continue;
}

// It's a regular array.
if(debug) alert3("copy array " + item + " with " + node1[item].length + " members");
for(i = 0; i < node1[item].length; ++i)
node2[item].push(node1[item][i]);
continue;
}

if(typeof node1[item] === "object") {
// An object, but not an array.

// skip the on-demand background objects
if(item === "style$2") continue;
if(item === "attributes$2") continue;
if(item === "dataset$2") continue;
if(item === "ownerDocument") continue; // handled by createElement
if(item === "validity") continue; // created by constructor

if(node1[item] === null) { node2[item] = null; continue; }

// Check for URL objects.
if(node1[item].dom$class == "URL") {
var u = node1[item];
if(debug) alert3("copy URL " + item);
node2[item] = new w.z$URL(u.href);
continue;
}

// some sites displace my URL with theirs
if(node1[item] instanceof w.URL) {
var u = node1[item];
if(debug) alert3("copy URL " + item);
node2[item] = new w.URL(u.toString());
continue;
}

// Look for a link from A to B within the tree of nodes,
// A.foo = B, and try to preserve that link in the new tree, A1.foo = B1,
// rather like tar or cpio preserving hard links.
var p = findObject(node1[item]);
if(p.length) {
if(debug) alert3("link " + item + " " + p);
node2[item] = correspondingObject(p);
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
!Array.isArray(node1) && !(node1.dom$class == "HTMLOptionElement"))
continue;
if((item == "nodeName" || item == "tagName") && node1.nodeType == 1)
continue;
// these are spilldown from the attributes, and will be copied over as attributes
if(item == "class" || item == "id") continue;
if(debug) {
var showstring = node1[item];
if(showstring.length > 140) showstring = "long";
alert3("copy string " + item + " = " + showstring);
}
node2[item] = node1[item];
continue;
}

if (typeof node1[item] === 'number') {
if(item == "eb$seqno") continue;
if(item == "nodeType" && node1.nodeType == 1)
continue;
if(debug) alert3("copy number " + item + " = " + node1[item]);
node2[item] = node1[item];
continue;
}

if (typeof node1[item] === 'boolean') {
// these are spilldown from the attributes, and will be copied over as attributes
if(item == "aria-hidden") continue;
if(debug) alert3("copy boolean " + item + " = " + node1[item]);
node2[item] = node1[item];
continue;
}
}

// copy style object if present and its subordinate strings.
if (node1.style$2 && node1.style$2.dom$class == "CSSStyleDeclaration") {
if(debug) alert3("copy style");
// referencing it will create it
node2.style;
node2.style.element = node2;
for (var l in node1.style$2){
if(!node1.style$2.hasOwnProperty(l)) continue;
if (typeof node1.style$2[l] === 'string' ||
typeof node1.style$2[l] === 'number') {
if(debug) alert3("copy stattr " + l);
node2.style$2[l] = node1.style$2[l];
}
}
}

if (node1.attributes$2) { // has attributes
if(debug) alert3("copy attributes");
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

if (deep && kids) {
for(i = 0; i < kids.length; ++i) {
var current_item = kids[i];
node2.appendChild(clone1(current_item,deep, into));
}
}

if(debug) alert3("}");
return node2;
}

/* an attempt at a structured clone implementation, definitely needs some work
Note, it should be bound into the window as it can be used within frames and so
my$win may return the wrong window. */
function structuredClone(obj, options)
{
    const debug = db$flags(2);
    let dbg = () => undefined;
    if (debug) dbg = (m) => alert3("structuredClone: " + m);
    // We could be copying across frames so we can't do instance checks
    const get_type = (o) => Object.prototype.toString.call(o);
    const is_type = (o1, o2) => get_type(o1) == get_type(o2);
    // our nodes all have dom$class which simplifies things
    const is_node = (o) => !!o && !!o.nodeType;
    /* Map objects to their new equivalents to prevent infinite cycles and
        preserve the reference structure
    */
    const obj_map = new this.Map;
    const transfer = new this.Set;
    if (options && options.transfer) {
        for (let i = 0; i < options.transfer.length; ++i) {
            const o = options.transfer[i];
            if(o.eb$ctx) o.eb$ctx = this.eb$ctx;
            transfer.add(o);
            // Make sure the transferred objects get referenced not cloned
            obj_map.set(o, o);
        }
    }

    const property_helper = (old_obj, new_obj, key) => {
        dbg("handle property " + key);
        const value = old_obj[key];
        new_obj[key] = clone_helper(value);
        // I'm not sure if this is right, should we actually delete
        if (transfer.has(value)) {
            dbg("Detach value for property" + key);
            old_obj[key] = undefined;
        }
    }

    const clone_helper = (obj) => {
        const copy_types = new this.Set(["undefined", "string", "number", "boolean"])
        if (obj === null) {
            dbg("got null");
            return obj;
        }
        if (copy_types.has(typeof obj)) {
            dbg("directly returning " + typeof obj+ " with value " + ((
                typeof obj === "string" && obj.length > 200
            ) ? "<dbg long string not shown>" : obj)
            );
            return obj;
        }
        /* structuredClone doesn't handle DOM nodes or functions regardless of
            where they appear in the structure. Note that, due to how
            javascript prototypes and classes work this doesn't break on
            objects with methods assigned by prototype or using the new class
            syntax. However directly assigning functions as object properties
            will break. This isthe documented behaviour and is compatible with
            modern browsers.
        */

        if (is_node(obj) || typeof obj === "function") {
            dbg(`Unsupported object (node ${is_node(obj)}, type ${typeof obj})`);
            throw new this.DOMException("Unsupported object type", "DataCloneError");
        }
        // Otherwise something which could have ref cycles
        if (obj_map.has(obj)) {
            // Set up the reference cycles to be the same in the new object
            dbg("reusing mapped reference");
            return obj_map.get(obj);
        }

        // We care about specific array types
        if(is_type(obj, new this.Array)) {
            const new_array = new this.Array;
            obj_map.set(obj, new_array);
            dbg("copy array with " + obj.length + " members");
            for (let i = 0; i < obj.length; ++i)
                // preserve sparse arrays
                if (obj[i] !== undefined) new_array[i] = clone_helper(obj[i]);
            return new_array;
        }

        if (is_type(obj, new this.Map)) {
            dbg("copy map with " + obj.size + " members");
            const new_map = new this.Map;
            obj_map.set(obj, new_map);
            // Map keys can be complex types
            for (const [k, v] of obj)
                new_map.set(clone_helper(k), clone_helper(v));
            return new_map;
        }
        if (is_type(obj, new this.Set)) {
            dbg("copy set with " + obj.size + " members");
            const new_set = new this.Set;
            obj_map.set(obj, new_set);
            // Sets can contain complex types
            for (const i of obj)
                new_set.add(clone_helper(i));
            return new_set;
        }

        // Technically we should do more checking but just assume object for now
        dbg("Copy object");
        /* If one clones a class instance one ends up with a plain object per
            the documented behaviour. */
        const new_obj = new this.Object;
        obj_map.set(obj, new_obj);
        for (const k of Object.keys(obj)) {
            // We only have string keys here
            property_helper(obj, new_obj, k);
        }
        return new_obj;
    }
    return clone_helper(obj);
}

// Find an object in a tree of nodes being cloned.
// Return a sequence of numbers, for children, from the root.
function findObject(t) {
var w = my$win();
var p = "";
while(t != w.cloneRoot1) {
var up = t.parentNode;
if(!up || up.nodeType == 9 || !up.childNodes) return "";
var i;
for(i=0; i<up.childNodes.length; ++i)
if(up.childNodes[i] == t) break;
if(i == up.childNodes.length) return "";
p = "," + i + p;
t = up;
}
return p + ',';
}

// The inverse of the above.
function correspondingObject(p) {
var w = my$win();
var c = w.cloneRoot2;
p = p.substr(1);
while(p) {
var j = p.replace(/,.*/, "");
if(!c.childNodes || j >= c.childNodes.length) return "";
c = c.childNodes[j];
p = p.replace(/^\d+,/, "");
}
return c;
}

// simple function to clone Attr
// not use by cloneNode - that calls setAttribute to do that function
function cloneAttr()
{
var w = my$win()
// if part of an html element, use its context
if(this.owner && this.owner.ownerDocument && this.owner.ownerDocument.defaultView)
w = this.owner.ownerDocument.defaultView
var a = new w.Attr;
a.name = this.name, a.value = this.value;
return a
}

// for toolbar menubar etc
this.generalbar = {}
Object.defineProperty(generalbar, "visible", {value:true})

function cssGather(pageload, newwin) {
var w = my$win();
if(!pageload && newwin && newwin.eb$visible) w = newwin;
var d =w.document;
var css_all = "";
w.cssSource = [];
var a, i, t;

a = d.querySelectorAll("link,style");
for(i=0; i<a.length; ++i) {
t = a[i];
if(t.dom$class == "HTMLLinkElement") {
if(t.css$data && (
t.type && t.type.toLowerCase() == "text/css" ||
t.rel && t.rel.toLowerCase() == "stylesheet")) {
w.cssSource.push({data: t.css$data, src:t.href});
css_all += "@ebdelim0" + t.href + "{}\n";
css_all += t.css$data;
}
}
if(t.dom$class == "HTMLStyleElement") {
if(t.css$data) {
w.cssSource.push({data: t.css$data, src:w.eb$base});
css_all += "@ebdelim0" + w.eb$base + "{}\n";
css_all += t.css$data;
}
}
}

// If the css didn't change, then no need to rebuild the selectors
if(!pageload && css_all == w.last$css_all)
return;

w.last$css_all = css_all;
Object.defineProperty(w, "last$css", {enumerable:false});
w.css$ver++;
cssDocLoad(w.eb$ctx, css_all, pageload);
}

function makeSheets(all) {
var w = my$win();
var d = my$doc();
var ss = d.styleSheets;
ss.length = 0; // should already be 0
var a = all.split('\n');
// last rule ends in newline of course, but then split leaves
// an extra line after that.
if(a.length) a.pop();
var nss = null; // new style sheet
var stack = [];
for(var i = 0; i < a.length; ++i) {
var line = a[i];
if(line.substr(0,8) != "@ebdelim") {
if(nss) {
var r = new w.CSSRule;
r.cssText = line;
nss.cssRules.push(r);
}
continue;
}
var which = line.substr(8,1);
switch(which) {
case '0':
stack.length = 0; // should already be 0
nss = new w.CSSStyleSheet;
stack.push(nss);
ss.push(nss);
nss.src = line.substr(9).replace(/ *{}/,"");
break;
case '1':
nss = new w.CSSStyleSheet;
stack.push(nss);
ss.push(nss);
nss.src = line.substr(9).replace(/ *{}/,"");
break;
case '2':
stack.pop();
nss = stack.length ? stack[stack.length-1] : null;
break;
}
}
}

// e is the node and pe is the pseudoelement
function getComputedStyle(e,pe) {
var s, w = my$win();

if(typeof pe != "string") pe = 0;
else if(pe.match(/^\s*$/)) pe = 0;
else if(pe.match(/:before$/)) pe = 1;
else if(pe.match(/:after$/)) pe = 2;
else { alert3("getComputedStyle pseudoelement " + pe + " is invalid"); pe = 0; }

/*********************************************************************
Some sites call getComputedStyle on the same node over and over again.
http://songmeanings.com/songs/view/3530822107858535238/
Can we remember the previous call and just return the same style object?
Can we know that nothing has changed in between the two calls?
I can track when the tree changes, and even the class,
but what about individual attributes?
I haven't found a way to do this without breaking acid test 33 and others.
We're not sharing DOM classes yet, so hark back to the calling window
to create the Style element.
*********************************************************************/

s = new w.CSSStyleDeclaration;
s.element = e;

/*********************************************************************
What if js has added or removed style objects from the tree?
Maybe the selectors and rules are different from when they were first compiled.
Does this ever happen? It does in acid test 33.
Does it ever happen in the real world? I don't know.
If not, this is a big waste of time and resources.
How big? Well not too bad I guess.
Strings are parsed in C, which is pretty fast,
but it really falls flat when the css has @import which pulls in another
css file, and now we have to fetch that file on every call to getComputedStyle.
Nodes are created, and technically their class changed,
in that there was no node and no class before, and that induces a call
to getComputedStyle, and that fetches the file, again.
The imported css file could be fetched 100 times just to load the page.
I get around this by the shortcache feature in css.c.
If the css has changed in any way, I recompile the descriptors
and increment the css version, stored in css$ver;
Any information we might have saved about nodes and descriptors,
for speed and optimization, is lost if the version changes.
Remember that "this" is the window object.
*********************************************************************/

cssGather(false, this);

this.soj$ = s;
cssApply(this.eb$ctx, e, pe);
delete this.soj$;

// If js sets a style property, or if it is set by style= in the html tag,
// it carries across, and in fact it takes precedence.

if(e.style$2) {
for(var k in e.style) {
if(!e.style.hasOwnProperty(k)) continue;
if(typeof e.style[k] == 'object') continue;
// Ok carry this one across.
s[k] = e.style[k];
}
}

// Browsers turn colors into rgb. I think that's confusing,
// but if they do it then I guess we should too.
for(var k in s)
if(s.hasOwnProperty(k) &&
(k == "color" || k.match(/Color$/)))
s[k] = color2rgb(s[k]);

return s;
}

// A different version, focus is only on visibility.
// Thus we pass 10 as the third parameter to cssapply().
function computeStyleInline(e) {
var w = my$win();
var s = new w.CSSStyleDeclaration;
// don't put a style under a style.
// There are probably other nodes I should skip too.
if(e.nodeType != 1 ||
e.dom$class == "CSSStyleDeclaration" || e.dom$class == "HTMLStyleElement") return s;
// apply all the css rules
w.soj$ = s;
cssApply(w.eb$ctx, e, 10);
delete w.soj$;
return s;
}

/*********************************************************************
There are a lot of css shorthand propertie.
Example: set margin to 10px and you are really setting
maringTop = marginRight = marginBottom = marginLeft = 10px.
You can set them individaully of course, but this is a shorthand.
There are a lot of these and they don't all work the same way.
I could put all these into setupClasses, as private style methods, but there's
a lot of code here, and I feel it would disrupt the flow of that function.
I'll keep it here, but all insode one object.
*********************************************************************/

this.cssShort = {

marginShort: function(s, h) {
// don't want to blow up if it's not a string
if(h === null || h === undefined) return;
// this should already be a string, but...
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.marginLeft = s.marginBottom = s.marginRight = s.marginTop = h[0];
return;
}
if(l == 2) {
s.marginTop = s.marginBottom = h[0];
s.marginLeft = s.marginRight = h[1];
return;
}
if(l == 3) {
s.marginTop = h[0];
s.marginLeft = s.marginRight = h[1];
s.marginBottom = h[2];
return;
}
if(l >= 4) {
s.marginTop = h[0];
s.marginRight = h[1];
s.marginBottom = h[2];
s.marginLeft = h[3];
return;
}
},

scrollMarginShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.scrollMarginLeft = s.scrollMarginBottom = s.scrollMarginRight = s.scrollMarginTop = h[0];
return;
}
if(l == 2) {
s.scrollMarginTop = s.scrollMarginBottom = h[0];
s.scrollMarginLeft = s.scrollMarginRight = h[1];
return;
}
if(l == 3) {
s.scrollMarginTop = h[0];
s.scrollMarginLeft = s.scrollMarginRight = h[1];
s.scrollMarginBottom = h[2];
return;
}
if(l >= 4) {
s.scrollMarginTop = h[0];
s.scrollMarginRight = h[1];
s.scrollMarginBottom = h[2];
s.scrollMarginLeft = h[3];
return;
}
},

paddingShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.paddingLeft = s.paddingBottom = s.paddingRight = s.paddingTop = h[0];
return;
}
if(l == 2) {
s.paddingTop = s.paddingBottom = h[0];
s.paddingLeft = s.paddingRight = h[1];
return;
}
if(l == 3) {
s.paddingTop = h[0];
s.paddingLeft = s.paddingRight = h[1];
s.paddingBottom = h[2];
return;
}
if(l >= 4) {
s.paddingTop = h[0];
s.paddingRight = h[1];
s.paddingBottom = h[2];
s.paddingLeft = h[3];
return;
}
},

scrollPaddingShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.scrollPaddingLeft = s.scrollPaddingBottom = s.scrollPaddingRight = s.scrollPaddingTop = h[0];
return;
}
if(l == 2) {
s.scrollPaddingTop = s.scrollPaddingBottom = h[0];
s.scrollPaddingLeft = s.scrollPaddingRight = h[1];
return;
}
if(l == 3) {
s.scrollPaddingTop = h[0];
s.scrollPaddingLeft = s.scrollPaddingRight = h[1];
s.scrollPaddingBottom = h[2];
return;
}
if(l >= 4) {
s.scrollPaddingTop = h[0];
s.scrollPaddingRight = h[1];
s.scrollPaddingBottom = h[2];
s.scrollPaddingLeft = h[3];
return;
}
},

borderRadiusShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.borderBottomLeftRadius = s.borderBottomRightRadius = s.borderTopRightRadius = s.borderTopLeftRadius = h[0];
return;
}
if(l == 2) {
s.borderTopLeftRadius = s.borderBottomRightRadius = h[0];
s.borderBottomLeftRadius = s.borderTopRightRadius = h[1];
return;
}
if(l == 3) {
s.borderTopLeftRadius = h[0];
s.borderBottomLeftRadius = s.borderTopRightRadius = h[1];
s.borderBottomRightRadius = h[2];
return;
}
if(l >= 4) {
s.borderTopLeftRadius = h[0];
s.borderTopRightRadius = h[1];
s.borderBottomRightRadius = h[2];
s.borderBottomLeftRadius = h[3];
return;
}
},

borderWidthShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.borderLeftWidth = s.borderBottomWidth = s.borderRightWidth = s.borderTopWidth = h[0];
return;
}
if(l == 2) {
s.borderTopWidth = s.borderBottomWidth = h[0];
s.borderLeftWidth = s.borderRightWidth = h[1];
return;
}
if(l == 3) {
s.borderTopWidth = h[0];
s.borderLeftWidth = s.borderRightWidth = h[1];
s.borderBottomWidth = h[2];
return;
}
if(l >= 4) {
s.borderTopWidth = h[0];
s.borderRightWidth = h[1];
s.borderBottomWidth = h[2];
s.borderLeftWidth = h[3];
return;
}
},

borderColorShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.borderLeftColor = s.borderBottomColor = s.borderRightColor = s.borderTopColor = h[0];
return;
}
if(l == 2) {
s.borderTopColor = s.borderBottomColor = h[0];
s.borderLeftColor = s.borderRightColor = h[1];
return;
}
if(l == 3) {
s.borderTopColor = h[0];
s.borderLeftColor = s.borderRightColor = h[1];
s.borderBottomColor = h[2];
return;
}
if(l >= 4) {
s.borderTopColor = h[0];
s.borderRightColor = h[1];
s.borderBottomColor = h[2];
s.borderLeftColor = h[3];
return;
}
},

borderStyleShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.borderLeftStyle = s.borderBottomStyle = s.borderRightStyle = s.borderTopStyle = h[0];
return;
}
if(l == 2) {
s.borderTopStyle = s.borderBottomStyle = h[0];
s.borderLeftStyle = s.borderRightStyle = h[1];
return;
}
if(l == 3) {
s.borderTopStyle = h[0];
s.borderLeftStyle = s.borderRightStyle = h[1];
s.borderBottomStyle = h[2];
return;
}
if(l >= 4) {
s.borderTopStyle = h[0];
s.borderRightStyle = h[1];
s.borderBottomStyle = h[2];
s.borderLeftStyle = h[3];
return;
}
},

backgroundShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
delete s.backgroundColor;
delete s.backgroundImage;
delete s.backgroundRepeat;
delete s.backgroundPosition;
if(l >= 1)
s.backgroundColor = h[0];
if(l >= 2)
s.backgroundImage = h[1];
if(l >= 3)
s.backgroundRepeat = h[2];
if(l >= 4)
s.backgroundPosition = h[3];
},

fontShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
delete s.fontStyle;
delete s.fontWeight;
delete s.fontSize;
delete s.lineHeight;
delete s.fontFamily;
delete s.fontVariant;
delete s.fontSizeAdjust;
delete s.fontStretch;
if(l >= 1)
s.fontStyle = h[0];
if(l >= 2)
s.fontWeight = h[1];
if(l >= 3) {
var parts = h[2].split('/');
s.fontSize = parts[0];
if(parts.length >= 2)
s.lineHeight = parts[1];
}
if(l >= 4)
s.fontFamily = h[3];
if(l >= 5)
s.fontVariant = h[4];
if(l >= 6)
s.fontSizeAdjust = h[5];
if(l >= 7)
s.fontStretch = h[6];
},

borderShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
delete s.borderWidth;
delete s.borderStyle;
delete s.borderColor;
delete s.borderImage;
if(l >= 1)
s.borderWidth = h[0];
if(l >= 2)
s.borderStyle = h[1];
if(l >= 3)
s.borderColor =  h[2];
if(l >= 4)
s.borderImage =  h[3];
},

borderImageShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
delete s.borderImageSource;
delete s.borderImageSlice;
delete s.borderImageWidth;
delete s.borderImageOutset;
delete s.borderImageRepeat;
if(l >= 1)
s.borderImageSource = h[0];
if(l >= 2)
s.borderImageSlice = h[1];
if(l >= 3)
s.borderImageWidth =  h[2];
if(l >= 4)
s.borderImageOutset =  h[3];
if(l >= 5)
s.borderImageRepeat =  h[4];
},

insetShort: function(s, h) {
if(h === null || h === undefined) return;
if(typeof h !== "string") h = String(h)
h = h.split(/\s+/);
var l = h.length;
if(l == 1) {
s.left = s.bottom = s.right = s.top = h[0];
return;
}
if(l == 2) {
s.top = s.bottom = h[0];
s.left = s.right = h[1];
return;
}
if(l == 3) {
s.top = h[0];
s.left = s.right = h[1];
s.bottom = h[2];
return;
}
if(l >= 4) {
s.top = h[0];
s.right = h[1];
s.bottom = h[2];
s.left = h[3];
return;
}
},

}

// see the DIS_ values in eb.h
function eb$visible(t) {
var c, rc = 0;
var s1; // original style object
var s2; // computed style object
var w = my$win();
if(!t) return 0;
if(t.hidden || t["aria-hidden"]) return 1;
if(w.rr$start) {
cssGather(false, w);
delete w.rr$start;
}
s1 = t.style$2 ? t.style$2 : {};
s2 = computeStyleInline(t);
if(s2.display == "none" || s2.visibility == "hidden") {
rc = 1;
// It is hidden, does it come to light on hover?
if(s1.hov$vis) rc = 2;
return rc;
}
if((c = s2.color) && c != "inherit") {
rc = (c == "transparent" ? 4 : 3);
if(rc == 4 && s1.hov$col) rc = 5;
}
return rc;
}

function htmlString(t) {
if(t.nodeType == 3) return t.data;
if(t.dom$class == "XMLCdata") return "<![Cdata[" + t.text + "]]>";
if(t.nodeType != 1) return "";
var s = "<" + (t.nodeName ? t.nodeName : "x");
if(t.attributes$2) {
for(var l = 0; l < t.attributes$2.length; ++l) {
var a = t.attributes$2[l];
// we need to html escape certain characters, which I do a few of.
s += ' ' + a.name + "='" + a.value.toString().replace(/['<>&]/g,function(a){return "&#"+a.charCodeAt(0)+";"}) + "'";
}
}
s += '>';
if(t.childNodes)
for(var i=0; i<t.childNodes.length; ++i)
s += htmlString(t.childNodes[i]);
s += "</";
s += (t.nodeName ? t.nodeName : "x");
s += '>';
return s;
}

function outer$1(t, h) {
var p = t.parentNode;
if(!p) return;
t.innerHTML = h;
while(t.lastChild) p.insertBefore(t.lastChild, t.nextSibling);
p.removeChild(t);
}

// There are subtle differences between contentText and textContent, which I don't grok.
function textUnder(top, flavor) {
var nn = top.nodeName;
if(nn == "#text") return top.data.trim();
if(nn == "SCRIPT" || nn == "#cdata-section") return top.text;
var pre = (nn=="PRE");
// we should be more general here; this doesn't handle
// <pre>hello<i>multi lined text in italics</i>world</pre>
var answer = "", part, delim = "";
var t = top.querySelectorAll("cdata,text");
for(var i=0; i<t.length; ++i) {
var u = t[i];
if(u.parentNode && u.parentNode.nodeName == "OPTION") continue;
// any other texts we should skip?
part = u.nodeName == "#text" ? u.data : u.text;
if(!pre) part = part.trim(); // should we be doing this?
if(!part) continue;
if(answer) answer += delim;
answer += part;
}
return answer;
}

function newTextUnder(top, s, flavor) {
var l = top.childNodes.length;
for(var i=l-1; i>=0; --i)
top.removeChild(top.childNodes[i]);
// do nothing if s is undefined, or null, or the empty string
if(!s) return;
top.appendChild(my$doc().createTextNode(s));
}

// We need UnsupportedError for this
class UnsupportedError extends Error {
    constructor(message) { super(message); }
}

// define a custom element
function cel_define(name, c, options) {
    const w = my$win();
    const cr = w.cel$registry;
    let ext = "";
    if(typeof options == "object" && options.extends) ext = options.extends;
    if(ext) alert3("define custom element " + name + " extends " + ext);
    else alert3("define custom element " + name);
    if(typeof name != "string") throw new w.DOMException("name is not a string");
    if (!name.match(/.-./)) throw new w.DOMException(`name ${name} is invalid`);
    if(cr.has(name)) throw new w.UnsupportedError(`name ${name} already defined`);
    if(typeof c != "function") throw new w.DOMException("not a function");
    const o = {construct:c};
    // what other stuff should we remember in o?
    cr.set(name, o);
}

function cel_get(name) {
    const w = my$win();
    const cr = w.cel$registry;
    if(typeof name != "string") throw new w.DOMException("name is not a string");
    /* It looks like we need to allow people to get whatever an return
    undefined if it's not there which'll be the case if the name is invalid.
    Since we're using a map to hold everything there's no risk of using this
    to grab bits of the object hierarchy. */
    const o = cr.get(name);
    return o ? o.construct : undefined;
}

// jtfn0 injects trace(blah) into the code.
// It should only be applied to deminimized code.
// jtfn1 puts a name on the anonymous function, for debugging.
// jtfn2 injects code after catch(e) {, for detection by dberr
// jtfn3 injects trace at the end of a return statement, in a tricky way.

function jtfn0(all, a, b) {
// if code is not deminimized, this will inject
// trace on every blank line, which is not good.
if(b == "\n" && a.match(/\n/)) return a+b;
// I don't want to match on function(){var either.
if(b != "\n" && !a.match(/\n/)) return a+b;
var w = my$win();
var c = w.$jt$c;
var sn = w.$jt$sn;
w.$jt$sn = ++sn;
return a + "trace" + "@(" + c + sn + ")" + b;
}

function jtfn1(all, a, b) {
var w = my$win();
var c = w.$jt$c;
var sn = w.$jt$sn;
w.$jt$sn = ++sn;
var fn = c + "__" + sn; // function name
return a + " " + fn + b +
"if(step$l>=1)alert('" + fn + "(' + showarglist(arguments) + ')');\n";
}

function jtfn2(all, a) {
return '}catch(' + a + '){if(db$flags(3)) alert(' + a + '.toString()),alert(' + a + '.stack),step$l=2;';
}

function jtfn3(all, a, b) {
var w = my$win();
var c = w.$jt$c;
var sn = w.$jt$sn;
w.$jt$sn = ++sn;
// a is just whitespace, to preserve indenting
// b is the expression to return
return a + "{let x$rv=(" + b + ");trace" + "@(" + c + sn + ");return x$rv;}\n";
}

// Deminimize javascript for debugging purposes.
// Then the line numbers in the error messages actually mean something.
// This is only called when debugging is on. Users won't invoke this machinery.
// Argument is the script object.
// escodegen.generate and esprima.parse are found in demin.js.
function deminimize(s) {
alert3("deminimizing");
if( s.dom$class != "HTMLScriptElement") {alert3("wrong class " + s.dom$class); return; }
// it might not be javascript.
// This should agree with the criteria in html.c
if(s.language && !s.language.match(/^javascript\b/i)) { alert3("wrong language " + s.language); return; }
if(s.type && !s.type.match(/(\bjavascript|\/javascript)$/i)) { alert3("wrong type " + s.type); return; }
if(s.demin) { alert3("already deminimized"); return; }
s.demin = true;
s.expanded = false;
if(! s.text) { alert3("empty"); return; }

// Don't deminimize if short, or if average line length is less than 120.
if(s.text.length < 1000) { alert3("short"); return; }
var i, linecount = 1;
for(i=0; i<s.text.length; ++i)
if(s.text.substr(i,1) === '\n') ++linecount;
if(s.text.length / linecount <= 120) { alert3("short lines"); return; }

/*********************************************************************
You're not gonna believe this.
paypal.com, and perhaps other websites, use an obfuscator, that hangs forever
if you're javascript engine doesn't do exactly what it's suppose to.
As I write this, edbrowse + quickjs works, however, it fails if you deminimize
the code for debugging. And it fails even more if you add trace points.
They deliberately set it up to fail if the js code is deminimized.
They don't want you to understand it.
There is a deceptive function called removeCookie, that has nothing to do
with cookies. Another function tests removeCookie.toString(),
and expects it to be  a simple compact return statement.
If it spreads across multiple lines (as happens with deminimization),
or if it includes tracing software, then it all blows up.
https://www.paypal.com/auth/createchallenge/381145a4bcdc015f/recaptchav3.js
I can put it back the way it was, or just not deminimize that particular script.
There are pros and cons either way.
For now I'm taking the simpler approach, and leaving the script alone.
I use to watch for the compact removeCookie function,
but they changed that, no doubt change the code from time to time,
so nobody can figure it out.
That leaves me to check the filename, which isn't great either cause
some other website could use the same code under a different filename.
*********************************************************************/

if(s.src.indexOf("/recaptcha") > 0) {
alert("deminimization skipped due to /recaptcha in filename");
return;
}

// Ok, run it through the deminimizer.
if(self.escodegen) {
s.original = s.text;
s.text = escodegen.generate(esprima.parse(s.text));
// This is a crude workaround because codegen doesn't understand the syntax of extending a class.
// There is a patch in demin.js that inserts 18392748934
// We need to remove it here.
// buildsourcestring will remove the space after colon if I'm not careful.
s.text = s.text.replace(/:\s18392748934\n/g, "\n");
s.expanded = true;
alert3("expanded");
} else {
alert("deminimization not available");
}
}

// Trace with possible breakpoints.
function addTrace(s) {
if( s.dom$class != "HTMLScriptElement") return;
if(! s.text) return;
if(s.src.indexOf("/recaptcha") > 0) return;
if(s.text.indexOf("trace"+"@(") >= 0) // already traced
return;
var w = my$win();
if(w.$jt$c == 'z') w.$jt$c = 'a';
else w.$jt$c = String.fromCharCode(w.$jt$c.charCodeAt(0) + 1);
w.$jt$sn = 0;
alert3("adding trace under " + w.$jt$c);
// First name the anonymous functions; then put in the trace points.
s.text = s.text.replace(/(\bfunction *)(\([\w ,]*\) *{\n)/g, jtfn1);
s.text = s.text.replace(/(\bdo \{|\bwhile \([^{}\n]*\) *{|\bfor \([^{}\n]*\) *{|\bif \([^{}\n]*\) *{|\bcatch \(\w*\) *{|\belse \{|\btry \{|\bfunction *\w*\([\w ,]*\) *{|[^\n)]\n *)(var |\n)/g, jtfn0);
s.text = s.text.replace(/} *catch *\((\w+)\) *{/g, jtfn2);
s.text = s.text.replace(/} *catch *\(\) *{/g, '} catch() { if(db$flags(3)) alert("catch with no argument"),step$l=2;');
s.text = s.text.replace(/(\n *)return +([^ ;\n][^;\n]*); *\n/g, jtfn3);
return;
}

// copy of the Event class, because Blob needs it.
function Event(etype){
    // event state is kept read-only by forcing
    // a new object for each event.  This may not
    // be appropriate in the long run and we'll
    // have to decide if we simply dont adhere to
    // the read-only restriction of the specification
    this.bubbles =     this.cancelable = true;
    this.defaultPrevented = false;
    this.currentTarget =     this.target = null;
    this.eventPhase = 0;
    this.timeStamp = new Date().getTime();
if(typeof etype == "string") this.type = etype;
};

// sort some objects based on timestamp.
// There should only be a few, thus a bubble sort.
// If there are many, this will hang for a long time.
// Might have to write a native method to use qsort.
function sortTime(list) {
var l = list.length;
if(!l) return;
if(l > 20) alert3("sortTime with " + l + " objects");
var i, swap, change = true;
while(change) { change = false;
for(i=0; i<l-1; ++i)
if(list[i].timeStamp > list[i+1].timeStamp)
swap = list[i], list[i] = list[i+1], list[i+1] = swap, change = true;
}
}

function DOMParser() {
return {
parseFromString: function(t,y) {
var d = my$doc();
if(y == "text/html" || y == "text/xml") {
var v = d.createElement("iframe");
if(t) {
if(typeof t == "string") {
if(y.match(/xml$/)) t = "`~*xml}@;" + t;
v.src = "data:" + y + "," + encodeURIComponent(t);
} else
alert3("DOMParser expects a string but gets " + typeof t);
}
// this expands the frame on demand
return v.contentDocument;
}
if(y == "text/plain") {
return d.createTextNode(t);
}
alert3("trying to use the DOMParser\n" + y + " <<< ");
alert4(t);
alert3(">>>");
return d.createTextNode("DOMParser not yet implemented");
}}}

// various XMLHttpRequest methods
function xml_open(method, url, async, user, password){
if(user || password) alert3("xml user and password ignored");
this.readyState = 1;
this.async = (async === false)?false:true;
this.method = method || "GET";
alert3("xhr " + (this.async ? "async " : "") + "open " + this.method + " " + url);
this.url = resolveURL(my$win().eb$base, url);
this.status = 0;
this.statusText = "";
// state = 1 and technically that's a change
// a website might use this to set something up, before send
// warning: if you don't call open, just set variables, this won't be called;
// but I think you're suppose to call open
if(typeof this.onreadystatechange == "function") this.onreadystatechange();
};

function xml_srh(header, value){
this.headers[header] = value;
};

function xml_grh(header){
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
if (returnedHeaders.length) return returnedHeaders.join(", ");
}
return null;
};

function xml_garh(){
var header, returnedHeaders = [];
if (this.readyState < 3){
throw new Error("INVALID_STATE_ERR");
} else {
for (header in this.responseHeaders)
returnedHeaders.push( header + ": " + this.responseHeaders[header] );
}
return returnedHeaders.join("\r\n");
};

function xml_send(data, parsedoc){
if(parsedoc) alert3("xml parsedoc ignored");
var w = my$win();
var headerstring = "";
for (var item in this.headers) {
var v1=item;
var v2=this.headers[item];
headerstring+=v1+': '+v2+'\n';
}
if(headerstring) alert3("xhr headers " + headerstring.replace(/\n$/,''));
var urlcopy = this.url;
if(urlcopy.match(/[*'";\[\]$\u0000-\u0020\u007f-\uffff]/)) {
alert3("xhr url does not look encoded");
// but assume it was anyways, cause it should be
//urlcopy = encodeURI(urlcopy);
}
if(data) {
alert3("xhr data " + data);
// no idea if data is already encoded or not.
/*
if(data.match(/[!*'";\[\]$\u0000-\u0020\u007f-\uffff]/)) {
alert3("xhr data was not encoded");
data = encodeURI(data);
}
*/
}
// check the sanity of data
if(data === null || data === undefined) data = "";
var td = typeof data;
var pd = 0; // how to process the data
if(td == "object" && data instanceof w.Uint8Array) {
pd = 1;
// Turn the byte array into utf8.
// code 0 becomes code 256, so we don't have a problem with null bytes.
var s="";
for(var i=0; i<data.length; ++i)
s += String.fromCharCode(data[i]?data[i]:256);
td = typeof (data = s);
}
// what do we do about Uint16Array and Uint32Array?
if(td != "string") {
alert3("payload data has improper type " + td);
}
this.$entire =  eb$fetchHTTP.call(this, urlcopy,this.method,headerstring,data, pd);
if(this.$entire != "async") this.parseResponse();
};

function xml_parse(){
var responsebody_array = this.$entire.split("\r\n\r\n");
var success = parseInt(responsebody_array[0]);
var code = parseInt(responsebody_array[1]);
var url2 = responsebody_array[2];
var http_headers = responsebody_array[3];
responsebody_array[0] = responsebody_array[1] = responsebody_array[2] = responsebody_array[3] = "";
this.responseText = responsebody_array[4];
if(typeof this.responseText != "string") this.responseText = "";
// some want responseText, some just want response
this.response = this.responseText;
var hhc = http_headers.split(/\r?\n/);
for(var i=0; i<hhc.length; ++i) {
var value1 = hhc[i];
if(!value1.match(/:/)) continue;
var value2 = value1.replace(/:.*/, "");
var value3 = value1.replace(/^.*?:/, "");
this.responseHeaders[value2] = value3.trim();
}

this.readyState = 4;
this.responseURL = url2.replace(/#.*/,"");
if(success) {
this.status = code;
// need a real statusText for the codes
this.statusText = (code == 200 ? "OK" : "http error " + code);

// Should we run the xml parser if the status was not 200?
// And should we run it before the onreadystatechange function?
var ct = this.getResponseHeader("^content-type$");
if(!ct) ct = "text/xml"; // default
// if overrideMimeType called, should we replace it in headers, or just here?
if(this.eb$mt) ct = this.eb$mt;
if(ct) ct = ct.toLowerCase().replace(/;.*/,'');
if(code >= 200 && code < 300 && ct && (ct == "text/xml" || ct == "application/xml")) {
alert3("parsing the response as xml");
this.responseXML = (new (my$win().DOMParser)()).parseFromString(this.responseText, "text/xml");
}

// I'll do the load events, not loadstart or progress or loadend etc.
var w = my$win();
var e = new w.Event;
e.initEvent("load", true, true);
e.loaded = this.response.length;
this.dispatchEvent(e);
// I don't understand the upload object at all
this.upload.dispatchEvent(e);

// does anyone call addEventListener for readystatechange? Hope not.
if(typeof this.onreadystatechange == "function") this.onreadystatechange();
} else {
this.status = 0;
this.statusText = "network error";
}
};

// this is a minimal EventTarget class. It has the listeners but doesn't
// inherit all the stuff from Node, like it should.
// It is here so XMLHttpRequest can inherit its listeners.
function EventTarget(){}
EventTarget.prototype.addEventListener = addEventListener;
EventTarget.prototype.removeEventListener = removeEventListener;
EventTarget.prototype.dispatchEvent = dispatchEvent;

function XMLHttpRequestEventTarget(){}
XMLHttpRequestEventTarget.prototype = new EventTarget;

function XMLHttpRequestUpload(){}
XMLHttpRequestUpload.prototype = new XMLHttpRequestEventTarget;

// Originally implemented by Yehuda Katz
// And since then, from envjs, by Thatcher et al
function XMLHttpRequest() {
    this.headers = {};
    this.responseHeaders = {};
    this.aborted = false;//non-standard
    this.withCredentials = true;
this.upload = new XMLHttpRequestUpload;
}
XMLHttpRequest.prototype = new EventTarget;
// defined by the standard: http://www.w3.org/TR/XMLHttpRequest/#xmlhttprequest
// but not provided by Firefox.  Safari and others do define it.
XMLHttpRequest.UNSENT = 0;
XMLHttpRequest.OPEN = 1;
XMLHttpRequest.HEADERS_RECEIVED = 2;
XMLHttpRequest.LOADING = 3;
XMLHttpRequest.DONE = 4;
XMLHttpRequest.prototype.toString = function(){return "[object XMLHttpRequest]"}
XMLHttpRequest.prototype.open = xml_open;
// FormData takes over this function, and sets _hasContentType
// if we are setting "Content-Type"
// If even one website anywhere wants to take over this method, as FormData does,
// then we have to move this XMLHttpRequest stuff back to startwindow.
// See the comments on the URL class and why it has to be there.
XMLHttpRequest.prototype.setRequestHeader = xml_srh;
XMLHttpRequest.prototype.getResponseHeader = xml_grh;
XMLHttpRequest.prototype.getAllResponseHeaders = xml_garh;
// FormData takes over this function and sends it a different way
//if the data is an instance of FormDataPolyfill
XMLHttpRequest.prototype.send = xml_send;
XMLHttpRequest.prototype.parseResponse = xml_parse;
XMLHttpRequest.prototype.overrideMimeType = function(t) {
if(typeof t == "string") this.eb$mt = t;
}
XMLHttpRequest.prototype.eb$mt = null;
XMLHttpRequest.prototype.async = false;
XMLHttpRequest.prototype.readyState = 0;
XMLHttpRequest.prototype.responseText = "";
XMLHttpRequest.prototype.response = "";
XMLHttpRequest.prototype.responseXML = null;
XMLHttpRequest.prototype.status = 0;
XMLHttpRequest.prototype.statusText = "";

this.CSS = {
supports:function(w){ alert3("CSS.supports("+w+")"); return false},
escape:function(s) {
if(typeof s == "number") s = s.toString();
if(typeof s != "string") return null;
return s.replace(/([\\()\[\]{}.#])/g, function(a,b){ return "\\"+b})
}}

// Internationalization method, this is a stub, English only.
// Only date and numbers, the most common.

function Intl_dt(w) {
alert3("Int_datetime("+w+")");
this.locale = w;
}
Object.defineProperty(Intl_dt.prototype, "format", {value:function(d) {
if(typeof d != "object") return ""
if(typeof d.getYear != "function") return ""
return `${d.getMonth()+1}/${d.getDate()}/${d.getYear()+1900}`;
}})

function Intl_num(w) {
alert3("Int_number("+w+")");
this.locale = w;
}
Object.defineProperty(Intl_num.prototype, "format", {value:function(n) {
if(typeof n != "number") return "NaN";
var sign = '';
if(n < 0) sign = '-', n = -n;
var m = Math.floor(n), r = n - m, s = "";
if(r) {
s = r + "", s = s.substr(1);
// lots of possible round off errors here
// 37.40000000000238 becomes 37.4
s = s.replace(/\.*000000.*/, "")
// 54.99999999373 becomes 55
if(s.match(/^\.999999/))
s = "", ++m;
// 37.39999999378 becomes 37.4, not so easy to do
if(s.match(/999999/)) {
s = s.replace(/999999.*/, "")
var l = s.length - 1;
s = s.substr(0,l) + (1 + parseInt(s.substr(l)));
}
}
while(m >= 1000) {
r = m % 1000;
r = r + "";
while(r.length < 3) r = '0' + r;
s = ',' + r + s;
m = Math.floor(m/1000)
}
return sign + m + s;
}})

function Intl() {}
Object.defineProperty(Intl, "DateTimeFormat", {value:Intl_dt})
Object.defineProperty(Intl, "NumberFormat", {value:Intl_num})

// Returns default port as an integer, based on protocol.
// Used by the URL class below, but other places as well.
function setDefaultPort(p) {
var port = 0;
p = p.toLowerCase().replace(/:/, "");
if(defport.hasOwnProperty(p)) port = defport[p];
return port;
}

// It's crude, but just reindex all the rows in a table.
// Used by the Table class below, but other places as well.
function rowReindex(t) {
// climb up to find Table
while(t.dom$class != "HTMLTableElement") {
if(t.is$frame) return;
t = t.parentNode;
if(!t) return;
}

var i, j, n = 0;
var s; // section
t.rows.length = 0;
if(s = t.tHead) {
for(j=0; j<s.rows.length; ++j)
t.rows.push(s.rows[j]), s.rows[j].rowIndex = n++, s.rows[j].sectionRowIndex = j;
}
for(i=0; i<t.tBodies.length; ++i) {
s = t.tBodies[i];
for(j=0; j<s.rows.length; ++j)
t.rows.push(s.rows[j]), s.rows[j].rowIndex = n++, s.rows[j].sectionRowIndex = j;
}
if(s = t.tFoot) {
for(j=0; j<s.rows.length; ++j)
t.rows.push(s.rows[j]), s.rows[j].rowIndex = n++, s.rows[j].sectionRowIndex = j;
}

j = 0;
for(s=t.firstChild; s; s=s.nextSibling)
if(s.dom$class == "HTMLTableRowElement")
t.rows.push(s), s.rowIndex = n++, s.sectionRowIndex = j;
}

/*********************************************************************
We can define (build) the various classes for the running window here,
if we are always careful to use the window parameter w in everything we do,
in creating objects and arrays, etc.
This lets us put more software into the shared window.
*********************************************************************/

function setupClasses(w) {
const d = w.document;

// we really need some shorthand here
let odp = w.Object.defineProperty;
// set window property (swp), invisible and unchangeable
function swp(k, v) { odp(w, k, {value:v})}
// visible (enumerable), but still protected
function swpv(k, v) { odp(w, k, {value:v,enumerable:true})}
// set window property unseen, but changeable
function swpc(k, v) { odp(w, k, {value:v, writable:true, configurable:true})}
// establish the prototype, for inheritance, then set dom$class.
// If our made-up class is z$Foo, dom$class becomes Foo.
// (we only have a couple of these).
// the letters mean set window property prototype.
function swpp(c, inherit) {
    const v = c.replace(/^z\$/, "");
    if(inherit)
        odp(w[c], "prototype", {value:new inherit});
    odp(w[c].prototype, "dom$class", {value:v});
}

// Establish properties under document, as we did with window.
// These are not classes and will not have custom prototypes.
function sdpc(k, v) { odp(d, k, {value:v, writable:true, configurable:true})}

// here comes the URL class, which is head-spinning in its complexity.
// Note the use of swpc, window property changeable, because people can and do
// replace the standard URL class with their own, or even pieces of it,
// such as the toString method.  😬
swpc("URL", function() {
let h = "";
if(arguments.length == 1) h= arguments[0];
if(arguments.length == 2) h= resolveURL(arguments[1], arguments[0]);
this.href = h;
})
swpp("URL", null)
// z$URL is a synonym, for our own purposes.
swp("z$URL", w.URL)

// we need a couple of helper functions
function url_rebuild() {
var h = "";
if(this.protocol$val) {
// protocol includes the colon
h = this.protocol$val;
var plc = h.toLowerCase();
if(plc != "mailto:" && plc != "telnet:" && plc != "javascript:")
h += "//";
}
if(this.host$val) {
h += this.host$val;
} else if(this.hostname$val) {
h += this.hostname$val;
if(this.port$val) h += ":" + this.port$val;
}
if(this.pathname$val) {
// pathname should always begin with /, should we check for that?
if(!this.pathname$val.match(/^\//))
h += "/";
h += this.pathname$val;
}
if(this.search$val) {
// search should always begin with ?, should we check for that?
h += this.search$val;
}
if(this.hash$val) {
// hash should always begin with #, should we check for that?
h += this.hash$val;
}
this.href$val = h;
if(this.eb$ctx) {
// replace the web page
eb$newLocation('r' + this.eb$ctx + this.href$val + '\n');
}
}

function url_hrefset(v) {
var inconstruct = true, firstassign = false;
// if passed a url, turn it back into a string
if(v === null || v === undefined) v = "";
if(v.dom$class == "URL" || v instanceof w.URL) v = v.toString();
if(typeof v != "string") return;
if(v.substr(0,7) == "Wp`Set@") v = v.substr(7), firstassign = true;
v = resolveURL(w.eb$base, v);
// return or blow up if v is not a url; not yet implemented
if(typeof this.href$val == "string") inconstruct = false;
if(inconstruct) {
odp(this, "href$val", {enumerable:false, writable:true, value:v});
odp(this, "protocol$val", {enumerable:false, writable:true, value:""});
odp(this, "hostname$val", {enumerable:false, writable:true, value:""});
odp(this, "host$val", {enumerable:false, writable:true, value:""});
odp(this, "port$val", {enumerable:false, writable:true, value:""});
odp(this, "pathname$val", {enumerable:false, writable:true, value:""});
odp(this, "search$val", {enumerable:false, writable:true, value:""});
odp(this, "hash$val", {enumerable:false, writable:true, value:""});
} else {
this.href$val = v;
this.port$val = this.protocol$val = this.host$val = this.hostname$val = this.pathname$val = this.search$val = this.hash$val = "";
}
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
// Watch out, ipv6 has : in the middle.
if(this.host$val.substr(0,1) == '[') { // I'll assume this is ipv6
if(this.host$val.match(/]:/)) {
this.hostname$val = this.host$val.replace(/]:.*/, "]");
this.port$val = this.host$val.replace(/^.*]:/, "");
} else {
this.hostname$val = this.host$val;
//this.port$val = setDefaultPort(this.protocol$val);
}
} else {
if(this.host$val.match(/:/)) {
this.hostname$val = this.host$val.replace(/:.*/, "");
this.port$val = this.host$val.replace(/^.*:/, "");
} else {
this.hostname$val = this.host$val;
//this.port$val = setDefaultPort(this.protocol$val);
}
}
// perhaps set protocol to http if it looks like a url?
// as in edbrowse foo.bar.com
// Ends in standard tld, or looks like an ip4 address, or starts with www.
if(this.protocol$val == "" &&
(this.hostname$val.match(/\.(com|org|net|info|biz|gov|edu|us|uk|ca|au)$/) ||
this.hostname$val.match(/^\d+\.\d+\.\d+\.\d+$/) ||
this.hostname$val.match(/^\[[\da-fA-F:]+]$/) ||
this.hostname$val.match(/^www\..*\.[a-zA-Z]{2,}$/))) {
this.protocol$val = "http:";
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
if(!firstassign && this.eb$ctx) {
// replace the web page
eb$newLocation('r' + this.eb$ctx + this.href$val + '\n');
}
}

// don't forget the w here, and in other vital places below.
let urlp = w.URL.prototype;
odp(urlp, "rebuild", {value:url_rebuild})
odp(urlp, "protocol", {
  get: function() {return this.protocol$val; },
  set: function(v) { this.protocol$val = v; this.rebuild(); },
enumerable:true});
odp(urlp, "pathname", {
  get: function() {return this.pathname$val; },
  set: function(v) { this.pathname$val = v; this.rebuild(); },
enumerable:true});
odp(urlp, "search", {
  get: function() {return this.search$val; },
  set: function(v) { this.search$val = v; this.rebuild(); },
enumerable:true});
odp(urlp, "searchParams", {
  get: function() {return new w.URLSearchParams(this.search$val); },
// is there a setter?
enumerable:true});
odp(urlp, "hash", {
  get: function() {return this.hash$val; },
  set: function(v) { if(typeof v != "string") return; if(!v.match(/^#/)) v = '#'+v; this.hash$val = v; this.rebuild(); },
enumerable:true});
odp(urlp, "port", {
  get: function() {return this.port$val; },
  set: function(v) { this.port$val = v;
if(this.hostname$val.length)
this.host$val = this.hostname$val + ":" + v;
this.rebuild(); },
enumerable:true});
odp(urlp, "hostname", {
  get: function() {return this.hostname$val; },
  set: function(v) { this.hostname$val = v;
if(this.port$val)
this.host$val = v + ":" +  this.port$val;
this.rebuild(); },
enumerable:true});
odp(urlp, "host", {
  get: function() {return this.host$val; },
  set: function(v) { this.host$val = v;
if(v.match(/:/)) {
this.hostname$val = v.replace(/:.*/, "");
this.port$val = v.replace(/^.*:/, "");
} else {
this.hostname$val = v;
this.port$val = "";
}
this.rebuild(); },
enumerable:true})
odp(urlp, "href", {
  get: function() {return this.href$val; },
  set: url_hrefset,
enumerable:true})
odp(urlp, "toString", {enumerable:false,writable:true,configurable:true,value:function() {  return this.href$val}})
// use toString in the following - in case they replace toString with their own function.
// Don't just grab href$val, tempting as that may be.
odp(urlp, "length", {enumerable:false,get:function() { return this.toString().length; }})
odp(urlp, "concat", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().concat(s); }})
odp(urlp, "startsWith", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().startsWith(s); }})
odp(urlp, "endsWith", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().endsWith(s); }})
odp(urlp, "includes", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().includes(s); }})
// Can't turn URL.search into String.search, because search is already a
// property of URL, that is, the search portion of the URL.
odp(urlp, "indexOf", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().indexOf(s); }})
odp(urlp, "lastIndexOf", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().lastIndexOf(s); }})
odp(urlp, "substring", {enumerable:false,writable:true,configurable:true,value:function(from, to) {  return this.toString().substring(from, to); }})
odp(urlp, "substr", {enumerable:false,writable:true,configurable:true,value:function(from, to) {return this.toString().substr(from, to);}})
odp(urlp, "toLowerCase", {enumerable:false,writable:true,configurable:true,value:function() {  return this.toString().toLowerCase(); }})
odp(urlp, "toUpperCase", {enumerable:false,writable:true,configurable:true,value:function() {  return this.toString().toUpperCase(); }})
odp(urlp, "match", {enumerable:false,writable:true,configurable:true,value:function(s) {  return this.toString().match(s); }})
odp(urlp, "replace", {enumerable:false,writable:true,configurable:true,value:function(s, t) {  return this.toString().replace(s, t); }})
odp(urlp, "split", {enumerable:false,writable:true,configurable:true,value:function(s) { return this.toString().split(s); }})
odp(urlp, "slice", {enumerable:false,writable:true,configurable:true,value:function(from, to) { return this.toString().slice(from, to); }})
odp(urlp, "charAt", {enumerable:false,writable:true,configurable:true,value:function(n) { return this.toString().charAt(n); }})
odp(urlp, "charCodeAt", {enumerable:false,writable:true,configurable:true,value:function(n) { return this.toString().charCodeAt(n); }})
odp(urlp, "trim", {enumerable:false,writable:true,configurable:true,value:function() { return this.toString().trim(); }})

swp("CharacterData", function(){})
swpp("CharacterData", null)

swp("Validity", function(){})
swpp("Validity", null)
/*********************************************************************
All these should be getters, or should they?
Consider the tooLong attribute.
tooLong could compare the length of the input with the maxLength attribute,
that's what the gettter would do, but edbrowse already does that at entry time.
In general, shouldn't edbrowse check for most r all of these on entry,
so then most of these wouldn't have to be getters?
patternMismatch on email and url, etc.
One thing that always has to be a getter is valueMissing,
cause <input> starts out empty.
And valid is a getter, true if everything else is false.
*********************************************************************/
let valp =w.Validity.prototype;
valp.badInput =
valp.customError =
valp.patternMismatch =
valp.rangeOverflow =
valp.rangeUnderflow =
valp.stepMismatch =
valp.tooLong =
valp.tooShort =
valp.typeMismatch = false;
odp(valp, "valueMissing", {
get: function() {let o = this.owner;  return o.required && o.value == ""; }})
odp(valp, "valid", {
get: function() { // only need to check items with getters
return !(this.valueMissing)}})

// Node is the king of all classes. I don't define it here, because it has
// some complexity with the window object. So define it in startwindow.js.
// But we can set most of the instance methods here. These methods,
// e.g. appendchild, are often functions within this file anyways.
let nodep = w.Node.prototype;
// These are native, so it's ok to bounce off of document.
// They are our own helper functions, thus eb$
nodep.eb$apch1 = d.eb$apch1;
nodep.eb$apch2 = d.eb$apch2;
nodep.eb$rmch2 = d.eb$rmch2;
nodep.eb$insbf = d.eb$insbf;

// These subordinate objects are on-demand.
odp( nodep, "dataset", { get: function(){
if(!this.dataset$2)
odp(this, "dataset$2", {value:new w.Object})
return this.dataset$2}})
odp( nodep, "attributes", { get: function(){ if(!this.attributes$2) {
odp(this, "attributes$2", {value:new w.NamedNodeMap})
this.attributes$2.owner = this
this.attributes$2.ownerDocument = this.ownerDocument ? this.ownerDocument : d;
}
return this.attributes$2}})
odp( nodep, "style", { get: function(){ if(!this.style$2) {
odp(this,"style$2", {value:new w.CSSStyleDeclaration,configurable:true});
this.style$2.element = this}
return this.style$2}})

nodep.getRootNode = getRootNode;
nodep.contains = nodeContains;
nodep.matches = w.querySelector0;
nodep.closest = function(s) {
let u = this;
while(u.nodeType == 1) { if(u.matches(s)) return u; u = u.parentNode; }
return null}
nodep.hasChildNodes = hasChildNodes;
nodep.appendChild = appendChild;
nodep.prependChild = prependChild;
nodep.insertBefore = insertBefore;
nodep.append = function() {
let l = arguments.length;
for(let i=0; i<l; ++i) {
let c = arguments[i];
if(typeof c == "string") c = d.createTextNode(c); // convert to node
if(c.nodeType > 0) this.appendChild(c);
}}
nodep.prepend = function() {
let l = arguments.length;
for(let i=l-1; i>=0; --i) {
let c = arguments[i];
if(typeof c == "string") c = d.createTextNode(c); // convert to node
if(c.nodeType > 0) this.prependChild(c);
}}
nodep.before = function() {
let p = this.parentNode;
if(!p) return;
let l = arguments.length;
for(let i=0; i<l; ++i) {
let c = arguments[i];
if(typeof c == "string") c = d.createTextNode(c);
if(c.nodeType > 0) p.insertBefore(c, this);
}}
nodep.after = function() {
let p = this.parentNode;
if(!p) return;
let l = arguments.length;
let n = this.nextSibling;
for(let i=0; i<l; ++i) {
let c = arguments[i];
if(typeof c == "string") c = d.createTextNode(c);
if(c.nodeType > 0)
n ? p.insertBefore(c,n) : p.appendChild(c);
}}
nodep.replaceWith = function() {
let p = this.parentNode;
if(!p) return;
let l = arguments.length;
let n = this.nextSibling;
for(let i=0; i<l; ++i) {
let c = arguments[i];
if(typeof c == "string") c = d.createTextNode(c);
if(c.nodeType > 0)
n ? p.insertBefore(c,n) : p.appendChild(c);
}
p.removeChild(this);
}
nodep.replaceChild = replaceChild;
nodep.removeChild = removeChild;
nodep.remove = function() {
if(this.parentNode) this.parentNode.removeChild(this)}
odp(nodep, "firstChild", {
get: function() {
return (this.childNodes && this.childNodes.length) ?
this.childNodes[0] : null; } })
odp(nodep, "firstElementChild", {
get: function() {
let u = this.childNodes;
if(!u) return null;
for(let i=0; i<u.length; ++i) if(u[i].nodeType == 1) return u[i];
return null}});
odp(nodep, "lastChild", {
get: function() {
return (this.childNodes && this.childNodes.length) ?
this.childNodes[this.childNodes.length-1] : null} })
odp(nodep, "lastElementChild", {
get: function() {
let u = this.childNodes;
if(!u) return null;
for(let i=u.length-1; i>=0; --i) if(u[i].nodeType == 1) return u[i];
return null}})
odp(nodep, "childElementCount", {
get: function() {
let z=0, u = this.childNodes;
if(!u) return z;
for(let i=0; i<u.length; ++i) if(u[i].nodeType == 1) ++z;
return z}})
odp(nodep, "nextSibling", { get: function() {
return getSibling(this,"next")} })
odp(nodep, "nextElementSibling", { get: function() {
return getElementSibling(this,"next")} })
odp(nodep, "previousSibling", { get: function() {
return getSibling(this,"previous")} })
odp(nodep, "previousElementSibling", { get: function() {
return getElementSibling(this,"previous")} })
// children is subtly different from childnodes; this code taken from
// https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children
odp(nodep, 'children', {
get: function() {
let i = 0, node, nodes = this.childNodes, children = new w.Array;
if(!nodes) return children;
while(i<nodes.length) {
node = nodes[i++];
if (node.nodeType === 1)  children.push(node);
}
return children;
}})

// attributes, functions are in the attr object
nodep.hasAttribute = attr.hasAttribute;
nodep.hasAttributeNS = attr.hasAttributeNS;
nodep.getAttribute = attr.getAttribute;
nodep.getAttributeNS = attr.getAttributeNS;
nodep.getAttributeNames = attr.getAttributeNames;
nodep.setAttribute = attr.setAttribute;
nodep.setAttributeNS = attr.setAttributeNS;
nodep.removeAttribute = attr.removeAttribute;
nodep.removeAttributeNS = attr.removeAttributeNS;
nodep.getAttributeNode = attr.getAttributeNode;
nodep.setAttributeNode = attr.setAttributeNode;
nodep.removeAttributeNode = attr.removeAttributeNode;

odp(nodep, "className", {
get: function() {
let c = this.getAttribute("class");
if(c === null) return "";
return c; },
set: function(h) {
this.setAttribute("class", h)}})
odp(nodep, "parentElement", {
get: function() {
return this.parentNode && this.parentNode.nodeType == 1 ?
this.parentNode : null}})
nodep.getClientRects = function(){ return new w.Array; }
// clone
nodep.cloneNode = d.cloneNode;
// I don't see anywhere in spec that this is an Element method
//nodep.importNode = d.importNode;
// visual
nodep.focus = function(){d.activeElement=this}
nodep.blur = function(){d.activeElement=null}
nodep.getBoundingClientRect = d.getBoundingClientRect;
nodep.addEventListener = addEventListener;
nodep.removeEventListener = removeEventListener;
nodep.dispatchEvent = dispatchEvent;
// outerHTML is dynamic; should innerHTML be?
odp(nodep, "outerHTML", { get: function() { return htmlString(this);},
set: function(h) { outer$1(this,h); }});
// constants
nodep.ELEMENT_NODE = 1
nodep.TEXT_NODE = 3
nodep.COMMENT_NODE = 8
nodep.DOCUMENT_NODE = 9
nodep.DOCUMENT_TYPE_NODE = 10
nodep.DOCUMENT_FRAGMENT_NODE = 11
// default tabIndex is 0 but running js can override this.
nodep.tabIndex = 0
// class and text methods
odp(nodep, "classList", { get : function() { return classList(this);}});
nodep.cl$present = true;
odp(nodep, "textContent", {
get: function() { return textUnder(this, 0); },
set: function(s) { return newTextUnder(this, s, 0); }});
odp(nodep, "contentText", {
get: function() { return textUnder(this, 1); },
set: function(s) { return newTextUnder(this, s, 1); }});
odp(nodep, "nodeValue", {
get: function() {
return this.nodeType == 3 ?
this.data : this.nodeType == 4 ? this.text : null;},
set: function(h) {
if(this.nodeType == 3) this.data = h;
if (this.nodeType == 4) this.text = h }})

nodep.insertAdjacentElement = function(pos, e) {
let n, p = this.parentNode;
if(!p || typeof pos != "string") return null;
pos = pos.toLowerCase();
switch(pos) {
case "beforebegin": return p.insertBefore(e, this);
case "afterend": n = this.nextSibling; return n ? p.insertBefore(e, n) : p.appendChild(e);
case "beforeend": return this.appendChild(e);
case "afterbegin": return this.prependChild(e);
return null;
}
}

nodep.insertAdjacentHTML = function(flavor, h) {
// easiest implementation is just to use the power of innerHTML
let p = d.createElement("p");
p.innerHTML = h; // the magic
let s, parent = this.parentNode;
switch(flavor) {
case "beforebegin":
while(s = p.firstChild)
parent.insertBefore(s, this);
break;
case "afterbegin":
while(s = p.lastChild)
this.insertBefore(s, this.firstChild);
break;
case "beforeend":
while(s = p.firstChild)
this.appendChild(s);
break;
case "afterend":
while(s = p.lastChild)
parent.insertBefore(s, this.nextSibling);
break;
}
}

nodep.clientHeight = 16;
nodep.clientWidth = 120;
nodep.scrollHeight = 16;
nodep.scrollWidth = 120;
nodep.scrollTop = 0;
nodep.scrollLeft = 0;
nodep.offsetHeight = 16;
nodep.offsetWidth = 120;
nodep.dir = "auto";

// This is a manufactured method for css purposes,
// to inject words or marks before or after a tag, marks that you don't see
// unless you type showall, marks that nobody probably cares about anyways,
// but I read about it in the spec and tried to make it happen.
nodep.injectSetup = function(which) {
let z = this;
switch(which) {
case 'a':
if(!this.inj$after) {
z = this.appendChild(d.createTextNode())
odp(z, "inj$css", {value:true})
odp(this, "inj$after", {value:true})
} else z = this.lastChild;
break;
case 'b':
if(!this.inj$before) {
z = this.prependChild(d.createTextNode())
odp(z, "inj$css", {value:true})
odp(this, "inj$before", {value:true})
} else z = this.firstChild;
break;
}
// establish the style object, for the calling function in css.c
w.soj$ = z.style;
}

/*********************************************************************
compareDocumentPosition:
The documentation I found was unclear as to the meaning
of preceding and following.
Does A precede B if it appears first in a depth first search of the tree,
or if it appears first wherein they have the same parent,
or if they are siblings?
I have no clue, so I'm going for the latter, partly because it's easy.
That means the relationships are disjoint.
A can't contain B and precede B simultaneously.
So I don't know why they say these are bits in a bitmask.
Also not clear if "contains" can descend into a subframe. I don't check for this.
*********************************************************************/
odp(nodep,"DOCUMENT_POSITION_DISCONNECTED",{value:1});
odp(nodep,"DOCUMENT_POSITION_PRECEDING",{value:2});
odp(nodep,"DOCUMENT_POSITION_FOLLOWING",{value:4});
odp(nodep,"DOCUMENT_POSITION_CONTAINS",{value:8});
odp(nodep,"DOCUMENT_POSITION_CONTAINED_BY",{value:16});
nodep.compareDocumentPosition = function(z) {
if(this === z) return DOCUMENT_POSITION_DISCONNECTED;
if(this.parentNode === z.parentNode) {
if(this.nextSibling === z) return DOCUMENT_POSITION_FOLLOWING;
if(this.previousSibling === z) return DOCUMENT_POSITION_PRECEDING;
return DOCUMENT_POSITION_DISCONNECTED;
}
let t = this;
while(t.parentNode) {
t = t.parentNode;
if(t === z) return DOCUMENT_POSITION_CONTAINED_BY;
}
t = z;
while(t.parentNode) {
t = t.parentNode;
if(t === this) return DOCUMENT_POSITION_CONTAINS;
}
return DOCUMENT_POSITION_DISCONNECTED;
}

// The html element, which is the head of the DOM nodes that you know and love.
swp("HTMLElement", function(){})
swpp("HTMLElement", w.Node)
let elemp = w.HTMLElement.prototype;
/* According to MDN Element isn't a synonym for HTMLElement, as SVGElement
should also inherit from it, but leave as is until we get there */
swpc("Element", w.HTMLElement)
// spillup and spilldown for id and name
odp(elemp, "name", {
get: function() {
const isinput = (this.dom$class == "HTMLInputElement" || this.dom$class == "HTMLButtonElement" || this.dom$class == "HTMLSelectElement");
if(!isinput) return this.name$2 ;
// name property spills up and down for input, acid test 53
let t = this.getAttribute("name");
return typeof t == "string" ? t : undefined}, 
set: function(n) {
const isinput = (this.dom$class == "HTMLInputElement" || this.dom$class == "HTMLButtonElement" || this.dom$class == "HTMLSelectElement");
if(!isinput) { odp(this, "name$2", {value:n,writable:true,configurable:true}); return}
const f = this.form;
if(f && f.dom$class == "HTMLFormElement") {
const oldname = this.getAttribute("name");
if(oldname && f[oldname] == this) delete f[oldname];
if(oldname && f.elements[oldname] == this) delete f.elements[oldname];
if(!f[n]) f[n] = this;
if(!f.elements[n]) f.elements[n] = this;
}
this.setAttribute("name", n);
}});
odp(elemp, "id", {
get:function(){ var t = this.getAttribute("id");
return typeof t == "string" ? t : undefined; },
set:function(v) { this.setAttribute("id", v)}});
odp(elemp, "title", {
get:function(){ const t = this.getAttribute("title");
// in the real world this is always a string, but acid test 3 has numbers for titles
const y = typeof t;
return y == "string" || y == "number" ? t : undefined; },
set:function(v) { this.setAttribute("title", v);}});
// almost anything can be disabled, an entire div section, etc
odp(elemp, "disabled", {
get:function(){ const t = this.getAttribute("disabled");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("disabled", v);}});
odp(elemp, "hidden", {
get:function(){ const t = this.getAttribute("hidden");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("hidden", v);}});
elemp.nodeType = 1;

swp("SVGElement", function(){})
swpp("SVGElement", w.Element)

// Document class is defined in startwindow, but we'll need its prototype.
let docup = w.Document.prototype;

swp("TextNode", function(){
odp(this, "data$2", {value:"",writable:true})
if(arguments.length > 0) {
// data always has to be a string
this.data$2 += arguments[0];
}
})
swpp("TextNode", w.HTMLElement)
let textp = w.TextNode.prototype;
textp.nodeName = textp.tagName = "#text";
textp.nodeType = 3;
// setter insures data is always a string, because roving javascript might:
// node.data = 7;  ...  if(node.data.match(/x/) ...
// and boom! It blows up because Number doesn't have a match function.
odp(textp, "data", {
get: function() { return this.data$2; },
set: function(s) { this.data$2 = s + ""; }})

// Since we are createing all these classes here, does it make sense to
// include the methods to properly instantiate those classes?  Perhaps.
docup.createTextNode = function(t) {
if(t == undefined) t = "";
const c = new w.TextNode(t);
/* A text node chould never have children, and does not need childNodes array,
 * but there is improper html out there <text> <stuff> </text>
 * which has to put stuff under the text node, so against this
 * unlikely occurence, I have to create the array.
 * I have to treat a text node like an html node. */
    odp(c, "childNodes", {value:new w.Array,writable:true,configurable:true});
    odp(c, "parentNode", {value:null,writable:true,configurable:true});
if(this.eb$xml) c.eb$xml = true;
eb$logElement(c, "text");
return c;
}

swp("Comment", function(t) {
this.data = t;
})
swpp("Comment", w.HTMLElement)
let cmtp = w.Comment.prototype;
cmtp.nodeName = cmtp.tagName = "#comment";
cmtp.nodeType = 8;


docup.createComment = function(t) {
if(t == undefined) t = "";
const c = new w.Comment(t);
    odp(c, "childNodes", {value:new w.Array,writable:true,configurable:true});
    odp(c, "parentNode", {value:null,writable:true,configurable:true});
eb$logElement(c, "comment");
return c;
}

swp("DocumentFragment", function(){})
swpp("DocumentFragment", w.HTMLElement)
let fragp = w.DocumentFragment.prototype;
fragp.nodeType = 11;
fragp.nodeName = fragp.tagName = "#document-fragment";
fragp.querySelector = w.querySelector
fragp.querySelectorAll = function(c,s) { return new w.NodeList(w.querySelectorAll.call(this,c,s)) }

docup.createDocumentFragment = function() {
const c = this.createElement("fragment");
return c;
}

// tables, table sections, rows, cells.
// First some helper functions to add and remove rows from a table or section,
// add and remove cells from a row.

function insertRow(idx) {
if(idx === undefined) idx = -1;
if(typeof idx !== "number") return null;
var t = this;
var nrows = t.rows.length;
if(idx < 0) idx = nrows;
if(idx > nrows) return null;
/*********************************************************************
Should the new row be created within the context that created the table,
or the running context? (If code in one frame modifies a table in another.)
I'm going with the former.
And what if the web page replaces document.createElement, in the
table creating context or in the running context?
Ideally we should use the original z$createElement just to be safe.
*********************************************************************/
var r = d.createElement("tr");
if(t.dom$class != "HTMLTableElement") {
if(idx == nrows) t.appendChild(r);
else t.insertBefore(r, t.rows[idx]);
} else {
// put this row in the same section as the next row
if(idx == nrows) {
if(nrows) t.rows[nrows-1].parentNode.appendChild(r);
else if(t.tHead) t.tHead.appendChild(r);
else if(t.tBodies.length) t.tBodies[0].appendChild(r);
else if(t.tFoot) t.tFoot.appendChild(r);
// No sections, what now? acid test 51 suggests it should not go into the table.
} else {
t.rows[idx].parentNode.insertBefore(r, t.rows[idx]);
}
}
return r;
}

function deleteRow(r) {
if(r.dom$class != "HTMLTableRowElement") return;
this.removeChild(r);
}

function insertCell(idx) {
if(idx === undefined) idx = -1;
if(typeof idx !== "number") return null;
var t = this;
var n = t.childNodes.length;
if(idx < 0) idx = n;
if(idx > n) return null;
var r = d.createElement("td");
if(idx == n)
t.appendChild(r);
else
t.insertBefore(r, t.childNodes[idx]);
return r;
}

function deleteCell(n) {
var l = this.cells.length;
if(typeof n != "number") n = -1;
if(n == -1) n = 0;
if(n >= 0 && n < l)
this.removeChild(this.cells[n]);
}

// classes and prototypes for table, sections, row, cell
swp("HTMLTableSectionElement", function(){})
swpp("HTMLTableSectionElement", w.HTMLElement)
swp("z$tBody", function(){ this.rows = new w.Array})
swpp("z$tBody", w.HTMLTableSectionElement)
swp("z$tHead", function(){ this.rows = new w.Array})
swpp("z$tHead", w.HTMLTableSectionElement)
swp("z$tFoot", function(){ this.rows = new w.Array})
swpp("z$tFoot", w.HTMLTableSectionElement)
swp("z$tCap", function(){}) // caption
swpp("z$tCap", w.HTMLElement)
swp("HTMLTableElement", function(){ this.rows = new w.Array; this.tBodies = new w.Array})
swpp("HTMLTableElement", w.HTMLElement)
swp("HTMLTableRowElement", function(){ this.cells = new w.Array})
swpp("HTMLTableRowElement", w.HTMLElement)
swp("HTMLTableCellElement", function(){})
swpp("HTMLTableCellElement", w.HTMLElement)

let tablep = w.HTMLTableElement.prototype;
let tablesecp = w.HTMLTableSectionElement.prototype;
let trp = w.HTMLTableRowElement.prototype;

tablep.insertRow = insertRow;
tablesecp.insertRow = insertRow;
tablep.deleteRow = deleteRow;
tablesecp.deleteRow = deleteRow;
trp.insertCell = insertCell;
trp.deleteCell = deleteCell;

// rows under a table section
tablesecp.appendChildNative = appendChild;
tablesecp.appendChild = function(newobj) {
if(!newobj) return null;
if(newobj.nodeType == 11) return appendFragment(this, newobj);
this.appendChildNative(newobj);
if(newobj.dom$class == "HTMLTableRowElement") // shouldn't be anything other than TR
this.rows.push(newobj), rowReindex(this);
return newobj;
}
tablesecp.insertBeforeNative = insertBefore;
tablesecp.insertBefore = function(newobj, item) {
if(!newobj) return null;
if(!item) return this.appendChild(newobj);
if(newobj.nodeType == 11) return insertFragment(this, newobj, item);
const r = this.insertBeforeNative(newobj, item);
if(!r) return null;
if(newobj.dom$class == "HTMLTableRowElement")
for(let i=0; i<this.rows.length; ++i)
if(this.rows[i] == item) {
this.rows.splice(i, 0, newobj);
rowReindex(this);
break;
}
return newobj;
}
tablesecp.removeChildNative = removeChild;
tablesecp.removeChild = function(item) {
if(!item) return null;
if(!this.removeChildNative(item))
return null;
if(item.dom$class == "HTMLTableRowElement")
for(let i=0; i<this.rows.length; ++i)
if(this.rows[i] == item) {
this.rows.splice(i, 1);
rowReindex(this);
break;
}
return item;
}

tablep.createCaption = function() {
if(this.caption) return this.caption;
let c = d.createElement("caption");
this.appendChild(c);
return c;
}
tablep.deleteCaption = function() {
if(this.caption) this.removeChild(this.caption);
}

tablep.createTHead = function() {
if(this.tHead) return this.tHead;
let c = d.createElement("thead");
this.prependChild(c);
return c;
}
tablep.deleteTHead = function() {
if(this.tHead) this.removeChild(this.tHead);
}
tablep.createTFoot = function() {
if(this.tFoot) return this.tFoot;
let c = d.createElement("tfoot");
this.insertBefore(c, this.caption);
return c;
}
tablep.deleteTFoot = function() {
if(this.tFoot) this.removeChild(this.tFoot);
}

// rows or bodies under a table
tablep.appendChildNative = appendChild;
tablep.appendChild = function(newobj) {
if(!newobj) return null;
if(newobj.nodeType == 11) return appendFragment(this, newobj);
this.appendChildNative(newobj);
if(newobj.dom$class == "HTMLTableRowElement") rowReindex(this);
if(newobj.dom$class == "tBody") {
this.tBodies.push(newobj);
if(newobj.rows.length) rowReindex(this);
}
if(newobj.dom$class == "tCap") this.caption = newobj;
if(newobj.dom$class == "tHead") {
this.tHead = newobj;
if(newobj.rows.length) rowReindex(this);
}
if(newobj.dom$class == "tFoot") {
this.tFoot = newobj;
if(newobj.rows.length) rowReindex(this);
}
return newobj;
}
tablep.insertBeforeNative = insertBefore;
tablep.insertBefore = function(newobj, item) {
if(!newobj) return null;
if(!item) return this.appendChild(newobj);
if(newobj.nodeType == 11) return insertFragment(this, newobj, item);
const r = this.insertBeforeNative(newobj, item);
if(!r) return null;
if(newobj.dom$class == "HTMLTableRowElement") rowReindex(this);
if(newobj.dom$class == "tBody")
for(let i=0; i<this.tBodies.length; ++i)
if(this.tBodies[i] == item) {
this.tBodies.splice(i, 0, newobj);
if(newobj.rows.length) rowReindex(this);
break;
}
if(newobj.dom$class == "tCap") this.caption = newobj;
if(newobj.dom$class == "tHead") {
this.tHead = newobj;
if(newobj.rows.length) rowReindex(this);
}
if(newobj.dom$class == "tFoot") {
this.tFoot = newobj;
if(newobj.rows.length) rowReindex(this);
}
return newobj;
}
tablep.removeChildNative = removeChild;
tablep.removeChild = function(item) {
if(!item) return null;
if(!this.removeChildNative(item))
return null;
if(item.dom$class == "HTMLTableRowElement") rowReindex(this);
if(item.dom$class == "tBody")
for(let i=0; i<this.tBodies.length; ++i)
if(this.tBodies[i] == item) {
this.tBodies.splice(i, 1);
if(item.rows.length) rowReindex(this);
break;
}
if(item == this.caption) delete this.caption;
if(item.dom$class == "tHead") {
if(item == this.tHead) delete this.tHead;
if(item.rows.length) rowReindex(this);
}
if(item.dom$class == "tFoot") {
if(item == this.tFoot) delete this.tFoot;
if(item.rows.length) rowReindex(this);
}
return item;
}

// row methods
trp.appendChildNative = appendChild;
trp.appendChild = function(newobj) {
if(!newobj) return null;
if(newobj.nodeType == 11) return appendFragment(this, newobj);
this.appendChildNative(newobj);
if(newobj.nodeName === "TD") // shouldn't be anything other than TD
this.cells.push(newobj);
return newobj;
}
trp.insertBeforeNative = insertBefore;
trp.insertBefore = function(newobj, item) {
if(!newobj) return null;
if(!item) return this.appendChild(newobj);
if(newobj.nodeType == 11) return insertFragment(this, newobj, item);
const r = this.insertBeforeNative(newobj, item);
if(!r) return null;
if(newobj.nodeName === "TD")
for(let i=0; i<this.cells.length; ++i)
if(this.cells[i] == item) {
this.cells.splice(i, 0, newobj);
break;
}
return newobj;
}
trp.removeChildNative = removeChild;
trp.removeChild = function(item) {
if(!item) return null;
if(!this.removeChildNative(item))
return null;
if(item.nodeName === "TD")
for(let i=0; i<this.cells.length; ++i)
if(this.cells[i] == item) {
this.cells.splice(i, 1);
break;
}
return item;
}

// options, option groups, and the select element
swp("HTMLOptionElement", function() {
if(arguments.length > 0)
this.text = arguments[0];
if(arguments.length > 1)
this.value = arguments[1];
})
swpp("HTMLOptionElement", w.HTMLElement)
swpc("Option", w.HTMLOptionElement)
let optp = w.HTMLOptionElement.prototype;
optp.selected = false;
optp.defaultSelected = false;
optp.nodeName = optp.tagName = "OPTION";
optp.text = optp.value = "";

swp("HTMLOptGroupElement", function() {})
swpp("HTMLOptGroupElement", w.HTMLElement)
let optgp = w.HTMLOptGroupElement.prototype;
optgp.nodeName = optgp.tagName = "OPTGROUP";

swp("HTMLSelectElement", function() {
    this.selectedIndex = -1;
    this.options = new w.Array;
    this.selectedOptions = new w.Array;
    this.validity = new w.Validity;
    this.validity.owner = this;
})
swpp("HTMLSelectElement", w.HTMLElement)
let selp = w.HTMLSelectElement.prototype;
odp(selp, "value", {
    get: function() {
        const a = this.options;
        const n = this.selectedIndex;
        return (this.multiple || n < 0 || n >= a.length) ? "" : a[n].value;
    }
});
odp(selp, "type", {
    get:function(){ return this.multiple ? "select-multiple" : "select-one"}
});
odp(selp, "multiple", {
    get: function() {
        const t = this.getAttribute("multiple");
        return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true
    },
    set:function(v) { this.setAttribute("multiple", v);}
});
odp(selp, "size", {
    get: function() {
        const t = this.getAttribute("size");
        if(typeof t == "number") return t;
        if(typeof t == "string" && t.match(/^\d+$/)) return parseInt(t);
        return 0;
    },
    set: function(v) { this.setAttribute("size", v);}
});
odp(selp, "required", {
    get:function() {
        const t = this.getAttribute("required");
        return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true
    },
    set: function(v) { this.setAttribute("required", v);}
});

selp.eb$bso = function() { // build selected options array
    // do not replace the array with a new one, this is suppose to be a live array
    const a = this.selectedOptions;
    const o = this.options;
    a.length = 0;
    o.length = 0;
    const cn = this.childNodes;
    for(let i=0; i<cn.length; ++i) {
        if (cn[i].nodeName == "OPTION") {
            o.push(cn[i]);
            if(cn[i].selected) a.push(cn[i]);
        }
        if(cn[i].nodeName != "OPTGROUP") continue;
        const og = cn[i];
        const cn2 = og.childNodes;
        for(let j=0; j<cn2.length; ++j)
            if(cn2[j].nodeName == "OPTION") {
                o.push(cn2[j]);
                if(cn2[j].selected) a.push(cn2[j]);
            }
    }
}

/*********************************************************************
Look out! Select class maintains an array of options beneath,
just as Form maintains an array of elements beneath, so you'd
think we could copy the form code and tweak a few things, but no.
Options under select lists are maintained by rebuildSelectors in jseng-quick.c.
That is how we synchronize option lists.
So we don't want to synchronize by side-effects.
In other words, we don't want to pass the actions back to edbrowse,
as appendChild does. So I kinda have to reproduce what they do
here, with just js, and no action in C.
Actually we shouldn't be calling this routine at all; should be calling add(),
so I don't even know if this makes sense.
*********************************************************************/

selp.appendChild = function(newobj) {
    if(!newobj) return null;
    // should only be options!
    if(!(newobj.dom$class == "HTMLOptionElement")) return newobj;
    isabove(newobj, this);
    if(newobj.parentNode) newobj.parentNode.removeChild(newobj);
    const l = this.childNodes.length;
    if(newobj.defaultSelected) newobj.selected = true, this.selectedIndex = l;
    this.childNodes.push(newobj); newobj.parentNode = this;
    this.eb$bso();
    mutFixup(this, false, newobj, null);
    return newobj;
}
selp.insertBefore = function(newobj, item) {
    let i;
    if(!newobj) return null;
    if(!item) return this.appendChild(newobj);
    if(!(newobj.dom$class == "HTMLOptionElement")) return newobj;
    isabove(newobj, this);
    if(newobj.parentNode) newobj.parentNode.removeChild(newobj);
    for(i=0; i<this.childNodes.length; ++i)
        if(this.childNodes[i] == item) {
            this.childNodes.splice(i, 0, newobj);
            newobj.parentNode = this;
            if(newobj.defaultSelected) {
                newobj.selected = true;
                this.selectedIndex = i;
            }
            break;
        }
    if(i == this.childNodes.length) {
        // side effect, object is freeed from wherever it was.
        return null;
    }
    this.eb$bso();
    mutFixup(this, false, newobj, null);
    return newobj;
}
selp.removeChild = function(item) {
    let i;
    if(!item) return null;
    for(i=0; i<this.childNodes.length; ++i)
        if(this.childNodes[i] == item) break;
    if(i == this.childNodes.length) return null;
    this.childNodes.splice(i, 1);
    item.parentNode = null;
    this.eb$bso();
    mutFixup(this, false, i, item);
    return item;
}

// these routines do not account for optgroups
selp.add = function(o, idx) {
    const n = this.options.length;
    if(typeof idx != "number" || idx < 0 || idx > n) idx = n;
    if(idx == n) this.appendChild(o);
    else this.insertBefore(o, this.childNodes[idx]);
}
selp.remove = function(idx) {
    const n = this.options.length;
    if(typeof idx == "number" && idx >= 0 && idx < n)
    this.removeChild(this.options[idx]);
}

// input, textarea, button; the other input classes
swp("HTMLInputElement", function(){this.validity = new w.Validity, this.validity.owner = this})
swpp("HTMLInputElement", w.HTMLElement)
swp("HTMLButtonElement", function(){})
swpp("HTMLButtonElement", w.HTMLElement)
swp("HTMLTextAreaElement", function(){})
swpp("HTMLTextAreaElement", w.HTMLElement)

let inputp = w.HTMLInputElement.prototype;
let buttonp = w.HTMLButtonElement.prototype;
let tareap = w.HTMLTextAreaElement.prototype;

// we need a couple of helper functions for clicking on a radio input field
function clickfn() {
let nn = this.nodeName, t = this.type;
// as though the user had clicked on this
if(nn == "BUTTON" || (nn == "INPUT" &&
(t == "button" || t == "reset" || t == "submit" || t == "checkbox" || t == "radio"))) {
var e = new w.Event;
e.initEvent("click", true, true);
if(!this.dispatchEvent(e)) return;
// do what the tag says to do
if(this.form && this.form.dom$class == "HTMLFormElement") {
if(t == "submit") {
e.initEvent("submit", true, true);
if(this.dispatchEvent(e) && this.form.submit)
this.form.submit();
}
if(t == "reset") {
e.initEvent("reset", true, true);
if(this.dispatchEvent(e) && this.form.reset)
this.form.reset();
}
}
if(t != "checkbox" && t != "radio") return;
this.checked$2 = (this.checked$2 ? false : true);
// if it's radio and checked we need to uncheck the others.
if(this.form && this.checked$2 && t == "radio" &&
(nn = this.name) && (e = this.form[nn]) && Array.isArray(e)) {
for(var i=0; i<e.length; ++i)
if(e[i] != this) e[i].checked$2 = false;
} else // try it another way
if(this.checked$2 && t == "radio" && this.parentNode && (e = this.parentNode.childNodes) && (nn = this.name)) {
for(var i=0; i<e.length; ++i)
if(e[i].nodeName == "INPUT" && e[i].type == t && e[i].name == nn &&e[i] != this) e[i].checked$2 = false;
}
}
}

function checkset(n) {
if(typeof n !== "boolean") n = false;
this.checked$2 = n;
var nn = this.nodeName, t = this.type, e;
// if it's radio and checked we need to uncheck the others.
if(this.form && this.checked$2 && t == "radio" &&
(nn = this.name) && (e = this.form[nn]) && Array.isArray(e)) {
for(var i=0; i<e.length; ++i)
if(e[i] != this) e[i].checked$2 = false;
} else // try it another way
if(this.checked$2 && t == "radio" && this.parentNode && (e = this.parentNode.childNodes) && (nn = this.name)) {
for(var i=0; i<e.length; ++i)
if(e[i].nodeName == "INPUT" && e[i].type == t && e[i].name == nn &&e[i] != this) e[i].checked$2 = false;
}
}

inputp.selectionStart = 0;
inputp.selectionEnd = -1;
inputp.selectionDirection = "none";
// I don't know what this function does, something visual I think.
inputp.setSelectionRange = function(s, e, dir) {
if(typeof s == "number") this.selectionStart = s;
if(typeof e == "number") this.selectionEnd = e;
if(typeof dir == "string") this.selectionDirection = dir;
}
inputp.select = eb$voidfunction;
inputp.click = clickfn;
// We only need this in the rare case of setting click and clearing
// the other radio buttons. acid test 43
odp(inputp, "checked", {
get: function() { return this.checked$2 ? true : false; },
set: checkset});
// type property is automatically in the getAttribute system, acid test 53
odp(inputp, "type", {
get:function(){ var t = this.getAttribute("type");
// input type is special, tidy converts it to lower case, so I will too.
// Also acid test 54 requires it.
return typeof t == "string" ? this.eb$xml ? t : t.toLowerCase() : undefined; },
set:function(v) { this.setAttribute("type", v);
if(v.toLowerCase() == "checkbox" && !this.value) this.value = "on";
}});
odp(inputp, "placeholder", {
get:function(){ var t = this.getAttribute("placeholder");
var y = typeof t;
return y == "string" || y == "number" ? t : ""; },
set:function(v) { this.setAttribute("placeholder", v);}});
odp(inputp, "multiple", {
get:function(){ var t = this.getAttribute("multiple");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("multiple", v);}});
odp(inputp, "required", {
get:function(){ var t = this.getAttribute("required");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("required", v);}});
odp(inputp, "readOnly", {
get:function(){ let t = this.getAttribute("readonly");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("readonly", v);}});
odp(inputp, "step", {
get:function(){ var t = this.getAttribute("step");
var y = typeof t;
return y == "number" || y == "string" ? t : undefined},
set:function(v) { this.setAttribute("step", v);}});
odp(inputp, "minLength", {
get:function(){ var t = this.getAttribute("minlength");
var y = typeof t;
return y == "number" || y == "string" ? t : undefined},
set:function(v) { this.setAttribute("minlength", v);}});
odp(inputp, "maxLength", {
get:function(){ var t = this.getAttribute("maxlength");
var y = typeof t;
return y == "number" || y == "string" ? t : undefined},
set:function(v) { this.setAttribute("maxlength", v);}});
odp(inputp, "size", {
get:function(){ var t = this.getAttribute("size");
var y = typeof t;
return y == "number" || y == "string" ? t : undefined},
set:function(v) { this.setAttribute("size", v);}});

buttonp.click = clickfn;
// type property is automatically in the getAttribute system, acid test 59
odp(buttonp, "type", {
get:function(){ var t = this.getAttribute("type");
// default is submit, acid test 59
return typeof t == "string" ? t.toLowerCase() : "submit"; },
set:function(v) { this.setAttribute("type", v);}});

odp(tareap, "innerText", {
get: function() { return this.value},
set: function(t) { this.value = t }});
odp(tareap, "type", {
get: function() { return "textarea"}});
odp(tareap, "placeholder", {
get:function(){ var t = this.getAttribute("placeholder");
var y = typeof t;
return y == "string" || y == "number" ? t : ""; },
set:function(v) { this.setAttribute("placeholder", v);}});
odp(tareap, "required", {
get:function(){ var t = this.getAttribute("required");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("required", v);}});
odp(tareap, "readOnly", {
get:function(){ var t = this.getAttribute("readonly");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("readonly", v);}});

// the html form
swp("HTMLFormElement", function(){this.elements = new w.Array})
swpp("HTMLFormElement", w.HTMLElement)

/*********************************************************************
most of the work is done by helper functions, 2 native and 4 below.
The first is used by the other three.
If you add an input to a form, it adds under childNodes in the usual way,
but also must add in the elements[] array.
Same for insertBefore and removeChild.
When adding an input element to a form,
linnk form[element.name] to that element.
*********************************************************************/

function formname(parent, child) {
var s;
if(typeof child.name === "string")
s = child.name;
else if(typeof child.id === "string")
s = child.id;
else return;
if(!parent[s]) parent[s] = child;
if(!parent.elements[s]) parent.elements[s] = child;
}

function formAppendChild(newobj) {
if(!newobj) return null;
if(newobj.nodeType == 11) return appendFragment(this, newobj);
this.appendChildNative(newobj);
if(newobj.nodeName === "INPUT" || newobj.nodeName === "SELECT") {
this.elements.push(newobj);
newobj.form = this;
formname(this, newobj);
}
return newobj;
}

function formInsertBefore(newobj, item) {
if(!newobj) return null;
if(!item) return this.appendChild(newobj);
if(newobj.nodeType == 11) return insertFragment(this, newobj, item);
var r = this.insertBeforeNative(newobj, item);
if(!r) return null;
if(newobj.nodeName === "INPUT" || newobj.nodeName === "SELECT") {
for(var i=0; i<this.elements.length; ++i)
if(this.elements[i] == item) {
this.elements.splice(i, 0, newobj);
break;
}
newobj.form = this;
formname(this, newobj);
}
return newobj;
}

function formRemoveChild(item) {
if(!item) return null;
if(!this.removeChildNative(item))
return null;
if(item.nodeName === "INPUT" || item.nodeName === "SELECT") {
for(var i=0; i<this.elements.length; ++i)
if(this.elements[i] == item) {
this.elements.splice(i, 1);
break;
}
delete item.form;
if(item.name$2 && this[item.name$2] == item) delete this[item.name$2];
if(item.name$2 && this.elements[item.name$2] == item) delete this.elements[item.name$2];
}
return item;
}

let formp = w.HTMLFormElement.prototype;
formp.submit = eb$formSubmit;
formp.reset = eb$formReset;
odp(formp, "length", { get: function() { return this.elements.length;}})
formp.appendChildNative = appendChild;
formp.appendChild = formAppendChild;
formp.insertBeforeNative = insertBefore;
formp.insertBefore = formInsertBefore;
formp.removeChildNative = removeChild;
formp.removeChild = formRemoveChild;

swp("HTMLImageElement", function(){})
swpc("Image", w.HTMLImageElement)
swpp("HTMLImageElement", w.HTMLElement)
let imagep = w.HTMLImageElement.prototype;
odp(imagep, "alt", {
get:function(){ var t = this.getAttribute("alt");
return typeof t == "string" ? t : undefined},
set:function(v) { this.setAttribute("alt", v);
}})

swp("HTMLScriptElement", function(){})
swpp("HTMLScriptElement", w.HTMLElement)
w.HTMLScriptElement.supports = function(t) {
if(typeof t != "string") return false;
t = t.toLowerCase();
if(t.match(/\bjavascript\b/)) return true;
if(t.match(/\bjson\b/)) return true;
return false}
let scriptp = w.HTMLScriptElement.prototype;
odp(scriptp, "async", {
get:function(){ var t = this.getAttribute("async");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("async", v);}})
odp(scriptp, "defer", {
get:function(){ var t = this.getAttribute("defer");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("defer", v);}})
odp(scriptp, "type", {
get:function(){ var t = this.getAttribute("type"); if(!t) t = ""; return t;},
set:function(v) { this.setAttribute("type", v)}})
scriptp.eb$step = 0;
scriptp.text = "";

// the all important <a>, the whole point of the internet
swp("HTMLAnchorElement", function(){})
swpp("HTMLAnchorElement", w.HTMLElement)

// classes that support lists in html
swp("HTMLOListElement", function(){})
swpp("HTMLOListElement", w.HTMLElement)
swp("HTMLUListElement", function(){})
swpp("HTMLUListElement", w.HTMLElement)
swp("HTMLDListElement", function(){})
swpp("HTMLDListElement", w.HTMLElement)
swp("HTMLLIElement", function(){})
swpp("HTMLLIElement", w.HTMLElement)

swp("HTMLLabelElement", function(){})
swpp("HTMLLabelElement", w.HTMLElement)
let labelp = w.HTMLLabelElement.prototype;
odp(labelp, "htmlFor", { get: function() { return this.getAttribute("for"); }, set: function(h) { this.setAttribute("for", h); }})

// <head> and friends
swp("HTMLHeadElement", function(){})
swpp("HTMLHeadElement", w.HTMLElement)
swp("HTMLMetaElement", function(){})
swpp("HTMLMetaElement", w.HTMLElement)
let metap = w.HTMLMetaElement.prototype;
odp(metap, "httpEquiv", { get: function() { return this.getAttribute("http-equiv"); }, set: function(h) { this.setAttribute("http-equiv", h); }})
swp("HTMLBaseElement", function(){})
swpp("HTMLBaseElement", w.HTMLElement)
swp("z$Title", function(){})
swpp("z$Title", w.HTMLElement)
odp(w.z$Title.prototype, "text", {
get: function(){ return this.firstChild && this.firstChild.nodeName == "#text" && this.firstChild.data || "";}
// setter should change the title of the document, not yet implemented
});
swp("HTMLLinkElement", function(){})
swpp("HTMLLinkElement", w.HTMLElement)
// It's a list but why would it ever be more than one?
odp(w.HTMLLinkElement.prototype, "relList", {
get: function() { var a = new w.Aray;
if(this.rel) a.push(this.rel);
// edbrowse only supports stylesheet
a.supports = function(s) { return s === "stylesheet"; }
return a;
}})

// <body>
swp("HTMLBodyElement", function(){})
swpp("HTMLBodyElement", w.HTMLElement)
let bodyp = w.HTMLBodyElement.prototype;
bodyp.doScroll = eb$voidfunction;
bodyp.clientHeight = 768;
bodyp.clientWidth = 1024;
bodyp.offsetHeight = 768;
bodyp.offsetWidth = 1024;
bodyp.scrollHeight = 768;
bodyp.scrollWidth = 1024;
bodyp.scrollTop = 0;
bodyp.scrollLeft = 0;
// secret way of setting body.innerHTML
bodyp.eb$dbih = function(s){this.innerHTML = s}

// fake class to support <html>
swp("z$HTML", function(){})
swpp("z$HTML", w.HTMLElement)
let htmlp = w.z$HTML.prototype;
odp(htmlp, "eb$win", {get: function(){return this.parentNode ? this.parentNode.defaultView : undefined}});
// Some screen attributes that are suppose to be there.
htmlp.doScroll = eb$voidfunction;
htmlp.clientHeight = 768;
htmlp.clientWidth = 1024;
htmlp.offsetHeight = 768;
htmlp.offsetWidth = 1024;
htmlp.scrollHeight = 768;
htmlp.scrollWidth = 1024;
htmlp.scrollTop = 0;
htmlp.scrollLeft = 0;

// is there a difference between DocType ad DocumentType?
swp("DocType", function(){})
swpp("DocType", w.HTMLElement)
w.DocType.prototype.nodeType = 10;
w.DocType.prototype.nodeName = "DOCTYPE";
swp("DocumentType", w.DocType)

// <div> <p> <span>
swp("HTMLDivElement", function(){})
swpp("HTMLDivElement", w.HTMLElement)
let divp = w.HTMLDivElement.prototype;
divp.doScroll = eb$voidfunction;
divp.align = "left";
// should this click be on w.HTMLElement?
divp.click = function() {
// as though the user had clicked on this
var e = new w.Event;
e.initEvent("click", true, true);
this.dispatchEvent(e);
}
swp("HTMLParagraphElement", function(){})
swpp("HTMLParagraphElement", w.HTMLElement)
swp("HTMLSpanElement", function(){})
swpp("HTMLSpanElement", w.HTMLElement)
let spanp = w.HTMLSpanElement.prototype;
spanp.doScroll = eb$voidfunction;
spanp.click = divp.click;

// h1 through h6 and our own classes for header footer
swp("HTMLHeadingElement", function(){})
swpp("HTMLHeadingElement", w.HTMLElement)
swp("z$Header", function(){})
swpp("z$Header", w.HTMLElement)
swp("z$Footer", function(){})
swpp("z$Footer", w.HTMLElement)

// media and audio
swp("HTMLMediaElement", function(){})
swpp("HTMLMediaElement", w.HTMLElement)
let mediap = w.HTMLMediaElement.prototype;
mediap.autoplay = false;
mediap.muted = false;
mediap.defaultMuted = false;
mediap.paused = false;
mediap.audioTracks = new w.Array;
mediap.videoTracks = new w.Array;
mediap.textTracks = new w.Array;
mediap.controls = false;
mediap.controller = null;
mediap.volume = 1.0;
mediap.play = eb$playAudio;
mediap.load = eb$voidfunction;
mediap.pause = eb$voidfunction;

swp("HTMLAudioElement", function(t){
// arg to constructor is the url of the audio
if(typeof t == "string") this.src = t;
if(typeof t == "object") this.src = t.toString();
})
swp("Audio", w.HTMLAudioElement)
swpp("HTMLAudioElement", w.HTMLMediaElement)
w.HTMLAudioElement.prototype.nodeName = "AUDIO"

/*********************************************************************
AudioContext, for playing music etc.
This one we could implement, but I'm not sure if we should.
If speech comes out of the same speakers as music, as it often does,
you might not want to hear it, you might rather see the url, or have a button
to push, and then you call up the music only if / when you want it.
Not sure what to do, so it's pretty much stubs for now.
*********************************************************************/
swp("AudioContext", function() {
this.outputLatency = 1.0;
this.createMediaElementSource = eb$voidfunction;
this.createMediaStreamSource = eb$voidfunction;
this.createMediaStreamDestination = eb$voidfunction;
this.createMediaStreamTrackSource = eb$voidfunction;
this.suspend = eb$voidfunction;
this.close = eb$voidfunction;
})
swpp("AudioContext", null)

swp("HTMLObjectElement", function(){})
swpp("HTMLObjectElement", w.HTMLElement)

swp("HTMLTemplateElement", function(){})
swpp("HTMLTemplateElement", w.HTMLElement)
odp(w.HTMLTemplateElement.prototype, "content", {
get: function() {
if(this.content$2) return this.content$2;
var c, frag = d.createDocumentFragment();
frag.ownerDocument = new w.Document;
// need to set its location to "about:blank" but I don't know how to do that.
// Lots of setters and getters involved in location, and the current window
// and document, and new documents created, and we need to sort all this out.
while(c = this.firstChild)
frag.appendChild(c)
odp(this, "content$2", {value:frag})
return frag
}})

swp("HTMLDetailsElement", function(){})
swpp("HTMLDetailsElement", w.HTMLElement)
let detp = w.HTMLDetailsElement.prototype;
odp(detp, "open", {
get:function(){ let t = this.getAttribute("open");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("open", v);}});

swp("HTMLAreaElement", function(){})
swpp("HTMLAreaElement", w.HTMLElement)

swp("HTMLFrameElement", function(){})
swpp("HTMLFrameElement", w.HTMLElement)
let framep = w.HTMLFrameElement.prototype;
framep.is$frame = true;
odp(framep, "contentDocument", { get: eb$getter_cd});
odp(framep, "contentWindow", { get: eb$getter_cw});

// These may be different but for now I'm calling them the same.
swp("HTMLIFrameElement", function(){})
swpp("HTMLIFrameElement", w.HTMLFrameElement)

/*********************************************************************
If foo is an anchor, then foo.href = "some_url"
builds the url object. Same for frame.src, etc.
I believe that a new URL should be resolved against the base, that is,
/foobar becomes www.xyz.com/foobar, though I'm not sure.
We ought not do this in the generic URL class, but for these assignments, I think yes.
The URL class already resolves when updating a URL,
so this is just for a new url A.href = "/foobar".
There may be shortcuts associated with these url members.
Some websites refer to A.protocol, which has not explicitly been set.
I assume they mean A.href.protocol, the protocol of the url object.
That suggests a loop over classes, then a loop over url components.
Note, the leading semicolon here is important,
otherwise this statement blends with the last to create something you didn't want.
Or you could end the last statement with a semicolon.
*********************************************************************/

; (function() {
const cnlist = ["HTMLAnchorElement", "HTMLAreaElement", "HTMLFrameElement"];
const ulist = ["href", "href", "src"];
for(let i=0; i<cnlist.length; ++i) {
const cn = cnlist[i]; // class name
const u = ulist[i]; // url name
eval('odp(w.' + cn + '.prototype, "' + u + '", { ' +
'get: function() { return this.href$2 ? this.href$2 : ""}, ' +
'set: function(h) { if(h === null || h === undefined) h = ""; ' +
'if(h instanceof w.URL || h.dom$class == "URL") h = h.toString(); ' +
'if(typeof h != "string") { alert3("hrefset " + typeof h); ' +
'return; } ' +
'if(!h) return; ' +
'let last_href = (this.href$2 ? this.href$2.toString() : null); ' +
'this.setAttribute("' + u +'",h); ' +
'/* special code for setting frame.src, redirect to a new page. */ ' +
'h = this.href$2.href$val; ' +
'if(this.is$frame && this.eb$expf && last_href != h) { ' +
'/* There is a nasty corner case here, dont know if it ever happens. What if we are replacing the running frame? window.parent.src = new_url; See if we can get around it this way. */ ' +
'if(w == this.contentWindow) { w.location = h; return; } ' +
'delete this.eb$expf; ' +
'eb$unframe(this); /* fix links on the edbrowse side */ ' +
'/* I can force the opening of this new frame, but should I? */ ' +
'this.contentDocument; eb$unframe2(this); ' +
'} }});');
const piecelist = ["protocol", "pathname", "host", "search", "hostname", "port", "hash"];
for(let j=0; j<piecelist.length; ++j) {
let piece = piecelist[j];
eval('odp(w.' + cn + '.prototype, "' + piece + '", {get: function() { return this.href$2 ? this.href$2.' + piece + ' : null},set: function(x) { if(this.href$2) this.href$2.' + piece + ' = x; }});');
}
}
})();

/*********************************************************************
Ok - a.href is a url object, but script.src is a string.
You won't find that anywhere in the documentation, w3 schools etc, nope, I just
respond to the javascript in the wild, and that's what it seems to expect.
I only know for sure a.href is URL, and script.src is string,
everything else is a guess.
*********************************************************************/

; (function() {
const cnlist = ["HTMLFormElement", "HTMLImageElement", "HTMLScriptElement",
"HTMLBaseElement", "HTMLLinkElement", "HTMLMediaElement",
"HTMLObjectElement"];
const ulist = ["action", "src", "src",
"href", "href", "src",
"data"];
for(let i=0; i<cnlist.length; ++i) {
const cn = cnlist[i]; // class name
const u = ulist[i]; // url name
eval('odp(w.' + cn + '.prototype, "' + u + '", { ' +
'get: function() { return this.href$2 ? this.href$2 : ""}, ' +
'set: function(h) { if(h instanceof w.URL || h.dom$class == "URL") h = h.toString(); ' +
'if(h === null || h === undefined) h = ""; ' +
'if(typeof h != "string") { alert3("hrefset " + typeof h); ' +
'return; } ' +
'if(!h) return; ' +
'this.setAttribute("' + u +'",h) ' +
' }});');
}
})();

// Canvas method draws a picture. That's meaningless for us,
// but it still has to be there.
// Because of the canvas element, I can't put the monster getContext function
// into the prototype, I have to set it in the constructor.
swp("HTMLCanvasElement", function() {
this.getContext = function(x) { return {
canvas: this,
 addHitRegion: eb$nullfunction,
arc: eb$nullfunction,
arcTo: eb$nullfunction,
beginPath: eb$nullfunction,
bezierCurveTo: eb$nullfunction,
clearHitRegions: eb$nullfunction,
clearRect: eb$nullfunction,
clip: eb$nullfunction,
closePath: eb$nullfunction,
createImageData: eb$nullfunction,
createLinearGradient: eb$nullfunction,
createPattern: eb$nullfunction,
createRadialGradient: eb$nullfunction,
drawFocusIfNeeded: eb$nullfunction,
drawImage: eb$nullfunction,
drawWidgetAsOnScreen: eb$nullfunction,
drawWindow: eb$nullfunction,
ellipse: eb$nullfunction,
fill: eb$nullfunction,
fillRect: eb$nullfunction,
fillText: eb$nullfunction,
getImageData: eb$nullfunction,
getLineDash: eb$nullfunction,
isPointInPath: eb$nullfunction,
isPointInStroke: eb$nullfunction,
lineTo: eb$nullfunction,
measureText: function(s) {
// returns a TextMetrics object, whatever that is.
// Height and width will depend on the font, but this is just a stub.
return {height: 12, width: s.length * 7};
},
moveTo: eb$nullfunction,
putImageData: eb$nullfunction,
quadraticCurveTo: eb$nullfunction,
rect: eb$nullfunction,
removeHitRegion: eb$nullfunction,
resetTransform: eb$nullfunction,
restore: eb$nullfunction,
rotate: eb$nullfunction,
save: eb$nullfunction,
scale: eb$nullfunction,
scrollPathIntoView: eb$nullfunction,
setLineDash: eb$nullfunction,
setTransform: eb$nullfunction,
stroke: eb$nullfunction,
strokeRect: eb$nullfunction,
strokeText: eb$nullfunction,
transform: eb$nullfunction,
translate: eb$nullfunction }}})
swpp("HTMLCanvasElement", w.HTMLElement)
let canvasp = w.HTMLCanvasElement.prototype;
canvasp.toDataURL = function() {
if(this.height === 0  || this.width === 0) return "data:,";
// this is just a stub
return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC";
}

swp("HTMLStyleElement", function(){})
swpp("HTMLStyleElement", w.HTMLElement)
// Kind of a hack to make this like the link element
let stylep = w.HTMLStyleElement.prototype;
odp(stylep, "css$data", {
get: function() { let s = ""; for(let i=0; i<this.childNodes.length; ++i) if(this.childNodes[i].nodeName == "#text") s += this.childNodes[i].data; return s; }});
// this is one of those on-demand properties, so check sheet$2.
odp(stylep, "sheet", { get: function(){ if(!this.sheet$2) this.sheet$2 = new w.CSSStyleSheet; return this.sheet$2; }})

// The css style declaration - complicated by all the default values,
// and the plethora of shorthand properties that we must expand.
swp("CSSStyleDeclaration", function(){
odp(this, "style$2", {value:this})
odp(this, "element", {value:null, writable:true})
})
swpp("CSSStyleDeclaration", w.HTMLElement)
let csdp = w.CSSStyleDeclaration.prototype;
// sheet on demand
odp(csdp, "sheet", { get: function(){ if(!this.sheet$2) this.sheet$2 = new w.CSSStyleSheet; return this.sheet$2; }});

// when one property is shorthand for several others.
// margin implies top right bottom left
// How many of these are there that I don't know about?
// Not clear how this meshes with my $$scy specificity system.
;(function(){
const list = ["margin", "scrollMargin", "padding", "scrollPadding",
"borderRadius", "border",
"borderWidth", "borderColor", "borderStyle", "borderImage",
"background", "font", "inset",];
for(let k of list) {
eval('odp(csdp, "' + k + '", {set: function(h) {cssShort.' + k + 'Short(this, h)}})')
}})();

// acid test 45 says float magically turns into cssFloat - I guess.
// And what's the point of that?
odp(csdp, "float", {set:function(v) { this.cssFloat = v}})

// These are default properties of a style declaration.
// they should not be enumerable. They must however be writable,
// so that the corresponding attributes placed on style objects are writable.
// Remember that a readonly prototype property cascades down.
;(function(){
const list =[
"accentColor","alignContent","alignItems","alignSelf","all",
"animation","animationDelay","animationDuration","animationFillMode","animationIterationCount","animationName","animationPlayState","animationTimingFunction",
"appearance","aspectRatio",
"backfaceVisibility","backgroundAttachment","backgroundBlendMode","backgroundClip","backgroundColor","backgroundImage",
"backgroundOrigin","backgroundPosition","backgroundPositionX","backgroundPositionY","backgroundRepeat","backgroundSize",
"blockSize","borderBlock","borderBlockColor","borderBlockEnd","borderBlockEndColor","borderBlockEndStyle","borderBlockEndWidth",
"borderBlockStart","borderBlockStartColor","borderBlockStartStyle","borderBlockStartWidth","borderBlockStyle","borderBlockWidth",
"borderBottomLeftRadius","borderBottomRightRadius","borderCollapse",
"borderEndEndRadius","borderEndStartRadius","borderInline","borderInlineColor","borderInlineEnd","borderInlineEndColor","borderInlineEndStyle","borderInlineEndWidth","borderInlineStart","borderInlineStartColor","borderInlineStartStyle","borderInlineStartWidth","borderInlineStyle","borderInlineWidth",
"borderSpacing","borderStartEndRadius","borderStartStartRadius","borderTopLeftRadius","borderTopRightRadius",
"bottom","boxDecorationBreak","boxShadow","boxSizing",
"breakAfter","breakBefore","breakInside",
"captionSide","caretColor","clear","clip","clipPath","clipRule",
"color","colorAdjust","colorInterpolation","colorInterpolationFilters",
"columnCount","columnFill","columnGap","columnRule","columnRuleColor","columnRuleStyle","columnRuleWidth","columns","columnSpan","columnWidth",
"contain","content","counterIncrement","counterReset","counterSet",
"cssFloat","cursor","cx","cy",
"direction","display","dominantBaseline",
"emptyCells","fill","fillOpacity","fillRule","filter",
"flex","flexBasis","flexDirection","flexFlow","flexGrow","flexShrink","flexWrap",
// need default for cssFloat, documentation says none, acid 45 says ""
"cssFloat",
"floodColor","floodOpacity",
"fontFamily","fontFeatureSettings","fontKerning","fontLanguageOverride","fontSize","fontSizeAdjust","fontStretch","fontStyle","fontSynthesis","fontVariant","fontVariantAlternates","fontVariantCaps","fontVariantEastAsian","fontVariantLigatures","fontVariantNumeric","fontVariantPosition","fontWeight",
"gap","grid","gridArea","gridAutoColumns","gridAutoFlow","gridAutoRows","gridColumn","gridColumnEnd","gridColumnGap","gridColumnStart",
"gridGap","gridRow","gridRowEnd","gridRowGap","gridRowStart","gridTemplate","gridTemplateAreas","gridTemplateColumns","gridTemplateRows",
"hyphens","imageOrientation","imageRendering","imeMode","inlineSize",
"insetBlock","insetBlockEnd","insetBlockStart","insetInline","insetInlineEnd","insetInlineStart","isolation",
"justifyContent","justifyItems","justifySelf",
"left","letterSpacing","lightingColor","lineBreak","lineHeight","listStyle","listStyleImage","listStylePosition","listStyleType",
"marginBlock","marginBlockEnd","marginBlockStart","marginBottom","marginInline","marginInlineEnd","marginInlineStart","marginLeft","marginRight","marginTop",
"marker","markerEnd","markerMid","markerStart",
"mask","maskClip","maskComposite","maskImage","maskMode","maskOrigin","maskPosition","maskPositionX","maskPositionY","maskRepeat","maskSize","maskType",
"maxBlockSize","maxHeight","maxInlineSize","maxWidth",
"minBlockSize","minHeight","minInlineSize","minWidth","mixBlendMode",
"MozAnimation","MozAnimationDelay","MozAnimationDirection","MozAnimationDuration","MozAnimationFillMode","MozAnimationIterationCount","MozAnimationName","MozAnimationPlayState","MozAnimationTimingFunction",
"MozAppearance",
"MozBackfaceVisibility","MozBorderEnd","MozBorderEndColor","MozBorderEndStyle","MozBorderEndWidth","MozBorderStart","MozBorderStartColor","MozBorderStartStyle","MozBorderStartWidth",
"MozBoxAlign","MozBoxDirection","MozBoxFlex","MozBoxOrdinalGroup","MozBoxOrient","MozBoxPack","MozBoxSizing",
"MozFloatEdge","MozFontFeatureSettings","MozFontLanguageOverride","MozForceBrokenImageIcon",
"MozHyphens","MozImageRegion","MozMarginEnd","MozMarginStart","MozOrient",
"MozPaddingEnd","MozPaddingStart","MozPerspective","MozPerspectiveOrigin",
"MozTabSize","MozTextSizeAdjust","MozTransform","MozTransformOrigin","MozTransformStyle","MozTransition","MozTransitionDelay","MozTransitionDuration","MozTransitionProperty","MozTransitionTimingFunction",
"MozUserFocus","MozUserInput","MozUserModify","MozUserSelect","MozWindowDragging",
"objectFit","objectPosition",
"offset","offsetAnchor","offsetDistance","offsetPath","offsetRotate",
"opacity","order","outline","outlineColor","outlineOffset","outlineStyle","outlineWidth",
"overflow","overflowAnchor","overflowBlock","overflowInline","overflowWrap","overflowX","overflowY",
"overscrollBehavior","overscrollBehaviorBlock","overscrollBehaviorInline","overscrollBehaviorX","overscrollBehaviorY",
"paddingBlock","paddingBlockEnd","paddingBlockStart","paddingBottom","paddingInline","paddingInlineEnd","paddingInlineStart","paddingLeft","paddingRight","paddingTop",
"pageBreakAfter","pageBreakBefore","pageBreakInside","paintOrder","perspective","perspectiveOrigin",
"placeContent","placeItems","placeSelf","pointerEvents","position",
"quotes",
"r","resize","right","rotate","rowGap","rubyAlign","rubyPosition","rx","ry",
"scale","scrollbarColor","scrollbarWidth","scrollBehavior","scrollMarginBlock","scrollMarginBlockEnd","scrollMarginBlockStart","scrollMarginBottom","scrollMarginInline","scrollMarginInlineEnd","scrollMarginInlineStart","scrollMarginLeft","scrollMarginRight","scrollMarginTop",
"scrollPaddingBlock","scrollPaddingBlockEnd","scrollPaddingBlockStart","scrollPaddingBottom","scrollPaddingInline","scrollPaddingInlineEnd","scrollPaddingInlineStart","scrollPaddingLeft","scrollPaddingRight","scrollPaddingTop",
"scrollSnapAlign","scrollSnapType",
"shapeImageThreshold","shapeMargin","shapeOutside","shapeRendering",
"stopColor","stopOpacity",
"stroke","strokeDasharray","strokeDashoffset","strokeLinecap","strokeLinejoin","strokeMiterlimit","strokeOpacity","strokeWidth",
"tableLayout","tabSize","textAlign","textAlignLast","textAnchor","textCombineUpright",
"textDecoration","textDecorationColor","textDecorationLine","textDecorationSkipInk","textDecorationStyle","textDecorationThickness",
"textEmphasis","textEmphasisColor","textEmphasisPosition","textEmphasisStyle","textIndent","textJustify",
"textOrientation","textOverflow","textRendering","textShadow","textUnderlineOffset","textUnderlinePosition",
"top","touchAction","transform","transformBox","transformOrigin","transformStyle",
"transition","transitionDelay","transitionDuration","transitionProperty","transitionTimingFunction","translate",
"unicodeBidi","userSelect","vectorEffect","verticalAlign","visibility",
"webkitAlignContent","WebkitAlignContent","webkitAlignItems","WebkitAlignItems","webkitAlignSelf","WebkitAlignSelf",
"webkitAnimation","WebkitAnimation","webkitAnimationDelay","WebkitAnimationDelay","webkitAnimationDirection","WebkitAnimationDirection","webkitAnimationDuration","WebkitAnimationDuration","webkitAnimationFillMode","WebkitAnimationFillMode","webkitAnimationIterationCount","WebkitAnimationIterationCount",
"webkitAnimationName","WebkitAnimationName","webkitAnimationPlayState","WebkitAnimationPlayState","webkitAnimationTimingFunction","WebkitAnimationTimingFunction",
"webkitAppearance","WebkitAppearance",
"webkitBackfaceVisibility","WebkitBackfaceVisibility","webkitBackgroundClip","WebkitBackgroundClip","webkitBackgroundOrigin","WebkitBackgroundOrigin","webkitBackgroundSize","WebkitBackgroundSize",
"webkitBoxAlign","WebkitBoxAlign","webkitBoxDirection","WebkitBoxDirection","webkitBoxFlex","WebkitBoxFlex","webkitBoxOrdinalGroup","WebkitBoxOrdinalGroup","webkitBoxOrient","WebkitBoxOrient",
"webkitBoxPack","WebkitBoxPack","webkitBoxShadow","WebkitBoxShadow","webkitBoxSizing","WebkitBoxSizing",
"webkitFilter","WebkitFilter","webkitFlex","WebkitFlex","webkitFlexBasis","WebkitFlexBasis","webkitFlexDirection","WebkitFlexDirection","webkitFlexFlow","WebkitFlexFlow","webkitFlexGrow","WebkitFlexGrow",
"webkitFlexShrink","WebkitFlexShrink","webkitFlexWrap","WebkitFlexWrap",
"webkitJustifyContent","WebkitJustifyContent","webkitLineClamp","WebkitLineClamp",
"webkitMask","WebkitMask","webkitMaskClip","WebkitMaskClip","webkitMaskComposite","WebkitMaskComposite","webkitMaskImage","WebkitMaskImage","webkitMaskOrigin","WebkitMaskOrigin",
"webkitMaskPosition","WebkitMaskPosition","webkitMaskPositionX","WebkitMaskPositionX","webkitMaskPositionY","WebkitMaskPositionY","webkitMaskRepeat","WebkitMaskRepeat","webkitMaskSize","WebkitMaskSize",
"webkitOrder","WebkitOrder","webkitPerspective","WebkitPerspective","webkitPerspectiveOrigin","WebkitPerspectiveOrigin",
"webkitTextFillColor","WebkitTextFillColor","webkitTextSizeAdjust","WebkitTextSizeAdjust","webkitTextStroke","WebkitTextStroke","webkitTextStrokeColor","WebkitTextStrokeColor","webkitTextStrokeWidth","WebkitTextStrokeWidth",
"webkitTransform","WebkitTransform","webkitTransformOrigin","WebkitTransformOrigin","webkitTransformStyle","WebkitTransformStyle",
"webkitTransition","WebkitTransition","webkitTransitionDelay","WebkitTransitionDelay","webkitTransitionDuration","WebkitTransitionDuration","webkitTransitionProperty","WebkitTransitionProperty","webkitTransitionTimingFunction","WebkitTransitionTimingFunction",
"webkitUserSelect","WebkitUserSelect",
"whiteSpace","willChange","wordBreak","wordSpacing","wordWrap","writingMode",
"x",
"y",
"zIndex",];
for(let i = 0; i < list.length; ++i)
odp(csdp, list[i], {value:"",writable:true})
})();
;(function(){
const list =[
// first attribute is per acid test 46
"textTransform",
"borderImageSource","borderImageOutset","borderImageWidth","borderImageSlice",
"borderBottom","borderLeft","borderRight","borderTop",
"borderBottomWidth","borderLeftWidth","borderRightWidth","borderTopWidth",
"width",
"height",
"MozBorderImage","webkitBorderImage","WebkitBorderImage",
"borderBottomColor","borderLeftColor","borderRightColor","borderTopColor",
"borderBottomStyle","borderLeftStyle","borderRightStyle","borderTopStyle",
"borderImageRepeat",
"parentRule",];
const v = [
"none",
"none","0","1","100%",
"1px solid rgb(193, 193, 193)","1px solid rgb(193, 193, 193)","1px solid rgb(193, 193, 193)","1px solid rgb(193, 193, 193)",
"1px","1px","1px","1px",
"250px",
"40px",
"none 100% / 1 / 0 stretch","none 100% / 1 / 0 stretch","none 100% / 1 / 0 stretch",
"rgb(193, 193, 193)","rgb(193, 193, 193)","rgb(193, 193, 193)","rgb(193, 193, 193)",
"solid","solid","solid","solid",
"stretch",
null,];
for(let i = 0; i < list.length; ++i)
odp(csdp, list[i], {value:v[i],writable:true})
})();

csdp.toString = function() { return "style object" };
odp(csdp, "length", {get: function() {
let cnt = 0;
for(let i in this) if(this.hasOwnProperty(i)) ++cnt;
return cnt;
}})
csdp.item = function(n) {
if(typeof n !== "number") return "";
let cnt = 0;
for(let i in this) {
if(!this.hasOwnProperty(i)) continue;
if(cnt == n) return uncamelCase(i);
++cnt;
}
return ""
}
csdp.getPropertyValue = function(p) {
p = camelCase(p);
                if (this[p] == undefined)                
                        this[p] = "";
                        return this[p];
}
csdp.getProperty = function(p) {
p = camelCase(p);
return this[p] ? this[p] : "";
}
csdp.setProperty = function(p, v, prv) {
p = camelCase(p);
this[p] = v;
const pri = p + "$pri";
odp(this, pri, {value:(prv === "important"),writable:true,configurable:true})
}
csdp.getPropertyPriority = function(p) {
p = camelCase(p);
const pri = p + "$pri";
return this[pri] ? "important" : "";
}
csdp.removeProperty = function(p) {
p = camelCase(p);
delete this[p]
delete this[p+"$$scy"]
delete this[p+"$$pri"]
}

odp(csdp, "cssText", { get:  function(){
let s = "";
for(let k in this) {
if(!this.hasOwnProperty(k)) continue;
let l = this[k];
// weirdness from acid 45
if(k === "cssFloat") k = "float";
if(l.match(/[ \t;"'{}]/)) {
if(!l.match(/"/)) l = '"' + l + '"';
else if(!l.match(/'/)) l = "'" + l + "'";
else {
alert3(`cssText unrepresentable ${k}: ${l}`);
l = "none";
}
}
if(s.length) s += ' ';
s=s+ k + ': ' + l + ';';
}
return s;
},
set: function(h) {
w.soj$ = this; eb$cssText.call(this,h); delete w.soj$; } });

swp("CSSRule", function(){this.cssText=""})
w. CSSRule.prototype = new w.Object;
w. CSSRule.prototype.toString = function(){return this.cssText}

swp("CSSRuleList", function(){})
// This isn't really right, but it's easy
w. CSSRuleList.prototype = new w.Array;

swp("CSSStyleSheet", function() { this.cssRules = new w.CSSRuleList})
swpp("CSSStyleSheet", null)
let cssp = w.CSSStyleSheet.prototype;
cssp.insertRule = function(r, idx) {
let list = this.cssRules;
(typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = 0));
if(idx == list.length)
list.push(r);
else
list.splice(idx, 0, r);
}
cssp.addRule = function(sel, r, idx) {
var list = this.cssRules;
(typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = list.length));
r = sel + "{" + r + "}";
if(idx == list.length)
list.push(r);
else
list.splice(idx, 0, r);
}

// stragglers
swp("HTMLUnknownElement", function(){})
swpp("HTMLUnknownElement", w.HTMLElement)
swp("z$Timer", function(){this.nodeName = "TIMER"})
swpp("z$Timer", w.EventTarget)
swp("z$Datalist", function() {})
swpp("z$Datalist", w.HTMLElement)
odp(w.z$Datalist.prototype, "multiple", {
get:function(){ var t = this.getAttribute("multiple");
return t === null || t === false || t === "false" || t === 0 || t === '0' ? false : true},
set:function(v) { this.setAttribute("multiple", v);}});
swp("XMLCdata", function(t) {})
swpp("XMLCdata", w.HTMLElement)
let xmlcp = w.XMLCdata.prototype;
xmlcp.nodeName = xmlcp.tagName = "#cdata-section";
xmlcp.nodeType = 4;

// We've defined the HTMLElement classes, now let's create instances of them.
docup.createElement = function(s) {
let c;
if(!s) { // a null or missing argument
alert3("bad createElement( type" + typeof s + ')');
return null;
}
let t = s.toLowerCase();

// check for custom elements first
var x = w.cel$registry[s];
if(x) { // here we go
c = new x.construct;
if(c instanceof w.HTMLElement) {
    odp(c, "childNodes", {value:new w.Array,writable:true,configurable:true});
    odp(c, "parentNode", {value:null,writable:true,configurable:true});
if(this.eb$xml)
c.eb$xml = true;
else
s = s.toUpperCase()
    odp(c, "nodeName", {value:s,writable:true,configurable:true});
    odp(c, "tagName", {value:s,writable:true,configurable:true});
}
odp(c, "ownerDocument", {value:this,writable:true})
eb$logElement(c, t);
return c;
}

if(!t.match(/^[a-z:\d_-]+$/) || t.match(/^[\d_-]/)) {
alert3("bad createElement(" + t + ')');
// acid3 says we should throw an exception here.
// But we get these kinds of strings from www.oranges.com all the time.
// I'll just return null and tweak acid3 accordingly.
// throw error code 5
return null;
}

let unknown = false;
switch(t) {
case "shadowroot": c = new w.ShadowRoot; break;
case "body": c = new w.HTMLBodyElement; break;
// is it ok that head isn't here?
case "object": c = new w.HTMLObjectElement; break;
case "a": c = new w.HTMLAnchorElement; break;
case "area": c = new w.HTMLAreaElement; break;
case "image": t = "img";
case "img": c = new w.HTMLImageElement; break;
case "link": c = new w.HTMLLinkElement; break;
case "meta": c = new w.HTMLMetaElement; break;
case "cssstyledeclaration":
c = new w.CSSStyleDeclaration; c.element = null; break;
case "style": c = new w.HTMLStyleElement; break;
case "script": c = new w.HTMLScriptElement; break;
case "template": c = new w.HTMLTemplateElement; break;
// this isn't standard; it is mine
case "document": c = new w.Document; break;
case "root": c = new w.z$HTML; s = "html"; break;
case "div": c = new w.HTMLDivElement; break;
case "span": c = new w.HTMLSpanElement; break;
case "label": c = new w.HTMLLabelElement; break;
case "p": c = new w.HTMLParagraphElement; break;
case "ol": c = new w.HTMLOListElement; break;
case "ul": c = new w.HTMLUListElement; break;
case "dl": c = new w.HTMLDListElement; break;
case "li": c = new w.HTMLLIElement; break;
case "h1": case "h2": case "h3": case "h4": case "h5": case "H6": c = new w.HTMLHeadingElement; break;
case "header": c = new w.z$Header; break;
case "footer": c = new w.z$Footer; break;
case "table": c = new w.HTMLTableElement; break;
case "tbody": c = new w.z$tBody; break;
case "tr": c = new w.HTMLTableRowElement; break;
case "td": c = new w.HTMLTableCellElement; break;
case "caption": c = new w.z$tCap; break;
case "thead": c = new w.z$tHead; break;
case "tfoot": c = new w.z$tFoot; break;
case "canvas": c = new w.HTMLCanvasElement; break;
case "audio": case "video": c = new w.HTMLAudioElement; break;
case "fragment": c = new w.DocumentFragment; break;
case "frame": c = new w.HTMLFrameElement; break;
case "iframe": c = new w.HTMLIFrameElement; break;
case "select": c = new w.HTMLSelectElement; break;
case "option":
c = new w.Option;
    odp(c, "childNodes", {value:new w.Array,writable:true,configurable:true});
    odp(c, "parentNode", {value:null,writable:true,configurable:true});
odp(c, "ownerDocument", {value:this,writable:true})
if(this.eb$xml) c.eb$xml = true;
c.selected = true; // jquery says we should do this
// we don't log options because rebuildSelectors() checks
// the dropdown lists after every js run.
return c;
case "form": c = new w.HTMLFormElement; break;
case "input": c = new w.HTMLInputElement; break;
case "textarea": c = new w.HTMLTextAreaElement; break;
case "element": c = new w.HTMLElement; break;
case "button": c = new w.HTMLButtonElement; break;
case "svg": c = new w.SVGElement; break;
default:
unknown = true;
// alert("createElement default " + s);
c = new w.HTMLUnknownElement;
}

    odp(c, "childNodes", {value:new w.Array,writable:true,configurable:true});
    odp(c, "parentNode", {value:null,writable:true,configurable:true});
odp(c, "ownerDocument", {value:this,writable:true})
if(this.eb$xml && !(c instanceof w.HTMLFrameElement) && !(c instanceof w.HTMLIFrameElement)) c.eb$xml = true;
// Split on : if this comes from a name space
let colon = t.split(':');
if(colon.length == 2) {
    odp(c, "nodeName", {value:t,writable:true,configurable:true});
    odp(c, "tagName", {value:t,writable:true,configurable:true});
    c.prefix = colon[0], c.localName = colon[1];
} else if(c.nodeType == 1) {
    let s2 = (unknown || this.eb$xml) ? s : s.toUpperCase();
    odp(c, "nodeName", {value:s2,writable:true,configurable:true});
    odp(c, "tagName", {value:s2,writable:true,configurable:true});
}
if(t == "input") { // name and type are automatic attributes acid test 53
c.name = c.type = "";
}
eb$logElement(c, s);
return c;
} 

}

// placeholder for URL class. This has to be here for the Blob code.
this.URL = {};

// Code beyond this point is third party - necessary for the operation of the browser.

// NextSection
// TextDecoder TextEncoder   https://github.com/anonyco/FastestSmallestTextEncoderDecoder
// There is a minimized version, which I don't use here.

/** @define {boolean} */
var ENCODEINTO_BUILD = false;

(function(window){
	"use strict";
	//var log = Math.log;
	//var LN2 = Math.LN2;
	//var clz32 = Math.clz32 || function(x) {return 31 - log(x >> 0) / LN2 | 0};
	var fromCharCode = String.fromCharCode;
	var Object_prototype_toString = ({}).toString;
	var sharedArrayBufferString = Object_prototype_toString.call(window["SharedArrayBuffer"]);
	var undefinedObjectString = Object_prototype_toString();
	var NativeUint8Array = window.Uint8Array;
	var patchedU8Array = NativeUint8Array || Array;
	var nativeArrayBuffer = NativeUint8Array ? ArrayBuffer : patchedU8Array;
	var arrayBuffer_isView = nativeArrayBuffer.isView || function(x) {return x && "length" in x};
	var arrayBufferString = Object_prototype_toString.call(nativeArrayBuffer.prototype);
	var window_encodeURIComponent = encodeURIComponent;
	var window_parseInt = parseInt;
	var TextEncoderPrototype = TextEncoder["prototype"];
	var GlobalTextEncoder = window["TextEncoder"];
	var decoderRegexp = /[\xc0-\xff][\x80-\xbf]+|[\x80-\xff]/g;
	var encoderRegexp = /[\x80-\uD7ff\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g;
	var tmpBufferU16 = new (NativeUint8Array ? Uint16Array : patchedU8Array)(32);
	var globalTextEncoderPrototype;
	var globalTextEncoderInstance;
	
	/*function decoderReplacer(encoded) {
		var cp0 = encoded.charCodeAt(0), codePoint=0x110000, i=0, stringLen=encoded.length|0, result="";
		switch(cp0 >> 4) {
			// no 1 byte sequences
			case 12:
			case 13:
				codePoint = ((cp0 & 0x1F) << 6) | (encoded.charCodeAt(1) & 0x3F);
				i = codePoint < 0x80 ? 0 : 2;
				break;
			case 14:
				codePoint = ((cp0 & 0x0F) << 12) | ((encoded.charCodeAt(1) & 0x3F) << 6) | (encoded.charCodeAt(2) & 0x3F);
				i = codePoint < 0x800 ? 0 : 3;
				break;
			case 15:
				if ((cp0 >> 3) === 30) {
					codePoint = ((cp0 & 0x07) << 18) | ((encoded.charCodeAt(1) & 0x3F) << 12) | ((encoded.charCodeAt(2) & 0x3F) << 6) | (encoded.charCodeAt(3) & 0x3F);
					i = codePoint < 0x10000 ? 0 : 4;
				}
		}
		if (i) {
		    if (stringLen < i) {
		    	i = 0;
		    } else if (codePoint < 0x10000) { // BMP code point
				result = fromCharCode(codePoint);
			} else if (codePoint < 0x110000) {
				codePoint = codePoint - 0x10080|0;//- 0x10000|0;
				result = fromCharCode(
					(codePoint >> 10) + 0xD800|0,  // highSurrogate
					(codePoint & 0x3ff) + 0xDC00|0 // lowSurrogate
				);
			} else i = 0; // to fill it in with INVALIDs
		}
		
		for (; i < stringLen; i=i+1|0) result += "\ufffd"; // fill rest with replacement character
		
		return result;
	}*/
	function TextDecoder(){};
	TextDecoder["prototype"]["decode"] = function(inputArrayOrBuffer){
		var inputAs8 = inputArrayOrBuffer, asObjectString;
		if (!arrayBuffer_isView(inputAs8)) {
			asObjectString = Object_prototype_toString.call(inputAs8);
			if (asObjectString !== arrayBufferString && asObjectString !== sharedArrayBufferString && asObjectString !== undefinedObjectString)
				throw TypeError("Failed to execute 'decode' on 'TextDecoder': The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
			inputAs8 = NativeUint8Array ? new patchedU8Array(inputAs8) : inputAs8 || [];
		}
		
		var resultingString="", tmpStr="", index=0, len=inputAs8.length|0, lenMinus32=len-32|0, nextEnd=0, nextStop=0, cp0=0, codePoint=0, minBits=0, cp1=0, pos=0, tmp=-1;
		// Note that tmp represents the 2nd half of a surrogate pair incase a surrogate gets divided between blocks
		for (; index < len; ) {
			nextEnd = index <= lenMinus32 ? 32 : len - index|0;
			for (; pos < nextEnd; index=index+1|0, pos=pos+1|0) {
				cp0 = inputAs8[index] & 0xff;
				switch(cp0 >> 4) {
					case 15:
						cp1 = inputAs8[index=index+1|0] & 0xff;
						if ((cp1 >> 6) !== 0b10 || 0b11110111 < cp0) {
							index = index - 1|0;
							break;
						}
						codePoint = ((cp0 & 0b111) << 6) | (cp1 & 0b00111111);
						minBits = 5; // 20 ensures it never passes -> all invalid replacements
						cp0 = 0x100; //  keep track of th bit size
					case 14:
						cp1 = inputAs8[index=index+1|0] & 0xff;
						codePoint <<= 6;
						codePoint |= ((cp0 & 0b1111) << 6) | (cp1 & 0b00111111);
						minBits = (cp1 >> 6) === 0b10 ? minBits + 4|0 : 24; // 24 ensures it never passes -> all invalid replacements
						cp0 = (cp0 + 0x100) & 0x300; // keep track of th bit size
					case 13:
					case 12:
						cp1 = inputAs8[index=index+1|0] & 0xff;
						codePoint <<= 6;
						codePoint |= ((cp0 & 0b11111) << 6) | cp1 & 0b00111111;
						minBits = minBits + 7|0;
						
						// Now, process the code point
						if (index < len && (cp1 >> 6) === 0b10 && (codePoint >> minBits) && codePoint < 0x110000) {
							cp0 = codePoint;
							codePoint = codePoint - 0x10000|0;
							if (0 <= codePoint/*0xffff < codePoint*/) { // BMP code point
								//nextEnd = nextEnd - 1|0;
								
								tmp = (codePoint >> 10) + 0xD800|0;   // highSurrogate
								cp0 = (codePoint & 0x3ff) + 0xDC00|0; // lowSurrogate (will be inserted later in the switch-statement)
								
								if (pos < 31) { // notice 31 instead of 32
									tmpBufferU16[pos] = tmp;
									pos = pos + 1|0;
									tmp = -1;
								}  else {// else, we are at the end of the inputAs8 and let tmp0 be filled in later on
									// NOTE that cp1 is being used as a temporary variable for the swapping of tmp with cp0
									cp1 = tmp;
									tmp = cp0;
									cp0 = cp1;
								}
							} else nextEnd = nextEnd + 1|0; // because we are advancing i without advancing pos
						} else {
							// invalid code point means replacing the whole thing with null replacement characters
							cp0 >>= 8;
							index = index - cp0 - 1|0; // reset index  back to what it was before
							cp0 = 0xfffd;
						}
						
						
						// Finally, reset the variables for the next go-around
						minBits = 0;
						codePoint = 0;
						nextEnd = index <= lenMinus32 ? 32 : len - index|0;
					/*case 11:
					case 10:
					case 9:
					case 8:
						codePoint ? codePoint = 0 : cp0 = 0xfffd; // fill with invalid replacement character
					case 7:
					case 6:
					case 5:
					case 4:
					case 3:
					case 2:
					case 1:
					case 0:
						tmpBufferU16[pos] = cp0;
						continue;*/
					default:
						tmpBufferU16[pos] = cp0; // fill with invalid replacement character
						continue;
					case 11:
					case 10:
					case 9:
					case 8:
				}
				tmpBufferU16[pos] = 0xfffd; // fill with invalid replacement character
			}
			tmpStr += fromCharCode(
				tmpBufferU16[ 0], tmpBufferU16[ 1], tmpBufferU16[ 2], tmpBufferU16[ 3], tmpBufferU16[ 4], tmpBufferU16[ 5], tmpBufferU16[ 6], tmpBufferU16[ 7],
				tmpBufferU16[ 8], tmpBufferU16[ 9], tmpBufferU16[10], tmpBufferU16[11], tmpBufferU16[12], tmpBufferU16[13], tmpBufferU16[14], tmpBufferU16[15],
				tmpBufferU16[16], tmpBufferU16[17], tmpBufferU16[18], tmpBufferU16[19], tmpBufferU16[20], tmpBufferU16[21], tmpBufferU16[22], tmpBufferU16[23],
				tmpBufferU16[24], tmpBufferU16[25], tmpBufferU16[26], tmpBufferU16[27], tmpBufferU16[28], tmpBufferU16[29], tmpBufferU16[30], tmpBufferU16[31]
			);
			if (pos < 32) tmpStr = tmpStr.slice(0, pos-32|0);//-(32-pos));
			if (index < len) {
				//fromCharCode.apply(0, tmpBufferU16 : NativeUint8Array ?  tmpBufferU16.subarray(0,pos) : tmpBufferU16.slice(0,pos));
				tmpBufferU16[0] = tmp;
				pos = (~tmp) >>> 31;//tmp !== -1 ? 1 : 0;
				tmp = -1;
				
				if (tmpStr.length < resultingString.length) continue;
			} else if (tmp !== -1) {
				tmpStr += fromCharCode(tmp);
			}
			
			resultingString += tmpStr;
			tmpStr = "";
		}

		return resultingString;
	}
	//////////////////////////////////////////////////////////////////////////////////////
	function encoderReplacer(nonAsciiChars){
		// make the UTF string into a binary UTF-8 encoded string
		var point = nonAsciiChars.charCodeAt(0)|0;
		if (0xD800 <= point) {
			if (point <= 0xDBFF) {
				var nextcode = nonAsciiChars.charCodeAt(1)|0; // defaults to 0 when NaN, causing null replacement character
				
				if (0xDC00 <= nextcode && nextcode <= 0xDFFF) {
					//point = ((point - 0xD800)<<10) + nextcode - 0xDC00 + 0x10000|0;
					point = (point<<10) + nextcode - 0x35fdc00|0;
					if (point > 0xffff)
						return fromCharCode(
							(0x1e/*0b11110*/<<3) | (point>>18),
							(0x2/*0b10*/<<6) | ((point>>12)&0x3f/*0b00111111*/),
							(0x2/*0b10*/<<6) | ((point>>6)&0x3f/*0b00111111*/),
							(0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
						);
				} else point = 65533/*0b1111111111111101*/;//return '\xEF\xBF\xBD';//fromCharCode(0xef, 0xbf, 0xbd);
			} else if (point <= 0xDFFF) {
				point = 65533/*0b1111111111111101*/;//return '\xEF\xBF\xBD';//fromCharCode(0xef, 0xbf, 0xbd);
			}
		}
		/*if (point <= 0x007f) return nonAsciiChars;
		else */if (point <= 0x07ff) {
			return fromCharCode((0x6<<5)|(point>>6), (0x2<<6)|(point&0x3f));
		} else return fromCharCode(
			(0xe/*0b1110*/<<4) | (point>>12),
			(0x2/*0b10*/<<6) | ((point>>6)&0x3f/*0b00111111*/),
			(0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
		);
	}
	function TextEncoder(){};
	TextEncoderPrototype["encode"] = function(inputString){
		// 0xc0 => 0b11000000; 0xff => 0b11111111; 0xc0-0xff => 0b11xxxxxx
		// 0x80 => 0b10000000; 0xbf => 0b10111111; 0x80-0xbf => 0b10xxxxxx
		var encodedString = inputString === void 0 ? "" : ("" + inputString), len=encodedString.length|0;
		var result=new patchedU8Array((len << 1) + 8|0), tmpResult;
		var i=0, pos=0, point=0, nextcode=0;
		var upgradededArraySize=!NativeUint8Array; // normal arrays are auto-expanding
		for (i=0; i<len; i=i+1|0, pos=pos+1|0) {
			point = encodedString.charCodeAt(i)|0;
			if (point <= 0x007f) {
				result[pos] = point;
			} else if (point <= 0x07ff) {
				result[pos] = (0x6<<5)|(point>>6);
				result[pos=pos+1|0] = (0x2<<6)|(point&0x3f);
			} else {
				widenCheck: {
					if (0xD800 <= point) {
						if (point <= 0xDBFF) {
							nextcode = encodedString.charCodeAt(i=i+1|0)|0; // defaults to 0 when NaN, causing null replacement character
							
							if (0xDC00 <= nextcode && nextcode <= 0xDFFF) {
								//point = ((point - 0xD800)<<10) + nextcode - 0xDC00 + 0x10000|0;
								point = (point<<10) + nextcode - 0x35fdc00|0;
								if (point > 0xffff) {
									result[pos] = (0x1e/*0b11110*/<<3) | (point>>18);
									result[pos=pos+1|0] = (0x2/*0b10*/<<6) | ((point>>12)&0x3f/*0b00111111*/);
									result[pos=pos+1|0] = (0x2/*0b10*/<<6) | ((point>>6)&0x3f/*0b00111111*/);
									result[pos=pos+1|0] = (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/);
									continue;
								}
								break widenCheck;
							}
							point = 65533/*0b1111111111111101*/;//return '\xEF\xBF\xBD';//fromCharCode(0xef, 0xbf, 0xbd);
						} else if (point <= 0xDFFF) {
							point = 65533/*0b1111111111111101*/;//return '\xEF\xBF\xBD';//fromCharCode(0xef, 0xbf, 0xbd);
						}
					}
					if (!upgradededArraySize && (i << 1) < pos && (i << 1) < (pos - 7|0)) {
						upgradededArraySize = true;
						tmpResult = new patchedU8Array(len * 3);
						tmpResult.set( result );
						result = tmpResult;
					}
				}
				result[pos] = (0xe/*0b1110*/<<4) | (point>>12);
				result[pos=pos+1|0] =(0x2/*0b10*/<<6) | ((point>>6)&0x3f/*0b00111111*/);
				result[pos=pos+1|0] =(0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/);
			}
		}
		return NativeUint8Array ? result.subarray(0, pos) : result.slice(0, pos);
	};
	function polyfill_encodeInto(inputString, u8Arr) {
		var encodedString = inputString === void 0 ?  "" : ("" + inputString).replace(encoderRegexp, encoderReplacer);
		var len=encodedString.length|0, i=0, char=0, read=0, u8ArrLen = u8Arr.length|0, inputLength=inputString.length|0;
		if (u8ArrLen < len) len=u8ArrLen;
		putChars: {
			for (; i<len; i=i+1|0) {
				char = encodedString.charCodeAt(i) |0;
				switch(char >> 4) {
					case 0:
					case 1:
					case 2:
					case 3:
					case 4:
					case 5:
					case 6:
					case 7:
						read = read + 1|0;
						// extension points:
					case 8:
					case 9:
					case 10:
					case 11:
						break;
					case 12:
					case 13:
						if ((i+1|0) < u8ArrLen) {
							read = read + 1|0;
							break;
						}
					case 14:
						if ((i+2|0) < u8ArrLen) {
							//if (!(char === 0xEF && encodedString.substr(i+1|0,2) === "\xBF\xBD"))
							read = read + 1|0;
							break;
						}
					case 15:
						if ((i+3|0) < u8ArrLen) {
							read = read + 1|0;
							break;
						}
					default:
						break putChars;
				}
				//read = read + ((char >> 6) !== 2) |0;
				u8Arr[i] = char;
			}
		}
		return {"written": i, "read": inputLength < read ? inputLength : read};
		// 0xc0 => 0b11000000; 0xff => 0b11111111; 0xc0-0xff => 0b11xxxxxx
		// 0x80 => 0b10000000; 0xbf => 0b10111111; 0x80-0xbf => 0b10xxxxxx
		/*var encodedString = typeof inputString == "string" ? inputString : inputString === void 0 ?  "" : "" + inputString;
		var encodedLen = encodedString.length|0, u8LenLeft=u8Arr.length|0;
		var i=-1, read=-1, code=0, point=0, nextcode=0;
		tryFast: if (2 < encodedLen && encodedLen < (u8LenLeft >> 1)) {
			// Skip the normal checks because we can almost certainly fit the string inside the existing buffer
			while (1) {		// make the UTF string into a binary UTF-8 encoded string
				point = encodedString.charCodeAt(read = read + 1|0)|0;
				
				if (point <= 0x007f) {
					if (point === 0 && encodedLen <= read) {
						read = read - 1|0;
						break; // we have reached the end of the string
					}
					u8Arr[i=i+1|0] = point;
				} else if (point <= 0x07ff) {
					u8Arr[i=i+1|0] = (0x6<<5)|(point>>6);
					u8Arr[i=i+1|0] = (0x2<<6)|(point&0x3f);
				} else {
					if (0xD800 <= point && point <= 0xDBFF) {
						nextcode = encodedString.charCodeAt(read)|0; // defaults to 0 when NaN, causing null replacement character
						
						if (0xDC00 <= nextcode && nextcode <= 0xDFFF) {
							read = read + 1|0;
							//point = ((point - 0xD800)<<10) + nextcode - 0xDC00 + 0x10000|0;
							point = (point<<10) + nextcode - 0x35fdc00|0;
							if (point > 0xffff) {
								u8Arr[i=i+1|0] = (0x1e<<3) | (point>>18);
								u8Arr[i=i+1|0] = (0x2<<6) | ((point>>12)&0x3f);
								u8Arr[i=i+1|0] = (0x2<<6) | ((point>>6)&0x3f);
								u8Arr[i=i+1|0] = (0x2<<6) | (point&0x3f);
								continue;
							}
						} else if (nextcode === 0 && encodedLen <= read) {
							break; // we have reached the end of the string
						} else {
							point = 65533;//0b1111111111111101; // invalid replacement character
						}
					}
					u8Arr[i=i+1|0] = (0xe<<4) | (point>>12);
					u8Arr[i=i+1|0] = (0x2<<6) | ((point>>6)&0x3f);
					u8Arr[i=i+1|0] = (0x2<<6) | (point&0x3f);
					if (u8LenLeft < (i + ((encodedLen - read) << 1)|0)) {
						// These 3x chars are the only way to inflate the size to 3x
						u8LenLeft = u8LenLeft - i|0;
						break tryFast;
					}
				}
			}
			u8LenLeft = 0; // skip the next for-loop 
		}
		
		
		for (; 0 < u8LenLeft; ) {		// make the UTF string into a binary UTF-8 encoded string
			point = encodedString.charCodeAt(read = read + 1|0)|0;
			
			if (point <= 0x007f) {
				if (point === 0 && encodedLen <= read) {
					read = read - 1|0;
					break; // we have reached the end of the string
				}
				u8LenLeft = u8LenLeft - 1|0;
				u8Arr[i=i+1|0] = point;
			} else if (point <= 0x07ff) {
				u8LenLeft = u8LenLeft - 2|0;
				if (0 <= u8LenLeft) {
					u8Arr[i=i+1|0] = (0x6<<5)|(point>>6);
					u8Arr[i=i+1|0] = (0x2<<6)|(point&0x3f);
				}
			} else {
				if (0xD800 <= point && point <= 0xDBFF) {
					nextcode = encodedString.charCodeAt(read = read + 1|0)|0; // defaults to 0 when NaN, causing null replacement character
					
					if (0xDC00 <= nextcode) {
						if (nextcode <= 0xDFFF) {
							read = read + 1|0;
							//point = ((point - 0xD800)<<10) + nextcode - 0xDC00 + 0x10000|0;
							point = (point<<10) + nextcode - 0x35fdc00|0;
							if (point > 0xffff) {
								u8LenLeft = u8LenLeft - 4|0;
								if (0 <= u8LenLeft) {
									u8Arr[i=i+1|0] = (0x1e<<3) | (point>>18);
									u8Arr[i=i+1|0] = (0x2<<6) | ((point>>12)&0x3f);
									u8Arr[i=i+1|0] = (0x2<<6) | ((point>>6)&0x3f);
									u8Arr[i=i+1|0] = (0x2<<6) | (point&0x3f);
								}
								continue;
							}
						} else if (point <= 0xDFFF) {
							point = 65533/*0b1111111111111101*\/;//return '\xEF\xBF\xBD';//fromCharCode(0xef, 0xbf, 0xbd);
						}
					} else if (nextcode === 0 && encodedLen <= read) {
						break; // we have reached the end of the string
					} else {
						point = 65533;//0b1111111111111101; // invalid replacement character
					}
				}
				u8LenLeft = u8LenLeft - 3|0;
				if (0 <= u8LenLeft) {
					u8Arr[i=i+1|0] = (0xe<<<4) | (point>>12);
					u8Arr[i=i+1|0] = (0x2<<6) | ((point>>6)&0x3f);
					u8Arr[i=i+1|0] = (0x2<<6) | (point&0x3f);
				}
			}
		} 
		return {"read": read < 0 ? 0 : u8LenLeft < 0 ? read : read+1|0, "written": i < 0 ? 0 : i+1|0};*/
	};
	if (ENCODEINTO_BUILD) {
		TextEncoderPrototype["encodeInto"] = polyfill_encodeInto;
	}
	
	if (!GlobalTextEncoder) {
		window["TextDecoder"] = TextDecoder;
		window["TextEncoder"] = TextEncoder;
	} else if (ENCODEINTO_BUILD && !(globalTextEncoderPrototype = GlobalTextEncoder["prototype"])["encodeInto"]) {
		globalTextEncoderInstance = new GlobalTextEncoder;
		globalTextEncoderPrototype["encodeInto"] = function(string, u8arr) {
			// Unfortunately, there's no way I can think of to quickly extract the number of bits written and the number of bytes read and such
			var strLen = string.length|0, u8Len = u8arr.length|0;
			if (strLen < (u8Len >> 1)) { // in most circumstances, this means its safe. there are still edge-cases which are possible
				// in many circumstances, we can use the faster native TextEncoder
				var res8 = globalTextEncoderInstance["encode"](string);
				var res8Len = res8.length|0;
				if (res8Len < u8Len) { // if we dont have to worry about read/written
					u8arr.set( res8 ); // every browser that supports TextEncoder also supports typedarray.prototype.set
					return {
						"read": strLen,
						"written": res8.length|0
					};
				}
			}
			return polyfill_encodeInto(string, u8arr);
		};
	}
})(typeof global == "" + void 0 ? typeof self == "" + void 0 ? this : self : global);

// NextSection
/* Blob.js
 * A Blob, File, FileReader & URL implementation.
 * 2019-04-19
 *
 * By Eli Grey, http://eligrey.com
 * By Jimmy Wärting, https://github.com/jimmywarting
 * License: MIT
 *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
 */

;(function () {
  var global = typeof window === 'object'
      ? window : typeof self === 'object'
      ? self : this

  var BlobBuilder = global.BlobBuilder
    || global.WebKitBlobBuilder
    || global.MSBlobBuilder
    || global.MozBlobBuilder

  global.URL = global.URL || global.webkitURL || function (href, a) {
  	a = document.createElement('a')
  	a.href = href
  	return a
  }

  var origBlob = global.Blob
  var createObjectURL = URL.createObjectURL
  var revokeObjectURL = URL.revokeObjectURL
  var strTag = global.Symbol && global.Symbol.toStringTag
  var blobSupported = false
  var blobSupportsArrayBufferView = false
  var arrayBufferSupported = !!global.ArrayBuffer
  var blobBuilderSupported = BlobBuilder
    && BlobBuilder.prototype.append
    && BlobBuilder.prototype.getBlob

  try {
    // Check if Blob constructor is supported
    blobSupported = new Blob(['ä']).size === 2

    // Check if Blob constructor supports ArrayBufferViews
    // Fails in Safari 6, so we need to map to ArrayBuffers there.
    blobSupportsArrayBufferView = new Blob([new Uint8Array([1, 2])]).size === 2
  } catch (e) {}

  /**
   * Helper function that maps ArrayBufferViews to ArrayBuffers
   * Used by BlobBuilder constructor and old browsers that didn't
   * support it in the Blob constructor.
   */
  function mapArrayBufferViews (ary) {
    return ary.map(function (chunk) {
      if (chunk.buffer instanceof ArrayBuffer) {
        var buf = chunk.buffer

        // if this is a subarray, make a copy so we only
        // include the subarray region from the underlying buffer
        if (chunk.byteLength !== buf.byteLength) {
          var copy = new Uint8Array(chunk.byteLength)
          copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength))
          buf = copy.buffer
        }

        return buf
      }

      return chunk
    })
  }

  function BlobBuilderConstructor (ary, options) {
    options = options || {}

    var bb = new BlobBuilder()
    mapArrayBufferViews(ary).forEach(function (part) {
      bb.append(part)
    })

    return options.type ? bb.getBlob(options.type) : bb.getBlob()
  }

  function BlobConstructor (ary, options) {
    return new origBlob(mapArrayBufferViews(ary), options || {})
  }

  if (global.Blob) {
    BlobBuilderConstructor.prototype = Blob.prototype
    BlobConstructor.prototype = Blob.prototype
  }



  /********************************************************/
  /*               String Encoder fallback                */
  /********************************************************/
  function stringEncode (string) {
    var pos = 0
    var len = string.length
    var Arr = global.Uint8Array || Array // Use byte array when possible

    var at = 0  // output position
    var tlen = Math.max(32, len + (len >> 1) + 7)  // 1.5x size
    var target = new Arr((tlen >> 3) << 3)  // ... but at 8 byte offset

    while (pos < len) {
      var value = string.charCodeAt(pos++)
      if (value >= 0xd800 && value <= 0xdbff) {
        // high surrogate
        if (pos < len) {
          var extra = string.charCodeAt(pos)
          if ((extra & 0xfc00) === 0xdc00) {
            ++pos
            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000
          }
        }
        if (value >= 0xd800 && value <= 0xdbff) {
          continue  // drop lone surrogate
        }
      }

      // expand the buffer if we couldn't write 4 bytes
      if (at + 4 > target.length) {
        tlen += 8  // minimum extra
        tlen *= (1.0 + (pos / string.length) * 2)  // take 2x the remaining
        tlen = (tlen >> 3) << 3  // 8 byte offset

        var update = new Uint8Array(tlen)
        update.set(target)
        target = update
      }

      if ((value & 0xffffff80) === 0) {  // 1-byte
        target[at++] = value  // ASCII
        continue
      } else if ((value & 0xfffff800) === 0) {  // 2-byte
        target[at++] = ((value >> 6) & 0x1f) | 0xc0
      } else if ((value & 0xffff0000) === 0) {  // 3-byte
        target[at++] = ((value >> 12) & 0x0f) | 0xe0
        target[at++] = ((value >> 6) & 0x3f) | 0x80
      } else if ((value & 0xffe00000) === 0) {  // 4-byte
        target[at++] = ((value >> 18) & 0x07) | 0xf0
        target[at++] = ((value >> 12) & 0x3f) | 0x80
        target[at++] = ((value >> 6) & 0x3f) | 0x80
      } else {
        // FIXME: do we care
        continue
      }

      target[at++] = (value & 0x3f) | 0x80
    }

    return target.slice(0, at)
  }

  /********************************************************/
  /*               String Decoder fallback                */
  /********************************************************/
  function stringDecode (buf) {
    var end = buf.length
    var res = []

    var i = 0
    while (i < end) {
      var firstByte = buf[i]
      var codePoint = null
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
          : (firstByte > 0xBF) ? 2
            : 1

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte
            }
            break
          case 2:
            secondByte = buf[i + 1]
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint
              }
            }
            break
          case 3:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint
              }
            }
            break
          case 4:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            fourthByte = buf[i + 3]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD
        bytesPerSequence = 1
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000
        res.push(codePoint >>> 10 & 0x3FF | 0xD800)
        codePoint = 0xDC00 | codePoint & 0x3FF
      }

      res.push(codePoint)
      i += bytesPerSequence
    }

    var len = res.length
    var str = ''
    var i = 0

    while (i < len) {
      str += String.fromCharCode.apply(String, res.slice(i, i += 0x1000))
    }

    return str
  }

  // string -> buffer
  var textEncode = typeof TextEncoder === 'function'
    ? TextEncoder.prototype.encode.bind(new TextEncoder())
    : stringEncode

  // buffer -> string
  var textDecode = typeof TextDecoder === 'function'
    ? TextDecoder.prototype.decode.bind(new TextDecoder())
    : stringDecode

  function FakeBlobBuilder () {
    function isDataView (obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    }
    function bufferClone (buf) {
      var view = new Array(buf.byteLength)
      var array = new Uint8Array(buf)
      var i = view.length
      while (i--) {
        view[i] = array[i]
      }
      return view
    }
    function array2base64 (input) {
      var byteToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

      var output = []

      for (var i = 0; i < input.length; i += 3) {
        var byte1 = input[i]
        var haveByte2 = i + 1 < input.length
        var byte2 = haveByte2 ? input[i + 1] : 0
        var haveByte3 = i + 2 < input.length
        var byte3 = haveByte3 ? input[i + 2] : 0

        var outByte1 = byte1 >> 2
        var outByte2 = ((byte1 & 0x03) << 4) | (byte2 >> 4)
        var outByte3 = ((byte2 & 0x0F) << 2) | (byte3 >> 6)
        var outByte4 = byte3 & 0x3F

        if (!haveByte3) {
          outByte4 = 64

          if (!haveByte2) {
            outByte3 = 64
          }
        }

        output.push(
          byteToCharMap[outByte1], byteToCharMap[outByte2],
          byteToCharMap[outByte3], byteToCharMap[outByte4]
        )
      }

      return output.join('')
    }

    var create = Object.create || function (a) {
      function c () {}
      c.prototype = a
      return new c()
    }

    if (arrayBufferSupported) {
      var viewClasses = [
        '[object Int8Array]',
        '[object Uint8Array]',
        '[object Uint8ClampedArray]',
        '[object Int16Array]',
        '[object Uint16Array]',
        '[object Int32Array]',
        '[object Uint32Array]',
        '[object Float32Array]',
        '[object Float64Array]'
      ]

      var isArrayBufferView = ArrayBuffer.isView || function (obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      }
    }

    function concatTypedarrays (chunks) {
      var size = 0
      var i = chunks.length, l
      while (i--) { size += chunks[i].length }
      var b = new Uint8Array(size)
      var offset = 0
      for (i = 0, l = chunks.length; i < l; i++) {
        var chunk = chunks[i]
        b.set(chunk, offset)
        offset += chunk.byteLength || chunk.length
      }

      return b
    }

    /********************************************************/
    /*                   Blob constructor                   */
    /********************************************************/
    function Blob (chunks, opts) {
      chunks = chunks || []
      opts = opts == null ? {} : opts
      for (var i = 0, len = chunks.length; i < len; i++) {
        var chunk = chunks[i]
        if (chunk instanceof Blob) {
          chunks[i] = chunk._buffer
        } else if (typeof chunk === 'string') {
          chunks[i] = textEncode(chunk)
        } else if (arrayBufferSupported && (ArrayBuffer.prototype.isPrototypeOf(chunk) || isArrayBufferView(chunk))) {
          chunks[i] = bufferClone(chunk)
        } else if (arrayBufferSupported && isDataView(chunk)) {
          chunks[i] = bufferClone(chunk.buffer)
        } else {
          chunks[i] = textEncode(String(chunk))
        }
      }

      this._buffer = global.Uint8Array
        ? concatTypedarrays(chunks)
        : [].concat.apply([], chunks)
      this.size = this._buffer.length

      this.type = opts.type || ''
      if (/[^\u0020-\u007E]/.test(this.type)) {
        this.type = ''
      } else {
        this.type = this.type.toLowerCase()
      }
    }

    Blob.prototype.arrayBuffer = function () {
      return my$win().Promise.resolve(this._buffer)
    }

    Blob.prototype.text = function () {
      return my$win().Promise.resolve(textDecode(this._buffer))
    }

    Blob.prototype.slice = function (start, end, type) {
      var slice = this._buffer.slice(start || 0, end || this._buffer.length)
      return new Blob([slice], {type: type})
    }

    Blob.prototype.toString = function () {
      return '[object Blob]'
    }

    /********************************************************/
    /*                   File constructor                   */
    /********************************************************/
    function File (chunks, name, opts) {
      opts = opts || {}
      var a = Blob.call(this, chunks, opts) || this
      a.name = name.replace(/\//g, ':')
      a.lastModifiedDate = opts.lastModified ? new Date(opts.lastModified) : new Date()
      a.lastModified = +a.lastModifiedDate

      return a
    }

    File.prototype = create(Blob.prototype)
    File.prototype.constructor = File

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(File, Blob)
    } else {
      try { File.__proto__ = Blob } catch (e) {}
    }

    File.prototype.toString = function () {
      return '[object File]'
    }

    /********************************************************/
    /*                FileReader constructor                */
    /********************************************************/
    function FileReader () {
    	if (!(this instanceof FileReader)) {
        throw new TypeError("Failed to construct 'FileReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.")
      }

    	var delegate = document.createDocumentFragment()
    	this.addEventListener = delegate.addEventListener
    	this.dispatchEvent = function (evt) {
    		var local = this['on' + evt.type]
    		if (typeof local === 'function') local(evt)
    		delegate.dispatchEvent(evt)
    	}
    	this.removeEventListener = delegate.removeEventListener
    }

    function _read (fr, blob, kind) {
    	if (!(blob instanceof Blob)) {
        throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.")
      }

    	fr.result = ''

    	setTimeout(function () {
    		this.readyState = FileReader.LOADING
    		fr.dispatchEvent(new Event('load'))
    		fr.dispatchEvent(new Event('loadend'))
    	})
    }

    FileReader.EMPTY = 0
    FileReader.LOADING = 1
    FileReader.DONE = 2
    FileReader.prototype.error = null
    FileReader.prototype.onabort = null
    FileReader.prototype.onerror = null
    FileReader.prototype.onload = null
    FileReader.prototype.onloadend = null
    FileReader.prototype.onloadstart = null
    FileReader.prototype.onprogress = null

    FileReader.prototype.readAsDataURL = function (blob) {
    	_read(this, blob, 'readAsDataURL')
    	this.result = 'data:' + blob.type + ';base64,' + array2base64(blob._buffer)
    }

    FileReader.prototype.readAsText = function (blob) {
    	_read(this, blob, 'readAsText')
    	this.result = textDecode(blob._buffer)
    }

    FileReader.prototype.readAsArrayBuffer = function (blob) {
      _read(this, blob, 'readAsText')
       // return ArrayBuffer when possible
      this.result = (blob._buffer.buffer || blob._buffer).slice()
    }

    FileReader.prototype.abort = function () {}

    /********************************************************/
    /*                         URL                          */
    /********************************************************/
    URL.createObjectURL = function (blob) {
      return blob instanceof Blob
        ? 'data:' + blob.type + ';base64,' + array2base64(blob._buffer)
        : createObjectURL.call(URL, blob)
    }

    URL.revokeObjectURL = function (url) {
      revokeObjectURL && revokeObjectURL.call(URL, url)
    }

    /********************************************************/
    /*                         XHR                          */
    /********************************************************/
    var _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send
    if (_send) {
      XMLHttpRequest.prototype.send = function (data) {
        if (data instanceof Blob) {
          this.setRequestHeader('Content-Type', data.type)
          _send.call(this, textDecode(data._buffer))
        } else {
          _send.call(this, data)
        }
      }
    }

    global.FileReader = FileReader
    global.File = File
    global.Blob = Blob
  }

  function fixFileAndXHR () {
    var isIE = !!global.ActiveXObject || (
      '-ms-scroll-limit' in document.documentElement.style &&
      '-ms-ime-align' in document.documentElement.style
    )

    // Monkey patched
    // IE don't set Content-Type header on XHR whose body is a typed Blob
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/6047383
    var _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send
    if (isIE && _send) {
      XMLHttpRequest.prototype.send = function (data) {
        if (data instanceof Blob) {
          this.setRequestHeader('Content-Type', data.type)
          _send.call(this, data)
        } else {
          _send.call(this, data)
        }
      }
    }

    try {
      new File([], '')
    } catch (e) {
      try {
        var klass = new Function('class File extends Blob {' +
          'constructor(chunks, name, opts) {' +
            'opts = opts || {};' +
            'super(chunks, opts || {});' +
            'this.name = name.replace(/\//g, ":");' +
            'this.lastModifiedDate = opts.lastModified ? new Date(opts.lastModified) : new Date();' +
            'this.lastModified = +this.lastModifiedDate;' +
          '}};' +
          'return new File([], ""), File'
        )()
        global.File = klass
      } catch (e) {
        var klass = function (b, d, c) {
          var blob = new Blob(b, c)
          var t = c && void 0 !== c.lastModified ? new Date(c.lastModified) : new Date()

          blob.name = d.replace(/\//g, ':')
          blob.lastModifiedDate = t
          blob.lastModified = +t
          blob.toString = function () {
            return '[object File]'
          }

          if (strTag) {
            blob[strTag] = 'File'
          }

          return blob
        }
        global.File = klass
      }
    }
  }

  if (blobSupported) {
    fixFileAndXHR()
    global.Blob = blobSupportsArrayBufferView ? global.Blob : BlobConstructor
  } else if (blobBuilderSupported) {
    fixFileAndXHR()
    global.Blob = BlobBuilderConstructor
  } else {
    FakeBlobBuilder()
  }

  if (strTag) {
    File.prototype[strTag] = 'File'
    Blob.prototype[strTag] = 'Blob'
    FileReader.prototype[strTag] = 'FileReader'
  }

  var blob = global.Blob.prototype
  var stream

  function promisify(obj) {
    return new (my$win().Promise)(function(resolve, reject) {
      obj.onload =
      obj.onerror = function(evt) {
        obj.onload =
        obj.onerror = null

        evt.type === 'load'
          ? resolve(obj.result || obj)
          : reject(new Error('Failed to read the blob/file'))
      }
    })
  }


  try {
    new ReadableStream({ type: 'bytes' })
    stream = function stream() {
      var position = 0
      var blob = this

      return new ReadableStream({
        type: 'bytes',
        autoAllocateChunkSize: 524288,

        pull: function (controller) {
          var v = controller.byobRequest.view
          var chunk = blob.slice(position, position + v.byteLength)
          return chunk.arrayBuffer()
          .then(function (buffer) {
            var uint8array = new Uint8Array(buffer)
            var bytesRead = uint8array.byteLength

            position += bytesRead
            v.set(uint8array)
              controller.byobRequest.respond(bytesRead)

            if(position >= blob.size)
              controller.close()
          })
        }
      })
    }
  } catch (e) {
    try {
      new ReadableStream({})
      stream = function stream(blob){
        var position = 0
        var blob = this

        return new ReadableStream({
          pull: function (controller) {
            var chunk = blob.slice(position, position + 524288)

            return chunk.arrayBuffer().then(function (buffer) {
              position += buffer.byteLength
              var uint8array = new Uint8Array(buffer)
              controller.enqueue(uint8array)

              if (position == blob.size)
                controller.close()
            })
          }
        })
      }
    } catch (e) {
      try {
        new Response('').body.getReader().read()
        stream = function stream() {
          return (new Response(this)).body
        }
      } catch (e) {
        stream = function stream() {
          throw new Error('Include https://github.com/MattiasBuelens/web-streams-polyfill')
        }
      }
    }
  }


  if (!blob.arrayBuffer) {
    blob.arrayBuffer = function arrayBuffer() {
      var fr = new FileReader()
      fr.readAsArrayBuffer(this)
      return promisify(fr)
    }
  }

  if (!blob.text) {
    blob.text = function text() {
      var fr = new FileReader()
      fr.readAsText(this)
      return promisify(fr)
    }
  }

  if (!blob.stream) {
    blob.stream = stream
  }
})()

// NextSection
// Ok this is my function, but it blends with the message port functions below.
function onmessage$$running() {
    let rc = false;
    if (this.eb$pause) return rc;
    if (!(this.onmessage || (this.onmessage$$array && this.onmessage$$array.length))) return rc;
    // We have handlers
    while (this.onmessage$$queue.length) {
        // better run messages fifo
        const me = this.onmessage$$queue[0];
        this.onmessage$$queue.splice(0, 1);
        // if you add another handler, it won't run on this message.
        let datashow = me.data;
        let datalength = 0;
        if (typeof me.data == "string") datalength = me.data.length;
        if (datalength >= 200) datashow = "long";
        alert3(`${this.nodeName} context ${this.eb$ctx} processes message of length ${datalength} ↑${datashow}↑`);
        rc = true;
        const e = new (my$win().Event)("message");
        for (const p of ["origin", "ports", "source"]) e[p] = me[p];
        e.data = my$win().structuredClone(me.data);
        // Correct per mdn
        e.bubbles = false;
        e.cancelable = false;
        // non-standard but our previous version didn't capture
        e.eb$captures = false;
        // What does this do, I can't find a reference but we had it before
        e.name = "message";
        this.dispatchEvent(e);
        alert3("process message complete");
    }
    return rc;
}

function lastModifiedByHead(url) {
var d = new Date; // date object
var lm;
url = url.toString(); // from URL object to string
if(url.match(/^https?:\/\//)) {
var xhr = new XMLHttpRequest;
xhr.open("head", url, false);
xhr.send("", 0);
if(xhr.status == 200) {
var r = xhr.responseHeaders;
lm = r["Last-Modified"];
if(typeof lm == "string" && lm.length > 10) {
// the Date object should accept various formats from the web server
// in case there are variations.
d = new Date(lm);
if(!d) // bad format, revert back to current date
d = new Date;
}
}
else alert3(`lastModified head request failed status ${xhr.status}`);
} else {
// not a url, assume it is a local file
var t = fileModTime(url);
// Date object expects milliseconds not seconds
if(t) d = new Date(t*1000);
}
// put date in a standard format
lm = d.toString();
// but that's not the format we want, I guess
// from: Sat Feb 22 2025 23:54:24 GMT-0500
// to: Tuesday, December 16, 2017 11:09:42
lm = lm.replace(/ GMT.*/, ""); // don't need that
var lma = lm.split(' ');
// weekday short to long
var wsl = {
"Sun":"Sunday",
"Mon":"Monday",
"Tue":"Tuesday",
"Wed":"Wednesday",
"Thu":"Thursday",
"Fri":"Friday",
"Sat":"Saturday",
}
// month short to long
var msl = {
"Jan":"January",
"Feb":"February",
"Mar":"March",
"Apr":"April",
"May":"May",
"Jun":"June",
"Jul":"July",
"Aug":"August",
"Sep":"September",
"Oct":"October",
"Nov":"November",
"Dec":"December",
}
lm = wsl[lma[0]] + ", " + msl[lma[1]] + " " + lma[2] + ", " + lma[3] + " " + lma[4];
return lm;
}

// NextSection
/*********************************************************************
MessagePort and MessageChannel
https://github.com/rocwind/message-port-polyfill
MIT license.
These are considerably modified for our purposes.
*********************************************************************/

this.MessagePort = /** @class */ (function () {
function MessagePort() {
    const w = my$win();
    this.onmessage = null;
    this.onmessageerror = null;
    this.otherPort = null;
    this.onmessage$$queue = [];
    this.eb$ctx = w.eb$ctx;
    this.eb$pause = true;
    w.mp$registry.push(this);
}
const p = MessagePort.prototype;
p.nodeName = "PORT";
p.onmessage$$running = onmessage$$running;
p.receive$message = function (msg) {
    // structured clone when posting messages to avoid reference issues
    const me = { data: my$win().structuredClone(msg.data) };
this.onmessage$$queue.push(me);
var datashow = me.data;
var datalength = 0;
if(typeof me.data == "string") datalength = me.data.length;
if(datalength >= 200) datashow = "long";
alert3("posting message of length " + datalength + " to port context " + this.eb$ctx + " ↑" +
datashow + "↑");
return true;
};
p.postMessage = function (message) {
if (this.otherPort) this.otherPort.receive$message({ data: message });
};
p.addEventListener = addEventListener;
p.removeEventListener = removeEventListener;
p.dispatchEvent = dispatchEvent;
p.start = function () {
this.eb$pause = false;
alert3("MessagePort start for context " + this.eb$ctx);
};
p.close = function () {
this.eb$pause = true;
alert3("MessagePort start for context " + this.eb$ctx);
};
return MessagePort;
}());
this.MessageChannel = /** @class */ (function () {
function MessageChannel() {
this.port1 = new MessagePort();
this.port2 = new MessagePort();
this.port1.otherPort = this.port2;
this.port2.otherPort = this.port1;
}
return MessageChannel;
}());

// NextSection
/**!
 * url-search-params-polyfill
 *
 * @author Jerry Bendy (https://github.com/jerrybendy)
 * @licence MIT
 */

(function(self) {
    'use strict';

    var nativeURLSearchParams = (function() {
            // #41 Fix issue in RN
            try {
                if (self.URLSearchParams && (new self.URLSearchParams('foo=bar')).get('foo') === 'bar') {
                    return self.URLSearchParams;
                }
            } catch (e) {}
            return null;
        })(),
        isSupportObjectConstructor = nativeURLSearchParams && (new nativeURLSearchParams({a: 1})).toString() === 'a=1',
        // There is a bug in safari 10.1 (and earlier) that incorrectly decodes `%2B` as an empty space and not a plus.
        decodesPlusesCorrectly = nativeURLSearchParams && (new nativeURLSearchParams('s=%2B').get('s') === '+'),
        __URLSearchParams__ = "__URLSearchParams__",
        // Fix bug in Edge which cannot encode ' &' correctly
        encodesAmpersandsCorrectly = nativeURLSearchParams ? (function() {
            var ampersandTest = new nativeURLSearchParams();
            ampersandTest.append('s', ' &');
            return ampersandTest.toString() === 's=+%26';
        })() : true,
        prototype = URLSearchParamsPolyfill.prototype,
        iterable = !!(self.Symbol && self.Symbol.iterator);

    if (nativeURLSearchParams && isSupportObjectConstructor && decodesPlusesCorrectly && encodesAmpersandsCorrectly) {
        return;
    }


    /**
     * Make a URLSearchParams instance
     *
     * @param {object|string|URLSearchParams} search
     * @constructor
     */
    function URLSearchParamsPolyfill(search) {
        search = search || "";

        // support construct object with another URLSearchParams instance
        if (search instanceof URLSearchParams || search instanceof URLSearchParamsPolyfill) {
            search = search.toString();
        }
        this [__URLSearchParams__] = parseToDict(search);
    }


    /**
     * Appends a specified key/value pair as a new search parameter.
     *
     * @param {string} name
     * @param {string} value
     */
    prototype.append = function(name, value) {
        appendTo(this [__URLSearchParams__], name, value);
    };

    /**
     * Deletes the given search parameter, and its associated value,
     * from the list of all search parameters.
     *
     * @param {string} name
     */
    prototype['delete'] = function(name) {
        delete this [__URLSearchParams__] [name];
    };

    /**
     * Returns the first value associated to the given search parameter.
     *
     * @param {string} name
     * @returns {string|null}
     */
    prototype.get = function(name) {
        var dict = this [__URLSearchParams__];
        return this.has(name) ? dict[name][0] : null;
    };

    /**
     * Returns all the values association with a given search parameter.
     *
     * @param {string} name
     * @returns {Array}
     */
    prototype.getAll = function(name) {
        var dict = this [__URLSearchParams__];
        return this.has(name) ? dict [name].slice(0) : [];
    };

    /**
     * Returns a Boolean indicating if such a search parameter exists.
     *
     * @param {string} name
     * @returns {boolean}
     */
    prototype.has = function(name) {
        return hasOwnProperty(this [__URLSearchParams__], name);
    };

    /**
     * Sets the value associated to a given search parameter to
     * the given value. If there were several values, delete the
     * others.
     *
     * @param {string} name
     * @param {string} value
     */
    prototype.set = function set(name, value) {
        this [__URLSearchParams__][name] = ['' + value];
    };

    /**
     * Returns a string containg a query string suitable for use in a URL.
     *
     * @returns {string}
     */
    prototype.toString = function() {
        var dict = this[__URLSearchParams__], query = [], i, key, name, value;
        for (key in dict) {
            name = encode(key);
            for (i = 0, value = dict[key]; i < value.length; i++) {
                query.push(name + '=' + encode(value[i]));
            }
        }
        return query.join('&');
    };

    // There is a bug in Safari 10.1 and `Proxy`ing it is not enough.
    var forSureUsePolyfill = !decodesPlusesCorrectly;
    var useProxy = (!forSureUsePolyfill && nativeURLSearchParams && !isSupportObjectConstructor && self.Proxy);
    var propValue; 
    if (useProxy) {
        // Safari 10.0 doesn't support Proxy, so it won't extend URLSearchParams on safari 10.0
        propValue = new Proxy(nativeURLSearchParams, {
            construct: function (target, args) {
                return new target((new URLSearchParamsPolyfill(args[0]).toString()));
            }
        })
        // Chrome <=60 .toString() on a function proxy got error "Function.prototype.toString is not generic"
        propValue.toString = Function.prototype.toString.bind(URLSearchParamsPolyfill);
    } else {
        propValue = URLSearchParamsPolyfill;
    }
    /*
     * Apply polifill to global object and append other prototype into it
     */
    Object.defineProperty(self, 'URLSearchParams', {
        value: propValue
    });

    var USPProto = self.URLSearchParams.prototype;

    USPProto.polyfill = true;

    /**
     *
     * @param {function} callback
     * @param {object} thisArg
     */
    USPProto.forEach = USPProto.forEach || function(callback, thisArg) {
        var dict = parseToDict(this.toString());
        Object.getOwnPropertyNames(dict).forEach(function(name) {
            dict[name].forEach(function(value) {
                callback.call(thisArg, value, name, this);
            }, this);
        }, this);
    };

    /**
     * Sort all name-value pairs
     */
    USPProto.sort = USPProto.sort || function() {
        var dict = parseToDict(this.toString()), keys = [], k, i, j;
        for (k in dict) {
            keys.push(k);
        }
        keys.sort();

        for (i = 0; i < keys.length; i++) {
            this['delete'](keys[i]);
        }
        for (i = 0; i < keys.length; i++) {
            var key = keys[i], values = dict[key];
            for (j = 0; j < values.length; j++) {
                this.append(key, values[j]);
            }
        }
    };

    /**
     * Returns an iterator allowing to go through all keys of
     * the key/value pairs contained in this object.
     *
     * @returns {function}
     */
    USPProto.keys = USPProto.keys || function() {
        var items = [];
        this.forEach(function(item, name) {
            items.push(name);
        });
        return makeIterator(items);
    };

    /**
     * Returns an iterator allowing to go through all values of
     * the key/value pairs contained in this object.
     *
     * @returns {function}
     */
    USPProto.values = USPProto.values || function() {
        var items = [];
        this.forEach(function(item) {
            items.push(item);
        });
        return makeIterator(items);
    };

    /**
     * Returns an iterator allowing to go through all key/value
     * pairs contained in this object.
     *
     * @returns {function}
     */
    USPProto.entries = USPProto.entries || function() {
        var items = [];
        this.forEach(function(item, name) {
            items.push([name, item]);
        });
        return makeIterator(items);
    };


    if (iterable) {
        USPProto[self.Symbol.iterator] = USPProto[self.Symbol.iterator] || USPProto.entries;
    }


    function encode(str) {
        var replace = {
            '!': '%21',
            "'": '%27',
            '(': '%28',
            ')': '%29',
            '~': '%7E',
            '%20': '+',
            '%00': '\x00'
        };
        return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, function(match) {
            return replace[match];
        });
    }

    function decode(str) {
        return str
            .replace(/[ +]/g, '%20')
            .replace(/(%[a-f0-9]{2})+/ig, function(match) {
                return decodeURIComponent(match);
            });
    }

    function makeIterator(arr) {
        var iterator = {
            next: function() {
                var value = arr.shift();
                return {done: value === undefined, value: value};
            }
        };

        if (iterable) {
            iterator[self.Symbol.iterator] = function() {
                return iterator;
            };
        }

        return iterator;
    }

    function parseToDict(search) {
        var dict = {};

        if (typeof search === "object") {
            // if `search` is an array, treat it as a sequence
            if (isArray(search)) {
                for (var i = 0; i < search.length; i++) {
                    var item = search[i];
                    if (isArray(item) && item.length === 2) {
                        appendTo(dict, item[0], item[1]);
                    } else {
                        throw new TypeError("Failed to construct 'URLSearchParams': Sequence initializer must only contain pair elements");
                    }
                }

            } else {
                for (var key in search) {
                    if (search.hasOwnProperty(key)) {
                        appendTo(dict, key, search[key]);
                    }
                }
            }

        } else {
            // remove first '?'
            if (search.indexOf("?") === 0) {
                search = search.slice(1);
            }

            var pairs = search.split("&");
            for (var j = 0; j < pairs.length; j++) {
                var value = pairs [j],
                    index = value.indexOf('=');

                if (-1 < index) {
                    appendTo(dict, decode(value.slice(0, index)), decode(value.slice(index + 1)));

                } else {
                    if (value) {
                        appendTo(dict, decode(value), '');
                    }
                }
            }
        }

        return dict;
    }

    function appendTo(dict, name, value) {
        var val = typeof value === 'string' ? value : (
            value !== null && value !== undefined && typeof value.toString === 'function' ? value.toString() : JSON.stringify(value)
        );

        // #47 Prevent using `hasOwnProperty` as a property name
        if (hasOwnProperty(dict, name)) {
            dict[name].push(val);
        } else {
            dict[name] = [val];
        }
    }

    function isArray(val) {
        return !!val && '[object Array]' === Object.prototype.toString.call(val);
    }

    function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

})(typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : this));

// NextSection
// https://raw.githubusercontent.com/jimmywarting/FormData/master/FormData.js
// jimmy@warting.se

/* formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

/* global FormData self Blob File */
/* eslint-disable no-inner-declarations */

if (typeof Blob !== 'undefined' && (typeof FormData === 'undefined' || !FormData.prototype.keys)) {
  const global = typeof globalThis === 'object'
    ? globalThis
    : typeof window === 'object'
      ? window
      : typeof self === 'object' ? self : this

  // keep a reference to native implementation
  const _FormData = global.FormData

  // To be monkey patched
  const _send = global.XMLHttpRequest && global.XMLHttpRequest.prototype.send
  const _fetch = global.Request && global.fetch
  const _sendBeacon = global.navigator && global.navigator.sendBeacon
  // Might be a worker thread...
  const _match = global.Element && global.Element.prototype

  // Unable to patch Request/Response constructor correctly #109
  // only way is to use ES6 class extend
  // https://github.com/babel/babel/issues/1966

  const stringTag = global.Symbol && Symbol.toStringTag

  // Add missing stringTags to blob and files
  if (stringTag) {
    if (!Blob.prototype[stringTag]) {
      Blob.prototype[stringTag] = 'Blob'
    }

    if ('File' in global && !File.prototype[stringTag]) {
      File.prototype[stringTag] = 'File'
    }
  }

  // Fix so you can construct your own File
  try {
    new File([], '') // eslint-disable-line
  } catch (a) {
    global.File = function File (b, d, c) {
      const blob = new Blob(b, c || {})
      const t = c && void 0 !== c.lastModified ? new Date(c.lastModified) : new Date()

      Object.defineProperties(blob, {
        name: {
          value: d
        },
        lastModified: {
          value: +t
        },
        toString: {
          value () {
            return '[object File]'
          }
        }
      })

      if (stringTag) {
        Object.defineProperty(blob, stringTag, {
          value: 'File'
        })
      }

      return blob
    }
  }

  function ensureArgs (args, expected) {
    if (args.length < expected) {
      throw new TypeError(`${expected} argument required, but only ${args.length} present.`)
    }
  }

  /**
   * @param {string} name
   * @param {string | undefined} filename
   * @returns {[string, File|string]}
   */
  function normalizeArgs (name, value, filename) {
    if (value instanceof Blob) {
      filename = filename !== undefined
      ? String(filename + '')
      : typeof value.name === 'string'
      ? value.name
      : 'blob'

      if (value.name !== filename || Object.prototype.toString.call(value) === '[object Blob]') {
        value = new File([value], filename)
      }
      return [String(name), value]
    }
    return [String(name), String(value)]
  }

  // normalize line feeds for textarea
  // https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
  function normalizeLinefeeds (value) {
    return value.replace(/\r?\n|\r/g, '\r\n')
  }

  /**
   * @template T
   * @param {ArrayLike<T>} arr
   * @param {{ (elm: T): void; }} cb
   */
  function each (arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i])
    }
  }

  const escape = str => str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22')

  /**
   * @implements {Iterable}
   */
  class FormDataPolyfill {
    /**
     * FormData class
     *
     * @param {HTMLFormElement=} form
     */
    constructor (form) {
      /** @type {[string, string|File][]} */
      this._data = []

      const self = this
      form && each(form.elements, (/** @type {HTMLInputElement} */ elm) => {
        if (
          !elm.name ||
          elm.disabled ||
          elm.type === 'submit' ||
          elm.type === 'button' ||
          elm.matches('form fieldset[disabled] *')
        ) return

        if (elm.type === 'file') {
          const files = elm.files && elm.files.length
            ? elm.files
            : [new File([], '', { type: 'application/octet-stream' })] // #78

          each(files, file => {
            self.append(elm.name, file)
          })
        } else if (elm.type === 'select-multiple' || elm.type === 'select-one') {
          each(elm.options, opt => {
            !opt.disabled && opt.selected && self.append(elm.name, opt.value)
          })
        } else if (elm.type === 'checkbox' || elm.type === 'radio') {
          if (elm.checked) self.append(elm.name, elm.value)
        } else {
          const value = elm.type === 'textarea' ? normalizeLinefeeds(elm.value) : elm.value
          self.append(elm.name, value)
        }
      })
    }

    /**
     * Append a field
     *
     * @param   {string}           name      field name
     * @param   {string|Blob|File} value     string / blob / file
     * @param   {string=}          filename  filename to use with blob
     * @return  {undefined}
     */
    append (name, value, filename) {
      ensureArgs(arguments, 2)
      this._data.push(normalizeArgs(name, value, filename))
    }

    /**
     * Delete all fields values given name
     *
     * @param   {string}  name  Field name
     * @return  {undefined}
     */
    delete (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)

      each(this._data, entry => {
        entry[0] !== name && result.push(entry)
      })

      this._data = result
    }

    /**
     * Iterate over all fields as [name, value]
     *
     * @return {Iterator}
     */
    * entries () {
      for (var i = 0; i < this._data.length; i++) {
        yield this._data[i]
      }
    }

    /**
     * Iterate over all fields
     *
     * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
     * @param   {Object=}   thisArg   `this` context for callback function
     */
    forEach (callback, thisArg) {
      ensureArgs(arguments, 1)
      for (const [name, value] of this) {
        callback.call(thisArg, value, name, this)
      }
    }

    /**
     * Return first field value given name
     * or null if non existent
     *
     * @param   {string}  name      Field name
     * @return  {string|File|null}  value Fields value
     */
    get (name) {
      ensureArgs(arguments, 1)
      const entries = this._data
      name = String(name)
      for (let i = 0; i < entries.length; i++) {
        if (entries[i][0] === name) {
          return entries[i][1]
        }
      }
      return null
    }

    /**
     * Return all fields values given name
     *
     * @param   {string}  name  Fields name
     * @return  {Array}         [{String|File}]
     */
    getAll (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)
      each(this._data, data => {
        data[0] === name && result.push(data[1])
      })

      return result
    }

    /**
     * Check for field name existence
     *
     * @param   {string}   name  Field name
     * @return  {boolean}
     */
    has (name) {
      ensureArgs(arguments, 1)
      name = String(name)
      for (let i = 0; i < this._data.length; i++) {
        if (this._data[i][0] === name) {
          return true
        }
      }
      return false
    }

    /**
     * Iterate over all fields name
     *
     * @return {Iterator}
     */
    * keys () {
      for (const [name] of this) {
        yield name
      }
    }

    /**
     * Overwrite all values given name
     *
     * @param   {string}    name      Filed name
     * @param   {string}    value     Field value
     * @param   {string=}   filename  Filename (optional)
     */
    set (name, value, filename) {
      ensureArgs(arguments, 2)
      name = String(name)
      /** @type {[string, string|File][]} */
      const result = []
      const args = normalizeArgs(name, value, filename)
      let replace = true

      // - replace the first occurrence with same name
      // - discards the remaining with same name
      // - while keeping the same order items where added
      each(this._data, data => {
        data[0] === name
          ? replace && (replace = !result.push(args))
          : result.push(data)
      })

      replace && result.push(args)

      this._data = result
    }

    /**
     * Iterate over all fields
     *
     * @return {Iterator}
     */
    * values () {
      for (const [, value] of this) {
        yield value
      }
    }

    /**
     * Return a native (perhaps degraded) FormData with only a `append` method
     * Can throw if it's not supported
     *
     * @return {FormData}
     */
    ['_asNative'] () {
      const fd = new _FormData()

      for (const [name, value] of this) {
        fd.append(name, value)
      }

      return fd
    }

    /**
     * [_blob description]
     *
     * @return {Blob} [description]
     */
    ['_blob'] () {
        const boundary = '----formdata-polyfill-' + Math.random(),
          chunks = [],
          p = `--${boundary}\r\nContent-Disposition: form-data; name="`
        this.forEach((value, name) => typeof value == 'string'
          ? chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`)
          : chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type||"application/octet-stream"}\r\n\r\n`, value, `\r\n`))
        chunks.push(`--${boundary}--`)
        return new Blob(chunks, {
          type: "multipart/form-data; boundary=" + boundary
        })
    }

    /**
     * The class itself is iterable
     * alias for formdata.entries()
     *
     * @return {Iterator}
     */
    [Symbol.iterator] () {
      return this.entries()
    }

    /**
     * Create the default string description.
     *
     * @return  {string} [object FormData]
     */
    toString () {
      return '[object FormData]'
    }
  }

  if (_match && !_match.matches) {
    _match.matches =
      _match.matchesSelector ||
      _match.mozMatchesSelector ||
      _match.msMatchesSelector ||
      _match.oMatchesSelector ||
      _match.webkitMatchesSelector ||
      function (s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s)
        var i = matches.length
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1
      }
  }

  if (stringTag) {
    /**
     * Create the default string description.
     * It is accessed internally by the Object.prototype.toString().
     */
    FormDataPolyfill.prototype[stringTag] = 'FormData'
  }

  // Patch xhr's send method to call _blob transparently
  if (_send) {
    const setRequestHeader = global.XMLHttpRequest.prototype.setRequestHeader

    global.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      setRequestHeader.call(this, name, value)
      if (name.toLowerCase() === 'content-type') this._hasContentType = true
    }

    global.XMLHttpRequest.prototype.send = function (data) {
      // need to patch send b/c old IE don't send blob's type (#44)
      if (data instanceof FormDataPolyfill) {
        const blob = data['_blob']()
        if (!this._hasContentType) this.setRequestHeader('Content-Type', blob.type)
        _send.call(this, blob)
      } else {
        _send.call(this, data)
      }
    }
  }

  // Patch fetch's function to call _blob transparently
  if (_fetch) {
    global.fetch = function (input, init) {
      if (init && init.body && init.body instanceof FormDataPolyfill) {
        init.body = init.body['_blob']()
      }

      return _fetch.call(this, input, init)
    }
  }

  // Patch navigator.sendBeacon to use native FormData
  if (_sendBeacon) {
    global.navigator.sendBeacon = function (url, data) {
      if (data instanceof FormDataPolyfill) {
        data = data['_asNative']()
      }
      return _sendBeacon.call(this, url, data)
    }
  }

  global['FormData'] = FormDataPolyfill
}


//NextSection
/*
Third-party library: fetch, a fetch polyfill written in JS

1. Link for fetch:
https://github.com/JakeChampion/fetch.git

2. License for fetch

Copyright (c) 2014-2023 GitHub, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

3. Step-by-step guide to including fetch
3.1 Get the code using https://github.com/JakeChampion/fetch.git
3.2 Remove all instances of the keyword 'export' from the file fetch.js
3.3 Replace the existing fetch code with the contents of fetch.js

Last update for fetch: 20240215

I got rid of the setTimeout(blah, 0), to do something in 0 seconds.
Now it just does it.
I can't call setTimeout from the master window; there is no frame.

Promise has to run in its frame, not here in the shared window.
I changed Promise to my$win().Promise

I added toString functions to return [object Response] etc.

fetch resolves its Promise object once the file is retrieved, and that's fine
for synchronous, but doesn't work for await asynchronous.
Asyncronous fetch only happens with jsbg+ but let's say you're doing that.
fetch doesn't resolve directly but rather returns the Promise object unresolved.
await knows what to do with that, it suspendes, and then resumes upon resolve,
creating its own then() to pass the result back through await and to the calling function.
As best I can guess, by reverse engineering,
await uses the context of the function that issues the resolve.
If it is here, the context is the master window, and that's wrong.
the promise job won't even run.
It has to be a function in startwindow.
Thus I have fetch$onload over there, and all it does is call resolve on my behalf.
resolve(new Response(body, options))
becomes
        my$win().fetch$onload(resolve, new Response(body, options))
that's it, and yet that seems to play nicely with await
in the asynchronous case, where resolve is called later,
and spins off its own then() job to pass back to await.
Don't feel bad, I don't understand it either, it just works.
If it ever doesn't work, turn jsbg off and you're back to synchronous.
You realize, we wouldn't have any of these headaches, nor the security concerns,
if we just put everything in startwindow and didn't try
to maintain a shared window for efficiency.

Let's review the order of things.
The website, in context 1, calls await fetch(url).
It happens all the time.
First the synchronous case.

fetch creates a new Promise object in context 1.
As mentioned earlier, I call my$win().Promise so it is promise in context 1.
Pass in a support function to the constructor.
Promise runs the function.
Create XMLHttpRequest and open with the url.
Open with asynchronous flag, which is honored if jsbg+
but this is the synchronous case, jsbg-, so on we go.
Call xhr.send, page comes back success,
call parseResponse, dispatch load event,
and run the onload function that is provided by fetch.
onload creates a Response object and uses that to resolve the Promise
that fetch made earlier.
Thus the promise is already resolved by the time we get back to await.
await sees the promise, already resolved, creates a then job internally,
which passes response back to the calling function, which resumes execution
at the point of await.
All is well.

Asynchronous case.
fetch creates a new Promise object in context 1.
Pass in the support function to the constructor.
Promise runs the function.
Create XMLHttpRequest and open with the url.
Open with asynchronous flag, which is honored in this case.
Call xhr.send, which spins off a thread to do the work.
Create an interval in context 1 to monitor this thread.
xhr.send returns, constructor returns, and fetch returns the promise object.
await sees it is not resolved and does something magical to the resolve function
so it immediately calls then() once this promise is resolved.
The then so created is in the wrong context, unless we issue
the resolve in the actual frame, as described above.
We'll get to that in a minute; for now the promise is not resolved.
await suspends execution at this point and returns a promise object in the foreground.
Page comes back from the internet.
Thread closes down and the monitoring interval sees that.
The timer fires in context 1, call parseResponse,
dispatch load event,
and call the onload function that fetch provides.
This resolves the Promise but we can't do it here;
call fetch$onload in window 1.
Now resolved, await creates a then job in context 1.
It runs on the next tick, passes response back through await,
and resumes execution in the calling function.
This will make more sense when you read the fetch code below,
which is, fortunately, clear and well written.
Remind me to use open source whenever possible.
*/

/* eslint-disable no-prototype-builtins */
var g =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  // eslint-disable-next-line no-undef
  (typeof global !== 'undefined' && global) ||
  {}

var support = {
  searchParams: 'URLSearchParams' in g,
  iterable: 'Symbol' in g && 'iterator' in Symbol,
  blob:
    'FileReader' in g &&
    'Blob' in g &&
    (function() {
      try {
        new Blob()
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in g,
  arrayBuffer: 'ArrayBuffer' in g
}

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ]

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name)
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name: "' + name + '"')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value)
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift()
      return {done: value === undefined, value: value}
    }
  }

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    }
  }

  return iterator
}

function Headers(headers) {
  this.map = {}

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value)
    }, this)
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      if (header.length != 2) {
        throw new TypeError('Headers constructor: expected name/value pair to be length 2, found' + header.length)
      }
      this.append(header[0], header[1])
    }, this)
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name])
    }, this)
  }
}

Headers.prototype.append = function(name, value) {
  name = normalizeName(name)
  value = normalizeValue(value)
  var oldValue = this.map[name]
  this.map[name] = oldValue ? oldValue + ', ' + value : value
}

Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)]
}

Headers.prototype.get = function(name) {
  name = normalizeName(name)
  return this.has(name) ? this.map[name] : null
}

Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
}

Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value)
}

Headers.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this)
    }
  }
}

Headers.prototype.keys = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push(name)
  })
  return iteratorFor(items)
}

Headers.prototype.values = function() {
  var items = []
  this.forEach(function(value) {
    items.push(value)
  })
  return iteratorFor(items)
}

Headers.prototype.entries = function() {
  var items = []
  this.forEach(function(value, name) {
    items.push([name, value])
  })
  return iteratorFor(items)
}

if (support.iterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries
}

function consumed(body) {
  if (body._noBody) return
  if (body.bodyUsed) {
    return my$win().Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true
}

function fileReaderReady(reader) {
  return new (my$win().Promise)(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result)
    }
    reader.onerror = function() {
      reject(reader.error)
    }
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  reader.readAsArrayBuffer(blob)
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader()
  var promise = fileReaderReady(reader)
  var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type)
  var encoding = match ? match[1] : 'utf-8'
  reader.readAsText(blob, encoding)
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf)
  var chars = new Array(view.length)

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i])
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength)
    view.set(new Uint8Array(buf))
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false

  this._initBody = function(body) {
    /*
      fetch-mock wraps the Response object in an ES6 Proxy to
      provide useful test harness features such as flush. However, on
      ES5 browsers without fetch or Proxy support pollyfills must be used;
      the proxy-pollyfill is unable to proxy an attribute unless it exists
      on the object before the Proxy is created. This change ensures
      Response.bodyUsed exists on the instance, while maintaining the
      semantic of setting Request.bodyUsed in the constructor before
      _initBody is called.
    */
    // eslint-disable-next-line no-self-assign
    this.bodyUsed = this.bodyUsed
    this._bodyInit = body
    if (!body) {
      this._noBody = true;
      this._bodyText = ''
    } else if (typeof body === 'string') {
      this._bodyText = body
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString()
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer)
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer])
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body)
    } else {
      this._bodyText = body = Object.prototype.toString.call(body)
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8')
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type)
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
      }
    }
  }

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return my$win().Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return my$win().Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return my$win().Promise.resolve(new Blob([this._bodyText]))
      }
    }
  }

  this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var isConsumed = consumed(this)
      if (isConsumed) {
        return isConsumed
      } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
        return my$win().Promise.resolve(
          this._bodyArrayBuffer.buffer.slice(
            this._bodyArrayBuffer.byteOffset,
            this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
          )
        )
      } else {
        return my$win().Promise.resolve(this._bodyArrayBuffer)
      }
    } else if (support.blob) {
      return this.blob().then(readBlobAsArrayBuffer)
    } else {
      throw new Error('could not read as ArrayBuffer')
    }
  }

  this.text = function() {
    var rejected = consumed(this)
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return my$win().Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return my$win().Promise.resolve(this._bodyText)
    }
  }

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    }
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  }

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE']

function normalizeMethod(method) {
  var upcased = method.toUpperCase()
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request(input, options) {
  if (!(this instanceof Request)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }

  options = options || {}
  var body = options.body

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url
    this.credentials = input.credentials
    if (!options.headers) {
      this.headers = new Headers(input.headers)
    }
    this.method = input.method
    this.mode = input.mode
    this.signal = input.signal
    if (!body && input._bodyInit != null) {
      body = input._bodyInit
      input.bodyUsed = true
    }
  } else {
    this.url = String(input)
  }

  this.credentials = options.credentials || this.credentials || 'same-origin'
  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers)
  }
  this.method = normalizeMethod(options.method || this.method || 'GET')
  this.mode = options.mode || this.mode || null
  this.signal = options.signal || this.signal || (function () {
    if ('AbortController' in g) {
      var ctrl = new AbortController();
      return ctrl.signal;
    }
  }());
  this.referrer = null

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body)

  if (this.method === 'GET' || this.method === 'HEAD') {
    if (options.cache === 'no-store' || options.cache === 'no-cache') {
      // Search for a '_' parameter in the query string
      var reParamSearch = /([?&])_=[^&]*/
      if (reParamSearch.test(this.url)) {
        // If it already exists then set the value with the current time
        this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime())
      } else {
        // Otherwise add a new '_' parameter to the end with the current time
        var reQueryString = /\?/
        this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime()
      }
    }
  }
}

Request.prototype.clone = function() {
  return new Request(this, {body: this._bodyInit})
}

function decode(body) {
  var form = new FormData()
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  preProcessedHeaders
    .split('\r')
    .map(function(header) {
      return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header
    })
    .forEach(function(line) {
      var parts = line.split(':')
      var key = parts.shift().trim()
      if (key) {
        var value = parts.join(':').trim()
        try {
          headers.append(key, value)
        } catch (error) {
          console.warn('Response ' + error.message)
        }
      }
    })
  return headers
}

Body.call(Request.prototype)

function Response(bodyInit, options) {
  if (!(this instanceof Response)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }
  if (!options) {
    options = {}
  }

  this.type = 'default'
  this.status = options.status === undefined ? 200 : options.status
  if (this.status < 200 || this.status > 599) {
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")
  }
  this.ok = this.status >= 200 && this.status < 300
  this.statusText = options.statusText === undefined ? '' : '' + options.statusText
  this.headers = new Headers(options.headers)
  this.url = options.url || ''
  this._initBody(bodyInit)
}

Body.call(Response.prototype)

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  })
}

Response.error = function() {
  var response = new Response(null, {status: 200, statusText: ''})
  response.ok = false
  response.status = 0
  response.type = 'error'
  return response
}

var redirectStatuses = [301, 302, 303, 307, 308]

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
}

function fetch(input, init) {
  return new (my$win().Promise)(function(resolve, reject) {
    var request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new (my$win().DOMException)('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest()

    function abortXhr() {
      xhr.abort()
    }

    xhr.onload = function() {
      var options = {
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      }
      // This check if specifically for when a user fetches a file locally from the file system
      // Only if the status is out of a normal range
      if (request.url.indexOf('file://') === 0 && (xhr.status < 200 || xhr.status > 599)) {
        options.status = 200;
      } else {
        options.status = xhr.status;
      }
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL')
      var body = 'response' in xhr ? xhr.response : xhr.responseText
        my$win().fetch$onload(resolve, new Response(body, options))
    }

    xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
    }

    xhr.ontimeout = function() {
        reject(new TypeError('Network request timed out'))
    }

    xhr.onabort = function() {
        reject(new (my$win().DOMException)('Aborted', 'AbortError'))
    }

    function fixUrl(url) {
      try {
        return url === '' && g.location.href ? g.location.href : url
      } catch (e) {
        return url
      }
    }

    xhr.open(request.method, fixUrl(request.url), true)

    if (request.credentials === 'include') {
      xhr.withCredentials = true
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false
    }

    if ('responseType' in xhr) {
      if (support.blob) {
        xhr.responseType = 'blob'
      } else if (
        support.arrayBuffer
      ) {
        xhr.responseType = 'arraybuffer'
      }
    }

    if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers || (g.Headers && init.headers instanceof g.Headers))) {
      var names = [];
      Object.getOwnPropertyNames(init.headers).forEach(function(name) {
        names.push(normalizeName(name))
        xhr.setRequestHeader(name, normalizeValue(init.headers[name]))
      })
      request.headers.forEach(function(value, name) {
        if (names.indexOf(name) === -1) {
          xhr.setRequestHeader(name, value)
        }
      })
    } else {
      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })
    }

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr)

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr)
        }
      }
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
  })
}

fetch.polyfill = true

if (!g.fetch) {
  g.fetch = fetch
  g.Headers = Headers
  g.Request = Request
  g.Response = Response
}

Headers.prototype.toString = function(){return "[object Headers]"}
Request.prototype.toString = function(){return "[object Request]"}
Response.prototype.toString = function(){return "[object Response]"}

// end third party code.

// lock down for security

for(var k in URLSearchParams.prototype)
Object.defineProperty(URLSearchParams.prototype, k,{writable:false,configurable:false});

var flist = [
getElementsByTagName, getElementsByClassName, getElementsByName, getElementById,nodeContains,
dispatchEvent,
NodeFilter,createNodeIterator,createTreeWalker,
runScriptWhenAttached, traceBreakReplace,
appendChild, prependChild, insertBefore, removeChild, replaceChild, hasChildNodes,
getComputedStyle,
URL,
TextEncoder, TextDecoder,
];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(flist[i], "toString",{value:wrapString});

// I told you I wouldn't forget these
Object.defineProperty(Object.prototype, "toString",{enumerable:false,writable:false,configurable:false});
Object.defineProperty(Function.prototype, "toString",{enumerable:false,writable:false,configurable:false});

flist = ["Math", "Date", "Promise", "eval", "Array", "Uint8Array",
"Error", "String", "parseInt", "Event",
"alert","alert3","alert4","dumptree","uptrace","by_esn",
"showscripts", "showframes", "searchscripts", "snapshot", "aloop",
"showarg", "showarglist",
"set_location_hash",
"getElement", "getHead", "setHead", "getBody", "setBody",
"getRootNode","wrapString",
"getElementsByTagName", "getElementsByClassName", "getElementsByName", "getElementById","nodeContains",
"gebi", "gebtn","gebn","gebcn","cont",
"dispatchEvent","addEventListener","removeEventListener","eb$listen","eb$unlisten",
"NodeFilter","createNodeIterator","createTreeWalker",
"logtime","defport","setDefaultPort","camelCase","dataCamel","uncamelCase","isabove",
"classList","classListAdd","classListRemove","classListReplace","classListToggle","classListContains",
"mutFixup", "mrList","mrKids", "rowReindex",
"appendFragment", "insertFragment",
"isRooted", "frames$rebuild",
"runScriptWhenAttached", "traceBreakReplace",
"appendChild", "prependChild", "insertBefore", "removeChild", "replaceChild", "hasChildNodes",
"getSibling", "getElementSibling",
"attr",
"clone1", "findObject", "correspondingObject", "cloneAttr",
"generalbar", "CSS",
"Intl", "Intl_dt", "Intl_num",
"cssGather",
"makeSheets", "getComputedStyle", "computeStyleInline",
"cssShort",
"eb$visible",
"insertAdjacentHTML", "htmlString", "outer$1", "textUnder", "newTextUnder",
"EventTarget", "XMLHttpRequestEventTarget", "XMLHttpRequestUpload", "XMLHttpRequest",
"URL", "File", "FileReader", "Blob", "FormData",
"Headers", "Request", "Response", "fetch",
"TextEncoder", "TextDecoder",
"MessagePortPolyfill", "MessageChannelPolyfill",
"cel_define", "cel_get",
"jtfn0", "jtfn1", "jtfn2", "jtfn3", "deminimize", "addTrace",
"setupClasses",
"sortTime",
"DOMParser",
"xml_open", "xml_srh", "xml_grh", "xml_garh", "xml_send", "xml_parse",
"onmessage$$running", "lastModifiedByHead", "structuredClone",
"UnsupportedError",
];
for(let i=0; i<flist.length; ++i)
Object.defineProperty(this, flist[i], {writable:false,configurable:false});

// some class prototypes
flist = [Date, Promise, Array, Uint8Array, Error, String, URL, URLSearchParams,
Intl_dt, Intl_num,
EventTarget, XMLHttpRequestEventTarget, XMLHttpRequestUpload, XMLHttpRequest,
Blob, FormData, Request, Response, Headers, UnsupportedError];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(flist[i], "prototype", {writable:false,configurable:false});

flist = ["addEventListener", "removeEventListener", "dispatchEvent"];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(EventTarget.prototype, flist[i], {writable:false,configurable:false});
flist = ["toString", "open", "setRequestHeader", "getResponseHeader", "getAllResponseHeaders", "send", "parseResponse", "overrideMimeType"]
for(var i=0; i<flist.length; ++i)
Object.defineProperty(XMLHttpRequest.prototype, flist[i], {writable:false,configurable:false});
Object.defineProperty(URL, "createObjectURL", {writable:false,configurable:false});
Object.defineProperty(URL, "revokeObjectURL", {writable:false,configurable:false});
flist = ["text", "slice", "stream", "arrayBuffer"];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(Blob.prototype, flist[i], {writable:false,configurable:false});
flist = ["append", "delete", "entries", "foreach", "get", "getAll", "has", "keys", "set", "values", "_asNative", "_blob", "toString"];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(FormData.prototype, flist[i], {writable:false,configurable:false});
flist = ["delete", "append", "get", "has", "set", "foreach", "keys", "values", "entries", "toString"];
for(var i=0; i<flist.length; ++i)
Object.defineProperty(Headers.prototype, flist[i], {writable:false,configurable:false});
flist = ["_initBody", "blob", "arrayBuffer", "text", "formData", "json", "clone", "toString"];
for(var i=0; i<flist.length; ++i) {
Object.defineProperty(Request.prototype, flist[i], {writable:false,configurable:false});
Object.defineProperty(Response.prototype, flist[i], {writable:false,configurable:false});
}
Object.defineProperty(Math, "max", {writable:false,configurable:false});
Object.defineProperty(Math, "random", {writable:false,configurable:false});
Object.defineProperty(String, "prototype", {writable:false,configurable:false});
Object.defineProperty(String, "fromCharCode", {writable:false,configurable:false});
