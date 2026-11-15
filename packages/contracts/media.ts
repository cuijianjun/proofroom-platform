import {z,key,version} from './index';
export const mediaFile=z.strictObject({filename:z.string().min(1).max(300).refine(v=>v!=='.'&&v!=='..'&&!/[\\/\u0000-\u001f\u007f]/.test(v),'文件名不能包含路径或控制字符'),bytes:z.number().int().min(1).max(100*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
export const prepareBatch=z.strictObject({key,role:z.enum(['original','retouched']),files:z.array(mediaFile).min(1).max(500)}).superRefine((v,c)=>{const fingerprints=v.files.map(f=>`${f.filename}:${f.bytes}:${f.sha256}`);if(new Set(fingerprints).size!==fingerprints.length)c.addIssue({code:'custom',message:'同一批次不能重复选择完全相同的文件',path:['files']});});
export const removeBatchItem=z.strictObject({key,version});
export const replaceBatchItem=z.strictObject({key,version,file:mediaFile});
export type MediaFile=z.infer<typeof mediaFile>;
export type PrepareBatch=z.infer<typeof prepareBatch>;
export type BatchItem={id:string;filename:string;expectedBytes:number;sha256:string;state:'pending'|'received'|'processing'|'ready'|'failed'|'removed';version:number;error:string|null;photoId:string|null;uploadGrant:string|null};
export type UploadBatch={id:string|null;role:'original'|'retouched';state:string;version:number;expectedCount:number|null;historyCount:number;manifestKnown:boolean;readyCount:number;receivedCount:number;removedCount:number;items:BatchItem[];reused:{filename:string;bytes:number;sha256:string;photoId:string}[];createdAt:string;projectStage:string};

export function sameUploadManifest(declared:unknown,actual:MediaFile[]){const parsed=z.array(mediaFile).max(500).safeParse(declared);if(!parsed.success||parsed.data.length!==actual.length)return false;const key=(f:MediaFile)=>JSON.stringify([f.filename,f.bytes,f.sha256]);const wanted=new Set(parsed.data.map(key));return wanted.size===parsed.data.length&&new Set(actual.map(key)).size===actual.length&&actual.every(f=>wanted.has(key(f)));}
