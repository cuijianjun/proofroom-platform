'use client';
import {createContext,useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef,type ReactNode} from 'react';

const field='__proofroomHistory';
type Point={epoch:string;index:number};
type Pending={url:string;delta:number|null;point?:Point};
const address=()=>location.pathname+location.search+location.hash;
function point(state:unknown):Point|null{const value=(state as Record<string,unknown>|null)?.[field] as Point|undefined;return value&&typeof value.epoch==='string'&&Number.isSafeInteger(value.index)?value:null;}

type Guard={dirty:boolean;onBlocked:(url:string)=>void};
type Controls={cancel:()=>void;resume:()=>boolean};
const NavigationContext=createContext<{register:(guard:Guard)=>()=>void;cancel:Controls['cancel'];resume:Controls['resume']}|null>(null);

/** Mounted outside the route's Suspense boundary, before Next's passive listeners. */
export function NavigationBoundary({children}:{children:ReactNode}){
 const latest=useRef<Guard>({dirty:false,onBlocked:()=>{}}),control=useRef<Controls>({cancel:()=>{},resume:()=>false}),install=useRef(()=>{});
 const cancel=useCallback(()=>control.current.cancel(),[]),resume=useCallback(()=>control.current.resume(),[]);
 const register=useCallback((guard:Guard)=>{latest.current=guard;return()=>{if(latest.current===guard)latest.current={dirty:false,onBlocked:()=>{}};};},[]);
 const context=useMemo(()=>({register,cancel,resume}),[register,cancel,resume]);
 useLayoutEffect(()=>{
   let disposed=false,installed=false,push=history.pushState,replace=history.replaceState;
   let current=point(history.state)??{epoch:crypto.randomUUID(),index:0},url=address(),state=history.state,pending:Pending|null=null,restoring=false,allowed:Point|null=null;
   const stamped=(value:unknown,p:Point)=>({...value&&typeof value==='object'?value:{},[field]:p});
   function pushState(data:unknown,title:string,next?:string|URL|null){const nextPoint={epoch:current.epoch,index:current.index+1};push.call(history,stamped(data,nextPoint),title,next);current=nextPoint;url=address();state=history.state;allowed=null;}
   function replaceState(data:unknown,title:string,next?:string|URL|null){replace.call(history,stamped(data,current),title,next);url=address();state=history.state;}
   function onAnchor(event:MouseEvent){
    if(event.defaultPrevented||event.button!==0||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href^="#"]'):null;
    if(!link||link.target||link.hasAttribute('download'))return;
    let id:string;try{id=decodeURIComponent(link.hash.slice(1));}catch{return;}
    const target=document.getElementById(id);if(!target)return;
    event.preventDefault();if(location.hash!==link.hash)history.pushState(history.state,'',link.hash);
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    target.scrollIntoView();target.focus({preventScroll:true});
   }
   function onPop(event:PopStateEvent){
    if(restoring){event.stopImmediatePropagation();restoring=false;if(pending)latest.current.onBlocked(pending.url);return;}
    const target=point(event.state),to=address(),permitted=allowed&&target?.epoch===allowed.epoch&&target.index===allowed.index;
    const sameBusiness=to.split('#')[0]===url.split('#')[0];
    if(!latest.current.dirty||permitted||sameBusiness){allowed=null;pending=null;current=target??{epoch:crypto.randomUUID(),index:0};url=to;state=history.state;if(!target){replace.call(history,stamped(state,current),'');state=history.state;}return;}
    event.stopImmediatePropagation();
    if(target?.epoch===current.epoch&&target.index!==current.index){
     pending??={url:to,delta:target.index-current.index,point:target};restoring=true;history.go(current.index-target.index);
    }else{
     // Old/unowned history has no reliable distance. Keep the draft and current URL;
     // explicit confirmation can navigate to that destination normally.
     current={epoch:crypto.randomUUID(),index:0};replace.call(history,stamped(state,current),'',url);state=history.state;pending??={url:to,delta:null};latest.current.onBlocked(pending.url);
    }
   }
   // popstate targets window: registration order wins even for capture listeners.
   // Register before Next's passive effect can restore a route or overwrite its marker.
   window.addEventListener('popstate',onPop,true);
   document.addEventListener('click',onAnchor);
   const controls={cancel:()=>{pending=null;allowed=null;},resume:()=>{const target=pending;pending=null;if(!target||target.delta===null)return false;allowed=target.point??null;history.go(target.delta);return true;}};
   control.current=controls;
   // Next patches history in its passive effect; wrap those methods after it.
   install.current=()=>{if(disposed)return;push=history.pushState;replace=history.replaceState;replace.call(history,stamped(history.state,current),'');state=history.state;history.pushState=pushState;history.replaceState=replaceState;installed=true;};
   return()=>{disposed=true;window.removeEventListener('popstate',onPop,true);document.removeEventListener('click',onAnchor);if(installed&&history.pushState===pushState)history.pushState=push;if(installed&&history.replaceState===replaceState)history.replaceState=replace;if(control.current===controls)control.current={cancel:()=>{},resume:()=>false};};
 },[]);
 useEffect(()=>{let disposed=false;queueMicrotask(()=>{if(!disposed)install.current();});return()=>{disposed=true;};},[]);
 return <NavigationContext.Provider value={context}>{children}</NavigationContext.Provider>;
}

export function useHistoryGuard(dirty:boolean,onBlocked:(url:string)=>void){
 const context=useContext(NavigationContext);if(!context)throw new Error('Missing navigation boundary');
 useLayoutEffect(()=>context.register({dirty,onBlocked}),[context,dirty,onBlocked]);
 return {cancel:context.cancel,resume:context.resume};
}
