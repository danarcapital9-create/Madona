import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {build} from 'esbuild';
const sqlite=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
function statement(sql,args=[]){const run=()=>{const results=sqlite.prepare(sql).all(...args);return {results,meta:{changes:sqlite.prepare('SELECT changes() n').get().n}};};return {bind(...a){return statement(sql,a);},async all(){return run();},async run(){return run();},async first(){return run().results[0]||null;}};}
globalThis.__deskDb={prepare:statement,async batch(stmts){sqlite.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sqlite.exec('COMMIT');return out;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
globalThis.__deskEnv={DB:globalThis.__deskDb,MADONNA_ADMIN_EMAIL:'manager@test.local',MADONNA_WORKSPACE_ID:'salon'};
async function bundle(path){const b=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__deskEnv;'}));}}]});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));}
const workspace=await bundle('app/api/workspace/route.ts'),team=await bundle('app/api/desk/team/route.ts'),model=await bundle('lib/model.ts');
const who={manager:['manager@test.local','manager-id'],reception:['front@test.local','front-id'],sara:['sara@test.local','sara-id'],nour:['nour@test.local','nour-id'],outsider:['client@test.local','client-id']};
function req(body,person='manager',origin='https://test.local'){const [email,id]=who[person]||[];return new Request('https://test.local/api/workspace',{method:body?'POST':'GET',headers:{...(id?{'oai-authenticated-user-id':id,'oai-authenticated-user-email':email}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});}
const member=(email,name,role,staffId=null,active=1)=>({email,name,role,staffId,active});
const grant=(body,person='manager')=>team.POST(req(body,person));
const booking=(staff,ids,start=660)=>({action:'book',customer:staff==='sara'?'Sara client':'Nour client',phone:staff==='sara'?'0791234567':'0791234568',date:model.day(2),start,staff,mode:'lounge',ids,requestId:crypto.randomUUID()});
let saraId,nourId;
test('employee application rejects anonymous and non-members on every endpoint',async()=>{
 for(const api of [workspace,team]){assert.equal((await api.GET(req(undefined,'anonymous'))).status,401);assert.equal((await api.GET(req(undefined,'outsider'))).status,403);assert.equal((await api.POST(req({action:'initialize'},'outsider'))).status,403);}
});
test('manager explicitly creates normalized employee grants, with validated roles and staff links',async()=>{
 await workspace.POST(req({action:'initialize'}));
 assert.equal((await grant(member(' Front@Test.local ','Reception','reception'))).status,200);
 assert.equal((await grant(member('sara@test.local','Sara','specialist','sara'))).status,200);
 assert.equal((await grant(member('nour@test.local','Nour','specialist','nour'))).status,200);
 assert.equal((await grant(member('x@test.local','Test','manager'))).status,400);
 assert.equal((await grant(member('x@test.local','Test','specialist','bad-id'))).status,400);
 assert.equal((await grant(member('manager@test.local','Manager','reception'))).status,409);
 assert.equal((await team.POST(req(member('x@test.local','Test','reception'),'manager','https://evil.local'))).status,403);
 const result=await (await team.GET(req())).json();assert.equal(result.members.length,3);assert.ok(result.members.some(m=>m.email==='front@test.local'));assert.ok(result.members.every(m=>!('user_id' in m)));
});
test('reception can create bookings and sees shared site data, without managing services or team',async()=>{
 const a=await workspace.POST(req(booking('sara',['gel']),'reception'));assert.equal(a.status,201);saraId=(await a.json()).bookingId;
 const b=await workspace.POST(req(booking('nour',['blow']),'reception'));assert.equal(b.status,201);nourId=(await b.json()).bookingId;
 const data=await (await workspace.GET(req(undefined,'reception'))).json();assert.equal(data.bookings.length,2);assert.equal(data.access.role,'reception');
 assert.equal((await team.GET(req(undefined,'reception'))).status,403);
 assert.equal((await grant(member('x@test.local','Test','reception'),'reception')).status,403);
 for(const action of ['service','samples'])assert.equal((await workspace.POST(req({action},'reception'))).status,403);
 assert.equal((await workspace.POST(req(booking('sara',['gel'],690),'reception'))).status,409);
});
test('specialist scope is enforced on reads and writes, including foreign booking IDs',async()=>{
 const response=await workspace.GET(req(undefined,'sara'));assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 const data=await response.json();assert.equal(data.bookings.length,1);assert.equal(data.bookings[0].id,saraId);assert.equal(data.access.staffId,'sara');assert.ok(!JSON.stringify(data).includes('Nour client'));
 assert.equal((await workspace.POST(req({action:'status',id:nourId,status:'confirmed'},'sara'))).status,404);
 assert.equal((await workspace.POST(req({action:'status',id:saraId,status:'confirmed'},'sara'))).status,403);
 assert.equal((await workspace.POST(req(booking('sara',['gel'],900),'sara'))).status,403);
 for(const action of ['service','samples'])assert.equal((await workspace.POST(req({action},'sara'))).status,403);
 assert.equal((await team.GET(req(undefined,'sara'))).status,403);
 assert.equal((await workspace.POST(req({action:'status',id:saraId,status:'confirmed'},'reception'))).status,200);
 assert.equal((await workspace.POST(req({action:'status',id:saraId,status:'arrived'},'sara'))).status,200);
 assert.equal((await workspace.POST(req({action:'status',id:saraId,status:'completed'},'sara'))).status,200);
 assert.equal((await workspace.POST(req({action:'status',id:saraId,status:'arrived'},'sara'))).status,409);
});
test('first sign-in binds the approved email to one identity and revoke blocks the next request',async()=>{
 who.impersonator=['sara@test.local','another-user'];
 assert.equal((await workspace.GET(req(undefined,'impersonator'))).status,403);
 assert.equal(sqlite.prepare('SELECT user_id FROM desk_members WHERE email=?').get('sara@test.local').user_id,'sara-id');
 await grant(member('sara@test.local','Sara','specialist','sara',0));
 assert.equal((await workspace.GET(req(undefined,'sara'))).status,403);
 assert.equal((await workspace.POST(req({action:'initialize'},'sara'))).status,403);
 await grant(member('sara@test.local','Sara','specialist','sara',1));
 assert.equal((await workspace.GET(req(undefined,'sara'))).status,200);
 assert.equal((await workspace.GET(req(undefined,'impersonator'))).status,403);
});
test('role changes immediately narrow scope and grants cannot cross salon boundaries',async()=>{
 await grant(member('front@test.local','Reception','specialist','nour'));
 const d=await (await workspace.GET(req(undefined,'reception'))).json();assert.equal(d.access.role,'specialist');assert.ok(d.bookings.every(b=>b.staff==='nour'));assert.equal(d.bookings.length,1);
 globalThis.__deskEnv.MADONNA_WORKSPACE_ID='another-salon';assert.equal((await workspace.GET(req(undefined,'reception'))).status,403);globalThis.__deskEnv.MADONNA_WORKSPACE_ID='salon';
});
