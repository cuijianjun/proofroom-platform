"use client";

import { useEffect, useLayoutEffect, useRef, useId, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/icons";

/**
 * Dialog and Drawer (plan 4.10, 4.11) on the native <dialog> element: the
 * browser gives focus trapping, Escape to close and inert background.
 */
type BaseProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; className?: string; describedBy?: string; dismissible?: boolean };

function useNativeDialog(open: boolean, onClose: () => void, dismissible: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  const intendedOpen=useRef(open);
  useLayoutEffect(() => {
    intendedOpen.current=open;
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) { el.showModal(); const first=el.querySelector<HTMLElement>("input:not(:disabled),select:not(:disabled),textarea:not(:disabled),h2"); first?.focus(); }
    if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => { if(intendedOpen.current)onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (dismissible && e.target === el) onClose(); // backdrop click
    };
    const handleCancel=(e:Event)=>{if(!dismissible)e.preventDefault();};
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
  }, [onClose,dismissible]);
  return ref;
}

export function Dialog({ open, onClose, title, children, footer, className, describedBy, dismissible=true }: BaseProps) {
  const ref = useNativeDialog(open, onClose,dismissible);
  const titleId=useId();
  return (
    <dialog ref={ref} className={cx("m-auto w-[min(92vw,560px)] rounded-2xl border border-line bg-surface text-ink p-0 shadow-2xl backdrop:bg-black/50", className)} aria-labelledby={titleId} aria-describedby={describedBy}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h2 id={titleId} tabIndex={-1} className="font-semibold">{title}</h2>
        <button type="button" onClick={onClose} disabled={!dismissible} className="btn-ghost btn-sm dialog-close" aria-label="关闭"><Icon.X /></button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="px-5 py-4 border-t border-line flex justify-end gap-2">{footer}</div> : null}
    </dialog>
  );
}

export function Drawer({ open, onClose, title, children, footer, className, dismissible=true }: BaseProps) {
  const ref = useNativeDialog(open, onClose,dismissible);
  const titleId=useId();
  return (
    <dialog ref={ref} className={cx("fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-[min(100vw,440px)] border-l border-line bg-surface text-ink p-0 shadow-2xl backdrop:bg-black/40", className)} aria-labelledby={titleId}>
      <div className="flex h-full flex-col">
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
