import sys, os, math, json
if os.environ.get('MADONNA_BLENDER_RUNTIME'):
    sys.path.insert(0, os.environ['MADONNA_BLENDER_RUNTIME'])
import bpy
import bmesh
from mathutils import Vector
from math import sin, cos, pi

OUT = os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def xyz(p):
    # Author in WebGL coordinates, glTF exporter restores +Y up / +Z front.
    return (p[0], -p[2], p[1])

def mat(name, color, roughness, metallic=0.0, vertex=False):
    m=bpy.data.materials.new(name); m.use_nodes=True
    m.use_backface_culling=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=roughness
    bs.inputs['Metallic'].default_value=metallic
    bs.inputs['Specular IOR Level'].default_value=.28
    bs.inputs['Coat Weight'].default_value=.13
    bs.inputs['Coat Roughness'].default_value=.4
    if vertex:
        vc=m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name='Color'
        m.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
    return m

ivory=mat('Madonna | satin ivory',(.92,.845,.72),.4,vertex=True)
lipmat=mat('Madonna | warm porcelain lip',(.92,.8,.58),.4,vertex=True)
columnmat=mat('Madonna | ivory column',(.94,.87,.75),.3)
throatmat=mat('Madonna | pale honey throat',(.54,.35,.10),.42)
green=mat('Madonna | deep botanical green',(.005,.052,.027),.38)
stemnode=mat('Madonna | green node',(.025,.10,.045),.5)
root=bpy.data.objects.new('Orchid',None); bpy.context.collection.objects.link(root)
root['front_axis']='+Z'; root['up_axis']='+Y'
root['design']='Original sculpted phalaenopsis, Madonna Beauty Lounge'

def mesh_obj(name, verts, faces, material, colors=None, parent=root):
    me=bpy.data.meshes.new(name+' Geometry'); me.from_pydata([xyz(v) for v in verts],[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    ob.parent=parent; me.materials.append(material)
    for p in me.polygons: p.use_smooth=True
    if colors:
        ca=me.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for i,c in enumerate(colors): ca.data[i].color=(*c,1)
    return ob

def surface(name, fun, colorfun, material, nt=54, nv=28, thick=.015):
    verts=[]; colors=[]; faces=[]
    for side in (0,1):
        for i in range(nt+1):
            t=(i+.008)/(nt+.016)
            for j in range(nv+1):
                v=-1+2*j/nv
                x,y,z=fun(t,v)
                verts.append((x,y,z-thick*side))
                c=colorfun(t,v,side); colors.append(c)
    stride=nv+1; count=(nt+1)*stride
    for i in range(nt):
        for j in range(nv):
            a=i*stride+j; b=a+stride
            faces.append((a,a+1,b+1,b))
            faces.append((count+a,count+b,count+b+1,count+a+1))
    for i in range(nt):
        a=i*stride; b=a+stride
        faces.append((a,b,b+count,a+count))
        a+=nv; b+=nv
        faces.append((a,a+count,b+count,b))
    for j in range(nv):
        faces.append((j,j+count,j+1+count,j+1))
        a=nt*stride+j; faces.append((a,a+1,a+1+count,a+count))
    return mesh_obj(name,verts,faces,material,colors)

def petal(name,angle,length,width,depth,phase,kind='lateral'):
    ang=math.radians(angle); d=(cos(ang),sin(ang)); w=(-sin(ang),cos(ang))
    def fun(t,v):
        if kind=='lateral':
            profile=sin(pi*t**1.11)**.54
            asym=1+.055*v*sin(pi*t)+.025*sin(t*15+phase)
            broad=width*profile*asym
            # Orchid petals are asymmetrical open fans, not radial ellipses.
            lateral=broad*v + .13*sin(pi*t)*sin(phase)
            radial=length*t+.08*sin(pi*t)*(v*v-.2)+.025*sin(9*v+phase)*sin(pi*t)
            cupping=.21*t+.16*t*t+.25*v*v*sin(pi*t)**.65
            fold=.055*sin(3.3*pi*t+2.4*v+phase)*sin(pi*t)*(.2+.8*abs(v))
            rim=.053*sin(10.5*t+6.5*v+phase)*abs(v)**5*sin(pi*t)
        else:
            profile=sin(pi*t**.96)**(.56 if name=='petal_0' else .74)
            broad=width*profile*(1+.045*sin(14*t+phase))
            lateral=broad*v+.055*sin(pi*t)*sin(phase)
            radial=length*t+.04*sin(pi*t)*(v*v-.2)
            cupping=.16*t+.20*t*t+.12*v*v*sin(pi*t)
            fold=.038*sin(3*pi*t+3*v+phase)*sin(pi*t)
            rim=.027*sin(11*t+7*v+phase)*abs(v)**5*sin(pi*t)
        # Subtle radiating tissue ridges catch grazing studio light.
        veins=.005*cos(v*24+2*sin(t*pi))*sin(pi*t)**.7*(1-.45*abs(v))
        return (d[0]*radial+w[0]*lateral,d[1]*radial+w[1]*lateral,depth+cupping+fold+rim+veins)
    def colors(t,v,side):
        warm=.45*abs(v)**8 + .25*(1-t)**4
        tissue=.014*cos(v*22+2*sin(t*pi))*sin(pi*t)
        c=(.93-.02*warm+tissue,.875-.063*warm+tissue,.765-.091*warm+tissue)
        if side: c=(c[0]*.965,c[1]*.975,c[2]*.98)
        return c
    ob=surface(name,fun,colors,ivory)
    ob['animation_hint']='Pivot at flower center; rotate gently around local X/Y for opening.'
    return ob

# Phalaenopsis architecture: three sepals behind two broad lateral petals.
petal('petal_0',91,1.88,.68,-.18,1.9,'sepal')
petal('petal_1',232,1.96,.65,-.22,.6,'sepal')
petal('petal_2',308,1.91,.69,-.21,2.8,'sepal')
petal('petal_3',156,2.0,1.00,-.04,2.2,'lateral')
petal('petal_4',25,2.07,.97,-.015,4.5,'lateral')

# Three-dimensional labellum: a suspended ruffled apron with two ascending side lobes.
def lip_fun(t,v):
    width=(.105+.43*sin(pi*t)**.86)*(1+.10*sin(t*10))
    # The lower lip narrows below its wings then curls towards the viewer.
    x=width*v*(1+.07*sin(8*t+v))
    y=-.12-1.00*t + .16*abs(v)**2*sin(pi*t)
    z=.40+.23*t+.39*t*t+.11*v*v*sin(pi*t)
    z+=.065*cos(v*4.5*pi)*sin(pi*t)**.6+.085*abs(v)**3*sin(11*t+v)
    return x,y,z
def lipcolor(t,v,side):
    gold=max(0,1-t*2.4)*(1-abs(v)*.4)
    vein=.032*(.5+.5*sin(v*31+t*7))*gold
    return (.93-.05*gold,.85-.21*gold-vein,.71-.36*gold-vein)
surface('Lip | ruffled apron',lip_fun,lipcolor,lipmat,nt=45,nv=28,thick=.02)

for s in (-1,1):
    def sidefun(t,v,s=s):
        breadth=.225*sin(pi*t)**.70
        x=s*(.12+.24*t + breadth*v*.84)
        y=-.12+.38*t -breadth*v*.54
        z=.42+.35*sin(pi*t*.73) + .10*v*v*sin(pi*t)
        z+=.025*sin(9*t+v)*sin(pi*t)
        return x,y,z
    surface('Lip | '+('left' if s<0 else 'right')+' wing',sidefun,lipcolor,lipmat,nt=30,nv=20,thick=.019)

def tube(name, points, radii, material, sides=12):
    verts=[]; faces=[]
    for i,p in enumerate(points):
        a=Vector(points[max(0,i-1)]); b=Vector(points[min(len(points)-1,i+1)])
        direction=(b-a).normalized(); ref=Vector((0,0,1))
        if abs(direction.dot(ref))>.98: ref=Vector((1,0,0))
        u=direction.cross(ref).normalized(); v=direction.cross(u).normalized()
        for k in range(sides):
            vv=Vector(p)+radii[i]*(u*cos(2*pi*k/sides)+v*sin(2*pi*k/sides))
            verts.append(tuple(vv))
    for i in range(len(points)-1):
        for k in range(sides):
            a=i*sides+k; b=i*sides+(k+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(range(sides-1,-1,-1)))
    last=(len(points)-1)*sides; faces.append(tuple(last+k for k in range(sides)))
    return mesh_obj(name,verts,faces,material)

# Fine paired curving callus ridges are characteristic of orchid lips.
for s in (-1,1):
    pts=[]; radii=[]
    for i in range(30):
        t=i/29
        pts.append((s*(.035+.085*sin(pi*t*.8)),-.06-.40*t,.56+.105*sin(pi*t)))
        radii.append(.023*sin(pi*(.05+.9*t))+.007)
    tube('Throat | '+('left' if s<0 else 'right')+' callus',pts,radii,throatmat,12)

# Curled terminal tendrils, small and organic rather than decorative wire loops.
for s in (-1,1):
    pts=[]; radii=[]
    for i in range(26):
        t=i/25
        pts.append((s*(.10+.13*sin(t*pi*.85)),-1.04-.19*sin(t*pi*.62),1.01+.11*t-.07*t*t))
        radii.append(.024*(1-t)**.6+.004)
    tube('Lip | '+('left' if s<0 else 'right')+' curled tip',pts,radii,columnmat,10)

# The column has a bent oval cross-section and an overhanging anther cap.
verts=[]; faces=[]; rings=32; ns=32
for i in range(rings+1):
    t=(i+.002)/(rings+.004)
    rr=sin(pi*t)**.53
    cx=.02*sin(t*pi); cy=.04+.44*t; cz=.45+.29*sin(pi*t*.74)
    for j in range(ns):
        a=2*pi*j/ns
        verts.append((cx+.172*rr*cos(a),cy+.045*rr*sin(a),cz+.155*rr*sin(a)))
for i in range(rings):
    for j in range(ns):
        a=i*ns+j; b=i*ns+(j+1)%ns; faces.append((a,b,b+ns,a+ns))
mesh_obj('Column | ivory hood',verts,faces,columnmat)

# Gently curved stem behind the corolla. Its deep green is visible on rotation.
pts=[]; radii=[]
for i in range(56):
    t=i/55
    pts.append((-.04-.27*sin(t*pi*.68),-.06-2.04*t,-.31-.21*sin(t*pi*.7)))
    radii.append(.063-.015*t)
tube('Stem | curved pedicel',pts,radii,green,14)

def bractfun(t,v):
    w=.14*sin(pi*t)**.8
    return (-.26-.4*t+w*v,-1.24-.36*t+w*v*.6,-.47+.05*t+.07*v*v)
def bractcolor(t,v,side): return (.015,.075,.035)
surface('Stem | folded bract',bractfun,bractcolor,ivory,nt=24,nv=12,thick=.018)

# Gather just sculpture geometry for clean export.
for ob in root.children:
    if ob.type=='MESH':
        bm=bmesh.new(); bm.from_mesh(ob.data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(ob.data); bm.free(); ob.data.update()
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for ob in root.children: ob.select_set(True)
bpy.context.view_layer.objects.active=root
glb=os.path.join(OUT,'madonna-orchid.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=True,
    export_texcoords=False,export_normals=True,export_tangents=False,export_materials='EXPORT',
    export_animations=False,export_cameras=False,export_lights=False,export_extras=True)

# Art-directed preview: soft ivory reflected light against Madonna green.
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x=1200; scene.render.resolution_y=1200; scene.render.resolution_percentage=100
scene.world.color=(.022,.043,.026)
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=.15

def track(ob,target): ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,energy,size,color):
    data=bpy.data.lights.new(name,'AREA'); data.energy=energy; data.shape='DISK'; data.size=size; data.color=color
    ob=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(ob); ob.location=xyz(loc); track(ob,xyz((0,0,.0)))
area('Key | large warm silk',(-3,4,5),650,5.0,(1,.94,.84))
area('Fill | cream',(3,0,4),240,3.5,(.84,.91,1))
area('Rim | left',(-3,0,-2),380,2.5,(.80,.91,.84))
area('Top silk',(0,4,-.5),250,2.5,(1,.95,.84))

back=mat('Backdrop',(.005,.035,.020),.9)
bpy.ops.mesh.primitive_plane_add(size=200,location=xyz((0,0,-1.5)))
bp=bpy.context.object; bp.name='Preview only backdrop'; bp.rotation_euler=(pi/2,0,0); bp.data.materials.append(back)
camdata=bpy.data.cameras.new('Camera'); cam=bpy.data.objects.new('Camera',camdata); bpy.context.collection.objects.link(cam)
cam.location=xyz((.3,.14,9)); track(cam,xyz((0,-.05,.05))); camdata.type='ORTHO'; camdata.ortho_scale=5.35; scene.camera=cam
scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(OUT,'madonna-orchid-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'madonna-orchid.blend'))
bpy.ops.render.render(write_still=True)

triangles=sum(sum(len(p.vertices)-2 for p in ob.data.polygons) for ob in root.children if ob.type=='MESH')
info={'path':glb,'bytes':os.path.getsize(glb),'triangles':triangles,'mesh_count':len([o for o in root.children if o.type=='MESH']),
      'root':'Orchid','front':'+Z','up':'+Y','petals':['petal_'+str(i) for i in range(5)],'width_approx':4.1,'height_approx':4.0}
with open(os.path.join(OUT,'madonna-orchid-info.json'),'w') as f:json.dump(info,f,indent=2)
print(json.dumps(info))
