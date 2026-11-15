import {z,key} from './index';
export const createBackupInput=z.strictObject({key,passphrase:z.string().min(12).max(200).refine(v=>!/[\x00-\x1f\x7f]/.test(v),'备份密码不能含换行或控制字符')});
export type BackupStatus={id:string;state:'pending'|'processing'|'ready'|'failed'|'expired';version:number;bytes:number;error:string|null;createdAt:string;expiresAt:string|null;downloadUrl:string|null};
