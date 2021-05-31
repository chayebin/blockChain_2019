/**
 * Sinon.JS 1.10.0, 2014/05/19
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Contributors: https://github.com/cjohansen/Sinon.JS/blob/master/AUTHORS
 *
 * (The BSD License)
 *
 * Copyright (c) 2010-2014, Christian Johansen, christian@cjohansen.no
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *     * Neither the name of Christian Johansen nor the names of his contributors
 *       may be used to endorse or promote products derived from this software
 *       without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

this.sinon = (function () {
   var samsam, formatio;
   function define(mod, deps, fn) { if (mod == "samsam") { samsam = deps(); } else if (typeof fn === "function") { formatio = fn(samsam); } }
   define.amd = {};
   ((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
      (typeof module === "object" &&
         function (m) { module.exports = m(); }) || // Node
      function (m) { this.samsam = m(); } // Browser globals
      )(function () {
      var o = Object.prototype;
      var div = typeof document !== "undefined" && document.createElement("div");

      function isNaN(value) {
         // Unlike global isNaN, this avoids type coercion
         // typeof check avoids IE host object issues, hat tip to
         // lodash
         var val = value; // JsLint thinks value !== value is "weird"
         return typeof value === "number" && value !== val;
      }

      function getClass(value) {
         // Returns the internal [[Class]] by calling Object.prototype.toString
         // with the provided value as this. Return value is a string, naming the
         // internal class, e.g. "Array"
         return o.toString.call(value).split(/[ \]]/)[1];
      }

      /**
       * @name samsam.isArguments
       * @param Object object
       *
       * Returns ``true`` if ``object`` is an ``arguments`` object,
       * ``false`` otherwise.
       */
      function isArguments(object) {
         if (typeof object !== "object" || typeof object.length !== "number" ||
            getClass(object) === "Array") {
            return false;
         }
         if (typeof object.callee == "function") { return true; }
         try {
            object[object.length] = 6;
            delete object[object.length];
         } catch (e) {
            return true;
         }
         return false;
      }

      /**
       * @name samsam.isElement
       * @param Object object
       *
       * Returns ``true`` if ``object`` is a DOM element node. Unlike
       * Underscore.js/lodash, this function will return ``false`` if ``object``
       * is an *element-like* object, i.e. a regular object with a ``nodeType``
       * property that holds the value ``1``.
       */
      function isElement(object) {
         if (!object || object.nodeType !== 1 || !div) { return false; }
         try {
            object.appendChild(div);
            object.removeChild(div);
         } catch (e) {
            return false;
         }
         return true;
      }

      /**
       * @name samsam.keys
       * @param Object object
       *
       * Return an array of own property names.
       */
      function keys(object) {
         var ks = [], prop;
         for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
         }
         return ks;
      }

      /**
       * @name samsam.isDate
       * @param Object value
       *
       * Returns true if the object is a ``Date``, or *date-like*. Duck typing
       * of date objects work by checking that the object has a ``getTime``
       * function whose return value equals the return value from the object's
       * ``valueOf``.
       */
      function isDate(value) {
         return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
      }

      /**
       * @name samsam.isNegZero
       * @param Object value
       *
       * Returns ``true`` if ``value`` is ``-0``.
       */
      function isNegZero(value) {
         return value === 0 && 1 / value === -Infinity;
      }

      /**
       * @name samsam.equal
       * @param Object obj1
       * @param Object obj2
       *
       * Returns ``true`` if two objects are strictly equal. Compared to
       * ``===`` there are two exceptions:
       *
       *   - NaN is considered equal to NaN
       *   - -0 and +0 are not considered equal
       */
      function identical(obj1, obj2) {
         if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
         }
      }


      /**
       * @name samsam.deepEqual
       * @param Object obj1
       * @param Object obj2
       *
       * Deep equal comparison. Two values are "deep equal" if:
       *
       *   - They are equal, according to samsam.identical
       *   - They are both date objects representing the same time
       *   - They are both arrays containing elements that are all deepEqual
       *   - They are objects with the same set of properties, and each property
       *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
       *
       * Supports cyclic objects.
       */
      function deepEqualCyclic(obj1, obj2) {

         // used for cyclic comparison
         // contain already visited objects
         var objects1 = [],
            objects2 = [],
         // contain pathes (position in the object structure)
         // of the already visited objects
         // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
         // contains combinations of already compared objects
         // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

         /**
          * used to check, if the value of a property is an object
          * (cyclic logic is only needed for objects)
          * only needed for cyclic logic
          */
         function isObject(value) {

            if (typeof value === 'object' && value !== null &&
               !(value instanceof Boolean) &&
               !(value instanceof Date)    &&
               !(value instanceof Number)  &&
               !(value instanceof RegExp)  &&
               !(value instanceof String)) {

               return true;
            }

            return false;
         }

         /**
          * returns the index of the given object in the
          * given objects array, -1 if not contained
          * only needed for cyclic logic
          */
         function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
               if (objects[i] === obj) {
                  return i;
               }
            }

            return -1;
         }

         // does the recursion for the deep equal check
         return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
               isNaN(obj1) || isNaN(obj2) ||
               obj1 == null || obj2 == null ||
               type1 !== "object" || type2 !== "object") {

               return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
               if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                  return false;
               }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
               if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
               if (obj1.length !== obj2.length) { return false; }
            } else {
               if (type1 !== type2 || class1 !== class2 ||
                  keys1.length !== keys2.length) {
                  return false;
               }
            }

            var key, i, l,
            // following vars are used for the cyclic logic
               value1, value2,
               isObject1, isObject2,
               index1, index2,
               newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
               key = keys1[i];
               if (!o.hasOwnProperty.call(obj2, key)) {
                  return false;
               }

               // Start of the cyclic logic

               value1 = obj1[key];
               value2 = obj2[key];

               isObject1 = isObject(value1);
               isObject2 = isObject(value2);

               // determine, if the objects were already visited
               // (it's faster to check for isObject first, than to
               // get -1 from getIndex for non objects)
               index1 = isObject1 ? getIndex(objects1, value1) : -1;
               index2 = isObject2 ? getIndex(objects2, value2) : -1;

               // determine the new pathes of the objects
               // - for non cyclic objects the current path will be extended
               //   by current property name
               // - for cyclic objects the stored path is taken
               newPath1 = index1 !== -1
                  ? paths1[index1]
                  : path1 + '[' + JSON.stringify(key) + ']';
               newPath2 = index2 !== -1
                  ? paths2[index2]
                  : path2 + '[' + JSON.stringify(key) + ']';

               // stop recursion if current objects are already compared
               if (compared[newPath1 + newPath2]) {
                  return true;
               }

               // remember the current objects and their pathes
               if (index1 === -1 && isObject1) {
                  objects1.push(value1);
                  paths1.push(newPath1);
               }
               if (index2 === -1 && isObject2) {
                  objects2.push(value2);
                  paths2.push(newPath2);
               }

               // remember that the current objects are already compared
               if (isObject1 && isObject2) {
                  compared[newPath1 + newPath2] = true;
               }

               // End of cyclic logic

               // neither value1 nor value2 is a cycle
               // continue with next level
               if (!deepEqual(value1, value2, newPath1, newPath2)) {
                  return false;
               }
            }

            return true;

         }(obj1, obj2, '$1', '$2'));
      }

      var match;

      function arrayContains(array, subset) {
         if (subset.length === 0) { return true; }
         var i, l, j, k;
         for (i = 0, l = array.length; i < l; ++i) {
            if (match(array[i], subset[0])) {
               for (j = 0, k = subset.length; j < k; ++j) {
                  if (!match(array[i + j], subset[j])) { return false; }
               }
               return true;
            }
         }
         return false;
      }

      /**
       * @name samsam.match
       * @param Object object
       * @param Object matcher
       *
       * Compare arbitrary value ``object`` with matcher.
       */
      match = function match(object, matcher) {
         if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
         }

         if (typeof matcher === "function") {
            return matcher(object) === true;
         }

         if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
               (String(object)).toLowerCase().indexOf(matcher) >= 0;
         }

         if (typeof matcher === "number") {
            return matcher === object;
         }

         if (typeof matcher === "boolean") {
            return matcher === object;
         }

         if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher);
         }

         if (matcher && typeof matcher === "object") {
            var prop;
            for (prop in matcher) {
               if (!match(object[prop], matcher[prop])) {
                  return false;
               }
            }
            return true;
         }

         throw new Error("Matcher was not a string, a number, a " +
            "function, a boolean or an object");
      };

      return {
         isArguments: isArguments,
         isElement: isElement,
         isDate: isDate,
         isNegZero: isNegZero,
         identical: identical,
         deepEqual: deepEqualCyclic,
         match: match,
         keys: keys
      };
   });
   ((typeof define === "function" && define.amd && function (m) {
      define("formatio", ["samsam"], m);
   }) || (typeof module === "object" && function (m) {
      module.exports = m(require("samsam"));
   }) || function (m) { this.formatio = m(this.samsam); }
      )(function (samsam) {

      var formatio = {
         excludeConstructors: ["Object", /^.$/],
         quoteStrings: true
      };

      var hasOwn = Object.prototype.hasOwnProperty;

      var specialObjects = [];
      if (typeof global !== "undefined") {
         specialObjects.push({ object: global, value: "[object global]" });
      }
      if (typeof document !== "undefined") {
         specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
         });
      }
      if (typeof window !== "undefined") {
         specialObjects.push({ object: window, value: "[object Window]" });
      }

      function functionName(func) {
         if (!func) { return ""; }
         if (func.displayName) { return func.displayName; }
         if (func.name) { return func.name; }
         var matches = func.toString().match(/function\s+([^\(]+)/m);
         return (matches && matches[1]) || "";
      }

      function constructorName(f, object) {
         var name = functionName(object && object.constructor);
         var excludes = f.excludeConstructors ||
            formatio.excludeConstructors || [];

         var i, l;
         for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
               return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
               return "";
            }
         }

         return name;
      }

      function isCircular(object, objects) {
         if (typeof object !== "object") { return false; }
         var i, l;
         for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
         }
         return false;
      }

      function ascii(f, object, processed, indent) {
         if (typeof object === "string") {
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? '"' + object + '"' : object;
         }

         if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
         }

         processed = processed || [];

         if (isCircular(object, processed)) { return "[Circular]"; }

         if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
         }

         if (!object) { return String((1/object) === -Infinity ? "-0" : object); }
         if (samsam.isElement(object)) { return ascii.element(object); }

         if (typeof object.toString === "function" &&
            object.toString !== Object.prototype.toString) {
            return object.toString();
         }

         var i, l;
         for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
               return specialObjects[i].value;
            }
         }

         return ascii.object.call(f, object, processed, indent);
      }

      ascii.func = function (func) {
         return "function " + functionName(func) + "() {}";
      };

      ascii.array = function (array, processed) {
         processed = processed || [];
         processed.push(array);
         var i, l, pieces = [];
         for (i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
         }
         return "[" + pieces.join(", ") + "]";
      };

      ascii.object = function (object, processed, indent) {
         processed = processed || [];
         processed.push(object);
         indent = indent || 0;
         var pieces = [], properties = samsam.keys(object).sort();
         var length = 3;
         var prop, str, obj, i, l;

         for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
               str = "[Circular]";
            } else {
               str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
         }

         var cons = constructorName(this, object);
         var prefix = cons ? "[" + cons + "] " : "";
         var is = "";
         for (i = 0, l = indent; i < l; ++i) { is += " "; }

         if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
               is + "}";
         }
         return prefix + "{ " + pieces.join(", ") + " }";
      };

      ascii.element = function (element) {
         var tagName = element.tagName.toLowerCase();
         var attrs = element.attributes, attr, pairs = [], attrName, i, l, val;

         for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
               if (!!val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
         }

         var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
         var content = element.innerHTML;

         if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
         }

         var res = formatted + pairs.join(" ") + ">" + content +
            "</" + tagName + ">";

         return res.replace(/ contentEditable="inherit"/, "");
      };

      function Formatio(options) {
         for (var opt in options) {
            this[opt] = options[opt];
         }
      }

      Formatio.prototype = {
         functionName: functionName,

         configure: function (options) {
            return new Formatio(options);
         },

         constructorName: function (object) {
            return constructorName(this, object);
         },

         ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
         }
      };

      return Formatio.prototype;
   });
   /*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
   /*global module, require, __dirname, document*/
   /**
    * Sinon core utilities. For internal use only.
    *
    * @author Christian Johansen (christian@cjohansen.no)
    * @license BSD
    *
    * Copyright (c) 2010-2013 Christian Johansen
    */

   var sinon = (function (formatio) {
      var div = typeof document != "undefined" && document.createElement("div");
      var hasOwn = Object.prototype.hasOwnProperty;

      function isDOMNode(obj) {
         var success = false;

         try {
            obj.appendChild(div);
            success = div.parentNode == obj;
         } catch (e) {
            return false;
         } finally {
            try {
               obj.removeChild(div);
            } catch (e) {
               // Remove failed, not much we can do about that
            }
         }

         return success;
      }

      function isElement(obj) {
         return div && obj && obj.nodeType === 1 && isDOMNode(obj);
      }

      function isFunction(obj) {
         return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
      }

      function isReallyNaN(val) {
         return typeof val === 'number' && isNaN(val);
      }

      function mirrorProperties(target, source) {
         for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
               target[prop] = source[prop];
            }
         }
      }

      function isRestorable (obj) {
         return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
      }

      var sinon = {
         wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
               throw new TypeError("Should wrap property of object");
            }

            if (typeof method != "function") {
               throw new TypeError("Method wrapper should be function");
            }

            var wrappedMethod = object[property],
               error;

            if (!isFunction(wrappedMethod)) {
               error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                  property + " as function");
            } else if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
               error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
            } else if (wrappedMethod.calledBefore) {
               var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
               error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }

            if (error) {
               if (wrappedMethod && wrappedMethod._stack) {
                  error.stack += '\n--------------\n' + wrappedMethod._stack;
               }
               throw error;
            }

            // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
            // when using hasOwn.call on objects from other frames.
            var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            // Set up a stack trace which can be used later to find what line of
            // code the original method was created on.
            method._stack = (new Error('Stack Trace for original')).stack;

            method.restore = function () {
               // For prototype properties try to reset by delete first.
               // If this fails (ex: localStorage on mobile safari) then force a reset
               // via direct assignment.
               if (!owned) {
                  delete object[property];
               }
               if (object[property] === method) {
                  object[property] = wrappedMethod;
               }
            };

            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);

            return method;
         },

         extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
               for (var prop in arguments[i]) {
                  if (arguments[i].hasOwnProperty(prop)) {
                     target[prop] = arguments[i][prop];
                  }

                  // DONT ENUM bug, only care about toString
                  if (arguments[i].hasOwnProperty("toString") &&
                     arguments[i].toString != target.toString) {
                     target.toString = arguments[i].toString;
                  }
               }
            }

            return target;
         },

         create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
         },

         deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
               return a.test(b);
            }

            if (typeof a != 'object' || typeof b != 'object') {
               if (isReallyNaN(a) && isReallyNaN(b)) {
                  return true;
               } else {
                  return a === b;
               }
            }

            if (isElement(a) || isElement(b)) {
               return a === b;
            }

            if (a === b) {
               return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
               return false;
            }

            if (a instanceof RegExp && b instanceof RegExp) {
               return (a.source === b.source) && (a.global === b.global) &&
                  (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
            }

            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
               return false;
            }

            if (aString == "[object Date]") {
               return a.valueOf() === b.valueOf();
            }

            var prop, aLength = 0, bLength = 0;

            if (aString == "[object Array]" && a.length !== b.length) {
               return false;
            }

            for (prop in a) {
               aLength += 1;

               if (!(prop in b)) {
                  return false;
               }

               if (!deepEqual(a[prop], b[prop])) {
                  return false;
               }
            }

            for (prop in b) {
               bLength += 1;
            }

            return aLength == bLength;
         },

         functionName: function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
               var matches = func.toString().match(/function ([^\s\(]+)/);
               name = matches && matches[1];
            }

            return name;
         },

         functionToString: function toString() {
            if (this.getCall && this.callCount) {
               var thisValue, prop, i = this.callCount;

               while (i--) {
                  thisValue = this.getCall(i).thisValue;

                  for (prop in thisValue) {
                     if (thisValue[prop] === this) {
                        return prop;
                     }
                  }
               }
            }

            return this.displayName || "sinon fake";
         },

         getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
               if (defaults.hasOwnProperty(prop)) {
                  config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
               }
            }

            return config;
         },

         format: function (val) {
            return "" + val;
         },

         defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
         },

         timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
               count == 2 && "twice" ||
               count == 3 && "thrice" ||
               (count || 0) + " times";
         },

         calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
               if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                  return false;
               }
            }

            return true;
         },

         orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
               // uuid, won't ever be equal
               var aCall = a.getCall(0);
               var bCall = b.getCall(0);
               var aId = aCall && aCall.callId || -1;
               var bId = bCall && bCall.callId || -1;

               return aId < bId ? -1 : 1;
            });
         },

         log: function () {},

         logError: function (label, err) {
            var msg = label + " threw exception: ";
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }

            setTimeout(function () {
               err.message = msg + err.message;
               throw err;
            }, 0);
         },

         typeOf: function (value) {
            if (value === null) {
               return "null";
            }
            else if (value === undefined) {
               return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
         },

         createStubInstance: function (constructor) {
            if (typeof constructor !== "function") {
               throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
         },

         restore: function (object) {
            if (object !== null && typeof object === "object") {
               for (var prop in object) {
                  if (isRestorable(object[prop])) {
                     object[prop].restore();
                  }
               }
            }
            else if (isRestorable(object)) {
               object.restore();
            }
         }
      };

      var isNode = typeof module !== "undefined" && module.exports && typeof require == "function";
      var isAMD = typeof define === 'function' && typeof define.amd === 'object' && define.amd;

      function makePublicAPI(require, exports, module) {
         module.exports = sinon;
         sinon.spy = require("./sinon/spy");
         sinon.spyCall = require("./sinon/call");
         sinon.behavior = require("./sinon/behavior");
         sinon.stub = require("./sinon/stub");
         sinon.mock = require("./sinon/mock");
         sinon.collection = require("./sinon/collection");
         sinon.assert = require("./sinon/assert");
         sinon.sandbox = require("./sinon/sandbox");
         sinon.test = require("./sinon/test");
         sinon.testCase = require("./sinon/test_case");
         sinon.match = require("./sinon/match");
      }

      if (isAMD) {
         define(makePublicAPI);
      } else if (isNode) {
         try {
            formatio = require("formatio");
         } catch (e) {}
         makePublicAPI(require, exports, module);
      }

      if (formatio) {
         var formatter = formatio.configure({ quoteStrings: false });
         sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
         };
      } else if (isNode) {
         try {
            var util = require("util");
            sinon.format = function (value) {
               return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
         } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
         }
      }

      return sinon;
   }(typeof formatio == "object" && formatio));

   /* @depend ../sinon.js */
   /*jslint eqeqeq: false, onevar: false, plusplus: false*/
   /*global module, require, sinon*/
   /**
    * Match functions
    *
    * @author Maximilian Antoni (mail@maxantoni.de)
    * @license BSD
    *
    * Copyright (c) 2012 Maximilian Antoni
    */

   (function (sinon) {
      var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

      if (!sinon && commonJSModule) {
         sinon = require("../sinon");
      }

      if (!sinon) {
         return;
      }

      function assertType(value, type, name) {
         var actual = sinon.typeOf(value);
         if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
               type + ", but was " + actual);
         }
      }

      var matcher = {
         toString: function () {
            return this.message;
         }
      };

      function isMatcher(object) {
         return matcher.isPrototypeOf(object);
      }

      function matchObject(expectation, actual) {
         if (actual === null || actual === undefined) {
            return false;
         }
         for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
               var exp = expectation[key];
               var act = actual[key];
               if (match.isMatcher(exp)) {
                  if (!exp.test(act)) {
                     return false;
                  }
               } else if (sinon.typeOf(exp) === "object") {
                  if (!matchObject(exp, act)) {
                     return false;
                  }
               } else if (!sinon.deepEqual(exp, act)) {
                  return false;
               }
            }
         }
         return true;
      }

      matcher.or = function (m2) {
         if (!arguments.length) {
            throw new TypeError("Matcher expected");
         } else if (!isMatcher(m2)) {
            m2 = match(m2);
         }
         var m1 = this;
         var or = sinon.create(matcher);
         or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
         };
         or.message = m1.message + ".or(" + m2.message + ")";
         return or;
      };

      matcher.and = function (m2) {
         if (!arguments.length) {
            throw new TypeError("Matcher expected");
         } else if (!isMatcher(m2)) {
            m2 = match(m2);
         }
         var m1 = this;
         var and = sinon.create(matcher);
         and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
         };
         and.message = m1.message + ".and(" + m2.message + ")";
         return and;
      };

      var match = function (expectation, message) {
         var m = sinon.create(matcher);
         var type = sinon.typeOf(expectation);
         switch (type) {
            case "object":
               if (typeof expectation.test === "function") {
                  m.test = function (actual) {
                     return expectation.test(actual) === true;
                  };
                  m.message = "match(" + sinon.functionName(expectation.test) + ")";
                  return m;
               }
               var str = [];
               for (var key in expectation) {
                  if (expectation.hasOwnProperty(key)) {
                     str.push(key + ": " + expectation[key]);
                  }
               }
               m.test = function (actual) {
                  return matchObject(expectation, actual);
               };
               m.message = "match(" + str.join(", ") + ")";
               break;
            case "number":
               m.test = function (actual) {
                  return expectation == actual;
               };
               break;
            case "string":
               m.test = function (actual) {
                  if (typeof actual !== "string") {
                     return false;
                  }
                  return actual.indexOf(expectation) !== -1;
               };
               m.message = "match(\"" + expectation + "\")";
               break;
            case "regexp":
               m.test = function (actual) {
                  if (typeof actual !== "string") {
                     return false;
                  }
                  return expectation.test(actual);
               };
               break;
            case "function":
               m.test = expectation;
               if (message) {
                  m.message = message;
               } else {
                  m.message = "match(" + sinon.functionName(expectation) + ")";
               }
               break;
            default:
               m.test = function (actual) {
                  return sinon.deepEqual(expectation, actual);
               };
         }
         if (!m.message) {
            m.message = "match(" + expectation + ")";
         }
         return m;
      };

      match.isMatcher = isMatcher;

      match.any = match(function () {
         return true;
      }, "any");

      match.defined = match(function (actual) {
         return actual !== null && actual !== undefined;
      }, "defined");

      match.truthy = match(function (actual) {
         return !!actual;
      }, "truthy");

      match.falsy = match(function (actual) {
         return !actual;
      }, "falsy");

      match.same = function (expectation) {
         return match(function (actual) {
            return expectation === actual;
         }, "same(" + expectation + ")");
      };

      match.typeOf = function (type) {
         assertType(type, "string", "type");
         return match(function (actual) {
            return sinon.typeOf(actual) === type;
         }, "typeOf(\"" + type + "\")");
      };

      match.instanceOf = function (type) {
         assertType(type, "function", "type");
         return match(function (actual) {
            return actual instanceof type;
         }, "instanceOf(" + sinon.functionName(type) + ")");
      };

      function createPropertyMatcher(propertyTest, messagePrefix) {
         return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
               message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
               if (actual === undefined || actual === null ||
                  !propertyTest(actual, property)) {
                  return false;
               }
               return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
         };
      }

      match.has = createPropertyMatcher(function (actual, property) {
         if (typeof actual === "object") {
            return property in actual;
         }
         return actual[property] !== undefined;
      }, "has");

      match.hasOwn = createPropertyMatcher(function (actual, property) {
         return actual.hasOwnProperty(property);
      }, "hasOwn");

      match.bool = match.typeOf("boolean");
      match.number = match.typeOf("number");
      match.string = match.typeOf("string");
      match.object = match.typeOf("object");
      match.func = match.typeOf("function");
      match.array = match.typeOf("array");
      match.regexp = match.typeOf("regexp");
      match.date = match.typeOf("date");

      sinon.match = match;

      if (typeof define === "function" && define.amd) {
         define(["module"], function(module) { module.exports = match; });
      } else if (commonJSModule) {
         module.exports = match;
      }
   }(typeof sinon == "object" && sinon || null));

   /**
    * @depend ../sinon.js
    * @depend match.js
    */
   /*jslint eqeqeq: false, onevar: false, plusplus: false*/
   /*global module, require, sinon*/
   /**
    * Spy calls
    *
    * @author Christian Johansen (christian@cjohansen.no)
    * @author Maximilian Antoni (mail@maxantoni.de)
    * @license BSD
    *
    * Copyright (c) 2010-2013 Christian Johansen
    * Copyright (c) 2013 Maximilian Antoni
    */

   (function (sinon) {
      var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
      if (!sinon && commonJSModule) {
         sinon = require("../sinon");
      }

      if (!sinon) {
         return;
      }

      function throwYieldError(proxy, text, args) {
         var msg = sinon.functionName(proxy) + text;
         if (args.length) {
            msg += " Received [" + slice.call(args).join(", ") + "]";
         }
         throw new Error(msg);
      }

      var slice = Array.prototype.slice;

      var callProto = {
         calledOn: function calledOn(thisValue) {
            if (sinon.match && sinon.match.isMatcher(thisValue)) {
               return thisValue.test(this.thisValue);
            }
            return this.thisValue === thisValue;
         },

         calledWith: function calledWith() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
               if (!sinon.deepEqual(arguments[i], this.args[i])) {
                  return false;
               }
            }

            return true;
         },

         calledWithMatch: function calledWithMatch() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
               var actual = this.args[i];
               var expectation = arguments[i];
               if (!sinon.match || !sinon.match(expectation).test(actual)) {
                  return false;
               }
            }
            return true;
         },

         calledWithExactly: function calledWithExactly() {
            return arguments.length == this.args.length &&
               this.calledWith.apply(this, arguments);
         },

         notCalledWith: function notCalledWith() {
            return !this.calledWith.apply(this, arguments);
         },

         notCalledWithMatch: function notCalledWithMatch() {
            return !this.calledWithMatch.apply(this, arguments);
         },

         returned: function returned(value) {
            return sinon.deepEqual(value, this.returnValue);
         },

         threw: function threw(error) {
            if (typeof error === "undefined" || !this.exception) {
               return !!this.exception;
            }

            return this.exception === error || this.exception.name === error;
         },

         calledWithNew: function calledWithNew() {
            return this.proxy.prototype && this.thisValue instanceof this.proxy;
         },

         calledBefore: function (other) {
            return this.callId < other.callId;
         },

         calledAfter: function (other) {
            return this.callId > other.callId;
         },

         callArg: function (pos) {
            this.args[pos]();
         },

         callArgOn: function (pos, thisValue) {
            this.args[pos].apply(thisValue);
         },

         callArgWith: function (pos) {
            this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
         },

         callArgOnWith: function (pos, thisValue) {
            var args = slice.call(arguments, 2);
            this.args[pos].apply(thisValue, args);
         },

         "yield": function () {
            this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
         },

         yieldOn: function (thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
               if (typeof args[i] === "function") {
                  args[i].apply(thisValue, slice.call(arguments, 1));
                  return;
               }
            }
            throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
         },

         yieldTo: function (prop) {
            this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
         },

         yieldToOn: function (prop, thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
               if (args[i] && typeof args[i][prop] === "function") {
                  args[i][prop].apply(thisValue, slice.call(arguments, 2));
                  return;
               }
            }
            throwYieldError(this.proxy, " cannot yield to '" + prop +
               "' since no callback was passed.", args);
         },

         toString: function () {
            var callStr = this.proxy.toString() + "(";
            var args = [];

            for (var i = 0, l = this.args.length; i < l; ++i) {
               args.push(sinon.format(this.args[i]));
            }

            callStr = callStr + args.join(", ") + ")";

            if (typeof this.returnValue != "undefined") {
               callStr += " => " + sinon.format(this.returnValue);
            }

            if (this.exception) {
               callStr += " !" + this.exception.name;

               if (this.exception.message) {
                  callStr += "(" + this.exception.message + ")";
               }
            }

            return callStr;
         }
      };

      callProto.invokeCallback = callProto.yield;

      function createSpyCall(spy, thisValue, args, returnValue, exception, id) {
         if (typeof id !== "number") {
            throw new TypeError("Call id is not a number");
         }
         var proxyCall = sinon.create(callProto);
         proxyCall.proxy = spy;
         proxyCall.thisValue = thisValue;
         proxyCall.args = args;
         proxyCall.returnValue = returnValue;
         proxyCall.exception = exception;
         proxyCall.callId = id;

         return proxyCall;
      }
      createSpyCall.toString = callProto.toString; // used by mocks

      sinon.spyCall = createSpyCall;

      if (typeof define === "function" && define.amd) {
         define(["module"], function(module) { module.exports = createSpyCall; });
      } else if (commonJSModule) {
         module.exports = createSpyCall;
      }
   }(typeof sinon == "object" && sinon || null));


   /**
    * @depend ../sinon.js
    * @depend call.js
    */
   /*jslint eqeqeq: false, onevar: false, plusplus: false*/
   /*global module, require, sinon*/
   /**
    * Spy functions
    *
    * @author Christian Johansen (christian@cjohansen.no)
    * @license BSD
    *
    * Copyright (c) 2010-2013 Christian Johansen
    */

   (function (sinon) {
      var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";
      var push = Array.prototype.push;
      var slice = Array.prototype.slice;
      var callId = 0;

      if (!sinon && commonJSModule) {
         sinon = require("../sinon");
      }

      if (!sinon) {
         return;
      }

      function spy(object, property) {
         if (!property && typeof object == "function") {
            return spy.create(object);
         }

         if (!object && !property) {
            return spy.create(function () { });
         }

         var method = object[property];
         return sinon.wrapMethod(object, property, spy.create(method));
      }

      function matchingFake(fakes, args, strict) {
         if (!fakes) {
            return;
         }

         for (var i = 0, l = fakes.length; i < l; i++) {
            if (fakes[i].matches(args, strict)) {
               return fakes[i];
            }
         }
      }

      function incrementCallCount() {
         this.called = true;
         this.callCount += 1;
         this.notCalled = false;
         this.calledOnce = this.callCount == 1;
         this.calledTwice = this.callCount == 2;
         this.calledThrice = this.callCount == 3;
      }

      function createCallProperties() {
         this.firstCall = this.getCall(0);
         this.secondCall = this.getCall(1);
         this.thirdCall = this.getCall(2);
         this.lastCall = this.getCall(this.callCount - 1);
      }

      var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
      function createProxy(func) {
         // Retain the function length:
         var p;
         if (func.length) {
            eval("p = (function proxy(" + vars.substring(0, func.length * 2 - 1) +
               ") { return p.invoke(func, this, slice.call(arguments)); });");
         }
         else {
            p = function proxy() {
               return p.invoke(func, this, slice.call(arguments));
            };
         }
         return p;
      }

      var uuid = 0;

      // Public API
      var spyApi = {
         reset: function () {
            this.called = false;
            this.notCalled = true;
            this.calledOnce = false;
            this.calledTwice = false;
            this.calledThrice = false;
            this.callCount = 0;
            this.firstCall = null;
            this.secondCall = null;
            this.thirdCall = null;
            this.lastCall = null;
            this.args = [];
            this.returnValues = [];
            this.thisValues = [];
            this.exceptions = [];
            this.callIds = [];
            if (this.fakes) {
               for (var i = 0; i < this.fakes.length; i++) {
                  this.fakes[i].reset();
               }
            }
         },

         create: function create(func) {
            var name;

            if (typeof func != "function") {
               func = function () { };
            } else {
               name = sinon.functionName(func);
            }

            var proxy = createProxy(func);

            sinon.extend(proxy, spy);
            delete proxy.create;
            sinon.extend(proxy, func);

            proxy.reset();
            proxy.prototype = func.prototype;
            proxy.displayName = name || "spy";
            proxy.toString = sinon.functionToString;
            proxy._create = sinon.spy.create;
            proxy.id = "spy#" + uuid++;

            return proxy;
         },

         invoke: function invoke(func, thisValue, args) {
            var matching = matchingFake(this.fakes, args);
            var exception, returnValue;

            incrementCallCount.call(this);
            push.call(this.thisValues, thisValue);
            push.call(this.args, args);
            push.call(this.callIds, callId++);

            createCallProperties.call(this);

            try {
               if (matching) {
                  returnValue = matching.invoke(func, thisValue, args);
               } else {
                  returnValue = (this.func || func).apply(thisValue, args);
               }

               var thisCall = this.getCall(this.callCount - 1);
               if (thisCall.calledWithNew() && typeof returnValue !== 'object') {
                  returnValue = thisValue;
               }
            } catch (e) {
               exception = e;
            }

            push.call(this.exceptions, exception);
            push.call(this.returnValues, returnValue);

            if (exception !== undefined) {
               throw exception;
            }

            return returnValue;
         },

         named: function named(name) {
            this.displayName = name;
            return this;
         },

         getCall: function getCall(i) {
            if (i < 0 || i >= this.callCount) {
               return null;
            }

            return sinon.spyCall(this, this.thisValues[i], this.args[i],
               this.returnValues[i], this.exceptions[i],
               this.callIds[i]);
         },

         getCalls: function () {
            var calls = [];
            var i;

            for (i = 0; i < this.callCount; i++) {
               calls.push(this.getCall(i));
            }

            return calls;
         },

         calledBefore: function calledBefore(spyFn) {
            if (!this.called) {
               return false;
            }

            if (!spyFn.called) {
               return true;
            }

            return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
         },

         calledAfter: function calledAfter(spyFn) {
            if (!this.called || !spyFn.called) {
               return false;
            }

            return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
         },

         withArgs: function () {
            var args = slice.call(arguments);

            if (this.fakes) {
               var match = matchingFake(this.fakes, args, true);

               if (match) {
                  return match;
               }
            } else {
               this.fakes = [];
            }

            var original = this;
            var fake = this._create();
            fake.matchingAguments = args;
            fake.parent = this;
            push.call(this.fakes, fake);

            fake.withArgs = function () {
               return original.withArgs.apply(original, arguments);
            };

            for (var i = 0; i < this.args.length; i++) {
               if (fake.matches(this.args[i])) {
                  incrementCallCount.call(fake);
                  push.call(fake.thisValues, this.thisValues[i]);
                  push.call(fake.args, this.args[i]);
                  push.call(fake.returnValues, this.returnValues[i]);
                  push.call(fake.exceptions, this.exceptions[i]);
                  push.call(fake.callIds, this.callIds[i]);
               }
            }
            createCallProperties.call(fake);

            return fake;
         },

         matches: function (args, strict) {
            var margs = this.matchingAguments;

            if (margs.length <= args.length &&
               sinon.deepEqual(margs, args.slice(0, margs.length))) {
               return !strict || margs.length == args.length;
            }
         },

         printf: function (format) {
            var spy = this;
            var args = slice.call(arguments, 1);
            var formatter;

            return (format || "").replace(/%(.)/g, function (match, specifyer) {
               formatter = spyApi.formatters[specifyer];

               if (typeof formatter == "function") {
                  return formatter.call(null, spy, args);
               } else if (!isNaN(parseInt(specifyer, 10))) {
                  return sinon.format(args[specifyer - 1]);
               }

               return "%" + specifyer;
            });
         }
      };

      function delegateToCalls(method, matchAny, actual, notCalled) {
         spyApi[method] = function () {
            if (!this.called) {
               if (notCalled) {
                  return notCalled.apply(this, arguments);
               }
               return false;
            }

            var currentCall;
            var matches = 0;

            for (var i = 0, l = this.callCount; i < l; i += 1) {
               currentCall = this.getCall(i);

               if (currentCall[actual || method].apply(currentCall, arguments)) {
                  matches += 1;

                  if (matchAny) {
                     return true;
                  }
               }
            }

            return matches === this.callCount;
         };
      }

      delegateToCalls("calledOn", true);
      delegateToCalls("alwaysCalledOn", false, "calledOn");
      delegateToCalls("calledWith", true);
      delegateToCalls("calledWithMatch", true);
      delegateToCalls("alwaysCalledWith", false, "calledWith");
      delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
      delegateToCalls("calledWithExactly", true);
      delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
      delegateToCalls("neverCalledWith", false, "notCalledWith",
         function () { return true; });
      delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch",
         function () { return true; });
      delegateToCalls("threw", true);
      delegateToCalls("alwaysThrew", false, "threw");
      delegateToCalls("returned", true);
      delegateToCalls("alwaysReturned", false, "returned");
      delegateToCalls("calledWithNew", true);
      delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
      delegateToCalls("callArg", false, "callArgWith", function () {
         throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
      });
      spyApi.callArgWith = spyApi.callArg;
      delegateToCalls("callArgOn", false, "callArgOnWith", function () {
         throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
      });
      spyApi.callArgOnWith = spyApi.callArgOn;
      delegateToCalls("yield", false, "yield", function () {
         throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
      });
      // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
      spyApi.invokeCallback = spyApi.yield;
      delegateToCalls("yieldOn", false, "yieldOn", function () {
         throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
      });
      delegateToCalls("yieldTo", false, "yieldTo", function (property) {
         throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
      });
      delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
         throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
      });

      spyApi.formatters = {
         "c": function (spy) {
            return sinon.timesInWords(spy.callCount);
         },

         "n": function (spy) {
            return spy.toString();
         },

         "C": function (spy) {
            var calls = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
               var stringifiedCall = "    " + spy.getCall(i).toString();
               if (/\n/.test(calls[i - 1])) {
                  stringifiedCall = "\n" + stringifiedCall;
               }
               push.call(calls, stringifiedCall);
            }

            return calls.length > 0 ? "\n" + calls.join("\n") : "";
         },

         "t": function (spy) {
            var objects = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
               push.call(objects, sinon.format(spy.thisValues[i]));
            }

            return objects.join(", ");
         },

         "*": function (spy, args) {
            var formatted = [];

            for (var i = 0, l = args.length; i < l; ++i) {
               push.call(formatted, sinon.format(args[i]));
            }

            return formatted.join(", ");
         }
      };

      sinon.extend(spy, spyApi);

      spy.spyCall = sinon.spyCall;
      sinon.spy = spy;

      if (typeof define === "function" && define.amd) {
         define(["module"], function(module) { module.exports = spy; });
      } else if (commonJSModule) {
         module.exports = spy;
      }
   }(typeof sinon == "object" && sinon || null));

   /**
    * @depend ../sinon.js
    */
   /*jslint eqeqeq: false, onevar: false*/
   /*global module, require, sinon, process, setImmediate, setTimeout*/
   /**
    * Stub behavior
    *
    * @author Christian Johansen (christian@cjohansen.no)
    * @author Tim Fischbach (mail@timfischbach.de)
    * @license BSD
    *
    * Copyright (c) 2010-2013 Christian Johansen
    */

   (function (sinon) {
      var commonJSModule = typeof module !== "undefined" && module.exports && typeof require == "function";

      if (!sinon && commonJSModule) {
         sinon = require("../sinon");
      }

      if (!sinon) {
         return;
      }

      var slice = Array.prototype.slice;
      var join = Array.prototype.join;
      var proto;

      var nextTick = (function () {
         if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
         } else if (typeof setImmediate === "function") {
            return setImmediate;
         } else {
            return function (callback) {
               setTimeout(callback, 0);
            };
         }
      })();

      function throwsException(error, message) {
         if (typeof error == "string") {
            this.exception = new Error(message || "");
            this.exception.name = error;
         } else if (!error) {
            this.exception = new Error("Error");
         } else {
            this.exception = error;
         }

         return this;
      }

      function getCallback(behavior, args) {
         var callArgAt = behavior.callArgAt;

         if (callArgAt < 0) {
            var callArgProp = behavior.callArgProp;

            for (var i = 0, l = args.length; i < l; ++i) {
               if (!callArgProp && typeof args[i] == "function") {
                  return args[i];
               }

               if (callArgProp && args[i] &&
                  typeof args[i][callArgProp] == "function") {
                  return args[i][callArgProp];
               }
            }

            return null;
         }

         return args[callArgAt];
      }

      function getCallbackError(behavior, func, args) {
         if (behavior.callArgAt < 0) {
            var msg;

            if (behavior.callArgProp) {
               msg = sinon.functionName(behavior.stub) +
                  " expected to yield to '" + behavior.callArgProp +
                  "', but no object with such a property was passed.";
            } else {
               msg = sinon.functionName(behavior.stub) +
                  " expected to yield, but no callback was passed.";
            }

            if (args.length > 0) {
               msg += " Received [" + join.call(args, ", ") + "]";
            }

            return msg;
         }

         return "argument at index " + behavior.callArgAt + " is not a function: " + func;
      }

      function callCallback(behavior, args) {
         if (typeof behavior.callArgAt == "number") {
            var func = getCallback(behavior, args);

            if (typeof func != "function") {
               throw new TypeError(getCallbackError(behavior, func, args));
            }

            if (behavior.callbackAsync) {
               nextTick(function() {
                  func.apply(behavior.callbackContext, behavior.callbackArguments);
               });
            } else {
               func.apply(behavior.callbackContext, behavior.callbackArguments);
            }
         }
      }

      proto = {
         create: function(stub) {
            var behavior = sinon.extend({}, sinon.behavior);
            delete behavior.create;
            behavior.stub = stub;

            return behavior;
         },

         isPresent: function() {
            return (typeof this.callArgAt == 'number' ||
               this.exception ||
               typeof this.returnArgAt == 'number' ||
               this.returnThis ||
               this.returnValueDefined);
         },

         invoke: function(context, args) {
            callCallback(this, args);

            if (this.exception) {
               throw this.exception;
            } else if (typeof this.returnArgAt == 'number') {
               return args[this.returnArgAt];
            } else if (this.returnThis) {
               return context;
            }

            return this.returnValue;
         },

         onCall: function(index) {
            return this.stub.onCall(index);
         },

         onFirstCall: function() {
            return this.stub.onFirstCall();
         },

         onSecondCall: function() {
            return this.stub.onSecondCall();
         },

         onThirdCall: function() {
            return this.stub.onThirdCall();
         },

         withArgs: function(/* arguments */) {
            throw new Error('Defining a stub by invoking "stub.onCall(...).withArgs(...)" is not supported. ' +
               'Use "stub.withArgs(...).onCall(...)" to define sequential behavior for calls with certain arguments.');
         },

         callsArg: function callsArg(pos) {
            if (typeof