import {env} from 'cloudflare:workers';
import {database} from '@/db/store';
import {workspaceId} from './admin-access';
import {normalizePhone} from './phone';

export class IdentityError extends Error{constructor(message:string,public status=400){super(message);}}
export type CustomerIdentity={name:string;phone:string;verifiedAt:string};
type Challenge={id:string;owner:string;user_id:string;phone:string;name:string;provider_sid:string;expires:number;attempts:number;status:string};
const configuration=()=>{const v=env as unknown as Record<string,string>;return {account:v.TWILIO_ACCOUNT_SID||'',token:v.TWILIO_AUTH_TOKEN||'',service:v.TWILIO_VERIFY_SERVICE_SID||''};};
export function verificationConfigured(){const c=configuration();return /^AC[0-9a-f]{32}$/i.test(c.account)&&!!c.token&&/^VA[0-9a-f]{32}$/i.test(c.service);}
export function identityContext(request:Request){
 // The existing private Site authenticates the visitor. Phone verification is a
 // contact claim bound to that identity, never a replacement for Site access.
 const user=request.headers.get('oai-authenticated-user-id');if(!user)throw new IdentityError('سجّلي الدخول لفتح المساحة الخاصة.',401);
 const owner=workspaceId();if(!owner)throw new IdentityError('المساحة قيد الإعداد.',503);return {owner,user};
}
export async function savedCustomer(owner:string,user:string):Promise<CustomerIdentity|null>{
 return database().prepare('SELECT name,phone,verified_at AS verifiedAt FROM customers WHERE owner=? AND user_id=?').bind(owner,user).first<CustomerIdentity>();
}
export async function requireVerifiedCustomer(request:Request,phone:unknown){
 const {owner,user}=identityContext(request),profile=await savedCustomer(owner,user);
 if(!profile||normalizePhone(phone)!==profile.phone)throw new IdentityError('أكّدي رقم واتساب قبل إتمام الحجز.',403);
 return profile;
}
function safeWrite(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')throw new IdentityError('الطلب غير مسموح.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new IdentityError('صيغة الطلب غير صالحة.',415);
 if(Number(request.headers.get('content-length')||0)>2048)throw new IdentityError('الطلب أكبر من المسموح.',413);
}
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
async function limit(owner:string,user:string,phone:string){
 const now=Date.now(),db=database(),u=await hash(user),p=await hash(phone);
 const id=crypto.randomUUID();
 // Admission and all sliding-window checks happen in one write. Rejected
 // attempts never consume another customer's or the salon's send budget.
 const admitted=await db.prepare(`INSERT INTO verification_dispatches (id,owner,user_hash,phone_hash,created) SELECT ?,?,?,?,? WHERE
  NOT EXISTS (SELECT 1 FROM verification_dispatches WHERE owner=? AND (user_hash=? OR phone_hash=?) AND created>?) AND
  (SELECT COUNT(*) FROM verification_dispatches WHERE owner=? AND user_hash=? AND created>?)<5 AND
  (SELECT COUNT(*) FROM verification_dispatches WHERE owner=? AND phone_hash=? AND created>?)<5 AND
  (SELECT COUNT(*) FROM verification_dispatches WHERE owner=? AND created>?)<200`).bind(id,owner,u,p,now,owner,u,p,now-60000,owner,u,now-3600000,owner,p,now-3600000,owner,now-86400000).run();
 if(admitted.meta.changes!==1)throw new IdentityError('انتظري دقيقة قبل طلب رمز آخر. إذا تكررت المحاولات، جرّبي لاحقًا.',429);
}
async function provider(path:string,body:Record<string,string>){
 if(!verificationConfigured())throw new IdentityError('تأكيد واتساب غير متاح بعد. يُفعّل عند ربط رقم مادونا بخدمة الإرسال.',503);
 const c=configuration();let response:Response;
 try{response=await fetch(`https://verify.twilio.com/v2/Services/${c.service}/${path}`,{method:'POST',headers:{Authorization:'Basic '+btoa(c.account+':'+c.token),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),signal:AbortSignal.timeout(12000)});}catch{throw new IdentityError('تعذّر الاتصال بواتساب. حاولي مجددًا بعد قليل.',503);}
 if(response.status===429)throw new IdentityError('محاولات كثيرة. انتظري قبل المحاولة مجددًا.',429);
 if(response.status===404&&path==='VerificationCheck')throw new IdentityError('انتهت صلاحية الرمز. اطلبي رمزًا جديدًا.',410);
 if(!response.ok)throw new IdentityError('تعذّر إتمام التحقق عبر واتساب. راجعي الرقم وحاولي لاحقًا.',503);
 return response.json() as Promise<{sid?:string;status?:string;to?:string;channel?:string}>;
}
function reply(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});}
export async function getIdentity(request:Request){try{const {owner,user}=identityContext(request);return reply({customer:await savedCustomer(owner,user),configured:verificationConfigured()});}catch(e){return failure(e);}}
function failure(e:unknown){return reply({error:e instanceof IdentityError?e.message:'تعذّر حفظ التحقق. حاولي مجددًا.'},e instanceof IdentityError?e.status:503);}
export async function postIdentity(request:Request){try{
 const {owner,user}=identityContext(request);safeWrite(request);const raw=await request.text();if(raw.length>2048)throw new IdentityError('الطلب أكبر من المسموح.',413);
 let input:Record<string,unknown>;try{input=JSON.parse(raw);}catch{throw new IdentityError('صيغة الطلب غير صالحة.');}if(!input||typeof input!=='object')throw new IdentityError('صيغة الطلب غير صالحة.');
 const db=database(),now=Date.now();
 if(input.action==='start'){
  const phone=normalizePhone(input.phone),name=typeof input.name==='string'?input.name.trim():'';
  if(!phone||name.length<2||name.length>80)throw new IdentityError('أضيفي اسمك ورقم واتساب صحيحًا مع مفتاح الدولة.');
  const current=await savedCustomer(owner,user);if(current?.phone===phone)return reply({customer:current,configured:verificationConfigured()});
  if(!verificationConfigured())throw new IdentityError('تأكيد واتساب غير متاح بعد. يُفعّل عند ربط رقم مادونا بخدمة الإرسال.',503);
  await limit(owner,user,phone);
  // A resend must not extend the lifetime of a token already issued by Twilio.
  const prior=await db.prepare("SELECT expires FROM verification_challenges WHERE owner=? AND user_id=? AND phone=? AND expires>? AND status IN ('pending','verifying') ORDER BY expires ASC LIMIT 1").bind(owner,user,phone,now).first<{expires:number}>();
  const id=crypto.randomUUID(),expires=prior?.expires||now+600000;
  const reservation=await db.batch([
   db.prepare("INSERT INTO verification_challenges (id,owner,user_id,phone,name,provider_sid,expires,attempts,status) SELECT ?,?,?,?,?,'',?,0,'sending' WHERE NOT EXISTS (SELECT 1 FROM verification_challenges WHERE owner=? AND user_id=? AND status IN ('sending','verifying') AND expires>?)").bind(id,owner,user,phone,name,expires,owner,user,now),
   db.prepare("UPDATE verification_challenges SET status='superseded' WHERE owner=? AND user_id=? AND status='pending' AND EXISTS (SELECT 1 FROM verification_challenges WHERE id=? AND status='sending')").bind(owner,user,id),
  ]);
  if(reservation[0].meta.changes!==1)throw new IdentityError('هناك تحقق قيد المعالجة. انتظري لحظة قبل طلب رمز آخر.',409);
  let result:Awaited<ReturnType<typeof provider>>;
  try{
   result=await provider('Verifications',{To:phone,Channel:'whatsapp',Locale:'ar'});
   if(!result.sid||!/^VE[0-9a-f]{32}$/i.test(result.sid)||result.status!=='pending'||result.channel!=='whatsapp'||result.to!==phone)throw new IdentityError('لم نتمكن من إرسال الرمز. حاولي لاحقًا.',503);
  }catch(e){await db.prepare("UPDATE verification_challenges SET status='failed' WHERE id=? AND status='sending'").bind(id).run();throw e;}
  await db.batch([
   db.prepare("UPDATE verification_challenges SET provider_sid=?,status='pending' WHERE id=? AND status='sending'").bind(result.sid,id),
   db.prepare('DELETE FROM verification_challenges WHERE owner=? AND expires<?').bind(owner,now-86400000),
   db.prepare('DELETE FROM verification_dispatches WHERE owner=? AND created<?').bind(owner,now-86400000),
  ]);
  return reply({challengeId:id,phone,expiresAt:expires,retryAfter:60});
 }
 if(input.action==='verify'){
  if(typeof input.challengeId!=='string'||!/^[a-f0-9-]{36}$/.test(input.challengeId)||typeof input.code!=='string'||!/^\d{4,10}$/.test(input.code))throw new IdentityError('أدخلي رمز التحقق كاملًا.');
  const challenge=await db.prepare('SELECT * FROM verification_challenges WHERE id=? AND owner=? AND user_id=?').bind(input.challengeId,owner,user).first<Challenge>();
  if(!challenge||challenge.expires<=now||challenge.attempts>=5||challenge.status!=='pending')throw new IdentityError('هذا الرمز منتهي أو غير متاح. اطلبي رمزًا جديدًا.',410);
  const lock=await db.prepare("UPDATE verification_challenges SET status='verifying',attempts=attempts+1 WHERE id=? AND owner=? AND user_id=? AND status='pending' AND attempts<5 AND expires>?").bind(challenge.id,owner,user,now).run();
  if(lock.meta.changes!==1)throw new IdentityError('التحقق قيد المعالجة. انتظري لحظة.',409);
  let result:Awaited<ReturnType<typeof provider>>;
  try{result=await provider('VerificationCheck',{VerificationSid:challenge.provider_sid,Code:input.code});}catch(e){await db.prepare("UPDATE verification_challenges SET status=? WHERE id=? AND status='verifying'").bind(e instanceof IdentityError&&e.status===410?'expired':'pending',challenge.id).run();throw e;}
  if(result.status!=='approved'||result.to!==challenge.phone||result.sid!==challenge.provider_sid){await db.prepare("UPDATE verification_challenges SET status='pending' WHERE id=? AND status='verifying'").bind(challenge.id).run();throw new IdentityError('الرمز غير صحيح. راجعي الرسالة وحاولي مجددًا.');}
  const verifiedAt=new Date().toISOString();
  try{
   const saved=await db.batch([
    db.prepare(`INSERT INTO customers (owner,user_id,name,phone,verified_at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM verification_challenges WHERE id=? AND status='verifying' AND expires>?) ON CONFLICT(owner,user_id) DO UPDATE SET name=excluded.name,phone=excluded.phone,verified_at=excluded.verified_at`).bind(owner,user,challenge.name,challenge.phone,verifiedAt,challenge.id,Date.now()),
    db.prepare("UPDATE verification_challenges SET status='consumed' WHERE id=? AND status='verifying'").bind(challenge.id),
   ]);
   if(saved[0].meta.changes!==1)throw new IdentityError('تغيّر طلب التحقق. اطلبي رمزًا جديدًا.',409);
  }catch(e){if(e instanceof IdentityError)throw e;if(String(e).includes('UNIQUE constraint failed')){await db.prepare("UPDATE verification_challenges SET status='conflict' WHERE id=?").bind(challenge.id).run();throw new IdentityError('هذا الرقم مرتبط بملف آخر. استخدمي حسابك السابق أو تواصلي مع الاستقبال.',409);}throw e;}
  return reply({customer:await savedCustomer(owner,user),configured:verificationConfigured()});
 }
 throw new IdentityError('الطلب غير معروف.');
 }catch(e){return failure(e);}}
