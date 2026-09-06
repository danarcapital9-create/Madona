"""Refine the approved Madonna contour in Blender; no texture dependencies.

Run Blender 4.5 --background --factory-startup --disable-autoexec --python this_file.
The silhouette is the unchanged contour in original/monogram-trace.svg. Only the
inset face/profile, supplied custom normals, and three PBR materials are refined.
"""
from pathlib import Path
import bpy, math, json, re
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
ORIG=ROOT/'original'
svg=(ORIG/'monogram-trace.svg').read_text()
d=re.search(r'<path d="([^"]+)"',svg).group(1)
loops=[]
for i,path in enumerate(d.split(' Z')):
    values=re.findall(r'(-?[\d.]+),(-?[\d.]+)',path)
    if not values: continue
    p=np.array(values,dtype=float)-[2,2]
    p=(p-[785/2,688/2])*(4/688);p[:,1]*=-1
    area=np.sum(p[:,0]*np.roll(p[:,1],-1)-p[:,1]*np.roll(p[:,0],-1))/2
    if (area>0)!=(i==0):p=p[::-1]
    loops.append(p)

def outline_data(p,radius):
    edge=np.roll(p,-1,axis=0)-p
    tangent=edge/np.linalg.norm(edge,axis=1)[:,None]
    normal=np.stack([tangent[:,1],-tangent[:,0]],axis=1)
    n=normal+np.roll(normal,1,axis=0);n/=np.linalg.norm(n,axis=1)[:,None]
    miter=n/np.maximum((n*normal).sum(axis=1)[:,None],.24)
    lengths=np.linalg.norm(edge,axis=1)
    cap=.34*np.minimum(lengths,np.roll(lengths,1))
    miter*=np.minimum(1,cap/(radius*np.linalg.norm(miter,axis=1)))[:,None]
    return n,miter,normal

# Reuse the known valid 6-hole front triangulation, mapping contour vertices.
old=np.load(ORIG/'monogram-mesh.npz')
old_coords=np.concatenate([p-outline_data(p,.0072)[1]*.0072 for p in loops])
old_front=old['face_triangles'][np.all(old['positions'][old['face_triangles']][:,:,2]>.11,axis=1)]
front_map=[]
max_error=0
for face in old_front:
    ids=[]
    for v in old['positions'][face]:
        ds=np.linalg.norm(old_coords-v[:2],axis=1);j=int(np.argmin(ds))
        max_error=max(max_error,float(ds[j]));ids.append(j)
    front_map.append(ids)
assert max_error<1e-6,max_error
front_map=np.array(front_map)

radius=.0072
axial_bevel=.026
half_depth=.115
segments=8
positions=[];normals=[];faces=[];mat_ids=[]
def add(points,ns):
    start=len(positions);positions.extend(points);normals.extend(ns)
    return np.arange(start,start+len(points))
front_ids=[];back_ids=[];coords=[]
for p in loops:
    n,m,edge_normal=outline_data(p,radius);N=len(p)
    sharp=np.sum(edge_normal*np.roll(edge_normal,1,axis=0),axis=1)<math.cos(math.radians(32))
    profile=[]
    for theta in np.linspace(math.pi/2,0,segments+1):
        # Elliptical highlight profile, exact outer contour at theta=0.
        profile.append((radius*(1-math.cos(theta)),-half_depth+axial_bevel*(1-math.sin(theta)),-math.sin(theta)/axial_bevel,math.cos(theta)/radius))
    for theta in np.linspace(0,math.pi/2,segments+1):
        profile.append((radius*(1-math.cos(theta)),half_depth-axial_bevel*(1-math.sin(theta)),math.sin(theta)/axial_bevel,math.cos(theta)/radius))
    rings=[]
    for inset,z,nz,nxy in profile:
        xy=p-m*inset;pts=np.column_stack([xy,np.full(N,z)])
        ns=np.column_stack([n*nxy,np.full(N,nz)]);ns/=np.linalg.norm(ns,axis=1)[:,None]
        rings.append(add(pts,ns))
    for k in range(len(rings)-1):
        low,high=rings[k],rings[k+1]
        for j in range(N):
            jj=(j+1)%N
            ni=edge_normal[j] if sharp[j] else n[j]
            nj=edge_normal[j] if sharp[jj] else n[jj]
            nz0,xy0=profile[k][2:];nz1,xy1=profile[k+1][2:]
            ns=np.array([[ni[0]*xy0,ni[1]*xy0,nz0],[nj[0]*xy0,nj[1]*xy0,nz0],[nj[0]*xy1,nj[1]*xy1,nz1],[ni[0]*xy1,ni[1]*xy1,nz1]])
            ns/=np.linalg.norm(ns,axis=1)[:,None]
            q=add([positions[int(x)] for x in [low[j],low[jj],high[jj],high[j]]],ns)
            faces.extend([[int(q[0]),int(q[1]),int(q[2])],[int(q[0]),int(q[2]),int(q[3])]])
            mat_ids.extend([2 if k==segments else 1]*2)
    xy=p-m*radius;coords.extend(xy)
    front_ids.extend(add(np.column_stack([xy,np.full(N,half_depth)]),np.tile([0,0,1],(N,1))))
    back_ids.extend(add(np.column_stack([xy,np.full(N,-half_depth)]),np.tile([0,0,-1],(N,1))))

coords=np.array(coords)
def area2(a):return np.cross(a[:,1]-a[:,0],a[:,2]-a[:,0])
old_sign=area2(old_coords[front_map]);new_sign=area2(coords[front_map])
assert np.all(new_sign*old_sign>0),'Inset created a flipped triangle'
for tri in front_map:
    faces.append([int(front_ids[i]) for i in tri]);mat_ids.append(0)
    faces.append([int(back_ids[i]) for i in tri[::-1]]);mat_ids.append(0)

P=np.array(positions,dtype=np.float32);N=np.array(normals,dtype=np.float32);F=np.array(faces)
used=np.unique(F);packed=np.round(np.column_stack([P[used],N[used]]),7)
unique,inverse=np.unique(packed,axis=0,return_inverse=True)
remap=np.zeros(len(P),dtype=np.uint32);remap[used]=inverse
P=unique[:,:3];N=unique[:,3:];F=remap[F]

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Convert glTF (+Y up, +Z front) into native Blender (+Z up, -Y front).
bp=np.column_stack([P[:,0],-P[:,2],P[:,1]])
bn=np.column_stack([N[:,0],-N[:,2],N[:,1]])
mesh=bpy.data.meshes.new('Madonna_Approved_Contour_PrecisionProfile')
mesh.from_pydata(bp.tolist(),[],F.tolist());mesh.update()
obj=bpy.data.objects.new('Madonna_Signature',mesh);bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)

def srgb(hex_value):
    c=np.array([int(hex_value[i:i+2],16) for i in (0,2,4)])/255
    return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4).tolist()+[1]
def material(name,color,metallic,roughness,coat):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=srgb(color)
    bs.inputs['Metallic'].default_value=metallic
    bs.inputs['Roughness'].default_value=roughness
    bs.inputs['Coat Weight'].default_value=coat
    bs.inputs['Coat Roughness'].default_value=.23
    m.diffuse_color=srgb(color);m.metallic=metallic;m.roughness=roughness
    return m
for m in [material('Madonna_Ivory_Satin','F5E8D8',.22,.3,.24),material('Madonna_Pearl_Edge','E7D9C0',.36,.25,.3),material('Madonna_Emerald_Depth','023222',.3,.32,.3)]:mesh.materials.append(m)
for poly,mat in zip(mesh.polygons,mat_ids):poly.material_index=mat;poly.use_smooth=True
mesh.normals_split_custom_set_from_vertices(bn.tolist())
obj['brand']='Madonna Beauty Lounge'
obj['contour_source']='Approved original monogram; six holes; no silhouette expansion'
obj['motion_contract']='Front glTF +Z, up +Y; origin centered. Prefer 0 to 12 degree reveal, light sweep and camera dolly.'
obj['profile_radial_inset']=radius;obj['profile_axial_radius']=axial_bevel

# Export only the native emblem. The studio scene below is source/QA only.
bpy.ops.export_scene.gltf(filepath=str(ROOT/'madonna-signature-studio.glb'),export_format='GLB',use_selection=True,export_apply=False,export_materials='EXPORT',export_normals=True,export_texcoords=False,export_tangents=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)

world=bpy.data.worlds.new('Madonna_Soft_Studio');bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.4,.46,.43,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.42
def area(name,location,power,size,shape='DISK',color=(1,1,1)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape=shape;data.size=size;data.color=color
    light=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(light);light.location=location
    light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
    return light
area('Key_Softbox',(-3.5,-4.7,4.6),480,4.5,color=(1,.95,.86))
area('Front_Broad_Fill',(3.2,-4.2,1.0),180,4.0,color=(.9,.96,1))
area('Tall_Specular_Sweep',(-1,-2.2,5),240,2.0,'RECTANGLE',color=(1,.98,.93)).data.size_y=5
area('Emerald_Edge_Rim',(3.2,1.5,3.7),500,2.5,color=(.92,1,.96))
scene=bpy.context.scene
bpy.ops.object.camera_add(location=(1.55,-10,.72))
camera=bpy.context.object;camera.name='Studio_Hero_Camera'
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=5.3
scene.camera=camera;scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True
scene.render.film_transparent=True;scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=str(ROOT/'madonna-signature-studio.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'madonna-signature-studio.blend'))
info={'generator':'Blender 4.5.13 LTS, approved contour reconstructed as native editable mesh','mesh':'Madonna_Signature','front_axis':'+Z','up_axis':'+Y','dimensions':(P.max(axis=0)-P.min(axis=0)).tolist(),'origin':[0,0,0],'preserved_holes':6,'contour_vertices':sum(map(len,loops)),'bevel_segments':segments,'bevel_radial_inset':radius,'bevel_axial_radius':axial_bevel,'triangle_count':len(F),'vertex_count':len(P),'glb_bytes':(ROOT/'madonna-signature-studio.glb').stat().st_size,'texture_count':0,'front_mapping_max_error':max_error,'materials':['Madonna_Ivory_Satin','Madonna_Pearl_Edge','Madonna_Emerald_Depth'],'source_contour_unchanged':True,'export_selection_only':True}
(ROOT/'studio-model-info.json').write_text(json.dumps(info,indent=2))
np.savez_compressed(ROOT/'studio-mesh.npz',positions=P,normals=N,faces=F,material_ids=np.array(mat_ids))
print('STUDIO_MODEL_INFO',json.dumps(info),flush=True)
bpy.ops.render.render(write_still=True)
