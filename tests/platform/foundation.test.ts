import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import pg from 'pg';
import {pool,sqlFor,query,withTx,normalize} from '../../packages/db/index.js';
import {migrate} from '../../packages/db/migrate.js';
describe('M1 ordinary PostgreSQL boundary',()=>{
 beforeAll(async()=>{if(!process.env.TEST_DATABASE_URL||!process.env.TEST_MIGRATION_DATABASE_URL)throw new Error('需要隔离测试数据库');await migrate(process.env.TEST_MIGRATION_DATABASE_URL);});
 afterAll(()=>pool.end());
 it('migration replay is idempotent and runtime cannot create schema objects',async()=>{await migrate(process.env.TEST_MIGRATION_DATABASE_URL);const r=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});await r.connect();try{await expect(r.query('create table unauthorized_table(id int)')).rejects.toMatchObject({code:'42501'});}finally{await r.end();}});
 it('binds SQL injection as a value and normalizes JSON/arrays/dates/numeric/null',async()=>{const c=new pg.Client({connectionString:process.env.TEST_DATABASE_URL});await c.connect();try{const sql=sqlFor(c);const [r]=await sql`select ${"x'); drop table users; --"}::text as value, ${JSON.stringify({test:'中文'})}::jsonb as doc, ${['a','b']}::text[] as tags, ${'2026-11-14T00:00:00Z'}::timestamptz as at, 9007199254740993::bigint as big, 123.45::numeric as price, null::text as empty`;expect(r.value).toContain('drop table');expect(normalize(r)).toMatchObject({doc:{test:'中文'},tags:['a','b'],at:'2026-11-14T00:00:00.000Z',big:'9007199254740993',price:'123.45',empty:null});}finally{await c.end();}});
 it('uses one connection and rolls back all writes on an exception',async()=>{const tag=`foundation-${Date.now()}`;await expect(withTx(async c=>{await query('insert into rate_limits(key,count,reset_at) values($1,1,now())',[tag],c);await query('update rate_limits set count=count+1 where key=$1',[tag],c);expect((await query('select count from rate_limits where key=$1',[tag],c))[0].count).toBe(2);throw new Error('rollback');})).rejects.toThrow('rollback');expect(await query('select * from rate_limits where key=$1',[tag])).toEqual([]);});
});
