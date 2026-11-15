import {createCipheriv,createDecipheriv,randomBytes,createHash,createHmac} from 'node:crypto';
import {query,withTx,type Connection} from '@proofroom/db';
import {ApiError,fail,canonicalJson,type Role} from '@proofroom/contracts';
export type StudioContext={studioId:string;userId:string;role:Role;state:'active'|'readonly'|'suspended'};
export function checkRole(ctx:StudioContext,min:Role){const ranks={member:0,admin:1,owner:2};if(ranks[ctx.role]<ranks[min])fail(403,'ROLE_REQUIRED','当前角色没有此操作权限，请联系工作室所有者');}
export function writable(ctx:StudioContext){if(ctx.state!=='active')fail(403,'STUDIO_READONLY',ctx.state==='suspended'?'工作室已暂停，请联系所有者处理':'工作室当前只读，请联系所有者恢复后再操作');}
export async function audit(ctx:StudioContext,action:string,resourceId:string,details:Record<string,unknown>={},c?:Connection){await query('insert into audit_log(studio_id,user_id,action,resource_id,details) values($1,$2,$3,$4,$5)',[ctx.studioId,ctx.userId,action,resourceId,details],c);}
export const canonical=canonicalJson;
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
const cipherKey=(override?:string)=>{const secret=override??process.env.APP_SECRET;if(!secret||!/^[a-f0-9]{64}$/.test(secret))throw new Error('APP_SECRET需要32字节本地密钥');return Buffer.from(secret,'hex');};
export function encrypt(value:string,override?:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',cipherKey(override),iv);const result=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),result]).toString('base64url');}
export function decrypt(value:string,override?:string){const data=Buffer.from(value,'base64url'),cipher=createDecipheriv('aes-256-gcm',cipherKey(override),data.subarray(0,12));cipher.setAuthTag(data.subarray(12,28));return Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString('utf8');}
export async function idempotent<T>(studioId:string,operation:string,key:string,value:unknown,work:(c:Connection)=>Promise<T>,provided?:Connection):Promise<T>{
 const scope=`${studioId}:${operation}`;
 return withTx(async c=>{
  await query('select pg_advisory_xact_lock(hashtext($1))',[`${scope}:${key}`],c);
  let [studio]=await query('select idempotency_key_cipher from studios where id=$1',[studioId],c);
  if(!studio)fail(404,'NOT_FOUND','工作室不存在');
  if(!studio.idempotency_key_cipher){
   await query('update studios set idempotency_key_cipher=$2 where id=$1 and idempotency_key_cipher is null',[studioId,encrypt(randomBytes(32).toString('base64url'))],c);
   [studio]=await query('select idempotency_key_cipher from studios where id=$1',[studioId],c);
  }
  // A keyed digest prevents the four-digit PIN being brute-forced from stored answers + digest.
  const hash=createHmac('sha256',Buffer.from(decrypt(studio.idempotency_key_cipher),'base64url')).update(scope).update(canonical(value)).digest('hex');
  const [old]=await query('select digest,result from idempotency where scope=$1 and key=$2',[scope,key],c);
  if(old){if(old.digest!==hash)fail(409,'IDEMPOTENCY_CONFLICT','此请求编号已用于不同内容，请核对当前操作');return old.result as T;}
  const result=await work(c);
  await query('insert into idempotency(scope,key,digest,result) values($1,$2,$3,$4)',[scope,key,hash,JSON.stringify(result)],c);
  return result;
 },provided);
}
export function studioView(row:Record<string,unknown>){const fields=['id','slug','name','timezone','state','state_reason','seat_limit','quota_bytes','storage_bytes','reserved_bytes','version','created_at','role','member_count'];return Object.fromEntries(fields.filter(k=>k in row).map(k=>[k,row[k]]));}

export async function limit(key:string,max:number,seconds:number){const [r]=await query("insert into rate_limits(key,count,reset_at) values($1,1,now()+make_interval(secs=>$2)) on conflict(key) do update set count=case when rate_limits.reset_at<=now() then 1 else rate_limits.count+1 end,reset_at=case when rate_limits.reset_at<=now() then now()+make_interval(secs=>$2) else rate_limits.reset_at end returning count,greatest(1,ceil(extract(epoch from(reset_at-now())))) as wait",[key,seconds]);if(r.count>max)throw new ApiError(429,'RATE_LIMITED',`操作过于频繁，请在${r.wait}秒后重试`,true,undefined,Number(r.wait));return max-r.count;}
export function expectedVersion(row:Record<string,unknown>,version:number){if(row.version!==version)fail(409,'VERSION_CONFLICT','内容已被更新，当前输入已保留，请查看最新内容后重试',true);}
export async function project(ctx:StudioContext,id:string,c?:Connection,lock=false){if(lock&&!c)throw new Error('行锁必须绑定显式事务连接');const r=(await query(`select * from orders where studio_id=$1 and id=$2${lock?' for update':''}`,[ctx.studioId,id],c))[0];if(!r)fail(404,'NOT_FOUND','项目不存在或无法访问');return r;}

// Lock order is studio -> actor -> membership; every business mutation rechecks live authority.
export async function lockStudio(ctx:StudioContext,c:Connection,min:Role='member'){
 const [studio]=await query('select * from studios where id=$1 for update',[ctx.studioId],c);
 if(!studio)fail(404,'NOT_FOUND','工作室不存在或无法访问');
 const [member]=await query('select m.role,u.disabled,u.force_password_change from memberships m join users u on u.id=m.user_id where m.studio_id=$1 and m.user_id=$2 for update of u,m',[ctx.studioId,ctx.userId],c);
 if(!member||member.disabled)fail(404,'NOT_FOUND','工作室不存在或无法访问');
 if(member.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先修改密码');
 const live={...ctx,role:member.role as Role,state:studio.state};checkRole(live,min);writable(live);return studio;
}

// Restored IDs stay stable; every future write must stay in its own object root.
export function mediaKey(studioId:string,relative:string){const namespace=process.env.MEDIA_NAMESPACE;if(namespace&&!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(namespace))throw new Error('恢复媒体命名空间配置无效');return `${studioId}/${namespace?`restores/${namespace}/`:''}${relative}`;}
