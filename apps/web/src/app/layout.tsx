import type {Metadata} from 'next';
import {Suspense,type ReactNode} from 'react';
import {Application} from '@/features/application';
import {NavigationBoundary} from '@/features/navigation';
import './globals.css';
export const metadata:Metadata={title:{default:'ProofRoom · 摄影工作室',template:'%s · ProofRoom'},description:'从第一份拍摄期待，到最后一张交付。',robots:{index:false,follow:false}};
export default function Layout({children}:{children:ReactNode}){return <html lang="zh-CN"><body><a className="skip-link" href="#main">跳到主要内容</a><NavigationBoundary><Suspense fallback={<main id="main" className="p-8">正在加载…</main>}><Application/></Suspense>{children}</NavigationBoundary></body></html>;}
