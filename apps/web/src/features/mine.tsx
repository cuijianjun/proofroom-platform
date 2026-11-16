'use client';
import Link from 'next/link';
import {type ReactNode} from 'react';
import type {Profile} from '@proofroom/contracts/config';
import {Button} from '@/components/ui';
import {Icon} from '@/components/ui/icons';
import {NameDisclosure} from '@/components/ui/product-experience';
import {CopyText,ErrorNotice,Loading,useResource} from '@/components/platform/core';
import {useWorkspace} from './session';

const groups=[
 {title:'售前内容',items:[['profile','工作室资料','名称、微信、工作室介绍'],['portfolio','公开作品','上传、作品分组与发布'],['content','套餐与常见问题','服务内容、价格说明与精修张数'],['questionnaire','售前问卷','问题、选项、必填项与顺序']]},
 {title:'预约与项目',items:[['schedule','预约与档期','设置可约时段、查看占用与改期'],['galleries','图库','原片、精修与分享配置'],['history','历史记录','找回归档项目与已忽略咨询']]},
 {title:'团队与账号',items:[['members','成员与权限','邀请、分工与所有权'],['account','账号安全','密码与双重验证'],['help','帮助与数据','备份、恢复和使用说明']]}
];
export function Mine({onManageStudios,onLogout,logoutBusy,logoutFeedback}:{onManageStudios:()=>void;onLogout:()=>void;logoutBusy:boolean;logoutFeedback:ReactNode}){
 const {studio,session,url,navigate}=useWorkspace(),profile=useResource<{value:Profile}>(`/studios/${studio.id}/config/profile`),portfolio=useResource<{items:{published:boolean;state:string}[]}>(`/studios/${studio.id}/portfolio`);
 const value=profile.data?.value,name=value?.name||studio.name,canEdit=studio.role!=='member'&&studio.state==='active',pending=profile.loading||portfolio.loading,failed=!!profile.error||!!portfolio.error;
 const checks=value&&portfolio.data?[{label:'联系微信',route:'profile',ok:!!value.wechat.trim()},{label:'工作室介绍',route:'profile',ok:!!value.description.trim()},{label:'公开展示作品',route:'portfolio',ok:portfolio.data.items.some(p=>p.published&&p.state==='ready')}]:[];
 const missing=checks.filter(c=>!c.ok).map(c=>c.label),done=checks.length-missing.length;
 return <><h1 className="sr-only">我的工作室</h1><section className="mine-profile card" aria-label="工作室身份"><div className="mine-avatar" aria-hidden="true">{(value?.name||studio.name).slice(0,1)}</div><div className="mine-identity"><p className="mine-role">{studio.role==='owner'?'我的工作室 · 所有者':studio.role==='admin'?'我的工作室 · 管理员':'我的工作室 · 摄影师'}</p><NameDisclosure key={name} text={name}/>{value?.wechat?<CopyText text={value.wechat} label={`微信 ${value.wechat}`} target="工作室微信" immediate/>:<p className="hint">{profile.error?'微信暂时无法读取':profile.loading?'正在读取微信…':'尚未填写联系微信'}</p>}</div></section>
 {(pending||failed||missing.length>0)&&<section className="mine-setup card card-pad" aria-label="工作室完善情况"><h2>{failed?'暂时无法核对工作室资料':pending?'正在核对工作室资料':'完善你的工作室'}</h2>{pending&&!failed?<Loading/>:null}<ErrorNotice error={profile.error} retry={profile.reload}/><ErrorNotice error={portfolio.error} retry={portfolio.reload}/>{!pending&&!failed&&missing.length>0&&<><div className="mine-progress"><p className="mine-progress-label"><strong>{done}/{checks.length}</strong>项已完善</p><span className="mine-progress-track" role="progressbar" aria-label="工作室资料完善度" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={done}><i style={{width:`${done/checks.length*100}%`}}/></span></div><div className="mine-todos">{checks.filter(c=>!c.ok).map(c=><button type="button" className="mine-todo" key={c.label} onClick={()=>navigate(url('/studio/'+c.route))}>{c.label}<Icon.ChevronRight size={14}/></button>)}</div><p className="hint">补齐后客户在公开页就能了解你的风格，再表达拍摄意向。{!canEdit&&'请联系工作室所有者或管理员完善。'}</p></>}</section>}
 <div className="mine-groups">{groups.map((group,i)=><section key={group.title} className="mine-group card" aria-labelledby={`mine-group-${i}`}><h2 id={`mine-group-${i}`}>{group.title}</h2><div>{i===2&&<button className="mine-row" type="button" onClick={onManageStudios} aria-haspopup="dialog"><span><strong>工作室管理</strong><small>切换工作室、创建新的工作室</small></span><Icon.ChevronRight/></button>}{group.items.map(([route,name,description])=>{
 const incomplete=!pending&&!failed&&(route==='profile'?missing.includes('联系微信')||missing.includes('工作室介绍'):route==='portfolio'&&missing.includes('公开展示作品'));
 return <button className="mine-row" type="button" key={route} onClick={()=>navigate(url('/studio/'+route))}><span><strong>{name}{incomplete&&<span className="mine-pending">待完善</span>}</strong><small>{description}</small></span><Icon.ChevronRight/></button>;
 })}{i===0&&<><Link className="mine-row" href={`/t/${studio.slug}`} target="_blank" rel="noopener noreferrer"><span><strong>预览售前页面</strong><small>查看客户实际看到的内容，在新窗口打开</small></span><Icon.External/></Link><div className="mine-share"><CopyText label="复制售前链接" text={typeof location==='undefined'?`/t/${studio.slug}`:`${location.origin}/t/${studio.slug}`}/></div></>}{i===2&&session.user.is_platform_admin&&!session.user.force_password_change&&<Link className="mine-row" href="/studio/platform"><span><strong>平台管理</strong><small>工作室支持与运行状态</small></span><Icon.ChevronRight/></Link>}</div></section>)}</div>
 <section className="mine-account card card-pad" aria-label="当前账号"><h2>当前账号</h2><p>{session.user.name}</p><Button variant="secondary" disabled={logoutBusy} onClick={onLogout}>退出登录</Button>{logoutFeedback}</section></>;
}
