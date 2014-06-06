var curve25519 = (function() {
    var exports = {};

    function hexStringToByteArray(string) {

        var a = [];
        for (var i = 0; i < string.length; i += 2) {
            a.push("0x" + string.substr(i, 2));
        }

        ba = new Uint8Array(32);

        ba.set(a);

        return ba;
    }

    // Insert some bytes into the emscripten memory and return a pointer
    function _allocate(bytes) {
        var address = Module._malloc(bytes.length);
        Module.HEAPU8.set(bytes, address);
        return address;
    }

    /*
    * Expects: Uint8Array(32)
    * Returns: Uint8Array(32)
    */
    function publicFromSecret (secret) {
        // Where to store the result
        publicKey_ptr = Module._malloc(32);

        // Get a pointer to the secret key
        secretKey_ptr = _allocate(secret);

        // The basepoint for generating public keys is 0x09 followed by 31 null bytes
        baseArray = ["0x09"];
        for (var i = 0; i < 31; i++) {
            baseArray.push("0x00");
        }

        // Turn the baseArray into a Uint8Array so it can be allocated and used correctly
        basepoint_ptr = _allocate(new Uint8Array(baseArray));

        // The return value is just 0, the operation is done in place
        err = Module._curve25519_donna(publicKey_ptr, secretKey_ptr, basepoint_ptr);

        // Voilà
        return publicKey_ptr;
    }

    /*
    * Expects: Uint8Array(32), Uint8Array(32)
    * Returns: Uint8Array(32)
    */
    function getSharedSecret (mySecret, theirPublic) {
        // Where to store the result
        sharedKey_ptr = Module._malloc(32);

        // Get a pointer to our secret key
        secretKey_ptr = _allocate(mySecret);

        // Get a pointer to their public key, the basepoint when you're generating a shared secret
        basepoint_ptr = injectBytes(hexStringToByteArray(theirPublic));

        // Return value is 0 here too of course
        err = Module._curve25519_donna(sharedKey_ptr, secretKey_ptr, basepoint_ptr);

        return sharedKey_ptr;
    }

    exports.publicFromSecret = publicFromSecret;
    exports.getSharedSecret = getSharedSecret;

    return exports;
})();