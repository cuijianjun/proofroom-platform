import {chooseOption,chooseSlot} from './select-choice';
import {test,expect,type Page,type APIRequestContext,type APIResponse} from '@playwright/test';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import sharp from 'sharp';

const config=dotenv.parse(readFileSync('.env'));
const headers={origin:'http://127.0.0.1:18186'};
const password='Local-MockExperience!5291';
const widths=[320,390,393,1280];
test.use({launchOptions:{chromiumSandbox:true}});
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Picture={name:string;mimeType:string;buffer:Buffer};
async function data(response:APIResponse,status=200){expect(response.status(),(await response.text()).slice(0,160)).toBe(status);return (await response.json()).data;}
async function picture(name:string,color='orange'):Promise<Picture>{return {name,mimeType:'image/jpeg',buffer:await sharp({create:{width:240,height:180,channels:3,background:color}}).jpeg().toBuffer()};}
async function register(page:Page){
 const tag=randomBytes(6).toString('hex'),username='experience_'+tag,slug='experience-'+tag;
 const account=await data(await page.request.post('/api/v1/auth/register',{headers,data:{username,email:username+'@example.test',name:'体验验收摄影师',password,studioName:'Mock体验工作室',slug}}));
 return {sid:account.studioId as string,tag,username,slug,uid:(await data(await page.request.get('/api/v1/auth/me'))).user.id as string};
}
async function configure(request:APIRequestContext,sid:string,section:string,change:(value:any)=>any){const base=`/api/v1/studios/${sid}/config/${section}`,old=await data(await request.get(base));return data(await request.put(base,{headers,data:{version:old.version,value:change(old.value)}}));}
function agreement(title:string){return {key:randomUUID(),name:'Mock客户',wechat:'mock-client-only',phoneLast4:'',pin:'4826',title,packageSource:'custom',packageId:null,contentVersion:1,quota:2,price:'¥1280（本地模拟）',special:'  保留自然肤色\n这段原文和空格应完整保留  ',dateFlexible:true,intendedDate:'周末，具体日期另约',slotId:null,slotVersion:null};}
async function createProject(request:APIRequestContext,sid:string,title:string){const p=await data(await request.post(`/api/v1/studios/${sid}/projects`,{headers,data:agreement(title)}));return data(await request.get(`/api/v1/studios/${sid}/projects/${p.id}`));}
async function upload(request:APIRequestContext,base:string,role:string,files:Picture[]){
 const batch=await data(await request.post(base+'/upload-batches',{headers,data:{key:randomUUID(),role,files:files.map(f=>({filename:f.name,bytes:f.buffer.length,sha256:digest(f.buffer)}))}}));
 for(const item of batch.items){const file=files.find(f=>f.name===item.filename)!;await data(await request.put(`${base}/upload-batches/${batch.id}/items/${item.id}/bytes`,{headers:{...headers,'content-type':'application/octet-stream','x-upload-grant':item.uploadGrant},data:file.buffer}),202);}
 await expect.poll(async()=>(await data(await request.get(`${base}/upload-batches/${batch.id}`))).state,{timeout:30000}).toBe('ready');
}
async function select(request:APIRequestContext,link:string){
 const base='/api/v1/client/'+link.split('/').at(-1);await data(await request.post(base+'/pin',{headers,data:{pin:'4826'}}));
 for(let i=0;i<2;i++){const photos=await data(await request.get(base+'/photos'));await data(await request.post(`${base}/photos/${photos.items[i].id}/mark`,{headers,data:{key:randomUUID(),version:photos.items[i].version,selectionVersion:photos.summary.selectionVersion,mark:{action:'toggle',on:true}}}));}
 let photos=await data(await request.get(base+'/photos'));
 await data(await request.post(`${base}/photos/${photos.items[0].id}/comments`,{headers,data:{key:randomUUID(),version:photos.items[0].version,selectionVersion:photos.summary.selectionVersion,body:'  Mock客户原文\n保留自然表情，不要磨皮过度。  '}}));
 photos=await data(await request.get(base+'/photos'));await data(await request.post(base+'/complete',{headers,data:{key:randomUUID(),selectionVersion:photos.summary.selectionVersion}}));
 return base;
}
async function inspect(page:Page,label:string){
 await expect(page.locator('.loading:visible')).toHaveCount(0);
 await expect(page.locator('.notice.error[role=alert]:visible')).toHaveCount(0);
 for(const width of widths){
  await page.setViewportSize({width,height:852});
  const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  expect.soft(bounds.scroll,`${label} ${width}: document overflow`).toBeLessThanOrEqual(bounds.width);
  const failures=await page.locator('main h1,main h2,main h3,main strong,main summary,main .label,.public-header,.public-header .wordmark,.public-photo>div,.public-photo>div>span,.group-tabs button,.desktop-context,dialog[open] h2').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length>0&&!e.closest('[aria-hidden=true]')).map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent?.slice(0,80),left:b.left,right:b.right,client:e.clientWidth,scroll:e.scrollWidth};}).filter(b=>b.left< -1||b.right>innerWidth+1||b.scroll>b.client+2));
  expect.soft(failures,`${label} ${width}: readable content within viewport`).toEqual([]);
  const brokenBrands=await page.locator('.sidebar>a.wordmark:visible,.public-header>a.wordmark:visible').evaluateAll(elements=>elements.filter(e=>{const text=e.firstChild;if(!text||text.nodeType!==Node.TEXT_NODE)return false;const range=document.createRange();range.selectNodeContents(text);return range.getClientRects().length!==1;}).map(e=>e.firstChild?.textContent));expect.soft(brokenBrands,label+': fixed brand remains one line').toEqual([]);
 }
 const fields=await page.locator('main input,main select,main textarea,dialog[open] input,dialog[open] select,dialog[open] textarea').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length>0&&!e.matches('[type=hidden]')).filter(e=>{const el=e as HTMLInputElement;return !el.labels?.length&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby');}).map(e=>({tag:e.tagName,id:e.id,type:e.getAttribute('type')})));
 expect.soft(fields,label+': fields need accessible names').toEqual([]);
 const duplicates=await page.locator('[id]').evaluateAll(elements=>{const ids=elements.map(e=>e.id);return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];});
 expect.soft(duplicates,label+': IDs are unique').toEqual([]);
 console.info('[experience] '+label+' · four widths, names and IDs checked');
}

test.beforeEach(async()=>{
 expect(new URL(config.TEST_MIGRATION_DATABASE_URL!).pathname).toBe('/proofroom_test');
 const db=new pg.Client({connectionString:config.TEST_MIGRATION_DATABASE_URL});await db.connect();try{await db.query("delete from rate_limits where key in ('register:127.0.0.1','staff-login:127.0.0.1')");}finally{await db.end();}
});

test('T051: long filenames accepted by the upload contract create a real portfolio item without losing the source filename',async({page})=>{
 const s=await register(page),files=await Promise.all([picture('mock-portrait-'+ 'x'.repeat(155)+'.jpg'),picture('中'.repeat(119)+'😀.jpg','blue')]);
 await page.goto(`/studio/portfolio?studio=${s.sid}`);await page.getByRole('heading',{name:'公开作品',exact:true}).waitFor();
 await page.locator('#portfolio-files').setInputFiles(files);
 await expect(page.locator('.upload-queue')).not.toContainText('上传失败');
 await expect.poll(async()=>(await data(await page.request.get(`/api/v1/studios/${s.sid}/portfolio`))).items.filter((item:any)=>item.state==='ready').length,{timeout:15000}).toBe(files.length);
 const items=(await data(await page.request.get(`/api/v1/studios/${s.sid}/portfolio`))).items;
 for(const file of files){const item=items.find((item:any)=>item.filename===file.name);expect(item).toBeDefined();expect(item.title.length).toBeLessThanOrEqual(120);expect(item.title.trim()).not.toBe('');expect(Buffer.from(item.title).toString('utf8')).toBe(item.title);expect(item.sha256).toBe(digest(file.buffer));}
 expect(items.find((i:any)=>i.filename===files[0].name).title).toBe('mock-portrait-'+'x'.repeat(106));
 expect(items.find((i:any)=>i.filename===files[1].name).title).toBe('中'.repeat(119));
 const item=items[0];
 await page.getByRole('button',{name:'编辑作品',exact:true}).first().click();await expect(page.getByLabel('作品名称',{exact:true})).toHaveValue(item.title);await page.getByRole('dialog').press('Escape');
});

test('T050/T051: populated mock workspace keeps the complete photographer and customer journey usable across every module',async({page,browser})=>{
 test.setTimeout(300000);
 const s=await register(page),db=new pg.Client({connectionString:config.TEST_MIGRATION_DATABASE_URL});await db.connect();
 const guest=await browser.newContext({baseURL:headers.origin}),customer=await guest.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));customer.on('pageerror',e=>errors.push(e.message));
 const projects:Record<string,any>={},sources:Record<string,Picture[]>={},checked:string[]=[];
 async function visit(path:string,label:string,heading:string){await page.goto(path+(path.includes('?')?'&':'?')+'studio='+s.sid);await page.getByRole('heading',{name:heading,exact:true}).waitFor();await inspect(page,label);checked.push(label);}
 try{
  await test.step('1 · realistic configuration, public works, team, slots and every project stage',async()=>{
   await configure(page.request,s.sid,'profile',v=>({...v,name:'MockStudio'+'M'.repeat(55),wechat:'mock-photographer',description:'本页全部为本地模拟内容，不是真实客户。\n自然光写真与家庭记录。'.repeat(12)}));
   await configure(page.request,s.sid,'content',()=>({packages:[{id:'portrait',name:'MockPortraitPackage'+'P'.repeat(55),quota:2,price:'¥1280（模拟）',description:'包含拍摄、原片选片与两张精修。'.repeat(20)},{id:'family',name:'Mock家庭纪实',quota:6,price:'¥2680（模拟）',description:'一家人的自然相处'}],faq:[{id:'delivery',question:'MockFAQ'+'Q'.repeat(180),answer:'浏览使用压缩预览，交付下载为上传源文件。\n具体时间以双方约定为准。'.repeat(20)},{id:'change',question:'可以改期吗？',answer:'请与摄影师沟通确认新的可用时段。'}]}));
   await configure(page.request,s.sid,'questionnaire',v=>({...v,questions:[...v.questions,{id:'mock-location',label:'Mock偏好地点',hint:'用于核对有数据的自定义问题',type:'multi',required:false,options:['公园','室内','街道'] }]}));
   await configure(page.request,s.sid,'portfolio',v=>({...v,showSamples:false,groups:v.groups.map((g:any,i:number)=>({...g,name:i===0?'MockPortfolioGroup'+'G'.repeat(55):g.name}))}));
   for(let i=0;i<3;i++){const file=await picture(`mock-work-${i+1}.jpg`,['orange','blue','green'][i]);const p=await data(await page.request.post(`/api/v1/studios/${s.sid}/portfolio/uploads`,{headers,data:{key:randomUUID(),filename:file.name,bytes:file.buffer.length,sha256:digest(file.buffer),title:i===0?'MockPortfolioTitle'+'T'.repeat(90):`模拟作品${i+1}`,groupId:'portraits',publish:i!==2}}));await data(await page.request.put(`/api/v1/studios/${s.sid}/portfolio/${p.id}/bytes`,{headers:{...headers,'content-type':'application/octet-stream'},data:file.buffer}),202);}
   await expect.poll(async()=>(await data(await page.request.get(`/api/v1/studios/${s.sid}/portfolio`))).items.filter((p:any)=>p.state==='ready').length,{timeout:30000}).toBe(3);
   for(let i=1;i<=3;i++){const start=new Date(Date.now()+i*86400000);await data(await page.request.post(`/api/v1/studios/${s.sid}/slots`,{headers,data:{startAt:start.toISOString(),endAt:new Date(+start+3600000).toISOString()}}));}
   for(const role of ['admin','member']){const email=`mock-${role}-${s.tag}@example.test`,invite=await data(await page.request.post(`/api/v1/studios/${s.sid}/invitations`,{headers,data:{email,role}}));const ctx=await browser.newContext({baseURL:headers.origin});try{await data(await ctx.request.post('/api/v1/auth/register-invited',{headers,data:{invitationToken:invite.token,username:`mock_${role}_${s.tag}`,email,name:`模拟${role}`,password}}));}finally{await ctx.close();}}
   await data(await page.request.post(`/api/v1/studios/${s.sid}/invitations`,{headers,data:{email:`mock-pending-${s.tag}@example.test`,role:'member'}}));
   for(const stage of ['P1','P2','P3','P4','archived','cancelled']){
    const p=await createProject(page.request,s.sid,`Mock-${stage}-`+'ContinuousTitle'.repeat(6));projects[stage]=p;const base=`/api/v1/studios/${s.sid}/projects/${p.id}`;
    if(stage==='P1'||stage==='cancelled')continue;
    const files=await Promise.all([picture('mock-frame-01.jpg'),picture('mock-frame-02.jpg','blue'),picture('mock-frame-03.jpg','green')]);sources[stage]=files;await upload(page.request,base,'original',files);
    let photos=await data(await page.request.get(base+'/photos'));await data(await page.request.post(`${base}/photos/${photos.items[0].id}/mark`,{headers,data:{key:randomUUID(),version:photos.items[0].version,selectionVersion:photos.summary.selectionVersion,mark:{action:'toggle',on:true}}}));photos=await data(await page.request.get(base+'/photos'));await data(await page.request.post(`${base}/photos/${photos.items[0].id}/comments`,{headers,data:{key:randomUUID(),version:photos.items[0].version,selectionVersion:photos.summary.selectionVersion,body:'Mock摄影师备注：优先保留自然表情。'}}));
    const gbase=`/api/v1/studios/${s.sid}/galleries/${p.galleries[0].id}`,g=await data(await page.request.get(gbase));const edited=await data(await page.request.post(gbase,{headers,data:{key:randomUUID(),version:g.version,title:g.title,published:g.published,archived:g.archived,settings:{...g.settings,categories:['Mock外景','Mock室内']}}}));const gp=await data(await page.request.get(gbase+'/photos'));await data(await page.request.post(gbase+'/photos/batch',{headers,data:{key:randomUUID(),version:edited.version,operation:'category',items:[{id:gp.items[0].id,version:gp.items[0].version}],category:'Mock外景'}}));
    if(stage==='P2')continue;await select(guest.request,p.clientLink);if(stage==='P3')continue;
    await upload(page.request,base,'retouched',[{...files[0],name:'mock-frame-01_edit.jpg'},{...files[1],name:'mock-frame-02_edit.jpg'}]);await expect.poll(async()=>(await data(await page.request.get(base))).workflowStage).toBe('P4');
   }
   await db.query("update orders set workflow_stage='archived',archived_at=clock_timestamp()-interval '3 months',expires_at=clock_timestamp()-interval '1 day' where studio_id=$1 and id=$2",[s.sid,projects.archived.id]);
   await data(await guest.request.post('/api/v1/client/'+projects.cancelled.clientLink.split('/').at(-1)+'/pin',{headers,data:{pin:'4826'}}));
   await data(await page.request.post(`/api/v1/studios/${s.sid}/projects/${projects.cancelled.id}/cooperation`,{headers,data:{key:randomUUID(),version:projects.cancelled.version,active:false,reason:'Mock客户行程变化，核对取消与恢复语义'}}));
   await db.query('update users set is_platform_admin=true where id=$1',[s.uid]);
  });
  await test.step('2 · public consultation, raw answers, acceptance and occupied slot',async()=>{
   await customer.goto('/t/'+s.slug);await customer.getByLabel('怎么称呼你？ *',{exact:true}).waitFor();await expect(customer.locator('.public-header')).toHaveCount(1);await expect(customer.locator('.public-photo')).toHaveCount(2);for(const image of await customer.locator('.public-photo img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);}await inspect(customer,'公开页：真实作品/长组名/套餐FAQ/九题');
   await customer.getByRole('checkbox',{name:'选择 模拟作品2',exact:true}).check();await customer.getByLabel('怎么称呼你？ *',{exact:true}).fill('Mock小林');await chooseOption(customer.getByLabel('想拍什么类型的照片？ *',{exact:true}), '个人写真');await customer.getByLabel('你的微信号',{exact:true}).fill('mock-xiaolin');await customer.getByLabel('项目访问码（四位数字）',{exact:true}).fill('5937');
   await customer.getByLabel('想避免什么情况？',{exact:true}).fill('  Mock原文\n请不要过度修饰面部  ');await chooseOption(customer.getByLabel('意向套餐',{exact:true}), 'portrait');await customer.getByRole('checkbox',{name:'公园',exact:true}).check();await chooseSlot(customer.getByRole('group',{name:'意向公开时段（提交不占用）',exact:true}), {index:1});await customer.getByRole('button',{name:'提交拍摄咨询',exact:true}).click();await customer.getByRole('heading',{name:'咨询提交成功',exact:true}).waitFor();await inspect(customer,'公开咨询私密回执');
   const pending=await data(await page.request.get(`/api/v1/studios/${s.sid}/inquiries?status=pending`));const inquiry=pending.items[0];await visit(`/studio/inquiries/${inquiry.id}`,'咨询详情和历史套餐/参考图','Mock小林的拍摄咨询');
   await page.getByRole('button',{name:'核对本单约定',exact:true}).click();await inspect(page,'咨询接单长套餐确认弹层');await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click();expect((await data(await page.request.get(`/api/v1/studios/${s.sid}/inquiries/${inquiry.id}`))).status).toBe('pending');
   await page.getByRole('button',{name:'核对本单约定',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'确认接单并创建项目',exact:true}).click();await page.getByRole('heading',{name:'Mock小林的拍摄',exact:true}).waitFor();
   const accepted=await data(await page.request.get(`/api/v1/studios/${s.sid}/projects/${new URL(page.url()).pathname.split('/')[3]}`));expect(accepted.agreement).toMatchObject({quota:2,package:{id:'portrait',quota:2}});expect(accepted.requirement.answers).toMatchObject({q7:'  Mock原文\n请不要过度修饰面部  ',q5:expect.any(Array),'mock-location':['公园']});expect(accepted.requirement.answers.q5).toHaveLength(1);expect(accepted.booking.id).toBe(accepted.requirement.snapshot.slot.id);expect(accepted.requirement.snapshot.references.map((r:any)=>r.id)).toEqual(accepted.requirement.answers.q5);
   const pub=await data(await guest.request.get(`/api/v1/public/${s.slug}/config`));
   for(const ignored of [false,true]){const r=await data(await guest.request.post(`/api/v1/public/${s.slug}/inquiries`,{headers,data:{submissionKey:randomUUID(),questionnaireVersion:pub.questionnaire.version,contentVersion:pub.content.version,answers:{q1:ignored?'Mock已忽略咨询':'Mock待处理咨询',q2:'亲子',q7:'模拟需求，无真实隐私',q8:{wechat:'mock-consultation'}},pin:'8274',dateFlexible:true,intendedDate:'',slotId:null,slotVersion:null,packageId:'family',other:{},website:''}}));if(ignored){const info=await data(await page.request.get(`/api/v1/studios/${s.sid}/inquiries/${r.id}`));await data(await page.request.post(`/api/v1/studios/${s.sid}/inquiries/${r.id}/status`,{headers,data:{version:info.version,status:'ignored'}}));}}
  });
  await test.step('3 · every populated photographer module and project state',async()=>{
   for(const [path,label,heading] of [['/studio','工作台多阶段计数','你好，体验验收摄影师'],['/studio/projects','多阶段项目列表','拍摄项目'],['/studio/new','手工建单与已有套餐','手动新建拍摄项目'],['/studio/inquiries','待处理/已接单/忽略咨询','拍摄咨询'],['/studio/mine','工作室全部设置入口','我的工作室'],['/studio/profile','品牌与长资料','工作室资料'],['/studio/portfolio','已发布/私有作品','公开作品'],['/studio/questionnaire','九题配置含自定义多选','售前问卷'],['/studio/content','有数据的套餐和FAQ','套餐与常见问题'],['/studio/schedule','空闲和占用档期','预约与档期'],['/studio/members','Owner/Admin/Member和待接受邀请','成员与权限'],['/studio/account','账号安全','账号安全'],['/studio/history','到期项目与忽略记录','历史记录'],['/studio/galleries','各阶段原片/精修图库','项目图库'],['/studio/help','帮助与真实备份','帮助与数据']] as const){await visit(path,label,heading);if(path==='/studio/content'){await page.getByRole('tab',{name:'常见问题',exact:true}).click();await inspect(page,'长FAQ问题和答案');}}
   for(const [stage,p]of Object.entries(projects)){for(const section of ['overview','originals','selection','delivery']){await visit(`/studio/projects/${p.id}?section=${section}`,stage+' · '+section,p.title);}}
   await page.goto(`/studio/galleries/${projects.P2.galleries[0].id}?studio=${s.sid}`);await page.getByLabel('照片分类筛选',{exact:true}).waitFor();await chooseOption(page.getByLabel('照片分类筛选',{exact:true}), 'Mock外景');await expect(page.getByRole('article',{name:/^图库照片 /})).toHaveCount(1);await inspect(page,'有照片的图库分类与筛选');
   await page.goto(`/studio/help?studio=${s.sid}`);const backup=page.getByRole('region',{name:'工作室数据备份'});await backup.getByLabel('设置备份密码（12～200个字符）').fill('Mock-Backup-Phrase!5291');await backup.getByRole('button',{name:'创建工作室加密备份',exact:true}).click();await backup.getByRole('heading',{name:'加密备份已就绪',exact:true}).waitFor({timeout:30000});const backupEvent=page.waitForEvent('download');await backup.getByRole('button',{name:'下载加密备份',exact:true}).click();const backupDownload=await backupEvent;expect(await backupDownload.failure()).toBeNull();expect(readFileSync((await backupDownload.path())!).subarray(0,8).toString()).toBe('PRBK0001');await inspect(page,'包含所有mock业务数据的加密备份');
   await page.goto('/studio/platform');await page.getByText('存储桶可访问',{exact:true}).waitFor();await inspect(page,'平台工作室/人员/健康');
  });
  await test.step('4 · independent customer sees each stage and exact delivered source bytes',async()=>{
   for(const stage of ['P1','P2','P3','P4','archived']){const p=projects[stage];await customer.goto(p.clientLink);const pin=customer.getByLabel('四位项目访问码');await pin.or(customer.getByRole('heading',{name:p.title,exact:true})).first().waitFor();if(await pin.isVisible()){await pin.fill('4826');await customer.getByRole('button',{name:'验证并进入',exact:true}).click();}await customer.getByRole('heading',{name:p.title,exact:true}).waitFor();const brand=customer.locator('.public-header .wordmark');expect(await brand.evaluate(e=>e.firstChild?.textContent)).toBe('MockStudio'+'M'.repeat(55));for(const width of [320,390,393,768,1024,1280]){await customer.setViewportSize({width,height:852});await expect.soft(brand,'customer brand visible at '+width).toBeVisible();expect.soft(await brand.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'customer brand wraps at '+width).toBe(true);}await inspect(customer,'顾客 · '+stage);}
   const p=projects.P4,base='/api/v1/client/'+p.clientLink.split('/').at(-1);const downloads=await data(await guest.request.get(base+'/downloads'));expect(downloads.files).toHaveLength(5);
   for(const f of downloads.files){const file=sources.P4.find(source=>source.name===f.filename.replace('_edit',''))!;const response=await guest.request.get(f.url);expect(response.status()).toBe(200);expect(digest(await response.body())).toBe(digest(file.buffer));}
   await customer.goto(p.clientLink);await customer.getByRole('button',{name:'准备全部照片ZIP',exact:true}).click();await customer.getByRole('button',{name:'下载全部照片ZIP',exact:true}).waitFor({timeout:30000});const zipEvent=customer.waitForEvent('download');await customer.getByRole('button',{name:'下载全部照片ZIP',exact:true}).click();const zipDownload=await zipEvent;expect(await zipDownload.failure()).toBeNull();const zipHashes=JSON.parse(execFileSync('python3',['-c','import zipfile,hashlib,json,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(json.dumps([hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist()]))',(await zipDownload.path())!],{encoding:'utf8'}));expect(zipHashes.sort()).toEqual(downloads.files.map((f:any)=>digest(sources.P4.find(source=>source.name===f.filename.replace('_edit',''))!.buffer)).sort());
   await customer.goto(projects.cancelled.clientLink);await expect(customer.getByText('合作已取消',{exact:false}).first()).toBeVisible();
   const anonymous=await browser.newContext({baseURL:headers.origin});try{expect((await anonymous.request.get('/api/v1/client/'+projects.cancelled.clientLink.split('/').at(-1))).status()).toBe(404);}finally{await anonymous.close();}
  });
  await test.step('5 · Admin/Member capabilities and readonly/suspended recovery are visible',async()=>{
   for(const role of ['admin','member']){const roleContext=await browser.newContext({baseURL:headers.origin});try{await data(await roleContext.request.post('/api/v1/auth/login',{headers,data:{login:`mock_${role}_${s.tag}`,password}}));const rolePage=await roleContext.newPage();await rolePage.goto(`/studio/portfolio?studio=${s.sid}`);await rolePage.getByRole('heading',{name:'公开作品',exact:true}).waitFor();if(role==='member')await expect(rolePage.locator('#portfolio-files')).toBeDisabled();else await expect(rolePage.locator('#portfolio-files')).toBeEnabled();await inspect(rolePage,'团队 '+role+' · 公开作品权限');await rolePage.goto(`/studio/members?studio=${s.sid}`);await rolePage.getByRole('heading',{name:'成员与权限',exact:true}).waitFor();if(role==='member')await expect(rolePage.getByText('当前角色或工作室状态不允许邀请，请联系所有者。',{exact:true})).toBeVisible();else await expect(rolePage.getByRole('button',{name:'生成邀请链接',exact:true})).toBeEnabled();}finally{await roleContext.close();}}
   const stateBase='/api/v1/platform/studios/'+s.sid;
   async function setState(state:string){const studios=await data(await page.request.get('/api/v1/platform/studios'));const current=studios.find((v:any)=>v.id===s.sid);return data(await page.request.patch(stateBase,{headers,data:{version:current.version,state,stateReason:'Mock体验：核对不可用提示与恢复',seatLimit:current.seat_limit,quotaBytes:Number(current.quota_bytes)}}));}
   const oldSource=(await data(await guest.request.get('/api/v1/client/'+projects.P4.clientLink.split('/').at(-1)+'/downloads'))).files[0].url;
   try{
    await setState('readonly');await page.goto(`/studio/profile?studio=${s.sid}`);await page.getByRole('heading',{name:'工作室资料',exact:true}).waitFor();await expect(page.getByRole('button',{name:'保存修改',exact:true})).toHaveCount(0);await expect(page.locator('#profile-name')).toBeDisabled();await expect(page.getByText('当前角色或工作室状态仅允许查看配置，请联系所有者修改。',{exact:true})).toBeVisible();await expect(page.getByText('工作室只读',{exact:false}).first()).toBeVisible();await inspect(page,'Owner · 只读工作室配置');
    await setState('suspended');await customer.goto(projects.P4.clientLink);await expect(customer.getByText(/暂停|不可用/).first()).toBeVisible();expect((await guest.request.get(oldSource)).status()).toBe(403);
   }finally{await setState('active');}
   await customer.goto(projects.P4.clientLink);await customer.getByRole('heading',{name:projects.P4.title,exact:true}).waitFor();await expect(customer.getByRole('heading',{name:'源文件下载',exact:true})).toBeVisible();
  });
  await page.goto(`/studio/projects?studio=${s.sid}`);await page.getByRole('heading',{name:'拍摄项目',exact:true}).waitFor();await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/proofroom-qa/product-experience-projects.png',fullPage:false});
  await customer.goto('/t/'+s.slug);await customer.getByLabel('怎么称呼你？ *',{exact:true}).waitFor();await customer.setViewportSize({width:390,height:852});await customer.evaluate(()=>scrollTo(0,0));await customer.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await customer.screenshot({path:'/tmp/proofroom-qa/product-experience-public.png',fullPage:false});
  expect.soft(errors,'unhandled page errors').toEqual([]);
  const counts=await db.query('select (select count(*) from orders where studio_id=$1)::int as projects,(select count(*) from inquiries where studio_id=$1)::int as inquiries,(select count(*) from portfolio_items where studio_id=$1)::int as portfolio,(select count(*) from photos where studio_id=$1)::int as photos,(select count(*) from memberships where studio_id=$1)::int as members,(select count(*) from backup_jobs where studio_id=$1)::int as backups,(select count(*) from zip_jobs where studio_id=$1)::int as zips,(select count(*) from photo_selections where studio_id=$1)::int as marks,(select count(*) from photo_comments where studio_id=$1)::int as notes,(select count(*) from booking_slots where studio_id=$1)::int as slots,(select count(*) from galleries where studio_id=$1)::int as galleries',[s.sid]);
  await writeFile('/tmp/proofroom-qa/product-experience-test-state.json',JSON.stringify({checkedAt:new Date().toISOString(),...s,password,projects,counts:counts.rows[0],checked,errors},null,2),{mode:0o600});console.info('[mock-counts] '+JSON.stringify(counts.rows[0]));
 }finally{await guest.close();await db.end();}
});
