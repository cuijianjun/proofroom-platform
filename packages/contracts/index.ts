import {z} from 'zod';
z.config(z.locales.zhCN());
export {z};
export const uuid=z.uuid();
export const role=z.enum(['owner','admin','member']);
export const stage=z.enum(['P1','P2','P3','P4','archived']);
export const pin=z.string().regex(/^\d{4}$/,'请输入四位数字访问码');
export const key=z.string().min(8).max(120);
export const version=z.number().int().positive();
export type Role=z.infer<typeof role>;
export type Stage=z.infer<typeof stage>;
export type ApiErrorBody={code:string;message:string;retryable:boolean;fields?:Record<string,string>;retryAfter?:number};
export class ApiError extends Error {constructor(public status:number,public code:string,message:string,public retryable=false,public fields?:Record<string,string>,public retryAfter?:number,public requestId?:string){super(message);}}
export function fail(status:number,code:string,message:string,retryable=false):never{throw new ApiError(status,code,message,retryable);}
export const registerInput=z.strictObject({username:z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/,'用户名仅支持字母、数字、下划线或短横线'),email:z.email().max(200),name:z.string().trim().min(1).max(80),password:z.string().min(10,'密码至少10位').max(128),studioName:z.string().trim().min(1).max(80),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,'工作室地址用3～40个小写字母、数字或短横线')});
export const loginInput=z.strictObject({login:z.string().trim().min(1).max(200),password:z.string().min(1).max(128),mfaCode:z.string().max(100).optional()});
export type Staff={id:string;name:string;username:string;email:string;is_platform_admin:boolean;force_password_change:boolean;mfa_enabled:boolean};
export type Studio={id:string;slug:string;name:string;role:Role;state:'active'|'readonly'|'suspended';state_reason:string;version:number;seat_limit:number;quota_bytes:string;storage_bytes:string;reserved_bytes:string};
export type Session={user:Staff;studios:Studio[]};
export const stageNames:Record<Stage,string>={P1:'等待原片',P2:'等待选片',P3:'精修处理中',P4:'已交付',archived:'已归档'};
export const invitedRegisterInput=registerInput.omit({studioName:true,slug:true}).extend({invitationToken:z.string().min(20).max(100)});
export function canonicalJson(value:unknown):string{const sort=(v:any):any=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'&&!(v instanceof Date)?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,sort(v[k])])):v;return JSON.stringify(sort(value));}
