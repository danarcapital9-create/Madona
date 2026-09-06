import {env} from 'cloudflare:workers';
// Forwarded identity headers are verified by Sites, never supplied by the app.
export function isAdminEmail(email:string|null|undefined){const configured=(env as unknown as Record<string,string>).MADONNA_ADMIN_EMAIL;return !!email&&!!configured&&email.trim().toLowerCase()===configured.trim().toLowerCase();}
export function workspaceId(){return (env as unknown as Record<string,string>).MADONNA_WORKSPACE_ID||'';}
