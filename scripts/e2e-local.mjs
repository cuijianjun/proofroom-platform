// Isolated UI acceptance environment; never reads/writes the original application.
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const config=dotenv.parse(await readFile(path.join(root,'.env')));
if(!config.TEST_DATABASE_URL?.endsWith('/proofroom_test'))throw new Error('拒绝使用非隔离验收库');
const env={...process.env,...config,DATABASE_URL:config.TEST_DATABASE_URL,MIGRATION_DATABASE_URL:config.TEST_MIGRATION_DATABASE_URL,S3_BUCKET:'proofroom-test',APP_ORIGIN:'http://127.0.0.1:18186',API_PORT:'18184',NEXT_TELEMETRY_DISABLED:'1'};
for(const key of Object.keys(env))if(key.startsWith('PG')||key==='NODE_OPTIONS'||key==='FORCE_COLOR')delete env[key];
for(const [key,value]of Object.entries(env))process.env[key]=value;
const {migrate}=await import('../packages/db/migrate.ts');const {pool}=await import('../packages/db/index.ts');await migrate(config.TEST_MIGRATION_DATABASE_URL);await pool.end();
const webEnv={...env,API_ORIGIN:'http://127.0.0.1:18184',PROOFROOM_WEB_DIST:'.next-qa'};
for(const key of Object.keys(webEnv))if(/DATABASE|S3_|APP_SECRET|MINIO|PG/.test(key))delete webEnv[key];
const runtimeEnv={...env};for(const key of ['MIGRATION_DATABASE_URL','TEST_MIGRATION_DATABASE_URL','TEST_DATABASE_URL'])delete runtimeEnv[key];
const children=[spawn(process.execPath,['--import','tsx','apps/api/src/main.ts'],{cwd:root,env:runtimeEnv,stdio:'inherit'}),spawn(process.execPath,['--import','tsx','apps/worker/src/main.ts'],{cwd:root,env:runtimeEnv,stdio:'inherit'}),spawn(process.execPath,['node_modules/next/dist/bin/next','dev','apps/web','--hostname','127.0.0.1','--port','18186'],{cwd:root,env:webEnv,stdio:'inherit'})];
let stopping=false;function stop(){if(stopping)return;stopping=true;for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
for(const child of children)child.on('exit',code=>{if(!stopping){process.exitCode=code??1;stop();}});
