"use client";
import {useEffect,useRef,useState} from 'react';
import type {Object3D,Mesh,Material} from 'three';
import {RenderQuality} from './render-quality';
type Props={phase?:number;phaseRef?:{current:number};motion:boolean;active:boolean;compact?:boolean};
/** The actual Madonna monogram, with a scroll-driven studio-light reveal. */
export default function SignatureStage({phase=0,phaseRef,motion,active,compact=false}:Props){
 const host=useRef<HTMLDivElement>(null),values=useRef({phase,phaseRef,motion,active});values.current={phase,phaseRef,motion,active};
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const node=host.current;if(!node)return;let disposed=false,raf=0,started=false,visible=false,focused=document.visibilityState==='visible';
  const releases:(()=>void)[]=[];const cleanup=()=>{while(releases.length){try{releases.pop()?.();}catch{}}};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&node.clientWidth&&node.clientHeight&&!started){started=true;void setup();}},{rootMargin:'0px'});observer.observe(node);
  const visibility=()=>{focused=document.visibilityState==='visible';};document.addEventListener('visibilitychange',visibility);
  async function setup(){try{
   const [T,{GLTFLoader},{RoomEnvironment}]=await Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/environments/RoomEnvironment.js')]);if(disposed)return;
   const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'default'});releases.push(()=>renderer.dispose());
   renderer.setClearColor(0x023222,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
   const canvas=renderer.domElement;node!.appendChild(canvas);releases.push(()=>canvas.remove());
   const quality=new RenderQuality(Math.min(window.devicePixelRatio||1,2.25),Math.min(window.devicePixelRatio||1,1.75),true);
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.1,40);camera.position.set(0,0,10);
   const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04,.1,100,{size:128});scene.environment=environment.texture;room.dispose();pmrem.dispose();releases.push(()=>environment.dispose());
   scene.add(new T.HemisphereLight(0xfff5e6,0x17432e,1.05));
   const key=new T.DirectionalLight(0xfff2de,3.2);key.position.set(-3.5,4,5);scene.add(key);
   const edge=new T.DirectionalLight(0xe5f2de,2.6);edge.position.set(4,1,-.5);scene.add(edge);
   const fill=new T.DirectionalLight(0xffdfac,.85);fill.position.set(0,-2,3);scene.add(fill);
   const root=new T.Group();scene.add(root);
   const orbit=new T.Group();scene.add(orbit);orbit.visible=!compact;
   // A twisting satin loop provides spatial depth around the original, unaltered mark.
   const ribbonGeometry=new T.BufferGeometry(),vertices:number[]=[],indices:number[]=[];
   for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;for(let j=0;j<=6;j++){const v=(j/6-.5)*(.22+.13*Math.sin(a*2+.4));const radius=2.7+Math.cos(a*2)*.15+v*Math.cos(a*1.5);vertices.push(Math.cos(a)*radius,Math.sin(a)*radius*.80,v*Math.sin(a*1.5)+Math.sin(a*2)*.20);if(i<180&&j<6){const k=i*7+j;indices.push(k,k+7,k+1,k+1,k+7,k+8);}}}
   ribbonGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));ribbonGeometry.setIndex(indices);ribbonGeometry.computeVertexNormals();
   const ribbonMaterial=new T.MeshStandardMaterial({color:0x376f50,metalness:.72,roughness:.29,side:T.DoubleSide});
   orbit.add(new T.Mesh(ribbonGeometry,ribbonMaterial));releases.push(()=>{ribbonGeometry.dispose();ribbonMaterial.dispose();});
   let boundsWidth=4,boundsHeight=4,baseScale=1,dirty=true,suspended=false;
   let elapsed=0;let eased=values.current.phaseRef?.current??values.current.phase,mx=0,my=0,px=0,py=0,last=0,lastRaf=0,entrance=0,lastMotion=values.current.motion;
   const resize=()=>{const w=node!.clientWidth,h=node!.clientHeight;if(!w||!h)return;renderer.setPixelRatio(quality.ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.position.z;baseScale=Math.min(height*(compact?.77:.59)/boundsHeight,height*camera.aspect*(compact?.83:.65)/boundsWidth);dirty=true;};
   const ro=new ResizeObserver(resize);ro.observe(node!);releases.push(()=>ro.disconnect());resize();
   const pointer=(e:PointerEvent)=>{if(e.pointerType==='touch')return;const rect=node!.getBoundingClientRect();mx=(e.clientX-rect.left)/rect.width-.5;my=(e.clientY-rect.top)/rect.height-.5;};
   const leave=()=>{mx=0;my=0;};node!.addEventListener('pointermove',pointer,{passive:true});node!.addEventListener('pointerleave',leave);releases.push(()=>{node!.removeEventListener('pointermove',pointer);node!.removeEventListener('pointerleave',leave);});
   const lost=(e:Event)=>{e.preventDefault();suspended=true;cancelAnimationFrame(raf);setReady(false);cleanup();};canvas.addEventListener('webglcontextlost',lost);releases.push(()=>canvas.removeEventListener('webglcontextlost',lost));
   const abort=new AbortController();releases.push(()=>abort.abort());
   const disposeObject=(object:Object3D)=>{const geometries=new Set<import('three').BufferGeometry>(),materials=new Set<Material>();object.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh){geometries.add(mesh.geometry);(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());};
   const response=await fetch('/atelier/madonna-signature.glb',{signal:abort.signal});if(!response.ok)throw Error('Signature unavailable');const bytes=await response.arrayBuffer();if(disposed||suspended)return;
   const gltf=await new GLTFLoader().parseAsync(bytes,'/atelier/');if(disposed||suspended){disposeObject(gltf.scene);return;}
   const model=gltf.scene;releases.push(()=>disposeObject(model));
   const box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());model.position.sub(center);root.add(model);boundsWidth=size.x;boundsHeight=size.y;resize();
   model.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh){mesh.frustumCulled=false;(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(mat=>{const material=mat as import('three').MeshStandardMaterial;material.envMapIntensity=1.15;material.roughness=.32;material.metalness=.28;});}});
   function compose(){
    const p=eased,settle=1-Math.pow(1-entrance,3),reveal=p*p*(3-2*p);
    root.rotation.set(.10-reveal*.16+py*.075,-.42+reveal*.64+px*.18-(1-settle)*.14,-.065+reveal*.10);
    root.position.set(0,(1-settle)*-.12+Math.sin(p*Math.PI)*.05+(values.current.motion?Math.sin(elapsed*.55)*.035:0),0);root.scale.setScalar(baseScale*(.97+settle*.03+Math.sin(p*Math.PI)*.04));
    // A grazing light moves across the bevel; the mark resolves front-on as the story changes.
    key.position.set(-3.5+reveal*5.5+Math.sin(elapsed*.25)*.8,4-reveal,5);edge.intensity=2.3+Math.sin(reveal*Math.PI)*1.1;
    orbit.scale.setScalar(baseScale*.97);orbit.position.z=-.30;orbit.rotation.set(.20+reveal*.16,-.44+reveal*.85,-.35+reveal*.5+(values.current.motion?Math.sin(elapsed*.28)*.055:0));
   }
   let shaderError=false;renderer.debug.onShaderError=()=>{shaderError=true;};entrance=values.current.motion?0:1;compose();renderer.render(scene,camera);if(shaderError)throw Error('Signature shader unavailable');setReady(true);
   function draw(timestamp:number){if(disposed||suspended)return;raf=requestAnimationFrame(draw);if(!visible||!focused||!values.current.active){last=timestamp;lastRaf=timestamp;return;}
    const v=values.current,target=(!v.motion&&!compact)?eased:(v.phaseRef?.current??v.phase),cadence=lastRaf?timestamp-lastRaf:16.7;lastRaf=timestamp;
    if(lastMotion!==v.motion){lastMotion=v.motion;dirty=true;}
    const interacting=entrance<1||Math.abs(target-eased)>.00015||Math.abs((v.motion?mx:0)-px)>.001||Math.abs((v.motion?my:0)-py)>.001;
    if(!dirty&&!interacting){if(compact||!v.motion){last=timestamp;return;}if(timestamp-last<1000/60)return;}
    const dt=Math.min(timestamp-last||16.7,60);last=timestamp;
    if(interacting&&quality.sample(cadence))resize();const smooth=1-Math.exp(-dt/95);
    if(v.motion){elapsed+=dt*.001;eased+=(target-eased)*smooth;px+=(mx-px)*smooth;py+=(my-py)*smooth;entrance=Math.min(1,entrance+dt/950);}else{eased=target;px=0;py=0;entrance=1;}
    compose();renderer.render(scene,camera);dirty=false;
   }
   raf=requestAnimationFrame(draw);
  }catch{if(!disposed){setReady(false);cancelAnimationFrame(raf);}cleanup();}}
  return()=>{disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(raf);cleanup();};
 },[compact]);
 return <div className={'signature-stage '+(ready?'is-ready':'')+(compact?' is-compact':'')} aria-hidden="true"><img className="signature-stage-fallback" src="/atelier/signature-fallback.webp" alt="" width="1400" height="1400" fetchPriority={compact?'auto':'high'}/><div className="signature-stage-canvas" ref={host}/></div>;
}
