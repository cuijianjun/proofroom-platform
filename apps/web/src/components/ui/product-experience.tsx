'use client';

import {createContext,useContext,useEffect,useId,useLayoutEffect,useMemo,useRef,useState,useSyncExternalStore,type ReactNode,type KeyboardEvent,type RefObject} from 'react';
import {cx} from '@/components/ui';
import {Icon} from '@/components/ui/icons';

// Product scope deliberately excludes platform management, including shared overlays.
type RefreshRegistry={reads:Map<symbol,()=>Promise<boolean>>;commands:Set<symbol>};
const ProductContext=createContext<{active:boolean;composing:RefObject<boolean>;registry:RefreshRegistry}|null>(null);
export const useProductExperience=()=>useContext(ProductContext)?.active??false;
const subscribeMobile=(notify:()=>void)=>{const media=matchMedia('(max-width:767px)');media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const mobileSnapshot=()=>matchMedia('(max-width:767px)').matches,serverMobile=()=>false,noMobile=()=>()=>{};
export function useMobileProductLayout(){const product=useProductExperience();return useSyncExternalStore(product?subscribeMobile:noMobile,product?mobileSnapshot:serverMobile,serverMobile);}

/** Keep long names readable without putting a second action row below the heading. */
export function NameDisclosure({text,as:Tag='h2',threshold=24,expandLabel='展开完整名称',collapseLabel='收起名称'}:{text:string;as?:'h1'|'h2'|'h3';threshold?:number;expandLabel?:string;collapseLabel?:string}){
 const [expanded,setExpanded]=useState(false),id=useId(),long=text.length>threshold;
 return <Tag className="name-disclosure" aria-label={text} data-name-expandable={long} data-expanded={expanded}><span id={id} className={cx('name-disclosure-text',long&&!expanded&&'mine-name-clamped')}>{text}</span>{long&&<button type="button" className="name-disclosure-toggle" aria-label={expanded?collapseLabel:expandLabel} aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(v=>!v)}><Icon.ChevronDown size={18}/></button>}</Tag>;
}

export const useProductComposition=()=>useContext(ProductContext)?.composing;
export function useProductRegistry(){const context=useContext(ProductContext);return context?.active?context.registry:null;}
export function useRefreshRegistration(refresh:(()=>Promise<boolean>)|null){const registry=useProductRegistry();useEffect(()=>{if(!registry||!refresh)return;const key=Symbol();registry.reads.set(key,refresh);return()=>{registry.reads.delete(key);};},[registry,refresh]);}
export function ProductExperience({active,children,pageKey}:{active:boolean;children:ReactNode;pageKey?:string}){
 const parent=useContext(ProductContext),[own]=useState<RefreshRegistry>(()=>({reads:new Map(),commands:new Set()})),registry=parent?.active?parent.registry:own;
 const composing=useRef(false),value=useMemo(()=>({active,composing,registry}),[active,registry]);
 return <ProductContext.Provider value={value}><div data-product-ui={active?'':undefined} style={{display:'contents'}} onCompositionStartCapture={active?()=>{composing.current=true;}:undefined} onCompositionEndCapture={active?()=>{requestAnimationFrame(()=>{composing.current=false;});}:undefined} onSubmitCapture={active?e=>{if(composing.current){e.preventDefault();e.stopPropagation();}}:undefined} onKeyDownCapture={active?e=>{if(composing.current||e.nativeEvent.isComposing||e.nativeEvent.keyCode===229){if(['Enter','Escape','ArrowLeft','ArrowRight'].includes(e.key))e.stopPropagation();}}:undefined}>{children}{active&&!parent?.active&&<PageRefresh key={pageKey} registry={registry}/>}</div></ProductContext.Provider>;
}

function PageRefresh({registry}:{registry:RefreshRegistry}){
 const [view,setView]=useState<{phase:'idle'|'pull'|'ready'|'loading'|'done'|'error';distance:number;left:number;top:number}>({phase:'idle',distance:0,left:0,top:0}),run=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let disposed=false,busy=false,pulling=false,start:{x:number;y:number}|null=null,distance=0,main:HTMLElement|null=null,settling:HTMLElement|null=null,original='',originalTransition='',base=0,timer:ReturnType<typeof setTimeout>|undefined,wheelTimer:ReturnType<typeof setTimeout>|undefined;
  const blocked=()=>registry.commands.size>0||!!document.querySelector('[data-upload-active=true]');
  const ignore=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('dialog,input,textarea,select,button,a,summary,label,[role=listbox],.mobile-select-sheet,[contenteditable=true]');
  function restore(animate=false){if(main){const el=main,from=getComputedStyle(el).paddingTop,to=base+'px';el.style.paddingTop=original;el.style.transition=originalTransition;main=null;if(animate){settling=el;void play(el,[{paddingTop:from},{paddingTop:to}],180,()=>{settling=null;});}else cancelProductMotion(el);}distance=0;pulling=false;start=null;}
  function begin(){if(settling){cancelProductMotion(settling);settling=null;}if(busy||blocked()||!registry.reads.size)return false;main=document.querySelector<HTMLElement>('#main');if(!main)return false;clearTimeout(timer);original=main.style.paddingTop;originalTransition=main.style.transition;base=parseFloat(getComputedStyle(main).paddingTop)||0;const r=main.getBoundingClientRect();setView({phase:'pull',distance:0,left:r.left+r.width/2,top:Math.max(8,r.top+Math.min(base,16))});return true;}
  function drag(amount:number){if(!main&&!begin())return;pulling=true;distance=Math.min(100,Math.max(0,amount*.55));if(main)main.style.paddingTop=base+distance+'px';setView(v=>({...v,phase:distance>=64?'ready':'pull',distance}));}
  async function refresh(){
   if(disposed||busy)return;if(blocked()||!registry.reads.size){restore(true);setView(v=>({...v,phase:'idle'}));return;}
   if(!main&&!begin())return;busy=true;clearTimeout(timer);if(main){main.style.transition=matchMedia('(prefers-reduced-motion: reduce)').matches?'none':'padding-top 160ms ease-out';main.style.paddingTop=base+56+'px';}setView(v=>({...v,phase:'loading',distance:56}));
   let timeout:ReturnType<typeof setTimeout>|undefined;
   const results=await Promise.race([Promise.allSettled([...registry.reads.values()].map(read=>read())).then(values=>values.every(r=>r.status==='fulfilled'&&r.value)),new Promise<boolean>(resolve=>{timeout=setTimeout(()=>resolve(false),22000);})]);clearTimeout(timeout);if(disposed)return;
   busy=false;restore(true);setView(v=>({...v,phase:results?'done':'error',distance:44}));if(results)timer=setTimeout(()=>setView(v=>({...v,phase:'idle'})),1200);
  }
  run.current=()=>{void refresh();};
  function finish(endY?:number){if(start&&endY!==undefined&&!pulling)drag(Math.max(0,endY-start.y));start=null;if(distance>=64)void refresh();else{restore(true);setView(v=>({...v,phase:'idle'}));}}
  function touchStart(e:TouchEvent){if(e.touches.length!==1||scrollY>0||ignore(e.target)||busy||blocked())return;start={x:e.touches[0].clientX,y:e.touches[0].clientY};}
  function touchMove(e:TouchEvent){if(!start||e.touches.length!==1)return;const dx=e.touches[0].clientX-start.x,dy=e.touches[0].clientY-start.y;if(Math.abs(dx)>Math.abs(dy)){start=null;return;}if(dy>8&&scrollY<=0){if(e.cancelable)e.preventDefault();drag(dy);}else if(dy<0){restore(true);setView(v=>({...v,phase:'idle'}));}}
  function touchEnd(e:TouchEvent){if(start||pulling)finish(e.changedTouches[0]?.clientY);}
  function cancel(){if(!busy){restore(true);setView(v=>({...v,phase:'idle'}));}}
  function wheel(e:WheelEvent){if(scrollY>0||e.deltaY>=0||Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.ctrlKey||ignore(e.target)||busy||blocked())return;drag(distance/.55-e.deltaY);clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>finish(),140);}
  document.addEventListener('touchstart',touchStart,{passive:true});document.addEventListener('touchmove',touchMove,{passive:false});document.addEventListener('touchend',touchEnd,{passive:true});document.addEventListener('touchcancel',cancel,{passive:true});document.addEventListener('wheel',wheel,{passive:true});
  return()=>{disposed=true;clearTimeout(timer);clearTimeout(wheelTimer);restore();if(settling)cancelProductMotion(settling);document.removeEventListener('touchstart',touchStart);document.removeEventListener('touchmove',touchMove);document.removeEventListener('touchend',touchEnd);document.removeEventListener('touchcancel',cancel);document.removeEventListener('wheel',wheel);};
 },[registry]);
 if(view.phase==='idle')return null;
 const label={pull:'下拉刷新',ready:'松手刷新',loading:'正在刷新',done:'已刷新',error:'刷新未完成，原有内容保留'}[view.phase];
 return <div className="page-refresh-feedback" data-state={view.phase} role="status" style={{left:view.left,top:view.top,opacity:view.phase==='pull'?Math.min(1,view.distance/32):1}}><span className="refresh-symbol" aria-hidden="true">{view.phase==='done'?<Icon.Check size={18}/>:view.phase==='error'?<Icon.Alert size={18}/>:<><i/><i/></>}</span><span>{label}</span>{view.phase==='error'&&<button type="button" onClick={()=>run.current()}>重试刷新</button>}</div>;
}

/** Intersection loads use the existing cursor command; failures wait for an explicit retry. */
export function LoadMore({label,loading,error,onLoad,hasMore=true}:{label:string;loading:boolean;error?:unknown;onLoad:()=>void;hasMore?:boolean}){
 const ref=useRef<HTMLButtonElement>(null),trigger=useRef(onLoad);useLayoutEffect(()=>{trigger.current=onLoad;},[onLoad]);
 useEffect(()=>{const el=ref.current;if(!el||loading||error||!hasMore)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))trigger.current();},{rootMargin:'120px'});observer.observe(el);return()=>observer.disconnect();},[loading,error,hasMore]);
 if(!hasMore&&!loading)return <div className="load-more-feedback" role="status"><Icon.Check size={16}/><span>已全部加载</span></div>;
 return <div className="load-more-feedback"><button ref={ref} type="button" className="btn-ghost" disabled={loading} aria-label={label} onClick={onLoad}>{loading?<span className="spinner" aria-hidden="true"/>:<Icon.ChevronDown size={16}/>}<span>{loading?'正在加载…':error?'加载未完成，点击重试':'上滑加载更多'}</span></button></div>;
}

// Adapted from apple-product-design/assets/motion-primitives.js. Each surface has
// one active animation: a new intent samples its current presentation and reverses.
const running=new WeakMap<HTMLElement,Animation>();
function play(el:HTMLElement,frames:Keyframe[],duration:number,settle:()=>void){
 running.get(el)?.cancel();
 const query=matchMedia('(prefers-reduced-motion: reduce)');
 if(query.matches||!el.animate){settle();return Promise.resolve(true);}
 const animation=el.animate(frames,{duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
 running.set(el,animation);
 const reduce=(event:MediaQueryListEvent)=>{if(event.matches&&running.get(el)===animation)animation.finish();};
 query.addEventListener('change',reduce);
 return animation.finished.then(()=>true,()=>false).finally(()=>{
  query.removeEventListener('change',reduce);
  if(running.get(el)===animation){running.delete(el);animation.cancel();settle();}
 });
}
export function cancelProductMotion(el:HTMLElement){const animation=running.get(el);running.delete(el);animation?.cancel();}
export function animateProductSurface(el:HTMLElement,enter:boolean){
 const current=getComputedStyle(el),sampled={opacity:current.opacity,transform:current.transform},interrupted=running.has(el);
 const rest={opacity:1,transform:'translate3d(0,0,0) scale(1)'},offset={opacity:0,transform:el.closest('.mobile-action-sheet')?'translate3d(0,100%,0) scale(1)':matchMedia('(max-width:767px)').matches?'translate3d(0,24px,0) scale(1)':'translate3d(0,10px,0) scale(1)'};
 el.dataset.motionState=enter?'entering':'leaving';
 return play(el,[interrupted?sampled:enter?offset:rest,enter?rest:offset],enter?240:160,()=>{el.dataset.motionState='idle';});
}

/** Arrows live outside the scroll viewport so they stay reachable at either end. */
export function HorizontalRail({children,label}:{children:ReactNode;label:string}){
 const host=useRef<HTMLDivElement>(null),[edge,setEdge]=useState({overflow:false,right:false});
 useLayoutEffect(()=>{
  const root=host.current,target=root?.firstElementChild as HTMLElement|null;if(!root||!target)return;
  const measure=()=>{const next={overflow:root.clientWidth>0&&target.scrollWidth>root.clientWidth+1,right:target.scrollLeft+target.clientWidth<target.scrollWidth-1};if(!next.right&&document.activeElement===root.querySelector('.rail-next')){const box=target.getBoundingClientRect(),visible=Array.from(target.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')).filter(el=>{const r=el.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.height>0;});const focus=visible.at(-1)??target;if(focus===target&&!target.hasAttribute('tabindex'))target.tabIndex=-1;focus.focus({preventScroll:true});}setEdge(old=>Object.keys(next).every(key=>old[key as keyof typeof old]===next[key as keyof typeof next])?old:next);};
  const resize=new ResizeObserver(measure);resize.observe(root);resize.observe(target);for(const el of target.children)resize.observe(el);
  const mutation=new MutationObserver(measure);mutation.observe(target,{childList:true,subtree:true});target.addEventListener('scroll',measure,{passive:true});measure();
  return()=>{resize.disconnect();mutation.disconnect();target.removeEventListener('scroll',measure);};
 },[]);
 function move(){const target=host.current?.firstElementChild as HTMLElement|null;if(target)target.scrollBy({left:Math.max(140,target.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 return <div ref={host} className="horizontal-rail" data-overflow={edge.overflow} data-has-more={edge.right} data-rail-label={label}>{children}<button type="button" className="rail-arrow rail-next" data-visible={edge.overflow&&edge.right} aria-hidden={!edge.overflow||!edge.right} tabIndex={edge.overflow&&edge.right?0:-1} disabled={!edge.overflow||!edge.right} aria-label={`向右查看${label}`} onClick={move}><Icon.ChevronRight size={16}/></button></div>;
}

/** Shared visual indicator; native links keep URL/history semantics, tabs add roving keys. */
export function SelectionNav({activeKey,label,className,children,tabList=false}:{activeKey:string;label:string;className?:string;children:ReactNode;tabList?:boolean}){
 const nav=useRef<HTMLElement>(null),indicator=useRef<HTMLSpanElement>(null),ready=useRef(false);
 useLayoutEffect(()=>{
  const root=nav.current,marker=indicator.current;if(!root||!marker)return;
  const measure=(animate:boolean)=>{
   const selected=root.querySelector<HTMLElement>('[aria-selected=true],[aria-current=page]');if(!selected){marker.style.opacity='0';return;}
   const from=getComputedStyle(marker).transform,to=`translateX(${selected.offsetLeft}px)`;
   marker.style.opacity='1';marker.style.width=selected.offsetWidth+'px';marker.style.transform=to;
   if(animate)void play(marker,[{transform:from},{transform:to}],220,()=>{marker.style.transform=to;});
   else cancelProductMotion(marker);
  };
  measure(ready.current);ready.current=true;
  let width=root.clientWidth;
  const resize=new ResizeObserver(()=>{if(root.clientWidth!==width){width=root.clientWidth;measure(false);}});resize.observe(root);
  const selected=root.querySelector<HTMLElement>('[aria-selected=true],[aria-current=page]');if(selected)resize.observe(selected);
  return()=>resize.disconnect();
 },[activeKey]);
 function keys(e:KeyboardEvent){
  if(!tabList||e.nativeEvent.isComposing||e.nativeEvent.keyCode===229)return;
  const tabs=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]:not(:disabled)')],index=tabs.indexOf(document.activeElement as HTMLButtonElement);
  const next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index-1+tabs.length)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;
  if(next<0)return;e.preventDefault();tabs[next]?.focus();tabs[next]?.click();
 }
 const navigation=<nav ref={nav} role={tabList?'tablist':undefined} aria-label={label} className={cx('selection-nav',className)} onKeyDown={keys}><span ref={indicator} className="selection-indicator" aria-hidden="true"/>{children}</nav>;
 return tabList?<HorizontalRail label={label}>{navigation}</HorizontalRail>:navigation;
}
