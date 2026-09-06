"use client";
import {useEffect,useState} from 'react';
import {Download,WifiOff,Share,PlusSquare,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function InstallDesk(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false),[open,setOpen]=useState(false),[online,setOnline]=useState(true);
 useEffect(()=>{
  const mode=window.matchMedia('(display-mode: standalone)');
  const update=()=>setInstalled(mode.matches||!!(navigator as Navigator & {standalone?:boolean}).standalone);
  const availability=()=>setOnline(navigator.onLine);
  const capture=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent);};
  const done=()=>{setInstalled(true);setPrompt(null);setOpen(false);};
  update();availability();mode.addEventListener('change',update);
  window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',done);window.addEventListener('online',availability);window.addEventListener('offline',availability);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/desk-sw.js',{scope:'/desk'}).catch(()=>{});
  return()=>{mode.removeEventListener('change',update);window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',done);window.removeEventListener('online',availability);window.removeEventListener('offline',availability);};
 },[]);
 async function install(){if(!prompt){setOpen(true);return;}await prompt.prompt();const result=await prompt.userChoice;setPrompt(null);if(result.outcome==='accepted')setInstalled(true);}
 return <>{!online&&<span className="desk-offline" role="status"><WifiOff size={15}/>غير متصل</span>}{!installed&&<button className="desk-install" onClick={()=>void install()}><Download size={16}/><span>تثبيت التطبيق</span></button>}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="desk-install-dialog" dir="rtl"><DialogTitle>Madonna، في تطبيقكِ</DialogTitle><DialogDescription>ثبّتي مساحة الإدارة لفتح الحجوزات مباشرة من شاشة جهازكِ.</DialogDescription><div className="desk-app-preview"><img src="/desk/icons/icon-192.png" alt="Madonna Desk"/><div><strong>Madonna Desk</strong><span>الحجوزات · العميلات · الفريق</span></div></div><div className="desk-install-step"><Share size={21}/><p><strong>على iPhone أو iPad</strong><span>افتحي هذا الرابط في Safari، ثم مشاركة ← إضافة إلى الشاشة الرئيسية.</span></p></div><div className="desk-install-step"><PlusSquare size={21}/><p><strong>على Android أو الكمبيوتر</strong><span>افتحي قائمة Chrome أو Edge واختاري «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» إذا كانت متاحة.</span></p></div><p className="desk-install-note"><Check size={16}/>يحتاج عرض أحدث الحجوزات إلى اتصال بالإنترنت.</p></DialogContent></Dialog></>;
}
