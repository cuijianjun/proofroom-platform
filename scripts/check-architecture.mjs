// Source imports and actual client bundles must stay free of backend identity.
import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
export async function scanClientSecrets(directory,secrets){
 const result={files:0,leaks:[]};
 async function scan(dir){let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of entries){const file=path.join(dir,entry.name);if(entry.isDirectory())await scan(file);else if(/\.(?:[cm]?js|json|html|css|map)$/.test(entry.name)){result.files++;const content=await readFile(file);if(secrets.some(secret=>secret&&content.includes(Buffer.from(secret))))result.leaks.push(file);}}
 }
 await scan(directory);return result;
}
async function main(){
 const root=new URL('../',import.meta.url),violations=[];
 async function walk(dir){for(const entry of await readdir(new URL(dir,root),{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory()){if(!['node_modules','.next','dist'].includes(entry.name))await walk(file);}else if(/\.(tsx?|mjs)$/.test(entry.name)){const source=await readFile(new URL(file,root),'utf8');for(const pattern of [/['"](?:pg|pg-boss|@neondatabase\/[^'"]+|@vercel\/blob[^'"]*|@aws-sdk\/[^'"]+|sharp|@proofroom\/(?:db|domain|storage)(?:\/[^'"]*)?)['"]/g,/\b(?:DATABASE_URL|APP_SECRET|S3_SECRET_KEY|S3_ACCESS_KEY)\b/g,/['"]use server['"]/g,/\b(?:select\s+\*?\s*from|insert\s+into|update\s+\w+\s+set)\b/gi])if(pattern.test(source))violations.push(file+': '+pattern.source);}}}
 await walk('apps/web/src');await walk('packages/contracts');
 const pkg=JSON.parse(await readFile(new URL('apps/web/package.json',root),'utf8'));for(const name of Object.keys(pkg.dependencies??{}))if(!['next','react','react-dom','@proofroom/contracts'].includes(name))violations.push('apps/web dependency '+name);
 const args=process.argv.slice(2),sourceOnly=args.includes('--source-only');for(let i=0;i<args.length;i++){if(args[i]==='--source-only')continue;if(!['--build-dir','--reference-file'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw new Error('检查参数无法核对');i++;}const option=(key,fallback)=>{const index=args.indexOf(key);return index<0?fallback:path.resolve(args[index+1]);};let files=0;
 if(!sourceOnly){const referenceFile=option('--reference-file',fileURLToPath(new URL('.env',root))),directory=option('--build-dir',fileURLToPath(new URL('apps/web/.next/static',root)));let config;try{config=dotenv.parse(await readFile(referenceFile));}catch{throw new Error('最终扫描缺少可读取的敏感配置参照，请先设置本地环境或明确reference-file');}
  if(!['APP_SECRET','S3_SECRET_KEY','DATABASE_URL'].every(key=>typeof config[key]==='string'&&config[key].length>=16))throw new Error('最终扫描缺少完整敏感配置参照，不能判定客户端没有泄露');
  const secrets=['APP_SECRET','S3_SECRET_KEY','DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL'].flatMap(key=>{const value=config[key];if(!value)return [];const values=[value];if(key.includes('DATABASE')){try{values.push(decodeURIComponent(new URL(value).password));}catch{throw new Error('本地数据库配置无法核对');}}return values;}).filter(value=>value.length>=16);
  const result=await scanClientSecrets(directory,secrets);files=result.files;if(!files)throw new Error('最终扫描没有可核对的客户端构建产物，请先构建或明确build-dir');violations.push(...result.leaks.map(file=>'client bundle contains private configuration: '+path.relative(fileURLToPath(root),file)));
 }
 if(violations.length){process.stderr.write(violations.join('\n')+'\n');process.exitCode=1;}else process.stdout.write(sourceOnly?'Web/contracts source boundary passes; client bundles were not checked.\n':'Web/contracts boundary passes: no business DB, storage credentials or Server Actions; checked '+files+' client bundle files against the selected reference configuration.\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{await main();}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
