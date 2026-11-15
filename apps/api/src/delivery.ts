import type {FastifyInstance} from 'fastify';
import {deliveryMapping} from '@proofroom/contracts/delivery';
import {getDelivery,saveDeliveryMappings} from '@proofroom/domain/delivery';
import {ctx,jsonRoute} from './http.js';
export function registerDelivery(app:FastifyInstance){const root='/api/v1/studios/:studioId/projects/:id/delivery';jsonRoute(app,'GET',root,undefined,async req=>getDelivery(await ctx(req),(req.params as any).id));jsonRoute(app,'POST',root,deliveryMapping,async(req,reply,b)=>{const c=await ctx(req,'member',true),id=(req.params as any).id;await saveDeliveryMappings(c,id,b);return getDelivery(await ctx(req),id);});}
