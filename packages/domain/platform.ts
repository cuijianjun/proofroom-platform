import {query,withTx} from '@proofroom/db';
import {fail,type Staff} from '@proofroom/contracts';
import type {PlatformHealth,PlatformUser,platformUserCommand} from '@proofroom/contracts/platform';
import type {z} from '@proofroom/contracts';
import {storageHealth} from '@proofroom/storage';
import {requireLiveSession} from './auth.js';
import {studioView,expectedVersion,digest} from './common.js';
function requirePlatform(user:Staff){if(!user.is_platform_admin)fail(403,'PLATFORM_REQUIRED','此入口仅限平台管理员');}
const userFields='id,username,name,email,disabled,force_password_change,is_platform_admin,mfa_enabled,locked_until,version';
function userDto(r:Record<string,any>):PlatformUser{return {id:r.id,username:r.username,name:r.name,email:r.email,disabled:r.disabled,forcePasswordChange:r.force_password_change,platformAdmin:r.is_platform_admin,mfaEnabled:r.mfa_enabled,lockedUntil:r.locked_until,version:r.version};}
export async function platformUsers(user:Staff,search:string){requirePlatform(user);return (await query(`select ${userFields} from users where username ilike $1 or email ilike $1 or name ilike $1 order by lower(username),id limit 100`,[`%${search.replace(/[\\%_]/g,'\\$&')}%`])).map(userDto);}
export async function platformUser(user:Staff,id:string){requirePlatform(user);const [row]=await query(`select ${userFields} from users where id=$1`,[id]);if(!row)fail(404,'NOT_FOUND','工作人员账号不存在');return userDto(row);}
export async function updatePlatformUser(user:Staff,id:string,input:z.infer<typeof platformUserCommand>){requirePlatform(user);await withTx(async c=>{
 // Ordered user locks also serialize login, password and MFA transitions.
 const rows=await query('select * from users where id=any($1::uuid[]) order by id for update',[[user.id,id]],c),actor=rows.find(r=>r.id===user.id),target=rows.find(r=>r.id===id);if(!actor||actor.disabled||!actor.is_platform_admin)fail(403,'PLATFORM_REQUIRED','此入口仅限平台管理员');if(actor.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先修改密码');await requireLiveSession(user,c);if(!target)fail(404,'NOT_FOUND','工作人员账号不存在');if(id===user.id)fail(403,'SELF_CONTROL','请在账号安全管理自己的密码；不能在平台控制中停用或重置当前管理账号');
 const scope='platform-user-control:'+user.id,hash=digest({id,...input});await query('select pg_advisory_xact_lock(hashtext($1))',[scope+':'+input.key],c);const [old]=await query('select digest from idempotency where scope=$1 and key=$2',[scope,input.key],c);if(old){if(old.digest!==hash)fail(409,'IDEMPOTENCY_CONFLICT','此请求编号已用于不同账号操作，请核对');return;}expectedVersion(target,input.version);
 if(input.action==='disable')await query('update users set disabled=true,version=version+1 where id=$1',[id],c);else if(input.action==='enable')await query('update users set disabled=false,failed_logins=0,locked_until=null,version=version+1 where id=$1',[id],c);else await query('update users set force_password_change=true,version=version+1 where id=$1',[id],c);
 await query('delete from sessions where user_id=$1',[id],c);await query('insert into audit_log(user_id,action,resource_id,details) values($1,$2,$3,$4)',[user.id,'platform.user.'+input.action,id,JSON.stringify({reason:input.reason})],c);await query('insert into idempotency(scope,key,digest,result) values($1,$2,$3,$4)',[scope,input.key,hash,JSON.stringify({id})],c);
 });const [row]=await query(`select ${userFields} from users where id=$1`,[id]);return userDto(row);}
export async function platformHealth(user:Staff):Promise<PlatformHealth>{requirePlatform(user);const [state]=await query("select clock_timestamp() as checked_at,(select last_seen from service_heartbeats where name='worker') as last_seen,(select last_seen>clock_timestamp()-interval '20 seconds' from service_heartbeats where name='worker') as fresh"),[jobs]=await query<{waiting:number;active:number;failed:number}>("select count(*) filter(where state in('created','retry'))::int as waiting,count(*) filter(where state='active')::int as active,count(*) filter(where state='failed')::int as failed from pgboss.job where name in('media','zip')");return {database:'ok',storage:await storageHealth(),worker:!state.last_seen?'unknown':state.fresh?'online':'stale',workerLastSeen:state.last_seen,queue:jobs,checkedAt:state.checked_at};}
export async function updatePlatformStudio(user:Staff,id:string,input:{version:number;state:string;stateReason:string;seatLimit:number;quotaBytes:number}){
 return withTx(async c=>{
  // Acquire the studio lock before reading usage, so admission cannot race quota reduction.
  const [studio]=await query('select * from studios where id=$1 for update',[id],c);
  if(!studio)fail(404,'NOT_FOUND','工作室不存在');
  const [actor]=await query('select is_platform_admin,disabled,force_password_change from users where id=$1 for update',[user.id],c);
  if(!actor||actor.disabled||!actor.is_platform_admin)fail(403,'PLATFORM_REQUIRED','此入口仅限平台管理员');
  if(actor.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先修改密码');
  await requireLiveSession(user,c);
  const [counts]=await query('select (select count(*) from memberships where studio_id=$1)+(select count(*) from invitations where studio_id=$1 and accepted_at is null and expires_at>now()) as seats',[id],c);
  if(studio.version!==input.version||Number(counts.seats)>input.seatLimit||BigInt(studio.storage_bytes)+BigInt(studio.reserved_bytes)>BigInt(input.quotaBytes))fail(409,'VERSION_OR_QUOTA_CONFLICT','版本已变化或新额度小于当前使用和预留，请核对后重试',true);
  const [result]=await query('update studios set state=$2,state_reason=$3,seat_limit=$4,quota_bytes=$5,version=version+1 where id=$1 returning *',[id,input.state,input.stateReason,input.seatLimit,input.quotaBytes],c);
  await query('insert into audit_log(studio_id,user_id,action,resource_id,details) values($1,$2,$3,$4,$5)',[id,user.id,'platform.studio.update',id,JSON.stringify({state:input.state,seatLimit:input.seatLimit,quotaBytes:input.quotaBytes})],c);
  return studioView(result);
 });
}
