import {query,withTx,type Connection} from '@proofroom/db';
import {ApiError,fail,type Staff,type Studio,type Session} from '@proofroom/contracts';
import {hashPassword,verifyPassword} from './password.js';
import {hashToken,randomToken} from './tokens.js';
import {limit,studioView,type StudioContext} from './common.js';
const liveSessions=new WeakMap<Staff,string>();
export async function requireLiveSession(user:Staff,c:Connection){const tokenHash=liveSessions.get(user);if(!tokenHash)fail(401,'SESSION_EXPIRED','登录已失效，请重新登录');const [session]=await query('select id from sessions where user_id=$1 and token_hash=$2 and expires_at>now()',[user.id,tokenHash],c);if(!session)fail(401,'SESSION_EXPIRED','登录已失效，请重新登录');}
export async function createSession(userId:string,connection?:Connection):Promise<string>{
 if(!connection)return withTx(c=>createSession(userId,c));
 const [user]=await query('select id,disabled from users where id=$1 for update',[userId],connection);
 if(!user||user.disabled)fail(401,'ACCOUNT_DISABLED','账号当前不可用');
 const token=randomToken();
 await query("insert into sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '30 days')",[userId,hashToken(token)],connection);
 return token;
}
export async function currentStaff(token?:string):Promise<Staff>{
 if(!token)fail(401,'AUTH_REQUIRED','请先登录摄影师工作台');
 const [user]=await query('select u.id,u.username,u.name,u.email,u.is_platform_admin,u.force_password_change,u.mfa_enabled from sessions s join users u on u.id=s.user_id where s.token_hash=$1 and s.expires_at>now() and not u.disabled',[hashToken(token!)]);
 if(!user)fail(401,'SESSION_EXPIRED','登录已失效，请重新登录');
 liveSessions.set(user as Staff,hashToken(token!));
 return user as Staff;
}
export async function studiosFor(userId:string){return (await query('select s.*,m.role from studios s join memberships m on m.studio_id=s.id where m.user_id=$1 order by s.created_at',[userId])).map(studioView) as Studio[];}
export async function sessionInfo(token?:string):Promise<Session>{const user=await currentStaff(token);return {user,studios:await studiosFor(user.id)};}
export async function context(user:Staff,studioId:string,min:'member'|'admin'|'owner'='member',write=false):Promise<StudioContext>{
 if(user.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先完成密码修改');
 const [row]=await query('select s.state,m.role from memberships m join studios s on s.id=m.studio_id where m.user_id=$1 and m.studio_id=$2',[user.id,studioId]);
 if(!row)fail(404,'NOT_FOUND','工作室不存在或无法访问');
 const ranks={member:0,admin:1,owner:2};
 if(ranks[row.role as keyof typeof ranks]<ranks[min])fail(403,'ROLE_REQUIRED','当前角色没有此操作权限，请联系工作室所有者');
 if(row.state==='suspended'||write&&row.state!=='active')fail(403,row.state==='suspended'?'STUDIO_SUSPENDED':'STUDIO_READONLY',row.state==='suspended'?'工作室已暂停，请联系所有者或平台支持':'工作室当前只读，此操作暂不可用');
 return {studioId,userId:user.id,role:row.role,state:row.state};
}
export async function login(input:{login:string;password:string;mfaCode?:string},ip:string){
 await limit(`staff-login:${ip}`,20,600);
 if(input.mfaCode)await limit(`mfa-login:${hashToken(input.login.trim().toLowerCase())}`,10,600);
 const result=await withTx(async c=>{
  // The same row lock serializes login issuance, password and MFA transitions.
  const [user]=await query('select * from users where lower(username)=lower($1) or lower(email)=lower($1) for update',[input.login.trim()],c);
  let error:ApiError|undefined;
  if(!user||user.disabled||user.locked_until&&new Date(user.locked_until)>new Date()||!verifyPassword(input.password,user.password_hash))error=new ApiError(401,'INVALID_CREDENTIALS','账号或密码不正确，连续错误将暂时限制登录');
  else if(user.mfa_enabled){
   const {checkMfa}=await import('./security.js');
   const code=await checkMfa(user,input.mfaCode,c);
   if(code)error=new ApiError(401,code,code==='MFA_REQUIRED'?'请输入身份验证器动态码或一次性恢复码':'动态码或恢复码不正确，请核对后重试');
  }
  if(error){
   if(user&&!user.disabled&&error.code!=='MFA_REQUIRED')await query("update users set failed_logins=failed_logins+1,locked_until=case when failed_logins>=4 then now()+interval '10 minutes' else locked_until end where id=$1",[user.id],c);
   return {error,token:undefined};
  }
  await query('update users set failed_logins=0,locked_until=null where id=$1',[user.id],c);
  return {token:await createSession(user.id,c),error:undefined};
 });
 if(result.error)throw result.error;
 return result.token!;
}
export async function logout(token?:string){if(token)await query('delete from sessions where token_hash=$1',[hashToken(token)]);}
export async function changePassword(user:Staff,oldPassword:string,password:string){
 await limit(`password-change:${user.id}`,10,600);
 const nextHash=hashPassword(password);
 return withTx(async c=>{
  const [r]=await query('select * from users where id=$1 for update',[user.id],c);
  if(!r||r.disabled)fail(401,'ACCOUNT_DISABLED','账号当前不可用');
  await requireLiveSession(user,c);
  if(!verifyPassword(oldPassword,r.password_hash))fail(400,'INVALID_PASSWORD','原密码不正确');
  if(password===oldPassword)fail(400,'UNCHANGED_PASSWORD','新密码需要与原密码不同');
  await query('update users set password_hash=$2,force_password_change=false,version=version+1 where id=$1',[user.id,nextHash],c);
  await query('delete from sessions where user_id=$1',[user.id],c);
  return createSession(user.id,c);
 });
}
