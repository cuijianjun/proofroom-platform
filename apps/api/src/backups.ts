import type {FastifyInstance} from 'fastify';
import {key,uuid} from '@proofroom/contracts';
import {createBackupInput} from '@proofroom/contracts/backups';
import {context} from '@proofroom/domain/auth';
import {backupStatus,listBackups,backupCreation,backupDownload,createStudioBackup} from '@proofroom/domain/backup';
import {ctx,staff,jsonRoute} from './http.js';
import {sendPrivateBytes} from './downloads.js';
export function registerBackups(app:FastifyInstance){const root='/api/v1/studios/:studioId/backups';jsonRoute(app,'GET',root,undefined,async req=>listBackups(await ctx(req,'owner')));jsonRoute(app,'POST',root,createBackupInput,async(req,reply,b)=>{const user=await staff(req),studioId=uuid.parse((req.params as any).studioId);return createStudioBackup(user,await context(user,studioId,'owner',false),b);});jsonRoute(app,'GET',root+'/creation/:key',undefined,async req=>backupCreation(await ctx(req,'owner'),key.parse((req.params as any).key)));jsonRoute(app,'GET',root+'/:id',undefined,async req=>backupStatus(await ctx(req,'owner'),uuid.parse((req.params as any).id)));app.get(root+'/:id/file',async(req,reply)=>{const file=await backupDownload(await ctx(req,'owner'),uuid.parse((req.params as any).id));return sendPrivateBytes(req,reply,file);});}
