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

#include <stddef.h>
#include <sys/utsname.h>

#if Q_NG
#include "quickjs.h"
#define wrap_IsArray(c,a) JS_IsArray(a)
#else
#include "quickjs-libc.h"
#define wrap_IsArray(c,a) JS_IsArray(c,a)
#endif

// to track down memory leaks
// Warning, if you turn this feature on it slows things down, a lot!
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
#define JS_Release(c, v) release(v),JS_FreeValue(c, v)
#else
#define grab(v)
#define release(v)
#define grabover()
#define JS_Release(c, v) JS_FreeValue(c, v)
#endif

const char *jsSourceFile;	// sourcefile providing the javascript
int jsLineno;			// line number
static JSRuntime *jsrt;
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
	if(cx == mwc)
		return false;
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
static Tag *tagFromObject(JSValueConst v);
static int run_function_onearg(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child);
static bool run_event(JSContext *cx, JSValueConst obj, const char *pname, const char *evname);

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
	JS_Release(cx, v);
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
	JS_Release(cx, v);
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
	JS_Release(cx, v);
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
	JS_Release(cx, v);
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
	JS_Release(cx, v);
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
	JS_Release(cx, uo);
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
	JS_Release(cx, so);
	return result;
}

// Before we write set_property_string, we need some getters and setters.

static JSValue getter_innerHTML(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	return JS_GetPropertyStr(cx, this, "inner$HTML");
}

static JSValue setter_innerHTML(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	JSValue c1, c2;
	char *run;
	int run_l;
	Tag *t;
	const char *h = JS_ToCString(cx, argv[0]);
	if (!h)			// should never happen
		return JS_UNDEFINED;
	debugPrint(5, "setter h in");
// remove the preexisting children.
	c1 = JS_GetPropertyStr(cx, this, "childNodes");
	grab(c1);
	if(!wrap_IsArray(cx, c1)) {
// no child nodes array, don't do anything.
// This should never happen.
		debugPrint(5, "setter h fail");
		JS_Release(cx, c1);
		JS_FreeCString(cx, h);
		return JS_UNDEFINED;
	}
// make new childNodes array
	c2 = JS_NewArray(cx);
	grab(c2);
	JS_SetPropertyStr(cx, this, "childNodes", JS_DupValue(cx, c2));
	const char *h1 = h;
// secret code for xml
	if(!strncmp(h1, "`~*xml}@;", 9)) h1 += 9;
	JS_SetPropertyStr(cx, this, "inner$HTML", JS_NewAtomString(cx, h1));

// Put some tags around the html, so we can parse it.
	run = initString(&run_l);
	if(h1 > h) stringAndBytes(&run, &run_l, h, 9);
	stringAndString(&run, &run_l, "<body>");
	stringAndString(&run, &run_l, h1);
	stringAndString(&run, &run_l, "</body>");

// now turn the html into objects
		t = tagFromObject(this);
	if(t) {
		html_from_setter(t, run);
	} else {
		debugPrint(1, "innerHTML finds no tag, cannot parse");
	}
	nzFree(run);
	debugPrint(5, "setter h out");

	run_function_onearg(cx, *((JSValue*)cf->winobj), "textarea$html$crossover", this);

// mutation fix up from native code
	{
		JSValue g = *(JSValue*)cf->winobj, r;
		JSAtom a = JS_NewAtom(cx, "mutFixup");
		JSValue l[4];
		l[0] = this;
		l[1] = JS_FALSE;
		l[2] = c2;
		l[3] = c1;
		r = JS_Invoke(cx, g, a, 4, l);
// worked, didn't work, I don't care.
		JS_FreeValue(cx, r);
		JS_FreeAtom(cx, a);
	}

		JS_Release(cx, c2);
		JS_Release(cx, c1);
		JS_FreeCString(cx, h);
	return JS_UNDEFINED;
}

static JSValue getter_value(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	return JS_GetPropertyStr(cx, this, "val$ue");
}

static JSValue setter_value(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	char *k;
	Tag *t;
	const char *h = JS_ToCString(cx, argv[0]);
	if (!h)			// should never happen
		return JS_UNDEFINED;
	debugPrint(5, "setter v in");
	JS_SetPropertyStr(cx, this, "val$ue", JS_NewAtomString(cx, h));
	k = cloneString(h);
	prepareForField(k);
	JS_FreeCString(cx, h);
	t = tagFromObject(this);
	if(t) {
		debugPrint(4, "value tag %d=%s", t->seqno, k);
		domSetsTagValue(t, k);
	}
	nzFree(k);
	debugPrint(5, "setter v out");
	return JS_UNDEFINED;
}

static void set_property_string(JSContext *cx, JSValueConst parent, const char *name,
			    const char *value)
{
	bool defset = false;
	JSCFunction *getter = 0;
	JSCFunction *setter = 0;
	const char *altname;
	if (stringEqual(name, "innerHTML"))
		getter = getter_innerHTML,
		setter = setter_innerHTML,
		    altname = "inner$HTML";
	if (stringEqual(name, "value")) {
// Only meaningful in the Element class
		JSValue dc = JS_GetPropertyStr(cx, parent, "dom$class");
		const char *dcs = JS_ToCString(cx, dc);
		grab(dc);
		if(stringEqual(dcs, "HTMLInputElement") ||
		stringEqual(dcs, "HTMLTextAreaElement"))
			getter = getter_value,
			setter = setter_value,
			    altname = "val$ue";
		JS_FreeCString(cx, dcs);
		JS_Release(cx, dc);
	}
	if (setter) {
// see if we already did this - does the property show up as a string?
		if(typeof_property(cx, parent, name) != EJ_PROP_STRING)
			defset = true;
	}
	if (defset) {
		JSAtom a = JS_NewAtom(cx, name);
		JS_DefinePropertyGetSet(cx, parent, a,
		JS_NewCFunction(cx, getter, "get", 0),
		JS_NewCFunction(cx, setter, "set", 0),
		0);
		JS_FreeAtom(cx, a);
// so it can be not enumerable
		JS_DefinePropertyValueStr(cx, parent, altname, JS_UNDEFINED, JS_PROP_WRITABLE);
	}
	if (!value)
		value = emptyString;
	JS_SetPropertyStr(cx, parent, (setter ? altname : name), JS_NewAtomString(cx, value));
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

static void define_hidden_property_number(JSContext *cx, JSValueConst parent, const char *name,
			    int n)
{
	JS_DefinePropertyValueStr(cx, parent, name,
	JS_NewInt32(cx, n),
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

static void define_hidden_property_object(JSContext *cx, JSValueConst parent, const char *name, JSValueConst child)
{
	JS_DefinePropertyValueStr(cx, parent, name, JS_DupValue(cx, child),
	JS_PROP_CONFIGURABLE|JS_PROP_WRITABLE);
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

static JSValue instantiate_array(JSContext *cx, JSValueConst parent, const char *name)
{
	debugPrint(5, "new Array");
	JSValue a = JS_NewArray(cx);
	grab(a);
	set_property_object(cx, parent, name, a);
	return a;
}

static JSValue instantiate_hidden_array(JSContext *cx, JSValueConst parent, const char *name)
{
	debugPrint(5, "new Array");
	JSValue a = JS_NewArray(cx);
	grab(a);
	define_hidden_property_object(cx, parent, name, a);
	return a;
}

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
			JS_Release(cx, v);
			return JS_UNDEFINED;
		}
		o = JS_CallConstructor(cx, v, 0, l);
		grab(o);
		JS_Release(cx, v);
		if(JS_IsException(o)) {
			if (intFlag)
				i_puts(MSG_Interrupted);
			processError(cx);
			debugPrint(3, "failure on new %s()", classname);
			uptrace(cx, parent);
			JS_Release(cx, o);
			return JS_UNDEFINED;
		}
	}
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
			JS_Release(cx, v);
			return JS_UNDEFINED;
		}
		o = JS_CallConstructor(cx, v, 0, l);
		grab(o);
		JS_Release(cx, v);
		if(JS_IsException(o)) {
			if (intFlag)
				i_puts(MSG_Interrupted);
			processError(cx);
			debugPrint(3, "failure on new %s()", classname);
			uptrace(cx, parent);
			JS_Release(cx, o);
			return JS_UNDEFINED;
		}
	}
	set_array_element_object(cx, parent, idx, o);
	return o;
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
		JS_Release(cx, v);
	}
// don't print message function running in and out, it runs all the time!
	if (stringEqual(name, "onmessage$$running"))
		dbl = 9;
	v = JS_GetPropertyStr(cx, parent, name);
	grab(v);
	if(!JS_IsFunction(cx, v)) {
		debugPrint(3, "no such function %s", name);
		JS_Release(cx, v);
		return false;
	}
	if (seqno > 0)
		debugPrint(dbl, "exec %s timer %d context %d", name, seqno, cf->gsn);
	else
		debugPrint(dbl, "exec %s", name);
	r = JS_Call(cx, v, parent, 0, l);
	grab(r);
	JS_Release(cx, v);
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
		JS_Release(cx, r);
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
	run_event(cx, to, "timer", "ontimer");
	JS_Release(cx, to);
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
		JS_Release(cx, v);
		return -1;
	}
	l[0] = child;
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(cx, v);
	if(!JS_IsException(r)) {
		int rc = -1;
		int32_t n = -1;
		if(JS_IsBool(r))
			rc = JS_ToBool(cx, r);
		if(JS_IsNumber(r)) {
			JS_ToInt32(cx, &n, r);
			rc = n;
		}
		JS_Release(cx, r);
		return rc;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(obj)", name);
	uptrace(cx, parent);
	JS_Release(cx, r);
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
		JS_Release(cx, v);
		return;
	}
	l[0] = JS_NewAtomString(cx, s);
	grab(l[0]);
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(cx, v);
	JS_Release(cx, l[0]);
	if(!JS_IsException(r)) {
		JS_Release(cx, r);
		return;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s)", name, s);
	uptrace(cx, parent);
	JS_Release(cx, r);
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
		JS_Release(cx, v);
		return 0;
	}
	l[0] = JS_NewAtomString(cx, s);
	grab(l[0]);
	r = JS_Call(cx, v, parent, 1, l);
	grab(r);
	JS_Release(cx, v);
	JS_Release(cx, l[0]);
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
		JS_Release(cx, r);
		return result;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s)", name, s);
	uptrace(cx, parent);
	JS_Release(cx, r);
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
		JS_Release(cx, v);
		return;
	}
	l[0] = JS_NewAtomString(cx, s1);
	grab(l[0]);
	l[1] = JS_NewAtomString(cx, s2);
	grab(l[1]);
	r = JS_Call(cx, v, parent, 2, l);
	grab(r);
	JS_Release(cx, v);
	JS_Release(cx, l[0]);
	JS_Release(cx, l[1]);
	if(!JS_IsException(r)) {
		JS_Release(cx, r);
		return;
	}
// error in execution
	if (intFlag)
		i_puts(MSG_Interrupted);
	processError(cx);
	debugPrint(3, "failure on %s(%s,%s)", name, s1, s2);
	uptrace(cx, parent);
	JS_Release(cx, r);
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
	char *result = 0;
	JSValue r;
	char *s2 = 0;
	const char *s3;
	const char *ebnobp = getenv("EBNOBP");
	int commapresent;

// special debugging code to replace bp@ and trace@ with expanded macros.
// Warning: breakpoints and tracing can change the flow of execution
// in unusual cases, e.g. when a js verifyer checks f.toString(),
// and of course it will be very different with the debugging stuff in it.
	if((!ebnobp || !*ebnobp) &&
	(strstr(s, "bp@(") || strstr(s, "trace@("))) {
		int l;
		const char *u, *v1, *v2;

		s2 = initString(&l);
		u = s;
		while (true) {
			v1 = strstr(u, "bp@(");
			v2 = strstr(u, "trace@(");
			if (v1 && v2 && v2 < v1)
				v1 = v2;
			if (!v1)
				v1 = v2;
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

			stringAndString(&s2, &l, (*v1 == 'b' ?
			bp_string + commapresent
			  :
			trace_string + commapresent
			) );

// paste in the argument to bp@(x) or trace@(x)
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
	}

	s3 = (s2 ? s2 : s);
	r = JS_Eval(cx, s3, strlen(s3),
	(jsSourceFile ? jsSourceFile : "internal"), JS_EVAL_TYPE_GLOBAL);
	grab(r);
	nzFree(s2);
	if (intFlag)
		i_puts(MSG_Interrupted);
	if(!JS_IsException(r)) {
		s = JS_ToCString(cx, r);
		if(s && *s)
			result = cloneString(s);
		JS_FreeCString(cx, s);
	} else {
		processError(cx);
	}
	JS_Release(cx, r);
	return result;
}

// execute script.text code; more efficient than the above.
void jsRunData(const Tag *t, const char *filename, int lineno)
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
	v = JS_GetPropertyStr(cx, *((JSValue*)t->jv), "text");
	grab(v);
	if(!JS_IsString(v)) {
// no data
		jsSourceFile = 0;
		JS_Release(cx, v);
		return;
	}
	s = JS_ToCString(cx, v);
	if (!s || !*s) {
		jsSourceFile = 0;
		JS_FreeCString(cx, s);
		JS_Release(cx, v);
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
		(jsSourceFile ? jsSourceFile : "internal"), JS_EVAL_TYPE_GLOBAL);
		grab(r);
		if (intFlag)
			i_puts(MSG_Interrupted);
		if(JS_IsException(r))
			processError(cx);
		JS_Release(cx, r);
	}
	JS_FreeCString(cx, s);
	jsSourceFile = NULL;
	delete_property(cx, *((JSValue*)t->f0->docobj), "currentScript");
// onload handler? Should this run even if the script fails?
// Right now it does.
// The script could be removed, replaced by other nodes by innerHTML.
	if (t->jslink && isURL(t->href) && !isDataURI(t->href))
		run_event(cx, *((JSValue*)t->jv), "script", "onload");
	debugPrint(5, "< ok");
}

// Run some javascript code under the named object, usually window.
// Pass the return value of the script back as a string.
static char *jsRunScriptResult(const Frame *f, const char *str,
const char *filename, 			int lineno)
{
	char *result;
	if (!allowJS || !f->jslink)
		return NULL;
	if (!str || !str[0])
		return NULL;
	debugPrint(5, "> script:");
	jsSourceFile = filename;
	jsLineno = lineno;
	result = run_script(f->cx, str);
	jsSourceFile = NULL;
	debugPrint(5, "< ok");
	return result;
}

/* like the above but throw away the result */
void jsRunScriptWin(const char *str, const char *filename, 		 int lineno)
{
	char *s = jsRunScriptResult(cf, str, filename, lineno); 	nzFree(s);
}

void jsRunScript_t(const Tag *t, const char *str, const char *filename, 		 int lineno)
{
	char *s = jsRunScriptResult(t->f0, str, filename, lineno);
	nzFree(s);
}

char *jsRunScriptWinResult(const char *str,
const char *filename, 			int lineno)
{
return jsRunScriptResult(cf, str, filename, lineno);
}

static JSValue create_event(JSContext *cx, JSValueConst parent, const char *evname)
{
	JSValue e;
	const char *evname1 = evname;
	if (evname[0] == 'o' && evname[1] == 'n')
		evname1 += 2;
// gc$event protects from garbage collection
	e = instantiate(cx, parent, "gc$event", "Event");
	set_property_string(cx, e, "type", evname1);
	return e;
}

static void unlink_event(JSContext *cx, JSValueConst parent)
{
	delete_property(cx, parent, "gc$event");
}
// Run a non-capturing, non-bubbling event
static bool run_event(JSContext *cx, JSValueConst obj, const char *pname, const char *evname)
{
    int rc;
    JSValue eo;	// created event object
    eo = create_event(cx, obj, evname);
    set_property_bool(cx, eo, "eb$captures", false);
    set_property_bool(cx, eo, "bubbles", false);
    rc = run_function_onearg(cx, obj, "dispatchEvent", eo);
    unlink_event(cx, obj);
    JS_Release(cx, eo);
    return rc;
}

bool run_event_t(const Tag *t, const char *pname, const char *evname)
{
	if (!allowJS || !t->jslink)
		return true;
	return run_event(t->f0->cx, *((JSValue*)t->jv), pname, evname);
}

bool run_event_win(const Frame *f, const char *pname, const char *evname)
{
	if (!allowJS || !f->jslink)
		return true;
	return run_event(f->cx, *((JSValue*)f->winobj), pname, evname);
}

bool run_event_doc(const Frame *f, const char *pname, const char *evname)
{
	if (!allowJS || !f->jslink)
		return true;
	return run_event(f->cx, *((JSValue*)f->docobj), pname, evname);
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
		unlink_event(cx, *((JSValue*)t->jv));
	JS_Release(cx, e);
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
		JS_Release(cx, nnv);
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
		JS_Release(cx, cnv);
		pn = JS_GetPropertyStr(cx, node, "parentNode");
		grab(pn);
		if(!first)
			JS_Release(cx, node);
		first = false;
		pntype = top_proptype(cx, pn);
		if(pntype == EJ_PROP_NONE)
			break;
		if(pntype == EJ_PROP_NULL) {
			debugPrint(3, "null");
			JS_Release(cx, pn);
			break;
		}
		if(pntype != EJ_PROP_OBJECT) {
			debugPrint(3, "parentNode not object, type %d", pntype);
			JS_Release(cx, pn);
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
	JS_Release(t->f0->cx, *((JSValue*)t->jv));
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

static Tag *tagFromObject(JSValueConst v)
{
	int i;
	if (!tagList)
		i_printfExit(MSG_NullListInform);
	if(!JS_IsObject(v)) {
		debugPrint(3, "tagFromObject(nothing)");
		return 0;
	}
	for (i = 0; i < cw->numTags; ++i) {
		Tag *t = tagList[i];
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
static JSValue nat_array(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	return JS_NewArray(cx);
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
	    return JS_UNDEFINED;
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
		JS_Release(cx, cd2);
		JS_Release(cx, cw2);
// technically this is loaded, even though could be error 404,
// or incorect content type, etc.
// The onload function didn't run after browse; run it now.
		if (isURL(t->href) && !isDataURI(t->href))
			run_event_t(t, t->info->name, "onload");
	}
	cf = save_cf;
	jsSourceFile = save_src;
	jsLineno = save_lineno;
	pluginsOn = save_plug;
}

// We need to call and remember up to 3 node names, to carry dom changes
// across to html. As in parent.insertBefore(newChild, existingChild);
// These names are passed into domSetsLinkage().
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
	JS_Release(cx, v);
	caseShift(b, 'l');
        cycle = (cycle + 1) % 3;
	return b;
}

static void domSetsLinkage(char type,
JSValueConst p_j, const char *p_name,
JSValueConst a_j, const char *a_name,
JSValueConst b_j, const char *b_name)
{
	Tag *parent, *add, *before, *c, *t;
	int action;
	char *jst;		// javascript string
	JSContext *cx = cf->cx;

// Some functions in demin.js create, link, and then remove nodes, before
// there is a document. Don't run any side effects in this case.
	if (!cw->tags)
		return;

	if (type == 'c') {	// create
		parent = tagFromObject2(JS_DupValue(cx, p_j), p_name);
		if (parent) {
			debugPrint(4, "linkage, %s %d created",
				   p_name, parent->seqno);
// creating the new tag, with t->jv, represents a regrab
			grab(p_j);
			if (parent->action == TAGACT_INPUT) {
// we need to establish the getter and setter for value
				set_property_string(parent->f0->cx,
				*((JSValue*)parent->jv), "value", emptyString);
			}
			if (parent->action == TAGACT_SCRIPT)
				parent->scriptgen = true;
		}
		return;
	}

/* options are relinked by rebuildSelectors, not here. */
	if (stringEqual(p_name, "option"))
		return;

	if (stringEqual(a_name, "option"))
		return;

	parent = tagFromObject(p_j);
// If parent node has been removed, we don't have to keep its linkage current.
	if (!parent)
		return;
	if(!(add = tagFromObject(a_j))) {
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
				before = tagFromObject(b_j);
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
		before = tagFromObject(b_j);
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
	nzFree(t->name);
	t->name = get_property_string(cx, *((JSValue*)t->jv), "name");
	nzFree(t->id);
	t->id = get_property_string(cx, *((JSValue*)t->jv), "id");
	nzFree(t->jclass);
	t->jclass = get_property_string_t(t, "class");

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

// as above, with fewer parameters
static void domSetsLinkage1(char type,
JSValueConst p_j, const char *p_name,
JSValueConst a_j, const char *a_name)
{
domSetsLinkage(type, p_j, p_name, a_j, a_name, JS_UNDEFINED, emptyString);
}

static bool append0(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv, bool side)
{
	int i, length;
	JSValue child, cn;
	const char *thisname, *childname;
	bool rc = false;

/* we need one argument that is an object */
	if (argc != 1 || !JS_IsObject(argv[0]))
		return false;

	debugPrint(5, "append in");
	child = argv[0];
	cn = JS_GetPropertyStr(cx, this, "childNodes");
	grab(cn);
	if(!wrap_IsArray(cx, cn))
		goto done;

	rc = true;
	length = get_arraylength(cx, cn);
// see if it's already there.
	for (i = 0; i < length; ++i) {
		JSValue v = get_array_element_object(cx, cn, i);
		bool same = (JS_VALUE_GET_PTR(v) == JS_VALUE_GET_PTR(child));
		JS_Release(cx, v);
		if(same)
// child was already there, just return.
// Were we suppose to move it to the end? idk
			goto done;
	}

// add child to the end
	set_array_element_object(cx, cn, length, child);
set_property_object(cx, child, "parentNode", this);
	rc = true;

	if (!side)
		goto done;

/* pass this linkage information back to edbrowse, to update its dom tree */
	thisname = embedNodeName(cx, this);
	childname = embedNodeName(cx, child);
	domSetsLinkage1('a', this, thisname, child, childname);

done:
	JS_Release(cx, cn);
	debugPrint(5, "append out");
	return rc;
}

static JSValue nat_apch1(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
	if(append0(cx, this, argc, argv, false))
		return JS_DupValue(cx, argv[0]);
	return JS_NULL;
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

int my_ExecutePendingJobs(void)
{
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
        if(cnt == 10 && !freeing_context) break;
        e = list_entry(l, JSJobEntry, link);
        ctx = e->ctx;
        if (freeing_context && ctx != freeing_context) continue;
// This line resets cw and cf, and we don't put it back, so the calling routine must restore it.
        if (!frameFromContext(ctx)) {
            if(ctx == mwc)
                debugPrint(3, "frameFromContext finds master window");
            else {
                debugPrint(3, "frameFromContext cannot find a frame for pointer %p", ctx);
                debugPrint(3, "It is not safe to run this job (%d arguments), or free its context!", e->argc);
                debugPrint(3, "But it's not great leaving the context around either.");
                list_del(&e->link);
// We can't use the context but we can free directly from the runtime
// freeing things is an instant core dump,
// but if we don't, we'll see one later when we free the runtime
#if 0
                for(i = 0; i < e->argc; ++i)
                    if (JS_IsLiveObject(jsrt, e->argv[i]))
                        JS_FreeValueRT(jsrt, e->argv[i]);
                js_free_rt(jsrt, e);
#endif

                continue;
            }
        }

// Browsing a new web page in the current session pushes the old one, like ^z
// in Linux. The prior page suspends, and the timers and pendings suspend.
// ^ is like fg, bringing it back to life.
        if(!freeing_context && sessionList[cw->sno].lw != cw) continue;

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
            else debugPrint(3, "deleting %s for freeing context %d", job_type, cf->gsn);
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

// see if any jobs would run, if you called the above
bool pendingJobsForCurrentWindow(void)
{
    JSContext *ctx;
    JSJobEntry *e;
				struct list_head *l;
	struct list_head *jl = (struct list_head *)((char*)jsrt + JSRuntimeJobIndex);

// high runner case
    if (list_empty(jl)) return false;

    Window *save_cw = cw;
    Frame *save_cf = cf;
    bool rc = false;

    list_for_each(l, jl) {
	e = list_entry(l, JSJobEntry, link);
	ctx = e->ctx;
// This line resets cw and cf
	if (!frameFromContext(ctx)) continue;
	if(sessionList[cw->sno].lw != cw) continue;
	rc = true;
	break;
    }
    cw = save_cw, cf = save_cf;
				return rc;
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
				JS_Release(cx0, ra);
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
				JS_Release(cx0, port);
			}
			JS_Release(cx0, ra);
		}
	}
	return rc;
}

// We don't use this function any more
// bgarbage collect, strictly for debugging
static JSValue nat_gc(JSContext * cx, JSValueConst this, int argc, JSValueConst *argv)
{
    JS_RunGC(jsrt);
    return JS_UNDEFINED;
}

// push pending job onto the queue, just to find the queue.
static JSValue firstPending(JSContext *ctx, int argc, JSValueConst *argv)
{
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
	void **lp;
#define MAX_JSRT 512
	uchar save_jsrt[MAX_JSRT];

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
	jsSourceFile = 0;
	JS_DefinePropertyValueStr(mwc, mwo, "share", JS_NewInt32(mwc, 2), JS_PROP_ENUMERABLE);
	JS_FreeValue(mwc, mwo);

	memcpy(save_jsrt, jsrt, MAX_JSRT);
		JS_EnqueueJob(mwc, firstPending, 0, NULL);
// Early variables change, related to memory allocation, so start at 64.
// Even if I started at 0, I would determine that they don't point to the jobs
// queue, and move on, and find the queue later.
// A false positive is virtually impossible.
// False negative only if the struct is larger than 512,
// or if the 64-bit pointers aren't 8 byte aligned.
	for(lp = (void**)((char*)jsrt + 64); lp < (void**)((char*)jsrt+MAX_JSRT); ++lp) {
		if(*lp != *((void**)save_jsrt + (lp-(void**)jsrt))) {
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
	debugPrint(3, "create js context %d pointer %p",
	f->gsn, cx);
// the global object, which will become window,
// and the document object.
	f->winobj = allocMem(sizeof(JSValue));
	*((JSValue*)f->winobj) = g = JS_GetGlobalObject(cx);
	grab(g);
// link to the master window
	JS_DefinePropertyValueStr(cx, g, "mw$", JS_GetGlobalObject(mwc), 0);

    JS_DefinePropertyValueStr(cx, g, "eb$apch1",
JS_NewCFunction(cx, nat_apch1, "apch1", 1), 0);
    JS_DefinePropertyValueStr(cx, g, "eb$gc",
JS_NewCFunction(cx, nat_gc, "garbageCollect", 0), 0);
    JS_DefinePropertyValueStr(cx, g, "puts",
JS_NewCFunction(cx, nat_puts, "puts", 1), JS_PROP_ENUMERABLE);

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
		JS_Release(cx, mo);
		JS_Release(cx, po);
	}
	JS_Release(cx, navpi);
	JS_Release(cx, navmt);
	JS_Release(cx, nav);

	hist = get_property_object(cx, w, "history");
	if (JS_IsUndefined(hist))
		return;
	set_property_string(cx, hist, "current", cf->fileName);
	JS_Release(cx, hist);

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
    JS_Release(f->cx, *((JSValue*)f->docobj));
    JS_Release(f->cx, *((JSValue*)f->winobj));

/* Run GC explicitly prior to freeing the frame to at least have a chance of
catching the finalisers. This actually runs over the whole runtime but js is
single-threaded so we should be good */
    JS_RunGC(jsrt);
/* quick uses pending jobs for finalizers; when freeing a context we simply
clean up the pending jobs rather than run them as doing so is unsafe */
    my_ExecutePendingJobs();
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
	int idx = t->lic;
	JSValue oa;		// option array
	JSValue oo;		// option object
	JSValue selobj; // select object
	JSValue ogobj; // optgroup object
	JSValue soa; // selectedOptions array
	JSValue fo;		// form object
	JSValue cn; // childNodes

	if(!sel->jslink) return;

	selobj = *((JSValue*)sel->jv);
	if(og) ogobj = *((JSValue*)og->jv);
	oa = get_property_object(cx, selobj, "options");
	oo = instantiate_array_element(cx, oa, idx, "Option");
	if(cf->xmlMode) set_property_bool(cx, oo, "eb$xml", true);
	if(t->checked) {
		soa = get_property_object(cx, selobj, "selectedOptions");
		set_array_element_object(cx, soa, idx, oo);
		JS_Release(cx, soa);
	}
// option.form = select.form
	fo = get_property_object(cx, selobj, "form");
	if(!JS_IsUndefined(fo)) {
		set_property_object(cx, oo, "form", fo);
		JS_Release(cx, fo);
	}
// add option under select or under optgroup
	cn = get_property_object(cx, (og ? ogobj : selobj), "childNodes");
idx = get_arraylength(cx, cn);
	set_array_element_object(cx, cn, idx, oo);
	set_property_object(cx, oo, "parentNode", (og ? ogobj : selobj));

connectTagObject(t, oo);
	JS_Release(cx, cn);
	cn = instantiate_hidden_array(cx, oo, "childNodes");
	JS_DefinePropertyValueStr(cx, oo, "parentNode", JS_NULL,
	JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
	JS_Release(cx, cn);
	JS_Release(cx, oa);
}

void establish_js_textnode(Tag *t, const char *fpn)
{
	JSContext *cx = cf->cx;
	JSValue cn;
	 JSValue tagobj = instantiate(cx, *((JSValue*)cf->winobj), fpn, "Text");
	if(cf->xmlMode) set_property_bool(cx, tagobj, "eb$xml", true);
	cn = instantiate_hidden_array(cx, tagobj, "childNodes");
	JS_DefinePropertyValueStr(cx, tagobj, "parentNode", JS_NULL,
	JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
	define_hidden_property_object(cx, tagobj, "ownerDocument", *(JSValue*)cf->docobj);
	connectTagObject(t, tagobj);
	JS_Release(cx, cn);
}

static void processStyles(JSValueConst so, const char *stylestring)
{
	char *workstring = cloneString(stylestring);
	char *s;		// gets truncated to the style name
	char *sv;
	char *next;
	s = workstring, skipWhite2(&s);
	for (; *s; s = next) {
		next = strchr(s, ';');
		if (!next) {
			next = s + strlen(s);
		} else {
			*next++ = 0;
			skipWhite2(&next);
		}
		sv = strchr(s, ':');
		// if there was something there, but it didn't
		// adhere to the expected syntax, skip this pair
		if (sv) {
			*sv++ = '\0';
			skipWhite2(&sv);
			trimWhite(s);
			trimWhite(sv);
				camelCase(s);
// the property name has to be one of a prescribed set
			if (stringInList(allowableStyleElements, s) >= 0) {
				set_property_string(cf->cx, so, s, sv);
// Should we set a specification level here, perhaps high,
// so the css sheets don't overwrite it?
				char *u;
				createFormattedString(&u, "%s$$scy", s);
				define_hidden_property_number(cf->cx, so, u, 99999);
				nzFree(u);
			}
		}
	}
	nzFree(workstring);
}

void domLink(Tag *t, const char *classname,	/* instantiate this class */
		    const char *list,	/* next member of this array */
		    const Tag * owntag, int extra)
{
	JSContext *cx = cf->cx;
	JSValue owner = JS_NULL;
	JSValue alist = JS_UNDEFINED;
	JSValue io = JS_UNDEFINED;	// input object
	int length;
	bool dupname = false, fakeName = false;
	uchar isradio = (extra&1);
// some strings from the html tag
	const char *symname = t->name;
	const char *idname = t->id;
	const char *membername = 0;	/* usually symname */
	const char *stylestring = attribVal(t, "style");
	JSValue cn; // child nodes
	char classtweak[MAXTAGNAME + 4];

	debugPrint(5, "domLink %s.%d name %s",
		   classname, extra, (symname ? symname : emptyString));
	extra &= 6;

// some classes are ours, not standard. We need to prepend z$
	if(stringEqual(classname, "Header")
	|| stringEqual(classname, "Footer")
	|| stringEqual(classname, "Title")
	|| classname[0] == 't' // tBody tHead tFoot
	|| stringEqual(classname, "Datalist")
	|| stringEqual(classname, "HTML"))
		sprintf(classtweak, "z$%s", classname);
	else
		strcpy(classtweak, classname);

	if(owntag)
		owner = *((JSValue*)owntag->jv);
if(extra == 2)
		owner = *((JSValue*)cf->winobj);
if(extra == 4)
		owner = *((JSValue*)cf->docobj);

	if (symname && typeof_property(cx, owner, symname)) {
/*********************************************************************
This could be a duplicate name.
Yes, that really happens.
Link to the first tag having this name,
and link the second tag under a fake name so gc won't throw it away.
Or - it could be a duplicate name because multiple radio buttons
all share the same name.
The first time we create the array,
and thereafter we just link under that array.
Or - and this really does happen -
an input tag could have the name action, colliding with form.action.
don't overwrite form.action, or anything else that pre-exists.
*********************************************************************/

		if (isradio) {
/* name present and radio buttons, name should be the array of buttons */
			io = get_property_object(cx, owner, symname);
			if(JS_IsUndefined(io))
				return;
		} else {
// don't know why the duplicate name
			dupname = true;
		}
	}

/* The input object is nonzero if&only if the input is a radio button,
 * and not the first button in the set, thus it isce the array containing
 * these buttons. */
	if (JS_IsUndefined(io)) {
/*********************************************************************
Ok, the above condition does not hold.
We'll be creating a new object under owner, but through what name?
The name= tag, unless it's a duplicate,
or id= if there is no name=, or a fake name just to protect it from gc.
That's how it was for a long time, but I think we only do this on form.
*********************************************************************/
		if (t->action == TAGACT_INPUT && list) {
			if (!symname && idname)
				membername = idname;
			else if (symname && !dupname)
				membername = symname;
/* id= or name= must not displace submit, reset, or action in form.
 * Example www.startpage.com, where id=submit.
 * nor should it collide with another attribute, such as document.cookie and
 * <div ID=cookie> in www.orange.com.
 * This call checks for the name in the object and its prototype. */
			if (membername && has_property(cx, owner, membername)) {
				debugPrint(3, "membername overload %s.%s",
					   classname, membername);
				membername = 0;
			}
		}
		if (!membername)
			membername = fakePropName(), fakeName = true;

		if (isradio) {	// the first radio button
			if(fakeName)
				io = instantiate_hidden_array(cx, *((JSValue*)cf->winobj), membername);
			else
				io = instantiate_array(cx, owner, membername);
			if(JS_IsUndefined(io))
				return;
			set_property_string(cx, io, "type", "radio");
		} else {
/* A standard input element, just create it. */
			io = instantiate(cx,
(fakeName ? *((JSValue*)cf->winobj) : owner), membername, classtweak);
			if(JS_IsUndefined(io))
				return;
			if(cf->xmlMode) set_property_bool(cx, io, "eb$xml", true);
// Not an array; needs the childNodes array beneath it for the children.
			cn = instantiate_hidden_array(cx, io, "childNodes");
			JS_DefinePropertyValueStr(cx, io, "parentNode", JS_NULL,
			JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE);
			JS_Release(cx, cn);
		}

/* If this node contains style='' of one or more name-value pairs,
call out to process those and add them to the object.
Don't do any of this if the tag is itself <style>. */
		if (stylestring && t->action != TAGACT_STYLE) {
// This call creates the styl object on demand.
			JSValue so = get_property_object(cx, io, "style");
			processStyles(so, stylestring);
			JS_Release(cx, so);
		}

// only anchors with href go into links[]
		if (list && stringEqual(list, "links") &&
		    !attribPresent(t, "href"))
			list = 0;
		if (list)
			alist = get_property_object(cx, owner, list);
		if (!JS_IsUndefined(alist)) {
			length = get_arraylength(cx, alist);
			set_array_element_object(cx, alist, length, io);
			if (symname && !dupname
			    && !has_property(cx, alist, symname))
				set_property_object(cx, alist, symname, io);
#if 0
			if (idname && symname != idname
			    && !has_property(cx, alist, idname))
				set_property_object(cx, alist, idname, io);
#endif
			JS_Release(cx, alist);
		}		// list indicated
	}

	if (isradio) {
// drop down to the element within the radio array, and return that element.
// io becomes the object associated with this radio button.
// At present, io is an array.
		length = get_arraylength(cx, io);
		cn = instantiate_array_element(cx, io, length, "HTMLInputElement");
		if(cf->xmlMode) set_property_bool(cx, cn, "eb$xml", true);
		JS_Release(cx, io);
		if(JS_IsUndefined(cn))
			return;
		io = cn; // now io is the new radio button at the end of the array
	}

	if(symname) set_property_string(cx, io, "name", symname);
	if(idname) {
		set_property_string(cx, io, "id", idname);
	}

	if (t->action == TAGACT_INPUT) {
/* link back to the form that owns the element */
		set_property_object(cx, io, "form", owner);
	}

	if(t->action != TAGACT_DOCTYPE) {
		if(!stringEqual(t->nodeNameU, "CDATA") &&
		!stringEqual(t->nodeNameU, "COMMENT")) {
			char *js_node = ((t->action == TAGACT_UNKNOWN ||
			cf->xmlMode) ? t->nodeName : t->nodeNameU);
			define_hidden_property_string(cx, io, "nodeName", js_node);
			define_hidden_property_string(cx, io, "tagName", js_node);
		}
		define_hidden_property_object(cx, io, "ownerDocument", *(JSValue*)cf->docobj);
	}
	connectTagObject(t, io);
}

/*********************************************************************
Javascript sometimes builds or rebuilds a submenu, based upon your selection
in a primary menu. These new options must map back to html tags,
and then to the dropdown list as you interact with the form.
This is tested in jsrt - select a state,
whereupon the colors below, that you have to choose from, can change.
This does not easily fold into rerender(),
it must be rerun after javascript activity, e.g. in jSideEffects().
*********************************************************************/

static void rebuildSelector(Tag *sel, JSValue oa, int len2)
{
	int i2 = 0;
	bool check2;
	char *s;
	const char *selname;
	bool changed = false;
	Tag *t, *t0 = 0;
	JSValue oo;		/* option object */
	JSContext *cx = sel->f0->cx;

	selname = sel->name;
	if (!selname)
		selname = "?";
	debugPrint(4, "testing selector %s %d", selname, len2);
	sel->lic = (sel->multiple ? 0 : -1);
	t = cw->optlist;

	while (t && i2 < len2) {
		bool connect_o = false;
		t0 = t;
/* there is more to both lists */
		if (t->controller != sel) {
			t = t->same;
			continue;
		}

/* find the corresponding option object */
		oo = get_array_element_object(cx, oa, i2);
		if(JS_IsUndefined(oo)) {
// Wow this shouldn't happen.
// Guess I'll just pretend the array stops here.
			len2 = i2;
			break;
		}

		if (JS_VALUE_GET_PTR(*((JSValue*)t->jv)) != JS_VALUE_GET_PTR(oo)) {
			debugPrint(5, "oo switch");
/*********************************************************************
Ok, we freed up the old options, and garbage collection
could well kill the tags that went with these options,
i.e. the tags we're looking at now.
I'm bringing the tags back to life.
*********************************************************************/
			t->dead = false;
			disconnectTagObject(t);
			connectTagObject(t, oo);
			connect_o = true;
		}

		t->rchecked = get_property_bool(cx, oo, "defaultSelected");
		check2 = get_property_bool(cx, oo, "selected");
		if (check2) {
			if (sel->multiple)
				++sel->lic;
			else
				sel->lic = i2;
		}
		++i2;
		if (t->checked != check2)
			changed = true;
		t->checked = check2;
		s = get_property_string(cx, oo, "text");
		if ((s && !t->textval) || !stringEqual(t->textval, s)) {
			nzFree(t->textval);
			t->textval = s;
			changed = true;
		} else
			nzFree(s);
		s = get_property_string(cx, oo, "value");
		if ((s && !t->value) || !stringEqual(t->value, s)) {
			nzFree(t->value);
			t->value = s;
		} else
			nzFree(s);
		t = t->same;
		if(!connect_o)
			JS_Release(cx, oo);
	}

/* one list or the other or both has run to the end */
	if (i2 == len2) {
		for (; t; t = t->same) {
			if (t->controller != sel) {
				t0 = t;
				continue;
			}
/* option is gone in js, disconnect this option tag from its select */
			disconnectTagObject(t);
			t->controller = 0;
			t->action = TAGACT_NOP;
			if (t0)
				t0->same = t->same;
			else
				cw->optlist = t->same;
			changed = true;
		}
	} else if (!t) {
		for (; i2 < len2; ++i2) {
			oo = get_array_element_object(cx, oa, i2);
			if(JS_IsUndefined(oo))
				break;
			t = newTag(sel->f0, "option");
			t->lic = i2;
			t->controller = sel;
			connectTagObject(t, oo);
			t->step = 2;	// already decorated
			t->textval = get_property_string(cx, oo, "text");
			t->value = get_property_string(cx, oo, "value");
			t->checked = get_property_bool(cx, oo, "selected");
			if (t->checked) {
				if (sel->multiple)
					++sel->lic;
				else
					sel->lic = i2;
			}
			t->rchecked = get_property_bool(cx, oo, "defaultSelected");
			changed = true;
		}
	}

	if (!changed)
		return;
	debugPrint(4, "selector %s has changed", selname);

	s = displayOptions(sel);
	if (!s)
		s = emptyString;
	domSetsTagValue(sel, s);
	nzFree(s);

	if (!sel->multiple)
		set_property_number(cx, *((JSValue*)sel->jv), "selectedIndex", sel->lic);
// rebuild the live selectedOptions array
	run_function_bool(cx, *((JSValue*)sel->jv), "eb$bso");
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
		JS_Release(cx, oa);
	}
}

// Some primitives needed by css.c. These bounce through window.soj$
static const char soj[] = "soj$";
static void sofail() { debugPrint(3, "no style object"); }

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
	JS_Release(cx, j);
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
	JS_Release(cx, j);
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
	JS_Release(cx, j);
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
	JS_Release(cx, j);
}

void jsClose(void)
{
	if(js_running) {
		JS_FreeContext(mwc);
		grabover();
// release the timer for pending jobs
	domSetsTimeout(0, "-", 0, false);
// but we need to clear the pending queue, an orphan pending job causes FreeRuntime to blow up.
		my_ExecutePendingJobs();
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
	return JS_GetVersion();
	}
