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

    function injectBytes(bs) {
        var p = leftPadding || 0;
        var address = Module._malloc(bs.length + p);
        Module.HEAPU8.set(bs, address + p);
        for (var i = address; i < address + p; i++) {
            Module.HEAPU8[i] = 0;
        }
        return address;
    }

    function publicFromSecret (secret) {
        publicKey = Module._malloc(32);
        secretKey = injectBytes(hexStringToByteArray(secret));
        basepoint = injectBytes(hexStringToByteArray("0900000000000000000000000000000000000000000000000000000000000000"));

        err = Module._curve25519_donna(publicKey, secretKey, basepoint);

        return publicKey;
    }

    function getSharedSecret (mySecret, theirPublic) {
        sharedKey = Module._malloc(32);
        secretKey = injectBytes(hexStringToByteArray(mySecret));
        basepoint = injectBytes(hexStringToByteArray(theirPublic));

        err = Module._curve25519_donna(sharedKey, mySecret, theirPublic);

        return sharedKey;
    }

    exports.publicFromSecret = publicFromSecret;
    exports.getSharedSecret = getSharedSecret;

    return exports;
})();