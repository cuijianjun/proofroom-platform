import {z,key,version} from './index';
export const platformUserCommand=z.strictObject({key,version,action:z.enum(['disable','enable','require_password_change']),reason:z.string().trim().min(5).max(500)});
export type PlatformUser={id:string;username:string;name:string;email:string;disabled:boolean;forcePasswordChange:boolean;platformAdmin:boolean;mfaEnabled:boolean;lockedUntil:string|null;version:number};
export type PlatformHealth={database:'ok';storage:'ok'|'unavailable';worker:'online'|'stale'|'unknown';workerLastSeen:string|null;queue:{waiting:number;active:number;failed:number};checkedAt:string};
