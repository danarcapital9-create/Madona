"use client";
import {useEffect,useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ArrowUpLeft,ArrowDown,Pause,Play} from 'lucide-react';
import SignatureStage from './signature-stage';
import './signature.css';

export default function SignatureHero({onBook,motion,onMotion,active}:{onBook:()=>void;motion:boolean;onMotion:()=>void;active:boolean}){
 const section=useRef<HTMLElement>(null),phase=useRef(0);
 useEffect(()=>{
  const node=section.current;if(!node)return;
  gsap.registerPlugin(ScrollTrigger);
  const context=gsap.context(()=>{
   const mm=gsap.matchMedia();
   mm.add('(prefers-reduced-motion: no-preference)',()=>{
    if(!motion||!active)return;
    const timeline=gsap.timeline({scrollTrigger:{trigger:node,start:'top top',end:'bottom bottom',scrub:.65,invalidateOnRefresh:true}});
    timeline.to(phase,{current:1,duration:1,ease:'none'},0)
     .to('.signature-halo',{rotation:-22,scale:1.08,duration:1,ease:'none'},0)
     .to('.signature-watermark',{xPercent:-7,duration:1,ease:'none'},0)
     .to('.signature-progress b',{scaleX:1,duration:1,ease:'none'},0)
     .to('.signature-stage-fallback',{rotationY:17,rotationZ:3,scale:1.035,duration:1,ease:'none'},0);
    return()=>{phase.current=0;};
   });
  },node);
  return()=>context.revert();
 },[motion,active]);
 return <section ref={section} className="signature-hero" aria-label="عالم مادونا">
  <div className="signature-pin">
   <span className="signature-watermark" aria-hidden="true">Madonna</span>
   <header className="signature-header">
    <a href="/" className="signature-logo"><img src="/brand/logo.png" alt="Madonna Beauty Lounge" width="1480" height="1357"/></a>
    <span className="signature-location" dir="ltr">BEAUTY LOUNGE · AMMAN</span>
    <a href="#rituals" className="signature-nav">اكتشفي العناية <ArrowDown size={16}/></a>
   </header>
   <div className="signature-copy"><span className="signature-kicker"><i/> THE ART OF BEING YOU</span><h1>الجمال،<br/><em>بطريقتكِ.</em></h1><p>لكِ وقتكِ. ولكل تفصيلة،<br className="signature-desktop-break"/> توقيع مادونا.</p></div>
   <div className="signature-visual">
    <div className="signature-halo" aria-hidden="true"><i/><b/><span/></div>
    <span className="signature-object-note" aria-hidden="true" dir="ltr">THE MADONNA SIGNATURE</span>
    <SignatureStage phaseRef={phase} motion={motion} active={active}/>
    <span className="signature-art-caption" aria-hidden="true">A little care. A lasting feeling.</span>
   </div>
   <div className="signature-actions"><button className="signature-book" onClick={onBook}><span>احجزي لحظتكِ</span><ArrowUpLeft size={22}/></button><a className="signature-explore" href="#rituals">طقوس العناية <ArrowDown size={16}/></a></div>
   <div className="signature-bottom"><button className="signature-motion" onClick={onMotion} aria-pressed={!motion} aria-label={motion?'إيقاف الحركة':'تشغيل الحركة'}>{motion?<Pause size={15}/>:<Play size={15}/>}<span>{motion?'إيقاف الحركة':'تشغيل الحركة'}</span></button><div className="signature-progress" aria-hidden="true"><span>01 / THE SIGNATURE</span><i><b/></i></div><span className="signature-motto" dir="ltr">Be Bold. Be Beautiful. Be Madonna.</span></div>
  </div>
 </section>;
}
