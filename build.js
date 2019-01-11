(function () {
	'use strict';

	var combineArrays = function(obj) {
		var keys = Object.keys(obj);

		keys.forEach(function(key) {
			if (!Array.isArray(obj[key])) {
				throw new Error(key + ' is not an array')
			}
		});

		var maxIndex = keys.reduce(function(maxSoFar, key) {
			var len = obj[key].length;
			return maxSoFar > len ? maxSoFar : len
		}, 0);

		var output = [];

		function getObject(index) {
			var o = {};
			keys.forEach(function(key) {
				o[key] = obj[key][index];
			});
			return o
		}

		for (var i = 0; i < maxIndex; ++i) {
			output.push(getObject(i));
		}

		return output
	};

	var isarray = Array.isArray || function (arr) {
	  return Object.prototype.toString.call(arr) == '[object Array]';
	};

	/**
	 * Expose `pathToRegexp`.
	 */
	var pathToRegexpWithReversibleKeys = pathToRegexp;

	/**
	 * The main path matching regexp utility.
	 *
	 * @type {RegExp}
	 */
	var PATH_REGEXP = new RegExp([
	  // Match escaped characters that would otherwise appear in future matches.
	  // This allows the user to escape special characters that won't transform.
	  '(\\\\.)',
	  // Match Express-style parameters and un-named parameters with a prefix
	  // and optional suffixes. Matches appear as:
	  //
	  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
	  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
	  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
	  // Match regexp special characters that are always escaped.
	  '([.+*?=^!:${}()[\\]|\\/])'
	].join('|'), 'g');

	/**
	 * Escape the capturing group by escaping special characters and meaning.
	 *
	 * @param  {String} group
	 * @return {String}
	 */
	function escapeGroup (group) {
	  return group.replace(/([=!:$\/()])/g, '\\$1');
	}

	/**
	 * Attach the keys as a property of the regexp.
	 *
	 * @param  {RegExp} re
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	function attachKeys (re, keys, allTokens) {
	  re.keys = keys;
	  re.allTokens = allTokens;
	  return re;
	}

	/**
	 * Get the flags for a regexp from the options.
	 *
	 * @param  {Object} options
	 * @return {String}
	 */
	function flags (options) {
	  return options.sensitive ? '' : 'i';
	}

	/**
	 * Pull out keys from a regexp.
	 *
	 * @param  {RegExp} path
	 * @param  {Array}  keys
	 * @return {RegExp}
	 */
	function regexpToRegexp (path, keys, allTokens) {
	  // Use a negative lookahead to match only capturing groups.
	  var groups = path.source.match(/\((?!\?)/g);

	  if (groups) {
	    for (var i = 0; i < groups.length; i++) {
	      keys.push({
	        name:      i,
	        delimiter: null,
	        optional:  false,
	        repeat:    false
	      });
	    }
	  }

	  return attachKeys(path, keys, allTokens);
	}

	/**
	 * Transform an array into a regexp.
	 *
	 * @param  {Array}  path
	 * @param  {Array}  keys
	 * @param  {Object} options
	 * @return {RegExp}
	 */
	function arrayToRegexp (path, keys, options, allTokens) {
	  var parts = [];

	  for (var i = 0; i < path.length; i++) {
	    parts.push(pathToRegexp(path[i], keys, options, allTokens).source);
	  }

	  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
	  return attachKeys(regexp, keys, allTokens);
	}

	/**
	 * Replace the specific tags with regexp strings.
	 *
	 * @param  {String} path
	 * @param  {Array}  keys
	 * @return {String}
	 */
	function replacePath (path, keys, allTokens) {
	  var index = 0;
	  var lastEndIndex = 0;

	  function addLastToken(lastToken) {
	    if (lastEndIndex === 0 && lastToken[0] !== '/') {
	      lastToken = '/' + lastToken;
	    }
	    allTokens.push({
	      string: lastToken
	    });
	  }


	  function replace (match, escaped, prefix, key, capture, group, suffix, escape, offset) {
	    if (escaped) {
	      return escaped;
	    }

	    if (escape) {
	      return '\\' + escape;
	    }

	    var repeat   = suffix === '+' || suffix === '*';
	    var optional = suffix === '?' || suffix === '*';

	    if (offset > lastEndIndex) {
	      addLastToken(path.substring(lastEndIndex, offset));
	    }

	    lastEndIndex = offset + match.length;

	    var newKey = {
	      name:      key || index++,
	      delimiter: prefix || '/',
	      optional:  optional,
	      repeat:    repeat
	    };

	    keys.push(newKey);
	    allTokens.push(newKey);

	    prefix = prefix ? ('\\' + prefix) : '';
	    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

	    if (repeat) {
	      capture = capture + '(?:' + prefix + capture + ')*';
	    }

	    if (optional) {
	      return '(?:' + prefix + '(' + capture + '))?';
	    }

	    // Basic parameter support.
	    return prefix + '(' + capture + ')';
	  }

	  var newPath = path.replace(PATH_REGEXP, replace);

	  if (lastEndIndex < path.length) {
	    addLastToken(path.substring(lastEndIndex));
	  }

	  return newPath;
	}

	/**
	 * Normalize the given path string, returning a regular expression.
	 *
	 * An empty array can be passed in for the keys, which will hold the
	 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
	 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
	 *
	 * @param  {(String|RegExp|Array)} path
	 * @param  {Array}                 [keys]
	 * @param  {Object}                [options]
	 * @return {RegExp}
	 */
	function pathToRegexp (path, keys, options, allTokens) {
	  keys = keys || [];
	  allTokens = allTokens || [];

	  if (!isarray(keys)) {
	    options = keys;
	    keys = [];
	  } else if (!options) {
	    options = {};
	  }

	  if (path instanceof RegExp) {
	    return regexpToRegexp(path, keys, options, allTokens);
	  }

	  if (isarray(path)) {
	    return arrayToRegexp(path, keys, options, allTokens);
	  }

	  var strict = options.strict;
	  var end = options.end !== false;
	  var route = replacePath(path, keys, allTokens);
	  var endsWithSlash = path.charAt(path.length - 1) === '/';

	  // In non-strict mode we allow a slash at the end of match. If the path to
	  // match already ends with a slash, we remove it for consistency. The slash
	  // is valid at the end of a path match, not in the middle. This is important
	  // in non-ending mode, where "/test/" shouldn't match "/test//route".
	  if (!strict) {
	    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
	  }

	  if (end) {
	    route += '$';
	  } else {
	    // In non-ending mode, we need the capturing groups to match as much as
	    // possible by using a positive lookahead to the end or next path segment.
	    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
	  }

	  return attachKeys(new RegExp('^' + route, flags(options)), keys, allTokens);
	}

	var thenDenodeify = function denodeify(fn) {
		return function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments);
			return new Promise(function(resolve, reject) {
				args.push(function(err, res) {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});

				var res = fn.apply(self, args);

				var isPromise = res
					&& (typeof res === 'object' || typeof res === 'function')
					&& typeof res.then === 'function';

				if (isPromise) {
					resolve(res);
				}
			})
		}
	};

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var eventemitter3 = createCommonjsModule(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @api private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {Mixed} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Boolean} exists Only check if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events[evt];

	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];

	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }

	  return ee;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];

	  return this;
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];

	  return this;
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {Mixed} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	         listeners.fn === fn
	      && (!once || listeners.once)
	      && (!context || listeners.context === context)
	    ) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	           listeners[i].fn !== fn
	        || (once && !listeners[i].once)
	        || (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {String|Symbol} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	}
	});

	var strictUriEncode = function (str) {
		return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
			return '%' + c.charCodeAt(0).toString(16).toUpperCase();
		});
	};

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};

	function encoderForArrayFormat(opts) {
		switch (opts.arrayFormat) {
			case 'index':
				return function (key, value, index) {
					return value === null ? [
						encode(key, opts),
						'[',
						index,
						']'
					].join('') : [
						encode(key, opts),
						'[',
						encode(index, opts),
						']=',
						encode(value, opts)
					].join('');
				};

			case 'bracket':
				return function (key, value) {
					return value === null ? encode(key, opts) : [
						encode(key, opts),
						'[]=',
						encode(value, opts)
					].join('');
				};

			default:
				return function (key, value) {
					return value === null ? encode(key, opts) : [
						encode(key, opts),
						'=',
						encode(value, opts)
					].join('');
				};
		}
	}

	function parserForArrayFormat(opts) {
		var result;

		switch (opts.arrayFormat) {
			case 'index':
				return function (key, value, accumulator) {
					result = /\[(\d*)\]$/.exec(key);

					key = key.replace(/\[\d*\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = {};
					}

					accumulator[key][result[1]] = value;
				};

			case 'bracket':
				return function (key, value, accumulator) {
					result = /(\[\])$/.exec(key);
					key = key.replace(/\[\]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					} else if (accumulator[key] === undefined) {
						accumulator[key] = [value];
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};

			default:
				return function (key, value, accumulator) {
					if (accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};
		}
	}

	function encode(value, opts) {
		if (opts.encode) {
			return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
		}

		return value;
	}

	function keysSorter(input) {
		if (Array.isArray(input)) {
			return input.sort();
		} else if (typeof input === 'object') {
			return keysSorter(Object.keys(input)).sort(function (a, b) {
				return Number(a) - Number(b);
			}).map(function (key) {
				return input[key];
			});
		}

		return input;
	}

	var extract = function (str) {
		return str.split('?')[1] || '';
	};

	var parse = function (str, opts) {
		opts = objectAssign({arrayFormat: 'none'}, opts);

		var formatter = parserForArrayFormat(opts);

		// Create an object with no prototype
		// https://github.com/sindresorhus/query-string/issues/47
		var ret = Object.create(null);

		if (typeof str !== 'string') {
			return ret;
		}

		str = str.trim().replace(/^(\?|#|&)/, '');

		if (!str) {
			return ret;
		}

		str.split('&').forEach(function (param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			// Firefox (pre 40) decodes `%3D` to `=`
			// https://github.com/sindresorhus/query-string/pull/37
			var key = parts.shift();
			var val = parts.length > 0 ? parts.join('=') : undefined;

			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val);

			formatter(decodeURIComponent(key), val, ret);
		});

		return Object.keys(ret).sort().reduce(function (result, key) {
			var val = ret[key];
			if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
				// Sort object keys, not values
				result[key] = keysSorter(val);
			} else {
				result[key] = val;
			}

			return result;
		}, Object.create(null));
	};

	var stringify = function (obj, opts) {
		var defaults = {
			encode: true,
			strict: true,
			arrayFormat: 'none'
		};

		opts = objectAssign(defaults, opts);

		var formatter = encoderForArrayFormat(opts);

		return obj ? Object.keys(obj).sort().map(function (key) {
			var val = obj[key];

			if (val === undefined) {
				return '';
			}

			if (val === null) {
				return encode(key, opts);
			}

			if (Array.isArray(val)) {
				var result = [];

				val.slice().forEach(function (val2) {
					if (val2 === undefined) {
						return;
					}

					result.push(formatter(key, val2, result.length));
				});

				return result.join('&');
			}

			return encode(key, opts) + '=' + encode(val, opts);
		}).filter(function (x) {
			return x.length > 0;
		}).join('&') : '';
	};

	var queryString = {
		extract: extract,
		parse: parse,
		stringify: stringify
	};

	var immutable = extend;

	var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

	function extend() {
	    var target = {};

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i];

	        for (var key in source) {
	            if (hasOwnProperty$1.call(source, key)) {
	                target[key] = source[key];
	            }
	        }
	    }

	    return target
	}

	var hashLocation = function HashLocation(window) {
		var emitter = new eventemitter3();
		var last = '';
		var needToDecode = getNeedToDecode();

		window.addEventListener('hashchange', function() {
			if (last !== emitter.get()) {
				last = emitter.get();
				emitter.emit('hashchange');
			}

		});

		function ifRouteIsDifferent(actualNavigateFunction) {
			return function navigate(newPath) {
				if (newPath !== last) {
					actualNavigateFunction(window, newPath);
				}
			}
		}

		emitter.go = ifRouteIsDifferent(go);
		emitter.replace = ifRouteIsDifferent(replace);
		emitter.get = get.bind(null, window, needToDecode);

		return emitter
	};

	function replace(window, newPath) {
		window.location.replace(everythingBeforeTheSlash(window.location.href) + '#' + newPath);
	}

	function everythingBeforeTheSlash(url) {
		var hashIndex = url.indexOf('#');
		return hashIndex === -1 ? url : url.substring(0, hashIndex)
	}

	function go(window, newPath) {
		window.location.hash = newPath;
	}

	function get(window, needToDecode) {
		var hash = removeHashFromPath(window.location.hash);
		return needToDecode ? decodeURI(hash) : hash
	}

	function removeHashFromPath(path) {
		return (path && path[0] === '#') ? path.substr(1) : path
	}

	function getNeedToDecode() {
		var a = document.createElement('a');
		a.href = '#x x';
		return !/x x/.test(a.hash)
	}

	var hashBrownRouter = function Router(opts, hashLocation$$1) {
		var emitter = new eventemitter3();
		if (isHashLocation(opts)) {
			hashLocation$$1 = opts;
			opts = null;
		}

		opts = opts || {};

		if (!hashLocation$$1) {
			hashLocation$$1 = hashLocation(window);
		}

		function onNotFound(path, queryStringParameters) {
			emitter.emit('not found', path, queryStringParameters);
		}

		var routes = [];

		var onHashChange = evaluateCurrentPath.bind(null, routes, hashLocation$$1, !!opts.reverse, onNotFound);

		hashLocation$$1.on('hashchange', onHashChange);

		function stop() {
			hashLocation$$1.removeListener('hashchange', onHashChange);
		}

		emitter.add = add.bind(null, routes);
		emitter.stop = stop;
		emitter.evaluateCurrent = evaluateCurrentPathOrGoToDefault.bind(null, routes, hashLocation$$1, !!opts.reverse, onNotFound);
		emitter.replace = hashLocation$$1.replace;
		emitter.go = hashLocation$$1.go;
		emitter.location = hashLocation$$1;

		return emitter
	};

	function evaluateCurrentPath(routes, hashLocation$$1, reverse, onNotFound) {
		evaluatePath(routes, stripHashFragment(hashLocation$$1.get()), reverse, onNotFound);
	}

	function getPathParts(path) {
		var chunks = path.split('?');
		return {
			path: chunks.shift(),
			queryString: queryString.parse(chunks.join('')),
		}
	}

	function evaluatePath(routes, path, reverse, onNotFound) {
		var pathParts = getPathParts(path);
		path = pathParts.path;
		var queryStringParameters = pathParts.queryString;

		var matchingRoute = find((reverse ? reverseArray(routes) : routes), path);

		if (matchingRoute) {
			var regexResult = matchingRoute.exec(path);
			var routeParameters = makeParametersObjectFromRegexResult(matchingRoute.keys, regexResult);
			var params = immutable(queryStringParameters, routeParameters);
			matchingRoute.fn(params);
		} else {
			onNotFound(path, queryStringParameters);
		}
	}

	function reverseArray(ary) {
		return ary.slice().reverse()
	}

	function makeParametersObjectFromRegexResult(keys, regexResult) {
		return keys.reduce(function(memo, urlKey, index) {
			memo[urlKey.name] = regexResult[index + 1];
			return memo
		}, {})
	}

	function add(routes, routeString, routeFunction) {
		if (typeof routeFunction !== 'function') {
			throw new Error('The router add function must be passed a callback function')
		}
		var newRoute = pathToRegexpWithReversibleKeys(routeString);
		newRoute.fn = routeFunction;
		routes.push(newRoute);
	}

	function evaluateCurrentPathOrGoToDefault(routes, hashLocation$$1, reverse, onNotFound, defaultPath) {
		var currentLocation = stripHashFragment(hashLocation$$1.get());
		var canUseCurrentLocation = currentLocation && (currentLocation !== '/' || defaultPath === '/');

		if (canUseCurrentLocation) {
			var routesCopy = routes.slice();
			evaluateCurrentPath(routesCopy, hashLocation$$1, reverse, onNotFound);
		} else {
			hashLocation$$1.go(defaultPath);
		}
	}

	var urlWithoutHashFragmentRegex = /^([^#]*)(:?#.*)?$/;
	function stripHashFragment(url) {
		var match = url.match(urlWithoutHashFragmentRegex);
		return match ? match[1] : ''
	}

	function isHashLocation(hashLocation$$1) {
		return hashLocation$$1 && hashLocation$$1.go && hashLocation$$1.replace && hashLocation$$1.on
	}

	function find(aryOfRegexes, str) {
		for (var i = 0; i < aryOfRegexes.length; ++i) {
			if (str.match(aryOfRegexes[i])) {
				return aryOfRegexes[i]
			}
		}
	}

	// This file to be replaced with an official implementation maintained by
	// the page.js crew if and when that becomes an option



	var pathParser = function(pathString) {
		var parseResults = pathToRegexpWithReversibleKeys(pathString);

		// The only reason I'm returning a new object instead of the results of the pathToRegexp
		// function is so that if the official implementation ends up returning an
		// allTokens-style array via some other mechanism, I may be able to change this file
		// without having to change the rest of the module in index.js
		return {
			regex: parseResults,
			allTokens: parseResults.allTokens
		}
	};

	var stringifyQuerystring = queryString.stringify;

	var pagePathBuilder = function(pathStr, parameters) {
		var parsed = typeof pathStr === 'string' ? pathParser(pathStr) : pathStr;
		var allTokens = parsed.allTokens;
		var regex = parsed.regex;

		if (parameters) {
			var path = allTokens.map(function(bit) {
				if (bit.string) {
					return bit.string
				}

				var defined = typeof parameters[bit.name] !== 'undefined';
				if (!bit.optional && !defined) {
					throw new Error('Must supply argument ' + bit.name + ' for path ' + pathStr)
				}

				return defined ? (bit.delimiter + encodeURIComponent(parameters[bit.name])) : ''
			}).join('');

			if (!regex.test(path)) {
				throw new Error('Provided arguments do not match the original arguments')
			}

			return buildPathWithQuerystring(path, parameters, allTokens)
		} else {
			return parsed
		}
	};

	function buildPathWithQuerystring(path, parameters, tokenArray) {
		var parametersInQuerystring = getParametersWithoutMatchingToken(parameters, tokenArray);

		if (Object.keys(parametersInQuerystring).length === 0) {
			return path
		}

		return path + '?' + stringifyQuerystring(parametersInQuerystring)
	}

	function getParametersWithoutMatchingToken(parameters, tokenArray) {
		var tokenHash = tokenArray.reduce(function(memo, bit) {
			if (!bit.string) {
				memo[bit.name] = bit;
			}
			return memo
		}, {});

		return Object.keys(parameters).filter(function(param) {
			return !tokenHash[param]
		}).reduce(function(newParameters, param) {
			newParameters[param] = parameters[param];
			return newParameters
		}, {})
	}

	var browser = function (fn) {
	  typeof setImmediate === 'function' ?
	    setImmediate(fn) :
	    setTimeout(fn, 0);
	};

	function _interopDefault$1 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

	var combineArrays$1 = _interopDefault$1(combineArrays);
	var pathToRegexpWithReversibleKeys$1 = _interopDefault$1(pathToRegexpWithReversibleKeys);
	var thenDenodeify$1 = _interopDefault$1(thenDenodeify);
	var eventemitter3$1 = _interopDefault$1(eventemitter3);
	var hashBrownRouter$1 = _interopDefault$1(hashBrownRouter);
	var pagePathBuilder$1 = _interopDefault$1(pagePathBuilder);
	var isoNextTick = _interopDefault$1(browser);

	function createCommonjsModule$1(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var stateStringParser = createCommonjsModule$1(function (module) {
		module.exports = function (stateString) {
			return stateString.split('.').reduce(function (stateNames, latestNameChunk) {
				stateNames.push(stateNames.length ? stateNames[stateNames.length - 1] + '.' + latestNameChunk : latestNameChunk);

				return stateNames;
			}, []);
		};
	});

	var stateState = function StateState() {
		var states = {};

		function getHierarchy(name) {
			var names = stateStringParser(name);

			return names.map(function (name) {
				if (!states[name]) {
					throw new Error('State ' + name + ' not found');
				}
				return states[name];
			});
		}

		function getParent(name) {
			var parentName = getParentName(name);

			return parentName && states[parentName];
		}

		function getParentName(name) {
			var names = stateStringParser(name);

			if (names.length > 1) {
				var secondToLast = names.length - 2;

				return names[secondToLast];
			} else {
				return null;
			}
		}

		function guaranteeAllStatesExist(newStateName) {
			var stateNames = stateStringParser(newStateName);
			var statesThatDontExist = stateNames.filter(function (name) {
				return !states[name];
			});

			if (statesThatDontExist.length > 0) {
				throw new Error('State ' + statesThatDontExist[statesThatDontExist.length - 1] + ' does not exist');
			}
		}

		function buildFullStateRoute(stateName) {
			return getHierarchy(stateName).map(function (state) {
				return '/' + (state.route || '');
			}).join('').replace(/\/{2,}/g, '/');
		}

		function applyDefaultChildStates(stateName) {
			var state = states[stateName];

			var defaultChildStateName = state && (typeof state.defaultChild === 'function' ? state.defaultChild() : state.defaultChild);

			if (!defaultChildStateName) {
				return stateName;
			}

			var fullStateName = stateName + '.' + defaultChildStateName;

			return applyDefaultChildStates(fullStateName);
		}

		return {
			add: function add(name, state) {
				states[name] = state;
			},
			get: function get(name) {
				return name && states[name];
			},

			getHierarchy: getHierarchy,
			getParent: getParent,
			getParentName: getParentName,
			guaranteeAllStatesExist: guaranteeAllStatesExist,
			buildFullStateRoute: buildFullStateRoute,
			applyDefaultChildStates: applyDefaultChildStates
		};
	};

	var extend$1 = function extend() {
	  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	    args[_key] = arguments[_key];
	  }

	  return Object.assign.apply(Object, [{}].concat(args));
	};

	var stateComparison_1 = function StateComparison(stateState) {
		var getPathParameters = pathParameters();

		var parametersChanged = function parametersChanged(args) {
			return parametersThatMatterWereChanged(extend$1(args, { stateState: stateState, getPathParameters: getPathParameters }));
		};

		return function (args) {
			return stateComparison(extend$1(args, { parametersChanged: parametersChanged }));
		};
	};

	function pathParameters() {
		var parameters = {};

		return function (path) {
			if (!path) {
				return [];
			}

			if (!parameters[path]) {
				parameters[path] = pathToRegexpWithReversibleKeys$1(path).keys.map(function (key) {
					return key.name;
				});
			}

			return parameters[path];
		};
	}

	function parametersThatMatterWereChanged(_ref) {
		var stateState = _ref.stateState,
		    getPathParameters = _ref.getPathParameters,
		    stateName = _ref.stateName,
		    fromParameters = _ref.fromParameters,
		    toParameters = _ref.toParameters;

		var state = stateState.get(stateName);
		var querystringParameters = state.querystringParameters || [];
		var parameters = getPathParameters(state.route).concat(querystringParameters);

		return Array.isArray(parameters) && parameters.some(function (key) {
			return fromParameters[key] !== toParameters[key];
		});
	}

	function stateComparison(_ref2) {
		var parametersChanged = _ref2.parametersChanged,
		    original = _ref2.original,
		    destination = _ref2.destination;

		var states = combineArrays$1({
			start: stateStringParser(original.name),
			end: stateStringParser(destination.name)
		});

		return states.map(function (_ref3) {
			var start = _ref3.start,
			    end = _ref3.end;
			return {
				nameBefore: start,
				nameAfter: end,
				stateNameChanged: start !== end,
				stateParametersChanged: start === end && parametersChanged({
					stateName: start,
					fromParameters: original.parameters,
					toParameters: destination.parameters
				})
			};
		});
	}

	var currentState = function CurrentState() {
		var current = {
			name: '',
			parameters: {}
		};

		return {
			get: function get() {
				return current;
			},
			set: function set(name, parameters) {
				current = {
					name: name,
					parameters: parameters
				};
			}
		};
	};

	var stateChangeLogic = function stateChangeLogic(stateComparisonResults) {
		var hitChangingState = false;
		var hitDestroyedState = false;

		var output = {
			destroy: [],
			change: [],
			create: []
		};

		stateComparisonResults.forEach(function (state) {
			hitChangingState = hitChangingState || state.stateParametersChanged;
			hitDestroyedState = hitDestroyedState || state.stateNameChanged;

			if (state.nameBefore) {
				if (hitDestroyedState) {
					output.destroy.push(state.nameBefore);
				} else if (hitChangingState) {
					output.change.push(state.nameBefore);
				}
			}

			if (state.nameAfter && hitDestroyedState) {
				output.create.push(state.nameAfter);
			}
		});

		return output;
	};

	var stateTransitionManager = function stateTransitionManager(emitter) {
		var currentTransitionAttempt = null;
		var nextTransition = null;

		function doneTransitioning() {
			currentTransitionAttempt = null;
			if (nextTransition) {
				beginNextTransitionAttempt();
			}
		}

		var isTransitioning = function isTransitioning() {
			return !!currentTransitionAttempt;
		};

		function beginNextTransitionAttempt() {
			currentTransitionAttempt = nextTransition;
			nextTransition = null;
			currentTransitionAttempt.beginStateChange();
		}

		function cancelCurrentTransition() {
			currentTransitionAttempt.transition.cancelled = true;
			var err = new Error('State transition cancelled by the state transition manager');
			err.wasCancelledBySomeoneElse = true;
			emitter.emit('stateChangeCancelled', err);
		}

		emitter.on('stateChangeAttempt', function (beginStateChange) {
			nextTransition = createStateTransitionAttempt(beginStateChange);

			if (isTransitioning() && currentTransitionAttempt.transition.cancellable) {
				cancelCurrentTransition();
			} else if (!isTransitioning()) {
				beginNextTransitionAttempt();
			}
		});

		emitter.on('stateChangeError', doneTransitioning);
		emitter.on('stateChangeCancelled', doneTransitioning);
		emitter.on('stateChangeEnd', doneTransitioning);

		function createStateTransitionAttempt(_beginStateChange) {
			var transition = {
				cancelled: false,
				cancellable: true
			};
			return {
				transition: transition,
				beginStateChange: function beginStateChange() {
					for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
						args[_key] = arguments[_key];
					}

					return _beginStateChange.apply(undefined, [transition].concat(args));
				}
			};
		}
	};

	var defaultRouterOptions = { reverse: false };

	// Pulled from https://github.com/joliss/promise-map-series and prettied up a bit

	var promiseMapSeries = function sequence(array, iterator) {
		var currentPromise = Promise.resolve();
		return Promise.all(array.map(function (value, i) {
			return currentPromise = currentPromise.then(function () {
				return iterator(value, i, array);
			});
		}));
	};

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var getProperty = function getProperty(name) {
		return function (obj) {
			return obj[name];
		};
	};
	var reverse = function reverse(ary) {
		return ary.slice().reverse();
	};
	var isFunction = function isFunction(property) {
		return function (obj) {
			return typeof obj[property] === 'function';
		};
	};
	var isThenable = function isThenable(object) {
		return object && ((typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' || typeof object === 'function') && typeof object.then === 'function';
	};
	var promiseMe = function promiseMe(fn) {
		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		return new Promise(function (resolve) {
			return resolve(fn.apply(undefined, args));
		});
	};

	var expectedPropertiesOfAddState = ['name', 'route', 'defaultChild', 'data', 'template', 'resolve', 'activate', 'querystringParameters', 'defaultQuerystringParameters', 'defaultParameters'];

	var abstractStateRouter = function StateProvider(makeRenderer, rootElement) {
		var stateRouterOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

		var prototypalStateHolder = stateState();
		var lastCompletelyLoadedState = currentState();
		var lastStateStartedActivating = currentState();
		var stateProviderEmitter = new eventemitter3$1();
		var compareStartAndEndStates = stateComparison_1(prototypalStateHolder);

		var stateNameToArrayofStates = function stateNameToArrayofStates(stateName) {
			return stateStringParser(stateName).map(prototypalStateHolder.get);
		};

		stateTransitionManager(stateProviderEmitter);

		var _extend = extend$1({
			throwOnError: true,
			pathPrefix: '#'
		}, stateRouterOptions),
		    throwOnError = _extend.throwOnError,
		    pathPrefix = _extend.pathPrefix;

		var router = stateRouterOptions.router || hashBrownRouter$1(defaultRouterOptions);

		router.on('not found', function (route, parameters) {
			stateProviderEmitter.emit('routeNotFound', route, parameters);
		});

		var destroyDom = null;
		var getDomChild = null;
		var renderDom = null;
		var resetDom = null;

		var activeStateResolveContent = {};
		var activeDomApis = {};
		var activeEmitters = {};

		function handleError(event, err) {
			isoNextTick(function () {
				stateProviderEmitter.emit(event, err);
				console.error(event + ' - ' + err.message);
				if (throwOnError) {
					throw err;
				}
			});
		}

		function destroyStateName(stateName) {
			var state = prototypalStateHolder.get(stateName);
			stateProviderEmitter.emit('beforeDestroyState', {
				state: state,
				domApi: activeDomApis[stateName]
			});

			activeEmitters[stateName].emit('destroy');
			activeEmitters[stateName].removeAllListeners();
			delete activeEmitters[stateName];
			delete activeStateResolveContent[stateName];

			return destroyDom(activeDomApis[stateName]).then(function () {
				delete activeDomApis[stateName];
				stateProviderEmitter.emit('afterDestroyState', {
					state: state
				});
			});
		}

		function resetStateName(parameters, stateName) {
			var domApi = activeDomApis[stateName];
			var content = getContentObject(activeStateResolveContent, stateName);
			var state = prototypalStateHolder.get(stateName);

			stateProviderEmitter.emit('beforeResetState', {
				domApi: domApi,
				content: content,
				state: state,
				parameters: parameters
			});

			activeEmitters[stateName].emit('destroy');
			delete activeEmitters[stateName];

			return resetDom({
				domApi: domApi,
				content: content,
				template: state.template,
				parameters: parameters
			}).then(function (newDomApi) {
				if (newDomApi) {
					activeDomApis[stateName] = newDomApi;
				}

				stateProviderEmitter.emit('afterResetState', {
					domApi: activeDomApis[stateName],
					content: content,
					state: state,
					parameters: parameters
				});
			});
		}

		function getChildElementForStateName(stateName) {
			return new Promise(function (resolve) {
				var parent = prototypalStateHolder.getParent(stateName);
				if (parent) {
					var parentDomApi = activeDomApis[parent.name];
					resolve(getDomChild(parentDomApi));
				} else {
					resolve(rootElement);
				}
			});
		}

		function renderStateName(parameters, stateName) {
			return getChildElementForStateName(stateName).then(function (element) {
				var state = prototypalStateHolder.get(stateName);
				var content = getContentObject(activeStateResolveContent, stateName);

				stateProviderEmitter.emit('beforeCreateState', {
					state: state,
					content: content,
					parameters: parameters
				});

				return renderDom({
					template: state.template,
					element: element,
					content: content,
					parameters: parameters
				}).then(function (domApi) {
					activeDomApis[stateName] = domApi;
					stateProviderEmitter.emit('afterCreateState', {
						state: state,
						domApi: domApi,
						content: content,
						parameters: parameters
					});
					return domApi;
				});
			});
		}

		function renderAll(stateNames, parameters) {
			return promiseMapSeries(stateNames, function (stateName) {
				return renderStateName(parameters, stateName);
			});
		}

		function onRouteChange(state, parameters) {
			try {
				var finalDestinationStateName = prototypalStateHolder.applyDefaultChildStates(state.name);

				if (finalDestinationStateName === state.name) {
					emitEventAndAttemptStateChange(finalDestinationStateName, parameters);
				} else {
					// There are default child states that need to be applied

					var theRouteWeNeedToEndUpAt = makePath(finalDestinationStateName, parameters);
					var currentRoute = router.location.get();

					if (theRouteWeNeedToEndUpAt === currentRoute) {
						// the child state has the same route as the current one, just start navigating there
						emitEventAndAttemptStateChange(finalDestinationStateName, parameters);
					} else {
						// change the url to match the full default child state route
						stateProviderEmitter.go(finalDestinationStateName, parameters, { replace: true });
					}
				}
			} catch (err) {
				handleError('stateError', err);
			}
		}

		function addState(state) {
			if (typeof state === 'undefined') {
				throw new Error('Expected \'state\' to be passed in.');
			} else if (typeof state.name === 'undefined') {
				throw new Error('Expected the \'name\' option to be passed in.');
			} else if (typeof state.template === 'undefined') {
				throw new Error('Expected the \'template\' option to be passed in.');
			}
			Object.keys(state).filter(function (key) {
				return expectedPropertiesOfAddState.indexOf(key) === -1;
			}).forEach(function (key) {
				console.warn('Unexpected property passed to addState:', key);
			});

			prototypalStateHolder.add(state.name, state);

			var route = prototypalStateHolder.buildFullStateRoute(state.name);

			router.add(route, function (parameters) {
				return onRouteChange(state, parameters);
			});
		}

		function getStatesToResolve(stateChanges) {
			return stateChanges.change.concat(stateChanges.create).map(prototypalStateHolder.get);
		}

		function emitEventAndAttemptStateChange(newStateName, parameters) {
			stateProviderEmitter.emit('stateChangeAttempt', function stateGo(transition) {
				attemptStateChange(newStateName, parameters, transition);
			});
		}

		function attemptStateChange(newStateName, parameters, transition) {
			function ifNotCancelled(fn) {
				return function () {
					if (transition.cancelled) {
						var err = new Error('The transition to ' + newStateName + ' was cancelled');
						err.wasCancelledBySomeoneElse = true;
						throw err;
					} else {
						return fn.apply(undefined, arguments);
					}
				};
			}

			return promiseMe(prototypalStateHolder.guaranteeAllStatesExist, newStateName).then(function applyDefaultParameters() {
				var state = prototypalStateHolder.get(newStateName);
				var defaultParams = state.defaultParameters || state.defaultQuerystringParameters || {};
				var needToApplyDefaults = Object.keys(defaultParams).some(function missingParameterValue(param) {
					return typeof parameters[param] === 'undefined';
				});

				if (needToApplyDefaults) {
					throw redirector(newStateName, extend$1(defaultParams, parameters));
				}
				return state;
			}).then(ifNotCancelled(function (state) {
				stateProviderEmitter.emit('stateChangeStart', state, parameters, stateNameToArrayofStates(state.name));
				lastStateStartedActivating.set(state.name, parameters);
			})).then(function getStateChanges() {
				var stateComparisonResults = compareStartAndEndStates({
					original: lastCompletelyLoadedState.get(),
					destination: {
						name: newStateName,
						parameters: parameters
					}
				});
				return stateChangeLogic(stateComparisonResults); // { destroy, change, create }
			}).then(ifNotCancelled(function resolveDestroyAndActivateStates(stateChanges) {
				return resolveStates(getStatesToResolve(stateChanges), extend$1(parameters)).catch(function onResolveError(e) {
					e.stateChangeError = true;
					throw e;
				}).then(ifNotCancelled(function destroyAndActivate(stateResolveResultsObject) {
					transition.cancellable = false;

					var activateAll = function activateAll() {
						return activateStates(stateChanges.change.concat(stateChanges.create));
					};

					activeStateResolveContent = extend$1(activeStateResolveContent, stateResolveResultsObject);

					return promiseMapSeries(reverse(stateChanges.destroy), destroyStateName).then(function () {
						return promiseMapSeries(reverse(stateChanges.change), function (stateName) {
							return resetStateName(extend$1(parameters), stateName);
						});
					}).then(function () {
						return renderAll(stateChanges.create, extend$1(parameters)).then(activateAll);
					});
				}));

				function activateStates(stateNames) {
					return stateNames.map(prototypalStateHolder.get).forEach(function (state) {
						var emitter = new eventemitter3$1();
						var context = Object.create(emitter);
						context.domApi = activeDomApis[state.name];
						context.data = state.data;
						context.parameters = parameters;
						context.content = getContentObject(activeStateResolveContent, state.name);
						activeEmitters[state.name] = emitter;

						try {
							state.activate && state.activate(context);
						} catch (e) {
							isoNextTick(function () {
								throw e;
							});
						}
					});
				}
			})).then(function stateChangeComplete() {
				lastCompletelyLoadedState.set(newStateName, parameters);
				try {
					stateProviderEmitter.emit('stateChangeEnd', prototypalStateHolder.get(newStateName), parameters, stateNameToArrayofStates(newStateName));
				} catch (e) {
					handleError('stateError', e);
				}
			}).catch(ifNotCancelled(function handleStateChangeError(err) {
				if (err && err.redirectTo) {
					stateProviderEmitter.emit('stateChangeCancelled', err);
					return stateProviderEmitter.go(err.redirectTo.name, err.redirectTo.params, { replace: true });
				} else if (err) {
					handleError('stateChangeError', err);
				}
			})).catch(function handleCancellation(err) {
				if (err && err.wasCancelledBySomeoneElse) ; else {
					throw new Error('This probably shouldn\'t happen, maybe file an issue or something ' + err);
				}
			});
		}

		function makePath(stateName, parameters, options) {
			function getGuaranteedPreviousState() {
				if (!lastStateStartedActivating.get().name) {
					throw new Error('makePath required a previous state to exist, and none was found');
				}
				return lastStateStartedActivating.get();
			}
			if (options && options.inherit) {
				parameters = extend$1(getGuaranteedPreviousState().parameters, parameters);
			}

			var destinationStateName = stateName === null ? getGuaranteedPreviousState().name : stateName;

			var destinationState = prototypalStateHolder.get(destinationStateName) || {};
			var defaultParams = destinationState.defaultParameters || destinationState.defaultQuerystringParameters;

			parameters = extend$1(defaultParams, parameters);

			prototypalStateHolder.guaranteeAllStatesExist(destinationStateName);
			var route = prototypalStateHolder.buildFullStateRoute(destinationStateName);
			return pagePathBuilder$1(route, parameters || {});
		}

		var defaultOptions = {
			replace: false
		};

		stateProviderEmitter.addState = addState;
		stateProviderEmitter.go = function (newStateName, parameters, options) {
			options = extend$1(defaultOptions, options);
			var goFunction = options.replace ? router.replace : router.go;

			return promiseMe(makePath, newStateName, parameters, options).then(goFunction, function (err) {
				return handleError('stateChangeError', err);
			});
		};
		stateProviderEmitter.evaluateCurrentRoute = function (defaultState, defaultParams) {
			return promiseMe(makePath, defaultState, defaultParams).then(function (defaultPath) {
				router.evaluateCurrent(defaultPath);
			}).catch(function (err) {
				return handleError('stateError', err);
			});
		};
		stateProviderEmitter.makePath = function (stateName, parameters, options) {
			return pathPrefix + makePath(stateName, parameters, options);
		};
		stateProviderEmitter.getActiveState = function () {
			return lastCompletelyLoadedState.get();
		};
		stateProviderEmitter.stateIsActive = function (stateName) {
			var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			var currentState$$1 = lastCompletelyLoadedState.get();
			var stateNameMatches = currentState$$1.name === stateName || currentState$$1.name.indexOf(stateName + '.') === 0;
			var parametersWereNotPassedIn = !parameters;

			return stateNameMatches && (parametersWereNotPassedIn || Object.keys(parameters).every(function (key) {
				return parameters[key] === currentState$$1.parameters[key];
			}));
		};

		var renderer = makeRenderer(stateProviderEmitter);

		destroyDom = thenDenodeify$1(renderer.destroy);
		getDomChild = thenDenodeify$1(renderer.getChildElement);
		renderDom = thenDenodeify$1(renderer.render);
		resetDom = thenDenodeify$1(renderer.reset);

		return stateProviderEmitter;
	};

	function getContentObject(stateResolveResultsObject, stateName) {
		var allPossibleResolvedStateNames = stateStringParser(stateName);

		return allPossibleResolvedStateNames.filter(function (stateName) {
			return stateResolveResultsObject[stateName];
		}).reduce(function (obj, stateName) {
			return extend$1(obj, stateResolveResultsObject[stateName]);
		}, {});
	}

	function redirector(newStateName, parameters) {
		return {
			redirectTo: {
				name: newStateName,
				params: parameters
			}
		};
	}

	// { [stateName]: resolveResult }
	function resolveStates(states, parameters) {
		var statesWithResolveFunctions = states.filter(isFunction('resolve'));
		var stateNamesWithResolveFunctions = statesWithResolveFunctions.map(getProperty('name'));

		var resolves = Promise.all(statesWithResolveFunctions.map(function (state) {
			return new Promise(function (resolve, reject) {
				var resolveCb = function resolveCb(err, content) {
					return err ? reject(err) : resolve(content);
				};

				resolveCb.redirect = function (newStateName, parameters) {
					reject(redirector(newStateName, parameters));
				};

				var res = state.resolve(state.data, parameters, resolveCb);
				if (isThenable(res)) {
					resolve(res);
				}
			});
		}));

		return resolves.then(function (resolveResults) {
			return combineArrays$1({
				stateName: stateNamesWithResolveFunctions,
				resolveResult: resolveResults
			}).reduce(function (obj, result) {
				obj[result.stateName] = result.resolveResult;
				return obj;
			}, {});
		});
	}

	var bundle = abstractStateRouter;

	var deepmerge = createCommonjsModule(function (module, exports) {
	(function (root, factory) {
	    {
	        module.exports = factory();
	    }
	}(commonjsGlobal, function () {

	function isMergeableObject(val) {
	    var nonNullObject = val && typeof val === 'object';

	    return nonNullObject
	        && Object.prototype.toString.call(val) !== '[object RegExp]'
	        && Object.prototype.toString.call(val) !== '[object Date]'
	}

	function emptyTarget(val) {
	    return Array.isArray(val) ? [] : {}
	}

	function cloneIfNecessary(value, optionsArgument) {
	    var clone = optionsArgument && optionsArgument.clone === true;
	    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
	}

	function defaultArrayMerge(target, source, optionsArgument) {
	    var destination = target.slice();
	    source.forEach(function(e, i) {
	        if (typeof destination[i] === 'undefined') {
	            destination[i] = cloneIfNecessary(e, optionsArgument);
	        } else if (isMergeableObject(e)) {
	            destination[i] = deepmerge(target[i], e, optionsArgument);
	        } else if (target.indexOf(e) === -1) {
	            destination.push(cloneIfNecessary(e, optionsArgument));
	        }
	    });
	    return destination
	}

	function mergeObject(target, source, optionsArgument) {
	    var destination = {};
	    if (isMergeableObject(target)) {
	        Object.keys(target).forEach(function (key) {
	            destination[key] = cloneIfNecessary(target[key], optionsArgument);
	        });
	    }
	    Object.keys(source).forEach(function (key) {
	        if (!isMergeableObject(source[key]) || !target[key]) {
	            destination[key] = cloneIfNecessary(source[key], optionsArgument);
	        } else {
	            destination[key] = deepmerge(target[key], source[key], optionsArgument);
	        }
	    });
	    return destination
	}

	function deepmerge(target, source, optionsArgument) {
	    var array = Array.isArray(source);
	    var options = optionsArgument || { arrayMerge: defaultArrayMerge };
	    var arrayMerge = options.arrayMerge || defaultArrayMerge;

	    if (array) {
	        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
	    } else {
	        return mergeObject(target, source, optionsArgument)
	    }
	}

	deepmerge.all = function deepmergeAll(array, optionsArgument) {
	    if (!Array.isArray(array) || array.length < 2) {
	        throw new Error('first argument should be an array with at least two elements')
	    }

	    // we are sure there are at least 2 values, so it is safe to have no initial value
	    return array.reduce(function(prev, next) {
	        return deepmerge(prev, next, optionsArgument)
	    })
	};

	return deepmerge

	}));
	});

	var bundle$1 = function SvelteStateRendererFactory() {
		var defaultOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		return function makeRenderer(stateRouter) {
			var asr = {
				makePath: stateRouter.makePath,
				stateIsActive: stateRouter.stateIsActive
			};

			function render(context, cb) {
				var target = context.element,
				    template = context.template,
				    content = context.content;


				var rendererSuppliedOptions = deepmerge(defaultOptions, {
					target: target,
					data: Object.assign(content, defaultOptions.data, { asr: asr })
				});

				function construct(component, options) {
					return options.methods ? instantiateWithMethods(component, options, options.methods) : new component(options);
				}

				var svelte = void 0;

				try {
					if (typeof template === "function") {
						svelte = construct(template, rendererSuppliedOptions);
					} else {
						var options = deepmerge(rendererSuppliedOptions, template.options);

						svelte = construct(template.component, options);
					}
				} catch (e) {
					cb(e);
					return;
				}

				function onRouteChange() {
					svelte.set({
						asr: asr
					});
				}

				stateRouter.on("stateChangeEnd", onRouteChange);

				svelte.on("destroy", function () {
					stateRouter.removeListener("stateChangeEnd", onRouteChange);
				});

				svelte.mountedToTarget = target;
				cb(null, svelte);
			}

			return {
				render: render,
				reset: function reset(context, cb) {
					var svelte = context.domApi;
					var element = svelte.mountedToTarget;

					svelte.destroy();

					var renderContext = Object.assign({ element: element }, context);

					render(renderContext, cb);
				},
				destroy: function destroy(svelte, cb) {
					svelte.destroy();
					cb();
				},
				getChildElement: function getChildElement(svelte, cb) {
					try {
						var element = svelte.mountedToTarget;
						var child = element.querySelector("uiView");
						cb(null, child);
					} catch (e) {
						cb(e);
					}
				}
			};
		};
	};

	function instantiateWithMethods(Component, options, methods) {
		// const coolPrototype = Object.assign(Object.create(Component.prototype), methods)
		// return Component.call(coolPrototype, options)
		return Object.assign(new Component(options), methods);
	}

	var mannish = function createMediator() {
		const providers = Object.create(null);

		return {
			provide(name, fn) {
				if (typeof fn !== `function`) {
					throw new Error(`${ fn } is not a function`)
				} else if (typeof name !== `string`) {
					throw new Error(`The provider name must be a string`)
				} else if (providers[name]) {
					throw new Error(`There is already a provider for "${ name }"`)
				} else {
					providers[name] = fn;
				}

				let removed = false;
				return () => {
					if (!removed) {
						delete providers[name];
						removed = true;
					}
				}
			},
			call(name, ...args) {
				if (providers[name]) {
					return providers[name](...args)
				} else {
					throw new Error(`No provider found for "${ name }"`)
				}
			},
		}
	};

	var es5 = function createStateWatcher(stateRouter) {
		var currentDomApis = {};
		var currentAttachListeners = [];
		var currentDetachListeners = [];

		function attachToState(_ref) {
			var state = _ref.state,
			    domApi = _ref.domApi;

			currentDomApis[state.name] = domApi;
			currentAttachListeners.forEach(function (fn) {
				return fn(domApi);
			});
		}

		function detachFromState(_ref2) {
			var state = _ref2.state,
			    domApi = _ref2.domApi;

			if (!currentDomApis[state.name]) {
				console.error('detaching, but no current dom api for that name was found');
			}
			currentDetachListeners.forEach(function (fn) {
				return fn(domApi);
			});
			delete currentDomApis[state.name];
		}

		stateRouter.on('afterCreateState', attachToState);
		stateRouter.on('afterResetState', attachToState);

		stateRouter.on('beforeResetState', detachFromState);
		stateRouter.on('beforeDestroyState', detachFromState);

		function addDomApiAttachListener(attachListener) {
			Object.keys(currentDomApis).forEach(function (stateName) {
				return attachListener(currentDomApis[stateName]);
			});

			return addToArrayAndReturnRemover(currentAttachListeners, attachListener);
		}

		function addDomApiDetachListener(detachListener) {
			return addToArrayAndReturnRemover(currentDetachListeners, detachListener);
		}

		return {
			addDomApiAttachListener: addDomApiAttachListener,
			addDomApiDetachListener: addDomApiDetachListener
		};
	};

	function addToArrayAndReturnRemover(ary, thingy) {
		ary.push(thingy);

		return function removeListener() {
			var index = ary.indexOf(thingy);
			if (index !== -1) {
				ary.splice(index, 1);
			}
		};
	}

	function noop() {}

	function assign(tar, src) {
		for (var k in src) tar[k] = src[k];
		return tar;
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor);
	}

	function detachNode(node) {
		node.parentNode.removeChild(node);
	}

	function destroyEach(iterations, detach) {
		for (var i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detach);
		}
	}

	function createElement(name) {
		return document.createElement(name);
	}

	function createText(data) {
		return document.createTextNode(data);
	}

	function createComment() {
		return document.createComment('');
	}

	function addListener(node, event, handler, options) {
		node.addEventListener(event, handler, options);
	}

	function removeListener(node, event, handler, options) {
		node.removeEventListener(event, handler, options);
	}

	function setAttribute(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function setData(text, data) {
		text.data = '' + data;
	}

	function setStyle(node, key, value) {
		node.style.setProperty(key, value);
	}

	function blankObject() {
		return Object.create(null);
	}

	function destroy(detach) {
		this.destroy = noop;
		this.fire('destroy');
		this.set = noop;

		this._fragment.d(detach !== false);
		this._fragment = null;
		this._state = {};
	}

	function _differs(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function fire(eventName, data) {
		var handlers =
			eventName in this._handlers && this._handlers[eventName].slice();
		if (!handlers) return;

		for (var i = 0; i < handlers.length; i += 1) {
			var handler = handlers[i];

			if (!handler.__calling) {
				try {
					handler.__calling = true;
					handler.call(this, data);
				} finally {
					handler.__calling = false;
				}
			}
		}
	}

	function flush(component) {
		component._lock = true;
		callAll(component._beforecreate);
		callAll(component._oncreate);
		callAll(component._aftercreate);
		component._lock = false;
	}

	function get$1() {
		return this._state;
	}

	function init(component, options) {
		component._handlers = blankObject();
		component._slots = blankObject();
		component._bind = options._bind;
		component._staged = {};

		component.options = options;
		component.root = options.root || component;
		component.store = options.store || component.root.store;

		if (!options.root) {
			component._beforecreate = [];
			component._oncreate = [];
			component._aftercreate = [];
		}
	}

	function on(eventName, handler) {
		var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
		handlers.push(handler);

		return {
			cancel: function() {
				var index = handlers.indexOf(handler);
				if (~index) handlers.splice(index, 1);
			}
		};
	}

	function set(newState) {
		this._set(assign({}, newState));
		if (this.root._lock) return;
		flush(this.root);
	}

	function _set(newState) {
		var oldState = this._state,
			changed = {},
			dirty = false;

		newState = assign(this._staged, newState);
		this._staged = {};

		for (var key in newState) {
			if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
		}
		if (!dirty) return;

		this._state = assign(assign({}, oldState), newState);
		this._recompute(changed, this._state);
		if (this._bind) this._bind(changed, this._state);

		if (this._fragment) {
			this.fire("state", { changed: changed, current: this._state, previous: oldState });
			this._fragment.p(changed, this._state);
			this.fire("update", { changed: changed, current: this._state, previous: oldState });
		}
	}

	function _stage(newState) {
		assign(this._staged, newState);
	}

	function callAll(fns) {
		while (fns && fns.length) fns.shift()();
	}

	function _mount(target, anchor) {
		this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
	}

	var proto = {
		destroy,
		get: get$1,
		fire,
		on,
		set,
		_recompute: noop,
		_set,
		_stage,
		_mount,
		_differs
	};

	var basicXhr = function makeXhrFunction(inputOptions) {
		var options = Object.assign({
			method: 'GET',
			success: defaultSuccess,
			parse: defaultParse,
			serialize: defaultSerialize,
			headers: {},
		}, inputOptions);

		return function xhr(url, body) {
			return new Promise(function promise(resolve, reject) {
				var request = new XMLHttpRequest();
				request.addEventListener('load', handleResult);
				request.addEventListener('error', reject);
				request.addEventListener('abort', reject);
				request.open(options.method, url);

				Object.keys(options.headers).forEach(function(key) {
					request.setRequestHeader(key, options.headers[key]);
				});

				if (typeof body === 'undefined') {
					request.send();
				} else {
					request.send(options.serialize(body));
				}

				function handleResult() {
					try {
						var response = options.parse(request);

						options.success(request) ? resolve(response) : reject(response);
					} catch (e) {
						reject(e);
					}
				}
			})
		}
	};

	function defaultSuccess(request) {
		return request.status >= 200 && request.status < 400
	}

	function defaultSerialize(body) {
		return JSON.stringify(body)
	}

	function defaultParse(request) {
		return JSON.parse(request.responseText)
	}

	function createCommonjsModule$2(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var urlBuilder = {
		buildIndexUrl: function buildIndexUrl(key) {
			return "https://spreadsheets.google.com/feeds/worksheets/" + key + "/public/basic?alt=json";
		},
		buildSheetUrl: function buildSheetUrl(key, sheetId) {
			return "https://spreadsheets.google.com/feeds/list/" + key + "/" + sheetId + "/public/values?alt=json";
		}
	};

	var orderedEntries = function orderedEntries(o) {
		return Object.getOwnPropertyNames(o).map(function(key) {
			return [ key, o[key] ]
		})
	};

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	var sheetsy = createCommonjsModule$2(function (module) {
		var buildIndexUrl = urlBuilder.buildIndexUrl,
		    buildSheetUrl = urlBuilder.buildSheetUrl;


		module.exports = function (defaultGet) {
			function getWorkbook(key) {
				var get$$1 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGet;

				return get$$1(buildIndexUrl(key)).then(function (workbookData) {
					var feed = workbookData.feed;
					var sheets = feed.entry.map(function (sheetData) {
						var selfSheetUrl = sheetData.link.find(function (link) {
							return link.rel === 'self';
						}).href;
						return {
							name: textOf(sheetData.title),
							id: afterLastSlash(selfSheetUrl),
							updated: textOf(sheetData.updated)
						};
					});

					return {
						name: textOf(feed.title),
						updated: textOf(feed.updated),
						authors: getAuthors(feed),
						sheets: sheets
					};
				});
			}

			function getSheet(key, id) {
				var get$$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultGet;

				return get$$1(buildSheetUrl(key, id)).then(function (sheetData) {
					var feed = sheetData.feed;
					var rows = feed.entry.map(function (entry) {
						var originalCellKeysAndValues = orderedEntries(entry).filter(function (_ref) {
							var _ref2 = slicedToArray(_ref, 1),
							    key = _ref2[0];

							return (/^gsx\$/.test(key)
							);
						}).map(function (_ref3) {
							var _ref4 = slicedToArray(_ref3, 2),
							    key = _ref4[0],
							    value = _ref4[1];

							return {
								key: key.replace('gsx$', ''),
								value: textOf(value)
							};
						});

						var array = originalCellKeysAndValues.map(function (_ref5) {
							var value = _ref5.value;
							return value;
						});

						originalCellKeysAndValues.filter(function (_ref6) {
							var key = _ref6.key;
							return (/^[^_]/.test(key)
							);
						}).forEach(function (_ref7) {
							var key = _ref7.key,
							    value = _ref7.value;

							array[key] = value;
						});

						return array;
					});

					return {
						name: textOf(feed.title),
						updated: textOf(feed.updated),
						authors: getAuthors(feed),
						rows: rows
					};
				});
			}

			function urlToKey(url) {
				return firstCapture(/key=(.*?)(&|#|$)/, url) || firstCapture(/d\/(.*?)\/pubhtml/, url) || firstCapture(/spreadsheets\/d\/(.*?)\//, url) || toss('No key found in ' + url);
			}

			return {
				getWorkbook: getWorkbook,
				getSheet: getSheet,
				urlToKey: urlToKey
			};
		};

		var textOf = function textOf(field) {
			return field.$t;
		};

		var getAuthors = function getAuthors(data) {
			return data.author.map(function (_ref8) {
				var name = _ref8.name,
				    email = _ref8.email;
				return {
					name: textOf(name),
					email: textOf(email)
				};
			});
		};

		var afterLastSlash = function afterLastSlash(str) {
			return str.split('/').pop();
		};

		var firstCapture = function firstCapture(regex, str) {
			var match = regex.exec(str);
			return match && match[1];
		};

		var toss = function toss(message) {
			throw new Error(message);
		};
	});

	var indexBrowser = sheetsy(basicXhr());

	var browserBuild = indexBrowser;

	/* client/view/index/Index.html generated by Svelte v2.16.0 */

	const { urlToKey } = browserBuild;

	function data() {
		return {
			sheetUrl: ``,
		}
	}
	var methods = {
		loadSheet(url) {
			try {
				const key = urlToKey(url);
				this.fire(`keySelected`, key);
			} catch (error) {
				this.set({
					error,
				});
			}
		},
	};

	function create_main_fragment(component, ctx) {
		var div1, div0, h1, text1, label, text2, input, input_updating = false, text3, hr, text4, p, a, text5, a_href_value, text6;

		function input_input_handler() {
			input_updating = true;
			component.set({ sheetUrl: input.value });
			input_updating = false;
		}

		function change_handler(event) {
			component.loadSheet(ctx.sheetUrl);
		}

		var if_block = (ctx.error) && create_if_block(component, ctx);

		return {
			c() {
				div1 = createElement("div");
				div0 = createElement("div");
				h1 = createElement("h1");
				h1.textContent = "Memorize Text";
				text1 = createText("\n\n\t\t");
				label = createElement("label");
				text2 = createText("Google Sheets share link\n\t\t\t");
				input = createElement("input");
				text3 = createText("\n\n\t\t");
				hr = createElement("hr");
				text4 = createText("\n\n\t\t");
				p = createElement("p");
				a = createElement("a");
				text5 = createText("Try an example deck");
				text6 = createText("\n\n\t\t");
				if (if_block) if_block.c();
				addListener(input, "input", input_input_handler);
				addListener(input, "change", change_handler);
				setAttribute(input, "type", "text");
				input.placeholder = "https://docs.google.com/spreadsheets/d/1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw/edit?usp=sharing";
				a.href = a_href_value = ctx.asr.makePath('workbook', { key: '1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw' });
				div0.className = "content";
				div1.className = "container";
			},

			m(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, h1);
				append(div0, text1);
				append(div0, label);
				append(label, text2);
				append(label, input);

				input.value = ctx.sheetUrl;

				append(div0, text3);
				append(div0, hr);
				append(div0, text4);
				append(div0, p);
				append(p, a);
				append(a, text5);
				append(div0, text6);
				if (if_block) if_block.m(div0, null);
			},

			p(changed, _ctx) {
				ctx = _ctx;
				if (!input_updating && changed.sheetUrl) input.value = ctx.sheetUrl;
				if ((changed.asr) && a_href_value !== (a_href_value = ctx.asr.makePath('workbook', { key: '1C6EBjsS-FY6KPzKnHCVFEcpYy_Gh_bvAJWcma50Qwrw' }))) {
					a.href = a_href_value;
				}

				if (ctx.error) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(component, ctx);
						if_block.c();
						if_block.m(div0, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div1);
				}

				removeListener(input, "input", input_input_handler);
				removeListener(input, "change", change_handler);
				if (if_block) if_block.d();
			}
		};
	}

	// (21:2) {#if error}
	function create_if_block(component, ctx) {
		var div, text0, text1;

		return {
			c() {
				div = createElement("div");
				text0 = createText("Error: ");
				text1 = createText(ctx.error);
				setStyle(div, "color", "var(--red)");
			},

			m(target, anchor) {
				insert(target, div, anchor);
				append(div, text0);
				append(div, text1);
			},

			p(changed, ctx) {
				if (changed.error) {
					setData(text1, ctx.error);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function Index(options) {
		init(this, options);
		this._state = assign(data(), options.data);
		this._intro = true;

		this._fragment = create_main_fragment(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(Index.prototype, proto);
	assign(Index.prototype, methods);

	var client$47$view$47$index$47$index$46$js = mediator => ({
		name: `index`,
		route: `home`,
		template: Index,
		activate(context) {
			const { domApi: component } = context;
			component.on(`keySelected`, key => {
				mediator.call(`stateGo`, `workbook`, { key });
			});
		},
	});

	/* client/view/not-found/NotFound.html generated by Svelte v2.16.0 */

	function create_main_fragment$1(component, ctx) {
		var h1, text1, text2, p, a, text3, a_href_value;

		var if_block = (ctx.route) && create_if_block$1(component, ctx);

		return {
			c() {
				h1 = createElement("h1");
				h1.textContent = "Page not found";
				text1 = createText("\n");
				if (if_block) if_block.c();
				text2 = createText("\n");
				p = createElement("p");
				a = createElement("a");
				text3 = createText("Home");
				a.href = a_href_value = ctx.asr.makePath('index');
			},

			m(target, anchor) {
				insert(target, h1, anchor);
				insert(target, text1, anchor);
				if (if_block) if_block.m(target, anchor);
				insert(target, text2, anchor);
				insert(target, p, anchor);
				append(p, a);
				append(a, text3);
			},

			p(changed, ctx) {
				if (ctx.route) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block$1(component, ctx);
						if_block.c();
						if_block.m(text2.parentNode, text2);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}

				if ((changed.asr) && a_href_value !== (a_href_value = ctx.asr.makePath('index'))) {
					a.href = a_href_value;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(h1);
					detachNode(text1);
				}

				if (if_block) if_block.d(detach);
				if (detach) {
					detachNode(text2);
					detachNode(p);
				}
			}
		};
	}

	// (2:0) {#if route}
	function create_if_block$1(component, ctx) {
		var div, text0, pre, text1;

		return {
			c() {
				div = createElement("div");
				text0 = createText("Can't match route:");
				pre = createElement("pre");
				text1 = createText(ctx.route);
			},

			m(target, anchor) {
				insert(target, div, anchor);
				append(div, text0);
				append(div, pre);
				append(pre, text1);
			},

			p(changed, ctx) {
				if (changed.route) {
					setData(text1, ctx.route);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div);
				}
			}
		};
	}

	function NotFound(options) {
		init(this, options);
		this._state = assign({}, options.data);
		this._intro = true;

		this._fragment = create_main_fragment$1(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(NotFound.prototype, proto);

	var client$47$view$47$not$45$found$47$not$45$found$46$js = mediator => ({
		name: `not-found`,
		route: `not-found`,
		querystringParameters: [ `route`, `parameters` ],
		template: NotFound,
		async resolve(data, parameters) {
			return parameters
		},
	});

	/* client/view/workbook/Workbook.html generated by Svelte v2.16.0 */

	function create_main_fragment$2(component, ctx) {
		var uiView;

		return {
			c() {
				uiView = createElement("uiView");
			},

			m(target, anchor) {
				insert(target, uiView, anchor);
			},

			p: noop,

			d(detach) {
				if (detach) {
					detachNode(uiView);
				}
			}
		};
	}

	function Workbook(options) {
		init(this, options);
		this._state = assign({}, options.data);
		this._intro = true;

		this._fragment = create_main_fragment$2(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(Workbook.prototype, proto);

	var client$47$view$47$workbook$47$workbook$46$js = mediator => ({
		name: `workbook`,
		defaultChild: `select-sheet`,
		route: `workbook/:key`,
		template: Workbook,
		async resolve(data, { key }) {
			const workbook = await mediator.call(`getWorkbook`, key);

			return {
				workbook,
				key,
			}
		},
	});

	/* client/view/workbook/select-sheet/SelectSheet.html generated by Svelte v2.16.0 */

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.sheet = list[i];
		return child_ctx;
	}

	function create_main_fragment$3(component, ctx) {
		var h1, text0_value = ctx.workbook.name, text0, text1, if_block_anchor;

		function select_block_type(ctx) {
			if (ctx.workbook.sheets.length === 1) return create_if_block$2;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(component, ctx);

		return {
			c() {
				h1 = createElement("h1");
				text0 = createText(text0_value);
				text1 = createText("\n\n");
				if_block.c();
				if_block_anchor = createComment();
			},

			m(target, anchor) {
				insert(target, h1, anchor);
				append(h1, text0);
				insert(target, text1, anchor);
				if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p(changed, ctx) {
				if ((changed.workbook) && text0_value !== (text0_value = ctx.workbook.name)) {
					setData(text0, text0_value);
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(component, ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(h1);
					detachNode(text1);
				}

				if_block.d(detach);
				if (detach) {
					detachNode(if_block_anchor);
				}
			}
		};
	}

	// (7:0) {:else}
	function create_else_block(component, ctx) {
		var ol;

		var each_value = ctx.workbook.sheets;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
		}

		return {
			c() {
				ol = createElement("ol");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
			},

			m(target, anchor) {
				insert(target, ol, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(ol, null);
				}
			},

			p(changed, ctx) {
				if (changed.asr || changed.workbook || changed.key) {
					each_value = ctx.workbook.sheets;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(component, child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ol, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(ol);
				}

				destroyEach(each_blocks, detach);
			}
		};
	}

	// (3:0) {#if workbook.sheets.length === 1}
	function create_if_block$2(component, ctx) {
		var p, text0, text1_value = ctx.workbook.sheets[0].name, text1, text2;

		return {
			c() {
				p = createElement("p");
				text0 = createText("Loading ");
				text1 = createText(text1_value);
				text2 = createText("...");
			},

			m(target, anchor) {
				insert(target, p, anchor);
				append(p, text0);
				append(p, text1);
				append(p, text2);
			},

			p(changed, ctx) {
				if ((changed.workbook) && text1_value !== (text1_value = ctx.workbook.sheets[0].name)) {
					setData(text1, text1_value);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(p);
				}
			}
		};
	}

	// (9:2) {#each workbook.sheets as sheet}
	function create_each_block(component, ctx) {
		var li, text0_value = ctx.sheet.name, text0, text1, a, text2, a_href_value, text3;

		return {
			c() {
				li = createElement("li");
				text0 = createText(text0_value);
				text1 = createText(" -\n\t\t\t\t");
				a = createElement("a");
				text2 = createText("memorize");
				text3 = createText("\n\t\t\t");
				a.href = a_href_value = ctx.asr.makePath('workbook.sheet.memorize', { sheetId: ctx.sheet.id, key: ctx.key } );
			},

			m(target, anchor) {
				insert(target, li, anchor);
				append(li, text0);
				append(li, text1);
				append(li, a);
				append(a, text2);
				append(li, text3);
			},

			p(changed, ctx) {
				if ((changed.workbook) && text0_value !== (text0_value = ctx.sheet.name)) {
					setData(text0, text0_value);
				}

				if ((changed.asr || changed.workbook || changed.key) && a_href_value !== (a_href_value = ctx.asr.makePath('workbook.sheet.memorize', { sheetId: ctx.sheet.id, key: ctx.key } ))) {
					a.href = a_href_value;
				}
			},

			d(detach) {
				if (detach) {
					detachNode(li);
				}
			}
		};
	}

	function SelectSheet(options) {
		init(this, options);
		this._state = assign({}, options.data);
		this._intro = true;

		this._fragment = create_main_fragment$3(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(SelectSheet.prototype, proto);

	var client$47$view$47$workbook$47$select$45$sheet$47$select$45$sheet$46$js = mediator => ({
		name: `workbook.select-sheet`,
		route: `select`,
		template: SelectSheet,
		async resolve(data, { key }) {
			return {
				key,
			}
		},
		activate({ content, parameters }) {
			if (content.workbook.sheets.length === 1) {
				mediator.call(`stateGo`, `workbook.sheet.memorize`, {
					key: parameters.key,
					sheetId: content.workbook.sheets[0].id,
				}, {
					replace: true,
					inherit: true,
				});
			}
		},
	});

	/* client/view/workbook/sheet/Sheet.html generated by Svelte v2.16.0 */

	function create_main_fragment$4(component, ctx) {
		var uiView;

		return {
			c() {
				uiView = createElement("uiView");
			},

			m(target, anchor) {
				insert(target, uiView, anchor);
			},

			p: noop,

			d(detach) {
				if (detach) {
					detachNode(uiView);
				}
			}
		};
	}

	function Sheet(options) {
		init(this, options);
		this._state = assign({}, options.data);
		this._intro = true;

		this._fragment = create_main_fragment$4(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(Sheet.prototype, proto);

	var client$47$view$47$workbook$47$sheet$47$sheet$46$js = mediator => ({
		name: `workbook.sheet`,
		route: `sheet/:sheetId`,
		defaultChild: `memorize`,
		template: Sheet,
		async resolve(data, { key, sheetId }) {
			const sheet = await mediator.call(`getSheet`, key, sheetId);

			return {
				sheet,
				sheetId,
			}
		},
	});

	/* client/view/workbook/sheet/memorize/Memorize.html generated by Svelte v2.16.0 */

	function currentCard({ currentQuestionPosition, sheet }) {
		const row = sheet.rows[currentQuestionPosition];

		return row
			? {
				prompt: row[0],
				answer: row[1],
			}
			: null
	}

	function cardsInSheet({ sheet }) {
		return sheet.rows.length;
	}

	function displayHeader({ sheet, workbook }) {
		return sheet.name === `Sheet1`
		? workbook.name
		: `${ workbook.name } · ${ sheet.name }`;
	}

	function answerWords({ currentCard }) {
		return currentCard.answer.split(/\s+/g);
	}

	function numberOfHintWords({ hintLevel }) {
		if (hintLevel === 0) {
			return 0
		}

		return 3 + ((hintLevel - 1) * 5)
	}

	function visibleAnswer({ showAnswer, currentCard, answerWords, numberOfHintWords }) {
		return showAnswer
		? currentCard.answer
		: answerWords.slice(0, numberOfHintWords).join(` `);
	}

	function hiddenAnswer({ showAnswer, answerWords, numberOfHintWords }) {
		return showAnswer
		? ``
		: answerWords.slice(numberOfHintWords).join(` `);
	}

	function wordsAreLeftToDisplay({ showAnswer, numberOfHintWords, answerWords }) {
		return !showAnswer
		&& numberOfHintWords < answerWords.length;
	}

	function data$1() {
		return {
			currentQuestionPosition: 0,
			sheet: null,
			showAnswer: false,
			hintLevel: 0,
		}
	}
	var methods$1 = {
		goToNextCard() {
			const { currentQuestionPosition, cardsInSheet } = this.get();
			const incrementedPosition = currentQuestionPosition + 1;

			this.set({
				currentQuestionPosition: incrementedPosition >= cardsInSheet ? 0 : incrementedPosition,
				showAnswer: false,
				hintLevel: 0,
			});
		},
		keydown({ key }) {
			if (key === ` `) {
				if (this.get().showAnswer) {
					this.goToNextCard();
				} else {
					this.set({
						showAnswer: true,
					});
				}
			} else if (key === `h` || key === `H`) {
				this.set({
					hintLevel: this.get().hintLevel + 1,
				});
			}
		},
	};

	function add_css() {
		var style = createElement("style");
		style.id = 'svelte-123h2zb-style';
		style.textContent = "[data-hidden=true].svelte-123h2zb{visibility:hidden}.key-identifier.svelte-123h2zb{font-family:sans-serif;background-color:var(--gray);color:var(--white);padding:2px 4px;border-radius:2px}.faint.svelte-123h2zb{color:var(--lightBlack)}.box.svelte-123h2zb{padding:32px;margin:32px 8px;border-radius:5px;box-shadow:0 0 8px 4px var(--lightGray)}.footer.svelte-123h2zb{display:flex;justify-content:space-between}@media(max-width: 600px){.footer.svelte-123h2zb{flex-direction:column}.footer.svelte-123h2zb .svelte-123h2zb{flex-basis:1.8rem}}.footer.svelte-123h2zb .svelte-123h2zb{text-align:center}.footer-center.svelte-123h2zb{flex-grow:1}.footer-left.svelte-123h2zb,.footer-right.svelte-123h2zb{flex-basis:64px}.nowrap.svelte-123h2zb{white-space:nowrap}";
		append(document.head, style);
	}

	function create_main_fragment$5(component, ctx) {
		var div5, div0, h1, text0, text1, text2, div4, div1, a, text3, a_href_value, text4, div2, text9, div3, text10_value = ctx.currentQuestionPosition + 1, text10, text11, text12;

		function onwindowkeydown(event) {
			component.keydown(event);	}
		window.addEventListener("keydown", onwindowkeydown);

		function select_block_type(ctx) {
			if (ctx.sheet.rows.length === 0) return create_if_block$3;
			return create_else_block$1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(component, ctx);

		return {
			c() {
				div5 = createElement("div");
				div0 = createElement("div");
				h1 = createElement("h1");
				text0 = createText(ctx.displayHeader);
				text1 = createText("\n\n\t\t");
				if_block.c();
				text2 = createText("\n\n\t");
				div4 = createElement("div");
				div1 = createElement("div");
				a = createElement("a");
				text3 = createText("Home");
				text4 = createText("\n\t\t");
				div2 = createElement("div");
				div2.innerHTML = `<span class="key-identifier svelte-123h2zb">[Spacebar]</span> Advance
						·
						<span class="key-identifier svelte-123h2zb">h</span> Show hint
					`;
				text9 = createText("\n\t\t");
				div3 = createElement("div");
				text10 = createText(text10_value);
				text11 = createText(" / ");
				text12 = createText(ctx.cardsInSheet);
				setStyle(h1, "font-size", "1rem");
				setStyle(h1, "text-align", "center");
				div0.className = "content";
				a.href = a_href_value = ctx.asr.makePath('index');
				a.className = "svelte-123h2zb";
				div1.className = "footer-left svelte-123h2zb";
				div2.className = "faint footer-center svelte-123h2zb";
				div3.className = "faint footer-right nowrap svelte-123h2zb";
				div4.className = "footer svelte-123h2zb";
				div5.className = "container";
			},

			m(target, anchor) {
				insert(target, div5, anchor);
				append(div5, div0);
				append(div0, h1);
				append(h1, text0);
				append(div0, text1);
				if_block.m(div0, null);
				append(div5, text2);
				append(div5, div4);
				append(div4, div1);
				append(div1, a);
				append(a, text3);
				append(div4, text4);
				append(div4, div2);
				append(div4, text9);
				append(div4, div3);
				append(div3, text10);
				append(div3, text11);
				append(div3, text12);
			},

			p(changed, ctx) {
				if (changed.displayHeader) {
					setData(text0, ctx.displayHeader);
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(component, ctx);
					if_block.c();
					if_block.m(div0, null);
				}

				if ((changed.asr) && a_href_value !== (a_href_value = ctx.asr.makePath('index'))) {
					a.href = a_href_value;
				}

				if ((changed.currentQuestionPosition) && text10_value !== (text10_value = ctx.currentQuestionPosition + 1)) {
					setData(text10, text10_value);
				}

				if (changed.cardsInSheet) {
					setData(text12, ctx.cardsInSheet);
				}
			},

			d(detach) {
				window.removeEventListener("keydown", onwindowkeydown);

				if (detach) {
					detachNode(div5);
				}

				if_block.d();
			}
		};
	}

	// (11:2) {:else}
	function create_else_block$1(component, ctx) {
		var div0, strong, text0_value = ctx.currentCard.prompt, text0, text1, div1, text2, span0, text3, span0_data_hidden_value, text4, span1, text5;

		return {
			c() {
				div0 = createElement("div");
				strong = createElement("strong");
				text0 = createText(text0_value);
				text1 = createText("\n\n\t\t\t");
				div1 = createElement("div");
				text2 = createText(ctx.visibleAnswer);
				span0 = createElement("span");
				text3 = createText("…");
				text4 = createText("\n\n\t\t\t\t");
				span1 = createElement("span");
				text5 = createText(ctx.hiddenAnswer);
				div0.className = "box svelte-123h2zb";
				span0.dataset.hidden = span0_data_hidden_value = ctx.hintLevel === 0 || !ctx.wordsAreLeftToDisplay;
				setStyle(span0, "color", "var(--lightGray)");
				span0.className = "svelte-123h2zb";
				setStyle(span1, "visibility", "hidden");
				div1.className = "box svelte-123h2zb";
			},

			m(target, anchor) {
				insert(target, div0, anchor);
				append(div0, strong);
				append(strong, text0);
				insert(target, text1, anchor);
				insert(target, div1, anchor);
				append(div1, text2);
				append(div1, span0);
				append(span0, text3);
				append(div1, text4);
				append(div1, span1);
				append(span1, text5);
			},

			p(changed, ctx) {
				if ((changed.currentCard) && text0_value !== (text0_value = ctx.currentCard.prompt)) {
					setData(text0, text0_value);
				}

				if (changed.visibleAnswer) {
					setData(text2, ctx.visibleAnswer);
				}

				if ((changed.hintLevel || changed.wordsAreLeftToDisplay) && span0_data_hidden_value !== (span0_data_hidden_value = ctx.hintLevel === 0 || !ctx.wordsAreLeftToDisplay)) {
					span0.dataset.hidden = span0_data_hidden_value;
				}

				if (changed.hiddenAnswer) {
					setData(text5, ctx.hiddenAnswer);
				}
			},

			d(detach) {
				if (detach) {
					detachNode(div0);
					detachNode(text1);
					detachNode(div1);
				}
			}
		};
	}

	// (7:2) {#if sheet.rows.length === 0}
	function create_if_block$3(component, ctx) {
		var h2;

		return {
			c() {
				h2 = createElement("h2");
				h2.textContent = "This sheet doesn't have any rows!";
			},

			m(target, anchor) {
				insert(target, h2, anchor);
			},

			p: noop,

			d(detach) {
				if (detach) {
					detachNode(h2);
				}
			}
		};
	}

	function Memorize(options) {
		init(this, options);
		this._state = assign(data$1(), options.data);

		this._recompute({ currentQuestionPosition: 1, sheet: 1, workbook: 1, currentCard: 1, hintLevel: 1, showAnswer: 1, answerWords: 1, numberOfHintWords: 1 }, this._state);
		this._intro = true;

		if (!document.getElementById("svelte-123h2zb-style")) add_css();

		this._fragment = create_main_fragment$5(this, this._state);

		if (options.target) {
			this._fragment.c();
			this._mount(options.target, options.anchor);
		}
	}

	assign(Memorize.prototype, proto);
	assign(Memorize.prototype, methods$1);

	Memorize.prototype._recompute = function _recompute(changed, state) {
		if (changed.currentQuestionPosition || changed.sheet) {
			if (this._differs(state.currentCard, (state.currentCard = currentCard(state)))) changed.currentCard = true;
		}

		if (changed.sheet) {
			if (this._differs(state.cardsInSheet, (state.cardsInSheet = cardsInSheet(state)))) changed.cardsInSheet = true;
		}

		if (changed.sheet || changed.workbook) {
			if (this._differs(state.displayHeader, (state.displayHeader = displayHeader(state)))) changed.displayHeader = true;
		}

		if (changed.currentCard) {
			if (this._differs(state.answerWords, (state.answerWords = answerWords(state)))) changed.answerWords = true;
		}

		if (changed.hintLevel) {
			if (this._differs(state.numberOfHintWords, (state.numberOfHintWords = numberOfHintWords(state)))) changed.numberOfHintWords = true;
		}

		if (changed.showAnswer || changed.currentCard || changed.answerWords || changed.numberOfHintWords) {
			if (this._differs(state.visibleAnswer, (state.visibleAnswer = visibleAnswer(state)))) changed.visibleAnswer = true;
		}

		if (changed.showAnswer || changed.answerWords || changed.numberOfHintWords) {
			if (this._differs(state.hiddenAnswer, (state.hiddenAnswer = hiddenAnswer(state)))) changed.hiddenAnswer = true;
		}

		if (changed.showAnswer || changed.numberOfHintWords || changed.answerWords) {
			if (this._differs(state.wordsAreLeftToDisplay, (state.wordsAreLeftToDisplay = wordsAreLeftToDisplay(state)))) changed.wordsAreLeftToDisplay = true;
		}
	};

	var client$47$view$47$workbook$47$sheet$47$memorize$47$memorize$46$js = mediator => ({
		name: `workbook.sheet.memorize`,
		route: `memorize`,
		template: Memorize,
	});

	var views = [
		client$47$view$47$index$47$index$46$js,
		client$47$view$47$not$45$found$47$not$45$found$46$js,
		client$47$view$47$workbook$47$workbook$46$js,
		client$47$view$47$workbook$47$select$45$sheet$47$select$45$sheet$46$js,
		client$47$view$47$workbook$47$sheet$47$sheet$46$js,
		client$47$view$47$workbook$47$sheet$47$memorize$47$memorize$46$js
	];

	var client$47$service$47$sheetsy$46$js = mannish => {
		mannish.provide('getWorkbook', browserBuild.getWorkbook);
		mannish.provide('getSheet', browserBuild.getSheet);
	};

	var statefulServices = [
		client$47$service$47$sheetsy$46$js
	];

	const mediator = mannish();

	const renderer = bundle$1({
		methods: {
			call: mediator.call,
		},
	});

	const stateRouter = bundle(renderer, document.getElementById(`app-target`));

	mediator.provide(`stateGo`, stateRouter.go);
	mediator.provide(`onStateRouter`, (event, cb) => {
		stateRouter.on(event, cb);
	});

	const moduleInitializationPromises = statefulServices.map(module => module(mediator));

	views.map(createView => createView(mediator)).forEach(stateRouter.addState);

	stateRouter.on(`routeNotFound`, (route, parameters) => {
		stateRouter.go(`not-found`, { route }, { replace: true });
	});

	stateRouter.on(`stateChangeStart`, (state, params) => console.log(`stateChangeStart`, state.name, params));
	stateRouter.on(`stateChangeError`, error => console.error(`stateChangeError`, error));
	stateRouter.on(`stateError`, error => console.error(`stateError`, error));
	stateRouter.on(`stateChangeEnd`, (state, params) => console.log(`stateChangeEnd`, state.name, params));

	const stateWatcher = es5(stateRouter);
	stateWatcher.addDomApiAttachListener(domApi => {
		if (domApi.onStateInit) {
			domApi.onStateInit();
		}
	});
	stateWatcher.addDomApiDetachListener(domApi => {
		if (domApi.onStateCleanup) {
			domApi.onStateCleanup();
		}
	});

	Promise.all(moduleInitializationPromises).then(() => {
		stateRouter.evaluateCurrentRoute(`index`);
	});

}());
//# sourceMappingURL=build.js.map
