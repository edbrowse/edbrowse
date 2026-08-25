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
this.eb$parent = function() { return this}
this.eb$top = function() { return this}
this.natok = ()=>[];
this.eb$frameElement = function() { return this}
this.eb$getter_cd = ()=>null;
this.eb$getter_cw = ()=>null;
    this.querySelector0 = () => null;
    this.querySelector = () => null;
    this.resolveURL = (base, h) => h;
    this.eb$playAudio = ()=>null;
    this.eb$formSubmit = ()=>null;
    this.eb$formReset = ()=>null;
;(function() { const void_functions = ["addEventListener",
    "removeEventListener",
    "eb$hasFocus", "eb$write", "eb$writeln"];
for(let k of void_functions)
window[k] = eb$voidfunction; })();
this.my$win = function() { return window}
this.my$doc = function() { return document}
}

// the third party deminimization stuff is in mw$, the master window.
// Other stuff too, that can be shared.
// The window should just be there from C, but in case it isn't.
if(!window.mw$) {
// mw$.share = 0 means I made up that window out of thin air
    this.mw$ = {share:0, URL:{}};
this.mw$.alert = this.mw$.alert3 = this.mw$.alert4 = print
    this.mw$.Eb$HTMLCollectionHelper = function() { }
    this.mw$.Eb$NodeListHelper = function() { }
    this.mw$.dispatchEvent = () => undefined;
    this.mw$.addEventListener = () => undefined;
    this.mw$.removeEventListener = () => undefined;
    this.mw$.xml = {};
    this.mw$.getElementsByTagName = () => [];
    this.mw$.getComputedStyle = () => {};
    this.mw$.structuredClone = () => {};
    this.mw$.attr = {};
    this.mw$.setupClasses = () => {};
    this.Window = function(){}
    this.CSSStyleDeclaration = function(){}
}


Object.defineProperty(this, "odp", {value: Object.defineProperty});
/*
    We need some shorthand for this rather large file.
    Think of these as macros; they are deleted at the end so they don't persist.
    As such you can't use them in anything that runs after that point.
*/
// set a window property, unseen, unchanging
this.swp = function(k, v) { odp(window, k, {value:v})}
// visible (enumerable), but still protected
this.swpv = function(k, v) { odp(window, k, {value:v,enumerable:true})}
// unseen, but changeable
this.swpc = function(k, v) { odp(window, k, {value:v, writable:true, configurable:true})}

// establish the prototype for inheritance, then set dom$class
// this is called as each html element is built
// If our made-up class is z$Foo, dom$class becomes Foo
// Letters mean set window member prototype
this.swpp = function(c, inherit) {
    const v = c.replace(/^z\$/, "");
    if(inherit)
        odp(window[c], "prototype", {value:new inherit})
    odp(window[c].prototype, "dom$class", {value:v});
    odp(window[c].prototype, Symbol.toStringTag, {value:v});
}

// set document property, analogs of the set window property functions
this.sdp = function(k, v) { odp(document, k, {value:v})}
// set document property changeable
this.sdpc = function(k, v) { odp(document, k, {value:v, writable:true, configurable:true})}

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


/* Modern version to establish a dom object. Second parameter allows us
to make it readonly, but I don't think we can ever do that.
I ran this through chrome and it came out true.
<body><p id=show>start</p> <script>
    show = document.getElementById("show")
    HTMLHRElement = f = function() {  show.innerHTML = "my own hr";}
    show.innerHTML = (f == HTMLHRElement);
</script>
If we can replace a standard dom class, then I imagine we can replace anything! */
this.swdc = function (c, changeable=true)
{
    const v = c.name.replace(/^z\$/, "");
    odp(c.prototype, "dom$class", {value: v});
    // Makes sure toString returns [object dom$class] in modern es6
    odp(c.prototype, Symbol.toStringTag, {value: v});
    /* if we don't set the property then the class can be referenced from
        within this window but isn't a property of the window
    */
    c.toString = () => `function ${c.name}() { [native code] }`
    odp(window, c.name, {value:c, writable:changeable, configurable:changeable});

/*********************************************************************
In other browsers, native methods return a string with the function name
and a function body [native code].
function appendChild() { [native code] }
Gatekeepers look for that, so we should do the same.
I use a native method to get all keys, even those that are not enumerable.
I check to make sure it's a function, aand HasOwn Property,
so I'm not looking at a function in a prototype that is up the chain.
Next check for getter setter; I don't want to mess with that.
Just touching a getter throws everything off the tracks.
That's not the end of the story however.
I use eb$voidfunction as stub for a lot of instance methods,
especially those that are visual.
It is a function, and directly assigned to this prototype under a method name.
I can't be wrapping eb$voidfunction in different strings, over and over again.
So the last test asks whether the string contains [native code],
that is to say, it's already a native function.
*********************************************************************/
    const p = c.prototype;
    for(let f of natok(p)) {
        const desc = Object.getOwnPropertyDescriptor(p, f);
        if(!desc) continue; // not own property
        if(desc.get || desc.set) continue;
        if(typeof p[f] != "function") continue;
        if(p[f].toString().indexOf("[native code]") > 0) continue;
        p[f].toString = ()=>
        `function ${f}() { [native code] }`;
    }
}

this.swde = function (cls, exp, changeable=true)
{
    odp(exp, "name", {value: cls});
    swdc(exp);
}

// * don't understand all the error codes and subcodes.
// This is just a stub for now, to make acid 25 work.
Error.prototype.NAMESPACE_ERR = 1;

// link functions in the shared window to this window
for(let f of ["UnsupportedError",
"eb$visible", "alert3", "alert4",
"dumptree", "uptrace", "by_esn", "showscripts", "searchscripts",
"showframes", "snapshot", "aloop",
"set_location_hash", "NodeFilter", "tableReindex", "formReindex", "selectReindex",
"markAllCollections", "markUpwardCollections",
"mutFixup", "makeSheets", "gebtn",
"runScriptWhenAttached", "simpleHtmlEscape", "appendFragment",
"appendFragment$nm", "insertFragment", "insertFragment$nm", "checkUpward"])
    swp(f, mw$[f]);
for(let f of ["close"])
    swpv(f, mw$[f]);
for(let f of ["scroll", "scrollTo", "scrollBy", "scrollByLines", "scrollByPages"])
    swpv(f, mw$.eb$voidfunction);
swpv("blur", ()=>(document.activeElement = null))
swpv("focus", ()=>(document.activeElement = document.body))
swpv("self", window)
swp("connectedCallbackStart", () => mw$.connectedCallbackCheck(my$doc()));
this.print = ()=>  alert("javascript is trying to print this document")
this.stop = ()=>  alert("javascript is trying to stop the browse process")
swpc("getComputedStyle", mw$.getComputedStyle.bind(window))
swpc("structuredClone", mw$.structuredClone.bind(window))
swp("dom$class", "Window")
window.top = eb$top();
window.parent = window.eb$parent();
odp(window, "frameElement", {get: eb$frameElement,enumerable:true});

class EventTarget
{
    // in a static initialisation block this is the constructor
    static {
        const tp = this.prototype;
        tp.addEventListener = mw$.addEventListener;
        tp.removeEventListener = mw$.removeEventListener;
        tp.dispatchEvent = mw$.dispatchEvent;
    }
}
swdc(EventTarget);

// Window constructor, passes the url back to edbrowse
// so it can open a new web page.
class Window extends EventTarget
{
    constructor() {
        super();
        let newloc = "";
        let winname = "";
        if(arguments.length > 0) newloc = arguments[0];
        if(arguments.length > 1) winname = arguments[1];
        // I only do something if opening a new web page.
        // If it's just a blank window, I don't know what to do with that.
        if(newloc.length)
            eb$newLocation('p' + eb$ctx + newloc+ '\n' + winname);
        this.opener = window;
    }
}
swdc(Window);

// window.open is the same as new window, just pass the args through
window.open = function(a, b) { return     new Window(a, b); }

/*********************************************************************
window is and must remain the global object.
Plenty of sites set window.foo = something, then refer to foo.
Conversely, plenty of sites set bar = something, then refer to window.bar.
There is no compromise on this matter.
At the same time, window has to be an instance of Window,
has to be an instance of EventTarget.
This line accomplishes that, and so far I haven't seen any side effects.
I hope I never do, because there is no other way.
*********************************************************************/

Object.setPrototypeOf(window, Window.prototype);

class Node extends EventTarget
{
    constructor()
    {
        super();
        // childNodes should be readonly; it is a live node list.
        Object.defineProperty(this, "childNodes", {value: []})
        Object.defineProperty(this, "parentNode", {value: null, writable: true, configurable:true})
    }

    /* Set innerHTML, and then read it back; it's not an exact copy.
    If I don't close <li>, when it comes back out, there is a closing </li> tag.
    The html syntax is cleaned up.
    And whitespace between tag attributes is compressed.
    Also, every attribute value is quoted, with double quotes,
    even if I didn't quote it, or if I used single quotes.
    One way I could approach this, from the edbrowse side, only requires
    a few lines of code. It's sweet, but creats more problems than it solves.
    Mostly because I don't preserve whitespace between tags. */
    get innerHTML() {
        // textarea is special
        if(this.dom$class == "HTMLTextAreaElement") {
            return simpleHtmlEscape(this.inner$HTML);
        }
        /*
        const div = document.createElement('div')
        div.innerHTML = this.inner$HTML;
        let o = div.outerHTML;
        // strip off <div> and </div>
        const l = o.length;
        return o.substr(5, l-11);
        */
        return this.inner$HTML;
    }
    set innerHTML(h)
    {
        if(!h) h = "";
        // textarea.innerHTML is special.
        if(this.dom$class == "HTMLTextAreaElement") {
            this.value = h;
            return;
        }

        this.inner$HTML = h;
        // Put some tags around the html so we can parse it.
        h = `<body>${h}</body>`;
        // Have to make a copy of the old nodes, the ones that are
        // going to be displaced, for the mutation observers. Ugh!
        let c1 = this.childNodes, c2 = [];
        if(!c1) return; // should never happen
        for(let i = 0; i < c1.length; ++i)
            c2[i] = c1[i], c2[i].parentNode = null;

        c1.length = 0;
        // native function to parse the new html
        set_innerHTML(this, h);
        // Change live arrays, like getElementsByTagName,
        // that might now contain these nodes.
        markUpwardCollections(this);

        // Why would I call runScripts on the new nodes? Scripts created
        // by innerHTML do not run. Well, that function also resets ownerDocument,
        // and we might need to do that if one frame inserts,
        // via innerHTML, nodes into another frame.
        // Very rare, but it's possible.
        runScriptWhenAttached(this);

        // c2 is the old nodes, for the observers.
        mutFixup(this, 0, c1, c2);
    }

    static {
        const tp = this.prototype;
        tp.inner$HTML = "";
        tp.getElementsByTagName = mw$.getElementsByTagName;
        tp.getElementsByName = mw$.getElementsByName;
        tp.getElementsByClassName = mw$.getElementsByClassName;
        tp.querySelector = querySelector
// values for nodeType
        tp.ELEMENT_NODE = 1
        tp.TEXT_NODE = 3
        tp.CDATA_SECTION_NODE = 4
        tp.COMMENT_NODE = 8
        tp.DOCUMENT_NODE = 9
        tp.DOCUMENT_TYPE_NODE = 10
        tp.DOCUMENT_FRAGMENT_NODE = 11
// default tabIndex is 0 but running js can override this.
        tp.tabIndex = 0
// These are for the function compareDocumentPosition.
        tp.DOCUMENT_POSITION_DISCONNECTED =1;
        tp.DOCUMENT_POSITION_PRECEDING =2;
        tp.DOCUMENT_POSITION_FOLLOWING =4;
        tp.DOCUMENT_POSITION_CONTAINS =8;
        tp.DOCUMENT_POSITION_CONTAINED_BY =16;
// visual
        tp.clientHeight = 16;
        tp.clientWidth = 120;
        tp.scrollHeight = 16;
        tp.scrollWidth = 120;
        tp.scrollTop = 0;
        tp.scrollLeft = 0;
        tp.offsetHeight = 16;
        tp.offsetWidth = 120;
        tp.dir = "auto";
    }

    focus() { document.activeElement=this; }
    blur() { document.activeElement=null; }
    getBoundingClientRect() {
        return {
        top: 0, bottom: 0, left: 0, right: 0,
        x: 0, y: 0,
        width: 0, height: 0
        }
    }

    querySelectorAll(c,s)
    {
            return new NodeList(this, (n) => querySelectorAll.call(n,c,s));
    }

    // basic append, without C side efffects.
    // This is called from C as we build the tree from html.
    // Thus building the tree is already happening in C;
    // it shouldn't happen twice.
    // Note that it has to call mutFixup, since mutation observers
    // can run even as the html tree is being built.  Ugh!
    appendChild1(c)
    {
        this.childNodes.push(c);
        c.parentNode = this;
        mutFixup(this, 0, c, null);
    }

    appendChild2(c)
    {
        this.childNodes.push(c);
        c.parentNode = this;
        domLinkage('a', this, "", c); // C linkage
    }

    // like appendChild1 but without the mutations.
    // Called from within innerHTML.
    appendChild3(c)
    {
        this.childNodes.push(c);
        c.parentNode = this;
    }

    contains(n)
    {
        if (!n) return false;
        if (n === this) return true;
        for (let p = n; p && !p.is$frame; p = p.parentNode)
            if (p === this) return true;
        return false;
    }

    get dataset()
    {
        if (!this.dataset$2) odp(this, "dataset$2", {value: {}});
            return this.dataset$2;
    }

    hasChildNodes()
    {
        return (this.childNodes && this.childNodes.length);
    }

    /*********************************************************************
    Before adding the element, appendChild makes another check;
    if the child is already linked into the tree, then we have to unlink it first,
    before we put it somewhere else.
    This is a call to removeChild, also native, which unlinks in js,
    and passses the remove side effect back to edbrowse.
    The same reasoning holds for insertBefore.
    These functions also check for a hierarchy cycle using isabove().
    If such would appear, isabove throws an error.
    So let's start with the helper function isabove.
    *********************************************************************/

    static isabove(a, b)
    {
        let j = 0;
        while(b) {
            if(b === a) {
                let e = new Error;
                e.HIERARCHY_REQUEST_ERR = e.code = 3;
                throw e;
            }
            if(++j == 1000) {
                alert3("isabove loop");
                break;
            }
            b = b.parentNode;
        }
    }

    appendChild(c)
    {
        if(!c) return null;
        if(c.nodeType == 11) return appendFragment(this, c);
        Node.isabove(c, this);
        if(c.parentNode) c.parentNode.removeChild(c);
        this.appendChild2(c);
        // a text node won't change the structure of the form, or the html collection
        if(c.nodeType != 3) {
            checkUpward(this);
            runScriptWhenAttached(c);
        }
        // a text node can have an observer - for CharacterData
        mutFixup(this, 0, c, null);
        return c;
    }

    appendChild$nm(c)
    {
        if(!c) return null;
        if(c.nodeType == 11) return appendFragment$nm(this, c);
        Node.isabove(c, this);
        if(c.parentNode) c.parentNode.removeChild$nm(c);
        this.appendChild2(c);
        if(c.nodeType != 3)
            runScriptWhenAttached(c);
        return c;
    }

    // this is an internal function, and it doesn't watch for fragment
    prepend$child(c)
    {
        let v;
        Node.isabove(c, this);
        if(this.childNodes.length) v = this.insertBefore(c, this.childNodes[0]);
        else v = this.appendChild(c);
        return v;
    }

    prepend$child$nm(c)
    {

        let v;
        Node.isabove(c, this);
        if(this.childNodes.length) v = this.insertBefore$nm(c, this.childNodes[0]);
        else v = this.appendChild$nm(c);
        return v;
    }

    insertBefore(c, t)
    {
        if(!c) return null;
        if(!t) return this.appendChild(c);
        Node.isabove(c, this);
        if(c.nodeType == 11) return insertFragment(this, c, t);
        if(c.parentNode) c.parentNode.removeChild(c);
        const cn = this.childNodes;
        const l = cn.length;
        let mark = -1;
        for(let i = 0; i < l; ++i)
            if(t == cn[i]) mark = i;
        if(mark < 0) return null;
        cn.splice(mark, 0, c);
        c.parentNode = this;
        domLinkage('b', this, "", c, t); // update the tree in C
        if (c.nodeType != 3) {
            checkUpward(this);
            runScriptWhenAttached(c);
        }
        mutFixup(this, 0, c, null);
        return c;
    }

    insertBefore$nm(c, t)
    {
        if(!c) return null;
        if(!t) return this.appendChild$nm(c);
        Node.isabove(c, this);
        if (c.nodeType == 11) return insertFragment$nm(this, c, t);
        if (c.parentNode) c.parentNode.removeChild$nm(c);
        const cn = this.childNodes;
        const l = cn.length;
        let mark = -1;
        for(let i = 0; i < l; ++i)
            if (t == cn[i]) mark = i;
        if (mark < 0) return null;
        cn.splice(mark, 0, c);
        c.parentNode = this;
        domLinkage('b', this, "", c, t); // update the tree in C
        if (c.nodeType != 3)
            runScriptWhenAttached(c);
        return c;
    }

    removeChild(c)
    {
        if (!c) return null;
        const cn = this.childNodes;
        const l = cn.length;
        let mark = -1;
        for (let i = 0; i < l; ++i)
            if (c == cn[i]) { mark = i; break; }
        if (mark < 0) return null;
        cn.splice(mark, 1);
        c.parentNode = null;
        domLinkage('r', this, "", c);
        if (c.nodeType != 3) {
            checkUpward(this);
        }
        // passing an integer as third argument is a special case, only from here.
        mutFixup(this, 0, mark, c);
        return c;
    }

    // like the above but with no mutation records
    removeChild$nm(c)
    {
        if(!c) return null;
        const cn = this.childNodes;
        const l = cn.length;
        let mark = -1;
        for (let i = 0; i < l; ++i)
            if (c == cn[i]) { mark = i; break; }
        if (mark < 0) return null;
        cn.splice(mark, 1);
        c.parentNode = null;
        domLinkage('r', this, "", c);
        return c;
    }

    get firstChild()
    {
        return (
            this.childNodes && this.childNodes.length
        ) ? this.childNodes[0] : null;
    }
    get lastChild()
    {
        return (
            this.childNodes && this.childNodes.length
        ) ? this.childNodes[this.childNodes.length-1] : null;
    }

    getClientRects() { return []; }

    static getSibling(obj,direction)
    {
        const pn = obj.parentNode;
        if (!pn) return null;
        let j, l = pn.childNodes.length;
        for (j=0; j<l; ++j)
            if (pn.childNodes[j] == obj) break;
        if (j == l) {
            // child not found under parent, error
            return null;
        }
        switch (direction) {
            case "previous":
                return (j > 0 ? pn.childNodes[j-1] : null);
            case "next":
                return (j < l-1 ? pn.childNodes[j+1] : null);
            default:
                // the function should always have been called with either 'previous' or 'next' specified
            return null;
        }
    }

    get nextSibling() { return Node.getSibling(this,"next"); }
    get previousSibling() { return Node.getSibling(this,"previous"); }

    get parentElement()
    {

        return (
            this.parentNode && this.parentNode.nodeType == 1
        ) ? this.parentNode : null;
    }

    cloneNode(deep) { return mw$.cloneNodeHelper(this,deep, false); }

    compareDocumentPosition(z)
    {
        if(!z || z.nodeType != 1) return 0;
        let y = this;
        if(y === z) return 0;
        let py = [], pz = []; // paths to root
        for(let t = y; t; t = t.parentNode) {
            py.push(t);
            if(t.nodeType != 1) break; // document or fragment
            if(t.is$frame) break;
        }
        for(let t = z; t; t = t.parentNode) {
            pz.push(t);
            if(t.nodeType != 1) break; // document or fragment
            if(t.is$frame) break;
        }
        let root = null, i, j;
        // this is inefficient, but paths aren't likely to be more than 6
        for(i = 0; i < py.length; ++i) {
            for(j = 0; j < pz.length; ++j)
                if(py[i] == pz[j]) { root = py[i]; break; }
                if(root) break;
        }
        if(!root) return this.DOCUMENT_POSITION_DISCONNECTED;
        if(!i) return this.DOCUMENT_POSITION_FOLLOWING | this.DOCUMENT_POSITION_CONTAINED_BY;
        if(!j) return this.DOCUMENT_POSITION_PRECEDING | this.DOCUMENT_POSITION_CONTAINS;
        y = py[i-1], z = pz[j-1];
        for(let t = y.nextSibling; t; t = t.nextSibling)
            if(t == z) return this.DOCUMENT_POSITION_FOLLOWING;
        for(let t = y.previousSibling; t; t = t.previousSibling)
            if(t == z) return this.DOCUMENT_POSITION_PRECEDING;
        // wow we should never be here. Don't know what to return.
        return 0;
    }

getRootNode(o)
{
    let composed = false;
    if(typeof o == "object" && o.composed) composed = true;
    let t = this, t1 = this;
    while(t) {
        t1 = t;
        if(t.nodeName == "#document") return t;
        if(!composed && t.nodeName == "SHADOWROOT") return t;
        t = t.parentNode;
    }
    return t1;
}

}
swdc(Node);

this.eb$push$attributes = false;
this.        standard_events = ["onload", "onunload", "onclick", "onchange", "oninput",
            "onsubmit", "onreset", "onmessage"];
// there are lots more events, onmouseout etc, that we don't responnd to,
// should we watch for them anyways?
this.standard_event_classes = ["Element", "Document"];
this.standard_hashchange_classes = ["HTMLBodyElement", "SVGElement"];


class Element extends Node
{
    constructor() { super(); }

// attributes are on demand
    get attributes() {
        if(!this.attributes$2)
            odp(this, "attributes$2", {value:new NamedNodeMap});
        return this.attributes$2;
    }

/* Some helper functions for the attribute system, which lives in the
Element class. As far as I can tell, anything can be an attribute name,
as long as it doesn't have whitespace. */
    static attrNameValid(n)
    {
        // take care of null, undefined, and ""
        if(!n && n !== 0) {
            alert3("null attribute name");
            return false;
        }
        if(typeof n != "string") n = n.toString();
        for(let i = 0; i < n.length; ++i) {
            let c = n.charCodeAt(i);
            if(c == 61) { // =
                alert3("= in attribute name");
                return false;
            }
            if(c > 32 && c <= 127) continue;
            // yes, nonbreakspace is considered whitespace
            if(c == 9 || c == 10 || c == 12 || c == 13 || c == 32 || c == 160) {
                alert3("spaces in attribute name");
                return false;
            }
        }
        return true;
    }

    static attrNameImplicit(o, name)
    {
        return name === "elements" && o.dom$class == "HTMLFormElement" ||
        name === "rows" && (o.dom$class == "HTMLTableElement" || o.dom$class == "tBody" || o.dom$class == "tHead" || o.dom$class == "tFoot") ||
        name === "tBodies" && o.dom$class == "HTMLTableElement" ||
        (name === "cells" || name === "rowIndex" || name === "sectionRowIndex") && o.dom$class == "HTMLTableRowElement" ||
        name === "className" ||
        name === "htmlFor" && o.dom$class == "HTMLLabelElement" ||
        name === "httpEquiv" && o.dom$class == "HTMLMetaElement" ||
        name === "options" && o.dom$class == "HTMLSelectElement" ||
        name === "selectedOptions" && o.dom$class == "HTMLSelectElement";
    }

/* Here are some helper functions to manage spillup and spilldown.
Spill up means we set the property and it sets the attribute.
This has to be done by setters, it is not done here.
Spilldown means we set the attribute and it spills down to the property.
This has to be done by setAttribute - and sometimes additional processing
is involved. Example: script.setAttribute("src", "file.html")
is resolved against the base url as it spills down to the property.
getAttribute still returns "file.html".
If there is both spillup and spilldown, it is done by a getter and setter,
holding the property foo in foo$2.
You'll see this in the id property below. */

    static spilldown(t, name)
    {
        const dc = t.dom$class;
        return name == "value" && (dc == "HTMLInputElement" || dc == "HTMLTextAreaElement" || dc == "HTMLButtonElement");
    }

    static spilldownResolve(t, name)
    {
        if(!t.nodeName) return false;
        const nn = t.nodeName.toLowerCase();
        return name == "action" && nn == "form" ||
        name == "data" && (nn == "object") ||
        name == "src" && (nn == "img" || nn == "script" || nn == "audio" || nn == "video") ||
        name == "href" && (nn == "link" || nn == "base");
    }

    static spilldownResolveURL(t, name)
    {
        if(!t.nodeName) return false;
        const nn = t.nodeName.toLowerCase();
        return name == "src" && (nn == "frame" || nn == "iframe") ||
        name == "cite" && (nn == "q" || nn == "blockquote") ||
        name == "href" && (nn == "a" || nn == "area");
    }

    static spilldownBool(t, name)
    {
        if(!t.nodeName) return false;
        const nn = t.nodeName.toLowerCase();
        return name == "ariahidden" ||
        name == "selected" && nn == "option" ||
        name == "checked" && nn == "input";
    }

/* Attributes that compile a string as part of spilldown.
Use standard_event_classes, which is also used to create getters and setters
for the on-events. That way we are consistent.
edbrowse might be more general, and more permissive than other browsers.
We set up for HR.onsubmit, for example; other browsers might not. */

// get rid of the window[c] test when you can
    static spilldownCompile(t, name)
    {
        for(const c of standard_event_classes)
            if(window[c] && t instanceof window[c]) {
                for(const evname of standard_events)
                    if(evname == name) return true;
            }
        for(let c of standard_hashchange_classes)
            if(window[c] && t instanceof window[c]) {
                if("onhashchange" == name) return true;
            }
        return false;
    }

// Function to compile event handlers
    static handlerCompile(f)
    {
        let cf; // the compiled function
        try {
            cf = eval(`(function(){${f}})`);
        } catch(e) {
    // Don't just use eb$truefunction; I want to put the text
    // on function.body, for debugging, and that means I need my own function.
            cf = eval("(function(){return true;})");
            alert3(`handler syntax error <${f}>`);
        }
        cf.body = f;
        cf.toString = function() { return this.body; }
        return cf;
    }

// And now, the zoo of attribute methods.

    getAttribute(name)
        {
        let a;
        if(!(this.eb$xml || this instanceof SVGElement))
            name = name.toLowerCase();
        if(!this.attributes$2) return null;
        if(name === "length") {
            a = null;
            for(let i=0; i<this.attributes.length; ++i)
                if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
        } else a = this.attributes[name]
        if(!a) return null;
        let v = a.value;
        let t = typeof v;
        if(t == "undefined" || v == null) return null;
        // I stringify URL objects, should we do that to other objects?
        if(t == 'object' && (v.dom$class == "URL" || v instanceof URL)) return v.toString();
        // number, boolean, object; it goes back as it was put in.
        return v;
    }

    hasAttribute(name) { return this.getAttribute(name) !== null; }

    getAttributeNames(name)
    {
        const a = [];
        if(!this.attributes$2) return a;
        for(let l = 0; l < this.attributes$2.length; ++l)
            a.push(this.attributes$2[l].name);
        return a;
    }

    getAttributeNS(space, name)
    {
        if(space && !name.match(/:/)) name = space + ":" + name;
        return this.getAttribute(name);
    }

    hasAttributeNS(space, name) { return this.getAttributeNS(space, name) !== null;}

    setAttribute(name, v)
    {
        let a;
        if(!Element.attrNameValid(name)) return;
        if(!(this.eb$xml || this instanceof SVGElement)) name = name.toLowerCase();
        // special code for style
        if(name == "style" && this.style && this.style.dom$class == "CSSStyleDeclaration") {
            this.style.cssText = v;
        }
        if(Element.attrNameImplicit(this, name)) return;
        let oldv = null;
        if(name === "length") {
            a = null
            for(let i=0; i<this.attributes.length; ++i)
                if(this.attributes[i].name == name) { a = this.attributes[i]; break; }
        } else a = this.attributes[name]
        if(!a) {
            a = new Attr();
            a.name = name;
            this.attributes.push(a);
            if(name !== "length") this.attributes[name] = a;
        } else {
            oldv = a.value;
        }
        a.value = v;
        a.ownerDocument = this.ownerDocument;
        if(name.substr(0,5) == "data-") {
            this.dataset[dataCamel(name)] = v;
        }
        // side effects of id, name, class
        // no need for collection side effects if parsing - we will be marking
        // all collections as out of date after the parse is finished.
        if(!eb$push$attributes) {
            if(name == "id" || name == "class" || name == "name")
                markUpwardCollections(this)
            if(name == "name" &&
            this.form && this.form.dom$class == "HTMLFormElement")
                formReindex(this.form);
        }
        // names that spill down into the actual property
        if(Element.spilldown(this, name)) this[name] = v;
            // href$2 is not enumerable. cloneNode still works because it finds
            // href in the attributes and copies it there,
            // whence spilldown puts href$2 in node2.
        // resulveURL can handle eb$base undefined
        if(Element.spilldownResolve(this, name))
            Object.defineProperty(this, "href$2", {value:resolveURL(window.eb$base, v),configurable:true,writable:true})
        if(Element.spilldownResolveURL(this, name))
            Object.defineProperty(this, "href$2", {value:new URL(resolveURL(window.eb$base, v)),configurable:true,writable:true})
        if(Element.spilldownBool(this, name)) {
            // This one is required by acid test 43.
            if(name == "checked" && v == "checked")
                this.defaultChecked = true;
            else
                this[name] = true;
        }
        if(Element.spilldownCompile(this, name)) {
            const name2 = name + "$2";
            if (db$flags(1))
                alert3(`${(this[name2] ? "clobber": "create")} ${(this.nodeName ? this.nodeName : this.dom$class)}.${name}`);
            if(typeof v === "string") v = Element.handlerCompile(v);
            if(typeof v === "function") {
                Object.defineProperty(this, name2, {
                    value: v, writable: true, configurable: true});
            } else delete this[name2];
        }
        /* If this is called while parsing html, to build the tree,
        observers are not invoked. The tag is built in its entirety,
    with its attributes, then attached to the tree.
        so we only need see the attachment. On the other hand, if a
        running script calls setAttribute, then we want to observe the change. */
        if(!eb$push$attributes)
            mutFixup(this, 1, name, oldv);
    }

    setAttributeNS(space, name, v)
    {
        if(!Element.attrNameValid(name)) return;
        if(space && !name.match(/:/)) name = space + ":" + name;
        this.setAttribute(name, v);
    }

    removeAttribute(name)
    {
        if(!(this.eb$xml || this instanceof SVGElement))
            name = name.toLowerCase();
        // special code for style
        if(name == "style" && this.style$2 && this.style$2.dom$class == "CSSStyleDeclaration")
            delete this.style$2;
        if(!this.attributes$2) return;
        if(name.substr(0,5) == "data-") {
            let n = dataCamel(name);
            if(this.dataset$2 && this.dataset$2[n])
                delete this.dataset$2[n];
        }
        // the only simple spilldown is value, we shouldn't delete value,
        // so just set it to ""
        if(Element.spilldown(this, name)) this[name] = "";
        if(Element.spilldownResolve(this, name)) delete this[name];
        if(Element.spilldownResolveURL(this, name)) delete this[name];
        let a = null, i, found = false;
        if(name === "length") {
            for(i=0; i<this.attributes.length; ++i)
                if(this.attributes[i].name == name) {
                    a = this.attributes[i];
                    break;
                }
        } else a = this.attributes[name];
        if(!a) return;
        // Have to roll our own splice.
        for(i=0; i<this.attributes.length-1; ++i) {
            if(!found && this.attributes[i] == a) found = true;
            if(found) this.attributes[i] = this.attributes[i+1];
        }
        this.attributes.length = i;
        delete this.attributes[i];
        if(name !== "length") delete this.attributes[name]
        if(name == "id" || name == "name" || name == "class")
            markUpwardCollections(this);
        if(name == "name" &&
        this.form && this.form.dom$class == "HTMLFormElement")
            formReindex(this.form);
        mutFixup(this, 1, name, a.value);
    }

    removeAttributeNS(space, name)
    {
        if(space && !name.match(/:/)) name = space + ":" + name;
        this.removeAttribute(name);
    }

    // return null if no such attribute.
    getAttributeNode(name)
    {
        if(!this.attributes$2) return null;
        if(!(this.eb$xml || this instanceof SVGElement)) name = name.toLowerCase();
        let a = null;
        if(name === "length") {
            for(let i=0; i<this.attributes.length; ++i)
                if(this.attributes[i].name == name) {
                    a = this.attributes[i];
                    break;
                }
        } else a = this.attributes[name];
        return a ? a : null;
    }

    // b replaces a if a is present
    setAttributeNode(b)
    {
        if(typeof b != "object" || typeof b.name != "string")
            return null;
        let     a = null, name = b.name;
        if(name === "length") {
            for(let i=0; i<this.attributes.length; ++i)
                if(this.attributes[i].name == name) {
                    a = this.attributes[i];
                    break;
                }
        } else a = this.attributes[name];
        if(!a) a = null;
        else this.removeAttribute(name);
        this.attributes.push(b);
        if(name !== "length") this.attributes[name] = b;
        // there are a lot of side effects I don't want to repeat here,
        // like dataset and mutFixup and so on, so just invoke:
        this.setAttribute(name, b.value)
        return a
    }

    removeAttributeNode(b)
    {
        if(typeof b != "object" || typeof b.name != "string")
            return null;
        let     name = b.name;
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
    }

// the all important id property
// as mentioned earlier, this has both spillup and spilldown,
// so is handled by getter and setter, using id$2
    get id()
    {
        let t = this.getAttribute("id");
        if(t === null) t = "" // id was never defined
        if(t === undefined) t = "";
        // if defined it should always be a string
        return typeof t == "string" ? t : t.toString();
    }
    set id(v) { this.setAttribute("id", v)}

    get lang()
    {
        let t = this.getAttribute("lang");
        if(t === null) t = "" // lang was never defined
        if(t === undefined) t = "";
        // if defined it should always be a string
        return typeof t == "string" ? t : t.toString();
    }
    set lang(v) { this.setAttribute("lang", v)}

// carry the xml indicator from the document down to all the elements inside it.
    get eb$xml() { return this.ownerDocument.eb$xml}

    insertAdjacentElement(pos, e)
    {
        let n, p = this.parentNode;
        if(!p || typeof pos != "string") return null;
        switch(pos.toLowerCase()) {
        case "beforebegin": return p.insertBefore(e, this);
        case "afterend":
            n = this.nextSibling;
            return n ? p.insertBefore(e, n) : p.appendChild(e);
        case "beforeend": return this.appendChild(e);
        case "afterbegin": return this.prepend$child(e);
        }
        return null;
    }

    insertAdjacentText(pos, e)
{
        let n, p = this.parentNode;
        if(!p || typeof pos != "string") return null;
        if(typeof e != "string") return null;
        e = document.createTextNode(e);
        return this.insertAdjacentElement(pos, e);
    }

    insertAdjacentHTML(pos, h) {
        // easiest implementation is just to use the power of innerHTML
        let p = document.createElement("p");
        p.innerHTML = h; // the magic
        let s, parent = this.parentNode;
        switch(pos) {
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

    get children()
    {
        let i = 0, node, nodes = this.childNodes, children = [];
        if(!nodes) return children;
        while(i<nodes.length) {
            node = nodes[i++];
            if (node.nodeType === 1)  children.push(node);
        }
        return children;
    }

    get childElementCount()
    {
        let z=0, u = this.childNodes;
        if(!u) return z;
        for(let i=0; i<u.length; ++i)
            if(u[i].nodeType == 1) ++z;
        return z;
    }

    get firstElementChild()
    {
        let u = this.childNodes;
        if(!u) return null;
        for(let i=0; i<u.length; ++i)
            if(u[i].nodeType == 1) return u[i];
        return null;
    }

    get lastElementChild()
    {
        let u = this.childNodes;
        if(!u) return null;
        for(let i=u.length-1; i>=0; --i)
            if(u[i].nodeType == 1) return u[i];
        return null;
    }

    static getElementSibling (obj,direction) {
        const pn = obj.parentNode;
        if(!pn) return null;
        let j, l = pn.childNodes.length;
        for (j=0; j<l; ++j)
            if (pn.childNodes[j] == obj) break;
        if (j == l) {
            // child not found under parent, error
            return null;
        }
        switch(direction) {
        case "previous":
            for(--j; j>=0; --j)
                if(pn.childNodes[j].nodeType == 1)
                    return pn.childNodes[j];
            return null;
        case "next":
            for(++j; j<l; ++j)
                if(pn.childNodes[j].nodeType == 1)
                    return pn.childNodes[j];
            return null;
        default:
            return null;
        }
    }

    get nextElementSibling()
    {
        return Element.getElementSibling(this,"next");
    }

    get previousElementSibling()
    {
        return Element.getElementSibling(this,"previous");
    }

    append()
    {
        const additions = [];
        for(let c of arguments) {
            if(typeof c == "string") c = document.createTextNode(c);
            if(c.nodeType == 11) { // descend into fragment
                // make one mutation record to delete all the nodes under fragment
                // but fragment isn't rooted and it shouldn't matter.
                const deletions = [];
                for(let f of Array.from(c.childNodes)) {
                    if(f.nodeType == 11) { alert3("append fragment recursion"); continue; }
                    c.removeChild$nm(f);
                    this.appendChild$nm(f);
                    additions.push(f);
                    deletions.push(f);
                }
                checkUpward(c);
                mutFixup(c, 0, 0, deletions);
                continue;
            }
        c.remove();
            this.appendChild$nm(c);
            additions.push(c);
        }
        checkUpward(this);
        mutFixup(this, 0, additions, null);
    }

    prepend()
    {
        const additions = [];
        const first = this.firstChild;
        for(let c of arguments) {
            if(typeof c == "string") c = document.createTextNode(c);
            if(c.nodeType == 11) { // descend into fragment
                const deletions = [];
                for(let f of Array.from(c.childNodes)) {
                    if(f.nodeType == 11) { alert3("prepend fragment recursion"); continue; }
                    c.removeChild$nm(f);
                    this.insertBefore$nm(f, first);
                    additions.push(f);
                    deletions.push(f);
                }
                checkUpward(c);
                mutFixup(c, 0, 0, deletions);
                continue;
            }
        c.remove();
            this.insertBefore$nm(c, first);
            additions.push(c);
        }
        checkUpward(this);
        mutFixup(this, 0, additions, null);
    }

    before()
    {
        const p = this.parentNode;
        if(!p) return;
        const additions = [];
        for(let c of arguments) {
            if(typeof c == "string") c = document.createTextNode(c);
            if(c.nodeType == 11) { // descend into fragment
                const deletions = [];
                for(let f of Array.from(c.childNodes)) {
                    if(f.nodeType == 11) { alert3("before fragment recursion"); continue; }
                    c.removeChild$nm(f);
                    p.insertBefore$nm(f, this);
                    additions.push(f);
                    deletions.push(f);
                }
                checkUpward(c);
                mutFixup(c, 0, 0, deletions);
                continue;
            }
        c.remove();
            p.insertBefore$nm(c, this);
            additions.push(c);
        }
        checkUpward(this);
        mutFixup(p, 0, additions, null);
    }

    after()
    {
        const p = this.parentNode;
        if(!p) return;
        const n = this.nextSibling;
        const additions = [];
        for(let c of arguments) {
            if(typeof c == "string") c = document.createTextNode(c);
            if(c.nodeType == 11) { // descend into fragment
                const deletions = [];
                for(let f of Array.from(c.childNodes)) {
                    if(f.nodeType == 11) { alert3("after fragment recursion"); continue; }
                    c.removeChild$nm(f);
                    p.insertBefore$nm(f, n);
                    additions.push(f);
                    deletions.push(f);
                }
                checkUpward(c);
                mutFixup(c, 0, 0, deletions);
                continue;
            }
        c.remove();
            p.insertBefore$nm(c, n);
            additions.push(c);
        }
        checkUpward(this);
        mutFixup(p, 0, additions, null);
    }

    replaceWith()
    {
        const p = this.parentNode;
        if(!p) return;
        const n = this.nextSibling;
        const additions = [];
        for(let c of arguments) {
            if(typeof c == "string") c = document.createTextNode(c);
            if(c.nodeType == 11) { // descend into fragment
                const deletions = [];
                for(let f of Array.from(c.childNodes)) {
                    if(f.nodeType == 11) { alert3("replaceWith fragment recursion"); continue; }
                    c.removeChild$nm(f);
                    p.insertBefore$nm(f, n);
                    additions.push(f);
                    deletions.push(f);
                }
                checkUpward(c);
                mutFixup(c, 0, 0, deletions);
                continue;
            }
        c.remove();
            p.insertBefore$nm(c, n);
            additions.push(c);
        }
        p.removeChild$nm(this);
        checkUpward(p);
        mutFixup(p, 0, additions, this);
    }

// replaceChildren not yet implemented

    replaceChild(newc, oldc)
    {
        let lastentry, nextinline;
        const l = this.childNodes.length;
        for(let i=0; i<l; ++i) {
            if(this.childNodes[i] != oldc) continue;
            if(i == l-1) lastentry = true;
            else {
                lastentry = false;
                nextinline = this.childNodes[i+1];
            }
            this.removeChild(oldc);
            if(lastentry) this.appendChild(newc);
            else this.insertBefore(newc, nextinline);
            break;
        }
    }

    remove()
    {
        if(this.parentNode)
            this.parentNode.removeChild(this);
    }

/* I want a native method to go on the prototype, becoming an instance method,
but a direct assignment puts it on "this", as part of the constructor,
even though it's not in constructor.  Highly confusing!
    matches = querySelector0;
So I have to do something different.
I could wrap it in a function but that offends me.
Here is the way. */
    static { this.prototype.matches = querySelector0; }

    closest(s)
    {
        let u = this;
        while(u.nodeType == 1) {
            if(u.matches(s)) return u;
            u = u.parentNode;
        }
        return null;
    }

    get className()
    {
        let c = this.getAttribute("class");
        return c === null ? "" : c;
    }
    set className(h) { this.setAttribute("class", h); }

// helper functions that support Element.classList
    static { this.prototype.cl$present = true; }

    static classListRemove()
    {
        for(let i=0; i<arguments.length; ++i) {
            for(let j=0; j<this.length; ++j) {
                if(arguments[i] != this[j]) continue;
                this.splice(j, 1);
                --j;
            }
        }
        this.node.setAttribute("class", this.join(' '));
    }

    static classListAdd()
    {
        for(let i=0; i<arguments.length; ++i) {
            let j;
            for(j=0; j<this.length; ++j)
                if(arguments[i] == this[j]) break;
            if(j == this.length) this.push(arguments[i]);
        }
        this.node.setAttribute("class", this.join(' '));
    }

    static classListReplace(o, n)
    {
        if(!o) return;
        if(!n) { this.remove(o); return; }
        for(let j=0; j<this.length; ++j)
            if(o == this[j]) { this[j] = n; break; }
        this.node.setAttribute("class", this.join(' '));
    }

    static classListContains(t)
    {
        if(!t) return false;
        for(let j=0; j<this.length; ++j)
            if(t == this[j]) return true;
        return false;
    }

    static classListToggle(t, force)
    {
        if(!t) return false;
        if(arguments.length > 1) {
            if(force) this.add(t); else this.remove(t);
            return force;
        }
        if(this.contains(t)) { this.remove(t); return false; }
        this.add(t); return true;
    }

    static classMake(node)
    {
        let c = node.getAttribute("class");
        if(!c) c = "";
        // turn string into array
        let a = c.trim().split(/\s+/);
        // remember the node you came from
        a.node = node;
        // attach helper functions
        a.remove = Element.classListRemove;
        a.add = Element.classListAdd;
        a.replace = Element.classListReplace;
        a.contains = Element.classListContains;
        a.toggle = Element.classListToggle;
        return a;
    }

    get classList() { return Element.classMake(this); }

// this is recursive
    static htmlString(t)
    {
        if(t.nodeType == 3) return t.data;
        if(t.nodeType == 4) return "<![Cdata[" + t.text + "]]>";
        if(t.nodeType == 8) return "<!--" + t.data + "-->";
        if(t.nodeType != 1) return "";
        let s = "<" + (t.nodeName ? t.nodeName.toLowerCase() : "x");
        if(t.attributes$2) {
            for(let l = 0; l < t.attributes$2.length; ++l) {
                const a = t.attributes$2[l];
                // we need to html escape certain characters, which I do a few of.
                s += ` ${a.name}="${simpleHtmlEscape(a.value.toString())}"`
            }
        }
        s += '>';
        if(t.childNodes)
            for(let i=0; i<t.childNodes.length; ++i)
                s += Element.htmlString(t.childNodes[i]);
        s += "</";
        s += (t.nodeName ? t.nodeName.toLowerCase() : "x");
        s += '>';
        return s;
    }

    get outerHTML() { return Element.htmlString(this); }

// Chrome does this with one mutation record.
    set outerHTML(h)
    {
        const p = this.parentNode;
        if(!p) return;
        // fragment doesn't allow innerHTML so we have to put it somewhere else
        let div = document.createElement("div"); // place to expand the html
        div.innerHTML = h;
        let frag = document.createDocumentFragment();
        while(div.firstChild) frag.appendChild$nm(div.firstChild);
        this.replaceWith(frag);
    }

    get shadowRoot()
    {
        let r = this.firstChild;
        if(r && r.nodeName == "SHADOWROOT" && r.mode == "open") return r;
        return null;
    }

    attachShadow(o)
    {
        // I should have a list of allowed tags here, but custom tags are allowed,
        // and I don't know how to determine that,
        // so I'll just reject a few tags.
        let nn = this.nodeName;
        if(nn == "A" || nn == "FRAME" || nn == "IFRAME" ||
        nn == "#document" || nn == "#text" || nn == "#comment" ||
        nn == "TABLE" || nn == "TH" || nn == "TD" || nn == "TR" || nn == "FORM" || nn == "INPUT" ||
        nn == "SHADOWROOT") // no shadow root within a shadow root
            return null;
        let r = document.createElement("ShadowRoot");
        this.appendChild(r);
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

// Visual. Doesn't mean anything to us, but should probably exist.
    static {
        const tp = this.prototype;
        tp.clientTop = 0;
        tp.clientHeight = 16;
        tp.clientWidth = 120;
        tp.scrollHeight = 16;
        tp.scrollWidth = 120;
        tp.scrollTop = 0;
        tp.scrollLeft = 0;
        tp.dir = "auto";
        tp.scroll = eb$voidfunction;
        tp.scrollBy = eb$voidfunction;
        tp.scrollByLines = eb$voidfunction;
        tp.scrollByPages = eb$voidfunction;
        tp.scrollTo = eb$voidfunction;
        tp.scrollIntoView = eb$voidfunction;
    }

// This is a manufactured method for css purposes,
// to inject words or marks before or after a tag, marks that you don't see
// unless you type showall, marks that nobody probably cares about anyways,
// but I read about it in the spec and tried to make it happen.
    injectSetup(which)
    {
        let z = this;
        switch(which) {
        case 'a':
            if(!this.inj$after) {
                z = this.appendChild(document.createTextNode())
                odp(z, "inj$css", {value:true})
                odp(this, "inj$after", {value:true})
            } else z = this.lastChild;
            break;
        case 'b':
            if(!this.inj$before) {
                z = this.prepend$child(document.createTextNode())
                odp(z, "inj$css", {value:true})
                odp(this, "inj$before", {value:true})
            } else z = this.firstChild;
            break;
        }
        // establish the style object for the calling function in css.c
        window.soj$ = z.style;
    }

}
swdc(Element);

/* Element bifurcates into HTMLElement and SVGElement.
The former is far more important to us, as it becomes the classes
driving the websites we hope to render.
The latter is visual imagery, drawing pictures on the screen.
But the SVG classes should exist.
Javascript may reference them, and blow up if they're not there.
Some of them have instance methods and properties, and maybe we need those too,
but I hope not. I'm going to start with the classes themselves,
and hope that is sufficient.
If we need a few instance methods we can sprinkle them in;
if we need a lot then we have to write out the classes long-hand.
For now they are merely classes, and this is table driven.
At some point we should check with the specs and create the whole SVG tree;
it is merely a matter of enhancing this table. */

for (const e of [
    ["SVGElement", "Element"],
    ["SVGGraphicsElement", "SVGElement"],
    ["SVGTitleElement", "SVGElement"],
    ["SVGStyleElement", "SVGElement"],
    ["SVGStopElement", "SVGElement"],
    ["SVGMaskElement", "SVGElement"],
    ["SVGGradientElement", "SVGElement"],
    ["SVGLinearGradientElement", "SVGGradientElement"],
    ["SVGGeometryElement", "SVGGraphicsElement"],
    ["SVGDefsElement", "SVGGraphicsElement"],
    ["SVGUseElement", "SVGGraphicsElement"],
    ["SVGPolygonElement", "SVGGeometryElement"],
    ["SVGRectElement", "SVGGeometryElement"],
    ["SVGEllipseElement", "SVGGeometryElement"],
    ["SVGGElement", "SVGGraphicsElement"],
    ["SVGSVGElement", "SVGGraphicsElement"],
    ["SVGPathElement", "SVGGeometryElement"],
])
    swde(e[0], class extends window[e[1]] { constructor() { super(); } });

// these have node type 1, just like HTMLElement.
SVGElement.prototype.nodeType = 1;

// The html element, which spans the DOM nodes that you know and love.
class HTMLElement extends Element
{
    constructor() { super(); }

    static {
        const tp = this.prototype;
        tp.nodeType = 1;
        tp.ariaHidden = false;
    }

    get nodeValue()
    {
        return this.nodeType == 3 ? this.data :
        this.nodeType == 4 ? this.text : null;
    }

    set nodeValue(h)
    {
        if(this.nodeType == 3) this.data = h;
        if (this.nodeType == 4) this.text = h ;
    }

// style object is on demand
    get style()
    {
        if (!this.style$2) {
            this.style$2 = new CSSStyleDeclaration;
            this.style$2.element = this;
        }
        return this.style$2;
    }

    get hidden() { return this.hasAttribute("hidden"); }
    set hidden(v) { if(v === false) this.removeAttribute("hidden"); else this.setAttribute("hidden", ""); }

// name property spills up and down for input, acid test 53
    static nameSpill(n)
    {
        const dc = n.dom$class;
        return  dc == "HTMLInputElement" ||
        dc == "HTMLButtonElement" ||
        dc == "HTMLSelectElement" ||
        dc == "HTMLFormElement" ||
        dc == "HTMLImageElement" ||
        dc == "HTMLIFrameElement" ||
        dc == "HTMLFrameElement" ||
        dc == "HTMLTextAreaElement" ||
        dc == "HTMLAnchorElement";
    }

    get name()
    {
        if(!HTMLElement.nameSpill(this)) return this.name$2 ;
        let t = this.getAttribute("name");
        if(t === null) t = "" // name was never defined
        if(t === undefined) t = "";
        // if defined it should always be a string
        return typeof t == "string" ? t : t.toString();
    }

    set name(n)
    {
        if(!HTMLElement.nameSpill(this)) {
            odp(this, "name$2", {value:n,writable:true,configurable:true});
            return;
        }
        this.setAttribute("name", n);
    }

    get title() {
        const t = this.getAttribute("title");
        // acid test 3 has numbers for titles
        const y = typeof t;
        return y == "string" || y == "number" ? t : undefined;
    }
    set title(v) { this.setAttribute("title", v);}

    get role() { return this.getAttribute("role"); }
    set role(v) { this.setAttribute("role", v); }

    click()
    {
        if (!this.disabled) this.dispatchEvent(new MouseEvent("click"));
    }

// helper functions for textContent
// First function is recursive and gathers text and data sections.
    static gatherText(t)
    {
        let a = [];
        if(t.nodeType == 3 || t.nodeType == 4) // text or cdata
            a.push(t);
        for(let c of t.childNodes)
            a = a.concat(HTMLElement.gatherText(c));
        return a;
    }

    static textUnder(top)
    {
        const nn = top.nodeName;
        if(nn == "#text") return top.data;
        if(nn == "SCRIPT" || nn == "#cdata-section") return top.text;
        let answer = "", part;
        const t = HTMLElement.gatherText(top);
        for(let u of t) {
            part = u.nodeValue;
            if(part) answer += part;
        }
        return answer;
    }

    static newTextUnder(top, s)
    {
        if(top.nodeName == "#text") {
            top.data = s;
            // don't mutFixup here; the text setter does it
            return;
        }
        const oldlist = Array.from(top.childNodes); // make a copy
        while(top.firstChild)
            top.removeChild$nm(top.firstChild);
        // do nothing if s is undefined, or null, or the empty string
        if(s) {
            let newtext = document.createTextNode(s);
            top.appendChild$nm(newtext);
            mutFixup(top, 0, oldlist, [newtext]);
        } else {
            mutFixup(top, 0, oldlist, null);
        }
        checkUpward(top);
    }

get textContent() { return HTMLElement.textUnder(this); }
set textContent(h) { return HTMLElement.newTextUnder(this, h); }
get innerText() { return HTMLElement.textUnder(this); }
set innerText(h) { return HTMLElement.newTextUnder(this, h); }

// visual
    static {
        const tp = this.prototype;
        tp.offsetHeight = 1.0;
        tp.offsetWidth = 1.0;
        tp.offsetTop = 0.0;
        tp.offsetLeft = 0.0;
    }

}
swdc(HTMLElement);

// Even before <html>, we might have a DocType directive.
class DocType extends HTMLElement
{
    constructor() { super(); }
    static {
        const tp = this.prototype;
        tp.nodeType = 10;
        tp.nodeName = "DOCTYPE";
    }
}
swdc(DocType);

// <html>
class HTMLHtmlElement extends HTMLElement
{
    constructor() { super(); }
    // this getter is needed by the function isRooted()
    get eb$win() { return this.parentNode ? this.parentNode.defaultView : undefined; }
    static {
        const tp = this.prototype;
        tp.doScroll = eb$voidfunction;
        tp.clientHeight = 768;
        tp.clientWidth = 1024;
        tp.offsetHeight = 768;
        tp.offsetWidth = 1024;
        tp.scrollHeight = 768;
        tp.scrollWidth = 1024;
        tp.scrollTop = 0;
        tp.scrollLeft = 0;
    }
}
swdc(HTMLHtmlElement);

// <head>
class HTMLHeadElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLHeadElement);

// <body>
class HTMLBodyElement extends HTMLElement
{
    constructor() { super(); }
    static {
        const tp = this.prototype;
        // I don't know which classes should have these visual defaults.
        // They're sort of all over the place.
        tp.doScroll = eb$voidfunction;
        tp.clientHeight = 768;
        tp.clientWidth = 1024;
        tp.offsetHeight = 768;
        tp.offsetWidth = 1024;
        tp.scrollHeight = 768;
        tp.scrollWidth = 1024;
        tp.scrollTop = 0;
        tp.scrollLeft = 0;
    }

    // secret way of setting body.innerHTML
    // used by document.write() when it clobbers the entire document
    eb$dbih(s) { this.innerHTML = s; }
}
swdc(HTMLBodyElement);

// <meta>
class HTMLMetaElement extends HTMLElement
{
    constructor() { super(); }
    get httpEquiv() { return this.getAttribute("http-equiv"); }
    set httpEquiv(h) { this.setAttribute("http-equiv", h); }
    get content() { return this.getAttribute("content"); }
    set content(h) { this.setAttribute("content", h); }
}
swdc(HTMLMetaElement);

// <link>
class HTMLLinkElement extends HTMLElement
{
    constructor() { super(); }
    get relList()
    {
        // It's a list but why would it ever be more than one?
        const a = [];
        if(this.rel) a.push(this.rel);
        // edbrowse only supports stylesheet
        a.supports = (s) => s === "stylesheet";
        return a;
    }
}
swdc(HTMLLinkElement);

// <title>
class HTMLTitleElement extends HTMLElement
{
    constructor() { super(); }
    get text() { return this.firstChild && this.firstChild.nodeName == "#text" && this.firstChild.data || "";}
    // setter should change the title of the document, not yet implemented
}
swdc(HTMLTitleElement);

// <base>
class HTMLBaseElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLBaseElement);

// I have no idea which of these properties and methods belong
// in Document, and which in HTMLDocument.
class Document extends Node
{
    constructor()
    {
        super();
        // the id$hash is suppose to make getElementById more efficient.
        // I don't know if it's worth the complexity it introduces.
        odp(this, "id$hash", {value: new Map});
        odp(this, "id$registry", {
            value: new FinalizationRegistry(
                (i) => {
                    alert3(`GC triggers delete of element with id ${i} from id hash`);
                    this.id$hash.delete(i);
                }
            )
        });
        this.readyState$2 = "interactive";
    }

    toString() { return "[object Document]" };

    static {
        const tp = this.prototype;
        tp.nodeName = "#document"
        tp.tagName = "document"
        tp.nodeType = 9
        tp.activeElement = null;
        tp.defaultView = window;
        tp.visibilityState = "visible"
        tp.getElementById = mw$.getElementById
    }

    get documentElement()
    {
        let e = this.lastChild;
        if(!e) { alert3("missing documentElement node"); return null; }
        if(e.nodeName.toUpperCase() != "HTML")
            alert3("html expected, got " + e.nodeName);
        return e
    }

// We need a helper function to get and set document.head and document.body.
// But why would anyone ever want to set those?
// Somebody did somewhere, or I wouldn't have written the function.
// Probably an xml document.
    static getHeadBody(t, which)
        {
        let e = t.documentElement;
        if(!e) return null;
        for(let i=0; i<e.childNodes.length; ++i)
            if(e.childNodes[i].nodeName.toUpperCase() == which)
                return e.childNodes[i];
        alert3(`missing ${which} node`);
        return null;
    }

    static setHeadBody(t, which, h)
    {
        let i, e = t.documentElement;
        if(!e) return;
        for(i=0; i<e.childNodes.length; ++i)
            if(e.childNodes[i].nodeName.toUpperCase() == which) break;
        if(i < e.childNodes.length) e.removeChild(e.childNodes[i]);
        else i=0;
        if(h) {
            if(h.nodeName.toUpperCase() != which) {
                alert3(`${which} expected, but you passed in node ${h.nodeName}`);
                h.nodeName = which;
            }
            if(i == e.childNodes.length) e.appendChild(h);
            else e.insertBefore(h, e.childNodes[i]);
        }
    }

    get head() { return Document.getHeadBody(this, "HEAD") ; }
    set head(h) { Document.setHeadBody(this, "HEAD", h) ; }
    get body() { return Document.getHeadBody(this, "BODY") ; }
    set body(h) { Document.setHeadBody(this, "BODY", h) ; }
    // scrollingElement makes no sense in edbrowse, I think body is our best bet
    get scrollingElement() { return this.body; }
    get URL() { return this.location ? this.location.toString() : null }
    get documentURI() { return this.URL}
    // cookie getter setter are native; have to call them with this
    get cookie() { return eb$getcook.call(this); }
    set cookie(h) { eb$setcook.call(this, h); }

    // make sure readyState is readonly
    get readyState() { return this.readyState$2 ? this.readyState$2 : null}

/* The various create functions aren't just on document, they are instance
methods of the Document class. Hence they belong here.
createElement has a line that turns P into HTMLParagraphElement,
although we haven't seen HTMLParagraphElement, or any of those classes yet.
That's ok - by the time this function is actually invoked,
all those classes will exist. */

    createEvent(unused) { return new Event; }

    createTextNode(t)
    {
        if(t == undefined) t = "";
        const c = new Text(t);
        domLinkage('c', c, "text");
        return c;
    }

    createComment(t)
    {
        if(t == undefined) t = "";
        const c = new Comment(t);
        domLinkage('c', c, "comment");
        return c;
    }

    createDocumentFragment()
    {
        const c = this.createElement("fragment");
        return c;
    }

    createCDATASection(t)
    {
        if(t == undefined) t = "";
        const c = new CDATASection(t);
        domLinkage('c', c, "cdata");
        return c;
    }

    createElement(s)
    {
        let c;
        if(!s) { // a null or missing argument
            alert3("bad createElement( type" + typeof s + ')');
            return null;
        }
        let t = s.toLowerCase();

// check for custom elements first
        let x = customElements.get(s);
        if(x) { // here we go
            c = new x;
            if(c.eb$appendChild0 !== Node.prototype.eb$appendChild0) {
                alert3(`${s} is not an extension of Node, and may not work properly`);
                // add the methods we need to make this behave like a node
                // these are functions, not getters, like firstChild
                for(let f of ["appendChild1", "appendChild2", "appendChild3",
                "appendChild", "removeChild", "insertBefore", "prepend$child"])
                    c[f] = Node.prototype[f];
                for(let f of ["getAttribute", "hasAttribute", "setAttribute",
                "removeAttribute"])
                    c[f] = Element.prototype[f];
                // It's not a Node, so we don't have childNodes yet.
                odp(this, "childNodes", {value: []})
                odp(this, "parentNode", {value: null, writable: true, configurable:true})
            }
            odp(c, "nodeName", {value:s,writable:true,configurable:true});
            odp(c, "tagName", {value:s,writable:true,configurable:true});
            odp(c, "connectedCallback$pending", {value:!!c.connectedCallback, writable:true})
            domLinkage('c', c, t);
            return c;
        } // end of custom element

        if(!t.match(/^[a-z:\d_-]+$/) || t.match(/^[\d_-]/)) {
            alert3("bad createElement(" + t + ')');
            // acid3 says we should throw an exception here.
            // But we get these kinds of strings from www.oranges.com all the time.
            // I'll just return null and tweak acid3 accordingly.
            // throw error code 5
            return null;
        }

        switch(t) {
        case "shadowroot": c = new ShadowRoot; break;
        case "head": c = new HTMLHeadElement; break;
        case "body": c = new HTMLBodyElement; break;
        case "object": c = new HTMLObjectElement; break;
        case "a": c = new HTMLAnchorElement; break;
        case "area": c = new HTMLAreaElement; break;
        case "image": t = "img";
        case "img": c = new HTMLImageElement; break;
        case "link": c = new HTMLLinkElement; break;
        case "meta": c = new HTMLMetaElement; break;
        case "base": c = new HTMLBaseElement; break;
        case "cssstyledeclaration":
            c = new CSSStyleDeclaration; c.element = null; break;
        case "script": c = new HTMLScriptElement; break;
        case "template": c = new HTMLTemplateElement; break;
        case "document": c = new Document; break;
        case "root": c = new HTMLHtmlElement; s = "html"; break;
        case "div": c = new HTMLDivElement; break;
        case "span": c = new HTMLSpanElement; break;
        case "label": c = new HTMLLabelElement; break;
        case "hr": c = new HTMLHRElement; break;
        case "blockquote": case "q": c = new HTMLQuoteElement; break;
        case "title":
            // in isolation, I have no idea if this is an html title or an svg title.
            // we just have to guess.
            c = new HTMLTitleElement; break;
        case "style":
            // in isolation, I have no idea if this is an html title or an svg title.
            // we just have to guess.
            c = new HTMLStyleElement; break;
        case "p": c = new HTMLParagraphElement; break;
        case "ol": c = new HTMLOListElement; break;
        case "ul": c = new HTMLUListElement; break;
        case "dl": c = new HTMLDListElement; break;
        case "li": c = new HTMLLIElement; break;
        case "h1": case "h2": case "h3": case "h4": case "h5": case "H6": c = new HTMLHeadingElement; break;
        case "header": c = new Header; break;
        case "footer": c = new Footer; break;
        case "table": c = new HTMLTableElement; break;
        case "tbody": c = new z$tBody; break;
        case "tr": c = new HTMLTableRowElement; break;
        case "td": c = new HTMLTableCellElement; break;
        case "caption": c = new HTMLTableCaptionElement; break;
        case "thead": c = new z$tHead; break;
        case "tfoot": c = new z$tFoot; break;
        case "canvas": c = new HTMLCanvasElement; break;
        case "audio": case "video": c = new HTMLAudioElement; break;
        case "fragment": c = new DocumentFragment; break;
        case "frame": c = new HTMLFrameElement; break;
        case "iframe": c = new HTMLIFrameElement; break;
        case "select": c = new HTMLSelectElement; break;
        case "optgroup": c = new HTMLOptGroupElement; break;
        case "option": c = new Option; break;
        case "form": c = new HTMLFormElement; break;
        case "fieldset": c = new HTMLFieldSetElement; break;
        case "legend": c = new HTMLLegendElement; break;
        case "input": c = new HTMLInputElement; break;
        case "textarea": c = new HTMLTextAreaElement; break;
        case "element": c = new Element; break;
        case "button": c = new HTMLButtonElement; break;
        case "article": case "section": c = new HTMLElement; break;
        case "time": c = new HTMLTimeElement; break;
        default:
            // alert("createElement default " + s);
            c = new HTMLUnknownElement;
        }

// Split on : if this comes from a name space
        const colon = t.split(':');
        if(colon.length == 2) {
            odp(c, "nodeName", {value:t,writable:true,configurable:true});
            odp(c, "tagName", {value:t,writable:true,configurable:true});
            c.prefix = colon[0], c.localName = colon[1];
        } else if(c.nodeType == 1) {
            let s2 = s;
            if(!this.eb$xml) { // not xml, we have to fix the case
                if(c instanceof SVGElement) {
                    s2 = s.toLowerCase();
                    // how many of these compound words are there?
                    if(s2 == "lineargradient") s2 = "linearGradient";
                } else s2 = s.toUpperCase();
            }
            odp(c, "nodeName", {value:s2,writable:true,configurable:true});
            odp(c, "tagName", {value:s2,writable:true,configurable:true});
        }
        if(t == "input") { // name and type are automatic attributes acid test 53
            c.name = c.type = "";
        }
        domLinkage('c', c, s);
        return c;
    } 

    createElementNS(nsurl,s)
    {
        let mismatch = false;
        let u = this.createElement(s);
        if(!u) return null;
        if(!nsurl) nsurl = "";
        u.namespaceURI = new z$URL(nsurl);
        // prefix and url have to fit together, I guess.
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
    }
}
swdc(Document);

class HTMLDocument extends Document
{
    constructor() { super(); }
    toString() { return "[object HTMLDocument]" };
}
swdc(HTMLDocument);

// And now, drumroll please, as we create the document.
odp(this, "document", {value: new HTMLDocument});

// Now that we have document in hand, establish it as the ownerDocument
// for all nodes created under this window.
Node.prototype.ownerDocument = document;

class DocumentFragment extends HTMLElement
{
    constructor() { super(); }
    static {
        const tp = this.prototype;
        tp.nodeType = 11;
        tp.nodeName = tp.tagName = "#document-fragment";
    }
}
swdc(DocumentFragment);

class Text extends HTMLElement
{
    constructor()
    {
        super();
        odp(this, "data$2", {value:"",writable:true});
        if(arguments.length > 0) this.data$2 += arguments[0];
    }
    static {
        const tp = this.prototype;
        // note that nodeName is lower case
        tp.nodeName = tp.tagName = "#text";
        tp.nodeType = 3;
    }

    get data() { return this.data$2; }
    // setter insures data is always a string, because js might:
    // t.data = 7;  ...  if(t.data.match(/x/) ...
    // have to call mutFixup, observer could be watching by characterData
    set data(h)
    {
        const old = this.data$2;
        this.data$2 = h + "";
        mutFixup(this, 2, "text", old);
    }
}
swdc(Text);

class CDATASection extends Text
{
    constructor()
    {
        super();
        this.data = "";
        if(arguments.length > 0) this.data += arguments[0];
    }
    static {
        const tp = this.prototype;
        // note that nodeName is lower case
        tp.nodeName = tp.tagName = "#cdata-section";
        tp.nodeType = 4;
    }
}
swdc(CDATASection);

// <!--   -->
class Comment extends HTMLElement
{
    constructor()
    {
        super();
        this.data = "";
        if(arguments.length > 0) this.data += arguments[0];
    }
    static {
        const tp = this.prototype;
        // note that nodeName is lower case
        tp.nodeName = tp.tagName = "#comment";
        tp.nodeType = 8;
    }
}
swdc(Comment);

class CharacterData extends Node
{
    constructor() { super(); }
}
swdc(CharacterData);

class ProcessingInstruction extends CharacterData
{
    constructor() { super(); }
    static { this.prototype.sheet = null; }
}
swdc(ProcessingInstruction);

// <p>
class HTMLParagraphElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLParagraphElement);

// <div>
class HTMLDivElement extends HTMLElement
{
    constructor() { super(); }
    static {
        const tp = this.prototype;
        tp.doScroll = eb$voidfunction;
        tp.align = "left";
    }
}
swdc(HTMLDivElement);

// <span>
class HTMLSpanElement extends HTMLElement
{
    constructor() { super(); }
    static { this.prototype.doScroll = eb$voidfunction; }
}
swdc(HTMLSpanElement);

// <a>
class HTMLAnchorElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLAnchorElement);

// <area>
class HTMLAreaElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLAreaElement);

// <frame>
class HTMLFrameElement extends HTMLElement
{
    constructor() { super(); }
    get contentWindow() { return eb$getter_cw.call(this); }
    get contentDocument() { return eb$getter_cd.call(this); }
    static { this.prototype.is$frame = true; }
}
swdc(HTMLFrameElement);

// <iframe>
class HTMLIFrameElement extends HTMLFrameElement
{
    constructor() { super(); }
}
swdc(HTMLIFrameElement);

// <hr>
class HTMLHRElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLHRElement);

// <legend>
class HTMLLegendElement extends HTMLElement
{
    constructor() { super(); }
    get form() {
        let p = this.parentNode;
        return p && p.dom$class == "HTMLFieldSetElement" ? p.form : null;
    }
}
swdc(HTMLLegendElement);

// <q>
class HTMLQuoteElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLQuoteElement);

// <img>
class HTMLImageElement extends HTMLElement
{
    constructor() { super(); }
    get alt() { return this.getAttribute("alt"); }
    set alt(v) { this.setAttribute("alt", v); }
}
swdc(HTMLImageElement);

// <ol>
class HTMLOListElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLOListElement);

// <ul>
class HTMLUListElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLUListElement);

// <dl>
class HTMLDListElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLDListElement);

// <li>
class HTMLLIElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLLIElement);

// <label>
class HTMLLabelElement extends HTMLElement
{
    constructor() { super(); }
    get htmlFor() { return this.getAttribute("for"); }
    set htmlFor(v) { this.setAttribute("for", v); }
}
swdc(HTMLLabelElement);

// <h1>
class HTMLHeadingElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLHeadingElement);

// <header>
class Header extends HTMLElement
{
    constructor() { super(); }
    toString() { return '[object HTMLElement]'; }
}
swdc(Header);

// <footer>
class Footer extends HTMLElement
{
    constructor() { super(); }
    toString() { return '[object HTMLElement]'; }
}
swdc(Footer);

// <script>
class HTMLScriptElement extends HTMLElement
{
    constructor() { super(); }

    get defer() { return this.hasAttribute("defer"); }
    set defer(v) { if(v === false) this.removeAttribute("defer"); else this.setAttribute("defer", ""); }
    get async() { return this.hasAttribute("async"); }
    set async(v) { if(v === false) this.removeAttribute("async"); else this.setAttribute("async", ""); }

    get type() {
        let t = this.getAttribute("type");
        if(!t) t = "";
        return t;
    }
    set type(v) { this.setAttribute("type", v); }

    static supports(t) {
        if(typeof t != "string") return false;
        t = t.toLowerCase();
        if(t.match(/\bjavascript\b/)) return true;
        if(t.match(/\bjson\b/)) return true;
        return false;
    }
    static {
        const tp = this.prototype;
        tp.eb$step = 0;
        tp.text = "";
    }
}
swdc(HTMLScriptElement);

// <form>
class HTMLFormElement extends HTMLElement
{
    constructor() {
        super();
        this.elements = [];
    }
    toString() {return "HTMLFormControlsCollection"; }
    get length() { return this.elements.length; }

    static {
        const tp = this.prototype;
        tp.submit = eb$formSubmit;
        tp.reset = eb$formReset;
    }
}
swdc(HTMLFormElement);

// <input>
class HTMLInputElement extends HTMLElement
{
    constructor()
    {
        super();
        this.validity = new Validity;
        this.validity.owner = this;
    }

    static {
        const tp = this.prototype;
        tp.checked$2 = false;
        tp.selectionStart = 0;
        tp.selectionEnd = -1;
        tp.selectionDirection = "none";
        tp.select = eb$voidfunction;
    }

    get checked() { return this.checked$2; }
    set checked(v) {
        if(v !== false) v = true;
        if(v == this.checked$2) return; // no change
        this.checked$2 = v;
        // if it's radio and checked we need to uncheck the others.
        if(!v) return;
        if(this.type != "radio") return;
        let nn = this.name, e;
        if(!nn) return;
        if(this.form && (e = this.form[nn]) && Array.isArray(e)) {
            for(let i=0; i<e.length; ++i)
                if(e[i] != this) e[i].checked$2 = false;
            return;
        }
        // Try it another way.
        // This asumes all radio buttons are below the same parent,
        // which is not guaranteed
        if(this.parentNode && (e = this.parentNode.childNodes)) {
            for(let i=0; i<e.length; ++i)
                if(e[i].nodeName == "INPUT" && e[i].type == "radio" && 
                e[i].name == nn &&e[i] != this)
                    e[i].checked$2 = false;
            return;
        }
    }

    get type()
    {
        let t = this.getAttribute("type");
        if(!t || typeof t != "string") return "text";
        t = t.toLowerCase();
        if(t == "submit" || t == "reset" ||
        t == "image" || t == "button" ||
        t == "text" || t == "hidden" || t == "file" ||
        t == "password" || t == "email" || t == "date" ||
        t == "number" ||
        t == "checkbox" || t == "radio") return t;
        alert3(`unknown input type ${t}`);
        // there are too many of these; I can't be sure; just return t;
        return t;
    }
    set type(v) { this.setAttribute("type", v);
                if(v.toLowerCase() == "checkbox" && !this.value) this.value = "on";
    }

    get readOnly() { return this.hasAttribute("readonly"); }
    set readOnly(v) { if(v === false) this.removeAttribute("readonly"); else this.setAttribute("readonly", ""); }
    get multiple() { return this.hasAttribute("multiple"); }
    set multiple(v) { if(v === false) this.removeAttribute("multiple"); else this.setAttribute("multiple", ""); }
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(v) { if(v === false) this.removeAttribute("disabled"); else this.setAttribute("disabled", ""); }
    get required() { return this.hasAttribute("required"); }
    set required(v) { if(v === false) this.removeAttribute("required"); else this.setAttribute("required", ""); }
    get value() { return this.val$ue ? this.val$ue : ""; }
    set value(h) { if(h) { this.val$ue = h; set_value(this, h); } }

/* HTMLElement has a click function, which dispatches the click event.
This class, Input, has a click function that displaces that one.
It dispatches the event, and then  performs the action of the input tag,
as though the user had clicked on this item.
This could be submitting a form, or deselecting the other radio buttons
if this is a radio button. */
    click()
    {
        if (this.disabled) return;
        // dispatch the click event, as HTMLElement would have done.
        let e = new MouseEvent("click");
        if(!this.dispatchEvent(e)) return;
        // click handlers did not say no - let's continue.
        let nn = this.nodeName, t = this.type;
        if(this.form && this.form.dom$class == "HTMLFormElement") {
            if(t == "submit") {
                e = new Event;
                e.initEvent("submit", true, true);
                if(this.dispatchEvent(e)) this.form.submit();
            }
            if(t == "reset") {
                e = new Event;
                e.initEvent("reset", true, true);
                if(this.dispatchEvent(e)) this.form.reset();
            }
        }
        if(t != "checkbox" && t != "radio") return;
        this.checked$2 = !this.checked$2;
        // if it's radio and checked we need to uncheck the others.
        if(!this.checked$2) return;
        if(t != "radio") return;
        if(!(nn = this.name)) return;
        if(this.form && (e = this.form[nn]) && Array.isArray(e)) {
            for(let i=0; i<e.length; ++i)
                if(e[i] != this) e[i].checked$2 = false;
        } else // try it another way
        if(this.parentNode && (e = this.parentNode.childNodes)) {
            for(let i=0; i<e.length; ++i)
                if(e[i].nodeName == "INPUT" && e[i].type == t && 
                e[i].name == nn &&e[i] != this) e[i].checked$2 = false;
        }
    }

// I don't know what this function does, something visual I think.
    setSelectionRange(s, e, dir)
    {
        if(typeof s == "number") this.selectionStart = s;
        if(typeof e == "number") this.selectionEnd = e;
        if(typeof dir == "string") this.selectionDirection = dir;
    }

    get placeholder()
    {
        let t = this.getAttribute("placeholder");
        let y = typeof t;
        return y == "string" || y == "number" ? t : "";
    }
    set placeholder(v) { this.setAttribute("placeholder", v); }

    get step()
    {
        let t = this.getAttribute("step");
        let y = typeof t;
        return y == "number" || y == "string" ? t : undefined;
    }
    set step(v) { this.setAttribute("step", v); }

    get minLength()
    {
        let t = this.getAttribute("minlength");
        let y = typeof t;
        return y == "number" || y == "string" ? t : undefined;
    }
    set minLength(v) { this.setAttribute("minlength", v); }

    get maxLength()
    {
        let t = this.getAttribute("maxlength");
        let y = typeof t;
        return y == "number" || y == "string" ? t : undefined;
    }
    set maxLength(v) { this.setAttribute("maxlength", v); }

    get size()
    {
        let t = this.getAttribute("size");
        let y = typeof t;
        return y == "number" || y == "string" ? t : undefined;
    }
    set size(v) { this.setAttribute("size", v); }

}
swdc(HTMLInputElement);

// <button>
class HTMLButtonElement extends HTMLElement
{
    constructor() { super(); }

    get type()
    {
        let t = this.getAttribute("type");
        // default is submit, acid test 59
        if(!t || typeof t != "string") return "submit";
        t = t.toLowerCase();
        if(t == "submit" || t == "reset" ||
        t == "button" || t == "menu") return t;
        alert3(`bad button type ${t}`);
        return "submit";
    }
    set type(v) { this.setAttribute("type", v);}

/* You can submit a form by a button, just like an input field type submit.
The whole button input overlap is confusing.
Use the same click function as the Input class. */
    static { this.prototype.click = HTMLInputElement.prototype.click; }
}
swdc(HTMLButtonElement);

// <textarea>
class HTMLTextAreaElement extends HTMLElement
{
    constructor() { super(); }
    get readOnly() { return this.hasAttribute("readonly"); }
    set readOnly(v) { if(v === false) this.removeAttribute("readonly"); else this.setAttribute("readonly", ""); }
    get required() { return this.hasAttribute("required"); }
    set required(v) { if(v === false) this.removeAttribute("required"); else this.setAttribute("required", ""); }
    get value() { return this.val$ue ? this.val$ue : ""; }
    set value(h) { if(h) { this.val$ue = h; set_value(this, h); } }
    get innerText() { return this.value }
    set innerText(v) { this.value = t }
    get type() { return "textarea"}
    get placeholder()
    {
        let t = this.getAttribute("placeholder");
        let y = typeof t;
        return y == "string" || y == "number" ? t : "";
    }
    set placeholder(v) { this.setAttribute("placeholder", v); }
}
swdc(HTMLTextAreaElement);

class HTMLSelectElement extends HTMLElement
{
    constructor()
    {
        super();
        this.selectedIndex = -1;
        this.options = [];
        this.selectedOptions = [];
        this.validity = new Validity;
        this.validity.owner = this;
    }

    get value() {
        const a = this.options;
        const n = this.selectedIndex;
        return (n < 0 || n >= a.length) ? "" : a[n].value;
    }

    get type() {
        return this.multiple ? "select-multiple" : "select-one";
    }
    get multiple() { return this.hasAttribute("multiple"); }
    set multiple(v) { if(v === false) this.removeAttribute("multiple"); else this.setAttribute("multiple", ""); }
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(v) { if(v === false) this.removeAttribute("disabled"); else this.setAttribute("disabled", ""); }
    get required() { return this.hasAttribute("required"); }
    set required(v) { if(v === false) this.removeAttribute("required"); else this.setAttribute("required", ""); }
    get size() {
        const t = this.getAttribute("size");
        if(typeof t == "number") return t;
        if(typeof t == "string" && t.match(/^\d+$/)) return parseInt(t);
        return 0;
    }
    set size(v) { this.setAttribute("size", v); }

// I have some wrappers here to manage some weird side effects.
    appendChild(c)
    {
        if(!c) return null;
        if(c.dom$class != "HTMLOptionElement")
            return Node.prototype.appendChild.call(this, c);
        if(c.defaultSelected) c.selected$2 = true;
        // add first, then select, so the setter can deselect the others.
        const was_selected = c.selected;
        c.selected$2 = false;
        // this append will perform the reindex, and rebuild options and selectedOptions
        Node.prototype.appendChild.call(this, c);
        // now select this one, possibly unselecting the others.
        c.selected = was_selected;
        return c;
    }

    insertBefore(c, item)
    {
        if(!c) return null;
        if(!item) return this.appendChild(c);
        if(c.dom$class != "HTMLOptionElement")
            return Node.prototype.insertBefore.call(this, c, item);
        // side effect; option is freed even if it can't reconnect
        c.remove();
        if(c.defaultSelected) c.selected$2 = true;
        // add first, then select, so the setter can deselect the others.
        const was_selected = c.selected;
        c.selected$2 = false;
        // this insert will perform the reindex, and rebuild options and selectedOptions
        Node.prototype.insertBefore.call(this, c, item);
        // now select this one, possibly unselecting the others.
        c.selected = was_selected;
        return c;
    }

    add(o, idx)
    {
        // have to turn the object Option into a proper node
        // with a corresponding tag in C.
        domLinkage('c', o, "option");
        const n = this.options.length;
        // first option to a pick-one list is automatically selected
        if(!n && !this.multiple) o.selected$2 = true;
        if(typeof idx != "number" || idx < 0 || idx > n) idx = n;
        if(idx == n) {
            this.appendChild(o);
        } else {
            // Determine the parent; we might be adding to an option group.
            const p = this.options[idx].parentNode;
            p.insertBefore(o, this.options[idx]);
        }
    }

    remove(idx)
    {
        const n = this.options.length;
        if(typeof idx == "number" && idx >= 0 && idx < n) {
            // if removing the only selected option, revert to the first one.
            const only = !this.multiple && this.options[idx].selected;
            this.removeChild(this.options[idx]);
            if(only && n > 1) this.options[0].selected = true;
        }
    }

    selectReindexThis() { selectReindex(this); }

// A helper function for <option> coming from html.
// This is called from C as we parse the html and build the tree.
// It can be called from select or optgroup.
    option_from_html(o)
    {
        this.childNodes.push(o);
        o.parentNode = this;
        let og = null; // option group
        let select = this;
        if(select.dom$class == "HTMLOptGroupElement") {
            og = select;
            while(select = select.parentNode) {
                if(select.nodeType != 1) return; // should never happen
                if(select.dom$class == "HTMLSelectElement") break;
            }
            if(!select) return;
        }
        select.options.push(o);
        if(o.selected) select.selectedOptions.push(o);
        o.form = select.form;
        mutFixup(this, 0, o, null);
    }
}
swdc(HTMLSelectElement);

// similar to a select list but I don't really understand it.
class z$Datalist extends HTMLElement
{
    constructor() { super(); }
    get multiple() { return this.hasAttribute("multiple"); }
    set multiple(v) { if(v === false) this.removeAttribute("multiple"); else this.setAttribute("multiple", ""); }
}
swdc(z$Datalist);

class HTMLOptGroupElement extends HTMLElement
{
    constructor() { super(); }
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(v) { if(v === false) this.removeAttribute("disabled"); else this.setAttribute("disabled", ""); }
    static {
        const tp = this.prototype;
        tp.nodeName = tp.tagName = "OPTGROUP";
        tp.option_from_html = HTMLSelectElement.prototype.option_from_html;
    }
}
swdc(HTMLOptGroupElement);

class HTMLOptionElement extends HTMLElement
{
    constructor()
    {
        super();
        if (arguments.length > 0) this.text = arguments[0];
        if (arguments.length > 1) this.value = arguments[1];
    }

    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(v) { if(v === false) this.removeAttribute("disabled"); else this.setAttribute("disabled", ""); }

    static {
        const tp = this.prototype;
        tp.nodeName = tp.tagName = "OPTION";
        tp.text = tp.value = "";
        tp.selected$2 = false;
        tp.defaultSelected = false;
    }
    get selected() { return this.selected$2; }
    set selected(v)
    {
        if(v !== false) v = true;
        if(v == this.selected$2) return; // no change
        // if selected within a pick-one list, we need to unselect the others.
        // This is like checking a radio button, although simpler,
        // because this time we have an options array to key on.
        // We need to find the containing select, or we can't get started.
        let sel = this.parentNode;
        while(sel) {
            if(sel.nodeType != 1) { this.selected$2 = v; return; }
            if(sel.nodeName == "SELECT") break;
            sel = sel.parentNode;
        }
        if(!sel) { this.selected$2 = v; return; }
        // chrome doesn't let us deselect from a pick-one list.
        if(!sel.multiple && !v) return;
        this.selected$2 = v;
        if(!sel.multiple) {
            for(let c of sel.options)
                if(c != this) c.selected$2 = false;
        }
        selectReindex(sel);
    }
}
swdc(HTMLOptionElement);
window.Option = HTMLOptionElement;

// <fieldset>
class HTMLFieldSetElement extends HTMLElement
{
    constructor() {
        super();
        this.elements = [];
        this.elements.toString = ()=>{ return '[object HTMLCollection]'}
    }
         checkValidity() { return true; }
         reportValidity() { return true; }
    get length() { return this.elements.length}

    static {
        const tp = this.prototype;
        tp.form = null;
        tp.type = "fieldset";
        tp.validationMessage = "";
        tp.willValidate = false;
        tp.reset = eb$formReset;
    }
}
swdc(HTMLFieldSetElement);

// <thead> <tbody> <tfoot>
class HTMLTableSectionElement extends HTMLElement
{
    constructor() { super(); this.rows = []; }

    insertRow(idx)
    {
        if(idx === undefined) idx = -1;
        if(typeof idx !== "number") return null;
        const t = this;
        const nrows = t.rows.length;
        if(idx < 0) idx = nrows;
        if(idx > nrows) return null;
        const r = document.createElement("tr");
        // called from table or section; if not table then it is a sectiont
        if(t.dom$class != "HTMLTableElement") {
            if(idx == nrows) t.appendChild(r);
            else t.insertBefore(r, t.rows[idx]);
            return r;
        }
        // That was the easy case - now add to a table.
        // Put this row in the same section as the next row.
        if(idx == nrows) {
            if(nrows) t.rows[nrows-1].parentNode.appendChild(r);
            else if(t.tBodies.length) t.tBodies[0].appendChild(r);
            else {
// No sections, what now? Chrome says to create a body.
            const b = document.createElement("tbody");
            b.appendChild(r);
            this.appendChild(b);
// Even if there was a footer, this body is appended after it,
// which seems oddly out of order, but that's what chrome does.
            }
        return r;
        }
        t.rows[idx].parentNode.insertBefore(r, t.rows[idx]);
        return r;
    }

    deleteRow(idx)
        {
        if(idx === undefined) idx = -1;
        if(typeof idx !== "number") return;
        const t = this;
        const nrows = t.rows.length;
        if(!nrows) return; // nothing to delete
        if(idx < 0) idx = nrows - 1;
        if(idx >= nrows) return;
        t.rows[idx].remove();
    }
}
swdc(HTMLTableSectionElement);

class z$tBody extends HTMLTableSectionElement
{
    constructor() { super(); }
}
swdc(z$tBody);

class z$tHead extends HTMLTableSectionElement
{
    constructor() { super(); }
}
swdc(z$tHead);

class z$tFoot extends HTMLTableSectionElement
{
    constructor() { super(); }
}
swdc(z$tFoot);

// <caption>
class HTMLTableCaptionElement extends HTMLElement
{
    constructor() { super(); this.rows = []; }
}
swdc(HTMLTableCaptionElement);

class HTMLTableElement extends HTMLElement
{
    constructor()
    {
        super();
        this.rows = [];
        this.tBodies = [];
    }

    static {
        const tp = this.prototype;
        tp.insertRow = HTMLTableSectionElement.prototype.insertRow;
        tp.deleteRow = HTMLTableSectionElement.prototype.deleteRow;
    }

    createCaption()
    {
        if(this.caption) return this.caption;
        const c = document.createElement("caption");
        return this.prepend$child(c);
    }

    deleteCaption()
    {
        if(this.caption) this.removeChild(this.caption);
    }

    createTHead()
    {
        if(this.tHead) return this.tHead;
        const c = document.createElement("thead");
        return this.prepend$child(c);
    }

    deleteTHead()
    {
        if(this.tHead) this.removeChild(this.tHead);
    }

    createTFoot()
    {
        if(this.tFoot) return this.tFoot;
        const c = document.createElement("tfoot");
        return this.insertBefore(c, this.caption);
    }

    deleteTFoot()
    {
        if(this.tFoot) this.removeChild(this.tFoot);
    }

}
swdc(HTMLTableElement);

class HTMLTableRowElement extends HTMLElement
{
    constructor() { super(); this.cells = []; }

    insertCell(idx)
    {
        if(idx === undefined) idx = -1;
        if(typeof idx !== "number") return null;
        const t = this;
        const n = t.childNodes.length;
        if(idx < 0) idx = n;
        if(idx > n) return null;
        const r = document.createElement("td");
        if(idx == n) t.appendChild(r);
        else t.insertBefore(r, t.childNodes[idx]);
        return r;
    }

    deleteCell(n)
    {
        const l = this.cells.length;
        if(typeof n != "number") n = -1;
        if(n == -1) n = 0;
        if(n >= 0 && n < l)
            this.removeChild(this.cells[n]);
    }
}
swdc(HTMLTableRowElement);

class HTMLTableCellElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLTableCellElement);

class HTMLStyleElement extends HTMLElement
{
    constructor() { super(); }
    get css$data() { // edbrowse feature
        let s = ""; for(let c of this.childNodes)
            if(c.nodeType == 3) s += c.data;
        return s;
    }
}
swdc(HTMLStyleElement);

// <template>
class HTMLTemplateElement extends HTMLElement
{
    constructor() { super(); }

// calling upon content performs the magic.
    get content()
    {
        if(this.content$2) return this.content$2;
        const frag = document.createDocumentFragment();
        frag.ownerDocument = new Document;
        // need to set its location to "about:blank" but I don't know how to do that.
        // Lots of setters and getters involved in location, and the current window
        // and document, and new documents created, and we need to sort all this out.
        let c;
        while(c = this.firstChild)
            frag.appendChild(c);
        odp(this, "content$2", {value:frag});
        return frag;
    }
}
swdc(HTMLTemplateElement);

// <details>
class HTMLDetailsElement extends HTMLElement
{
    constructor() { super(); }
    get open() { return this.hasAttribute("open"); }
    set open(v) { if(v === false) this.removeAttribute("open"); else this.setAttribute("open", ""); }
}
swdc(HTMLDetailsElement);

// <object>
class HTMLObjectElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLObjectElement);

class ShadowRoot extends HTMLElement
{
    constructor() { super(); }
}
swdc(ShadowRoot);

// use by the css system and the dataset system
function camelCase(t) {
    return t.replace(/-./g, function(f){return f[1].toUpperCase()});
}
function dataCamel(t) { return camelCase(t.replace(/^data-/,"")); }
function uncamelCase(t) {
    return t.replace(/([a-z])([A-Z])/g, function(f,a,b){return a+'-'+b.toLowerCase()});
}

// The css style declaration - complicated by all the default values,
// and the plethora of shorthand properties that we must expand.
class CSSStyleDeclaration extends HTMLElement
{
    constructor()
    {
        super();
        odp(this, "style$2", {value:this});
        odp(this, "element", {value:null, writable:true});
    }

    toString() { return "style object" };

    // sheet on demand
    get sheet() {
        if(!this.sheet$2) this.sheet$2 = new CSSStyleSheet;
        return this.sheet$2;
    }

    // acid test 45 says float magically turns into cssFloat
    set float(v) { this.cssFloat = v; }

    get length()
    {
        let cnt = 0;
        for(let i in this) if(this.hasOwnProperty(i)) ++cnt;
        return cnt;
    }

    item(n)
    {
        if(typeof n !== "number") return "";
        let cnt = 0;
        for(let i in this) {
            if (!this.hasOwnProperty(i)) continue;
            if (cnt == n) return uncamelCase(i);
            ++cnt;
        }
        return ""
    }

    getPropertyValue(p)
    {
        p = camelCase(p);
        if (this[p] == undefined) this[p] = "";
        return this[p];
    }

    getProperty(p)
    {
        p = camelCase(p);
        return this[p] ? this[p] : "";
    }

    setProperty(p, v, prv)
    {
        p = camelCase(p);
        this[p] = v;
        const pri = p + "$pri";
        odp(this, pri, {
            value: (prv === "important"),
            writable: true,
            configurable: true
        })
    }

    getPropertyPriority(p)
    {
        p = camelCase(p);
        const pri = p + "$pri";
        return this[pri] ? "important" : "";
    }

    removeProperty(p)
    {
        p = camelCase(p);
        delete this[p]
        delete this[p+"$$scy"]
        delete this[p+"$$pri"]
    }

    get cssText()
    {
        let s = "";
        for (let k in this) {
            if (!this.hasOwnProperty(k)) continue;
            let l = this[k];
            // weirdness from acid 45
            if (k === "cssFloat") k = "float";
            if (l.match(/[ \t;"'{}]/)) {
                if (!l.match(/"/)) l = '"' + l + '"';
                else if (!l.match(/'/)) l = "'" + l + "'";
                else {
                    alert3(`cssText unrepresentable ${k}: ${l}`);
                    l = "none";
                }
            }
            if (s.length) s += ' ';
            s = s + k + ': ' + l + ';';
        }
        return s;
    }

    set cssText(h)
    {
        window.soj$ = this;
        eb$cssText.call(this, h);
        delete window.soj$;
    }
}
swdc(CSSStyleDeclaration);

// Default values for properties, and setters for shorthand properties.
// None of these are instance methods.
(function(){
    const csdp = CSSStyleDeclaration.prototype;
        // when one property is shorthand for several others.
        // margin implies top right bottom left
        // How many of these are there that I don't know about?
        // Not clear how this meshes with my $$scy specificity system.
    let list = [
        "margin", "scrollMargin", "padding", "scrollPadding",
        "borderRadius", "border",
        "borderWidth", "borderColor", "borderStyle", "borderImage",
        "background", "font", "inset", "textDecoration"
    ];
    for (let k of list) {
        odp(csdp, k, {
            set: function(h) { mw$.cssShort[`${k}Short`](this, h); }
        })
    }

    // These are default properties of a style declaration.
    // These should be writable, so that the corresponding properties
// of the instantiated object are writable.
// Remember that readonly cascades downstream from the prototype property.
    list = [
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
        "textDecorationColor","textDecorationLine","textDecorationSkipInk","textDecorationStyle","textDecorationThickness",
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
        "zIndex",
    ];
    for (let k of list) odp(csdp, k, {value: "", writable: true})

    list = [
        // first attribute is per acid test 46
        "textTransform.none",
        "borderImageSource.none","borderImageOutset.0","borderImageWidth.1","borderImageSlice.100%",
        "borderBottom.1px solid rgb(193, 193, 193)","borderLeft.1px solid rgb(193, 193, 193)","borderRight.1px solid rgb(193, 193, 193)","borderTop.1px solid rgb(193, 193, 193)",
        "borderBottomWidth.1px","borderLeftWidth.1px","borderRightWidth.1px","borderTopWidth.1px",
        "width.250px", "height.40px",
        "MozBorderImage.none 100% / 1 / 0 stretch","webkitBorderImage.none 100% / 1 / 0 stretch","WebkitBorderImage.none 100% / 1 / 0 stretch",
        "borderBottomColor.rgb(193, 193, 193)","borderLeftColor.rgb(193, 193, 193)","borderRightColor.rgb(193, 193, 193)","borderTopColor.rgb(193, 193, 193)",
        "borderBottomStyle.solid","borderLeftStyle.solid","borderRightStyle.solid","borderTopStyle.solid",
        "borderImageRepeat.stretch",
        "parentRule.null",
    ];
    for(let k of list) {
        const s = k.split('.');
        odp(csdp, s[0], {value: s[1], writable: true})
    }
})();

class CSSRule
{
    constructor() {this.cssText=""; }
    toString() { return this.cssText; }
}
swdc(CSSRule);

// This isn't really right, but it's easy
class CSSRuleList extends Array
{
    constructor() { super(); }
}
swdc(CSSRuleList);

class CSSStyleSheet
{
    constructor() { this.cssRules = new CSSRuleList; }

insertRule(r, idx)
{
    let list = this.cssRules;
    (typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = 0));
    if (idx == list.length) list.push(r);
    else list.splice(idx, 0, r);
}

addRule(sel, r, idx)
{
    let list = this.cssRules;
    (typeof idx == "number" && idx >= 0 && idx <= list.length || (idx = list.length));
    r = sel + "{" + r + "}";
    if (idx == list.length) list.push(r);
    else list.splice(idx, 0, r);
}
}
swdc(CSSStyleSheet);

// <time>
class HTMLTimeElement extends HTMLElement
{
    constructor() { super(); }
    get dateTime(){return this.getAttribute("datetime") }
}
swdc(HTMLTimeElement);

// This is for javascript timers. Each timer becomes an instance of this class.
// This has nothing to do with HTMLTimeElement.
class z$Timer extends EventTarget
{
    constructor()
    {
        super();
        this.nodeName = "TIMER"
    }
}
swdc(z$Timer, false);

class HTMLMediaElement extends HTMLElement
{
    constructor() { super(); }
    static {
        const tp = this.prototype;
        tp.autoplay = false;
        tp.muted = false;
        tp.defaultMuted = false;
        tp.paused = false;
        tp.controls = false;
        tp.controller = null;
        tp.volume = 1.0;
        tp.play = eb$playAudio;
        tp.load = eb$voidfunction;
        tp.pause = eb$voidfunction;
    }
    audioTracks = [];
    videoTracks = [];
    textTracks = [];
}
swdc(HTMLMediaElement);

class HTMLAudioElement extends HTMLMediaElement
{
    constructor(t)
    {
        super();
        // arg to constructor is the url of the audio
        if (typeof t == "string") this.src = t;
        if (typeof t == "object") this.src = t.toString();
    }
    static {
        const tp = this.prototype;
        tp.nodeName = "AUDIO";
    }
}
swdc(HTMLAudioElement);
window.Audio = HTMLAudioElement; // alias

/*********************************************************************
AudioContext, for playing music etc.
This one we could implement, but I'm not sure if we should.
If speech comes out of the same speakers as music, as it often does,
you might not want to hear it, you might rather see the url, or have a button
to push, and then you call up the music only if / when you want it.
Not sure what to do, so it's pretty much stubs for now.
*********************************************************************/

class AudioContext
{
    static {
        const tp = this.prototype;
        tp.outputLatency = 1.0;
        tp.createMediaElementSource = eb$voidfunction;
        tp.createMediaStreamSource = eb$voidfunction;
        tp.createMediaStreamDestination = eb$voidfunction;
        tp.createMediaStreamTrackSource = eb$voidfunction;
        tp.suspend = eb$voidfunction;
        tp.close = eb$voidfunction;
    }
}
swdc(AudioContext);

// Canvas method draws a picture. That's meaningless for us,
// but it still has to be there.
class HTMLCanvasElement extends HTMLElement
{
    constructor() { super(); }
    getContext(x)
    {
        return {
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
            translate: eb$nullfunction 
        }
    }

    get toDataURL()
    {
        if(this.height === 0  || this.width === 0) return "data:,";
        // this is just a stub
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC";
    }
}
swdc(HTMLCanvasElement);

// <snork>
class HTMLUnknownElement extends HTMLElement
{
    constructor() { super(); }
}
swdc(HTMLUnknownElement);

// At this point we have defined the descendents of Node.
// Here are classes that don't support innerHTML.
// Overwrite the innerHTML setter so it doesn't do anything.
for(let c of [
DocType, HTMLMetaElement, HTMLLinkElement, HTMLTitleElement,
HTMLBaseElement, Text, Comment,
CharacterData, DocumentFragment,
HTMLHRElement, HTMLImageElement, HTMLScriptElement,
HTMLFrameElement,
HTMLInputElement, HTMLButtonElement, HTMLOptGroupElement, HTMLOptionElement,
HTMLStyleElement, CSSStyleDeclaration,
HTMLMediaElement, HTMLCanvasElement,
HTMLTimeElement,
]) {
    odp(c.prototype, "innerHTML", {
        get: function(){ return this.inner$HTML},
        set: function(h){this.inner$HTML = h}})
    odp(c.prototype, "inner$HTML", {
        value:"", writable:true});
}

class URL
{
    constructor()
    {
        let h = "";
        if(arguments.length == 1) h= arguments[0];
        if(arguments.length == 2) h= resolveURL(arguments[1], arguments[0]);
        this.href = h;
    }

    rebuild() {
        let h = "";
        if(this.protocol$val) {
            // protocol includes the colon
            h = this.protocol$val;
            let plc = h.toLowerCase();
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

    // I've seen websites hijack properties that are getters and setters,
    // so we have to make sure these are writable, for such possibility.
    get protocol() { return this.protocol$val; }
    set protocol(v) { this.protocol$val = v; this.rebuild(); }
    get pathname() { return this.pathname$val; }
    set pathname(v) { this.pathname$val = v; this.rebuild(); }
    get search() { return this.search$val; }
    set search(v) { this.search$val = v; this.rebuild(); }
    get searchParams() { return new URLSearchParams(this.search$val); }
    get hash() { return this.hash$val; }
    set hash(v) {
        if(typeof v != "string") return;
        if(!v.match(/^#/)) v = '#'+v;
        this.hash$val = v;
        this.rebuild();
    }
    get port() { return this.port$val; }
    set port(v) {
        this.port$val = v;
        if(this.hostname$val.length)
            this.host$val = this.hostname$val + ":" + v;
        this.rebuild();
    }
    get hostname() { return this.hostname$val; }
    set hostname(v) {
        this.hostname$val = v;
        if(this.port$val)
            this.host$val = v + ":" +  this.port$val;
        this.rebuild();
    }
    get host() { return this.host$val; }
    set host(v) {
        this.host$val = v;
        if(v.match(/:/)) {
            this.hostname$val = v.replace(/:.*/, "");
            this.port$val = v.replace(/^.*:/, "");
        } else {
            this.hostname$val = v;
            this.port$val = "";
        }
        this.rebuild();
    }
    get href() { return this.href$val; }

// this setter is complicated so hang on
    set href(v) {
        let inconstruct = true, firstassign = false;
        // if passed a url, turn it back into a string
        if(v === null || v === undefined) v = "";
        if(v.dom$class == "URL" || v instanceof URL) v = v.toString();
        if(typeof v != "string") return;
        if(v.substr(0,7) == "Wp`Set@") v = v.substr(7), firstassign = true;
        // resolveURL is a native method in the shared window.
        // It can accommodate null, if eb$base is not defined
        v = resolveURL(window.eb$base, v);
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

    toString() { return this.href$val; }

// use toString in the following - in case they replace toString with their own function.
// Don't just grab href$val, tempting as that may be.

    get length() { return this.toString().length; }
    concat(s) {  return this.toString().concat(s); }
    startsWith(s) {  return this.toString().startsWith(s); }
    endsWith(s) {  return this.toString().endsWith(s); }
    includes(s) {  return this.toString().includes(s); }
    split(s) {  return this.toString().split(s); }
    match(s) {  return this.toString().match(s); }
    replace(s, t) {  return this.toString().replace(s, t); }
    indexOf(s) {  return this.toString().indexOf(s); }
    lastIndexOf(s) {  return this.toString().lastIndexOf(s); }
    charAt(n) {  return this.toString().charAt(n); }
    charCodeAt(n) {  return this.toString().charCodeAt(n); }
    substring(from, to) {  return this.toString().substring(from, to); }
    substr(from, to) {  return this.toString().substr(from, to); }
    slice(from, to) {  return this.toString().slice(from, to); }
    toLowerCase() {  return this.toString().toLowerCase(); }
    toUpperCase() {  return this.toString().toUpperCase(); }
    trim() {  return this.toString().trim(); }
}
swdc(URL);

// z$URL is a synonym, for our own purposes.
swp("z$URL", URL);

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
*********************************************************************/

(function() {
    const cnlist = ["HTMLAnchorElement.href", "HTMLAreaElement.href",
"HTMLFrameElement.src", "HTMLQuoteElement.cite"];
    for (let k of cnlist) {
        const s = k.split('.');
        const cn = s[0]; // class name
        const u = s[1]; // url name
        odp(window[cn].prototype, u, {
            get: function() { return this.href$2 ? this.href$2.href$val : ""; },
            set: function(h)
            {
                if (h === null || h === undefined) h = "";
                if (h instanceof URL || h.dom$class == "URL") h = h.toString();
                if (typeof h != "string") {
                    alert3(`href set ${typeof h}`);
                    return;
                }
                if (!h) return;
                let last_href = (this.href$2 ? this.href$2.toString() : null);
                this.setAttribute(u, h);
                // special code for setting frame.src, redirect to a new page.
                h = this.href$2.href$val;
                if (this.is$frame && this.eb$expf && last_href != h) {
                    /*
                        There is a nasty corner case here, dont know if it ever
                        happens. What if we are replacing the running frame?
                        window.parent.src = new_url; See if we can get around it
                        this way.
                    */
                    if (window === this.contentWindow) {
                        location = h;
                        return;
                    }
                    delete this.eb$expf;
                    eb$unframe(this); // fix links on the edbrowse side
                    // I can force the opening of this new frame, but should I?
                    this.contentDocument;
                    eb$unframe2(this);
                }
            }
        });
        if(u == "cite") continue;
        const piecelist = ["protocol", "pathname", "host", "search", "hostname", "port", "hash"];
        for (let piece of piecelist)
            odp(window[cn].prototype, piece, {
                get: function() { return this.href$2 ? this.href$2[piece] : null; },
                set: function(x) { if (this.href$2) this.href$2[piece] = x; }
            });
    }
})();

/*********************************************************************
Ok - a.href has all the peices, a.protocol etc.
I don't know if script.src does or not.
I don't think so, so what follows is just like the above but without the pieces.
If one of these classes is suppose to have pieces, then move it to the above,
and also put it in spilldownResolveURL instead of spilldownResolve.
*********************************************************************/

(function() {
    const cnlist = ["HTMLFormElement.action", "HTMLImageElement.src", "HTMLScriptElement.src",
    "HTMLBaseElement.href", "HTMLLinkElement.href", "HTMLMediaElement.src",
    "HTMLObjectElement.data"];
    for(let k of cnlist) {
        const s = k.split('.');
        const cn = s[0]; // class name
        const u = s[1]; // url name
        odp(window[cn].prototype, u, {
            get: function() { return this.href$2 ? this.href$2 : ""},
            set: function(h) {
                if (h instanceof URL || h.dom$class == "URL") h = h.toString();
                if (h === null || h === undefined) h = "";
                if (typeof h != "string") {
                    alert3(`hrefset ${typeof h}`);
                    return;
                }
                if (!h) return;
                this.setAttribute(u, h);
            }
        });
    }
})();

// We can set input.onclick = 'some code to execute";, then invoke
// input.onclick() directly, which means it has to transmute to a function.
// That requires a setter to compile the string, and a getter to return the function.

(function() {
// getter and setter - so that an unassigned handler returns null
function dhp(obj, ev)
{
    const evprop = `${ev}$2`
    odp(window[obj].prototype, ev, {
        get: function() { return this[evprop] ? this[evprop] : null; },
        set: function(f)
        {
            if (db$flags(1))
                alert3(`${(this[evprop] ? "clobber": "create")} ${(this.nodeName ? this.nodeName : this.dom$class)}.${ev}`);
// it should only be a function in the context of a direct assignment
            if(typeof f === "function") {
                odp(this, evprop, {
                    value: f, writable: true, configurable: true});
            }
        }
    });
}

    for(let obj of standard_event_classes) {
        for(let evname of standard_events) dhp(obj, evname);
    }

// window has no attribute system - so include it here
    for(let evname of standard_events) dhp("Window", evname);

// onhashchange from certain places
// Also HTMLFrameSetElement which we have not yet implemented.
    for(let obj of standard_hashchange_classes) dhp(obj, "onhashchange");
   dhp("Window", "onhashchange");
})();

/* A bit hacky but this helper avoids setting something on the prototype of
our event class. Note that it only works where the type of the options are the same as the defaults which seems to be the common case for events.
*/
function setEventOptions(event, options, defaults)
{
    if (!options)
        for (const [k,v] of Object.entries(defaults))
            odp(event, k, {value: v, enumerable: true, writable: true})
    else
        for (const [k,v] of Object.entries(defaults))
            odp(event, k, {
                value: (typeof options[k] === typeof v) ? options[k] : v,
                enumerable: true,
                writable: true
            })
}

class Event
{
    constructor(etype, options)
    {
        odp(this, "timeStamp", {value: new Date().getTime(), enumerable: true});
        if (typeof etype === "string")
            odp(this, "type", {value: etype, enumerable: true});

        setEventOptions(this, options, {bubbles: true, cancelable: true});
        // in the edbrowse world, we have to say yes to capture,
        // just as we have to say yes to bubble.
        odp(this, "eb$captures", {value: true, writable: true});
        odp(this, "defaultPrevented", {
            value: false, writable: true, enumerable: true
        });
        this.currentTarget = null;
        this.target = null;
        this.eventPhase = 0;
        odp(this, "eb$dispatched", {value: false, writable: true});
        odp(this, "stop$propagating", {value: false, writable: true});
        odp(this, "stop$propagating$immediate", {value: false, writable: true});
    }

    preventDefault() { if(this.cancelable) this.defaultPrevented = true; }
    stopPropagation() { this.stop$propagating = true; }
    stopImmediatePropagation() { this.stop$propagating$immediate = true; }

// deprecated but a lot of people still use it.
    initEvent(t, bubbles, cancel)
    {
// per spec do nothing if we're already dispatched
        if (this.eb$dispatched) return;
        this.type = t;
        this.bubbles = bubbles;
        this.cancelable = cancel;
    }

    initUIEvent(t, bubbles, cancel, unused, detail)
    {
        if (this.eb$dispatched) return;
        this.type = t;
        this.bubbles = bubbles;
        this.cancelable = cancel;
        this.detail = detail;
    }

    initCustomEvent(t, bubbles, cancel, detail)
    {
        if (this.eb$dispatched) return;
        this.type = t, this.bubbles = bubbles;
        this.cancelable = cancel;
        this.detail = detail;
    }
}
swdc(Event);

// various flavors of events; I'm sure there are more than I have here.
class HashChangeEvent extends Event
{
    constructor()
    {
        super("hashchange", {bubbles: false});
        this.eb$captures = false;
    }
}
swdc(HashChangeEvent);

class MouseEvent extends Event
{
    constructor(etype, options)
    {
        super(etype, options);
        setEventOptions(this, options, {
            altKey: false,
            ctrlKey: false,
            shiftKey: false,
            metaKey: false
        });
    }

    initMouseEvent(...args) { this.initEvent(...args); }
}
swdc(MouseEvent);

class KeyboardEvent extends Event
{
    constructor(t,o) { super(t,o); }
}
swdc(KeyboardEvent);

class PromiseRejectionEvent extends Event
{
    constructor(t,o) { super(t,o); }
}
swdc(PromiseRejectionEvent);

class CustomEvent extends Event
{
    constructor(etype, options)
    {
        super(etype, options);
// no idea if the name option is actually valid but based on some js in the wild
        setEventOptions(this, options, {detail: null, name: ""});
        alert3(`customEvent ${etype} opt ${typeof options}`);
    }
}
swdc(CustomEvent);

class XMLHttpRequestEventTarget extends EventTarget
{
    constructor() { super(); }
}
swdc(XMLHttpRequestEventTarget);

class XMLHttpRequestUpload extends XMLHttpRequestEventTarget
{
    constructor() { super(); }
}
swdc(XMLHttpRequestUpload);

// Originally implemented by Yehuda Katz
// And since then, from envjs, by Thatcher et al
class XMLHttpRequest extends EventTarget
{
    constructor()
    {
        super();
        this.headers = {};
        this.responseHeaders = {};
        this.upload = new XMLHttpRequestUpload;
    }

    static {
        const tp = this.prototype;
        // defined by the standard: http://www.w3.org/TR/XMLHttpRequest/#xmlhttprequest
        // but not provided by Firefox.  Safari and others do define it.
        tp.UNSENT = 0;
        tp.OPEN = 1;
        tp.HEADERS_RECEIVED = 2;
        tp.LOADING = 3;
        tp.DONE = 4;

        tp.aborted = false;//non-standard
        tp.withCredentials = true;
        tp.readyState$2 = 0;
        tp.async = false;
        tp.responseText = "";
        tp.response = "";
        tp.responseXML = null;
        tp.status = 0;
        tp.statusText = "";
        tp.eb$mt = null;

    }

    toString (){ return "[object XMLHttpRequest]"; }
    // make sure readyState is readonly
    get readyState() {     return this.readyState$2; }
    overrideMimeType(t) { if(typeof t == "string") this.eb$mt = t; }
}
swdc(XMLHttpRequest);
/* I'm going to set some instance methods, which are currently
in the shared window. I could have set them in the section above.
        tp.open = mw$.xml.open;
But then swdc comes along and tries to wrap that function in a string
    function open() { [native code] }
but it can't because the shared window is frozen and that stuff is readonly
and edbrowse blows up! So I have to put them here, after swdc is called.
We may move all those functions to this page some day, maybe inside this class,
as they are called nowhere else. Then you can delete all this stuff. */
this.xmlp = XMLHttpRequest.prototype;
    xmlp.open = mw$.xml.open;
    xmlp.setRequestHeader = mw$.xml.srh;
    xmlp.getResponseHeader = mw$.xml.grh;
    xmlp.getAllResponseHeaders = mw$.xml.garh;
    xmlp.send = mw$.xml.send;
    xmlp.parseResponse = mw$.xml.parse;
delete this.xmlp;

class Attr
{
    constructor()
    {
        this.ownerDocument = document; this.name = "";
    }
    isId() { return this.name === "id"; }

// This is not use by cloneNode - that calls setAttribute to copy the Attrs.
    cloneNode()
    {
        let w = window;
        // if part of an html element, use its context
        if(this.ownerDocument && this.ownerDocument.defaultView)
            w = this.ownerDocument.defaultView;
        const a = new w.Attr;
        a.name = this.name, a.value = this.value;
        return a
    }

}
swdc(Attr);

class Validity
{
/*********************************************************************
All these should be getters, or should they?
Consider the tooLong attribute.
tooLong could compare the length of the input with the maxLength attribute,
that's what the gettter would do, but edbrowse already does that at entry time.
In general, shouldn't edbrowse check for most r all of these on entry,
so that most of these wouldn't have to do anything?
patternMismatch on email and url, etc.
One thing that always has to be a getter is valueMissing,
cause <input> starts out empty.
*********************************************************************/
    static {
        const tp = this.prototype;
        tp.badInput = tp.customError = tp.patternMismatch =
        tp.rangeOverflow = tp.rangeUnderflow = tp.stepMismatch =
        tp.tooLong = tp.tooShort =
        tp.typeMismatch = false;
    }
    get valueMissing()
    {
        let o = this.owner;
        return o.required && o.value == "";
    }
    get valid()
    {
        // we would only need to check items with getters
        return !(this.valueMissing);
    }
}
swdc(Validity);

/* The other half of the HTMLCollection mechanism as promised. Note that we
proxy the class here rather than a constructed object so we can proxy the
constructor as well as everything else. */
swp("HTMLCollection", new Proxy(mw$.Eb$HTMLCollectionHelper, {
    construct(target, args, new_target)
    {
        // We want to return a proxied version of the created object for our magic getter
        return new Proxy(Reflect.construct(target, args, new_target), {
            /* Trap all get calls, if it's a string use namedItem if a number I assume
            an index so item. Check the instance first in all cases. */
            get(target, property, receiver)
            {
                if (property in target || typeof property == "symbol") return Reflect.get(target, property, receiver);

                let res;
                /* Apparently numeric looking properties are actually passed
                as strings so we have to check if the property converts to a
                number in a way that passes the loose equality test */
                if (Number(property) == property)
                    res = target.item(property);
                else
                    res = target.namedItem(property);

                return (res === null) ? undefined : res;
            },
        })
    }
}))

swp("NodeList", new Proxy(mw$.Eb$NodeListHelper, {
    construct(target, args, new_target)
    {
        return new Proxy(Reflect.construct(target, args, new_target), {
            get(target, property, receiver)
            {
                if (property in target || typeof property == "symbol") return Reflect.get(target, property, receiver);
                let res = target.item(property);
                return (res === null) ? undefined : res;
            },
        })
    }
}))

// Not quite right, still missing, at a minimum, whenDefined and upgrade
class CustomElementRegistry
{
    constructor()
    {
        Object.defineProperty(this, "map", {value: new Map});
    }

    define(name, ctor, options)
    {
        let ext = "";
        if(typeof options == "object" && options.extends) ext = options.extends;
        if(ext) alert3("define custom element " + name + " extends " + ext);
        else alert3("define custom element " + name);
        if (typeof name != "string") throw new DOMException("name is not a string");
        if (!name.match(/.-./)) throw new DOMException(`name ${name} is invalid`);
        if (this.map.has(name)) throw new UnsupportedError(`name ${name} already defined`);
        if (typeof ctor != "function") throw new DOMException("not a function");
        const o = {construct: ctor};
        // what other stuff should we remember in o?
        this.map.set(name, o);
        // check to see if we already have tags of this nature.
        // If so replace them
        let cnt = 0;
        for (const t of gebtn(document, "*", true, false)) {
            if(t.tagName != name) continue;
            // be sure to use createElement, so we get a tag in the C world
            const replacement = document.createElement(name);
            let child;
            while (child = t.firstChild)
                replacement.appendChild(child);

            t.replaceWith(replacement);
            if (t.attributes$2)
                for (const attr of t.attributes)
                    replacement.setAttribute(attr.name, attr.value);

            replacement.connectedCallback$pending = true;
            ++cnt;
        }
        if (cnt)
            alert3(
                `${cnt} ${name} tags already exist; these have been customized retroactively`
            );
    }

    get(name)
    {
        if(typeof name != "string") throw new DOMException("name is not a string");
        /* It looks like we need to allow people to get whatever an return
        undefined if it's not there which'll be the case if the name is invalid.
        Since we're using a map to hold everything there's no risk of using this
        to grab bits of the object hierarchy. */
        const o = this.map.get(name);
        return o ? o.construct : undefined;
    }

    has(name)
    {
        if(typeof name != "string") throw new DOMException("name is not a string");
        return this.map.has(name);
    }

    getName(name)
    {
        if(typeof name != "string") throw new DOMException("name is not a string");
        return this.map.has(name) ? name : null;
    }
}
// create the global custom element registry for the page.
// We don't have scoped custom element registries yet which is fine as it
// isn't fully supported elsewhere
swpv("customElements", new CustomElementRegistry);

// find the constructor for a custom element. This is part of html parsing.
// It is either the original browse, innerHTML, or document.write.
swp("findClass4Tag", function(tagname, above) {
    if(!above) alert4(`searching for custom ${tagname}`);
    else alert4(`searching for custom ${tagname} under ${above.nodeName} ${above.eb$seqno}`);
    let ce = customElements, f, f2;
// see if there is another registry in our scope
    while(above) {
        if(above.custom$Elements) {
            ce = above.custom$elements;
            break;
        }
// don't go up past document
        if(above.nodeType == 9) break;
        above = above.parentNode;
    }
    f = ce.get(tagname);
    if(!f) return new HTMLElement; // revert back to the default constructor
    try {
        f2 = new f;
    } catch(e) {
        alert3(`${tagname} constructor: ${e}`);
        return new HTMLElement;
    }
    Object.defineProperty(f2, "connectedCallback$pending", {value:!!f2.connectedCallback, writable:true})
    return f2;
});

// make sure to wrap global dispatchEvent, so this becomes this window,
// and not the shared window.
swp("dispatchEvent", mw$.dispatchEvent.bind(window))
swp("addEventListener", mw$.addEventListener.bind(window))
swp("removeEventListener", mw$.removeEventListener.bind(window))
// importNode is the same as cloneNode, except it is copying a tree
// of objects from another context into the current context.
// Set the second parameter to true to indicate this.
sdp("importNode", function(start,deep) {
    return mw$.cloneNodeHelper(start,deep, true);
})

// link functions from the shared window into document
sdp("nodeContains", mw$.nodeContains)
sdpc("createNodeIterator", mw$.createNodeIterator)
sdpc("createTreeWalker", mw$.createTreeWalker)
sdpc("eb$xml", false)
sdp("close", eb$voidfunction)
sdp("write", eb$write)
sdp("writeln", eb$writeln)
sdp("hasFocus", eb$hasFocus)
sdp("eb$ctx", eb$ctx)
sdp("eb$seqno", 0)

/* An ok (object keys) function for javascript/dom debugging.
 * This is in concert with the jdb command in edbrowse.
 * I know, it doesn't start with eb$ but I wanted an easy,
 * mnemonic command that I could type in quickly.
 * If a web page creates an ok function it will override this one.
And that does happen, e.g. the react system, so $ok is an alias for this. */
swpc("ok", Object.keys)
swpc("$ok", ok)

swp("nodeName", "WINDOW") // in case you want to start at the top.
sdpc("ownerDocument", null)

// produce a stack for debugging purposes
swp("step$stack", function(){
var s = "you shouldn't see this";
try { 'use strict'; eval("yyz$"); } catch(e) { s = e.stack; }
// Lop off some leading lines that don't mean anything.
for(var i = 0; i<5; ++i)
s = s.replace(/^.*\n/, "");
return s;
})

if(top == window) {
swpc("step$l", 0)
swpc("step$val", "")
swpc("step$go", "")
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

swp("$zct", {}) // counters for trace points
function trace$ch(k) {
var c=($zct[k]>=0?++$zct[k]:($zct[k]=1));
step$val = k+":"+c;
var trip=false;
if(k === step$go||typeof step$exp==='string'&&eval(step$exp)) trip = true;
return trip ? 2 : step$l;
}

sdp("open", function() { return this })

/* Some visual attributes of the window.
 * These are simulations as edbrowse has no screen.
 * Better to have something than nothing at all. */
swp("height", 768)
swp("width", 1024)
swpv("pageXOffset", 0)
swpv("scrollX", 0)
swpv("pageYOffset", 0)
swpv("scrollY", 0)
swpv("devicePixelRatio", 1.0)
// document.status is removed because it creates a conflict with
// the status property of the XMLHttpRequest implementation
swp("defaultStatus", 0)
swp("returnValue", true)
swpv("menubar", mw$.generalbar)
swpv("statusbar", mw$.generalbar)
swpv("scrollbars", mw$.generalbar)
swpv("toolbar", mw$.generalbar)
swpv("personalbar", mw$.generalbar)
swp("resizable", true)
swp("directories", false)
if(window == top) {
swpv("name", "unspecifiedFrame")
} else {
odp(window, "name", {get:function(){return frameElement.name}});
// there is no setter here, should there be? Can we set name to something?
// Should it propagate back up to the frame element name?
}

sdp("bgcolor", "white")
sdp("contentType", "text/html")
function readyStateComplete() {
    document.readyState$2 = "complete"; document.activeElement = document.body;
    let e = new Event;
    e.initEvent("readystatechange", true, true);
    document.dispatchEvent(e);
}

swpv("screen", {
height: 768, width: 1024,
availHeight: 768, availWidth: 1024, availTop: 0, availLeft: 0,
colorDepth: 24})

swp("console", {
debug: function(obj) { mw$.logtime(3, "debug", obj)},
log: function(obj) { mw$.logtime(3, "log", obj)},
info: function(obj) { mw$.logtime(3, "info", obj)},
warn: function(obj) { mw$.logtime(3, "warn", obj)},
error: function(obj) { mw$.logtime(3, "error", obj)},
timeStamp: function(label) { if(label === undefined) label = "x"; return label.toString() + (new Date).getTime(); }
})

swpv("navigator", {})
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
swpv("history", {
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

swp("CSS", mw$.CSS)
swp("Intl", mw$.Intl)

// Some members under document that are shorthand for getElementsByTagName
sdp("links", document.getElementsByTagName("a|area"))
sdp("forms", document.getElementsByTagName("form"))
sdp("scripts", document.getElementsByTagName("script"))
sdp("images", document.getElementsByTagName("img"))
// styleSheets is a placeholder for now; I don't know what to do with it.
sdp("styleSheets", [])

swpc("frames$2", []);
swpv("frames", {})
odp(frames, "length", {get:function(){return frames$2.length}})
odp(window, "length", {get:function(){return frames$2.length},enumerable:true})

// pending jobs, mostly to debug promise functions.
swp("$pjobs", [])
swp("$pjobsa", [])
swpc("promiseCatchFunctionNative", eb$voidfunction)
swp("promiseCatchFunction", function(e) {
// use alert 3 so this will fold into the debug stream,  db>debug.log
alert3("promise error");
alert3(e);
alert3(e.stack);
// call the original native catch function, which sets up for
// promise.catch(), which the web page may be expecting.
return promiseCatchFunctionNative(e);
})

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

// the performance registry
swp("pf$registry", {mark:{},measure:{},measure0:{},resourceTiming:{}})
odp(pf$registry, "measure0", {enumerable:false});
swpv("Performance", function(){})
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
swp("PerformanceObserver", {
supportedEntryTypes: {
// no types are supported
includes: eb$falsefunction
}
})

swp("onmessage$$queue", []);
swpv("postMessage", function (message,target_origin, transfer) {
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
        const me = {};
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
swp("onmessage$$running", mw$.onmessage$$running)

// this is sort of an array and sort of not.
// For one thing, you can call setAttribute("length", "snork"), so I can't use length.
swp("NamedNodeMap", function() { this.length = 0})
swpp("NamedNodeMap", null)
NamedNodeMap.prototype.push = function(s) { this[this.length++] = s; }
NamedNodeMap.prototype.item = function(n) { return this[n]; }
NamedNodeMap.prototype.getNamedItem = function(name) { return this[name.toLowerCase()]; }
NamedNodeMap.prototype.setNamedItem = function(name, v) { this.owner.setAttribute(name, v);}
NamedNodeMap.prototype.removeNamedItem = function(name) { this.owner.removeAttribute(name);}

swp("MediaQueryList", function() {
    this.matches = false;
    this.media = "";
});
swpp("MediaQueryList", null)
MediaQueryList.prototype.addEventListener = mw$.addEventListener;
MediaQueryList.prototype.removeEventListener = mw$.removeEventListener;
MediaQueryList.prototype.nodeName = "MediaQueryList";
MediaQueryList.prototype.addListener = function(f) { this.addEventListener("mediaChange", f, false); };
MediaQueryList.prototype.removeListener = function(f) { this.removeEventListener("mediaChange", f, false); };

swpv("matchMedia", function(s) {
var q = new MediaQueryList;
q.media = s;
q.matches = eb$media(s);
return q;
})


sdp("implementation", {
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

// a simpler version of handlerCompile, for setTimeout().
// We don't need to bind to this or return a value.
swp("handlerCompile",  function(f) {
let cf; // the compiled function
try {
cf = eval(`(function(){${f}})`);
} catch(e) {
cf = eval("(function(){})");
alert3("timeout syntax error <" + f + ">");
}
cf.body = f;
cf.toString = function() { return this.body; }
return cf;
})

// Request, Response, Headers, fetch; link to third party code in master window.
// fetch calls XMLHttpRequest, but puts the Response in a Promise
for(let f of [
"Headers", "Request", "Response", "fetch",
"alert", "showarg", "showarglist"])
    swpc(f, mw$[f]);

// pages seem to want document.style to exist
sdp("style", new CSSStyleDeclaration)
document.style.element = document;
document.style.bgcolor = "white";

// originally ms extension pre-DOM, we don't fully support it
//but offer the legacy document.all.tags method.
sdp("all", {})
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

swp("eb$demin", mw$.deminimize)
swp("eb$watch", mw$.addTrace)
/*
swp("$uv", [])
swp("$uv$sn", 0)
*/
swpc("$jt$c", 'z')
swpc("$jt$sn", 0)

// Local storage, this is per window.
// Then there's sessionStorage, and honestly I don't understand the difference.
// This is NamedNodeMap, to take advantage of preexisting methods.
swp("localStorage", {})
swp("sessionStorage", {})
; (function() {
var cnlist = [localStorage, sessionStorage];
for(let cn of cnlist) {
odp( cn, "attributes", { get: function(){ if(!this.attributes$2) {
Object.defineProperty(this, "attributes$2", {value:new NamedNodeMap})
this.attributes$2.owner = this
this.attributes$2.ownerDocument = my$doc()
}
return this.attributes$2}})
// tell me we don't have to do NS versions of all these.
cn.getAttribute = cn.getItem = Element.prototype.getAttribute;
cn.setAttribute = cn.setItem = Element.prototype.setAttribute;
cn.removeAttribute = cn.removeItem = Element.prototype.removeAttribute;
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
swpc("location$2", new URL)
odp(location$2, "origin", {get:function(){
return this.protocol ? this.protocol + "//" + this.host : null}});
odp(window, "origin", {get: function(){return location.origin}});
sdp("location$2", new URL)
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

// nasa.gov and perhaps other sites check for self.constructor == Window.
// That is, Window should be the constructor of window.
// The constructor is Object by default.
swp("constructor", Window)

swp("eb$qs$start", function() {
    // html parsed, rebuild the HTMLCollections under document
    markAllCollections();
    // now gather the css rules for inject before after
    mw$.cssGather(true);
    mw$.frames$rebuild(window);
})
swp("frames$rebuild", function() {mw$.frames$rebuild(window);})

swp("DOMParser", mw$.DOMParser)

swp("XMLSerializer", function(){})
XMLSerializer.prototype.serializeToString = function(root) {
alert3("trying to use XMLSerializer");
return "<div>XMLSerializer not yet implemented</div>"; }

swpc("css$ver", 0)
swpc("css_all", "")
swpc("last$css_all", "")
swpc("cssSource", [])
sdp("xmlVersion", 0)

swp("MutationObserver", function(f) {
    // We need to know what window we're in to queue the callback microtask
    this.observed$window = my$win();
    if (typeof f !== "function") throw new TypeError("not a function");
    this.callback = f;
    this.active = false;
    this.targets = new Eb$IterableWeakMap;
    this.async = true; // run as microtask by default
    this.notification$queue = [];
})
swpp("MutationObserver", null)
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
    /* Not sure if this ever happens in the wild but protect against someone
        accidentally externally altering the config for an observed target as
        the config is passed in by reference.
    */
    const cfg_copy = structuredClone(cfg);
    if (!this.observe$target(target, cfg_copy)) return; // unobservable
    if(cfg_copy.subtree)
        this.observe$subtree(target, cfg_copy);
}
MutationObserver.prototype.observe$target = function (target, cfg, dbg=alert3) {
    // May have other valid targets so don't disconnect
    if(typeof cfg != "object" || !(target instanceof Node))
        throw new TypeError("invalid argument types");
    // Are there other unobservable elements?
    if (target.nodeName && target.nodeName == "TEMPLATE") {
        dbg(`not observing ${target.dom$class} tag ${target.eb$seqno} config ${JSON.stringify(cfg)}`)
        return false;
    }
    dbg(`observing ${target.dom$class} tag ${target.eb$seqno} config ${JSON.stringify(cfg)}`)
    this.targets.set(target, cfg);
    this.active = true;
    if (!target.eb$observers) {
        dbg("Attaching first observer");
        Object.defineProperty(target, "eb$observers", {value: new Set});
    }
    target.eb$observers.add(this);
    return true;
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
        if (!this.targets.has(n))
            if (!this.observe$target(n, cfg, alert4)) continue;
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

swp("MutationRecord", function(){})
swpp("MutationRecord", null)
MutationRecord.prototype.oldValue = null;
MutationRecord.prototype.nextSibling = null;
MutationRecord.prototype.previousSibling = null;
swpv("crypto", {})
crypto.getRandomValues = function(a) {
if(typeof a != "object") return NULL;
var l = a.length;
for(var i=0; i<l; ++i) a[i] = Math.floor(Math.random()*0x100000000);
return a;
}

swpc("ra$step", 0)
swpv("requestAnimationFrame", function() {
// This absolutely doesn't do anything. What is edbrowse suppose to do with animation?
return ++ra$step;
})

swpv("cancelAnimationFrame", eb$voidfunction)

// link in the blob code
swp("Blob", mw$.Blob)
swp("File", mw$.File)
swp("FileReader", mw$.FileReader)
URL.createObjectURL = mw$.URL.createObjectURL
URL.revokeObjectURL = mw$.URL.revokeObjectURL
swp("FormData", mw$.FormData)
swp("TextEncoder", mw$.TextEncoder)
swp("TextDecoder", mw$.TextDecoder)
swp("MessagePort", mw$.MessagePort)
swp("MessageChannel", mw$.MessageChannel)
swp("mp$registry", []) // MessagePort registry
swpc("URLSearchParams", mw$.URLSearchParams)

swp("trustedTypes", function(){})
trustedTypes.createPolicy = function(pn,po){
var x = {policyName: pn};
for (var i in po) { x[i] = po[i]}
return x;
}
swp("AbortSignal", function(){})
AbortSignal.prototype = new EventTarget;
AbortSignal.prototype.aborted = false;
AbortSignal.prototype.reason = 0;
AbortSignal.prototype.throwIfAborted = eb$voidfunction;
AbortSignal.abort = function(){ var c = new AbortSignal(); c.aborted = true; return c; }
AbortSignal.timeout = function(ms){ var c = new AbortSignal();
// this is suppose to abort after a timeout period but I don't know how to do that
if(typeof ms == "number") alert3("abort after " + ms + "ms not implemented");
return c; }

swp("AbortController", function(){})
odp(AbortController.prototype, "signal",
{get:function(){return new AbortSignal}});
AbortController.prototype.abort = function(){
alert3("abort dom request not implemented"); }

swp("IntersectionObserverEntry", function(){})
swp("IntersectionObserver", function(callback, o){
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
swp("ResizeObserver", function(){})
ResizeObserver.prototype.disconnect = eb$voidfunction;
ResizeObserver.prototype.observe = eb$voidfunction;
ResizeObserver.prototype.unobserve = eb$voidfunction;

// Fallback stuff now implemented in quickjs-ng
// quickjs-ng has built-in (and alterable) DOMException these days
if (!window.DOMException) {
    alert3("Using fallback for DOMException");
    /* Apparently people want to muck with DOMException so can't be shared as
    otherwise we end up with read-only prototype chain issues */
    window.DOMException = function(message, name) {
        this.message = message
        this.name = name
        var error = Error(message)
        this.stack = error.stack
    }
    window.DOMException.prototype = Object.create(Error.prototype)
    window.DOMException.prototype.constructor = DOMException
}

// don't need these any more
;(function() {
    let names_to_delete = [
    "swgs", "swp", "swpv", "swpc", "swpp",
    "sdp", "sdpc", "swdc", "swde"];
    for (let k of names_to_delete) delete window[k]
})();
