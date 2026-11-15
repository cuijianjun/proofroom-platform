import {randomUUID} from 'node:crypto';
import {emitKeypressEvents} from 'node:readline';
import path from 'node:path';
import {rm} from 'node:fs/promises';
import {backupScratch,createFullBackup} from '../packages/domain/backup.ts';
import {readBackupPack,restoreExtracted,restoreTarget} from '../packages/domain/restore.ts';
import {pool} from '../packages/db/index.ts';
import {stopBoss} from '../packages/domain/jobs.ts';
async function password(stdin){
 if(stdin){let value='';for await(const part of process.stdin){value+=part.toString();if(value.length>204)throw new Error('备份密码过长');}return value.replace(/\r?\n$/,'');}
 if(!process.stdin.isTTY)throw new Error('非交互运行请使用 --passphrase-stdin，通过标准输入传入密码');
 process.stderr.write('备份密码（输入不显示）：');emitKeypressEvents(process.stdin);process.stdin.setRawMode(true);process.stdin.resume();
 return new Promise((resolve,reject)=>{let value='';const done=(error)=>{process.stdin.off('keypress',key);process.stdin.setRawMode(false);process.stdin.pause();process.stderr.write('\n');if(error)reject(error);else resolve(value);};const key=(text,event)=>{if(event.ctrl&&event.name==='c')return done(new Error('已取消'));if(event.name==='return')return done();if(event.name==='backspace')value=value.slice(0,-1);else if(text&&!event.ctrl&&!/[\x00-\x1f\x7f]/.test(text))value+=text;if(value.length>200)done(new Error('备份密码过长'));};process.stdin.on('keypress',key);});
}
let scratch;
try{
 const [command,...args]=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i++){const flag=args[i];if(flag==='--passphrase-stdin'){options.stdin=true;continue;}if(!['--file','--output','--name'].includes(flag)||!args[i+1]||args[i+1].startsWith('--'))throw new Error('使用 full-export --output 新文件 或 restore --file 备份文件 --name 新编号 [--output 新目录]；可加 --passphrase-stdin');if(options[flag.slice(2)])throw new Error('选项不能重复');options[flag.slice(2)]=args[++i];}
 if(!['full-export','restore'].includes(command))throw new Error('请选择 full-export 或 restore');
 const phrase=await password(options.stdin);if(phrase.length<12||phrase.length>200||/[\x00-\x1f\x7f]/.test(phrase))throw new Error('备份密码需12～200个字符，不含换行或控制字符');
 if(command==='full-export'){
  const source=new URL(process.env.DATABASE_URL);if(!['postgres:','postgresql:'].includes(source.protocol)||source.search||source.hash||source.username!=='proofroom_runtime'||!['127.0.0.1','localhost'].includes(source.hostname)||source.port!=='18432'||!['/proofroom_dev','/proofroom_test'].includes(source.pathname)&&!/^\/proofroom_restore_[a-z0-9_]+$/.test(source.pathname))throw new Error('全量导出仅限本项目18432端口的本地开发、隔离测试或独立恢复库');
  if(!options.output||options.file||options.name)throw new Error('全量导出需要 --output 新文件');const result=await createFullBackup(phrase,path.resolve(options.output));process.stdout.write(JSON.stringify({result:'已生成本机全量加密备份',bytes:result.bytes,sha256:result.sha256})+'\n');
 }else{
  if(!options.file||!options.name||!/^[a-z0-9_]{1,40}$/.test(options.name))throw new Error('恢复需要 --file 和新的 --name 编号（小写字母、数字、下划线，最多40位）');
  const url=new URL(process.env.MIGRATION_DATABASE_URL);url.pathname='/proofroom_restore_'+options.name;restoreTarget(url.href);
  scratch=await backupScratch();const extracted=await readBackupPack(path.resolve(options.file),phrase,scratch),result=await restoreExtracted(extracted,url.href,path.resolve(options.output??`.local/restores/${randomUUID()}`));process.stdout.write(JSON.stringify({result:'已创建独立恢复副本',...result})+'\n');
 }
}catch(error){process.stderr.write((error.code==='ENOENT'?'备份文件或输出父目录不存在':error.code==='EEXIST'?'输出文件已存在，请选择新文件':error.message??'本地备份操作未完成')+'\n');process.exitCode=1;}
finally{if(scratch)await rm(scratch,{recursive:true,force:true});await stopBoss();await pool.end();}
