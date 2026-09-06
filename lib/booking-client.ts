"use client";
import {useState,useEffect,useCallback} from 'react';
import type {Booking,Service} from './model';
export type BookingState={services:Service[];bookings:Pick<Booking,'date'|'staff'|'block_start'|'block_end'|'status'>[];today:string;demo:boolean;receipt?:Booking;bookingId?:string};
export async function request(action?:object):Promise<BookingState>{
 const response=await fetch('/api/booking',{cache:'no-store',...(action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{})});
 const data=await response.json() as BookingState & {error?:string};if(!response.ok)throw new Error(data.error||'تعذّر حفظ الطلب.');
 if(action&&'action' in action&&action.action==='book'&&typeof BroadcastChannel==='function'){const channel=new BroadcastChannel('madonna-bookings');channel.postMessage('booking-changed');channel.close();}
 return data;
}
export function useWorkspace(){const [data,setData]=useState<BookingState|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);const load=useCallback(async()=>{setError('');setLoading(true);try{setData(await request({action:'initialize'}));}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);useEffect(()=>{void load();},[load]);return {data,setData,error,loading,load};}
