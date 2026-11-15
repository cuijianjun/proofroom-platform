'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useResource} from '@/components/platform/core';
type WindowState={items:{id:string}[];cursor:string|null;next:string|null;scroll:number};
let generation=0;
const windows=new Map<string,WindowState>();
export function clearListWindows(){generation++;windows.clear();}
// Display-window state for back navigation, scoped by caller to user + studio +
// URL filters. API remains authoritative; refresh failure retains loaded rows.
export function useCursorWindow<T extends {id:string}>(key:string,base:string,onRefresh?:()=>void){
 const [mountedGeneration]=useState(()=>generation),[saved]=useState(()=>windows.get(key));const [cursor,setCursor]=useState<string|null>(saved?.cursor??null),[items,setItems]=useState<T[]>((saved?.items as T[])??[]),[next,setNext]=useState<string|null>(saved?.next??null);const sentinel=useRef<HTMLDivElement>(null),touch=useRef<number|null>(null);
 const resource=useResource<{items:T[];nextCursor:string|null}>(base+(cursor?`${base.includes('?')?'&':'?'}cursor=${encodeURIComponent(cursor)}`:''));
 const {reload}=resource;const position=useRef(saved?.scroll??0),leaving=useRef(false);
 useEffect(()=>{const save=()=>{if(!leaving.current)position.current=window.scrollY;};window.addEventListener('scroll',save,{passive:true});return()=>window.removeEventListener('scroll',save);},[]);
 const snapshot=useRef<WindowState>({items,cursor,next,scroll:0});useLayoutEffect(()=>{snapshot.current={items,cursor,next,scroll:0};},[items,cursor,next]);
 useEffect(()=>{const data=resource.data;if(!data)return;setItems(old=>cursor?[...old.filter(i=>!data.items.some(v=>v.id===i.id)),...data.items]:data.items);setNext(data.nextCursor);},[resource.data,cursor]);
 useEffect(()=>{if(saved)requestAnimationFrame(()=>window.scrollTo({top:saved.scroll,behavior:'instant'}));return()=>{if(mountedGeneration!==generation)return;windows.delete(key);windows.set(key,{...snapshot.current,scroll:position.current});if(windows.size>20)windows.delete(windows.keys().next().value!);};},[key,saved,mountedGeneration]);
 const loadMore=useCallback(()=>{if(next&&next!==cursor&&!resource.loading)setCursor(next);},[next,cursor,resource.loading]);
 useEffect(()=>{const el=sentinel.current;if(!el||!next)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))loadMore();},{rootMargin:'240px'});observer.observe(el);return()=>observer.disconnect();},[next,loadMore]);
 const refresh=useCallback(()=>{setCursor(null);reload();onRefresh?.();},[reload,onRefresh]);
 const capture=()=>{position.current=window.scrollY;leaving.current=true;};
 const pull={onClickCapture:(e:React.MouseEvent)=>{if((e.target as HTMLElement).closest('a[href]'))capture();},onSubmitCapture:capture,onChangeCapture:(e:React.FormEvent)=>{if((e.target as HTMLElement).tagName==='SELECT')capture();},onTouchStart:(e:React.TouchEvent)=>{touch.current=window.scrollY<=0&&!(e.target as HTMLElement).closest('input,textarea,select,button,form,dialog')?e.touches[0].clientY:null;},onTouchEnd:(e:React.TouchEvent)=>{if(touch.current!==null&&e.changedTouches[0].clientY-touch.current>90&&!resource.loading)refresh();touch.current=null;}};
 return {resource,items,next,loadMore,refresh,sentinel,pull};
}
