all:
	rm -r build/
	mkdir build
	emcc c/curve25519-donna.c -O2 -o build/curve25519.js -s EXPORTED_FUNCTIONS="['_curve25519_donna']"
	uglifyjs build/curve25519.js js/wrapper.js -o build/scripts.js
	cp js/pre.js build/release.js
	cat build/scripts.js >> build/release.js