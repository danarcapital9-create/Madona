import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {build} from 'esbuild';
const sqlite=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
function statement(sql,params=[]){const run=()=>({results:sqlite.prepare(sql).all(...params),meta:{changes:Number(sqlite.prepare('SELECT changes() AS n').get().n)}});return{bind(...p){return statement(sql,p)},async all(){return run()},async run(){return run()},async first(){return run().results[0]||null}};}
globalThis.__identityDb={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
globalThis.__identityEnv={MADONNA_WORKSPACE_ID:'salon-a'};
const bundle=await build({entryPoints:['lib/customer-identity.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'bindings',setup(b){b.onResolve({filter:/@\/db\/store/},()=>({path:'db',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export function database(){return globalThis.__identityDb}'}));b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'fixture-env'}));b.onLoad({filter:/.*/,namespace:'fixture-env'},()=>({contents:'export const env=globalThis.__identityEnv'}));}}]});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const phoneBundle=await build({entryPoints:['lib/phone.ts'],bundle:true,write:false,format:'esm',platform:'node'});const {normalizePhone}=await import('data:text/javascript;base64,'+Buffer.from(phoneBundle.outputFiles[0].text).toString('base64'));
const req=(body,user='client-a',origin='https://test.local')=>new Request('https://test.local/api/booking/identity',{method:body?'POST':'GET',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
const post=(body,user,origin)=>api.postIdentity(req(body,user,origin));
const configure=()=>Object.assign(globalThis.__identityEnv,{TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),TWILIO_AUTH_TOKEN:'test-only-secret',TWILIO_VERIFY_SERVICE_SID:'VA'+'b'.repeat(32)});
let sequence=0,sends=0,checks=0,heldCheck=null,signalCheck=null;
const verifications=new Map();
globalThis.fetch=async(url,options)=>{
 assert.ok(String(url).startsWith('https://verify.twilio.com/v2/Services/VA'));
 assert.ok(options.headers.Authorization.startsWith('Basic '));
 const body=new URLSearchParams(options.body);
 if(String(url).endsWith('/Verifications')){assert.equal(body.get('Channel'),'whatsapp');sends++;const sid='VE'+(++sequence).toString(16).padStart(32,'0');const data={sid,to:body.get('To'),channel:'whatsapp',status:'pending'};verifications.set(sid,data);return Response.json(data);}
 checks++;const data=verifications.get(body.get('VerificationSid'));if(!data||data.status==='approved')return Response.json({}, {status:404});
 if(heldCheck){signalCheck?.();await heldCheck;}
 const result={...data,status:body.get('Code')==='123456'?'approved':'pending'};if(result.status==='approved')verifications.set(result.sid,result);return Response.json(result);
};
const start=(phone='0791234567',user='client-a',name='عميلة الاختبار')=>post({action:'start',phone,name},user);
const check=(id,code='123456',user='client-a')=>post({action:'verify',challengeId:id,code},user);
const clearLimits=()=>sqlite.exec('DELETE FROM verification_dispatches');

test('Arabic/local/international representations normalize to one phone',()=>{for(const value of ['0791234567','٠٧٩ ١٢٣ ٤٥٦٧','۰۷۹۱۲۳۴۵۶۷','00962791234567','+962 (79) 123-4567','962791234567','791234567'])assert.equal(normalizePhone(value),'+962791234567');for(const value of ['0790000','+9620791234567','abc','+000000000','+96261234567','079<script>'])assert.equal(normalizePhone(value),null);assert.equal(normalizePhone('+447700900123'),'+447700900123');});
test('identity requires Site authentication and same-origin JSON writes',async()=>{assert.equal((await api.getIdentity(req(undefined,''))).status,401);assert.equal((await post({action:'start'},'client-a','https://other.test')).status,403);assert.equal((await api.postIdentity(new Request('https://test.local/api/booking/identity',{method:'POST',headers:{'oai-authenticated-user-id':'client-a','Content-Type':'application/json'},body:'{}'}))).status,403);});
test('unconfigured provider fails closed and never pretends to send',async()=>{const status=await (await api.getIdentity(req())).json();assert.equal(status.configured,false);assert.equal(status.customer,null);assert.equal((await start()).status,503);assert.equal(sends,0);await assert.rejects(()=>api.requireVerifiedCustomer(req(),'+962791234567'),e=>e.status===403);configure();});
let firstId;
test('send is WhatsApp-only; repeated rejected requests do not drain shared quota',async()=>{const result=await start();assert.equal(result.status,200);const data=await result.json();firstId=data.challengeId;assert.ok(firstId);assert.equal(data.phone,'+962791234567');assert.equal(data.retryAfter,60);assert.equal(sends,1);for(let i=0;i<8;i++)assert.equal((await start()).status,429);assert.equal(sends,1);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM verification_dispatches').get().n,1);});
test('challenge is owner-bound, wrong code fails, approval persists, replay fails',async()=>{assert.equal((await check(firstId,'123456','other-user')).status,410);assert.equal(checks,0);assert.equal((await check(firstId,'111111')).status,400);assert.equal((await api.savedCustomer('salon-a','client-a')),null);const result=await check(firstId);assert.equal(result.status,200);assert.equal((await result.json()).customer.phone,'+962791234567');assert.equal((await check(firstId)).status,410);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM customers').get().n,1);});
test('returning customer is restored without OTP; a changed number cannot book',async()=>{const before=sends,status=await (await api.getIdentity(req())).json();assert.equal(status.customer.name,'عميلة الاختبار');assert.equal(status.customer.phone,'+962791234567');assert.equal((await start()).status,200);assert.equal(sends,before);assert.equal((await api.requireVerifiedCustomer(req(),'٠٧٩١٢٣٤٥٦٧')).phone,'+962791234567');await assert.rejects(()=>api.requireVerifiedCustomer(req(),'0791234568'),e=>e.status===403);});
test('database uniqueness forbids two customer identities sharing normalized phone',async()=>{clearLimits();const data=await (await start('0791234567','client-b')).json();const result=await check(data.challengeId,'123456','client-b');assert.equal(result.status,409);assert.equal(await api.savedCustomer('salon-a','client-b'),null);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM customers').get().n,1);});
test('number change preserves old verified profile until approval and replaces it atomically',async()=>{clearLimits();const data=await (await start('0791234568')).json();assert.equal((await api.savedCustomer('salon-a','client-a')).phone,'+962791234567');assert.equal((await check(data.challengeId)).status,200);assert.equal((await api.savedCustomer('salon-a','client-a')).phone,'+962791234568');assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM customers').get().n,1);await assert.rejects(()=>api.requireVerifiedCustomer(req(),'0791234567'),e=>e.status===403);});
test('expiry and five incorrect checks prevent further provider attempts',async()=>{clearLimits();let data=await (await start('0791234569')).json();for(let i=0;i<5;i++)assert.equal((await check(data.challengeId,'111111')).status,400);const before=checks;assert.equal((await check(data.challengeId)).status,410);assert.equal(checks,before);clearLimits();data=await (await start('0791234570')).json();sqlite.prepare('UPDATE verification_challenges SET expires=? WHERE id=?').run(Date.now()-1,data.challengeId);assert.equal((await check(data.challengeId)).status,410);});
test('concurrent resend cannot supersede an in-flight verification',async()=>{
 clearLimits();const data=await (await start('0791234571')).json();let release;heldCheck=new Promise(r=>release=r);const entered=new Promise(r=>signalCheck=r);
 const verifying=check(data.challengeId);await entered;clearLimits();const before=sends;assert.equal((await start('0791234571')).status,409);assert.equal(sends,before);release();assert.equal((await verifying).status,200);heldCheck=null;signalCheck=null;assert.equal((await api.savedCustomer('salon-a','client-a')).phone,'+962791234571');
});
