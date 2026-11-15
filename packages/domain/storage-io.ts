import {pool,query,type Connection} from '@proofroom/db';
import {removeObject,abortMultipartForKey} from '@proofroom/storage';
// One process-independent resource lock spans file I/O without holding a SQL
// transaction open. The same connection is reused for short business transactions.
export async function withStorageLock<T>(studioId:string,id:string,work:(c:Connection)=>Promise<T>):Promise<{busy:false;value:T}|{busy:true}>{
 const c=await pool.connect(),key=`storage:${studioId}:${id}`;let locked=false;
 try{const [row]=await query('select pg_try_advisory_lock(hashtextextended($1,0)) as locked',[key],c);locked=row.locked;if(!locked)return {busy:true};return {busy:false,value:await work(c)};}
 finally{try{if(locked)await query('select pg_advisory_unlock(hashtextextended($1,0))',[key],c);}finally{c.release();}}
}
export async function trackPut(studioId:string,id:string,key:string,c:Connection){await query("insert into storage_cleanup(object_key,studio_id,resource_id) values($1,$2,$3) on conflict(object_key) do update set next_check=now()+interval '1 minute'",[key,studioId,id],c);}
export async function backupProtects(key:string|null|undefined,c:Connection=pool){if(!key)return false;return (await query("select 1 from backup_media m join backup_jobs b on b.id=m.backup_id where m.object_key=$1 and b.state in('pending','processing') and b.updated_at>clock_timestamp()-interval '24 hours' limit 1",[key],c)).length>0;}
export async function scanStorageCleanup(){
 const rows=await query('select * from storage_cleanup where next_check<=now() order by next_check limit 20');
 for(const row of rows)await withStorageLock(row.studio_id,row.resource_id,async c=>{
  // Keep immutable published/history previews. Pending sources remain reserved
  // and are owned by their resource until explicit retry/removal/processing.
  if(await backupProtects(row.object_key,c)){await query("update storage_cleanup set next_check=now()+interval '1 minute' where object_key=$1",[row.object_key],c);return;}
  const [ref]=await query("select 1 from portfolio_items where studio_id=$1 and id=$2 and ((object_key=$3 and state='ready') or (source_key=$3 and state<>'ready' and deleted_at is null)) union all select 1 from upload_items where studio_id=$1 and id=$2 and source_key=$3 and state<>'removed' union all select 1 from photos where studio_id=$1 and item_id=$2 and (deleted_at is null or retained_deleted) and (object_key=$3 or preview_key=$3 or thumbnail_key=$3) union all select 1 from zip_jobs where studio_id=$1 and id=$2 and object_key=$3 and state in('pending','processing','ready') union all select 1 from backup_jobs where studio_id=$1 and id=$2 and object_key=$3 and state in('processing','ready')",[row.studio_id,row.resource_id,row.object_key],c);
  if(ref){await query("update storage_cleanup set next_check=now()+interval '1 day',last_error=false where object_key=$1",[row.object_key],c);return;}
  try{if(row.object_key.includes('/zips/')||row.object_key.includes('/backups/'))await abortMultipartForKey(row.object_key);await removeObject(row.object_key);await query("update storage_cleanup set next_check=now()+interval '1 day',last_error=false where object_key=$1",[row.object_key],c);}catch{await query("update storage_cleanup set next_check=now()+interval '1 minute',last_error=true where object_key=$1",[row.object_key],c);}
 });
}
