import {defineConfig} from "vitest/config";
export default defineConfig({test:{setupFiles:["tests/platform/setup.ts"],include:["tests/platform/**/*.test.ts"],fileParallelism:false,testTimeout:30000,hookTimeout:30000,maxWorkers:1}});
