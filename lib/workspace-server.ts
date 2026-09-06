import {IdentityError,requireVerifiedCustomer} from '@/lib/customer-identity';
import {normalizePhone} from '@/lib/phone';
import {isAdminEmail,workspaceId} from '@/lib/admin-access';
import {database} from '@/db/store';
import {day,minuteNow,sampleServices,team,eligibleStaff,transitions,validDate} from '@/lib/model';
import type {Service} from '@/lib/model';
type Audience='admin'|'customer';
class ApiError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
function ownerOf(r:Request,audience:Audience){const id=r.headers.get('oai-authenticated-user-id');if(!id)throw new ApiError('سجّلي الدخول لفتح المساحة الخاصة.',401);if(audience==='admin'&&!isAdminEmail(r.headers.get('oai-authenticated-user-email')))throw new ApiError('هذه المساحة مخصصة للإدارة.',403);const owner=workspaceId();if(!owner)throw new ApiError('المساحة قيد الإعداد.',503);return owner;}
function safeWrite(r:Request){const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)throw new ApiError('الطلب غير مسموح.',403);if(!r.headers.get('content-type')?.startsWith('application/json'))throw new ApiError('صيغة الطلب غير صالحة.',415);}
async function state(owner:string,audience:Audience,receiptId?:string){
 const db=database();
 const services=(await db.prepare('SELECT id,name,category,price,duration,home,active FROM services WHERE owner=?'+(audience==='customer'?' AND active=1':'')+' ORDER BY rowid').bind(owner).all()).results;
 const sql=audience==='admin'?'SELECT * FROM bookings WHERE owner=? ORDER BY date DESC,start ASC LIMIT 1500':"SELECT date,staff,block_start,block_end,status FROM bookings WHERE owner=? AND date>=? AND date<=? AND status NOT IN ('cancelled','noshow') ORDER BY date,start";
 const stmt=db.prepare(sql);const rows=(await (audience==='admin'?stmt.bind(owner):stmt.bind(owner,day(),day(60))).all<Record<string,unknown>>()).results;
 const decode=(r:Record<string,unknown>)=>{const {owner:_,...rest}=r;return {...rest,...(r.services?{services:JSON.parse(String(r.services))}:{})};};
 const receipt=receiptId?await db.prepare('SELECT * FROM bookings WHERE owner=? AND id=?').bind(owner,receiptId).first<Record<string,unknown>>():null;
 return {services,bookings:rows.map(decode),today:day(),demo:true,...(receipt?{receipt:decode(receipt),bookingId:receiptId}:{})};
}
function fail(e:unknown){if(e instanceof ApiError||e instanceof IdentityError)return Response.json({error:e.message},{status:e.status});console.error('Madonna request failed',e);return Response.json({error:'تعذّر الاتصال بالمساحة الآن. بقيت بياناتك في النموذج؛ حاولي مجددًا.'},{status:503});}
export async function handleGet(r:Request,audience:Audience){try{return Response.json(await state(ownerOf(r,audience),audience),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return fail(e);}}
export async function handlePost(r:Request,audience:Audience){try{const owner=ownerOf(r,audience);safeWrite(r);const input=await r.json() as {action:string;service:Service;id:string;status:string;customer:string;phone:string;date:string;start:number;staff:string;mode:string;address?:string;notes?:string;ids:string[];requestId:string};if(!input||typeof input!=='object')throw new ApiError('صيغة الطلب غير صالحة.');if(audience==='customer'&&!['initialize','book'].includes(input.action))throw new ApiError('الطلب غير مسموح.',403);const db=database();if(input.action==='initialize'){
 const stmts=[db.prepare('INSERT OR IGNORE INTO workspaces (owner,created) VALUES (?,?)').bind(owner,new Date().toISOString())];
 for(const s of sampleServices)stmts.push(db.prepare('INSERT OR IGNORE INTO services (owner,id,name,category,price,duration,home,active) VALUES (?,?,?,?,?,?,?,?)').bind(owner,s.id,s.name,s.category,s.price,s.duration,s.home,s.active));
 const initialized=await db.batch(stmts);return Response.json({...(await state(owner,audience)),initialized:initialized[0].meta.changes===1});
 }
 if(input.action==='samples'){
 const names=['ليان أحمد','جود عمر','رنا سمير','تالا خالد','سلمى يوسف','لانا علي'];
 const stmts=[];
 for(let i=0;i<18;i++){const date=day(i<6?0:-Math.ceil((i-5)/2));const s=sampleServices[[0,4,6,2,5,7][i%6]];const staff=eligibleStaff([s])[0].id;const start=[630,660,690,810,840,930][i%6];const mode=i%6===5?'home':'lounge';const id='sample-'+date+'-'+i;const status=i<6?(i%3===0?'pending':'confirmed'):'completed';stmts.push(db.prepare(`INSERT OR IGNORE INTO bookings (id,owner,customer,phone,date,start,end,block_start,block_end,staff,mode,status,services,total,address,notes,created) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE owner=? AND date=? AND staff=? AND status NOT IN ('cancelled','noshow') AND block_start<? AND block_end>?)`).bind(owner+':'+id,owner,names[i%6],'DEMO-'+(i%6+1),date,start,start+s.duration,start-(mode==='home'?30:0),start+s.duration+(mode==='home'?30:0),staff,mode,status,JSON.stringify([s]),s.price,mode==='home'?'عمّان • عنوان توضيحي':'','سجل توضيحي لعرض النظام',new Date().toISOString(),owner,date,staff,start+s.duration+(mode==='home'?30:0),start-(mode==='home'?30:0)));}
 await db.batch(stmts);return Response.json(await state(owner,audience));
 }
 if(input.action==='service'){
 const s=input.service;if(!s||!sampleServices.some(x=>x.id===s.id)||!Number.isInteger(s.price)||s.price<0||s.price>100000||!Number.isInteger(s.duration)||s.duration<30||s.duration>240||s.duration%30||![0,1].includes(s.active)||![0,1].includes(s.home))throw new ApiError('راجعي السعر والمدة. مدة الخدمة من ٣٠ إلى ٢٤٠ دقيقة بمضاعفات ٣٠.');
 await db.prepare('UPDATE services SET price=?,duration=?,active=?,home=? WHERE owner=? AND id=?').bind(s.price,s.duration,s.active,s.home,owner,s.id).run();return Response.json(await state(owner,audience));
 }
 if(input.action==='status'){
 const b=await db.prepare('SELECT status FROM bookings WHERE owner=? AND id=?').bind(owner,String(input.id)).first<{status:string}>();if(!b)throw new ApiError('الحجز غير موجود.',404);if(!transitions[b.status]?.includes(input.status))throw new ApiError('لا يمكن تغيير حالة هذا الحجز بهذا الترتيب.',409);
 const res=await db.prepare('UPDATE bookings SET status=? WHERE id=? AND owner=? AND status=?').bind(input.status,input.id,owner,b.status).run();if(!res.meta.changes)throw new ApiError('تغيّر الحجز. حدّثي الصفحة.',409);return Response.json(await state(owner,audience));
 }
 if(input.action==='book'){
 const {customer,date,start,staff,mode,address='',notes='',ids,requestId}=input;
 const phone=normalizePhone(input.phone);
 if(audience==='customer')await requireVerifiedCustomer(r,phone);
 if(typeof customer!=='string'||customer.trim().length<2||customer.length>80||typeof phone!=='string'||!/^\+?[0-9]{8,15}$/.test(phone)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!validDate(date)||date<day()||date>day(60)||!Number.isInteger(start)||start<600||start%30||!team.some(t=>t.id===staff)||!['home','lounge'].includes(mode)||typeof address!=='string'||address.length>300||typeof notes!=='string'||notes.length>500||!Array.isArray(ids)||ids.length<1||ids.length>9||new Set(ids).size!==ids.length||typeof requestId!=='string'||!/^[a-f0-9-]{36}$/.test(requestId))throw new ApiError('راجعي الاسم ورقم الهاتف والخدمات والموعد.');
 if(mode==='home'&&address.trim().length<8)throw new ApiError('أضيفي عنوان الخدمة المنزلية بالتفصيل.');
 if(date===day()&&start-(mode==='home'?30:0)<=minuteNow())throw new ApiError('هذا الوقت مضى. اختاري موعدًا قادمًا.');
 const id=owner+':'+r.headers.get('oai-authenticated-user-id')+':'+requestId;const existing=await db.prepare('SELECT id FROM bookings WHERE owner=? AND id=?').bind(owner,id).first();if(existing)return Response.json({...(await state(owner,audience,id)),bookingId:id});
 const all=await db.prepare('SELECT id,name,category,price,duration,home,active FROM services WHERE owner=? AND active=1').bind(owner).all<Service>();const selected=all.results.filter((s:Service)=>ids.includes(s.id));if(selected.length!==ids.length||!eligibleStaff(selected).some(t=>t.id===staff)||mode==='home'&&selected.some((s:Service)=>!s.home))throw new ApiError('الخدمات المختارة لا تناسب هذا الاختيار. راجعي الخدمة والأخصائية.');
 const duration=selected.reduce((v:number,s:Service)=>v+s.duration,0),total=selected.reduce((v:number,s:Service)=>v+s.price,0),end=start+duration,buffer=mode==='home'?30:0;if(end>1200)throw new ApiError('الخدمات تتجاوز نهاية الدوام. اختاري وقتًا أبكر.');
 const insertion=db.prepare(`INSERT INTO bookings (id,owner,customer,phone,date,start,end,block_start,block_end,staff,mode,status,services,total,address,notes,created) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE owner=? AND date=? AND staff=? AND status NOT IN ('cancelled','noshow') AND block_start<? AND block_end>?)`).bind(id,owner,customer.trim(),phone,date,start,end,start-buffer,end+buffer,staff,mode,'pending',JSON.stringify(selected),total,address.trim(),notes.trim(),new Date().toISOString(),owner,date,staff,end+buffer,start-buffer);
 const result=audience==='customer'?(await db.batch([insertion,db.prepare('UPDATE customers SET name=? WHERE owner=? AND user_id=? AND phone=? AND EXISTS (SELECT 1 FROM bookings WHERE id=?)').bind(customer.trim(),owner,r.headers.get('oai-authenticated-user-id'),phone,id)]))[0]:await insertion.run();if(!result.meta.changes)throw new ApiError('حُجز هذا الوقت للتو. اختاري وقتًا آخر.',409);
 return Response.json({...(await state(owner,audience,id)),bookingId:id},{status:201});
 }
 throw new ApiError('الطلب غير معروف.');
 }catch(e){return fail(e);}}
