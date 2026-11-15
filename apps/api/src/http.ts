import type {FastifyInstance,FastifyRequest,FastifyReply,HTTPMethods} from 'fastify';
import {normalize} from '@proofroom/db';
import {z,fail,uuid} from '@proofroom/contracts';
import {currentStaff,context} from '@proofroom/domain/auth';
export const sessionCookie='proofroom_session';
export function setSession(reply:FastifyReply,token:string){reply.setCookie(sessionCookie,token,{httpOnly:true,sameSite:'lax',secure:process.env.APP_ORIGIN?.startsWith('https:')??false,path:'/',maxAge:30*86400});}
export async function staff(req:FastifyRequest,allowPasswordChange=false){const user=await currentStaff(req.cookies[sessionCookie]);if(user.force_password_change&&!allowPasswordChange)fail(403,'PASSWORD_CHANGE_REQUIRED','请先完成密码修改');return user;}
export async function ctx(req:FastifyRequest,min:'member'|'admin'|'owner'='member',write=false){return context(await staff(req),uuid.parse((req.params as {studioId:string}).studioId),min,write);}
export const respond=(req:FastifyRequest,data:unknown)=>({data:normalize(data),error:null,requestId:req.id});
export function jsonRoute(app:FastifyInstance,method:HTTPMethods,url:string,input:z.ZodType|undefined,handler:(req:FastifyRequest,reply:FastifyReply,body:any)=>Promise<unknown>){
 const params:Record<string,object>={};
 for(const match of url.matchAll(/:([A-Za-z]+)/g))params[match[1]]=match[1]==='id'||match[1].endsWith('Id')?{type:'string',format:'uuid'}:{type:'string',maxLength:200};
 app.route({method,url,schema:{...(input?{body:z.toJSONSchema(input,{target:'draft-7'})}:{}),...(Object.keys(params).length?{params:{type:'object',properties:params,required:Object.keys(params),additionalProperties:false}}:{}),tags:['Business API']},handler:async(req,reply)=>respond(req,await handler(req,reply,input?input.parse(req.body):undefined))});
}
