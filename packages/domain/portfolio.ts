import {mediaKey} from './common.js';
import {randomUUID,createHash} from 'node:crypto';
import sharp from 'sharp';
import {query,withTx,type Connection} from '@proofroom/db';
import {ApiError,fail} from '@proofroom/contracts';
import {type Portfolio} from '@proofroom/contracts/config';
import type {PortfolioUpload} from '@proofroom/contracts/presales';
import {putObject,getObject,removeObject} from '@proofroom/storage';
import {audit,expectedVersion,idempotent,lockStudio,type StudioContext} from './common.js';
import {getConfig} from './config.js';
import {getBoss} from './jobs.js';
import {withStorageLock,trackPut,backupProtects} from './storage-io.js';
export function portfolioDto(row:Record<string,any>,publicView=false){return {id:row.id,title:row.title,groupId:row.group_name,sample:false,previewUrl:`/api/v1/${publicView?`public/${row.studio_slug}`:`studios/${row.studio_id}`}/portfolio/${row.id}/preview`,...(publicView?{}:{filename:row.filename,version:row.version,published:row.published,state:row.state,error:row.error,bytes:String(row.preview_bytes),expectedBytes:String(row.expected_bytes),sha256:row.sha256,attempts:row.processing_attempts,sortOrder:row.sort_order})};}

export async function listPortfolio(ctx:StudioContext){const config=await getConfig(ctx.studioId,'portfolio');const items=await query('select * from portfolio_items where studio_id=$1 and deleted_at is null order by sort_order,created_at,id',[ctx.studioId]);return {config,items:items.map(r=>portfolioDto(r))};}
export async function createPortfolioUpload(ctx:StudioContext,input:PortfolioUpload){
 return idempotent(ctx.studioId,'portfolio-upload',input.key,input,async c=>{
  const studio=await lockStudio(ctx,c,'admin');const config=await getConfig(ctx.studioId,'portfolio',c);
  if(input.groupId!=='uncategorized'&&!(config.value as Portfolio).groups.some(g=>g.id===input.groupId))fail(409,'GROUP_CHANGED','作品组已变更，请重新选择');
  if(BigInt(studio.storage_bytes)+BigInt(studio.reserved_bytes)+BigInt(input.bytes)>BigInt(studio.quota_bytes))fail(409,'STORAGE_QUOTA','存储额度不足，请联系工作室所有者调整后重试');
  const id=randomUUID(),sourceKey=mediaKey(ctx.studioId,`quarantine/portfolio/${id}`);
  await query('insert into portfolio_items(id,studio_id,title,group_name,object_key,published,state,filename,expected_bytes,reserved_bytes,source_key,sha256,created_by,publish_requested) values($1,$2,$3,$4,$5,false,\'pending\',$6,$7,$7,$8,$9,$10,$11)',[id,ctx.studioId,input.title,input.groupId,mediaKey(ctx.studioId,`portfolio/${id}/pending`),input.filename,input.bytes,sourceKey,input.sha256,ctx.userId,input.publish],c);
  await query('update studios set reserved_bytes=reserved_bytes+$2 where id=$1',[ctx.studioId,input.bytes],c);
  await audit(ctx,'portfolio.upload.prepare',id,{},c);
  return {id};
 });
}
export async function receivePortfolioBytes(ctx:StudioContext,id:string,bytes:Buffer){
 const locked=await withStorageLock(ctx.studioId,id,async io=>{
 const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2 and deleted_at is null',[ctx.studioId,id],io);
 if(!item)fail(404,'NOT_FOUND','作品不存在或无法访问');
 if(bytes.length!==Number(item.expected_bytes)||createHash('sha256').update(bytes).digest('hex')!==item.sha256)fail(400,'FILE_MISMATCH','文件大小或内容与队列不一致，请重新选择原文件');
 if(['received','processing','ready'].includes(item.state))return {id,state:item.state,reused:true};
 if(item.state!=='pending')fail(409,'UPLOAD_STATE','请先重试或移除失败项');
 // File I/O happens outside the business transaction; no public object exists yet.
 await trackPut(ctx.studioId,id,item.source_key,io);
 await putObject(item.source_key,bytes,'application/octet-stream');
 await withTx(async c=>{
  await lockStudio(ctx,c,'admin');const [current]=await query('select * from portfolio_items where studio_id=$1 and id=$2 for update',[ctx.studioId,id],c);
  if(!current||current.deleted_at)fail(404,'NOT_FOUND','作品已被移除');
  if(current.state==='pending')await query("update portfolio_items set state='received',error=null,updated_at=now() where studio_id=$1 and id=$2",[ctx.studioId,id],c);
 },io);
 try{await (await getBoss()).send('media',{kind:'portfolio',studioId:ctx.studioId,id},{singletonKey:`portfolio:${ctx.studioId}:${id}`});}catch{/* durable received state is scanned by the worker */}
 return {id,state:'received',reused:false};
 });
 if(locked.busy)fail(409,'UPLOAD_BUSY','同一文件正在接收或处理，请稍后重试核对');return locked.value;
}
export async function updatePortfolio(ctx:StudioContext,id:string,input:{version:number;title:string;groupId:string;published:boolean;sortOrder:number}){
 return withTx(async c=>{await lockStudio(ctx,c,'admin');const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2 and deleted_at is null for update',[ctx.studioId,id],c);if(!item)fail(404,'NOT_FOUND','作品不存在');expectedVersion(item,input.version);const config=await getConfig(ctx.studioId,'portfolio',c);if(input.groupId!=='uncategorized'&&!(config.value as Portfolio).groups.some(g=>g.id===input.groupId))fail(409,'GROUP_CHANGED','作品组已变更，请重新选择');if(input.published&&item.state!=='ready')fail(409,'PREVIEW_NOT_READY','预览尚未就绪，完成处理后才能发布');const [out]=await query('update portfolio_items set title=$3,group_name=$4,published=$5,publish_requested=$5,sort_order=$6,version=version+1,updated_at=now() where studio_id=$1 and id=$2 returning *',[ctx.studioId,id,input.title,input.groupId,input.published,input.sortOrder],c);await audit(ctx,'portfolio.update',id,{},c);return portfolioDto(out);});
}
export async function removePortfolio(ctx:StudioContext,id:string,version:number){
 return withTx(async c=>{await lockStudio(ctx,c,'admin');const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2 and deleted_at is null for update',[ctx.studioId,id],c);if(!item)fail(404,'NOT_FOUND','作品不存在');expectedVersion(item,version);await query("update portfolio_items set deleted_at=now(),published=false,publish_requested=false,lease_token=null,version=version+1 where studio_id=$1 and id=$2",[ctx.studioId,id],c);await audit(ctx,'portfolio.remove',id,{},c);return {ok:true,retainedForHistory:true};});
}
export async function retryPortfolio(ctx:StudioContext,id:string){
 return withTx(async c=>{const studio=await lockStudio(ctx,c,'admin');const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2 and deleted_at is null for update',[ctx.studioId,id],c);if(!item)fail(404,'NOT_FOUND','作品不存在');if(item.state!=='failed')return {id,state:item.state};const additional=BigInt(item.expected_bytes)-BigInt(item.reserved_bytes);if(BigInt(studio.storage_bytes)+BigInt(studio.reserved_bytes)+additional>BigInt(studio.quota_bytes))fail(409,'STORAGE_QUOTA','存储额度不足，请联系所有者');await query('update studios set reserved_bytes=reserved_bytes+$2 where id=$1',[ctx.studioId,additional.toString()],c);await query("update portfolio_items set state='received',reserved_bytes=expected_bytes,error=null,processing_attempts=0,lease_token=null,updated_at=now() where studio_id=$1 and id=$2",[ctx.studioId,id],c);return {id,state:'received'};});
}
async function finalFailure(studioId:string,id:string,lease:string,message:string,io:Connection){await withTx(async c=>{await query('select id from studios where id=$1 for update',[studioId],c);const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2 and lease_token=$3 for update',[studioId,id,lease],c);if(!item||item.deleted_at||item.state==='ready')return;await query("update portfolio_items set state='failed',error=$4,lease_token=null,updated_at=now() where studio_id=$1 and id=$2 and lease_token=$3",[studioId,id,lease,message],c);},io);}
export async function processPortfolio(studioId:string,id:string){
 return withStorageLock(studioId,id,async io=>{
 const lease=randomUUID();const item:Record<string,any>|null=await withTx(async c=>{const [row]=await query('select * from portfolio_items where studio_id=$1 and id=$2 for update',[studioId,id],c);if(!row||row.deleted_at||['ready','failed','pending'].includes(row.state)||row.state==='processing'&&Date.now()-new Date(row.updated_at).getTime()<60000)return null;await query("update portfolio_items set state='processing',lease_token=$3,processing_attempts=processing_attempts+1,updated_at=now() where studio_id=$1 and id=$2",[studioId,id,lease],c);return {...row,processing_attempts:row.processing_attempts+1};},io);
 if(!item)return;
 try{
  const {bytes}=await getObject(item.source_key);
  if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new ApiError(400,'INVALID_IMAGE','文件内容校验失败，请移除此项后重新上传');
  let preview:Buffer;try{const image=sharp(bytes,{limitInputPixels:64_000_000,failOn:'error'});const meta=await image.metadata();if(!['jpeg','png','webp','avif','heif','tiff'].includes(meta.format??''))throw new Error('unsupported');preview=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer();}catch{throw new ApiError(400,'INVALID_IMAGE','图片无法完整解码或格式不支持，请移除后换一张JPEG、PNG、WebP、AVIF或TIFF图片');}
  const objectKey=mediaKey(studioId,`portfolio/${id}/${createHash('sha256').update(preview).digest('hex')}.webp`);
  const canStore=await withTx(async c=>{const [studio]=await query('select * from studios where id=$1 for update',[studioId],c);const [current]=await query('select * from portfolio_items where studio_id=$1 and id=$2 for update',[studioId,id],c);if(!current||current.deleted_at||current.lease_token!==lease)return false;const extra=BigInt(preview.length)-BigInt(current.preview_reserved_bytes);if(BigInt(studio.storage_bytes)+BigInt(studio.reserved_bytes)+extra>BigInt(studio.quota_bytes))throw new ApiError(409,'STORAGE_QUOTA','压缩所需临时空间不足，请联系所有者调整或移除失败项');await query('update studios set reserved_bytes=reserved_bytes+$2 where id=$1',[studioId,extra.toString()],c);await query('update portfolio_items set preview_reserved_bytes=$4,object_key=$5 where studio_id=$1 and id=$2 and lease_token=$3',[studioId,id,lease,preview.length,objectKey],c);return true;},io);
  if(!canStore)return;
  await trackPut(studioId,id,objectKey,io);
  await putObject(objectKey,preview,'image/webp');
  const committed=await withTx(async c=>{const [studio]=await query('select * from studios where id=$1 for update',[studioId],c);const [current]=await query('select * from portfolio_items where studio_id=$1 and id=$2 for update',[studioId,id],c);if(!current||current.deleted_at||current.lease_token!==lease||current.state==='ready')return false;const [member]=await query("select 1 from memberships m join users u on u.id=m.user_id where m.studio_id=$1 and m.user_id=$2 and m.role in('owner','admin') and not u.disabled and not u.force_password_change",[studioId,current.created_by],c);const published=studio.state==='active'&&!!member&&current.publish_requested;await query('update studios set reserved_bytes=reserved_bytes-$2,storage_bytes=storage_bytes+$3 where id=$1',[studioId,current.preview_reserved_bytes,preview.length],c);await query("update portfolio_items set state='ready',object_key=$4,preview_bytes=$5,preview_reserved_bytes=0,published=$6,error=null,lease_token=null,version=version+1,updated_at=now() where studio_id=$1 and id=$2 and lease_token=$3",[studioId,id,lease,objectKey,preview.length,published],c);return true;},io);
  if(committed)await cleanupPortfolioItemLocked(studioId,id,io).catch(()=>{});
 }catch(error){if(error instanceof ApiError||item.processing_attempts>=4){await finalFailure(studioId,id,lease,error instanceof ApiError?error.message:'图片处理暂时失败，请重试；已接收文件仍保留',io);return;}await query("update portfolio_items set state='received',error='处理暂时失败，正在自动重试',lease_token=null,updated_at=now() where studio_id=$1 and id=$2 and lease_token=$3",[studioId,id,lease],io);throw new Error('作品存储暂时不可用，等待有界重试');}
 });
}
export async function scanPortfolio(){const rows=await query("select studio_id,id from portfolio_items where deleted_at is null and (state='received' or state='processing' and updated_at<now()-interval '60 seconds') order by created_at limit 20");const boss=await getBoss();for(const row of rows)await boss.send('media',{kind:'portfolio',studioId:row.studio_id,id:row.id},{singletonKey:`portfolio:${row.studio_id}:${row.id}`});}
const sampleGroups=['portraits','couples','families','moments','commercial'];
export function sampleItems(slug:string,config:Portfolio){if(!config.showSamples)return [];return sampleGroups.flatMap((g,gi)=>config.groups.some(v=>v.id===g)?Array.from({length:5},(_,i)=>({id:`sample-${gi+1}-${i+1}`,title:`示例构图 ${gi+1} / ${i+1}`,groupId:g,sample:true,previewUrl:`/api/v1/public/${slug}/samples/sample-${gi+1}-${i+1}`})):[]);}
const sampleCache=new Map<string,Buffer>();
export async function sampleImage(id:string){if(!/^sample-[1-5]-[1-5]$/.test(id))fail(404,'NOT_FOUND','示例不存在');if(sampleCache.has(id))return sampleCache.get(id)!;const n=Number(id.at(-1)),group=Number(id.split('-')[1]);const colors=['#c5d4ca','#d6c9bb','#c4c5b6','#b8cbd1','#d9bfb4'];const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720"><rect width="960" height="720" fill="${colors[group-1]}"/><circle cx="${240+n*80}" cy="${190+n*12}" r="92" fill="#f7f3e8"/><path d="M0 720V530 Q${200+n*20} 210 480 520 T960 440V720" fill="#51675b"/><rect x="${200+n*30}" y="330" width="180" height="310" rx="90" fill="#dfd1c0"/></svg>`;const bytes=await sharp(Buffer.from(svg)).webp({quality:75}).toBuffer();sampleCache.set(id,bytes);return bytes;}

export async function cleanupPortfolioItem(studioId:string,id:string){return withStorageLock(studioId,id,io=>cleanupPortfolioItemLocked(studioId,id,io));}
async function cleanupPortfolioItemLocked(studioId:string,id:string,io:Connection){
 const [item]=await query('select * from portfolio_items where studio_id=$1 and id=$2',[studioId,id],io);
 if(!item?.source_key||!(item.state==='ready'||item.deleted_at&&Date.now()-new Date(item.deleted_at).getTime()>30000))return;
 if(await backupProtects(item.source_key,io)||item.state!=='ready'&&await backupProtects(item.object_key,io))return;
 await removeObject(item.source_key);
 if(item.state!=='ready'&&Number(item.preview_reserved_bytes)>0)await removeObject(item.object_key);
 await withTx(async c=>{await query('select id from studios where id=$1 for update',[studioId],c);const [current]=await query('select * from portfolio_items where studio_id=$1 and id=$2 for update',[studioId,id],c);if(!current||current.source_key!==item.source_key||current.state!=='ready'&&!current.deleted_at)return;const released=BigInt(current.reserved_bytes)+BigInt(current.preview_reserved_bytes);await query('update studios set reserved_bytes=reserved_bytes-$2 where id=$1',[studioId,released.toString()],c);await query('update portfolio_items set source_key=null,reserved_bytes=0,preview_reserved_bytes=0 where studio_id=$1 and id=$2',[studioId,id],c);},io);
}
export async function scanPortfolioCleanup(){const rows=await query("select studio_id,id from portfolio_items where source_key is not null and (state='ready' or deleted_at<now()-interval '30 seconds') limit 20");for(const row of rows)try{await cleanupPortfolioItem(row.studio_id,row.id);}catch{/* reservation remains until storage confirms cleanup */}}
