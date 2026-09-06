"use client";
import {useEffect,useRef,useState} from 'react';
import type {Object3D,Mesh,Material} from 'three';
import {RenderQuality} from './render-quality';
import {createSatinBackdrop} from './satin-backdrop';

export default function OrchidStage({phase=0,phaseRef,motion=true,active=true,variant='hero'}:{phase?:number;phaseRef?:{current:number};motion?:boolean;active?:boolean;variant?:'hero'|'booking'}){
 const host=useRef<HTMLDivElement>(null),values=useRef({phase,phaseRef,motion,active});
 values.current={phase,phaseRef,motion,active};
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let disposed=false,frame=0,cleanup:()=>void=()=>{};
  setReady(false);setFailed(false);
  async function setup(){try{
   const [T,{GLTFLoader},{RoomEnvironment}]=await Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/environments/RoomEnvironment.js')]);
   if(disposed||!host.current)return;
   const node=host.current,canvas=document.createElement('canvas');
   const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
   if(!context){setFailed(true);return;}
   const renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'low-power'});
   const quality=new RenderQuality(Math.min(window.devicePixelRatio||1,window.innerWidth<768?1.75:2),1.5);renderer.setPixelRatio(quality.ratio);
   renderer.setClearColor(0x023222,0);renderer.outputColorSpace=T.SRGBColorSpace;
   renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
   renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=T.PCFSoftShadowMap;node.appendChild(canvas);
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,60);
   camera.position.set(0,0,8.8);
   const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();
   const environmentMap=pmrem.fromScene(environment,.04,.1,100,{size:128});
   scene.environment=environmentMap.texture;environment.dispose();pmrem.dispose();
   const backdrop=createSatinBackdrop(T,variant==='booking');scene.add(backdrop.mesh);
   scene.add(new T.HemisphereLight(0xfff2df,0x163b28,.32));
   const key=new T.DirectionalLight(0xffecd6,2.55);
   key.position.set(-4,4.5,3.8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
   Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});
   key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00012;key.shadow.normalBias=.014;scene.add(key);
   const fill=new T.DirectionalLight(0xa6c6ae,.27);fill.position.set(4,0,2);scene.add(fill);
   const edge=new T.DirectionalLight(0xfff1db,2.15);edge.position.set(1,2,-2);scene.add(edge);
   const root=new T.Group();scene.add(root);
   let model:Object3D|null=null;
   const petals:{node:Object3D;x:number;y:number;pz:number;sign:number;order:number}[]=[];
   let visible=true,focused=document.visibilityState==='visible',last=0,easedPhase=values.current.phaseRef?.current??values.current.phase;
   let px=0,py=0,mx=0,my=0,suspended=false,needsRender=true,lastStaticPhase=-1,elapsed=0;
   let compositionX=0,compositionY=0,compositionScale=1,mobile=false,lastRaf=0,lastShadow=0,lastShadowPhase=-1,lastShadowPx=0,lastShadowPy=0;
   const resize=()=>{
    needsRender=true;renderer.shadowMap.needsUpdate=true;const w=node.clientWidth,h=node.clientHeight;if(!w||!h)return;
    mobile=window.innerWidth<768;
    renderer.setPixelRatio(quality.ratio);renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
    const viewHeight=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.position.z;
    const viewWidth=viewHeight*camera.aspect;
    if(variant==='hero'){
     compositionX=mobile?viewWidth*.02:-viewWidth*.205;
     compositionY=mobile?-viewHeight*.225:-viewHeight*.02;
     compositionScale=Math.min(viewHeight*(mobile?.43:.66),viewWidth*(mobile?.88:.46))/3.8;
    }else{
     compositionX=0;compositionY=0;compositionScale=Math.min(viewHeight*.72,viewWidth*.81)/3.8;
    }
    renderer.getDrawingBufferSize(backdrop.uniforms.uResolution.value);
    backdrop.uniforms.uMobile.value=mobile?1:0;
   };
   const ro=new ResizeObserver(resize);ro.observe(node);resize();
   const pointer=(e:PointerEvent)=>{if(e.pointerType==='touch')return;mx=(e.clientX/window.innerWidth-.5)*2;my=(e.clientY/window.innerHeight-.5)*2;};
   window.addEventListener('pointermove',pointer,{passive:true});
   function draw(time:number){
    if(disposed)return;frame=requestAnimationFrame(draw);
    if(!visible||!focused||!values.current.active||suspended){last=time;lastRaf=time;return;}
    const p=values.current,phase=p.phaseRef?.current??p.phase;const cadence=lastRaf?time-lastRaf:16.7;lastRaf=time;
    if(!p.motion&&!needsRender&&lastStaticPhase===phase){last=time;return;}
    const interacting=needsRender||Math.abs(phase-easedPhase)>.0005||Math.abs(mx*.13-px)>.0005||Math.abs(my*.06-py)>.0005;
    const dt=time-last;if(!interacting&&dt<33)return;last=time;
    if(interacting&&quality.sample(cadence)){resize();}
    const smoothing=1-Math.exp(-Math.min(dt,80)/190);
    easedPhase=p.motion?easedPhase+(phase-easedPhase)*smoothing:phase;
    if(p.motion)elapsed+=Math.min(dt,50)*.001;
    const t=elapsed;
    px+=((p.motion?mx*.13:0)-px)*smoothing;py+=((p.motion?my*.06:0)-py)*smoothing;
    root.rotation.set(-.12+py+easedPhase*.21,-.48+px+easedPhase*.70,-.16+easedPhase*.23);
    root.position.set(compositionX-easedPhase*(mobile?.035:.11),compositionY+(p.motion?Math.sin(t*.42)*.026:0),0);
    root.scale.setScalar(compositionScale*(1+easedPhase*(mobile?.09:.14)));
    for(const petal of petals){
     const localPhase=Math.max(0,Math.min(1,(easedPhase-petal.order*.035)/(1-petal.order*.035)));
     const bloom=localPhase*localPhase*(3-2*localPhase),close=(1-bloom)*.39;
     petal.node.rotation.x=petal.x+close*Math.sin(petal.sign)+(p.motion?Math.sin(t*.4+petal.sign)*.006:0);
     petal.node.rotation.y=petal.y+close*Math.cos(petal.sign)*.85;
     petal.node.position.z=petal.pz+(p.motion?Math.sin(t*.35+petal.sign)*.005:0);
    }
    backdrop.uniforms.uTime.value=t;backdrop.uniforms.uPhase.value=easedPhase;
    backdrop.uniforms.uPointer.value.set(px,py);
    key.position.x=-4+easedPhase*.8;
    if(needsRender||(!p.motion&&lastStaticPhase!==phase)||((Math.abs(easedPhase-lastShadowPhase)>.002||Math.abs(px-lastShadowPx)>.0005||Math.abs(py-lastShadowPy)>.0005)&&time-lastShadow>=32)||time-lastShadow>180){renderer.shadowMap.needsUpdate=true;lastShadow=time;lastShadowPhase=easedPhase;lastShadowPx=px;lastShadowPy=py;}
    renderer.render(scene,camera);needsRender=false;lastStaticPhase=phase;
   }
   const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;needsRender=true;},{rootMargin:'0px'});io.observe(node);
   const visibility=()=>{focused=document.visibilityState==='visible';needsRender=true;};document.addEventListener('visibilitychange',visibility);
   const lost=(e:Event)=>{e.preventDefault();suspended=true;setReady(false);setFailed(true);};canvas.addEventListener('webglcontextlost',lost);
   let shaderError=false;renderer.debug.onShaderError=()=>{shaderError=true;};
   const abort=new AbortController();
   const disposeModel=(object:Object3D)=>object.traverse(o=>{const mesh=o as Mesh;if(mesh.isMesh){mesh.geometry.dispose();const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];mats.forEach((m:Material)=>m.dispose());}});
   cleanup=()=>{abort.abort();ro.disconnect();io.disconnect();window.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);if(model)disposeModel(model);backdrop.dispose();key.shadow.dispose();environmentMap.dispose();renderer.dispose();canvas.remove();};
   const response=await fetch('/atelier/madonna-orchid.glb',{signal:abort.signal});if(!response.ok)throw new Error('Orchid asset unavailable');
   const bytes=await response.arrayBuffer();if(disposed)return;
   const gltf=await new GLTFLoader().parseAsync(bytes,'/atelier/');
   if(disposed){disposeModel(gltf.scene);return;}model=gltf.scene;
   const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
   const base=3.8/Math.max(size.x,size.y);model.position.sub(center);model.scale.setScalar(base);model.position.multiplyScalar(base);root.add(model);
   model.traverse(o=>{
    const mesh=o as Mesh;
    if(mesh.isMesh){
     mesh.castShadow=true;mesh.receiveShadow=true;
     const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
     materials.forEach(mat=>{const m=mat as import('three').MeshStandardMaterial;m.envMapIntensity=.36;if(m.roughness!==undefined)m.roughness=Math.max(.34,m.roughness);m.side=T.FrontSide;});
    }
    if(/^petal_\d+$/.test(o.name))petals.push({node:o,x:o.rotation.x,y:o.rotation.y,pz:o.position.z,order:Number(o.name.match(/\d+/)?.[0]||0),sign:([91,232,308,156,25][Number(o.name.match(/\d+/)?.[0]||0)]||0)*Math.PI/180});
   });
   root.position.set(compositionX,compositionY,0);root.scale.setScalar(compositionScale);root.rotation.set(-.12,-.48,-.16);
   renderer.render(scene,camera);if(shaderError)throw new Error('Scene shader unavailable');
   setReady(true);frame=requestAnimationFrame(draw);
  }catch{
   if(disposed)return;setReady(false);setFailed(true);cleanup();
  }}
  setup();return()=>{disposed=true;cancelAnimationFrame(frame);cleanup();};
 },[variant]);
 return <div className={'orchid-stage '+(ready?'is-ready':'')+(failed?'has-fallback':'')} aria-hidden="true"><img className="orchid-fallback" src="/atelier/orchid-fallback.webp" alt=""/><div className="orchid-canvas" ref={host}/></div>
}
