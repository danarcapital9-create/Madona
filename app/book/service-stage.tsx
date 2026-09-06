"use client";
import {useEffect,useRef,useState} from 'react';
import {gsap} from 'gsap';
import {ArrowLeft,ArrowRight,ArrowUpLeft,LoaderCircle} from 'lucide-react';
import {rituals} from './rituals';
const wrap=(n:number)=>((n+2.5)%5+5)%5-2.5;

/** Real photographs on compositor 3D planes; selection never allocates a GPU texture. */
export default function ServiceStage({selected,motion,active,onSelect,onBook}:{selected:string;motion:boolean;active:boolean;onSelect:(id:string)=>void;onBook:(id:string)=>void}){
 const container=useRef<HTMLDivElement>(null),gesture=useRef<{x:number;y:number}|null>(null);
 const [shown,setShown]=useState(selected),[loading,setLoading]=useState(false);
 const index=Math.max(0,rituals.findIndex(r=>r.id===selected)),shownIndex=Math.max(0,rituals.findIndex(r=>r.id===shown));
 const first=useRef(true),initialIndex=useRef(shownIndex),skipClick=useRef(false);
 useEffect(()=>{
  let canceled=false;const image=new Image();image.src=rituals[index].image;setLoading(true);
  const ready=()=>{if(!canceled){setShown(selected);setLoading(false);}};
  image.decode().then(ready,ready);
  return()=>{canceled=true;};
 },[selected,index]);
 useEffect(()=>{
  const node=container.current;if(!node)return;
  const animate=!first.current&&motion&&active&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;first.current=false;
  const tweens:gsap.core.Tween[]=[];
  node.querySelectorAll<HTMLElement>('.service-photo-card').forEach((card,i)=>{
    const distance=wrap(i-shownIndex),away=Math.abs(distance),front=away<.5;
    const pose={x:0,y:0,yPercent:0,xPercent:distance*77,rotationY:distance*-15,rotationZ:distance*3.6,scale:front?1:.82,opacity:front?1:away>1.2?0:.28,z:front?0:-80,zIndex:front?3:1,duration:animate?.66:0,ease:'power3.out',overwrite:true};
    tweens.push(gsap.to(card,pose));
  });
  return()=>tweens.forEach(tween=>tween.kill());
 },[shownIndex,motion,active]);
 const changing=loading||selected!==shown;
 const relative=(n:number)=>onSelect(rituals[(index+n+5)%5].id);
 return <div ref={container} className="service-stage studio-photo-stage" aria-busy={changing} onPointerDown={e=>{if(e.pointerType==='touch'){skipClick.current=false;gesture.current={x:e.clientX,y:e.clientY};}}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)>55&&Math.abs(x)>Math.abs(y)*1.3){skipClick.current=true;relative(x<0?1:-1);}}} onPointerCancel={()=>{gesture.current=null;}}>
  <div className="service-photo-deck">{rituals.map((r,i)=>{
   const front=i===shownIndex,distance=wrap(i-shownIndex);
   return <button key={r.id} className="service-photo-card" aria-label={(front?'احجزي ':'عرض ')+r.title} disabled={front&&changing} tabIndex={front?0:-1} aria-hidden={Math.abs(distance)>1.2} onClick={()=>{if(skipClick.current){skipClick.current=false;return;}front?onBook(r.id):onSelect(r.id);}} style={{opacity:i===initialIndex.current?1:0}}>
    <img src={r.image} alt={r.alt} loading={Math.abs(distance)<=1?'eager':'lazy'} decoding="async" width="1067" height="1600" style={{objectPosition:r.position}} draggable={false}/>
    <span className="service-photo-edge" aria-hidden="true"/>
    <span className="service-photo-invite" aria-hidden="true">{front&&changing?<LoaderCircle size={20} className={motion?'spin':''}/>:<ArrowUpLeft size={22}/>}</span>
   </button>;
  })}</div>
  <div className="service-stage-navigation" dir="ltr"><button onClick={()=>relative(-1)} aria-label="صورة الخدمة السابقة"><ArrowLeft size={20}/></button><div aria-hidden="true">{rituals.map((r,i)=><i key={r.id} className={i===index?'active':''}/>)}</div><button onClick={()=>relative(1)} aria-label="صورة الخدمة التالية"><ArrowRight size={20}/></button></div>
 </div>;
}
