"use client";
import {useEffect,useRef,useState} from 'react';
import type {Object3D,Mesh,Material,Texture} from 'three';
import {RenderQuality} from './render-quality';
type Props={phase?:number;phaseRef?:{current:number};motion:boolean;active:boolean;compact?:boolean};

/** The approved contour, finished in Blender; draw only while the scene can be seen. */
export default function SignatureStage({phase=0,phaseRef,motion,active,compact=false}:Props){
 const host=useRef<HTMLDivElement>(null),wake=useRef<()=>void>(()=>{}),values=useRef({phase,phaseRef,motion,active});values.current={phase,phaseRef,motion,active};
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const node=host.current;if(!node)return;
  let disposed=false,raf=0,started=false,visible=false,focused=document.visibilityState==='visible',resume=()=>{};
  const releases:(()=>void)[]=[];const cleanup=()=>{while(releases.length){try{releases.pop()?.();}catch{}}};
  const start=()=>{if(visible&&values.current.active&&node.clientWidth&&node.clientHeight&&!started){started=true;void setup();}else resume();};
  wake.current=start;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{rootMargin:'0px'});observer.observe(node);
  const visibility=()=>{focused=document.visibilityState==='visible';resume();};document.addEventListener('visibilitychange',visibility);
  async function setup(){try{
   // WebGL is optional: the Cycles render remains visible when a browser disables it.
   const canvas=document.createElement('canvas');
   const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});if(!context)return;
   const [T,{GLTFLoader},{RoomEnvironment}]=await Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/environments/RoomEnvironment.js')]);if(disposed)return;
   const renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});releases.push(()=>renderer.dispose());
   renderer.setClearColor(0x023222,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
   node!.appendChild(canvas);releases.push(()=>canvas.remove());
   const max=Math.min(window.devicePixelRatio||1,window.matchMedia('(max-width:767px)').matches?1.8:2);
   const quality=new RenderQuality(max,Math.min(max,1.75));
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.1,40);camera.position.set(0,0,10);
   const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04,.1,100,{size:128});scene.environment=environment.texture;room.dispose();pmrem.dispose();releases.push(()=>environment.dispose());
   scene.add(new T.HemisphereLight(0xfff5e6,0x123d2b,1.25));
   const key=new T.DirectionalLight(0xfff2de,3.0);key.position.set(-3.5,4,5);scene.add(key);
   const edge=new T.DirectionalLight(0xf1ead2,2.1);edge.position.set(4,1,-.5);scene.add(edge);
   const fill=new T.DirectionalLight(0xe6efd9,.75);fill.position.set(1,-2,4);scene.add(fill);
   const root=new T.Group();scene.add(root);
   let boundsWidth=4.56,boundsHeight=4,baseScale=1,dirty=true,suspended=false,elapsed=0;
   let eased=values.current.phaseRef?.current??values.current.phase,mx=0,my=0,px=0,py=0,last=0,entrance=values.current.motion?0:1,loaded=false,announced=false;
   const permitted=()=>!disposed&&!suspended&&visible&&focused&&values.current.active;
   const schedule=()=>{if(!raf&&loaded&&permitted())raf=requestAnimationFrame(draw);};
   resume=()=>{cancelAnimationFrame(raf);raf=0;last=0;dirty=true;schedule();};
   const resize=()=>{const w=node!.clientWidth,h=node!.clientHeight;if(!w||!h)return;renderer.setPixelRatio(quality.ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.position.z;baseScale=Math.min(height*(compact?.78:.74)/boundsHeight,height*camera.aspect*(compact?.83:.80)/boundsWidth);dirty=true;schedule();};
   const ro=new ResizeObserver(resize);ro.observe(node!);releases.push(()=>ro.disconnect());resize();
   const pointer=(e:PointerEvent)=>{if(e.pointerType==='touch'||!values.current.motion)return;const rect=node!.getBoundingClientRect();mx=(e.clientX-rect.left)/rect.width-.5;my=(e.clientY-rect.top)/rect.height-.5;schedule();};
   const leave=()=>{mx=0;my=0;schedule();};node!.addEventListener('pointermove',pointer,{passive:true});node!.addEventListener('pointerleave',leave);releases.push(()=>{node!.removeEventListener('pointermove',pointer);node!.removeEventListener('pointerleave',leave);});
   const lost=(event:Event)=>{event.preventDefault();suspended=true;cancelAnimationFrame(raf);raf=0;setReady(false);cleanup();};canvas.addEventListener('webglcontextlost',lost);releases.push(()=>canvas.removeEventListener('webglcontextlost',lost));
   const abort=new AbortController();releases.push(()=>abort.abort());
   const disposeObject=(object:Object3D)=>{const geometries=new Set<import('three').BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>();object.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh){geometries.add(mesh.geometry);(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>{Object.values(m).forEach(v=>{if(v&&typeof v==='object'&&'isTexture' in v)textures.add(v as Texture);});m.dispose();});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());};
   const response=await fetch('/atelier/madonna-signature-studio.glb',{signal:abort.signal});if(!response.ok)throw Error('Signature unavailable');const bytes=await response.arrayBuffer();if(disposed||suspended)return;
   const gltf=await new GLTFLoader().parseAsync(bytes,'/atelier/');if(disposed||suspended){disposeObject(gltf.scene);return;}
   const model=gltf.scene;releases.push(()=>disposeObject(model));const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());model.position.sub(center);root.add(model);boundsWidth=size.x;boundsHeight=size.y;resize();
   model.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh)(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(mat=>{(mat as import('three').MeshStandardMaterial).envMapIntensity=.85;});});
   function compose(){
    const p=eased,reveal=p*p*(3-2*p),settle=1-Math.pow(1-entrance,3);
    root.rotation.set(.03-reveal*.11+py*.06,-.28+reveal*.78+px*.13-(1-settle)*.11,-.055+reveal*.13);
    root.position.set(Math.sin(p*Math.PI)*-.06,(1-settle)*-.14+(values.current.motion?Math.sin(elapsed*.65)*.025:0),0);root.scale.setScalar(baseScale*(.98+settle*.02+Math.sin(p*Math.PI)*.04));
    key.position.set(-3.5+reveal*7.5,4-reveal*2,5);edge.intensity=2.1+Math.sin(reveal*Math.PI)*.75;
   }
   let shaderError=false;renderer.debug.onShaderError=()=>{shaderError=true;};
   function draw(now:number){
    raf=0;if(!permitted())return;
    const v=values.current,dt=Math.min(now-last||16.7,50),target=v.phaseRef?.current??v.phase;
    if(v.motion&&last&&now-last<1000/60-.5){schedule();return;}
    if(last&&v.motion&&quality.sample(now-last))resize();last=now;
    const smooth=1-Math.exp(-dt/85);
    if(v.motion){elapsed+=dt*.001;eased+=(target-eased)*smooth;px+=(mx-px)*smooth;py+=(my-py)*smooth;entrance=Math.min(1,entrance+dt/800);}else{px=0;py=0;entrance=1;}
    if(dirty||v.motion){compose();renderer.render(scene,camera);dirty=false;if(shaderError){suspended=true;setReady(false);cleanup();return;}if(!announced){setReady(true);announced=true;}}
    if(v.motion)schedule();
   }
   loaded=true;resume();
  }catch{if(!disposed)setReady(false);cancelAnimationFrame(raf);raf=0;cleanup();}}
  return()=>{disposed=true;wake.current=()=>{};observer.disconnect();document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(raf);cleanup();};
 },[compact]);
 useEffect(()=>{wake.current();},[active,motion,phase]);
 return <div className={'signature-stage '+(ready?'is-ready':'')+(compact?' is-compact':'')} aria-hidden="true"><img className="signature-stage-fallback" src="/atelier/madonna-signature-hero.webp" alt="" width="1400" height="1400" fetchPriority={compact?'auto':'high'}/><div className="signature-stage-canvas" ref={host}/></div>;
}
