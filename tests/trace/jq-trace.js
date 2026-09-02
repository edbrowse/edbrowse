/*!
 * jQuery JavaScript Library v3.5.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2020-05-04T22:49Z
 */
( function a__1( global, factory ) {trace@(a522)
if(step$l>=1)alert('a__1(' + showarglist(arguments) + ')');

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {trace@(a523)

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function a__2( w ) {trace@(a524)
if(step$l>=1)alert('a__2(' + showarglist(arguments) + ')');
				if ( !w.document ) {trace@(a525)
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {trace@(a526)
		factory( global );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function a__3( window, noGlobal ) {trace@(a527)
if(step$l>=1)alert('a__3(' + showarglist(arguments) + ')');

// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
// enough that all such attempts are guarded in a try block.
"use strict";

var arr = [];

var getProto = Object.getPrototypeOf;

var slice = arr.slice;

var flat = arr.flat ? function a__4( array ) {trace@(a528)
if(step$l>=1)alert('a__4(' + showarglist(arguments) + ')');
	return arr.flat.call( array );
} : function a__5( array ) {trace@(a529)
if(step$l>=1)alert('a__5(' + showarglist(arguments) + ')');
	return arr.concat.apply( [], array );
};


var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var fnToString = hasOwn.toString;

var ObjectFunctionString = fnToString.call( Object );

var support = {};

var isFunction = function isFunction( obj ) {trace@(a530)

      // Support: Chrome <=57, Firefox <=52
      // In some browsers, typeof returns "function" for HTML <object> elements
      // (i.e., `typeof document.createElement( "object" ) === "function"`).
      // We don't want to classify *any* DOM node as a function.
      {let x$rv=(typeof obj === "function" && typeof obj.nodeType !== "number");trace@(a2143);return x$rv;}
  };


var isWindow = function isWindow( obj ) {trace@(a531)
		return obj != null && obj === obj.window;
	};


var document = window.document;



	var preservedScriptAttributes = {
		type: true,
		src: true,
		nonce: true,
		noModule: true
	};

	function DOMEval( code, node, doc ) {trace@(a532)
		doc = doc || document;

		var i, val,
			script = doc.createElement( "script" );

		script.text = code;
		if ( node ) {trace@(a533)
			for ( i in preservedScriptAttributes ) {trace@(a534)

				// Support: Firefox 64+, Edge 18+
				// Some browsers don't support the "nonce" property on scripts.
				// On the other hand, just using `getAttribute` is not enough as
				// the `nonce` attribute is reset to an empty string whenever it
				// becomes browsing-context connected.
				// See https://github.com/whatwg/html/issues/2369
				// See https://html.spec.whatwg.org/#nonce-attributes
				// The `node.getAttribute` check was added for the sake of
				// `jQuery.globalEval` so that it can fake a nonce-containing node
				// via an object.
				val = node[ i ] || node.getAttribute && node.getAttribute( i );
				if ( val ) {trace@(a535)
					script.setAttribute( i, val );
				}
			}
		}
		doc.head.appendChild( script ).parentNode.removeChild( script );
	}


function toType( obj ) {trace@(a536)
	if ( obj == null ) {trace@(a537)
		return obj + "";
	}

	// Support: Android <=2.3 only (functionish RegExp)
	return typeof obj === "object" || typeof obj === "function" ?
		class2type[ toString.call( obj ) ] || "object" :
		typeof obj;
}
/* global Symbol */
// Defining this global in .eslintrc.json would create a danger of using the global
// unguarded in another place, it seems safer to define global only for this module



var
	version = "3.5.1",

	// Define a local copy of jQuery
	jQuery = function a__6( selector, context ) {trace@(a538)
if(step$l>=1)alert('a__6(' + showarglist(arguments) + ')');

		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	};

jQuery.fn = jQuery.prototype = {

	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function a__7() {trace@(a539)
if(step$l>=1)alert('a__7(' + showarglist(arguments) + ')');
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function a__8( num ) {trace@(a540)
if(step$l>=1)alert('a__8(' + showarglist(arguments) + ')');

		// Return all the elements in a clean array
		if ( num == null ) {trace@(a541)
			return slice.call( this );
		}

		// Return just the one element from the set
		return num < 0 ? this[ num + this.length ] : this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function a__9( elems ) {trace@(a542)
if(step$l>=1)alert('a__9(' + showarglist(arguments) + ')');

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	each: function a__10( callback ) {trace@(a543)
if(step$l>=1)alert('a__10(' + showarglist(arguments) + ')');
		return jQuery.each( this, callback );
	},

	map: function a__11( callback ) {trace@(a544)
if(step$l>=1)alert('a__11(' + showarglist(arguments) + ')');
		return this.pushStack( jQuery.map( this, function a__12( elem, i ) {trace@(a545)
if(step$l>=1)alert('a__12(' + showarglist(arguments) + ')');
			return callback.call( elem, i, elem );
		} ) );
	},

	slice: function a__13() {trace@(a546)
if(step$l>=1)alert('a__13(' + showarglist(arguments) + ')');
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function a__14() {trace@(a547)
if(step$l>=1)alert('a__14(' + showarglist(arguments) + ')');
		return this.eq( 0 );
	},

	last: function a__15() {trace@(a548)
if(step$l>=1)alert('a__15(' + showarglist(arguments) + ')');
		return this.eq( -1 );
	},

	even: function a__16() {trace@(a549)
if(step$l>=1)alert('a__16(' + showarglist(arguments) + ')');
		return this.pushStack( jQuery.grep( this, function a__17( _elem, i ) {trace@(a550)
if(step$l>=1)alert('a__17(' + showarglist(arguments) + ')');
			return ( i + 1 ) % 2;
		} ) );
	},

	odd: function a__18() {trace@(a551)
if(step$l>=1)alert('a__18(' + showarglist(arguments) + ')');
		return this.pushStack( jQuery.grep( this, function a__19( _elem, i ) {trace@(a552)
if(step$l>=1)alert('a__19(' + showarglist(arguments) + ')');
			return i % 2;
		} ) );
	},

	eq: function a__20( i ) {trace@(a553)
if(step$l>=1)alert('a__20(' + showarglist(arguments) + ')');
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
	},

	end: function a__21() {trace@(a554)
if(step$l>=1)alert('a__21(' + showarglist(arguments) + ')');
		return this.prevObject || this.constructor();
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function a__22() {trace@(a555)
if(step$l>=1)alert('a__22(' + showarglist(arguments) + ')');
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[ 0 ] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {trace@(a556)
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {trace@(a557)
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {trace@(a558)
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {trace@(a559)

		// Only deal with non-null/undefined values
		if ( ( options = arguments[ i ] ) != null ) {trace@(a560)

			// Extend the base object
			for ( name in options ) {trace@(a561)
				copy = options[ name ];

				// Prevent Object.prototype pollution
				// Prevent never-ending loop
				if ( name === "__proto__" || target === copy ) {trace@(a562)
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
					( copyIsArray = Array.isArray( copy ) ) ) ) {
					src = target[ name ];

					// Ensure proper type for the source value
					if ( copyIsArray && !Array.isArray( src ) ) {trace@(a563)
						clone = [];
					} else if ( !copyIsArray && !jQuery.isPlainObject( src ) ) {trace@(a564)
						clone = {};
					} else {trace@(a565)
						clone = src;
					}
					copyIsArray = false;

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {trace@(a566)
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend( {

	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function a__23( msg ) {trace@(a567)
if(step$l>=1)alert('a__23(' + showarglist(arguments) + ')');
		throw new Error( msg );
	},

	noop: function() {},

	isPlainObject: function a__24( obj ) {trace@(a568)
if(step$l>=1)alert('a__24(' + showarglist(arguments) + ')');
		var proto, Ctor;

		// Detect obvious negatives
		// Use toString instead of jQuery.type to catch host objects
		if ( !obj || toString.call( obj ) !== "[object Object]" ) {trace@(a569)
			return false;
		}

		proto = getProto( obj );

		// Objects with no prototype (e.g., `Object.create( null )`) are plain
		if ( !proto ) {trace@(a570)
			return true;
		}

		// Objects with prototype are plain iff they were constructed by a global Object function
		Ctor = hasOwn.call( proto, "constructor" ) && proto.constructor;
		return typeof Ctor === "function" && fnToString.call( Ctor ) === ObjectFunctionString;
	},

	isEmptyObject: function a__25( obj ) {trace@(a571)
if(step$l>=1)alert('a__25(' + showarglist(arguments) + ')');
		var name;

		for ( name in obj ) {trace@(a572)
			return false;
		}
		return true;
	},

	// Evaluates a script in a provided context; falls back to the global one
	// if not specified.
	globalEval: function a__26( code, options, doc ) {trace@(a573)
if(step$l>=1)alert('a__26(' + showarglist(arguments) + ')');
		DOMEval( code, { nonce: options && options.nonce }, doc );
	},

	each: function a__27( obj, callback ) {trace@(a574)
if(step$l>=1)alert('a__27(' + showarglist(arguments) + ')');
		var length, i = 0;

		if ( isArrayLike( obj ) ) {trace@(a575)
			length = obj.length;
			for ( ; i < length; i++ ) {trace@(a576)
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {trace@(a577)
					break;
				}
			}
		} else {trace@(a578)
			for ( i in obj ) {trace@(a579)
				if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {trace@(a580)
					break;
				}
			}
		}

		return obj;
	},

	// results is for internal usage only
	makeArray: function a__28( arr, results ) {trace@(a581)
if(step$l>=1)alert('a__28(' + showarglist(arguments) + ')');
		var ret = results || [];

		if ( arr != null ) {trace@(a582)
			if ( isArrayLike( Object( arr ) ) ) {trace@(a583)
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {trace@(a584)
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function a__29( elem, arr, i ) {trace@(a585)
if(step$l>=1)alert('a__29(' + showarglist(arguments) + ')');
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	// Support: Android <=4.0 only, PhantomJS 1 only
	// push.apply(_, arraylike) throws on ancient WebKit
	merge: function a__30( first, second ) {trace@(a586)
if(step$l>=1)alert('a__30(' + showarglist(arguments) + ')');
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {trace@(a587)
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function a__31( elems, callback, invert ) {trace@(a588)
if(step$l>=1)alert('a__31(' + showarglist(arguments) + ')');
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {trace@(a589)
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {trace@(a590)
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function a__32( elems, callback, arg ) {trace@(a591)
if(step$l>=1)alert('a__32(' + showarglist(arguments) + ')');
		var length, value,
			i = 0,
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArrayLike( elems ) ) {trace@(a592)
			length = elems.length;
			for ( ; i < length; i++ ) {trace@(a593)
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {trace@(a594)
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {trace@(a595)
			for ( i in elems ) {trace@(a596)
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {trace@(a597)
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return flat( ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
} );

if ( typeof Symbol === "function" ) {trace@(a598)
	jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
}

// Populate the class2type map
jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
function a__33( _i, name ) {trace@(a599)
if(step$l>=1)alert('a__33(' + showarglist(arguments) + ')');
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
} );

function isArrayLike( obj ) {trace@(a600)

	// Support: real iOS 8.2 only (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = !!obj && "length" in obj && obj.length,
		type = toType( obj );

	if ( isFunction( obj ) || isWindow( obj ) ) {trace@(a601)
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
trace@(a602)var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.3.5
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://js.foundation/
 *
 * Date: 2020-03-14
 */
( function a__34( window ) {trace@(a603)
if(step$l>=1)alert('a__34(' + showarglist(arguments) + ')');
trace@(a604)var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	nonnativeSelectorCache = createCache(),
	sortOrder = function a__35( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ( {} ).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	pushNative = arr.push,
	push = arr.push,
	slice = arr.slice,

	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function a__36( list, elem ) {trace@(a607)
if(step$l>=1)alert('a__36(' + showarglist(arguments) + ')');
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {trace@(a608)
			if ( list[ i ] === elem ) {trace@(a609)
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|" +
		"ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
	identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace +
		"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +

		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +

		// "Attribute values must be CSS identifiers [capture 5]
		// or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" +
		whitespace + "*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +

		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" +
		whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace +
		"*" ),
	rdescend = new RegExp( whitespace + "|>" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
			whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" +
			whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),

		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace +
			"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
			"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rhtml = /HTML$/i,
	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g" ),
	funescape = function a__37( escape, nonHex ) {trace@(a610)
if(step$l>=1)alert('a__37(' + showarglist(arguments) + ')');
		var high = "0x" + escape.slice( 1 ) - 0x10000;

		return nonHex ?

			// Strip the backslash prefix from a non-hex escape sequence
			nonHex :

			// Replace a hexadecimal escape sequence with the encoded Unicode code point
			// Support: IE <=11+
			// For values outside the Basic Multilingual Plane (BMP), manually construct a
			// surrogate pair
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function a__38( ch, asCodePoint ) {trace@(a611)
if(step$l>=1)alert('a__38(' + showarglist(arguments) + ')');
		if ( asCodePoint ) {trace@(a612)

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {trace@(a613)
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" +
				ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function a__39() {trace@(a614)
if(step$l>=1)alert('a__39(' + showarglist(arguments) + ')');
		setDocument();
	},

	inDisabledFieldset = addCombinator(
		function a__40( elem ) {trace@(a615)
if(step$l>=1)alert('a__40(' + showarglist(arguments) + ')');
			return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {trace@(a616)
	push.apply(
		( arr = slice.call( preferredDoc.childNodes ) ),
		preferredDoc.childNodes
	);

	// Support: Android<4.0
	// Detect silently failing push.apply
	// eslint-disable-next-line no-unused-expressions
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function a__41( target, els ) {trace@(a617)
if(step$l>=1)alert('a__41(' + showarglist(arguments) + ')');
			pushNative.apply( target, slice.call( els ) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function a__42( target, els ) {trace@(a618)
if(step$l>=1)alert('a__42(' + showarglist(arguments) + ')');
			var j = target.length,
				i = 0;

			// Can't trust NodeList.length
			while ( ( target[ j++ ] = els[ i++ ] ) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {trace@(a619)
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {trace@(a620)
		setDocument( context );
		context = context || document;

		if ( documentIsHTML ) {trace@(a621)

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && ( match = rquickExpr.exec( selector ) ) ) {trace@(a622)

				// ID selector
				if ( ( m = match[ 1 ] ) ) {trace@(a623)

					// Document context
					if ( nodeType === 9 ) {trace@(a624)
						if ( ( elem = context.getElementById( m ) ) ) {trace@(a625)

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {trace@(a626)
								results.push( elem );
								return results;
							}
						} else {trace@(a627)
							return results;
						}

					// Element context
					} else {trace@(a628)

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && ( elem = newContext.getElementById( m ) ) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[ 2 ] ) {trace@(a629)
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( ( m = match[ 3 ] ) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!nonnativeSelectorCache[ selector + " " ] &&
				( !rbuggyQSA || !rbuggyQSA.test( selector ) ) &&

				// Support: IE 8 only
				// Exclude object elements
				( nodeType !== 1 || context.nodeName.toLowerCase() !== "object" ) ) {

				newSelector = selector;
				newContext = context;

				// qSA considers elements outside a scoping root when evaluating child or
				// descendant combinators, which is not what we want.
				// In such cases, we work around the behavior by prefixing every selector in the
				// list with an ID selector referencing the scope context.
				// The technique has to be used as well when a leading combinator is used
				// as such selectors are not recognized by querySelectorAll.
				// Thanks to Andrew Dupont for this technique.
				if ( nodeType === 1 &&
					( rdescend.test( selector ) || rcombinators.test( selector ) ) ) {

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;

					// We can use :scope instead of the ID hack if the browser
					// supports it & if we're not changing the context.
					if ( newContext !== context || !support.scope ) {trace@(a630)

						// Capture the context ID, setting it first if necessary
						if ( ( nid = context.getAttribute( "id" ) ) ) {trace@(a631)
							nid = nid.replace( rcssescape, fcssescape );
						} else {trace@(a632)
							context.setAttribute( "id", ( nid = expando ) );
						}
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {trace@(a633)
						groups[ i ] = ( nid ? "#" + nid : ":scope" ) + " " +
							toSelector( groups[ i ] );
					}
					newSelector = groups.join( "," );
				}

				try {trace@(a634)
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch ( qsaError ) {
					nonnativeSelectorCache( selector, true );
				} finally {
					if ( nid === expando ) {trace@(a635)
						context.removeAttribute( "id" );
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {trace@(a636)
	var keys = [];

	function cache( key, value ) {trace@(a637)

		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {trace@(a638)

			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return ( cache[ key + " " ] = value );
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {trace@(a639)
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {trace@(a640)
	var el = document.createElement( "fieldset" );

	try {trace@(a641)
		return !!fn( el );
	} catch ( e ) {
		return false;
	} finally {

		// Remove from its parent by default
		if ( el.parentNode ) {trace@(a642)
			el.parentNode.removeChild( el );
		}

		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {trace@(a643)
	var arr = attrs.split( "|" ),
		i = arr.length;

	while ( i-- ) {trace@(a644)
		Expr.attrHandle[ arr[ i ] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {trace@(a645)
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {trace@(a646)
		return diff;
	}

	// Check if b follows a
	if ( cur ) {trace@(a647)
		while ( ( cur = cur.nextSibling ) ) {trace@(a648)
			if ( cur === b ) {trace@(a649)
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {trace@(a650)
	return function a__43( elem ) {trace@(a651)
if(step$l>=1)alert('a__43(' + showarglist(arguments) + ')');
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {trace@(a652)
	return function a__44( elem ) {trace@(a653)
if(step$l>=1)alert('a__44(' + showarglist(arguments) + ')');
		var name = elem.nodeName.toLowerCase();
		return ( name === "input" || name === "button" ) && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {trace@(a654)

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function a__45( elem ) {trace@(a655)
if(step$l>=1)alert('a__45(' + showarglist(arguments) + ')');

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {trace@(a656)

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {trace@(a657)

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {trace@(a658)
					if ( "label" in elem.parentNode ) {trace@(a659)
						return elem.parentNode.disabled === disabled;
					} else {trace@(a660)
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
					inDisabledFieldset( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {trace@(a661)
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {trace@(a662)
	return markFunction( function a__46( argument ) {trace@(a663)
if(step$l>=1)alert('a__46(' + showarglist(arguments) + ')');
		argument = +argument;
		return markFunction( function a__47( seed, matches ) {trace@(a664)
if(step$l>=1)alert('a__47(' + showarglist(arguments) + ')');
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {trace@(a665)
				if ( seed[ ( j = matchIndexes[ i ] ) ] ) {trace@(a666)
					seed[ j ] = !( matches[ j ] = seed[ j ] );
				}
			}
		} );
	} );
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {trace@(a667)
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function a__48( elem ) {trace@(a668)
if(step$l>=1)alert('a__48(' + showarglist(arguments) + ')');
	var namespace = elem.namespaceURI,
		docElem = ( elem.ownerDocument || elem ).documentElement;

	// Support: IE <=8
	// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
	// https://bugs.jquery.com/ticket/4833
	return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function a__49( node ) {trace@(a669)
if(step$l>=1)alert('a__49(' + showarglist(arguments) + ')');
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( doc == document || doc.nodeType !== 9 || !doc.documentElement ) {trace@(a670)
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9 - 11+, Edge 12 - 18+
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( preferredDoc != document &&
		( subWindow = document.defaultView ) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {trace@(a671)
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {trace@(a672)
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	// Support: IE 8 - 11+, Edge 12 - 18+, Chrome <=16 - 25 only, Firefox <=3.6 - 31 only,
	// Safari 4 - 5 only, Opera <=11.6 - 12.x only
	// IE/Edge & older browsers don't support the :scope pseudo-class.
	// Support: Safari 6.0 only
	// Safari 6.0 supports :scope but it's an alias of :root there.
	support.scope = assert( function a__50( el ) {trace@(a673)
if(step$l>=1)alert('a__50(' + showarglist(arguments) + ')');
		docElem.appendChild( el ).appendChild( document.createElement( "div" ) );
		return typeof el.querySelectorAll !== "undefined" &&
			!el.querySelectorAll( ":scope fieldset div" ).length;
	} );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert( function a__51( el ) {trace@(a674)
if(step$l>=1)alert('a__51(' + showarglist(arguments) + ')');
		el.className = "i";
		return !el.getAttribute( "className" );
	} );

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert( function a__52( el ) {trace@(a675)
if(step$l>=1)alert('a__52(' + showarglist(arguments) + ')');
		el.appendChild( document.createComment( "" ) );
		return !el.getElementsByTagName( "*" ).length;
	} );

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert( function a__53( el ) {trace@(a676)
if(step$l>=1)alert('a__53(' + showarglist(arguments) + ')');
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	} );

	// ID filter and find
	if ( support.getById ) {trace@(a677)
		Expr.filter[ "ID" ] = function a__54( id ) {trace@(a678)
if(step$l>=1)alert('a__54(' + showarglist(arguments) + ')');
			var attrId = id.replace( runescape, funescape );
			return function a__55( elem ) {trace@(a679)
if(step$l>=1)alert('a__55(' + showarglist(arguments) + ')');
				return elem.getAttribute( "id" ) === attrId;
			};
		};
		Expr.find[ "ID" ] = function a__56( id, context ) {trace@(a680)
if(step$l>=1)alert('a__56(' + showarglist(arguments) + ')');
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {trace@(a681)
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {trace@(a682)
		Expr.filter[ "ID" ] =  function a__57( id ) {trace@(a683)
if(step$l>=1)alert('a__57(' + showarglist(arguments) + ')');
			var attrId = id.replace( runescape, funescape );
			return function a__58( elem ) {trace@(a684)
if(step$l>=1)alert('a__58(' + showarglist(arguments) + ')');
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode( "id" );
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find[ "ID" ] = function a__59( id, context ) {trace@(a685)
if(step$l>=1)alert('a__59(' + showarglist(arguments) + ')');
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {trace@(a686)
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {trace@(a687)

					// Verify the id attribute
					node = elem.getAttributeNode( "id" );
					if ( node && node.value === id ) {trace@(a688)
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( ( elem = elems[ i++ ] ) ) {trace@(a689)
						node = elem.getAttributeNode( "id" );
						if ( node && node.value === id ) {trace@(a690)
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find[ "TAG" ] = support.getElementsByTagName ?
		function a__60( tag, context ) {trace@(a691)
if(step$l>=1)alert('a__60(' + showarglist(arguments) + ')');
			if ( typeof context.getElementsByTagName !== "undefined" ) {trace@(a692)
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {trace@(a693)
				return context.querySelectorAll( tag );
			}
		} :

		function a__61( tag, context ) {trace@(a694)
if(step$l>=1)alert('a__61(' + showarglist(arguments) + ')');
			var elem,
				tmp = [],
				i = 0,

				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {trace@(a695)
				while ( ( elem = results[ i++ ] ) ) {trace@(a696)
					if ( elem.nodeType === 1 ) {trace@(a697)
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find[ "CLASS" ] = support.getElementsByClassName && function a__62( className, context ) {trace@(a698)
if(step$l>=1)alert('a__62(' + showarglist(arguments) + ')');
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {trace@(a699)
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( ( support.qsa = rnative.test( document.querySelectorAll ) ) ) {trace@(a700)

		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert( function a__63( el ) {trace@(a701)
if(step$l>=1)alert('a__63(' + showarglist(arguments) + ')');

			var input;

			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll( "[msallowcapture^='']" ).length ) {trace@(a702)
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll( "[selected]" ).length ) {trace@(a703)
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {trace@(a704)
				rbuggyQSA.push( "~=" );
			}

			// Support: IE 11+, Edge 15 - 18+
			// IE 11/Edge don't find elements on a `[name='']` query in some cases.
			// Adding a temporary attribute to the document before the selection works
			// around the issue.
			// Interestingly, IE 10 & older don't seem to have the issue.
			input = document.createElement( "input" );
			input.setAttribute( "name", "" );
			el.appendChild( input );
			if ( !el.querySelectorAll( "[name='']" ).length ) {trace@(a705)
				rbuggyQSA.push( "\\[" + whitespace + "*name" + whitespace + "*=" +
					whitespace + "*(?:''|\"\")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll( ":checked" ).length ) {trace@(a706)
				rbuggyQSA.push( ":checked" );
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {trace@(a707)
				rbuggyQSA.push( ".#.+[+~]" );
			}

			// Support: Firefox <=3.6 - 5 only
			// Old Firefox doesn't throw on a badly-escaped identifier.
			el.querySelectorAll( "\\\f" );
			rbuggyQSA.push( "[\\r\\n\\f]" );
		} );

		assert( function a__64( el ) {trace@(a708)
if(step$l>=1)alert('a__64(' + showarglist(arguments) + ')');
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement( "input" );
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll( "[name=d]" ).length ) {trace@(a709)
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll( ":enabled" ).length !== 2 ) {trace@(a710)
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll( ":disabled" ).length !== 2 ) {trace@(a711)
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: Opera 10 - 11 only
			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll( "*,:x" );
			rbuggyQSA.push( ",.*:" );
		} );
	}

	if ( ( support.matchesSelector = rnative.test( ( matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector ) ) ) ) {

		assert( function a__65( el ) {trace@(a712)
if(step$l>=1)alert('a__65(' + showarglist(arguments) + ')');

			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		} );
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join( "|" ) );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function a__66( a, b ) {trace@(a713)
if(step$l>=1)alert('a__66(' + showarglist(arguments) + ')');
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			) );
		} :
		function a__67( a, b ) {trace@(a714)
if(step$l>=1)alert('a__67(' + showarglist(arguments) + ')');
			if ( b ) {trace@(a715)
				while ( ( b = b.parentNode ) ) {trace@(a716)
					if ( b === a ) {trace@(a717)
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function a__68( a, b ) {trace@(a718)
if(step$l>=1)alert('a__68(' + showarglist(arguments) + ')');

		// Flag for duplicate removal
		if ( a === b ) {trace@(a719)
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {trace@(a720)
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		// Support: IE 11+, Edge 17 - 18+
		// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
		// two documents; shallow comparisons work.
		// eslint-disable-next-line eqeqeq
		compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			( !support.sortDetached && b.compareDocumentPosition( a ) === compare ) ) {

			// Choose the first element that is related to our preferred document
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( a == document || a.ownerDocument == preferredDoc &&
				contains( preferredDoc, a ) ) {
				return -1;
			}

			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			// eslint-disable-next-line eqeqeq
			if ( b == document || b.ownerDocument == preferredDoc &&
				contains( preferredDoc, b ) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function a__69( a, b ) {trace@(a721)
if(step$l>=1)alert('a__69(' + showarglist(arguments) + ')');

		// Exit early if the nodes are identical
		if ( a === b ) {trace@(a722)
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {trace@(a723)

			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			/* eslint-disable eqeqeq */
			return a == document ? -1 :
				b == document ? 1 :
				/* eslint-enable eqeqeq */
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {trace@(a724)
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( ( cur = cur.parentNode ) ) {trace@(a725)
			ap.unshift( cur );
		}
		cur = b;
		while ( ( cur = cur.parentNode ) ) {trace@(a726)
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[ i ] === bp[ i ] ) {trace@(a727)
			i++;
		}

		return i ?

			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[ i ], bp[ i ] ) :

			// Otherwise nodes in our document sort first
			// Support: IE 11+, Edge 17 - 18+
			// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
			// two documents; shallow comparisons work.
			/* eslint-disable eqeqeq */
			ap[ i ] == preferredDoc ? -1 :
			bp[ i ] == preferredDoc ? 1 :
			/* eslint-enable eqeqeq */
			0;
	};

	return document;
};

Sizzle.matches = function a__70( expr, elements ) {trace@(a728)
if(step$l>=1)alert('a__70(' + showarglist(arguments) + ')');
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function a__71( elem, expr ) {trace@(a729)
if(step$l>=1)alert('a__71(' + showarglist(arguments) + ')');
	setDocument( elem );

	if ( support.matchesSelector && documentIsHTML &&
		!nonnativeSelectorCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {trace@(a730)
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||

				// As well, disconnected nodes are said to be in a document
				// fragment in IE 9
				elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch ( e ) {
			nonnativeSelectorCache( expr, true );
		}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function a__72( context, elem ) {trace@(a731)
if(step$l>=1)alert('a__72(' + showarglist(arguments) + ')');

	// Set document vars if needed
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( ( context.ownerDocument || context ) != document ) {trace@(a732)
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function a__73( elem, name ) {trace@(a733)
if(step$l>=1)alert('a__73(' + showarglist(arguments) + ')');

	// Set document vars if needed
	// Support: IE 11+, Edge 17 - 18+
	// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
	// two documents; shallow comparisons work.
	// eslint-disable-next-line eqeqeq
	if ( ( elem.ownerDocument || elem ) != document ) {trace@(a734)
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],

		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			( val = elem.getAttributeNode( name ) ) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function a__74( sel ) {trace@(a735)
if(step$l>=1)alert('a__74(' + showarglist(arguments) + ')');
	return ( sel + "" ).replace( rcssescape, fcssescape );
};

Sizzle.error = function a__75( msg ) {trace@(a736)
if(step$l>=1)alert('a__75(' + showarglist(arguments) + ')');
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function a__76( results ) {trace@(a737)
if(step$l>=1)alert('a__76(' + showarglist(arguments) + ')');
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {trace@(a738)
		while ( ( elem = results[ i++ ] ) ) {trace@(a739)
			if ( elem === results[ i ] ) {trace@(a740)
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {trace@(a741)
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function a__77( elem ) {trace@(a742)
if(step$l>=1)alert('a__77(' + showarglist(arguments) + ')');
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {trace@(a743)

		// If no nodeType, this is expected to be an array
		while ( ( node = elem[ i++ ] ) ) {trace@(a744)

			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {trace@(a745)

		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {trace@(a746)
			return elem.textContent;
		} else {trace@(a747)

			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {trace@(a748)
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {trace@(a749)
		return elem.nodeValue;
	}

	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function a__78( match ) {trace@(a750)
if(step$l>=1)alert('a__78(' + showarglist(arguments) + ')');
			match[ 1 ] = match[ 1 ].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[ 3 ] = ( match[ 3 ] || match[ 4 ] ||
				match[ 5 ] || "" ).replace( runescape, funescape );

			if ( match[ 2 ] === "~=" ) {trace@(a751)
				match[ 3 ] = " " + match[ 3 ] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function a__79( match ) {trace@(a752)
if(step$l>=1)alert('a__79(' + showarglist(arguments) + ')');

			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[ 1 ] = match[ 1 ].toLowerCase();

			if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {trace@(a753)

				// nth-* requires argument
				if ( !match[ 3 ] ) {trace@(a754)
					Sizzle.error( match[ 0 ] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[ 4 ] = +( match[ 4 ] ?
					match[ 5 ] + ( match[ 6 ] || 1 ) :
					2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" ) );
				match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

				// other types prohibit arguments
			} else if ( match[ 3 ] ) {trace@(a755)
				Sizzle.error( match[ 0 ] );
			}

			return match;
		},

		"PSEUDO": function a__80( match ) {trace@(a756)
if(step$l>=1)alert('a__80(' + showarglist(arguments) + ')');
			var excess,
				unquoted = !match[ 6 ] && match[ 2 ];

			if ( matchExpr[ "CHILD" ].test( match[ 0 ] ) ) {trace@(a757)
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[ 3 ] ) {trace@(a758)
				match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&

				// Get excess from tokenize (recursively)
				( excess = tokenize( unquoted, true ) ) &&

				// advance to the next closing parenthesis
				( excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length ) ) {

				// excess is a negative index
				match[ 0 ] = match[ 0 ].slice( 0, excess );
				match[ 2 ] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function a__81( nodeNameSelector ) {trace@(a759)
if(step$l>=1)alert('a__81(' + showarglist(arguments) + ')');
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function a__82() {trace@(a760)
if(step$l>=1)alert('a__82(' + showarglist(arguments) + ')');
					return true;
				} :
				function a__83( elem ) {trace@(a761)
if(step$l>=1)alert('a__83(' + showarglist(arguments) + ')');
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function a__84( className ) {trace@(a762)
if(step$l>=1)alert('a__84(' + showarglist(arguments) + ')');
			var pattern = classCache[ className + " " ];

			return pattern ||
				( pattern = new RegExp( "(^|" + whitespace +
					")" + className + "(" + whitespace + "|$)" ) ) && classCache(
						className, function a__85( elem ) {trace@(a763)
if(step$l>=1)alert('a__85(' + showarglist(arguments) + ')');
							return pattern.test(
								typeof elem.className === "string" && elem.className ||
								typeof elem.getAttribute !== "undefined" &&
									elem.getAttribute( "class" ) ||
								""
							);
				} );
		},

		"ATTR": function a__86( name, operator, check ) {trace@(a764)
if(step$l>=1)alert('a__86(' + showarglist(arguments) + ')');
			return function a__87( elem ) {trace@(a765)
if(step$l>=1)alert('a__87(' + showarglist(arguments) + ')');
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {trace@(a766)
					return operator === "!=";
				}
				if ( !operator ) {trace@(a767)
					return true;
				}

				result += "";

				/* eslint-disable max-len */

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
				/* eslint-enable max-len */

			};
		},

		"CHILD": function a__88( type, what, _argument, first, last ) {trace@(a768)
if(step$l>=1)alert('a__88(' + showarglist(arguments) + ')');
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function a__89( elem ) {trace@(a769)
if(step$l>=1)alert('a__89(' + showarglist(arguments) + ')');
					return !!elem.parentNode;
				} :

				function a__90( elem, _context, xml ) {trace@(a770)
if(step$l>=1)alert('a__90(' + showarglist(arguments) + ')');
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {trace@(a771)

						// :(first|last|only)-(child|of-type)
						if ( simple ) {trace@(a772)
							while ( dir ) {trace@(a773)
								node = elem;
								while ( ( node = node[ dir ] ) ) {trace@(a774)
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}

								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {trace@(a775)

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || ( node[ expando ] = {} );

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								( outerCache[ node.uniqueID ] = {} );

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( ( node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								( diff = nodeIndex = 0 ) || start.pop() ) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {trace@(a776)
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {trace@(a777)

							// Use previously-cached element index if available
							if ( useCache ) {trace@(a778)

								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || ( node[ expando ] = {} );

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									( outerCache[ node.uniqueID ] = {} );

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {trace@(a779)

								// Use the same loop as above to seek `elem` from the start
								while ( ( node = ++nodeIndex && node && node[ dir ] ||
									( diff = nodeIndex = 0 ) || start.pop() ) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {trace@(a780)
											outerCache = node[ expando ] ||
												( node[ expando ] = {} );

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												( outerCache[ node.uniqueID ] = {} );

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {trace@(a781)
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function a__91( pseudo, argument ) {trace@(a782)
if(step$l>=1)alert('a__91(' + showarglist(arguments) + ')');

			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {trace@(a783)
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {trace@(a784)
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction( function a__92( seed, matches ) {trace@(a785)
if(step$l>=1)alert('a__92(' + showarglist(arguments) + ')');
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {trace@(a786)
							idx = indexOf( seed, matched[ i ] );
							seed[ idx ] = !( matches[ idx ] = matched[ i ] );
						}
					} ) :
					function a__93( elem ) {trace@(a787)
if(step$l>=1)alert('a__93(' + showarglist(arguments) + ')');
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {

		// Potentially complex pseudos
		"not": markFunction( function a__94( selector ) {trace@(a788)
if(step$l>=1)alert('a__94(' + showarglist(arguments) + ')');

			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction( function a__95( seed, matches, _context, xml ) {trace@(a789)
if(step$l>=1)alert('a__95(' + showarglist(arguments) + ')');
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {trace@(a790)
						if ( ( elem = unmatched[ i ] ) ) {trace@(a791)
							seed[ i ] = !( matches[ i ] = elem );
						}
					}
				} ) :
				function a__96( elem, _context, xml ) {trace@(a792)
if(step$l>=1)alert('a__96(' + showarglist(arguments) + ')');
					input[ 0 ] = elem;
					matcher( input, null, xml, results );

					// Don't keep the element (issue #299)
					input[ 0 ] = null;
					return !results.pop();
				};
		} ),

		"has": markFunction( function a__97( selector ) {trace@(a793)
if(step$l>=1)alert('a__97(' + showarglist(arguments) + ')');
			return function a__98( elem ) {trace@(a794)
if(step$l>=1)alert('a__98(' + showarglist(arguments) + ')');
				return Sizzle( selector, elem ).length > 0;
			};
		} ),

		"contains": markFunction( function a__99( text ) {trace@(a795)
if(step$l>=1)alert('a__99(' + showarglist(arguments) + ')');
			text = text.replace( runescape, funescape );
			return function a__100( elem ) {trace@(a796)
if(step$l>=1)alert('a__100(' + showarglist(arguments) + ')');
				return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
			};
		} ),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function a__101( lang ) {trace@(a797)
if(step$l>=1)alert('a__101(' + showarglist(arguments) + ')');

			// lang value must be a valid identifier
			if ( !ridentifier.test( lang || "" ) ) {trace@(a798)
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function a__102( elem ) {trace@(a799)
if(step$l>=1)alert('a__102(' + showarglist(arguments) + ')');
				var elemLang;
				do {trace@(a800)
					if ( ( elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute( "xml:lang" ) || elem.getAttribute( "lang" ) ) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );
				return false;
			};
		} ),

		// Miscellaneous
		"target": function a__103( elem ) {trace@(a801)
if(step$l>=1)alert('a__103(' + showarglist(arguments) + ')');
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function a__104( elem ) {trace@(a802)
if(step$l>=1)alert('a__104(' + showarglist(arguments) + ')');
			return elem === docElem;
		},

		"focus": function a__105( elem ) {trace@(a803)
if(step$l>=1)alert('a__105(' + showarglist(arguments) + ')');
			return elem === document.activeElement &&
				( !document.hasFocus || document.hasFocus() ) &&
				!!( elem.type || elem.href || ~elem.tabIndex );
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function a__106( elem ) {trace@(a804)
if(step$l>=1)alert('a__106(' + showarglist(arguments) + ')');

			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return ( nodeName === "input" && !!elem.checked ) ||
				( nodeName === "option" && !!elem.selected );
		},

		"selected": function a__107( elem ) {trace@(a805)
if(step$l>=1)alert('a__107(' + showarglist(arguments) + ')');

			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {trace@(a806)
				// eslint-disable-next-line no-unused-expressions
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function a__108( elem ) {trace@(a807)
if(step$l>=1)alert('a__108(' + showarglist(arguments) + ')');

			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {trace@(a808)
				if ( elem.nodeType < 6 ) {trace@(a809)
					return false;
				}
			}
			return true;
		},

		"parent": function a__109( elem ) {trace@(a810)
if(step$l>=1)alert('a__109(' + showarglist(arguments) + ')');
			return !Expr.pseudos[ "empty" ]( elem );
		},

		// Element/input types
		"header": function a__110( elem ) {trace@(a811)
if(step$l>=1)alert('a__110(' + showarglist(arguments) + ')');
			return rheader.test( elem.nodeName );
		},

		"input": function a__111( elem ) {trace@(a812)
if(step$l>=1)alert('a__111(' + showarglist(arguments) + ')');
			return rinputs.test( elem.nodeName );
		},

		"button": function a__112( elem ) {trace@(a813)
if(step$l>=1)alert('a__112(' + showarglist(arguments) + ')');
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function a__113( elem ) {trace@(a814)
if(step$l>=1)alert('a__113(' + showarglist(arguments) + ')');
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( ( attr = elem.getAttribute( "type" ) ) == null ||
					attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo( function a__114() {trace@(a815)
if(step$l>=1)alert('a__114(' + showarglist(arguments) + ')');
			return [ 0 ];
		} ),

		"last": createPositionalPseudo( function a__115( _matchIndexes, length ) {trace@(a816)
if(step$l>=1)alert('a__115(' + showarglist(arguments) + ')');
			return [ length - 1 ];
		} ),

		"eq": createPositionalPseudo( function a__116( _matchIndexes, length, argument ) {trace@(a817)
if(step$l>=1)alert('a__116(' + showarglist(arguments) + ')');
			return [ argument < 0 ? argument + length : argument ];
		} ),

		"even": createPositionalPseudo( function a__117( matchIndexes, length ) {trace@(a818)
if(step$l>=1)alert('a__117(' + showarglist(arguments) + ')');
			var i = 0;
			for ( ; i < length; i += 2 ) {trace@(a819)
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"odd": createPositionalPseudo( function a__118( matchIndexes, length ) {trace@(a820)
if(step$l>=1)alert('a__118(' + showarglist(arguments) + ')');
			var i = 1;
			for ( ; i < length; i += 2 ) {trace@(a821)
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"lt": createPositionalPseudo( function a__119( matchIndexes, length, argument ) {trace@(a822)
if(step$l>=1)alert('a__119(' + showarglist(arguments) + ')');
			var i = argument < 0 ?
				argument + length :
				argument > length ?
					length :
					argument;
			for ( ; --i >= 0; ) {trace@(a823)
				matchIndexes.push( i );
			}
			return matchIndexes;
		} ),

		"gt": createPositionalPseudo( function a__120( matchIndexes, length, argument ) {trace@(a824)
if(step$l>=1)alert('a__120(' + showarglist(arguments) + ')');
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {trace@(a825)
				matchIndexes.push( i );
			}
			return matchIndexes;
		} )
	}
};

Expr.pseudos[ "nth" ] = Expr.pseudos[ "eq" ];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function a__121( selector, parseOnly ) {trace@(a826)
if(step$l>=1)alert('a__121(' + showarglist(arguments) + ')');
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {trace@(a827)
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {trace@(a828)

		// Comma and first run
		if ( !matched || ( match = rcomma.exec( soFar ) ) ) {trace@(a829)
			if ( match ) {trace@(a830)

				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[ 0 ].length ) || soFar;
			}
			groups.push( ( tokens = [] ) );
		}

		matched = false;

		// Combinators
		if ( ( match = rcombinators.exec( soFar ) ) ) {trace@(a831)
			matched = match.shift();
			tokens.push( {
				value: matched,

				// Cast descendant combinators to space
				type: match[ 0 ].replace( rtrim, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {trace@(a832)
			if ( ( match = matchExpr[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
				( match = preFilters[ type ]( match ) ) ) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {trace@(a833)
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :

			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {trace@(a834)
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {trace@(a835)
		selector += tokens[ i ].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {trace@(a836)
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?

		// Check against closest ancestor/preceding element
		function a__122( elem, context, xml ) {trace@(a837)
if(step$l>=1)alert('a__122(' + showarglist(arguments) + ')');
			while ( ( elem = elem[ dir ] ) ) {trace@(a838)
				if ( elem.nodeType === 1 || checkNonElements ) {trace@(a839)
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function a__123( elem, context, xml ) {trace@(a840)
if(step$l>=1)alert('a__123(' + showarglist(arguments) + ')');
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {trace@(a841)
				while ( ( elem = elem[ dir ] ) ) {trace@(a842)
					if ( elem.nodeType === 1 || checkNonElements ) {trace@(a843)
						if ( matcher( elem, context, xml ) ) {trace@(a844)
							return true;
						}
					}
				}
			} else {trace@(a845)
				while ( ( elem = elem[ dir ] ) ) {trace@(a846)
					if ( elem.nodeType === 1 || checkNonElements ) {trace@(a847)
						outerCache = elem[ expando ] || ( elem[ expando ] = {} );

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] ||
							( outerCache[ elem.uniqueID ] = {} );

						if ( skip && skip === elem.nodeName.toLowerCase() ) {trace@(a848)
							elem = elem[ dir ] || elem;
						} else if ( ( oldCache = uniqueCache[ key ] ) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return ( newCache[ 2 ] = oldCache[ 2 ] );
						} else {trace@(a849)

							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( ( newCache[ 2 ] = matcher( elem, context, xml ) ) ) {trace@(a850)
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {trace@(a851)
	return matchers.length > 1 ?
		function a__124( elem, context, xml ) {trace@(a852)
if(step$l>=1)alert('a__124(' + showarglist(arguments) + ')');
			var i = matchers.length;
			while ( i-- ) {trace@(a853)
				if ( !matchers[ i ]( elem, context, xml ) ) {trace@(a854)
					return false;
				}
			}
			return true;
		} :
		matchers[ 0 ];
}

function multipleContexts( selector, contexts, results ) {trace@(a855)
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {trace@(a856)
		Sizzle( selector, contexts[ i ], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {trace@(a857)
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {trace@(a858)
		if ( ( elem = unmatched[ i ] ) ) {trace@(a859)
			if ( !filter || filter( elem, context, xml ) ) {trace@(a860)
				newUnmatched.push( elem );
				if ( mapped ) {trace@(a861)
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {trace@(a862)
	if ( postFilter && !postFilter[ expando ] ) {trace@(a863)
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {trace@(a864)
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction( function a__125( seed, results, context, xml ) {trace@(a865)
if(step$l>=1)alert('a__125(' + showarglist(arguments) + ')');
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts(
				selector || "*",
				context.nodeType ? [ context ] : context,
				[]
			),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?

				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {trace@(a866)
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {trace@(a867)
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {trace@(a868)
				if ( ( elem = temp[ i ] ) ) {trace@(a869)
					matcherOut[ postMap[ i ] ] = !( matcherIn[ postMap[ i ] ] = elem );
				}
			}
		}

		if ( seed ) {trace@(a870)
			if ( postFinder || preFilter ) {trace@(a871)
				if ( postFinder ) {trace@(a872)

					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {trace@(a873)
						if ( ( elem = matcherOut[ i ] ) ) {trace@(a874)

							// Restore matcherIn since elem is not yet a final match
							temp.push( ( matcherIn[ i ] = elem ) );
						}
					}
					postFinder( null, ( matcherOut = [] ), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {trace@(a875)
					if ( ( elem = matcherOut[ i ] ) &&
						( temp = postFinder ? indexOf( seed, elem ) : preMap[ i ] ) > -1 ) {

						seed[ temp ] = !( results[ temp ] = elem );
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {trace@(a876)
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {trace@(a877)
				postFinder( null, results, matcherOut, xml );
			} else {trace@(a878)
				push.apply( results, matcherOut );
			}
		}
	} );
}

function matcherFromTokens( tokens ) {trace@(a879)
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[ 0 ].type ],
		implicitRelative = leadingRelative || Expr.relative[ " " ],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function a__126( elem ) {trace@(a880)
if(step$l>=1)alert('a__126(' + showarglist(arguments) + ')');
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function a__127( elem ) {trace@(a881)
if(step$l>=1)alert('a__127(' + showarglist(arguments) + ')');
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function a__128( elem, context, xml ) {trace@(a882)
if(step$l>=1)alert('a__128(' + showarglist(arguments) + ')');
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				( checkContext = context ).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );

			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {trace@(a883)
		if ( ( matcher = Expr.relative[ tokens[ i ].type ] ) ) {trace@(a884)
			matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
		} else {trace@(a885)
			matcher = Expr.filter[ tokens[ i ].type ].apply( null, tokens[ i ].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {trace@(a886)

				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {trace@(a887)
					if ( Expr.relative[ tokens[ j ].type ] ) {trace@(a888)
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(

					// If the preceding token was a descendant combinator, insert an implicit any-element `*`
					tokens
						.slice( 0, i - 1 )
						.concat( { value: tokens[ i - 2 ].type === " " ? "*" : "" } )
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( ( tokens = tokens.slice( j ) ) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {trace@(a889)
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function a__129( seed, context, xml, results, outermost ) {trace@(a890)
if(step$l>=1)alert('a__129(' + showarglist(arguments) + ')');
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,

				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find[ "TAG" ]( "*", outermost ),

				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = ( dirruns += contextBackup == null ? 1 : Math.random() || 0.1 ),
				len = elems.length;

			if ( outermost ) {trace@(a891)

				// Support: IE 11+, Edge 17 - 18+
				// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
				// two documents; shallow comparisons work.
				// eslint-disable-next-line eqeqeq
				outermostContext = context == document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && ( elem = elems[ i ] ) != null; i++ ) {trace@(a892)
				if ( byElement && elem ) {trace@(a893)
					j = 0;

					// Support: IE 11+, Edge 17 - 18+
					// IE/Edge sometimes throw a "Permission denied" error when strict-comparing
					// two documents; shallow comparisons work.
					// eslint-disable-next-line eqeqeq
					if ( !context && elem.ownerDocument != document ) {trace@(a894)
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( ( matcher = elementMatchers[ j++ ] ) ) {trace@(a895)
						if ( matcher( elem, context || document, xml ) ) {trace@(a896)
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {trace@(a897)
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {trace@(a898)

					// They will have gone through all possible matchers
					if ( ( elem = !matcher && elem ) ) {trace@(a899)
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {trace@(a900)
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {trace@(a901)
				j = 0;
				while ( ( matcher = setMatchers[ j++ ] ) ) {trace@(a902)
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {trace@(a903)

					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {trace@(a904)
						while ( i-- ) {trace@(a905)
							if ( !( unmatched[ i ] || setMatched[ i ] ) ) {trace@(a906)
								setMatched[ i ] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {trace@(a907)
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {trace@(a908)

		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {trace@(a909)
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {trace@(a910)
			cached = matcherFromTokens( match[ i ] );
			if ( cached[ expando ] ) {trace@(a911)
				setMatchers.push( cached );
			} else {trace@(a912)
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache(
			selector,
			matcherFromGroupMatchers( elementMatchers, setMatchers )
		);

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function a__130( selector, context, results, seed ) {trace@(a913)
if(step$l>=1)alert('a__130(' + showarglist(arguments) + ')');
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( ( selector = compiled.selector || selector ) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {trace@(a914)

		// Reduce context if the leading compound selector is an ID
		tokens = match[ 0 ] = match[ 0 ].slice( 0 );
		if ( tokens.length > 2 && ( token = tokens[ 0 ] ).type === "ID" &&
			context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[ 1 ].type ] ) {

			context = ( Expr.find[ "ID" ]( token.matches[ 0 ]
				.replace( runescape, funescape ), context ) || [] )[ 0 ];
			if ( !context ) {trace@(a915)
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {trace@(a916)
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr[ "needsContext" ].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {trace@(a917)
			token = tokens[ i ];

			// Abort if we hit a combinator
			if ( Expr.relative[ ( type = token.type ) ] ) {trace@(a918)
				break;
			}
			if ( ( find = Expr.find[ type ] ) ) {trace@(a919)

				// Search, expanding context for leading sibling combinators
				if ( ( seed = find(
					token.matches[ 0 ].replace( runescape, funescape ),
					rsibling.test( tokens[ 0 ].type ) && testContext( context.parentNode ) ||
						context
				) ) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {trace@(a920)
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split( "" ).sort( sortOrder ).join( "" ) === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert( function a__131( el ) {trace@(a921)
if(step$l>=1)alert('a__131(' + showarglist(arguments) + ')');

	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement( "fieldset" ) ) & 1;
} );

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert( function a__132( el ) {trace@(a922)
if(step$l>=1)alert('a__132(' + showarglist(arguments) + ')');
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute( "href" ) === "#";
} ) ) {
	addHandle( "type|href|height|width", function a__133( elem, name, isXML ) {trace@(a923)
if(step$l>=1)alert('a__133(' + showarglist(arguments) + ')');
		if ( !isXML ) {trace@(a924)
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	} );
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert( function a__134( el ) {trace@(a925)
if(step$l>=1)alert('a__134(' + showarglist(arguments) + ')');
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
} ) ) {
	addHandle( "value", function a__135( elem, _name, isXML ) {trace@(a926)
if(step$l>=1)alert('a__135(' + showarglist(arguments) + ')');
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {trace@(a927)
			return elem.defaultValue;
		}
	} );
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert( function a__136( el ) {trace@(a928)
if(step$l>=1)alert('a__136(' + showarglist(arguments) + ')');
	return el.getAttribute( "disabled" ) == null;
} ) ) {
	addHandle( booleans, function a__137( elem, name, isXML ) {trace@(a929)
if(step$l>=1)alert('a__137(' + showarglist(arguments) + ')');
		var val;
		if ( !isXML ) {trace@(a930)
			return elem[ name ] === true ? name.toLowerCase() :
				( val = elem.getAttributeNode( name ) ) && val.specified ?
					val.value :
					null;
		}
	} );
}

{let x$rv=(Sizzle);trace@(a2144);return x$rv;}

} )( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;

// Deprecated
jQuery.expr[ ":" ] = jQuery.expr.pseudos;
jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;
jQuery.escapeSelector = Sizzle.escape;




var dir = function a__138( elem, dir, until ) {trace@(a931)
if(step$l>=1)alert('a__138(' + showarglist(arguments) + ')');
	var matched = [],
		truncate = until !== undefined;

	while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {trace@(a932)
		if ( elem.nodeType === 1 ) {trace@(a933)
			if ( truncate && jQuery( elem ).is( until ) ) {trace@(a934)
				break;
			}
			matched.push( elem );
		}
	}
	return matched;
};


var siblings = function a__139( n, elem ) {trace@(a935)
if(step$l>=1)alert('a__139(' + showarglist(arguments) + ')');
	var matched = [];

	for ( ; n; n = n.nextSibling ) {trace@(a936)
		if ( n.nodeType === 1 && n !== elem ) {trace@(a937)
			matched.push( n );
		}
	}

	return matched;
};


var rneedsContext = jQuery.expr.match.needsContext;



function nodeName( elem, name ) {trace@(a938)

  {let x$rv=(elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase());trace@(a2145);return x$rv;}

};
trace@(a939)var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );



// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {trace@(a940)
	if ( isFunction( qualifier ) ) {trace@(a941)
		return jQuery.grep( elements, function a__140( elem, i ) {trace@(a942)
if(step$l>=1)alert('a__140(' + showarglist(arguments) + ')');
			return !!qualifier.call( elem, i, elem ) !== not;
		} );
	}

	// Single element
	if ( qualifier.nodeType ) {trace@(a943)
		return jQuery.grep( elements, function a__141( elem ) {trace@(a944)
if(step$l>=1)alert('a__141(' + showarglist(arguments) + ')');
			return ( elem === qualifier ) !== not;
		} );
	}

	// Arraylike of elements (jQuery, arguments, Array)
	if ( typeof qualifier !== "string" ) {trace@(a945)
		return jQuery.grep( elements, function a__142( elem ) {trace@(a946)
if(step$l>=1)alert('a__142(' + showarglist(arguments) + ')');
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	// Filtered directly for both simple and complex selectors
	return jQuery.filter( qualifier, elements, not );
}

jQuery.filter = function a__143( expr, elems, not ) {trace@(a947)
if(step$l>=1)alert('a__143(' + showarglist(arguments) + ')');
	var elem = elems[ 0 ];

	if ( not ) {trace@(a948)
		expr = ":not(" + expr + ")";
	}

	if ( elems.length === 1 && elem.nodeType === 1 ) {trace@(a949)
		return jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [];
	}

	return jQuery.find.matches( expr, jQuery.grep( elems, function a__144( elem ) {trace@(a950)
if(step$l>=1)alert('a__144(' + showarglist(arguments) + ')');
		return elem.nodeType === 1;
	} ) );
};

jQuery.fn.extend( {
	find: function a__145( selector ) {trace@(a951)
if(step$l>=1)alert('a__145(' + showarglist(arguments) + ')');
		var i, ret,
			len = this.length,
			self = this;

		if ( typeof selector !== "string" ) {trace@(a952)
			return this.pushStack( jQuery( selector ).filter( function a__146() {trace@(a953)
if(step$l>=1)alert('a__146(' + showarglist(arguments) + ')');
				for ( i = 0; i < len; i++ ) {trace@(a954)
					if ( jQuery.contains( self[ i ], this ) ) {trace@(a955)
						return true;
					}
				}
			} ) );
		}

		ret = this.pushStack( [] );

		for ( i = 0; i < len; i++ ) {trace@(a956)
			jQuery.find( selector, self[ i ], ret );
		}

		return len > 1 ? jQuery.uniqueSort( ret ) : ret;
	},
	filter: function a__147( selector ) {trace@(a957)
if(step$l>=1)alert('a__147(' + showarglist(arguments) + ')');
		return this.pushStack( winnow( this, selector || [], false ) );
	},
	not: function a__148( selector ) {trace@(a958)
if(step$l>=1)alert('a__148(' + showarglist(arguments) + ')');
		return this.pushStack( winnow( this, selector || [], true ) );
	},
	is: function a__149( selector ) {trace@(a959)
if(step$l>=1)alert('a__149(' + showarglist(arguments) + ')');
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
} );


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	// Shortcut simple #id case for speed
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function a__150( selector, context, root ) {trace@(a960)
if(step$l>=1)alert('a__150(' + showarglist(arguments) + ')');
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {trace@(a961)
			return this;
		}

		// Method init() accepts an alternate rootjQuery
		// so migrate can support jQuery.sub (gh-2101)
		root = root || rootjQuery;

		// Handle HTML strings
		if ( typeof selector === "string" ) {trace@(a962)
			if ( selector[ 0 ] === "<" &&
				selector[ selector.length - 1 ] === ">" &&
				selector.length >= 3 ) {

				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {trace@(a963)
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && ( match[ 1 ] || !context ) ) {trace@(a964)

				// HANDLE: $(html) -> $(array)
				if ( match[ 1 ] ) {trace@(a965)
					context = context instanceof jQuery ? context[ 0 ] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[ 1 ],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {trace@(a966)
						for ( match in context ) {trace@(a967)

							// Properties of context are called as methods if possible
							if ( isFunction( this[ match ] ) ) {trace@(a968)
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {trace@(a969)
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {trace@(a970)
					elem = document.getElementById( match[ 2 ] );

					if ( elem ) {trace@(a971)

						// Inject the element directly into the jQuery object
						this[ 0 ] = elem;
						this.length = 1;
					}
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {trace@(a972)
				return ( context || root ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {trace@(a973)
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {trace@(a974)
			this[ 0 ] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( isFunction( selector ) ) {trace@(a975)
			return root.ready !== undefined ?
				root.ready( selector ) :

				// Execute immediately if ready is not present
				selector( jQuery );
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend( {
	has: function a__151( target ) {trace@(a976)
if(step$l>=1)alert('a__151(' + showarglist(arguments) + ')');
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter( function a__152() {trace@(a977)
if(step$l>=1)alert('a__152(' + showarglist(arguments) + ')');
			var i = 0;
			for ( ; i < l; i++ ) {trace@(a978)
				if ( jQuery.contains( this, targets[ i ] ) ) {trace@(a979)
					return true;
				}
			}
		} );
	},

	closest: function a__153( selectors, context ) {trace@(a980)
if(step$l>=1)alert('a__153(' + showarglist(arguments) + ')');
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery( selectors );

		// Positional selectors never match, since there's no _selection_ context
		if ( !rneedsContext.test( selectors ) ) {trace@(a981)
			for ( ; i < l; i++ ) {trace@(a982)
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {trace@(a983)

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( targets ?
						targets.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function a__154( elem ) {trace@(a984)
if(step$l>=1)alert('a__154(' + showarglist(arguments) + ')');

		// No argument, return index in parent
		if ( !elem ) {trace@(a985)
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {trace@(a986)
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function a__155( selector, context ) {trace@(a987)
if(step$l>=1)alert('a__155(' + showarglist(arguments) + ')');
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function a__156( selector ) {trace@(a988)
if(step$l>=1)alert('a__156(' + showarglist(arguments) + ')');
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	}
} );

function sibling( cur, dir ) {trace@(a989)
	while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each( {
	parent: function a__157( elem ) {trace@(a990)
if(step$l>=1)alert('a__157(' + showarglist(arguments) + ')');
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function a__158( elem ) {trace@(a991)
if(step$l>=1)alert('a__158(' + showarglist(arguments) + ')');
		return dir( elem, "parentNode" );
	},
	parentsUntil: function a__159( elem, _i, until ) {trace@(a992)
if(step$l>=1)alert('a__159(' + showarglist(arguments) + ')');
		return dir( elem, "parentNode", until );
	},
	next: function a__160( elem ) {trace@(a993)
if(step$l>=1)alert('a__160(' + showarglist(arguments) + ')');
		return sibling( elem, "nextSibling" );
	},
	prev: function a__161( elem ) {trace@(a994)
if(step$l>=1)alert('a__161(' + showarglist(arguments) + ')');
		return sibling( elem, "previousSibling" );
	},
	nextAll: function a__162( elem ) {trace@(a995)
if(step$l>=1)alert('a__162(' + showarglist(arguments) + ')');
		return dir( elem, "nextSibling" );
	},
	prevAll: function a__163( elem ) {trace@(a996)
if(step$l>=1)alert('a__163(' + showarglist(arguments) + ')');
		return dir( elem, "previousSibling" );
	},
	nextUntil: function a__164( elem, _i, until ) {trace@(a997)
if(step$l>=1)alert('a__164(' + showarglist(arguments) + ')');
		return dir( elem, "nextSibling", until );
	},
	prevUntil: function a__165( elem, _i, until ) {trace@(a998)
if(step$l>=1)alert('a__165(' + showarglist(arguments) + ')');
		return dir( elem, "previousSibling", until );
	},
	siblings: function a__166( elem ) {trace@(a999)
if(step$l>=1)alert('a__166(' + showarglist(arguments) + ')');
		return siblings( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function a__167( elem ) {trace@(a1000)
if(step$l>=1)alert('a__167(' + showarglist(arguments) + ')');
		return siblings( elem.firstChild );
	},
	contents: function a__168( elem ) {trace@(a1001)
if(step$l>=1)alert('a__168(' + showarglist(arguments) + ')');
		if ( elem.contentDocument != null &&

			// Support: IE 11+
			// <object> elements with no `data` attribute has an object
			// `contentDocument` with a `null` prototype.
			getProto( elem.contentDocument ) ) {

			return elem.contentDocument;
		}

		// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
		// Treat the template element as a regular one in browsers that
		// don't support it.
		if ( nodeName( elem, "template" ) ) {trace@(a1002)
			elem = elem.content || elem;
		}

		return jQuery.merge( [], elem.childNodes );
	}
}, function a__169( name, fn ) {trace@(a1003)
if(step$l>=1)alert('a__169(' + showarglist(arguments) + ')');
	jQuery.fn[ name ] = function a__170( until, selector ) {trace@(a1004)
if(step$l>=1)alert('a__170(' + showarglist(arguments) + ')');
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {trace@(a1005)
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {trace@(a1006)
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {trace@(a1007)

			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {trace@(a1008)
				jQuery.uniqueSort( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {trace@(a1009)
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
} );
trace@(a1010)var rnothtmlwhite = ( /[^\x20\t\r\n\f]+/g );



// Convert String-formatted options into Object-formatted ones
function createOptions( options ) {trace@(a1011)
	var object = {};
	jQuery.each( options.match( rnothtmlwhite ) || [], function a__171( _, flag ) {trace@(a1012)
if(step$l>=1)alert('a__171(' + showarglist(arguments) + ')');
		object[ flag ] = true;
	} );
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function a__172( options ) {trace@(a1013)
if(step$l>=1)alert('a__172(' + showarglist(arguments) + ')');

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		createOptions( options ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,

		// Last fire value for non-forgettable lists
		memory,

		// Flag to know if list was already fired
		fired,

		// Flag to prevent firing
		locked,

		// Actual callback list
		list = [],

		// Queue of execution data for repeatable lists
		queue = [],

		// Index of currently firing callback (modified by add/remove as needed)
		firingIndex = -1,

		// Fire callbacks
		fire = function a__173() {trace@(a1014)
if(step$l>=1)alert('a__173(' + showarglist(arguments) + ')');

			// Enforce single-firing
			locked = locked || options.once;

			// Execute callbacks for all pending executions,
			// respecting firingIndex overrides and runtime changes
			fired = firing = true;
			for ( ; queue.length; firingIndex = -1 ) {trace@(a1015)
				memory = queue.shift();
				while ( ++firingIndex < list.length ) {trace@(a1016)

					// Run callback and check for early termination
					if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
						options.stopOnFalse ) {

						// Jump to end and forget the data so .add doesn't re-fire
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// Forget the data if we're done with it
			if ( !options.memory ) {trace@(a1017)
				memory = false;
			}

			firing = false;

			// Clean up if we're done firing for good
			if ( locked ) {trace@(a1018)

				// Keep an empty list if we have data for future add calls
				if ( memory ) {trace@(a1019)
					list = [];

				// Otherwise, this object is spent
				} else {trace@(a1020)
					list = "";
				}
			}
		},

		// Actual Callbacks object
		self = {

			// Add a callback or a collection of callbacks to the list
			add: function a__174() {trace@(a1021)
if(step$l>=1)alert('a__174(' + showarglist(arguments) + ')');
				if ( list ) {trace@(a1022)

					// If we have memory from a past run, we should fire after adding
					if ( memory && !firing ) {trace@(a1023)
						firingIndex = list.length - 1;
						queue.push( memory );
					}

					( function add( args ) {trace@(a1024)
						jQuery.each( args, function a__175( _, arg ) {trace@(a1025)
if(step$l>=1)alert('a__175(' + showarglist(arguments) + ')');
							if ( isFunction( arg ) ) {trace@(a1026)
								if ( !options.unique || !self.has( arg ) ) {trace@(a1027)
									list.push( arg );
								}
							} else if ( arg && arg.length && toType( arg ) !== "string" ) {trace@(a1028)

								// Inspect recursively
								add( arg );
							}
						} );
					} )( arguments );

					if ( memory && !firing ) {trace@(a1029)
						fire();
					}
				}
				return this;
			},

			// Remove a callback from the list
			remove: function a__176() {trace@(a1030)
if(step$l>=1)alert('a__176(' + showarglist(arguments) + ')');
				jQuery.each( arguments, function a__177( _, arg ) {trace@(a1031)
if(step$l>=1)alert('a__177(' + showarglist(arguments) + ')');
					var index;
					while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {trace@(a1032)
						list.splice( index, 1 );

						// Handle firing indexes
						if ( index <= firingIndex ) {trace@(a1033)
							firingIndex--;
						}
					}
				} );
				return this;
			},

			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function a__178( fn ) {trace@(a1034)
if(step$l>=1)alert('a__178(' + showarglist(arguments) + ')');
				return fn ?
					jQuery.inArray( fn, list ) > -1 :
					list.length > 0;
			},

			// Remove all callbacks from the list
			empty: function a__179() {trace@(a1035)
if(step$l>=1)alert('a__179(' + showarglist(arguments) + ')');
				if ( list ) {trace@(a1036)
					list = [];
				}
				return this;
			},

			// Disable .fire and .add
			// Abort any current/pending executions
			// Clear all callbacks and values
			disable: function a__180() {trace@(a1037)
if(step$l>=1)alert('a__180(' + showarglist(arguments) + ')');
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function a__181() {trace@(a1038)
if(step$l>=1)alert('a__181(' + showarglist(arguments) + ')');
				return !list;
			},

			// Disable .fire
			// Also disable .add unless we have memory (since it would have no effect)
			// Abort any pending executions
			lock: function a__182() {trace@(a1039)
if(step$l>=1)alert('a__182(' + showarglist(arguments) + ')');
				locked = queue = [];
				if ( !memory && !firing ) {trace@(a1040)
					list = memory = "";
				}
				return this;
			},
			locked: function a__183() {trace@(a1041)
if(step$l>=1)alert('a__183(' + showarglist(arguments) + ')');
				return !!locked;
			},

			// Call all callbacks with the given context and arguments
			fireWith: function a__184( context, args ) {trace@(a1042)
if(step$l>=1)alert('a__184(' + showarglist(arguments) + ')');
				if ( !locked ) {trace@(a1043)
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					queue.push( args );
					if ( !firing ) {trace@(a1044)
						fire();
					}
				}
				return this;
			},

			// Call all the callbacks with the given arguments
			fire: function a__185() {trace@(a1045)
if(step$l>=1)alert('a__185(' + showarglist(arguments) + ')');
				self.fireWith( this, arguments );
				return this;
			},

			// To know if the callbacks have already been called at least once
			fired: function a__186() {trace@(a1046)
if(step$l>=1)alert('a__186(' + showarglist(arguments) + ')');
				return !!fired;
			}
		};

	return self;
};


function Identity( v ) {trace@(a1047)
	return v;
}
function Thrower( ex ) {trace@(a1048)
	throw ex;
}

function adoptValue( value, resolve, reject, noValue ) {trace@(a1049)
	var method;

	try {trace@(a1050)

		// Check for promise aspect first to privilege synchronous behavior
		if ( value && isFunction( ( method = value.promise ) ) ) {trace@(a1051)
			method.call( value ).done( resolve ).fail( reject );

		// Other thenables
		} else if ( value && isFunction( ( method = value.then ) ) ) {trace@(a1052)
			method.call( value, resolve, reject );

		// Other non-thenables
		} else {trace@(a1053)

			// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
			// * false: [ value ].slice( 0 ) => resolve( value )
			// * true: [ value ].slice( 1 ) => resolve()
			resolve.apply( undefined, [ value ].slice( noValue ) );
		}

	// For Promises/A+, convert exceptions into rejections
	// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
	// Deferred#then to conditionally suppress rejection.
	} catch ( value ) {

		// Support: Android 4.0 only
		// Strict mode functions invoked without .call/.apply get global-object context
		reject.apply( undefined, [ value ] );
	}
}

jQuery.extend( {

	Deferred: function a__187( func ) {trace@(a1054)
if(step$l>=1)alert('a__187(' + showarglist(arguments) + ')');
		var tuples = [

				// action, add listener, callbacks,
				// ... .then handlers, argument index, [final state]
				[ "notify", "progress", jQuery.Callbacks( "memory" ),
					jQuery.Callbacks( "memory" ), 2 ],
				[ "resolve", "done", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 0, "resolved" ],
				[ "reject", "fail", jQuery.Callbacks( "once memory" ),
					jQuery.Callbacks( "once memory" ), 1, "rejected" ]
			],
			state = "pending",
			promise = {
				state: function a__188() {trace@(a1055)
if(step$l>=1)alert('a__188(' + showarglist(arguments) + ')');
					return state;
				},
				always: function a__189() {trace@(a1056)
if(step$l>=1)alert('a__189(' + showarglist(arguments) + ')');
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				"catch": function a__190( fn ) {trace@(a1057)
if(step$l>=1)alert('a__190(' + showarglist(arguments) + ')');
					return promise.then( null, fn );
				},

				// Keep pipe for back-compat
				pipe: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;

					return jQuery.Deferred( function a__191( newDefer ) {trace@(a1058)
if(step$l>=1)alert('a__191(' + showarglist(arguments) + ')');
						jQuery.each( tuples, function a__192( _i, tuple ) {trace@(a1059)
if(step$l>=1)alert('a__192(' + showarglist(arguments) + ')');

							// Map tuples (progress, done, fail) to arguments (done, fail, progress)
							var fn = isFunction( fns[ tuple[ 4 ] ] ) && fns[ tuple[ 4 ] ];

							// deferred.progress(function() { bind to newDefer or newDefer.notify })
							// deferred.done(function() { bind to newDefer or newDefer.resolve })
							// deferred.fail(function() { bind to newDefer or newDefer.reject })
							deferred[ tuple[ 1 ] ]( function a__193() {trace@(a1060)
if(step$l>=1)alert('a__193(' + showarglist(arguments) + ')');
								var returned = fn && fn.apply( this, arguments );
								if ( returned && isFunction( returned.promise ) ) {trace@(a1061)
									returned.promise()
										.progress( newDefer.notify )
										.done( newDefer.resolve )
										.fail( newDefer.reject );
								} else {trace@(a1062)
									newDefer[ tuple[ 0 ] + "With" ](
										this,
										fn ? [ returned ] : arguments
									);
								}
							} );
						} );
						fns = null;
					} ).promise();
				},
				then: function a__194( onFulfilled, onRejected, onProgress ) {trace@(a1063)
if(step$l>=1)alert('a__194(' + showarglist(arguments) + ')');
					var maxDepth = 0;
					function resolve( depth, deferred, handler, special ) {trace@(a1064)
						return function a__195() {trace@(a1065)
if(step$l>=1)alert('a__195(' + showarglist(arguments) + ')');
							var that = this,
								args = arguments,
								mightThrow = function a__196() {trace@(a1066)
if(step$l>=1)alert('a__196(' + showarglist(arguments) + ')');
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if ( depth < maxDepth ) {trace@(a1067)
										return;
									}

									returned = handler.apply( that, args );

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if ( returned === deferred.promise() ) {trace@(a1068)
										throw new TypeError( "Thenable self-resolution" );
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										( typeof returned === "object" ||
											typeof returned === "function" ) &&
										returned.then;

									// Handle a returned thenable
									if ( isFunction( then ) ) {trace@(a1069)

										// Special processors (notify) just wait for resolution
										if ( special ) {trace@(a1070)
											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special )
											);

										// Normal processors (resolve) also hook into progress
										} else {trace@(a1071)

											// ...and disregard older resolution values
											maxDepth++;

											then.call(
												returned,
												resolve( maxDepth, deferred, Identity, special ),
												resolve( maxDepth, deferred, Thrower, special ),
												resolve( maxDepth, deferred, Identity,
													deferred.notifyWith )
											);
										}

									// Handle all other returned values
									} else {trace@(a1072)

										// Only substitute handlers pass on context
										// and multiple values (non-spec behavior)
										if ( handler !== Identity ) {trace@(a1073)
											that = undefined;
											args = [ returned ];
										}

										// Process the value(s)
										// Default process is resolve
										( special || deferred.resolveWith )( that, args );
									}
								},

								// Only normal processors (resolve) catch and reject exceptions
								process = special ?
									mightThrow :
									function a__197() {trace@(a1074)
if(step$l>=1)alert('a__197(' + showarglist(arguments) + ')');
										try {trace@(a1075)
											mightThrow();
										} catch ( e ) {

											if ( jQuery.Deferred.exceptionHook ) {trace@(a1076)
												jQuery.Deferred.exceptionHook( e,
													process.stackTrace );
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if ( depth + 1 >= maxDepth ) {trace@(a1077)

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if ( handler !== Thrower ) {trace@(a1078)
													that = undefined;
													args = [ e ];
												}

												deferred.rejectWith( that, args );
											}
										}
									};

							// Support: Promises/A+ section 2.3.3.3.1
							// https://promisesaplus.com/#point-57
							// Re-resolve promises immediately to dodge false rejection from
							// subsequent errors
							if ( depth ) {trace@(a1079)
								process();
							} else {trace@(a1080)

								// Call an optional hook to record the stack, in case of exception
								// since it's otherwise lost when execution goes async
								if ( jQuery.Deferred.getStackHook ) {trace@(a1081)
									process.stackTrace = jQuery.Deferred.getStackHook();
								}
								window.setTimeout( process );
							}
						};
					}

					return jQuery.Deferred( function a__198( newDefer ) {trace@(a1082)
if(step$l>=1)alert('a__198(' + showarglist(arguments) + ')');

						// progress_handlers.add( ... )
						tuples[ 0 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onProgress ) ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[ 1 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onFulfilled ) ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[ 2 ][ 3 ].add(
							resolve(
								0,
								newDefer,
								isFunction( onRejected ) ?
									onRejected :
									Thrower
							)
						);
					} ).promise();
				},

				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function a__199( obj ) {trace@(a1083)
if(step$l>=1)alert('a__199(' + showarglist(arguments) + ')');
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Add list-specific methods
		jQuery.each( tuples, function a__200( i, tuple ) {trace@(a1084)
if(step$l>=1)alert('a__200(' + showarglist(arguments) + ')');
			var list = tuple[ 2 ],
				stateString = tuple[ 5 ];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[ tuple[ 1 ] ] = list.add;

			// Handle state
			if ( stateString ) {trace@(a1085)
				list.add(
					function a__201() {trace@(a1086)
if(step$l>=1)alert('a__201(' + showarglist(arguments) + ')');

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[ 3 - i ][ 2 ].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[ 3 - i ][ 3 ].disable,

					// progress_callbacks.lock
					tuples[ 0 ][ 2 ].lock,

					// progress_handlers.lock
					tuples[ 0 ][ 3 ].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add( tuple[ 3 ].fire );

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[ tuple[ 0 ] ] = function a__202() {trace@(a1087)
if(step$l>=1)alert('a__202(' + showarglist(arguments) + ')');
				deferred[ tuple[ 0 ] + "With" ]( this === deferred ? undefined : this, arguments );
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
		} );

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {trace@(a1088)
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function a__203( singleValue ) {trace@(a1089)
if(step$l>=1)alert('a__203(' + showarglist(arguments) + ')');
		var

			// count of uncompleted subordinates
			remaining = arguments.length,

			// count of unprocessed arguments
			i = remaining,

			// subordinate fulfillment data
			resolveContexts = Array( i ),
			resolveValues = slice.call( arguments ),

			// the master Deferred
			master = jQuery.Deferred(),

			// subordinate callback factory
			updateFunc = function a__204( i ) {trace@(a1090)
if(step$l>=1)alert('a__204(' + showarglist(arguments) + ')');
				return function a__205( value ) {trace@(a1091)
if(step$l>=1)alert('a__205(' + showarglist(arguments) + ')');
					resolveContexts[ i ] = this;
					resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( !( --remaining ) ) {trace@(a1092)
						master.resolveWith( resolveContexts, resolveValues );
					}
				};
			};

		// Single- and empty arguments are adopted like Promise.resolve
		if ( remaining <= 1 ) {trace@(a1093)
			adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
				!remaining );

			// Use .then() to unwrap secondary thenables (cf. gh-3000)
			if ( master.state() === "pending" ||
				isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

				return master.then();
			}
		}

		// Multiple arguments are aggregated like Promise.all array elements
		while ( i-- ) {trace@(a1094)
			adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
		}

		return master.promise();
	}
} );


// These usually indicate a programmer mistake during development,
// warn about them ASAP rather than swallowing them by default.
trace@(a1095)var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

jQuery.Deferred.exceptionHook = function a__206( error, stack ) {trace@(a1096)
if(step$l>=1)alert('a__206(' + showarglist(arguments) + ')');

	// Support: IE 8 - 9 only
	// Console exists when dev tools are open, which can happen at any time
	if ( window.console && window.console.warn && error && rerrorNames.test( error.name ) ) {trace@(a1097)
		window.console.warn( "jQuery.Deferred exception: " + error.message, error.stack, stack );
	}
};




jQuery.readyException = function a__207( error ) {trace@(a1098)
if(step$l>=1)alert('a__207(' + showarglist(arguments) + ')');
	window.setTimeout( function a__208() {trace@(a1099)
if(step$l>=1)alert('a__208(' + showarglist(arguments) + ')');
		throw error;
	} );
};




// The deferred used on DOM ready
trace@(a1100)var readyList = jQuery.Deferred();

jQuery.fn.ready = function a__209( fn ) {trace@(a1101)
if(step$l>=1)alert('a__209(' + showarglist(arguments) + ')');

	readyList
		.then( fn )

		// Wrap jQuery.readyException in a function so that the lookup
		// happens at the time of error handling instead of callback
		// registration.
		.catch( function a__210( error ) {trace@(a1102)
if(step$l>=1)alert('a__210(' + showarglist(arguments) + ')');
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Handle when the DOM is ready
	ready: function a__211( wait ) {trace@(a1103)
if(step$l>=1)alert('a__211(' + showarglist(arguments) + ')');

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {trace@(a1104)
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {trace@(a1105)
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// The ready event handler and self cleanup method
function completed() {trace@(a1106)
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if ( document.readyState === "complete" ||
	( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

	// Handle it asynchronously to allow scripts the opportunity to delay ready
	window.setTimeout( jQuery.ready );

} else {trace@(a1107)

	// Use the handy event callback
	document.addEventListener( "DOMContentLoaded", completed );

	// A fallback to window.onload, that will always work
	window.addEventListener( "load", completed );
}




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
trace@(a1108)var access = function a__212( elems, fn, key, value, chainable, emptyGet, raw ) {trace@(a1109)
if(step$l>=1)alert('a__212(' + showarglist(arguments) + ')');
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( toType( key ) === "object" ) {trace@(a1110)
		chainable = true;
		for ( i in key ) {trace@(a1111)
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {trace@(a1112)
		chainable = true;

		if ( !isFunction( value ) ) {trace@(a1113)
			raw = true;
		}

		if ( bulk ) {trace@(a1114)

			// Bulk operations run against the entire set
			if ( raw ) {trace@(a1115)
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {trace@(a1116)
				bulk = fn;
				fn = function a__213( elem, _key, value ) {trace@(a1117)
if(step$l>=1)alert('a__213(' + showarglist(arguments) + ')');
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {trace@(a1118)
			for ( ; i < len; i++ ) {trace@(a1119)
				fn(
					elems[ i ], key, raw ?
					value :
					value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {trace@(a1120)
		return elems;
	}

	// Gets
	if ( bulk ) {trace@(a1121)
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
};


// Matches dashed string for camelizing
trace@(a1122)var rmsPrefix = /^-ms-/,
	rdashAlpha = /-([a-z])/g;

// Used by camelCase as callback to replace()
function fcamelCase( _all, letter ) {trace@(a1123)
	return letter.toUpperCase();
}

// Convert dashed to camelCase; used by the css and data modules
// Support: IE <=9 - 11, Edge 12 - 15
// Microsoft forgot to hump their vendor prefix (#9572)
function camelCase( string ) {trace@(a1124)
	return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
}
trace@(a1125)var acceptData = function a__214( owner ) {trace@(a1126)
if(step$l>=1)alert('a__214(' + showarglist(arguments) + ')');

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};




function Data() {trace@(a1127)
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function a__215( owner ) {trace@(a1128)
if(step$l>=1)alert('a__215(' + showarglist(arguments) + ')');

		// Check if the owner object already has a cache
		var value = owner[ this.expando ];

		// If not, create one
		if ( !value ) {trace@(a1129)
			value = {};

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( acceptData( owner ) ) {trace@(a1130)

				// If it is a node unlikely to be stringify-ed or looped over
				// use plain assignment
				if ( owner.nodeType ) {trace@(a1131)
					owner[ this.expando ] = value;

				// Otherwise secure it in a non-enumerable property
				// configurable must be true to allow the property to be
				// deleted when data is removed
				} else {trace@(a1132)
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function a__216( owner, data, value ) {trace@(a1133)
if(step$l>=1)alert('a__216(' + showarglist(arguments) + ')');
		var prop,
			cache = this.cache( owner );

		// Handle: [ owner, key, value ] args
		// Always use camelCase key (gh-2257)
		if ( typeof data === "string" ) {trace@(a1134)
			cache[ camelCase( data ) ] = value;

		// Handle: [ owner, { properties } ] args
		} else {trace@(a1135)

			// Copy the properties one-by-one to the cache object
			for ( prop in data ) {trace@(a1136)
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return cache;
	},
	get: function a__217( owner, key ) {trace@(a1137)
if(step$l>=1)alert('a__217(' + showarglist(arguments) + ')');
		return key === undefined ?
			this.cache( owner ) :

			// Always use camelCase key (gh-2257)
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function a__218( owner, key, value ) {trace@(a1138)
if(step$l>=1)alert('a__218(' + showarglist(arguments) + ')');

		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function a__219( owner, key ) {trace@(a1139)
if(step$l>=1)alert('a__219(' + showarglist(arguments) + ')');
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {trace@(a1140)
			return;
		}

		if ( key !== undefined ) {trace@(a1141)

			// Support array or space separated string of keys
			if ( Array.isArray( key ) ) {trace@(a1142)

				// If key is an array of keys...
				// We always set camelCase keys, so remove that.
				key = key.map( camelCase );
			} else {trace@(a1143)
				key = camelCase( key );

				// If a key with the spaces exists, use it.
				// Otherwise, create an array by matching non-whitespace
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {trace@(a1144)
				delete cache[ key[ i ] ];
			}
		}

		// Remove the expando if there's no more data
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {trace@(a1145)

			// Support: Chrome <=35 - 45
			// Webkit & Blink performance suffers when deleting properties
			// from DOM nodes, so set to undefined instead
			// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
			if ( owner.nodeType ) {trace@(a1146)
				owner[ this.expando ] = undefined;
			} else {trace@(a1147)
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function a__220( owner ) {trace@(a1148)
if(step$l>=1)alert('a__220(' + showarglist(arguments) + ')');
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
trace@(a1149)var dataPriv = new Data();

var dataUser = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

function getData( data ) {trace@(a1150)
	if ( data === "true" ) {trace@(a1151)
		return true;
	}

	if ( data === "false" ) {trace@(a1152)
		return false;
	}

	if ( data === "null" ) {trace@(a1153)
		return null;
	}

	// Only convert to a number if it doesn't change the string
	if ( data === +data + "" ) {trace@(a1154)
		return +data;
	}

	if ( rbrace.test( data ) ) {trace@(a1155)
		return JSON.parse( data );
	}

	return data;
}

function dataAttr( elem, key, data ) {trace@(a1156)
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {trace@(a1157)
		name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {trace@(a1158)
			try {trace@(a1159)
				data = getData( data );
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
			dataUser.set( elem, key, data );
		} else {trace@(a1160)
			data = undefined;
		}
	}
	return data;
}

jQuery.extend( {
	hasData: function a__221( elem ) {trace@(a1161)
if(step$l>=1)alert('a__221(' + showarglist(arguments) + ')');
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

	data: function a__222( elem, name, data ) {trace@(a1162)
if(step$l>=1)alert('a__222(' + showarglist(arguments) + ')');
		return dataUser.access( elem, name, data );
	},

	removeData: function a__223( elem, name ) {trace@(a1163)
if(step$l>=1)alert('a__223(' + showarglist(arguments) + ')');
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function a__224( elem, name, data ) {trace@(a1164)
if(step$l>=1)alert('a__224(' + showarglist(arguments) + ')');
		return dataPriv.access( elem, name, data );
	},

	_removeData: function a__225( elem, name ) {trace@(a1165)
if(step$l>=1)alert('a__225(' + showarglist(arguments) + ')');
		dataPriv.remove( elem, name );
	}
} );

jQuery.fn.extend( {
	data: function a__226( key, value ) {trace@(a1166)
if(step$l>=1)alert('a__226(' + showarglist(arguments) + ')');
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {trace@(a1167)
			if ( this.length ) {trace@(a1168)
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {trace@(a1169)
					i = attrs.length;
					while ( i-- ) {trace@(a1170)

						// Support: IE 11 only
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {trace@(a1171)
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {trace@(a1172)
								name = camelCase( name.slice( 5 ) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {trace@(a1173)
			return this.each( function a__227() {trace@(a1174)
if(step$l>=1)alert('a__227(' + showarglist(arguments) + ')');
				dataUser.set( this, key );
			} );
		}

		return access( this, function a__228( value ) {trace@(a1175)
if(step$l>=1)alert('a__228(' + showarglist(arguments) + ')');
			var data;

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {trace@(a1176)

				// Attempt to get data from the cache
				// The key will always be camelCased in Data
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {trace@(a1177)
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, key );
				if ( data !== undefined ) {trace@(a1178)
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each( function a__229() {trace@(a1179)
if(step$l>=1)alert('a__229(' + showarglist(arguments) + ')');

				// We always store the camelCased key
				dataUser.set( this, key, value );
			} );
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function a__230( key ) {trace@(a1180)
if(step$l>=1)alert('a__230(' + showarglist(arguments) + ')');
		return this.each( function a__231() {trace@(a1181)
if(step$l>=1)alert('a__231(' + showarglist(arguments) + ')');
			dataUser.remove( this, key );
		} );
	}
} );


jQuery.extend( {
	queue: function a__232( elem, type, data ) {trace@(a1182)
if(step$l>=1)alert('a__232(' + showarglist(arguments) + ')');
		var queue;

		if ( elem ) {trace@(a1183)
			type = ( type || "fx" ) + "queue";
			queue = dataPriv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {trace@(a1184)
				if ( !queue || Array.isArray( data ) ) {trace@(a1185)
					queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
				} else {trace@(a1186)
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function a__233( elem, type ) {trace@(a1187)
if(step$l>=1)alert('a__233(' + showarglist(arguments) + ')');
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function a__234() {trace@(a1188)
if(step$l>=1)alert('a__234(' + showarglist(arguments) + ')');
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {trace@(a1189)
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {trace@(a1190)

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {trace@(a1191)
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {trace@(a1192)
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function a__235( elem, type ) {trace@(a1193)
if(step$l>=1)alert('a__235(' + showarglist(arguments) + ')');
		var key = type + "queueHooks";
		return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
			empty: jQuery.Callbacks( "once memory" ).add( function a__236() {trace@(a1194)
if(step$l>=1)alert('a__236(' + showarglist(arguments) + ')');
				dataPriv.remove( elem, [ type + "queue", key ] );
			} )
		} );
	}
} );

jQuery.fn.extend( {
	queue: function a__237( type, data ) {trace@(a1195)
if(step$l>=1)alert('a__237(' + showarglist(arguments) + ')');
		var setter = 2;

		if ( typeof type !== "string" ) {trace@(a1196)
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {trace@(a1197)
			return jQuery.queue( this[ 0 ], type );
		}

		return data === undefined ?
			this :
			this.each( function a__238() {trace@(a1198)
if(step$l>=1)alert('a__238(' + showarglist(arguments) + ')');
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {trace@(a1199)
					jQuery.dequeue( this, type );
				}
			} );
	},
	dequeue: function a__239( type ) {trace@(a1200)
if(step$l>=1)alert('a__239(' + showarglist(arguments) + ')');
		return this.each( function a__240() {trace@(a1201)
if(step$l>=1)alert('a__240(' + showarglist(arguments) + ')');
			jQuery.dequeue( this, type );
		} );
	},
	clearQueue: function a__241( type ) {trace@(a1202)
if(step$l>=1)alert('a__241(' + showarglist(arguments) + ')');
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function a__242( type, obj ) {trace@(a1203)
if(step$l>=1)alert('a__242(' + showarglist(arguments) + ')');
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function a__243() {trace@(a1204)
if(step$l>=1)alert('a__243(' + showarglist(arguments) + ')');
				if ( !( --count ) ) {trace@(a1205)
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {trace@(a1206)
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {trace@(a1207)
			tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {trace@(a1208)
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
} );
trace@(a1209)var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var documentElement = document.documentElement;



	var isAttached = function a__244( elem ) {trace@(a1210)
if(step$l>=1)alert('a__244(' + showarglist(arguments) + ')');
			return jQuery.contains( elem.ownerDocument, elem );
		},
		composed = { composed: true };

	// Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
	// Check attachment across shadow DOM boundaries when possible (gh-3504)
	// Support: iOS 10.0-10.2 only
	// Early iOS 10 versions support `attachShadow` but not `getRootNode`,
	// leading to errors. We need to check for `getRootNode`.
	if ( documentElement.getRootNode ) {trace@(a1211)
		isAttached = function a__245( elem ) {trace@(a1212)
if(step$l>=1)alert('a__245(' + showarglist(arguments) + ')');
			return jQuery.contains( elem.ownerDocument, elem ) ||
				elem.getRootNode( composed ) === elem.ownerDocument;
		};
	}
trace@(a1213)var isHiddenWithinTree = function a__246( elem, el ) {trace@(a1214)
if(step$l>=1)alert('a__246(' + showarglist(arguments) + ')');

		// isHiddenWithinTree might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;

		// Inline style trumps all
		return elem.style.display === "none" ||
			elem.style.display === "" &&

			// Otherwise, check computed style
			// Support: Firefox <=43 - 45
			// Disconnected elements can have computed display: none, so first confirm that elem is
			// in the document.
			isAttached( elem ) &&

			jQuery.css( elem, "display" ) === "none";
	};



function adjustCSS( elem, prop, valueParts, tween ) {trace@(a1215)
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function a__247() {trace@(a1216)
if(step$l>=1)alert('a__247(' + showarglist(arguments) + ')');
				return tween.cur();
			} :
			function a__248() {trace@(a1217)
if(step$l>=1)alert('a__248(' + showarglist(arguments) + ')');
				return jQuery.css( elem, prop, "" );
			},
		initial = currentValue(),
		unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

		// Starting value computation is required for potential unit mismatches
		initialInUnit = elem.nodeType &&
			( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
			rcssNum.exec( jQuery.css( elem, prop ) );

	if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {trace@(a1218)

		// Support: Firefox <=54
		// Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
		initial = initial / 2;

		// Trust units reported by jQuery.css
		unit = unit || initialInUnit[ 3 ];

		// Iteratively approximate from a nonzero starting point
		initialInUnit = +initial || 1;

		while ( maxIterations-- ) {trace@(a1219)

			// Evaluate and update our best guess (doubling guesses that zero out).
			// Finish if the scale equals or crosses 1 (making the old*new product non-positive).
			jQuery.style( elem, prop, initialInUnit + unit );
			if ( ( 1 - scale ) * ( 1 - ( scale = currentValue() / initial || 0.5 ) ) <= 0 ) {trace@(a1220)
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style( elem, prop, initialInUnit + unit );

		// Make sure we update the tween properties later on
		valueParts = valueParts || [];
	}

	if ( valueParts ) {trace@(a1221)
		initialInUnit = +initialInUnit || +initial || 0;

		// Apply relative offset (+=/-=) if specified
		adjusted = valueParts[ 1 ] ?
			initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
			+valueParts[ 2 ];
		if ( tween ) {trace@(a1222)
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}


var defaultDisplayMap = {};

function getDefaultDisplay( elem ) {trace@(a1223)
	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
		display = defaultDisplayMap[ nodeName ];

	if ( display ) {trace@(a1224)
		return display;
	}

	temp = doc.body.appendChild( doc.createElement( nodeName ) );
	display = jQuery.css( temp, "display" );

	temp.parentNode.removeChild( temp );

	if ( display === "none" ) {trace@(a1225)
		display = "block";
	}
	defaultDisplayMap[ nodeName ] = display;

	return display;
}

function showHide( elements, show ) {trace@(a1226)
	var display, elem,
		values = [],
		index = 0,
		length = elements.length;

	// Determine new display value for elements that need to change
	for ( ; index < length; index++ ) {trace@(a1227)
		elem = elements[ index ];
		if ( !elem.style ) {trace@(a1228)
			continue;
		}

		display = elem.style.display;
		if ( show ) {trace@(a1229)

			// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
			// check is required in this first loop unless we have a nonempty display value (either
			// inline or about-to-be-restored)
			if ( display === "none" ) {trace@(a1230)
				values[ index ] = dataPriv.get( elem, "display" ) || null;
				if ( !values[ index ] ) {trace@(a1231)
					elem.style.display = "";
				}
			}
			if ( elem.style.display === "" && isHiddenWithinTree( elem ) ) {trace@(a1232)
				values[ index ] = getDefaultDisplay( elem );
			}
		} else {trace@(a1233)
			if ( display !== "none" ) {trace@(a1234)
				values[ index ] = "none";

				// Remember what we're overwriting
				dataPriv.set( elem, "display", display );
			}
		}
	}

	// Set the display of the elements in a second loop to avoid constant reflow
	for ( index = 0; index < length; index++ ) {trace@(a1235)
		if ( values[ index ] != null ) {trace@(a1236)
			elements[ index ].style.display = values[ index ];
		}
	}

	return elements;
}

jQuery.fn.extend( {
	show: function a__249() {trace@(a1237)
if(step$l>=1)alert('a__249(' + showarglist(arguments) + ')');
		return showHide( this, true );
	},
	hide: function a__250() {trace@(a1238)
if(step$l>=1)alert('a__250(' + showarglist(arguments) + ')');
		return showHide( this );
	},
	toggle: function a__251( state ) {trace@(a1239)
if(step$l>=1)alert('a__251(' + showarglist(arguments) + ')');
		if ( typeof state === "boolean" ) {trace@(a1240)
			return state ? this.show() : this.hide();
		}

		return this.each( function a__252() {trace@(a1241)
if(step$l>=1)alert('a__252(' + showarglist(arguments) + ')');
			if ( isHiddenWithinTree( this ) ) {trace@(a1242)
				jQuery( this ).show();
			} else {trace@(a1243)
				jQuery( this ).hide();
			}
		} );
	}
} );
trace@(a1244)var rcheckableType = ( /^(?:checkbox|radio)$/i );

var rtagName = ( /<([a-z][^\/\0>\x20\t\r\n\f]*)/i );

var rscriptType = ( /^$|^module$|\/(?:java|ecma)script/i );



( function a__253() {trace@(a1245)
if(step$l>=1)alert('a__253(' + showarglist(arguments) + ')');
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Android 4.0 - 4.3 only
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Android <=4.1 only
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE <=11 only
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// Support: IE <=9 only
	// IE <=9 replaces <option> tags with their contents when inserted outside of
	// the select element.
	div.innerHTML = "<option></option>";
	support.option = !!div.lastChild;
} )();


// We have to close these tags to support XHTML (#13200)
var wrapMap = {

	// XHTML parsers do not magically insert elements in the
	// same way that tag soup parsers do. So we cannot shorten
	// this by omitting <tbody> or other required elements.
	thead: [ 1, "<table>", "</table>" ],
	col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
	tr: [ 2, "<table><tbody>", "</tbody></table>" ],
	td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

	_default: [ 0, "", "" ]
};

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: IE <=9 only
if ( !support.option ) {trace@(a1246)
	wrapMap.optgroup = wrapMap.option = [ 1, "<select multiple='multiple'>", "</select>" ];
}


function getAll( context, tag ) {trace@(a1247)

	// Support: IE <=9 - 11 only
	// Use typeof to avoid zero-argument method invocation on host objects (#15151)
	var ret;

	if ( typeof context.getElementsByTagName !== "undefined" ) {trace@(a1248)
		ret = context.getElementsByTagName( tag || "*" );

	} else if ( typeof context.querySelectorAll !== "undefined" ) {trace@(a1249)
		ret = context.querySelectorAll( tag || "*" );

	} else {trace@(a1250)
		ret = [];
	}

	if ( tag === undefined || tag && nodeName( context, tag ) ) {trace@(a1251)
		return jQuery.merge( [ context ], ret );
	}

	return ret;
}


// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {trace@(a1252)
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {trace@(a1253)
		dataPriv.set(
			elems[ i ],
			"globalEval",
			!refElements || dataPriv.get( refElements[ i ], "globalEval" )
		);
	}
}


var rhtml = /<|&#?\w+;/;

function buildFragment( elems, context, scripts, selection, ignored ) {trace@(a1254)
	var elem, tmp, tag, wrap, attached, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {trace@(a1255)
		elem = elems[ i ];

		if ( elem || elem === 0 ) {trace@(a1256)

			// Add nodes directly
			if ( toType( elem ) === "object" ) {trace@(a1257)

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// Convert non-html into a text node
			} else if ( !rhtml.test( elem ) ) {trace@(a1258)
				nodes.push( context.createTextNode( elem ) );

			// Convert html into DOM nodes
			} else {trace@(a1259)
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// Deserialize a standard representation
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || wrapMap._default;
				tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

				// Descend through wrappers to the right content
				j = wrap[ 0 ];
				while ( j-- ) {trace@(a1260)
					tmp = tmp.lastChild;
				}

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				jQuery.merge( nodes, tmp.childNodes );

				// Remember the top-level container
				tmp = fragment.firstChild;

				// Ensure the created nodes are orphaned (#12392)
				tmp.textContent = "";
			}
		}
	}

	// Remove wrapper from fragment
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {trace@(a1261)

		// Skip elements already in the context collection (trac-4087)
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {trace@(a1262)
			if ( ignored ) {trace@(a1263)
				ignored.push( elem );
			}
			continue;
		}

		attached = isAttached( elem );

		// Append to fragment
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// Preserve script evaluation history
		if ( attached ) {trace@(a1264)
			setGlobalEval( tmp );
		}

		// Capture executables
		if ( scripts ) {trace@(a1265)
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {trace@(a1266)
				if ( rscriptType.test( elem.type || "" ) ) {trace@(a1267)
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {trace@(a1268)
	return true;
}

function returnFalse() {trace@(a1269)
	return false;
}

// Support: IE <=9 - 11+
// focus() and blur() are asynchronous, except when they are no-op.
// So expect focus to be synchronous when the element is already active,
// and blur to be synchronous when the element is not already active.
// (focus and blur are always synchronous in other supported browsers,
// this just defines when we can count on it).
function expectSync( elem, type ) {trace@(a1270)
	return ( elem === safeActiveElement() ) === ( type === "focus" );
}

// Support: IE <=9 only
// Accessing document.activeElement can throw unexpectedly
// https://bugs.jquery.com/ticket/13393
function safeActiveElement() {trace@(a1271)
	try {trace@(a1272)
		return document.activeElement;
	} catch ( err ) { }
}

function on( elem, types, selector, data, fn, one ) {trace@(a1273)
	var origFn, type;

	// Types can be a map of types/handlers
	if ( typeof types === "object" ) {trace@(a1274)

		// ( types-Object, selector, data )
		if ( typeof selector !== "string" ) {trace@(a1275)

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for ( type in types ) {trace@(a1276)
			on( elem, type, selector, data, types[ type ], one );
		}
		return elem;
	}

	if ( data == null && fn == null ) {trace@(a1277)

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if ( fn == null ) {trace@(a1278)
		if ( typeof selector === "string" ) {trace@(a1279)

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {trace@(a1280)

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if ( fn === false ) {trace@(a1281)
		fn = returnFalse;
	} else if ( !fn ) {trace@(a1282)
		return elem;
	}

	if ( one === 1 ) {trace@(a1283)
		origFn = fn;
		fn = function a__254( event ) {trace@(a1284)
if(step$l>=1)alert('a__254(' + showarglist(arguments) + ')');

			// Can use an empty set, since event contains the info
			jQuery().off( event );
			return origFn.apply( this, arguments );
		};

		// Use same guid so caller can remove using origFn
		fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
	}
	return elem.each( function a__255() {trace@(a1285)
if(step$l>=1)alert('a__255(' + showarglist(arguments) + ')');
		jQuery.event.add( this, types, fn, data, selector );
	} );
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function a__256( elem, types, handler, data, selector ) {trace@(a1286)
if(step$l>=1)alert('a__256(' + showarglist(arguments) + ')');

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get( elem );

		// Only attach events to objects that accept data
		if ( !acceptData( elem ) ) {trace@(a1287)
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {trace@(a1288)
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Ensure that invalid selectors throw exceptions at attach time
		// Evaluate against documentElement in case elem is a non-element node (e.g., document)
		if ( selector ) {trace@(a1289)
			jQuery.find.matchesSelector( documentElement, selector );
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {trace@(a1290)
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !( events = elemData.events ) ) {trace@(a1291)
			events = elemData.events = Object.create( null );
		}
		if ( !( eventHandle = elemData.handle ) ) {trace@(a1292)
			eventHandle = elemData.handle = function a__257( e ) {trace@(a1293)
if(step$l>=1)alert('a__257(' + showarglist(arguments) + ')');

				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {trace@(a1294)
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {trace@(a1295)
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend( {
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join( "." )
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !( handlers = events[ type ] ) ) {trace@(a1296)
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup ||
					special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

					if ( elem.addEventListener ) {trace@(a1297)
						elem.addEventListener( type, eventHandle );
					}
				}
			}

			if ( special.add ) {trace@(a1298)
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {trace@(a1299)
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {trace@(a1300)
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {trace@(a1301)
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function a__258( elem, types, handler, selector, mappedTypes ) {trace@(a1302)
if(step$l>=1)alert('a__258(' + showarglist(arguments) + ')');

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

		if ( !elemData || !( events = elemData.events ) ) {trace@(a1303)
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {trace@(a1304)
			tmp = rtypenamespace.exec( types[ t ] ) || [];
			type = origType = tmp[ 1 ];
			namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {trace@(a1305)
				for ( type in events ) {trace@(a1306)
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[ 2 ] &&
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {trace@(a1307)
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {trace@(a1308)
						handlers.delegateCount--;
					}
					if ( special.remove ) {trace@(a1309)
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {trace@(a1310)
				if ( !special.teardown ||
					special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove data and the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {trace@(a1311)
			dataPriv.remove( elem, "handle events" );
		}
	},

	dispatch: function a__259( nativeEvent ) {trace@(a1312)
if(step$l>=1)alert('a__259(' + showarglist(arguments) + ')');

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array( arguments.length ),

			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( nativeEvent ),

			handlers = (
					dataPriv.get( this, "events" ) || Object.create( null )
				)[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[ 0 ] = event;

		for ( i = 1; i < arguments.length; i++ ) {trace@(a1313)
			args[ i ] = arguments[ i ];
		}

		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {trace@(a1314)
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {trace@(a1315)
			event.currentTarget = matched.elem;

			j = 0;
			while ( ( handleObj = matched.handlers[ j++ ] ) &&
				!event.isImmediatePropagationStopped() ) {

				// If the event is namespaced, then each handler is only invoked if it is
				// specially universal or its namespaces are a superset of the event's.
				if ( !event.rnamespace || handleObj.namespace === false ||
					event.rnamespace.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
						handleObj.handler ).apply( matched.elem, args );

					if ( ret !== undefined ) {trace@(a1316)
						if ( ( event.result = ret ) === false ) {trace@(a1317)
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {trace@(a1318)
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function a__260( event, handlers ) {trace@(a1319)
if(step$l>=1)alert('a__260(' + showarglist(arguments) + ')');
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if ( delegateCount &&

			// Support: IE <=9
			// Black-hole SVG <use> instance trees (trac-13180)
			cur.nodeType &&

			// Support: Firefox <=42
			// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// Support: IE 11 only
			// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
			!( event.type === "click" && event.button >= 1 ) ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {trace@(a1320)

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && !( event.type === "click" && cur.disabled === true ) ) {trace@(a1321)
					matchedHandlers = [];
					matchedSelectors = {};
					for ( i = 0; i < delegateCount; i++ ) {trace@(a1322)
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matchedSelectors[ sel ] === undefined ) {trace@(a1323)
							matchedSelectors[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) > -1 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matchedSelectors[ sel ] ) {trace@(a1324)
							matchedHandlers.push( handleObj );
						}
					}
					if ( matchedHandlers.length ) {trace@(a1325)
						handlerQueue.push( { elem: cur, handlers: matchedHandlers } );
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		cur = this;
		if ( delegateCount < handlers.length ) {trace@(a1326)
			handlerQueue.push( { elem: cur, handlers: handlers.slice( delegateCount ) } );
		}

		return handlerQueue;
	},

	addProp: function a__261( name, hook ) {trace@(a1327)
if(step$l>=1)alert('a__261(' + showarglist(arguments) + ')');
		Object.defineProperty( jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: isFunction( hook ) ?
				function a__262() {trace@(a1328)
if(step$l>=1)alert('a__262(' + showarglist(arguments) + ')');
					if ( this.originalEvent ) {trace@(a1329)
							return hook( this.originalEvent );
					}
				} :
				function a__263() {trace@(a1330)
if(step$l>=1)alert('a__263(' + showarglist(arguments) + ')');
					if ( this.originalEvent ) {trace@(a1331)
							return this.originalEvent[ name ];
					}
				},

			set: function a__264( value ) {trace@(a1332)
if(step$l>=1)alert('a__264(' + showarglist(arguments) + ')');
				Object.defineProperty( this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				} );
			}
		} );
	},

	fix: function a__265( originalEvent ) {trace@(a1333)
if(step$l>=1)alert('a__265(' + showarglist(arguments) + ')');
		return originalEvent[ jQuery.expando ] ?
			originalEvent :
			new jQuery.Event( originalEvent );
	},

	special: {
		load: {

			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		click: {

			// Utilize native event to ensure correct state for checkable inputs
			setup: function a__266( data ) {trace@(a1334)
if(step$l>=1)alert('a__266(' + showarglist(arguments) + ')');

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Claim the first handler
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					// dataPriv.set( el, "click", ... )
					leverageNative( el, "click", returnTrue );
				}

				// Return false to allow normal processing in the caller
				return false;
			},
			trigger: function a__267( data ) {trace@(a1335)
if(step$l>=1)alert('a__267(' + showarglist(arguments) + ')');

				// For mutual compressibility with _default, replace `this` access with a local var.
				// `|| data` is dead code meant only to preserve the variable through minification.
				var el = this || data;

				// Force setup before triggering a click
				if ( rcheckableType.test( el.type ) &&
					el.click && nodeName( el, "input" ) ) {

					leverageNative( el, "click" );
				}

				// Return non-false to allow normal event-path propagation
				return true;
			},

			// For cross-browser consistency, suppress native .click() on links
			// Also prevent it if we're currently inside a leveraged native-event stack
			_default: function a__268( event ) {trace@(a1336)
if(step$l>=1)alert('a__268(' + showarglist(arguments) + ')');
				var target = event.target;
				return rcheckableType.test( target.type ) &&
					target.click && nodeName( target, "input" ) &&
					dataPriv.get( target, "click" ) ||
					nodeName( target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function a__269( event ) {trace@(a1337)
if(step$l>=1)alert('a__269(' + showarglist(arguments) + ')');

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {trace@(a1338)
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	}
};

// Ensure the presence of an event listener that handles manually-triggered
// synthetic events by interrupting progress until reinvoked in response to
// *native* events that it fires directly, ensuring that state changes have
// already occurred before other listeners are invoked.
function leverageNative( el, type, expectSync ) {trace@(a1339)

	// Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
	if ( !expectSync ) {trace@(a1340)
		if ( dataPriv.get( el, type ) === undefined ) {trace@(a1341)
			jQuery.event.add( el, type, returnTrue );
		}
		return;
	}

	// Register the controller as a special universal handler for all event namespaces
	dataPriv.set( el, type, false );
	jQuery.event.add( el, type, {
		namespace: false,
		handler: function a__270( event ) {trace@(a1342)
if(step$l>=1)alert('a__270(' + showarglist(arguments) + ')');
			var notAsync, result,
				saved = dataPriv.get( this, type );

			if ( ( event.isTrigger & 1 ) && this[ type ] ) {trace@(a1343)

				// Interrupt processing of the outer synthetic .trigger()ed event
				// Saved data should be false in such cases, but might be a leftover capture object
				// from an async native handler (gh-4350)
				if ( !saved.length ) {trace@(a1344)

					// Store arguments for use when handling the inner native event
					// There will always be at least one argument (an event object), so this array
					// will not be confused with a leftover capture object.
					saved = slice.call( arguments );
					dataPriv.set( this, type, saved );

					// Trigger the native event and capture its result
					// Support: IE <=9 - 11+
					// focus() and blur() are asynchronous
					notAsync = expectSync( this, type );
					this[ type ]();
					result = dataPriv.get( this, type );
					if ( saved !== result || notAsync ) {trace@(a1345)
						dataPriv.set( this, type, false );
					} else {trace@(a1346)
						result = {};
					}
					if ( saved !== result ) {trace@(a1347)

						// Cancel the outer synthetic event
						event.stopImmediatePropagation();
						event.preventDefault();
						return result.value;
					}

				// If this is an inner synthetic event for an event with a bubbling surrogate
				// (focus or blur), assume that the surrogate already propagated from triggering the
				// native event and prevent that from happening again here.
				// This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
				// bubbling surrogate propagates *after* the non-bubbling base), but that seems
				// less bad than duplication.
				} else if ( ( jQuery.event.special[ type ] || {} ).delegateType ) {
					event.stopPropagation();
				}

			// If this is a native event triggered above, everything is now in order
			// Fire an inner synthetic event with the original arguments
			} else if ( saved.length ) {trace@(a1348)

				// ...and capture the result
				dataPriv.set( this, type, {
					value: jQuery.event.trigger(

						// Support: IE <=9 - 11+
						// Extend with the prototype to reset the above stopImmediatePropagation()
						jQuery.extend( saved[ 0 ], jQuery.Event.prototype ),
						saved.slice( 1 ),
						this
					)
				} );

				// Abort handling of the native event
				event.stopImmediatePropagation();
			}
		}
	} );
}

jQuery.removeEvent = function a__271( elem, type, handle ) {trace@(a1349)
if(step$l>=1)alert('a__271(' + showarglist(arguments) + ')');

	// This "if" is needed for plain objects
	if ( elem.removeEventListener ) {trace@(a1350)
		elem.removeEventListener( type, handle );
	}
};

jQuery.Event = function a__272( src, props ) {trace@(a1351)
if(step$l>=1)alert('a__272(' + showarglist(arguments) + ')');

	// Allow instantiation without the 'new' keyword
	if ( !( this instanceof jQuery.Event ) ) {trace@(a1352)
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {trace@(a1353)
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&

				// Support: Android <=2.3 only
				src.returnValue === false ?
			returnTrue :
			returnFalse;

		// Create target properties
		// Support: Safari <=6 - 7 only
		// Target should not be a text node (#504, #13143)
		this.target = ( src.target && src.target.nodeType === 3 ) ?
			src.target.parentNode :
			src.target;

		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

	// Event type
	} else {trace@(a1354)
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {trace@(a1355)
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function a__273() {trace@(a1356)
if(step$l>=1)alert('a__273(' + showarglist(arguments) + ')');
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && !this.isSimulated ) {trace@(a1357)
			e.preventDefault();
		}
	},
	stopPropagation: function a__274() {trace@(a1358)
if(step$l>=1)alert('a__274(' + showarglist(arguments) + ')');
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {trace@(a1359)
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function a__275() {trace@(a1360)
if(step$l>=1)alert('a__275(' + showarglist(arguments) + ')');
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && !this.isSimulated ) {trace@(a1361)
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Includes all common event props including KeyEvent and MouseEvent specific props
jQuery.each( {
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	code: true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,

	which: function a__276( event ) {trace@(a1362)
if(step$l>=1)alert('a__276(' + showarglist(arguments) + ')');
		var button = event.button;

		// Add which for key events
		if ( event.which == null && rkeyEvent.test( event.type ) ) {trace@(a1363)
			return event.charCode != null ? event.charCode : event.keyCode;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		if ( !event.which && button !== undefined && rmouseEvent.test( event.type ) ) {trace@(a1364)
			if ( button & 1 ) {trace@(a1365)
				return 1;
			}

			if ( button & 2 ) {trace@(a1366)
				return 3;
			}

			if ( button & 4 ) {trace@(a1367)
				return 2;
			}

			return 0;
		}

		return event.which;
	}
}, jQuery.event.addProp );

jQuery.each( { focus: "focusin", blur: "focusout" }, function a__277( type, delegateType ) {trace@(a1368)
if(step$l>=1)alert('a__277(' + showarglist(arguments) + ')');
	jQuery.event.special[ type ] = {

		// Utilize native event if possible so blur/focus sequence is correct
		setup: function a__278() {trace@(a1369)
if(step$l>=1)alert('a__278(' + showarglist(arguments) + ')');

			// Claim the first handler
			// dataPriv.set( this, "focus", ... )
			// dataPriv.set( this, "blur", ... )
			leverageNative( this, type, expectSync );

			// Return false to allow normal processing in the caller
			return false;
		},
		trigger: function a__279() {trace@(a1370)
if(step$l>=1)alert('a__279(' + showarglist(arguments) + ')');

			// Force setup before trigger
			leverageNative( this, type );

			// Return non-false to allow normal event-path propagation
			return true;
		},

		delegateType: delegateType
	};
} );

// Create mouseenter/leave events using mouseover/out and event-time checks
// so that event delegation works in jQuery.
// Do the same for pointerenter/pointerleave and pointerover/pointerout
//
// Support: Safari 7 only
// Safari sends mouseenter too often; see:
// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
// for the description of the bug (it existed in older Chrome versions as well).
jQuery.each( {
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function a__280( orig, fix ) {trace@(a1371)
if(step$l>=1)alert('a__280(' + showarglist(arguments) + ')');
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function a__281( event ) {trace@(a1372)
if(step$l>=1)alert('a__281(' + showarglist(arguments) + ')');
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mouseenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {trace@(a1373)
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
} );

jQuery.fn.extend( {

	on: function a__282( types, selector, data, fn ) {trace@(a1374)
if(step$l>=1)alert('a__282(' + showarglist(arguments) + ')');
		return on( this, types, selector, data, fn );
	},
	one: function a__283( types, selector, data, fn ) {trace@(a1375)
if(step$l>=1)alert('a__283(' + showarglist(arguments) + ')');
		return on( this, types, selector, data, fn, 1 );
	},
	off: function a__284( types, selector, fn ) {trace@(a1376)
if(step$l>=1)alert('a__284(' + showarglist(arguments) + ')');
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {trace@(a1377)

			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {trace@(a1378)

			// ( types-object [, selector] )
			for ( type in types ) {trace@(a1379)
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {trace@(a1380)

			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {trace@(a1381)
			fn = returnFalse;
		}
		return this.each( function a__285() {trace@(a1382)
if(step$l>=1)alert('a__285(' + showarglist(arguments) + ')');
			jQuery.event.remove( this, types, fn, selector );
		} );
	}
} );


var

	// Support: IE <=10 - 11, Edge 12 - 13 only
	// In IE/Edge using regex groups here causes severe slowdowns.
	// See https://connect.microsoft.com/IE/feedback/details/1736512/
	rnoInnerhtml = /<script|<style|<link/i,

	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

// Prefer a tbody over its parent table for containing new rows
function manipulationTarget( elem, content ) {trace@(a1383)
	if ( nodeName( elem, "table" ) &&
		nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

		return jQuery( elem ).children( "tbody" )[ 0 ] || elem;
	}

	return elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {trace@(a1384)
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {trace@(a1385)
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {trace@(a1386)
		elem.type = elem.type.slice( 5 );
	} else {trace@(a1387)
		elem.removeAttribute( "type" );
	}

	return elem;
}

function cloneCopyEvent( src, dest ) {trace@(a1388)
	var i, l, type, pdataOld, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {trace@(a1389)
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( dataPriv.hasData( src ) ) {trace@(a1390)
		pdataOld = dataPriv.get( src );
		events = pdataOld.events;

		if ( events ) {trace@(a1391)
			dataPriv.remove( dest, "handle events" );

			for ( type in events ) {trace@(a1392)
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {trace@(a1393)
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( dataUser.hasData( src ) ) {trace@(a1394)
		udataOld = dataUser.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		dataUser.set( dest, udataCur );
	}
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {trace@(a1395)
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {trace@(a1396)
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {trace@(a1397)
		dest.defaultValue = src.defaultValue;
	}
}

function domManip( collection, args, callback, ignored ) {trace@(a1398)

	// Flatten any nested arrays
	args = flat( args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = isFunction( value );

	// We can't cloneNode fragments that contain checked, in WebKit
	if ( valueIsFunction ||
			( l > 1 && typeof value === "string" &&
				!support.checkClone && rchecked.test( value ) ) ) {
		return collection.each( function a__286( index ) {trace@(a1399)
if(step$l>=1)alert('a__286(' + showarglist(arguments) + ')');
			var self = collection.eq( index );
			if ( valueIsFunction ) {trace@(a1400)
				args[ 0 ] = value.call( this, index, self.html() );
			}
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {trace@(a1401)
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {trace@(a1402)
			fragment = first;
		}

		// Require either new content or an interest in ignored elements to invoke the callback
		if ( first || ignored ) {trace@(a1403)
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// Use the original fragment for the last item
			// instead of the first because it can end up
			// being emptied incorrectly in certain situations (#8070).
			for ( ; i < l; i++ ) {trace@(a1404)
				node = fragment;

				if ( i !== iNoClone ) {trace@(a1405)
					node = jQuery.clone( node, true, true );

					// Keep references to cloned scripts for later restoration
					if ( hasScripts ) {trace@(a1406)

						// Support: Android <=4.0 only, PhantomJS 1 only
						// push.apply(_, arraylike) throws on ancient WebKit
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {trace@(a1407)
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Reenable scripts
				jQuery.map( scripts, restoreScript );

				// Evaluate executable scripts on first document insertion
				for ( i = 0; i < hasScripts; i++ ) {trace@(a1408)
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.access( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {trace@(a1409)

							// Optional AJAX dependency, but won't run scripts if not present
							if ( jQuery._evalUrl && !node.noModule ) {trace@(a1410)
								jQuery._evalUrl( node.src, {
									nonce: node.nonce || node.getAttribute( "nonce" )
								}, doc );
							}
						} else {trace@(a1411)
							DOMEval( node.textContent.replace( rcleanScript, "" ), node, doc );
						}
					}
				}
			}
		}
	}

	return collection;
}

function remove( elem, selector, keepData ) {trace@(a1412)
	var node,
		nodes = selector ? jQuery.filter( selector, elem ) : elem,
		i = 0;

	for ( ; ( node = nodes[ i ] ) != null; i++ ) {trace@(a1413)
		if ( !keepData && node.nodeType === 1 ) {trace@(a1414)
			jQuery.cleanData( getAll( node ) );
		}

		if ( node.parentNode ) {trace@(a1415)
			if ( keepData && isAttached( node ) ) {trace@(a1416)
				setGlobalEval( getAll( node, "script" ) );
			}
			node.parentNode.removeChild( node );
		}
	}

	return elem;
}

jQuery.extend( {
	htmlPrefilter: function a__287( html ) {trace@(a1417)
if(step$l>=1)alert('a__287(' + showarglist(arguments) + ')');
		return html;
	},

	clone: function a__288( elem, dataAndEvents, deepDataAndEvents ) {trace@(a1418)
if(step$l>=1)alert('a__288(' + showarglist(arguments) + ')');
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = isAttached( elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {trace@(a1419)
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {trace@(a1420)
			if ( deepDataAndEvents ) {trace@(a1421)
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {trace@(a1422)
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {trace@(a1423)
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {trace@(a1424)
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	cleanData: function a__289( elems ) {trace@(a1425)
if(step$l>=1)alert('a__289(' + showarglist(arguments) + ')');
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {trace@(a1426)
			if ( acceptData( elem ) ) {trace@(a1427)
				if ( ( data = elem[ dataPriv.expando ] ) ) {trace@(a1428)
					if ( data.events ) {trace@(a1429)
						for ( type in data.events ) {trace@(a1430)
							if ( special[ type ] ) {trace@(a1431)
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {trace@(a1432)
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataPriv.expando ] = undefined;
				}
				if ( elem[ dataUser.expando ] ) {trace@(a1433)

					// Support: Chrome <=35 - 45+
					// Assign undefined instead of using delete, see Data#remove
					elem[ dataUser.expando ] = undefined;
				}
			}
		}
	}
} );

jQuery.fn.extend( {
	detach: function a__290( selector ) {trace@(a1434)
if(step$l>=1)alert('a__290(' + showarglist(arguments) + ')');
		return remove( this, selector, true );
	},

	remove: function a__291( selector ) {trace@(a1435)
if(step$l>=1)alert('a__291(' + showarglist(arguments) + ')');
		return remove( this, selector );
	},

	text: function a__292( value ) {trace@(a1436)
if(step$l>=1)alert('a__292(' + showarglist(arguments) + ')');
		return access( this, function a__293( value ) {trace@(a1437)
if(step$l>=1)alert('a__293(' + showarglist(arguments) + ')');
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each( function a__294() {trace@(a1438)
if(step$l>=1)alert('a__294(' + showarglist(arguments) + ')');
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {trace@(a1439)
						this.textContent = value;
					}
				} );
		}, null, value, arguments.length );
	},

	append: function a__295() {trace@(a1440)
if(step$l>=1)alert('a__295(' + showarglist(arguments) + ')');
		return domManip( this, arguments, function a__296( elem ) {trace@(a1441)
if(step$l>=1)alert('a__296(' + showarglist(arguments) + ')');
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {trace@(a1442)
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		} );
	},

	prepend: function a__297() {trace@(a1443)
if(step$l>=1)alert('a__297(' + showarglist(arguments) + ')');
		return domManip( this, arguments, function a__298( elem ) {trace@(a1444)
if(step$l>=1)alert('a__298(' + showarglist(arguments) + ')');
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {trace@(a1445)
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		} );
	},

	before: function a__299() {trace@(a1446)
if(step$l>=1)alert('a__299(' + showarglist(arguments) + ')');
		return domManip( this, arguments, function a__300( elem ) {trace@(a1447)
if(step$l>=1)alert('a__300(' + showarglist(arguments) + ')');
			if ( this.parentNode ) {trace@(a1448)
				this.parentNode.insertBefore( elem, this );
			}
		} );
	},

	after: function a__301() {trace@(a1449)
if(step$l>=1)alert('a__301(' + showarglist(arguments) + ')');
		return domManip( this, arguments, function a__302( elem ) {trace@(a1450)
if(step$l>=1)alert('a__302(' + showarglist(arguments) + ')');
			if ( this.parentNode ) {trace@(a1451)
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		} );
	},

	empty: function a__303() {trace@(a1452)
if(step$l>=1)alert('a__303(' + showarglist(arguments) + ')');
		var elem,
			i = 0;

		for ( ; ( elem = this[ i ] ) != null; i++ ) {trace@(a1453)
			if ( elem.nodeType === 1 ) {trace@(a1454)

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function a__304( dataAndEvents, deepDataAndEvents ) {trace@(a1455)
if(step$l>=1)alert('a__304(' + showarglist(arguments) + ')');
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function a__305() {trace@(a1456)
if(step$l>=1)alert('a__305(' + showarglist(arguments) + ')');
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		} );
	},

	html: function a__306( value ) {trace@(a1457)
if(step$l>=1)alert('a__306(' + showarglist(arguments) + ')');
		return access( this, function a__307( value ) {trace@(a1458)
if(step$l>=1)alert('a__307(' + showarglist(arguments) + ')');
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {trace@(a1459)
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = jQuery.htmlPrefilter( value );

				try {trace@(a1460)
					for ( ; i < l; i++ ) {trace@(a1461)
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {trace@(a1462)
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch ( e ) {}
			}

			if ( elem ) {trace@(a1463)
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function a__308() {trace@(a1464)
if(step$l>=1)alert('a__308(' + showarglist(arguments) + ')');
		var ignored = [];

		// Make the changes, replacing each non-ignored context element with the new content
		return domManip( this, arguments, function a__309( elem ) {trace@(a1465)
if(step$l>=1)alert('a__309(' + showarglist(arguments) + ')');
			var parent = this.parentNode;

			if ( jQuery.inArray( this, ignored ) < 0 ) {trace@(a1466)
				jQuery.cleanData( getAll( this ) );
				if ( parent ) {trace@(a1467)
					parent.replaceChild( elem, this );
				}
			}

		// Force callback invocation
		}, ignored );
	}
} );

jQuery.each( {
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function a__310( name, original ) {trace@(a1468)
if(step$l>=1)alert('a__310(' + showarglist(arguments) + ')');
	jQuery.fn[ name ] = function a__311( selector ) {trace@(a1469)
if(step$l>=1)alert('a__311(' + showarglist(arguments) + ')');
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {trace@(a1470)
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: Android <=4.0 only, PhantomJS 1 only
			// .get() because push.apply(_, arraylike) throws on ancient WebKit
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
} );
trace@(a1471)var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function a__312( elem ) {trace@(a1472)
if(step$l>=1)alert('a__312(' + showarglist(arguments) + ')');

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {trace@(a1473)
			view = window;
		}

		return view.getComputedStyle( elem );
	};

var swap = function a__313( elem, options, callback ) {trace@(a1474)
if(step$l>=1)alert('a__313(' + showarglist(arguments) + ')');
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {trace@(a1475)
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.call( elem );

	// Revert the old values
	for ( name in options ) {trace@(a1476)
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var rboxStyle = new RegExp( cssExpand.join( "|" ), "i" );



( function a__314() {trace@(a1477)
if(step$l>=1)alert('a__314(' + showarglist(arguments) + ')');

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computeStyleTests() {trace@(a1478)

		// This is a singleton, we need to execute it only once
		if ( !div ) {trace@(a1479)
			return;
		}

		container.style.cssText = "position:absolute;left:-11111px;width:60px;" +
			"margin-top:1px;padding:0;border:0";
		div.style.cssText =
			"position:relative;display:block;box-sizing:border-box;overflow:scroll;" +
			"margin:auto;border:1px;padding:1px;" +
			"width:60%;top:1%";
		documentElement.appendChild( container ).appendChild( div );

		var divStyle = window.getComputedStyle( div );
		pixelPositionVal = divStyle.top !== "1%";

		// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
		reliableMarginLeftVal = roundPixelMeasures( divStyle.marginLeft ) === 12;

		// Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
		// Some styles come back with percentage values, even though they shouldn't
		div.style.right = "60%";
		pixelBoxStylesVal = roundPixelMeasures( divStyle.right ) === 36;

		// Support: IE 9 - 11 only
		// Detect misreporting of content dimensions for box-sizing:border-box elements
		boxSizingReliableVal = roundPixelMeasures( divStyle.width ) === 36;

		// Support: IE 9 only
		// Detect overflow:scroll screwiness (gh-3699)
		// Support: Chrome <=64
		// Don't get tricked when zoom affects offsetWidth (gh-4029)
		div.style.position = "absolute";
		scrollboxSizeVal = roundPixelMeasures( div.offsetWidth / 3 ) === 12;

		documentElement.removeChild( container );

		// Nullify the div so it wouldn't be stored in the memory and
		// it will also be a sign that checks already performed
		div = null;
	}

	function roundPixelMeasures( measure ) {trace@(a1480)
		return Math.round( parseFloat( measure ) );
	}

	var pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal,
		reliableTrDimensionsVal, reliableMarginLeftVal,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	// Finish early in limited (non-browser) environments
	if ( !div.style ) {trace@(a1481)
		return;
	}

	// Support: IE <=9 - 11 only
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	jQuery.extend( support, {
		boxSizingReliable: function a__315() {trace@(a1482)
if(step$l>=1)alert('a__315(' + showarglist(arguments) + ')');
			computeStyleTests();
			return boxSizingReliableVal;
		},
		pixelBoxStyles: function a__316() {trace@(a1483)
if(step$l>=1)alert('a__316(' + showarglist(arguments) + ')');
			computeStyleTests();
			return pixelBoxStylesVal;
		},
		pixelPosition: function a__317() {trace@(a1484)
if(step$l>=1)alert('a__317(' + showarglist(arguments) + ')');
			computeStyleTests();
			return pixelPositionVal;
		},
		reliableMarginLeft: function a__318() {trace@(a1485)
if(step$l>=1)alert('a__318(' + showarglist(arguments) + ')');
			computeStyleTests();
			return reliableMarginLeftVal;
		},
		scrollboxSize: function a__319() {trace@(a1486)
if(step$l>=1)alert('a__319(' + showarglist(arguments) + ')');
			computeStyleTests();
			return scrollboxSizeVal;
		},

		// Support: IE 9 - 11+, Edge 15 - 18+
		// IE/Edge misreport `getComputedStyle` of table rows with width/height
		// set in CSS while `offset*` properties report correct values.
		// Behavior in IE 9 is more subtle than in newer versions & it passes
		// some versions of this test; make sure not to make it pass there!
		reliableTrDimensions: function a__320() {trace@(a1487)
if(step$l>=1)alert('a__320(' + showarglist(arguments) + ')');
			var table, tr, trChild, trStyle;
			if ( reliableTrDimensionsVal == null ) {trace@(a1488)
				table = document.createElement( "table" );
				tr = document.createElement( "tr" );
				trChild = document.createElement( "div" );

				table.style.cssText = "position:absolute;left:-11111px";
				tr.style.height = "1px";
				trChild.style.height = "9px";

				documentElement
					.appendChild( table )
					.appendChild( tr )
					.appendChild( trChild );

				trStyle = window.getComputedStyle( tr );
				reliableTrDimensionsVal = parseInt( trStyle.height ) > 3;

				documentElement.removeChild( table );
			}
			return reliableTrDimensionsVal;
		}
	} );
} )();


function curCSS( elem, name, computed ) {trace@(a1489)
	var width, minWidth, maxWidth, ret,

		// Support: Firefox 51+
		// Retrieving style before computed somehow
		// fixes an issue with getting wrong values
		// on detached elements
		style = elem.style;

	computed = computed || getStyles( elem );

	// getPropertyValue is needed for:
	//   .css('filter') (IE 9 only, #12537)
	//   .css('--customProperty) (#3144)
	if ( computed ) {trace@(a1490)
		ret = computed.getPropertyValue( name ) || computed[ name ];

		if ( ret === "" && !isAttached( elem ) ) {trace@(a1491)
			ret = jQuery.style( elem, name );
		}

		// A tribute to the "awesome hack by Dean Edwards"
		// Android Browser returns percentage for some values,
		// but width seems to be reliably pixels.
		// This is against the CSSOM draft spec:
		// https://drafts.csswg.org/cssom/#resolved-values
		if ( !support.pixelBoxStyles() && rnumnonpx.test( ret ) && rboxStyle.test( name ) ) {trace@(a1492)

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?

		// Support: IE <=9 - 11 only
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {trace@(a1493)

	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function a__321() {trace@(a1494)
if(step$l>=1)alert('a__321(' + showarglist(arguments) + ')');
			if ( conditionFn() ) {trace@(a1495)

				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return ( this.get = hookFn ).apply( this, arguments );
		}
	};
}


var cssPrefixes = [ "Webkit", "Moz", "ms" ],
	emptyStyle = document.createElement( "div" ).style,
	vendorProps = {};

// Return a vendor-prefixed property or undefined
function vendorPropName( name ) {trace@(a1496)

	// Check for vendor prefixed names
	var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
		i = cssPrefixes.length;

	while ( i-- ) {trace@(a1497)
		name = cssPrefixes[ i ] + capName;
		if ( name in emptyStyle ) {trace@(a1498)
			return name;
		}
	}
}

// Return a potentially-mapped jQuery.cssProps or vendor prefixed property
function finalPropName( name ) {trace@(a1499)
	var final = jQuery.cssProps[ name ] || vendorProps[ name ];

	if ( final ) {trace@(a1500)
		return final;
	}
	if ( name in emptyStyle ) {trace@(a1501)
		return name;
	}
	return vendorProps[ name ] = vendorPropName( name ) || name;
}


var

	// Swappable if display is none or starts with table
	// except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rcustomProp = /^--/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	};

function setPositiveNumber( _elem, value, subtract ) {trace@(a1502)

	// Any relative (+/-) values have already been
	// normalized at this point
	var matches = rcssNum.exec( value );
	return matches ?

		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
		value;
}

function boxModelAdjustment( elem, dimension, box, isBorderBox, styles, computedVal ) {trace@(a1503)
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0;

	// Adjustment may not be necessary
	if ( box === ( isBorderBox ? "border" : "content" ) ) {trace@(a1504)
		return 0;
	}

	for ( ; i < 4; i += 2 ) {trace@(a1505)

		// Both box models exclude margin
		if ( box === "margin" ) {trace@(a1506)
			delta += jQuery.css( elem, box + cssExpand[ i ], true, styles );
		}

		// If we get here with a content-box, we're seeking "padding" or "border" or "margin"
		if ( !isBorderBox ) {trace@(a1507)

			// Add padding
			delta += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// For "border" or "margin", add border
			if ( box !== "padding" ) {trace@(a1508)
				delta += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );

			// But still keep track of it otherwise
			} else {trace@(a1509)
				extra += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}

		// If we get here with a border-box (content + padding + border), we're seeking "content" or
		// "padding" or "margin"
		} else {trace@(a1510)

			// For "content", subtract padding
			if ( box === "content" ) {trace@(a1511)
				delta -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// For "content" or "padding", subtract border
			if ( box !== "margin" ) {trace@(a1512)
				delta -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	// Account for positive content-box scroll gutter when requested by providing computedVal
	if ( !isBorderBox && computedVal >= 0 ) {trace@(a1513)

		// offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
		// Assuming integer scroll gutter, subtract the rest and round down
		delta += Math.max( 0, Math.ceil(
			elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
			computedVal -
			delta -
			extra -
			0.5

		// If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
		// Use an explicit zero to avoid NaN (gh-3964)
		) ) || 0;
	}

	return delta;
}

function getWidthOrHeight( elem, dimension, extra ) {trace@(a1514)

	// Start with computed style
	var styles = getStyles( elem ),

		// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
		// Fake content-box until we know it's needed to know the true value.
		boxSizingNeeded = !support.boxSizingReliable() || extra,
		isBorderBox = boxSizingNeeded &&
			jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
		valueIsBorderBox = isBorderBox,

		val = curCSS( elem, dimension, styles ),
		offsetProp = "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 );

	// Support: Firefox <=54
	// Return a confounding non-pixel value or feign ignorance, as appropriate.
	if ( rnumnonpx.test( val ) ) {trace@(a1515)
		if ( !extra ) {trace@(a1516)
			return val;
		}
		val = "auto";
	}


	// Support: IE 9 - 11 only
	// Use offsetWidth/offsetHeight for when box sizing is unreliable.
	// In those cases, the computed value can be trusted to be border-box.
	if ( ( !support.boxSizingReliable() && isBorderBox ||

		// Support: IE 10 - 11+, Edge 15 - 18+
		// IE/Edge misreport `getComputedStyle` of table rows with width/height
		// set in CSS while `offset*` properties report correct values.
		// Interestingly, in some cases IE 9 doesn't suffer from this issue.
		!support.reliableTrDimensions() && nodeName( elem, "tr" ) ||

		// Fall back to offsetWidth/offsetHeight when value is "auto"
		// This happens for inline elements with no explicit setting (gh-3571)
		val === "auto" ||

		// Support: Android <=4.1 - 4.3 only
		// Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
		!parseFloat( val ) && jQuery.css( elem, "display", false, styles ) === "inline" ) &&

		// Make sure the element is visible & connected
		elem.getClientRects().length ) {

		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

		// Where available, offsetWidth/offsetHeight approximate border box dimensions.
		// Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
		// retrieved value as a content box dimension.
		valueIsBorderBox = offsetProp in elem;
		if ( valueIsBorderBox ) {trace@(a1517)
			val = elem[ offsetProp ];
		}
	}

	// Normalize "" and auto
	val = parseFloat( val ) || 0;

	// Adjust for the element's box model
	return ( val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles,

			// Provide the current computed size to request scroll gutter calculation (gh-3589)
			val
		)
	) + "px";
}

jQuery.extend( {

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function a__322( elem, computed ) {trace@(a1518)
if(step$l>=1)alert('a__322(' + showarglist(arguments) + ')');
				if ( computed ) {trace@(a1519)

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"animationIterationCount": true,
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"gridArea": true,
		"gridColumn": true,
		"gridColumnEnd": true,
		"gridColumnStart": true,
		"gridRow": true,
		"gridRowEnd": true,
		"gridRowStart": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {},

	// Get and set the style property on a DOM Node
	style: function a__323( elem, name, value, extra ) {trace@(a1520)
if(step$l>=1)alert('a__323(' + showarglist(arguments) + ')');

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {trace@(a1521)
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name ),
			style = elem.style;

		// Make sure that we're working with the right name. We don't
		// want to query the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {trace@(a1522)
			name = finalPropName( origName );
		}

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {trace@(a1523)
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {trace@(a1524)
				value = adjustCSS( elem, name, ret );

				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {trace@(a1525)
				return;
			}

			// If a number was passed in, add the unit (except for certain CSS properties)
			// The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
			// "px" to a few hardcoded values.
			if ( type === "number" && !isCustomProp ) {trace@(a1526)
				value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
			}

			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {trace@(a1527)
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !( "set" in hooks ) ||
				( value = hooks.set( elem, value, extra ) ) !== undefined ) {

				if ( isCustomProp ) {trace@(a1528)
					style.setProperty( name, value );
				} else {trace@(a1529)
					style[ name ] = value;
				}
			}

		} else {trace@(a1530)

			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks &&
				( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function a__324( elem, name, extra, styles ) {trace@(a1531)
if(step$l>=1)alert('a__324(' + showarglist(arguments) + ')');
		var val, num, hooks,
			origName = camelCase( name ),
			isCustomProp = rcustomProp.test( name );

		// Make sure that we're working with the right name. We don't
		// want to modify the value if it is a CSS custom property
		// since they are user-defined.
		if ( !isCustomProp ) {trace@(a1532)
			name = finalPropName( origName );
		}

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {trace@(a1533)
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {trace@(a1534)
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {trace@(a1535)
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {trace@(a1536)
			num = parseFloat( val );
			return extra === true || isFinite( num ) ? num || 0 : val;
		}

		return val;
	}
} );

jQuery.each( [ "height", "width" ], function a__325( _i, dimension ) {trace@(a1537)
if(step$l>=1)alert('a__325(' + showarglist(arguments) + ')');
	jQuery.cssHooks[ dimension ] = {
		get: function a__326( elem, computed, extra ) {trace@(a1538)
if(step$l>=1)alert('a__326(' + showarglist(arguments) + ')');
			if ( computed ) {trace@(a1539)

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&

					// Support: Safari 8+
					// Table columns in Safari have non-zero offsetWidth & zero
					// getBoundingClientRect().width unless display is changed.
					// Support: IE <=11 only
					// Running getBoundingClientRect on a disconnected node
					// in IE throws an error.
					( !elem.getClientRects().length || !elem.getBoundingClientRect().width ) ?
						swap( elem, cssShow, function a__327() {trace@(a1540)
if(step$l>=1)alert('a__327(' + showarglist(arguments) + ')');
							return getWidthOrHeight( elem, dimension, extra );
						} ) :
						getWidthOrHeight( elem, dimension, extra );
			}
		},

		set: function a__328( elem, value, extra ) {trace@(a1541)
if(step$l>=1)alert('a__328(' + showarglist(arguments) + ')');
			var matches,
				styles = getStyles( elem ),

				// Only read styles.position if the test has a chance to fail
				// to avoid forcing a reflow.
				scrollboxSizeBuggy = !support.scrollboxSize() &&
					styles.position === "absolute",

				// To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
				boxSizingNeeded = scrollboxSizeBuggy || extra,
				isBorderBox = boxSizingNeeded &&
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
				subtract = extra ?
					boxModelAdjustment(
						elem,
						dimension,
						extra,
						isBorderBox,
						styles
					) :
					0;

			// Account for unreliable border-box dimensions by comparing offset* to computed and
			// faking a content-box to get border and padding (gh-3699)
			if ( isBorderBox && scrollboxSizeBuggy ) {trace@(a1542)
				subtract -= Math.ceil(
					elem[ "offset" + dimension[ 0 ].toUpperCase() + dimension.slice( 1 ) ] -
					parseFloat( styles[ dimension ] ) -
					boxModelAdjustment( elem, dimension, "border", false, styles ) -
					0.5
				);
			}

			// Convert to pixels if value adjustment is needed
			if ( subtract && ( matches = rcssNum.exec( value ) ) &&
				( matches[ 3 ] || "px" ) !== "px" ) {

				elem.style[ dimension ] = value;
				value = jQuery.css( elem, dimension );
			}

			return setPositiveNumber( elem, value, subtract );
		}
	};
} );

jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
	function a__329( elem, computed ) {trace@(a1543)
if(step$l>=1)alert('a__329(' + showarglist(arguments) + ')');
		if ( computed ) {trace@(a1544)
			return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
				elem.getBoundingClientRect().left -
					swap( elem, { marginLeft: 0 }, function a__330() {trace@(a1545)
if(step$l>=1)alert('a__330(' + showarglist(arguments) + ')');
						return elem.getBoundingClientRect().left;
					} )
				) + "px";
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each( {
	margin: "",
	padding: "",
	border: "Width"
}, function a__331( prefix, suffix ) {trace@(a1546)
if(step$l>=1)alert('a__331(' + showarglist(arguments) + ')');
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function a__332( value ) {trace@(a1547)
if(step$l>=1)alert('a__332(' + showarglist(arguments) + ')');
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split( " " ) : [ value ];

			for ( ; i < 4; i++ ) {trace@(a1548)
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( prefix !== "margin" ) {trace@(a1549)
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
} );

jQuery.fn.extend( {
	css: function a__333( name, value ) {trace@(a1550)
if(step$l>=1)alert('a__333(' + showarglist(arguments) + ')');
		return access( this, function a__334( elem, name, value ) {trace@(a1551)
if(step$l>=1)alert('a__334(' + showarglist(arguments) + ')');
			var styles, len,
				map = {},
				i = 0;

			if ( Array.isArray( name ) ) {trace@(a1552)
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {trace@(a1553)
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	}
} );


function Tween( elem, options, prop, end, easing ) {trace@(a1554)
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function a__335( elem, options, prop, end, easing, unit ) {trace@(a1555)
if(step$l>=1)alert('a__335(' + showarglist(arguments) + ')');
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function a__336() {trace@(a1556)
if(step$l>=1)alert('a__336(' + showarglist(arguments) + ')');
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function a__337( percent ) {trace@(a1557)
if(step$l>=1)alert('a__337(' + showarglist(arguments) + ')');
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {trace@(a1558)
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {trace@(a1559)
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {trace@(a1560)
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {trace@(a1561)
			hooks.set( this );
		} else {trace@(a1562)
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function a__338( tween ) {trace@(a1563)
if(step$l>=1)alert('a__338(' + showarglist(arguments) + ')');
			var result;

			// Use a property on the element directly when it is not a DOM element,
			// or when there is no matching style property that exists.
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );

			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function a__339( tween ) {trace@(a1564)
if(step$l>=1)alert('a__339(' + showarglist(arguments) + ')');

			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {trace@(a1565)
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 && (
					jQuery.cssHooks[ tween.prop ] ||
					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {trace@(a1566)
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9 only
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function a__340( tween ) {trace@(a1567)
if(step$l>=1)alert('a__340(' + showarglist(arguments) + ')');
		if ( tween.elem.nodeType && tween.elem.parentNode ) {trace@(a1568)
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function a__341( p ) {trace@(a1569)
if(step$l>=1)alert('a__341(' + showarglist(arguments) + ')');
		return p;
	},
	swing: function a__342( p ) {trace@(a1570)
if(step$l>=1)alert('a__342(' + showarglist(arguments) + ')');
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// Back compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

function schedule() {trace@(a1571)
	if ( inProgress ) {trace@(a1572)
		if ( document.hidden === false && window.requestAnimationFrame ) {trace@(a1573)
			window.requestAnimationFrame( schedule );
		} else {trace@(a1574)
			window.setTimeout( schedule, jQuery.fx.interval );
		}

		jQuery.fx.tick();
	}
}

// Animations created synchronously will run synchronously
function createFxNow() {trace@(a1575)
	window.setTimeout( function a__343() {trace@(a1576)
if(step$l>=1)alert('a__343(' + showarglist(arguments) + ')');
		fxNow = undefined;
	} );
	return ( fxNow = Date.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {trace@(a1577)
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4; i += 2 - includeWidth ) {trace@(a1578)
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {trace@(a1579)
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {trace@(a1580)
	var tween,
		collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {trace@(a1581)
		if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {trace@(a1582)

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {trace@(a1583)
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree( elem ),
		dataShow = dataPriv.get( elem, "fxshow" );

	// Queue-skipping animations hijack the fx hooks
	if ( !opts.queue ) {trace@(a1584)
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {trace@(a1585)
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function a__344() {trace@(a1586)
if(step$l>=1)alert('a__344(' + showarglist(arguments) + ')');
				if ( !hooks.unqueued ) {trace@(a1587)
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always( function a__345() {trace@(a1588)
if(step$l>=1)alert('a__345(' + showarglist(arguments) + ')');

			// Ensure the complete handler is called before this completes
			anim.always( function a__346() {trace@(a1589)
if(step$l>=1)alert('a__346(' + showarglist(arguments) + ')');
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {trace@(a1590)
					hooks.empty.fire();
				}
			} );
		} );
	}

	// Detect show/hide animations
	for ( prop in props ) {trace@(a1591)
		value = props[ prop ];
		if ( rfxtypes.test( value ) ) {trace@(a1592)
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {trace@(a1593)

				// Pretend to be hidden if this is a "show" and
				// there is still data from a stopped show/hide
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {trace@(a1594)
					hidden = true;

				// Ignore all other no-op show/hide data
				} else {trace@(a1595)
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	// Bail out if this is a no-op like .hide().hide()
	propTween = !jQuery.isEmptyObject( props );
	if ( !propTween && jQuery.isEmptyObject( orig ) ) {trace@(a1596)
		return;
	}

	// Restrict "overflow" and "display" styles during box animations
	if ( isBox && elem.nodeType === 1 ) {trace@(a1597)

		// Support: IE <=9 - 11, Edge 12 - 15
		// Record all 3 overflow attributes because IE does not infer the shorthand
		// from identically-valued overflowX and overflowY and Edge just mirrors
		// the overflowX value there.
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Identify a display type, preferring old show/hide data over the CSS cascade
		restoreDisplay = dataShow && dataShow.display;
		if ( restoreDisplay == null ) {trace@(a1598)
			restoreDisplay = dataPriv.get( elem, "display" );
		}
		display = jQuery.css( elem, "display" );
		if ( display === "none" ) {trace@(a1599)
			if ( restoreDisplay ) {trace@(a1600)
				display = restoreDisplay;
			} else {trace@(a1601)

				// Get nonempty value(s) by temporarily forcing visibility
				showHide( [ elem ], true );
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css( elem, "display" );
				showHide( [ elem ] );
			}
		}

		// Animate inline elements as inline-block
		if ( display === "inline" || display === "inline-block" && restoreDisplay != null ) {trace@(a1602)
			if ( jQuery.css( elem, "float" ) === "none" ) {trace@(a1603)

				// Restore the original display value at the end of pure show/hide animations
				if ( !propTween ) {trace@(a1604)
					anim.done( function a__347() {trace@(a1605)
if(step$l>=1)alert('a__347(' + showarglist(arguments) + ')');
						style.display = restoreDisplay;
					} );
					if ( restoreDisplay == null ) {trace@(a1606)
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if ( opts.overflow ) {trace@(a1607)
		style.overflow = "hidden";
		anim.always( function a__348() {trace@(a1608)
if(step$l>=1)alert('a__348(' + showarglist(arguments) + ')');
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		} );
	}

	// Implement show/hide animations
	propTween = false;
	for ( prop in orig ) {trace@(a1609)

		// General show/hide setup for this element animation
		if ( !propTween ) {trace@(a1610)
			if ( dataShow ) {trace@(a1611)
				if ( "hidden" in dataShow ) {trace@(a1612)
					hidden = dataShow.hidden;
				}
			} else {trace@(a1613)
				dataShow = dataPriv.access( elem, "fxshow", { display: restoreDisplay } );
			}

			// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
			if ( toggle ) {trace@(a1614)
				dataShow.hidden = !hidden;
			}

			// Show elements before animating them
			if ( hidden ) {trace@(a1615)
				showHide( [ elem ], true );
			}

			/* eslint-disable no-loop-func */

			anim.done( function a__349() {trace@(a1616)
if(step$l>=1)alert('a__349(' + showarglist(arguments) + ')');

			/* eslint-enable no-loop-func */

				// The final step of a "hide" animation is actually hiding the element
				if ( !hidden ) {trace@(a1617)
					showHide( [ elem ] );
				}
				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {trace@(a1618)
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
		}

		// Per-property setup
		propTween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );
		if ( !( prop in dataShow ) ) {trace@(a1619)
			dataShow[ prop ] = propTween.start;
			if ( hidden ) {trace@(a1620)
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

function propFilter( props, specialEasing ) {trace@(a1621)
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {trace@(a1622)
		name = camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( Array.isArray( value ) ) {trace@(a1623)
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {trace@(a1624)
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {trace@(a1625)
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {trace@(a1626)
				if ( !( index in props ) ) {trace@(a1627)
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {trace@(a1628)
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {trace@(a1629)
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always( function a__350() {trace@(a1630)
if(step$l>=1)alert('a__350(' + showarglist(arguments) + ')');

			// Don't match elem in the :animated selector
			delete tick.elem;
		} ),
		tick = function a__351() {trace@(a1631)
if(step$l>=1)alert('a__351(' + showarglist(arguments) + ')');
			if ( stopped ) {trace@(a1632)
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

				// Support: Android 2.3 only
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length; index++ ) {trace@(a1633)
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ] );

			// If there's more to do, yield
			if ( percent < 1 && length ) {trace@(a1634)
				return remaining;
			}

			// If this was an empty animation, synthesize a final progress notification
			if ( !length ) {trace@(a1635)
				deferred.notifyWith( elem, [ animation, 1, 0 ] );
			}

			// Resolve the animation and report its conclusion
			deferred.resolveWith( elem, [ animation ] );
			return false;
		},
		animation = deferred.promise( {
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function a__352( prop, end ) {trace@(a1636)
if(step$l>=1)alert('a__352(' + showarglist(arguments) + ')');
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function a__353( gotoEnd ) {trace@(a1637)
if(step$l>=1)alert('a__353(' + showarglist(arguments) + ')');
				var index = 0,

					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {trace@(a1638)
					return this;
				}
				stopped = true;
				for ( ; index < length; index++ ) {trace@(a1639)
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {trace@(a1640)
					deferred.notifyWith( elem, [ animation, 1, 0 ] );
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {trace@(a1641)
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		} ),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length; index++ ) {trace@(a1642)
		result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {trace@(a1643)
			if ( isFunction( result.stop ) ) {trace@(a1644)
				jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
					result.stop.bind( result );
			}
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( isFunction( animation.opts.start ) ) {trace@(a1645)
		animation.opts.start.call( elem, animation );
	}

	// Attach callbacks from options
	animation
		.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		} )
	);

	return animation;
}

jQuery.Animation = jQuery.extend( Animation, {

	tweeners: {
		"*": [ function a__354( prop, value ) {trace@(a1646)
if(step$l>=1)alert('a__354(' + showarglist(arguments) + ')');
			var tween = this.createTween( prop, value );
			adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
			return tween;
		} ]
	},

	tweener: function a__355( props, callback ) {trace@(a1647)
if(step$l>=1)alert('a__355(' + showarglist(arguments) + ')');
		if ( isFunction( props ) ) {trace@(a1648)
			callback = props;
			props = [ "*" ];
		} else {trace@(a1649)
			props = props.match( rnothtmlwhite );
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length; index++ ) {trace@(a1650)
			prop = props[ index ];
			Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
			Animation.tweeners[ prop ].unshift( callback );
		}
	},

	prefilters: [ defaultPrefilter ],

	prefilter: function a__356( callback, prepend ) {trace@(a1651)
if(step$l>=1)alert('a__356(' + showarglist(arguments) + ')');
		if ( prepend ) {trace@(a1652)
			Animation.prefilters.unshift( callback );
		} else {trace@(a1653)
			Animation.prefilters.push( callback );
		}
	}
} );

jQuery.speed = function a__357( speed, easing, fn ) {trace@(a1654)
if(step$l>=1)alert('a__357(' + showarglist(arguments) + ')');
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !isFunction( easing ) && easing
	};

	// Go to the end state if fx are off
	if ( jQuery.fx.off ) {trace@(a1655)
		opt.duration = 0;

	} else {trace@(a1656)
		if ( typeof opt.duration !== "number" ) {trace@(a1657)
			if ( opt.duration in jQuery.fx.speeds ) {trace@(a1658)
				opt.duration = jQuery.fx.speeds[ opt.duration ];

			} else {trace@(a1659)
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {trace@(a1660)
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function a__358() {trace@(a1661)
if(step$l>=1)alert('a__358(' + showarglist(arguments) + ')');
		if ( isFunction( opt.old ) ) {trace@(a1662)
			opt.old.call( this );
		}

		if ( opt.queue ) {trace@(a1663)
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend( {
	fadeTo: function a__359( speed, to, easing, callback ) {trace@(a1664)
if(step$l>=1)alert('a__359(' + showarglist(arguments) + ')');

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHiddenWithinTree ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate( { opacity: to }, speed, easing, callback );
	},
	animate: function a__360( prop, speed, easing, callback ) {trace@(a1665)
if(step$l>=1)alert('a__360(' + showarglist(arguments) + ')');
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function a__361() {trace@(a1666)
if(step$l>=1)alert('a__361(' + showarglist(arguments) + ')');

				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || dataPriv.get( this, "finish" ) ) {trace@(a1667)
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function a__362( type, clearQueue, gotoEnd ) {trace@(a1668)
if(step$l>=1)alert('a__362(' + showarglist(arguments) + ')');
		var stopQueue = function a__363( hooks ) {trace@(a1669)
if(step$l>=1)alert('a__363(' + showarglist(arguments) + ')');
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {trace@(a1670)
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue ) {trace@(a1671)
			this.queue( type || "fx", [] );
		}

		return this.each( function a__364() {trace@(a1672)
if(step$l>=1)alert('a__364(' + showarglist(arguments) + ')');
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get( this );

			if ( index ) {trace@(a1673)
				if ( data[ index ] && data[ index ].stop ) {trace@(a1674)
					stopQueue( data[ index ] );
				}
			} else {trace@(a1675)
				for ( index in data ) {trace@(a1676)
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {trace@(a1677)
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {trace@(a1678)
				if ( timers[ index ].elem === this &&
					( type == null || timers[ index ].queue === type ) ) {

					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {trace@(a1679)
				jQuery.dequeue( this, type );
			}
		} );
	},
	finish: function a__365( type ) {trace@(a1680)
if(step$l>=1)alert('a__365(' + showarglist(arguments) + ')');
		if ( type !== false ) {trace@(a1681)
			type = type || "fx";
		}
		return this.each( function a__366() {trace@(a1682)
if(step$l>=1)alert('a__366(' + showarglist(arguments) + ')');
			var index,
				data = dataPriv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {trace@(a1683)
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {trace@(a1684)
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {trace@(a1685)
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {trace@(a1686)
				if ( queue[ index ] && queue[ index ].finish ) {trace@(a1687)
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		} );
	}
} );

jQuery.each( [ "toggle", "show", "hide" ], function a__367( _i, name ) {trace@(a1688)
if(step$l>=1)alert('a__367(' + showarglist(arguments) + ')');
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function a__368( speed, easing, callback ) {trace@(a1689)
if(step$l>=1)alert('a__368(' + showarglist(arguments) + ')');
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
} );

// Generate shortcuts for custom animations
jQuery.each( {
	slideDown: genFx( "show" ),
	slideUp: genFx( "hide" ),
	slideToggle: genFx( "toggle" ),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function a__369( name, props ) {trace@(a1690)
if(step$l>=1)alert('a__369(' + showarglist(arguments) + ')');
	jQuery.fn[ name ] = function a__370( speed, easing, callback ) {trace@(a1691)
if(step$l>=1)alert('a__370(' + showarglist(arguments) + ')');
		return this.animate( props, speed, easing, callback );
	};
} );

jQuery.timers = [];
jQuery.fx.tick = function a__371() {trace@(a1692)
if(step$l>=1)alert('a__371(' + showarglist(arguments) + ')');
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for ( ; i < timers.length; i++ ) {trace@(a1693)
		timer = timers[ i ];

		// Run the timer and safely remove it when done (allowing for external removal)
		if ( !timer() && timers[ i ] === timer ) {trace@(a1694)
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {trace@(a1695)
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function a__372( timer ) {trace@(a1696)
if(step$l>=1)alert('a__372(' + showarglist(arguments) + ')');
	jQuery.timers.push( timer );
	jQuery.fx.start();
};

jQuery.fx.interval = 13;
jQuery.fx.start = function a__373() {trace@(a1697)
if(step$l>=1)alert('a__373(' + showarglist(arguments) + ')');
	if ( inProgress ) {trace@(a1698)
		return;
	}

	inProgress = true;
	schedule();
};

jQuery.fx.stop = function a__374() {trace@(a1699)
if(step$l>=1)alert('a__374(' + showarglist(arguments) + ')');
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function a__375( time, type ) {trace@(a1700)
if(step$l>=1)alert('a__375(' + showarglist(arguments) + ')');
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function a__376( next, hooks ) {trace@(a1701)
if(step$l>=1)alert('a__376(' + showarglist(arguments) + ')');
		var timeout = window.setTimeout( next, time );
		hooks.stop = function a__377() {trace@(a1702)
if(step$l>=1)alert('a__377(' + showarglist(arguments) + ')');
			window.clearTimeout( timeout );
		};
	} );
};


( function a__378() {trace@(a1703)
if(step$l>=1)alert('a__378(' + showarglist(arguments) + ')');
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: Android <=4.3 only
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE <=11 only
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: IE <=11 only
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
} )();


var boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend( {
	attr: function a__379( name, value ) {trace@(a1704)
if(step$l>=1)alert('a__379(' + showarglist(arguments) + ')');
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function a__380( name ) {trace@(a1705)
if(step$l>=1)alert('a__380(' + showarglist(arguments) + ')');
		return this.each( function a__381() {trace@(a1706)
if(step$l>=1)alert('a__381(' + showarglist(arguments) + ')');
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function a__382( elem, name, value ) {trace@(a1707)
if(step$l>=1)alert('a__382(' + showarglist(arguments) + ')');
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set attributes on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {trace@(a1708)
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {trace@(a1709)
			return jQuery.prop( elem, name, value );
		}

		// Attribute hooks are determined by the lowercase version
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {trace@(a1710)
			hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
		}

		if ( value !== undefined ) {trace@(a1711)
			if ( value === null ) {trace@(a1712)
				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value + "" );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {trace@(a1713)
			return ret;
		}

		ret = jQuery.find.attr( elem, name );

		// Non-existent attributes return null, we normalize to undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {
		type: {
			set: function a__383( elem, value ) {trace@(a1714)
if(step$l>=1)alert('a__383(' + showarglist(arguments) + ')');
				if ( !support.radioValue && value === "radio" &&
					nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {trace@(a1715)
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	removeAttr: function a__384( elem, value ) {trace@(a1716)
if(step$l>=1)alert('a__384(' + showarglist(arguments) + ')');
		var name,
			i = 0,

			// Attribute names can contain non-HTML whitespace characters
			// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {trace@(a1717)
			while ( ( name = attrNames[ i++ ] ) ) {trace@(a1718)
				elem.removeAttribute( name );
			}
		}
	}
} );

// Hooks for boolean attributes
boolHook = {
	set: function a__385( elem, value, name ) {trace@(a1719)
if(step$l>=1)alert('a__385(' + showarglist(arguments) + ')');
		if ( value === false ) {trace@(a1720)

			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {trace@(a1721)
			elem.setAttribute( name, name );
		}
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function a__386( _i, name ) {trace@(a1722)
if(step$l>=1)alert('a__386(' + showarglist(arguments) + ')');
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function a__387( elem, name, isXML ) {trace@(a1723)
if(step$l>=1)alert('a__387(' + showarglist(arguments) + ')');
		var ret, handle,
			lowercaseName = name.toLowerCase();

		if ( !isXML ) {trace@(a1724)

			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ lowercaseName ];
			attrHandle[ lowercaseName ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				lowercaseName :
				null;
			attrHandle[ lowercaseName ] = handle;
		}
		return ret;
	};
} );




var rfocusable = /^(?:input|select|textarea|button)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend( {
	prop: function a__388( name, value ) {trace@(a1725)
if(step$l>=1)alert('a__388(' + showarglist(arguments) + ')');
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function a__389( name ) {trace@(a1726)
if(step$l>=1)alert('a__389(' + showarglist(arguments) + ')');
		return this.each( function a__390() {trace@(a1727)
if(step$l>=1)alert('a__390(' + showarglist(arguments) + ')');
			delete this[ jQuery.propFix[ name ] || name ];
		} );
	}
} );

jQuery.extend( {
	prop: function a__391( elem, name, value ) {trace@(a1728)
if(step$l>=1)alert('a__391(' + showarglist(arguments) + ')');
		var ret, hooks,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( nType === 3 || nType === 8 || nType === 2 ) {trace@(a1729)
			return;
		}

		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {trace@(a1730)

			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {trace@(a1731)
			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			return ( elem[ name ] = value );
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {trace@(a1732)
			return ret;
		}

		return elem[ name ];
	},

	propHooks: {
		tabIndex: {
			get: function a__392( elem ) {trace@(a1733)
if(step$l>=1)alert('a__392(' + showarglist(arguments) + ')');

				// Support: IE <=9 - 11 only
				// elem.tabIndex doesn't always return the
				// correct value when it hasn't been explicitly set
				// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				if ( tabindex ) {trace@(a1734)
					return parseInt( tabindex, 10 );
				}

				if (
					rfocusable.test( elem.nodeName ) ||
					rclickable.test( elem.nodeName ) &&
					elem.href
				) {
					return 0;
				}

				return -1;
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	}
} );

// Support: IE <=11 only
// Accessing the selectedIndex property
// forces the browser to respect setting selected
// on the option
// The getter ensures a default option is selected
// when in an optgroup
// eslint rule "no-unused-expressions" is disabled for this code
// since it considers such accessions noop
if ( !support.optSelected ) {trace@(a1735)
	jQuery.propHooks.selected = {
		get: function a__393( elem ) {trace@(a1736)
if(step$l>=1)alert('a__393(' + showarglist(arguments) + ')');

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {trace@(a1737)
				parent.parentNode.selectedIndex;
			}
			return null;
		},
		set: function a__394( elem ) {trace@(a1738)
if(step$l>=1)alert('a__394(' + showarglist(arguments) + ')');

			/* eslint no-unused-expressions: "off" */

			var parent = elem.parentNode;
			if ( parent ) {trace@(a1739)
				parent.selectedIndex;

				if ( parent.parentNode ) {trace@(a1740)
					parent.parentNode.selectedIndex;
				}
			}
		}
	};
}
bp@(jqe)
jQuery.each( [
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function a__395() {trace@(a1741)
if(step$l>=1)alert('a__395(' + showarglist(arguments) + ')');
	jQuery.propFix[ this.toLowerCase() ] = this;
} );




	// Strip and collapse whitespace according to HTML spec
	// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
	function stripAndCollapse( value ) {trace@(a1742)
		var tokens = value.match( rnothtmlwhite ) || [];
		return tokens.join( " " );
	}


function getClass( elem ) {trace@(a1743)
	return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

function classesToArray( value ) {trace@(a1744)
	if ( Array.isArray( value ) ) {trace@(a1745)
		return value;
	}
	if ( typeof value === "string" ) {trace@(a1746)
		return value.match( rnothtmlwhite ) || [];
	}
	return [];
}

jQuery.fn.extend( {
	addClass: function a__396( value ) {trace@(a1747)
if(step$l>=1)alert('a__396(' + showarglist(arguments) + ')');
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {trace@(a1748)
			return this.each( function a__397( j ) {trace@(a1749)
if(step$l>=1)alert('a__397(' + showarglist(arguments) + ')');
				jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		classes = classesToArray( value );

		if ( classes.length ) {trace@(a1750)
			while ( ( elem = this[ i++ ] ) ) {trace@(a1751)
				curValue = getClass( elem );
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {trace@(a1752)
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {trace@(a1753)
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {trace@(a1754)
							cur += clazz + " ";
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {trace@(a1755)
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	removeClass: function a__398( value ) {trace@(a1756)
if(step$l>=1)alert('a__398(' + showarglist(arguments) + ')');
		var classes, elem, cur, curValue, clazz, j, finalValue,
			i = 0;

		if ( isFunction( value ) ) {trace@(a1757)
			return this.each( function a__399( j ) {trace@(a1758)
if(step$l>=1)alert('a__399(' + showarglist(arguments) + ')');
				jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
			} );
		}

		if ( !arguments.length ) {trace@(a1759)
			return this.attr( "class", "" );
		}

		classes = classesToArray( value );

		if ( classes.length ) {trace@(a1760)
			while ( ( elem = this[ i++ ] ) ) {trace@(a1761)
				curValue = getClass( elem );

				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

				if ( cur ) {trace@(a1762)
					j = 0;
					while ( ( clazz = classes[ j++ ] ) ) {trace@(a1763)

						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) > -1 ) {trace@(a1764)
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = stripAndCollapse( cur );
					if ( curValue !== finalValue ) {trace@(a1765)
						elem.setAttribute( "class", finalValue );
					}
				}
			}
		}

		return this;
	},

	toggleClass: function a__400( value, stateVal ) {trace@(a1766)
if(step$l>=1)alert('a__400(' + showarglist(arguments) + ')');
		var type = typeof value,
			isValidValue = type === "string" || Array.isArray( value );

		if ( typeof stateVal === "boolean" && isValidValue ) {trace@(a1767)
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( isFunction( value ) ) {trace@(a1768)
			return this.each( function a__401( i ) {trace@(a1769)
if(step$l>=1)alert('a__401(' + showarglist(arguments) + ')');
				jQuery( this ).toggleClass(
					value.call( this, i, getClass( this ), stateVal ),
					stateVal
				);
			} );
		}

		return this.each( function a__402() {trace@(a1770)
if(step$l>=1)alert('a__402(' + showarglist(arguments) + ')');
			var className, i, self, classNames;

			if ( isValidValue ) {trace@(a1771)

				// Toggle individual class names
				i = 0;
				self = jQuery( this );
				classNames = classesToArray( value );

				while ( ( className = classNames[ i++ ] ) ) {trace@(a1772)

					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {trace@(a1773)
						self.removeClass( className );
					} else {trace@(a1774)
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( value === undefined || type === "boolean" ) {trace@(a1775)
				className = getClass( this );
				if ( className ) {trace@(a1776)

					// Store className if set
					dataPriv.set( this, "__className__", className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				if ( this.setAttribute ) {trace@(a1777)
					this.setAttribute( "class",
						className || value === false ?
						"" :
						dataPriv.get( this, "__className__" ) || ""
					);
				}
			}
		} );
	},

	hasClass: function a__403( selector ) {trace@(a1778)
if(step$l>=1)alert('a__403(' + showarglist(arguments) + ')');
		var className, elem,
			i = 0;

		className = " " + selector + " ";
		while ( ( elem = this[ i++ ] ) ) {trace@(a1779)
			if ( elem.nodeType === 1 &&
				( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
					return true;
			}
		}

		return false;
	}
} );




var rreturn = /\r/g;

jQuery.fn.extend( {
	val: function a__404( value ) {trace@(a1780)
if(step$l>=1)alert('a__404(' + showarglist(arguments) + ')');
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {trace@(a1781)
			if ( elem ) {trace@(a1782)
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// Handle most common string cases
				if ( typeof ret === "string" ) {trace@(a1783)
					return ret.replace( rreturn, "" );
				}

				// Handle cases where value is null/undef or number
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = isFunction( value );

		return this.each( function a__405( i ) {trace@(a1784)
if(step$l>=1)alert('a__405(' + showarglist(arguments) + ')');
			var val;

			if ( this.nodeType !== 1 ) {trace@(a1785)
				return;
			}

			if ( valueIsFunction ) {trace@(a1786)
				val = value.call( this, i, jQuery( this ).val() );
			} else {trace@(a1787)
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {trace@(a1788)
				val = "";

			} else if ( typeof val === "number" ) {trace@(a1789)
				val += "";

			} else if ( Array.isArray( val ) ) {trace@(a1790)
				val = jQuery.map( val, function a__406( value ) {trace@(a1791)
if(step$l>=1)alert('a__406(' + showarglist(arguments) + ')');
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {trace@(a1792)
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		option: {
			get: function a__407( elem ) {trace@(a1793)
if(step$l>=1)alert('a__407(' + showarglist(arguments) + ')');

				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :

					// Support: IE <=10 - 11 only
					// option.text throws exceptions (#14686, #14858)
					// Strip and collapse whitespace
					// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
					stripAndCollapse( jQuery.text( elem ) );
			}
		},
		select: {
			get: function a__408( elem ) {trace@(a1794)
if(step$l>=1)alert('a__408(' + showarglist(arguments) + ')');
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {trace@(a1795)
					i = max;

				} else {trace@(a1796)
					i = one ? index : 0;
				}

				// Loop through all the selected options
				for ( ; i < max; i++ ) {trace@(a1797)
					option = options[ i ];

					// Support: IE <=9 only
					// IE8-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&

							// Don't return options that are disabled or in a disabled optgroup
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {trace@(a1798)
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function a__409( elem, value ) {trace@(a1799)
if(step$l>=1)alert('a__409(' + showarglist(arguments) + ')');
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {trace@(a1800)
					option = options[ i ];

					/* eslint-disable no-cond-assign */

					if ( option.selected =
						jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
					) {
						optionSet = true;
					}

					/* eslint-enable no-cond-assign */
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {trace@(a1801)
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

// Radios and checkboxes getter/setter
jQuery.each( [ "radio", "checkbox" ], function a__410() {trace@(a1802)
if(step$l>=1)alert('a__410(' + showarglist(arguments) + ')');
	jQuery.valHooks[ this ] = {
		set: function a__411( elem, value ) {trace@(a1803)
if(step$l>=1)alert('a__411(' + showarglist(arguments) + ')');
			if ( Array.isArray( value ) ) {trace@(a1804)
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
	if ( !support.checkOn ) {trace@(a1805)
		jQuery.valHooks[ this ].get = function a__412( elem ) {trace@(a1806)
if(step$l>=1)alert('a__412(' + showarglist(arguments) + ')');
			return elem.getAttribute( "value" ) === null ? "on" : elem.value;
		};
	}
} );




// Return jQuery for attributes-only inclusion


support.focusin = "onfocusin" in window;


var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function a__413( e ) {trace@(a1807)
if(step$l>=1)alert('a__413(' + showarglist(arguments) + ')');
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function a__414( event, data, elem, onlyHandlers ) {trace@(a1808)
if(step$l>=1)alert('a__414(' + showarglist(arguments) + ')');

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {trace@(a1809)
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {trace@(a1810)
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {trace@(a1811)

			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {trace@(a1812)
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {trace@(a1813)
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {trace@(a1814)

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {trace@(a1815)
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {trace@(a1816)
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === ( elem.ownerDocument || document ) ) {trace@(a1817)
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {trace@(a1818)
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = (
					dataPriv.get( cur, "events" ) || Object.create( null )
				)[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {trace@(a1819)
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {trace@(a1820)
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {trace@(a1821)
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {trace@(a1822)

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && isFunction( elem[ type ] ) && !isWindow( elem ) ) {trace@(a1823)

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {trace@(a1824)
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {trace@(a1825)
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {trace@(a1826)
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {trace@(a1827)
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// Piggyback on a donor event to simulate a different one
	// Used only for `focus(in | out)` events
	simulate: function a__415( type, elem, event ) {trace@(a1828)
if(step$l>=1)alert('a__415(' + showarglist(arguments) + ')');
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function a__416( type, data ) {trace@(a1829)
if(step$l>=1)alert('a__416(' + showarglist(arguments) + ')');
		return this.each( function a__417() {trace@(a1830)
if(step$l>=1)alert('a__417(' + showarglist(arguments) + ')');
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function a__418( type, data ) {trace@(a1831)
if(step$l>=1)alert('a__418(' + showarglist(arguments) + ')');
		var elem = this[ 0 ];
		if ( elem ) {trace@(a1832)
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );


// Support: Firefox <=44
// Firefox doesn't have focus(in | out) events
// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
//
// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
// focus(in | out) events fire after focus & blur events,
// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
if ( !support.focusin ) {trace@(a1833)
	jQuery.each( { focus: "focusin", blur: "focusout" }, function a__419( orig, fix ) {trace@(a1834)
if(step$l>=1)alert('a__419(' + showarglist(arguments) + ')');

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function a__420( event ) {trace@(a1835)
if(step$l>=1)alert('a__420(' + showarglist(arguments) + ')');
			jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
		};

		jQuery.event.special[ fix ] = {
			setup: function a__421() {trace@(a1836)
if(step$l>=1)alert('a__421(' + showarglist(arguments) + ')');

				// Handle: regular nodes (via `this.ownerDocument`), window
				// (via `this.document`) & document (via `this`).
				var doc = this.ownerDocument || this.document || this,
					attaches = dataPriv.access( doc, fix );

				if ( !attaches ) {trace@(a1837)
					doc.addEventListener( orig, handler, true );
				}
				dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function a__422() {trace@(a1838)
if(step$l>=1)alert('a__422(' + showarglist(arguments) + ')');
				var doc = this.ownerDocument || this.document || this,
					attaches = dataPriv.access( doc, fix ) - 1;

				if ( !attaches ) {trace@(a1839)
					doc.removeEventListener( orig, handler, true );
					dataPriv.remove( doc, fix );

				} else {trace@(a1840)
					dataPriv.access( doc, fix, attaches );
				}
			}
		};
	} );
}
trace@(a1841)var location = window.location;

var nonce = { guid: Date.now() };

var rquery = ( /\?/ );



// Cross-browser xml parsing
jQuery.parseXML = function a__423( data ) {trace@(a1842)
if(step$l>=1)alert('a__423(' + showarglist(arguments) + ')');
	var xml;
	if ( !data || typeof data !== "string" ) {trace@(a1843)
		return null;
	}

	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
	try {trace@(a1844)
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {trace@(a1845)
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {trace@(a1846)
	var name;

	if ( Array.isArray( obj ) ) {trace@(a1847)

		// Serialize array item.
		jQuery.each( obj, function a__424( i, v ) {trace@(a1848)
if(step$l>=1)alert('a__424(' + showarglist(arguments) + ')');
			if ( traditional || rbracket.test( prefix ) ) {trace@(a1849)

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {trace@(a1850)

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
					v,
					traditional,
					add
				);
			}
		} );

	} else if ( !traditional && toType( obj ) === "object" ) {trace@(a1851)

		// Serialize object item.
		for ( name in obj ) {trace@(a1852)
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {trace@(a1853)

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function a__425( a, traditional ) {trace@(a1854)
if(step$l>=1)alert('a__425(' + showarglist(arguments) + ')');
	var prefix,
		s = [],
		add = function a__426( key, valueOrFunction ) {trace@(a1855)
if(step$l>=1)alert('a__426(' + showarglist(arguments) + ')');

			// If value is a function, invoke it and use its return value
			var value = isFunction( valueOrFunction ) ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	if ( a == null ) {trace@(a1856)
		return "";
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {trace@(a1857)

		// Serialize the form elements
		jQuery.each( a, function a__427() {trace@(a1858)
if(step$l>=1)alert('a__427(' + showarglist(arguments) + ')');
			add( this.name, this.value );
		} );

	} else {trace@(a1859)

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {trace@(a1860)
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};

jQuery.fn.extend( {
	serialize: function a__428() {trace@(a1861)
if(step$l>=1)alert('a__428(' + showarglist(arguments) + ')');
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function a__429() {trace@(a1862)
if(step$l>=1)alert('a__429(' + showarglist(arguments) + ')');
		return this.map( function a__430() {trace@(a1863)
if(step$l>=1)alert('a__430(' + showarglist(arguments) + ')');

			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		} )
		.filter( function a__431() {trace@(a1864)
if(step$l>=1)alert('a__431(' + showarglist(arguments) + ')');
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		} )
		.map( function a__432( _i, elem ) {trace@(a1865)
if(step$l>=1)alert('a__432(' + showarglist(arguments) + ')');
			var val = jQuery( this ).val();

			if ( val == null ) {trace@(a1866)
				return null;
			}

			if ( Array.isArray( val ) ) {trace@(a1867)
				return jQuery.map( val, function a__433( val ) {trace@(a1868)
if(step$l>=1)alert('a__433(' + showarglist(arguments) + ')');
					return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
				} );
			}

			return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		} ).get();
	}
} );


var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Anchor tag for parsing the document origin
	originAnchor = document.createElement( "a" );
	originAnchor.href = location.href;

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {trace@(a1869)

	// dataTypeExpression is optional and defaults to "*"
	return function a__434( dataTypeExpression, func ) {trace@(a1870)
if(step$l>=1)alert('a__434(' + showarglist(arguments) + ')');

		if ( typeof dataTypeExpression !== "string" ) {trace@(a1871)
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnothtmlwhite ) || [];

		if ( isFunction( func ) ) {trace@(a1872)

			// For each dataType in the dataTypeExpression
			while ( ( dataType = dataTypes[ i++ ] ) ) {trace@(a1873)

				// Prepend if requested
				if ( dataType[ 0 ] === "+" ) {trace@(a1874)
					dataType = dataType.slice( 1 ) || "*";
					( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

				// Otherwise append
				} else {trace@(a1875)
					( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {trace@(a1876)

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {trace@(a1877)
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function a__435( _, prefilterOrFactory ) {trace@(a1878)
if(step$l>=1)alert('a__435(' + showarglist(arguments) + ')');
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {trace@(a1879)
				return !( selected = dataTypeOrTransport );
			}
		} );
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {trace@(a1880)
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {trace@(a1881)
		if ( src[ key ] !== undefined ) {trace@(a1882)
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {trace@(a1883)
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {trace@(a1884)

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {trace@(a1885)
		dataTypes.shift();
		if ( ct === undefined ) {trace@(a1886)
			ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {trace@(a1887)
		for ( type in contents ) {trace@(a1888)
			if ( contents[ type ] && contents[ type ].test( ct ) ) {trace@(a1889)
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {trace@(a1890)
		finalDataType = dataTypes[ 0 ];
	} else {trace@(a1891)

		// Try convertible dataTypes
		for ( type in responses ) {trace@(a1892)
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {trace@(a1893)
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {trace@(a1894)
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {trace@(a1895)
		if ( finalDataType !== dataTypes[ 0 ] ) {trace@(a1896)
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {trace@(a1897)
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {trace@(a1898)
		for ( conv in s.converters ) {trace@(a1899)
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {trace@(a1900)

		if ( s.responseFields[ current ] ) {trace@(a1901)
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {trace@(a1902)
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {trace@(a1903)

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {trace@(a1904)

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {trace@(a1905)

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {trace@(a1906)
					for ( conv2 in converters ) {trace@(a1907)

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {trace@(a1908)

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {trace@(a1909)

								// Condense equivalence converters
								if ( conv === true ) {trace@(a1910)
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {trace@(a1911)
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {trace@(a1912)

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s.throws ) {trace@(a1913)
						response = conv( response );
					} else {trace@(a1914)
						try {trace@(a1915)
							response = conv( response );
						} catch ( e ) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend( {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test( location.protocol ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": JSON.parse,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function a__436( target, settings ) {trace@(a1916)
if(step$l>=1)alert('a__436(' + showarglist(arguments) + ')');
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function a__437( url, options ) {trace@(a1917)
if(step$l>=1)alert('a__437(' + showarglist(arguments) + ')');

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {trace@(a1918)
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,

			// URL without anti-cache param
			cacheURL,

			// Response headers
			responseHeadersString,
			responseHeaders,

			// timeout handle
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// Request state (becomes false upon send and true upon completion)
			completed,

			// To know if global events are to be dispatched
			fireGlobals,

			// Loop variable
			i,

			// uncached part of the url
			uncached,

			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),

			// Callbacks context
			callbackContext = s.context || s,

			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context &&
				( callbackContext.nodeType || callbackContext.jquery ) ?
					jQuery( callbackContext ) :
					jQuery.event,

			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),

			// Status-dependent callbacks
			statusCode = s.statusCode || {},

			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},

			// Default abort message
			strAbort = "canceled",

			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function a__438( key ) {trace@(a1919)
if(step$l>=1)alert('a__438(' + showarglist(arguments) + ')');
					var match;
					if ( completed ) {trace@(a1920)
						if ( !responseHeaders ) {trace@(a1921)
							responseHeaders = {};
							while ( ( match = rheaders.exec( responseHeadersString ) ) ) {trace@(a1922)
								responseHeaders[ match[ 1 ].toLowerCase() + " " ] =
									( responseHeaders[ match[ 1 ].toLowerCase() + " " ] || [] )
										.concat( match[ 2 ] );
							}
						}
						match = responseHeaders[ key.toLowerCase() + " " ];
					}
					return match == null ? null : match.join( ", " );
				},

				// Raw string
				getAllResponseHeaders: function a__439() {trace@(a1923)
if(step$l>=1)alert('a__439(' + showarglist(arguments) + ')');
					return completed ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function a__440( name, value ) {trace@(a1924)
if(step$l>=1)alert('a__440(' + showarglist(arguments) + ')');
					if ( completed == null ) {trace@(a1925)
						name = requestHeadersNames[ name.toLowerCase() ] =
							requestHeadersNames[ name.toLowerCase() ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function a__441( type ) {trace@(a1926)
if(step$l>=1)alert('a__441(' + showarglist(arguments) + ')');
					if ( completed == null ) {trace@(a1927)
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function a__442( map ) {trace@(a1928)
if(step$l>=1)alert('a__442(' + showarglist(arguments) + ')');
					var code;
					if ( map ) {trace@(a1929)
						if ( completed ) {trace@(a1930)

							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						} else {trace@(a1931)

							// Lazy-add the new callbacks in a way that preserves old ones
							for ( code in map ) {trace@(a1932)
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						}
					}
					return this;
				},

				// Cancel the request
				abort: function a__443( statusText ) {trace@(a1933)
if(step$l>=1)alert('a__443(' + showarglist(arguments) + ')');
					var finalText = statusText || strAbort;
					if ( transport ) {trace@(a1934)
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR );

		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || location.href ) + "" )
			.replace( rprotocol, location.protocol + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = ( s.dataType || "*" ).toLowerCase().match( rnothtmlwhite ) || [ "" ];

		// A cross-domain request is in order when the origin doesn't match the current origin.
		if ( s.crossDomain == null ) {trace@(a1935)
			urlAnchor = document.createElement( "a" );

			// Support: IE <=8 - 11, Edge 12 - 15
			// IE throws exception on accessing the href property if url is malformed,
			// e.g. http://example.com:80x/
			try {trace@(a1936)
				urlAnchor.href = s.url;

				// Support: IE <=8 - 11 only
				// Anchor's host property isn't correctly set when s.url is relative
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch ( e ) {

				// If there is an error parsing the URL, assume it is crossDomain,
				// it can be rejected by the transport if it is invalid
				s.crossDomain = true;
			}
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {trace@(a1937)
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( completed ) {trace@(a1938)
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {trace@(a1939)
			jQuery.event.trigger( "ajaxStart" );
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		// Remove hash to simplify url manipulation
		cacheURL = s.url.replace( rhash, "" );

		// More options handling for requests with no content
		if ( !s.hasContent ) {trace@(a1940)

			// Remember the hash so we can put it back
			uncached = s.url.slice( cacheURL.length );

			// If data is available and should be processed, append data to url
			if ( s.data && ( s.processData || typeof s.data === "string" ) ) {trace@(a1941)
				cacheURL += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data;

				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add or update anti-cache param if needed
			if ( s.cache === false ) {trace@(a1942)
				cacheURL = cacheURL.replace( rantiCache, "$1" );
				uncached = ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ( nonce.guid++ ) +
					uncached;
			}

			// Put hash and anti-cache on the URL that will be requested (gh-1732)
			s.url = cacheURL + uncached;

		// Change '%20' to '+' if this is encoded form body content (gh-2658)
		} else if ( s.data && s.processData &&
			( s.contentType || "" ).indexOf( "application/x-www-form-urlencoded" ) === 0 ) {
			s.data = s.data.replace( r20, "+" );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {trace@(a1943)
			if ( jQuery.lastModified[ cacheURL ] ) {trace@(a1944)
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {trace@(a1945)
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {trace@(a1946)
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
				s.accepts[ s.dataTypes[ 0 ] ] +
					( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {trace@(a1947)
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend &&
			( s.beforeSend.call( callbackContext, jqXHR, s ) === false || completed ) ) {

			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		completeDeferred.add( s.complete );
		jqXHR.done( s.success );
		jqXHR.fail( s.error );

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {trace@(a1948)
			done( -1, "No Transport" );
		} else {trace@(a1949)
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {trace@(a1950)
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}

			// If request was aborted inside ajaxSend, stop there
			if ( completed ) {trace@(a1951)
				return jqXHR;
			}

			// Timeout
			if ( s.async && s.timeout > 0 ) {trace@(a1952)
				timeoutTimer = window.setTimeout( function a__444() {trace@(a1953)
if(step$l>=1)alert('a__444(' + showarglist(arguments) + ')');
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {trace@(a1954)
				completed = false;
				transport.send( requestHeaders, done );
			} catch ( e ) {

				// Rethrow post-completion exceptions
				if ( completed ) {trace@(a1955)
					throw e;
				}

				// Propagate others as results
				done( -1, e );
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {trace@(a1956)
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Ignore repeat invocations
			if ( completed ) {trace@(a1957)
				return;
			}

			completed = true;

			// Clear timeout if it exists
			if ( timeoutTimer ) {trace@(a1958)
				window.clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {trace@(a1959)
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Use a noop converter for missing script
			if ( !isSuccess && jQuery.inArray( "script", s.dataTypes ) > -1 ) {trace@(a1960)
				s.converters[ "text script" ] = function() {};
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {trace@(a1961)

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {trace@(a1962)
					modified = jqXHR.getResponseHeader( "Last-Modified" );
					if ( modified ) {trace@(a1963)
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader( "etag" );
					if ( modified ) {trace@(a1964)
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {trace@(a1965)
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {trace@(a1966)
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {trace@(a1967)
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {trace@(a1968)

				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {trace@(a1969)
					statusText = "error";
					if ( status < 0 ) {trace@(a1970)
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {trace@(a1971)
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {trace@(a1972)
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {trace@(a1973)
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {trace@(a1974)
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {trace@(a1975)
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		return jqXHR;
	},

	getJSON: function a__445( url, data, callback ) {trace@(a1976)
if(step$l>=1)alert('a__445(' + showarglist(arguments) + ')');
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function a__446( url, callback ) {trace@(a1977)
if(step$l>=1)alert('a__446(' + showarglist(arguments) + ')');
		return jQuery.get( url, undefined, callback, "script" );
	}
} );

jQuery.each( [ "get", "post" ], function a__447( _i, method ) {trace@(a1978)
if(step$l>=1)alert('a__447(' + showarglist(arguments) + ')');
	jQuery[ method ] = function a__448( url, data, callback, type ) {trace@(a1979)
if(step$l>=1)alert('a__448(' + showarglist(arguments) + ')');

		// Shift arguments if data argument was omitted
		if ( isFunction( data ) ) {trace@(a1980)
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// The url can be an options object (which then must have .url)
		return jQuery.ajax( jQuery.extend( {
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject( url ) && url ) );
	};
} );

jQuery.ajaxPrefilter( function a__449( s ) {trace@(a1981)
if(step$l>=1)alert('a__449(' + showarglist(arguments) + ')');
	var i;
	for ( i in s.headers ) {trace@(a1982)
		if ( i.toLowerCase() === "content-type" ) {trace@(a1983)
			s.contentType = s.headers[ i ] || "";
		}
	}
} );


jQuery._evalUrl = function a__450( url, options, doc ) {trace@(a1984)
if(step$l>=1)alert('a__450(' + showarglist(arguments) + ')');
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,

		// Only evaluate the response if it is successful (gh-4126)
		// dataFilter is not invoked for failure responses, so using it instead
		// of the default converter is kludgy but it works.
		converters: {
			"text script": function() {}
		},
		dataFilter: function a__451( response ) {trace@(a1985)
if(step$l>=1)alert('a__451(' + showarglist(arguments) + ')');
			jQuery.globalEval( response, options, doc );
		}
	} );
};


jQuery.fn.extend( {
	wrapAll: function a__452( html ) {trace@(a1986)
if(step$l>=1)alert('a__452(' + showarglist(arguments) + ')');
		var wrap;

		if ( this[ 0 ] ) {trace@(a1987)
			if ( isFunction( html ) ) {trace@(a1988)
				html = html.call( this[ 0 ] );
			}

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {trace@(a1989)
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map( function a__453() {trace@(a1990)
if(step$l>=1)alert('a__453(' + showarglist(arguments) + ')');
				var elem = this;

				while ( elem.firstElementChild ) {trace@(a1991)
					elem = elem.firstElementChild;
				}

				return elem;
			} ).append( this );
		}

		return this;
	},

	wrapInner: function a__454( html ) {trace@(a1992)
if(step$l>=1)alert('a__454(' + showarglist(arguments) + ')');
		if ( isFunction( html ) ) {trace@(a1993)
			return this.each( function a__455( i ) {trace@(a1994)
if(step$l>=1)alert('a__455(' + showarglist(arguments) + ')');
				jQuery( this ).wrapInner( html.call( this, i ) );
			} );
		}

		return this.each( function a__456() {trace@(a1995)
if(step$l>=1)alert('a__456(' + showarglist(arguments) + ')');
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {trace@(a1996)
				contents.wrapAll( html );

			} else {trace@(a1997)
				self.append( html );
			}
		} );
	},

	wrap: function a__457( html ) {trace@(a1998)
if(step$l>=1)alert('a__457(' + showarglist(arguments) + ')');
		var htmlIsFunction = isFunction( html );

		return this.each( function a__458( i ) {trace@(a1999)
if(step$l>=1)alert('a__458(' + showarglist(arguments) + ')');
			jQuery( this ).wrapAll( htmlIsFunction ? html.call( this, i ) : html );
		} );
	},

	unwrap: function a__459( selector ) {trace@(a2000)
if(step$l>=1)alert('a__459(' + showarglist(arguments) + ')');
		this.parent( selector ).not( "body" ).each( function a__460() {trace@(a2001)
if(step$l>=1)alert('a__460(' + showarglist(arguments) + ')');
			jQuery( this ).replaceWith( this.childNodes );
		} );
		return this;
	}
} );


jQuery.expr.pseudos.hidden = function a__461( elem ) {trace@(a2002)
if(step$l>=1)alert('a__461(' + showarglist(arguments) + ')');
	return !jQuery.expr.pseudos.visible( elem );
};
jQuery.expr.pseudos.visible = function a__462( elem ) {trace@(a2003)
if(step$l>=1)alert('a__462(' + showarglist(arguments) + ')');
	return !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length );
};




jQuery.ajaxSettings.xhr = function a__463() {trace@(a2004)
if(step$l>=1)alert('a__463(' + showarglist(arguments) + ')');
	try {trace@(a2005)
		return new window.XMLHttpRequest();
	} catch ( e ) {}
};

var xhrSuccessStatus = {

		// File protocol always yields status code 0, assume 200
		0: 200,

		// Support: IE <=9 only
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport( function a__464( options ) {trace@(a2006)
if(step$l>=1)alert('a__464(' + showarglist(arguments) + ')');
	var callback, errorCallback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {trace@(a2007)
		return {
			send: function a__465( headers, complete ) {trace@(a2008)
if(step$l>=1)alert('a__465(' + showarglist(arguments) + ')');
				var i,
					xhr = options.xhr();

				xhr.open(
					options.type,
					options.url,
					options.async,
					options.username,
					options.password
				);

				// Apply custom fields if provided
				if ( options.xhrFields ) {trace@(a2009)
					for ( i in options.xhrFields ) {trace@(a2010)
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {trace@(a2011)
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {trace@(a2012)
					headers[ "X-Requested-With" ] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {trace@(a2013)
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function a__466( type ) {trace@(a2014)
if(step$l>=1)alert('a__466(' + showarglist(arguments) + ')');
					return function a__467() {trace@(a2015)
if(step$l>=1)alert('a__467(' + showarglist(arguments) + ')');
						if ( callback ) {trace@(a2016)
							callback = errorCallback = xhr.onload =
								xhr.onerror = xhr.onabort = xhr.ontimeout =
									xhr.onreadystatechange = null;

							if ( type === "abort" ) {trace@(a2017)
								xhr.abort();
							} else if ( type === "error" ) {trace@(a2018)

								// Support: IE <=9 only
								// On a manual native abort, IE9 throws
								// errors on any property access that is not readyState
								if ( typeof xhr.status !== "number" ) {trace@(a2019)
									complete( 0, "error" );
								} else {trace@(a2020)
									complete(

										// File: protocol always yields status 0; see #8605, #14207
										xhr.status,
										xhr.statusText
									);
								}
							} else {trace@(a2021)
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,

									// Support: IE <=9 only
									// IE9 has no XHR2 but throws on binary (trac-11426)
									// For XHR2 non-text, let the caller handle it (gh-2498)
									( xhr.responseType || "text" ) !== "text"  ||
									typeof xhr.responseText !== "string" ?
										{ binary: xhr.response } :
										{ text: xhr.responseText },
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				errorCallback = xhr.onerror = xhr.ontimeout = callback( "error" );

				// Support: IE 9 only
				// Use onreadystatechange to replace onabort
				// to handle uncaught aborts
				if ( xhr.onabort !== undefined ) {trace@(a2022)
					xhr.onabort = errorCallback;
				} else {trace@(a2023)
					xhr.onreadystatechange = function a__468() {trace@(a2024)
if(step$l>=1)alert('a__468(' + showarglist(arguments) + ')');

						// Check readyState before timeout as it changes
						if ( xhr.readyState === 4 ) {trace@(a2025)

							// Allow onerror to be called first,
							// but that will not handle a native abort
							// Also, save errorCallback to a variable
							// as xhr.onerror cannot be accessed
							window.setTimeout( function a__469() {trace@(a2026)
if(step$l>=1)alert('a__469(' + showarglist(arguments) + ')');
								if ( callback ) {trace@(a2027)
									errorCallback();
								}
							} );
						}
					};
				}

				// Create the abort callback
				callback = callback( "abort" );

				try {trace@(a2028)

					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {

					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {trace@(a2029)
						throw e;
					}
				}
			},

			abort: function a__470() {trace@(a2030)
if(step$l>=1)alert('a__470(' + showarglist(arguments) + ')');
				if ( callback ) {trace@(a2031)
					callback();
				}
			}
		};
	}
} );




// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
jQuery.ajaxPrefilter( function a__471( s ) {trace@(a2032)
if(step$l>=1)alert('a__471(' + showarglist(arguments) + ')');
	if ( s.crossDomain ) {trace@(a2033)
		s.contents.script = false;
	}
} );

// Install script dataType
jQuery.ajaxSetup( {
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /\b(?:java|ecma)script\b/
	},
	converters: {
		"text script": function a__472( text ) {trace@(a2034)
if(step$l>=1)alert('a__472(' + showarglist(arguments) + ')');
			jQuery.globalEval( text );
			return text;
		}
	}
} );

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function a__473( s ) {trace@(a2035)
if(step$l>=1)alert('a__473(' + showarglist(arguments) + ')');
	if ( s.cache === undefined ) {trace@(a2036)
		s.cache = false;
	}
	if ( s.crossDomain ) {trace@(a2037)
		s.type = "GET";
	}
} );

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function a__474( s ) {trace@(a2038)
if(step$l>=1)alert('a__474(' + showarglist(arguments) + ')');

	// This transport only deals with cross domain or forced-by-attrs requests
	if ( s.crossDomain || s.scriptAttrs ) {trace@(a2039)
		var script, callback;
		return {
			send: function a__475( _, complete ) {trace@(a2040)
if(step$l>=1)alert('a__475(' + showarglist(arguments) + ')');
				script = jQuery( "<script>" )
					.attr( s.scriptAttrs || {} )
					.prop( { charset: s.scriptCharset, src: s.url } )
					.on( "load error", callback = function a__476( evt ) {trace@(a2041)
if(step$l>=1)alert('a__476(' + showarglist(arguments) + ')');
						script.remove();
						callback = null;
						if ( evt ) {trace@(a2042)
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					} );

				// Use native DOM manipulation to avoid our domManip AJAX trickery
				document.head.appendChild( script[ 0 ] );
			},
			abort: function a__477() {trace@(a2043)
if(step$l>=1)alert('a__477(' + showarglist(arguments) + ')');
				if ( callback ) {trace@(a2044)
					callback();
				}
			}
		};
	}
} );




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function a__478() {trace@(a2045)
if(step$l>=1)alert('a__478(' + showarglist(arguments) + ')');
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function a__479( s, originalSettings, jqXHR ) {trace@(a2046)
if(step$l>=1)alert('a__479(' + showarglist(arguments) + ')');

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {trace@(a2047)

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {trace@(a2048)
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {trace@(a2049)
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters[ "script json" ] = function a__480() {trace@(a2050)
if(step$l>=1)alert('a__480(' + showarglist(arguments) + ')');
			if ( !responseContainer ) {trace@(a2051)
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// Force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function a__481() {trace@(a2052)
if(step$l>=1)alert('a__481(' + showarglist(arguments) + ')');
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always( function a__482() {trace@(a2053)
if(step$l>=1)alert('a__482(' + showarglist(arguments) + ')');

			// If previous value didn't exist - remove it
			if ( overwritten === undefined ) {trace@(a2054)
				jQuery( window ).removeProp( callbackName );

			// Otherwise restore preexisting value
			} else {trace@(a2055)
				window[ callbackName ] = overwritten;
			}

			// Save back as free
			if ( s[ callbackName ] ) {trace@(a2056)

				// Make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// Save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && isFunction( overwritten ) ) {trace@(a2057)
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		} );

		// Delegate to script
		return "script";
	}
} );




// Support: Safari 8 only
// In Safari 8 documents created via document.implementation.createHTMLDocument
// collapse sibling forms: the second one becomes a child of the first one.
// Because of that, this security measure has to be disabled in Safari 8.
// https://bugs.webkit.org/show_bug.cgi?id=137337
support.createHTMLDocument = ( function a__483() {trace@(a2058)
if(step$l>=1)alert('a__483(' + showarglist(arguments) + ')');
	var body = document.implementation.createHTMLDocument( "" ).body;
	body.innerHTML = "<form></form><form></form>";
	return body.childNodes.length === 2;
} )();


// Argument "data" should be string of html
// context (optional): If specified, the fragment will be created in this context,
// defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function a__484( data, context, keepScripts ) {trace@(a2059)
if(step$l>=1)alert('a__484(' + showarglist(arguments) + ')');
	if ( typeof data !== "string" ) {trace@(a2060)
		return [];
	}
	if ( typeof context === "boolean" ) {trace@(a2061)
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {trace@(a2062)

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		if ( support.createHTMLDocument ) {trace@(a2063)
			context = document.implementation.createHTMLDocument( "" );

			// Set the base href for the created document
			// so any parsed elements with URLs
			// are based on the document's URL (gh-2965)
			base = context.createElement( "base" );
			base.href = document.location.href;
			context.head.appendChild( base );
		} else {trace@(a2064)
			context = document;
		}
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {trace@(a2065)
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {trace@(a2066)
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


/**
 * Load a url into a page
 */
jQuery.fn.load = function a__485( url, params, callback ) {trace@(a2067)
if(step$l>=1)alert('a__485(' + showarglist(arguments) + ')');
	var selector, type, response,
		self = this,
		off = url.indexOf( " " );

	if ( off > -1 ) {trace@(a2068)
		selector = stripAndCollapse( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( isFunction( params ) ) {trace@(a2069)

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {trace@(a2070)
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {trace@(a2071)
		jQuery.ajax( {
			url: url,

			// If "type" variable is undefined, then "GET" method will be used.
			// Make value of this field explicit since
			// user can override it through ajaxSetup method
			type: type || "GET",
			dataType: "html",
			data: params
		} ).done( function a__486( responseText ) {trace@(a2072)
if(step$l>=1)alert('a__486(' + showarglist(arguments) + ')');

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		// If the request succeeds, this function gets "data", "status", "jqXHR"
		// but they are ignored because response was set above.
		// If it fails, this function gets "jqXHR", "status", "error"
		} ).always( callback && function a__487( jqXHR, status ) {trace@(a2073)
if(step$l>=1)alert('a__487(' + showarglist(arguments) + ')');
			self.each( function a__488() {trace@(a2074)
if(step$l>=1)alert('a__488(' + showarglist(arguments) + ')');
				callback.apply( this, response || [ jqXHR.responseText, status, jqXHR ] );
			} );
		} );
	}

	return this;
};




jQuery.expr.pseudos.animated = function a__489( elem ) {trace@(a2075)
if(step$l>=1)alert('a__489(' + showarglist(arguments) + ')');
	return jQuery.grep( jQuery.timers, function a__490( fn ) {trace@(a2076)
if(step$l>=1)alert('a__490(' + showarglist(arguments) + ')');
		return elem === fn.elem;
	} ).length;
};




jQuery.offset = {
	setOffset: function a__491( elem, options, i ) {trace@(a2077)
if(step$l>=1)alert('a__491(' + showarglist(arguments) + ')');
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {trace@(a2078)
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {trace@(a2079)
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {trace@(a2080)
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( isFunction( options ) ) {trace@(a2081)

			// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
			options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
		}

		if ( options.top != null ) {trace@(a2082)
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {trace@(a2083)
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {trace@(a2084)
			options.using.call( elem, props );

		} else {trace@(a2085)
			if ( typeof props.top === "number" ) {trace@(a2086)
				props.top += "px";
			}
			if ( typeof props.left === "number" ) {trace@(a2087)
				props.left += "px";
			}
			curElem.css( props );
		}
	}
};

jQuery.fn.extend( {

	// offset() relates an element's border box to the document origin
	offset: function a__492( options ) {trace@(a2088)
if(step$l>=1)alert('a__492(' + showarglist(arguments) + ')');

		// Preserve chaining for setter
		if ( arguments.length ) {trace@(a2089)
			return options === undefined ?
				this :
				this.each( function a__493( i ) {trace@(a2090)
if(step$l>=1)alert('a__493(' + showarglist(arguments) + ')');
					jQuery.offset.setOffset( this, options, i );
				} );
		}

		var rect, win,
			elem = this[ 0 ];

		if ( !elem ) {trace@(a2091)
			return;
		}

		// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
		// Support: IE <=11 only
		// Running getBoundingClientRect on a
		// disconnected node in IE throws an error
		if ( !elem.getClientRects().length ) {trace@(a2092)
			return { top: 0, left: 0 };
		}

		// Get document-relative position by adding viewport scroll to viewport-relative gBCR
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position() relates an element's margin box to its offset parent's padding box
	// This corresponds to the behavior of CSS absolute positioning
	position: function a__494() {trace@(a2093)
if(step$l>=1)alert('a__494(' + showarglist(arguments) + ')');
		if ( !this[ 0 ] ) {trace@(a2094)
			return;
		}

		var offsetParent, offset, doc,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// position:fixed elements are offset from the viewport, which itself always has zero offset
		if ( jQuery.css( elem, "position" ) === "fixed" ) {trace@(a2095)

			// Assume position:fixed implies availability of getBoundingClientRect
			offset = elem.getBoundingClientRect();

		} else {trace@(a2096)
			offset = this.offset();

			// Account for the *real* offset parent, which can be the document or its root element
			// when a statically positioned element is identified
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while ( offsetParent &&
				( offsetParent === doc.body || offsetParent === doc.documentElement ) &&
				jQuery.css( offsetParent, "position" ) === "static" ) {

				offsetParent = offsetParent.parentNode;
			}
			if ( offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 ) {trace@(a2097)

				// Incorporate borders into its offset, since they are outside its content origin
				parentOffset = jQuery( offsetParent ).offset();
				parentOffset.top += jQuery.css( offsetParent, "borderTopWidth", true );
				parentOffset.left += jQuery.css( offsetParent, "borderLeftWidth", true );
			}
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	// This method will return documentElement in the following cases:
	// 1) For the element inside the iframe without offsetParent, this method will return
	//    documentElement of the parent window
	// 2) For the hidden or detached element
	// 3) For body or html element, i.e. in case of the html node - it will return itself
	//
	// but those exceptions were never presented as a real life use-cases
	// and might be considered as more preferable results.
	//
	// This logic, however, is not guaranteed and can change at any point in the future
	offsetParent: function a__495() {trace@(a2098)
if(step$l>=1)alert('a__495(' + showarglist(arguments) + ')');
		return this.map( function a__496() {trace@(a2099)
if(step$l>=1)alert('a__496(' + showarglist(arguments) + ')');
			var offsetParent = this.offsetParent;

			while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {trace@(a2100)
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		} );
	}
} );

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function a__497( method, prop ) {trace@(a2101)
if(step$l>=1)alert('a__497(' + showarglist(arguments) + ')');
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function a__498( val ) {trace@(a2102)
if(step$l>=1)alert('a__498(' + showarglist(arguments) + ')');
		return access( this, function a__499( elem, method, val ) {trace@(a2103)
if(step$l>=1)alert('a__499(' + showarglist(arguments) + ')');

			// Coalesce documents and windows
			var win;
			if ( isWindow( elem ) ) {trace@(a2104)
				win = elem;
			} else if ( elem.nodeType === 9 ) {trace@(a2105)
				win = elem.defaultView;
			}

			if ( val === undefined ) {trace@(a2106)
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {trace@(a2107)
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {trace@(a2108)
				elem[ method ] = val;
			}
		}, method, val, arguments.length );
	};
} );

// Support: Safari <=7 - 9.1, Chrome <=37 - 49
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function a__500( _i, prop ) {trace@(a2109)
if(step$l>=1)alert('a__500(' + showarglist(arguments) + ')');
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function a__501( elem, computed ) {trace@(a2110)
if(step$l>=1)alert('a__501(' + showarglist(arguments) + ')');
			if ( computed ) {trace@(a2111)
				computed = curCSS( elem, prop );

				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
} );


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function a__502( name, type ) {trace@(a2112)
if(step$l>=1)alert('a__502(' + showarglist(arguments) + ')');
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
		function a__503( defaultExtra, funcName ) {trace@(a2113)
if(step$l>=1)alert('a__503(' + showarglist(arguments) + ')');

		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function a__504( margin, value ) {trace@(a2114)
if(step$l>=1)alert('a__504(' + showarglist(arguments) + ')');
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function a__505( elem, type, value ) {trace@(a2115)
if(step$l>=1)alert('a__505(' + showarglist(arguments) + ')');
				var doc;

				if ( isWindow( elem ) ) {trace@(a2116)

					// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {trace@(a2117)
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );


jQuery.each( [
	"ajaxStart",
	"ajaxStop",
	"ajaxComplete",
	"ajaxError",
	"ajaxSuccess",
	"ajaxSend"
], function a__506( _i, type ) {trace@(a2118)
if(step$l>=1)alert('a__506(' + showarglist(arguments) + ')');
	jQuery.fn[ type ] = function a__507( fn ) {trace@(a2119)
if(step$l>=1)alert('a__507(' + showarglist(arguments) + ')');
		return this.on( type, fn );
	};
} );




jQuery.fn.extend( {

	bind: function a__508( types, data, fn ) {trace@(a2120)
if(step$l>=1)alert('a__508(' + showarglist(arguments) + ')');
		return this.on( types, null, data, fn );
	},
	unbind: function a__509( types, fn ) {trace@(a2121)
if(step$l>=1)alert('a__509(' + showarglist(arguments) + ')');
		return this.off( types, null, fn );
	},

	delegate: function a__510( selector, types, data, fn ) {trace@(a2122)
if(step$l>=1)alert('a__510(' + showarglist(arguments) + ')');
		return this.on( types, selector, data, fn );
	},
	undelegate: function a__511( selector, types, fn ) {trace@(a2123)
if(step$l>=1)alert('a__511(' + showarglist(arguments) + ')');

		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ?
			this.off( selector, "**" ) :
			this.off( types, selector || "**", fn );
	},

	hover: function a__512( fnOver, fnOut ) {trace@(a2124)
if(step$l>=1)alert('a__512(' + showarglist(arguments) + ')');
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
} );

jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup contextmenu" ).split( " " ),
	function a__513( _i, name ) {trace@(a2125)
if(step$l>=1)alert('a__513(' + showarglist(arguments) + ')');

		// Handle event binding
		jQuery.fn[ name ] = function a__514( data, fn ) {trace@(a2126)
if(step$l>=1)alert('a__514(' + showarglist(arguments) + ')');
			return arguments.length > 0 ?
				this.on( name, null, data, fn ) :
				this.trigger( name );
		};
	} );




// Support: Android <=4.0 only
// Make sure we trim BOM and NBSP
trace@(a2127)var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

// Bind a function to a context, optionally partially applying any
// arguments.
// jQuery.proxy is deprecated to promote standards (specifically Function#bind)
// However, it is not slated for removal any time soon
jQuery.proxy = function a__515( fn, context ) {trace@(a2128)
if(step$l>=1)alert('a__515(' + showarglist(arguments) + ')');
	var tmp, args, proxy;

	if ( typeof context === "string" ) {trace@(a2129)
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// Quick check to determine if target is callable, in the spec
	// this throws a TypeError, but we will just return undefined.
	if ( !isFunction( fn ) ) {trace@(a2130)
		return undefined;
	}

	// Simulated bind
	args = slice.call( arguments, 2 );
	proxy = function a__516() {trace@(a2131)
if(step$l>=1)alert('a__516(' + showarglist(arguments) + ')');
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// Set the guid of unique handler to the same of original handler, so it can be removed
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function a__517( hold ) {trace@(a2132)
if(step$l>=1)alert('a__517(' + showarglist(arguments) + ')');
	if ( hold ) {trace@(a2133)
		jQuery.readyWait++;
	} else {trace@(a2134)
		jQuery.ready( true );
	}
};
jQuery.isArray = Array.isArray;
jQuery.parseJSON = JSON.parse;
jQuery.nodeName = nodeName;
jQuery.isFunction = isFunction;
jQuery.isWindow = isWindow;
jQuery.camelCase = camelCase;
jQuery.type = toType;

jQuery.now = Date.now;

jQuery.isNumeric = function a__518( obj ) {trace@(a2135)
if(step$l>=1)alert('a__518(' + showarglist(arguments) + ')');

	// As of jQuery 3.0, isNumeric is limited to
	// strings and numbers (primitives or objects)
	// that can be coerced to finite numbers (gh-2662)
	var type = jQuery.type( obj );
	return ( type === "number" || type === "string" ) &&

		// parseFloat NaNs numeric-cast false positives ("")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		!isNaN( obj - parseFloat( obj ) );
};

jQuery.trim = function a__519( text ) {trace@(a2136)
if(step$l>=1)alert('a__519(' + showarglist(arguments) + ')');
	return text == null ?
		"" :
		( text + "" ).replace( rtrim, "" );
};



// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {trace@(a2137)
	define( "jquery", [], function a__520() {trace@(a2138)
if(step$l>=1)alert('a__520(' + showarglist(arguments) + ')');
		return jQuery;
	} );
}




var

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function a__521( deep ) {trace@(a2139)
if(step$l>=1)alert('a__521(' + showarglist(arguments) + ')');
	if ( window.$ === jQuery ) {trace@(a2140)
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {trace@(a2141)
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === "undefined" ) {trace@(a2142)
	window.jQuery = window.$ = jQuery;
}




{let x$rv=(jQuery);trace@(a2146);return x$rv;}
} );
