// Deterministic local S3 substitute, not a production object-store implementation.
import S3rver from 's3rver';
import Account from 's3rver/lib/models/account.js';
import router from 's3rver/lib/routes.js';
import S3Error from 's3rver/lib/models/error.js';
import dotenv from 'dotenv';
import path from 'node:path';
import {readdir,readFile,stat,rm,mkdir,mkdtemp} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
dotenv.config({path:path.join(root,'.env'),quiet:true});
// S3rver accepts V4 AccessKeyId without verifying its signature. Verify the
// standard canonical request ourselves, before any of its routes, including
// local multipart extensions. This endpoint accepts header-authenticated SDK
// calls only; browser presigned access is deliberately unavailable.
const hash=value=>createHash('sha256').update(value).digest('hex');
const hmac=(key,value)=>createHmac('sha256',key).update(value).digest();
const encode=value=>encodeURIComponent(value).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
function validSignature(ctx){
 const match=/^AWS4-HMAC-SHA256 Credential=([^/]+)\/(\d{8})\/([^/]+)\/s3\/aws4_request, SignedHeaders=([a-z0-9;-]+), Signature=([a-f0-9]{64})$/.exec(ctx.get('authorization'));
 if(!match||match[1]!==process.env.S3_ACCESS_KEY)return false;
 const [,access,date,region,signed,signature]=match;void access;
 const names=signed.split(';');if(names.join(';')!==[...new Set(names)].sort().join(';')||!['host','x-amz-date','x-amz-content-sha256'].every(n=>names.includes(n)))return false;
 const stamp=ctx.get('x-amz-date'),payload=ctx.get('x-amz-content-sha256');
 if(!/^\d{8}T\d{6}Z$/.test(stamp)||stamp.slice(0,8)!==date||!(/^[a-f0-9]{64}$/.test(payload)||payload==='UNSIGNED-PAYLOAD'))return false;
 const at=Date.parse(stamp.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z'));if(!Number.isFinite(at)||Math.abs(Date.now()-at)>15*60000)return false;
 const url=new URL(ctx.originalUrl,'http://local'),pairs=[...url.searchParams].map(([k,v])=>[encode(k),encode(v)]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:a[1]<b[1]?-1:a[1]>b[1]?1:0),headers=names.map(name=>`${name}:${ctx.get(name).trim().replace(/\s+/g,' ')}\n`).join('');
 const canonical=[ctx.method,url.pathname,pairs.map(([k,v])=>`${k}=${v}`).join('&'),headers,signed,payload].join('\n'),scope=`${date}/${region}/s3/aws4_request`,stringToSign=['AWS4-HMAC-SHA256',stamp,scope,hash(canonical)].join('\n');
 const signingKey=hmac(hmac(hmac(hmac('AWS4'+process.env.S3_SECRET_KEY,date),region),'s3'),'aws4_request'),expected=hmac(signingKey,stringToSign);return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}
const scratch='/tmp/proofroom-s3-requests';await mkdir(scratch,{recursive:true,mode:0o700});
for(const entry of await readdir(scratch,{withFileTypes:true})){if(entry.isDirectory()&&entry.name.startsWith('request-')){const target=path.join(scratch,entry.name);if(Date.now()-(await stat(target)).mtimeMs>24*3600000)await rm(target,{recursive:true,force:true});}}
async function verifiedBody(ctx,next){
 const expected=ctx.get('x-amz-content-sha256');
 // File streams use the SDK's explicitly signed UNSIGNED-PAYLOAD mode. All
 // declared hashes must match actual bytes before any object/XML side effect.
 if(expected==='UNSIGNED-PAYLOAD')return next();
 if(!ctx.get('transfer-encoding')&&Number(ctx.get('content-length')||0)===0){if(expected!==hash('')){ctx.status=403;ctx.body='Payload hash mismatch';return;}return next();}
 const directory=await mkdtemp(path.join(scratch,'request-')),file=path.join(directory,'body'),digest=createHash('sha256'),original=ctx.req;let replay;
 try{await pipeline(original,new Transform({transform(chunk,encoding,done){digest.update(chunk);done(null,chunk);}}),createWriteStream(file,{mode:0o600}));if(digest.digest('hex')!==expected){ctx.status=403;ctx.body='Payload hash mismatch';return;}
  replay=createReadStream(file);Object.assign(replay,{headers:original.headers,method:original.method,url:original.url,socket:original.socket,httpVersion:original.httpVersion});ctx.req=ctx.request.req=replay;await next();
 }finally{ctx.req=ctx.request.req=original;replay?.destroy();await rm(directory,{recursive:true,force:true});}
}
Account.DUMMY_ACCOUNT.revokeAccessKey('S3RVER');
Account.DUMMY_ACCOUNT.createKeyPair(process.env.S3_ACCESS_KEY,process.env.S3_SECRET_KEY);
// S3rver 3.7.1 implements multipart creation/parts/completion but omits list and
// abort. Extend the local substitute after its existing signature middleware;
// production adapters still use the standard S3 API, never this filesystem.
router.use('/:bucket/:key*',async(ctx,next)=>{
 const list=ctx.method==='GET'&&!ctx.params.key&&'uploads'in ctx.query,abort=ctx.method==='DELETE'&&ctx.params.key&&'uploadId'in ctx.query;if(!list&&!abort)return next();const bucket=ctx.params.bucket;if(!['proofroom-local','proofroom-test'].includes(bucket)||!await ctx.store.getBucket(bucket))throw new S3Error('NoSuchBucket');const directory=ctx.store.getResourcePath(bucket,undefined,'uploads');
 if(abort){const id=ctx.query.uploadId;if(!/^[a-f0-9]{32}$/.test(id))throw new S3Error('NoSuchUpload');const upload=path.join(directory,id),key=await readFile(path.join(upload,'key'),'utf8').catch(()=>null);if(key!==ctx.params.key)throw new S3Error('NoSuchUpload');await rm(upload,{recursive:true,force:true});ctx.status=204;return;}
 const folders=await readdir(directory,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;}),uploads=[];for(const folder of folders){if(!folder.isDirectory()||!/^[a-f0-9]{32}$/.test(folder.name))continue;const dir=path.join(directory,folder.name),key=await readFile(path.join(dir,'key'),'utf8').catch(()=>null);if(key===null||!key.startsWith(ctx.query.prefix??''))continue;const info=await stat(dir);uploads.push({Key:key,UploadId:folder.name,Initiated:info.birthtime.toISOString(),StorageClass:'STANDARD'});}uploads.sort((a,b)=>a.Key<b.Key?-1:a.Key>b.Key?1:a.UploadId.localeCompare(b.UploadId));const marker=ctx.query['key-marker']??'',uploadMarker=ctx.query['upload-id-marker']??'',filtered=uploads.filter(u=>u.Key>marker||u.Key===marker&&(!uploadMarker||u.UploadId>uploadMarker)),requested=Number(ctx.query['max-uploads']??1000);if(!Number.isInteger(requested)||requested<1)throw new S3Error('InvalidArgument');const page=filtered.slice(0,Math.min(1000,requested)),truncated=filtered.length>page.length,last=page.at(-1);ctx.body={ListMultipartUploadsResult:{'@':{xmlns:'http://s3.amazonaws.com/doc/2006-03-01/'},Bucket:bucket,Prefix:ctx.query.prefix??'',KeyMarker:marker,UploadIdMarker:uploadMarker,NextKeyMarker:truncated?last?.Key:undefined,NextUploadIdMarker:truncated?last?.UploadId:undefined,MaxUploads:Math.min(1000,requested),IsTruncated:truncated,Upload:page}};
});
const multipart=router.stack.pop(),authentication=router.stack.findIndex(layer=>layer.stack.some(fn=>fn.name==='authentication'));if(authentication<0)throw new Error('本地存储签名中间件无法确认');router.stack.splice(authentication+1,0,multipart);
const s3=new S3rver({address:'127.0.0.1',port:18190,silent:true,directory:path.join(root,'.local/storage'),allowMismatchedSignatures:false,configureBuckets:[{name:'proofroom-local'},{name:'proofroom-test'}]});
s3.middleware.unshift(async(ctx,next)=>{ctx.set('x-proofroom-local-s3','1');if(ctx.path==='/__proofroom_local_health'){ctx.body='ok';return;}if(!validSignature(ctx)){ctx.status=403;ctx.body='Forbidden';return;}
 // Browser form POST is unused: never reach the legacy Busboy/Dicer parser.
 // S3 multipart uses initiation, binary part PUTs and XML completion instead.
 if(ctx.method==='POST'&&ctx.is('multipart/form-data')){ctx.status=415;ctx.body='Browser form POST is not supported';return;}
 return verifiedBody(ctx,next);});
await s3.run();process.stdout.write('Local S3 substitute http://127.0.0.1:18190 (authenticated, loopback only)\n');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await s3.close();process.exit(0);});
