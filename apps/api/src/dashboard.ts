import type {FastifyInstance} from 'fastify';
import {z} from '@proofroom/contracts';
import {projectQuery,visibilityInput} from '@proofroom/contracts/orders';
import {listProjects,dashboard,listHistory,restoreVisibility} from '@proofroom/domain/dashboard';
import {ctx,jsonRoute} from './http.js';
export function registerDashboard(app:FastifyInstance){const root='/api/v1/studios/:studioId';
 jsonRoute(app,'GET',root+'/dashboard',undefined,async req=>dashboard(await ctx(req)));
 jsonRoute(app,'GET',root+'/projects',undefined,async req=>listProjects(await ctx(req),projectQuery.parse(req.query)));
 jsonRoute(app,'GET',root+'/history',undefined,async req=>{const q=z.strictObject({q:z.string().max(100).default(''),cursor:z.string().max(512).optional()}).parse(req.query);return listHistory(await ctx(req),q.q,q.cursor);});
 for(const [segment,kind]of [['projects','project'],['inquiries','inquiry']]as const)jsonRoute(app,'POST',root+`/${segment}/:id/visibility`,visibilityInput,async(req,reply,b)=>restoreVisibility(await ctx(req,'member',true),(req.params as any).id,b.version,kind));
}
