import {availableStudio} from '@proofroom/domain/client-access';
import type {FastifyInstance} from 'fastify';
import {z,uuid,version,key,fail} from '@proofroom/contracts';
import {inquiryInput} from '@proofroom/contracts/presales';
import {query} from '@proofroom/db';
import {getObject} from '@proofroom/storage';
import {publicConfig,publicStudio,submitInquiry,recoverInquiry,receipt,listInquiries,getInquiry,changeInquiryStatus} from '@proofroom/domain/inquiries';
import {sampleImage,sampleItems} from '@proofroom/domain/portfolio';
import {getConfig} from '@proofroom/domain/config';
import {hashToken,randomToken} from '@proofroom/domain/tokens';
import {ctx,jsonRoute} from './http.js';
export function registerPresales(app:FastifyInstance){
 const pub='/api/v1/public/:slug';
 jsonRoute(app,'GET',pub+'/config',undefined,async(req,reply)=>{const slug=(req.params as any).slug;const result=await publicConfig(slug);if(!/^[A-Za-z0-9_-]{43}$/.test(req.cookies.proofroom_inquiry??''))reply.setCookie('proofroom_inquiry',randomToken(32),{httpOnly:true,sameSite:'lax',secure:process.env.APP_ORIGIN?.startsWith('https:')??false,path:`/api/v1/public/${slug}`,maxAge:30*86400});return result;});
 jsonRoute(app,'POST',pub+'/inquiries',inquiryInput,async(req,reply,b)=>submitInquiry((req.params as any).slug,b,req.ip,req.cookies.proofroom_inquiry));
 jsonRoute(app,'POST',pub+'/inquiries/status',z.strictObject({submissionKey:key}),async(req,reply,b)=>recoverInquiry((req.params as any).slug,b.submissionKey,req.ip,req.cookies.proofroom_inquiry));
 jsonRoute(app,'GET',pub+'/receipts/:token',undefined,async req=>receipt((req.params as any).slug,(req.params as any).token));
 app.get(pub+'/samples/:sample',async(req,reply)=>{const p=req.params as any;const studio=await publicStudio(p.slug);const config=await getConfig(studio.id,'portfolio');if(!sampleItems(p.slug,config.value).some(v=>v.id===p.sample))fail(404,'NOT_FOUND','示例作品不存在');return reply.type('image/webp').send(await sampleImage(p.sample));});
 app.get(pub+'/portfolio/:id/preview',async(req,reply)=>{const p=req.params as any;uuid.parse(p.id);const studio=await publicStudio(p.slug);const [item]=await query("select object_key from portfolio_items where studio_id=$1 and id=$2 and published and state='ready' and deleted_at is null",[studio.id,p.id]);if(!item)fail(404,'NOT_FOUND','作品不存在或尚未发布');return reply.type('image/webp').send((await getObject(item.object_key)).bytes);});
 app.get(pub+'/receipts/:token/references/:reference',async(req,reply)=>{const p=req.params as any;const studio=await publicStudio(p.slug);const [row]=await query('select snapshot from inquiries where studio_id=$1 and receipt_hash=$2',[studio.id,hashToken(p.token)]);if(!row||!row.snapshot.references?.some((r:any)=>r.id===p.reference))fail(404,'NOT_FOUND','参考图不可访问');return referenceImage(studio.id,p.reference,reply);});
 const staff='/api/v1/studios/:studioId/inquiries';
 jsonRoute(app,'GET',staff,undefined,async req=>{const q=z.strictObject({status:z.enum(['pending','confirmed','ignored']).default('pending'),cursor:z.string().max(512).optional()}).parse(req.query);return listInquiries(await ctx(req),q.status,q.cursor);});
 jsonRoute(app,'GET',staff+'/:id',undefined,async req=>getInquiry(await ctx(req),(req.params as any).id));
 jsonRoute(app,'POST',staff+'/:id/status',z.strictObject({version,status:z.enum(['pending','ignored'])}),async(req,reply,b)=>changeInquiryStatus(await ctx(req,'member',true),(req.params as any).id,b.version,b.status));
 app.get(staff+'/:id/references/:reference',async(req,reply)=>{const c=await ctx(req);availableStudio(c.state);const p=req.params as any;uuid.parse(p.id);const [row]=await query('select snapshot from inquiries where studio_id=$1 and id=$2',[c.studioId,p.id]);if(!row||!row.snapshot.references?.some((r:any)=>r.id===p.reference))fail(404,'NOT_FOUND','参考图不可访问');return referenceImage(c.studioId,p.reference,reply);});
}
async function referenceImage(studioId:string,id:string,reply:any){if(id.startsWith('sample-'))return reply.type('image/webp').send(await sampleImage(id));uuid.parse(id);const [asset]=await query("select object_key from portfolio_items where studio_id=$1 and id=$2 and state='ready'",[studioId,id]);if(!asset)fail(404,'NOT_FOUND','历史参考预览不可用');return reply.type('image/webp').send((await getObject(asset.object_key)).bytes);}
