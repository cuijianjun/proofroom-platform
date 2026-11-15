import {query,withTx,type Connection} from '@proofroom/db';
import {fail,type Role,type Staff} from '@proofroom/contracts';
import {initializeConfig} from './config.js';
import {hashPassword,passwordProblem} from './password.js';
import {randomToken,hashToken} from './tokens.js';
import {audit,checkRole,writable,limit,lockStudio,studioView,type StudioContext} from './common.js';
const reserved=new Set(['api','admin','studio','login','register','help','support','www','root','system','test','proofroom']);
export async function createStudio(userId:string,name:string,slug:string,c:Connection){if(reserved.has(slug))fail(400,'RESERVED_SLUG','此工作室地址已保留，请换一个');const [s]=await query('insert into studios(name,slug) values($1,$2) returning *',[name,slug],c);await query("insert into memberships(user_id,studio_id,role) values($1,$2,'owner')",[userId,s.id],c);await initializeConfig(s.id,name,c);return studioView(s);}
export async function register(input:{username:string;name:string;email:string;password:string;studioName:string;slug:string},ip:string){await limit(`register:${ip}`,10,600);if(passwordProblem(input.password,input.email))fail(400,'WEAK_PASSWORD','密码过于常见或包含邮箱，请换一个至少10位的密码');const pass=hashPassword(input.password);return withTx(async c=>{const [user]=await query('insert into users(username,name,email,password_hash) values($1,$2,$3,$4) returning id',[input.username.toLowerCase(),input.name,input.email.toLowerCase(),pass],c);const studio=await createStudio(user.id,input.studioName,input.slug,c);return {userId:user.id,studioId:studio.id};});}
export async function listMembers(ctx:StudioContext){return {members:await query('select u.id,u.name,u.email,u.username,m.role from memberships m join users u on u.id=m.user_id where m.studio_id=$1 order by m.created_at',[ctx.studioId]),invitations:ctx.role==='member'?[]:await query('select id,email,role,expires_at,accepted_at from invitations where studio_id=$1 and accepted_at is null and expires_at>now()',[ctx.studioId])};}
export async function invite(ctx:StudioContext,email:string,role:'admin'|'member'){
 checkRole(ctx,'admin');writable(ctx);const token=randomToken();return withTx(async c=>{const studio=await lockStudio(ctx,c,'admin');const [counts]=await query('select (select count(*) from memberships where studio_id=$1)+(select count(*) from invitations where studio_id=$1 and accepted_at is null and expires_at>now()) as count',[ctx.studioId],c);if(Number(counts.count)>=studio.seat_limit)fail(409,'SEAT_LIMIT','成员名额不足，请联系工作室所有者调整额度');const [r]=await query("insert into invitations(studio_id,email,role,token_hash,invited_by,expires_at) values($1,$2,$3,$4,$5,now()+interval '7 days') returning id,expires_at",[ctx.studioId,email.toLowerCase(),role,hashToken(token),ctx.userId],c);await audit(ctx,'member.invite',r.id,{},c);return {...r,token};});
}
export async function acceptInvite(user:Staff,token:string){
 const [hint]=await query('select studio_id from invitations where token_hash=$1',[hashToken(token)]);
 if(!hint)fail(404,'INVITE_INVALID','邀请不存在或已失效，请联系邀请人');
 return withTx(async c=>{
  const [studio]=await query('select * from studios where id=$1 for update',[hint.studio_id],c);
  const [actor]=await query('select * from users where id=$1 for update',[user.id],c);
  if(!actor||actor.disabled)fail(401,'ACCOUNT_DISABLED','账号当前不可用');
  if(actor.force_password_change)fail(403,'PASSWORD_CHANGE_REQUIRED','请先修改密码');
  const [i]=await query('select * from invitations where token_hash=$1 and studio_id=$2 for update',[hashToken(token),studio.id],c);
  if(!i||i.accepted_at||new Date(i.expires_at)<=new Date())fail(404,'INVITE_INVALID','邀请不存在或已失效，请联系邀请人');
  if(i.email.toLowerCase()!==actor.email.toLowerCase())fail(403,'INVITE_ACCOUNT','请使用邀请对应的工作人员邮箱登录');
  if(studio.state!=='active')fail(403,'STUDIO_READONLY','工作室暂不可接受新成员');
  const [count]=await query('select count(*) as n from memberships where studio_id=$1',[studio.id],c);
  const [existing]=await query('select role from memberships where studio_id=$1 and user_id=$2',[studio.id,user.id],c);
  if(!existing&&Number(count.n)>=studio.seat_limit)fail(409,'SEAT_LIMIT','成员名额不足，请联系所有者');
  await query('insert into memberships(studio_id,user_id,role) values($1,$2,$3) on conflict do nothing',[studio.id,user.id,i.role],c);
  await query('update invitations set accepted_at=now() where id=$1',[i.id],c);
  await audit({studioId:studio.id,userId:user.id,role:i.role,state:'active'},'member.invitation.accept',i.id,{},c);
  return {studioId:studio.id};
 });
}

export async function updateMember(ctx:StudioContext,userId:string,role:Role|'remove'){
 checkRole(ctx,'admin');writable(ctx);return withTx(async c=>{await lockStudio(ctx,c,'admin');const [member]=await query('select role from memberships where studio_id=$1 and user_id=$2 for update',[ctx.studioId,userId],c);if(!member)fail(404,'NOT_FOUND','成员不存在');if(member.role==='owner'||role==='owner')fail(403,'OWNER_PROTECTED','所有者需要使用单独的所有权转移操作');if(userId===ctx.userId)fail(400,'SELF_CHANGE','不能通过此入口修改或移除自己');if(role==='remove')await query('delete from memberships where studio_id=$1 and user_id=$2',[ctx.studioId,userId],c);else await query('update memberships set role=$3 where studio_id=$1 and user_id=$2',[ctx.studioId,userId,role],c);await audit(ctx,`member.${role}`,userId,{},c);return {ok:true};});
}
export async function transferOwner(ctx:StudioContext,userId:string,confirmation:string){checkRole(ctx,'owner');writable(ctx);return withTx(async c=>{const s=await lockStudio(ctx,c,'owner');if(confirmation!==s.name)fail(400,'CONFIRMATION_REQUIRED','请准确输入工作室名称以确认转移');if(userId===ctx.userId)fail(400,'OWNER_UNCHANGED','请选择其他工作室成员');const [m]=await query('select * from memberships where studio_id=$1 and user_id=$2 for update',[ctx.studioId,userId],c);if(!m)fail(404,'NOT_FOUND','目标成员不存在');await query("update memberships set role='admin' where studio_id=$1 and user_id=$2",[ctx.studioId,ctx.userId],c);await query("update memberships set role='owner' where studio_id=$1 and user_id=$2",[ctx.studioId,userId],c);await audit(ctx,'ownership.transfer',userId,{},c);return {ok:true};});}
export async function registerInvited(input:{username:string;email:string;name:string;password:string;invitationToken:string},ip:string){
 await limit(`register:${ip}`,10,600);
 if(passwordProblem(input.password,input.email))fail(400,'WEAK_PASSWORD','密码过于常见或包含邮箱，请换一个至少10位的密码');
 const [hint]=await query('select studio_id from invitations where token_hash=$1',[hashToken(input.invitationToken)]);
 if(!hint)fail(404,'INVITE_INVALID','邀请不存在或已失效，请联系邀请人');
 const passwordHash=hashPassword(input.password);
 return withTx(async c=>{
  const [studio]=await query('select * from studios where id=$1 for update',[hint.studio_id],c);
  const [invitation]=await query('select * from invitations where token_hash=$1 and studio_id=$2 for update',[hashToken(input.invitationToken),studio.id],c);
  if(!invitation||invitation.accepted_at||new Date(invitation.expires_at)<=new Date())fail(404,'INVITE_INVALID','邀请不存在或已失效，请联系邀请人');
  if(invitation.email.toLowerCase()!==input.email.toLowerCase())fail(403,'INVITE_ACCOUNT','请使用收到邀请的工作人员邮箱');
  if(studio.state!=='active')fail(403,'STUDIO_READONLY','工作室暂不可接受新成员');
  const [count]=await query('select count(*) as n from memberships where studio_id=$1',[studio.id],c);
  if(Number(count.n)>=studio.seat_limit)fail(409,'SEAT_LIMIT','成员名额不足，请联系所有者');
  const [user]=await query('insert into users(username,name,email,password_hash) values($1,$2,$3,$4) returning id',[input.username.toLowerCase(),input.name,input.email.toLowerCase(),passwordHash],c);
  await query('insert into memberships(user_id,studio_id,role) values($1,$2,$3)',[user.id,studio.id,invitation.role],c);
  await query('update invitations set accepted_at=now() where id=$1',[invitation.id],c);
  await audit({studioId:studio.id,userId:user.id,role:invitation.role,state:'active'},'member.invitation.accept',invitation.id,{},c);
  return {userId:user.id,studioId:studio.id};
 });
}

export async function cancelInvitation(ctx:StudioContext,id:string){return withTx(async c=>{await lockStudio(ctx,c,'admin');const [i]=await query('delete from invitations where studio_id=$1 and id=$2 and accepted_at is null returning id',[ctx.studioId,id],c);if(!i)fail(409,'INVITE_ALREADY_USED','邀请已被接受或已撤销，请刷新列表');await audit(ctx,'member.invitation.cancel',id,{},c);return {ok:true};});}
