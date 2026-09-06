"use client";
import {useEffect,useState} from 'react';
export type CustomerProfile={name:string;phone:string;verifiedAt:string};
export type IdentityResponse={customer?:CustomerProfile|null;configured?:boolean;challengeId?:string;phone?:string;expiresAt?:number;retryAfter?:number};
export async function identityRequest(input?:object):Promise<IdentityResponse>{
 const response=await fetch('/api/booking/identity',{cache:'no-store',...(input?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}:{})});
 let body:IdentityResponse&{error?:string};try{body=await response.json();}catch{throw new Error('تعذّر تحميل بياناتك. أعيدي فتح الصفحة.');}
 if(!response.ok)throw new Error(body.error||'تعذّر إتمام التحقق.');return body;
}
export function useCustomerIdentity(){
 const [profile,setProfile]=useState<CustomerProfile|null>(null),[configured,setConfigured]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let disposed=false;identityRequest().then(result=>{if(disposed)return;setProfile(result.customer||null);setConfigured(!!result.configured);}).catch(e=>{if(!disposed)setError((e as Error).message);}).finally(()=>{if(!disposed)setLoading(false);});return()=>{disposed=true;};},[]);
 return {profile,setProfile,configured,loading,error};
}
