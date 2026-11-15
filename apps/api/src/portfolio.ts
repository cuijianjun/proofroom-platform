import {availableStudio} from '@proofroom/domain/client-access';
import type {FastifyInstance} from 'fastify';
import {z,version,fail,uuid} from '@proofroom/contracts';
import {portfolioUpload,portfolioPatch} from '@proofroom/contracts/presales';
import {query} from '@proofroom/db';
import {getObject} from '@proofroom/storage';
import {createPortfolioUpload,receivePortfolioBytes,listPortfolio,updatePortfolio,removePortfolio,retryPortfolio} from '@proofroom/domain/portfolio';
import {ctx,jsonRoute,respond} from './http.js';
export function registerPortfolio(app:FastifyInstance){
 const root='/api/v1/studios/:studioId/portfolio';
 jsonRoute(app,'GET',root,undefined,async req=>listPortfolio(await ctx(req)));
 jsonRoute(app,'POST',root+'/uploads',portfolioUpload,async(req,reply,b)=>createPortfolioUpload(await ctx(req,'admin',true),b));
 jsonRoute(app,'PATCH',root+'/:id',portfolioPatch,async(req,reply,b)=>updatePortfolio(await ctx(req,'admin',true),(req.params as any).id,b));
 jsonRoute(app,'POST',root+'/:id/remove',z.strictObject({version}),async(req,reply,b)=>removePortfolio(await ctx(req,'admin',true),(req.params as any).id,b.version));
 jsonRoute(app,'POST',root+'/:id/retry',z.strictObject({}),async req=>retryPortfolio(await ctx(req,'admin',true),(req.params as any).id));
 app.addContentTypeParser('application/octet-stream',{parseAs:'buffer',bodyLimit:100*1024*1024},(req,body,done)=>done(null,body));
 app.put(root+'/:id/bytes',{bodyLimit:20*1024*1024,onRequest:async req=>{uuid.parse((req.params as any).id);await ctx(req,'admin',true);}},async(req,reply)=>{const data=await receivePortfolioBytes(await ctx(req,'admin',true),(req.params as any).id,req.body as Buffer);return reply.code(202).send(respond(req,data));});
 app.get(root+'/:id/preview',async(req,reply)=>{uuid.parse((req.params as any).id);const c=await ctx(req);availableStudio(c.state);const [item]=await query("select object_key from portfolio_items where studio_id=$1 and id=$2 and state='ready' and deleted_at is null",[c.studioId,(req.params as any).id]);if(!item)fail(404,'PREVIEW_NOT_READY','压缩预览尚未就绪或不可访问');const object=await getObject(item.object_key);return reply.type('image/webp').send(object.bytes);});
}
