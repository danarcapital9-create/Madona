import sys,os,json
if os.environ.get('MADONNA_BLENDER_RUNTIME'):
    sys.path.insert(0, os.environ['MADONNA_BLENDER_RUNTIME'])
import bpy,bmesh
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=OUT+'/madonna-orchid.blend')
root=bpy.data.objects['Orchid']
for ob in root.children:
    if ob.type=='MESH':
        bm=bmesh.new(); bm.from_mesh(ob.data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(ob.data); bm.free(); ob.data.update()
        for m in ob.data.materials: m.use_backface_culling=True
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for ob in root.children: ob.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/madonna-orchid.glb',export_format='GLB',use_selection=True,export_yup=True,export_texcoords=False,export_normals=True,export_tangents=False,export_materials='EXPORT',export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/madonna-orchid.blend')
print('FINAL BYTES',os.path.getsize(OUT+'/madonna-orchid.glb'))
