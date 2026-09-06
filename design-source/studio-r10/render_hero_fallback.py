from pathlib import Path
import bpy,json
from mathutils import Vector, Matrix, Euler
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'madonna-signature-studio.blend'))
obj=bpy.data.objects['Madonna_Signature']
# Exact browser pose converted from glTF axes to native Blender axes.
axis=Matrix(((1,0,0),(0,0,-1),(0,1,0)))
rot=axis@Euler((0,-.28,-.055),'XYZ').to_matrix()@axis.inverted()
obj.rotation_mode='QUATERNION';obj.rotation_quaternion=rot.to_quaternion()
scene=bpy.context.scene;camera=scene.camera
camera.location=(0,-10,0);camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
bpy.context.view_layer.update()
bound=[obj.matrix_world@Vector(p) for p in obj.bound_box]
extent=max(max(v[0] for v in bound)-min(v[0] for v in bound),max(v[2] for v in bound)-min(v[2] for v in bound))
camera.data.ortho_scale=extent/.78
scene.view_settings.exposure=.18
scene.cycles.samples=128
scene.render.filepath=str(ROOT/'madonna-signature-hero.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'madonna-signature-hero-preview.blend'))
(ROOT/'hero-fallback-info.json').write_text(json.dumps({'render':'Blender Cycles 128 samples, denoised','resolution':[1400,1400],'transparent':True,'gltf_rotation_xyz':[0,-.28,-.055],'maximum_projected_occupancy':.78,'camera':'orthographic','note':'Fallback is a rendered still. CSS/GSAP can animate the plane; it is not real-time WebGL.'},indent=2))
bpy.ops.render.render(write_still=True)
