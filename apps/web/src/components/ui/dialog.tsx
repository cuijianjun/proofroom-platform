"use client";

import { useEffect, useLayoutEffect, useRef, useId, useState, useCallback, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import {createPortal} from 'react-dom';
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import {ProductExperience,useMobileProductLayout,useProductExperience,useProductComposition,animateProductSurface,cancelProductMotion} from './product-experience';

/**
 * Dialog and Drawer (plan 4.10, 4.11) on the native <dialog> element: the
 * browser gives focus trapping, Escape to close and inert background.
 */
type BaseProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; className?: string; describedBy?: string; dismissible?: boolean; returnFocus?:()=>HTMLElement|null };

function useNativeDialog(open: boolean, onClose: () => void, dismissible: boolean, returnFocus?:()=>HTMLElement|null) {
  const ref = useRef<HTMLDialogElement>(null);
  const product=useProductExperience(),composing=useProductComposition(),opener=useRef<HTMLElement|null>(null);
  const intendedOpen=useRef(open);
  const focusTarget=useRef(returnFocus);
  useLayoutEffect(()=>{focusTarget.current=returnFocus;},[returnFocus]);
  useLayoutEffect(() => {
    intendedOpen.current=open;
    const el = ref.current;
    if (!el) return;
    const surface=el.querySelector<HTMLElement>('.product-dialog-surface');
    if(open){
      if(!el.open){opener.current=document.activeElement as HTMLElement;el.showModal();const first=el.querySelector<HTMLElement>("input:not(:disabled),select:not(:disabled),textarea:not(:disabled),h2");first?.focus({preventScroll:true});}
      if(product&&surface)void animateProductSurface(surface,true);
    }else if(el.open){
      if(product&&surface)void animateProductSurface(surface,false).then(finished=>{
        if(!finished||intendedOpen.current||!el.isConnected)return;
        el.close();const target=focusTarget.current?.()??opener.current;
        if(target?.isConnected&&!target.matches(':disabled')&&target.getClientRects().length)target.focus({preventScroll:true});
        else {const main=document.querySelector<HTMLElement>('#main');if(main){main.tabIndex=-1;main.focus({preventScroll:true});}}
      });
      else el.close();
    }
  }, [open,product]);
  useLayoutEffect(()=>{const el=ref.current;return()=>{const surface=el?.querySelector<HTMLElement>('.product-dialog-surface');if(surface)cancelProductMotion(surface);};},[]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => { if(intendedOpen.current)onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (dismissible && e.target === el) onClose(); // backdrop click
    };
    const handleCancel=(e:Event)=>{if(product){e.preventDefault();if(dismissible&&!composing?.current)onClose();}else if(!dismissible)e.preventDefault();};
    const handleKeys=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const items=[...el.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(item=>!item.matches(':disabled,[hidden]')&&item.getClientRects().length>0&&item.tabIndex>=0);if(!items.length){event.preventDefault();el.focus();return;}const index=items.indexOf(document.activeElement as HTMLElement);if(index<0||event.shiftKey&&index===0||!event.shiftKey&&index===items.length-1){event.preventDefault();items[event.shiftKey?items.length-1:0].focus();}};
    el.addEventListener('keydown',handleKeys);
    el.addEventListener("cancel",handleCancel);
    el.addEventListener("close", handleClose);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener('keydown',handleKeys);
      el.removeEventListener("cancel",handleCancel);
      el.removeEventListener("close", handleClose);
      el.removeEventListener("click", handleClick);
    };
  }, [onClose,dismissible,product,composing]);
  return ref;
}

export function Dialog({ open, onClose, title, children, footer, className, describedBy, dismissible=true,returnFocus }: BaseProps) {
  const ref = useNativeDialog(open, onClose,dismissible,returnFocus);
  const product=useProductExperience();
  const titleId=useId();
  const content=<><div className="flex items-center justify-between px-5 py-4 border-b border-line dialog-heading"><h2 id={titleId} tabIndex={-1} className="font-semibold">{title}</h2><button type="button" onClick={onClose} disabled={!dismissible} className="btn-ghost btn-sm dialog-close" aria-label="关闭"><Icon.X /></button></div><div className="px-5 py-4 dialog-body">{children}</div>{footer?<div className="px-5 py-4 border-t border-line flex justify-end gap-2 dialog-footer">{footer}</div>:null}</>;
  return (
    <dialog ref={ref} className={cx("m-auto w-[min(92vw,560px)] rounded-2xl border border-line bg-surface text-ink p-0 shadow-2xl backdrop:bg-black/50", product&&"product-dialog", className)} aria-labelledby={titleId} aria-describedby={describedBy}>
      {product?<div className="product-dialog-surface" inert={!open} onClickCapture={e=>{if(!open){e.preventDefault();e.stopPropagation();}}} onSubmitCapture={e=>{if(!open){e.preventDefault();e.stopPropagation();}}}>{content}</div>:content}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, children, footer, className, dismissible=true }: BaseProps) {
  const ref = useNativeDialog(open, onClose,dismissible);
  const product=useProductExperience();
  const titleId=useId();
  return (
    <dialog ref={ref} className={cx("fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-[min(100vw,440px)] border-l border-line bg-surface text-ink p-0 shadow-2xl backdrop:bg-black/40", product&&"product-dialog product-drawer", className)} aria-labelledby={titleId}>
      <div className={cx("flex h-full flex-col",product&&'product-dialog-surface')} inert={product&&!open?true:undefined} onClickCapture={e=>{if(product&&!open){e.preventDefault();e.stopPropagation();}}} onSubmitCapture={e=>{if(product&&!open){e.preventDefault();e.stopPropagation();}}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id={titleId} tabIndex={-1} className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} disabled={!dismissible} className="btn-ghost btn-sm dialog-close" aria-label="关闭"><Icon.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="px-5 py-4 border-t border-line flex justify-end gap-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}


/** Desktop disclosure, mobile contextual action sheet; the command handlers stay unchanged. */
export function MoreActions({label,children}:{label:string;children:ReactNode}){
 const mobile=useMobileProductLayout(),ref=useRef<HTMLDetailsElement>(null),[sheet,setSheet]=useState(false),[inheritedDisabled,setInheritedDisabled]=useState(false);
 const close=useCallback(()=>{if(ref.current)ref.current.open=false;setSheet(false);},[]);
 useLayoutEffect(()=>{const fields:HTMLFieldSetElement[]=[];for(let el=ref.current?.parentElement;el;el=el.parentElement)if(el instanceof HTMLFieldSetElement)fields.push(el);const update=()=>{const disabled=fields.some(el=>el.matches(':disabled'));setInheritedDisabled(disabled);if(disabled)close();};const observer=new MutationObserver(update);fields.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['disabled']}));queueMicrotask(update);return()=>observer.disconnect();},[close]);
 const fit=useCallback(()=>{const el=ref.current,panel=el?.querySelector<HTMLElement>('.action-menu-panel');if(!el?.open||!panel)return;panel.style.marginRight='0px';const r=panel.getBoundingClientRect(),gap=16,shift=r.left<gap?r.left-gap:r.right>innerWidth-gap?r.right-innerWidth+gap:0;panel.style.marginRight=shift+'px';},[]);
 useLayoutEffect(()=>{const media=matchMedia('(max-width:767px)'),change=()=>{const wasOpen=!!ref.current?.open;close();if(wasOpen)requestAnimationFrame(()=>ref.current?.querySelector<HTMLElement>('summary')?.focus({preventScroll:true}));};media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[close]);
 useEffect(()=>{const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&event.target.closest('dialog[open]'))return;const el=ref.current;if(el?.open&&!el.contains(event.target as Node))el.open=false;};window.addEventListener('resize',fit);document.addEventListener('pointerdown',outside);return()=>{window.removeEventListener('resize',fit);document.removeEventListener('pointerdown',outside);};},[fit]);
 function command(event:ReactMouseEvent){if(ref.current?.closest('fieldset:disabled')){event.preventDefault();event.stopPropagation();close();return;}const target=event.target instanceof Element?event.target:null,control=target?.closest<HTMLButtonElement|HTMLAnchorElement>('button,a[href]');if(!control||control.matches(':disabled')||target?.closest('[data-keep-actions-open]')||control instanceof HTMLButtonElement&&control.type==='submit'&&!!control.form)return;
  // A following confirmation must capture the visible trigger, not a hidden sheet option.
  if(mobile)event.currentTarget.closest('dialog')?.close();close();ref.current?.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});
 }
 return <><details ref={ref} className="action-menu" onToggle={e=>{if(e.currentTarget.open&&e.currentTarget.closest('fieldset:disabled')){e.currentTarget.open=false;return;}if(e.currentTarget.open){document.querySelectorAll<HTMLDetailsElement>('.action-menu[open]').forEach(el=>{if(el!==e.currentTarget)el.open=false;});if(mobile)setSheet(true);else fit();}else setSheet(false);}} onKeyDown={e=>{if(e.key==='Escape'&&!e.nativeEvent.isComposing&&e.currentTarget.open){e.preventDefault();e.stopPropagation();close();e.currentTarget.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});}}}><summary aria-label={label} title={label}><Icon.More size={20}/><span>更多</span></summary>{!mobile&&<div className="action-menu-panel" onClickCapture={command}>{children}</div>}</details>{mobile&&createPortal(<ProductExperience active><Dialog open={sheet} title={label} onClose={close} returnFocus={()=>ref.current?.querySelector('summary')??null} className="mobile-action-sheet" footer={<button type="button" className="btn-ghost action-sheet-cancel" onClick={close}>取消</button>}><div className="action-sheet-options" onClickCapture={command}><fieldset disabled={inheritedDisabled} className="action-sheet-fields">{children}</fieldset></div></Dialog></ProductExperience>,document.body)}</>;
}
