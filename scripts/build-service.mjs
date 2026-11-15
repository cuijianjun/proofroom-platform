import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app=process.argv[2];if(!['api','worker'].includes(app))throw new Error('选择api或worker');
await build({entryPoints:[path.join(root,`apps/${app}/src/main.ts`)],outfile:path.join(root,`apps/${app}/dist/main.mjs`),bundle:true,platform:'node',target:'node22',format:'esm',packages:'external',sourcemap:true,plugins:[{name:'local-workspaces',setup(b){b.onResolve({filter:/^@proofroom\//},args=>{const [pkg,...rest]=args.path.replace('@proofroom/','').split('/');return {path:path.join(root,'packages',pkg,rest.length?rest.join('/')+'.ts':'index.ts')};});}}]});
process.stdout.write(`${app} 独立构建完成\n`);
