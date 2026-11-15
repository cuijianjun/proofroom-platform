// Project-specific local development environment. No existing service is stopped.
import {mkdir,writeFile,readFile,access,chmod,open} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const local=path.join(root,'.local');
const nodeDir='/Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin';
const cleanEnv={...process.env,PATH:`${nodeDir}:${process.env.PATH}`};
for(const name of Object.keys(cleanEnv))if(name.startsWith('PG')||name==='NODE_OPTIONS')delete cleanEnv[name];
const exists=async p=>{try{await access(p);return true;}catch{return false;}};
function run(cmd,args,env=cleanEnv){const r=spawnSync(cmd,args,{cwd:root,env,stdio:'inherit'});if(r.status!==0)throw new Error(`${cmd} 未成功 (${r.status})`);}
async function setup(){
 await mkdir(local,{recursive:true,mode:0o700});await chmod(local,0o700);
 for(const d of ['logs','pgsocket','storage'])await mkdir(path.join(local,d),{recursive:true,mode:0o700});
 if(!await exists(path.join(root,'.env'))){
 const admin=randomBytes(24).toString('hex'),runtime=randomBytes(24).toString('hex'),s3=randomBytes(24).toString('hex');
 const config=`DATABASE_URL=postgresql://proofroom_runtime:${runtime}@127.0.0.1:18432/proofroom_dev\nMIGRATION_DATABASE_URL=postgresql://proofroom_migrator:${admin}@127.0.0.1:18432/proofroom_dev\nTEST_DATABASE_URL=postgresql://proofroom_runtime:${runtime}@127.0.0.1:18432/proofroom_test\nTEST_MIGRATION_DATABASE_URL=postgresql://proofroom_migrator:${admin}@127.0.0.1:18432/proofroom_test\nAPP_SECRET=${randomBytes(32).toString('hex')}\nAPP_ORIGIN=http://127.0.0.1:18180\nAPI_PORT=18182\nS3_ENDPOINT=http://127.0.0.1:18190\nS3_ACCESS_KEY=proofroom-local\nS3_SECRET_KEY=${s3}\nS3_BUCKET=proofroom-local\n`;
 await writeFile(path.join(root,'.env'),config,{mode:0o600});await writeFile(path.join(local,'pgpassword'),admin,{mode:0o600});
 await writeFile(path.join(local,'minio.env'),`MINIO_ROOT_USER=proofroom-local\nMINIO_ROOT_PASSWORD=${s3}\n`,{mode:0o600});
 }
 dotenv.config({path:path.join(root,'.env'),quiet:true});
 const data=path.join(local,'postgres');
 if(!await exists(path.join(data,'PG_VERSION'))){run('initdb',['-D',data,'--username=proofroom_migrator','--auth=scram-sha-256',`--pwfile=${path.join(local,'pgpassword')}`]);
 await writeFile(path.join(data,'postgresql.auto.conf'),`listen_addresses = '127.0.0.1'\nport = 18432\nmax_connections = 40\nshared_buffers = '32MB'\nunix_socket_directories = '${path.join(local,'pgsocket').replaceAll("'","''")}'\n`);}
 const probe=spawnSync('pg_ctl',['-D',data,'status'],{env:cleanEnv,stdio:'ignore'});
 if(probe.status!==0)run('pg_ctl',['-D',data,'-l',path.join(local,'logs/postgres.log'),'-w','start']);
 const adminUrl=new URL(process.env.MIGRATION_DATABASE_URL);adminUrl.pathname='/postgres';const admin=new pg.Client({connectionString:adminUrl.href});await admin.connect();
 try{
 if(!(await admin.query("select 1 from pg_roles where rolname='proofroom_runtime'")).rowCount){const pass=new URL(process.env.DATABASE_URL).password;await admin.query(`create role proofroom_runtime login password '${pass.replaceAll("'","''")}' nosuperuser nocreatedb nocreaterole`);}
 for(const db of ['proofroom_dev','proofroom_test'])if(!(await admin.query('select 1 from pg_database where datname=$1',[db])).rowCount)await admin.query(`create database ${db} owner proofroom_migrator`);
 }finally{await admin.end();}
 let s3Ready=false;try{const r=await fetch('http://127.0.0.1:18190/__proofroom_local_health',{signal:AbortSignal.timeout(1500)});if(r.headers.get('x-proofroom-local-s3')!=='1')throw new Error('18190已被其他服务占用');s3Ready=r.ok;}catch(e){if(e.message.includes('其他服务'))throw e;}
 if(!s3Ready){const log=await open(path.join(local,'logs/storage.log'),'a',0o600);const child=spawn(process.execPath,['scripts/s3-local.mjs'],{cwd:root,env:cleanEnv,detached:true,stdio:['ignore',log.fd,log.fd]});child.unref();await log.close();await writeFile(path.join(local,'storage.pid'),String(child.pid),{mode:0o600});for(let n=0;n<30;n++){try{const r=await fetch('http://127.0.0.1:18190/__proofroom_local_health',{signal:AbortSignal.timeout(500)});if(r.ok&&r.headers.get('x-proofroom-local-s3')==='1'){s3Ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}if(!s3Ready)throw new Error('本地S3未启动，请检查.local/logs/storage.log');}
 process.stdout.write('隔离本地PostgreSQL 18432 与本地S3兼容替身 18190已启动；凭据仅保存在忽略的.env/.local。\n');
}
async function start(restoreDirectory){
 if(!await exists(path.join(root,'.env')))throw new Error('请先运行 npm run local:setup');
 // Only child API/Worker inherit private environment; Web receives API origin, not DB/storage secrets.
 dotenv.config({path:path.join(root,'.env'),quiet:true});
 const privateConfig=dotenv.parse(await readFile(restoreDirectory?path.resolve(restoreDirectory,'runtime.env'):path.join(root,'.env')));
 if(restoreDirectory){const db=new URL(privateConfig.DATABASE_URL);if(!['postgres:','postgresql:'].includes(db.protocol)||db.search||db.hash||!['127.0.0.1','localhost'].includes(db.hostname)||db.port!=='18432'||db.username!=='proofroom_runtime'||!/^\/proofroom_restore_[a-z0-9_]+$/.test(db.pathname)||!privateConfig.MEDIA_NAMESPACE||privateConfig.API_PORT!=='18189'||privateConfig.WEB_PORT!=='18188'||privateConfig.API_ORIGIN!=='http://127.0.0.1:18189'||privateConfig.APP_ORIGIN!=='http://127.0.0.1:18188')throw new Error('恢复副本运行配置无法核对，请使用完整新生成的runtime.env');}
 const backendEnv={...cleanEnv,...privateConfig};
 for(const key of ['MIGRATION_DATABASE_URL','TEST_MIGRATION_DATABASE_URL','TEST_DATABASE_URL'])delete backendEnv[key];
 const webEnv={...cleanEnv,API_ORIGIN:restoreDirectory?privateConfig.API_ORIGIN:'http://127.0.0.1:18182',NEXT_TELEMETRY_DISABLED:'1',...(restoreDirectory?{PROOFROOM_WEB_DIST:'.next-restore'}:{})};
 for(const name of Object.keys(webEnv))if(/DATABASE|S3_|APP_SECRET|MINIO|PG/.test(name))delete webEnv[name];
 const owned=[spawn(process.execPath,['--import','tsx','apps/api/src/main.ts'],{cwd:root,env:backendEnv,stdio:'inherit'}),spawn(process.execPath,['--import','tsx','apps/worker/src/main.ts'],{cwd:root,env:backendEnv,stdio:'inherit'}),spawn(process.execPath,['node_modules/next/dist/bin/next','dev','apps/web','--hostname','127.0.0.1','--port',restoreDirectory?'18188':'18180'],{cwd:root,env:webEnv,stdio:'inherit'})];
 let stopping=false;function stop(){if(stopping)return;stopping=true;for(const child of owned)if(child.exitCode===null)child.kill('SIGTERM');}
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
 for(const child of owned)child.on('exit',code=>{if(code&&!stopping){stop();process.exitCode=code;}});
}
try{if(process.argv[2]==='setup')await setup();else if(process.argv[2]==='start')await start();else if(process.argv[2]==='restore'&&process.argv[3])await start(process.argv[3]);else throw new Error('使用 setup、start 或 restore 副本目录');}catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}
