"use client";
import {useState,useEffect} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {CalendarCheck,LoaderCircle} from 'lucide-react';
import {availableSlots,day,eligibleStaff,money,clock} from '@/lib/model';
import {request} from '@/lib/client';
import type {State} from '@/lib/client';
export default function NewBooking({data,online,onClose,onSave}:{data:State;online:boolean;onClose:()=>void;onSave:(data:State)=>void}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[ids,setIds]=useState<string[]>([]),[date,setDate]=useState(day()),[staff,setStaff]=useState(''),[mode,setMode]=useState('lounge'),[address,setAddress]=useState(''),[time,setTime]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const [submitted,setSubmitted]=useState<Record<string,unknown>|null>(null);
 useEffect(()=>{const saved=data.bookings.find(b=>b.id.endsWith(':'+data.access?.userId+':'+requestId));if(saved){onSave({...data,bookingId:saved.id});onClose();}},[data,requestId,onClose,onSave]);
 const selected=data.services.filter(s=>ids.includes(s.id)&&s.active),duration=selected.reduce((a,s)=>a+s.duration,0),total=selected.reduce((a,s)=>a+s.price,0);
 const eligible=selected.length?eligibleStaff(selected):[],effectiveStaff=eligible.some(t=>t.id===staff)?staff:eligible[0]?.id||'';
 const slots=effectiveStaff?availableSlots(data.bookings,date,effectiveStaff,duration,mode==='home'):[];
 const validTime=time!==''&&slots.includes(Number(time));
 function toggle(id:string){setIds(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]);setTime('');}
 async function submit(e:React.FormEvent){
 e.preventDefault();if(!online||busy||!submitted&&!validTime)return;
 const payload=submitted||{action:'book',customer:name,phone,date,start:Number(time),staff:effectiveStaff,mode,address:mode==='home'?address:'',ids,requestId};
 setSubmitted(payload);setBusy(true);setError('');
 try{onSave(await request(payload));onClose();}
 catch(e){const failure=e as Error & {status?:number};if(failure.status&&failure.status>=400&&failure.status<500){setSubmitted(null);setRequestId(crypto.randomUUID());setError(failure.message);}else setError('لم يصل تأكيد الحفظ بعد. نراجع الطلب تلقائيًا؛ إعادة المحاولة تستكمل الطلب نفسه.');}
 finally{setBusy(false);}
 }

 return <Dialog open onOpenChange={v=>!v&&!busy&&onClose()}><DialogContent className="detail-dialog staff-booking-dialog" dir="rtl"><DialogTitle>حجز من الاستقبال</DialogTitle><DialogDescription>سجّلي طلب الهاتف أو الزيارة المباشرة. يظهر ضمن الطلبات بانتظار التأكيد.</DialogDescription><form onSubmit={submit} className="staff-booking-form">
 <fieldset className="staff-booking-fields" disabled={!!submitted||busy}><div className="desk-form-grid"><label>اسم العميلة<input required minLength={2} maxLength={80} autoComplete="off" value={name} onChange={e=>setName(e.target.value)}/></label><label>رقم الهاتف<input type="tel" required autoComplete="off" dir="ltr" placeholder="079 000 0000" value={phone} onChange={e=>setPhone(e.target.value)}/></label></div>
 <fieldset><legend>الخدمات</legend><div className="staff-service-picks">{data.services.filter(s=>s.active).map(s=>{const checked=ids.includes(s.id),compatible=eligibleStaff([...selected.filter(x=>x.id!==s.id),s]).length>0;return <label key={s.id} className={checked?'picked':''}><Checkbox checked={checked} disabled={!checked&&(!compatible||mode==='home'&&!s.home)} onCheckedChange={()=>toggle(s.id)}/><span>{s.name}<small>{s.duration} دقيقة</small></span><b>{money(s.price)} د.أ</b></label>;})}</div></fieldset>
 <div className="desk-form-grid"><label>مكان الزيارة<Select dir="rtl" value={mode} onValueChange={v=>{setMode(v);setTime('');if(v==='home')setIds(ids.filter(id=>data.services.find(s=>s.id===id)?.home));}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="lounge">في اللاونج</SelectItem><SelectItem value="home">زيارة منزلية</SelectItem></SelectContent></Select></label><label>الأخصائية<Select dir="rtl" value={effectiveStaff} onValueChange={v=>{setStaff(v);setTime('');}} disabled={!eligible.length}><SelectTrigger><SelectValue placeholder="اختاري الخدمات أولًا"/></SelectTrigger><SelectContent>{eligible.map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></label></div>
 {mode==='home'&&<label>عنوان الزيارة<input required minLength={8} maxLength={300} value={address} onChange={e=>setAddress(e.target.value)}/><small>تُحجز ٣٠ دقيقة انتقال قبل الزيارة وبعدها.</small></label>}
 <label>التاريخ<input type="date" required min={day()} max={day(60)} value={date} onChange={e=>{setDate(e.target.value||day());setTime('');}}/></label>
 <fieldset><legend>الأوقات المتاحة</legend>{!selected.length?<p className="staff-form-hint">اختاري الخدمات لعرض الأوقات المناسبة.</p>:<div className="staff-time-picks">{slots.map(t=><button type="button" aria-pressed={time===String(t)} key={t} onClick={()=>setTime(String(t))}>{clock(t)}</button>)}{!slots.length&&<p>لا يوجد وقت متاح. اختاري يومًا آخر.</p>}</div>}</fieldset>
 </fieldset>{error&&<p className="error-banner" role="alert">{error}</p>}{!online&&<p role="status">عاد الاتصال؟ ستتمكنين من الحفظ فور عودته.</p>}
 <div className="staff-form-footer"><span>{duration} دقيقة · <strong>{money(total)} د.أ</strong></span><button className="primary-button" disabled={busy||!online||(!submitted&&(!validTime||!selected.length))}>{busy?<LoaderCircle className="spin" size={18}/>:<CalendarCheck size={18}/>}{submitted?'استكمال الحفظ':'حفظ الطلب'}</button></div><p className="staff-form-hint">الحجز من الاستقبال لا يوثّق ملكية رقم الهاتف ولا يرسل رسالة واتساب.</p>
 </form></DialogContent></Dialog>;
}
