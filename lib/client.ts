"use client";
import {useState,useEffect,useCallback,useRef} from 'react';
import type {DeskAccess} from './desk-access';
import type {Booking,Service} from './model';
export type State={services:Service[];bookings:Booking[];today:string;demo:boolean;bookingId?:string;initialized?:boolean;access?:DeskAccess;historyLimited?:boolean};
export async function request(action?:object):Promise<State>{const response=await fetch('/api/workspace',{cache:'no-store',...(action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{})});if(response.status===401||response.status===403||response.redirected){window.dispatchEvent(new Event('madonna-auth-expired'));window.location.replace('/desk');throw new Error('سجّلي الدخول بحساب الإدارة للمتابعة.');}const data=await response.json() as State & {error?:string};if(!response.ok)throw Object.assign(new Error(data.error||'تعذّر حفظ التغييرات.'),{status:response.status});return data;}
export function useWorkspace(){
 const [data,commitData]=useState<State|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[authExpired,setAuthExpired]=useState(false),[online,setOnline]=useState(true),[lastSynced,setLastSynced]=useState<number|null>(null);
 const revision=useRef(0),current=useRef<State|null>(null);
 const setData=useCallback((next:State)=>{revision.current++;current.current=next;commitData(next);setLastSynced(Date.now());setError('');},[]);
 const load=useCallback(async()=>{setError('');setLoading(true);try{setData(await request({action:'initialize'}));}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[setData]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
  let disposed=false,inFlight=false;const network=()=>setOnline(navigator.onLine);network();window.addEventListener('online',network);window.addEventListener('offline',network);
  const expire=()=>{setAuthExpired(true);revision.current++;current.current=null;commitData(null);setError('سجّلي الدخول بحساب الإدارة للمتابعة.');};
  window.addEventListener('madonna-auth-expired',expire);
  const refresh=async()=>{if(disposed||inFlight||document.visibilityState!=='visible'||!navigator.onLine)return;inFlight=true;const at=revision.current;try{const next=await request();if(!disposed&&at===revision.current){if(JSON.stringify(next)!==JSON.stringify(current.current))setData(next);else {setLastSynced(Date.now());setError('');}}}catch{if(!disposed)setError('الاتصال متوقف مؤقتًا. ستتحدث الحجوزات عند عودته.');}finally{inFlight=false;}};
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('madonna-bookings'):null;
  if(channel)channel.onmessage=()=>void refresh();
  const timer=setInterval(refresh,5000);
  for(const e of ['focus','online'])window.addEventListener(e,refresh);
  document.addEventListener('visibilitychange',refresh);
  return()=>{disposed=true;window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('madonna-auth-expired',expire);clearInterval(timer);channel?.close();for(const e of ['focus','online'])window.removeEventListener(e,refresh);document.removeEventListener('visibilitychange',refresh);};
 },[setData]);
 return {data,setData,error,loading,load,authExpired,online,lastSynced};
}
