import {database} from '@/db/store';
import {isAdminEmail,workspaceId} from '@/lib/admin-access';
export type DeskRole='manager'|'reception'|'specialist';
export type DeskAccess={role:DeskRole;name:string;staffId:string|null;userId:string};
export type DeskMember={email:string;name:string;role:'reception'|'specialist';staffId:string|null;active:number};
export class DeskAccessError extends Error {constructor(message:string,public status=403){super(message);}}
export async function deskAccess(headers:Headers):Promise<DeskAccess>{
 const userId=headers.get('oai-authenticated-user-id'),email=headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
 if(!userId||!email)throw new DeskAccessError('سجّلي الدخول بحساب الفريق للمتابعة.',401);
 if(!workspaceId())throw new DeskAccessError('مساحة الفريق قيد الإعداد.',503);
 if(isAdminEmail(email))return {role:'manager',name:'إدارة مادونا',staffId:null,userId};
 const db=database();
 // An explicitly approved email binds to its first platform identity. A different
 // identity cannot inherit access merely by presenting the same email later.
 await db.prepare('UPDATE desk_members SET user_id=? WHERE owner=? AND email=? AND active=1 AND user_id IS NULL').bind(userId,workspaceId(),email).run();
 const member=await db.prepare('SELECT name,role,staff_id FROM desk_members WHERE owner=? AND email=? AND active=1 AND user_id=?').bind(workspaceId(),email,userId).first<{name:string;role:DeskRole;staff_id:string|null}>();
 if(!member||!['reception','specialist'].includes(member.role)||member.role==='specialist'&&!member.staff_id)throw new DeskAccessError('هذا الحساب غير مخوّل للدخول إلى تطبيق الفريق.');
 return {name:member.name,role:member.role,staffId:member.staff_id,userId};
}
