"use client";
import {useEffect,useState} from 'react';
import {rituals} from './rituals';

const focus:Record<string,string>={nails:'55% 57%',lashes:'50% 58%',makeup:'50% 35%',hair:'50% 50%',care:'50% 40%'};
/** Keep the previous photograph visible until the requested image has decoded. */
export default function BookingGallery({category,motion,compact=false}:{category:string;motion:boolean;compact?:boolean}){
 const requested=rituals.find(r=>r.id===category)||rituals[0];
 const [displayed,setDisplayed]=useState<string>(requested.id),[loaded,setLoaded]=useState<Record<string,boolean>>({});
 const current=rituals.find(r=>r.id===displayed)||requested;
 useEffect(()=>{if(loaded[requested.id])setDisplayed(requested.id);},[requested.id,loaded]);
 return <div className={'booking-gallery '+(compact?'booking-gallery-compact ':'')+(!motion?'gallery-still':'')}>
  <div className="booking-photo-stack" aria-hidden="true">{rituals.map(r=><img key={r.id} className={displayed===r.id&&loaded[r.id]?'is-visible':''} src={r.image} alt="" decoding="async" loading="eager" width={r.id==='nails'?1100:r.id==='care'?1068:1067} height={r.id==='nails'?1375:1600} style={{objectPosition:focus[r.id]}} onLoad={async e=>{const img=e.currentTarget;try{await img.decode();}catch{}setLoaded(v=>v[r.id]?v:{...v,[r.id]:true});}}/>)}</div>
  <div className="booking-photo-shade" aria-hidden="true"/>
  <span className="booking-photo-overline" dir="ltr">THE MADONNA RITUAL</span>
  <div className="booking-photo-copy"><span className="booking-photo-name" dir="ltr">{current.en}</span><p>{current.ar}</p></div>
  <div className="booking-photo-footer"><span>صورة تمثيلية للعناية</span><div aria-hidden="true">{rituals.map(r=><i key={r.id} className={displayed===r.id?'active':''}/>)}</div></div>
 </div>;
}
