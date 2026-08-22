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
this.eb$frameElement = function() { return this}
this.eb$getter_cd = function() { return null}
this.eb$getter_cw = function() { return null}
    this.querySelector0 = () => {};
    this.resolveURL = (base, h) => h;
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
    this.mw$.dispatchEvent = () => undefined;
    this.mw$.addEventListener = () => undefined;
    this.mw$.removeEventListener = () => undefined;
    this.mw$.getComputedStyle = () => {};
    this.mw$.structuredClone = () => {};
    this.mw$.attr = {};
    this.mw$.setupClasses = () => {};
// classes that setupClasses would have built, but didn't.
    this.URL = function(){}
    this.Node = function(){}
    this.Element = function(){}
    this.Window = function(){}
    this.EventTarget = function(){}
    this.CSSStyleDeclaration = function(){}
        this.document.getElementsByTagName = (t)=>[];
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
"standard_events", "standard_event_classes", "standard_hashchange_classes",
"dataCamel",
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
        const div = d.createElement('div')
        div.innerHTML = this.inner$HTML;
        let o = div.outerHTML;
        // strip off <div> and </div>
        const l = o.length;
        return o.substr(5, l-11);
        */
        return this.inner$HTML;
    }
    set innerHTML(h) {
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

}
swdc(Node);

this.eb$push$attributes = false;

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

for(let k of [
    "attachShadow"])
   eval(`Object.defineProperty(Element.prototype.${k}, "toString", {value: ()=>{return "function ${k}() {\\n    [native code]\\n}"}})`);

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

for(const e of [
["SVGElement","Element"],
["SVGGraphicsElement","SVGElement"],
["SVGTitleElement","SVGElement"],
["SVGStyleElement","SVGElement"],
["SVGStopElement","SVGElement"],
["SVGMaskElement","SVGElement"],
["SVGGradientElement","SVGElement"],
["SVGLinearGradientElement","SVGGradientElement"],
["SVGGeometryElement","SVGGraphicsElement"],
["SVGDefsElement","SVGGraphicsElement"],
["SVGUseElement","SVGGraphicsElement"],
["SVGPolygonElement","SVGGeometryElement"],
["SVGRectElement","SVGGeometryElement"],
["SVGEllipseElement","SVGGeometryElement"],
["SVGGElement","SVGGraphicsElement"],
["SVGSVGElement","SVGGraphicsElement"],
["SVGPathElement","SVGGeometryElement"],
])
    eval(`class ${e[0]} extends ${e[1]} { constructor() { super(); } }; swdc(${e[0]});`);

// these have node type 1, just like HTMLElement.
SVGElement.prototype.nodeType = 1;

// The html element, which spanws the DOM nodes that you know and love.
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

// At this point we have defined the HTMLElements.
// Here are classes that don't support innerHTML.
// Overwrite the innerHTML setter so it doesn't do anything.
for(let c of [
DocType, HTMLMetaElement, HTMLLinkElement, HTMLTitleElement,
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
swp("z$URL", URL)

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
So here is the line that does a lot, including the creation of the document object,
which is an instance of Document, as it should be.
*********************************************************************/

mw$.setupClasses(window);

/*********************************************************************
window is and must remain the global object.
Plenty of sites set window.foo = something, then refer to foo.
Conversely, plenty of sites set bar = something, then refer to window.bar.
There is no compromise on this matter.
At the same time, window has to be an instance of Window,
has to be an instance of EventTarget.
This line accomplishes that, and so far I haven't seen any side effects.
I hope I never do, because I can't think of any other way.
*********************************************************************/

Object.setPrototypeOf(window, Window.prototype)

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

/* quickjs-ng has a native implementation of queueMicrotask but quickjs
doesn't currently */
if (!window.queueMicrotask) {
    alert3("Using fallback for queueMicrotask");
    swpv("queueMicrotask", function(f) {
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

// quickjs-ng now has its own base64 handling
if (!window.atob) {
    alert3("Using fallback for atob and btoa");
// if we're using our code for one we should for the other as well
    swpc("atob", mw$.atob)
    swpc("btoa", mw$.btoa)
}
// don't need these any more
;(function() {
    let names_to_delete = [
    "swgs", "swp", "swpv", "swpc", "swpp",
    "sdp", "sdpc", "swdc", "swde"];
    for (let k of names_to_delete) delete window[k]
})();
