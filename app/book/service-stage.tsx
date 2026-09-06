"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {rituals} from './rituals';
import {RenderQuality} from './render-quality';


export default function ServiceStage({selected,motion,active,onSelect}:{selected:string;motion:boolean;active:boolean;onSelect:(id:string)=>void}){
 const container=useRef<HTMLDivElement>(null),canvasHost=useRef<HTMLDivElement>(null);
 const current=useRef({selected,motion,active});current.current={selected,motion,active};
 const [ready,setReady]=useState(false);
 const chosen=rituals.find(r=>r.id===selected)||rituals[0];
 const index=rituals.findIndex(r=>r.id===chosen.id);
 const gesture=useRef<{x:number;y:number}|null>(null);
 const selectRelative=(direction:number)=>onSelect(rituals[(index+direction+rituals.length)%rituals.length].id);
 useEffect(()=>{
  const node=canvasHost.current,region=container.current;if(!node||!region)return;
  let disposed=false,aborted=false,started=false,visible=false,raf=0;
  let cleanup:()=>void=()=>{};
  const near=new IntersectionObserver(entries=>{
   const inRange=entries[0].isIntersecting;
   if(inRange&&!started){started=true;void setup();}
  },{rootMargin:'200px'});near.observe(region);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'0px'});visibilityObserver.observe(region);
  async function setup(){
   const releases:(()=>void)[]=[];
   cleanup=()=>{while(releases.length){try{releases.pop()?.();}catch{}}};
   try{
    const T=await import('three');if(disposed)return;
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
    if(!context)return;
    const renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});
    releases.push(()=>renderer.dispose());node!.appendChild(canvas);releases.push(()=>canvas.remove());
    const quality=new RenderQuality(Math.min(window.devicePixelRatio||1,window.innerWidth<768?1.75:2),1.5,true);
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x023222,0);
    const lost=(e:Event)=>{e.preventDefault();aborted=true;setReady(false);cancelAnimationFrame(raf);cleanup();};canvas.addEventListener('webglcontextlost',lost);releases.push(()=>canvas.removeEventListener('webglcontextlost',lost));
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,40);camera.position.z=8.4;

    const album=new T.Group();scene.add(album);
    const images=await Promise.all(rituals.map(async ritual=>{
     const texture=await new T.TextureLoader().loadAsync(ritual.image);
     if(disposed||aborted){texture.dispose();return null;}
     texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
     const image=texture.image as {width:number;height:number};
     const ratio=image.width/image.height,target=2.72/3.74;const focal=ritual.position.split(' ').map(v=>Math.max(0,Math.min(1,parseFloat(v)/100)));
     if(ratio>target){texture.repeat.x=target/ratio;texture.offset.x=(1-texture.repeat.x)*(focal[0]??.5);}
     else{texture.repeat.y=ratio/target;texture.offset.y=(1-texture.repeat.y)*(1-(focal[1]??.5));}
     releases.push(()=>texture.dispose());return texture;
    }));
    if(disposed||aborted){cleanup();return;}
    // Upload every card before enabling selection; hidden cards otherwise stall on their first reveal.
    for(const texture of images){if(disposed||aborted){cleanup();return;}if(texture)renderer.initTexture(texture);await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));}
    if(disposed||aborted){cleanup();return;}
    const cards=images.map((texture,i)=>{
     if(!texture)throw Error('Image unavailable');
     const group=new T.Group();album.add(group);
     const geometry=new T.PlaneGeometry(2.72,3.74,24,16);
     const borderGeometry=new T.PlaneGeometry(2.755,3.775,24,16);
     const bend={value:0},time={value:0};
     const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,transparent:true,toneMapped:false});
     const borderMaterial=new T.MeshBasicMaterial({color:0xe5d5b9,side:T.DoubleSide,transparent:true,toneMapped:false});
     for(const mat of [material,borderMaterial]){
      mat.forceSinglePass=true;
      mat.onBeforeCompile=shader=>{
       shader.uniforms.uCurve=bend;shader.uniforms.uFlow=time;
       shader.vertexShader='uniform float uCurve; uniform float uFlow;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += (1.0 - cos(position.x * 1.12)) * uCurve; transformed.z += sin(position.y * 1.35 + uFlow) * .013;');
      };
      mat.customProgramCacheKey=()=> 'madonna-photographic-surface-v1';
     }
     const photo=new T.Mesh(geometry,material),border=new T.Mesh(borderGeometry,borderMaterial);border.position.z=-.009;
     group.add(border,photo);
     releases.push(()=>{geometry.dispose();borderGeometry.dispose();material.dispose();borderMaterial.dispose();});
     return {group,material,borderMaterial,bend,time,index:i};
    });
    let last=0,lastRaf=0,elapsed=0,target=rituals.findIndex(r=>r.id===current.current.selected),position=target;
    let selectedId=current.current.selected,px=0,py=0,mx=0,my=0,scroll=0,dirtyViewport=true,focused=document.visibilityState==='visible',needsRender=true;
    let lastMotion=current.current.motion,small=false;
    const wrap=(value:number)=>((value+rituals.length/2)%rituals.length+rituals.length)%rituals.length-rituals.length/2;
    const resize=()=>{
     const w=node!.clientWidth,h=node!.clientHeight;if(!w||!h)return;
     small=window.innerWidth<768;
     renderer.setPixelRatio(quality.ratio);renderer.setSize(w,h,false);
     camera.aspect=w/h;camera.updateProjectionMatrix();
     const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.position.z;
     album.scale.setScalar(Math.min(height*(small?.88:.70)/3.74,height*camera.aspect*(small?.76:.70)/2.72));
     needsRender=true;dirtyViewport=true;
    };
    const ro=new ResizeObserver(resize);ro.observe(node!);releases.push(()=>ro.disconnect());resize();
    const pointer=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const rect=region!.getBoundingClientRect();mx=(e.clientX-rect.left)/rect.width-.5;my=(e.clientY-rect.top)/rect.height-.5;};
    const leave=()=>{mx=0;my=0;};
    region!.addEventListener('pointermove',pointer,{passive:true});region!.addEventListener('pointerleave',leave);
    releases.push(()=>{region!.removeEventListener('pointermove',pointer);region!.removeEventListener('pointerleave',leave);});
    const onScroll=()=>{dirtyViewport=true;};window.addEventListener('scroll',onScroll,{passive:true});releases.push(()=>window.removeEventListener('scroll',onScroll));
    const visibility=()=>{focused=document.visibilityState==='visible';dirtyViewport=true;needsRender=true;};document.addEventListener('visibilitychange',visibility);releases.push(()=>document.removeEventListener('visibilitychange',visibility));

    let shaderError=false;renderer.debug.onShaderError=()=>{shaderError=true;};
    function compose(){
     for(const card of cards){
      const distance=wrap(card.index-position),away=Math.min(1,Math.abs(distance));
      card.group.visible=Math.abs(distance)<(small?1.3:1.85);
      card.group.position.set(distance*(small?3.48:2.98),-away*(small?.04:.14),-Math.abs(distance)*(small?2.0:1.45));
      card.group.rotation.set(py*.07,-distance*.38+px*.10,-.025+distance*.038);
      card.group.scale.setScalar(1-away*.05);
      card.bend.value=.045+away*.17;card.time.value=current.current.motion?elapsed*.35:0;
      card.material.opacity=1-away*.52;card.material.color.setScalar(1-away*.36);
      card.borderMaterial.opacity=.85-away*.64;
     }
     album.position.y=current.current.motion?scroll*.17+Math.sin(elapsed*.45)*.022:0;
     album.rotation.y=current.current.motion?px*.055:0;

    }
    compose();renderer.render(scene,camera);if(shaderError)throw Error('Photo shader unavailable');setReady(true);
    function draw(timestamp:number){
     if(disposed||aborted)return;raf=requestAnimationFrame(draw);
     if(!visible||!focused||!current.current.active){last=timestamp;lastRaf=timestamp;return;}
     const state=current.current;const cadence=lastRaf?timestamp-lastRaf:16.7;lastRaf=timestamp;
     if(selectedId!==state.selected){selectedId=state.selected;target+=wrap(rituals.findIndex(r=>r.id===selectedId)-target);needsRender=true;}
     if(lastMotion!==state.motion){lastMotion=state.motion;needsRender=true;}
     if(!state.motion&&!needsRender){last=timestamp;return;}
     const interacting=needsRender||dirtyViewport||Math.abs(target-position)>.001||Math.abs(mx-px)>.001||Math.abs(my-py)>.001;
     if(!interacting){last=timestamp;return;}const dt=timestamp-last;last=timestamp;
     if(interacting&&quality.sample(cadence))resize();
     if(dirtyViewport){const rect=region!.getBoundingClientRect();scroll=Math.max(-1,Math.min(1,(window.innerHeight*.5-rect.top-rect.height*.5)/window.innerHeight));dirtyViewport=false;}
     const smooth=1-Math.exp(-Math.min(dt,60)/115);
     if(state.motion){elapsed+=Math.min(dt,50)*.001;position+=(target-position)*smooth;px+=(mx-px)*smooth;py+=(my-py)*smooth;}
     else{position=target;px=0;py=0;}
     compose();renderer.render(scene,camera);needsRender=false;
    }
    raf=requestAnimationFrame(draw);
   }catch{
    aborted=true;cleanup();if(!disposed)setReady(false);
   }
  }
  return()=>{disposed=true;near.disconnect();visibilityObserver.disconnect();cancelAnimationFrame(raf);cleanup();};
 },[]);
 return <div ref={container} className={'service-stage '+(ready?'is-ready':'')} onPointerDown={e=>{if(e.pointerType==='touch')gesture.current={x:e.clientX,y:e.clientY};}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(!start)return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)>55&&Math.abs(x)>Math.abs(y)*1.3)selectRelative(x<0?1:-1);}} onPointerCancel={()=>{gesture.current=null;}}>
  <img className="service-stage-fallback" src={chosen.image} alt={chosen.alt} style={{objectPosition:chosen.position}} loading="lazy" width={1000} height={1375}/>
  <div ref={canvasHost} className="service-stage-canvas" aria-hidden="true"/>
  <div className="service-stage-navigation" dir="ltr"><button onClick={()=>selectRelative(-1)} aria-label="صورة الخدمة السابقة"><ArrowLeft size={19}/></button><div aria-hidden="true">{rituals.map(r=><i key={r.id} className={r.id===selected?'active':''}/>)}</div><button onClick={()=>selectRelative(1)} aria-label="صورة الخدمة التالية"><ArrowRight size={19}/></button></div>
 </div>
}
