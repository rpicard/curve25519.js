## curve25519.js

An emscripten compiled port of curve25519-donna, with a super light
wrapper around it.

### Using

Interacting with the compiled JS from your own code can be a bit of a pain
thanks to pointers and what not. I've tried to abstract this away with a
light wrapper around the compiled code from emscripten. There are two
functions.

```js
// A key is a 32 byte Uint8Array
curve25519.getPublicFromPrivate(privateKey);
curve25519.getSharedSecret(myPrivate, theirPublic);
```

### Compiling

The implementation of curve25519 in this repo is from
agl/curve25519-donna. If you'd like to compile the library yourself, there
is a nice Make file that will run the commands. You need to have emcc (the
emscripten compiler) and uglifyjs in your path for it to do its thing.

### Testing

Testing is pretty simple right now. Open up test/test.html in a browser to
see it at work.

### License

The c/curve25519-donna.c file has its own license from Google. See the
comment in that file. That's where the meat of this comes from. The little
wrapper I wrote around it is in the public domain.

### Contributing

The wrapper is pretty simple, so hopefully it won't need many bug fixes
once it's stable. If you see something wrong or you have something to add,
feel free to open up an issue or submit a pull request. I'll take a look
and we'll decide if it should be patched in.

All contributions have to be licensed in the public domain like the rest
of the wrapper.

Changes to the C code don't belong here of course.
