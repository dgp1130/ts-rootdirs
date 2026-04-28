# TypeScript `rootDirs`

Testing out TypeScript `rootDirs` option to see if we can type check
Angular preprocessor output by overlaying the generated output
(`./src/generated`) over the raw sources (`./src`).

This appears to type check preferring `./src/bar.ts` over
`./src/generated/bar.ts`, despite `rootDirs` preferring the opposite.

* If you introduce an error into `src/bar.ts`, compilation will fail.
* If you differ types between `src/bar.ts` and `src/generated/bar.ts`,
  `dist/bar.d.ts` will use types from `src/bar.ts`.