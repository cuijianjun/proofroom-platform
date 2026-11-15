'use strict';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const icon=name=>`<svg aria-hidden="true"><use href="#${name}"/></svg>`;
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groupData=[['all','全部'],['portrait','个人写真'],['couple','情侣'],['family','家庭'],['documentary','纪实'],['business','商业形象']];
const originals=[
  {src:'portrait.jpg',name:'光落在肩上的时候',group:'portrait',position:'center 32%'},
  {src:'couple.jpg',name:'和你一起，慢慢走',group:'couple',position:'center'},
  {src:'family.jpg',name:'我们的一家人',group:'family',position:'center'},
  {src:'portrait-2.jpg',name:'不用看镜头的午后',group:'portrait',position:'center 30%'},
  {src:'landscape.jpg',name:'在路上的风景',group:'documentary',position:'center'},
  {src:'business.jpg',name:'自然，也很有力量',group:'business',position:'center 32%'}
];
const photos=Array.from({length:18},(_,i)=>({...originals[i%6],id:'photo-'+(i+1),name:originals[i%6].name+(i>=6?' · '+(Math.floor(i/6)+1):'')}));
const state={group:'all',selected:new Set(),onlySelected:false,limit:6,package:null,slot:null,pendingSlot:undefined,date:0,slotError:false,lightbox:0,long:false,screen:'public',module:'mine'};
const dates=[{day:'11/21',week:'周六',label:'11月21日 周六'},{day:'11/22',week:'周日',label:'11月22日 周日'},{day:'11/23',week:'周一',label:'11月23日 周一'}];
const slots=[
  {id:'sat-am',date:0,time:'09:00–10:00',available:false},
  {id:'sat-noon',date:0,time:'10:30–11:30',available:true},
  {id:'sat-pm',date:0,time:'14:00–15:00',available:true},
  {id:'sun-am',date:1,time:'09:00–10:00',available:true},
  {id:'sun-noon',date:1,time:'10:30–11:30',available:false},
  {id:'sun-pm',date:1,time:'14:00–15:00',available:true},
  {id:'mon-am',date:2,time:'09:00–10:00',available:false},
  {id:'mon-pm',date:2,time:'14:00–15:00',available:false}
];
let toastTimer,opener=new WeakMap();
function toast(message){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3200);}
function openDialog(id){const dialog=$('#'+id);opener.set(dialog,document.activeElement);dialog.showModal();const heading=$('h2',dialog);if(heading){heading.tabIndex=-1;heading.focus();}}
function closeDialog(dialog){dialog.close();}
$$('dialog').forEach(dialog=>{
  const title=$('h2',dialog);if(title){if(!title.id)title.id=dialog.id+'-title';dialog.setAttribute('aria-labelledby',title.id);}
  dialog.addEventListener('close',()=>{const previous=opener.get(dialog);const photo=previous?.getAttribute('data-photo');const target=previous?.isConnected?previous:(photo?$(`[data-photo="${photo}"]`):null)??(state.screen==='public'?$('#selected-filter'):$('#studio-content'));if(target instanceof HTMLElement)target.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=$$('button,a[href],input,textarea,summary,[tabindex="0"]',dialog).filter(e=>!e.disabled&&e.getClientRects().length&&!e.closest('[hidden]'));
    if(!controls.length)return;
    const index=controls.indexOf(document.activeElement);
    if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===controls.length-1){event.preventDefault();controls[event.shiftKey?controls.length-1:0].focus();}
  });
});
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));

function groupName(id){const normal=groupData.find(g=>g[0]===id)?.[1]??id;return state.long&&id==='portrait'?'个人写真 · 自然光与城市日常影像作品集 · 完整分类名称保留'.repeat(3):normal;}
function renderGroups(){
  $('.category-tabs').innerHTML=groupData.map(([id])=>`<button role="tab" id="tab-${id}" aria-controls="photo-panel" aria-selected="${state.group===id}" tabindex="${state.group===id?0:-1}" title="${escapeText(groupName(id))}" data-group="${id}">${escapeText(groupName(id))}</button>`).join('');
  $('#photo-panel').setAttribute('aria-labelledby','tab-'+state.group);
  $('#photo-panel').setAttribute('aria-label',groupName(state.group)+'作品');
  $('#full-groups').innerHTML=groupData.map(([id])=>`<button data-group="${id}" aria-pressed="${state.group===id}"><span>${escapeText(groupName(id))}</span>${state.group===id?icon('check'):icon('chevron')}</button>`).join('');
}
function shownPhotos(){return photos.slice(0,state.limit).filter(p=>(state.group==='all'||p.group===state.group)&&(!state.onlySelected||state.selected.has(p.id)));}
function renderPhotos(){
  const shown=shownPhotos();
  $('#photo-grid').innerHTML=shown.map(photo=>`<article class="photo-card" aria-label="作品 ${escapeText(photo.name)}"><div class="photo-frame"><button class="photo-open" data-photo="${photo.id}" aria-label="查看大图 ${escapeText(photo.name)}"><img src="${photo.src}" style="object-position:${photo.position}" loading="lazy" alt="${escapeText(photo.name)}"><span class="photo-zoom">${icon('expand')}</span></button></div><h3>${escapeText(photo.name)}</h3><div class="photo-meta"><small>${escapeText(groupData.find(g=>g[0]===photo.group)[1])}</small><button class="reference-choice" data-reference="${photo.id}" aria-pressed="${state.selected.has(photo.id)}" aria-label="选作参考 ${escapeText(photo.name)}"><span>${icon('check')}</span><span>${state.selected.has(photo.id)?'已选参考':'选作参考'}</span></button></div></article>`).join('');
  $('#empty-photos').hidden=shown.length>0;
  if(!shown.length){$('h3',$('#empty-photos')).textContent=state.onlySelected?'还没有选中这类参考作品':'这个分类的作品正在准备';$('p',$('#empty-photos')).textContent=state.onlySelected?'可以先返回全部作品，再挑选喜欢的感觉。参考作品不是必选项。':'可以看看其他分类，或直接填写咨询。';}
  $('#load-more').hidden=state.onlySelected||state.limit>=photos.length;
  $('#selected-filter').innerHTML=state.onlySelected?`查看全部作品 ${icon('image')}`:`已选参考 <span class="selected-number">${state.selected.size}</span>`;
  $('#selected-filter').setAttribute('aria-pressed',String(state.onlySelected));
  syncPlan();
}
function setGroup(id,focus=false){state.group=id;renderGroups();renderPhotos();const tab=$('#tab-'+id);if(focus)tab.focus({preventScroll:true});tab.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
function toggleReference(id){
  if(state.selected.has(id))state.selected.delete(id);
  else if(state.selected.size>=15){toast('最多选择15张参考作品，请先移除一张。');return;}
  else state.selected.add(id);
  const active=document.activeElement?.getAttribute('data-reference');
  renderPhotos();if(active)$(`[data-reference="${active}"]`)?.focus({preventScroll:true});
  if($('#lightbox').open)renderLightbox();
}
$('.category-tabs').addEventListener('click',event=>{const tab=event.target.closest('[data-group]');if(tab)setGroup(tab.dataset.group,true);});
$('.category-tabs').addEventListener('keydown',event=>{
  const index=groupData.findIndex(g=>g[0]===state.group);let next;
  if(event.key==='ArrowRight')next=(index+1)%groupData.length;
  if(event.key==='ArrowLeft')next=(index-1+groupData.length)%groupData.length;
  if(event.key==='Home')next=0;if(event.key==='End')next=groupData.length-1;
  if(next!==undefined){event.preventDefault();setGroup(groupData[next][0],true);}
});
$('#full-groups').addEventListener('click',event=>{const button=event.target.closest('[data-group]');if(button){const id=button.dataset.group;closeDialog($('#group-dialog'));setGroup(id,true);}});
$('#all-groups').addEventListener('click',()=>openDialog('group-dialog'));
$('#reset-category').addEventListener('click',()=>{state.onlySelected=false;setGroup('all',true);});
$('#selected-filter').addEventListener('click',()=>{state.onlySelected=!state.onlySelected;state.group='all';renderGroups();renderPhotos();});
$('#load-more').addEventListener('click',()=>{state.limit=Math.min(photos.length,state.limit+6);renderPhotos();if(state.limit===photos.length)$('#photo-panel').focus({preventScroll:true});toast('已展示更多示意作品');});
$('#photo-grid').addEventListener('click',event=>{
  const reference=event.target.closest('[data-reference]');if(reference){toggleReference(reference.dataset.reference);return;}
  const image=event.target.closest('[data-photo]');if(image){state.lightbox=shownPhotos().findIndex(p=>p.id===image.dataset.photo);renderLightbox();openDialog('lightbox');}
});
function renderLightbox(){const items=shownPhotos();if(!items.length){closeDialog($('#lightbox'));return;}state.lightbox=(state.lightbox+items.length)%items.length;const photo=items[state.lightbox];$('#large-photo').src=photo.src;$('#large-photo').alt=photo.name;$('#lightbox-title').textContent=photo.name;$('#lightbox-count').textContent=`${state.lightbox+1} / ${items.length}`;$('#lightbox-select').textContent=state.selected.has(photo.id)?'已选参考 · 点击取消':'选作参考';$('#lightbox-select').setAttribute('aria-pressed',String(state.selected.has(photo.id)));$('#lightbox-select').dataset.reference=photo.id;}
$('#previous-photo').addEventListener('click',()=>{state.lightbox--;renderLightbox();});
$('#next-photo').addEventListener('click',()=>{state.lightbox++;renderLightbox();});
$('#lightbox-select').addEventListener('click',()=>toggleReference($('#lightbox-select').dataset.reference));
$('#lightbox').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();state.lightbox+=event.key==='ArrowLeft'?-1:1;renderLightbox();}});
let touchX=0;
$('.lightbox-image').addEventListener('touchstart',event=>{touchX=event.touches[0].clientX;},{passive:true});
$('.lightbox-image').addEventListener('touchend',event=>{const delta=event.changedTouches[0].clientX-touchX;if(Math.abs(delta)>60){state.lightbox+=delta<0?1:-1;renderLightbox();}},{passive:true});

function packageName(){return state.package?state.package==='portrait'?(state.long?'自然光个人写真 · 城市与日常的完整影像记录方案'.repeat(3):'个人写真'):'家庭纪实':'暂不决定，沟通后再定';}
function slotName(id=state.slot){const slot=slots.find(s=>s.id===id);return slot?dates[slot.date].label+' '+slot.time:'稍后与摄影师沟通';}
function syncPlan(){
  $$('.selected-number').forEach(e=>e.textContent=state.selected.size);
  $$('.package-label').forEach(e=>e.textContent=packageName());
  $$('.chosen-slot-label').forEach(e=>e.textContent=slotName());
  $('#slot-label-value').textContent=state.slot?slotName():'选择日期与时段，或稍后沟通';
  $$('[data-select-package]').forEach(button=>{const selected=state.package===button.dataset.selectPackage;button.setAttribute('aria-pressed',String(selected));button.textContent=selected?'已选意向 · 点击取消':'选为意向套餐';button.closest('.package-card').dataset.selected=String(selected);});
  $('#clear-package').hidden=!state.package;
  updatePhoneAction();
}
$$('[data-select-package]').forEach(button=>button.addEventListener('click',()=>{state.package=state.package===button.dataset.selectPackage?null:button.dataset.selectPackage;syncPlan();toast(state.package?'已加入意向套餐，仍可修改。':'已清除套餐选择。');}));
$('#clear-package').addEventListener('click',()=>{state.package=null;syncPlan();});

function renderSlots(){
  $('.date-tabs').innerHTML=dates.map((date,i)=>`<button role="tab" id="date-${i}" aria-selected="${state.date===i}" aria-controls="slot-times" tabindex="${state.date===i?0:-1}" data-date="${i}"><span>${date.week}</span><strong>${date.day}</strong><small>${slots.filter(s=>s.date===i&&s.available).length?slots.filter(s=>s.date===i&&s.available).length+'个可约':'当日约满'}</small></button>`).join('');
  $('#slot-times').setAttribute('role','tabpanel');$('#slot-times').setAttribute('aria-labelledby','date-'+state.date);
  $('#slot-times').innerHTML=slots.filter(s=>s.date===state.date).map(slot=>`<button type="button" data-slot="${slot.id}" aria-pressed="${state.pendingSlot===slot.id}" ${!slot.available||state.slotError?'disabled':''}><span>${slot.time}</span><small>${!slot.available?'已预约':state.pendingSlot===slot.id?'已选意向':'可预约'}</small></button>`).join('');
  $('#none-slot').setAttribute('aria-pressed',String(state.pendingSlot===null));$('#none-slot').disabled=state.slotError;
  $('#confirm-slot').disabled=state.pendingSlot===undefined||state.slotError;
  $('#slot-summary').textContent=state.slotError?'读取失败，当前草选保留。重试成功后再确认。':state.pendingSlot===undefined?'请选择时段，也可以选择暂不预约。':state.pendingSlot===null?'暂不选时段，与摄影师沟通后再定。':slotName(state.pendingSlot);
  $('#slot-message').hidden=!state.slotError;$('#slot-message').textContent='暂时无法读取时段。不会清空已有选择，也不会把未知当成没有档期。';
  $('#slot-failure').textContent=state.slotError?'重试读取时段':'演示：时段读取失败';
}
$('#choose-slot').addEventListener('click',()=>{state.pendingSlot=state.slot??undefined;state.slotError=false;const selected=slots.find(s=>s.id===state.slot);state.date=selected?.date??0;renderSlots();openDialog('slot-dialog');});
$('.date-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-date]');if(button){state.date=Number(button.dataset.date);renderSlots();$('#date-'+state.date).focus({preventScroll:true});}});
$('.date-tabs').addEventListener('keydown',event=>{let index;if(event.key==='ArrowRight')index=(state.date+1)%dates.length;if(event.key==='ArrowLeft')index=(state.date-1+dates.length)%dates.length;if(event.key==='Home')index=0;if(event.key==='End')index=dates.length-1;if(index!==undefined){event.preventDefault();state.date=index;renderSlots();$('#date-'+index).focus({preventScroll:true});}});
$('#slot-times').addEventListener('click',event=>{const button=event.target.closest('[data-slot]');if(!button||button.disabled)return;state.pendingSlot=button.dataset.slot;renderSlots();$(`[data-slot="${state.pendingSlot}"]`).focus({preventScroll:true});});
$('#none-slot').addEventListener('click',()=>{state.pendingSlot=null;renderSlots();});
$('#confirm-slot').addEventListener('click',()=>{if(state.slotError||state.pendingSlot===undefined)return;state.slot=state.pendingSlot;syncPlan();closeDialog($('#slot-dialog'));toast(state.slot?'意向时间已回填，摄影师确认后才占档。':'已选择稍后沟通时间。');});
$('#slot-failure').addEventListener('click',()=>{state.slotError=!state.slotError;renderSlots();});

$('#shoot-types').innerHTML=['个人写真','情侣','亲子','家庭','商业形象','其他'].map(value=>`<label><input type="radio" name="shootType" value="${value}"><span>${value}</span></label>`).join('');
$('#priorities').innerHTML=['自然抓拍','妆造服装','修图程度','场景氛围','出片速度','价格'].map(value=>`<label><input type="checkbox" name="priorities" value="${value}"><span>${value}</span></label>`).join('');
const form=$('#inquiry-form');
function fieldError(input,errorId,message){input.setAttribute('aria-invalid',String(!!message));$('#'+errorId).textContent=message;}
form.addEventListener('input',event=>{
  const map={'customer-name':'name-error','customer-wechat':'wechat-error','access-code':'pin-error'};
  if(event.target.id==='access-code')event.target.value=event.target.value.replace(/\D/g,'').slice(0,4);
  if(map[event.target.id])fieldError(event.target,map[event.target.id],'');
  if(event.target.name==='shootType')$('#type-error').textContent='';
});
form.addEventListener('submit',event=>{
  event.preventDefault();const values=new FormData(form),errors=[];
  const type=String(values.get('shootType')??'');$('#type-error').textContent=type?'':'请选择这次想拍的类型。';if(!type)errors.push($('input[name="shootType"]'));
  const fields=[['customer-name','name-error',!String(values.get('customerName')??'').trim()?'请填写你的称呼。':''],['customer-wechat','wechat-error',!String(values.get('wechat')??'').trim()?'请填写便于联系的微信号。':''],['access-code','pin-error',!/^\d{4}$/.test(String(values.get('accessCode')??''))?'请设置4位数字访问码。':'']];
  fields.forEach(([id,error,message])=>{fieldError($('#'+id),error,message);if(message)errors.push($('#'+id));});
  $('#form-error').hidden=errors.length===0;
  if(errors.length){errors[0].focus();errors[0].scrollIntoView({block:'center',behavior:'smooth'});return;}
  const pairs=[['称呼',values.get('customerName')],['拍摄类型',type],['意向套餐',packageName()],['意向时段',slotName()],['参考作品',state.selected.size+'张'],['微信',values.get('wechat')]];
  $('#receipt-summary').innerHTML=pairs.map(([title,value])=>`<div><dt>${title}</dt><dd>${escapeText(value)}</dd></div>`).join('');
  openDialog('receipt-dialog');
});
async function copyWeChat(){try{await navigator.clipboard.writeText('shiguang_photo');toast('摄影师微信已复制：shiguang_photo');}catch{openDialog('copy-dialog');const input=$('input',$('#copy-dialog'));input.focus();input.select();}}
$$('[data-copy]').forEach(button=>button.addEventListener('click',copyWeChat));
$('#about-button').addEventListener('click',()=>openDialog('about-dialog'));

function updatePhoneAction(){
  const inForm=$('#inquiry').getBoundingClientRect().top<innerHeight*.5;
  $('#phone-main-action').innerHTML=(inForm?'提交咨询':'咨询拍摄')+icon('arrow');
  $('#phone-action-hint').textContent=inForm?'摄影师确认后才占档':'可不选，直接聊聊也可以';
}
$('#phone-main-action').addEventListener('click',()=>{if($('#inquiry').getBoundingClientRect().top<innerHeight*.5)form.requestSubmit();else $('#inquiry').scrollIntoView({behavior:'smooth',block:'start'});});
let scrollFrame=0;
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{updatePhoneAction();scrollFrame=0;});},{passive:true});
window.addEventListener('resize',updatePhoneAction);
const phoneBar=$('#phone-action');
new ResizeObserver(()=>document.documentElement.style.setProperty('--phone-action-height',phoneBar.getBoundingClientRect().height+'px')).observe(phoneBar,{box:'border-box'});
const sectionObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
  if(!visible)return;
  $$('.desktop-page-nav a,.phone-page-nav a').forEach(link=>{if(link.hash==='#'+visible.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
},{rootMargin:'-20% 0px -55% 0px',threshold:0});
['portfolio','packages','faq','inquiry'].forEach(id=>sectionObserver.observe($('#'+id)));

const baseIntro='个人写真、情侣与家庭记录。\n不必擅长摆姿势，一起留下自然的片刻。';
const fullIntro='我们喜欢自然光，也喜欢每个人不经意流露的样子。拍照时可以散步、聊天，不必一直看着镜头。个人写真、情侣和家庭记录，都从一次轻松的沟通开始。';
const questionText='原片、精修和交付有什么区别？';
const answerText='浏览和选片使用压缩预览。最终交付下载的是摄影师上传的原片及精修源文件，不是网页缩略图。\n\n精修张数按双方确认的套餐与约定，具体交付时间由摄影师与你沟通。';
function toggleLong(){
  state.long=!state.long;
  const longName='拾光摄影 · 自然光与城市日常 · 个人写真与家庭影像工作室'.repeat(3);
  $$('[data-brand]').forEach(e=>{e.textContent=state.long?longName:'拾光摄影';e.title=e.textContent;});
  $('#intro-preview').textContent=state.long?(fullIntro+'\n').repeat(8):baseIntro;
  $('#full-intro').textContent=state.long?(fullIntro+'\n\n').repeat(12):fullIntro;
  $('[data-package-name="portrait"]').textContent=state.long?'自然光个人写真 · 城市与日常的完整影像记录方案'.repeat(3):'个人写真';
  const item=$('.faq-item');item.dataset.long=String(state.long);item.dataset.expanded='false';
  $('[data-faq-question="0"]').textContent=state.long?'关于原片、精修、预览与源文件交付，你可能需要提前了解的完整说明（较长问题也保留全文，可明确展开阅读）'.repeat(4):questionText;
  $('[data-faq-answer="0"]').textContent=state.long?(answerText+'\n\n').repeat(10):answerText;
  const expand=$('[data-faq-expand="0"]');expand.hidden=!state.long;expand.setAttribute('aria-expanded','false');expand.innerHTML='展开完整问答 '+icon('plus');
  $('#toggle-long').setAttribute('aria-pressed',String(state.long));$('#toggle-long').textContent=state.long?'当前：长内容检查 · 点此恢复':'切换：长内容检查';
  renderGroups();renderPhotos();toast(state.long?'已切换长内容，可检查完整介绍、分类与问答。':'已恢复正常示例内容。');
}
$('#toggle-long').addEventListener('click',toggleLong);
$$('[data-faq-expand]').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.faq-item'),expanded=item.dataset.expanded!=='true';item.dataset.expanded=String(expanded);button.setAttribute('aria-expanded',String(expanded));button.innerHTML=(expanded?'收起长问答':'展开完整问答')+icon('plus');}));
$('#open-notes').addEventListener('click',()=>openDialog('notes-dialog'));

const moduleLabels={home:'工作台',projects:'项目',new:'新建',inquiries:'咨询',mine:'我的'};
function studioRows(rows){return rows.map(([title,description])=>`<button class="studio-row ${title==='退出登录'?'mobile-exit':''}" aria-label="${escapeText(title)}" data-demo-entry="${escapeText(title)}"><span><strong>${title}</strong><small>${description}</small></span>${icon('chevron')}</button>`).join('');}
function renderStudio(){
  $('#studio-page-title').textContent=moduleLabels[state.module]??'项目详情';
  $$('.studio-sidebar [data-module],.studio-phone-nav [data-module]').forEach(button=>{const selected=button.dataset.module===(state.module==='project'?'projects':state.module);if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  let html='';
  if(state.module==='mine')html=`<section class="studio-profile"><span class="brand-mark">拾</span><div><h2>拾光摄影</h2><p>微信 shiguang_photo</p></div><button class="button outline" data-demo-entry="工作室资料">编辑工作室资料</button></section><div class="studio-groups"><section class="studio-group"><h2>售前内容</h2>${studioRows([['公开作品','上传、分组与发布'],['套餐与常见问题','服务内容、精修张数与完整问答'],['售前问卷','问题、选项与必填项'],['预览客户公开页','查看客户实际看到的内容']])}</section><section class="studio-group"><h2>预约与项目</h2>${studioRows([['预约与档期','设置可约时段、查看占用与改期'],['图库','原片、精修与分享配置'],['历史记录','找回归档项目与已忽略咨询']])}</section><section class="studio-group"><h2>团队与账号</h2>${studioRows([['成员管理','邀请同事、分配角色'],['账号与安全','账号资料与密码'],['退出登录','保留账号退出入口，原型不操作真实登录']])}</section><section class="studio-group"><h2>支持与更多</h2>${studioRows([['使用帮助','流程说明与常见操作'],['平台管理','仅具备平台权限的账号显示']])}</section></div>`;
  else if(state.module==='projects'||state.module==='home')html=`<div class="section-title"><div><p class="eyebrow">${state.module==='home'?'TODAY / WORKSPACE':'PROJECTS'}</p><h2>${state.module==='home'?'今天，从这里开始':'你的拍摄项目'}</h2></div><button class="button primary" data-module="new">新建项目 ${icon('plus')}</button></div><div class="studio-project-grid"><button class="studio-project-card" data-open-project><small>等待原片</small><strong>小林的周末写真</strong><span>下一步：上传原片 ${icon('arrow')}</span></button><button class="studio-project-card" data-open-project><small>精修处理中</small><strong>一家人的午后</strong><span>下一步：核对精修 ${icon('arrow')}</span></button></div><p class="notice">导航示意：点项目查看层级路径；浏览器后退可返回列表。顶部没有额外返回按钮。</p>`;
  else if(state.module==='project')html=`<nav class="studio-crumb" aria-label="当前位置"><a href="?view=studio&module=projects" data-module="projects">项目</a><span>/</span><span>小林的周末写真</span></nav><section class="studio-placeholder"><p class="eyebrow">等待原片</p><h2>小林的周末写真</h2><p>小林 · 微信 xiaolin_photo</p><div class="studio-project-tabs" role="tablist" aria-label="项目分区">${['概览','原片','清单','交付'].map((t,i)=>`<button role="tab" aria-selected="${i===0}" data-project-tab>${t}</button>`).join('')}</div><p class="notice" id="studio-tab-copy">此处为导航原型。正式业务区域与已有功能保留，顶部保留模块标题及路径，返回使用浏览器历史或“项目”层级链接。</p></section>`;
  else html=`<section class="studio-placeholder"><p class="eyebrow">摄影师导航示意</p><h2>${moduleLabels[state.module]}</h2><p>${state.module==='new'?'新建项目、称呼/微信/访问码/约定等现有功能保留。':'待确认、已确认、已忽略咨询等现有功能保留。'}</p><button class="button outline" data-module="mine">查看我的全部保留入口 ${icon('arrow')}</button><p class="notice">这里仅确认侧栏与顶部结构，未重做或连接真实业务模块。</p></section>`;
  $('#studio-content').innerHTML=html;
}
function showScreen(screen,module=state.module,push=true){
  state.screen=screen;state.module=module;document.body.dataset.screen=screen;$('#public-view').hidden=screen!=='public';$('#studio-view').hidden=screen!=='studio';$('.skip').href=screen==='studio'?'#studio-content':'#main';$('#studio-content').tabIndex=-1;
  $$('.prototype-bar [data-screen]').forEach(button=>{if(button.dataset.screen===screen)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  if(screen==='studio')renderStudio();
  if(push){const url=new URL(location);url.searchParams.set('view',screen);if(screen==='studio')url.searchParams.set('module',module);else url.searchParams.delete('module');url.hash='';history.pushState({},'',url);window.scrollTo(0,0);}
}
$$('.prototype-bar [data-screen]').forEach(button=>button.addEventListener('click',()=>showScreen(button.dataset.screen)));
$('#show-public-from-notes').addEventListener('click',()=>{closeDialog($('#notes-dialog'));showScreen('public');});
$('#show-studio-from-notes').addEventListener('click',()=>{closeDialog($('#notes-dialog'));showScreen('studio');});
document.addEventListener('click',event=>{
  const module=event.target.closest('[data-module]');if(module){event.preventDefault();showScreen('studio',module.dataset.module);return;}
  if(event.target.closest('[data-open-project]')){showScreen('studio','project');return;}
  const tab=event.target.closest('[data-project-tab]');if(tab){$$('[data-project-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));$('#studio-tab-copy').textContent=`${tab.textContent}为保留的业务分区，正式内容沿用当前功能；这次先确认导航结构。`;return;}
  const entry=event.target.closest('[data-demo-entry]');if(entry){if(entry.dataset.demoEntry==='预览客户公开页')showScreen('public');else toast('保留入口：'+entry.dataset.demoEntry+'（导航示意）');}
});
$('#studio-switch').addEventListener('click',()=>toast('工作室切换入口保留，原型不切换真实账号。'));
$('#studio-mobile-more').addEventListener('click',()=>toast('工作室菜单保留，原型不操作真实账号。'));
$('#studio-mobile-back').addEventListener('click',()=>{if(history.length>1)history.back();else showScreen('public');});
window.addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);showScreen(params.get('view')==='studio'?'studio':'public',params.get('module')||'mine',false);});
renderGroups();renderPhotos();
const params=new URLSearchParams(location.search);showScreen(params.get('view')==='studio'?'studio':'public',params.get('module')||'mine',false);
