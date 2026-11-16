"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import {useProductComposition} from './product-experience';

/**
 * Lightbox (plan 4.23): keyboard (arrows, Escape, F), swipe, double-tap and
 * pinch zoom, optional slideshow, and a slot for favorite, note and download
 * buttons. Images are plain <img> so private photo routes work unchanged.
 */
export type LightboxPhoto = { id: string; src: string; alt: string; caption?:string; width?: number | null; height?: number | null };

export function Lightbox({ photos, index, onClose, onIndexChange, onFavorite, actions, slideshowMs = 4000 }: {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  onFavorite?: (photo: LightboxPhoto) => void;
  actions?: (photo: LightboxPhoto) => ReactNode;
  slideshowMs?: number;
}) {
  const open = index !== null && index >= 0 && index < photos.length;
  const photo = open ? photos[index!] : null;
  const [zoom, setZoom] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [pan,setPan]=useState({x:0,y:0}),[failed,setFailed]=useState(false),[imageRevision,setImageRevision]=useState(0),[fullscreenError,setFullscreenError]=useState('');
  const drag=useRef<{x:number;y:number}|null>(null);
  const touch = useRef<{ x: number; y: number; dist: number; time: number } | null>(null);
  const lastTap = useRef(0);
  const modal = useRef<HTMLDialogElement>(null);
  const composing=useProductComposition();
  useEffect(()=>{setPan({x:0,y:0});setZoom(1);setFailed(false);setFullscreenError('');},[photo?.id]);

  const go = useCallback((delta: number) => {
    if (!open) return;
    setZoom(1);
    onIndexChange((index! + delta + photos.length) % photos.length);
  }, [open, index, photos.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const dialog=modal.current;if(!dialog)return;if(!dialog.open)dialog.showModal();
    return()=>{if(document.fullscreenElement===dialog)void document.exitFullscreen().catch(()=>{});dialog.close();setZoom(1);setPlaying(false);};
  },[open]);
  useEffect(()=>{
    if(!open)return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.isComposing||e.keyCode===229||composing?.current)return;
      const target=e.target as HTMLElement;
      if(target.closest('input,textarea,select,[contenteditable="true"]'))return;
      if(e.key==='ArrowRight'){e.preventDefault();go(1);}
      else if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}
      else if((e.key==='f'||e.key==='F')&&photo&&onFavorite){e.preventDefault();onFavorite(photo);}
      else if(e.key===' '&&target.tagName!=='BUTTON'&&target.tagName!=='A'){e.preventDefault();setPlaying(p=>!p);}
    };
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
  },[open,go,onFavorite,photo,composing]);

  useEffect(() => {
    if (!open || !playing) return;
    const t = setInterval(() => go(1), slideshowMs);
    return () => clearInterval(t);
  }, [open, playing, go, slideshowMs]);

  if (!open || !photo) return null;

  return (
    <dialog ref={modal} onCancel={e=>{if(composing?.current)e.preventDefault();}} onClose={onClose} className="photo-lightbox" aria-label={`照片 ${index! + 1}，共 ${photos.length} 张`}>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-white/70">{index! + 1} / {photos.length}</span>
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded-md hover:bg-white/10" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "暂停播放" : "自动播放"}>{playing ? <Icon.X /> : <Icon.Play />}</button>
          {onFavorite ? <button type="button" className="p-2 rounded-md hover:bg-white/10" onClick={() => onFavorite(photo)} aria-label="切换标记"><Icon.Heart /></button> : null}
          {actions?.(photo)}
          <button type="button" onClick={()=>setZoom(z=>Math.min(4,z+.5))} disabled={zoom>=4} aria-label="放大照片">＋</button>
          <button type="button" onClick={()=>{setZoom(z=>Math.max(1,z-.5));setPan({x:0,y:0});}} disabled={zoom<=1} aria-label="缩小照片">−</button>
          <button type="button" onClick={()=>{setZoom(1);setPan({x:0,y:0});}} aria-label="重置缩放">{Math.round(zoom*100)}%</button>
          {typeof document!=='undefined'&&document.fullscreenEnabled&&<button type="button" aria-label="切换全屏" onClick={async()=>{try{if(document.fullscreenElement===modal.current)await document.exitFullscreen();else await modal.current?.requestFullscreen();setFullscreenError('');}catch{setFullscreenError('当前环境暂不支持全屏，可继续在大预览中浏览。');}}}>⛶</button>}
          <button type="button" className="p-2 rounded-md hover:bg-white/10" onClick={onClose} aria-label="关闭" autoFocus><Icon.X /></button>
        </div>
      </div>
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden touch-none"
        onPointerDown={e=>{if(e.pointerType==='mouse'&&zoom>1){drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}}
        onPointerMove={e=>{if(drag.current&&zoom>1){const {x,y}=drag.current;setPan(p=>({x:p.x+e.clientX-x,y:p.y+e.clientY-y}));drag.current={x:e.clientX,y:e.clientY};}}}
        onPointerUp={()=>{drag.current=null;}}
        onPointerCancel={()=>{drag.current=null;}}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const [a, b] = [e.touches[0], e.touches[1]];
            touch.current = { x: 0, y: 0, dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), time: Date.now() };
          } else {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0, time: Date.now() };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && touch.current?.dist) {
            const [a, b] = [e.touches[0], e.touches[1]];
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const ratio=d/touch.current.dist;
            setZoom((z) => Math.min(4, Math.max(1, z * ratio)));
            touch.current.dist = d;
          }else if(e.touches.length===1&&touch.current&&zoom>1){const t=touch.current,dx=e.touches[0].clientX-t.x,dy=e.touches[0].clientY-t.y;setPan(p=>({x:p.x+dx,y:p.y+dy}));t.x=e.touches[0].clientX;t.y=e.touches[0].clientY;
          }
        }}
        onTouchEnd={(e) => {
          const t = touch.current;
          if (!t || t.dist) return;
          const dx = e.changedTouches[0].clientX - t.x;
          const dy = e.changedTouches[0].clientY - t.y;
          if (Math.abs(dx) > 50 && Math.abs(dy) < 60 && zoom === 1) go(dx < 0 ? 1 : -1);
          else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            const now = Date.now();
            if (now - lastTap.current < 300) setZoom((z) => (z > 1 ? 1 : 2));
            lastTap.current = now;
          }
        }}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
      >
        <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 z-10" onClick={() => go(-1)} aria-label="上一张"><Icon.ChevronLeft /></button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {failed?<div role="alert" className="p-5"><p>压缩预览无法加载，请核对访问权限或稍后重试。</p><button type="button" onClick={()=>{setFailed(false);setImageRevision(n=>n+1);}}>重试压缩预览</button></div>:<img key={`${photo.id}:${imageRevision}`} src={photo.src} alt={photo.alt} onError={()=>setFailed(true)} className={cx("max-h-full max-w-full object-contain select-none", zoom > 1 && "cursor-move")} style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }} draggable={false} />}
        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 z-10" onClick={() => go(1)} aria-label="下一张"><Icon.ChevronRight /></button>
      </div>
      <div className="px-4 py-3 text-xs text-white/60 truncate">{photo.alt}</div>
      {photo.caption&&<p className="lightbox-caption">{photo.caption}</p>}{fullscreenError&&<p role="status" className="px-4 pb-3">{fullscreenError}</p>}
    </dialog>
  );
}
