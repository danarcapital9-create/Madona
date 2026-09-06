"use client";
import {useState} from 'react';
import {ArrowUpLeft,ArrowDown,ArrowLeft,Pause,Play,MapPin,ArrowRight,Plus} from 'lucide-react';
import SignatureHero from './signature-hero';
import LivingSilk from './living-silk';
import './immersive.css';
import type {Service} from '@/lib/model';
import {rituals} from './rituals';
import ServiceStage from './service-stage';
export default function MadonnaJourney({onBook,motion,onMotion,bookingOpen,services}:{onBook:(category?:string,mode?:string)=>void;motion:boolean;onMotion:()=>void;bookingOpen:boolean;services:Service[]}){
 const [ritual,setRitual]=useState<string>('nails');const current=rituals.find(r=>r.id===ritual)!;
 return <div className={'madonna-journey '+(!motion?'motion-paused':'')+ (bookingOpen?' journey-covered':'')}><LivingSilk motion={motion} active={!bookingOpen}/><SignatureHero onBook={()=>onBook()} motion={motion} onMotion={onMotion} active={!bookingOpen}/>
 <section id="rituals" className="ritual-gallery ritual-gallery-spatial" aria-label="طقوس العناية في مادونا">
 <div className="ritual-visual"><h2 className="ritual-mobile-heading">العناية، على ذوقكِ.</h2>
 <div className="ritual-overline"><span>MADONNA RITUALS</span><span>{String(rituals.findIndex(r=>r.id===ritual)+1).padStart(2,'0')} / 05</span></div>
 <ServiceStage selected={ritual} motion={motion} active={!bookingOpen} onSelect={setRitual}/>
 <div className="ritual-caption-wrap"><span className="ritual-photo-label">{current.en}</span><p className="ritual-visual-caption" key={ritual} aria-live="polite">{current.ar}</p></div>
 <div className="ritual-mobile-tabs" role="group" aria-label="اختيار العناية">{rituals.map(r=><button key={r.id} onClick={()=>setRitual(r.id)} aria-pressed={r.id===ritual}>{r.short}</button>)}</div>
 </div>
 <div className="ritual-selector"><span className="atelier-kicker">A RITUAL OF YOUR OWN</span><h2>تفاصيل صغيرة.<br/><em>أثرٌ يرافقكِ.</em></h2><p className="ritual-intro">اختاري ما يشبه يومكِ.</p><div className="ritual-list" role="group" aria-label="أنواع العناية">{rituals.map((r,i)=><div className={'ritual-row '+(r.id===ritual?'active':'')} key={r.id}><button className="ritual-preview" onClick={()=>setRitual(r.id)} aria-pressed={r.id===ritual} aria-label={'عرض '+r.title}><span className="ritual-index">0{i+1}</span><span className="ritual-titles"><strong>{r.en}</strong><small>{r.title}</small></span></button><button className="ritual-action" onClick={()=>onBook(r.id)} aria-label={'احجزي '+r.title}><ArrowUpLeft size={22}/></button></div>)}</div><div className="ritual-selection-note"><p>{current.note}</p><span>{services.filter(s=>s.category===ritual&&s.active).length||'—'} خدمات</span></div><button className="atelier-button" onClick={()=>onBook(ritual)}>اختاري {current.title} <ArrowUpLeft size={20}/></button><p className="ritual-image-credit">صور فوتوغرافية تمثيلية للخدمات</p></div></section>
 <section className="place-section"><div className="place-word" aria-hidden="true">Your place.</div><div className="place-heading"><span className="atelier-kicker">SAME CARE. YOUR WORLD.</span><h2>مادونا،<br/><em>حيث تكونين.</em></h2><p>في مساحتنا، أو في راحة منزلكِ.<br/>اختاري المكان الذي يشبه مزاجكِ.</p></div><div className="place-options"><button onClick={()=>onBook(undefined,'lounge')}><span className="place-number">01</span><div><span className="place-en">At the lounge</span><strong>في اللاونج</strong><small>وقتٌ لكِ في مادونا · عمّان</small></div><ArrowUpLeft size={27}/></button><button onClick={()=>onBook(undefined,'home')}><span className="place-number">02</span><div><span className="place-en">At your home</span><strong>في منزلكِ</strong><small>عناية تصل إلى مساحتكِ الخاصة</small></div><ArrowUpLeft size={27}/></button></div></section>
 <section className="closing-portrait"><img className="closing-monogram" src="/brand/logo.png" alt="" loading="lazy" aria-hidden="true"/><div><span className="atelier-kicker">A MOMENT, BEAUTIFULLY YOURS.</span><h2>Be Bold.<br/>Be Beautiful.<br/><em>Be Madonna.</em></h2><button className="atelier-button" onClick={()=>onBook()}>هذه لحظتكِ <ArrowUpLeft size={19}/></button></div><span className="portrait-footnote">BEAUTY LOUNGE — AMMAN</span></section>
 <footer className="atelier-footer"><a href="/book" className="footer-signature">Madonna</a><div><span>BE BOLD. BE BEAUTIFUL. BE MADONNA.</span><small>نسخة عرض خاصة · الخدمات والأسعار والفريق توضيحيون</small></div><a href="https://www.instagram.com/madonna.blc/" target="_blank" rel="noreferrer">من عالم مادونا <ArrowUpLeft size={16}/></a></footer></div>
}
