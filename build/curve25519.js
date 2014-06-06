// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(4);
/* global initializers */ __ATINIT__.push();


/* memory initializer */ allocate([], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


   
  Module["_bitshift64Ashr"] = _bitshift64Ashr;

  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;

   
  Module["_i64Subtract"] = _i64Subtract;

   
  Module["_i64Add"] = _i64Add;

   
  Module["_memset"] = _memset;

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  function _free() {
  }
  Module["_free"] = _free;

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};

   
  Module["_strlen"] = _strlen;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=0;var p=0;var q=0;var r=0;var s=+env.NaN,t=+env.Infinity;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ba=env.assert;var ca=env.asmPrintInt;var da=env.asmPrintFloat;var ea=env.min;var fa=env._malloc;var ga=env._fflush;var ha=env._free;var ia=env._emscripten_memcpy_big;var ja=env.___setErrNo;var ka=0.0;
// EMSCRIPTEN_START_FUNCS
function la(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function ma(){return i|0}function na(a){a=a|0;i=a}function oa(a,b){a=a|0;b=b|0;if((o|0)==0){o=a;p=b}}function pa(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function qa(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function ra(a){a=a|0;D=a}function sa(a){a=a|0;E=a}function ta(a){a=a|0;F=a}function ua(a){a=a|0;G=a}function va(a){a=a|0;H=a}function wa(a){a=a|0;I=a}function xa(a){a=a|0;J=a}function ya(a){a=a|0;K=a}function za(a){a=a|0;L=a}function Aa(a){a=a|0;M=a}function Ba(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Fa=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0;g=i;i=i+2640|0;h=g+2456|0;j=g+1464|0;k=g+768|0;l=g+1008|0;m=g+2e3|0;n=g+536|0;o=g+1616|0;p=g+1848|0;q=g+2152|0;r=g+2304|0;s=g+1160|0;t=g+304|0;u=g;v=g+152|0;w=g+1312|0;x=g+688|0;y=g+1768|0;z=g+920|0;A=g+456|0;B=g+2608|0;C=B+0|0;E=e+0|0;e=C+32|0;do{a[C]=a[E]|0;C=C+1|0;E=E+1|0}while((C|0)<(e|0));a[B]=a[B]&248;F=B+31|0;a[F]=a[F]&63|64;F=d[f]|0;G=La(d[f+1|0]|0|0,0,8)|0;H=D;I=La(d[f+2|0]|0|0,0,16)|0;J=H|D;H=d[f+3|0]|0;K=La(H|0,0,24)|0;L=x;c[L>>2]=G|F|I|K&50331648;c[L+4>>2]=J;J=La(d[f+4|0]|0|0,0,8)|0;L=D;K=La(d[f+5|0]|0|0,0,16)|0;I=L|D;L=d[f+6|0]|0;F=La(L|0,0,24)|0;G=Ka(J|H|K|F|0,I|D|0,2)|0;I=x+8|0;c[I>>2]=G&33554431;c[I+4>>2]=0;I=La(d[f+7|0]|0|0,0,8)|0;G=D;F=La(d[f+8|0]|0|0,0,16)|0;K=G|D;G=d[f+9|0]|0;H=La(G|0,0,24)|0;J=Ka(I|L|F|H|0,K|D|0,3)|0;K=x+16|0;c[K>>2]=J&67108863;c[K+4>>2]=0;K=La(d[f+10|0]|0|0,0,8)|0;J=D;H=La(d[f+11|0]|0|0,0,16)|0;F=J|D;J=d[f+12|0]|0;L=La(J|0,0,24)|0;I=Ka(K|G|H|L|0,F|D|0,5)|0;F=x+24|0;c[F>>2]=I&33554431;c[F+4>>2]=0;F=La(d[f+13|0]|0|0,0,8)|0;I=D;L=La(d[f+14|0]|0|0,0,16)|0;H=I|D;I=La(d[f+15|0]|0|0,0,24)|0;G=Ka(F|J|L|I|0,H|D|0,6)|0;H=x+32|0;c[H>>2]=G&67108863;c[H+4>>2]=0;H=d[f+16|0]|0;G=La(d[f+17|0]|0|0,0,8)|0;I=D;L=La(d[f+18|0]|0|0,0,16)|0;J=I|D;I=d[f+19|0]|0;F=La(I|0,0,24)|0;K=x+40|0;c[K>>2]=G|H|L|F&16777216;c[K+4>>2]=J;J=La(d[f+20|0]|0|0,0,8)|0;K=D;F=La(d[f+21|0]|0|0,0,16)|0;L=K|D;K=d[f+22|0]|0;H=La(K|0,0,24)|0;G=Ka(J|I|F|H|0,L|D|0,1)|0;L=x+48|0;c[L>>2]=G&67108863;c[L+4>>2]=0;L=La(d[f+23|0]|0|0,0,8)|0;G=D;H=La(d[f+24|0]|0|0,0,16)|0;F=G|D;G=d[f+25|0]|0;I=La(G|0,0,24)|0;J=Ka(L|K|H|I|0,F|D|0,3)|0;F=x+56|0;c[F>>2]=J&33554431;c[F+4>>2]=0;F=La(d[f+26|0]|0|0,0,8)|0;J=D;I=La(d[f+27|0]|0|0,0,16)|0;H=J|D;J=d[f+28|0]|0;K=La(J|0,0,24)|0;L=Ka(F|G|I|K|0,H|D|0,4)|0;H=x+64|0;c[H>>2]=L&67108863;c[H+4>>2]=0;H=La(d[f+29|0]|0|0,0,8)|0;L=D;K=La(d[f+30|0]|0|0,0,16)|0;I=L|D;L=La(d[f+31|0]|0|0,0,24)|0;f=Ka(H|J|K|L|0,I|D|0,6)|0;I=x+72|0;c[I>>2]=f&67108863;c[I+4>>2]=0;Ja(o|0,0,152)|0;Ja(p|0,0,152)|0;I=p;c[I>>2]=1;c[I+4>>2]=0;Ja(q|0,0,152)|0;I=q;c[I>>2]=1;c[I+4>>2]=0;Ja(r|0,0,152)|0;Ja(t|0,0,152)|0;Ja(u|0,0,152)|0;I=u;c[I>>2]=1;c[I+4>>2]=0;Ja(v|0,0,152)|0;Ja(w|0,0,152)|0;I=w;c[I>>2]=1;c[I+4>>2]=0;C=o+0|0;E=x+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));I=k+144|0;f=k+64|0;L=k+136|0;K=k+56|0;J=k+128|0;H=k+48|0;G=k+120|0;F=k+40|0;M=k+112|0;N=k+32|0;O=k+104|0;P=k+24|0;Q=k+96|0;R=k+16|0;S=k+88|0;T=k+8|0;U=k+80|0;V=l+144|0;W=l+64|0;X=l+136|0;Y=l+56|0;Z=l+128|0;_=l+48|0;aa=l+120|0;ba=l+40|0;ca=l+112|0;da=l+32|0;ea=l+104|0;fa=l+24|0;ga=l+96|0;ha=l+16|0;ia=l+88|0;ja=l+8|0;ka=l+80|0;la=k+72|0;ma=l+72|0;na=h+8|0;oa=j+8|0;pa=h+16|0;qa=j+16|0;ra=h+24|0;sa=j+24|0;ta=h+32|0;ua=j+32|0;va=h+40|0;wa=j+40|0;xa=h+48|0;ya=j+48|0;za=h+56|0;Aa=j+56|0;Ba=h+64|0;Fa=j+64|0;Ma=h+72|0;Na=j+72|0;Oa=s+80|0;Pa=s+8|0;Qa=s+16|0;Ra=s+24|0;Sa=s+32|0;Ua=s+40|0;Va=s+48|0;Wa=s+56|0;Xa=s+64|0;Ya=s+72|0;Za=0;_a=o;$a=t;t=p;ab=u;u=q;bb=v;v=r;cb=w;while(1){w=a[B+(31-Za)|0]|0;db=0;eb=_a;fb=$a;gb=t;hb=ab;ib=u;jb=bb;kb=v;lb=cb;while(1){mb=w&255;nb=Ha(0,0,mb>>>7|0,0)|0;ob=D;pb=0;while(1){qb=ib+(pb<<3)|0;rb=qb;sb=c[rb>>2]|0;tb=c[rb+4>>2]|0;rb=eb+(pb<<3)|0;ub=rb;vb=c[ub>>2]|0;wb=c[ub+4>>2]|0;ub=(vb^sb)&nb;xb=(wb^tb)&ob;xb^tb;tb=Ga(0,ub^sb|0,32)|0;sb=qb;c[sb>>2]=tb;c[sb+4>>2]=D;xb^wb;wb=Ga(0,ub^vb|0,32)|0;vb=rb;c[vb>>2]=wb;c[vb+4>>2]=D;vb=pb+1|0;if((vb|0)==10){yb=0;break}else{pb=vb}}do{pb=kb+(yb<<3)|0;vb=pb;wb=c[vb>>2]|0;rb=c[vb+4>>2]|0;vb=gb+(yb<<3)|0;ub=vb;xb=c[ub>>2]|0;sb=c[ub+4>>2]|0;ub=(xb^wb)&nb;tb=(sb^rb)&ob;tb^rb;rb=Ga(0,ub^wb|0,32)|0;wb=pb;c[wb>>2]=rb;c[wb+4>>2]=D;tb^sb;sb=Ga(0,ub^xb|0,32)|0;xb=vb;c[xb>>2]=sb;c[xb+4>>2]=D;yb=yb+1|0}while((yb|0)!=10);xb=ib;sb=c[xb>>2]|0;vb=c[xb+4>>2]|0;xb=ib+8|0;ub=xb;tb=c[ub>>2]|0;wb=c[ub+4>>2]|0;ub=ib+16|0;rb=ub;pb=c[rb>>2]|0;qb=c[rb+4>>2]|0;rb=ib+24|0;zb=rb;Ab=c[zb>>2]|0;Bb=c[zb+4>>2]|0;zb=ib+32|0;Cb=zb;Db=c[Cb>>2]|0;Eb=c[Cb+4>>2]|0;Cb=ib+40|0;Fb=Cb;Gb=c[Fb>>2]|0;Hb=c[Fb+4>>2]|0;Fb=ib+48|0;Ib=Fb;Jb=c[Ib>>2]|0;Kb=c[Ib+4>>2]|0;Ib=ib+56|0;Lb=Ib;Mb=c[Lb>>2]|0;Nb=c[Lb+4>>2]|0;Lb=ib+64|0;Ob=Lb;Pb=c[Ob>>2]|0;Qb=c[Ob+4>>2]|0;Ob=ib+72|0;Rb=Ob;Sb=c[Rb>>2]|0;Tb=c[Rb+4>>2]|0;Rb=kb;Ub=c[Rb>>2]|0;Vb=c[Rb+4>>2]|0;Rb=Ia(Ub|0,Vb|0,sb|0,vb|0)|0;Wb=ib;c[Wb>>2]=Rb;c[Wb+4>>2]=D;Wb=kb+8|0;Rb=Wb;Xb=c[Rb>>2]|0;Yb=c[Rb+4>>2]|0;Rb=Ia(Xb|0,Yb|0,tb|0,wb|0)|0;Zb=xb;c[Zb>>2]=Rb;c[Zb+4>>2]=D;Zb=kb+16|0;Rb=Zb;xb=c[Rb>>2]|0;_b=c[Rb+4>>2]|0;Rb=Ia(xb|0,_b|0,pb|0,qb|0)|0;$b=ub;c[$b>>2]=Rb;c[$b+4>>2]=D;$b=kb+24|0;Rb=$b;ub=c[Rb>>2]|0;ac=c[Rb+4>>2]|0;Rb=Ia(ub|0,ac|0,Ab|0,Bb|0)|0;bc=rb;c[bc>>2]=Rb;c[bc+4>>2]=D;bc=kb+32|0;Rb=bc;rb=c[Rb>>2]|0;cc=c[Rb+4>>2]|0;Rb=Ia(rb|0,cc|0,Db|0,Eb|0)|0;dc=zb;c[dc>>2]=Rb;c[dc+4>>2]=D;dc=kb+40|0;Rb=dc;zb=c[Rb>>2]|0;ec=c[Rb+4>>2]|0;Rb=Ia(zb|0,ec|0,Gb|0,Hb|0)|0;fc=Cb;c[fc>>2]=Rb;c[fc+4>>2]=D;fc=kb+48|0;Rb=fc;Cb=c[Rb>>2]|0;gc=c[Rb+4>>2]|0;Rb=Ia(Cb|0,gc|0,Jb|0,Kb|0)|0;hc=Fb;c[hc>>2]=Rb;c[hc+4>>2]=D;hc=kb+56|0;Rb=hc;Fb=c[Rb>>2]|0;ic=c[Rb+4>>2]|0;Rb=Ia(Fb|0,ic|0,Mb|0,Nb|0)|0;jc=Ib;c[jc>>2]=Rb;c[jc+4>>2]=D;jc=kb+64|0;Rb=jc;Ib=c[Rb>>2]|0;kc=c[Rb+4>>2]|0;Rb=Ia(Ib|0,kc|0,Pb|0,Qb|0)|0;lc=Lb;c[lc>>2]=Rb;c[lc+4>>2]=D;lc=kb+72|0;Rb=lc;Lb=c[Rb>>2]|0;mc=c[Rb+4>>2]|0;Rb=Ia(Lb|0,mc|0,Sb|0,Tb|0)|0;nc=Ob;c[nc>>2]=Rb;c[nc+4>>2]=D;nc=Ha(sb|0,vb|0,Ub|0,Vb|0)|0;Vb=kb;c[Vb>>2]=nc;c[Vb+4>>2]=D;Vb=Ha(tb|0,wb|0,Xb|0,Yb|0)|0;Yb=Wb;c[Yb>>2]=Vb;c[Yb+4>>2]=D;Yb=Ha(pb|0,qb|0,xb|0,_b|0)|0;_b=Zb;c[_b>>2]=Yb;c[_b+4>>2]=D;_b=Ha(Ab|0,Bb|0,ub|0,ac|0)|0;ac=$b;c[ac>>2]=_b;c[ac+4>>2]=D;ac=Ha(Db|0,Eb|0,rb|0,cc|0)|0;cc=bc;c[cc>>2]=ac;c[cc+4>>2]=D;cc=Ha(Gb|0,Hb|0,zb|0,ec|0)|0;ec=dc;c[ec>>2]=cc;c[ec+4>>2]=D;ec=Ha(Jb|0,Kb|0,Cb|0,gc|0)|0;gc=fc;c[gc>>2]=ec;c[gc+4>>2]=D;gc=Ha(Mb|0,Nb|0,Fb|0,ic|0)|0;ic=hc;c[ic>>2]=gc;c[ic+4>>2]=D;ic=Ha(Pb|0,Qb|0,Ib|0,kc|0)|0;kc=jc;c[kc>>2]=ic;c[kc+4>>2]=D;kc=Ha(Sb|0,Tb|0,Lb|0,mc|0)|0;mc=lc;c[mc>>2]=kc;c[mc+4>>2]=D;mc=eb;kc=c[mc>>2]|0;lc=c[mc+4>>2]|0;mc=eb+8|0;Lb=mc;Tb=c[Lb>>2]|0;Sb=c[Lb+4>>2]|0;Lb=eb+16|0;ic=Lb;jc=c[ic>>2]|0;Ib=c[ic+4>>2]|0;ic=eb+24|0;Qb=ic;Pb=c[Qb>>2]|0;gc=c[Qb+4>>2]|0;Qb=eb+32|0;hc=Qb;Fb=c[hc>>2]|0;Nb=c[hc+4>>2]|0;hc=eb+40|0;Mb=hc;ec=c[Mb>>2]|0;fc=c[Mb+4>>2]|0;Mb=eb+48|0;Cb=Mb;Kb=c[Cb>>2]|0;Jb=c[Cb+4>>2]|0;Cb=eb+56|0;cc=Cb;dc=c[cc>>2]|0;zb=c[cc+4>>2]|0;cc=eb+64|0;Hb=cc;Gb=c[Hb>>2]|0;ac=c[Hb+4>>2]|0;Hb=eb+72|0;bc=Hb;rb=c[bc>>2]|0;Eb=c[bc+4>>2]|0;bc=gb;Db=c[bc>>2]|0;_b=c[bc+4>>2]|0;bc=Ia(Db|0,_b|0,kc|0,lc|0)|0;$b=eb;c[$b>>2]=bc;c[$b+4>>2]=D;$b=gb+8|0;bc=$b;ub=c[bc>>2]|0;Bb=c[bc+4>>2]|0;bc=Ia(ub|0,Bb|0,Tb|0,Sb|0)|0;Ab=mc;c[Ab>>2]=bc;c[Ab+4>>2]=D;Ab=gb+16|0;bc=Ab;mc=c[bc>>2]|0;Yb=c[bc+4>>2]|0;bc=Ia(mc|0,Yb|0,jc|0,Ib|0)|0;Zb=Lb;c[Zb>>2]=bc;c[Zb+4>>2]=D;Zb=gb+24|0;bc=Zb;Lb=c[bc>>2]|0;xb=c[bc+4>>2]|0;bc=Ia(Lb|0,xb|0,Pb|0,gc|0)|0;qb=ic;c[qb>>2]=bc;c[qb+4>>2]=D;qb=gb+32|0;bc=qb;ic=c[bc>>2]|0;pb=c[bc+4>>2]|0;bc=Ia(ic|0,pb|0,Fb|0,Nb|0)|0;Vb=Qb;c[Vb>>2]=bc;c[Vb+4>>2]=D;Vb=gb+40|0;bc=Vb;Qb=c[bc>>2]|0;Wb=c[bc+4>>2]|0;bc=Ia(Qb|0,Wb|0,ec|0,fc|0)|0;Xb=hc;c[Xb>>2]=bc;c[Xb+4>>2]=D;Xb=gb+48|0;bc=Xb;hc=c[bc>>2]|0;wb=c[bc+4>>2]|0;bc=Ia(hc|0,wb|0,Kb|0,Jb|0)|0;tb=Mb;c[tb>>2]=bc;c[tb+4>>2]=D;tb=gb+56|0;bc=tb;Mb=c[bc>>2]|0;nc=c[bc+4>>2]|0;bc=Ia(Mb|0,nc|0,dc|0,zb|0)|0;Ub=Cb;c[Ub>>2]=bc;c[Ub+4>>2]=D;Ub=gb+64|0;bc=Ub;Cb=c[bc>>2]|0;vb=c[bc+4>>2]|0;bc=Ia(Cb|0,vb|0,Gb|0,ac|0)|0;sb=cc;c[sb>>2]=bc;c[sb+4>>2]=D;sb=gb+72|0;bc=sb;cc=c[bc>>2]|0;Rb=c[bc+4>>2]|0;bc=Ia(cc|0,Rb|0,rb|0,Eb|0)|0;Ob=Hb;c[Ob>>2]=bc;c[Ob+4>>2]=D;Ob=Ha(kc|0,lc|0,Db|0,_b|0)|0;_b=gb;c[_b>>2]=Ob;c[_b+4>>2]=D;_b=Ha(Tb|0,Sb|0,ub|0,Bb|0)|0;Bb=$b;c[Bb>>2]=_b;c[Bb+4>>2]=D;Bb=Ha(jc|0,Ib|0,mc|0,Yb|0)|0;Yb=Ab;c[Yb>>2]=Bb;c[Yb+4>>2]=D;Yb=Ha(Pb|0,gc|0,Lb|0,xb|0)|0;xb=Zb;c[xb>>2]=Yb;c[xb+4>>2]=D;xb=Ha(Fb|0,Nb|0,ic|0,pb|0)|0;pb=qb;c[pb>>2]=xb;c[pb+4>>2]=D;pb=Ha(ec|0,fc|0,Qb|0,Wb|0)|0;Wb=Vb;c[Wb>>2]=pb;c[Wb+4>>2]=D;Wb=Ha(Kb|0,Jb|0,hc|0,wb|0)|0;wb=Xb;c[wb>>2]=Wb;c[wb+4>>2]=D;wb=Ha(dc|0,zb|0,Mb|0,nc|0)|0;nc=tb;c[nc>>2]=wb;c[nc+4>>2]=D;nc=Ha(Gb|0,ac|0,Cb|0,vb|0)|0;vb=Ub;c[vb>>2]=nc;c[vb+4>>2]=D;vb=Ha(rb|0,Eb|0,cc|0,Rb|0)|0;Rb=sb;c[Rb>>2]=vb;c[Rb+4>>2]=D;Da(k,eb,kb);Da(l,ib,gb);Rb=I;vb=c[Rb>>2]|0;sb=c[Rb+4>>2]|0;Rb=f;cc=c[Rb>>2]|0;Eb=c[Rb+4>>2]|0;Rb=Ta(vb|0,sb|0,18,0)|0;rb=D;nc=Ia(cc|0,Eb|0,vb|0,sb|0)|0;sb=Ia(nc|0,D|0,Rb|0,rb|0)|0;rb=f;c[rb>>2]=sb;c[rb+4>>2]=D;rb=L;sb=c[rb>>2]|0;Rb=c[rb+4>>2]|0;rb=K;nc=c[rb>>2]|0;vb=c[rb+4>>2]|0;rb=Ta(sb|0,Rb|0,18,0)|0;Eb=D;cc=Ia(nc|0,vb|0,sb|0,Rb|0)|0;Rb=Ia(cc|0,D|0,rb|0,Eb|0)|0;Eb=K;c[Eb>>2]=Rb;c[Eb+4>>2]=D;Eb=J;Rb=c[Eb>>2]|0;rb=c[Eb+4>>2]|0;Eb=H;cc=c[Eb>>2]|0;sb=c[Eb+4>>2]|0;Eb=Ta(Rb|0,rb|0,18,0)|0;vb=D;nc=Ia(cc|0,sb|0,Rb|0,rb|0)|0;rb=Ia(nc|0,D|0,Eb|0,vb|0)|0;vb=H;c[vb>>2]=rb;c[vb+4>>2]=D;vb=G;rb=c[vb>>2]|0;Eb=c[vb+4>>2]|0;vb=F;nc=c[vb>>2]|0;Rb=c[vb+4>>2]|0;vb=Ta(rb|0,Eb|0,18,0)|0;sb=D;cc=Ia(nc|0,Rb|0,rb|0,Eb|0)|0;Eb=Ia(cc|0,D|0,vb|0,sb|0)|0;sb=F;c[sb>>2]=Eb;c[sb+4>>2]=D;sb=M;Eb=c[sb>>2]|0;vb=c[sb+4>>2]|0;sb=N;cc=c[sb>>2]|0;rb=c[sb+4>>2]|0;sb=Ta(Eb|0,vb|0,18,0)|0;Rb=D;nc=Ia(cc|0,rb|0,Eb|0,vb|0)|0;vb=Ia(nc|0,D|0,sb|0,Rb|0)|0;Rb=N;c[Rb>>2]=vb;c[Rb+4>>2]=D;Rb=O;vb=c[Rb>>2]|0;sb=c[Rb+4>>2]|0;Rb=P;nc=c[Rb>>2]|0;Eb=c[Rb+4>>2]|0;Rb=Ta(vb|0,sb|0,18,0)|0;rb=D;cc=Ia(nc|0,Eb|0,vb|0,sb|0)|0;sb=Ia(cc|0,D|0,Rb|0,rb|0)|0;rb=P;c[rb>>2]=sb;c[rb+4>>2]=D;rb=Q;sb=c[rb>>2]|0;Rb=c[rb+4>>2]|0;rb=R;cc=c[rb>>2]|0;vb=c[rb+4>>2]|0;rb=Ta(sb|0,Rb|0,18,0)|0;Eb=D;nc=Ia(cc|0,vb|0,sb|0,Rb|0)|0;Rb=Ia(nc|0,D|0,rb|0,Eb|0)|0;Eb=R;c[Eb>>2]=Rb;c[Eb+4>>2]=D;Eb=S;Rb=c[Eb>>2]|0;rb=c[Eb+4>>2]|0;Eb=T;nc=c[Eb>>2]|0;sb=c[Eb+4>>2]|0;Eb=Ta(Rb|0,rb|0,18,0)|0;vb=D;cc=Ia(nc|0,sb|0,Rb|0,rb|0)|0;rb=Ia(cc|0,D|0,Eb|0,vb|0)|0;vb=T;c[vb>>2]=rb;c[vb+4>>2]=D;vb=U;rb=c[vb>>2]|0;Eb=c[vb+4>>2]|0;vb=k;cc=c[vb>>2]|0;Rb=c[vb+4>>2]|0;vb=Ta(rb|0,Eb|0,18,0)|0;sb=D;nc=Ia(cc|0,Rb|0,rb|0,Eb|0)|0;Eb=Ia(nc|0,D|0,vb|0,sb|0)|0;sb=k;c[sb>>2]=Eb;c[sb+4>>2]=D;Ca(k);sb=V;Eb=c[sb>>2]|0;vb=c[sb+4>>2]|0;sb=W;nc=c[sb>>2]|0;rb=c[sb+4>>2]|0;sb=Ta(Eb|0,vb|0,18,0)|0;Rb=D;cc=Ia(nc|0,rb|0,Eb|0,vb|0)|0;vb=Ia(cc|0,D|0,sb|0,Rb|0)|0;Rb=W;c[Rb>>2]=vb;c[Rb+4>>2]=D;Rb=X;vb=c[Rb>>2]|0;sb=c[Rb+4>>2]|0;Rb=Y;cc=c[Rb>>2]|0;Eb=c[Rb+4>>2]|0;Rb=Ta(vb|0,sb|0,18,0)|0;rb=D;nc=Ia(cc|0,Eb|0,vb|0,sb|0)|0;sb=Ia(nc|0,D|0,Rb|0,rb|0)|0;rb=Y;c[rb>>2]=sb;c[rb+4>>2]=D;rb=Z;sb=c[rb>>2]|0;Rb=c[rb+4>>2]|0;rb=_;nc=c[rb>>2]|0;vb=c[rb+4>>2]|0;rb=Ta(sb|0,Rb|0,18,0)|0;Eb=D;cc=Ia(nc|0,vb|0,sb|0,Rb|0)|0;Rb=Ia(cc|0,D|0,rb|0,Eb|0)|0;Eb=_;c[Eb>>2]=Rb;c[Eb+4>>2]=D;Eb=aa;Rb=c[Eb>>2]|0;rb=c[Eb+4>>2]|0;Eb=ba;cc=c[Eb>>2]|0;sb=c[Eb+4>>2]|0;Eb=Ta(Rb|0,rb|0,18,0)|0;vb=D;nc=Ia(cc|0,sb|0,Rb|0,rb|0)|0;rb=Ia(nc|0,D|0,Eb|0,vb|0)|0;vb=ba;c[vb>>2]=rb;c[vb+4>>2]=D;vb=ca;rb=c[vb>>2]|0;Eb=c[vb+4>>2]|0;vb=da;nc=c[vb>>2]|0;Rb=c[vb+4>>2]|0;vb=Ta(rb|0,Eb|0,18,0)|0;sb=D;cc=Ia(nc|0,Rb|0,rb|0,Eb|0)|0;Eb=Ia(cc|0,D|0,vb|0,sb|0)|0;sb=da;c[sb>>2]=Eb;c[sb+4>>2]=D;sb=ea;Eb=c[sb>>2]|0;vb=c[sb+4>>2]|0;sb=fa;cc=c[sb>>2]|0;rb=c[sb+4>>2]|0;sb=Ta(Eb|0,vb|0,18,0)|0;Rb=D;nc=Ia(cc|0,rb|0,Eb|0,vb|0)|0;vb=Ia(nc|0,D|0,sb|0,Rb|0)|0;Rb=fa;c[Rb>>2]=vb;c[Rb+4>>2]=D;Rb=ga;vb=c[Rb>>2]|0;sb=c[Rb+4>>2]|0;Rb=ha;nc=c[Rb>>2]|0;Eb=c[Rb+4>>2]|0;Rb=Ta(vb|0,sb|0,18,0)|0;rb=D;cc=Ia(nc|0,Eb|0,vb|0,sb|0)|0;sb=Ia(cc|0,D|0,Rb|0,rb|0)|0;rb=ha;c[rb>>2]=sb;c[rb+4>>2]=D;rb=ia;sb=c[rb>>2]|0;Rb=c[rb+4>>2]|0;rb=ja;cc=c[rb>>2]|0;vb=c[rb+4>>2]|0;rb=Ta(sb|0,Rb|0,18,0)|0;Eb=D;nc=Ia(cc|0,vb|0,sb|0,Rb|0)|0;Rb=Ia(nc|0,D|0,rb|0,Eb|0)|0;Eb=ja;c[Eb>>2]=Rb;c[Eb+4>>2]=D;Eb=ka;Rb=c[Eb>>2]|0;rb=c[Eb+4>>2]|0;Eb=l;nc=c[Eb>>2]|0;sb=c[Eb+4>>2]|0;Eb=Ta(Rb|0,rb|0,18,0)|0;vb=D;cc=Ia(nc|0,sb|0,Rb|0,rb|0)|0;rb=Ia(cc|0,D|0,Eb|0,vb|0)|0;vb=l;c[vb>>2]=rb;c[vb+4>>2]=D;Ca(l);vb=k;rb=c[vb>>2]|0;Eb=c[vb+4>>2]|0;vb=T;cc=c[vb>>2]|0;Rb=c[vb+4>>2]|0;vb=R;sb=c[vb>>2]|0;nc=c[vb+4>>2]|0;vb=P;Ub=c[vb>>2]|0;Cb=c[vb+4>>2]|0;vb=N;ac=c[vb>>2]|0;Gb=c[vb+4>>2]|0;vb=F;wb=c[vb>>2]|0;tb=c[vb+4>>2]|0;vb=H;Mb=c[vb>>2]|0;zb=c[vb+4>>2]|0;vb=K;dc=c[vb>>2]|0;Wb=c[vb+4>>2]|0;vb=f;Xb=c[vb>>2]|0;hc=c[vb+4>>2]|0;vb=la;Jb=c[vb>>2]|0;Kb=c[vb+4>>2]|0;vb=l;pb=c[vb>>2]|0;Vb=c[vb+4>>2]|0;vb=Ia(pb|0,Vb|0,rb|0,Eb|0)|0;Qb=k;c[Qb>>2]=vb;c[Qb+4>>2]=D;Qb=ja;vb=c[Qb>>2]|0;fc=c[Qb+4>>2]|0;Qb=Ia(vb|0,fc|0,cc|0,Rb|0)|0;ec=T;c[ec>>2]=Qb;c[ec+4>>2]=D;ec=ha;Qb=c[ec>>2]|0;xb=c[ec+4>>2]|0;ec=Ia(Qb|0,xb|0,sb|0,nc|0)|0;qb=R;c[qb>>2]=ec;c[qb+4>>2]=D;qb=fa;ec=c[qb>>2]|0;ic=c[qb+4>>2]|0;qb=Ia(ec|0,ic|0,Ub|0,Cb|0)|0;Nb=P;c[Nb>>2]=qb;c[Nb+4>>2]=D;Nb=da;qb=c[Nb>>2]|0;Fb=c[Nb+4>>2]|0;Nb=Ia(qb|0,Fb|0,ac|0,Gb|0)|0;Yb=N;c[Yb>>2]=Nb;c[Yb+4>>2]=D;Yb=ba;Nb=c[Yb>>2]|0;Zb=c[Yb+4>>2]|0;Yb=Ia(Nb|0,Zb|0,wb|0,tb|0)|0;Lb=F;c[Lb>>2]=Yb;c[Lb+4>>2]=D;Lb=_;Yb=c[Lb>>2]|0;gc=c[Lb+4>>2]|0;Lb=Ia(Yb|0,gc|0,Mb|0,zb|0)|0;Pb=H;c[Pb>>2]=Lb;c[Pb+4>>2]=D;Pb=Y;Lb=c[Pb>>2]|0;Bb=c[Pb+4>>2]|0;Pb=Ia(Lb|0,Bb|0,dc|0,Wb|0)|0;Ab=K;c[Ab>>2]=Pb;c[Ab+4>>2]=D;Ab=W;Pb=c[Ab>>2]|0;mc=c[Ab+4>>2]|0;Ab=Ia(Pb|0,mc|0,Xb|0,hc|0)|0;Ib=f;c[Ib>>2]=Ab;c[Ib+4>>2]=D;Ib=ma;Ab=c[Ib>>2]|0;jc=c[Ib+4>>2]|0;Ib=Ia(Ab|0,jc|0,Jb|0,Kb|0)|0;_b=la;c[_b>>2]=Ib;c[_b+4>>2]=D;_b=Ha(rb|0,Eb|0,pb|0,Vb|0)|0;Vb=l;c[Vb>>2]=_b;c[Vb+4>>2]=D;Vb=Ha(cc|0,Rb|0,vb|0,fc|0)|0;fc=ja;c[fc>>2]=Vb;c[fc+4>>2]=D;fc=Ha(sb|0,nc|0,Qb|0,xb|0)|0;xb=ha;c[xb>>2]=fc;c[xb+4>>2]=D;xb=Ha(Ub|0,Cb|0,ec|0,ic|0)|0;ic=fa;c[ic>>2]=xb;c[ic+4>>2]=D;ic=Ha(ac|0,Gb|0,qb|0,Fb|0)|0;Fb=da;c[Fb>>2]=ic;c[Fb+4>>2]=D;Fb=Ha(wb|0,tb|0,Nb|0,Zb|0)|0;Zb=ba;c[Zb>>2]=Fb;c[Zb+4>>2]=D;Zb=Ha(Mb|0,zb|0,Yb|0,gc|0)|0;gc=_;c[gc>>2]=Zb;c[gc+4>>2]=D;gc=Ha(dc|0,Wb|0,Lb|0,Bb|0)|0;Bb=Y;c[Bb>>2]=gc;c[Bb+4>>2]=D;Bb=Ha(Xb|0,hc|0,Pb|0,mc|0)|0;mc=W;c[mc>>2]=Bb;c[mc+4>>2]=D;mc=Ha(Jb|0,Kb|0,Ab|0,jc|0)|0;jc=ma;c[jc>>2]=mc;c[jc+4>>2]=D;Ea(n,k);Ea(m,l);Da(l,m,x);jc=V;mc=c[jc>>2]|0;Ab=c[jc+4>>2]|0;jc=W;Kb=c[jc>>2]|0;Jb=c[jc+4>>2]|0;jc=Ta(mc|0,Ab|0,18,0)|0;Bb=D;Pb=Ia(Kb|0,Jb|0,mc|0,Ab|0)|0;Ab=Ia(Pb|0,D|0,jc|0,Bb|0)|0;Bb=W;c[Bb>>2]=Ab;c[Bb+4>>2]=D;Bb=X;Ab=c[Bb>>2]|0;jc=c[Bb+4>>2]|0;Bb=Y;Pb=c[Bb>>2]|0;mc=c[Bb+4>>2]|0;Bb=Ta(Ab|0,jc|0,18,0)|0;Jb=D;Kb=Ia(Pb|0,mc|0,Ab|0,jc|0)|0;jc=Ia(Kb|0,D|0,Bb|0,Jb|0)|0;Jb=Y;c[Jb>>2]=jc;c[Jb+4>>2]=D;Jb=Z;jc=c[Jb>>2]|0;Bb=c[Jb+4>>2]|0;Jb=_;Kb=c[Jb>>2]|0;Ab=c[Jb+4>>2]|0;Jb=Ta(jc|0,Bb|0,18,0)|0;mc=D;Pb=Ia(Kb|0,Ab|0,jc|0,Bb|0)|0;Bb=Ia(Pb|0,D|0,Jb|0,mc|0)|0;mc=_;c[mc>>2]=Bb;c[mc+4>>2]=D;mc=aa;Bb=c[mc>>2]|0;Jb=c[mc+4>>2]|0;mc=ba;Pb=c[mc>>2]|0;jc=c[mc+4>>2]|0;mc=Ta(Bb|0,Jb|0,18,0)|0;Ab=D;Kb=Ia(Pb|0,jc|0,Bb|0,Jb|0)|0;Jb=Ia(Kb|0,D|0,mc|0,Ab|0)|0;Ab=ba;c[Ab>>2]=Jb;c[Ab+4>>2]=D;Ab=ca;Jb=c[Ab>>2]|0;mc=c[Ab+4>>2]|0;Ab=da;Kb=c[Ab>>2]|0;Bb=c[Ab+4>>2]|0;Ab=Ta(Jb|0,mc|0,18,0)|0;jc=D;Pb=Ia(Kb|0,Bb|0,Jb|0,mc|0)|0;mc=Ia(Pb|0,D|0,Ab|0,jc|0)|0;jc=da;c[jc>>2]=mc;c[jc+4>>2]=D;jc=ea;mc=c[jc>>2]|0;Ab=c[jc+4>>2]|0;jc=fa;Pb=c[jc>>2]|0;Jb=c[jc+4>>2]|0;jc=Ta(mc|0,Ab|0,18,0)|0;Bb=D;Kb=Ia(Pb|0,Jb|0,mc|0,Ab|0)|0;Ab=Ia(Kb|0,D|0,jc|0,Bb|0)|0;Bb=fa;c[Bb>>2]=Ab;c[Bb+4>>2]=D;Bb=ga;Ab=c[Bb>>2]|0;jc=c[Bb+4>>2]|0;Bb=ha;Kb=c[Bb>>2]|0;mc=c[Bb+4>>2]|0;Bb=Ta(Ab|0,jc|0,18,0)|0;Jb=D;Pb=Ia(Kb|0,mc|0,Ab|0,jc|0)|0;jc=Ia(Pb|0,D|0,Bb|0,Jb|0)|0;Jb=ha;c[Jb>>2]=jc;c[Jb+4>>2]=D;Jb=ia;jc=c[Jb>>2]|0;Bb=c[Jb+4>>2]|0;Jb=ja;Pb=c[Jb>>2]|0;Ab=c[Jb+4>>2]|0;Jb=Ta(jc|0,Bb|0,18,0)|0;mc=D;Kb=Ia(Pb|0,Ab|0,jc|0,Bb|0)|0;Bb=Ia(Kb|0,D|0,Jb|0,mc|0)|0;mc=ja;c[mc>>2]=Bb;c[mc+4>>2]=D;mc=ka;Bb=c[mc>>2]|0;Jb=c[mc+4>>2]|0;mc=l;Kb=c[mc>>2]|0;jc=c[mc+4>>2]|0;mc=Ta(Bb|0,Jb|0,18,0)|0;Ab=D;Pb=Ia(Kb|0,jc|0,Bb|0,Jb|0)|0;Jb=Ia(Pb|0,D|0,mc|0,Ab|0)|0;Ab=l;c[Ab>>2]=Jb;c[Ab+4>>2]=D;Ca(l);C=fb+0|0;E=n+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));C=hb+0|0;E=l+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(h,ib);Ea(j,kb);Da(jb,h,j);Ab=jb+144|0;Jb=c[Ab>>2]|0;mc=c[Ab+4>>2]|0;Ab=jb+64|0;Pb=Ab;Bb=c[Pb>>2]|0;jc=c[Pb+4>>2]|0;Pb=Ta(Jb|0,mc|0,18,0)|0;Kb=D;hc=Ia(Bb|0,jc|0,Jb|0,mc|0)|0;mc=Ia(hc|0,D|0,Pb|0,Kb|0)|0;Kb=Ab;c[Kb>>2]=mc;c[Kb+4>>2]=D;Kb=jb+136|0;mc=c[Kb>>2]|0;Ab=c[Kb+4>>2]|0;Kb=jb+56|0;Pb=Kb;hc=c[Pb>>2]|0;Jb=c[Pb+4>>2]|0;Pb=Ta(mc|0,Ab|0,18,0)|0;jc=D;Bb=Ia(hc|0,Jb|0,mc|0,Ab|0)|0;Ab=Ia(Bb|0,D|0,Pb|0,jc|0)|0;jc=Kb;c[jc>>2]=Ab;c[jc+4>>2]=D;jc=jb+128|0;Ab=c[jc>>2]|0;Kb=c[jc+4>>2]|0;jc=jb+48|0;Pb=jc;Bb=c[Pb>>2]|0;mc=c[Pb+4>>2]|0;Pb=Ta(Ab|0,Kb|0,18,0)|0;Jb=D;hc=Ia(Bb|0,mc|0,Ab|0,Kb|0)|0;Kb=Ia(hc|0,D|0,Pb|0,Jb|0)|0;Jb=jc;c[Jb>>2]=Kb;c[Jb+4>>2]=D;Jb=jb+120|0;Kb=c[Jb>>2]|0;jc=c[Jb+4>>2]|0;Jb=jb+40|0;Pb=Jb;hc=c[Pb>>2]|0;Ab=c[Pb+4>>2]|0;Pb=Ta(Kb|0,jc|0,18,0)|0;mc=D;Bb=Ia(hc|0,Ab|0,Kb|0,jc|0)|0;jc=Ia(Bb|0,D|0,Pb|0,mc|0)|0;mc=Jb;c[mc>>2]=jc;c[mc+4>>2]=D;mc=jb+112|0;jc=c[mc>>2]|0;Jb=c[mc+4>>2]|0;mc=jb+32|0;Pb=mc;Bb=c[Pb>>2]|0;Kb=c[Pb+4>>2]|0;Pb=Ta(jc|0,Jb|0,18,0)|0;Ab=D;hc=Ia(Bb|0,Kb|0,jc|0,Jb|0)|0;Jb=Ia(hc|0,D|0,Pb|0,Ab|0)|0;Ab=mc;c[Ab>>2]=Jb;c[Ab+4>>2]=D;Ab=jb+104|0;Jb=c[Ab>>2]|0;mc=c[Ab+4>>2]|0;Ab=jb+24|0;Pb=Ab;hc=c[Pb>>2]|0;jc=c[Pb+4>>2]|0;Pb=Ta(Jb|0,mc|0,18,0)|0;Kb=D;Bb=Ia(hc|0,jc|0,Jb|0,mc|0)|0;mc=Ia(Bb|0,D|0,Pb|0,Kb|0)|0;Kb=Ab;c[Kb>>2]=mc;c[Kb+4>>2]=D;Kb=jb+96|0;mc=c[Kb>>2]|0;Ab=c[Kb+4>>2]|0;Kb=jb+16|0;Pb=Kb;Bb=c[Pb>>2]|0;Jb=c[Pb+4>>2]|0;Pb=Ta(mc|0,Ab|0,18,0)|0;jc=D;hc=Ia(Bb|0,Jb|0,mc|0,Ab|0)|0;Ab=Ia(hc|0,D|0,Pb|0,jc|0)|0;jc=Kb;c[jc>>2]=Ab;c[jc+4>>2]=D;jc=jb+88|0;Ab=c[jc>>2]|0;Kb=c[jc+4>>2]|0;jc=jb+8|0;Pb=jc;hc=c[Pb>>2]|0;mc=c[Pb+4>>2]|0;Pb=Ta(Ab|0,Kb|0,18,0)|0;Jb=D;Bb=Ia(hc|0,mc|0,Ab|0,Kb|0)|0;Kb=Ia(Bb|0,D|0,Pb|0,Jb|0)|0;Jb=jc;c[Jb>>2]=Kb;c[Jb+4>>2]=D;Jb=jb+80|0;Kb=c[Jb>>2]|0;jc=c[Jb+4>>2]|0;Jb=jb;Pb=c[Jb>>2]|0;Bb=c[Jb+4>>2]|0;Jb=Ta(Kb|0,jc|0,18,0)|0;Ab=D;mc=Ia(Pb|0,Bb|0,Kb|0,jc|0)|0;jc=Ia(mc|0,D|0,Jb|0,Ab|0)|0;Ab=jb;c[Ab>>2]=jc;c[Ab+4>>2]=D;Ca(jb);Ab=h;jc=c[Ab>>2]|0;Jb=c[Ab+4>>2]|0;Ab=j;mc=Ha(jc|0,Jb|0,c[Ab>>2]|0,c[Ab+4>>2]|0)|0;Ab=D;Kb=j;c[Kb>>2]=mc;c[Kb+4>>2]=Ab;Kb=na;Bb=c[Kb>>2]|0;Pb=c[Kb+4>>2]|0;Kb=oa;hc=Ha(Bb|0,Pb|0,c[Kb>>2]|0,c[Kb+4>>2]|0)|0;Kb=D;Xb=oa;c[Xb>>2]=hc;c[Xb+4>>2]=Kb;Xb=pa;gc=c[Xb>>2]|0;Lb=c[Xb+4>>2]|0;Xb=qa;Wb=Ha(gc|0,Lb|0,c[Xb>>2]|0,c[Xb+4>>2]|0)|0;Xb=D;dc=qa;c[dc>>2]=Wb;c[dc+4>>2]=Xb;dc=ra;Zb=c[dc>>2]|0;Yb=c[dc+4>>2]|0;dc=sa;zb=Ha(Zb|0,Yb|0,c[dc>>2]|0,c[dc+4>>2]|0)|0;dc=D;Mb=sa;c[Mb>>2]=zb;c[Mb+4>>2]=dc;Mb=ta;Fb=c[Mb>>2]|0;Nb=c[Mb+4>>2]|0;Mb=ua;tb=Ha(Fb|0,Nb|0,c[Mb>>2]|0,c[Mb+4>>2]|0)|0;Mb=D;wb=ua;c[wb>>2]=tb;c[wb+4>>2]=Mb;wb=va;ic=c[wb>>2]|0;qb=c[wb+4>>2]|0;wb=wa;Gb=Ha(ic|0,qb|0,c[wb>>2]|0,c[wb+4>>2]|0)|0;wb=D;ac=wa;c[ac>>2]=Gb;c[ac+4>>2]=wb;ac=xa;xb=c[ac>>2]|0;ec=c[ac+4>>2]|0;ac=ya;Cb=Ha(xb|0,ec|0,c[ac>>2]|0,c[ac+4>>2]|0)|0;ac=D;Ub=ya;c[Ub>>2]=Cb;c[Ub+4>>2]=ac;Ub=za;fc=c[Ub>>2]|0;Qb=c[Ub+4>>2]|0;Ub=Aa;nc=Ha(fc|0,Qb|0,c[Ub>>2]|0,c[Ub+4>>2]|0)|0;Ub=D;sb=Aa;c[sb>>2]=nc;c[sb+4>>2]=Ub;sb=Ba;Vb=c[sb>>2]|0;vb=c[sb+4>>2]|0;sb=Fa;Rb=Ha(Vb|0,vb|0,c[sb>>2]|0,c[sb+4>>2]|0)|0;sb=D;cc=Fa;c[cc>>2]=Rb;c[cc+4>>2]=sb;cc=Ma;_b=c[cc>>2]|0;pb=c[cc+4>>2]|0;cc=Na;Eb=Ha(_b|0,pb|0,c[cc>>2]|0,c[cc+4>>2]|0)|0;cc=D;rb=Na;c[rb>>2]=Eb;c[rb+4>>2]=cc;C=Oa+0|0;e=C+72|0;do{c[C>>2]=0;C=C+4|0}while((C|0)<(e|0));rb=Ta(mc|0,Ab|0,121665,0)|0;Ib=s;c[Ib>>2]=rb;c[Ib+4>>2]=D;Ib=Ta(hc|0,Kb|0,121665,0)|0;rb=Pa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ta(Wb|0,Xb|0,121665,0)|0;Ib=Qa;c[Ib>>2]=rb;c[Ib+4>>2]=D;Ib=Ta(zb|0,dc|0,121665,0)|0;rb=Ra;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ta(tb|0,Mb|0,121665,0)|0;Ib=Sa;c[Ib>>2]=rb;c[Ib+4>>2]=D;Ib=Ta(Gb|0,wb|0,121665,0)|0;rb=Ua;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ta(Cb|0,ac|0,121665,0)|0;Ib=Va;c[Ib>>2]=rb;c[Ib+4>>2]=D;Ib=Ta(nc|0,Ub|0,121665,0)|0;rb=Wa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ta(Rb|0,sb|0,121665,0)|0;Ib=Xa;c[Ib>>2]=rb;c[Ib+4>>2]=D;Ib=Ta(Eb|0,cc|0,121665,0)|0;rb=Ya;c[rb>>2]=Ib;c[rb+4>>2]=D;Ca(s);rb=s;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,jc|0,Jb|0)|0;rb=s;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Pa;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,Bb|0,Pb|0)|0;rb=Pa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Qa;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,gc|0,Lb|0)|0;rb=Qa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ra;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,Zb|0,Yb|0)|0;rb=Ra;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Sa;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,Fb|0,Nb|0)|0;rb=Sa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ua;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,ic|0,qb|0)|0;rb=Ua;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Va;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,xb|0,ec|0)|0;rb=Va;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Wa;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,fc|0,Qb|0)|0;rb=Wa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Xa;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,Vb|0,vb|0)|0;rb=Xa;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=Ya;Ib=Ia(c[rb>>2]|0,c[rb+4>>2]|0,_b|0,pb|0)|0;rb=Ya;c[rb>>2]=Ib;c[rb+4>>2]=D;Da(lb,j,s);rb=lb+144|0;Ib=c[rb>>2]|0;$b=c[rb+4>>2]|0;rb=lb+64|0;ub=rb;Sb=c[ub>>2]|0;Tb=c[ub+4>>2]|0;ub=Ta(Ib|0,$b|0,18,0)|0;Ob=D;Db=Ia(Sb|0,Tb|0,Ib|0,$b|0)|0;$b=Ia(Db|0,D|0,ub|0,Ob|0)|0;Ob=rb;c[Ob>>2]=$b;c[Ob+4>>2]=D;Ob=lb+136|0;$b=c[Ob>>2]|0;rb=c[Ob+4>>2]|0;Ob=lb+56|0;ub=Ob;Db=c[ub>>2]|0;Ib=c[ub+4>>2]|0;ub=Ta($b|0,rb|0,18,0)|0;Tb=D;Sb=Ia(Db|0,Ib|0,$b|0,rb|0)|0;rb=Ia(Sb|0,D|0,ub|0,Tb|0)|0;Tb=Ob;c[Tb>>2]=rb;c[Tb+4>>2]=D;Tb=lb+128|0;rb=c[Tb>>2]|0;Ob=c[Tb+4>>2]|0;Tb=lb+48|0;ub=Tb;Sb=c[ub>>2]|0;$b=c[ub+4>>2]|0;ub=Ta(rb|0,Ob|0,18,0)|0;Ib=D;Db=Ia(Sb|0,$b|0,rb|0,Ob|0)|0;Ob=Ia(Db|0,D|0,ub|0,Ib|0)|0;Ib=Tb;c[Ib>>2]=Ob;c[Ib+4>>2]=D;Ib=lb+120|0;Ob=c[Ib>>2]|0;Tb=c[Ib+4>>2]|0;Ib=lb+40|0;ub=Ib;Db=c[ub>>2]|0;rb=c[ub+4>>2]|0;ub=Ta(Ob|0,Tb|0,18,0)|0;$b=D;Sb=Ia(Db|0,rb|0,Ob|0,Tb|0)|0;Tb=Ia(Sb|0,D|0,ub|0,$b|0)|0;$b=Ib;c[$b>>2]=Tb;c[$b+4>>2]=D;$b=lb+112|0;Tb=c[$b>>2]|0;Ib=c[$b+4>>2]|0;$b=lb+32|0;ub=$b;Sb=c[ub>>2]|0;Ob=c[ub+4>>2]|0;ub=Ta(Tb|0,Ib|0,18,0)|0;rb=D;Db=Ia(Sb|0,Ob|0,Tb|0,Ib|0)|0;Ib=Ia(Db|0,D|0,ub|0,rb|0)|0;rb=$b;c[rb>>2]=Ib;c[rb+4>>2]=D;rb=lb+104|0;Ib=c[rb>>2]|0;$b=c[rb+4>>2]|0;rb=lb+24|0;ub=rb;Db=c[ub>>2]|0;Tb=c[ub+4>>2]|0;ub=Ta(Ib|0,$b|0,18,0)|0;Ob=D;Sb=Ia(Db|0,Tb|0,Ib|0,$b|0)|0;$b=Ia(Sb|0,D|0,ub|0,Ob|0)|0;Ob=rb;c[Ob>>2]=$b;c[Ob+4>>2]=D;Ob=lb+96|0;$b=c[Ob>>2]|0;rb=c[Ob+4>>2]|0;Ob=lb+16|0;ub=Ob;Sb=c[ub>>2]|0;Ib=c[ub+4>>2]|0;ub=Ta($b|0,rb|0,18,0)|0;Tb=D;Db=Ia(Sb|0,Ib|0,$b|0,rb|0)|0;rb=Ia(Db|0,D|0,ub|0,Tb|0)|0;Tb=Ob;c[Tb>>2]=rb;c[Tb+4>>2]=D;Tb=lb+88|0;rb=c[Tb>>2]|0;Ob=c[Tb+4>>2]|0;Tb=lb+8|0;ub=Tb;Db=c[ub>>2]|0;$b=c[ub+4>>2]|0;ub=Ta(rb|0,Ob|0,18,0)|0;Ib=D;Sb=Ia(Db|0,$b|0,rb|0,Ob|0)|0;Ob=Ia(Sb|0,D|0,ub|0,Ib|0)|0;Ib=Tb;c[Ib>>2]=Ob;c[Ib+4>>2]=D;Ib=lb+80|0;Ob=c[Ib>>2]|0;Tb=c[Ib+4>>2]|0;Ib=lb;ub=c[Ib>>2]|0;Sb=c[Ib+4>>2]|0;Ib=Ta(Ob|0,Tb|0,18,0)|0;rb=D;$b=Ia(ub|0,Sb|0,Ob|0,Tb|0)|0;Tb=Ia($b|0,D|0,Ib|0,rb|0)|0;rb=lb;c[rb>>2]=Tb;c[rb+4>>2]=D;Ca(lb);rb=0;while(1){Tb=jb+(rb<<3)|0;Ib=Tb;$b=c[Ib>>2]|0;Ob=c[Ib+4>>2]|0;Ib=fb+(rb<<3)|0;Sb=Ib;ub=c[Sb>>2]|0;Db=c[Sb+4>>2]|0;Sb=(ub^$b)&nb;lc=(Db^Ob)&ob;lc^Ob;Ob=Ga(0,Sb^$b|0,32)|0;$b=Tb;c[$b>>2]=Ob;c[$b+4>>2]=D;lc^Db;Db=Ga(0,Sb^ub|0,32)|0;ub=Ib;c[ub>>2]=Db;c[ub+4>>2]=D;ub=rb+1|0;if((ub|0)==10){oc=0;break}else{rb=ub}}do{rb=lb+(oc<<3)|0;pb=rb;_b=c[pb>>2]|0;vb=c[pb+4>>2]|0;pb=hb+(oc<<3)|0;Vb=pb;Qb=c[Vb>>2]|0;fc=c[Vb+4>>2]|0;Vb=(Qb^_b)&nb;ec=(fc^vb)&ob;ec^vb;vb=Ga(0,Vb^_b|0,32)|0;_b=rb;c[_b>>2]=vb;c[_b+4>>2]=D;ec^fc;fc=Ga(0,Vb^Qb|0,32)|0;Qb=pb;c[Qb>>2]=fc;c[Qb+4>>2]=D;oc=oc+1|0}while((oc|0)!=10);db=db+1|0;if((db|0)==8){break}else{ob=lb;nb=jb;Qb=hb;fc=fb;w=mb<<1&255;lb=kb;kb=ob;jb=ib;ib=nb;hb=gb;gb=Qb;fb=eb;eb=fc}}Za=Za+1|0;if((Za|0)==32){break}else{_a=fb;$a=eb;t=hb;ab=gb;u=jb;bb=ib;v=lb;cb=kb}}C=y+0|0;E=jb+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));C=z+0|0;E=lb+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(h,z);Ea(r,h);Ea(q,r);Da(s,q,z);lb=s+144|0;jb=lb;cb=c[jb>>2]|0;v=c[jb+4>>2]|0;jb=Xa;bb=c[jb>>2]|0;u=c[jb+4>>2]|0;jb=Ta(cb|0,v|0,18,0)|0;ab=D;t=Ia(bb|0,u|0,cb|0,v|0)|0;v=Ia(t|0,D|0,jb|0,ab|0)|0;ab=Xa;c[ab>>2]=v;c[ab+4>>2]=D;ab=s+136|0;v=ab;jb=c[v>>2]|0;t=c[v+4>>2]|0;v=Wa;cb=c[v>>2]|0;u=c[v+4>>2]|0;v=Ta(jb|0,t|0,18,0)|0;bb=D;$a=Ia(cb|0,u|0,jb|0,t|0)|0;t=Ia($a|0,D|0,v|0,bb|0)|0;bb=Wa;c[bb>>2]=t;c[bb+4>>2]=D;bb=s+128|0;t=bb;v=c[t>>2]|0;$a=c[t+4>>2]|0;t=Va;jb=c[t>>2]|0;u=c[t+4>>2]|0;t=Ta(v|0,$a|0,18,0)|0;cb=D;_a=Ia(jb|0,u|0,v|0,$a|0)|0;$a=Ia(_a|0,D|0,t|0,cb|0)|0;cb=Va;c[cb>>2]=$a;c[cb+4>>2]=D;cb=s+120|0;$a=cb;t=c[$a>>2]|0;_a=c[$a+4>>2]|0;$a=Ua;v=c[$a>>2]|0;u=c[$a+4>>2]|0;$a=Ta(t|0,_a|0,18,0)|0;jb=D;Za=Ia(v|0,u|0,t|0,_a|0)|0;_a=Ia(Za|0,D|0,$a|0,jb|0)|0;jb=Ua;c[jb>>2]=_a;c[jb+4>>2]=D;jb=s+112|0;_a=jb;$a=c[_a>>2]|0;Za=c[_a+4>>2]|0;_a=Sa;t=c[_a>>2]|0;u=c[_a+4>>2]|0;_a=Ta($a|0,Za|0,18,0)|0;v=D;oc=Ia(t|0,u|0,$a|0,Za|0)|0;Za=Ia(oc|0,D|0,_a|0,v|0)|0;v=Sa;c[v>>2]=Za;c[v+4>>2]=D;v=s+104|0;Za=v;_a=c[Za>>2]|0;oc=c[Za+4>>2]|0;Za=Ra;$a=c[Za>>2]|0;u=c[Za+4>>2]|0;Za=Ta(_a|0,oc|0,18,0)|0;t=D;Ya=Ia($a|0,u|0,_a|0,oc|0)|0;oc=Ia(Ya|0,D|0,Za|0,t|0)|0;t=Ra;c[t>>2]=oc;c[t+4>>2]=D;t=s+96|0;oc=t;Za=c[oc>>2]|0;Ya=c[oc+4>>2]|0;oc=Qa;_a=c[oc>>2]|0;u=c[oc+4>>2]|0;oc=Ta(Za|0,Ya|0,18,0)|0;$a=D;Na=Ia(_a|0,u|0,Za|0,Ya|0)|0;Ya=Ia(Na|0,D|0,oc|0,$a|0)|0;$a=Qa;c[$a>>2]=Ya;c[$a+4>>2]=D;$a=s+88|0;Ya=$a;oc=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Pa;Za=c[Ya>>2]|0;u=c[Ya+4>>2]|0;Ya=Ta(oc|0,Na|0,18,0)|0;_a=D;Ma=Ia(Za|0,u|0,oc|0,Na|0)|0;Na=Ia(Ma|0,D|0,Ya|0,_a|0)|0;_a=Pa;c[_a>>2]=Na;c[_a+4>>2]=D;_a=Oa;Na=c[_a>>2]|0;Ya=c[_a+4>>2]|0;_a=s;Ma=c[_a>>2]|0;oc=c[_a+4>>2]|0;_a=Ta(Na|0,Ya|0,18,0)|0;u=D;Za=Ia(Ma|0,oc|0,Na|0,Ya|0)|0;Ya=Ia(Za|0,D|0,_a|0,u|0)|0;u=s;c[u>>2]=Ya;c[u+4>>2]=D;Ca(s);C=j+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Da(s,j,h);h=lb;u=c[h>>2]|0;Ya=c[h+4>>2]|0;h=Xa;_a=c[h>>2]|0;Za=c[h+4>>2]|0;h=Ta(u|0,Ya|0,18,0)|0;Na=D;oc=Ia(_a|0,Za|0,u|0,Ya|0)|0;Ya=Ia(oc|0,D|0,h|0,Na|0)|0;Na=Xa;c[Na>>2]=Ya;c[Na+4>>2]=D;Na=ab;Ya=c[Na>>2]|0;h=c[Na+4>>2]|0;Na=Wa;oc=c[Na>>2]|0;u=c[Na+4>>2]|0;Na=Ta(Ya|0,h|0,18,0)|0;Za=D;_a=Ia(oc|0,u|0,Ya|0,h|0)|0;h=Ia(_a|0,D|0,Na|0,Za|0)|0;Za=Wa;c[Za>>2]=h;c[Za+4>>2]=D;Za=bb;h=c[Za>>2]|0;Na=c[Za+4>>2]|0;Za=Va;_a=c[Za>>2]|0;Ya=c[Za+4>>2]|0;Za=Ta(h|0,Na|0,18,0)|0;u=D;oc=Ia(_a|0,Ya|0,h|0,Na|0)|0;Na=Ia(oc|0,D|0,Za|0,u|0)|0;u=Va;c[u>>2]=Na;c[u+4>>2]=D;u=cb;Na=c[u>>2]|0;Za=c[u+4>>2]|0;u=Ua;oc=c[u>>2]|0;h=c[u+4>>2]|0;u=Ta(Na|0,Za|0,18,0)|0;Ya=D;_a=Ia(oc|0,h|0,Na|0,Za|0)|0;Za=Ia(_a|0,D|0,u|0,Ya|0)|0;Ya=Ua;c[Ya>>2]=Za;c[Ya+4>>2]=D;Ya=jb;Za=c[Ya>>2]|0;u=c[Ya+4>>2]|0;Ya=Sa;_a=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Ta(Za|0,u|0,18,0)|0;h=D;oc=Ia(_a|0,Na|0,Za|0,u|0)|0;u=Ia(oc|0,D|0,Ya|0,h|0)|0;h=Sa;c[h>>2]=u;c[h+4>>2]=D;h=v;u=c[h>>2]|0;Ya=c[h+4>>2]|0;h=Ra;oc=c[h>>2]|0;Za=c[h+4>>2]|0;h=Ta(u|0,Ya|0,18,0)|0;Na=D;_a=Ia(oc|0,Za|0,u|0,Ya|0)|0;Ya=Ia(_a|0,D|0,h|0,Na|0)|0;Na=Ra;c[Na>>2]=Ya;c[Na+4>>2]=D;Na=t;Ya=c[Na>>2]|0;h=c[Na+4>>2]|0;Na=Qa;_a=c[Na>>2]|0;u=c[Na+4>>2]|0;Na=Ta(Ya|0,h|0,18,0)|0;Za=D;oc=Ia(_a|0,u|0,Ya|0,h|0)|0;h=Ia(oc|0,D|0,Na|0,Za|0)|0;Za=Qa;c[Za>>2]=h;c[Za+4>>2]=D;Za=$a;h=c[Za>>2]|0;Na=c[Za+4>>2]|0;Za=Pa;oc=c[Za>>2]|0;Ya=c[Za+4>>2]|0;Za=Ta(h|0,Na|0,18,0)|0;u=D;_a=Ia(oc|0,Ya|0,h|0,Na|0)|0;Na=Ia(_a|0,D|0,Za|0,u|0)|0;u=Pa;c[u>>2]=Na;c[u+4>>2]=D;u=Oa;Na=c[u>>2]|0;Za=c[u+4>>2]|0;u=s;_a=c[u>>2]|0;h=c[u+4>>2]|0;u=Ta(Na|0,Za|0,18,0)|0;Ya=D;oc=Ia(_a|0,h|0,Na|0,Za|0)|0;Za=Ia(oc|0,D|0,u|0,Ya|0)|0;Ya=s;c[Ya>>2]=Za;c[Ya+4>>2]=D;Ca(s);C=k+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,k);Da(s,q,j);j=lb;Ya=c[j>>2]|0;Za=c[j+4>>2]|0;j=Xa;u=c[j>>2]|0;oc=c[j+4>>2]|0;j=Ta(Ya|0,Za|0,18,0)|0;Na=D;h=Ia(u|0,oc|0,Ya|0,Za|0)|0;Za=Ia(h|0,D|0,j|0,Na|0)|0;Na=Xa;c[Na>>2]=Za;c[Na+4>>2]=D;Na=ab;Za=c[Na>>2]|0;j=c[Na+4>>2]|0;Na=Wa;h=c[Na>>2]|0;Ya=c[Na+4>>2]|0;Na=Ta(Za|0,j|0,18,0)|0;oc=D;u=Ia(h|0,Ya|0,Za|0,j|0)|0;j=Ia(u|0,D|0,Na|0,oc|0)|0;oc=Wa;c[oc>>2]=j;c[oc+4>>2]=D;oc=bb;j=c[oc>>2]|0;Na=c[oc+4>>2]|0;oc=Va;u=c[oc>>2]|0;Za=c[oc+4>>2]|0;oc=Ta(j|0,Na|0,18,0)|0;Ya=D;h=Ia(u|0,Za|0,j|0,Na|0)|0;Na=Ia(h|0,D|0,oc|0,Ya|0)|0;Ya=Va;c[Ya>>2]=Na;c[Ya+4>>2]=D;Ya=cb;Na=c[Ya>>2]|0;oc=c[Ya+4>>2]|0;Ya=Ua;h=c[Ya>>2]|0;j=c[Ya+4>>2]|0;Ya=Ta(Na|0,oc|0,18,0)|0;Za=D;u=Ia(h|0,j|0,Na|0,oc|0)|0;oc=Ia(u|0,D|0,Ya|0,Za|0)|0;Za=Ua;c[Za>>2]=oc;c[Za+4>>2]=D;Za=jb;oc=c[Za>>2]|0;Ya=c[Za+4>>2]|0;Za=Sa;u=c[Za>>2]|0;Na=c[Za+4>>2]|0;Za=Ta(oc|0,Ya|0,18,0)|0;j=D;h=Ia(u|0,Na|0,oc|0,Ya|0)|0;Ya=Ia(h|0,D|0,Za|0,j|0)|0;j=Sa;c[j>>2]=Ya;c[j+4>>2]=D;j=v;Ya=c[j>>2]|0;Za=c[j+4>>2]|0;j=Ra;h=c[j>>2]|0;oc=c[j+4>>2]|0;j=Ta(Ya|0,Za|0,18,0)|0;Na=D;u=Ia(h|0,oc|0,Ya|0,Za|0)|0;Za=Ia(u|0,D|0,j|0,Na|0)|0;Na=Ra;c[Na>>2]=Za;c[Na+4>>2]=D;Na=t;Za=c[Na>>2]|0;j=c[Na+4>>2]|0;Na=Qa;u=c[Na>>2]|0;Ya=c[Na+4>>2]|0;Na=Ta(Za|0,j|0,18,0)|0;oc=D;h=Ia(u|0,Ya|0,Za|0,j|0)|0;j=Ia(h|0,D|0,Na|0,oc|0)|0;oc=Qa;c[oc>>2]=j;c[oc+4>>2]=D;oc=$a;j=c[oc>>2]|0;Na=c[oc+4>>2]|0;oc=Pa;h=c[oc>>2]|0;Za=c[oc+4>>2]|0;oc=Ta(j|0,Na|0,18,0)|0;Ya=D;u=Ia(h|0,Za|0,j|0,Na|0)|0;Na=Ia(u|0,D|0,oc|0,Ya|0)|0;Ya=Pa;c[Ya>>2]=Na;c[Ya+4>>2]=D;Ya=Oa;Na=c[Ya>>2]|0;oc=c[Ya+4>>2]|0;Ya=s;u=c[Ya>>2]|0;j=c[Ya+4>>2]|0;Ya=Ta(Na|0,oc|0,18,0)|0;Za=D;h=Ia(u|0,j|0,Na|0,oc|0)|0;oc=Ia(h|0,D|0,Ya|0,Za|0)|0;Za=s;c[Za>>2]=oc;c[Za+4>>2]=D;Ca(s);C=l+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,l);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Da(s,q,l);l=lb;Za=c[l>>2]|0;oc=c[l+4>>2]|0;l=Xa;Ya=c[l>>2]|0;h=c[l+4>>2]|0;l=Ta(Za|0,oc|0,18,0)|0;Na=D;j=Ia(Ya|0,h|0,Za|0,oc|0)|0;oc=Ia(j|0,D|0,l|0,Na|0)|0;Na=Xa;c[Na>>2]=oc;c[Na+4>>2]=D;Na=ab;oc=c[Na>>2]|0;l=c[Na+4>>2]|0;Na=Wa;j=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Ta(oc|0,l|0,18,0)|0;h=D;Ya=Ia(j|0,Za|0,oc|0,l|0)|0;l=Ia(Ya|0,D|0,Na|0,h|0)|0;h=Wa;c[h>>2]=l;c[h+4>>2]=D;h=bb;l=c[h>>2]|0;Na=c[h+4>>2]|0;h=Va;Ya=c[h>>2]|0;oc=c[h+4>>2]|0;h=Ta(l|0,Na|0,18,0)|0;Za=D;j=Ia(Ya|0,oc|0,l|0,Na|0)|0;Na=Ia(j|0,D|0,h|0,Za|0)|0;Za=Va;c[Za>>2]=Na;c[Za+4>>2]=D;Za=cb;Na=c[Za>>2]|0;h=c[Za+4>>2]|0;Za=Ua;j=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Ta(Na|0,h|0,18,0)|0;oc=D;Ya=Ia(j|0,l|0,Na|0,h|0)|0;h=Ia(Ya|0,D|0,Za|0,oc|0)|0;oc=Ua;c[oc>>2]=h;c[oc+4>>2]=D;oc=jb;h=c[oc>>2]|0;Za=c[oc+4>>2]|0;oc=Sa;Ya=c[oc>>2]|0;Na=c[oc+4>>2]|0;oc=Ta(h|0,Za|0,18,0)|0;l=D;j=Ia(Ya|0,Na|0,h|0,Za|0)|0;Za=Ia(j|0,D|0,oc|0,l|0)|0;l=Sa;c[l>>2]=Za;c[l+4>>2]=D;l=v;Za=c[l>>2]|0;oc=c[l+4>>2]|0;l=Ra;j=c[l>>2]|0;h=c[l+4>>2]|0;l=Ta(Za|0,oc|0,18,0)|0;Na=D;Ya=Ia(j|0,h|0,Za|0,oc|0)|0;oc=Ia(Ya|0,D|0,l|0,Na|0)|0;Na=Ra;c[Na>>2]=oc;c[Na+4>>2]=D;Na=t;oc=c[Na>>2]|0;l=c[Na+4>>2]|0;Na=Qa;Ya=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Ta(oc|0,l|0,18,0)|0;h=D;j=Ia(Ya|0,Za|0,oc|0,l|0)|0;l=Ia(j|0,D|0,Na|0,h|0)|0;h=Qa;c[h>>2]=l;c[h+4>>2]=D;h=$a;l=c[h>>2]|0;Na=c[h+4>>2]|0;h=Pa;j=c[h>>2]|0;oc=c[h+4>>2]|0;h=Ta(l|0,Na|0,18,0)|0;Za=D;Ya=Ia(j|0,oc|0,l|0,Na|0)|0;Na=Ia(Ya|0,D|0,h|0,Za|0)|0;Za=Pa;c[Za>>2]=Na;c[Za+4>>2]=D;Za=Oa;Na=c[Za>>2]|0;h=c[Za+4>>2]|0;Za=s;Ya=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Ta(Na|0,h|0,18,0)|0;oc=D;j=Ia(Ya|0,l|0,Na|0,h|0)|0;h=Ia(j|0,D|0,Za|0,oc|0)|0;oc=s;c[oc>>2]=h;c[oc+4>>2]=D;Ca(s);C=m+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,m);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Da(s,r,m);oc=lb;h=c[oc>>2]|0;Za=c[oc+4>>2]|0;oc=Xa;j=c[oc>>2]|0;Na=c[oc+4>>2]|0;oc=Ta(h|0,Za|0,18,0)|0;l=D;Ya=Ia(j|0,Na|0,h|0,Za|0)|0;Za=Ia(Ya|0,D|0,oc|0,l|0)|0;l=Xa;c[l>>2]=Za;c[l+4>>2]=D;l=ab;Za=c[l>>2]|0;oc=c[l+4>>2]|0;l=Wa;Ya=c[l>>2]|0;h=c[l+4>>2]|0;l=Ta(Za|0,oc|0,18,0)|0;Na=D;j=Ia(Ya|0,h|0,Za|0,oc|0)|0;oc=Ia(j|0,D|0,l|0,Na|0)|0;Na=Wa;c[Na>>2]=oc;c[Na+4>>2]=D;Na=bb;oc=c[Na>>2]|0;l=c[Na+4>>2]|0;Na=Va;j=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Ta(oc|0,l|0,18,0)|0;h=D;Ya=Ia(j|0,Za|0,oc|0,l|0)|0;l=Ia(Ya|0,D|0,Na|0,h|0)|0;h=Va;c[h>>2]=l;c[h+4>>2]=D;h=cb;l=c[h>>2]|0;Na=c[h+4>>2]|0;h=Ua;Ya=c[h>>2]|0;oc=c[h+4>>2]|0;h=Ta(l|0,Na|0,18,0)|0;Za=D;j=Ia(Ya|0,oc|0,l|0,Na|0)|0;Na=Ia(j|0,D|0,h|0,Za|0)|0;Za=Ua;c[Za>>2]=Na;c[Za+4>>2]=D;Za=jb;Na=c[Za>>2]|0;h=c[Za+4>>2]|0;Za=Sa;j=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Ta(Na|0,h|0,18,0)|0;oc=D;Ya=Ia(j|0,l|0,Na|0,h|0)|0;h=Ia(Ya|0,D|0,Za|0,oc|0)|0;oc=Sa;c[oc>>2]=h;c[oc+4>>2]=D;oc=v;h=c[oc>>2]|0;Za=c[oc+4>>2]|0;oc=Ra;Ya=c[oc>>2]|0;Na=c[oc+4>>2]|0;oc=Ta(h|0,Za|0,18,0)|0;l=D;j=Ia(Ya|0,Na|0,h|0,Za|0)|0;Za=Ia(j|0,D|0,oc|0,l|0)|0;l=Ra;c[l>>2]=Za;c[l+4>>2]=D;l=t;Za=c[l>>2]|0;oc=c[l+4>>2]|0;l=Qa;j=c[l>>2]|0;h=c[l+4>>2]|0;l=Ta(Za|0,oc|0,18,0)|0;Na=D;Ya=Ia(j|0,h|0,Za|0,oc|0)|0;oc=Ia(Ya|0,D|0,l|0,Na|0)|0;Na=Qa;c[Na>>2]=oc;c[Na+4>>2]=D;Na=$a;oc=c[Na>>2]|0;l=c[Na+4>>2]|0;Na=Pa;Ya=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Ta(oc|0,l|0,18,0)|0;h=D;j=Ia(Ya|0,Za|0,oc|0,l|0)|0;l=Ia(j|0,D|0,Na|0,h|0)|0;h=Pa;c[h>>2]=l;c[h+4>>2]=D;h=Oa;l=c[h>>2]|0;Na=c[h+4>>2]|0;h=s;j=c[h>>2]|0;oc=c[h+4>>2]|0;h=Ta(l|0,Na|0,18,0)|0;Za=D;Ya=Ia(j|0,oc|0,l|0,Na|0)|0;Na=Ia(Ya|0,D|0,h|0,Za|0)|0;Za=s;c[Za>>2]=Na;c[Za+4>>2]=D;Ca(s);C=n+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,n);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Da(s,r,n);n=lb;Za=c[n>>2]|0;Na=c[n+4>>2]|0;n=Xa;h=c[n>>2]|0;Ya=c[n+4>>2]|0;n=Ta(Za|0,Na|0,18,0)|0;l=D;oc=Ia(h|0,Ya|0,Za|0,Na|0)|0;Na=Ia(oc|0,D|0,n|0,l|0)|0;l=Xa;c[l>>2]=Na;c[l+4>>2]=D;l=ab;Na=c[l>>2]|0;n=c[l+4>>2]|0;l=Wa;oc=c[l>>2]|0;Za=c[l+4>>2]|0;l=Ta(Na|0,n|0,18,0)|0;Ya=D;h=Ia(oc|0,Za|0,Na|0,n|0)|0;n=Ia(h|0,D|0,l|0,Ya|0)|0;Ya=Wa;c[Ya>>2]=n;c[Ya+4>>2]=D;Ya=bb;n=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Va;h=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Ta(n|0,l|0,18,0)|0;Za=D;oc=Ia(h|0,Na|0,n|0,l|0)|0;l=Ia(oc|0,D|0,Ya|0,Za|0)|0;Za=Va;c[Za>>2]=l;c[Za+4>>2]=D;Za=cb;l=c[Za>>2]|0;Ya=c[Za+4>>2]|0;Za=Ua;oc=c[Za>>2]|0;n=c[Za+4>>2]|0;Za=Ta(l|0,Ya|0,18,0)|0;Na=D;h=Ia(oc|0,n|0,l|0,Ya|0)|0;Ya=Ia(h|0,D|0,Za|0,Na|0)|0;Na=Ua;c[Na>>2]=Ya;c[Na+4>>2]=D;Na=jb;Ya=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Sa;h=c[Na>>2]|0;l=c[Na+4>>2]|0;Na=Ta(Ya|0,Za|0,18,0)|0;n=D;oc=Ia(h|0,l|0,Ya|0,Za|0)|0;Za=Ia(oc|0,D|0,Na|0,n|0)|0;n=Sa;c[n>>2]=Za;c[n+4>>2]=D;n=v;Za=c[n>>2]|0;Na=c[n+4>>2]|0;n=Ra;oc=c[n>>2]|0;Ya=c[n+4>>2]|0;n=Ta(Za|0,Na|0,18,0)|0;l=D;h=Ia(oc|0,Ya|0,Za|0,Na|0)|0;Na=Ia(h|0,D|0,n|0,l|0)|0;l=Ra;c[l>>2]=Na;c[l+4>>2]=D;l=t;Na=c[l>>2]|0;n=c[l+4>>2]|0;l=Qa;h=c[l>>2]|0;Za=c[l+4>>2]|0;l=Ta(Na|0,n|0,18,0)|0;Ya=D;oc=Ia(h|0,Za|0,Na|0,n|0)|0;n=Ia(oc|0,D|0,l|0,Ya|0)|0;Ya=Qa;c[Ya>>2]=n;c[Ya+4>>2]=D;Ya=$a;n=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Pa;oc=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Ta(n|0,l|0,18,0)|0;Za=D;h=Ia(oc|0,Na|0,n|0,l|0)|0;l=Ia(h|0,D|0,Ya|0,Za|0)|0;Za=Pa;c[Za>>2]=l;c[Za+4>>2]=D;Za=Oa;l=c[Za>>2]|0;Ya=c[Za+4>>2]|0;Za=s;h=c[Za>>2]|0;n=c[Za+4>>2]|0;Za=Ta(l|0,Ya|0,18,0)|0;Na=D;oc=Ia(h|0,n|0,l|0,Ya|0)|0;Ya=Ia(oc|0,D|0,Za|0,Na|0)|0;Na=s;c[Na>>2]=Ya;c[Na+4>>2]=D;Ca(s);C=q+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Da(s,q,m);m=lb;Na=c[m>>2]|0;Ya=c[m+4>>2]|0;m=Xa;Za=c[m>>2]|0;oc=c[m+4>>2]|0;m=Ta(Na|0,Ya|0,18,0)|0;l=D;n=Ia(Za|0,oc|0,Na|0,Ya|0)|0;Ya=Ia(n|0,D|0,m|0,l|0)|0;l=Xa;c[l>>2]=Ya;c[l+4>>2]=D;l=ab;Ya=c[l>>2]|0;m=c[l+4>>2]|0;l=Wa;n=c[l>>2]|0;Na=c[l+4>>2]|0;l=Ta(Ya|0,m|0,18,0)|0;oc=D;Za=Ia(n|0,Na|0,Ya|0,m|0)|0;m=Ia(Za|0,D|0,l|0,oc|0)|0;oc=Wa;c[oc>>2]=m;c[oc+4>>2]=D;oc=bb;m=c[oc>>2]|0;l=c[oc+4>>2]|0;oc=Va;Za=c[oc>>2]|0;Ya=c[oc+4>>2]|0;oc=Ta(m|0,l|0,18,0)|0;Na=D;n=Ia(Za|0,Ya|0,m|0,l|0)|0;l=Ia(n|0,D|0,oc|0,Na|0)|0;Na=Va;c[Na>>2]=l;c[Na+4>>2]=D;Na=cb;l=c[Na>>2]|0;oc=c[Na+4>>2]|0;Na=Ua;n=c[Na>>2]|0;m=c[Na+4>>2]|0;Na=Ta(l|0,oc|0,18,0)|0;Ya=D;Za=Ia(n|0,m|0,l|0,oc|0)|0;oc=Ia(Za|0,D|0,Na|0,Ya|0)|0;Ya=Ua;c[Ya>>2]=oc;c[Ya+4>>2]=D;Ya=jb;oc=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Sa;Za=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Ta(oc|0,Na|0,18,0)|0;m=D;n=Ia(Za|0,l|0,oc|0,Na|0)|0;Na=Ia(n|0,D|0,Ya|0,m|0)|0;m=Sa;c[m>>2]=Na;c[m+4>>2]=D;m=v;Na=c[m>>2]|0;Ya=c[m+4>>2]|0;m=Ra;n=c[m>>2]|0;oc=c[m+4>>2]|0;m=Ta(Na|0,Ya|0,18,0)|0;l=D;Za=Ia(n|0,oc|0,Na|0,Ya|0)|0;Ya=Ia(Za|0,D|0,m|0,l|0)|0;l=Ra;c[l>>2]=Ya;c[l+4>>2]=D;l=t;Ya=c[l>>2]|0;m=c[l+4>>2]|0;l=Qa;Za=c[l>>2]|0;Na=c[l+4>>2]|0;l=Ta(Ya|0,m|0,18,0)|0;oc=D;n=Ia(Za|0,Na|0,Ya|0,m|0)|0;m=Ia(n|0,D|0,l|0,oc|0)|0;oc=Qa;c[oc>>2]=m;c[oc+4>>2]=D;oc=$a;m=c[oc>>2]|0;l=c[oc+4>>2]|0;oc=Pa;n=c[oc>>2]|0;Ya=c[oc+4>>2]|0;oc=Ta(m|0,l|0,18,0)|0;Na=D;Za=Ia(n|0,Ya|0,m|0,l|0)|0;l=Ia(Za|0,D|0,oc|0,Na|0)|0;Na=Pa;c[Na>>2]=l;c[Na+4>>2]=D;Na=Oa;l=c[Na>>2]|0;oc=c[Na+4>>2]|0;Na=s;Za=c[Na>>2]|0;m=c[Na+4>>2]|0;Na=Ta(l|0,oc|0,18,0)|0;Ya=D;n=Ia(Za|0,m|0,l|0,oc|0)|0;oc=Ia(n|0,D|0,Na|0,Ya|0)|0;Ya=s;c[Ya>>2]=oc;c[Ya+4>>2]=D;Ca(s);C=o+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,o);Ea(r,q);Ya=2;do{Ea(q,r);Ea(r,q);Ya=Ya+2|0}while((Ya|0)<50);Da(s,r,o);Ya=lb;oc=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Xa;n=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Ta(oc|0,Na|0,18,0)|0;m=D;Za=Ia(n|0,l|0,oc|0,Na|0)|0;Na=Ia(Za|0,D|0,Ya|0,m|0)|0;m=Xa;c[m>>2]=Na;c[m+4>>2]=D;m=ab;Na=c[m>>2]|0;Ya=c[m+4>>2]|0;m=Wa;Za=c[m>>2]|0;oc=c[m+4>>2]|0;m=Ta(Na|0,Ya|0,18,0)|0;l=D;n=Ia(Za|0,oc|0,Na|0,Ya|0)|0;Ya=Ia(n|0,D|0,m|0,l|0)|0;l=Wa;c[l>>2]=Ya;c[l+4>>2]=D;l=bb;Ya=c[l>>2]|0;m=c[l+4>>2]|0;l=Va;n=c[l>>2]|0;Na=c[l+4>>2]|0;l=Ta(Ya|0,m|0,18,0)|0;oc=D;Za=Ia(n|0,Na|0,Ya|0,m|0)|0;m=Ia(Za|0,D|0,l|0,oc|0)|0;oc=Va;c[oc>>2]=m;c[oc+4>>2]=D;oc=cb;m=c[oc>>2]|0;l=c[oc+4>>2]|0;oc=Ua;Za=c[oc>>2]|0;Ya=c[oc+4>>2]|0;oc=Ta(m|0,l|0,18,0)|0;Na=D;n=Ia(Za|0,Ya|0,m|0,l|0)|0;l=Ia(n|0,D|0,oc|0,Na|0)|0;Na=Ua;c[Na>>2]=l;c[Na+4>>2]=D;Na=jb;l=c[Na>>2]|0;oc=c[Na+4>>2]|0;Na=Sa;n=c[Na>>2]|0;m=c[Na+4>>2]|0;Na=Ta(l|0,oc|0,18,0)|0;Ya=D;Za=Ia(n|0,m|0,l|0,oc|0)|0;oc=Ia(Za|0,D|0,Na|0,Ya|0)|0;Ya=Sa;c[Ya>>2]=oc;c[Ya+4>>2]=D;Ya=v;oc=c[Ya>>2]|0;Na=c[Ya+4>>2]|0;Ya=Ra;Za=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Ta(oc|0,Na|0,18,0)|0;m=D;n=Ia(Za|0,l|0,oc|0,Na|0)|0;Na=Ia(n|0,D|0,Ya|0,m|0)|0;m=Ra;c[m>>2]=Na;c[m+4>>2]=D;m=t;Na=c[m>>2]|0;Ya=c[m+4>>2]|0;m=Qa;n=c[m>>2]|0;oc=c[m+4>>2]|0;m=Ta(Na|0,Ya|0,18,0)|0;l=D;Za=Ia(n|0,oc|0,Na|0,Ya|0)|0;Ya=Ia(Za|0,D|0,m|0,l|0)|0;l=Qa;c[l>>2]=Ya;c[l+4>>2]=D;l=$a;Ya=c[l>>2]|0;m=c[l+4>>2]|0;l=Pa;Za=c[l>>2]|0;Na=c[l+4>>2]|0;l=Ta(Ya|0,m|0,18,0)|0;oc=D;n=Ia(Za|0,Na|0,Ya|0,m|0)|0;m=Ia(n|0,D|0,l|0,oc|0)|0;oc=Pa;c[oc>>2]=m;c[oc+4>>2]=D;oc=Oa;m=c[oc>>2]|0;l=c[oc+4>>2]|0;oc=s;n=c[oc>>2]|0;Ya=c[oc+4>>2]|0;oc=Ta(m|0,l|0,18,0)|0;Na=D;Za=Ia(n|0,Ya|0,m|0,l|0)|0;l=Ia(Za|0,D|0,oc|0,Na|0)|0;Na=s;c[Na>>2]=l;c[Na+4>>2]=D;Ca(s);C=p+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(r,p);Ea(q,r);Na=2;do{Ea(r,q);Ea(q,r);Na=Na+2|0}while((Na|0)<100);Da(s,q,p);p=lb;Na=c[p>>2]|0;l=c[p+4>>2]|0;p=Xa;oc=c[p>>2]|0;Za=c[p+4>>2]|0;p=Ta(Na|0,l|0,18,0)|0;m=D;Ya=Ia(oc|0,Za|0,Na|0,l|0)|0;l=Ia(Ya|0,D|0,p|0,m|0)|0;m=Xa;c[m>>2]=l;c[m+4>>2]=D;m=ab;l=c[m>>2]|0;p=c[m+4>>2]|0;m=Wa;Ya=c[m>>2]|0;Na=c[m+4>>2]|0;m=Ta(l|0,p|0,18,0)|0;Za=D;oc=Ia(Ya|0,Na|0,l|0,p|0)|0;p=Ia(oc|0,D|0,m|0,Za|0)|0;Za=Wa;c[Za>>2]=p;c[Za+4>>2]=D;Za=bb;p=c[Za>>2]|0;m=c[Za+4>>2]|0;Za=Va;oc=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Ta(p|0,m|0,18,0)|0;Na=D;Ya=Ia(oc|0,l|0,p|0,m|0)|0;m=Ia(Ya|0,D|0,Za|0,Na|0)|0;Na=Va;c[Na>>2]=m;c[Na+4>>2]=D;Na=cb;m=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=Ua;Ya=c[Na>>2]|0;p=c[Na+4>>2]|0;Na=Ta(m|0,Za|0,18,0)|0;l=D;oc=Ia(Ya|0,p|0,m|0,Za|0)|0;Za=Ia(oc|0,D|0,Na|0,l|0)|0;l=Ua;c[l>>2]=Za;c[l+4>>2]=D;l=jb;Za=c[l>>2]|0;Na=c[l+4>>2]|0;l=Sa;oc=c[l>>2]|0;m=c[l+4>>2]|0;l=Ta(Za|0,Na|0,18,0)|0;p=D;Ya=Ia(oc|0,m|0,Za|0,Na|0)|0;Na=Ia(Ya|0,D|0,l|0,p|0)|0;p=Sa;c[p>>2]=Na;c[p+4>>2]=D;p=v;Na=c[p>>2]|0;l=c[p+4>>2]|0;p=Ra;Ya=c[p>>2]|0;Za=c[p+4>>2]|0;p=Ta(Na|0,l|0,18,0)|0;m=D;oc=Ia(Ya|0,Za|0,Na|0,l|0)|0;l=Ia(oc|0,D|0,p|0,m|0)|0;m=Ra;c[m>>2]=l;c[m+4>>2]=D;m=t;l=c[m>>2]|0;p=c[m+4>>2]|0;m=Qa;oc=c[m>>2]|0;Na=c[m+4>>2]|0;m=Ta(l|0,p|0,18,0)|0;Za=D;Ya=Ia(oc|0,Na|0,l|0,p|0)|0;p=Ia(Ya|0,D|0,m|0,Za|0)|0;Za=Qa;c[Za>>2]=p;c[Za+4>>2]=D;Za=$a;p=c[Za>>2]|0;m=c[Za+4>>2]|0;Za=Pa;Ya=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Ta(p|0,m|0,18,0)|0;Na=D;oc=Ia(Ya|0,l|0,p|0,m|0)|0;m=Ia(oc|0,D|0,Za|0,Na|0)|0;Na=Pa;c[Na>>2]=m;c[Na+4>>2]=D;Na=Oa;m=c[Na>>2]|0;Za=c[Na+4>>2]|0;Na=s;oc=c[Na>>2]|0;p=c[Na+4>>2]|0;Na=Ta(m|0,Za|0,18,0)|0;l=D;Ya=Ia(oc|0,p|0,m|0,Za|0)|0;Za=Ia(Ya|0,D|0,Na|0,l|0)|0;l=s;c[l>>2]=Za;c[l+4>>2]=D;Ca(s);C=r+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(q,r);Ea(r,q);l=2;do{Ea(q,r);Ea(r,q);l=l+2|0}while((l|0)<50);Da(s,r,o);o=lb;l=c[o>>2]|0;Za=c[o+4>>2]|0;o=Xa;Na=c[o>>2]|0;Ya=c[o+4>>2]|0;o=Ta(l|0,Za|0,18,0)|0;m=D;p=Ia(Na|0,Ya|0,l|0,Za|0)|0;Za=Ia(p|0,D|0,o|0,m|0)|0;m=Xa;c[m>>2]=Za;c[m+4>>2]=D;m=ab;Za=c[m>>2]|0;o=c[m+4>>2]|0;m=Wa;p=c[m>>2]|0;l=c[m+4>>2]|0;m=Ta(Za|0,o|0,18,0)|0;Ya=D;Na=Ia(p|0,l|0,Za|0,o|0)|0;o=Ia(Na|0,D|0,m|0,Ya|0)|0;Ya=Wa;c[Ya>>2]=o;c[Ya+4>>2]=D;Ya=bb;o=c[Ya>>2]|0;m=c[Ya+4>>2]|0;Ya=Va;Na=c[Ya>>2]|0;Za=c[Ya+4>>2]|0;Ya=Ta(o|0,m|0,18,0)|0;l=D;p=Ia(Na|0,Za|0,o|0,m|0)|0;m=Ia(p|0,D|0,Ya|0,l|0)|0;l=Va;c[l>>2]=m;c[l+4>>2]=D;l=cb;m=c[l>>2]|0;Ya=c[l+4>>2]|0;l=Ua;p=c[l>>2]|0;o=c[l+4>>2]|0;l=Ta(m|0,Ya|0,18,0)|0;Za=D;Na=Ia(p|0,o|0,m|0,Ya|0)|0;Ya=Ia(Na|0,D|0,l|0,Za|0)|0;Za=Ua;c[Za>>2]=Ya;c[Za+4>>2]=D;Za=jb;Ya=c[Za>>2]|0;l=c[Za+4>>2]|0;Za=Sa;Na=c[Za>>2]|0;m=c[Za+4>>2]|0;Za=Ta(Ya|0,l|0,18,0)|0;o=D;p=Ia(Na|0,m|0,Ya|0,l|0)|0;l=Ia(p|0,D|0,Za|0,o|0)|0;o=Sa;c[o>>2]=l;c[o+4>>2]=D;o=v;l=c[o>>2]|0;Za=c[o+4>>2]|0;o=Ra;p=c[o>>2]|0;Ya=c[o+4>>2]|0;o=Ta(l|0,Za|0,18,0)|0;m=D;Na=Ia(p|0,Ya|0,l|0,Za|0)|0;Za=Ia(Na|0,D|0,o|0,m|0)|0;m=Ra;c[m>>2]=Za;c[m+4>>2]=D;m=t;Za=c[m>>2]|0;o=c[m+4>>2]|0;m=Qa;Na=c[m>>2]|0;l=c[m+4>>2]|0;m=Ta(Za|0,o|0,18,0)|0;Ya=D;p=Ia(Na|0,l|0,Za|0,o|0)|0;o=Ia(p|0,D|0,m|0,Ya|0)|0;Ya=Qa;c[Ya>>2]=o;c[Ya+4>>2]=D;Ya=$a;o=c[Ya>>2]|0;m=c[Ya+4>>2]|0;Ya=Pa;p=c[Ya>>2]|0;Za=c[Ya+4>>2]|0;Ya=Ta(o|0,m|0,18,0)|0;l=D;Na=Ia(p|0,Za|0,o|0,m|0)|0;m=Ia(Na|0,D|0,Ya|0,l|0)|0;l=Pa;c[l>>2]=m;c[l+4>>2]=D;l=Oa;m=c[l>>2]|0;Ya=c[l+4>>2]|0;l=s;Na=c[l>>2]|0;o=c[l+4>>2]|0;l=Ta(m|0,Ya|0,18,0)|0;Za=D;p=Ia(Na|0,o|0,m|0,Ya|0)|0;Ya=Ia(p|0,D|0,l|0,Za|0)|0;Za=s;c[Za>>2]=Ya;c[Za+4>>2]=D;Ca(s);C=q+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ea(r,q);Ea(q,r);Ea(r,q);Ea(q,r);Ea(r,q);Da(s,r,k);k=lb;r=c[k>>2]|0;q=c[k+4>>2]|0;k=Xa;Za=c[k>>2]|0;Ya=c[k+4>>2]|0;k=Ta(r|0,q|0,18,0)|0;l=D;p=Ia(Za|0,Ya|0,r|0,q|0)|0;q=Ia(p|0,D|0,k|0,l|0)|0;l=Xa;c[l>>2]=q;c[l+4>>2]=D;l=ab;q=c[l>>2]|0;k=c[l+4>>2]|0;l=Wa;p=c[l>>2]|0;r=c[l+4>>2]|0;l=Ta(q|0,k|0,18,0)|0;Ya=D;Za=Ia(p|0,r|0,q|0,k|0)|0;k=Ia(Za|0,D|0,l|0,Ya|0)|0;Ya=Wa;c[Ya>>2]=k;c[Ya+4>>2]=D;Ya=bb;k=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Va;Za=c[Ya>>2]|0;q=c[Ya+4>>2]|0;Ya=Ta(k|0,l|0,18,0)|0;r=D;p=Ia(Za|0,q|0,k|0,l|0)|0;l=Ia(p|0,D|0,Ya|0,r|0)|0;r=Va;c[r>>2]=l;c[r+4>>2]=D;r=cb;l=c[r>>2]|0;Ya=c[r+4>>2]|0;r=Ua;p=c[r>>2]|0;k=c[r+4>>2]|0;r=Ta(l|0,Ya|0,18,0)|0;q=D;Za=Ia(p|0,k|0,l|0,Ya|0)|0;Ya=Ia(Za|0,D|0,r|0,q|0)|0;q=Ua;c[q>>2]=Ya;c[q+4>>2]=D;q=jb;Ya=c[q>>2]|0;r=c[q+4>>2]|0;q=Sa;Za=c[q>>2]|0;l=c[q+4>>2]|0;q=Ta(Ya|0,r|0,18,0)|0;k=D;p=Ia(Za|0,l|0,Ya|0,r|0)|0;r=Ia(p|0,D|0,q|0,k|0)|0;k=Sa;c[k>>2]=r;c[k+4>>2]=D;k=v;r=c[k>>2]|0;q=c[k+4>>2]|0;k=Ra;p=c[k>>2]|0;Ya=c[k+4>>2]|0;k=Ta(r|0,q|0,18,0)|0;l=D;Za=Ia(p|0,Ya|0,r|0,q|0)|0;q=Ia(Za|0,D|0,k|0,l|0)|0;l=Ra;c[l>>2]=q;c[l+4>>2]=D;l=t;q=c[l>>2]|0;k=c[l+4>>2]|0;l=Qa;Za=c[l>>2]|0;r=c[l+4>>2]|0;l=Ta(q|0,k|0,18,0)|0;Ya=D;p=Ia(Za|0,r|0,q|0,k|0)|0;k=Ia(p|0,D|0,l|0,Ya|0)|0;Ya=Qa;c[Ya>>2]=k;c[Ya+4>>2]=D;Ya=$a;k=c[Ya>>2]|0;l=c[Ya+4>>2]|0;Ya=Pa;p=c[Ya>>2]|0;q=c[Ya+4>>2]|0;Ya=Ta(k|0,l|0,18,0)|0;r=D;Za=Ia(p|0,q|0,k|0,l|0)|0;l=Ia(Za|0,D|0,Ya|0,r|0)|0;r=Pa;c[r>>2]=l;c[r+4>>2]=D;r=Oa;l=c[r>>2]|0;Ya=c[r+4>>2]|0;r=s;Za=c[r>>2]|0;k=c[r+4>>2]|0;r=Ta(l|0,Ya|0,18,0)|0;q=D;p=Ia(Za|0,k|0,l|0,Ya|0)|0;Ya=Ia(p|0,D|0,r|0,q|0)|0;q=s;c[q>>2]=Ya;c[q+4>>2]=D;Ca(s);C=A+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Da(s,y,A);A=lb;lb=c[A>>2]|0;y=c[A+4>>2]|0;A=Xa;q=c[A>>2]|0;Ya=c[A+4>>2]|0;A=Ta(lb|0,y|0,18,0)|0;r=D;p=Ia(q|0,Ya|0,lb|0,y|0)|0;y=Ia(p|0,D|0,A|0,r|0)|0;r=Xa;c[r>>2]=y;c[r+4>>2]=D;r=ab;ab=c[r>>2]|0;y=c[r+4>>2]|0;r=Wa;Xa=c[r>>2]|0;A=c[r+4>>2]|0;r=Ta(ab|0,y|0,18,0)|0;p=D;lb=Ia(Xa|0,A|0,ab|0,y|0)|0;y=Ia(lb|0,D|0,r|0,p|0)|0;p=Wa;c[p>>2]=y;c[p+4>>2]=D;p=bb;bb=c[p>>2]|0;y=c[p+4>>2]|0;p=Va;Wa=c[p>>2]|0;r=c[p+4>>2]|0;p=Ta(bb|0,y|0,18,0)|0;lb=D;ab=Ia(Wa|0,r|0,bb|0,y|0)|0;y=Ia(ab|0,D|0,p|0,lb|0)|0;lb=Va;c[lb>>2]=y;c[lb+4>>2]=D;lb=cb;cb=c[lb>>2]|0;y=c[lb+4>>2]|0;lb=Ua;Va=c[lb>>2]|0;p=c[lb+4>>2]|0;lb=Ta(cb|0,y|0,18,0)|0;ab=D;bb=Ia(Va|0,p|0,cb|0,y|0)|0;y=Ia(bb|0,D|0,lb|0,ab|0)|0;ab=Ua;c[ab>>2]=y;c[ab+4>>2]=D;ab=jb;jb=c[ab>>2]|0;y=c[ab+4>>2]|0;ab=Sa;Ua=c[ab>>2]|0;lb=c[ab+4>>2]|0;ab=Ta(jb|0,y|0,18,0)|0;bb=D;cb=Ia(Ua|0,lb|0,jb|0,y|0)|0;y=Ia(cb|0,D|0,ab|0,bb|0)|0;bb=Sa;c[bb>>2]=y;c[bb+4>>2]=D;bb=v;v=c[bb>>2]|0;y=c[bb+4>>2]|0;bb=Ra;Sa=c[bb>>2]|0;ab=c[bb+4>>2]|0;bb=Ta(v|0,y|0,18,0)|0;cb=D;jb=Ia(Sa|0,ab|0,v|0,y|0)|0;y=Ia(jb|0,D|0,bb|0,cb|0)|0;cb=Ra;c[cb>>2]=y;c[cb+4>>2]=D;cb=t;t=c[cb>>2]|0;y=c[cb+4>>2]|0;cb=Qa;Ra=c[cb>>2]|0;bb=c[cb+4>>2]|0;cb=Ta(t|0,y|0,18,0)|0;jb=D;v=Ia(Ra|0,bb|0,t|0,y|0)|0;y=Ia(v|0,D|0,cb|0,jb|0)|0;jb=Qa;c[jb>>2]=y;c[jb+4>>2]=D;jb=$a;$a=c[jb>>2]|0;y=c[jb+4>>2]|0;jb=Pa;Qa=c[jb>>2]|0;cb=c[jb+4>>2]|0;jb=Ta($a|0,y|0,18,0)|0;v=D;t=Ia(Qa|0,cb|0,$a|0,y|0)|0;y=Ia(t|0,D|0,jb|0,v|0)|0;v=Pa;c[v>>2]=y;c[v+4>>2]=D;v=Oa;Oa=c[v>>2]|0;y=c[v+4>>2]|0;v=s;Pa=c[v>>2]|0;jb=c[v+4>>2]|0;v=Ta(Oa|0,y|0,18,0)|0;t=D;$a=Ia(Pa|0,jb|0,Oa|0,y|0)|0;y=Ia($a|0,D|0,v|0,t|0)|0;t=s;c[t>>2]=y;c[t+4>>2]=D;Ca(s);C=z+0|0;E=s+0|0;e=C+80|0;do{c[C>>2]=c[E>>2];C=C+4|0;E=E+4|0}while((C|0)<(e|0));Ca(z);E=0;do{C=z+(E<<3)|0;e=c[C>>2]|0;s=e>>31&e;if((E&1|0)==0){t=s>>26;y=($(t,-67108864)|0)+e|0;v=C;c[v>>2]=y;c[v+4>>2]=((y|0)<0)<<31>>31;y=z+(E+1<<3)|0;v=(c[y>>2]|0)+t|0;t=y;c[t>>2]=v;c[t+4>>2]=((v|0)<0)<<31>>31}else{v=s>>25;s=($(v,-33554432)|0)+e|0;e=C;c[e>>2]=s;c[e+4>>2]=((s|0)<0)<<31>>31;s=z+(E+1<<3)|0;e=(c[s>>2]|0)+v|0;v=s;c[v>>2]=e;c[v+4>>2]=((e|0)<0)<<31>>31}E=E+1|0}while((E|0)!=9);E=z+72|0;e=c[E>>2]|0;v=(e>>31&e)>>25;s=($(v,-33554432)|0)+e|0;e=E;c[e>>2]=s;c[e+4>>2]=((s|0)<0)<<31>>31;s=(v*19|0)+(c[z>>2]|0)|0;v=z;c[v>>2]=s;c[v+4>>2]=((s|0)<0)<<31>>31;v=s;s=0;while(1){e=z+(s<<3)|0;C=v>>31&v;if((s&1|0)==0){t=C>>26;y=($(t,-67108864)|0)+v|0;$a=e;c[$a>>2]=y;c[$a+4>>2]=((y|0)<0)<<31>>31;y=z+(s+1<<3)|0;$a=(c[y>>2]|0)+t|0;t=y;c[t>>2]=$a;c[t+4>>2]=(($a|0)<0)<<31>>31;pc=$a}else{$a=C>>25;C=($($a,-33554432)|0)+v|0;t=e;c[t>>2]=C;c[t+4>>2]=((C|0)<0)<<31>>31;C=z+(s+1<<3)|0;t=(c[C>>2]|0)+$a|0;$a=C;c[$a>>2]=t;c[$a+4>>2]=((t|0)<0)<<31>>31;pc=t}s=s+1|0;if((s|0)==9){break}else{v=pc}}pc=c[E>>2]|0;v=(pc>>31&pc)>>25;s=($(v,-33554432)|0)+pc|0;pc=(v*19|0)+(c[z>>2]|0)|0;v=(pc>>31&pc)>>26;t=($(v,-67108864)|0)+pc|0;pc=((t|0)<0)<<31>>31;$a=z;c[$a>>2]=t;c[$a+4>>2]=pc;$a=z+8|0;C=v+(c[$a>>2]|0)|0;v=((C|0)<0)<<31>>31;e=La(C|0,v|0,2)|0;y=D;Oa=$a;c[Oa>>2]=e;c[Oa+4>>2]=y;Oa=z+16|0;$a=Oa;jb=c[$a>>2]|0;Pa=c[$a+4>>2]|0;$a=La(jb|0,Pa|0,3)|0;cb=D;Qa=Oa;c[Qa>>2]=$a;c[Qa+4>>2]=cb;Qa=z+24|0;Oa=Qa;bb=c[Oa>>2]|0;Ra=c[Oa+4>>2]|0;Oa=La(bb|0,Ra|0,5)|0;ab=D;Sa=Qa;c[Sa>>2]=Oa;c[Sa+4>>2]=ab;Sa=z+32|0;Qa=Sa;lb=c[Qa>>2]|0;Ua=c[Qa+4>>2]|0;Qa=La(lb|0,Ua|0,6)|0;p=D;Va=Sa;c[Va>>2]=Qa;c[Va+4>>2]=p;Va=z+48|0;Sa=Va;r=La(c[Sa>>2]|0,c[Sa+4>>2]|0,1)|0;Sa=Va;c[Sa>>2]=r;c[Sa+4>>2]=D;Sa=z+56|0;r=Sa;Wa=La(c[r>>2]|0,c[r+4>>2]|0,3)|0;r=Sa;c[r>>2]=Wa;c[r+4>>2]=D;r=z+64|0;Wa=r;A=La(c[Wa>>2]|0,c[Wa+4>>2]|0,4)|0;Wa=r;c[Wa>>2]=A;c[Wa+4>>2]=D;Wa=La(s|0,((s|0)<0)<<31>>31|0,6)|0;s=E;c[s>>2]=Wa;c[s+4>>2]=D;a[b]=t;s=Ka(t|0,pc|0,8)|0;a[b+1|0]=s;s=Ka(t|0,pc|0,16)|0;a[b+2|0]=s;s=Ka(t|0,pc|0,24)|0;D|y;a[b+3|0]=s|e;e=Ka(C|0,v|0,6)|0;a[b+4|0]=e;e=Ka(C|0,v|0,14)|0;a[b+5|0]=e;e=Ka(C|0,v|0,22)|0;D|cb;a[b+6|0]=e|$a;$a=Ka(jb|0,Pa|0,5)|0;a[b+7|0]=$a;$a=Ka(jb|0,Pa|0,13)|0;a[b+8|0]=$a;$a=Ka(jb|0,Pa|0,21)|0;D|ab;a[b+9|0]=$a|Oa;Oa=Ka(bb|0,Ra|0,3)|0;a[b+10|0]=Oa;Oa=Ka(bb|0,Ra|0,11)|0;a[b+11|0]=Oa;Oa=Ka(bb|0,Ra|0,19)|0;D|p;a[b+12|0]=Oa|Qa;Qa=Ka(lb|0,Ua|0,2)|0;a[b+13|0]=Qa;Qa=Ka(lb|0,Ua|0,10)|0;a[b+14|0]=Qa;Qa=Ka(lb|0,Ua|0,18)|0;a[b+15|0]=Qa;Qa=z+40|0;z=c[Qa>>2]|0;Ua=c[Qa+4>>2]|0;a[b+16|0]=z;Qa=Ka(z|0,Ua|0,8)|0;a[b+17|0]=Qa;Qa=Ka(z|0,Ua|0,16)|0;a[b+18|0]=Qa;Qa=Ka(z|0,Ua|0,24)|0;Ua=Va;Va=c[Ua>>2]|0;z=c[Ua+4>>2]|0;D|z;a[b+19|0]=Qa|Va;Qa=Ka(Va|0,z|0,8)|0;a[b+20|0]=Qa;Qa=Ka(Va|0,z|0,16)|0;a[b+21|0]=Qa;Qa=Ka(Va|0,z|0,24)|0;z=Sa;Sa=c[z>>2]|0;Va=c[z+4>>2]|0;D|Va;a[b+22|0]=Qa|Sa;Qa=Ka(Sa|0,Va|0,8)|0;a[b+23|0]=Qa;Qa=Ka(Sa|0,Va|0,16)|0;a[b+24|0]=Qa;Qa=Ka(Sa|0,Va|0,24)|0;Va=r;r=c[Va>>2]|0;Sa=c[Va+4>>2]|0;D|Sa;a[b+25|0]=Qa|r;Qa=Ka(r|0,Sa|0,8)|0;a[b+26|0]=Qa;Qa=Ka(r|0,Sa|0,16)|0;a[b+27|0]=Qa;Qa=Ka(r|0,Sa|0,24)|0;Sa=E;E=c[Sa>>2]|0;r=c[Sa+4>>2]|0;D|r;a[b+28|0]=Qa|E;Qa=Ka(E|0,r|0,8)|0;a[b+29|0]=Qa;Qa=Ka(E|0,r|0,16)|0;a[b+30|0]=Qa;Qa=Ka(E|0,r|0,24)|0;a[b+31|0]=Qa;i=g;return 0}function Ca(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;d=a+80|0;e=d;c[e>>2]=0;c[e+4>>2]=0;e=a;f=c[e+4>>2]|0;g=c[e>>2]|0;e=0;do{h=Ia(f>>31>>>6|0,0,g|0,f|0)|0;j=Ga(h|0,D|0,26)|0;h=D;k=La(j|0,h|0,26)|0;l=Ha(g|0,f|0,k|0,D|0)|0;k=a+(e<<3)|0;c[k>>2]=l;c[k+4>>2]=D;k=a+((e|1)<<3)|0;l=k;m=Ia(j|0,h|0,c[l>>2]|0,c[l+4>>2]|0)|0;l=D;h=Ia(l>>31>>>7|0,0,m|0,l|0)|0;j=Ga(h|0,D|0,25)|0;h=D;n=La(j|0,h|0,25)|0;o=Ha(m|0,l|0,n|0,D|0)|0;n=k;c[n>>2]=o;c[n+4>>2]=D;e=e+2|0;n=a+(e<<3)|0;o=n;g=Ia(j|0,h|0,c[o>>2]|0,c[o+4>>2]|0)|0;f=D;o=n;c[o>>2]=g;c[o+4>>2]=f}while(e>>>0<10);e=d;f=c[e>>2]|0;g=c[e+4>>2]|0;e=La(f|0,g|0,4)|0;o=a;n=Ia(c[o>>2]|0,c[o+4>>2]|0,e|0,D|0)|0;e=D;o=La(f|0,g|0,1)|0;h=Ia(o|0,D|0,n|0,e|0)|0;e=Ia(h|0,D|0,f|0,g|0)|0;g=D;f=d;c[f>>2]=0;c[f+4>>2]=0;f=Ia(g>>31>>>6|0,0,e|0,g|0)|0;d=Ga(f|0,D|0,26)|0;f=D;h=La(d|0,f|0,26)|0;n=Ha(e|0,g|0,h|0,D|0)|0;h=a;c[h>>2]=n;c[h+4>>2]=D;h=a+8|0;n=h;g=Ia(d|0,f|0,c[n>>2]|0,c[n+4>>2]|0)|0;n=(g>>31>>>7)+g>>25;f=n<<25;d=Ha(g|0,D|0,f|0,((f|0)<0)<<31>>31|0)|0;f=h;c[f>>2]=d;c[f+4>>2]=D;f=a+16|0;a=f;d=Ia(n|0,((n|0)<0)<<31>>31|0,c[a>>2]|0,c[a+4>>2]|0)|0;a=f;c[a>>2]=d;c[a+4>>2]=D;i=b;return}function Da(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=i;f=Ga(0,c[b>>2]|0,32)|0;g=D;h=Ga(0,c[d>>2]|0,32)|0;j=Ta(h|0,D|0,f|0,g|0)|0;g=a;c[g>>2]=j;c[g+4>>2]=D;g=Ga(0,c[b>>2]|0,32)|0;j=D;f=d+8|0;h=Ga(0,c[f>>2]|0,32)|0;k=Ta(h|0,D|0,g|0,j|0)|0;j=D;g=b+8|0;h=Ga(0,c[g>>2]|0,32)|0;l=D;m=Ga(0,c[d>>2]|0,32)|0;n=Ta(m|0,D|0,h|0,l|0)|0;l=Ia(n|0,D|0,k|0,j|0)|0;j=a+8|0;c[j>>2]=l;c[j+4>>2]=D;j=Ga(0,c[g>>2]|0,31)|0;l=D;k=Ga(0,c[f>>2]|0,32)|0;n=Ta(k|0,D|0,j|0,l|0)|0;l=D;j=Ga(0,c[b>>2]|0,32)|0;k=D;h=d+16|0;m=Ga(0,c[h>>2]|0,32)|0;o=Ta(m|0,D|0,j|0,k|0)|0;k=Ia(o|0,D|0,n|0,l|0)|0;l=D;n=b+16|0;o=Ga(0,c[n>>2]|0,32)|0;j=D;m=Ga(0,c[d>>2]|0,32)|0;p=Ta(m|0,D|0,o|0,j|0)|0;j=Ia(k|0,l|0,p|0,D|0)|0;p=a+16|0;c[p>>2]=j;c[p+4>>2]=D;p=Ga(0,c[g>>2]|0,32)|0;j=D;l=Ga(0,c[h>>2]|0,32)|0;k=Ta(l|0,D|0,p|0,j|0)|0;j=D;p=Ga(0,c[n>>2]|0,32)|0;l=D;o=Ga(0,c[f>>2]|0,32)|0;m=Ta(o|0,D|0,p|0,l|0)|0;l=Ia(m|0,D|0,k|0,j|0)|0;j=D;k=Ga(0,c[b>>2]|0,32)|0;m=D;p=d+24|0;o=Ga(0,c[p>>2]|0,32)|0;q=Ta(o|0,D|0,k|0,m|0)|0;m=Ia(l|0,j|0,q|0,D|0)|0;q=D;j=b+24|0;l=Ga(0,c[j>>2]|0,32)|0;k=D;o=Ga(0,c[d>>2]|0,32)|0;r=Ta(o|0,D|0,l|0,k|0)|0;k=Ia(m|0,q|0,r|0,D|0)|0;r=a+24|0;c[r>>2]=k;c[r+4>>2]=D;r=Ga(0,c[n>>2]|0,32)|0;k=D;q=Ga(0,c[h>>2]|0,32)|0;m=Ta(q|0,D|0,r|0,k|0)|0;k=D;r=Ga(0,c[g>>2]|0,32)|0;q=D;l=Ga(0,c[p>>2]|0,32)|0;o=Ta(l|0,D|0,r|0,q|0)|0;q=D;r=Ga(0,c[j>>2]|0,32)|0;l=D;s=Ga(0,c[f>>2]|0,32)|0;t=Ta(s|0,D|0,r|0,l|0)|0;l=Ia(t|0,D|0,o|0,q|0)|0;q=La(l|0,D|0,1)|0;l=Ia(q|0,D|0,m|0,k|0)|0;k=D;m=Ga(0,c[b>>2]|0,32)|0;q=D;o=d+32|0;t=Ga(0,c[o>>2]|0,32)|0;r=Ta(t|0,D|0,m|0,q|0)|0;q=Ia(l|0,k|0,r|0,D|0)|0;r=D;k=b+32|0;l=Ga(0,c[k>>2]|0,32)|0;m=D;t=Ga(0,c[d>>2]|0,32)|0;s=Ta(t|0,D|0,l|0,m|0)|0;m=Ia(q|0,r|0,s|0,D|0)|0;s=a+32|0;c[s>>2]=m;c[s+4>>2]=D;s=Ga(0,c[n>>2]|0,32)|0;m=D;r=Ga(0,c[p>>2]|0,32)|0;q=Ta(r|0,D|0,s|0,m|0)|0;m=D;s=Ga(0,c[j>>2]|0,32)|0;r=D;l=Ga(0,c[h>>2]|0,32)|0;t=Ta(l|0,D|0,s|0,r|0)|0;r=Ia(t|0,D|0,q|0,m|0)|0;m=D;q=Ga(0,c[g>>2]|0,32)|0;t=D;s=Ga(0,c[o>>2]|0,32)|0;l=Ta(s|0,D|0,q|0,t|0)|0;t=Ia(r|0,m|0,l|0,D|0)|0;l=D;m=Ga(0,c[k>>2]|0,32)|0;r=D;q=Ga(0,c[f>>2]|0,32)|0;s=Ta(q|0,D|0,m|0,r|0)|0;r=Ia(t|0,l|0,s|0,D|0)|0;s=D;l=Ga(0,c[b>>2]|0,32)|0;t=D;m=d+40|0;q=Ga(0,c[m>>2]|0,32)|0;u=Ta(q|0,D|0,l|0,t|0)|0;t=Ia(r|0,s|0,u|0,D|0)|0;u=D;s=b+40|0;r=Ga(0,c[s>>2]|0,32)|0;l=D;q=Ga(0,c[d>>2]|0,32)|0;v=Ta(q|0,D|0,r|0,l|0)|0;l=Ia(t|0,u|0,v|0,D|0)|0;v=a+40|0;c[v>>2]=l;c[v+4>>2]=D;v=Ga(0,c[j>>2]|0,32)|0;l=D;u=Ga(0,c[p>>2]|0,32)|0;t=Ta(u|0,D|0,v|0,l|0)|0;l=D;v=Ga(0,c[g>>2]|0,32)|0;u=D;r=Ga(0,c[m>>2]|0,32)|0;q=Ta(r|0,D|0,v|0,u|0)|0;u=Ia(q|0,D|0,t|0,l|0)|0;l=D;t=Ga(0,c[s>>2]|0,32)|0;q=D;v=Ga(0,c[f>>2]|0,32)|0;r=Ta(v|0,D|0,t|0,q|0)|0;q=Ia(u|0,l|0,r|0,D|0)|0;r=La(q|0,D|0,1)|0;q=D;l=Ga(0,c[n>>2]|0,32)|0;u=D;t=Ga(0,c[o>>2]|0,32)|0;v=Ta(t|0,D|0,l|0,u|0)|0;u=Ia(r|0,q|0,v|0,D|0)|0;v=D;q=Ga(0,c[k>>2]|0,32)|0;r=D;l=Ga(0,c[h>>2]|0,32)|0;t=Ta(l|0,D|0,q|0,r|0)|0;r=Ia(u|0,v|0,t|0,D|0)|0;t=D;v=Ga(0,c[b>>2]|0,32)|0;u=D;q=d+48|0;l=Ga(0,c[q>>2]|0,32)|0;w=Ta(l|0,D|0,v|0,u|0)|0;u=Ia(r|0,t|0,w|0,D|0)|0;w=D;t=b+48|0;r=Ga(0,c[t>>2]|0,32)|0;v=D;l=Ga(0,c[d>>2]|0,32)|0;x=Ta(l|0,D|0,r|0,v|0)|0;v=Ia(u|0,w|0,x|0,D|0)|0;x=a+48|0;c[x>>2]=v;c[x+4>>2]=D;x=Ga(0,c[j>>2]|0,32)|0;v=D;w=Ga(0,c[o>>2]|0,32)|0;u=Ta(w|0,D|0,x|0,v|0)|0;v=D;x=Ga(0,c[k>>2]|0,32)|0;w=D;r=Ga(0,c[p>>2]|0,32)|0;l=Ta(r|0,D|0,x|0,w|0)|0;w=Ia(l|0,D|0,u|0,v|0)|0;v=D;u=Ga(0,c[n>>2]|0,32)|0;l=D;x=Ga(0,c[m>>2]|0,32)|0;r=Ta(x|0,D|0,u|0,l|0)|0;l=Ia(w|0,v|0,r|0,D|0)|0;r=D;v=Ga(0,c[s>>2]|0,32)|0;w=D;u=Ga(0,c[h>>2]|0,32)|0;x=Ta(u|0,D|0,v|0,w|0)|0;w=Ia(l|0,r|0,x|0,D|0)|0;x=D;r=Ga(0,c[g>>2]|0,32)|0;l=D;v=Ga(0,c[q>>2]|0,32)|0;u=Ta(v|0,D|0,r|0,l|0)|0;l=Ia(w|0,x|0,u|0,D|0)|0;u=D;x=Ga(0,c[t>>2]|0,32)|0;w=D;r=Ga(0,c[f>>2]|0,32)|0;v=Ta(r|0,D|0,x|0,w|0)|0;w=Ia(l|0,u|0,v|0,D|0)|0;v=D;u=Ga(0,c[b>>2]|0,32)|0;l=D;x=d+56|0;r=Ga(0,c[x>>2]|0,32)|0;y=Ta(r|0,D|0,u|0,l|0)|0;l=Ia(w|0,v|0,y|0,D|0)|0;y=D;v=b+56|0;w=Ga(0,c[v>>2]|0,32)|0;u=D;r=Ga(0,c[d>>2]|0,32)|0;z=Ta(r|0,D|0,w|0,u|0)|0;u=Ia(l|0,y|0,z|0,D|0)|0;z=a+56|0;c[z>>2]=u;c[z+4>>2]=D;z=Ga(0,c[k>>2]|0,32)|0;u=D;y=Ga(0,c[o>>2]|0,32)|0;l=Ta(y|0,D|0,z|0,u|0)|0;u=D;z=Ga(0,c[j>>2]|0,32)|0;y=D;w=Ga(0,c[m>>2]|0,32)|0;r=Ta(w|0,D|0,z|0,y|0)|0;y=D;z=Ga(0,c[s>>2]|0,32)|0;w=D;A=Ga(0,c[p>>2]|0,32)|0;B=Ta(A|0,D|0,z|0,w|0)|0;w=Ia(B|0,D|0,r|0,y|0)|0;y=D;r=Ga(0,c[g>>2]|0,32)|0;B=D;z=Ga(0,c[x>>2]|0,32)|0;A=Ta(z|0,D|0,r|0,B|0)|0;B=Ia(w|0,y|0,A|0,D|0)|0;A=D;y=Ga(0,c[v>>2]|0,32)|0;w=D;r=Ga(0,c[f>>2]|0,32)|0;z=Ta(r|0,D|0,y|0,w|0)|0;w=Ia(B|0,A|0,z|0,D|0)|0;z=La(w|0,D|0,1)|0;w=Ia(z|0,D|0,l|0,u|0)|0;u=D;l=Ga(0,c[n>>2]|0,32)|0;z=D;A=Ga(0,c[q>>2]|0,32)|0;B=Ta(A|0,D|0,l|0,z|0)|0;z=Ia(w|0,u|0,B|0,D|0)|0;B=D;u=Ga(0,c[t>>2]|0,32)|0;w=D;l=Ga(0,c[h>>2]|0,32)|0;A=Ta(l|0,D|0,u|0,w|0)|0;w=Ia(z|0,B|0,A|0,D|0)|0;A=D;B=Ga(0,c[b>>2]|0,32)|0;z=D;u=d+64|0;l=Ga(0,c[u>>2]|0,32)|0;y=Ta(l|0,D|0,B|0,z|0)|0;z=Ia(w|0,A|0,y|0,D|0)|0;y=D;A=b+64|0;w=Ga(0,c[A>>2]|0,32)|0;B=D;l=Ga(0,c[d>>2]|0,32)|0;r=Ta(l|0,D|0,w|0,B|0)|0;B=Ia(z|0,y|0,r|0,D|0)|0;r=a+64|0;c[r>>2]=B;c[r+4>>2]=D;r=Ga(0,c[k>>2]|0,32)|0;B=D;y=Ga(0,c[m>>2]|0,32)|0;z=Ta(y|0,D|0,r|0,B|0)|0;B=D;r=Ga(0,c[s>>2]|0,32)|0;y=D;w=Ga(0,c[o>>2]|0,32)|0;l=Ta(w|0,D|0,r|0,y|0)|0;y=Ia(l|0,D|0,z|0,B|0)|0;B=D;z=Ga(0,c[j>>2]|0,32)|0;l=D;r=Ga(0,c[q>>2]|0,32)|0;w=Ta(r|0,D|0,z|0,l|0)|0;l=Ia(y|0,B|0,w|0,D|0)|0;w=D;B=Ga(0,c[t>>2]|0,32)|0;y=D;z=Ga(0,c[p>>2]|0,32)|0;r=Ta(z|0,D|0,B|0,y|0)|0;y=Ia(l|0,w|0,r|0,D|0)|0;r=D;w=Ga(0,c[n>>2]|0,32)|0;l=D;B=Ga(0,c[x>>2]|0,32)|0;z=Ta(B|0,D|0,w|0,l|0)|0;l=Ia(y|0,r|0,z|0,D|0)|0;z=D;r=Ga(0,c[v>>2]|0,32)|0;y=D;w=Ga(0,c[h>>2]|0,32)|0;B=Ta(w|0,D|0,r|0,y|0)|0;y=Ia(l|0,z|0,B|0,D|0)|0;B=D;z=Ga(0,c[g>>2]|0,32)|0;l=D;r=Ga(0,c[u>>2]|0,32)|0;w=Ta(r|0,D|0,z|0,l|0)|0;l=Ia(y|0,B|0,w|0,D|0)|0;w=D;B=Ga(0,c[A>>2]|0,32)|0;y=D;z=Ga(0,c[f>>2]|0,32)|0;r=Ta(z|0,D|0,B|0,y|0)|0;y=Ia(l|0,w|0,r|0,D|0)|0;r=D;w=Ga(0,c[b>>2]|0,32)|0;l=D;B=d+72|0;z=Ga(0,c[B>>2]|0,32)|0;C=Ta(z|0,D|0,w|0,l|0)|0;l=Ia(y|0,r|0,C|0,D|0)|0;C=D;r=b+72|0;b=Ga(0,c[r>>2]|0,32)|0;y=D;w=Ga(0,c[d>>2]|0,32)|0;d=Ta(w|0,D|0,b|0,y|0)|0;y=Ia(l|0,C|0,d|0,D|0)|0;d=a+72|0;c[d>>2]=y;c[d+4>>2]=D;d=Ga(0,c[s>>2]|0,32)|0;y=D;C=Ga(0,c[m>>2]|0,32)|0;l=Ta(C|0,D|0,d|0,y|0)|0;y=D;d=Ga(0,c[j>>2]|0,32)|0;C=D;b=Ga(0,c[x>>2]|0,32)|0;w=Ta(b|0,D|0,d|0,C|0)|0;C=Ia(w|0,D|0,l|0,y|0)|0;y=D;l=Ga(0,c[v>>2]|0,32)|0;w=D;d=Ga(0,c[p>>2]|0,32)|0;b=Ta(d|0,D|0,l|0,w|0)|0;w=Ia(C|0,y|0,b|0,D|0)|0;b=D;y=Ga(0,c[g>>2]|0,32)|0;g=D;C=Ga(0,c[B>>2]|0,32)|0;l=Ta(C|0,D|0,y|0,g|0)|0;g=Ia(w|0,b|0,l|0,D|0)|0;l=D;b=Ga(0,c[r>>2]|0,32)|0;w=D;y=Ga(0,c[f>>2]|0,32)|0;f=Ta(y|0,D|0,b|0,w|0)|0;w=Ia(g|0,l|0,f|0,D|0)|0;f=La(w|0,D|0,1)|0;w=D;l=Ga(0,c[k>>2]|0,32)|0;g=D;b=Ga(0,c[q>>2]|0,32)|0;y=Ta(b|0,D|0,l|0,g|0)|0;g=Ia(f|0,w|0,y|0,D|0)|0;y=D;w=Ga(0,c[t>>2]|0,32)|0;f=D;l=Ga(0,c[o>>2]|0,32)|0;b=Ta(l|0,D|0,w|0,f|0)|0;f=Ia(g|0,y|0,b|0,D|0)|0;b=D;y=Ga(0,c[n>>2]|0,32)|0;g=D;w=Ga(0,c[u>>2]|0,32)|0;l=Ta(w|0,D|0,y|0,g|0)|0;g=Ia(f|0,b|0,l|0,D|0)|0;l=D;b=Ga(0,c[A>>2]|0,32)|0;f=D;y=Ga(0,c[h>>2]|0,32)|0;w=Ta(y|0,D|0,b|0,f|0)|0;f=Ia(g|0,l|0,w|0,D|0)|0;w=a+80|0;c[w>>2]=f;c[w+4>>2]=D;w=Ga(0,c[s>>2]|0,32)|0;f=D;l=Ga(0,c[q>>2]|0,32)|0;g=Ta(l|0,D|0,w|0,f|0)|0;f=D;w=Ga(0,c[t>>2]|0,32)|0;l=D;b=Ga(0,c[m>>2]|0,32)|0;y=Ta(b|0,D|0,w|0,l|0)|0;l=Ia(y|0,D|0,g|0,f|0)|0;f=D;g=Ga(0,c[k>>2]|0,32)|0;y=D;w=Ga(0,c[x>>2]|0,32)|0;b=Ta(w|0,D|0,g|0,y|0)|0;y=Ia(l|0,f|0,b|0,D|0)|0;b=D;f=Ga(0,c[v>>2]|0,32)|0;l=D;g=Ga(0,c[o>>2]|0,32)|0;w=Ta(g|0,D|0,f|0,l|0)|0;l=Ia(y|0,b|0,w|0,D|0)|0;w=D;b=Ga(0,c[j>>2]|0,32)|0;y=D;f=Ga(0,c[u>>2]|0,32)|0;g=Ta(f|0,D|0,b|0,y|0)|0;y=Ia(l|0,w|0,g|0,D|0)|0;g=D;w=Ga(0,c[A>>2]|0,32)|0;l=D;b=Ga(0,c[p>>2]|0,32)|0;f=Ta(b|0,D|0,w|0,l|0)|0;l=Ia(y|0,g|0,f|0,D|0)|0;f=D;g=Ga(0,c[n>>2]|0,32)|0;n=D;y=Ga(0,c[B>>2]|0,32)|0;w=Ta(y|0,D|0,g|0,n|0)|0;n=Ia(l|0,f|0,w|0,D|0)|0;w=D;f=Ga(0,c[r>>2]|0,32)|0;l=D;g=Ga(0,c[h>>2]|0,32)|0;h=Ta(g|0,D|0,f|0,l|0)|0;l=Ia(n|0,w|0,h|0,D|0)|0;h=a+88|0;c[h>>2]=l;c[h+4>>2]=D;h=Ga(0,c[t>>2]|0,32)|0;l=D;w=Ga(0,c[q>>2]|0,32)|0;n=Ta(w|0,D|0,h|0,l|0)|0;l=D;h=Ga(0,c[s>>2]|0,32)|0;w=D;f=Ga(0,c[x>>2]|0,32)|0;g=Ta(f|0,D|0,h|0,w|0)|0;w=D;h=Ga(0,c[v>>2]|0,32)|0;f=D;y=Ga(0,c[m>>2]|0,32)|0;b=Ta(y|0,D|0,h|0,f|0)|0;f=Ia(b|0,D|0,g|0,w|0)|0;w=D;g=Ga(0,c[j>>2]|0,32)|0;j=D;b=Ga(0,c[B>>2]|0,32)|0;h=Ta(b|0,D|0,g|0,j|0)|0;j=Ia(f|0,w|0,h|0,D|0)|0;h=D;w=Ga(0,c[r>>2]|0,32)|0;f=D;g=Ga(0,c[p>>2]|0,32)|0;p=Ta(g|0,D|0,w|0,f|0)|0;f=Ia(j|0,h|0,p|0,D|0)|0;p=La(f|0,D|0,1)|0;f=Ia(p|0,D|0,n|0,l|0)|0;l=D;n=Ga(0,c[k>>2]|0,32)|0;p=D;h=Ga(0,c[u>>2]|0,32)|0;j=Ta(h|0,D|0,n|0,p|0)|0;p=Ia(f|0,l|0,j|0,D|0)|0;j=D;l=Ga(0,c[A>>2]|0,32)|0;f=D;n=Ga(0,c[o>>2]|0,32)|0;h=Ta(n|0,D|0,l|0,f|0)|0;f=Ia(p|0,j|0,h|0,D|0)|0;h=a+96|0;c[h>>2]=f;c[h+4>>2]=D;h=Ga(0,c[t>>2]|0,32)|0;f=D;j=Ga(0,c[x>>2]|0,32)|0;p=Ta(j|0,D|0,h|0,f|0)|0;f=D;h=Ga(0,c[v>>2]|0,32)|0;j=D;l=Ga(0,c[q>>2]|0,32)|0;n=Ta(l|0,D|0,h|0,j|0)|0;j=Ia(n|0,D|0,p|0,f|0)|0;f=D;p=Ga(0,c[s>>2]|0,32)|0;n=D;h=Ga(0,c[u>>2]|0,32)|0;l=Ta(h|0,D|0,p|0,n|0)|0;n=Ia(j|0,f|0,l|0,D|0)|0;l=D;f=Ga(0,c[A>>2]|0,32)|0;j=D;p=Ga(0,c[m>>2]|0,32)|0;h=Ta(p|0,D|0,f|0,j|0)|0;j=Ia(n|0,l|0,h|0,D|0)|0;h=D;l=Ga(0,c[k>>2]|0,32)|0;k=D;n=Ga(0,c[B>>2]|0,32)|0;f=Ta(n|0,D|0,l|0,k|0)|0;k=Ia(j|0,h|0,f|0,D|0)|0;f=D;h=Ga(0,c[r>>2]|0,32)|0;j=D;l=Ga(0,c[o>>2]|0,32)|0;o=Ta(l|0,D|0,h|0,j|0)|0;j=Ia(k|0,f|0,o|0,D|0)|0;o=a+104|0;c[o>>2]=j;c[o+4>>2]=D;o=Ga(0,c[v>>2]|0,32)|0;j=D;f=Ga(0,c[x>>2]|0,32)|0;k=Ta(f|0,D|0,o|0,j|0)|0;j=D;o=Ga(0,c[s>>2]|0,32)|0;s=D;f=Ga(0,c[B>>2]|0,32)|0;h=Ta(f|0,D|0,o|0,s|0)|0;s=Ia(h|0,D|0,k|0,j|0)|0;j=D;k=Ga(0,c[r>>2]|0,32)|0;h=D;o=Ga(0,c[m>>2]|0,32)|0;m=Ta(o|0,D|0,k|0,h|0)|0;h=Ia(s|0,j|0,m|0,D|0)|0;m=La(h|0,D|0,1)|0;h=D;j=Ga(0,c[t>>2]|0,32)|0;s=D;k=Ga(0,c[u>>2]|0,32)|0;o=Ta(k|0,D|0,j|0,s|0)|0;s=Ia(m|0,h|0,o|0,D|0)|0;o=D;h=Ga(0,c[A>>2]|0,32)|0;m=D;j=Ga(0,c[q>>2]|0,32)|0;k=Ta(j|0,D|0,h|0,m|0)|0;m=Ia(s|0,o|0,k|0,D|0)|0;k=a+112|0;c[k>>2]=m;c[k+4>>2]=D;k=Ga(0,c[v>>2]|0,32)|0;m=D;o=Ga(0,c[u>>2]|0,32)|0;s=Ta(o|0,D|0,k|0,m|0)|0;m=D;k=Ga(0,c[A>>2]|0,32)|0;o=D;h=Ga(0,c[x>>2]|0,32)|0;j=Ta(h|0,D|0,k|0,o|0)|0;o=Ia(j|0,D|0,s|0,m|0)|0;m=D;s=Ga(0,c[t>>2]|0,32)|0;t=D;j=Ga(0,c[B>>2]|0,32)|0;k=Ta(j|0,D|0,s|0,t|0)|0;t=Ia(o|0,m|0,k|0,D|0)|0;k=D;m=Ga(0,c[r>>2]|0,32)|0;o=D;s=Ga(0,c[q>>2]|0,32)|0;q=Ta(s|0,D|0,m|0,o|0)|0;o=Ia(t|0,k|0,q|0,D|0)|0;q=a+120|0;c[q>>2]=o;c[q+4>>2]=D;q=Ga(0,c[A>>2]|0,32)|0;o=D;k=Ga(0,c[u>>2]|0,32)|0;t=Ta(k|0,D|0,q|0,o|0)|0;o=D;q=Ga(0,c[v>>2]|0,32)|0;v=D;k=Ga(0,c[B>>2]|0,32)|0;m=Ta(k|0,D|0,q|0,v|0)|0;v=D;q=Ga(0,c[r>>2]|0,32)|0;k=D;s=Ga(0,c[x>>2]|0,32)|0;x=Ta(s|0,D|0,q|0,k|0)|0;k=Ia(x|0,D|0,m|0,v|0)|0;v=La(k|0,D|0,1)|0;k=Ia(v|0,D|0,t|0,o|0)|0;o=a+128|0;c[o>>2]=k;c[o+4>>2]=D;o=Ga(0,c[A>>2]|0,32)|0;A=D;k=Ga(0,c[B>>2]|0,32)|0;t=Ta(k|0,D|0,o|0,A|0)|0;A=D;o=Ga(0,c[r>>2]|0,32)|0;k=D;v=Ga(0,c[u>>2]|0,32)|0;u=Ta(v|0,D|0,o|0,k|0)|0;k=Ia(u|0,D|0,t|0,A|0)|0;A=a+136|0;c[A>>2]=k;c[A+4>>2]=D;A=Ga(0,c[r>>2]|0,31)|0;r=D;k=Ga(0,c[B>>2]|0,32)|0;B=Ta(k|0,D|0,A|0,r|0)|0;r=a+144|0;c[r>>2]=B;c[r+4>>2]=D;i=e;return}function Ea(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+160|0;e=d;f=c[b>>2]|0;g=Ga(0,f|0,32)|0;h=D;j=Ta(g|0,h|0,g|0,h|0)|0;k=e;c[k>>2]=j;c[k+4>>2]=D;k=Ga(0,f|0,31)|0;f=D;j=b+8|0;l=c[j>>2]|0;m=Ga(0,l|0,32)|0;n=D;o=Ta(m|0,n|0,k|0,f|0)|0;p=e+8|0;q=p;c[q>>2]=o;c[q+4>>2]=D;q=Ta(m|0,n|0,m|0,n|0)|0;o=D;r=b+16|0;s=Ga(0,c[r>>2]|0,32)|0;t=D;u=Ta(s|0,t|0,g|0,h|0)|0;v=Ia(u|0,D|0,q|0,o|0)|0;o=La(v|0,D|0,1)|0;v=e+16|0;q=v;c[q>>2]=o;c[q+4>>2]=D;q=Ta(s|0,t|0,m|0,n|0)|0;o=D;u=b+24|0;w=Ga(0,c[u>>2]|0,32)|0;x=D;y=Ta(w|0,x|0,g|0,h|0)|0;z=Ia(y|0,D|0,q|0,o|0)|0;o=La(z|0,D|0,1)|0;z=e+24|0;q=z;c[q>>2]=o;c[q+4>>2]=D;q=Ta(s|0,t|0,s|0,t|0)|0;o=D;y=Ga(0,l|0,30)|0;A=Ta(w|0,x|0,y|0,D|0)|0;y=Ia(A|0,D|0,q|0,o|0)|0;o=D;q=b+32|0;A=Ga(0,c[q>>2]|0,32)|0;B=D;C=Ta(A|0,B|0,k|0,f|0)|0;f=Ia(y|0,o|0,C|0,D|0)|0;C=e+32|0;o=C;c[o>>2]=f;c[o+4>>2]=D;o=Ta(w|0,x|0,s|0,t|0)|0;f=D;y=Ta(A|0,B|0,m|0,n|0)|0;k=Ia(y|0,D|0,o|0,f|0)|0;f=D;o=b+40|0;y=Ga(0,c[o>>2]|0,32)|0;E=D;F=Ta(y|0,E|0,g|0,h|0)|0;G=Ia(k|0,f|0,F|0,D|0)|0;F=La(G|0,D|0,1)|0;G=e+40|0;f=G;c[f>>2]=F;c[f+4>>2]=D;f=Ta(w|0,x|0,w|0,x|0)|0;F=D;k=Ta(A|0,B|0,s|0,t|0)|0;H=Ia(k|0,D|0,f|0,F|0)|0;F=D;f=b+48|0;k=Ga(0,c[f>>2]|0,32)|0;I=D;J=Ta(k|0,I|0,g|0,h|0)|0;K=Ia(H|0,F|0,J|0,D|0)|0;J=D;F=Ga(0,l|0,31)|0;l=Ta(y|0,E|0,F|0,D|0)|0;F=Ia(K|0,J|0,l|0,D|0)|0;l=La(F|0,D|0,1)|0;F=e+48|0;J=F;c[J>>2]=l;c[J+4>>2]=D;J=Ta(A|0,B|0,w|0,x|0)|0;l=D;K=Ta(y|0,E|0,s|0,t|0)|0;H=Ia(K|0,D|0,J|0,l|0)|0;l=D;J=Ta(k|0,I|0,m|0,n|0)|0;K=Ia(H|0,l|0,J|0,D|0)|0;J=D;l=b+56|0;H=Ga(0,c[l>>2]|0,32)|0;L=D;M=Ta(H|0,L|0,g|0,h|0)|0;N=Ia(K|0,J|0,M|0,D|0)|0;M=La(N|0,D|0,1)|0;N=e+56|0;J=N;c[J>>2]=M;c[J+4>>2]=D;J=Ta(A|0,B|0,A|0,B|0)|0;M=D;K=Ta(k|0,I|0,s|0,t|0)|0;O=D;P=b+64|0;Q=Ga(0,c[P>>2]|0,32)|0;R=D;S=Ta(Q|0,R|0,g|0,h|0)|0;h=Ia(S|0,D|0,K|0,O|0)|0;O=D;K=Ta(H|0,L|0,m|0,n|0)|0;n=D;m=Ta(y|0,E|0,w|0,x|0)|0;S=Ia(m|0,D|0,K|0,n|0)|0;n=La(S|0,D|0,1)|0;S=Ia(h|0,O|0,n|0,D|0)|0;n=La(S|0,D|0,1)|0;S=Ia(n|0,D|0,J|0,M|0)|0;M=e+64|0;J=M;c[J>>2]=S;c[J+4>>2]=D;J=Ta(y|0,E|0,A|0,B|0)|0;S=D;n=Ta(k|0,I|0,w|0,x|0)|0;x=Ia(n|0,D|0,J|0,S|0)|0;S=D;J=Ta(H|0,L|0,s|0,t|0)|0;t=Ia(x|0,S|0,J|0,D|0)|0;J=D;S=Ga(0,c[j>>2]|0,32)|0;j=D;x=Ta(Q|0,R|0,S|0,j|0)|0;s=Ia(t|0,J|0,x|0,D|0)|0;x=D;J=Ga(0,c[b>>2]|0,32)|0;t=D;n=c[b+72>>2]|0;b=Ga(0,n|0,32)|0;w=D;O=Ta(b|0,w|0,J|0,t|0)|0;t=Ia(s|0,x|0,O|0,D|0)|0;O=La(t|0,D|0,1)|0;t=e+72|0;c[t>>2]=O;c[t+4>>2]=D;t=Ta(y|0,E|0,y|0,E|0)|0;O=D;x=Ta(k|0,I|0,A|0,B|0)|0;B=Ia(x|0,D|0,t|0,O|0)|0;O=D;t=Ga(0,c[r>>2]|0,32)|0;r=D;x=Ta(Q|0,R|0,t|0,r|0)|0;A=Ia(B|0,O|0,x|0,D|0)|0;x=D;O=Ga(0,c[u>>2]|0,32)|0;u=D;B=Ta(H|0,L|0,O|0,u|0)|0;s=D;J=Ta(b|0,w|0,S|0,j|0)|0;j=Ia(J|0,D|0,B|0,s|0)|0;s=La(j|0,D|0,1)|0;j=Ia(A|0,x|0,s|0,D|0)|0;s=La(j|0,D|0,1)|0;j=e+80|0;x=j;c[x>>2]=s;c[x+4>>2]=D;x=Ta(k|0,I|0,y|0,E|0)|0;E=D;y=Ga(0,c[q>>2]|0,32)|0;q=D;s=Ta(H|0,L|0,y|0,q|0)|0;A=Ia(s|0,D|0,x|0,E|0)|0;E=D;x=Ta(Q|0,R|0,O|0,u|0)|0;s=Ia(A|0,E|0,x|0,D|0)|0;x=D;E=Ta(b|0,w|0,t|0,r|0)|0;r=Ia(s|0,x|0,E|0,D|0)|0;E=D;x=La(r|0,E|0,1)|0;s=D;t=e+88|0;c[t>>2]=x;c[t+4>>2]=s;t=Ta(k|0,I|0,k|0,I|0)|0;I=D;k=Ta(Q|0,R|0,y|0,q|0)|0;A=D;B=c[o>>2]|0;o=Ga(0,B|0,32)|0;J=D;S=Ta(H|0,L|0,o|0,J|0)|0;h=D;K=Ta(b|0,w|0,O|0,u|0)|0;u=Ia(K|0,D|0,S|0,h|0)|0;h=La(u|0,D|0,1)|0;u=Ia(h|0,D|0,k|0,A|0)|0;A=La(u|0,D|0,1)|0;u=Ia(A|0,D|0,t|0,I|0)|0;I=D;t=e+96|0;c[t>>2]=u;c[t+4>>2]=I;t=Ga(0,c[f>>2]|0,32)|0;f=D;A=Ta(H|0,L|0,t|0,f|0)|0;L=D;H=Ta(Q|0,R|0,o|0,J|0)|0;J=Ia(H|0,D|0,A|0,L|0)|0;L=D;A=Ta(b|0,w|0,y|0,q|0)|0;q=Ia(J|0,L|0,A|0,D|0)|0;A=D;L=La(q|0,A|0,1)|0;J=D;y=e+104|0;c[y>>2]=L;c[y+4>>2]=J;y=c[l>>2]|0;l=Ga(0,y|0,32)|0;H=D;o=Ta(l|0,H|0,l|0,H|0)|0;k=D;h=Ta(Q|0,R|0,t|0,f|0)|0;R=Ia(h|0,D|0,o|0,k|0)|0;k=D;o=Ga(0,B|0,31)|0;B=Ta(b|0,w|0,o|0,D|0)|0;o=Ia(R|0,k|0,B|0,D|0)|0;B=D;k=La(o|0,B|0,1)|0;R=D;h=e+112|0;c[h>>2]=k;c[h+4>>2]=R;h=c[P>>2]|0;P=Ga(0,h|0,32)|0;Q=D;S=Ta(P|0,Q|0,l|0,H|0)|0;H=D;l=Ta(b|0,w|0,t|0,f|0)|0;f=Ia(l|0,D|0,S|0,H|0)|0;H=D;S=La(f|0,H|0,1)|0;l=D;t=e+120|0;c[t>>2]=S;c[t+4>>2]=l;t=Ta(P|0,Q|0,P|0,Q|0)|0;Q=D;P=Ga(0,y|0,30)|0;y=Ta(b|0,w|0,P|0,D|0)|0;P=Ia(y|0,D|0,t|0,Q|0)|0;Q=D;t=e+128|0;c[t>>2]=P;c[t+4>>2]=Q;t=Ga(0,h|0,31)|0;h=Ta(b|0,w|0,t|0,D|0)|0;t=D;y=e+136|0;c[y>>2]=h;c[y+4>>2]=t;y=Ga(0,n|0,31)|0;n=Ta(y|0,D|0,b|0,w|0)|0;w=D;b=e+144|0;c[b>>2]=n;c[b+4>>2]=w;b=M;y=c[b>>2]|0;K=c[b+4>>2]|0;b=Ta(n|0,w|0,18,0)|0;O=D;m=Ia(n|0,w|0,y|0,K|0)|0;K=Ia(m|0,D|0,b|0,O|0)|0;O=M;c[O>>2]=K;c[O+4>>2]=D;O=N;K=c[O>>2]|0;M=c[O+4>>2]|0;O=Ta(h|0,t|0,18,0)|0;b=D;m=Ia(K|0,M|0,h|0,t|0)|0;t=Ia(m|0,D|0,O|0,b|0)|0;b=N;c[b>>2]=t;c[b+4>>2]=D;b=F;t=c[b>>2]|0;N=c[b+4>>2]|0;b=Ta(P|0,Q|0,18,0)|0;O=D;m=Ia(t|0,N|0,P|0,Q|0)|0;Q=Ia(m|0,D|0,b|0,O|0)|0;O=F;c[O>>2]=Q;c[O+4>>2]=D;O=G;Q=c[O>>2]|0;F=c[O+4>>2]|0;O=Ta(f|0,H|0,36,0)|0;H=D;f=Ia(Q|0,F|0,S|0,l|0)|0;l=Ia(f|0,D|0,O|0,H|0)|0;H=G;c[H>>2]=l;c[H+4>>2]=D;H=C;l=c[H>>2]|0;G=c[H+4>>2]|0;H=Ta(o|0,B|0,36,0)|0;B=D;o=Ia(l|0,G|0,k|0,R|0)|0;R=Ia(o|0,D|0,H|0,B|0)|0;B=C;c[B>>2]=R;c[B+4>>2]=D;B=z;R=c[B>>2]|0;C=c[B+4>>2]|0;B=Ta(q|0,A|0,36,0)|0;A=D;q=Ia(R|0,C|0,L|0,J|0)|0;J=Ia(q|0,D|0,B|0,A|0)|0;A=z;c[A>>2]=J;c[A+4>>2]=D;A=v;J=c[A>>2]|0;z=c[A+4>>2]|0;A=Ta(u|0,I|0,18,0)|0;B=D;q=Ia(J|0,z|0,u|0,I|0)|0;I=Ia(q|0,D|0,A|0,B|0)|0;B=v;c[B>>2]=I;c[B+4>>2]=D;B=p;I=c[B>>2]|0;v=c[B+4>>2]|0;B=Ta(r|0,E|0,36,0)|0;E=D;r=Ia(I|0,v|0,x|0,s|0)|0;s=Ia(r|0,D|0,B|0,E|0)|0;E=p;c[E>>2]=s;c[E+4>>2]=D;E=j;j=c[E>>2]|0;s=c[E+4>>2]|0;E=e;p=c[E>>2]|0;B=c[E+4>>2]|0;E=Ta(j|0,s|0,18,0)|0;r=D;x=Ia(p|0,B|0,j|0,s|0)|0;s=Ia(x|0,D|0,E|0,r|0)|0;r=e;c[r>>2]=s;c[r+4>>2]=D;Ca(e);r=a+0|0;a=e+0|0;e=r+80|0;do{c[r>>2]=c[a>>2];r=r+4|0;a=a+4|0}while((r|0)<(e|0));i=d;return}function Fa(){}function Ga(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=(b|0)<0?-1:0;return b>>c-32|0}function Ha(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(D=e,a-c>>>0|0)|0}function Ia(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(D=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function Ja(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function Ka(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=0;return b>>>c-32|0}function La(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}D=a<<c-32;return 0}function Ma(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Na(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return ia(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Oa(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function Pa(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function Qa(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=$(d,c)|0;f=a>>>16;a=(e>>>16)+($(d,f)|0)|0;d=b>>>16;b=$(d,c)|0;return(D=(a>>>16)+($(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function Ra(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=Ha(e^a,f^b,e,f)|0;b=D;a=g^e;e=h^f;f=Ha((Wa(i,b,Ha(g^c,h^d,g,h)|0,D,0)|0)^a,D^e,a,e)|0;return f|0}function Sa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=Ha(h^a,j^b,h,j)|0;b=D;Wa(m,b,Ha(k^d,l^e,k,l)|0,D,g)|0;l=Ha(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=D;i=f;return(D=j,l)|0}function Ta(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=Qa(e,a)|0;f=D;return(D=($(b,a)|0)+($(d,e)|0)+f|f&0,c|0|0)|0}function Ua(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=Wa(a,b,c,d,0)|0;return e|0}function Va(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;Wa(a,b,d,e,g)|0;i=f;return(D=c[g+4>>2]|0,c[g>>2]|0)|0}function Wa(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(D=n,o)|0}else{if(!m){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(D=n,o)|0}}m=(l|0)==0;do{if((j|0)!=0){if(!m){p=(Oa(l|0)|0)-(Oa(i|0)|0)|0;if(p>>>0<=31){q=p+1|0;r=31-p|0;s=p-31>>31;t=q;u=g>>>(q>>>0)&s|i<<r;v=i>>>(q>>>0)&s;w=0;x=g<<r;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}r=j-1|0;if((r&j|0)!=0){s=(Oa(j|0)|0)+33-(Oa(i|0)|0)|0;q=64-s|0;p=32-s|0;y=p>>31;z=s-32|0;A=z>>31;t=s;u=p-1>>31&i>>>(z>>>0)|(i<<p|g>>>(s>>>0))&A;v=A&i>>>(s>>>0);w=g<<q&y;x=(i<<q|g>>>(z>>>0))&y|g<<p&s-33>>31;break}if((f|0)!=0){c[f>>2]=r&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(D=n,o)|0}else{r=Pa(j|0)|0;n=i>>>(r>>>0)|0;o=i<<32-r|g>>>(r>>>0)|0;return(D=n,o)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(D=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(D=n,o)|0}r=l-1|0;if((r&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=r&i|b&0}n=0;o=i>>>((Pa(l|0)|0)>>>0);return(D=n,o)|0}r=(Oa(l|0)|0)-(Oa(i|0)|0)|0;if(r>>>0<=30){s=r+1|0;p=31-r|0;t=s;u=i<<p|g>>>(s>>>0);v=i>>>(s>>>0);w=0;x=g<<p;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}}while(0);if((t|0)==0){B=x;C=w;E=v;F=u;G=0;H=0}else{b=d|0|0;d=k|e&0;e=Ia(b,d,-1,-1)|0;k=D;h=x;x=w;w=v;v=u;u=t;t=0;while(1){I=x>>>31|h<<1;J=t|x<<1;a=v<<1|h>>>31|0;g=v>>>31|w<<1|0;Ha(e,k,a,g)|0;i=D;l=i>>31|((i|0)<0?-1:0)<<1;K=l&1;L=Ha(a,g,l&b,(((i|0)<0?-1:0)>>31|((i|0)<0?-1:0)<<1)&d)|0;M=D;i=u-1|0;if((i|0)==0){break}else{h=I;x=J;w=M;v=L;u=i;t=K}}B=I;C=J;E=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=F;c[f+4>>2]=E}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(D=n,o)|0}




// EMSCRIPTEN_END_FUNCS
return{_curve25519_donna:Ba,_i64Add:Ia,_bitshift64Ashr:Ga,_i64Subtract:Ha,_memset:Ja,_memcpy:Na,_strlen:Ma,_bitshift64Lshr:Ka,_bitshift64Shl:La,runPostSets:Fa,stackAlloc:la,stackSave:ma,stackRestore:na,setThrew:oa,setTempRet0:ra,setTempRet1:sa,setTempRet2:ta,setTempRet3:ua,setTempRet4:va,setTempRet5:wa,setTempRet6:xa,setTempRet7:ya,setTempRet8:za,setTempRet9:Aa}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "_malloc": _malloc, "_fflush": _fflush, "_free": _free, "_emscripten_memcpy_big": _emscripten_memcpy_big, "___setErrNo": ___setErrNo, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity }, buffer);
var _curve25519_donna = Module["_curve25519_donna"] = asm["_curve25519_donna"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _bitshift64Ashr = Module["_bitshift64Ashr"] = asm["_bitshift64Ashr"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






