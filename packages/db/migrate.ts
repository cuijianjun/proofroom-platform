import pg from 'pg';
import {PgBoss} from 'pg-boss';
import {readdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pool} from './index.js';
export async function migrate(url=process.env.MIGRATION_DATABASE_URL){
 if(!url)throw new Error('需要显式配置隔离开发库 MIGRATION_DATABASE_URL');
 const client=new pg.Client({connectionString:url,connectionTimeoutMillis:4000});await client.connect();
 try{
 await client.query("select pg_advisory_lock(hashtext('proofroom-migrations'))");
 await client.query('create table if not exists schema_migrations(name text primary key,digest text not null,applied_at timestamptz not null default now())');
 const dir=new URL('./migrations/',import.meta.url);
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()){
 const text=await readFile(new URL(name,dir),'utf8');const digest=createHash('sha256').update(text).digest('hex');
 const old=(await client.query('select digest from schema_migrations where name=$1',[name])).rows[0];
 if(old){if(old.digest!==digest)throw new Error(`迁移摘要已改变：${name}`);continue;}
 await client.query('BEGIN');try{await client.query(text);await client.query('insert into schema_migrations(name,digest) values($1,$2)',[name,digest]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}
 }
 // Runtime has DML only; schema migrations use a separate role.
 await client.query('grant usage on schema public to proofroom_runtime');
 await client.query('grant select,insert,update,delete on all tables in schema public to proofroom_runtime');
 await client.query('revoke all on schema_migrations from proofroom_runtime');
 await client.query('revoke update,delete on audit_log,idempotency from proofroom_runtime');
 const boss=new PgBoss({connectionString:url,schema:'pgboss',supervise:false,schedule:false,max:2});
 boss.on('error',()=>{});await boss.start();
 try{for(const name of ['health','media','zip','reconcile','backup'])await boss.createQueue(name,{retryLimit:3,retryDelay:2,expireInSeconds:300});}finally{await boss.stop();}
 await client.query('grant usage on schema pgboss to proofroom_runtime');
 await client.query('grant select,insert,update,delete on all tables in schema pgboss to proofroom_runtime');
 await client.query('grant usage,select on all sequences in schema pgboss to proofroom_runtime');
 }finally{await client.end();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await migrate();await pool.end();process.stdout.write('数据库迁移已完成\n');}
