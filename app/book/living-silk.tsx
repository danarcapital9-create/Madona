"use client";
import {useEffect,useState} from 'react';

/** Compositor light planes: no full-screen WebGL context or scroll render loop. */
export default function LivingSilk({motion,active}:{motion:boolean;active:boolean}){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{const update=()=>setVisible(document.visibilityState==='visible');update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return <div className="living-silk" data-moving={motion&&active&&visible} aria-hidden="true"><i className="silk-light silk-light-one"/><i className="silk-light silk-light-two"/><i className="silk-weave"/></div>;
}
