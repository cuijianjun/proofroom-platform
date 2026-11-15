import {defineConfig,globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
export default defineConfig([
 ...nextVitals,...nextTypescript,
 globalIgnores(['upstream/**','**/node_modules/**','**/dist/**','**/.next*/**','.local/**','**/*.tsbuildinfo','**/next-env.d.ts']),
 {settings:{next:{rootDir:'apps/web'}},rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-unused-vars':['warn',{ignoreRestSiblings:true}],
 // This app uses manual Hooks; retain compiler diagnostics as advisory while
 // rules-of-hooks and ordinary correctness rules still block lint.
 'react-hooks/set-state-in-effect':'warn','react-hooks/refs':'warn','react-hooks/immutability':'warn','react-hooks/preserve-manual-memoization':'warn','react-hooks/purity':'warn'}},
]);
