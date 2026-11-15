import {query,withTx,type Connection} from '@proofroom/db';
import {z,uuid,fail} from '@proofroom/contracts';
import type {InquiryInput} from '@proofroom/contracts/presales';
import type {Questionnaire,Content,Profile} from '@proofroom/contracts/config';
import {getConfig} from './config.js';
import {sampleItems,portfolioDto} from './portfolio.js';
import {audit,decrypt,encrypt,expectedVersion,idempotent,limit,lockStudio,type StudioContext} from './common.js';
import {hashPassword} from './password.js';
import {hashToken,randomToken} from './tokens.js';
export async function publicStudio(slug:string,c?:Connection){const [studio]=await query('select id,name,slug,state from studios where slug=$1',[slug],c);if(!studio)fail(404,'NOT_FOUND','工作室不存在或暂不可访问');if(studio.state==='suspended')fail(403,'STUDIO_UNAVAILABLE','工作室暂不可用，请稍后再来');return studio;}
export async function publicConfig(slug:string){return withTx(async c=>{
 await query('set transaction isolation level repeatable read read only',[],c);
 const studio=await publicStudio(slug,c);const profile=await getConfig(studio.id,'profile',c),questionnaire=await getConfig(studio.id,'questionnaire',c),content=await getConfig(studio.id,'content',c),portfolio=await getConfig(studio.id,'portfolio',c);
 const rows=await query("select p.*,s.slug as studio_slug from portfolio_items p join studios s on s.id=p.studio_id where p.studio_id=$1 and p.published and p.state='ready' and p.deleted_at is null order by p.sort_order,p.created_at,p.id",[studio.id],c);
 const items=[...rows.map(r=>portfolioDto(r,true)),...sampleItems(slug,portfolio.value)];
 const slots=await query('select id,start_at,end_at,version,(order_id is null) as available from booking_slots where studio_id=$1 and enabled and start_at>now() order by start_at,id',[studio.id],c);
 const hasRequiredPortfolio=(questionnaire.value as Questionnaire).questions.some(q=>q.type==='portfolio'&&q.required);
 const canSubmit=studio.state==='active'&&!!(profile.value as Profile).wechat.trim()&&(!hasRequiredPortfolio||!!items.length);
 return {studio:{name:studio.name,slug:studio.slug},profile,questionnaire,content,portfolio:{...portfolio,items},slots,canSubmit,unavailableReason:studio.state!=='active'?'工作室当前只读，请通过原有联系方式联系摄影师':!(profile.value as Profile).wechat.trim()?'摄影师正在完善联系方式，咨询暂未开放':hasRequiredPortfolio&&!items.length?'作品正在准备中，请稍后提交咨询':''};
 });}
function validateAnswers(definition:Questionnaire,input:InquiryInput){
 const allowed=new Set(definition.questions.map(q=>q.id));for(const id of Object.keys(input.answers))if(!allowed.has(id))fail(409,'QUESTIONNAIRE_CHANGED','问卷内容已变化，请保留当前输入并查看新版');
 const answers:Record<string,unknown>={},other:Record<string,string>={};
 for(const q of definition.questions){const value=input.answers[q.id];
  if(q.type==='contact'){if(!value||Array.isArray(value)||typeof value!=='object'||!value.wechat.trim())fail(400,'REQUIRED_FIELD',`请填写${q.label}中的微信号`);answers[q.id]={wechat:value.wechat.trim(),source:value.source??''};continue;}
  if(q.type==='multi'||q.type==='portfolio'){
   const list=value===undefined?[]:value;if(!Array.isArray(list))fail(400,'INVALID_ANSWER',`${q.label}需要多选答案`);
   if(new Set(list).size!==list.length)fail(400,'INVALID_ANSWER',`${q.label}不能重复选择`);
   if(q.required&&!list.length)fail(400,'REQUIRED_FIELD',`请选择${q.label}`);
   if(list.length>(q.type==='portfolio'?15:20))fail(400,'TOO_MANY_REFERENCES',q.type==='portfolio'?'作品最多选择15张':`${q.label}最多选择20项`);
   if(q.type==='multi'&&list.some(v=>!q.options.includes(v)))fail(400,'INVALID_OPTION',`${q.label}包含已变更的选项`);
   answers[q.id]=list;continue;
  }
  const text=value===undefined?'':value;if(typeof text!=='string')fail(400,'INVALID_ANSWER',`${q.label}的答案格式不正确`);
  const max=q.type==='long'?1000:q.fixed==='name'?60:q.type==='single'?100:200;
  if(text.length>max)fail(400,'ANSWER_TOO_LONG',`${q.label}最多${max}字`);
  if(q.required&&!text.trim())fail(400,'REQUIRED_FIELD',`请填写${q.label}`);
  if(q.type==='single'&&text&&!q.options.includes(text))fail(400,'INVALID_OPTION',`${q.label}的选项已变更，请重新选择`);
  answers[q.id]=q.fixed==='name'?text.trim():text;
  if(q.type==='single'&&text==='其他'&&input.other[q.id])other[q.id]=input.other[q.id];
 }
 for(const id of Object.keys(input.other))if(!definition.questions.some(q=>q.id===id&&q.type==='single'&&q.options.includes('其他')))fail(400,'INVALID_ANSWER','其他说明不属于当前问题');
 return {answers,other};
}
export async function submitInquiry(slug:string,input:InquiryInput,ip:string,recoveryProof?:string){
 const studio=await publicStudio(slug);
 if(studio.state!=='active')fail(403,'STUDIO_READONLY','工作室暂不可接收新咨询，请联系摄影师');
 if(input.website.trim())return {silent:true,receiptToken:null};
 const scope=`${studio.id}:inquiry`;
 const [prior]=await query('select 1 from idempotency where scope=$1 and key=$2',[scope,input.submissionKey]);
 if(!prior)await limit(`inquiry:${studio.id}:${ip}`,5,600);
 const result=await idempotent(studio.id,'inquiry',input.submissionKey,{...input,website:''},async c=>{
  const [live]=await query('select state from studios where id=$1 for update',[studio.id],c);if(live.state!=='active')fail(403,'STUDIO_READONLY','工作室暂不可接收新咨询');
  const profile=await getConfig(studio.id,'profile',c),questionnaire=await getConfig(studio.id,'questionnaire',c),content=await getConfig(studio.id,'content',c),portfolio=await getConfig(studio.id,'portfolio',c);
  if(!(profile.value as Profile).wechat.trim())fail(409,'PUBLIC_NOT_READY','摄影师正在完善联系方式，咨询暂未开放');
  if(input.questionnaireVersion!==questionnaire.version||input.contentVersion!==content.version)fail(409,'PUBLIC_VERSION_CONFLICT','问卷或套餐已更新，当前输入仍保留，请查看新版后重新确认',true);
  const validated=validateAnswers(questionnaire.value,input),definition=questionnaire.value as Questionnaire;
  const portfolioQuestion=definition.questions.find(q=>q.type==='portfolio');const ids=portfolioQuestion?(validated.answers[portfolioQuestion.id] as string[]):[];
  const actual=await query("select id,title,group_name from portfolio_items where studio_id=$1 and id::text=any($2::text[]) and published and state='ready' and deleted_at is null",[studio.id,ids],c);
  const samples=sampleItems(slug,portfolio.value);const references=ids.map(id=>{const image=actual.find(p=>p.id===id);if(image)return {id:image.id,title:image.title,groupId:image.group_name,sample:false};const sample=samples.find(p=>p.id===id);if(sample)return {id:sample.id,title:sample.title,groupId:sample.groupId,sample:true};fail(409,'REFERENCE_CHANGED','所选作品已更新，请保留答案并重新核对参考图',true);});
  const intendedPackage=input.packageId?(content.value as Content).packages.find(p=>p.id===input.packageId)??null:null;if(input.packageId&&!intendedPackage)fail(409,'PACKAGE_CHANGED','意向套餐已变更，请重新选择');
  let slot:Record<string,unknown>|null=null;
  if(input.slotId){const [s]=await query('select id,start_at,end_at,version from booking_slots where studio_id=$1 and id=$2 and enabled and order_id is null and start_at>now()',[studio.id,input.slotId],c);if(!s||s.version!==input.slotVersion)fail(409,'SLOT_CHANGED','意向时段已调整或被占用，请重新选择；咨询本身不会占用档期',true);slot=s;}
  const snapshot={questions:definition.questions,questionnaireVersion:questionnaire.version,contentVersion:content.version,references,intendedPackage,slot,dateFlexible:input.dateFlexible,intendedDate:input.intendedDate,other:validated.other,brand:{name:(profile.value as Profile).name,wechat:(profile.value as Profile).wechat}};
  const token=randomToken(),cipher=encrypt(token);const [created]=await query('insert into inquiries(studio_id,name,wechat,pin_hash,answers,snapshot,receipt_hash,receipt_cipher,recovery_hash) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',[studio.id,validated.answers.q1,(validated.answers.q8 as {wechat:string}).wechat,hashPassword(input.pin),JSON.stringify(validated.answers),JSON.stringify(snapshot),hashToken(token),cipher,recoveryProof?hashToken(`inquiry-recovery:${studio.id}:${recoveryProof}:${input.submissionKey}`):null],c);
  return {id:created.id,receiptCipher:cipher};
 });
 return {id:result.id,receiptToken:decrypt(result.receiptCipher),silent:false};
}
// HttpOnly visitor proof is purpose/studio bound; the ordinary form draft
// stores only a request key, never a capability token or the customer's PIN.
export async function recoverInquiry(slug:string,key:string,ip:string,proof?:string){const studio=await publicStudio(slug);await limit(`inquiry-recovery:${studio.id}:${ip}`,60,600);if(!proof)return {receiptToken:null};const [row]=await query('select receipt_cipher from inquiries where studio_id=$1 and recovery_hash=$2',[studio.id,hashToken(`inquiry-recovery:${studio.id}:${proof}:${key}`)]);return {receiptToken:row?decrypt(row.receipt_cipher):null};}
export function inquiryDto(row:Record<string,any>,referenceRoot:string){return {id:row.id,name:row.name,wechat:row.wechat,status:row.status,version:row.version,createdAt:row.created_at,projectId:row.project_id,possibleDuplicate:Number(row.duplicate_count??0)>1,...(row.answers?{answers:row.answers,snapshot:{...row.snapshot,references:(row.snapshot.references??[]).map((r:any)=>({...r,previewUrl:`${referenceRoot}/${encodeURIComponent(r.id)}`}))}}:{})};}
export async function receipt(slug:string,token:string){const studio=await publicStudio(slug);const [row]=await query('select * from inquiries where studio_id=$1 and receipt_hash=$2',[studio.id,hashToken(token)]);if(!row)fail(404,'NOT_FOUND','回执不存在或无法访问，请联系摄影师');return inquiryDto(row,`/api/v1/public/${slug}/receipts/${token}/references`);}
export async function listInquiries(ctx:StudioContext,status:string,cursor?:string){
 let before:{at:string;id:string}|null=null;if(cursor){try{before=JSON.parse(Buffer.from(cursor,'base64url').toString());before=z.strictObject({at:z.iso.datetime({offset:true}),id:uuid}).parse(before);}catch{fail(400,'INVALID_CURSOR','列表位置已失效，请刷新列表');}}
 const rows=await query(`with counts as(select wechat,count(*) as n from inquiries where studio_id=$1 group by wechat) select i.id,i.name,i.wechat,i.status,i.version,i.project_id,i.created_at,counts.n as duplicate_count,to_char(i.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_at_text from inquiries i join counts on counts.wechat=i.wechat where i.studio_id=$1 and i.status=$2 and (i.status<>'ignored' or visibility_deadline(greatest(i.ignored_at,i.visibility_restored_at))>now()) and ($3::timestamptz is null or (i.created_at,i.id)<($3::timestamptz,$4::uuid)) order by i.created_at desc,i.id desc limit 26`,[ctx.studioId,status,before?.at??null,before?.id??null]);
 const items=rows.slice(0,25);const last=items.at(-1);return {items:items.map(r=>inquiryDto(r,'')),nextCursor:rows.length>25&&last?Buffer.from(JSON.stringify({at:last.cursor_at_text,id:last.id})).toString('base64url'):null};
}
export async function getInquiry(ctx:StudioContext,id:string){const [row]=await query('select i.*,(select count(*) from inquiries x where x.studio_id=i.studio_id and x.wechat=i.wechat) as duplicate_count from inquiries i where i.studio_id=$1 and i.id=$2',[ctx.studioId,id]);if(!row)fail(404,'NOT_FOUND','咨询不存在或无法访问');return inquiryDto(row,`/api/v1/studios/${ctx.studioId}/inquiries/${id}/references`);}
export async function changeInquiryStatus(ctx:StudioContext,id:string,version:number,status:'pending'|'ignored'){return withTx(async c=>{await lockStudio(ctx,c);const [row]=await query('select * from inquiries where studio_id=$1 and id=$2 for update',[ctx.studioId,id],c);if(!row)fail(404,'NOT_FOUND','咨询不存在');expectedVersion(row,version);if(row.status==='confirmed')fail(409,'INQUIRY_CONFIRMED','已确认咨询请直接进入对应项目，不能回退');const [updated]=await query("update inquiries set status=$3,ignored_at=case when $3='ignored' then coalesce(ignored_at,now()) else null end,version=version+1 where studio_id=$1 and id=$2 returning *",[ctx.studioId,id,status],c);await audit(ctx,`inquiry.${status}`,id,{},c);return inquiryDto(updated,`/api/v1/studios/${ctx.studioId}/inquiries/${id}/references`);});}
