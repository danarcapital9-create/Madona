"use client";
import {useEffect,useRef} from 'react';

/** One low-resolution, full-viewport light field shared by the entire journey. */
export default function LivingSilk({motion,active}:{motion:boolean;active:boolean}){
 const host=useRef<HTMLCanvasElement>(null),state=useRef({motion,active});state.current={motion,active};
 useEffect(()=>{
  const canvas=host.current;if(!canvas)return;
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
  let raf=0,lost=false,lastDraw=0,time=0,dirty=true,scroll=0,target=0,shown=document.visibilityState==='visible';
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;};
  const vertex=compile(gl.VERTEX_SHADER,`#version 300 es
   in vec2 aPosition;out vec2 uv;void main(){uv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`);
  const fragment=compile(gl.FRAGMENT_SHADER,`#version 300 es
   precision mediump float;in vec2 uv;out vec4 color;uniform float uTime,uScroll,uAspect;
   void main(){
    vec2 p=(uv-.5)*vec2(uAspect,1.);float t=uTime*.11;
    float a=p.x*3.7+p.y*1.9+sin(p.y*3.1+t)*.85+t+uScroll*.38;
    float b=p.x*1.6-p.y*2.5+cos(p.x*2.-t)*.45-t*.6;
    float fold=sin(a)*.65+sin(a*2.+.5)*.15+sin(b)*.24;
    float slope=cos(a)*.65+cos(a*2.+.5)*.3;
    vec3 n=normalize(vec3(-slope*.85,-slope*.38+cos(b)*.3,1.));
    vec3 light=normalize(vec3(-.65+sin(t*.55)*.25,.7,1.));
    float diff=max(0.,dot(n,light));
    float sheen=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),28.);
    vec3 emerald=vec3(.00784,.1961,.1333);
    vec3 col=emerald*(.32+.49*diff)+vec3(.18,.29,.20)*sheen*.40;
    col*=.78+.22*smoothstep(-.8,.85,fold);
    float veil=exp(-length((uv-vec2(.28,.55))*vec2(1.3,1.))*3.8);
    col+=vec3(.045,.105,.052)*veil;
    col*=1.-.37*smoothstep(.2,.8,length(uv-.5));
    color=vec4(col,1.);
   }`);
  if(!vertex||!fragment){if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);return;}
  const program=gl.createProgram()!;gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return;}
  const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.useProgram(program);const attr=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const uTime=gl.getUniformLocation(program,'uTime'),uScroll=gl.getUniformLocation(program,'uScroll'),uAspect=gl.getUniformLocation(program,'uAspect');
  const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const ratio=Math.min(window.devicePixelRatio||1,w<768?.85:1.05);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(uAspect,w/h);dirty=true;};
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  const onScroll=()=>{target=window.scrollY/Math.max(600,canvas.clientHeight);dirty=true;};
  const visibility=()=>{shown=document.visibilityState==='visible';dirty=true;};
  const onLost=(event:Event)=>{event.preventDefault();lost=true;canvas.style.opacity='0';cancelAnimationFrame(raf);};
  canvas.addEventListener('webglcontextlost',onLost);document.addEventListener('visibilitychange',visibility);window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  const draw=(now:number)=>{if(lost)return;raf=requestAnimationFrame(draw);if(!shown||!state.current.active){lastDraw=now;return;}
   if(!state.current.motion&&!dirty){lastDraw=now;return;}
   const movingScroll=state.current.motion&&Math.abs(target-scroll)>.001;
   if(state.current.motion&&!dirty&&!movingScroll&&now-lastDraw<1000/30)return;
   const dt=Math.min(now-lastDraw||33,70);lastDraw=now;
   if(state.current.motion){time+=dt*.001;scroll+=(target-scroll)*(1-Math.exp(-dt/150));}
   gl.uniform1f(uTime,time);gl.uniform1f(uScroll,scroll);gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;
  };
  raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('scroll',onScroll);document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',onLost);gl.deleteBuffer(buffer);gl.deleteProgram(program);};
 },[]);
 return <canvas ref={host} className="living-silk" aria-hidden="true"/>;
}
