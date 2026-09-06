"use client";
import {useEffect,type RefObject} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export function useStudioMotion(root:RefObject<HTMLDivElement|null>,motion:boolean,active:boolean){
 useEffect(()=>{
  const node=root.current;if(!node||!motion||!active)return;
  gsap.registerPlugin(ScrollTrigger);
  const context=gsap.context(()=>{
   const mm=gsap.matchMedia();
   mm.add('(prefers-reduced-motion: no-preference)',()=>{
    gsap.fromTo('.signature-bridge-line',{y:32},{y:0,duration:1.2,ease:'power3.out',stagger:.12,scrollTrigger:{trigger:'.signature-bridge',start:'top 87%',toggleActions:'play none none reverse'}});
    gsap.fromTo('.studio-scroll-thread',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:'.signature-bridge',start:'top bottom',end:'bottom center',scrub:.7}});
    gsap.to('.studio-marquee-track',{xPercent:-12,ease:'none',scrollTrigger:{trigger:'.studio-marquee',start:'top bottom',end:'bottom top',scrub:1}});
    gsap.fromTo('.place-options>button',{y:24},{y:0,duration:.9,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.place-section',start:'top 82%'}});
    gsap.to('.closing-monogram',{yPercent:-7,rotation:-4,ease:'none',scrollTrigger:{trigger:'.closing-portrait',start:'top bottom',end:'bottom top',scrub:1}});
   });
  },node);
  return()=>context.revert();
 },[root,motion,active]);
}
