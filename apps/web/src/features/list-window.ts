'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useRefreshRegistration} from '@/components/ui/product-experience';
import {useResource} from '@/components/platform/core';
type WindowState={items:{id:string}[];cursor:string|null;next:string|null;scroll:number};
let generation=0;
const windows=new Map<string,WindowState>();
// 同一页面换筛选条件时会重新挂载（key 变了），新实例拿不到旧 key 的行。按页面记一份最近的行，
// 换筛选、搜索或切分页时先用它顶着，列表不会整块变成骨架再回来。
const families=new Map<string,WindowState>();
export function clearListWindows(){generation++;windows.clear();families.clear();}
// Display-window state for back navigation, scoped by caller to user + studio +
// URL filters. API remains authoritative; refresh failure retains loaded rows.
export function useCursorWindow<T extends {id:string}>(key:string,base:string,onRefresh?:()=>void){
 const [mountedGeneration]=useState(()=>generation),[saved]=useState(()=>windows.get(key)),family=base.split('?')[0],[reuse]=useState(()=>saved??families.get(family));const [cursor,setCursor]=useState<string|null>(saved?.cursor??null),[items,setItems]=useState<T[]>((reuse?.items as T[])??[]),[next,setNext]=useState<string|null>(saved?.next??null);const sentinel=useRef<HTMLDivElement>(null);
 const resource=useResource<{items:T[];nextCursor:string|null}>(base+(cursor?`${base.includes('?')?'&':'?'}cursor=${encodeURIComponent(cursor)}`:''),'',false);
 const {reload,revalidate}=resource;const position=useRef(saved?.scroll??0),leaving=useRef(false);
 useEffect(()=>{const save=()=>{if(!leaving.current)position.current=window.scrollY;};window.addEventListener('scroll',save,{passive:true});return()=>window.removeEventListener('scroll',save);},[]);
 const snapshot=useRef<WindowState>({items,cursor,next,scroll:0});useLayoutEffect(()=>{snapshot.current={items,cursor,next,scroll:0};},[items,cursor,next]);
 useLayoutEffect(()=>{families.set(family,{items,cursor,next,scroll:0});if(families.size>20)families.delete(families.keys().next().value!);},[family,items,cursor,next]);
 useEffect(()=>{const data=resource.data;if(!data)return;setItems(old=>cursor?[...old.filter(i=>!data.items.some(v=>v.id===i.id)),...data.items]:data.items);setNext(data.nextCursor);},[resource.data,cursor]);
 useEffect(()=>{if(saved)requestAnimationFrame(()=>window.scrollTo({top:saved.scroll,behavior:'instant'}));return()=>{if(mountedGeneration!==generation)return;windows.delete(key);windows.set(key,{...snapshot.current,scroll:position.current});if(windows.size>20)windows.delete(windows.keys().next().value!);};},[key,saved,mountedGeneration]);
 const loadMore=useCallback(()=>{if(next&&next!==cursor&&!resource.loading&&!resource.error)setCursor(next);},[next,cursor,resource.loading,resource.error]);

 const refresh=useCallback(()=>{setCursor(null);reload();onRefresh?.();},[reload,onRefresh]);
 const pageRefresh=useCallback(()=>{setCursor(null);return revalidate();},[revalidate]);useRefreshRegistration(pageRefresh);
 const capture=()=>{position.current=window.scrollY;leaving.current=true;};
 const pull={onClickCapture:(e:React.MouseEvent)=>{if((e.target as HTMLElement).closest('a[href]'))capture();},onSubmitCapture:capture,onChangeCapture:(e:React.FormEvent)=>{if((e.target as HTMLElement).tagName==='SELECT')capture();}};
 return {resource,items,next,loadMore,refresh,sentinel,pull};
}
