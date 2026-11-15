import {ApiError,type ApiErrorBody} from './index';
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const controller=new AbortController();let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},20000);const external=options.signal;const abort=()=>controller.abort();if(external?.aborted)abort();external?.addEventListener('abort',abort,{once:true});
 try{
 const response=await fetch(`/api/v1${path}`,{...options,credentials:'same-origin',signal:controller.signal,headers:{...(options.body&&typeof options.body==='string'?{'content-type':'application/json'}:{}),...options.headers}});
 if(typeof window!=='undefined'&&[401,403,404].includes(response.status)&&/^\/(?:studios|me|platform)(?:\/|$)/.test(path))window.dispatchEvent(new Event('proofroom:session-check'));
 let body:{data:T;error?:ApiErrorBody;requestId?:string};try{body=await response.json();if(!body||typeof body!=='object'||!('data'in body)||!('error'in body))throw new Error('envelope');}catch(error){if(controller.signal.aborted)throw error;throw new ApiError(response.status||502,'INVALID_RESPONSE','服务返回的内容不完整，请稍后重试',true);}
 if(!response.ok||body.error){const error=body.error;throw new ApiError(response.status,error?.code??'REQUEST_FAILED',error?.message??'请求未成功，请重试',error?.retryable??response.status>=500,error?.fields,error?.retryAfter,body.requestId);}
 return body.data;
 }catch(error){if(error instanceof ApiError)throw error;if(external?.aborted)throw new ApiError(0,'REQUEST_CANCELLED','本次读取已取消',false);if(timedOut)throw new ApiError(0,'TIMEOUT','读取或提交超过20秒，请重试核对；未保存的内容仍保留',true);throw new ApiError(0,'NETWORK','连接中断，请检查网络后重试；未保存的内容仍保留',true);}finally{clearTimeout(timer);external?.removeEventListener('abort',abort);}
}
export const post=<T>(path:string,body:unknown={})=>api<T>(path,{method:'POST',body:JSON.stringify(body)});
