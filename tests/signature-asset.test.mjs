import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const bytes=readFileSync(new URL('../public/atelier/madonna-signature.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
test('the faithful monogram remains lightweight and has real depth',()=>{let triangles=0;gltf.scene.traverse(node=>{if(node.isMesh){triangles+=node.geometry.index?node.geometry.index.count/3:node.geometry.attributes.position.count/3;}});const box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3());assert.ok(triangles<10000);assert.ok(bytes.length<160000);assert.ok(size.z>.15);assert.ok(size.y>3.9&&size.y<4.1);const validation=JSON.parse(readFileSync(new URL('../design-source/signature/validation.json',import.meta.url)));assert.equal(validation.preserved_holes??validation.genus,6);assert.ok(validation.source_silhouette_iou>.98);});
test('the sculpture stays inside the camera throughout the scroll arc on narrow and wide viewports',()=>{
 const camera=new T.PerspectiveCamera(30,1,.1,40);camera.position.z=10;camera.updateMatrixWorld();
 const model=gltf.scene.clone(),box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());model.position.sub(center);const root=new T.Group();root.add(model);
 for(const [w,h] of [[272,170],[328,245],[366,450],[700,550],[900,740]]){
  camera.aspect=w/h;camera.updateProjectionMatrix();const viewHeight=2*Math.tan(T.MathUtils.degToRad(15))*10,scale=Math.min(viewHeight*.59/size.y,viewHeight*camera.aspect*.65/size.x);
  for(let i=0;i<=20;i++){const p=i/20,reveal=p*p*(3-2*p);root.scale.setScalar(scale*(1+Math.sin(p*Math.PI)*.04));root.rotation.set(.10-reveal*.16,-.42+reveal*.64,-.065+reveal*.10);root.position.y=Math.sin(p*Math.PI)*.05;root.updateMatrixWorld(true);
   root.traverse(mesh=>{if(mesh.isMesh){const points=mesh.geometry.attributes.position;for(let j=0;j<points.count;j++){const point=new T.Vector3().fromBufferAttribute(points,j).applyMatrix4(mesh.matrixWorld).project(camera);assert.ok(Math.abs(point.x)<.95&&Math.abs(point.y)<.95,`cropped at ${w}x${h}, phase ${p}`);}}});
  }
 }
});
