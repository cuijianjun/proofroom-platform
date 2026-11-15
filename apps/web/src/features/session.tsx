'use client';
import {createContext,useContext,useId,useEffect,type ReactNode} from 'react';
import type {Session,Studio} from '@proofroom/contracts';
import type {Dashboard} from '@proofroom/contracts/orders';
import type {useResource} from '@/components/platform/core';
export type Workspace={summary:ReturnType<typeof useResource<Dashboard>>;session:Session;studio:Studio;refreshSession:()=>void;url:(path:string)=>string;navigate:(path:string)=>void;dirty:boolean;setDirty:(v:boolean,message?:string,scope?:string)=>void};
const WorkspaceContext=createContext<Workspace|null>(null);
export const WorkspaceProvider=({value,children}:{value:Workspace;children:ReactNode})=><WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
export function useWorkspace(){const v=useContext(WorkspaceContext);if(!v)throw new Error('工作室上下文未就绪');return v;}

export function useDirtyScope(dirty:boolean,message:string){const {setDirty}=useWorkspace(),scope=useId();useEffect(()=>{setDirty(dirty,message,scope);return()=>setDirty(false,'',scope);},[dirty,message,scope,setDirty]);}
