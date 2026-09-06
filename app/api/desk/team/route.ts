import {database} from '@/db/store';
import {deskAccess,DeskAccessError} from '@/lib/desk-access';
import {isAdminEmail,workspaceId} from '@/lib/admin-access';
import {team} from '@/lib/model';
export const dynamic='force-dynamic';
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function members(){return (await database().prepare('SELECT email,name,role,staff_id AS staffId,active FROM desk_members WHERE owner=? ORDER BY active DESC,name').bind(workspaceId()).all()).results;}
export async function GET(r:Request){try{if((await deskAccess(r.headers)).role!=='manager')throw new DeskAccessError('إدارة حسابات الفريق متاحة للمدير فقط.');return respond({members:await members()});}catch(e){return respond({error:e instanceof DeskAccessError?e.message:'تعذّر تحميل حسابات الفريق.'},e instanceof DeskAccessError?e.status:503);}}
export async function POST(r:Request){try{
 if((await deskAccess(r.headers)).role!=='manager')throw new DeskAccessError('إدارة حسابات الفريق متاحة للمدير فقط.');
 if(r.headers.get('origin')&&r.headers.get('origin')!==new URL(r.url).origin)throw new DeskAccessError('الطلب غير مسموح.');
 if(!r.headers.get('content-type')?.startsWith('application/json'))return respond({error:'صيغة الطلب غير صالحة.'},415);
 const b=await r.json() as {email?:string;name?:string;role:string;active:number;staffId:string};
 if(!b||typeof b.email!=='string'||typeof b.name!=='string')return respond({error:'أضيفي الاسم والبريد الإلكتروني.'},400);
 const email=b.email.trim().toLowerCase(),name=b.name.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||name.length<2||name.length>80||!['reception','specialist'].includes(b.role)||![0,1].includes(b.active)||b.role==='specialist'&&!team.some(t=>t.id===b.staffId))return respond({error:'راجعي الاسم والبريد والصلاحية والأخصائية المرتبطة.'},400);
 if(isAdminEmail(email))return respond({error:'حساب المدير الأساسي محفوظ ولا يمكن تغييره هنا.'},409);
 await database().prepare('INSERT INTO desk_members (owner,email,name,role,staff_id,active,created) VALUES (?,?,?,?,?,?,?) ON CONFLICT(owner,email) DO UPDATE SET name=excluded.name,role=excluded.role,staff_id=excluded.staff_id,active=excluded.active').bind(workspaceId(),email,name,b.role,b.role==='specialist'?b.staffId:null,b.active,new Date().toISOString()).run();
 return respond({members:await members()});
 }catch(e){return respond({error:e instanceof DeskAccessError?e.message:'تعذّر حفظ صلاحية الموظفة.'},e instanceof DeskAccessError?e.status:503);}}
