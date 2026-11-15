import type {FastifyInstance} from 'fastify';
import {z,pin,uuid,fail} from '@proofroom/contracts';
import {photoQuery,markInput,commentInput,editCommentInput,removeCommentInput,completeInput,resetPinInput,type PhotoActor} from '@proofroom/contracts/selections';
import {requireClient,clientOverview,verifyClientPin,resetProjectPin} from '@proofroom/domain/client-access';
import {changeMark,addComment,editComment,completeSelection} from '@proofroom/domain/selections';
import {photoPage,photoObject} from '@proofroom/domain/photos';
import {sampleImage} from '@proofroom/domain/portfolio';
import {query} from '@proofroom/db';
import {actorProject} from '@proofroom/domain/selections';
import {getObject} from '@proofroom/storage';
import {ctx,jsonRoute} from './http.js';
export function registerClient(app:FastifyInstance){const root='/api/v1/client/:token',staff='/api/v1/studios/:studioId/projects/:id';
 const customer=async(req:any)=>{const p=req.params;const scope=await requireClient(p.token,req.cookies.proofroom_client);return {actor:{kind:'client',context:scope.context}as PhotoActor,orderId:scope.context.orderId,token:p.token};};
 const worker=async(req:any)=>({actor:{kind:'studio',context:await ctx(req)}as PhotoActor,orderId:req.params.id,token:null});
 jsonRoute(app,'GET',root,undefined,async req=>clientOverview((req.params as any).token,req.cookies.proofroom_client));
 jsonRoute(app,'POST',root+'/pin',z.strictObject({pin}),async(req,reply,b)=>{const token=(req.params as any).token,session=await verifyClientPin(token,b.pin,req.ip);reply.setCookie('proofroom_client',session,{httpOnly:true,sameSite:'lax',secure:process.env.APP_ORIGIN?.startsWith('https:')??false,path:`/api/v1/client/${token}`,maxAge:30*86400});return {verified:true};});
 app.get(root+'/references/:reference',async(req,reply)=>{const scope=await customer(req),p=await actorProject(scope.actor,scope.orderId),reference=(req.params as any).reference;if(!p.requirement_snapshot.snapshot.references.some((r:any)=>r.id===reference))fail(404,'NOT_FOUND','参考作品不可访问');if(reference.startsWith('sample-'))return reply.type('image/webp').send(await sampleImage(reference));uuid.parse(reference);const [item]=await query("select object_key from portfolio_items where studio_id=$1 and id=$2 and state='ready'",[p.studio_id,reference]);if(!item)fail(404,'NOT_FOUND','参考作品预览暂不可用');return reply.type('image/webp').send((await getObject(item.object_key)).bytes);});
 jsonRoute(app,'POST',root+'/complete',completeInput,async(req,reply,b)=>{const scope=await customer(req);await completeSelection((scope.actor as Extract<PhotoActor,{kind:'client'}>).context,b);const page=await photoPage(scope.actor,scope.orderId,{role:'original',q:''},undefined,`/api/v1/client/${scope.token}`);return {workflowStage:page.workflowStage,summary:page.summary};});
 jsonRoute(app,'POST',staff+'/pin',resetPinInput,async(req,reply,b)=>resetProjectPin(await ctx(req,'member',true),(req.params as any).id,b));
 for(const [base,scopeFor]of [[root,customer],[staff,worker]]as const){
 const view=async(scope:Awaited<ReturnType<typeof customer>>|Awaited<ReturnType<typeof worker>>,photoId?:string)=>photoPage(scope.actor,scope.orderId,{role:'original',q:''},photoId,scope.token?`/api/v1/client/${scope.token}`:undefined);
 jsonRoute(app,'GET',base+'/photos',undefined,async req=>{const scope=await scopeFor(req);return photoPage(scope.actor,scope.orderId,photoQuery.parse(req.query),undefined,scope.token?`/api/v1/client/${scope.token}`:undefined);});
 jsonRoute(app,'POST',base+'/photos/:photoId/mark',markInput,async(req,reply,b)=>{const scope=await scopeFor(req);const mutation=await changeMark(scope.actor,scope.orderId,(req.params as any).photoId,b);return {...await view(scope,(req.params as any).photoId),mutation};});
 jsonRoute(app,'POST',base+'/photos/:photoId/comments',commentInput,async(req,reply,b)=>{const scope=await scopeFor(req);const mutation=await addComment(scope.actor,scope.orderId,(req.params as any).photoId,b);return {...await view(scope,(req.params as any).photoId),mutation};});
 jsonRoute(app,'PATCH',base+'/photos/:photoId/comments/:commentId',editCommentInput,async(req,reply,b)=>{const scope=await scopeFor(req),p=req.params as any;const mutation=await editComment(scope.actor,scope.orderId,p.photoId,p.commentId,b);return {...await view(scope,p.photoId),mutation};});
 jsonRoute(app,'POST',base+'/photos/:photoId/comments/:commentId/remove',removeCommentInput,async(req,reply,b)=>{const scope=await scopeFor(req),p=req.params as any;const mutation=await editComment(scope.actor,scope.orderId,p.photoId,p.commentId,b,true);return {...await view(scope,p.photoId),mutation};});
 for(const kind of ['preview','thumbnail']as const)app.get(base+`/photos/:photoId/${kind}`,async(req,reply)=>{uuid.parse((req.params as any).photoId);if((req.params as any).id)uuid.parse((req.params as any).id);const scope=await scopeFor(req),key=await photoObject(scope.actor,scope.orderId,(req.params as any).photoId,kind);return reply.type('image/webp').send((await getObject(key)).bytes);});
 }
}
