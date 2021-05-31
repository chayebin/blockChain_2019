"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (f) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;

    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }

    g.Web3 = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }

          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }

        return n[i].exports;
      }

      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
        o(t[i]);
      }

      return o;
    }

    return r;
  }()({
    1: [function (require, module, exports) {
      var asn1 = exports;
      asn1.bignum = require('bn.js');
      asn1.define = require('./asn1/api').define;
      asn1.base = require('./asn1/base');
      asn1.constants = require('./asn1/constants');
      asn1.decoders = require('./asn1/decoders');
      asn1.encoders = require('./asn1/encoders');
    }, {
      "./asn1/api": 2,
      "./asn1/base": 4,
      "./asn1/constants": 8,
      "./asn1/decoders": 10,
      "./asn1/encoders": 13,
      "bn.js": "BN"
    }],
    2: [function (require, module, exports) {
      var asn1 = require('../asn1');

      var inherits = require('inherits');

      var api = exports;

      api.define = function define(name, body) {
        return new Entity(name, body);
      };

      function Entity(name, body) {
        this.name = name;
        this.body = body;
        this.decoders = {};
        this.encoders = {};
      }

      ;

      Entity.prototype._createNamed = function createNamed(base) {
        var named;

        try {
          named = require('vm').runInThisContext('(function ' + this.name + '(entity) {\n' + '  this._initNamed(entity);\n' + '})');
        } catch (e) {
          named = function named(entity) {
            this._initNamed(entity);
          };
        }

        inherits(named, base);

        named.prototype._initNamed = function initnamed(entity) {
          base.call(this, entity);
        };

        return new named(this);
      };

      Entity.prototype._getDecoder = function _getDecoder(enc) {
        enc = enc || 'der'; // Lazily create decoder

        if (!this.decoders.hasOwnProperty(enc)) this.decoders[enc] = this._createNamed(asn1.decoders[enc]);
        return this.decoders[enc];
      };

      Entity.prototype.decode = function decode(data, enc, options) {
        return this._getDecoder(enc).decode(data, options);
      };

      Entity.prototype._getEncoder = function _getEncoder(enc) {
        enc = enc || 'der'; // Lazily create encoder

        if (!this.encoders.hasOwnProperty(enc)) this.encoders[enc] = this._createNamed(asn1.encoders[enc]);
        return this.encoders[enc];
      };

      Entity.prototype.encode = function encode(data, enc,
      /* internal */
      reporter) {
        return this._getEncoder(enc).encode(data, reporter);
      };
    }, {
      "../asn1": 1,
      "inherits": 104,
      "vm": 187
    }],
    3: [function (require, module, exports) {
      var inherits = require('inherits');

      var Reporter = require('../base').Reporter;

      var Buffer = require('buffer').Buffer;

      function DecoderBuffer(base, options) {
        Reporter.call(this, options);

        if (!Buffer.isBuffer(base)) {
          this.error('Input not Buffer');
          return;
        }

        this.base = base;
        this.offset = 0;
        this.length = base.length;
      }

      inherits(DecoderBuffer, Reporter);
      exports.DecoderBuffer = DecoderBuffer;

      DecoderBuffer.prototype.save = function save() {
        return {
          offset: this.offset,
          reporter: Reporter.prototype.save.call(this)
        };
      };

      DecoderBuffer.prototype.restore = function restore(save) {
        // Return skipped data
        var res = new DecoderBuffer(this.base);
        res.offset = save.offset;
        res.length = this.offset;
        this.offset = save.offset;
        Reporter.prototype.restore.call(this, save.reporter);
        return res;
      };

      DecoderBuffer.prototype.isEmpty = function isEmpty() {
        return this.offset === this.length;
      };

      DecoderBuffer.prototype.readUInt8 = function readUInt8(fail) {
        if (this.offset + 1 <= this.length) return this.base.readUInt8(this.offset++, true);else return this.error(fail || 'DecoderBuffer overrun');
      };

      DecoderBuffer.prototype.skip = function skip(bytes, fail) {
        if (!(this.offset + bytes <= this.length)) return this.error(fail || 'DecoderBuffer overrun');
        var res = new DecoderBuffer(this.base); // Share reporter state

        res._reporterState = this._reporterState;
        res.offset = this.offset;
        res.length = this.offset + bytes;
        this.offset += bytes;
        return res;
      };

      DecoderBuffer.prototype.raw = function raw(save) {
        return this.base.slice(save ? save.offset : this.offset, this.length);
      };

      function EncoderBuffer(value, reporter) {
        if (Array.isArray(value)) {
          this.length = 0;
          this.value = value.map(function (item) {
            if (!(item instanceof EncoderBuffer)) item = new EncoderBuffer(item, reporter);
            this.length += item.length;
            return item;
          }, this);
        } else if (typeof value === 'number') {
          if (!(0 <= value && value <= 0xff)) return reporter.error('non-byte EncoderBuffer value');
          this.value = value;
          this.length = 1;
        } else if (typeof value === 'string') {
          this.value = value;
          this.length = Buffer.byteLength(value);
        } else if (Buffer.isBuffer(value)) {
          this.value = value;
          this.length = value.length;
        } else {
          return reporter.error('Unsupported type: ' + _typeof(value));
        }
      }

      exports.EncoderBuffer = EncoderBuffer;

      EncoderBuffer.prototype.join = function join(out, offset) {
        if (!out) out = new Buffer(this.length);
        if (!offset) offset = 0;
        if (this.length === 0) return out;

        if (Array.isArray(this.value)) {
          this.value.forEach(function (item) {
            item.join(out, offset);
            offset += item.length;
          });
        } else {
          if (typeof this.value === 'number') out[offset] = this.value;else if (typeof this.value === 'string') out.write(this.value, offset);else if (Buffer.isBuffer(this.value)) this.value.copy(out, offset);
          offset += this.length;
        }

        return out;
      };
    }, {
      "../base": 4,
      "buffer": 50,
      "inherits": 104
    }],
    4: [function (require, module, exports) {
      var base = exports;
      base.Reporter = require('./reporter').Reporter;
      base.DecoderBuffer = require('./buffer').DecoderBuffer;
      base.EncoderBuffer = require('./buffer').EncoderBuffer;
      base.Node = require('./node');
    }, {
      "./buffer": 3,
      "./node": 5,
      "./reporter": 6
    }],
    5: [function (require, module, exports) {
      var Reporter = require('../base').Reporter;

      var EncoderBuffer = require('../base').EncoderBuffer;

      var DecoderBuffer = require('../base').DecoderBuffer;

      var assert = require('minimalistic-assert'); // Supported tags


      var tags = ['seq', 'seqof', 'set', 'setof', 'objid', 'bool', 'gentime', 'utctime', 'null_', 'enum', 'int', 'objDesc', 'bitstr', 'bmpstr', 'charstr', 'genstr', 'graphstr', 'ia5str', 'iso646str', 'numstr', 'octstr', 'printstr', 't61str', 'unistr', 'utf8str', 'videostr']; // Public methods list

      var methods = ['key', 'obj', 'use', 'optional', 'explicit', 'implicit', 'def', 'choice', 'any', 'contains'].concat(tags); // Overrided methods list

      var overrided = ['_peekTag', '_decodeTag', '_use', '_decodeStr', '_decodeObjid', '_decodeTime', '_decodeNull', '_decodeInt', '_decodeBool', '_decodeList', '_encodeComposite', '_encodeStr', '_encodeObjid', '_encodeTime', '_encodeNull', '_encodeInt', '_encodeBool'];

      function Node(enc, parent) {
        var state = {};
        this._baseState = state;
        state.enc = enc;
        state.parent = parent || null;
        state.children = null; // State

        state.tag = null;
        state.args = null;
        state.reverseArgs = null;
        state.choice = null;
        state.optional = false;
        state.any = false;
        state.obj = false;
        state.use = null;
        state.useDecoder = null;
        state.key = null;
        state['default'] = null;
        state.explicit = null;
        state.implicit = null;
        state.contains = null; // Should create new instance on each method

        if (!state.parent) {
          state.children = [];

          this._wrap();
        }
      }

      module.exports = Node;
      var stateProps = ['enc', 'parent', 'children', 'tag', 'args', 'reverseArgs', 'choice', 'optional', 'any', 'obj', 'use', 'alteredUse', 'key', 'default', 'explicit', 'implicit', 'contains'];

      Node.prototype.clone = function clone() {
        var state = this._baseState;
        var cstate = {};
        stateProps.forEach(function (prop) {
          cstate[prop] = state[prop];
        });
        var res = new this.constructor(cstate.parent);
        res._baseState = cstate;
        return res;
      };

      Node.prototype._wrap = function wrap() {
        var state = this._baseState;
        methods.forEach(function (method) {
          this[method] = function _wrappedMethod() {
            var clone = new this.constructor(this);
            state.children.push(clone);
            return clone[method].apply(clone, arguments);
          };
        }, this);
      };

      Node.prototype._init = function init(body) {
        var state = this._baseState;
        assert(state.parent === null);
        body.call(this); // Filter children

        state.children = state.children.filter(function (child) {
          return child._baseState.parent === this;
        }, this);
        assert.equal(state.children.length, 1, 'Root node can have only one child');
      };

      Node.prototype._useArgs = function useArgs(args) {
        var state = this._baseState; // Filter children and args

        var children = args.filter(function (arg) {
          return arg instanceof this.constructor;
        }, this);
        args = args.filter(function (arg) {
          return !(arg instanceof this.constructor);
        }, this);

        if (children.length !== 0) {
          assert(state.children === null);
          state.children = children; // Replace parent to maintain backward link

          children.forEach(function (child) {
            child._baseState.parent = this;
          }, this);
        }

        if (args.length !== 0) {
          assert(state.args === null);
          state.args = args;
          state.reverseArgs = args.map(function (arg) {
            if (_typeof(arg) !== 'object' || arg.constructor !== Object) return arg;
            var res = {};
            Object.keys(arg).forEach(function (key) {
              if (key == (key | 0)) key |= 0;
              var value = arg[key];
              res[value] = key;
            });
            return res;
          });
        }
      }; //
      // Overrided methods
      //


      overrided.forEach(function (method) {
        Node.prototype[method] = function _overrided() {
          var state = this._baseState;
          throw new Error(method + ' not implemented for encoding: ' + state.enc);
        };
      }); //
      // Public methods
      //

      tags.forEach(function (tag) {
        Node.prototype[tag] = function _tagMethod() {
          var state = this._baseState;
          var args = Array.prototype.slice.call(arguments);
          assert(state.tag === null);
          state.tag = tag;

          this._useArgs(args);

          return this;
        };
      });

      Node.prototype.use = function use(item) {
        assert(item);
        var state = this._baseState;
        assert(state.use === null);
        state.use = item;
        return this;
      };

      Node.prototype.optional = function optional() {
        var state = this._baseState;
        state.optional = true;
        return this;
      };

      Node.prototype.def = function def(val) {
        var state = this._baseState;
        assert(state['default'] === null);
        state['default'] = val;
        state.optional = true;
        return this;
      };

      Node.prototype.explicit = function explicit(num) {
        var state = this._baseState;
        assert(state.explicit === null && state.implicit === null);
        state.explicit = num;
        return this;
      };

      Node.prototype.implicit = function implicit(num) {
        var state = this._baseState;
        assert(state.explicit === null && state.implicit === null);
        state.implicit = num;
        return this;
      };

      Node.prototype.obj = function obj() {
        var state = this._baseState;
        var args = Array.prototype.slice.call(arguments);
        state.obj = true;
        if (args.length !== 0) this._useArgs(args);
        return this;
      };

      Node.prototype.key = function key(newKey) {
        var state = this._baseState;
        assert(state.key === null);
        state.key = newKey;
        return this;
      };

      Node.prototype.any = function any() {
        var state = this._baseState;
        state.any = true;
        return this;
      };

      Node.prototype.choice = function choice(obj) {
        var state = this._baseState;
        assert(state.choice === null);
        state.choice = obj;

        this._useArgs(Object.keys(obj).map(function (key) {
          return obj[key];
        }));

        return this;
      };

      Node.prototype.contains = function contains(item) {
        var state = this._baseState;
        assert(state.use === null);
        state.contains = item;
        return this;
      }; //
      // Decoding
      //


      Node.prototype._decode = function decode(input, options) {
        var state = this._baseState; // Decode root node

        if (state.parent === null) return input.wrapResult(state.children[0]._decode(input, options));
        var result = state['default'];
        var present = true;
        var prevKey = null;
        if (state.key !== null) prevKey = input.enterKey(state.key); // Check if tag is there

        if (state.optional) {
          var tag = null;
          if (state.explicit !== null) tag = state.explicit;else if (state.implicit !== null) tag = state.implicit;else if (state.tag !== null) tag = state.tag;

          if (tag === null && !state.any) {
            // Trial and Error
            var save = input.save();

            try {
              if (state.choice === null) this._decodeGeneric(state.tag, input, options);else this._decodeChoice(input, options);
              present = true;
            } catch (e) {
              present = false;
            }

            input.restore(save);
          } else {
            present = this._peekTag(input, tag, state.any);
            if (input.isError(present)) return present;
          }
        } // Push object on stack


        var prevObj;
        if (state.obj && present) prevObj = input.enterObject();

        if (present) {
          // Unwrap explicit values
          if (state.explicit !== null) {
            var explicit = this._decodeTag(input, state.explicit);

            if (input.isError(explicit)) return explicit;
            input = explicit;
          }

          var start = input.offset; // Unwrap implicit and normal values

          if (state.use === null && state.choice === null) {
            if (state.any) var save = input.save();

            var body = this._decodeTag(input, state.implicit !== null ? state.implicit : state.tag, state.any);

            if (input.isError(body)) return body;
            if (state.any) result = input.raw(save);else input = body;
          }

          if (options && options.track && state.tag !== null) options.track(input.path(), start, input.length, 'tagged');
          if (options && options.track && state.tag !== null) options.track(input.path(), input.offset, input.length, 'content'); // Select proper method for tag

          if (state.any) result = result;else if (state.choice === null) result = this._decodeGeneric(state.tag, input, options);else result = this._decodeChoice(input, options);
          if (input.isError(result)) return result; // Decode children

          if (!state.any && state.choice === null && state.children !== null) {
            state.children.forEach(function decodeChildren(child) {
              // NOTE: We are ignoring errors here, to let parser continue with other
              // parts of encoded data
              child._decode(input, options);
            });
          } // Decode contained/encoded by schema, only in bit or octet strings


          if (state.contains && (state.tag === 'octstr' || state.tag === 'bitstr')) {
            var data = new DecoderBuffer(result);
            result = this._getUse(state.contains, input._reporterState.obj)._decode(data, options);
          }
        } // Pop object


        if (state.obj && present) result = input.leaveObject(prevObj); // Set key

        if (state.key !== null && (result !== null || present === true)) input.leaveKey(prevKey, state.key, result);else if (prevKey !== null) input.exitKey(prevKey);
        return result;
      };

      Node.prototype._decodeGeneric = function decodeGeneric(tag, input, options) {
        var state = this._baseState;
        if (tag === 'seq' || tag === 'set') return null;
        if (tag === 'seqof' || tag === 'setof') return this._decodeList(input, tag, state.args[0], options);else if (/str$/.test(tag)) return this._decodeStr(input, tag, options);else if (tag === 'objid' && state.args) return this._decodeObjid(input, state.args[0], state.args[1], options);else if (tag === 'objid') return this._decodeObjid(input, null, null, options);else if (tag === 'gentime' || tag === 'utctime') return this._decodeTime(input, tag, options);else if (tag === 'null_') return this._decodeNull(input, options);else if (tag === 'bool') return this._decodeBool(input, options);else if (tag === 'objDesc') return this._decodeStr(input, tag, options);else if (tag === 'int' || tag === 'enum') return this._decodeInt(input, state.args && state.args[0], options);

        if (state.use !== null) {
          return this._getUse(state.use, input._reporterState.obj)._decode(input, options);
        } else {
          return input.error('unknown tag: ' + tag);
        }
      };

      Node.prototype._getUse = function _getUse(entity, obj) {
        var state = this._baseState; // Create altered use decoder if implicit is set

        state.useDecoder = this._use(entity, obj);
        assert(state.useDecoder._baseState.parent === null);
        state.useDecoder = state.useDecoder._baseState.children[0];

        if (state.implicit !== state.useDecoder._baseState.implicit) {
          state.useDecoder = state.useDecoder.clone();
          state.useDecoder._baseState.implicit = state.implicit;
        }

        return state.useDecoder;
      };

      Node.prototype._decodeChoice = function decodeChoice(input, options) {
        var state = this._baseState;
        var result = null;
        var match = false;
        Object.keys(state.choice).some(function (key) {
          var save = input.save();
          var node = state.choice[key];

          try {
            var value = node._decode(input, options);

            if (input.isError(value)) return false;
            result = {
              type: key,
              value: value
            };
            match = true;
          } catch (e) {
            input.restore(save);
            return false;
          }

          return true;
        }, this);
        if (!match) return input.error('Choice not matched');
        return result;
      }; //
      // Encoding
      //


      Node.prototype._createEncoderBuffer = function createEncoderBuffer(data) {
        return new EncoderBuffer(data, this.reporter);
      };

      Node.prototype._encode = function encode(data, reporter, parent) {
        var state = this._baseState;
        if (state['default'] !== null && state['default'] === data) return;

        var result = this._encodeValue(data, reporter, parent);

        if (result === undefined) return;
        if (this._skipDefault(result, reporter, parent)) return;
        return result;
      };

      Node.prototype._encodeValue = function encode(data, reporter, parent) {
        var state = this._baseState; // Decode root node

        if (state.parent === null) return state.children[0]._encode(data, reporter || new Reporter());
        var result = null; // Set reporter to share it with a child class

        this.reporter = reporter; // Check if data is there

        if (state.optional && data === undefined) {
          if (state['default'] !== null) data = state['default'];else return;
        } // Encode children first


        var content = null;
        var primitive = false;

        if (state.any) {
          // Anything that was given is translated to buffer
          result = this._createEncoderBuffer(data);
        } else if (state.choice) {
          result = this._encodeChoice(data, reporter);
        } else if (state.contains) {
          content = this._getUse(state.contains, parent)._encode(data, reporter);
          primitive = true;
        } else if (state.children) {
          content = state.children.map(function (child) {
            if (child._baseState.tag === 'null_') return child._encode(null, reporter, data);
            if (child._baseState.key === null) return reporter.error('Child should have a key');
            var prevKey = reporter.enterKey(child._baseState.key);
            if (_typeof(data) !== 'object') return reporter.error('Child expected, but input is not object');

            var res = child._encode(data[child._baseState.key], reporter, data);

            reporter.leaveKey(prevKey);
            return res;
          }, this).filter(function (child) {
            return child;
          });
          content = this._createEncoderBuffer(content);
        } else {
          if (state.tag === 'seqof' || state.tag === 'setof') {
            // TODO(indutny): this should be thrown on DSL level
            if (!(state.args && state.args.length === 1)) return reporter.error('Too many args for : ' + state.tag);
            if (!Array.isArray(data)) return reporter.error('seqof/setof, but data is not Array');
            var child = this.clone();
            child._baseState.implicit = null;
            content = this._createEncoderBuffer(data.map(function (item) {
              var state = this._baseState;
              return this._getUse(state.args[0], data)._encode(item, reporter);
            }, child));
          } else if (state.use !== null) {
            result = this._getUse(state.use, parent)._encode(data, reporter);
          } else {
            content = this._encodePrimitive(state.tag, data);
            primitive = true;
          }
        } // Encode data itself


        var result;

        if (!state.any && state.choice === null) {
          var tag = state.implicit !== null ? state.implicit : state.tag;
          var cls = state.implicit === null ? 'universal' : 'context';

          if (tag === null) {
            if (state.use === null) reporter.error('Tag could be omitted only for .use()');
          } else {
            if (state.use === null) result = this._encodeComposite(tag, primitive, cls, content);
          }
        } // Wrap in explicit


        if (state.explicit !== null) result = this._encodeComposite(state.explicit, false, 'context', result);
        return result;
      };

      Node.prototype._encodeChoice = function encodeChoice(data, reporter) {
        var state = this._baseState;
        var node = state.choice[data.type];

        if (!node) {
          assert(false, data.type + ' not found in ' + JSON.stringify(Object.keys(state.choice)));
        }

        return node._encode(data.value, reporter);
      };

      Node.prototype._encodePrimitive = function encodePrimitive(tag, data) {
        var state = this._baseState;
        if (/str$/.test(tag)) return this._encodeStr(data, tag);else if (tag === 'objid' && state.args) return this._encodeObjid(data, state.reverseArgs[0], state.args[1]);else if (tag === 'objid') return this._encodeObjid(data, null, null);else if (tag === 'gentime' || tag === 'utctime') return this._encodeTime(data, tag);else if (tag === 'null_') return this._encodeNull();else if (tag === 'int' || tag === 'enum') return this._encodeInt(data, state.args && state.reverseArgs[0]);else if (tag === 'bool') return this._encodeBool(data);else if (tag === 'objDesc') return this._encodeStr(data, tag);else throw new Error('Unsupported tag: ' + tag);
      };

      Node.prototype._isNumstr = function isNumstr(str) {
        return /^[0-9 ]*$/.test(str);
      };

      Node.prototype._isPrintstr = function isPrintstr(str) {
        return /^[A-Za-z0-9 '\(\)\+,\-\.\/:=\?]*$/.test(str);
      };
    }, {
      "../base": 4,
      "minimalistic-assert": 109
    }],
    6: [function (require, module, exports) {
      var inherits = require('inherits');

      function Reporter(options) {
        this._reporterState = {
          obj: null,
          path: [],
          options: options || {},
          errors: []
        };
      }

      exports.Reporter = Reporter;

      Reporter.prototype.isError = function isError(obj) {
        return obj instanceof ReporterError;
      };

      Reporter.prototype.save = function save() {
        var state = this._reporterState;
        return {
          obj: state.obj,
          pathLen: state.path.length
        };
      };

      Reporter.prototype.restore = function restore(data) {
        var state = this._reporterState;
        state.obj = data.obj;
        state.path = state.path.slice(0, data.pathLen);
      };

      Reporter.prototype.enterKey = function enterKey(key) {
        return this._reporterState.path.push(key);
      };

      Reporter.prototype.exitKey = function exitKey(index) {
        var state = this._reporterState;
        state.path = state.path.slice(0, index - 1);
      };

      Reporter.prototype.leaveKey = function leaveKey(index, key, value) {
        var state = this._reporterState;
        this.exitKey(index);
        if (state.obj !== null) state.obj[key] = value;
      };

      Reporter.prototype.path = function path() {
        return this._reporterState.path.join('/');
      };

      Reporter.prototype.enterObject = function enterObject() {
        var state = this._reporterState;
        var prev = state.obj;
        state.obj = {};
        return prev;
      };

      Reporter.prototype.leaveObject = function leaveObject(prev) {
        var state = this._reporterState;
        var now = state.obj;
        state.obj = prev;
        return now;
      };

      Reporter.prototype.error = function error(msg) {
        var err;
        var state = this._reporterState;
        var inherited = msg instanceof ReporterError;

        if (inherited) {
          err = msg;
        } else {
          err = new ReporterError(state.path.map(function (elem) {
            return '[' + JSON.stringify(elem) + ']';
          }).join(''), msg.message || msg, msg.stack);
        }

        if (!state.options.partial) throw err;
        if (!inherited) state.errors.push(err);
        return err;
      };

      Reporter.prototype.wrapResult = function wrapResult(result) {
        var state = this._reporterState;
        if (!state.options.partial) return result;
        return {
          result: this.isError(result) ? null : result,
          errors: state.errors
        };
      };

      function ReporterError(path, msg) {
        this.path = path;
        this.rethrow(msg);
      }

      ;
      inherits(ReporterError, Error);

      ReporterError.prototype.rethrow = function rethrow(msg) {
        this.message = msg + ' at: ' + (this.path || '(shallow)');
        if (Error.captureStackTrace) Error.captureStackTrace(this, ReporterError);

        if (!this.stack) {
          try {
            // IE only adds stack when thrown
            throw new Error(this.message);
          } catch (e) {
            this.stack = e.stack;
          }
        }

        return this;
      };
    }, {
      "inherits": 104
    }],
    7: [function (require, module, exports) {
      var constants = require('../constants');

      exports.tagClass = {
        0: 'universal',
        1: 'application',
        2: 'context',
        3: 'private'
      };
      exports.tagClassByName = constants._reverse(exports.tagClass);
      exports.tag = {
        0x00: 'end',
        0x01: 'bool',
        0x02: 'int',
        0x03: 'bitstr',
        0x04: 'octstr',
        0x05: 'null_',
        0x06: 'objid',
        0x07: 'objDesc',
        0x08: 'external',
        0x09: 'real',
        0x0a: 'enum',
        0x0b: 'embed',
        0x0c: 'utf8str',
        0x0d: 'relativeOid',
        0x10: 'seq',
        0x11: 'set',
        0x12: 'numstr',
        0x13: 'printstr',
        0x14: 't61str',
        0x15: 'videostr',
        0x16: 'ia5str',
        0x17: 'utctime',
        0x18: 'gentime',
        0x19: 'graphstr',
        0x1a: 'iso646str',
        0x1b: 'genstr',
        0x1c: 'unistr',
        0x1d: 'charstr',
        0x1e: 'bmpstr'
      };
      exports.tagByName = constants._reverse(exports.tag);
    }, {
      "../constants": 8
    }],
    8: [function (require, module, exports) {
      var constants = exports; // Helper

      constants._reverse = function reverse(map) {
        var res = {};
        Object.keys(map).forEach(function (key) {
          // Convert key to integer if it is stringified
          if ((key | 0) == key) key = key | 0;
          var value = map[key];
          res[value] = key;
        });
        return res;
      };

      constants.der = require('./der');
    }, {
      "./der": 7
    }],
    9: [function (require, module, exports) {
      var inherits = require('inherits');

      var asn1 = require('../../asn1');

      var base = asn1.base;
      var bignum = asn1.bignum; // Import DER constants

      var der = asn1.constants.der;

      function DERDecoder(entity) {
        this.enc = 'der';
        this.name = entity.name;
        this.entity = entity; // Construct base tree

        this.tree = new DERNode();

        this.tree._init(entity.body);
      }

      ;
      module.exports = DERDecoder;

      DERDecoder.prototype.decode = function decode(data, options) {
        if (!(data instanceof base.DecoderBuffer)) data = new base.DecoderBuffer(data, options);
        return this.tree._decode(data, options);
      }; // Tree methods


      function DERNode(parent) {
        base.Node.call(this, 'der', parent);
      }

      inherits(DERNode, base.Node);

      DERNode.prototype._peekTag = function peekTag(buffer, tag, any) {
        if (buffer.isEmpty()) return false;
        var state = buffer.save();
        var decodedTag = derDecodeTag(buffer, 'Failed to peek tag: "' + tag + '"');
        if (buffer.isError(decodedTag)) return decodedTag;
        buffer.restore(state);
        return decodedTag.tag === tag || decodedTag.tagStr === tag || decodedTag.tagStr + 'of' === tag || any;
      };

      DERNode.prototype._decodeTag = function decodeTag(buffer, tag, any) {
        var decodedTag = derDecodeTag(buffer, 'Failed to decode tag of "' + tag + '"');
        if (buffer.isError(decodedTag)) return decodedTag;
        var len = derDecodeLen(buffer, decodedTag.primitive, 'Failed to get length of "' + tag + '"'); // Failure

        if (buffer.isError(len)) return len;

        if (!any && decodedTag.tag !== tag && decodedTag.tagStr !== tag && decodedTag.tagStr + 'of' !== tag) {
          return buffer.error('Failed to match tag: "' + tag + '"');
        }

        if (decodedTag.primitive || len !== null) return buffer.skip(len, 'Failed to match body of: "' + tag + '"'); // Indefinite length... find END tag

        var state = buffer.save();

        var res = this._skipUntilEnd(buffer, 'Failed to skip indefinite length body: "' + this.tag + '"');

        if (buffer.isError(res)) return res;
        len = buffer.offset - state.offset;
        buffer.restore(state);
        return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
      };

      DERNode.prototype._skipUntilEnd = function skipUntilEnd(buffer, fail) {
        while (true) {
          var tag = derDecodeTag(buffer, fail);
          if (buffer.isError(tag)) return tag;
          var len = derDecodeLen(buffer, tag.primitive, fail);
          if (buffer.isError(len)) return len;
          var res;
          if (tag.primitive || len !== null) res = buffer.skip(len);else res = this._skipUntilEnd(buffer, fail); // Failure

          if (buffer.isError(res)) return res;
          if (tag.tagStr === 'end') break;
        }
      };

      DERNode.prototype._decodeList = function decodeList(buffer, tag, decoder, options) {
        var result = [];

        while (!buffer.isEmpty()) {
          var possibleEnd = this._peekTag(buffer, 'end');

          if (buffer.isError(possibleEnd)) return possibleEnd;
          var res = decoder.decode(buffer, 'der', options);
          if (buffer.isError(res) && possibleEnd) break;
          result.push(res);
        }

        return result;
      };

      DERNode.prototype._decodeStr = function decodeStr(buffer, tag) {
        if (tag === 'bitstr') {
          var unused = buffer.readUInt8();
          if (buffer.isError(unused)) return unused;
          return {
            unused: unused,
            data: buffer.raw()
          };
        } else if (tag === 'bmpstr') {
          var raw = buffer.raw();
          if (raw.length % 2 === 1) return buffer.error('Decoding of string type: bmpstr length mismatch');
          var str = '';

          for (var i = 0; i < raw.length / 2; i++) {
            str += String.fromCharCode(raw.readUInt16BE(i * 2));
          }

          return str;
        } else if (tag === 'numstr') {
          var numstr = buffer.raw().toString('ascii');

          if (!this._isNumstr(numstr)) {
            return buffer.error('Decoding of string type: ' + 'numstr unsupported characters');
          }

          return numstr;
        } else if (tag === 'octstr') {
          return buffer.raw();
        } else if (tag === 'objDesc') {
          return buffer.raw();
        } else if (tag === 'printstr') {
          var printstr = buffer.raw().toString('ascii');

          if (!this._isPrintstr(printstr)) {
            return buffer.error('Decoding of string type: ' + 'printstr unsupported characters');
          }

          return printstr;
        } else if (/str$/.test(tag)) {
          return buffer.raw().toString();
        } else {
          return buffer.error('Decoding of string type: ' + tag + ' unsupported');
        }
      };

      DERNode.prototype._decodeObjid = function decodeObjid(buffer, values, relative) {
        var result;
        var identifiers = [];
        var ident = 0;

        while (!buffer.isEmpty()) {
          var subident = buffer.readUInt8();
          ident <<= 7;
          ident |= subident & 0x7f;

          if ((subident & 0x80) === 0) {
            identifiers.push(ident);
            ident = 0;
          }
        }

        if (subident & 0x80) identifiers.push(ident);
        var first = identifiers[0] / 40 | 0;
        var second = identifiers[0] % 40;
        if (relative) result = identifiers;else result = [first, second].concat(identifiers.slice(1));

        if (values) {
          var tmp = values[result.join(' ')];
          if (tmp === undefined) tmp = values[result.join('.')];
          if (tmp !== undefined) result = tmp;
        }

        return result;
      };

      DERNode.prototype._decodeTime = function decodeTime(buffer, tag) {
        var str = buffer.raw().toString();

        if (tag === 'gentime') {
          var year = str.slice(0, 4) | 0;
          var mon = str.slice(4, 6) | 0;
          var day = str.slice(6, 8) | 0;
          var hour = str.slice(8, 10) | 0;
          var min = str.slice(10, 12) | 0;
          var sec = str.slice(12, 14) | 0;
        } else if (tag === 'utctime') {
          var year = str.slice(0, 2) | 0;
          var mon = str.slice(2, 4) | 0;
          var day = str.slice(4, 6) | 0;
          var hour = str.slice(6, 8) | 0;
          var min = str.slice(8, 10) | 0;
          var sec = str.slice(10, 12) | 0;
          if (year < 70) year = 2000 + year;else year = 1900 + year;
        } else {
          return buffer.error('Decoding ' + tag + ' time is not supported yet');
        }

        return Date.UTC(year, mon - 1, day, hour, min, sec, 0);
      };

      DERNode.prototype._decodeNull = function decodeNull(buffer) {
        return null;
      };

      DERNode.prototype._decodeBool = function decodeBool(buffer) {
        var res = buffer.readUInt8();
        if (buffer.isError(res)) return res;else return res !== 0;
      };

      DERNode.prototype._decodeInt = function decodeInt(buffer, values) {
        // Bigint, return as it is (assume big endian)
        var raw = buffer.raw();
        var res = new bignum(raw);
        if (values) res = values[res.toString(10)] || res;
        return res;
      };

      DERNode.prototype._use = function use(entity, obj) {
        if (typeof entity === 'function') entity = entity(obj);
        return entity._getDecoder('der').tree;
      }; // Utility methods


      function derDecodeTag(buf, fail) {
        var tag = buf.readUInt8(fail);
        if (buf.isError(tag)) return tag;
        var cls = der.tagClass[tag >> 6];
        var primitive = (tag & 0x20) === 0; // Multi-octet tag - load

        if ((tag & 0x1f) === 0x1f) {
          var oct = tag;
          tag = 0;

          while ((oct & 0x80) === 0x80) {
            oct = buf.readUInt8(fail);
            if (buf.isError(oct)) return oct;
            tag <<= 7;
            tag |= oct & 0x7f;
          }
        } else {
          tag &= 0x1f;
        }

        var tagStr = der.tag[tag];
        return {
          cls: cls,
          primitive: primitive,
          tag: tag,
          tagStr: tagStr
        };
      }

      function derDecodeLen(buf, primitive, fail) {
        var len = buf.readUInt8(fail);
        if (buf.isError(len)) return len; // Indefinite form

        if (!primitive && len === 0x80) return null; // Definite form

        if ((len & 0x80) === 0) {
          // Short form
          return len;
        } // Long form


        var num = len & 0x7f;
        if (num > 4) return buf.error('length octect is too long');
        len = 0;

        for (var i = 0; i < num; i++) {
          len <<= 8;
          var j = buf.readUInt8(fail);
          if (buf.isError(j)) return j;
          len |= j;
        }

        return len;
      }
    }, {
      "../../asn1": 1,
      "inherits": 104
    }],
    10: [function (require, module, exports) {
      var decoders = exports;
      decoders.der = require('./der');
      decoders.pem = require('./pem');
    }, {
      "./der": 9,
      "./pem": 11
    }],
    11: [function (require, module, exports) {
      var inherits = require('inherits');

      var Buffer = require('buffer').Buffer;

      var DERDecoder = require('./der');

      function PEMDecoder(entity) {
        DERDecoder.call(this, entity);
        this.enc = 'pem';
      }

      ;
      inherits(PEMDecoder, DERDecoder);
      module.exports = PEMDecoder;

      PEMDecoder.prototype.decode = function decode(data, options) {
        var lines = data.toString().split(/[\r\n]+/g);
        var label = options.label.toUpperCase();
        var re = /^-----(BEGIN|END) ([^-]+)-----$/;
        var start = -1;
        var end = -1;

        for (var i = 0; i < lines.length; i++) {
          var match = lines[i].match(re);
          if (match === null) continue;
          if (match[2] !== label) continue;

          if (start === -1) {
            if (match[1] !== 'BEGIN') break;
            start = i;
          } else {
            if (match[1] !== 'END') break;
            end = i;
            break;
          }
        }

        if (start === -1 || end === -1) throw new Error('PEM section not found for: ' + label);
        var base64 = lines.slice(start + 1, end).join(''); // Remove excessive symbols

        base64.replace(/[^a-z0-9\+\/=]+/gi, '');
        var input = new Buffer(base64, 'base64');
        return DERDecoder.prototype.decode.call(this, input, options);
      };
    }, {
      "./der": 9,
      "buffer": 50,
      "inherits": 104
    }],
    12: [function (require, module, exports) {
      var inherits = require('inherits');

      var Buffer = require('buffer').Buffer;

      var asn1 = require('../../asn1');

      var base = asn1.base; // Import DER constants

      var der = asn1.constants.der;

      function DEREncoder(entity) {
        this.enc = 'der';
        this.name = entity.name;
        this.entity = entity; // Construct base tree

        this.tree = new DERNode();

        this.tree._init(entity.body);
      }

      ;
      module.exports = DEREncoder;

      DEREncoder.prototype.encode = function encode(data, reporter) {
        return this.tree._encode(data, reporter).join();
      }; // Tree methods


      function DERNode(parent) {
        base.Node.call(this, 'der', parent);
      }

      inherits(DERNode, base.Node);

      DERNode.prototype._encodeComposite = function encodeComposite(tag, primitive, cls, content) {
        var encodedTag = encodeTag(tag, primitive, cls, this.reporter); // Short form

        if (content.length < 0x80) {
          var header = new Buffer(2);
          header[0] = encodedTag;
          header[1] = content.length;
          return this._createEncoderBuffer([header, content]);
        } // Long form
        // Count octets required to store length


        var lenOctets = 1;

        for (var i = content.length; i >= 0x100; i >>= 8) {
          lenOctets++;
        }

        var header = new Buffer(1 + 1 + lenOctets);
        header[0] = encodedTag;
        header[1] = 0x80 | lenOctets;

        for (var i = 1 + lenOctets, j = content.length; j > 0; i--, j >>= 8) {
          header[i] = j & 0xff;
        }

        return this._createEncoderBuffer([header, content]);
      };

      DERNode.prototype._encodeStr = function encodeStr(str, tag) {
        if (tag === 'bitstr') {
          return this._createEncoderBuffer([str.unused | 0, str.data]);
        } else if (tag === 'bmpstr') {
          var buf = new Buffer(str.length * 2);

          for (var i = 0; i < str.length; i++) {
            buf.writeUInt16BE(str.charCodeAt(i), i * 2);
          }

          return this._createEncoderBuffer(buf);
        } else if (tag === 'numstr') {
          if (!this._isNumstr(str)) {
            return this.reporter.error('Encoding of string type: numstr supports ' + 'only digits and space');
          }

          return this._createEncoderBuffer(str);
        } else if (tag === 'printstr') {
          if (!this._isPrintstr(str)) {
            return this.reporter.error('Encoding of string type: printstr supports ' + 'only latin upper and lower case letters, ' + 'digits, space, apostrophe, left and rigth ' + 'parenthesis, plus sign, comma, hyphen, ' + 'dot, slash, colon, equal sign, ' + 'question mark');
          }

          return this._createEncoderBuffer(str);
        } else if (/str$/.test(tag)) {
          return this._createEncoderBuffer(str);
        } else if (tag === 'objDesc') {
          return this._createEncoderBuffer(str);
        } else {
          return this.reporter.error('Encoding of string type: ' + tag + ' unsupported');
        }
      };

      DERNode.prototype._encodeObjid = function encodeObjid(id, values, relative) {
        if (typeof id === 'string') {
          if (!values) return this.reporter.error('string objid given, but no values map found');
          if (!values.hasOwnProperty(id)) return this.reporter.error('objid not found in values map');
          id = values[id].split(/[\s\.]+/g);

          for (var i = 0; i < id.length; i++) {
            id[i] |= 0;
          }
        } else if (Array.isArray(id)) {
          id = id.slice();

          for (var i = 0; i < id.length; i++) {
            id[i] |= 0;
          }
        }

        if (!Array.isArray(id)) {
          return this.reporter.error('objid() should be either array or string, ' + 'got: ' + JSON.stringify(id));
        }

        if (!relative) {
          if (id[1] >= 40) return this.reporter.error('Second objid identifier OOB');
          id.splice(0, 2, id[0] * 40 + id[1]);
        } // Count number of octets


        var size = 0;

        for (var i = 0; i < id.length; i++) {
          var ident = id[i];

          for (size++; ident >= 0x80; ident >>= 7) {
            size++;
          }
        }

        var objid = new Buffer(size);
        var offset = objid.length - 1;

        for (var i = id.length - 1; i >= 0; i--) {
          var ident = id[i];
          objid[offset--] = ident & 0x7f;

          while ((ident >>= 7) > 0) {
            objid[offset--] = 0x80 | ident & 0x7f;
          }
        }

        return this._createEncoderBuffer(objid);
      };

      function two(num) {
        if (num < 10) return '0' + num;else return num;
      }

      DERNode.prototype._encodeTime = function encodeTime(time, tag) {
        var str;
        var date = new Date(time);

        if (tag === 'gentime') {
          str = [two(date.getFullYear()), two(date.getUTCMonth() + 1), two(date.getUTCDate()), two(date.getUTCHours()), two(date.getUTCMinutes()), two(date.getUTCSeconds()), 'Z'].join('');
        } else if (tag === 'utctime') {
          str = [two(date.getFullYear() % 100), two(date.getUTCMonth() + 1), two(date.getUTCDate()), two(date.getUTCHours()), two(date.getUTCMinutes()), two(date.getUTCSeconds()), 'Z'].join('');
        } else {
          this.reporter.error('Encoding ' + tag + ' time is not supported yet');
        }

        return this._encodeStr(str, 'octstr');
      };

      DERNode.prototype._encodeNull = function encodeNull() {
        return this._createEncoderBuffer('');
      };

      DERNode.prototype._encodeInt = function encodeInt(num, values) {
        if (typeof num === 'string') {
          if (!values) return this.reporter.error('String int or enum given, but no values map');

          if (!values.hasOwnProperty(num)) {
            return this.reporter.error('Values map doesn\'t contain: ' + JSON.stringify(num));
          }

          num = values[num];
        } // Bignum, assume big endian


        if (typeof num !== 'number' && !Buffer.isBuffer(num)) {
          var numArray = num.toArray();

          if (!num.sign && numArray[0] & 0x80) {
            numArray.unshift(0);
          }

          num = new Buffer(numArray);
        }

        if (Buffer.isBuffer(num)) {
          var size = num.length;
          if (num.length === 0) size++;
          var out = new Buffer(size);
          num.copy(out);
          if (num.length === 0) out[0] = 0;
          return this._createEncoderBuffer(out);
        }

        if (num < 0x80) return this._createEncoderBuffer(num);
        if (num < 0x100) return this._createEncoderBuffer([0, num]);
        var size = 1;

        for (var i = num; i >= 0x100; i >>= 8) {
          size++;
        }

        var out = new Array(size);

        for (var i = out.length - 1; i >= 0; i--) {
          out[i] = num & 0xff;
          num >>= 8;
        }

        if (out[0] & 0x80) {
          out.unshift(0);
        }

        return this._createEncoderBuffer(new Buffer(out));
      };

      DERNode.prototype._encodeBool = function encodeBool(value) {
        return this._createEncoderBuffer(value ? 0xff : 0);
      };

      DERNode.prototype._use = function use(entity, obj) {
        if (typeof entity === 'function') entity = entity(obj);
        return entity._getEncoder('der').tree;
      };

      DERNode.prototype._skipDefault = function skipDefault(dataBuffer, reporter, parent) {
        var state = this._baseState;
        var i;
        if (state['default'] === null) return false;
        var data = dataBuffer.join();
        if (state.defaultBuffer === undefined) state.defaultBuffer = this._encodeValue(state['default'], reporter, parent).join();
        if (data.length !== state.defaultBuffer.length) return false;

        for (i = 0; i < data.length; i++) {
          if (data[i] !== state.defaultBuffer[i]) return false;
        }

        return true;
      }; // Utility methods


      function encodeTag(tag, primitive, cls, reporter) {
        var res;
        if (tag === 'seqof') tag = 'seq';else if (tag === 'setof') tag = 'set';
        if (der.tagByName.hasOwnProperty(tag)) res = der.tagByName[tag];else if (typeof tag === 'number' && (tag | 0) === tag) res = tag;else return reporter.error('Unknown tag: ' + tag);
        if (res >= 0x1f) return reporter.error('Multi-octet tag encoding unsupported');
        if (!primitive) res |= 0x20;
        res |= der.tagClassByName[cls || 'universal'] << 6;
        return res;
      }
    }, {
      "../../asn1": 1,
      "buffer": 50,
      "inherits": 104
    }],
    13: [function (require, module, exports) {
      var encoders = exports;
      encoders.der = require('./der');
      encoders.pem = require('./pem');
    }, {
      "./der": 12,
      "./pem": 14
    }],
    14: [function (require, module, exports) {
      var inherits = require('inherits');

      var DEREncoder = require('./der');

      function PEMEncoder(entity) {
        DEREncoder.call(this, entity);
        this.enc = 'pem';
      }

      ;
      inherits(PEMEncoder, DEREncoder);
      module.exports = PEMEncoder;

      PEMEncoder.prototype.encode = function encode(data, options) {
        var buf = DEREncoder.prototype.encode.call(this, data);
        var p = buf.toString('base64');
        var out = ['-----BEGIN ' + options.label + '-----'];

        for (var i = 0; i < p.length; i += 64) {
          out.push(p.slice(i, i + 64));
        }

        out.push('-----END ' + options.label + '-----');
        return out.join('\n');
      };
    }, {
      "./der": 12,
      "inherits": 104
    }],
    15: [function (require, module, exports) {
      (function (global) {
        'use strict';

        var objectAssign = require('object-assign'); // compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
        // original notice:

        /*!
         * The buffer module from node.js, for the browser.
         *
         * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
         * @license  MIT
         */


        function compare(a, b) {
          if (a === b) {
            return 0;
          }

          var x = a.length;
          var y = b.length;

          for (var i = 0, len = Math.min(x, y); i < len; ++i) {
            if (a[i] !== b[i]) {
              x = a[i];
              y = b[i];
              break;
            }
          }

          if (x < y) {
            return -1;
          }

          if (y < x) {
            return 1;
          }

          return 0;
        }

        function isBuffer(b) {
          if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
            return global.Buffer.isBuffer(b);
          }

          return !!(b != null && b._isBuffer);
        } // based on node assert, original notice:
        // NB: The URL to the CommonJS spec is kept just for tradition.
        //     node-assert has evolved a lot since then, both in API and behavior.
        // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
        //
        // THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
        //
        // Originally from narwhal.js (http://narwhaljs.org)
        // Copyright (c) 2009 Thomas Robinson <280north.com>
        //
        // Permission is hereby granted, free of charge, to any person obtaining a copy
        // of this software and associated documentation files (the 'Software'), to
        // deal in the Software without restriction, including without limitation the
        // rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
        // sell copies of the Software, and to permit persons to whom the Software is
        // furnished to do so, subject to the following conditions:
        //
        // The above copyright notice and this permission notice shall be included in
        // all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        // AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
        // ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
        // WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


        var util = require('util/');

        var hasOwn = Object.prototype.hasOwnProperty;
        var pSlice = Array.prototype.slice;

        var functionsHaveNames = function () {
          return function foo() {}.name === 'foo';
        }();

        function pToString(obj) {
          return Object.prototype.toString.call(obj);
        }

        function isView(arrbuf) {
          if (isBuffer(arrbuf)) {
            return false;
          }

          if (typeof global.ArrayBuffer !== 'function') {
            return false;
          }

          if (typeof ArrayBuffer.isView === 'function') {
            return ArrayBuffer.isView(arrbuf);
          }

          if (!arrbuf) {
            return false;
          }

          if (arrbuf instanceof DataView) {
            return true;
          }

          if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
            return true;
          }

          return false;
        } // 1. The assert module provides functions that throw
        // AssertionError's when particular conditions are not met. The
        // assert module must conform to the following interface.


        var assert = module.exports = ok; // 2. The AssertionError is defined in assert.
        // new assert.AssertionError({ message: message,
        //                             actual: actual,
        //                             expected: expected })

        var regex = /\s*function\s+([^\(\s]*)\s*/; // based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js

        function getName(func) {
          if (!util.isFunction(func)) {
            return;
          }

          if (functionsHaveNames) {
            return func.name;
          }

          var str = func.toString();
          var match = str.match(regex);
          return match && match[1];
        }

        assert.AssertionError = function AssertionError(options) {
          this.name = 'AssertionError';
          this.actual = options.actual;
          this.expected = options.expected;
          this.operator = options.operator;

          if (options.message) {
            this.message = options.message;
            this.generatedMessage = false;
          } else {
            this.message = getMessage(this);
            this.generatedMessage = true;
          }

          var stackStartFunction = options.stackStartFunction || fail;

          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, stackStartFunction);
          } else {
            // non v8 browsers so we can have a stacktrace
            var err = new Error();

            if (err.stack) {
              var out = err.stack; // try to strip useless frames

              var fn_name = getName(stackStartFunction);
              var idx = out.indexOf('\n' + fn_name);

              if (idx >= 0) {
                // once we have located the function frame
                // we need to strip out everything before it (and its line)
                var next_line = out.indexOf('\n', idx + 1);
                out = out.substring(next_line + 1);
              }

              this.stack = out;
            }
          }
        }; // assert.AssertionError instanceof Error


        util.inherits(assert.AssertionError, Error);

        function truncate(s, n) {
          if (typeof s === 'string') {
            return s.length < n ? s : s.slice(0, n);
          } else {
            return s;
          }
        }

        function inspect(something) {
          if (functionsHaveNames || !util.isFunction(something)) {
            return util.inspect(something);
          }

          var rawname = getName(something);
          var name = rawname ? ': ' + rawname : '';
          return '[Function' + name + ']';
        }

        function getMessage(self) {
          return truncate(inspect(self.actual), 128) + ' ' + self.operator + ' ' + truncate(inspect(self.expected), 128);
        } // At present only the three keys mentioned above are used and
        // understood by the spec. Implementations or sub modules can pass
        // other keys to the AssertionError's constructor - they will be
        // ignored.
        // 3. All of the following functions must throw an AssertionError
        // when a corresponding condition is not met, with a message that
        // may be undefined if not provided.  All assertion methods provide
        // both the actual and expected values to the assertion error for
        // display purposes.


        function fail(actual, expected, message, operator, stackStartFunction) {
          throw new assert.AssertionError({
            message: message,
            actual: actual,
            expected: expected,
            operator: operator,
            stackStartFunction: stackStartFunction
          });
        } // EXTENSION! allows for well behaved errors defined elsewhere.


        assert.fail = fail; // 4. Pure assertion tests whether a value is truthy, as determined
        // by !!guard.
        // assert.ok(guard, message_opt);
        // This statement is equivalent to assert.equal(true, !!guard,
        // message_opt);. To test strictly for the value true, use
        // assert.strictEqual(true, guard, message_opt);.

        function ok(value, message) {
          if (!value) fail(value, true, message, '==', assert.ok);
        }

        assert.ok = ok; // 5. The equality assertion tests shallow, coercive equality with
        // ==.
        // assert.equal(actual, expected, message_opt);

        assert.equal = function equal(actual, expected, message) {
          if (actual != expected) fail(actual, expected, message, '==', assert.equal);
        }; // 6. The non-equality assertion tests for whether two objects are not equal
        // with != assert.notEqual(actual, expected, message_opt);


        assert.notEqual = function notEqual(actual, expected, message) {
          if (actual == expected) {
            fail(actual, expected, message, '!=', assert.notEqual);
          }
        }; // 7. The equivalence assertion tests a deep equality relation.
        // assert.deepEqual(actual, expected, message_opt);


        assert.deepEqual = function deepEqual(actual, expected, message) {
          if (!_deepEqual(actual, expected, false)) {
            fail(actual, expected, message, 'deepEqual', assert.deepEqual);
          }
        };

        assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
          if (!_deepEqual(actual, expected, true)) {
            fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
          }
        };

        function _deepEqual(actual, expected, strict, memos) {
          // 7.1. All identical values are equivalent, as determined by ===.
          if (actual === expected) {
            return true;
          } else if (isBuffer(actual) && isBuffer(expected)) {
            return compare(actual, expected) === 0; // 7.2. If the expected value is a Date object, the actual value is
            // equivalent if it is also a Date object that refers to the same time.
          } else if (util.isDate(actual) && util.isDate(expected)) {
            return actual.getTime() === expected.getTime(); // 7.3 If the expected value is a RegExp object, the actual value is
            // equivalent if it is also a RegExp object with the same source and
            // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
          } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
            return actual.source === expected.source && actual.global === expected.global && actual.multiline === expected.multiline && actual.lastIndex === expected.lastIndex && actual.ignoreCase === expected.ignoreCase; // 7.4. Other pairs that do not both pass typeof value == 'object',
            // equivalence is determined by ==.
          } else if ((actual === null || _typeof(actual) !== 'object') && (expected === null || _typeof(expected) !== 'object')) {
            return strict ? actual === expected : actual == expected; // If both values are instances of typed arrays, wrap their underlying
            // ArrayBuffers in a Buffer each to increase performance
            // This optimization requires the arrays to have the same type as checked by
            // Object.prototype.toString (aka pToString). Never perform binary
            // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
            // bit patterns are not identical.
          } else if (isView(actual) && isView(expected) && pToString(actual) === pToString(expected) && !(actual instanceof Float32Array || actual instanceof Float64Array)) {
            return compare(new Uint8Array(actual.buffer), new Uint8Array(expected.buffer)) === 0; // 7.5 For all other Object pairs, including Array objects, equivalence is
            // determined by having the same number of owned properties (as verified
            // with Object.prototype.hasOwnProperty.call), the same set of keys
            // (although not necessarily the same order), equivalent values for every
            // corresponding key, and an identical 'prototype' property. Note: this
            // accounts for both named and indexed properties on Arrays.
          } else if (isBuffer(actual) !== isBuffer(expected)) {
            return false;
          } else {
            memos = memos || {
              actual: [],
              expected: []
            };
            var actualIndex = memos.actual.indexOf(actual);

            if (actualIndex !== -1) {
              if (actualIndex === memos.expected.indexOf(expected)) {
                return true;
              }
            }

            memos.actual.push(actual);
            memos.expected.push(expected);
            return objEquiv(actual, expected, strict, memos);
          }
        }

        function isArguments(object) {
          return Object.prototype.toString.call(object) == '[object Arguments]';
        }

        function objEquiv(a, b, strict, actualVisitedObjects) {
          if (a === null || a === undefined || b === null || b === undefined) return false; // if one is a primitive, the other must be same

          if (util.isPrimitive(a) || util.isPrimitive(b)) return a === b;
          if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
          var aIsArgs = isArguments(a);
          var bIsArgs = isArguments(b);
          if (aIsArgs && !bIsArgs || !aIsArgs && bIsArgs) return false;

          if (aIsArgs) {
            a = pSlice.call(a);
            b = pSlice.call(b);
            return _deepEqual(a, b, strict);
          }

          var ka = objectKeys(a);
          var kb = objectKeys(b);
          var key, i; // having the same number of owned properties (keys incorporates
          // hasOwnProperty)

          if (ka.length !== kb.length) return false; //the same set of keys (although not necessarily the same order),

          ka.sort();
          kb.sort(); //~~~cheap key test

          for (i = ka.length - 1; i >= 0; i--) {
            if (ka[i] !== kb[i]) return false;
          } //equivalent values for every corresponding key, and
          //~~~possibly expensive deep test


          for (i = ka.length - 1; i >= 0; i--) {
            key = ka[i];
            if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects)) return false;
          }

          return true;
        } // 8. The non-equivalence assertion tests for any deep inequality.
        // assert.notDeepEqual(actual, expected, message_opt);


        assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
          if (_deepEqual(actual, expected, false)) {
            fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
          }
        };

        assert.notDeepStrictEqual = notDeepStrictEqual;

        function notDeepStrictEqual(actual, expected, message) {
          if (_deepEqual(actual, expected, true)) {
            fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
          }
        } // 9. The strict equality assertion tests strict equality, as determined by ===.
        // assert.strictEqual(actual, expected, message_opt);


        assert.strictEqual = function strictEqual(actual, expected, message) {
          if (actual !== expected) {
            fail(actual, expected, message, '===', assert.strictEqual);
          }
        }; // 10. The strict non-equality assertion tests for strict inequality, as
        // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);


        assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
          if (actual === expected) {
            fail(actual, expected, message, '!==', assert.notStrictEqual);
          }
        };

        function expectedException(actual, expected) {
          if (!actual || !expected) {
            return false;
          }

          if (Object.prototype.toString.call(expected) == '[object RegExp]') {
            return expected.test(actual);
          }

          try {
            if (actual instanceof expected) {
              return true;
            }
          } catch (e) {// Ignore.  The instanceof check doesn't work for arrow functions.
          }

          if (Error.isPrototypeOf(expected)) {
            return false;
          }

          return expected.call({}, actual) === true;
        }

        function _tryBlock(block) {
          var error;

          try {
            block();
          } catch (e) {
            error = e;
          }

          return error;
        }

        function _throws(shouldThrow, block, expected, message) {
          var actual;

          if (typeof block !== 'function') {
            throw new TypeError('"block" argument must be a function');
          }

          if (typeof expected === 'string') {
            message = expected;
            expected = null;
          }

          actual = _tryBlock(block);
          message = (expected && expected.name ? ' (' + expected.name + ').' : '.') + (message ? ' ' + message : '.');

          if (shouldThrow && !actual) {
            fail(actual, expected, 'Missing expected exception' + message);
          }

          var userProvidedMessage = typeof message === 'string';
          var isUnwantedException = !shouldThrow && util.isError(actual);
          var isUnexpectedException = !shouldThrow && actual && !expected;

          if (isUnwantedException && userProvidedMessage && expectedException(actual, expected) || isUnexpectedException) {
            fail(actual, expected, 'Got unwanted exception' + message);
          }

          if (shouldThrow && actual && expected && !expectedException(actual, expected) || !shouldThrow && actual) {
            throw actual;
          }
        } // 11. Expected to throw an error:
        // assert.throws(block, Error_opt, message_opt);


        assert["throws"] = function (block,
        /*optional*/
        error,
        /*optional*/
        message) {
          _throws(true, block, error, message);
        }; // EXTENSION! This is annoying to write outside this module.


        assert.doesNotThrow = function (block,
        /*optional*/
        error,
        /*optional*/
        message) {
          _throws(false, block, error, message);
        };

        assert.ifError = function (err) {
          if (err) throw err;
        }; // Expose a strict only variant of assert


        function strict(value, message) {
          if (!value) fail(value, true, message, '==', strict);
        }

        assert.strict = objectAssign(strict, assert, {
          equal: assert.strictEqual,
          deepEqual: assert.deepStrictEqual,
          notEqual: assert.notStrictEqual,
          notDeepEqual: assert.notDeepStrictEqual
        });
        assert.strict.strict = assert.strict;

        var objectKeys = Object.keys || function (obj) {
          var keys = [];

          for (var key in obj) {
            if (hasOwn.call(obj, key)) keys.push(key);
          }

          return keys;
        };
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
      "object-assign": 111,
      "util/": 18
    }],
    16: [function (require, module, exports) {
      if (typeof Object.create === 'function') {
        // implementation from standard node.js 'util' module
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        };
      } else {
        // old school shim for old browsers
        module.exports = function inherits(ctor, superCtor) {
          ctor.super_ = superCtor;

          var TempCtor = function TempCtor() {};

          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        };
      }
    }, {}],
    17: [function (require, module, exports) {
      module.exports = function isBuffer(arg) {
        return arg && _typeof(arg) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
      };
    }, {}],
    18: [function (require, module, exports) {
      (function (process, global) {
        // Copyright Joyent, Inc. and other Node contributors.
        //
        // Permission is hereby granted, free of charge, to any person obtaining a
        // copy of this software and associated documentation files (the
        // "Software"), to deal in the Software without restriction, including
        // without limitation the rights to use, copy, modify, merge, publish,
        // distribute, sublicense, and/or sell copies of the Software, and to permit
        // persons to whom the Software is furnished to do so, subject to the
        // following conditions:
        //
        // The above copyright notice and this permission notice shall be included
        // in all copies or substantial portions of the Software.
        //
        // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
        // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
        // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
        // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
        // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
        // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
        // USE OR OTHER DEALINGS IN THE SOFTWARE.
        var formatRegExp = /%[sdj%]/g;

        exports.format = function (f) {
          if (!isString(f)) {
            var objects = [];

            for (var i = 0; i < arguments.length; i++) {
              objects.push(inspect(arguments[i]));
            }

            return objects.join(' ');
          }

          var i = 1;
          var args = arguments;
          var len = args.length;
          var str = String(f).replace(formatRegExp, function (x) {
            if (x === '%%') return '%';
            if (i >= len) return x;

            switch (x) {
              case '%s':
                return String(args[i++]);

              case '%d':
                return Number(args[i++]);

              case '%j':
                try {
                  return JSON.stringify(args[i++]);
                } catch (_) {
                  return '[Circular]';
                }

              default:
                return x;
            }
          });

          for (var x = args[i]; i < len; x = args[++i]) {
            if (isNull(x) || !isObject(x)) {
              str += ' ' + x;
            } else {
              str += ' ' + inspect(x);
            }
          }

          return str;
        }; // Mark that a method should not be used.
        // Returns a modified function which warns once by default.
        // If --no-deprecation is set, then it is a no-op.


        exports.deprecate = function (fn, msg) {
          // Allow for deprecating things in the process of starting up.
          if (isUndefined(global.process)) {
            return function () {
              return exports.deprecate(fn, msg).apply(this, arguments);
            };
          }

          if (process.noDeprecation === true) {
            return fn;
          }

          var warned = false;

          function deprecated() {
            if (!warned) {
              if (process.throwDeprecation) {
                throw new Error(msg);
              } else if (process.traceDeprecation) {
                console.trace(msg);
              } else {
                console.error(msg);
              }

              warned = true;
            }

            return fn.apply(this, arguments);
          }

          return deprecated;
        };

        var debugs = {};
        var debugEnviron;

        exports.debuglog = function (set) {
          if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
          set = set.toUpperCase();

          if (!debugs[set]) {
            if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
              var pid = process.pid;

              debugs[set] = function () {
                var msg = exports.format.apply(exports, arguments);
                console.error('%s %d: %s', set, pid, msg);
              };
            } else {
              debugs[set] = function () {};
            }
          }

          return debugs[set];
        };
        /**
         * Echos the value of a value. Trys to print the value out
         * in the best way possible given the different types.
         *
         * @param {Object} obj The object to print out.
         * @param {Object} opts Optional options object that alters the output.
         */

        /* legacy: obj, showHidden, depth, colors*/


        function inspect(obj, opts) {
          // default options
          var ctx = {
            seen: [],
            stylize: stylizeNoColor
          }; // legacy...

          if (arguments.length >= 3) ctx.depth = arguments[2];
          if (arguments.length >= 4) ctx.colors = arguments[3];

          if (isBoolean(opts)) {
            // legacy...
            ctx.showHidden = opts;
          } else if (opts) {
            // got an "options" object
            exports._extend(ctx, opts);
          } // set default options


          if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
          if (isUndefined(ctx.depth)) ctx.depth = 2;
          if (isUndefined(ctx.colors)) ctx.colors = false;
          if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
          if (ctx.colors) ctx.stylize = stylizeWithColor;
          return formatValue(ctx, obj, ctx.depth);
        }

        exports.inspect = inspect; // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics

        inspect.colors = {
          'bold': [1, 22],
          'italic': [3, 23],
          'underline': [4, 24],
          'inverse': [7, 27],
          'white': [37, 39],
          'grey': [90, 39],
          'black': [30, 39],
          'blue': [34, 39],
          'cyan': [36, 39],
          'green': [32, 39],
          'magenta': [35, 39],
          'red': [31, 39],
          'yellow': [33, 39]
        }; // Don't use 'blue' not visible on cmd.exe

        inspect.styles = {
          'special': 'cyan',
          'number': 'yellow',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red'
        };

        function stylizeWithColor(str, styleType) {
          var style = inspect.styles[styleType];

          if (style) {
            return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
          } else {
            return str;
          }
        }

        function stylizeNoColor(str, styleType) {
          return str;
        }

        function arrayToHash(array) {
          var hash = {};
          array.forEach(function (val, idx) {
            hash[val] = true;
          });
          return hash;
        }

        function formatValue(ctx, value, recurseTimes) {
          // Provide a hook for user-specified inspect functions.
          // Check that value is an object with an inspect function on it
          if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
          value.inspect !== exports.inspect && // Also filter out any prototype objects using the circular check.
          !(value.constructor && value.constructor.prototype === value)) {
            var ret = value.inspect(recurseTimes, ctx);

            if (!isString(ret)) {
              ret = formatValue(ctx, ret, recurseTimes);
            }

            return ret;
          } // Primitive types cannot have properties


          var primitive = formatPrimitive(ctx, value);

          if (primitive) {
            return primitive;
          } // Look up the keys of the object.


          var keys = Object.keys(value);
          var visibleKeys = arrayToHash(keys);

          if (ctx.showHidden) {
            keys = Object.getOwnPropertyNames(value);
          } // IE doesn't make error fields non-enumerable
          // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx


          if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
            return formatError(value);
          } // Some type of object without properties can be shortcutted.


          if (keys.length === 0) {
            if (isFunction(value)) {
              var name = value.name ? ': ' + value.name : '';
              return ctx.stylize('[Function' + name + ']', 'special');
            }

            if (isRegExp(value)) {
              return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
            }

            if (isDate(value)) {
              return ctx.stylize(Date.prototype.toString.call(value), 'date');
            }

            if (isError(value)) {
              return formatError(value);
            }
          }

          var base = '',
              array = false,
              braces = ['{', '}']; // Make Array say that they are Array

          if (isArray(value)) {
            array = true;
            braces = ['[', ']'];
          } // Make functions say that they are functions


          if (isFunction(value)) {
            var n = value.name ? ': ' + value.name : '';
            base = ' [Function' + n + ']';
          } // Make RegExps say that they are RegExps


          if (isRegExp(value)) {
            base = ' ' + RegExp.prototype.toString.call(value);
          } // Make dates with properties first say the date


          if (isDate(value)) {
            base = ' ' + Date.prototype.toUTCString.call(value);
          } // Make error with message first say the error


          if (isError(value)) {
            base = ' ' + formatError(value);
          }

          if (keys.length === 0 && (!array || value.length == 0)) {
            return braces[0] + base + braces[1];
          }

          if (recurseTimes < 0) {
            if (isRegExp(value)) {
              return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
            } else {
              return ctx.stylize('[Object]', 'special');
            }
          }

          ctx.seen.push(value);
          var output;

          if (array) {
            output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
          } else {
            output = keys.map(function (key) {
              return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
            });
          }

          ctx.seen.pop();
          return reduceToSingleString(output, base, braces);
        }

        function formatPrimitive(ctx, value) {
          if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');

          if (isString(value)) {
            var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
            return ctx.stylize(simple, 'string');
          }

          if (isNumber(value)) return ctx.stylize('' + value, 'number');
          if (isBoolean(value)) return ctx.stylize('' + value, 'boolean'); // For some reason typeof null is "object", so special case here.

          if (isNull(value)) return ctx.stylize('null', 'null');
        }

        function formatError(value) {
          return '[' + Error.prototype.toString.call(value) + ']';
        }

        function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
          var output = [];

          for (var i = 0, l = value.length; i < l; ++i) {
            if (hasOwnProperty(value, String(i))) {
              output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
            } else {
              output.push('');
            }
          }

          keys.forEach(function (key) {
            if (!key.match(/^\d+$/)) {
              output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
            }
          });
          return output;
        }

        function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
          var name, str, desc;
          desc = Object.getOwnPropertyDescriptor(value, key) || {
            value: value[key]
          };

          if (desc.get) {
            if (desc.set) {
              str = ctx.stylize('[Getter/Setter]', 'special');
            } else {
              str = ctx.stylize('[Getter]', 'special');
            }
          } else {
            if (desc.set) {
              str = ctx.stylize('[Setter]', 'special');
            }
          }

          if (!hasOwnProperty(visibleKeys, key)) {
            name = '[' + key + ']';
          }

          if (!str) {
            if (ctx.seen.indexOf(desc.value) < 0) {
              if (isNull(recurseTimes)) {
                str = formatValue(ctx, desc.value, null);
              } else {
                str = formatValue(ctx, desc.value, recurseTimes - 1);
              }

              if (str.indexOf('\n') > -1) {
                if (array) {
                  str = str.split('\n').map(function (line) {
                    return '  ' + line;
                  }).join('\n').substr(2);
                } else {
                  str = '\n' + str.split('\n').map(function (line) {
                    return '   ' + line;
                  }).join('\n');
                }
              }
            } else {
              str = ctx.stylize('[Circular]', 'special');
            }
          }

          if (isUndefined(name)) {
            if (array && key.match(/^\d+$/)) {
              return str;
            }

            name = JSON.stringify('' + key);

            if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
              name = name.substr(1, name.length - 2);
              name = ctx.stylize(name, 'name');
            } else {
              name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
              name = ctx.stylize(name, 'string');
            }
          }

          return name + ': ' + str;
        }

        function reduceToSingleString(output, base, braces) {
          var numLinesEst = 0;
          var length = output.reduce(function (prev, cur) {
            numLinesEst++;
            if (cur.indexOf('\n') >= 0) numLinesEst++;
            return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
          }, 0);

          if (length > 60) {
            return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
          }

          return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
        } // NOTE: These type checking functions intentionally don't use `instanceof`
        // because it is fragile and can be easily faked with `Object.create()`.


        function isArray(ar) {
          return Array.isArray(ar);
        }

        exports.isArray = isArray;

        function isBoolean(arg) {
          return typeof arg === 'boolean';
        }

        exports.isBoolean = isBoolean;

        function isNull(arg) {
          return arg === null;
        }

        exports.isNull = isNull;

        function isNullOrUndefined(arg) {
          return arg == null;
        }

        exports.isNullOrUndefined = isNullOrUndefined;

        function isNumber(arg) {
          return typeof arg === 'number';
        }

        exports.isNumber = isNumber;

        function isString(arg) {
          return typeof arg === 'string';
        }

        exports.isString = isString;

        function isSymbol(arg) {
          return _typeof(arg) === 'symbol';
        }

        exports.isSymbol = isSymbol;

        function isUndefined(arg) {
          return arg === void 0;
        }

        exports.isUndefined = isUndefined;

        function isRegExp(re) {
          return isObject(re) && objectToString(re) === '[object RegExp]';
        }

        exports.isRegExp = isRegExp;

        function isObject(arg) {
          return _typeof(arg) === 'object' && arg !== null;
        }

        exports.isObject = isObject;

        function isDate(d) {
          return isObject(d) && objectToString(d) === '[object Date]';
        }

        exports.isDate = isDate;

        function isError(e) {
          return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
        }

        exports.isError = isError;

        function isFunction(arg) {
          return typeof arg === 'function';
        }

        exports.isFunction = isFunction;

        function isPrimitive(arg) {
          return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || _typeof(arg) === 'symbol' || // ES6 symbol
          typeof arg === 'undefined';
        }

        exports.isPrimitive = isPrimitive;
        exports.isBuffer = require('./support/isBuffer');

        function objectToString(o) {
          return Object.prototype.toString.call(o);
        }

        function pad(n) {
          return n < 10 ? '0' + n.toString(10) : n.toString(10);
        }

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // 26 Feb 16:19:34

        function timestamp() {
          var d = new Date();
          var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
          return [d.getDate(), months[d.getMonth()], time].join(' ');
        } // log is just a thin wrapper to console.log that prepends a timestamp


        exports.log = function () {
          console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
        };
        /**
         * Inherit the prototype methods from one constructor into another.
         *
         * The Function.prototype.inherits from lang.js rewritten as a standalone
         * function (not on Function.prototype). NOTE: If this file is to be loaded
         * during bootstrapping this function needs to be rewritten using some native
         * functions as prototype setup using normal JavaScript does not work as
         * expected during bootstrapping (see mirror.js in r114903).
         *
         * @param {function} ctor Constructor function which needs to inherit the
         *     prototype.
         * @param {function} superCtor Constructor function to inherit prototype from.
         */


        exports.inherits = require('inherits');

        exports._extend = function (origin, add) {
          // Don't do anything if add isn't an object
          if (!add || !isObject(add)) return origin;
          var keys = Object.keys(add);
          var i = keys.length;

          while (i--) {
            origin[keys[i]] = add[keys[i]];
          }

          return origin;
        };

        function hasOwnProperty(obj, prop) {
          return Object.prototype.hasOwnProperty.call(obj, prop);
        }
      }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
      "./support/isBuffer": 17,
      "_process": 124,
      "inherits": 16
    }],
    19: [function (require, module, exports) {
      'use strict';

      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
      var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

      for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      } // Support decoding URL-safe base64 strings, as Node.js does.
      // See: https://en.wikipedia.org/wiki/Base64#URL_applications


      revLookup['-'.charCodeAt(0)] = 62;
      revLookup['_'.charCodeAt(0)] = 63;

      function getLens(b64) {
        var len = b64.length;

        if (len % 4 > 0) {
          throw new Error('Invalid string. Length must be a multiple of 4');
        } // Trim off extra bytes after placeholder bytes are found
        // See: https://github.com/beatgammit/base64-js/issues/42


        var validLen = b64.indexOf('=');
        if (validLen === -1) validLen = len;
        var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      } // base64 is 4/3 + up to two characters of the original data


      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }

      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }

      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0; // if there are placeholders, only get up to the last complete 4 chars

        var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

        for (var i = 0; i < len; i += 4) {
          tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
          arr[curByte++] = tmp >> 16 & 0xFF;
          arr[curByte++] = tmp >> 8 & 0xFF;
          arr[curByte++] = tmp & 0xFF;
        }

        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
          arr[curByte++] = tmp & 0xFF;
        }

        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 0xFF;
          arr[curByte++] = tmp & 0xFF;
        }

        return arr;
      }

      function tripletToBase64(num) {
        return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
      }

      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];

        for (var i = start; i < end; i += 3) {
          tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
          output.push(tripletToBase64(tmp));
        }

        return output.join('');
      }

      function fromByteArray(uint8) {
        var tmp;
        var len = uint8.length;
        var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

        var parts = [];
        var maxChunkLength = 16383; // must be multiple of 3
        // go through the array every three bytes, we'll deal with trailing stuff later

        for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
          parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
        } // pad the end with zeros, but make sure to not forget the extra bytes


        if (extraBytes === 1) {
          tmp = uint8[len - 1];
          parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
        } else if (extraBytes === 2) {
          tmp = (uint8[len - 2] << 8) + uint8[len - 1];
          parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
        }

        return parts.join('');
      }
    }, {}],
    20: [function (require, module, exports) {
      var r;

      module.exports = function rand(len) {
        if (!r) r = new Rand(null);
        return r.generate(len);
      };

      function Rand(rand) {
        this.rand = rand;
      }

      module.exports.Rand = Rand;

      Rand.prototype.generate = function generate(len) {
        return this._rand(len);
      }; // Emulate crypto API using randy


      Rand.prototype._rand = function _rand(n) {
        if (this.rand.getBytes) return this.rand.getBytes(n);
        var res = new Uint8Array(n);

        for (var i = 0; i < res.length; i++) {
          res[i] = this.rand.getByte();
        }

        return res;
      };

      if ((typeof self === "undefined" ? "undefined" : _typeof(self)) === 'object') {
        if (self.crypto && self.crypto.getRandomValues) {
          // Modern browsers
          Rand.prototype._rand = function _rand(n) {
            var arr = new Uint8Array(n);
            self.crypto.getRandomValues(arr);
            return arr;
          };
        } else if (self.msCrypto && self.msCrypto.getRandomValues) {
          // IE
          Rand.prototype._rand = function _rand(n) {
            var arr = new Uint8Array(n);
            self.msCrypto.getRandomValues(arr);
            return arr;
          }; // Safari's WebWorkers do not have `crypto`

        } else if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object') {
          // Old junk
          Rand.prototype._rand = function () {
            throw new Error('Not implemented yet');
          };
        }
      } else {
        // Node.js or Web worker with no crypto support
        try {
          var crypto = require('crypto');

          if (typeof crypto.randomBytes !== 'function') throw new Error('Not supported');

          Rand.prototype._rand = function _rand(n) {
            return crypto.randomBytes(n);
          };
        } catch (e) {}
      }
    }, {
      "crypto": 21
    }],
    21: [function (require, module, exports) {}, {}],
    22: [function (require, module, exports) {
      // based on the aes implimentation in triple sec
      // https://github.com/keybase/triplesec
      // which is in turn based on the one from crypto-js
      // https://code.google.com/p/crypto-js/
      var Buffer = require('safe-buffer').Buffer;

      function asUInt32Array(buf) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
        var len = buf.length / 4 | 0;
        var out = new Array(len);

        for (var i = 0; i < len; i++) {
          out[i] = buf.readUInt32BE(i * 4);
        }

        return out;
      }

      function scrubVec(v) {
        for (var i = 0; i < v.length; v++) {
          v[i] = 0;
        }
      }

      function cryptBlock(M, keySchedule, SUB_MIX, SBOX, nRounds) {
        var SUB_MIX0 = SUB_MIX[0];
        var SUB_MIX1 = SUB_MIX[1];
        var SUB_MIX2 = SUB_MIX[2];
        var SUB_MIX3 = SUB_MIX[3];
        var s0 = M[0] ^ keySchedule[0];
        var s1 = M[1] ^ keySchedule[1];
        var s2 = M[2] ^ keySchedule[2];
        var s3 = M[3] ^ keySchedule[3];
        var t0, t1, t2, t3;
        var ksRow = 4;

        for (var round = 1; round < nRounds; round++) {
          t0 = SUB_MIX0[s0 >>> 24] ^ SUB_MIX1[s1 >>> 16 & 0xff] ^ SUB_MIX2[s2 >>> 8 & 0xff] ^ SUB_MIX3[s3 & 0xff] ^ keySchedule[ksRow++];
          t1 = SUB_MIX0[s1 >>> 24] ^ SUB_MIX1[s2 >>> 16 & 0xff] ^ SUB_MIX2[s3 >>> 8 & 0xff] ^ SUB_MIX3[s0 & 0xff] ^ keySchedule[ksRow++];
          t2 = SUB_MIX0[s2 >>> 24] ^ SUB_MIX1[s3 >>> 16 & 0xff] ^ SUB_MIX2[s0 >>> 8 & 0xff] ^ SUB_MIX3[s1 & 0xff] ^ keySchedule[ksRow++];
          t3 = SUB_MIX0[s3 >>> 24] ^ SUB_MIX1[s0 >>> 16 & 0xff] ^ SUB_MIX2[s1 >>> 8 & 0xff] ^ SUB_MIX3[s2 & 0xff] ^ keySchedule[ksRow++];
          s0 = t0;
          s1 = t1;
          s2 = t2;
          s3 = t3;
        }

        t0 = (SBOX[s0 >>> 24] << 24 | SBOX[s1 >>> 16 & 0xff] << 16 | SBOX[s2 >>> 8 & 0xff] << 8 | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
        t1 = (SBOX[s1 >>> 24] << 24 | SBOX[s2 >>> 16 & 0xff] << 16 | SBOX[s3 >>> 8 & 0xff] << 8 | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
        t2 = (SBOX[s2 >>> 24] << 24 | SBOX[s3 >>> 16 & 0xff] << 16 | SBOX[s0 >>> 8 & 0xff] << 8 | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
        t3 = (SBOX[s3 >>> 24] << 24 | SBOX[s0 >>> 16 & 0xff] << 16 | SBOX[s1 >>> 8 & 0xff] << 8 | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];
        t0 = t0 >>> 0;
        t1 = t1 >>> 0;
        t2 = t2 >>> 0;
        t3 = t3 >>> 0;
        return [t0, t1, t2, t3];
      } // AES constants


      var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

      var G = function () {
        // Compute double table
        var d = new Array(256);

        for (var j = 0; j < 256; j++) {
          if (j < 128) {
            d[j] = j << 1;
          } else {
            d[j] = j << 1 ^ 0x11b;
          }
        }

        var SBOX = [];
        var INV_SBOX = [];
        var SUB_MIX = [[], [], [], []];
        var INV_SUB_MIX = [[], [], [], []]; // Walk GF(2^8)

        var x = 0;
        var xi = 0;

        for (var i = 0; i < 256; ++i) {
          // Compute sbox
          var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
          sx = sx >>> 8 ^ sx & 0xff ^ 0x63;
          SBOX[x] = sx;
          INV_SBOX[sx] = x; // Compute multiplication

          var x2 = d[x];
          var x4 = d[x2];
          var x8 = d[x4]; // Compute sub bytes, mix columns tables

          var t = d[sx] * 0x101 ^ sx * 0x1010100;
          SUB_MIX[0][x] = t << 24 | t >>> 8;
          SUB_MIX[1][x] = t << 16 | t >>> 16;
          SUB_MIX[2][x] = t << 8 | t >>> 24;
          SUB_MIX[3][x] = t; // Compute inv sub bytes, inv mix columns tables

          t = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
          INV_SUB_MIX[0][sx] = t << 24 | t >>> 8;
          INV_SUB_MIX[1][sx] = t << 16 | t >>> 16;
          INV_SUB_MIX[2][sx] = t << 8 | t >>> 24;
          INV_SUB_MIX[3][sx] = t;

          if (x === 0) {
            x = xi = 1;
          } else {
            x = x2 ^ d[d[d[x8 ^ x2]]];
            xi ^= d[d[xi]];
          }
        }

        return {
          SBOX: SBOX,
          INV_SBOX: INV_SBOX,
          SUB_MIX: SUB_MIX,
          INV_SUB_MIX: INV_SUB_MIX
        };
      }();

      function AES(key) {
        this._key = asUInt32Array(key);

        this._reset();
      }

      AES.blockSize = 4 * 4;
      AES.keySize = 256 / 8;
      AES.prototype.blockSize = AES.blockSize;
      AES.prototype.keySize = AES.keySize;

      AES.prototype._reset = function () {
        var keyWords = this._key;
        var keySize = keyWords.length;
        var nRounds = keySize + 6;
        var ksRows = (nRounds + 1) * 4;
        var keySchedule = [];

        for (var k = 0; k < keySize; k++) {
          keySchedule[k] = keyWords[k];
        }

        for (k = keySize; k < ksRows; k++) {
          var t = keySchedule[k - 1];

          if (k % keySize === 0) {
            t = t << 8 | t >>> 24;
            t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 0xff] << 16 | G.SBOX[t >>> 8 & 0xff] << 8 | G.SBOX[t & 0xff];
            t ^= RCON[k / keySize | 0] << 24;
          } else if (keySize > 6 && k % keySize === 4) {
            t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 0xff] << 16 | G.SBOX[t >>> 8 & 0xff] << 8 | G.SBOX[t & 0xff];
          }

          keySchedule[k] = keySchedule[k - keySize] ^ t;
        }

        var invKeySchedule = [];

        for (var ik = 0; ik < ksRows; ik++) {
          var ksR = ksRows - ik;
          var tt = keySchedule[ksR - (ik % 4 ? 0 : 4)];

          if (ik < 4 || ksR <= 4) {
            invKeySchedule[ik] = tt;
          } else {
            invKeySchedule[ik] = G.INV_SUB_MIX[0][G.SBOX[tt >>> 24]] ^ G.INV_SUB_MIX[1][G.SBOX[tt >>> 16 & 0xff]] ^ G.INV_SUB_MIX[2][G.SBOX[tt >>> 8 & 0xff]] ^ G.INV_SUB_MIX[3][G.SBOX[tt & 0xff]];
          }
        }

        this._nRounds = nRounds;
        this._keySchedule = keySchedule;
        this._invKeySchedule = invKeySchedule;
      };

      AES.prototype.encryptBlockRaw = function (M) {
        M = asUInt32Array(M);
        return cryptBlock(M, this._keySchedule, G.SUB_MIX, G.SBOX, this._nRounds);
      };

      AES.prototype.encryptBlock = function (M) {
        var out = this.encryptBlockRaw(M);
        var buf = Buffer.allocUnsafe(16);
        buf.writeUInt32BE(out[0], 0);
        buf.writeUInt32BE(out[1], 4);
        buf.writeUInt32BE(out[2], 8);
        buf.writeUInt32BE(out[3], 12);
        return buf;
      };

      AES.prototype.decryptBlock = function (M) {
        M = asUInt32Array(M); // swap

        var m1 = M[1];
        M[1] = M[3];
        M[3] = m1;
        var out = cryptBlock(M, this._invKeySchedule, G.INV_SUB_MIX, G.INV_SBOX, this._nRounds);
        var buf = Buffer.allocUnsafe(16);
        buf.writeUInt32BE(out[0], 0);
        buf.writeUInt32BE(out[3], 4);
        buf.writeUInt32BE(out[2], 8);
        buf.writeUInt32BE(out[1], 12);
        return buf;
      };

      AES.prototype.scrub = function () {
        scrubVec(this._keySchedule);
        scrubVec(this._invKeySchedule);
        scrubVec(this._key);
      };

      module.exports.AES = AES;
    }, {
      "safe-buffer": 152
    }],
    23: [function (require, module, exports) {
      var aes = require('./aes');

      var Buffer = require('safe-buffer').Buffer;

      var Transform = require('cipher-base');

      var inherits = require('inherits');

      var GHASH = require('./ghash');

      var xor = require('buffer-xor');

      var incr32 = require('./incr32');

      function xorTest(a, b) {
        var out = 0;
        if (a.length !== b.length) out++;
        var len = Math.min(a.length, b.length);

        for (var i = 0; i < len; ++i) {
          out += a[i] ^ b[i];
        }

        return out;
      }

      function calcIv(self, iv, ck) {
        if (iv.length === 12) {
          self._finID = Buffer.concat([iv, Buffer.from([0, 0, 0, 1])]);
          return Buffer.concat([iv, Buffer.from([0, 0, 0, 2])]);
        }

        var ghash = new GHASH(ck);
        var len = iv.length;
        var toPad = len % 16;
        ghash.update(iv);

        if (toPad) {
          toPad = 16 - toPad;
          ghash.update(Buffer.alloc(toPad, 0));
        }

        ghash.update(Buffer.alloc(8, 0));
        var ivBits = len * 8;
        var tail = Buffer.alloc(8);
        tail.writeUIntBE(ivBits, 0, 8);
        ghash.update(tail);
        self._finID = ghash.state;
        var out = Buffer.from(self._finID);
        incr32(out);
        return out;
      }

      function StreamCipher(mode, key, iv, decrypt) {
        Transform.call(this);
        var h = Buffer.alloc(4, 0);
        this._cipher = new aes.AES(key);

        var ck = this._cipher.encryptBlock(h);

        this._ghash = new GHASH(ck);
        iv = calcIv(this, iv, ck);
        this._prev = Buffer.from(iv);
        this._cache = Buffer.allocUnsafe(0);
        this._secCache = Buffer.allocUnsafe(0);
        this._decrypt = decrypt;
        this._alen = 0;
        this._len = 0;
        this._mode = mode;
        this._authTag = null;
        this._called = false;
      }

      inherits(StreamCipher, Transform);

      StreamCipher.prototype._update = function (chunk) {
        if (!this._called && this._alen) {
          var rump = 16 - this._alen % 16;

          if (rump < 16) {
            rump = Buffer.alloc(rump, 0);

            this._ghash.update(rump);
          }
        }

        this._called = true;

        var out = this._mode.encrypt(this, chunk);

        if (this._decrypt) {
          this._ghash.update(chunk);
        } else {
          this._ghash.update(out);
        }

        this._len += chunk.length;
        return out;
      };

      StreamCipher.prototype._final = function () {
        if (this._decrypt && !this._authTag) throw new Error('Unsupported state or unable to authenticate data');
        var tag = xor(this._ghash["final"](this._alen * 8, this._len * 8), this._cipher.encryptBlock(this._finID));
        if (this._decrypt && xorTest(tag, this._authTag)) throw new Error('Unsupported state or unable to authenticate data');
        this._authTag = tag;

        this._cipher.scrub();
      };

      StreamCipher.prototype.getAuthTag = function getAuthTag() {
        if (this._decrypt || !Buffer.isBuffer(this._authTag)) throw new Error('Attempting to get auth tag in unsupported state');
        return this._authTag;
      };

      StreamCipher.prototype.setAuthTag = function setAuthTag(tag) {
        if (!this._decrypt) throw new Error('Attempting to set auth tag in unsupported state');
        this._authTag = tag;
      };

      StreamCipher.prototype.setAAD = function setAAD(buf) {
        if (this._called) throw new Error('Attempting to set AAD in unsupported state');

        this._ghash.update(buf);

        this._alen += buf.length;
      };

      module.exports = StreamCipher;
    }, {
      "./aes": 22,
      "./ghash": 27,
      "./incr32": 28,
      "buffer-xor": 49,
      "cipher-base": 52,
      "inherits": 104,
      "safe-buffer": 152
    }],
    24: [function (require, module, exports) {
      var ciphers = require('./encrypter');

      var deciphers = require('./decrypter');

      var modes = require('./modes/list.json');

      function getCiphers() {
        return Object.keys(modes);
      }

      exports.createCipher = exports.Cipher = ciphers.createCipher;
      exports.createCipheriv = exports.Cipheriv = ciphers.createCipheriv;
      exports.createDecipher = exports.Decipher = deciphers.createDecipher;
      exports.createDecipheriv = exports.Decipheriv = deciphers.createDecipheriv;
      exports.listCiphers = exports.getCiphers = getCiphers;
    }, {
      "./decrypter": 25,
      "./encrypter": 26,
      "./modes/list.json": 36
    }],
    25: [function (require, module, exports) {
      var AuthCipher = require('./authCipher');

      var Buffer = require('safe-buffer').Buffer;

      var MODES = require('./modes');

      var StreamCipher = require('./streamCipher');

      var Transform = require('cipher-base');

      var aes = require('./aes');

      var ebtk = require('evp_bytestokey');

      var inherits = require('inherits');

      function Decipher(mode, key, iv) {
        Transform.call(this);
        this._cache = new Splitter();
        this._last = void 0;
        this._cipher = new aes.AES(key);
        this._prev = Buffer.from(iv);
        this._mode = mode;
        this._autopadding = true;
      }

      inherits(Decipher, Transform);

      Decipher.prototype._update = function (data) {
        this._cache.add(data);

        var chunk;
        var thing;
        var out = [];

        while (chunk = this._cache.get(this._autopadding)) {
          thing = this._mode.decrypt(this, chunk);
          out.push(thing);
        }

        return Buffer.concat(out);
      };

      Decipher.prototype._final = function () {
        var chunk = this._cache.flush();

        if (this._autopadding) {
          return unpad(this._mode.decrypt(this, chunk));
        } else if (chunk) {
          throw new Error('data not multiple of block length');
        }
      };

      Decipher.prototype.setAutoPadding = function (setTo) {
        this._autopadding = !!setTo;
        return this;
      };

      function Splitter() {
        this.cache = Buffer.allocUnsafe(0);
      }

      Splitter.prototype.add = function (data) {
        this.cache = Buffer.concat([this.cache, data]);
      };

      Splitter.prototype.get = function (autoPadding) {
        var out;

        if (autoPadding) {
          if (this.cache.length > 16) {
            out = this.cache.slice(0, 16);
            this.cache = this.cache.slice(16);
            return out;
          }
        } else {
          if (this.cache.length >= 16) {
            out = this.cache.slice(0, 16);
            this.cache = this.cache.slice(16);
            return out;
          }
        }

        return null;
      };

      Splitter.prototype.flush = function () {
        if (this.cache.length) return this.cache;
      };

      function unpad(last) {
        var padded = last[15];

        if (padded < 1 || padded > 16) {
          throw new Error('unable to decrypt data');
        }

        var i = -1;

        while (++i < padded) {
          if (last[i + (16 - padded)] !== padded) {
            throw new Error('unable to decrypt data');
          }
        }

        if (padded === 16) return;
        return last.slice(0, 16 - padded);
      }

      function createDecipheriv(suite, password, iv) {
        var config = MODES[suite.toLowerCase()];
        if (!config) throw new TypeError('invalid suite type');
        if (typeof iv === 'string') iv = Buffer.from(iv);
        if (config.mode !== 'GCM' && iv.length !== config.iv) throw new TypeError('invalid iv length ' + iv.length);
        if (typeof password === 'string') password = Buffer.from(password);
        if (password.length !== config.key / 8) throw new TypeError('invalid key length ' + password.length);

        if (config.type === 'stream') {
          return new StreamCipher(config.module, password, iv, true);
        } else if (config.type === 'auth') {
          return new AuthCipher(config.module, password, iv, true);
        }

        return new Decipher(config.module, password, iv);
      }

      function createDecipher(suite, password) {
        var config = MODES[suite.toLowerCase()];
        if (!config) throw new TypeError('invalid suite type');
        var keys = ebtk(password, false, config.key, config.iv);
        return createDecipheriv(suite, keys.key, keys.iv);
      }

      exports.createDecipher = createDecipher;
      exports.createDecipheriv = createDecipheriv;
    }, {
      "./aes": 22,
      "./authCipher": 23,
      "./modes": 35,
      "./streamCipher": 38,
      "cipher-base": 52,
      "evp_bytestokey": 87,
      "inherits": 104,
      "safe-buffer": 152
    }],
    26: [function (require, module, exports) {
      var MODES = require('./modes');

      var AuthCipher = require('./authCipher');

      var Buffer = require('safe-buffer').Buffer;

      var StreamCipher = require('./streamCipher');

      var Transform = require('cipher-base');

      var aes = require('./aes');

      var ebtk = require('evp_bytestokey');

      var inherits = require('inherits');

      function Cipher(mode, key, iv) {
        Transform.call(this);
        this._cache = new Splitter();
        this._cipher = new aes.AES(key);
        this._prev = Buffer.from(iv);
        this._mode = mode;
        this._autopadding = true;
      }

      inherits(Cipher, Transform);

      Cipher.prototype._update = function (data) {
        this._cache.add(data);

        var chunk;
        var thing;
        var out = [];

        while (chunk = this._cache.get()) {
          thing = this._mode.encrypt(this, chunk);
          out.push(thing);
        }

        return Buffer.concat(out);
      };

      var PADDING = Buffer.alloc(16, 0x10);

      Cipher.prototype._final = function () {
        var chunk = this._cache.flush();

        if (this._autopadding) {
          chunk = this._mode.encrypt(this, chunk);

          this._cipher.scrub();

          return chunk;
        }

        if (!chunk.equals(PADDING)) {
          this._cipher.scrub();

          throw new Error('data not multiple of block length');
        }
      };

      Cipher.prototype.setAutoPadding = function (setTo) {
        this._autopadding = !!setTo;
        return this;
      };

      function Splitter() {
        this.cache = Buffer.allocUnsafe(0);
      }

      Splitter.prototype.add = function (data) {
        this.cache = Buffer.concat([this.cache, data]);
      };

      Splitter.prototype.get = function () {
        if (this.cache.length > 15) {
          var out = this.cache.slice(0, 16);
          this.cache = this.cache.slice(16);
          return out;
        }

        return null;
      };

      Splitter.prototype.flush = function () {
        var len = 16 - this.cache.length;
        var padBuff = Buffer.allocUnsafe(len);
        var i = -1;

        while (++i < len) {
          padBuff.writeUInt8(len, i);
        }

        return Buffer.concat([this.cache, padBuff]);
      };

      function createCipheriv(suite, password, iv) {
        var config = MODES[suite.toLowerCase()];
        if (!config) throw new TypeError('invalid suite type');
        if (typeof password === 'string') password = Buffer.from(password);
        if (password.length !== config.key / 8) throw new TypeError('invalid key length ' + password.length);
        if (typeof iv === 'string') iv = Buffer.from(iv);
        if (config.mode !== 'GCM' && iv.length !== config.iv) throw new TypeError('invalid iv length ' + iv.length);

        if (config.type === 'stream') {
          return new StreamCipher(config.module, password, iv);
        } else if (config.type === 'auth') {
          return new AuthCipher(config.module, password, iv);
        }

        return new Cipher(config.module, password, iv);
      }

      function createCipher(suite, password) {
        var config = MODES[suite.toLowerCase()];
        if (!config) throw new TypeError('invalid suite type');
        var keys = ebtk(password, false, config.key, config.iv);
        return createCipheriv(suite, keys.key, keys.iv);
      }

      exports.createCipheriv = createCipheriv;
      exports.createCipher = createCipher;
    }, {
      "./aes": 22,
      "./authCipher": 23,
      "./modes": 35,
      "./streamCipher": 38,
      "cipher-base": 52,
      "evp_bytestokey": 87,
      "inherits": 104,
      "safe-buffer": 152
    }],
    27: [function (require, module, exports) {
      var Buffer = require('safe-buffer').Buffer;

      var ZEROES = Buffer.alloc(16, 0);

      function toArray(buf) {
        return [buf.readUInt32BE(0), buf.readUInt32BE(4), buf.readUInt32BE(8), buf.readUInt32BE(12)];
      }

      function fromArray(out) {
        var buf = Buffer.allocUnsafe(16);
        buf.writeUInt32BE(out[0] >>> 0, 0);
        buf.writeUInt32BE(out[1] >>> 0, 4);
        buf.writeUInt32BE(out[2] >>> 0, 8);
        buf.writeUInt32BE(out[3] >>> 0, 12);
        return buf;
      }

      function GHASH(key) {
        this.h = key;
        this.state = Buffer.alloc(16, 0);
        this.cache = Buffer.allocUnsafe(0);
      } // from http://bitwiseshiftleft.github.io/sjcl/doc/symbols/src/core_gcm.js.html
      // by Juho Vähä-Herttua


      GHASH.prototype.ghash = function (block) {
        var i = -1;

        while (++i < block.length) {
          this.state[i] ^= block[i];
        }

        this._multiply();
      };

      GHASH.prototype._multiply = function () {
        var Vi = toArray(this.h);
        var Zi = [0, 0, 0, 0];
        var j, xi, lsbVi;
        var i = -1;

        while (++i < 128) {
          xi = (this.state[~~(i / 8)] & 1 << 7 - i % 8) !== 0;

          if (xi) {
            // Z_i+1 = Z_i ^ V_i
            Zi[0] ^= Vi[0];
            Zi[1] ^= Vi[1];
            Zi[2] ^= Vi[2];
            Zi[3] ^= Vi[3];
          } // Store the value of LSB(V_i)


          lsbVi = (Vi[3] & 1) !== 0; // V_i+1 = V_i >> 1

          for (j = 3; j > 0; j--) {
            Vi[j] = Vi[j] >>> 1 | (Vi[j - 1] & 1) << 31;
          }

          Vi[0] = Vi[0] >>> 1; // If LSB(V_i) is 1, V_i+1 = (V_i >> 1) ^ R

          if (lsbVi) {
            Vi[0] = Vi[0] ^ 0xe1 << 24;
          }
        }

        this.state = fromArray(Zi);
      };

      GHASH.prototype.update = function (buf) {
        this.cache = Buffer.concat([this.cache, buf]);
        var chunk;

        while (this.cache.length >= 16) {
          chunk = this.cache.slice(0, 16);
          this.cache = this.cache.slice(16);
          this.ghash(chunk);
        }
      };

      GHASH.prototype["final"] = function (abl, bl) {
        if (this.cache.length) {
          this.ghash(Buffer.concat([this.cache, ZEROES], 16));
        }

        this.ghash(fromArray([0, abl, 0, bl]));
        return this.state;
      };

      module.exports = GHASH;
    }, {
      "safe-buffer": 152
    }],
    28: [function (require, module, exports) {
      function incr32(iv) {
        var len = iv.length;
        var item;

        while (len--) {
          item = iv.readUInt8(len);

          if (item === 255) {
            iv.writeUInt8(0, len);
          } else {
            item++;
            iv.writeUInt8(item, len);
            break;
          }
        }
      }

      module.exports = incr32;
    }, {}],
    29: [function (require, module, exports) {
      var xor = require('buffer-xor');

      exports.encrypt = function (self, block) {
        var data = xor(block, self._prev);
        self._prev = self._cipher.encryptBlock(data);
        return self._prev;
      };

      exports.decrypt = function (self, block) {
        var pad = self._prev;
        self._prev = block;

        var out = self._cipher.decryptBlock(block);

        return xor(out, pad);
      };
    }, {
      "buffer-xor": 49
    }],
    30: [function (require, module, exports) {
      var Buffer = require('safe-buffer').Buffer;

      var xor = require('buffer-xor');

      function encryptStart(self, data, decrypt) {
        var len = data.length;
        var out = xor(data, self._cache);
        self._cache = self._cache.slice(len);
        self._prev = Buffer.concat([self._prev, decrypt ? data : out]);
        return out;
      }

      exports.encrypt = function (self, data, decrypt) {
        var out = Buffer.allocUnsafe(0);
        var len;

        while (data.length) {
          if (self._cache.length === 0) {
            self._cache = self._cipher.encryptBlock(self._prev);
            self._prev = Buffer.allocUnsafe(0);
          }

          if (self._cache.length <= data.length) {
            len = self._cache.length;
            out = Buffer.concat([out, encryptStart(self, data.slice(0, len), decrypt)]);
            data = data.slice(len);
          } else {
            out = Buffer.concat([out, encryptStart(self, data, decrypt)]);
            break;
          }
        }

        return out;
      };
    }, {
      "buffer-xor": 49,
      "safe-buffer": 152
    }],
    31: [function (require, module, exports) {
      var Buffer = require('safe-buffer').Buffer;

      function encryptByte(self, byteParam, decrypt) {
        var pad;
        var i = -1;
        var len = 8;
        var out = 0;
        var bit, value;

        while (++i < len) {
          pad = self._cipher.encryptBlock(self._prev);
          bit = byteParam & 1 << 7 - i ? 0x80 : 0;
          value = pad[0] ^ bit;
          out += (value & 0x80) >> i % 8;
          self._prev = shiftIn(self._prev, decrypt ? bit : value);
        }

        return out;
      }

      function shiftIn(buffer, value) {
        var len = buffer.length;
        var i = -1;
        var out = Buffer.allocUnsafe(buffer.length);
        buffer = Buffer.concat([buffer, Buffer.from([value])]);

        while (++i < len) {
          out[i] = buffer[i] << 1 | buffer[i + 1] >> 7;
        }

        return out;
      }

      exports.encrypt = function (self, chunk, decrypt) {
        var len = chunk.length;
        var out = Buffer.allocUnsafe(len);
        var i = -1;

        while (++i < len) {
          out[i] = encryptByte(self, chunk[i], decrypt);
        }

        return out;
      };
    }, {
      "safe-buffer": 152
    }],
    32: [function (require, module, exports) {
      var Buffer = require('safe-buffer').Buffer;

      function encryptByte(self, byteParam, decrypt) {
        var pad = self._cipher.encryptBlock(self._prev);

        var out = pad[0] ^ byteParam;
        self._prev = Buffer.concat([self._prev.slice(1), Buffer.from([decrypt ? byteParam : out])]);
        return out;
      }

      exports.encrypt = function (self, chunk, decrypt) {
        var len = chunk.length;
        var out = Buffer.allocUnsafe(len);
        var i = -1;

        while (++i < len) {
          out[i] = encryptByte(self, chunk[i], decrypt);
        }

        return out;
      };
    }, {
      "safe-buffer": 152
    }],
    33: [function (require, module, exports) {
      var xor = require('buffer-xor');

      var Buffer = require('safe-buffer').Buffer;

      var incr32 = require('../incr32');

      function getBlock(self) {
        var out = self._cipher.encryptBlockRaw(self._prev);

        incr32(self._prev);
        return out;
      }

      var blockSize = 16;

      exports.encrypt = function (self, chunk) {
        var chunkNum = Math.ceil(chunk.length / blockSize);
        var start = self._cache.length;
        self._cache = Buffer.concat([self._cache, Buffer.allocUnsafe(chunkNum * blockSize)]);

        for (var i = 0; i < chunkNum; i++) {
          var out = getBlock(self);
          var offset = start + i * blockSize;

          self._cache.writeUInt32BE(out[0], offset + 0);

          self._cache.writeUInt32BE(out[1], offset + 4);

          self._cache.writeUInt32BE(out[2], offset + 8);

          self._cache.writeUInt32BE(out[3], offset + 12);
        }

        var pad = self._cache.slice(0, chunk.length);

        self._cache = self._cache.slice(chunk.length);
        return xor(chunk, pad);
      };
    }, {
      "../incr32": 28,
      "buffer-xor": 49,
      "safe-buffer": 152
    }],
    34: [function (require, module, exports) {
      exports.encrypt = function (self, block) {
        return self._cipher.encryptBlock(block);
      };

      exports.decrypt = function (self, block) {
        return self._cipher.decryptBlock(block);
      };
    }, {}],
    35: [function (require, module, exports) {
      var modeModules = {
        ECB: require('./ecb'),
        CBC: require('./cbc'),
        CFB: require('./cfb'),
        CFB8: require('./cfb8'),
        CFB1: require('./cfb1'),
        OFB: require('./ofb'),
        CTR: require('./ctr'),
        GCM: require('./ctr')
      };

      var modes = require('./list.json');

      for (var key in modes) {
        modes[key].module = modeModules[modes[key].mode];
      }

      module.exports = modes;
    }, {
      "./cbc": 29,
      "./cfb": 30,
      "./cfb1": 31,
      "./cfb8": 32,
      "./ctr": 33,
      "./ecb": 34,
      "./list.json": 36,
      "./ofb": 37
    }],
    36: [function (require, module, exports) {
      module.exports = {
        "aes-128-ecb": {
          "cipher": "AES",
          "key": 128,
          "iv": 0,
          "mode": "ECB",
          "type": "block"
        },
        "aes-192-ecb": {
          "cipher": "AES",
          "key": 192,
          "iv": 0,
          "mode": "ECB",
          "type": "block"
        },
        "aes-256-ecb": {
          "cipher": "AES",
          "key": 256,
          "iv": 0,
          "mode": "ECB",
          "type": "block"
        },
        "aes-128-cbc": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes-192-cbc": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes-256-cbc": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes128": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes192": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes256": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CBC",
          "type": "block"
        },
        "aes-128-cfb": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CFB",
          "type": "stream"
        },
        "aes-192-cfb": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CFB",
          "type": "stream"
        },
        "aes-256-cfb": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CFB",
          "type": "stream"
        },
        "aes-128-cfb8": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CFB8",
          "type": "stream"
        },
        "aes-192-cfb8": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CFB8",
          "type": "stream"
        },
        "aes-256-cfb8": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CFB8",
          "type": "stream"
        },
        "aes-128-cfb1": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CFB1",
          "type": "stream"
        },
        "aes-192-cfb1": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CFB1",
          "type": "stream"
        },
        "aes-256-cfb1": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CFB1",
          "type": "stream"
        },
        "aes-128-ofb": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "OFB",
          "type": "stream"
        },
        "aes-192-ofb": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "OFB",
          "type": "stream"
        },
        "aes-256-ofb": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "OFB",
          "type": "stream"
        },
        "aes-128-ctr": {
          "cipher": "AES",
          "key": 128,
          "iv": 16,
          "mode": "CTR",
          "type": "stream"
        },
        "aes-192-ctr": {
          "cipher": "AES",
          "key": 192,
          "iv": 16,
          "mode": "CTR",
          "type": "stream"
        },
        "aes-256-ctr": {
          "cipher": "AES",
          "key": 256,
          "iv": 16,
          "mode": "CTR",
          "type": "stream"
        },
        "aes-128-gcm": {
          "cipher": "AES",
          "key": 128,
          "iv": 12,
          "mode": "GCM",
          "type": "auth"
        },
        "aes-192-gc