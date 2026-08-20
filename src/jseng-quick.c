/*********************************************************************
This is the back-end process for javascript.
We receive calls from edbrowse,
getting and setting properties for various DOM objects.
This is the quick js-ng version.
If you revert back to quickjs, which was the original project,
you will need to change the #include from quickjs.h to quickjs-libc.h,
and include the context with every JS_IsArray() call.
The ng fork determined, correctly, that the context is not used,
and dropped it as a parameter.
These changes are reflected in the symbol Q_NG, which should be 1 or 0.
Thus it can be set by gcc -D to overwrite the default of 1.
*********************************************************************/

#ifndef Q_NG
#define Q_NG 1
#endif

#include "eb.h"

#include <malloc.h>
#include <stddef.h>
#include <sys/utsname.h>

#if Q_NG
#include "quickjs.h"
#define wrap_IsArray(c,a) JS_IsArray(a)
#else
#include "quickjs-libc.h"
#define wrap_IsArray(c,a) JS_IsArray(c,a)
#endif

static JSRuntime *jsrt;

/*********************************************************************
JS_FreeValue takes context as an argument,
but only uses it to find the runtime that owns it.
The heap lives in the runtime, not in each context.

void JS_FreeValue(JSContext *ctx, JSValue v)
{
    JS_FreeValueRT(ctx->rt, v);
}

Edbrowse has only one quickjs runtime.
Every context is owned by jsrt, points to jsrt, and we can skip that step.
Also, a bug crept in where the context pointer was null.
reexpandFrame() in http.c tried to replace a frame
and the new web page didn't come in.
The old context was freed and a new one was not created, leaving cx = null.
The next JS_FreeValue call bounced off a null pointer and blew up.
Such bugs can be avoided by simply using jsrt all the time.

Define LEAK if you want to track down memory leaks relative to the
quickjs heap.
Warning, if you turn this feature on it slows things down, a lot!
Also, I haven't used it in years so not sure if we've kept up with it.
*********************************************************************/

#ifdef LEAK
// the quick js pointer
struct qjp { struct qjp *next; void *ptr; short count; short lineno; };
typedef struct qjp QJP;
static QJP *qbase;

static void grab2(JSValueConst v, int lineno)
{
	QJP *s, *s2 = 0;
	void *p;
	if(!JS_IsObject(v))
		return;
	p = JS_VALUE_GET_PTR(v);
	debugPrint(7, "%p<%d", p, lineno);
// this isn't efficient at all, but probably won't be in the production system
	for(s=qbase; s; s=s->next) {
		if(s->ptr == p && s->lineno == lineno) {
			++s->count;
			return;
		}
		s2 = s;
	}
	s = (QJP*) allocMem(sizeof(QJP));
	s->count = 1, s->ptr = p, s->next = 0, s->lineno = lineno;
	if(s2)
		s2->next = s;
	else
		qbase = s;
}

static void trackPointer(void *p)
{
	QJP *s;
	for(s = qbase; s; s = s->next)
		if(!p || s->ptr == p) {
			char mult[8];
			int z = s->count;
			char c = (z > 0 ? '<' : '>');
			if(z < 0)
				z = -z;
			mult[0] = 0;
			if(z > 1)
				sprintf(mult, "*%d", z);
			debugPrint(3, "%p%c%d%s", s->ptr, c, s->lineno, mult);
		}
}

static void release2(JSValueConst v, int lineno)
{
	QJP *s, *s2 = 0, *s3;
	int n = 0;
	bool adjusted = false;
	void *p;
	if(!JS_IsObject(v))
		return;
	p = JS_VALUE_GET_PTR(v);
	debugPrint(7, "%p>%d", p, lineno);
	for(s=qbase; s; s=s->next) {
		if(s->ptr == p && s->lineno == lineno) {
			--s->count;
			adjusted = true;
		}
		if(p == s->ptr)
			n += s->count;
		s2 = s;
	}

	if(adjusted)
		goto check_n;

	s = (QJP*) allocMem(sizeof(QJP));
	s->count = -1, s->ptr = p, s->next = 0, s->lineno = lineno;
	--n;
	if(s2)
		s2->next = s;
	else
		qbase = s;

check_n:
	if(n < 0) {
		  debugPrint(1, "quick js pointer underflow, edbrowse is probably going to abort.");
		trackPointer(p);
	}

if(n)
		return;

// this release balances the calls to this pointer, clear them out
	s2 = 0;
	for(s = qbase; s; s = s3) {
		s3 = s->next;
		if(s->ptr == p) {
			if(s2)
				s2->next = s3;
			else
				qbase = s3;
			free(s);
			continue;
		}
		s2 = s;
	}
}

static void grabover(void)
{
	if(qbase) {
		  debugPrint(1, "quick js pointer overflow, edbrowse is probably going to abort.");
		trackPointer(0);
	}
}

#define grab(v) grab2(v, __LINE__)
#define release(v) release2(v, __LINE__)
#define JS_Release(v) release(v),JS_FreeValueRT(jsrt, v)
#else
#define grab(v)
#define release(v)
#define grabover()
#define JS_Release(v) JS_FreeValueRT(jsrt, v)
#endif

const char *jsSourceFile;	// sourcefile providing the javascript
int jsLineno;			// line number
static int js_eval_flag = JS_EVAL_TYPE_GLOBAL; // global, module etc
static bool js_running;
static JSContext *mwc; // master window context
static JSContext *freeing_context = NULL;

// Find window and frame based on the js context. Set cw and cf accordingly.
// This is inefficient, but is not called very often.
static bool frameFromContext(jsobjtype cx)
{
    int i;
    Window *w;
    Frame *f;
    if(cx == mwc) return false; // should never happen
    for (i = 1; i <= maxSession; ++i) {
        for (w = sessionList[i].lw; w; w = w->prev) {
            for (f = &(w->f0); f; f = f->next) {
                if(f->cx == cx) {
                    cf = f, cw = w;
                    return true;
                }
            }
        }
    }
    return false;
}

static void processError(JSContext * cx);
static void uptrace(JSContext * cx, JSValueConst node);
static bool jsCheckAndThrow(JSContext * cx);
#define jsInterruptCheck(cx) if(jsCheckAndThrow(cx)) return JS_EXCEPTION
static Tag *tagFromObject(JSContext *cx, JSValueConst v);
static int run_function_onearg(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child);
static bool run_event(JSContext *cx, JSValueConst obj, const char *evname);

// The level 0 functions live right next to the engine, and in the interest
// of encapsulation, they should not be called outside of this file.
// Thus they are static.
// Some wrappers around these end in _t, with a tag argument,
// and these are global and can be called from outside.
// Other wrappers end in _win for window or _doc for document.

// determine the type of the element managed by JSValue
static enum ej_proptype top_proptype(JSContext *cx, JSValueConst v)
{
	double d;
	int n;
	if(JS_IsNull(v))
		return EJ_PROP_NULL;
	if(wrap_IsArray(cx, v))
		return EJ_PROP_ARRAY;
	if(JS_IsFunction(cx, v))
		return EJ_PROP_FUNCTION;
	if(JS_IsBool(v))
		return EJ_PROP_BOOL;
	if(JS_IsNumber(v)) {
		JS_ToFloat64(cx, &d, v);
		n = d;
		return (n == d ? EJ_PROP_INT : EJ_PROP_FLOAT);
	}
	if(JS_IsString(v))
		return EJ_PROP_STRING;
	if(JS_IsObject(v))
		return EJ_PROP_OBJECT;
	return EJ_PROP_NONE;	// don't know
}

static enum ej_proptype typeof_property(JSContext *cx, JSValueConst parent, const char *name)
{
	JSValue v = JS_GetPropertyStr(cx, parent, name);
	enum ej_proptype l = top_proptype(cx, v);
	grab(v);
	JS_Release(v);
	return l;
}

enum ej_proptype typeof_property_t(const Tag *t, const char *name)
{
if(!t->jslink || !allowJS)
return EJ_PROP_NONE;
return typeof_property(t->f0->cx, *((JSValue*)t->jv), name);
}

/* Return a property as a string, if it is
 * string compatible. The string is allocated, free it when done. */
static char *get_property_string(JSContext *cx, JSValueConst parent, const char *name)
{
	JSValue v = JS_GetPropertyStr(cx, parent, name);
	const char *s;
	char *s0 = NULL;
	enum ej_proptype proptype = top_proptype(cx, v);
	grab(v);
	if (proptype != EJ_PROP_NONE) {
		s = JS_ToCString(cx, v);
		s0 = cloneString(s);
		JS_FreeCString(cx, s);
		if (!s0)
			s0 = emptyString;
	}
	JS_Release(v);
	return s0;
}

char *get_property_string_t(const Tag *t, const char *name)
{
if(!t->jslink || !allowJS)
return 0;
return get_property_string(t->f0->cx, *((JSValue*)t->jv), name);
}

static bool get_property_bool(JSContext *cx, JSValue parent, const char *name)
{
	JSValue v = JS_GetPropertyStr(cx, parent, name);
	bool b = false;
	grab(v);
	if(JS_IsBool(v))
		b = JS_ToBool(cx, v);
	if(JS_IsNumber(v)) {
// 0 is false all others are true.
		int32_t n = 0;
		JS_ToInt32(cx, &n, v);
		b = !!n;
	}
	JS_Release(v);
	return b;
}

bool get_property_bool_t(const Tag *t, const char *name)
{
if(!t->jslink || !allowJS)
return false;
return get_property_bool(t->f0->cx, *((JSValue*)t->jv), name);
}

static int get_property_number(JSContext *cx, JSValueConst parent, const char *name)
{
	JSValue v = JS_GetPropertyStr(cx, parent, name);
	int32_t n = -1;
	grab(v);
	if(JS_IsNumber(v))
// This will truncate if the number is floating point, I think
		JS_ToInt32(cx, &n, v);
	JS_Release(v);
	return n;
}

int get_property_number_t(const Tag *t, const char *name)
{
if(!t->jslink || !allowJS)
return -1;
return get_property_number(t->f0->cx, *((JSValue*)t->jv), name);
}

// This returns 0 if there is no such property, or it isn't an object.
// should this return 0 for null, which is tehcnically an object?
// How bout function or array?
// The object returned is a duplicate and must be freed.
static JSValue get_property_object(JSContext *cx, JSValueConst parent, const char *name)
{
	JSValue v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(JS_IsObject(v))
		return v;
	JS_Release(v);
	return JS_UNDEFINED;
}

// return -1 for error
static int get_arraylength(JSContext *cx, JSValueConst a)
{
	if(!wrap_IsArray(cx, a))
		return -1;
	return get_property_number(cx, a, "length");
}

// quick seems to have no direct way to access a.length or a[i],
// so I just access a[7] like 7 is a property, and hope it works.
static JSValue get_array_element_object(JSContext *cx, JSValue parent, int idx)
{
	JSAtom a = JS_NewAtomUInt32(cx, idx);
	JSValue v = JS_GetProperty(cx, parent, a);
	grab(v);
	JS_FreeAtom(cx, a);
	return v;
}

/* Get the url from a url object, special wrapper.
 * Owner object is passed, look for obj.href, obj.src, or obj.action.
 * Return that if it's a string, or its member href if it is a url.
 * The result, coming from get_property_string, is allocated. */
static char *get_property_url(JSContext *cx, JSValueConst owner, bool action)
{
	enum ej_proptype mtype;	/* member type */
	JSValue uo = JS_UNDEFINED;	/* url object */
	char *s;
	if (action) {
		mtype = typeof_property(cx, owner, "action");
		if (mtype == EJ_PROP_STRING)
			return get_property_string(cx, owner, "action");
		if (mtype != EJ_PROP_OBJECT)
			return 0;
		uo = get_property_object(cx, owner, "action");
	} else {
		mtype = typeof_property(cx, owner, "href");
		if (mtype == EJ_PROP_STRING)
			return get_property_string(cx, owner, "href");
		if (mtype == EJ_PROP_OBJECT)
			uo = get_property_object(cx, owner, "href");
		else if (mtype)
			return 0;
		if (JS_IsUndefined(uo)) {
			mtype = typeof_property(cx, owner, "src");
			if (mtype == EJ_PROP_STRING)
				return get_property_string(cx, owner, "src");
			if (mtype == EJ_PROP_OBJECT)
				uo = get_property_object(cx, owner, "src");
		}
	}
	if (JS_IsUndefined(uo))
		return 0;
// Don't use href$val, that's our baby, and lots of websites overload the URL
// class with their own, which doesn't have the internal workings of ours.
	s = get_property_string(cx, uo, "href");
	JS_Release(uo);
	return s;
}

char *get_property_url_t(const Tag *t, bool action)
{
if(!t->jslink || !allowJS)
return 0;
return get_property_url(t->f0->cx, *((JSValue*)t->jv), action);
}

char *get_style_string_t(const Tag *t, const char *name)
{
	JSContext *cx = t->f0->cx;
	JSValue so; // style object
	char *result;
	if(!t->jslink || !allowJS)
		return 0;
	so = get_property_object(cx, *((JSValue*)t->jv), "style$2");
	if(JS_IsUndefined(so))
		return 0;
	result = get_property_string(cx, so, name);
	JS_Release(so);
	return result;
}

static JSValue nat_set_innerHTML(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    jsInterruptCheck(cx);
    const char *h = JS_ToCString(cx, argv[1]);
    Tag *t = tagFromObject(cx, argv[0]);
    if(t) {
        html_from_setter(t, h);
    } else {
        debugPrint(1, "innerHTML finds no tag, cannot parse");
    }
    JS_FreeCString(cx, h);
    (void) this;
    return JS_UNDEFINED;
}

static JSValue nat_set_value(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	debugPrint(5, "setter v in");
    Tag *t = tagFromObject(cx, argv[0]);
    if(t) {
        const char *h = JS_ToCString(cx, argv[1]);
        char *k = cloneString(h); // our own copy
        JS_FreeCString(cx, h);
        debugPrint(4, "value tag %d=%s", t->seqno, k);
        if(t->itype != INP_TA || t->lic < 0)
            prepareForField(k);
        domSetsTagValue(t, k);
        nzFree(k);
    }
    debugPrint(5, "setter v out");
    return JS_UNDEFINED;
}

static void set_property_string(JSContext *cx, JSValueConst parent, const char *name,
			    const char *value)
{
    const char *altname = 0;
    if (stringEqual(name, "value")) {
        // from C, we don't go through the value setter function
        // check for input or textarea
        JSValue dc = JS_GetPropertyStr(cx, parent, "dom$class");
        grab(dc);
        const char *dcs = JS_ToCString(cx, dc);
        if(stringEqual(dcs, "HTMLInputElement") ||
        stringEqual(dcs, "HTMLTextAreaElement"))
            altname = "val$ue";
        JS_FreeCString(cx, dcs);
        JS_Release(dc);
    }
    if (!value) value = emptyString;
    JS_SetPropertyStr(cx, parent, (altname ? altname : name), JS_NewAtomString(cx, value));
}

void set_property_string_t(const Tag *t, const char *name, const char * v)
{
	if(!t->jslink || !allowJS)
		return;
	set_property_string(t->f0->cx, *((JSValue*)t->jv), name, v);
}

void set_property_string_win(const Frame *f, const char *name, const char *v)
{
	set_property_string(f->cx, *((JSValue*)f->winobj), name, v);
}

void set_property_string_doc(const Frame *f, const char *name, const char *v)
{
	set_property_string(f->cx, *((JSValue*)f->docobj), name, v);
}

// define property as a string but make it not enumerable
static void define_hidden_property_string(JSContext *cx, JSValueConst parent, const char *name,
			    const char *value)
{
	if (!value)
		value = emptyString;
	JS_DefinePropertyValueStr(cx, parent, name,
	JS_NewAtomString(cx, value),
	JS_PROP_WRITABLE|JS_PROP_CONFIGURABLE);
}

void define_hidden_property_string_t(const Tag *t, const char *name, const char * v)
{
	if(!t->jslink || !allowJS)
		return;
	define_hidden_property_string(t->f0->cx, *((JSValue*)t->jv), name, v);
}

static void set_property_bool(JSContext *cx, JSValueConst parent, const char *name, bool n)
{
	JS_SetPropertyStr(cx, parent, name, JS_NewBool(cx, n));
}

void set_property_bool_t(const Tag *t, const char *name, bool v)
{
	if(!t->jslink || !allowJS)
		return;
	set_property_bool(t->f0->cx, *((JSValue*)t->jv), name, v);
}

void set_property_bool_win(const Frame *f, const char *name, bool v)
{
	set_property_bool(f->cx, *((JSValue*)f->winobj), name, v);
}

void set_property_bool_doc(const Frame *f, const char *name, bool v)
{
	set_property_bool(f->cx, *((JSValue*)f->docobj), name, v);
}

static void set_property_object(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child);
void set_property_object_doc(const Frame *f, const char *name, const Tag *t2)
{
	if (!allowJS || !t2->jslink)
		return;
	set_property_object(f->cx, *((JSValue*)f->docobj), name, *((JSValue*)t2->jv));
}

static void set_property_number(JSContext *cx, JSValueConst parent, const char *name, int n)
{
	JS_SetPropertyStr(cx, parent, name, JS_NewInt32(cx, n));
}

void set_property_number_t(const Tag *t, const char *name, int v)
{
	if(!t->jslink || !allowJS)
		return;
	set_property_number(t->f0->cx, *((JSValue*)t->jv), name, v);
}

// the next two functions duplicate the object value;
// you are still responsible for the original.
static void set_property_object(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child)
{
	JS_SetPropertyStr(cx, parent, name, JS_DupValue(cx, child));
}

void set_property_object_t(const Tag *t, const char *name, const Tag *t2)
{
	if (!allowJS || !t->jslink || !t2->jslink)
		return;
	set_property_object(t->f0->cx, *((JSValue*)t->jv), name, *((JSValue*)t2->jv));
}

static void set_array_element_object(JSContext *cx, JSValueConst parent, int idx, JSValueConst child)
{
// do we even need the atom, I don't know what an atom is
	JSAtom a = JS_NewAtomUInt32(cx, idx);
	JS_SetProperty(cx, parent, a, JS_DupValue(cx, child));
	JS_FreeAtom(cx, a);
}

static void delete_property(JSContext *cx, JSValueConst parent, const char *name)
{
	JSAtom a = JS_NewAtom(cx, name);
	JS_DeleteProperty(cx, parent, a, 0);
	JS_FreeAtom(cx, a);
}

void delete_property_t(const Tag *t, const char *name)
{
	if(!t->jslink || !allowJS)
		return;
	delete_property(t->f0->cx, *((JSValue*)t->jv), name);
}

void delete_property_win(const Frame *f, const char *name)
{
	if(!f->jslink || !allowJS)
		return;
	delete_property(f->cx, *((JSValue*)f->winobj), name);
}

void delete_property_doc(const Frame *f, const char *name)
{
	if(!f->jslink || !allowJS)
		return;
	delete_property(f->cx, *((JSValue*)f->docobj), name);
}

// The instantiate function takes an optional parent and name,
// to hand the instantiated thing on, if you wish.
// This is part convenience and part legacy.
static JSValue instantiate(JSContext *cx, JSValueConst parent, const char *name,
			  const char *classname)
{
	JSValue o; // the new object
	if (!classname) {
		debugPrint(5, "new Object");
		o = JS_NewObject(cx);
		grab(o);
	} else {
		debugPrint(5, "new %s", classname);
		JSValue g= *(JSValue*)cf->winobj;
		JSValue v, l[1];
		v = JS_GetPropertyStr(cx, g, classname);
		grab(v);
		if(!JS_IsFunction(cx, v)) {
			debugPrint(3, "no such class %s", classname);
			JS_Release(v);
			return JS_UNDEFINED;
		}
// l, the array of args, isn't initialized to anything,
// but we are passing 0 for argc, so it shouldn't even look at l.
		o = JS_CallConstructor(cx, v, 0, l);
		grab(o);
		JS_Release(v);
		if(JS_IsException(o)) {
			if (intFlag)
				i_puts(MSG_Interrupted);
			processError(cx);
			debugPrint(3, "failure on new %s()", classname);
			uptrace(cx, parent);
			JS_Release(o);
			return JS_UNDEFINED;
		}
	}
	if(name)
		set_property_object(cx, parent, name, o);
	return o;
}

static JSValue instantiate_array_element(JSContext *cx, JSValueConst parent, int idx,
					const char *classname)
{
	JSValue o; // the new object
	if (!classname) {
		o = JS_NewObject(cx);
		debugPrint(5, "new Object for %d", idx);
		grab(o);
	} else {
		debugPrint(5, "new %s for %d", classname, idx);
		JSValue g = *(JSValue*)cf->winobj;
		JSValue v, l[1];
		v = JS_GetPropertyStr(cx, g, classname);
		grab(v);
		if(!JS_IsFunction(cx, v)) {
			debugPrint(3, "no such class %s", classname);
			JS_Release(v);
			return JS_UNDEFINED;
		}
		o = JS_CallConstructor(cx, v, 0, l);
		grab(o);
		JS_Release(v);
		if(JS_IsException(o)) {
			if (intFlag)
				i_puts(MSG_Interrupted);
			processError(cx);
			debugPrint(3, "failure on new %s()", classname);
			uptrace(cx, parent);
			JS_Release(o);
			return JS_UNDEFINED;
		}
	}
// we should always have parent and idx here.
	set_array_element_object(cx, parent, idx, o);
	return o;
}

/*********************************************************************
Instantiate a class based on a nonstandard html tag. Could be a custom element.
this is much easier in js, so call upon a js function.
This is a function we write: findClass4Tag().
If the class name doesn't look like a custom element,
then just call instantiate() above, with the default class HTMLElement.
*********************************************************************/

static JSValue instantiate_custom(JSContext *cx, JSValueConst parent,
			  const char *classname)
{
    const char *s;
    char c;
    bool hyphen = false;
// check classname for custom pattern
    for(s = classname; (c = *s); ++s) {
        if(c == '-') {
            if(s > classname && s[-1] != c &&
            s[1] && s[1] != '-')
                hyphen = true;
            continue;
        }
        if(!isalnum(c)) break;
    }
    if(c || !hyphen)
        return instantiate(cx, parent, 0, "HTMLElement");

    JSValue res, l[2];
    JSValue g = *(JSValue*)cf->winobj;
    JSAtom a = JS_NewAtom(cx, "findClass4Tag");
    l[0] = JS_NewAtomString(cx, classname);
    grab(l[0]);
    l[1] = parent;
    res = JS_Invoke(cx, g, a, 2, l);
    grab(res);
    JS_FreeAtom(cx, a);
    JS_Release(l[0]);
    return res;
}

/*********************************************************************
No arguments; returns abool.
This function is typically used for handlers: onclick, onchange, onsubmit, onload, etc.
The return value is sometimes significant.
If a hyperlink has an onclick function, and said function returns false,
the hyperlink is not followed.
If onsubmit returns false the form does not submit.
And yet this opens a can of worms. Here is my default behavior for corner cases.
I generally want the browser to continue, unless the function
explicitly says false.
Edbrowse should do as much as it can for the casual user.
Javascript function returns boolean. Pass this value back.
Function returns number. nonzero is true and zero is false.
Function returns a bogus type like object. true
Function returns undefined. true
Function doesn't exist. false.
Function encounters an error during execution. false.
*********************************************************************/

static bool run_function_bool(JSContext *cx, JSValueConst parent, const char *name)
{
	int dbl = 3;		// debug level to print debug messages
	int32_t seqno = -1;
		JSValue v, r, l[1];
	if(cx != cf->cx) {
		JSValue g = JS_GetGlobalObject(cx);
		int jj = get_property_number(cx, g, "eb$ctx");
		JS_FreeValue(cx, g);
		debugPrint(3, "running function %s in context %d but current context is %d", name, jj, cf->gsn);
// run it anyways and hope we know what we're doing
	}

    // don't print timer in and out unless debug >= 4
    if (stringEqual(name, "ontimer")) {
        dbl = 4;
        v = JS_GetPropertyStr(cx, parent, "tsn");
        grab(v);
        if(JS_IsNumber(v))
            JS_ToInt32(cx, &seqno, v);
        JS_Release(v);
    }
    // other functions we might not want to see at debug 3
    if (stringEqual(name, "connectedCallbackStart") ||
    stringEqual(name, "markAllCollections") ||
    stringEqual(name, "frames$rebuild"))
        dbl = 4;
    if(stringEqual(name, "onmessage$$running"))
        dbl = 9;

    v = JS_GetPropertyStr(cx, parent, name);
    grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(v);
		return false;
	}
	if (seqno > 0) {
	    debugPrint(dbl, "exec %s timer %d context %d", name, seqno, cf->gsn);
	    // the timer object is our mythical creation, and shouldn't be "this"
	    JSValue g = JS_GetGlobalObject(cx);
	    r = JS_Call(cx, v, g, 0, l);
	    JS_FreeValue(cx, g);
	} else {
	    debugPrint(dbl, "exec %s", name);
	    r = JS_Call(cx, v, parent, 0, l);
	}
	grab(r);
	JS_Release(v);
	if(!JS_IsException(r)) {
		bool rc = false;
		debugPrint(dbl, "exec complete");
		if(JS_IsBool(r))
			rc = JS_ToBool(cx, r);
		if(JS_IsNumber(r)) {
			int32_t n = 1;
			JS_ToInt32(cx, &n, r);
			rc = !!n;
		}
		JS_Release(r);
		return rc;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s()", name);
	uptrace(cx, parent);
	debugPrint(3, "exec complete");
	return false;
}

bool run_function_bool_t(const Tag *t, const char *name)
{
	if (!allowJS || !t->jslink)
		return false;
	return run_function_bool(t->f0->cx, *((JSValue*)t->jv), name);
}

bool run_function_bool_win(const Frame *f, const char *name)
{
	if (!allowJS || !f->jslink)
		return false;
	return run_function_bool(f->cx, *((JSValue*)f->winobj), name);
}

void run_ontimer(const Frame *f, const char *backlink)
{
	JSContext *cx = f->cx;
// timer object from its backlink
	JSValue to = get_property_object(cx, *((JSValue*)f->winobj), backlink);
	if(JS_IsUndefined(to)) {
		debugPrint(3, "could not find timer backlink %s in context %d", backlink, f->gsn);
		return;
	}
	run_function_bool(cx, to, "ontimer");
	JS_Release(to);
}

// The single argument to the function has to be an object.
// Returns -1 if the return is not int or bool
static int run_function_onearg(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child)
{
		JSValue v, r, l[1];
	v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(v);
		return -1;
	}
	l[0] = child;
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(v);
	if(!JS_IsException(r)) {
		int rc = -1;
		int32_t n = -1;
		if(JS_IsBool(r))
			rc = JS_ToBool(cx, r);
		if(JS_IsNumber(r)) {
			JS_ToInt32(cx, &n, r);
			rc = n;
		}
		JS_Release(r);
		return rc;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(obj)", name);
	uptrace(cx, parent);
	JS_Release(r);
	return -1;
}

int run_function_onearg_t(const Tag *t, const char *name, const Tag *t2)
{
	if (!allowJS || !t->jslink || !t2->jslink)
		return -1;
	return run_function_onearg(t->f0->cx, *((JSValue*)t->jv), name, *((JSValue*)t2->jv));
}

int run_function_onearg_win(const Frame *f, const char *name, const Tag *t2)
{
	if (!allowJS || !f->jslink || !t2->jslink)
		return -1;
	return run_function_onearg(f->cx, *((JSValue*)f->winobj), name, *((JSValue*)t2->jv));
}

int run_function_onearg_doc(const Frame *f, const char *name, const Tag *t2)
{
	if (!allowJS || !f->jslink || !t2->jslink)
		return -1;
	return run_function_onearg(f->cx, *((JSValue*)f->docobj), name, *((JSValue*)t2->jv));
}

// The single argument to the function has to be a string.
static void run_function_onestring(JSContext *cx, JSValueConst parent, const char *name,
				const char *s)
{
	JSValue v, r, l[1];
	v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(v);
		return;
	}
	l[0] = JS_NewAtomString(cx, s);
	grab(l[0]);
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(v);
	JS_Release(l[0]);
	if(!JS_IsException(r)) {
		JS_Release(r);
		return;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s)", name, s);
	uptrace(cx, parent);
	JS_Release(r);
}

void run_function_onestring_t(const Tag *t, const char *name, const char *s)
{
	if (!allowJS || !t->jslink)
		return;
	run_function_onestring(t->f0->cx, *((JSValue*)t->jv), name, s);
}

static char *run_function_onestring1(JSContext *cx, JSValueConst parent, const char *name,
				const char *s)
{
	JSValue v, r, l[1];
	v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(v);
		return 0;
	}
	l[0] = JS_NewAtomString(cx, s);
	grab(l[0]);
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(v);
	JS_Release(l[0]);
	if(!JS_IsException(r)) {
		char *result = 0;
	enum ej_proptype proptype = top_proptype(cx, r);
// This is used to call getAttribute, thus the return should be
// a string or something reasonably interpreted as a string.
		if(proptype >= EJ_PROP_STRING && proptype <= EJ_PROP_FLOAT) {
			const char *s = JS_ToCString(cx, r);
			if(s) // should always happen, even the empty string
				result = cloneString(s);
			JS_FreeCString(cx, s);
		}
		JS_Release(r);
		return result;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s)", name, s);
	uptrace(cx, parent);
	JS_Release(r);
	return 0;
}

char *run_function_onestring1_t(const Tag *t, const char *name, const char *s)
{
	if (!allowJS || !t->jslink)
		return 0;
	return run_function_onestring1(t->f0->cx, *((JSValue*)t->jv), name, s);
}

// The arguments to the function have to be strings.
static void run_function_twostring(JSContext *cx, JSValueConst parent, const char *name,
				const char *s1, const char *s2)
{
	JSValue v, r, l[2];
	v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(v);
		return;
	}
	l[0] = JS_NewAtomString(cx, s1);
	grab(l[0]);
	l[1] = JS_NewAtomString(cx, s2);
	grab(l[1]);
	r = JS_Call(cx, v, parent, 2, l);
	grab(r);
	JS_Release(v);
	JS_Release(l[0]);
	JS_Release(l[1]);
	if(!JS_IsException(r)) {
		JS_Release(r);
		return;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s,%s)", name, s1, s2);
	uptrace(cx, parent);
	JS_Release(r);
}

void run_function_twostring_t(const Tag *t, const char *name, const char *s1, const char *s2)
{
	if (!allowJS || !t->jslink)
		return;
	run_function_twostring(t->f0->cx, *((JSValue*)t->jv), name, s1, s2);
}

void run_function_onestring_win(const Frame *f, const char *name, const char *s)
{
	if (!allowJS || !f->jslink)
		return;
	run_function_onestring(f->cx, *((JSValue*)f->winobj), name, s);
}

static 	const char *bp_string =
	  ";(function(arg$,l$ne){if(l$ne) alert('break at line ' + l$ne); while(true){var res = prompt('bp'); if(!res) continue; if(res === '.') break; try { res = eval(res); alert(res); } catch(e) { alert(e.toString()); }}}).call(this,(typeof arguments=='object'?arguments:[]),\"";
static 	const char *trace_string =
	  ";(function(arg$,l$ne){ var t$t=trace$ch(l$ne); if(t$t == 0) return; if(t$t == 1) { alert3(step$val); return; } alert('break at line ' + step$val); while(true){var res = prompt('bp'); if(!res) continue; if(res === '.') break; try { res = eval(res); alert(res); } catch(e) { alert(e.toString()); }}}).call(this,(typeof arguments=='object'?arguments:[]),\"";
static char *run_script(JSContext *cx, const char *s)
{
    char *result = NULL;
    JSValue r;
    char *s2 = NULL;
    const char *s3;
    const char *ebnobp = getenv("EBNOBP");
    int commapresent;

// special debugging code to replace bp@ and trace@ with expanded macros.
// Warning: breakpoints and tracing can change the flow of execution
// in unusual cases, e.g. when a js verifyer checks f.toString(),
// and of course it will be very different with the debugging stuff in it.
    if ((!ebnobp || !*ebnobp) && (strstr(s, "bp@(") || strstr(s, "trace@("))) {
        int l;
        const char *u, *v1, *v2;
        s2 = initString(&l);
        u = s;
        while (true) {
            v1 = strstr(u, "bp@(");
            v2 = strstr(u, "trace@(");
            if (v1 && v2 && v2 < v1) v1 = v2;
            if (!v1) v1 = v2;
            if (!v1) break;
            stringAndBytes(&s2, &l, u, v1 - u);

// The macros for bp and trace start and end with ;
// That keeps them separate from what goes on around them.
// But it also makes it impossible to write exp,exp,bp@(huh),exp
// watch for comma on either side, and if so, omit the ;

            while(l && s2[l-1] == ' ') s2[--l] = 0;
            commapresent = (l && s2[l-1] == ',');
            stringAndString(&s2, &l, (
                *v1 == 'b' ?
                bp_string + commapresent :
                trace_string + commapresent));

// paste in the argument to bp@(x) or trace@(x)
            v1 = strchr(v1, '(') + 1;
            v2 = strchr(v1, ')');
            stringAndBytes(&s2, &l, v1, v2 - v1);
            stringAndString(&s2, &l, "\");");
            u = ++v2;
            while(*u == ' ') ++u;
// commapresent on the other side, don't need trailing ;
            if(*u == ',' || *u == ';') s2[--l] = 0;

        }
        stringAndString(&s2, &l, u);
    }

    s3 = (s2 ? s2 : s);
    r = JS_Eval(cx, s3, strlen(s3),
        (jsSourceFile ? jsSourceFile : "internal"), js_eval_flag);
    grab(r);
    nzFree(s2);
    if (intFlag) i_puts(MSG_Interrupted);
    if (!JS_IsException(r)) {
        s = JS_ToCString(cx, r);
        if(s && *s) result = cloneString(s);
        JS_FreeCString(cx, s);
    } else processError(cx);
    JS_Release(r);
    return result;
}

// execute script.text code; more efficient than the above.
void jsRunData(const Tag *t, const char *filename, int lineno, bool is_module)
{
	JSValue v;
	const char *s;
	JSContext *cx;
	if (!allowJS || !t->jslink)
		return;
	debugPrint(5, "> script:");
	cx = t->f0->cx;
	jsSourceFile = filename;
	jsLineno = lineno;
        if (is_module) js_eval_flag = JS_EVAL_TYPE_MODULE;
	v = JS_GetPropertyStr(cx, *((JSValue*)t->jv), "text");
	grab(v);
	if(!JS_IsString(v)) {
// no data
		jsSourceFile = 0;
		JS_Release(v);
		return;
	}
	s = JS_ToCString(cx, v);
	if (!s || !*s) {
		jsSourceFile = 0;
		JS_FreeCString(cx, s);
		JS_Release(v);
		return;
	}
// have to set currentScript
	JS_SetPropertyStr(cx, *((JSValue*)t->f0->docobj), "currentScript", JS_DupValue(cx, *((JSValue*)t->jv)));
// defer to the earlier routine if there are breakpoints
	if (strstr(s, "bp@(") || strstr(s, "trace@(")) {
		char *result = run_script(cx, s);
		nzFree(result);
	} else {
		JSValue r = JS_Eval(cx, s, strlen(s),
		(jsSourceFile ? jsSourceFile : "internal"), js_eval_flag);
		grab(r);
		if (intFlag)
			i_puts(MSG_Interrupted);
		if(JS_IsException(r))
			processError(cx);
		JS_Release(r);
	}
	JS_FreeCString(cx, s);
	jsSourceFile = NULL;
        js_eval_flag = JS_EVAL_TYPE_GLOBAL;
	delete_property(cx, *((JSValue*)t->f0->docobj), "currentScript");
// onload handler? Should this run even if the script fails?
// Right now it does.
// The script could be removed, replaced by other nodes by innerHTML.
	if (t->jslink && t->href && t->href[0] && !isDataURI(t->href)) {
		run_event(cx, *((JSValue*)t->jv), "onload");
}
	debugPrint(5, "< ok");
}

// Run some javascript code under the named object, usually window.
// Pass the return value of the script back as a string.
static char *jsRunScriptResult(const Frame *f, const char *str,
const char *filename, int lineno)
{
    char *result;
    if (!allowJS || !f->jslink) return NULL;
    if (!str || !str[0]) return NULL;
    debugPrint(5, "> script:");
    jsSourceFile = filename;
    jsLineno = lineno;
    result = run_script(f->cx, str);
    jsSourceFile = NULL;
    debugPrint(5, "< ok");
    return result;
}

/* like the above but throw away the result */
void jsRunScriptWin(const char *str, const char *filename, int lineno)
{
    nzFree(jsRunScriptResult(cf, str, filename, lineno));
}

void jsRunScript_t(const Tag *t, const char *str, const char *filename, int lineno)
{
    nzFree(jsRunScriptResult(t->f0, str, filename, lineno));
}

char *jsRunScriptWinResult(const char *str, const char *filename, int lineno)
{
    return jsRunScriptResult(cf, str, filename, lineno);
}

static JSValue create_event(JSContext *cx, JSValueConst parent, const char *evname)
{
	JSValue e;
	const char *evname1 = evname;
	if (evname[0] == 'o' && evname[1] == 'n')
		evname1 += 2;
	e = instantiate(cx, parent, 0, "Event");
	set_property_string(cx, e, "type", evname1);
	return e;
}

// Run a non-capturing, non-bubbling event
static bool run_event(JSContext *cx, JSValueConst obj, const char *evname)
{
    int rc;
    JSValue eo;	// created event object
    eo = create_event(cx, obj, evname);
    set_property_bool(cx, eo, "eb$captures", false);
    set_property_bool(cx, eo, "bubbles", false);
    rc = run_function_onearg(cx, obj, "dispatchEvent", eo);
    JS_Release(eo);
    return rc;
}

bool run_event_t(const Tag *t, const char *evname)
{
	if (!allowJS || !t->jslink)
		return true;
	return run_event(t->f0->cx, *((JSValue*)t->jv), evname);
}

bool run_event_win(const Frame *f, const char *evname)
{
	if (!allowJS || !f->jslink)
		return true;
	return run_event(f->cx, *((JSValue*)f->winobj), evname);
}

bool run_event_doc(const Frame *f, const char *evname)
{
	if (!allowJS || !f->jslink)
		return true;
	return run_event(f->cx, *((JSValue*)f->docobj), evname);
}

// Allow event propagation
bool bubble_event_t(const Tag *t, const char *name)
{
	JSContext *cx;
	JSValue e;		// the event object
	bool rc;
	if (!allowJS || !t || !t->jslink)
		return true;
	cx = t->f0->cx;
	e = create_event(cx, *((JSValue*)t->jv), name);
	rc = run_function_onearg(cx, *((JSValue*)t->jv), "dispatchEvent", e);
/*********************************************************************
Why would we need to test whether t is connected to its object?
We already know it is.
dispatchEvent could run some javascript on the node connected with t,
like onclick code, and that in turn could set innerHTML,
and that in turn could replace t with a new node, thereby disconnecting it.
Seems contrived, but it actually happens.
*********************************************************************/
	if(t->jslink)
	JS_Release(e);
	return rc;
}

/*********************************************************************
This is for debugging, if a function or handler fails.
Climb up the tree to see where you are, similar to uptrace in startwindow.js.
As you climb up the tree, check for parentNode = null.
null is an object so it passes the object test.
This should never happen, but does in http://4x4dorogi.net
Also check for recursion.
If there is an error fetching nodeName or class, e.g. when the node is null,
(if we didn't check for parentNode = null in the above website),
then asking for nodeName causes yet another runtime error.
This invokes our machinery again, including uptrace if debug is on,
and it invokes the quick machinery again as well.
The resulting core dump has the stack so corrupted, that gdb is hopelessly confused.
*********************************************************************/

static void uptrace(JSContext * cx, JSValueConst node)
{
	static bool infunction = false;
	JSValue pn; // parent node
	enum ej_proptype pntype; // parent node type
	bool first = true;
	if (debugLevel < 3)
		return;
	if(infunction) {
		debugPrint(3, "uptrace recursion; this is unrecoverable!");
		exit(1);
	}
	infunction = true;
	while (true) {
		const char *nn = 0, *cn = 0;	// node name class name
		JSValue nnv, cnv;
		char buf[120];
		nnv = JS_GetPropertyStr(cx, node, "nodeName");
		grab(nnv);
		if(JS_IsString(nnv))
			nn = JS_ToCString(cx, nnv);
		if(nn) {
			strcpy(buf, nn);
			JS_FreeCString(cx, nn);
		} else strcpy(buf, "?");
		JS_Release(nnv);
		cnv = JS_GetPropertyStr(cx, node, "class");
		grab(cnv);
		if(JS_IsString(cnv)) {
			cn = JS_ToCString(cx, cnv);
			int l = strlen(cn);
			int k = strlen(buf);
			if(k + 1 + l >= (int)sizeof(buf))
				l = sizeof(buf) - k - 2;
			buf[k] = '.';
			strncpy(buf + k + 1, cn, l);
			buf[k + 1 + l] = 0;
			JS_FreeCString(cx, cn);
		}
		debugPrint(3, "%s", buf);
		JS_Release(cnv);
		pn = JS_GetPropertyStr(cx, node, "parentNode");
		grab(pn);
		if(!first)
			JS_Release(node);
		first = false;
		pntype = top_proptype(cx, pn);
		if(pntype == EJ_PROP_NONE)
			break;
		if(pntype == EJ_PROP_NULL) {
			debugPrint(3, "null");
			JS_Release(pn);
			break;
		}
		if(pntype != EJ_PROP_OBJECT) {
			debugPrint(3, "parentNode not object, type %d", pntype);
			JS_Release(pn);
			break;
		}
// it's an object and we're ok to climb
		node = pn;
	}
	debugPrint(3, "end uptrace");
	infunction = false;
}

/*********************************************************************
Exception has been produced.
Print the error message, including line number, and send to the debug log.
I don't know how to do this, so for now, just making a standard call.
*********************************************************************/

static void processError(JSContext * cx)
{
	JSValue exc;
	const char *msg, *stack = 0;
	JSValue sv; // stack value
	int lineno = 0;
	if (debugLevel < 3)
		return;
	exc = JS_GetException(cx);
	if(!JS_IsObject(exc))
		return; // this should never happen
	msg = JS_ToCString(cx, exc); // this runs ext.toString()
	sv = JS_GetPropertyStr(cx, exc, "stack");
	if(JS_IsString(sv))
		stack = JS_ToCString(cx, sv);
	if(stack && jsSourceFile) {
// pull line number out of the stack trace; this assumes a particular format.
// First line is first stack frame, and should be @ function (file:line)
// But when we switch to ng the format is now at function(file:line:offset)
		const char *p = strchr(stack, '\n');
		if(p) {
			if(p > stack && p[-1] == ')') --p;
			while(p > stack && isdigitByte(p[-1])) --p;
			if(p > stack && p[-1] == ':') --p;
#if Q_NG
			while(p > stack && isdigitByte(p[-1])) --p;
			if(p > stack && p[-1] == ':') --p;
#endif
			if(*p == ':' && isdigitByte(p[1]))
				lineno = atoi(p+1);
			if(lineno < 0) lineno = 0;
		}
	}
	if(!jsSourceFile) // no file, just the message
		debugPrint(3, "%s", msg);
	else if(lineno)
// in the duktape version, the line number was off by 1, so I adjusted it;
// in quick, the line number is accurate, so I have to unadjust it.
		debugPrint(3, "%s line %d: %s", jsSourceFile, lineno + jsLineno - 1, msg);
	else if(jsLineno > 1)
		debugPrint(3, "%s near line %d: %s", jsSourceFile, lineno + jsLineno - 1, msg);
	else
		debugPrint(3, "%s: %s", jsSourceFile, msg);
	if(stack) {
		debugPrint(3, "%s", stack);
		JS_FreeCString(cx, stack);
	}
	JS_FreeCString(cx, msg);
	JS_FreeValue(cx, sv);
	JS_FreeValue(cx, exc);
}

// This function takes over the JSValue, the caller should not free it.
// disconnect TagObject will free it.
static void connectTagObject(Tag *t, JSValue p)
{
	JSContext *cx = t->f0->cx;
	if(t->jslink) return;
	t->jv = allocMem(sizeof(p));
	*((JSValue*)t->jv) = p;
	t->jslink = true;
	debugPrint(6, "connect %d %s", t->seqno, t->info->name);
// Below a frame, t could be a manufactured document for the new window.
// We don't want to set eb$seqno in this case.
	if(t->action != TAGACT_DOC) {
		JS_DefinePropertyValueStr(cx, p, "eb$seqno", JS_NewInt32(cx, t->seqno), 0);
	}
}

void disconnectTagObject(Tag *t)
{
	if (!t->jslink)
		return;
// This is where the null context bug can occur, as described at the top
// of this file. Since we are using jsrt directly it is no longer an issue.
	JS_Release(*((JSValue*)t->jv));
	free(t->jv);
	t->jv = 0;
	t->jslink = false;
	debugPrint(6, "disconnect %d %s", t->seqno, t->info->name);
}

// this is for frame expansion
void reconnectTagObject(Tag *t)
{
	JSValue cdo;	// contentDocument object
	cdo = JS_DupValue(cf->cx, *((JSValue*)cf->docobj));
// this duplication represents a regrab on the document object.
// It will be freed when the frame is freed, and when the document tag is disconnected.
	grab(cdo);
	disconnectTagObject(t);
	connectTagObject(t, cdo);
}

/*********************************************************************
connectTagObject() stamps the sequence number onto every tag object,
so we can index the tag array directly instead of scanning it.
Read it as an own data property, and never through the ordinary property
machinery: a getter on a forged receiver must not run while we are in the
middle of a native dom call.
The number is only a hint, it comes from the js world after all.
The pointer comparison below is what actually establishes the tag,
and if anything doesn't line up we return 0 and the caller scans.
*********************************************************************/

static Tag *tagFromSeqno(JSContext *cx, JSValueConst v)
{
	JSPropertyDescriptor d;
	JSAtom a = JS_NewAtom(cx, "eb$seqno");
	Tag *t = 0;
	int seqno;
	if(JS_GetOwnProperty(cx, &d, v, a) > 0) {
		if(!(d.flags & JS_PROP_GETSET) && JS_IsNumber(d.value) &&
		!JS_ToInt32(cx, &seqno, d.value) &&
		seqno >= 0 && seqno < cw->numTags)
			t = tagList[seqno];
		JS_Release(d.value);
		JS_Release(d.getter);
		JS_Release(d.setter);
	}
	JS_FreeAtom(cx, a);
	if(t && !(t->jslink && !t->dead &&
	JS_VALUE_GET_PTR(*((JSValue*)t->jv)) == JS_VALUE_GET_PTR(v)))
		t = 0;
	return t;
}

static Tag *tagFromObject(JSContext *cx, JSValueConst v)
{
	int i;
	Tag *t;
	if (!tagList)
		i_printfExit(MSG_NullListInform);
	if(!JS_IsObject(v)) {
		debugPrint(3, "tagFromObject(nothing)");
		return 0;
	}
	if((t = tagFromSeqno(cx, v)))
		return t;
	for (i = 0; i < cw->numTags; ++i) {
		t = tagList[i];
		if (t->jslink && JS_VALUE_GET_PTR(*((JSValue*)t->jv)) == JS_VALUE_GET_PTR(v) && !t->dead)
			return t;
	}
	debugPrint(3, "tagFromObject() returns null");
	return 0;
}

// Create a new tag for this pointer, only used by document.createElement().
static Tag *tagFromObject2(JSValueConst v, const char *tagname)
{
	Tag *t;
// For the future, if the tag is not created, we should release(v),
// since that value will never be taken over by a tag.
// Well I think the tag is always created.
	if (!tagname)
		return 0;
	t = newTag(cf, tagname);
	if (!t) {
		debugPrint(3, "cannot create tag node %s", tagname);
		return 0;
	}
	connectTagObject(t, v);
/* this node now has a js object, don't decorate it again. */
	t->step = 2;
/* and don't render it unless it is linked into the active tree */
	t->deleted = true;
	return t;
}

// some do-nothing native methods
static JSValue nat_void(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_UNDEFINED;
}

static JSValue nat_null(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_NULL;
}

static JSValue nat_true(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_TRUE;
}

static JSValue nat_false(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_FALSE;
}

static JSValue nat_dbf(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	int32_t n = 0;
	int rc = 0;
	if(argc >= 1)
		JS_ToInt32(cx, &n, argv[0]);
	switch(n) {
		case 1: rc = debugEvent; break;
		case 2: rc = debugClone; break;
		case 3: rc = debugThrow; break;
		case 4: return JS_NewInt32(cx, ++cw->ehsn);
	}
        (void) this;
	return JS_NewBool(cx, rc);
}

static JSValue nat_array(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) this;
        (void) argc;
        (void) argv;
	return JS_NewArray(cx);
}

#if ! Q_NG
// base64 encode, already provided by quickjs-ng
static JSValue nat_btoa(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	char *t; // result
	char *s = emptyString;
	size_t len = 0;
	JSValue v;
	if(argc >= 1) {
		const char *s0 = JS_ToCStringLen(cx, &len, argv[0]);
		s = allocMem(len + 1);
		memcpy(s, s0, len);
		s[len] = 0;
		JS_FreeCString(cx, s0);
	}
	t = base64Encode(s, len, false);
	nzFree(s);
	v = JS_NewAtomString(cx, t);
	nzFree(t);
        (void) this;
	return v;
}

// base64 decode
static JSValue nat_atob(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	char *t1, *t2, *u;
	const char *s = emptyString;
	int len = 0;
	JSValue v;
	if(argc >= 1)
		s = JS_ToCString(cx, argv[0]);
	t1 = cloneString(s);
	if(argc >= 1)
		JS_FreeCString(cx, s);
	t2 = t1 + strlen(t1);
	if(t2 == t1) goto empty;
	base64Decode(t1, &t2);
// ignore errors for now.
	u = iso12utf(t1, t2, &len);
	nzFree(t1);
	t1 = u;
empty:
	v = JS_NewStringLen(cx, t1, len);
	nzFree(t1);
        (void) this;
	return v;
}
#endif

static JSValue nat_makeBoundary(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    JSValue v = JS_NewString(cx, makeBoundary());
    (void) this;
    (void) argc;
    (void) argv;
    return v;
}

// object keys, just for debugging from jdb
static JSValue nat_ok(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	uint32_t p_len = 0, i;
	if(argc >= 1 && JS_IsObject(argv[0])) {
		JSPropertyEnum *p_list;
		JS_GetOwnPropertyNames(cx, &p_list, &p_len, argv[0], JS_GPN_STRING_MASK);
		for(i=0; i<p_len; ++i) {
			const char *s = JS_AtomToCString(cx, p_list[i].atom);
			puts(s);
			JS_FreeCString(cx, s);
		}
		JS_FreePropertyEnum(cx, p_list, p_len);
	}
    (void) this;
    return JS_NewInt32(cx, p_len);
}

static JSValue nat_new_location(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *s = emptyString;
	if(argc >= 1)
		s = JS_ToCString(cx, argv[0]);
	if (s && *s) {
		char *t = cloneString(s);
/* url on one line, name of window on next line */
		char *u = strchr(t, '\n');
		*u++ = 0;
		debugPrint(4, "window %s|%s", t, u);
		domOpensWindow(t, u);
		nzFree(t);
	}
	if(argc >= 1)
		JS_FreeCString(cx, s);
        (void) this;
	return JS_UNDEFINED;
}

static JSValue nat_mywin(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
/*********************************************************************
Do not use JS_GetGlobalObject(cx) for this, in fact don't use it for anything.
It doesn't do what you think.
In duktape it does what you want; returns window for the named context.
In quickjs, it returns the window of where it was compiled.
That's no help; I could have just said window.
I specifically set up cf->winobj for the window object, so use that.
It is possible for cf->winobj to be null - though I ran for years
without running into this corner case. Browse a page with no js.
Then turn on js and expand a frame.
The entire page is rendered in context 1, but there is no js there.
Within the frame, js is active, so we use css and other things to see if
various tags are visible. This calls eb$visible, which calls my$win().
That's a null pointer.
Not sure what to do here, so just return null.
*********************************************************************/
	if(!cf->winobj) return JS_NULL;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_DupValue(cx, *(JSValue*)cf->winobj);
}

static JSValue nat_mydoc(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	if(!cf->docobj) return JS_NULL;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_DupValue(cx, *(JSValue*)cf->docobj);
}

static JSValue nat_hasFocus(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) this;
        (void) argc;
        (void) argv;
	return JS_NewBool(cx, foregroundWindow);
}

static JSValue nat_puts(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	if(argc >= 1) {
		    const char *str = JS_ToCString(cx, argv[0]);
		            if (str) {
			printf("%s", str);
			JS_FreeCString(cx, str);
		            }
	        }
	printf("\n");
        (void) this;
        return JS_UNDEFINED;
}

// write local file
static JSValue nat_wlf(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *s = JS_ToCString(cx, argv[0]);
	int len = strlen(s);
	const char *filename = JS_ToCString(cx, argv[1]);
	int fh;
	bool safe = false;
	if (stringEqual(filename, "from") || stringEqual(filename, "jslocal"))
		safe = true;
	if (filename[0] == 'f') {
		int i;
		for (i = 1; isdigitByte(filename[i]); ++i) ;
		if (i > 1 && (stringEqual(filename + i, ".js") ||
			      stringEqual(filename + i, ".css")))
			safe = true;
	}
	if (!safe)
		goto done;
	fh = open(filename, O_CREAT | O_TRUNC | O_WRONLY | O_TEXT | O_CLOEXEC, MODE_rw);
	if (fh < 0) {
		printf("cannot create file %s\n", filename);
		goto done;
	}
	if (write(fh, s, len) < len)
		printf("cannot write file %s\n", filename);
	close(fh);
	if (stringEqual(filename, "jslocal"))
		writeShortCache();

done:
	JS_FreeCString(cx, s);
	JS_FreeCString(cx, filename);
        (void) this;
        (void) argc;
	return JS_UNDEFINED;
}

static JSValue nat_media(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *s = JS_ToCString(cx, argv[0]);
	bool rc = false;
	if (s && *s) {
		char *t = cloneString(s);
		rc = matchMedia(t);
		nzFree(t);
	}
	JS_FreeCString(cx, s);
        (void) this;
        (void) argc;
	return JS_NewBool(cx, rc);
}

static JSValue nat_logputs(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	const char *s = JS_ToCString(cx, argv[1]);
	int32_t minlev = 99;
	JS_ToInt32(cx, &minlev, argv[0]);
	if (debugLevel >= minlev && s && *s)
		debugPrint(3, "%s", s);
	JS_FreeCString(cx, s);
        (void) this;
        (void) argc;
	return JS_UNDEFINED;
}

static JSValue nat_prompt(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *msg = 0;
	const char *answer = 0;
	const char *retval = emptyString;
	char inbuf[80];
	JSValue v;
	if (argc > 0)
		msg = JS_ToCString(cx, argv[0]);
	if (argc > 1)
		answer = JS_ToCString(cx, argv[1]);
	if (msg && *msg) {
		char c, *s;
		printf("%s", msg);
/* If it doesn't end in space or question mark, print a colon */
		c = msg[strlen(msg) - 1];
		if (!isspaceByte(c)) {
			if (!ispunctByte(c))
				printf(":");
			printf(" ");
		}
		if (answer && *answer)
			printf("[%s] ", answer);
		fflush(stdout);
		if (!fgets(inbuf, sizeof(inbuf), stdin))
			exit(5);
// chomp
		s = inbuf + strlen(inbuf);
		if (s > inbuf && s[-1] == '\n')
			*--s = 0;
		retval = inbuf[0] ? inbuf : answer;
// no answer and no input could leave retval null
		if(!retval)
			retval = emptyString;
	}
	v = JS_NewAtomString(cx, retval);
	if(argc > 0)
		JS_FreeCString(cx, msg);
	if(argc > 1)
		JS_FreeCString(cx, answer);
        (void) this;
	return v;
}

static JSValue nat_confirm(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *msg = 0;
	bool answer = false, first = true;
	char c = 'n';
	char inbuf[80];
        (void) this;
	if(argc > 0)
		msg = JS_ToCString(cx, argv[0]);
	if (msg && *msg) {
		while (true) {
			printf("%s", msg);
			c = msg[strlen(msg) - 1];
			if (!isspaceByte(c)) {
				if (!ispunctByte(c))
					printf(":");
				printf(" ");
			}
			if (!first)
				printf("[y|n] ");
			first = false;
			fflush(stdout);
			if (!fgets(inbuf, sizeof(inbuf), stdin))
				exit(5);
			c = *inbuf;
			if (c && strchr("nNyY", c))
				break;
		}
	}
	if (c == 'y' || c == 'Y')
		answer = true;
	if(argc > 0)
		JS_FreeCString(cx, msg);
	return JS_NewBool(cx, answer);
}

static JSValue nat_rgb(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *word = 0;
	const char *answer = 0;
	JSValue v;
	if (argc > 0)
		word = JS_ToCString(cx, argv[0]);
	answer = color2rgb(word);
	v = JS_NewAtomString(cx, answer);
	if(word)
		JS_FreeCString(cx, word);
        (void) this;
	return v;
}

// Sometimes control c can interrupt long running javascript, if the script
// calls our native methods.
static bool jsCheckAndThrow(JSContext * cx)
{
	if (!intFlag)
		return false;
// throw an exception here, and return true.
// That should stop things, unless we're in a try catch block.
	JSValue e = JS_NewError(cx);
	JS_SetPropertyStr(cx, e, "name", JS_NewAtomString(cx, "user interrupt"));
// By throwing e, javascript takes it over,
// it is linked to context, we don't have to free it.
	JS_Throw(cx, e);
	return true;
}

char frameContent[60];

void forceFrameExpand(Tag *t)
{
	if(t->expf)
		return; // already expanded
	Frame *save_cf = cf;
	const char *save_src = jsSourceFile;
	int save_lineno = jsLineno;
	bool save_plug = pluginsOn;
	JSValue cd2, cw2;
	pluginsOn = false;
	frameContent[0] = 0;
	frameExpandLine(0, t);
	if(!t->f1) { // didn't work
// create some dummy objects for window and document.
		JSContext *cx = t->f0->cx;
		cd2 = instantiate(cx, *((JSValue*)t->jv), "content$document", 0);
		cw2 = instantiate(cx, *((JSValue*)t->jv), "content$window", 0);
		set_property_string(cx, cd2, "contentType", frameContent);
// acid3 test 14 and 15 need getElementsByTagName to exist.
		JS_SetPropertyStr(cx, cd2, "getElementsByTagName",
		JS_NewCFunction(cx, nat_array, "tagname_stub", 0));
		JS_Release(cd2);
		JS_Release(cw2);
// technically this is loaded, even though could be error 404,
// or incorect content type, etc.
// The onload function didn't run after browse; run it now.
		if (isURL(t->href) && !isDataURI(t->href))
			run_event_t(t, "onload");
	}
	cf = save_cf;
	jsSourceFile = save_src;
	jsLineno = save_lineno;
	pluginsOn = save_plug;
}

// contentDocument getter setter; this is a bit complicated.
static JSValue getter_cd(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	Tag *t;
	JSValue ao; // alternate object
	t = tagFromObject(cx, this);
	if(!t)
		goto fail;
	if(!t->f1)
		forceFrameExpand(t);
	if(!t->f1 || !t->f1->jslink) // should not happen
		goto fail;
// we have to pass a copy of the document object, so we can retain the original
	return JS_DupValue(cx, *((JSValue*)t->f1->docobj));
fail:
	ao = get_property_object(cx, *((JSValue*)t->jv), "content$document");
	if(JS_IsObject(ao)) {
		release(ao);
		return ao;
}
        (void) argc;
        (void) argv;
	return JS_NULL;
}

static JSValue getter_cw(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	Tag *t;
	JSValue ao; // alternate object
	t = tagFromObject(cx, this);
	if(!t)
		goto fail;
	if(!t->f1)
		forceFrameExpand(t);
	if(!t->f1 || !t->f1->jslink) // should not happen
		goto fail;
// we have to pass a copy of the window object, so we can retain the original
	return JS_DupValue(cx, *((JSValue*)t->f1->winobj));
fail:
	ao = get_property_object(cx, *((JSValue*)t->jv), "content$document");
	if(JS_IsObject(ao)) {
		release(ao);
		return ao;
        }
        (void) argc;
        (void) argv;
	return JS_NULL;
}

static bool remember_contracted;

static JSValue nat_unframe(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	if(argc >= 1 && JS_IsObject(argv[0])) {
		int i, n;
		Tag *t, *cdt;
		Frame *f, *f1;
		t = tagFromObject(cx, argv[0]);
		if (!t) {
			debugPrint(3, "unframe couldn't find tag");
			goto done;
		}
		                if (!(cdt = t->firstchild) || cdt->action != TAGACT_DOC) {
			                        debugPrint(1, "unframe child tag isn't right");
			goto done;
		}
		underKill(cdt);
		disconnectTagObject(cdt);
		f1 = t->f1;
		t->f1 = 0;
		remember_contracted = t->contracted;
		if (f1 == cf) {
			debugPrint(1, "deleting the current frame, this shouldn't happen");
			goto done;
		}
		for (f = &(cw->f0); f; f = f->next)
			if (f->next == f1)
				break;
		if (!f) {
			debugPrint(1, "unframe can't find prior frame to relink");
			goto done;
		}
		f->next = f1->next;
		freeFrame(f1);
	// cdt use to belong to f1, which no longer exists.
		cdt->f0 = f;		// back to its parent frame
	// A running frame could create nodes in its parent frame, or any other frame.
		n = 0;
		for (i = 0; i < cw->numTags; ++i) {
			t = tagList[i];
			if (t->f0 == f1)
				t->f0 = f, ++n;
		}
		if (n)
			debugPrint(3, "%d nodes pushed up to the parent frame", n);
	}
done:
        (void) cx;
        (void) this;
	return JS_UNDEFINED;
}

static JSValue nat_unframe2(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) cx;
        (void) this;
	if(argc >= 1 && JS_IsObject(argv[0])) {
		Tag *t = tagFromObject(cx, argv[0]);
		if(t)
			t->contracted = remember_contracted;
	}
	return JS_UNDEFINED;
}

// We need to call and remember up to 3 node names, to carry dom changes
// across to html. As in parent.insertBefore(newChild, existingChild);
// These names are used by domSetsLinkage().
static const char *embedNodeName(JSContext * cx, JSValueConst obj)
{
	static char buf[3][MAXTAGNAME];
	char *b;
	static int cycle = 0;
	const char *nodeName;
	JSValue v;
        b = buf[cycle];
	*b = 0;

	v = 	JS_GetPropertyStr(cx, obj, "nodeName");
	grab(v);
	nodeName = JS_ToCString(cx, v);
	if(nodeName) {
                copyString(b, nodeName, MAXTAGNAME);
		JS_FreeCString(cx, nodeName);
	}
	JS_Release(v);
	caseShift(b, 'l');
        cycle = (cycle + 1) % 3;
	return b;
}

static void domSetsLinkage(char type, JSValueConst p_j, const char *p_name,
JSValueConst a_j, JSValueConst b_j)
{
    const char *a_name, *b_name; // node name of parent, a, and b
    Tag *parent, *add, *before, *c, *t;
    int action;
    char *jst;		// generic javascript string
    JSContext *cx = cf->cx;

// Some functions in demin.js create, link, and then remove nodes, before
// there is a document. Don't run any side effects in this case.
    if (!cw->tags) return;

    if(!p_name && JS_IsObject(p_j)) p_name = embedNodeName(cx, p_j);
    if(!p_name || !p_name[0]) { // should never happen
        debugPrint(3, "domSetsLinkage, this.nodeName is null");
        return;
}
    a_name = b_name = emptyString;
    if(JS_IsObject(a_j)) a_name = embedNodeName(cx, a_j);
    if(JS_IsObject(b_j)) b_name = embedNodeName(cx, b_j);

	if (type == 'c') {	// create
		parent = tagFromObject2(JS_DupValue(cx, p_j), p_name);
		if (parent) {
			debugPrint(4, "linkage, %s %d created",
				   p_name, parent->seqno);
// creating the new tag, with t->jv, represents a regrab
			grab(p_j);
			if (parent->action == TAGACT_SCRIPT)
				parent->scriptgen = 1;
		}
		return;
	}

	parent = tagFromObject(cx, p_j);
// If parent node has been removed, we don't have to keep its linkage current.
	if (!parent)
		return;
	if(!(add = tagFromObject(cx, a_j))) {
		grab(a_j);
		add = tagFromObject2(JS_DupValue(cx, a_j), a_name);
	}
	if(!add)
		return;

	if (type == 'r') {
/* add is a misnomer here, it's being removed */
		add->deleted = true;
		debugPrint(4, "linkage, %s %d removed from %s %d",
			   a_name, add->seqno, p_name, parent->seqno);
		add->parent = NULL;
		if (parent->firstchild == add)
			parent->firstchild = add->sibling;
		else {
			c = parent->firstchild;
			if (c) {
				for (; c->sibling; c = c->sibling) {
					if (c->sibling != add)
						continue;
					c->sibling = add->sibling;
					break;
				}
			}
		}
		add->sibling = NULL;
		return;
	}

/* check and see if this link would turn the tree into a circle, whence
 * any subsequent traversal would fall into an infinite loop.
 * Child node must not have a parent, and, must not link into itself.
 * Oddly enough the latter seems to happen on acid3.acidtests.org,
 * linking body into body, and body at the top has no parent,
 * so passes the "no parent" test, whereupon I had to add the second test. */
	if (add->parent || add == parent) {
		if (debugLevel >= 3) {
			debugPrint(3,
				   "linkage cycle, cannot link %s %d into %s %d",
				   a_name, add->seqno, p_name, parent->seqno);
			if (type == 'b') {
				before = tagFromObject(cx, b_j);
				debugPrint(3, "before %s %d", b_name,
					   (before ? before->seqno : -1));
			}
			if (add->parent)
				debugPrint(3,
					   "the child already has parent %s %d",
					   add->parent->info->name,
					   add->parent->seqno);
			debugPrint(3,
				   "Aborting the link, some data may not be rendered.");
		}
		return;
	}

	if (type == 'b') {	/* insertBefore */
		before = tagFromObject(cx, b_j);
// creating a new tag won't help here; this object has to be
// in the tree, or how can we insert before?
		if(!before)
			return;
		debugPrint(4, "linkage, %s %d linked into %s %d before %s %d",
			   a_name, add->seqno, p_name, parent->seqno,
			   b_name, before->seqno);
		c = parent->firstchild;
		if (!c)
			return;
		if (c == before) {
			parent->firstchild = add;
			add->sibling = before;
			goto ab;
		}
		while (c->sibling && c->sibling != before)
			c = c->sibling;
		if (!c->sibling)
			return;
		c->sibling = add;
		add->sibling = before;
		goto ab;
	}

/* type = a, appendchild */
	debugPrint(4, "linkage, %s %d linked into %s %d",
		   a_name, add->seqno, p_name, parent->seqno);
	if (!parent->firstchild)
		parent->firstchild = add;
	else {
		c = parent->firstchild;
		while (c->sibling)
			c = c->sibling;
		c->sibling = add;
	}

ab:
	add->parent = parent;
	add->deleted = false;

	t = add;
	debugPrint(4, "fixup %s %d", a_name, t->seqno);
	action = t->action;
	cx = t->f0->cx;

	switch (action) {
	case TAGACT_INPUT:
		jst = get_property_string_t(t, "type");
		setTagAttr(t, "type", jst);
		nzFree(t->value);
		t->value = get_property_string_t(t, "value");
		htmlInputHelper(t);
		break;

	case TAGACT_OPTION:
		if (!t->value)
			t->value = emptyString;
		if (!t->textval)
			t->textval = emptyString;
		break;

	case TAGACT_TA:
		t->action = TAGACT_INPUT;
		t->itype = INP_TA;
		nzFree(t->value);
		t->value = get_property_string_t(t, "value");
		if (!t->value)
			t->value = emptyString;
// Need to create the side buffer here.
		formControl(t, true);
		break;

	case TAGACT_SELECT:
		t->action = TAGACT_INPUT;
		t->itype = INP_SELECT;
		if (typeof_property(cx, *((JSValue*)t->jv), "multiple"))
			t->multiple = true;
		formControl(t, true);
		break;

	case TAGACT_TR:
		t->controller = findOpenTag(t, TAGACT_TABLE);
		break;

	case TAGACT_TD:
		t->controller = findOpenTag(t, TAGACT_TR);
		break;

	case TAGACT_TEXT:
// if the text is in the child, push it up to the text attribute
		if(parent->action == TAGACT_SCRIPT) {
			char *u = get_property_string(cx, *((JSValue*)t->jv), "data");
			if(u && *u)
			set_property_string(cx, *((JSValue*)parent->jv), "text", u);
			nzFree(u);
		}
		break;

	}			// switch
}

static JSValue nat_linkage(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    jsInterruptCheck(cx);
    const char *typestring = JS_ToCString(cx, argv[0]);
    char type = typestring[0];
    JS_FreeCString(cx, typestring);
    const char *tagname = 0;
    if(type == 'c')
        tagname = JS_ToCString(cx, argv[2]);
    domSetsLinkage(type, argv[1], tagname, argv[3], argv[4]);
    if(tagname)
        JS_FreeCString(cx, tagname);
(void)this;
    (void)argc;
    return JS_UNDEFINED;
}

static JSValue set_timeout(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv, bool isInterval)
{
	JSValue to;		// timer object
	JSValue fo;		// function object
// fo is handled differently, I don't grab and release as there will
// be just one at the end, and it will become a timer property.
	JSValue g;		// global object
	bool cc_error = false;
	int32_t n = 1000;		// default number of milliseconds
	JSValue r = JS_UNDEFINED;
	const char *body; // function body
	char fname[48];		/* function name */
	const char *fstr;	/* function string */
	static char fpn[24]; // fake property name
	const char *s;

	g = *(JSValue*)cf->winobj;
	if (argc == 0)
		return JS_NULL;

	debugPrint(5, "timer in");
// if second parameter is missing, leave milliseconds at 1000.
	if (argc > 1 && JS_IsNumber(argv[1]))
		JS_ToInt32(cx, &n, argv[1]);

	if(JS_IsFunction(cx, argv[0])) {
		fo = JS_DupValue(cx, argv[0]);
		JSAtom a = JS_NewAtom(cx, "toString");
		JSValue list[1];
		r = JS_Invoke(cx, argv[0], a, 0, list);
		grab(r);
		JS_FreeAtom(cx, a);
		body = 0;
		if(JS_IsString(r))
			body = JS_ToCString(cx, r);
	} else if (JS_IsString(argv[0])) {
// compile the string to get a funct.
// I do this in C in the other engines, but can't figure it out in quick, so,
// instead I use the js function that I already wrote.
		JSValue l[2];
		JSAtom a = JS_NewAtom(cx, "handlerCompile");
		body = JS_ToCString(cx, argv[0]);
		l[0] = argv[0];
		l[1] = g;
		fo = JS_Invoke(cx, g, a, 2, l);
		JS_FreeAtom(cx, a);
		if (JS_IsException(fo)) {
			processError(cx);
			cc_error = true;
			JS_FreeValue(cx, fo);
			fo = JS_NewCFunction(cx, nat_void, "void", 0);
		}
		if (!JS_IsFunction(cx, fo)) {
			debugPrint(3, "compiled string '%s' does not produce a function", body);
			cc_error = true;
			JS_FreeValue(cx, fo);
			fo = JS_NewCFunction(cx, nat_void, "void", 0);
		}
// Now looks like a function object, just like the previous case.
	} else {
// oops, not a function or a string.
		return JS_NULL;
	}

// pull the function name out of the body, if that makes sense.
	strcpy(fname, "?");
	if((fstr = body)) {
		s = fstr;
		skipWhite(&s);
		if (memEqualCI(s, "javascript:", 11))
			s += 11;
		skipWhite(&s);
		if (isalphaByte(*s) || *s == '_') {
			char *j;
			for (j = fname; isalnumByte(*s) || *s == '_'; ++s) {
				if (j < fname + sizeof(fname) - 3)
					*j++ = *s;
			}
			strcpy(j, "()");
			skipWhite(&s);
			if (*s != '(')
				strcpy(fname, "?");
		}
	}
	if(body)
		JS_FreeCString(cx, body);
	JS_Release(r);

	sprintf(fpn, "timer$%d", timer_sn + 1);
	if (cc_error)
		debugPrint(3, "compile error on timer %s", fpn);
// Create a timer object.
	to = instantiate(cx, g, fpn, "z$Timer");
	if (JS_IsException(to)) {
		processError(cx);
		JS_FreeValue(cx, fo);
		JS_Release(to);
		debugPrint(5, "timer fail");
		return JS_NULL;
	}

	JS_SetPropertyStr(cx, to, "ms", JS_NewInt32(cx, n));
// function is contained in an ontimer handler
// don't free fo after this line
	JS_SetPropertyStr(cx, to, "ontimer", fo);
	JS_SetPropertyStr(cx, to, "backlink", JS_NewAtomString(cx, fpn));
	JS_SetPropertyStr(cx, to, "tsn", JS_NewInt32(cx, ++timer_sn));
	domSetsTimeout(n, fname, fpn, isInterval);
	debugPrint(5, "timer out");
	release(to);
        (void) this;
	return to;
}

static JSValue nat_setTimeout(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	return set_timeout(cx, this, argc, argv, false);
}

static JSValue nat_setInterval(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	return set_timeout(cx, this, argc, argv, true);
}

static JSValue nat_clearTimeout(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	int tsn;
	char *fpn; // fake prop name
	if(!argc || !JS_IsObject(argv[0]))
		return JS_UNDEFINED;
	tsn = get_property_number(cx, argv[0], "tsn");
	fpn = get_property_string(cx, argv[0], "backlink");
	domSetsTimeout(tsn, "-", fpn, false);
	nzFree(fpn);
        (void) this;
	return JS_UNDEFINED;
}

static JSValue nat_win_close(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	i_puts(MSG_PageDone);
// I should probably freeJSContext and close down javascript,
// but not sure I can do that while the js function is still running.
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	return JS_UNDEFINED;
}

static JSValue nat_modtime(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *file = 0;
	int64_t t = 0;
	struct stat buf;
	if (argc > 0)
		file = JS_ToCString(cx, argv[0]);
	if (file && *file &&
	!stat(file, &buf))
		t = buf.st_mtime;
	if(argc > 0)
		JS_FreeCString(cx, file);
        (void) this;
	return JS_NewInt64(cx, t);
}

// find the frame, in the current window, that goes with this.
// Used by document.write to put the html in the right frame.
static Frame *doc2frame(JSValueConst this)
{
	Frame *f;
	for (f = &(cw->f0); f; f = f->next)
		if (f->jslink && JS_VALUE_GET_PTR(*((JSValue*)f->docobj)) == JS_VALUE_GET_PTR(this))
			return f;
	debugPrint(3, "doc2frame can't find frame");
	return 0;
}

static void dwrite(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv, bool newline)
{
	char *s;
	int s_l;
	Frame *f, *save_cf = cf;
	int i;
	s = initString(&s_l);
	for(i=0; i<argc; ++i) {
		const char *h = JS_ToCString(cx, argv[i]);
		if(h) {
			stringAndString(&s, &s_l, h);
			JS_FreeCString(cx, h);
		}
	}
	if(newline)
		stringAndChar(&s, &s_l, '\n');
	debugPrint(4, "dwrite:%s", s);
	f = doc2frame(this);
	if (!f)
		debugPrint(3, "no frame found for document.write, using the default");
	else {
		if (f != cf)
			debugPrint(4, "document.write on a different frame");
		cf = f;
	}
    dwStart();
    stringAndString(&cf->dw, &cf->dw_l, s);
    dw_flush_conditional();
    cf = save_cf;
}

static JSValue nat_doc_write(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	dwrite(cx, this, argc, argv, false);
	return JS_UNDEFINED;
}

static JSValue nat_doc_writeln(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	dwrite(cx, this, argc, argv, true);
	return JS_UNDEFINED;
}

static Frame *win2frame(JSValueConst this)
{
	Frame *f;
	for (f = &(cw->f0); f; f = f->next)
		if (f->jslink && JS_VALUE_GET_PTR(*((JSValue*)f->winobj)) == JS_VALUE_GET_PTR(this))
			return f;
	debugPrint(3, "win2frame can't find frame");
	return 0;
}

static JSValue nat_parent(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	Frame *current = win2frame(this);
	if(!current)
		return JS_UNDEFINED;
if(current == &(cw->f0))
		return JS_DupValue(cx, *((JSValue*)current->winobj));
	if(!current->frametag) // should not happen
		return JS_UNDEFINED;
        (void) argc;
        (void) argv;
	return JS_DupValue(cx, *((JSValue*)current->frametag->f0->winobj));
}

static JSValue nat_fe(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	Frame *current = win2frame(this);
	if(!current || current == &(cw->f0) || !current->frametag)
		return JS_UNDEFINED;
        (void) argc;
        (void) argv;
	return JS_DupValue(cx, *((JSValue*)current->frametag->jv));
}

static JSValue nat_top(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsobjtype w = cw->f0.winobj;
	if(!w) return JS_NULL; // should never happen
        (void) this;
        (void) argc;
        (void) argv;
	return JS_DupValue(cx, *((JSValue*)w));
}

static JSValue nat_fetchHTTP(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	struct i_get g;
	const char *incoming_url = JS_ToCString(cx, argv[0]);
	const char *incoming_method = JS_ToCString(cx, argv[1]);
	const char *incoming_headers = JS_ToCString(cx, argv[2]);
	const char *incoming_payload = JS_ToCString(cx, argv[3]);
	char *outgoing_xhrheaders = NULL;
	char *outgoing_xhrbody = NULL;
	char *a;
	bool rc, async;
	char *s;
	int s_l;
	JSValue u;
	int32_t pd; // process the data
	bool dopost = false, dohead = false;

        (void) argc;
	debugPrint(5, "xhr in");
	JS_ToInt32(cx, &pd, argv[4]);
	async = get_property_bool(cx, this, "async");
	if (!down_jsbg) async = false;

	if (incoming_method && stringEqualCI(incoming_method, "post"))
		dopost = true;
	if (incoming_method && stringEqualCI(incoming_method, "head"))
		dohead = true, async = false;
// don't need method any more
	JS_FreeCString(cx, incoming_method);

	if(incoming_payload && *incoming_payload && dopost) {
	    if(pd == 0) {
        	createFormattedString(&a, "%s\1%s",
	        incoming_url, incoming_payload);
	    } else if(pd == 1) {
        	createFormattedString(&a, "%s\1`b64+%s",
	        incoming_url, incoming_payload);
	    } else {
		a = cloneString(incoming_url);
	    }
	} else {
	a = cloneString(incoming_url);
	}
	JS_FreeCString(cx, incoming_payload);
	JS_FreeCString(cx, incoming_url);
	incoming_url = a; // now it's our allocated string

	debugPrint(3, "xhr send %s", incoming_url);

	const char *altsource = fetchReplace(incoming_url);
	if(altsource) async = false;

// async and sync are completely different pathways
	if (async) {
// I'm going to put the tag in cf, the current frame, and hope that's right,
// hope that xhr runs in a script that runs in the current frame.
		Tag *t =     newTag(cf, "object");
		t->deleted = true;	// do not render this tag
		t->step = 3;
		t->async = true;
		t->inxhr = true;
		t->f0 = cf;
		connectTagObject(t, JS_DupValue(cx, this));
		grab(this);
// This routine will return, and javascript might stop altogether; do we need
// to protect this object from garbage collection?
// No - because t->jv will protect it until it runs.
		t->href = (char*)incoming_url;
// t now has responsibility for incoming_url
		t->custom_h = emptyString;
		if(JS_IsString(argv[2]))
			t->custom_h = cloneString(incoming_headers);
		JS_FreeCString(cx, incoming_headers);
		scriptOnTimer(t);
		pthread_create(&t->loadthread, NULL, httpConnectBack3,
			       (void *)t);
		t->threadcreated = true;
		return JS_NewAtomString(cx, "async");
	}

	memset(&g, 0, sizeof(g));
	g.thisfile = cf->fileName;
	g.uriEncoded = true;
	g.url = incoming_url;
	g.custom_h = incoming_headers;
	g.headers_p = &outgoing_xhrheaders;
// xhr gets data for javascript,
// you should never intercept it with a plugin or a download
// These are already false because of memset above, I'm just sayin...
	g.down_ok = g.pg_ok = false;
	g.headrequest = dohead;
// Do you want to use your own version of a script, with tracing etc?
// If the url is reliable, you can put an entry in jslocal, and it will be
// honored here, but, you won't get the http headers, such as content-type,
// which could be important for the functioning of the website.
	if(altsource) {
		debugPrint(3, "xhr uses %s", altsource);
		int templength;
		rc = fileIntoMemory(altsource, &g.buffer, &templength, 0);
		g.length = templength;
		g.code = 200;
// see if we can infer content type
		const char *v = strrchr(altsource, '.');
		 int ol;
		outgoing_xhrheaders = initString(&ol);
		stringAndString(&outgoing_xhrheaders, &ol, "Content-Type: text/");
		if(stringEqual(v, ".js"))
			stringAndString(&outgoing_xhrheaders, &ol, "javascript");
		else if(stringEqual(v, ".css"))
			stringAndString(&outgoing_xhrheaders, &ol, "css");
		else if(stringEqual(v, ".html"))
			stringAndString(&outgoing_xhrheaders, &ol, "html");
		else if(stringEqual(v, ".xml"))
			stringAndString(&outgoing_xhrheaders, &ol, "xml");
		else
			stringAndString(&outgoing_xhrheaders, &ol, "unknown");
		stringAndString(&outgoing_xhrheaders, &ol, "\r\nContent-Length: ");
		stringAndLongLong(&outgoing_xhrheaders, &ol, g.length);
		stringAndString(&outgoing_xhrheaders, &ol, "\r\n\r\n");
	} else {
		rc = httpConnect(&g);
	}
	outgoing_xhrbody = g.buffer;
	JS_FreeCString(cx, incoming_headers);
	if (outgoing_xhrheaders == NULL)
		outgoing_xhrheaders = emptyString;
	if (outgoing_xhrbody == NULL)
		outgoing_xhrbody = emptyString;
	s = initString(&s_l);
	stringAndNum(&s, &s_l, rc);
	stringAndString(&s, &s_l, "\r\n\r\n");
	stringAndNum(&s, &s_l, g.code);
	stringAndString(&s, &s_l, "\r\n\r\n");
	stringAndString(&s, &s_l, g.cfn ? g.cfn : incoming_url);
	cnzFree(incoming_url);
	nzFree(g.cfn);
	stringAndString(&s, &s_l, "\r\n\r\n");
	stringAndString(&s, &s_l, outgoing_xhrheaders);
	nzFree(outgoing_xhrheaders);
	stringAndString(&s, &s_l, outgoing_xhrbody);
	nzFree(outgoing_xhrbody);
	nzFree(g.referrer);

	debugPrint(5, "xhr out");
	u = JS_NewAtomString(cx, s);
	nzFree(s);
	return u;
}

static JSValue nat_playAudio(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	struct i_get g;
	char *url = get_property_url(cx, this, false);
	char *result;
	bool save_bg = down_bg;
	memset(&g, 0, sizeof(g));
	g.thisfile = cf->fileName;
	g.uriEncoded = true;
	g.pg_ok = pluginsOn, g.playonly = true;
// in case you would rather download it and control it yourself
	g.down_ok = true;
// If you want to download it, it shouldn't be done in background
	down_bg = false;
	g.url = url;
	debugPrint(3, "audio connect to %s", url);
	httpConnect(&g);
	down_bg = save_bg;
	nzFree(g.cfn);
	nzFree(g.referrer);
	nzFree(url);
	result = g.buffer;
// if result is there, then we didn't play it by plugin, and we didn't download it.
// The sound is in our hand but what are we suppose to do with it??
	if(result) debugPrint(3, "don't know what to do with audio result length %lld", g.length);
	nzFree(result);
        (void) argc;
        (void) argv;
	return JS_UNDEFINED;
}

static JSValue nat_resolveURL(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    const char *base = JS_ToCString(cx, argv[0]);
    const char *rel = JS_ToCString(cx, argv[1]);
    char *outgoing_url;
    JSValue u;
    outgoing_url = resolveURL(base, rel);
    if (outgoing_url == NULL) outgoing_url = emptyString;
    JS_FreeCString(cx, base);
    JS_FreeCString(cx, rel);
    u = JS_NewAtomString(cx, outgoing_url);
    nzFree(outgoing_url);
    (void) this;
    (void) argc;
    return u;
}

static JSValue nat_formSubmit(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    Tag *t = tagFromObject(cx, this);
    if(t && t->action == TAGACT_FORM) {
        debugPrint(3, "submit form tag %d", t->seqno);
        domSubmitsForm(t, false);
    } else {
        debugPrint(3, "submit form tag not found");
    }
    (void) cx;
    (void) argc;
    (void) argv;
    return JS_UNDEFINED;
}

static JSValue nat_formReset(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    Tag *t = tagFromObject(cx, this);
    if(t && t->action == TAGACT_FORM) {
        debugPrint(3, "reset form tag %d", t->seqno);
        domSubmitsForm(t, true);
    } else {
        debugPrint(3, "reset form tag not found");
    }
    (void) cx;
    (void) argc;
    (void) argv;
    return JS_UNDEFINED;
}

/*********************************************************************
Maintain a copy of the cookie string that is relevant for this web page.
Include a leading semicolon, looking like
; foo=73838; bar=j_k_qqr; bas=21998999
The setter folds a new cookie into this string,
and also passes the cookie back to edbrowse to put in the cookie jar.
*********************************************************************/

static char *cookieCopy;
static int cook_l;

static void startCookie(void)
{
	const char *url = cf->fileName;
	bool secure = false;
	const char *proto;
	char *s;
	nzFree(cookieCopy);
	cookieCopy = initString(&cook_l);
	stringAndString(&cookieCopy, &cook_l, "; ");
	if (url) {
		proto = getProtURL(url);
		if (proto && stringEqualCI(proto, "https"))
			secure = true;
		findcookies(&cookieCopy, &cook_l, url, secure);
		if (memEqualCI(cookieCopy, "; cookie: ", 10)) {	// should often happen
			strmove(cookieCopy + 2, cookieCopy + 10);
			cook_l -= 8;
		}
		if ((s = strstr(cookieCopy, "\r\n"))) {
			*s = 0;
			cook_l -= 2;
		}
	}
}

// This doesn't work properly it you get or set frames[0].document.cookie
// Fix this some day!
static JSValue nat_getcook(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
        (void) this;
        (void) argc;
        (void) argv;
	startCookie();
	return JS_NewAtomString(cx, cookieCopy);
}

static JSValue nat_setcook(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *newcook = JS_ToCString(cx, argv[0]);
        (void) this;
        (void) argc;
	debugPrint(5, "cook in");
	if (newcook) {
		const char *s = strchr(newcook, '=');
		if(s && s > newcook) {
			JSValue v = JS_GetPropertyStr(cx, *((JSValue*)cf->docobj), "URL");
			const char *u = JS_ToCString(cx, v);
			receiveCookie(u, newcook);
			JS_FreeCString(cx, u);
			JS_FreeValue(cx, v);
		}
	}
	JS_FreeCString(cx, newcook);
	debugPrint(5, "cook out");
	return JS_UNDEFINED;
}

static JSValue nat_css_start(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
// The selection string has to be allocated - css will use it in place,
// then free it later.
	int32_t n;
	const char *s;
	int b;
        (void) this;
        (void) argc;
	JS_ToInt32(cx, &n, argv[0]);
	s = JS_ToCString(cx, argv[1]);
	b = JS_ToBool(cx, argv[2]);
	cssDocLoad(n, cloneString(s), b);
	JS_FreeCString(cx, s);
	return JS_UNDEFINED;
}

// turn an array of html tags into an array of objects.
static JSValue objectize(JSContext *cx, Tag **tlist)
{
	int i, j;
	const Tag *t;
	JSValue a = JS_NewArray(cx);
	if(!tlist)
		return a;
	for (i = j = 0; (t = tlist[i]); ++i) {
		if (!t->jslink)	// should never happen
			continue;
		set_array_element_object(cx, a, j, *((JSValue*)t->jv));
		++j;
	}
	return a;
}

// Turn start into a tag, or 0 if start is doc or win for the current frame.
// Return false if we can't turn it into a tag within the current window.
static bool rootTag(JSContext *cx, JSValue start, Tag **tp)
{
	Tag *t;
	*tp = 0;
	if(JS_IsUndefined(start) ||
	JS_VALUE_GET_PTR(start) == JS_VALUE_GET_PTR(*((JSValue*)cf->winobj)) ||
	JS_VALUE_GET_PTR(start) == JS_VALUE_GET_PTR(*((JSValue*)cf->docobj)))
		return true;
	t = tagFromObject(cx, start);
	if(!t)
		return false;
	*tp = t;
	return true;
}

// querySelectorAll
static JSValue nat_qsa(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	JSValue start = JS_UNDEFINED, a;
	Tag **tlist, *t;
	const char *selstring = JS_ToCString(cx, argv[0]);
	if (argc >= 2) {
		if (JS_IsObject(argv[1]))
			start = argv[1];
	}
	if (JS_IsUndefined(start))
		start = this;
// node.querySelectorAll makes this equal to node.
// If you just call querySelectorAll, this is undefined.
// Then there's window.querySelectorAll and document.querySelectorAll
// rootTag() checks for all these cases.
	if(!rootTag(cx, start, &t)) {
		a = objectize(cx, 0);
	} else {
		tlist = querySelectorAll(selstring, t);
		a = objectize(cx, tlist);
		nzFree(tlist);
	}
	JS_FreeCString(cx, selstring);
	return a;
}

// querySelector
static JSValue nat_qs(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	JSValue start = JS_UNDEFINED;
	Tag *t;
	const char *selstring = JS_ToCString(cx, argv[0]);
	if (argc >= 2) {
		if (JS_IsObject(argv[1]))
			start = argv[1];
	}
	if (JS_IsUndefined(start))
		start = this;
	if(!rootTag(cx, start, &t)) {
		JS_FreeCString(cx, selstring);
/* I'm not sure if this ever happens in the wild but I'm assuming the same as
for a non-match here and returning null as code seems to explicitly check for
that. */
		return JS_NULL;
	}
	t = querySelector(selstring, t);
	JS_FreeCString(cx, selstring);
	if(t && t->jslink)
		return JS_DupValue(cx, *((JSValue*)t->jv));
	return JS_NULL;
}

// querySelector0
static JSValue nat_qs0(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	JSValue start;
	Tag *t;
	bool rc;
	const char *selstring = JS_ToCString(cx, argv[0]);
        (void) argc;
	start = this;
	if(!rootTag(cx, start, &t)) {
		JS_FreeCString(cx, selstring);
		return JS_FALSE;
	}
	rc = querySelector0(selstring, t);
	JS_FreeCString(cx, selstring);
	return JS_NewBool(cx, rc);
}

static JSValue nat_cssApply(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	jsInterruptCheck(cx);
	int32_t n, pe;
	JSValue node = argv[1];
	Tag *t;
	JS_ToInt32(cx, &n, argv[0]);
	JS_ToInt32(cx, &pe, argv[2]);
	t = tagFromObject(cx, node);
	if(t)
		cssApply(n, t, pe);
	else
		debugPrint(3, "eb$cssApply is passed an object that does not correspond to an html tag");
        (void) this;
        (void) argc;
	return JS_UNDEFINED;
}

static JSValue nat_cssText(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	const char *rulestring = JS_ToCString(cx, argv[0]);
	cssText(rulestring);
	JS_FreeCString(cx, rulestring);
        (void) this;
        (void) argc;
	return JS_UNDEFINED;
}

static int JSRuntimeJobIndex;

/*********************************************************************
Ok, I have some splainin to do.
The quickjs function JS_ExecutePendingJob() executes the next pending job,
usually from a Promise call. It could be in any context.
We have no control over that.
Thus it could be a promise call from any edbrowse frame in any session.
That's not enough control for us, for many reasons.
1. I employ two very important global variables, which is bad programming ik,
but this is a part time volunteer gig and sometimes I'm lazy.
Somehow, cw and cf have to be set before the job runs,
the current window and the current frame,
or our side effects, like innerHTML, won't work properly.
I have to call frameFromContext before the job runs, somewhere
inside JS_ExecutePendingJob().
Alternatively, I could call frameFromContext from *all* of my native methods,
that is, you go from js into the edbrowse world and I make sure cf and cw
are set correctly, but that's kind of a pain.
On the other hand, trying to get inside of the quickjs function,
which is suppose to be opaque to me, has its own risks. Well let's continue.
2. If an edbrowse session quits, I should clean up and throw away
any pending jobs associated with that context.
In fact, having those jobs run could be quite risky.
I clean up the timers, but timers are my own creation so that's easy.
Again, I have to dip into the internal list of pending jobs if I am to do this.
3. In a perfect world, I would skip over jobs in contexts
that have been pushed onto the edbrowse stack.
Windows that are pushed into the background, like control z.
So I have to go from context to window, and if that window isn't at the top of the stack,
just skip it for now, cause it may pop up to the top of the stack later
via the ^ command.
All this together compels me to try to get inside of JS_ExecutePendingJob().
You'll see below I copied their code, so I can modify it;
I call it my_ExecutePendingJobs().
Plural, because I run all the pending jobs, not just the next one.
Ok, but I have to bring in some other machinery to support it.
I copied some primitives for managing linked lists, from list.h,
and they are remarkably similar to the ones I invented for edbrowse.
Their list_empty is my listEmpty, exactly the same code.
Great minds think alike.
There is a lot of code from the js project that I copy, I can only hope,
in the parlance of evolution, that such code is highly conserved.
Cause if it mutates, boy we're in trouble!
Now, the real problem is the JSRuntime. The API leaves it opaque,
struct JSRuntime, with no mention of the members.
I have to know where, in this structure, to find the list of jobs.
And that could change version to version.
So, gross as it is, I enqueue a job, and look for a change in this structure.
I assume the change occurs somewhere between struct+64 and struct+512.
If nothing changes, I can't run any promise code, and many websites won't work.
In that event you will be alerted at debug level 1 or higher.
If I find the member that has changed, you will be alerted at debug level 3.
the list has moved from 152 to 328 as the structure evolved over the years.
I hope it doesn't stray too much farther.
The real risk here is, I could glom onto a change that isn't the jobs queue.
Wild pointers that go off to other structures.
At that point the program will blow up bigtime.
This is all a lot more involved than it should be.
Ok, here is some necessary stuffe from quickjs/list.h.
*********************************************************************/

struct list_head {
    struct list_head *prev;
    struct list_head *next;
};

#define list_entry(el, type, member) \
    ((type *)((uint8_t *)(el) - offsetof(type, member)))
#define list_empty(l) ((l)->next == (l))
#define list_for_each(el, head) \
  for(el = (head)->next; el != (head); el = el->next)
#define list_for_each_safe(el, el1, head)                \
    for(el = (head)->next, el1 = el->next; el != (head); \
        el = el1, el1 = el->next)

static inline void list_del(struct list_head *el)
{
    struct list_head *prev, *next;
    prev = el->prev;
    next = el->next;
    prev->next = next;
    next->prev = prev;
    el->prev = NULL; /* fail safe */
    el->next = NULL; /* fail safe */
}

typedef struct JSJobEntry {
    struct list_head link;
    JSContext *ctx;
    JSJobFunc *job_func;
    int argc;
    JSValue argv[];
} JSJobEntry;

/* Pending Jobs called from:
1. The polling timer, with limit > 0.
2. Browsing just before deferred scripts, with current = true.
3. Freeing a context, with freeing_context not null.
4. From the native method pendingJobs().
In (1), running a job moves cw and cf to the frame that owns it,
and we don't put them back, so the caller has to restore them.
In (2), cw and cf are valid, and should hold steady.
In (3), cw and cf might not be valid.
In (4), cw and cf are valid, but might move, and should be restored.
Parameters:
limit, return after this many jobs are run. 0 means no limit.
current, only run jobs in the current window current frame */
int my_ExecutePendingJobs(int limit, bool current)
{
    if(!JSRuntimeJobIndex) return 0; // we couldn't find the pending queue

    JSContext *ctx;
    JSValue res, g, v, arg1native;
    JSJobEntry *e;
    struct list_head *l, *l1;
    int i, cnt = 0;
    struct list_head *jl = (struct list_head *)((char*)jsrt + JSRuntimeJobIndex);

// high runner case
    if (list_empty(jl)) return 0;

// step through the jobs
    list_for_each_safe(l, l1, jl) {
/* stop now and then to let the user interact with edbrowse unless we're
cleaning up when we really want to run all the finalizers */
        if(limit && cnt == limit) break;
        e = list_entry(l, JSJobEntry, link);
        ctx = e->ctx;
        if (freeing_context) {
            if(ctx != freeing_context) continue;
        }  else if(current) {
            if(ctx != cf->cx) continue;
            // now cw and cf remain in place and we're ready to run this job
        } else {
            if(!frameFromContext(ctx)) {
                // this is bad, no frame found for this context
                if(ctx == mwc)
                    debugPrint(3, "frameFromContext finds master window");
                else {
                    debugPrint(3, "frameFromContext cannot find a frame for pointer %p", ctx);
                    debugPrint(3, "It is not safe to run this job (%d arguments), nor free it!", e->argc);
                    list_del(&e->link);
                }
                continue;
            }
            // cw and cf have been set and we're ready to run this job
        }

// Browsing a new web page in the current session pushes the old one, like ^z
// in Linux. Only run jobs at the top of the session stack.
// This is for the polling timer only, indicated by limit > 0.

        if(limit &&  sessionList[cw->sno].lw != cw) continue;

        if(debugLevel >= 3) {
            int jj = -1; // -1 = we're freeing the context
            char pending_with_argc[40];
            sprintf(pending_with_argc, "pending job with %d arguments", e->argc);
// job type is a guess based on our experience with quickjs; it could be wrong
            char *job_type = (e->argc == 1 ? "microtask" :
            e->argc == 5 ? "promise" :
            e->argc == 2 ? "finalizer" :
            pending_with_argc);
// $pjobs is pending jobs, push this one onto the array.
// Nobody ever cleans these up, which is why we only do it at debug 3.
// But no point pushing pending jobs when we're going to free the context
            if (!freeing_context) {
                g = JS_GetGlobalObject(ctx);
                v = JS_GetPropertyStr(ctx, g, "$pjobs");
                jj = get_property_number(ctx, v, "length");
// promise has argc = 5, microtask has argc = 1
                if(e->argc == 5)
                    set_array_element_object(ctx, v, jj, e->argv[2]);
                else if(e->argc)
                    set_array_element_object(ctx, v, jj, e->argv[0]);
                else
                    set_array_element_object(ctx, v, jj, JS_UNDEFINED);
                JS_FreeValue(ctx, v);
                v = JS_GetPropertyStr(ctx, g, "$pjobsa");
                if(e->argc == 5)
                    set_array_element_object(ctx, v, jj, e->argv[4]);
                else
                    set_array_element_object(ctx, v, jj, JS_UNDEFINED);
                JS_FreeValue(ctx, v);
                JS_FreeValue(ctx, g);
            }
            const char *pbool = ""; // promise bool indicator
// fourth argument to a promise call is bool, don't know what it means.
            if(e->argc == 5 && JS_IsBool(e->argv[3]))
                pbool = JS_ToBool(ctx, e->argv[3]) ? "+" : "-";
            if (jj > -1) debugPrint(3, "exec %s for context %d job %d%s",
                job_type, cf->gsn, jj, pbool);
            else debugPrint(3, "deleting %s because of freeing context %d", job_type, cf->gsn);
        }

        list_del(&e->link);
        if(!freeing_context) {
            if(debugLevel >= 3 && debugPromise && e->argc == 5) {
                arg1native = e->argv[1];
                g = JS_GetGlobalObject(ctx);
                v = JS_GetPropertyStr(ctx, g, "promiseCatchFunction");
            set_property_object(ctx, g, "promiseCatchFunctionNative", arg1native);
                e->argv[1] = v;
            }
            res = e->job_func(ctx, e->argc, (JSValueConst *)e->argv);
// Promise jobs never seem to return an error. That's why I didn't check for it.
// But MicroTask jobs do. If the called function fails, we see it.
// So I check for that.
            if(!freeing_context && JS_IsException(res)) processError(ctx);
            debugPrint(3, "exec complete");
            JS_FreeValue(ctx, res);
            if(debugLevel >= 3 && debugPromise && e->argc == 5) {
                e->argv[1] = arg1native;
                JS_FreeValue(ctx, v);
                JS_FreeValue(ctx, g);
            }
        }
        ++cnt;
        for(i = 0; i < e->argc; i++)
            JS_FreeValue(ctx, e->argv[i]);
        js_free(ctx, e);

/*********************************************************************
On June 28 2025, quickjs made a significant change, commit 458c34d.
The context for a pending job would be duplicated via JS_DupContext(),
which doesn't really duplicate, it increments the reference count.
It is then our responsibility to free it, which doesn't really free it,
it decrements the reference count. Like rm in Unix
which doesn't really remove the file unless the link count drops to zero.
If your quickjs is prior to this commit it will probably blow up,
for then we would actually free the context, and then go on to try to use it.
There isn't a version number I can key on, so I'll just do what I have to do
and hope your quickjs is current.
Then, in November of 2025, we switched to the quickjs-ng engine,
and it does not do this odd behavior, so I don't want to free the context.
But some day quickjs-ng might absorb that change from quickjs,
and if that happens, then once again we need to free the context.
*********************************************************************/

#if ! Q_NG
        JS_FreeContext(ctx);
#endif
    }

    return cnt;
}

// don't need these quick macros any more
#undef list_for_each
#undef list_for_each_safe
#undef list_empty
#undef list_entry
#undef offsetof

/*********************************************************************
postMessage() puts a message on a queue, and the target window processes
it later. Well this is later.
Run through the foreground windows and use onmessage() to process those messages.
It's vital we set cw and cf, as we did above, so everything runs
in the target window, especially building new DOM elements within the tree,
by DOM calls or innerHTML etc.
*********************************************************************/

bool my_ExecutePendingMessages(void)
{
	int i;
	JSContext *cx;
	bool rc = false;
// This mucks with cw and cf, the calling routine must preserve them.
	for (i = 1; i <= maxSession; ++i) {
		if(!(cw = sessionList[i].lw) ||
		!cw->browseMode)
			continue;
		for (cf = &(cw->f0); cf; cf = cf->next) {
// javascript has to be set up for this particular frame
			if(!cf->jslink)
				continue;
			cx = cf->cx;
			rc |= run_function_bool(cx, *(JSValue*)cf->winobj, "onmessage$$running");
		}
	}
	return rc;
}

/*********************************************************************
Polyfill.port.postMessage() puts a message on a queue, and the target window
processes it later. Well this is later.
Run through the foreground windows, and the polyfill registry,
to process any messages.
It's vital we set cw and cf, as we did above, so everything runs
in the target window, especially building new DOM elements within the tree,
by DOM calls or innerHTML etc.
*********************************************************************/

bool my_ExecutePendingMessagePorts(void)
{
	int i, j, length, owner;
	JSContext *cx0;
	Frame *f0, *f1;
	JSValue g, ra;
	bool rc = false;
// This mucks with cw and cf, the calling routine must preserve them.
	for (i = 1; i <= maxSession; ++i) {
		if(!(cw = sessionList[i].lw) ||
		!cw->browseMode)
			continue;
		for (f0 = &(cw->f0); f0; f0 = f0->next) {
// javascript has to be set up for this particular frame
			if(!f0->jslink)
				continue;
			cx0 = f0->cx;
// grab the message channel registry for this frame
			g = *(JSValue*)f0->winobj;
			ra = JS_GetPropertyStr(cx0, g, "mp$registry");
			grab(ra);
			if(!wrap_IsArray(cx0, ra)) {
// no registry, don't do anything.
// This should never happen.
				JS_Release(ra);
				debugPrint(3, "context %d has no mp$registry", f0->gsn);
				continue;
			}
// step through the ports in the registry
			length = get_arraylength(cx0, ra);
			for (j = 0; j < length; ++j) {
				JSValue port = get_array_element_object(cx0, ra, j);
				owner = get_property_number(cx0, port, "eb$ctx");
// find the frame that owns this port
				for (f1 = &(cw->f0); f1; f1 = f1->next)
					if(f1->gsn == owner) break;
				if(f1) { // ok
					if(f1->jslink && f1->cx) {
						cf = f1; // set current frame
						rc |= run_function_bool(cf->cx, port, "onmessage$$running");
					}
				} else {
					debugPrint(3, "no frame for MessagePort.context %d", owner);
				}
				JS_Release(port);
			}
			JS_Release(ra);
		}
	}
	return rc;
}

// We don't use this function any more
static JSValue nat_jobs(JSContext *cx, JSValueConst this, int argc, JSValueConst *argv)
{
	Window *save_cw = cw;
	Frame *save_cf = cf;
        (void) cx;
        (void) this;
        (void) argc;
        (void) argv;
	my_ExecutePendingJobs(0, false);
	my_ExecutePendingMessages();
	my_ExecutePendingMessagePorts();
	cw = save_cw, cf = save_cf;
	return JS_UNDEFINED;
}

// bgarbage collect, strictly for debugging
static JSValue nat_gc(JSContext *cx, JSValueConst this, int argc, JSValueConst *argv)
{
    (void) cx;
    (void) this;
    (void) argc;
    (void) argv;
    JS_RunGC(jsrt);
    return JS_UNDEFINED;
}

typedef JSValue native_fn(JSContext *cx, JSValueConst this, int argc, JSValueConst *argv);
struct native_descriptor {
    const char *name;
    native_fn *f;
    int argc;
    int properties;
};

static const struct native_descriptor native_list[] = {
    {"natok",  nat_ok, 1, JS_PROP_ENUMERABLE},
    {"my$win",  nat_mywin, 0, 0},
    {"my$doc",  nat_mydoc, 0, 0},
    {"eb$getcook",  nat_getcook, 0, 0},
    {"eb$setcook",  nat_setcook, 1, 0},
    {"puts",  nat_puts, 1, JS_PROP_ENUMERABLE},
    {"wlf",  nat_wlf, 2, JS_PROP_ENUMERABLE},
    #if ! Q_NG
    {"btoa",  nat_btoa, 1, JS_PROP_ENUMERABLE},
    {"atob",  nat_atob, 1, JS_PROP_ENUMERABLE},
    #endif
    {"makeBoundary",  nat_makeBoundary, 0, 0},
    {"eb$voidfunction",  nat_void, 0, JS_PROP_ENUMERABLE},
    {"eb$nullfunction",  nat_null, 0, JS_PROP_ENUMERABLE},
    {"eb$truefunction",  nat_true, 0, JS_PROP_ENUMERABLE},
    {"eb$falsefunction",  nat_false, 0, JS_PROP_ENUMERABLE},
    {"db$flags",  nat_dbf, 0, JS_PROP_ENUMERABLE},
    {"logputs",  nat_logputs, 2, JS_PROP_ENUMERABLE},
    {"prompt",  nat_prompt, 2, JS_PROP_ENUMERABLE},
    {"confirm",  nat_confirm, 1, JS_PROP_ENUMERABLE},
    {"color2rgb",  nat_rgb, 1, JS_PROP_ENUMERABLE},
    {"win$close",  nat_win_close, 0, JS_PROP_ENUMERABLE},
    {"fileModTime",  nat_modtime, 1, JS_PROP_ENUMERABLE},
    {"resolveURL",  nat_resolveURL, 2, JS_PROP_ENUMERABLE},
    {"eb$newLocation",  nat_new_location, 1, JS_PROP_ENUMERABLE},
    {"domLinkage",  nat_linkage, 5, JS_PROP_ENUMERABLE},
    {"cssDocLoad",  nat_css_start, 3, 0},
    {"eb$cssText",  nat_cssText, 1, 0},
    {"cssApply",  nat_cssApply, 3, 0},
    {"eb$formSubmit",  nat_formSubmit, 0, 0},
    {"eb$formReset",  nat_formReset, 0, 0},
    {"eb$fetchHTTP",  nat_fetchHTTP, 4, 0},
    {"querySelectorAll",  nat_qsa, 2, 0},
    {"querySelector",  nat_qs, 2, 0},
    {"querySelector0",  nat_qs0, 1, 0},
    {"eb$getter_cd",  getter_cd, 0, 0},
    {"eb$getter_cw",  getter_cw, 0, 0},
    {"eb$unframe",  nat_unframe, 1, 0},
    {"eb$unframe2",  nat_unframe2, 1, 0},
    {"eb$playAudio",  nat_playAudio, 0, 0},
    {"pendingJobs",  nat_jobs, 0, JS_PROP_ENUMERABLE},
    {"set_innerHTML",  nat_set_innerHTML, 2, 0},
    {"set_value",  nat_set_value, 2, 0},
    {"eb$media", nat_media, 1, 0},
    {"setTimeout", nat_setTimeout, 2, JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE | JS_PROP_ENUMERABLE},
    {"clearTimeout", nat_clearTimeout, 1, JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE | JS_PROP_ENUMERABLE},
    {"setInterval", nat_setInterval, 2, JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE | JS_PROP_ENUMERABLE},
    {"clearInterval", nat_clearTimeout, 1, JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE | JS_PROP_ENUMERABLE},
    {"eb$parent", nat_parent, 0, 0},
    {"eb$top", nat_top, 0, 0},
    {"eb$frameElement", nat_fe, 0, 0},
    {"eb$hasFocus", nat_hasFocus, 0, 0},
    {"eb$write", nat_doc_write, 0, 0},
    {"eb$writeln", nat_doc_writeln, 0, 0},
    {"eb$gc", nat_gc, 0, 0},
    {0}
};

static void native_setup(JSContext *cx, JSValue w)
{
    const struct native_descriptor *d = native_list;
    while(d->name) {
        JS_DefinePropertyValueStr(cx, w, d->name,
        JS_NewCFunction(cx, d->f, d->name, d->argc), d->properties);
        ++d;
    }
}

// push pending job onto the queue, just to find the queue.
static JSValue firstPending(JSContext *ctx, int argc, JSValueConst *argv)
{
        (void) ctx;
        (void) argc;
        (void) argv;
	debugPrint(3, "pending queue active");
	return JS_TRUE;
}

/*********************************************************************
There is a serious stackoverflow bug,
that I don't have time or space to describe here.
See http://www.eklhad.net/sov.zip
Thus js_main is global instead of static,
so it can be called from main(), the lowest point in the stack.
If it is called for the first time from a function in .ebrc,
a higher point in the stack, that triggers the bug.
Unfortunately this sets up javascript, whether you are going to use it or not.
*********************************************************************/

void js_main(void)
{
JSValue mwo; // master window object
	JSValue r;
	void **lp;
	size_t jsrt_size;
#define MAX_JSRT 2048
	void *save_jsrt[MAX_JSRT / sizeof(void *)];

	if(js_running)
		return;
	jsrt = JS_NewRuntime();
	if (!jsrt) {
		fprintf(stderr, "Cannot create javascript runtime environment\n");
		return;
	}
// default stack size is 256K, which is fine for normal use.
// If we are deminizing code, the deminimizer is written in javascript,
// and it eats up the stack.
	if(WithDebugging)
		JS_SetMaxStackSize(jsrt, 2048*1024);
	mwc = JS_NewContext(jsrt);
	mwo = JS_GetGlobalObject(mwc);

    native_setup(mwc, mwo);

	// load and execute the shared window
	jsSourceFile = "shared.js";
	jsLineno = 1;
	if (strstr(sharedJS, "bp@(")) {
		const char *s, *u, *v1, *v2;
		bool commapresent;
		int l;
		char *s2 = initString(&l);
		u = s = sharedJS;
		while (true) {
			v1 = strstr(u, "bp@(");
			if (!v1)
				break;
			stringAndBytes(&s2, &l, u, v1 - u);
// The macros for bp and trace start and end with ;
// That keeps them separate from what goes on around them.
// But it also makes it impossible to write exp,exp,bp@(huh),exp
// watch for comma on either side, and if so, omit the ;
			while(l && s2[l-1] == ' ')
				s2[--l] = 0;
			commapresent = (l && s2[l-1] == ',');
			stringAndString(&s2, &l,  bp_string + commapresent);
// paste in the argument to bp@(x)
			v1 = strchr(v1, '(') + 1;
			v2 = strchr(v1, ')');
			stringAndBytes(&s2, &l, v1, v2 - v1);
			stringAndString(&s2, &l, "\");");
			u = ++v2;
			while(*u == ' ') ++u;
			if(*u == ',' || *u == ';') {
// commapresent on the other side, don't need trailing ;
				s2[--l] = 0;
			}
		}
		stringAndString(&s2, &l, u);
		r = JS_Eval(mwc, s2, l,
		jsSourceFile, JS_EVAL_TYPE_GLOBAL);
		nzFree(s2);
	} else {
		r = JS_Eval(mwc, sharedJS, strlen(sharedJS),
		jsSourceFile, JS_EVAL_TYPE_GLOBAL);
	}

// If you want to see the errors, you have to run edbrowse -d3
// cause this stuff starts from main().
	if(JS_IsException(r))
		processError(mwc);
	JS_FreeValue(mwc, r);

	jsSourceFile = "demin.js";
	r = JS_Eval(mwc, deminJS, strlen(deminJS),
	jsSourceFile, JS_EVAL_TYPE_GLOBAL);
	if(JS_IsException(r))
		processError(mwc);
	JS_FreeValue(mwc, r);

	jsSourceFile = 0;
	JS_DefinePropertyValueStr(mwc, mwo, "share", JS_NewInt32(mwc, 2), JS_PROP_ENUMERABLE);
	JS_DefinePropertyValueStr(mwc, mwo, "bp_string", JS_NewAtomString(mwc, bp_string + 1), 0);
	JS_DefinePropertyValueStr(mwc, mwo, "trace_string", JS_NewAtomString(mwc, trace_string + 1), 0);

	JS_FreeValue(mwc, mwo);

// Copied from js__malloc_usable_size in quickjs-ng cutils.h without win32
// We use the default allocation functions which use malloc etc
// If we ever provide custom allocation functions, or the library switches its
// defaults, this will need to change
// Note here that we are talking about the underlying allocation functions not
// the library's internal allocation mechanism as that is only used after allocating the runtime

#if defined(__APPLE__)
        jsrt_size = malloc_size(jsrt);
#elif defined(__linux__) || defined(__ANDROID__) || defined(__CYGWIN__) || defined(__FreeBSD__) || defined(__GLIBC__)
        jsrt_size = malloc_usable_size((void *)jsrt);
#else
        jsrt_size = 0;
#endif
        debugPrint(4, "quickjs runtime size %lu", jsrt_size);
	if(jsrt_size > MAX_JSRT) {
                debugPrint(3, "quickjs runtime size %lu > limit %lu, falling back to limit", jsrt_size, MAX_JSRT);
		jsrt_size = MAX_JSRT;
            }
// An allocator that doesn't implement usable size leaves us with no safe
// bound, and then we simply don't look. Say so, because the symptom,
// no promises and no post messages, is a long way from the cause.
	if(!jsrt_size)
		debugPrint(1, "Do not know how to find the size of the js runtime allocation, the pending jobs queue cannot be located");

	memcpy(save_jsrt, jsrt, jsrt_size);
	JS_EnqueueJob(mwc, firstPending, 0, NULL);
// Early variables change, related to memory allocation, so start at 64.
// Even if I started at 0, I would determine that they don't point to the jobs
// queue, and move on, and find the queue later.
// A false positive is virtually impossible.
// False negative only if the queue lies beyond our search range,
// or if the 64-bit pointers aren't 8 byte aligned.
// Don't even form the starting pointer unless the runtime is big enough to
// hold a list head at byte 64.
	if(jsrt_size >= 64 + 2 * sizeof(void *)) {
		for(lp = (void**)((char*)jsrt + 64);
		    (char *)(lp + 2) <= (char*)jsrt + jsrt_size; ++lp) {
			if(*lp != save_jsrt[lp - (void**)jsrt]) {
// validate that the list has just this one entry,
// and that the context and function are correct.
// If all these tests pass, it is a virtual guarantee we have found the queue,
// and, we have the right structures for the list container and the job entry.
				JSJobEntry *je = *lp;
				if(je && je == lp[1] && je->ctx == mwc &&
				je->job_func == firstPending) {
					JSRuntimeJobIndex = (char*)lp - (char*)jsrt;
					break;
				}
			}
		}
	}

// start the jobs pending timer
	if(JSRuntimeJobIndex) {
		JSContext *job_cx;
			debugPrint(3, "pending jobs queue found at location %d", JSRuntimeJobIndex);
// We can't run this job, because it isn't in a proper frame or window.
// The error message might confuse, so let quick run the job.
		JS_ExecutePendingJob(jsrt, &job_cx);
		domSetsTimeout(350, "@@pending", 0, true);
	} else {
		debugPrint(1, "pending jobs queue could not be found, promise jobs and post messages will not run!");
	}
	js_running = true;
}

static void createJSContext_0(Frame *f)
{
	JSContext * cx;
	JSValue g;
	if(!js_running)
		return;
	cx = f->cx = JS_NewContext(jsrt);
	if (!cx)
		return;

// quickjs-ng supports DOMException but doesn't add it to all contexts
#if Q_NG
        if (JS_AddIntrinsicDOMException(cx)) {
            f->cx = NULL;
            JS_FreeContext(cx);
            return;
        }
#endif
	if(debugLevel == 3)
		debugPrint(3, "create js context %d", f->gsn);
	if(debugLevel >= 4)
		debugPrint(4, "create js context %d pointer %p",
		f->gsn, cx);
// the global object, which will become window,
// and the document object.
	f->winobj = allocMem(sizeof(JSValue));
	*((JSValue*)f->winobj) = g = JS_GetGlobalObject(cx);
	grab(g);
// link to the master window
	JS_DefinePropertyValueStr(cx, g, "mw$", JS_GetGlobalObject(mwc), 0);

    native_setup(cx, g);

// The sequence is to set f->fileName, then createContext(), so for a short time,
// we can rely on that variable.
// Let's make it more permanent, per context.
// Has to be nonwritable for security reasons.
// Could be null, e.g. an empty frame, but we can't pass null to quick.
	JS_DefinePropertyValueStr(cx, g, "eb$ctx", JS_NewInt32(cx, f->gsn), 0);
}

static void setup_window_2(void);
void createJSContext(Frame *f)
{
	if (!allowJS)
		return;
	js_main();
	if(!js_running) {
		i_puts(MSG_JSEngineRun);
		return;
	}
	createJSContext_0(f);
	if (f->cx) {
		f->jslink = true;
		setup_window_2();
	} else {
		i_puts(MSG_JavaContextError);
	}
}

static void setup_window_2(void)
{
	JSContext *cx = cf->cx;	// current context
	JSValue w = *((JSValue*)cf->winobj);	// window object
	JSValue d;
	JSValue nav;		// navigator object
	JSValue navpi;	// navigator plugins
	JSValue navmt;	// navigator mime types
	JSValue hist;		// history object
	struct MIMETYPE *mt;
	struct utsname ubuf;
	int i;
	char save_c;

	set_property_object(cx, w, "window", w);

/* the js window/document setup script.
 * These are all the things that do not depend on the platform,
 * OS, configurations, etc. */
	jsRunScriptWin(startWindowJS, "startwindow.js", 1);

	d = JS_GetPropertyStr(cx, w, "document");
	cf->docobj = allocMem(sizeof(JSValue));
	*((JSValue*)cf->docobj) = d;
// we are responsible for this js value, and will be using it
// as long as this frame exists.
	grab(d);

	nav = get_property_object(cx, w, "navigator");
	if (JS_IsUndefined(nav))
		return;
/* some of the navigator is in startwindow.js; the runtime properties are here. */
	set_property_string(cx, nav, "userLanguage", supported_languages[eb_lang]);
	set_property_string(cx, nav, "language", eb_language);
	set_property_string(cx, nav, "appVersion", version);
	set_property_string(cx, nav, "vendorSub", version);
	set_property_string(cx, nav, "userAgent", currentAgent);
	uname(&ubuf);
	set_property_string(cx, nav, "oscpu", ubuf.sysname);
	set_property_string(cx, nav, "platform", ubuf.machine);

/* Build the array of mime types and plugins,
 * according to the entries in the config file. */
	navpi = get_property_object(cx, nav, "plugins");
	navmt = get_property_object(cx, nav, "mimeTypes");
	if (JS_IsUndefined(navpi) || JS_IsUndefined(navmt))
		return;
	mt = mimetypes;
	for (i = 0; i < maxMime; ++i, ++mt) {
		int len;
// po is the plugin object and mo is the mime object
// This structure isn't really right.
		JSValue po = instantiate_array_element(cx, navpi, i, 0);
		JSValue mo = instantiate_array_element(cx, navmt, i, 0);
		if (JS_IsUndefined(po) || JS_IsUndefined(mo))
			return;
		set_property_object(cx, mo, "enabledPlugin", po);
		if(mt->type) {
			set_property_string(cx, mo, "type", mt->type);
		set_property_object(cx, navmt, mt->type, mo);
		}
		if(mt->desc)
			set_property_string(cx, mo, "description", mt->desc);
		if(mt->suffix)
			set_property_string(cx, mo, "suffixes", mt->suffix);
/* I don't really have enough information from the config file to fill
 * in the attributes of the plugin object.
 * I'm just going to fake it.
 * Description will be the same as that of the mime type,
 * and the filename will be the program to run.
 * No idea if this is right or not. */
		if(mt->desc)
			set_property_string(cx, po, "description", mt->desc);
		set_property_string(cx, po, "filename", mt->program);
// For the name, how about the program without its options?
		len = strcspn(mt->program, " \t");
		save_c = mt->program[len];
		mt->program[len] = 0;
		set_property_string(cx, po, "name", mt->program);
		mt->program[len] = save_c;
		set_property_number(cx, po, "length", 1);
		set_property_object(cx, po, "0", mo);
		JS_Release(mo);
		JS_Release(po);
	}
	JS_Release(navpi);
	JS_Release(navmt);
	JS_Release(nav);

	hist = get_property_object(cx, w, "history");
	if (JS_IsUndefined(hist))
		return;
	set_property_string(cx, hist, "current", cf->fileName);
	JS_Release(hist);

	set_property_string(cx, d, "referrer", cw->referrer);
	char *wpc; // webpage with secret code
	createFormattedString(&wpc, "Wp`Set@%s", cf->fileName);
	set_property_string(cx, w, "location", wpc);
	set_property_string(cx, d, "location", wpc);
	free(wpc);
	set_property_string(cx, d, "domain", getHostURL(cf->fileName));
}

void freeJSContext(Frame *f)
{
    if (!f->jslink) return;
    Window *save_cw = cw;
    Frame *save_cf = cf;
    debugPrint(3, "begin js context cleanup for %d", f->gsn);
    freeing_context = f->cx;
/* This looks mad on paper because it appears that we're going to lose our
document and window objects as well as the context. However, from reading the
quick code, the document and window objects as returned to us are both just
references so all this does is decrease the ref counts by 1.
Also note that, when running pending jobs, values referenced by the job args have their ref counts incremented so, even if something really odd is going on,
they'll still be live for the purposes of that job function call.
*/
    JS_Release(*((JSValue*)f->docobj));
    JS_Release(*((JSValue*)f->winobj));

/* Run GC explicitly prior to freeing the frame to at least have a chance of
catching the finalisers. This actually runs over the whole runtime but js is
single-threaded so we should be good */
    JS_RunGC(jsrt);
/* quick uses pending jobs for finalizers; when freeing a context we simply
clean up the pending jobs rather than run them as doing so is unsafe */
    my_ExecutePendingJobs(0, false);
/* This will either free the context or decrease its ref count so it can go on
a future GC run. There's a possibility that what we need to do is check the
liveness of the context and do something equivalent to the above in case
someone's placed a finalisation registry on the global object but I'm not sure what they'd be expecting in that event.
*/
    JS_FreeContext(f->cx);
// Run the GC again in case freeing the context allows any objects to be freed
    JS_RunGC(jsrt);
/* No need to clean pending jobs again; if there's some path where pending jobs
are created by the above gc run they'll go away at some point */
    debugPrint(3, "complete js context cleanup for %d", f->gsn);
    cssFree(f);
    free(f->winobj);
    free(f->docobj);
    f->winobj = f->docobj = f->cx = 0;
    f->jslink = false;
    freeing_context = NULL;
    cw = save_cw, cf = save_cf;
}

static bool has_property(JSContext *cx, JSValueConst parent, const char *name)
{
	JSAtom a = JS_NewAtom(cx, name);
	bool l = JS_HasProperty(cx, parent, a);
	JS_FreeAtom(cx, a);
	return l;
}

bool has_property_t(const Tag *t, const char *name)
{
	if(!t->jslink || !allowJS)
		return false;
	return has_property(t->f0->cx, *((JSValue*)t->jv), name);
}

bool has_property_win(const Frame *f, const char *name)
{
	if(!f->jslink || !allowJS)
		return false;
	return has_property(f->cx, *((JSValue*)f->winobj), name);
}

// Functions that help decorate the DOM tree, called from decorate.c.

void establish_js_option(Tag *t, Tag *sel, Tag *og)
{
    JSContext *cx = cf->cx; // context
    JSValue oo;		// option object
    JSValue selobj; // select object
    if(!sel->jslink) return;
    selobj = *((JSValue*)sel->jv);
    oo = instantiate(cx, selobj, 0, "HTMLOptionElement");
    connectTagObject(t, oo);
    set_property_string(cx, oo, "text", t->textval);
    set_property_string(cx, oo, "value", t->value);
    // have to established checked before we call the next function
    // we don't need the side effects, this is from html and we build as we go.
    set_property_bool(cx, oo, "selected$2", t->checked);
    set_property_bool(cx, oo, "defaultSelected", t->checked);
    if (t->checked && !sel->multiple)
        set_property_number(cx, selobj, "selectedIndex", t->lic);
    run_function_onearg_t((og ? og : sel), "option_from_html", t);
}

void establish_js_textnode(Tag *t)
{
	JSContext *cx = cf->cx;
	 JSValue tagobj = instantiate(cx, *((JSValue*)cf->winobj), 0, "Text");
	connectTagObject(t, tagobj);
}

void domLink(Tag *t, const char *classname,	/* instantiate this class */
		    const Tag * owntag,
// owner tag is form for input elements, table for sections or rows,
// row for cells, and above for unknown elements from innerHTML.
int extra) // bits: radio, window, document, unknown
{
    JSContext *cx = cf->cx;
    JSValue owner = JS_NULL;
    JSValue io = JS_UNDEFINED;	// the input object
    int action = t->action;
    uchar isunknown = (extra&8);
    	static const char * const z_list[] = {
        "Header", "Footer", "Title", "Datalist",
        "tHead", "tBody", "tFoot", "HTML", 0};
    char class_z[11]; // room for the largest in the list
    const char *classtweak = classname;
    if(stringInList(z_list, classname) >= 0) {
        sprintf(class_z, "z$%s", classname);
        classtweak = class_z;
    }

    debugPrint(5, "domLink %s.%d",
       classname, extra);
    extra &= 6;

    if(owntag)
        owner = *((JSValue*)owntag->jv);
if(extra == 2)
        owner = *((JSValue*)cf->winobj);
if(extra == 4)
        owner = *((JSValue*)cf->docobj);

// Instantiate the object - could be a custom element.
    if(isunknown && !cf->xmlMode)
        io = instantiate_custom(cx, owner, classname);
    else
        io = instantiate(cx,
        *((JSValue*)cf->winobj), 0, classtweak);
    if(JS_IsUndefined(io)) return;

    if(t->action != TAGACT_DOCTYPE) {
        if(!stringEqual(t->nodeNameU, "CDATA") &&
        !stringEqual(t->nodeNameU, "COMMENT")) {
            char *js_node = cloneString(t->nodeName);
            if(!cf->xmlMode) {
                if((action >= TAGACT_SVG && action <= TAGACT_POLYGON) ||
                stringEqual(classname, "SVGStyleElement") ||
                stringEqual(classname, "SVGTitleElement")) {
                    caseShift(js_node, 'l');
                    if(stringEqual(js_node, "lineargradient"))
                        js_node[6] = 'G';
                } else {
                    caseShift(js_node, 'u');
                }
            }
            define_hidden_property_string(cx, io, "nodeName", js_node);
            define_hidden_property_string(cx, io, "tagName", js_node);
            nzFree(js_node);
        }
    }
    connectTagObject(t, io);
}

static void rebuildSelector(Tag *sel, JSValue oa, int len2)
{
    char *s = displayOptions(sel);
    if (!s) s = emptyString;
    domSetsTagValue(sel, s);
    nzFree(s);
}

void rebuildSelectors(void)
{
	int i1;
	Tag *t;
	JSContext *cx;
	JSValue oa;		/* option array */
	int len;		/* length of option array */

	for (i1 = 0; i1 < cw->numTags; ++i1) {
		t = tagList[i1];
		if (!t->jslink || (t->action != TAGACT_DATAL &&
		(t->action != TAGACT_INPUT || t->itype != INP_SELECT)))
			continue;

// there should always be an options array, if not then move on
	cx = t->f0->cx;
		oa = get_property_object(cx, *((JSValue*)t->jv), "options");
		if(JS_IsUndefined(oa))
			continue;
		if ((len = get_arraylength(cx, oa)) < 0)
			continue;
		rebuildSelector(t, oa, len);
		JS_Release(oa);
	}
}

// Some primitives needed by css.c. These bounce through window.soj$
static const char soj[] = "soj$";
static void sofail(void) { debugPrint(3, "no style object"); }

int get_gcs_number(const char *name)
{
	JSContext * cx = cf->cx;
	int l = -1;
	JSValue g = *(JSValue*)cf->winobj, j;
	j = get_property_object(cx,  g, soj);
	if(JS_IsUndefined(j)) {
		sofail();
		return -1;
	}
		l = get_property_number(cx, j, name);
	JS_Release(j);
	return l;
}

void set_gcs_number(const char *name, int n)
{
	JSContext * cx = cf->cx;
	JSValue g = *(JSValue*)cf->winobj, j;
	j = get_property_object(cx,  g, soj);
	if(JS_IsUndefined(j)) {
		sofail();
		return;
	}
// this should not be enumerable
	JS_DefinePropertyValueStr(cx, j, name, JS_NewInt32(cx, n),
	JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE);
	JS_Release(j);
}

void set_gcs_bool(const char *name, bool v)
{
	JSContext * cx = cf->cx;
	JSValue g = *(JSValue*)cf->winobj, j;
	j = get_property_object(cx,  g, soj);
	if(JS_IsUndefined(j)) {
		sofail();
		return;
	}
	set_property_bool(cx, j, name, v);
	JS_Release(j);
}

void set_gcs_string(const char *name, const char *s)
{
	JSContext * cx = cf->cx;
	JSValue g = *(JSValue*)cf->winobj, j;
	j = get_property_object(cx,  g, soj);
	if(JS_IsUndefined(j)) {
		sofail();
		return;
	}
	set_property_string(cx, j, name, s);
	JS_Release(j);
}

void jsClose(void)
{
    if(js_running) {
        JS_FreeContext(mwc);
        grabover();
// release the timer for pending jobs
        domSetsTimeout(0, "-", 0, false);
// Clear out any orphan pending jobs, before shutdown.
// We were doing this during debugging but it seems like a bad idea.
//        my_ExecutePendingJobs(0, false);
        JS_FreeRuntime(jsrt);
    }
}

// This function disconects the children at a C level.
// It use to disassemble the entire subtree, and disconnect from js,
// but it should do neither.
void underKill(Tag *t)
{
    Tag *u;
    while((u = t->firstchild)) {
        u->parent = 0, t->firstchild = u->sibling, u->sibling = 0;
        u->deleted = true;// still connected to js, but do not render
        // sometimes this is called from htl-tags.c, from prerender().
        // We are about to decorate with js objects, but these tags
        // should not be decorated.
        if(!u->jslink) u->dead = true;
    }
}

// set the base url, stored in eb$base.
// This is per engine, because it should be readonly, for security reasons.
void set_basehref(const char *h)
{
	JSContext *cx = cf->cx;
	JSValue w = *(JSValue*)cf->winobj;
	JSValue d = *(JSValue*)cf->docobj;
	if (!h)
		h = emptyString;
	set_property_string(cx, w, "eb$base", h);
// This is special code for snapshot simulations.
// If the file jslocal is present, push base over to window.location,
// as though you were running that page.
	if (!access("jslocal", 4) && h[0] && cf == &cw->f0) {
		char *wpc; // webpage with secret code
		createFormattedString(&wpc, "Wp`Set@%s", h);
		set_property_string(cx, w, "location", wpc);
		set_property_string(cx, d, "location", wpc);
		free(wpc);
		nzFree(cf->fileName);
		cf->fileName = cloneString(h);
// need curl to be active even if it's a local snapshot - for cookies
		if (!curlActive) {
			eb_curl_global_init();
			cookiesFromJar();
			setupEdbrowseCache();
		}
	}
}

/*********************************************************************
If javascript sets the hash, we're suppose to jump to that location on the
screen, I think, but if the hash is part of the url,
and we jump to that location at the start,
edbrowse needs to set the hash.
We set it manually, through the back door,
so we don't triggger any side effects.
This is just a wrapper, calling its counterpart in js.
*********************************************************************/

void set_location_hash(const char *h)
{
	JSValue g;
	JSContext *cx;
	if(!(allowJS && cf->jslink))
		return; // js not running
	cx = cf->cx;
	g = *(JSValue*)cf->winobj;
	run_function_onearg(cx, g, "set_location_hash", JS_NewAtomString(cx, h));
}

const char *jseng_version(void)
{
#if Q_NG
	return JS_GetVersion();
#else
	return "unknown";
#endif
}
