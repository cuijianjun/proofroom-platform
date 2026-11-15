import {TOTP,Secret} from 'otpauth';
import {query,withTx,type Connection} from '@proofroom/db';
import {fail,type Staff} from '@proofroom/contracts';
import {encrypt,decrypt,limit} from './common.js';
import {hashToken,randomToken} from './tokens.js';
import {verifyPassword} from './password.js';
import {createSession,requireLiveSession} from './auth.js';
const totp=(secret:string,label:string)=>new TOTP({issuer:'ProofRoom',label,algorithm:'SHA1',digits:6,period:30,secret:Secret.fromBase32(secret)});
// Caller holds the user row lock; recovery consumption belongs to that transaction.
export async function checkMfa(user:Record<string,any>,code:string|undefined,c:Connection):Promise<'MFA_REQUIRED'|'MFA_INVALID'|null>{
 if(!code)return 'MFA_REQUIRED';
 if(totp(decrypt(user.mfa_secret),user.email).validate({token:code,window:1})!==null)return null;
 const hash=hashToken(code);
 const updated=await query("update users set recovery_hashes=(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements_text(recovery_hashes) x where x<>$2) where id=$1 and recovery_hashes ? $2 returning id",[user.id,hash],c);
 return updated.length?null:'MFA_INVALID';
}
async function lockedUser(user:Staff,c:Connection){const [r]=await query('select * from users where id=$1 for update',[user.id],c);if(!r||r.disabled)fail(401,'ACCOUNT_DISABLED','账号当前不可用');if(r.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先修改密码');await requireLiveSession(user,c);return r;}
export async function setupMfa(user:Staff,password:string){
 await limit(`mfa-setup:${user.id}`,10,600);
 return withTx(async c=>{const r=await lockedUser(user,c);if(!verifyPassword(password,r.password_hash))fail(400,'INVALID_PASSWORD','密码不正确');if(r.mfa_enabled)fail(409,'MFA_ENABLED','双重验证已经启用');const secret=new Secret({size:20}).base32;await query('update users set mfa_secret=$2,version=version+1 where id=$1 and not mfa_enabled',[user.id,encrypt(secret)],c);return {secret,uri:totp(secret,r.email).toString()};});
}
export async function enableMfa(user:Staff,code:string){
 await limit(`mfa-enable:${user.id}`,5,600);
 return withTx(async c=>{const r=await lockedUser(user,c);if(!r.mfa_secret||r.mfa_enabled)fail(409,'MFA_SETUP_REQUIRED','请先开始设置双重验证');if(totp(decrypt(r.mfa_secret),r.email).validate({token:code,window:1})===null)fail(400,'MFA_INVALID','动态码不正确');const codes=Array.from({length:8},()=>randomToken(12));await query('update users set mfa_enabled=true,recovery_hashes=$2,version=version+1 where id=$1',[user.id,JSON.stringify(codes.map(hashToken))],c);await query('delete from sessions where user_id=$1',[user.id],c);return {codes,token:await createSession(user.id,c)};});
}
export async function disableMfa(user:Staff,password:string,code:string){
 await limit(`mfa-disable:${user.id}`,5,600);
 return withTx(async c=>{const r=await lockedUser(user,c);if(!verifyPassword(password,r.password_hash))fail(400,'INVALID_PASSWORD','密码不正确');if(!r.mfa_enabled)fail(409,'MFA_DISABLED','双重验证尚未启用');if(await checkMfa(r,code,c))fail(400,'MFA_INVALID','动态码或恢复码不正确');await query("update users set mfa_enabled=false,mfa_secret=null,recovery_hashes='[]',version=version+1 where id=$1",[user.id],c);await query('delete from sessions where user_id=$1',[user.id],c);return createSession(user.id,c);});
}
