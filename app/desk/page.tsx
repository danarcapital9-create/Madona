import type {Metadata,Viewport} from 'next';
import {requireChatGPTUser} from '../chatgpt-auth';
import {headers} from 'next/headers';
import {deskAccess} from '@/lib/desk-access';
import Lounge from '../lounge';
import '../madonna-admin.css';
import './desk.css';
import './control.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Madonna Desk | تطبيق الفريق',manifest:'/desk/manifest.webmanifest',appleWebApp:{capable:true,title:'Madonna Desk',statusBarStyle:'default'},icons:{apple:'/desk/icons/apple-touch-icon.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#023222'};
export default async function Desk(){await requireChatGPTUser('/desk');const access=await deskAccess(new Headers(await headers())).catch(()=>null);if(!access)return <main className="desk-access"><img src="/brand/logo.png" alt="Madonna"/><h1>مساحة خاصة بالفريق</h1><p>هذا الحساب غير مخوّل للدخول إلى الإدارة.</p><a href="/">العودة إلى مادونا</a></main>;return <Lounge access={access}/>;}
