import type {FastifyInstance} from 'fastify';
import {uuid,fail} from '@proofroom/contracts';
import {prepareBatch,removeBatchItem,replaceBatchItem} from '@proofroom/contracts/media';
import {prepareUpload,getUploadBatch,listUploadBatches,receiveUpload,checkUploadStage,removeUploadItem,retryUploadItem,replaceUploadItem} from '@proofroom/domain/uploads';
import {checkUploadGrant} from '@proofroom/domain/upload-grants';
import {project} from '@proofroom/domain/common';
import {query} from '@proofroom/db';
import {ctx,jsonRoute,respond} from './http.js';
export function registerUploads(app:FastifyInstance){const root='/api/v1/studios/:studioId/projects/:id/upload-batches';
 jsonRoute(app,'POST',root,prepareBatch,async(req,reply,b)=>prepareUpload(await ctx(req,'member',true),(req.params as any).id,b));
 jsonRoute(app,'GET',root,undefined,async req=>listUploadBatches(await ctx(req),(req.params as any).id));
 jsonRoute(app,'GET',root+'/:batchId',undefined,async req=>{const p=req.params as any;return getUploadBatch(await ctx(req),p.id,p.batchId);});
 for(const [name,command]of [['remove',removeUploadItem],['retry',retryUploadItem]]as const)jsonRoute(app,'POST',root+`/:batchId/items/:itemId/${name}`,removeBatchItem,async(req,reply,b)=>{const p=req.params as any;await command(await ctx(req,'member',true),p.id,p.batchId,p.itemId,b);return getUploadBatch(await ctx(req),p.id,p.batchId);});
 jsonRoute(app,'POST',root+'/:batchId/items/:itemId/replace',replaceBatchItem,async(req,reply,b)=>{const p=req.params as any,c=await ctx(req,'member',true);const result=await replaceUploadItem(c,p.id,p.batchId,p.itemId,b);return {replacementItemId:result.id,batch:await getUploadBatch(c,p.id,p.batchId)};});
 app.put(root+'/:batchId/items/:itemId/bytes',{bodyLimit:100*1024*1024,onRequest:async req=>{const p=req.params as any;for(const name of ['id','batchId','itemId'])uuid.parse(p[name]);const c=await ctx(req,'member',true);const [item]=await query('select i.expected_sha256,b.role from upload_items i join upload_batches b on b.studio_id=i.studio_id and b.id=i.batch_id where i.studio_id=$1 and b.order_id=$2 and b.id=$3 and i.id=$4',[c.studioId,p.id,p.batchId,p.itemId]);if(!item)fail(404,'NOT_FOUND','文件不属于当前项目批次');checkUploadStage(await project(c,p.id),item.role);checkUploadGrant(req.headers['x-upload-grant'] as string|undefined,{studioId:c.studioId,orderId:p.id,batchId:p.batchId,itemId:p.itemId,sha256:item.expected_sha256});}},async(req,reply)=>{const p=req.params as any;return reply.code(202).send(respond(req,await receiveUpload(await ctx(req,'member',true),p.id,p.batchId,p.itemId,req.body as Buffer,req.headers['x-upload-grant'] as string|undefined)));});
}
