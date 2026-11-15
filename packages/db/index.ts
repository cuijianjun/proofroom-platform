import pg, {type PoolClient, type QueryResultRow} from 'pg';
if(!process.env.DATABASE_URL)throw new Error('需要显式配置DATABASE_URL，拒绝使用宿主默认数据库');
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:8,connectionTimeoutMillis:4000,statement_timeout:10000});
export type Connection=Pick<PoolClient,'query'>;
export async function query<T extends QueryResultRow=QueryResultRow>(text:string,values:unknown[]=[],connection:Connection=pool):Promise<T[]>{return (await connection.query<T>(text,values)).rows;}
export function sqlFor(connection:Connection){return async function<T extends QueryResultRow=QueryResultRow>(parts:TemplateStringsArray,...values:unknown[]):Promise<T[]>{const text=parts.reduce((out,part,i)=>out+(i?`$${i}`:'')+part,'');return query<T>(text,values,connection);};}
export const sql=sqlFor(pool);
export async function withTx<T>(work:(connection:Connection)=>Promise<T>,provided?:Connection):Promise<T>{
 const owned=provided?null:await pool.connect();const connection=provided??owned!;
 try{await connection.query('BEGIN');const result=await work(connection);await connection.query('COMMIT');return result;}
 catch(error){await connection.query('ROLLBACK');throw error;}finally{owned?.release();}
}
export const normalize=(value:unknown):unknown=>value instanceof Date?value.toISOString():Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)])):value;
