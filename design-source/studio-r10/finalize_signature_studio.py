from pathlib import Path
import bpy,json
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'madonna-signature-studio.blend'))
for m in bpy.data.materials:m.use_backface_culling=True
bpy.ops.object.select_all(action='DESELECT')
o=bpy.data.objects['Madonna_Signature'];o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.export_scene.gltf(filepath=str(ROOT/'madonna-signature-studio.glb'),export_format='GLB',use_selection=True,export_apply=False,export_materials='EXPORT',export_normals=True,export_texcoords=False,export_tangents=False,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'madonna-signature-studio.blend'))
p=ROOT/'studio-model-info.json';a=json.loads(p.read_text());a['glb_bytes']=(ROOT/'madonna-signature-studio.glb').stat().st_size;a['backface_culling']=True;p.write_text(json.dumps(a,indent=2))
