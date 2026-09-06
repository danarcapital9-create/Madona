# Madonna studio signature

Created with a verified Blender 4.5.13 LTS runtime in background mode. The editable
native scene and exported mesh use the approved monogram contour. No new logo was
invented. The six holes and all 294 contour vertices are preserved.

## Integration

- Runtime: `madonna-signature-studio.glb`, 245,168 bytes; 10,604 triangles.
- glTF axes: +Y up, +Z front. Origin `[0,0,0]`.
- Bounds: 4.5639534 × 4 × 0.2300000.
- Node: `Madonna_Signature`; mesh: `Madonna_Approved_Contour_PrecisionProfile`.
- Three primitives/materials: `Madonna_Ivory_Satin`, `Madonna_Pearl_Edge`, and
  `Madonna_Emerald_Depth`. Preserve each imported material; do not overwrite all
  meshes with one material. Three.js may expose the primitives as child meshes.
- Ivory base color is sRGB `#F5E8D8`; depth uses `#023222`. Colors in glTF are linear.
- glTF `KHR_materials_clearcoat` is used; no decoder, texture, or external URI.
- No baked animation, camera, or light is included in the GLB. The `.blend` contains
  the studio camera and lights for editing and visual checking only.
- Prefer a small 0–12° yaw reveal, slight dolly, and movement of light/reflection
  across the face. Keep the logo legible. A reflection environment is needed for
  metallic materials to read in a browser; a flat ambient light will look flat.
- Transparent 1400 × 1400 PNG/WebP are Cycles-rendered fallbacks, not browser QA.

## What changed

The front radial contour inset remains 0.0072, avoiding changes to the delicate
hairlines. The rounded profile has 8 segments rather than 4, and an axial radius
of 0.026 rather than 0.0072, making a smoother, longer highlight. Three PBR
materials distinguish the satin face, pearl edge, and emerald depth. Correct
custom normals, front/back face culling, and native Blender export are retained.

## Verification

- Blender runtime probe and background `bpy` operation succeeded.
- Saved native `.blend`; exported GLB re-imported in Blender successfully.
- Welded mesh has zero boundary or nonmanifold edges, positive volume, Euler
  characteristic -10, and genus 6. Normals are finite and unit length.
- Outer contour coordinate sets match the previous asset at precision 1e-6.
- Orthographic raster comparison at 1640²: IoU 0.999920, 31 isolated pixels differ
  due to triangulation/rasterization of intermediate bevel bands.
- A 1400² Cycles preview, 96 samples with denoising, was generated and inspected.
- Browser appearance and physical-device performance must be checked separately.

## Reproduce

Keep the extracted approved source in `original/` beside
`build_signature_studio.py`, then run:

```sh
blender --background --factory-startup --disable-autoexec --python build_signature_studio.py
blender --background --factory-startup --disable-autoexec --python validate_signature_studio.py
```

The source ZIP used was `design-source/signature/madonna-monogram-source.zip` from
the Madonna repository. No checkout files were edited by this asset task.
