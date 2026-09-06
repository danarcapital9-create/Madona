"use client";
import {useEffect,useState} from 'react';
import {Check,LoaderCircle,MessageCircle,ShieldCheck,ArrowLeft} from 'lucide-react';
import {InputOTP,InputOTPGroup,InputOTPSlot} from '@/components/ui/input-otp';
import {identityRequest,type CustomerProfile} from '@/lib/customer-client';
import {normalizePhone} from '@/lib/phone';
type Props={name:string;phone:string;onName:(v:string)=>void;onPhone:(v:string)=>void;profile:CustomerProfile|null;configured:boolean;loading:boolean;loadError:string;onVerified:(p:CustomerProfile)=>void;onBusy:(v:boolean)=>void};
export default function VerifiedContact({name,phone,onName,onPhone,profile,configured,loading,loadError,onVerified,onBusy}:Props){
 const [challenge,setChallenge]=useState<{id:string;phone:string;expires:number;retry:number}|null>(null),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now());
 const canonical=normalizePhone(phone),verified=!!profile&&canonical===profile.phone;
 useEffect(()=>{if(challenge&&canonical!==challenge.phone){setChallenge(null);setCode('');setError('');}},[canonical,challenge]);
 useEffect(()=>{if(!challenge)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[challenge]);
 const working=(value:boolean)=>{setBusy(value);onBusy(value);};
 async function send(){if(busy||!configured)return;working(true);setError('');try{
  const result=await identityRequest({action:'start',name,phone});
  if(result.customer){onVerified(result.customer);setChallenge(null);return;}
  if(!result.challengeId||!result.phone||!result.expiresAt)throw Error('تعذّر بدء التحقق. حاولي مجددًا.');
  setNow(Date.now());setChallenge({id:result.challengeId,phone:result.phone,expires:result.expiresAt,retry:Date.now()+(result.retryAfter||60)*1000});setCode('');
 }catch(e){setError((e as Error).message);}finally{working(false);}}
 async function verify(){if(busy||!challenge||code.length!==6)return;working(true);setError('');try{
  const result=await identityRequest({action:'verify',challengeId:challenge.id,code});if(!result.customer)throw Error('تعذّر إتمام التحقق.');
  onVerified(result.customer);setChallenge(null);setCode('');
 }catch(e){setError((e as Error).message);}finally{working(false);}}
 return <div className="verified-contact">
  {loading?<p className="contact-status"><LoaderCircle size={17} className="spin"/>نستعيد بياناتكِ المحفوظة…</p>:null}
  <div className="form-grid"><label>اسمكِ<input required autoComplete="name" minLength={2} maxLength={80} value={name} onChange={e=>onName(e.target.value)} placeholder="كيف تحبين أن نناديكِ؟" disabled={busy||loading}/></label><label>رقم واتساب<input required autoComplete="tel" dir="ltr" type="tel" inputMode="tel" maxLength={40} value={phone} onChange={e=>onPhone(e.target.value)} placeholder="07X XXX XXXX" readOnly={!!challenge} disabled={busy||loading}/></label></div>
  {verified?<div className="contact-verified" role="status"><ShieldCheck size={21}/><div><strong>رقمكِ مؤكّد، أهلًا بعودتكِ.</strong><p>اسمك ورقمك محفوظان للحجوزات القادمة. تغيير الرقم يتطلب تأكيدًا جديدًا.</p></div></div>:<div className="contact-verification">
   {challenge?<><div className="contact-code-heading"><MessageCircle size={22}/><div><strong>وصلتكِ رسالة على واتساب</strong><p dir="ltr">{challenge.phone}</p></div><button type="button" disabled={busy} onClick={()=>{setChallenge(null);setCode('');setError('');}}>تغيير الرقم</button></div><p>أدخلي الرمز المكوّن من ٦ أرقام لتأكيد رقمك.</p><div className="contact-code-entry" dir="ltr"><InputOTP maxLength={6} pattern="[0-9]*" value={code} onChange={setCode} inputMode="numeric" autoComplete="one-time-code" disabled={busy||now>=challenge.expires} aria-label="رمز تأكيد واتساب"><InputOTPGroup>{Array.from({length:6},(_,i)=><InputOTPSlot key={i} index={i}/>)}</InputOTPGroup></InputOTP><button type="button" className="verify-button" onClick={verify} disabled={busy||code.length!==6||now>=challenge.expires}>{busy?<LoaderCircle className="spin" size={17}/>:<Check size={17}/>}تأكيد الرقم</button></div><div className="contact-resend"><span>{now>=challenge.expires?'انتهت صلاحية الرمز.':`صالح لمدة ${Math.ceil((challenge.expires-now)/60000)} دقائق`}</span><button type="button" onClick={send} disabled={busy||now<challenge.retry}>{now<challenge.retry?`إعادة الإرسال بعد ${Math.ceil((challenge.retry-now)/1000)} ث`:'إرسال رمز جديد'}</button></div></>:<><div className="contact-code-heading"><MessageCircle size={23}/><div><strong>{profile?'أكّدي الرقم الجديد':'تأكيد واحد. ولحظات كثيرة.'}</strong><p>نرسل رمزًا إلى واتساب لحفظ رقمك. في حجزك القادم تعود بياناتك تلقائيًا.</p></div></div><button className="verify-button" type="button" onClick={send} disabled={busy||loading||!configured||!canonical||name.trim().length<2}>{busy?<LoaderCircle size={17} className="spin"/>:<MessageCircle size={18}/>}إرسال رمز واتساب <ArrowLeft size={17}/></button></>}
   {!configured&&!loading&&<p className="contact-unavailable" role="status">تأكيد واتساب بانتظار التفعيل من مادونا. لا يمكن إتمام الحجز قبل تأكيد الرقم.</p>}
  </div>}
  {(error||loadError)&&<p className="contact-error" role="alert">{error||loadError}</p>}
 </div>;
}
