var curve25519 = (function() {
    var exports = {};

    // Insert some bytes into the emscripten memory and return a pointer
    function _allocate(bytes) {
        var address = Module._malloc(bytes.length);
        Module.HEAPU8.set(bytes, address);
        
        return address;
    }

    function _readBytes(address, length) {
        var bytes = new Uint8Array(length);
        bytes.set(Module.HEAPU8.subarray(address, address + length));

        return bytes;
    }

    /*
    * Expects: Uint8Array(32)
    * Returns: Uint8Array(32)
    */
    function getPublicFromPrivate (privateKey) {
        // Where to store the result
        publicKey_ptr = Module._malloc(32);

        // Get a pointer to the private key
        privateKey_ptr = _allocate(privateKey);

        // The basepoint for generating public keys is 0x09 followed by 31 null bytes
        baseArray = ["0x09"];
        for (var i = 0; i < 31; i++) {
            baseArray.push("0x00");
        }

        // Turn the baseArray into a Uint8Array so it can be allocated and used correctly
        basepoint_ptr = _allocate(new Uint8Array(baseArray));

        // The return value is just 0, the operation is done in place
        err = Module._curve25519_donna(publicKey_ptr, privateKey_ptr, basepoint_ptr);

        // Voilà
        return _readBytes(publicKey_ptr, 32);
    }

    /*
    * Expects: Uint8Array(32), Uint8Array(32)
    * Returns: Uint8Array(32)
    */
    function getSharedSecret (myPrivate, theirPublic) {
        // Where to store the result
        sharedKey_ptr = Module._malloc(32);

        // Get a pointer to our private key
        privateKey_ptr = _allocate(myPrivate);

        // Get a pointer to their public key, the basepoint when you're generating a shared secret
        basepoint_ptr = injectBytes(hexStringToByteArray(theirPublic));

        // Return value is 0 here too of course
        err = Module._curve25519_donna(sharedKey_ptr, privateKey_ptr, basepoint_ptr);

        return _readBytes(sharedKey_ptr, 32);
    }

    exports.getPublicFromPrivate = getPublicFromPrivate;
    exports.getSharedSecret = getSharedSecret;

    return exports;
})();