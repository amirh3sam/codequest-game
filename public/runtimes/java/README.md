# Java runtime (vendored)

teavm-javac: OpenJDK javac + TeaVM compiled to WebAssembly. Apache-2.0; OpenJDK parts GPLv2 + Classpath Exception.
Source: https://github.com/konsoletyper/teavm-javac · Files downloaded 2026-10-04 from https://teavm.org/playground/ (server Last-Modified 2025-06-15).
Committed to the repo so the game works offline and builds don't depend on teavm.org.

```
a79245353ac623df4fde5740bb2bedacedc9c98544253f01aa4b63268f9cb8ba *compiler.wasm
75b2b94394f162c384d42d540836375cdbb0207e6e5605b92a18ce56eb158741 *compiler.wasm-runtime.js
4ed72de9e6ea1b58adfaa1b75c30379d7bccde71c529f795df383d62045367d9 *compile-classlib-teavm.bin
e62ab99ce291a3379abc0756a1e80f4796f00c60fee655e488b82e37b469d5b7 *runtime-classlib-teavm.bin
```

To update: re-download the 4 files from the URL above, update the hashes, run `npm run test:e2e`.
