"use client";
import {useEffect,useRef} from 'react';
import {ArrowUpLeft,ArrowDown,Pause,Play} from 'lucide-react';
import SignatureStage from './signature-stage';
import './signature.css';
export default function SignatureHero({onBook,motion,onMotion,active}:{onBook:()=>void;motion:boolean;onMotion:()=>void;active:boolean}){
 const section=useRef<HTMLElement>(null),phase=useRef(0);
 useEffect(()=>{
  const node=section.current;if(!node)return;let raf=0,previous=-1;
  const pin=node.querySelector<HTMLElement>('.signature-pin');
  const stories=node.querySelectorAll<HTMLElement>('.signature-story'),chapter=node.querySelector<HTMLElement>('.signature-chapter');
  const read=()=>{raf=0;const rect=node.getBoundingClientRect(),range=rect.height-(pin?.clientHeight||window.innerHeight);
   const p=range>80?Math.max(0,Math.min(1,-rect.top/range)):0;phase.current=p;node.style.setProperty('--signature-phase',String(p));
   const next=p>.56?1:0;if(next!==previous){stories.forEach((story,i)=>{story.inert=i!==next;story.setAttribute('aria-hidden',String(i!==next));});if(chapter)chapter.textContent=next?'02 / YOUR SIGNATURE':'01 / MADONNA';previous=next;}
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(read);};window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);const preference=window.matchMedia('(prefers-reduced-motion: reduce)');preference.addEventListener('change',schedule);read();
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);preference.removeEventListener('change',schedule);};
 },[]);
 return <section ref={section} className="signature-hero" aria-label="عالم مادونا"><div className="signature-pin"><span className="signature-watermark" aria-hidden="true">Madonna</span>
  <header className="signature-header"><a href="/" className="signature-logo"><img src="/brand/logo.png" alt="Madonna Beauty Lounge" width="1480" height="1357"/></a><span className="signature-location" dir="ltr">BEAUTY LOUNGE · AMMAN</span><a href="#rituals" className="signature-nav">اكتشفي العناية <ArrowDown size={16}/></a></header>
  <div className="signature-copy"><div className="signature-story"><span className="signature-kicker">THE ART OF BEING YOU</span><h1>الجمال،<br/><em>بطريقتكِ.</em></h1><p>لكِ وقتكِ. ولكل تفصيلة، توقيع مادونا.</p></div><div className="signature-story" inert aria-hidden="true"><span className="signature-kicker">A SIGNATURE, ALL YOUR OWN</span><h2>تفاصيلكِ،<br/><em>تصنع الفرق.</em></h2><p>عناية تشبهكِ، من أول لمسة.</p></div></div>
  <div className="signature-visual"><SignatureStage phaseRef={phase} motion={motion} active={active}/><span className="signature-art-caption" aria-hidden="true">Be Bold. Be Beautiful. Be Madonna.</span></div>
  <div className="signature-actions"><button className="signature-book" onClick={onBook}>احجزي لحظتكِ <ArrowUpLeft size={22}/></button><a className="signature-explore" href="#rituals">طقوس العناية <ArrowDown size={16}/></a></div>
  <div className="signature-bottom"><button className="signature-motion" onClick={onMotion} aria-pressed={!motion} aria-label={motion?'إيقاف الحركة':'تشغيل الحركة'}>{motion?<Pause size={15}/>:<Play size={15}/>}<span>{motion?'إيقاف الحركة':'تشغيل الحركة'}</span></button><div className="signature-progress" aria-hidden="true"><span className="signature-chapter">01 / MADONNA</span><i><b/></i></div><span className="signature-motto" dir="ltr">Be Bold. Be Beautiful. Be Madonna.</span></div>
 </div></section>;
}
