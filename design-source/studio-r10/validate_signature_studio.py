from pathlib import Path
import bpy,bmesh,json,struct
import numpy as np
ROOT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'madonna-signature-studio.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert len(meshes)==1,len(meshes)
obj=meshes[0]
bm=bmesh.new();bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
edgecounts=[len(e.link_faces) for e in bm.edges]
euler=len(bm.verts)-len(bm.edges)+len(bm.faces)
report={'blender_reimport_ok':True,'blender_version':bpy.app.version_string,'mesh_count':len(meshes),'mesh_name':obj.name,'material_names':[m.name for m in obj.data.materials],'material_count':len(obj.data.materials),'reimport_blender_dimensions':list(obj.dimensions),'expected_blender_axes':'+Z up, -Y front','all_edges_two_faces':all(c==2 for c in edgecounts),'boundary_edges':sum(c==1 for c in edgecounts),'nonmanifold_edges':sum(c!=2 for c in edgecounts),'euler_characteristic':euler,'genus_preserved':int((2-euler)/2),'signed_volume':bm.calc_volume(signed=True),'triangles':len(bm.faces),'finite_positions':all(np.isfinite(tuple(v.co)).all() for v in bm.verts),'normal_min_length':min(v.normal.length for v in bm.verts),'normal_max_length':max(v.normal.length for v in bm.verts)}
assert report['all_edges_two_faces']
assert report['genus_preserved']==6
assert report['signed_volume']>0
assert report['finite_positions']
bm.free()
(ROOT/'studio-reimport-validation.json').write_text(json.dumps(report,indent=2))
print('REIMPORT_VALIDATION',json.dumps(report))
