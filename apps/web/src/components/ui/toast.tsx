"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/icons";
import {createPortal} from 'react-dom';
import {useProductExperience} from './product-experience';

/** Toasts (plan 4.9). Server Action results call toast() from client wrappers. */

export type Toast = { id: number; tone: "neutral" | "success" | "danger"; text: string };
type ToastApi = { toast: (text: string, tone?: Toast["tone"]) => void; dismiss: (id: number) => void; beginCopy:(source:HTMLElement|null)=>(text:string)=>void };
type CopyNotice={id:number;text:string;host:HTMLElement};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const product=useProductExperience(),[copyNotice,setCopyNotice]=useState<CopyNotice|null>(null),copyRun=useRef(0),copyTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback((text: string, tone: Toast["tone"] = "neutral") => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-3), { id, tone, text }]);
    window.setTimeout(() => dismiss(id), tone === "danger" ? 8000 : 4000);
  }, [dismiss]);
  const dismissCopy=useCallback((id:number)=>{if(copyRun.current!==id)return;clearTimeout(copyTimer.current);setCopyNotice(null);},[]);
  const beginCopy=useCallback((source:HTMLElement|null)=>{
    if(!product)return ()=>{};
    const id=++copyRun.current,owner=source?.closest<HTMLDialogElement>('dialog')??null;
    clearTimeout(copyTimer.current);setCopyNotice(null);
    return (text:string)=>{
      if(copyRun.current!==id||!source?.isConnected||owner&&(!owner.open||owner.querySelector<HTMLElement>(':scope > .product-dialog-surface')?.inert))return;
      setCopyNotice({id,text,host:owner??document.body});copyTimer.current=setTimeout(()=>dismissCopy(id),1800);
    };
  },[product,dismissCopy]);
  useEffect(()=>()=>{copyRun.current++;clearTimeout(copyTimer.current);},[]);
  const api = useMemo(() => ({ toast, dismiss,beginCopy }), [toast, dismiss,beginCopy]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(92vw,360px)]" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("card px-4 py-3 text-sm flex items-start gap-3 shadow-lg", t.tone === "success" && "border-success/40", t.tone === "danger" && "border-danger/40")}>
            {t.tone === "success" ? <Icon.Check className="text-success shrink-0 mt-0.5" /> : t.tone === "danger" ? <Icon.Alert className="text-danger shrink-0 mt-0.5" /> : <Icon.Info className="text-muted shrink-0 mt-0.5" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="toast-close text-muted hover:text-ink" aria-label="关闭通知"><Icon.X size={16} /></button>
          </div>
        ))}
      </div>
      {product&&copyNotice&&<CopyNotification key={copyNotice.id} notice={copyNotice} onDismiss={dismissCopy}/>}
    </ToastContext.Provider>
  );
}

function CopyNotification({notice,onDismiss}:{notice:CopyNotice;onDismiss:(id:number)=>void}){
  useEffect(()=>{const host=notice.host;if(!(host instanceof HTMLDialogElement))return;const close=()=>onDismiss(notice.id);host.addEventListener('close',close);return()=>host.removeEventListener('close',close);},[notice,onDismiss]);
  return createPortal(<div data-product-ui="" style={{display:'contents'}}><div className="copy-toast" role="status" aria-live="polite" aria-atomic="true"><Icon.Check size={17}/><span>{notice.text}</span></div></div>,notice.host);
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

/** Shows a toast once when an action state carries a message or error. */
export function useActionToast(state: { ok?: boolean; message?: string | null; error?: string | null } | null | undefined) {
  const { toast } = useToast();
  const last = useRef<string | null>(null);
  useEffect(() => {
    const key = state ? `${state.ok}:${state.message ?? ""}:${state.error ?? ""}` : null;
    if (!state || key === last.current) return;
    last.current = key;
    if (state.error) toast(state.error, "danger");
    else if (state.ok && state.message) toast(state.message, "success");
  }, [state, toast]);
}
