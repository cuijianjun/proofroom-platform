import type {FastifyInstance} from 'fastify';
import {renewProject,correctStage} from '@proofroom/contracts/delivery';
import {renewDelivery,correctProjectStage} from '@proofroom/domain/lifecycle';
import {getProject} from '@proofroom/domain/orders';
import {ctx,jsonRoute} from './http.js';
export function registerLifecycle(app:FastifyInstance){const root='/api/v1/studios/:studioId/projects/:id';jsonRoute(app,'POST',root+'/renew',renewProject,async(req,reply,b)=>{const c=await ctx(req,'member',true),id=(req.params as any).id;await renewDelivery(c,id,b);return getProject(await ctx(req),id);});jsonRoute(app,'POST',root+'/stage-correction',correctStage,async(req,reply,b)=>{const c=await ctx(req,'owner',true),id=(req.params as any).id;await correctProjectStage(c,id,b);return getProject(await ctx(req),id);});}
