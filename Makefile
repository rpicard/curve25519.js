all:
	mkdir tmp
	emcc c/curve25519-donna.c -O2 -o tmp/curve25519.js -s EXPORTED_FUNCTIONS="['_curve25519_donna']"
	uglifyjs tmp/curve25519.js js/wrapper.js -o tmp/scripts.js
	cp js/pre.js tmp/release.js
	cat tmp/scripts.js >> tmp/release.js
	mv tmp/release.js curve25519-1.0.min.js
	rm -r tmp/