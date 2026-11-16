import {test,expect,type Page,type APIResponse,type Locator} from '@playwright/test';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';
import {chooseOption,openActions} from './select-choice';

const config=dotenv.parse(readFileSync('.env')),headers={origin:'http://127.0.0.1:18186'};
async function data(response:APIResponse){expect(response.status()).toBe(200);return (await response.json()).data;}
async function seed(page:Page,{studioName='入口验收工作室',projectTitle='入口位置验收项目',packageName='本地验收套餐'}:{studioName?:string;projectTitle?:string;packageName?:string}={}){
 const tag=randomBytes(6).toString('hex'),slug='actions-'+tag;
 const auth=await data(await page.request.post('/api/v1/auth/register',{headers,data:{username:'actions_'+tag,email:'actions-'+tag+'@example.test',name:'入口验收摄影师',password:'Local-Actions!5291',studioName,slug}}));
 const sid=auth.studioId as string,base=`/api/v1/studios/${sid}`;
 const profile=await data(await page.request.get(base+'/config/profile'));
 await data(await page.request.put(base+'/config/profile',{headers,data:{version:profile.version,value:{...profile.value,name:studioName,wechat:'actions-studio'}}}));
 const portfolio=await data(await page.request.get(base+'/config/portfolio'));
 await data(await page.request.put(base+'/config/portfolio',{headers,data:{version:portfolio.version,value:{...portfolio.value,groups:Array.from({length:8},(_,i)=>({id:randomUUID(),name:'作品类别 '+(i+1)}))}}}));
 const project=await data(await page.request.post(base+'/projects',{headers,data:{key:randomUUID(),name:'入口客户',wechat:'actions-client',phoneLast4:'',pin:'4826',title:projectTitle,packageSource:'custom',packageId:null,contentVersion:1,quota:2,price:'',special:'原始约定保留',dateFlexible:true,intendedDate:'',slotId:null,slotVersion:null}}));
 const detail=await data(await page.request.get(base+'/projects/'+project.id));
 const content=await data(await page.request.get(base+'/config/content'));await data(await page.request.put(base+'/config/content',{headers,data:{version:content.version,value:{packages:[{id:randomUUID(),name:packageName,price:'1280',quota:2,description:'仅供本地隔离验收'}],faq:[{id:randomUUID(),question:'可以改期吗？',answer:'联系摄影师核对可用时段后调整。'}]}}}));
 return {sid,slug,base,project:detail};
}
test.beforeEach(async()=>{const db=new pg.Client({connectionString:config.TEST_MIGRATION_DATABASE_URL});await db.connect();try{await db.query("delete from rate_limits where key in ('register:127.0.0.1','staff-login:127.0.0.1')");}finally{await db.end();}});

async function discloseName(page:Page,heading:Locator,name:string){
 await expect(heading).toHaveText(name);const text=heading.locator('.name-disclosure-text'),arrow=heading.getByRole('button');
 await expect(arrow).toHaveAttribute('aria-expanded','false');await expect(arrow).toHaveText('');
 const controlled=await arrow.getAttribute('aria-controls');expect(controlled).toBeTruthy();expect(await text.getAttribute('id')).toBe(controlled);
 await arrow.scrollIntoViewIfNeeded();const {box,titleBox}=await heading.evaluate(el=>({box:el.querySelector('button')!.getBoundingClientRect().toJSON(),titleBox:el.getBoundingClientRect().toJSON()}));expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);expect(box.y+box.height).toBeLessThanOrEqual(titleBox.y+titleBox.height+1);
 await arrow.focus();await page.keyboard.press('Enter');await expect(arrow).toHaveAttribute('aria-expanded','true');await expect(arrow).toBeFocused();
 expect(await text.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
 await expect.poll(()=>arrow.locator('svg').evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');
 await page.keyboard.press('Space');await expect(arrow).toHaveAttribute('aria-expanded','false');await expect(arrow).toBeFocused();await expect.poll(()=>arrow.locator('svg').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
}

test('T126/127: staff long names expand from the name edge, with keyboard and narrow-screen access and no project changes',async({page})=>{
 const studioName='星光摄影'.repeat(18),projectTitle='旅行中的约定'.repeat(16),s=await seed(page,{studioName,projectTitle});let writes=0;
 page.on('request',r=>{if(r.url().includes('/api/v1/')&&!['GET','HEAD'].includes(r.method()))writes++;});
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/studio/mine?studio='+s.sid);
  await discloseName(page,page.getByRole('heading',{name:studioName,exact:true}),studioName);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width===390){await page.locator('.mine-role').click();await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m28-mine-390.png'});}
  await page.goto(`/studio/projects/${s.project.id}?studio=${s.sid}&section=overview`);
  await discloseName(page,page.getByRole('heading',{name:projectTitle,exact:true}),projectTitle);
  await expect(page.getByRole('button',{name:'复制阶段微信文案',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width===1440){await page.locator('.project-header-main .eyebrow').click();await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m28-project-1440.png'});}
 }
 await page.emulateMedia({reducedMotion:'reduce'});const arrow=page.getByRole('heading',{name:projectTitle,exact:true}).getByRole('button');await arrow.click();expect(await arrow.locator('svg').evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(.001);
 expect(writes).toBe(0);const after=await data(await page.request.get(s.base+'/projects/'+s.project.id));expect(after).toMatchObject({title:projectTitle,version:s.project.version,workflowStage:s.project.workflowStage,agreement:s.project.agreement});
});

test('T126/127: public and PIN customer names share the arrow pattern without submitting answers or changing the photo project',async({page,browser})=>{
 const studioName='留住每一束自然光'.repeat(10),projectTitle='属于我们的夏天'.repeat(15),packageName='自然纪实人像'.repeat(10),s=await seed(page,{studioName,projectTitle,packageName}),guest=await browser.newContext({baseURL:'http://127.0.0.1:18186'}),publicPage=await guest.newPage(),client=await guest.newPage();let writes=0;
 try{
  for(const p of [publicPage,client])p.on('request',r=>{if(r.url().includes('/api/v1/')&&!['GET','HEAD'].includes(r.method()))writes++;});
  await publicPage.setViewportSize({width:390,height:900});await publicPage.goto('/t/'+s.slug);
  await publicPage.getByLabel('怎么称呼你？ *',{exact:true}).fill('长名称验收客户');await chooseOption(publicPage.getByLabel('想拍什么类型的照片？ *',{exact:true}),'个人写真');
  const raw='  保留客户原文\n 不要改变肤色  ';await publicPage.getByLabel('想避免什么情况？',{exact:true}).fill(raw);await publicPage.getByLabel('你的微信号',{exact:true}).fill('name-client');await publicPage.getByLabel('项目访问码（四位数字）',{exact:true}).fill('7392');
  for(const width of [320,390,1440]){
   await publicPage.setViewportSize({width,height:900});await discloseName(publicPage,publicPage.getByRole('heading',{name:studioName,exact:true}),studioName);await discloseName(publicPage,publicPage.getByRole('heading',{name:packageName,exact:true}),packageName);
   expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await expect(publicPage.getByLabel('想避免什么情况？',{exact:true})).toHaveValue(raw);await expect(publicPage.getByLabel('项目访问码（四位数字）',{exact:true})).toHaveValue('7392');
  }
  await expect(publicPage.getByRole('button',{name:'提交拍摄咨询',exact:true})).toBeEnabled();expect(writes).toBe(0);
  const token=s.project.clientLink.split('/').pop();await data(await client.request.post(`/api/v1/client/${token}/pin`,{headers,data:{pin:'4826'}}));
  for(const width of [320,390,1440]){
   await client.setViewportSize({width,height:900});await client.goto(s.project.clientLink);await discloseName(client,client.getByRole('heading',{name:projectTitle,exact:true}),projectTitle);
   const brand=client.locator('.client-brand-toggle');await brand.click();await expect(brand).toHaveAttribute('aria-expanded','true');await expect.poll(()=>brand.locator('svg').evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(-1, 0, 0, -1, 0, 0)');await brand.click();await expect(brand).toHaveAttribute('aria-expanded','false');await expect.poll(()=>brand.locator('svg').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
   expect(await client.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
   if(width===390)await client.screenshot({path:'/tmp/proofroom-qa/apple-experience/m28-client-390.png'});
  }
  expect(writes).toBe(0);const after=await data(await page.request.get(s.base+'/projects/'+s.project.id));expect(after).toMatchObject({title:projectTitle,version:s.project.version,workflowStage:s.project.workflowStage,agreement:s.project.agreement});expect((await data(await page.request.get(s.base+'/inquiries?status=pending'))).items).toHaveLength(0);
 }finally{await guest.close();}
});

test('T135: pages rely on pull-to-refresh instead of a manual refresh entry, and primary actions stay visible on phone and desktop without writes',async({page})=>{
 test.setTimeout(90000);const s=await seed(page);let writes=0;
 page.on('request',r=>{if(r.url().includes('/api/v1/')&&!['GET','HEAD'].includes(r.method()))writes++;});
 const routes=[
  {path:'',primary:null},
  {path:'inquiries',primary:null},
  {path:'galleries',primary:'创建或进入图库'},
  {path:'schedule',primary:'新增可约时段'},
  {path:'history',primary:null},
  {path:'help',primary:'创建工作室加密备份'}
 ];
 for(const width of [320,1440]){
  await page.setViewportSize({width,height:900});
  for(const row of routes){
   await page.goto(`/studio${row.path?'/'+row.path:''}?studio=${s.sid}`);
   if(row.primary)await expect(page.getByRole('button',{name:row.primary,exact:true})).toBeVisible();
   // 下拉刷新已覆盖这些读；页面上不再保留任何手动刷新入口或只剩刷新项的菜单。
   await expect(page.getByRole('button',{name:/^刷新/})).toHaveCount(0);
   await expect(page.getByTitle(/更多.*操作/,{exact:false}).filter({hasText:/刷新/})).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
 }
 expect(writes).toBe(0);
 const after=await data(await page.request.get(s.base+'/projects/'+s.project.id));expect(after).toMatchObject({version:s.project.version,workflowStage:s.project.workflowStage,title:s.project.title});
});

test('T137: detail pages rely on the top capsule back affordance instead of an in-page return link',async({page})=>{
 test.setTimeout(90000);const s=await seed(page);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(`/studio/projects?studio=${s.sid}`);
  await page.locator('.project-card').getByRole('heading').getByRole('link').click();
  await expect(page).toHaveURL(new RegExp('/studio/projects/'+s.project.id));
  // 详情页里不再出现任何「← 返回…」链接；回到列表只走左上胶囊或浏览器历史。
  await expect(page.locator('.workspace-content').getByText(/←\s*返回/)).toHaveCount(0);
  await expect(page.locator('.workspace-content').getByRole('link',{name:/返回(项目|图库|咨询)/})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width<768){await page.getByRole('button',{name:'返回上一页',exact:true}).click();}
  else{await page.goBack();}
  await expect(page).toHaveURL(new RegExp('/studio/projects\\?studio='+s.sid));
  await expect(page.locator('.project-card')).toHaveCount(1);
 }
});

test('T114/115: inquiry actions are next to its identity, the primary entry reaches the form, and ignore or restore keeps the submitted snapshot',async({page,browser})=>{
 const s=await seed(page),guest=await browser.newContext({baseURL:'http://127.0.0.1:18186'}),customer=await guest.newPage();
 try{
  await customer.goto('/t/'+s.slug);await customer.getByLabel('怎么称呼你？ *',{exact:true}).fill('入口客户');
  await chooseOption(customer.getByLabel('想拍什么类型的照片？ *',{exact:true}),'个人写真');
  const raw='  保留原文\n 不要改变肤色  ';await customer.getByLabel('想避免什么情况？',{exact:true}).fill(raw);
  await customer.getByLabel('你的微信号',{exact:true}).fill('actions-inquiry');await customer.getByLabel('项目访问码（四位数字）',{exact:true}).fill('7392');
  await customer.getByRole('button',{name:'提交拍摄咨询',exact:true}).click();await expect(customer.getByRole('heading',{name:'咨询提交成功'})).toBeVisible();
  const list=await data(await page.request.get(s.base+'/inquiries?status=pending')),id=list.items[0].id;
  const before=await data(await page.request.get(s.base+'/inquiries/'+id));
  await page.goto(`/studio/inquiries/${id}?studio=${s.sid}`);const primary=page.getByRole('link',{name:'填写本单约定',exact:true});await expect(primary).toBeVisible();
  await primary.click();await expect(page.locator('#inquiry-project-form')).toBeFocused();
  await page.getByLabel('本单特别约定',{exact:true}).locator('xpath=ancestor::details').last().locator(':scope > summary').click();await page.getByLabel('本单特别约定',{exact:true}).fill('  本地约定草稿  ');
  const trigger=page.getByTitle('更多咨询操作',{exact:true});await openActions(trigger);await page.getByRole('button',{name:'忽略此咨询',exact:true}).click();
  const confirm=page.getByRole('dialog',{name:'忽略咨询',exact:true});await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'取消',exact:true}).click();
  await expect(confirm).not.toBeVisible();await expect(trigger).toBeFocused();await expect(page.getByLabel('本单特别约定',{exact:true})).toHaveValue('  本地约定草稿  ');
  expect((await data(await page.request.get(s.base+'/inquiries/'+id))).version).toBe(before.version);
  await openActions(trigger);await page.getByRole('button',{name:'忽略此咨询',exact:true}).click();await confirm.getByRole('button',{name:'确认忽略',exact:true}).click();await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'恢复为待确认',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'恢复为待确认',exact:true}).click();await page.getByRole('dialog',{name:'恢复咨询',exact:true}).getByRole('button',{name:'恢复为待确认',exact:true}).click();
  await expect(primary).toBeVisible();const after=await data(await page.request.get(s.base+'/inquiries/'+id));expect(after.snapshot).toEqual(before.snapshot);expect(after.status).toBe('pending');expect(after.projectId).toBeNull();
 }finally{await guest.close();}
});

test('T114: gallery upload stays in the header and form disclosures do not save or discard a draft when a destructive dialog is cancelled',async({page})=>{
 const s=await seed(page),gid=s.project.galleries.find((g:{kind:string})=>g.kind==='original').id;
 await page.setViewportSize({width:390,height:900});await page.goto(`/studio/galleries/${gid}?studio=${s.sid}`);
 const header=page.locator('.gallery-context');await expect(header.getByRole('link',{name:'进入关联项目与上传',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'复制配置到新项目',exact:true})).toBeHidden();await openActions(header.getByTitle('更多图库操作',{exact:true}));
 await expect(page.getByRole('link',{name:'复制配置到新项目',exact:true})).toBeVisible();await header.getByTitle('更多图库操作',{exact:true}).press('Escape');
 await page.goto(`/studio/portfolio?studio=${s.sid}`);await page.getByLabel('作品组1名称',{exact:true}).fill('  保留作品组编辑  ');
 let saves=0;page.on('request',r=>{if(r.url().endsWith('/config/portfolio')&&r.method()==='PUT')saves++;});
 const trigger=page.getByTitle('更多作品分组操作',{exact:true}).first();await openActions(trigger);
 await page.getByRole('button',{name:'删除分组',exact:true}).click();const confirm=page.getByRole('dialog');await expect(confirm).toBeVisible();await confirm.getByRole('button',{name:'取消',exact:true}).click();
 await expect(confirm).not.toBeVisible();await expect(trigger).toBeFocused();await expect(page.getByLabel('作品组1名称',{exact:true})).toHaveValue('  保留作品组编辑  ');expect(saves).toBe(0);
});

test('T117/118: the smaller right arrow fades without an invisible hit target and section dividers leave readable space on phone and desktop',async({page})=>{
 const s=await seed(page);await page.setViewportSize({width:390,height:900});await page.goto('/t/'+s.slug);
 const rail=page.locator('[data-rail-label="作品分组"]'),tabs=rail.getByRole('tablist'),arrow=rail.locator('.rail-next');await expect(arrow).toHaveAttribute('data-visible','true');
 expect(await arrow.locator('svg').getAttribute('width')).toBe('16');await expect.poll(()=>arrow.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
 const during=await tabs.evaluate(async el=>{const arrow=el.parentElement!.querySelector<HTMLButtonElement>('.rail-next')!;el.scrollTo({left:el.scrollWidth,behavior:'instant'});await new Promise<void>(resolve=>{const check=()=>arrow.getAttribute('data-visible')==='false'?resolve():requestAnimationFrame(check);check();});let opacity=1;/* 160ms 渐隐的起点帧数不固定，逐帧等到第一个中间值，避免采到过渡尚未启动的 1。 */for(let i=0;i<24&&opacity>=1;i++){await new Promise(r=>requestAnimationFrame(()=>r(null)));opacity=Number(getComputedStyle(arrow).opacity);}return {opacity,pointer:getComputedStyle(arrow).pointerEvents,disabled:arrow.disabled,tabIndex:arrow.tabIndex};});
 expect(during.opacity).toBeGreaterThan(0);expect(during.opacity).toBeLessThan(1);expect(during.pointer).toBe('none');expect(during.disabled).toBe(true);expect(during.tabIndex).toBe(-1);
 await expect(arrow).not.toBeVisible();await tabs.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));await expect(arrow).toHaveAttribute('data-visible','true');await expect(arrow).toBeEnabled();
 await page.emulateMedia({reducedMotion:'reduce'});await tabs.evaluate(el=>el.scrollTo({left:el.scrollWidth,behavior:'instant'}));await expect(arrow).not.toBeVisible();expect(await arrow.evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(.00001);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});const sections=page.locator('.inquiry-form .public-section');await expect(sections.first()).toBeVisible();
  for(const section of await sections.all()){
   const gap=await section.evaluate(el=>{const r=el.getBoundingClientRect(),first=el.firstElementChild?.getBoundingClientRect();return first?first.top-r.top:100;});expect(gap).toBeGreaterThanOrEqual(20);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m25-public-1440.png',fullPage:false});
});

test('T119/120: mobile search and horizontal sort keep conditions and IME intent; the bottom choice sheet cancels without filtering and retains desktop selection',async({page})=>{
 const s=await seed(page);await page.setViewportSize({width:390,height:900});await page.goto(`/studio/projects?studio=${s.sid}`);
 await expect(page.getByRole('heading',{name:s.project.title})).toBeVisible();let reads=0;
 page.on('request',r=>{if(r.method()==='GET'&&r.url().includes(s.base+'/projects?'))reads++;});
 const search=page.getByLabel('搜索项目',{exact:true});await search.fill('入口');
 await search.dispatchEvent('compositionstart');await search.press('Enter');await page.waitForTimeout(100);expect(reads).toBe(0);
 await search.dispatchEvent('compositionend');await page.evaluate(()=>new Promise(requestAnimationFrame));
 await search.press('Enter');await expect(page).toHaveURL(/q=%E5%85%A5%E5%8F%A3/);
 const sorts=page.getByRole('group',{name:'项目排序',exact:true});await expect(page.getByRole('combobox',{name:'项目排序',exact:true})).toHaveCount(0);
 await sorts.getByRole('button',{name:'最早创建优先',exact:true}).click();await expect(page).toHaveURL(/sort=oldest/);await expect(search).toHaveValue('入口');
 await sorts.getByRole('button',{name:'最近预约优先',exact:true}).focus();await page.keyboard.press('Enter');await expect(sorts.getByRole('button',{name:'最近预约优先',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goBack();await expect(sorts.getByRole('button',{name:'最早创建优先',exact:true})).toHaveAttribute('aria-pressed','true');await expect(search).toHaveValue('入口');
 await page.goto(`/studio/galleries?studio=${s.sid}`);const kind=page.getByRole('combobox',{name:'图库类别',exact:true});await expect(kind).toHaveAttribute('data-value','all');await kind.click();
 const list=page.getByRole('listbox');await expect(list).toBeVisible();expect((await page.locator('.mobile-select-sheet').boundingBox())!.y).toBeGreaterThan(500);
 await page.locator('.mobile-select-toolbar').getByRole('button',{name:'取消',exact:true}).click();await expect(list).toHaveCount(0);await expect(kind).toBeFocused();await expect(kind).toHaveAttribute('data-value','all');expect(new URL(page.url()).searchParams.has('kind')).toBe(false);
 await chooseOption(kind,'retouched');await expect(kind).toHaveAttribute('data-value','retouched');await expect(page).toHaveURL(/kind=retouched/);
 await page.setViewportSize({width:1440,height:900});await kind.click();await expect(page.locator('.mobile-select-sheet')).toHaveCount(0);await expect(list).toBeVisible();await kind.press('Escape');await expect(kind).toHaveAttribute('data-value','retouched');await kind.press('Home');await expect(list).toBeVisible();await kind.press('End');await kind.press('Enter');await expect(kind).toHaveAttribute('data-value','retouched');
});


test('T120: an open mobile choice closes on inherited readonly without changing its value or leaving the page scroll-locked',async({page})=>{
 const s=await seed(page);await page.setViewportSize({width:390,height:900});await page.goto(`/studio/new?studio=${s.sid}`);
 const control=page.getByRole('combobox',{name:'本单套餐来源',exact:true});await expect(control).toBeVisible();const before=await control.getAttribute('data-value'),overflow=await page.evaluate(()=>document.body.style.overflow);
 await control.click();await expect(page.getByRole('listbox')).toBeVisible();await control.locator('xpath=ancestor::fieldset').first().evaluate(el=>el.setAttribute('disabled',''));
 await expect(page.getByRole('listbox')).toHaveCount(0);await expect(control).toHaveAttribute('data-value',before!);await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe(overflow);
 expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
});

test('T120: a real Member cannot use a portalled action sheet to edit disabled package content',async({page,browser})=>{
 const s=await seed(page),tag=randomBytes(5).toString('hex'),email='actions-member-'+tag+'@example.test';
 const invitation=await data(await page.request.post(s.base+'/invitations',{headers,data:{email,role:'member'}}));
 const member=await browser.newContext({baseURL:'http://127.0.0.1:18186',viewport:{width:390,height:900}});
 try{
  await data(await member.request.post('/api/v1/auth/register-invited',{headers,data:{username:'actions_member_'+tag,email,name:'入口验收成员',password:'Local-ActionsMember!5291',invitationToken:invitation.token}}));
  const screen=await member.newPage(),before=await data(await member.request.get(s.base+'/config/content'));let writes=0;
  screen.on('request',r=>{if(r.url().includes(s.base+'/config/')&&r.method()!=='GET')writes++;});
  await screen.goto(`/studio/content?studio=${s.sid}`);const trigger=screen.getByTitle('更多套餐操作',{exact:true}).first();
  await trigger.locator('xpath=ancestor::details[not(contains(@class,"action-menu"))]').locator(':scope > summary').click();
  await trigger.click();await expect(trigger.locator('xpath=parent::details')).not.toHaveAttribute('open','');
  await expect(screen.getByRole('dialog')).toHaveCount(0);expect(writes).toBe(0);
  expect(await data(await member.request.get(s.base+'/config/content'))).toEqual(before);
 }finally{await member.close();}
});

test('T121: the phone capsule is visually compact with full hit targets and its shortcuts copy, recover focus and navigate without reloading the shell',async({page})=>{
 const s=await seed(page);await page.goto(`/studio?studio=${s.sid}`);
 for(const width of [320,390,767,768,1440]){
  await page.setViewportSize({width,height:900});const capsule=page.locator('.header-capsule'),trigger=page.getByRole('button',{name:'快捷操作',exact:true});
  if(width<768){
   await expect(trigger).toBeVisible();const measure=await capsule.evaluate(el=>{const box=el.getBoundingClientRect(),skin=getComputedStyle(el,'::before');return {width:box.width,height:box.height,skinHeight:parseFloat(skin.height),buttons:Array.from(el.querySelectorAll('button')).map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height,icon:b.querySelector('svg')?.getAttribute('width')}))};});
   expect(measure.width).toBe(88);expect(measure.height).toBe(44);expect(measure.skinHeight).toBe(32);for(const b of measure.buttons){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.icon).toBe('18');}
  }else{await expect(capsule).not.toBeVisible();await expect(page.getByRole('button',{name:'切换工作室',exact:true})).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await page.setViewportSize({width:390,height:900});const trigger=page.getByRole('button',{name:'快捷操作',exact:true});await trigger.click();const menu=page.getByRole('dialog',{name:'快捷操作',exact:true});await expect(menu.locator(':scope > .product-dialog-surface')).toHaveAttribute('data-motion-state','idle');
 for(const name of ['待处理项目','拍摄日程','复制售前链接'])await expect(menu.getByRole('button',{name,exact:true})).toHaveCount(1);
 await expect(menu.getByText('创建另一个工作室',{exact:true})).toHaveCount(0);await expect(menu.getByRole('button',{name:/所有者/})).toHaveCount(0);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as any).__capsuleCopy=text;}}}));
 const copy=menu.getByRole('button',{name:'复制售前链接',exact:true});await copy.click();expect(await page.evaluate(()=>(window as any).__capsuleCopy)).toBe('http://127.0.0.1:18186/t/'+s.slug);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('denied','NotAllowedError');}}}));await copy.click();const fallback=page.getByRole('dialog',{name:'手动复制内容',exact:true});await expect(fallback.getByLabel('可手动复制的内容')).toHaveValue('http://127.0.0.1:18186/t/'+s.slug);await fallback.getByRole('button',{name:'关闭',exact:true}).click();await expect(fallback).not.toBeVisible();await expect(copy).toBeFocused();
 await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m26-quick-390.png'});
 await menu.getByRole('button',{name:'取消',exact:true}).click();await expect(menu).not.toBeVisible();await expect(trigger).toBeFocused();
 const network:string[]=[];page.on('request',r=>{if(['document','script','stylesheet'].includes(r.resourceType()))network.push(r.resourceType());});await page.evaluate(()=>{(window as any).__capsuleShell=document.querySelector('.workspace');});
 await trigger.click();await menu.getByRole('button',{name:'待处理项目',exact:true}).click();await expect(page).toHaveURL(/filter=needsAction/);expect(await page.evaluate(()=>(window as any).__capsuleShell===document.querySelector('.workspace'))).toBe(true);expect(network).toEqual([]);await trigger.click();await expect(menu).toBeVisible();await page.setViewportSize({width:1440,height:900});await expect(menu).not.toBeVisible();await expect(page.locator('.sidebar')).toBeVisible();
});

test('T122: shortcut navigation protects a phone draft and Mine retains actual studio creation and switching for the same account',async({page})=>{
 test.setTimeout(65000);const s=await seed(page),before=await data(await page.request.get('/api/v1/auth/me'));await page.setViewportSize({width:390,height:900});await page.goto(`/studio/new?studio=${s.sid}`);
 const name=page.getByLabel('客户称呼',{exact:true}),raw='  保留我的新客户草稿  ';await name.fill(raw);await page.getByRole('button',{name:'快捷操作',exact:true}).click();await page.getByRole('dialog',{name:'快捷操作',exact:true}).getByRole('button',{name:'拍摄日程',exact:true}).click();
 const guard=page.getByRole('dialog',{name:'尚有未保存内容',exact:true});await expect(guard).toBeVisible();await guard.getByRole('button',{name:'取消',exact:true}).click();await expect(guard).not.toBeVisible();await expect(name).toHaveValue(raw);await expect(page.getByRole('button',{name:'快捷操作',exact:true})).toBeFocused();
 await page.getByRole('navigation',{name:'手机主导航',exact:true}).getByRole('button',{name:'我的',exact:true}).click();await expect(guard).toBeVisible();await guard.getByRole('button',{name:'离开此页',exact:true}).click();await expect(guard).not.toBeVisible();await expect(page).toHaveURL(/\/studio\/mine\?/);
 const manager=page.getByRole('button',{name:'工作室管理',exact:false});await expect(manager).toHaveCount(1);await manager.click();const studios=page.getByRole('dialog',{name:'工作室',exact:true});await expect(studios.getByRole('button',{name:'入口验收工作室 · 所有者',exact:true})).toBeVisible();await studios.getByText('创建另一个工作室',{exact:true}).click();
 const slug='capsule-'+randomBytes(6).toString('hex');await studios.getByLabel('工作室名称',{exact:true}).fill('胶囊创建工作室');await studios.getByLabel('公开页地址',{exact:true}).fill(slug);await studios.getByRole('button',{name:'创建工作室',exact:true}).click();await expect(studios).not.toBeVisible();
 const after=await data(await page.request.get('/api/v1/auth/me'));expect(after.user.id).toBe(before.user.id);expect(after.studios).toHaveLength(before.studios.length+1);await expect(page).toHaveURL(/\/studio\?studio=/);
 await page.getByRole('navigation',{name:'手机主导航',exact:true}).getByRole('button',{name:'我的',exact:true}).click();await manager.click();await studios.getByRole('button',{name:'入口验收工作室 · 所有者',exact:true}).click();await expect(studios).not.toBeVisible();await expect(page).toHaveURL(new RegExp('studio='+s.sid));
 await page.getByRole('navigation',{name:'手机主导航',exact:true}).getByRole('button',{name:'新建',exact:true}).click();await page.getByRole('button',{name:'恢复本单草稿',exact:true}).click();await expect(name).toHaveValue(raw);
 const project=await data(await page.request.get(s.base+'/projects/'+s.project.id));expect(project.version).toBe(s.project.version);expect(project.title).toBe(s.project.title);
});

test('T123: a capsule copy fallback cannot outlive its panel across breakpoints or a delayed clipboard rejection',async({page})=>{
 const s=await seed(page);await page.setViewportSize({width:390,height:900});await page.goto(`/studio?studio=${s.sid}`);
 const trigger=page.getByRole('button',{name:'快捷操作',exact:true}),menu=page.getByRole('dialog',{name:'快捷操作',exact:true});await trigger.click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('denied','NotAllowedError');}}}));
 await menu.getByRole('button',{name:'复制售前链接',exact:true}).click();await expect(page.getByRole('dialog',{name:'手动复制内容',exact:true})).toBeVisible();await page.setViewportSize({width:1440,height:900});await expect(page.locator('dialog[open]')).toHaveCount(0);
 await page.setViewportSize({width:390,height:900});await trigger.click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise((_,reject)=>{(window as any).__lateCapsuleReject=()=>reject(new DOMException('denied','NotAllowedError'));})}}));
 await menu.getByRole('button',{name:'复制售前链接',exact:true}).click();await menu.getByRole('button',{name:'取消',exact:true}).click();await expect(menu).not.toBeVisible();await page.evaluate(()=>(window as any).__lateCapsuleReject());await page.waitForTimeout(300);await expect(page.locator('dialog[open]')).toHaveCount(0);
 await trigger.click();await expect(menu.getByRole('button',{name:'复制售前链接',exact:true})).toBeEnabled();await expect(page.getByRole('dialog',{name:'手动复制内容',exact:true})).toHaveCount(0);
});

test('T124: copy success waits for the clipboard and uses one temporary toast without adding height to its card',async({page})=>{
 const s=await seed(page);await page.goto(`/studio/projects?studio=${s.sid}`);const card=page.locator('.project-card').filter({hasText:s.project.title}),copy=card.getByRole('button',{name:'复制客户微信 actions-client',exact:true});
 await page.setViewportSize({width:390,height:900});await expect(copy).toBeVisible();const height=(await card.boundingBox())!.height;
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(text:string)=>{(window as any).__toastCopy=text;return new Promise<void>(resolve=>{(window as any).__resolveToastCopy=resolve;});}}}));
 await copy.click();await expect(copy).toBeDisabled();await expect(page.locator('.copy-toast')).toHaveCount(0);await expect(card.locator('.copy-feedback')).toHaveCount(0);expect((await card.boundingBox())!.height).toBe(height);
 await page.evaluate(()=>(window as any).__resolveToastCopy());const toast=page.locator('.copy-toast');await expect(toast).toHaveText('已复制微信号');await expect.poll(()=>toast.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);expect(await page.evaluate(()=>(window as any).__toastCopy)).toBe('actions-client');expect((await card.boundingBox())!.height).toBe(height);await expect(toast).toHaveCSS('pointer-events','none');
 await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m27-copy-390.png'});await expect(toast).toHaveCount(0,{timeout:4000});await expect(card.locator('.copy-feedback')).toHaveCount(0);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
 for(const width of [320,1440]){await page.setViewportSize({width,height:900});const before=(await card.boundingBox())!.height;await copy.click();await copy.click();await expect(toast).toHaveCount(1);await expect(toast).toHaveText('已复制微信号');const r=(await toast.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(12);expect(r.x+r.width).toBeLessThanOrEqual(width-12);expect((await card.boundingBox())!.height).toBe(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 await page.emulateMedia({reducedMotion:'reduce'});await copy.click();await expect(toast).toHaveCSS('animation-name','none');await expect(toast).toHaveCount(0,{timeout:4000});
 await page.setViewportSize({width:390,height:900});await page.goto(s.project.clientLink);await page.getByLabel('四位项目访问码').fill('4826');await page.getByRole('button',{name:'验证并进入',exact:true}).click();const customerCopy=page.getByRole('button',{name:'复制摄影师微信',exact:true});await expect(customerCopy).toBeVisible();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as any).__clientToastCopy=text;}}}));await customerCopy.click();await expect(toast).toHaveText('已复制微信号');expect(await page.evaluate(()=>(window as any).__clientToastCopy)).toBe('actions-studio');await expect(page.locator('.copy-feedback')).toHaveCount(0);
});

test('T125: copy toasts remain visible in a modal, failures keep manual recovery and closed sources cannot show late success',async({page})=>{
 const s=await seed(page);await page.setViewportSize({width:390,height:900});await page.goto(`/studio/projects?studio=${s.sid}`);
 const contact=page.locator('.project-card').getByRole('button',{name:'复制客户微信 actions-client',exact:true}),trigger=page.getByRole('button',{name:'快捷操作',exact:true}),menu=page.getByRole('dialog',{name:'快捷操作',exact:true}),toast=page.locator('.copy-toast');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:(text:string)=>text==='actions-client'?new Promise<void>(resolve=>{(window as any).__resolveOldToast=resolve;}):Promise.resolve()}}));await contact.click();await trigger.click();const copy=menu.getByRole('button',{name:'复制售前链接',exact:true});await copy.click();await expect(toast).toHaveText('已复制');await page.evaluate(()=>(window as any).__resolveOldToast());await expect(toast).toHaveText('已复制');await expect(toast).toHaveCount(1);await expect(menu.locator('.copy-feedback')).toHaveCount(0);
 await expect.poll(()=>toast.evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
 const painted=await toast.evaluate(el=>{const before=el.style.pointerEvents;el.style.pointerEvents='auto';const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);el.style.pointerEvents=before;return !!hit&&el.contains(hit);});expect(painted).toBe(true);await page.screenshot({path:'/tmp/proofroom-qa/apple-experience/m27-copy-modal-390.png'});
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('denied','NotAllowedError');}}}));await copy.click();const fallback=page.getByRole('dialog',{name:'手动复制内容',exact:true});await expect(fallback).toBeVisible();await expect(toast).toHaveCount(0);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));await fallback.getByRole('button',{name:'重试复制',exact:true}).click();await expect(fallback).not.toBeVisible();await expect(toast).toHaveText('已复制');await expect(copy).toBeFocused();
 await menu.getByRole('button',{name:'取消',exact:true}).click();await expect(menu).not.toBeVisible();await expect(toast).toHaveCount(0);await trigger.click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise<void>(resolve=>{(window as any).__resolveClosedToast=resolve;})}}));await copy.click();await menu.getByRole('button',{name:'取消',exact:true}).click();await expect(menu).not.toBeVisible();await page.evaluate(()=>(window as any).__resolveClosedToast());await page.waitForTimeout(200);await expect(toast).toHaveCount(0);await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('T141: every visible text field shows a friendly placeholder and required questionnaire hints stay in place',async({page})=>{
 test.setTimeout(120000);const s=await seed(page);
 const audit=async(context:string)=>{
  const fields=page.locator('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]):not([type=color]), textarea');
  const total=await fields.count();const missing:string[]=[];
  for(let i=0;i<total;i++){const field=fields.nth(i);if(!await field.isVisible())continue;if(await field.evaluate(el=>!!el.closest('.honeypot')))continue;const placeholder=(await field.getAttribute('placeholder'))?.trim();if(!placeholder)missing.push(await field.evaluate((el:HTMLElement)=>(el as HTMLInputElement).id||el.getAttribute('aria-label')||(el as HTMLInputElement).name||el.outerHTML.slice(0,60)));}
  expect(missing,`${context} 缺少 placeholder`).toEqual([]);expect(total).toBeGreaterThan(0);
 };
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/t/'+s.slug);await page.getByLabel('怎么称呼你？ *',{exact:true}).waitFor();
  await expect(page.getByLabel('怎么称呼你？ *',{exact:true})).toHaveAttribute('placeholder','请输入你的称呼，例如：小林');
  await expect(page.getByLabel('你的微信号',{exact:true})).toHaveAttribute('placeholder','请输入你的微信号，方便摄影师联系你');
  await expect(page.getByLabel('项目访问码（四位数字）',{exact:true})).toHaveAttribute('placeholder','请输入 4 位数字访问码');
  await expect(page.getByRole('combobox',{name:'想拍什么类型的照片？ *',exact:true})).toContainText('请选择想拍什么类型的照片');
  await audit(`公开问卷 ${width}`);
 }
 for(const [path,context] of [['/studio/new','新建项目'],['/studio/profile','工作室资料'],['/studio/account','账号安全'],['/studio/galleries','图库列表'],['/studio/history','历史记录']] as const){
  await page.setViewportSize({width:1440,height:900});await page.goto(`${path}?studio=${s.sid}`);await page.waitForLoadState('networkidle');
  // 路由写错会渲染「未找到工作台页面」空态，此时零字段也躲得过 audit，所以先钉住页面真实存在
  await expect(page.getByText('未找到工作台页面'),`${context} 必须是真实路由`).toHaveCount(0);await audit(context);
 }
});

test('T142: empty dropdowns read as placeholders while real empty-value options keep normal ink',async({page})=>{
 test.setTimeout(90000);const s=await seed(page);
 const valueColor=(id:string)=>page.locator(id).locator('.select-value').evaluate(el=>getComputedStyle(el).color);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/t/'+s.slug);await page.locator('#answer-q2').waitFor();
  await expect(page.locator('#answer-q2')).toHaveAttribute('data-placeholder','true');
  await expect(page.locator('#intended-package')).not.toHaveAttribute('data-placeholder','true');
  const prompt=await valueColor('#answer-q2'),decided=await valueColor('#intended-package');
  expect(prompt,`${width} 未选择的下拉应按占位色显示`).not.toBe(decided);
  await page.locator('#answer-q2').scrollIntoViewIfNeeded();await page.locator('#answer-q2').click();
  await page.getByRole('option',{name:'个人写真',exact:true}).click();
  await expect(page.locator('#answer-q2')).toHaveAttribute('data-value','个人写真');
  await expect(page.locator('#answer-q2')).not.toHaveAttribute('data-placeholder','true');
  expect(await valueColor('#answer-q2'),`${width} 选中后应恢复正常字色`).toBe(decided);
 }
});
