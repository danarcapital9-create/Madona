import type * as Three from 'three';

/** A tessellated, displaced surface. The folds and their normals share one field. */
export function createSatinBackdrop(T: typeof Three, booking: boolean) {
  const uniforms = {
    uTime: { value: 0 }, uPhase: { value: 0 },
    uPointer: { value: new T.Vector2() },
    uResolution: { value: new T.Vector2(1, 1) },
    uMobile: { value: 0 }, uBooking: { value: booking ? 1 : 0 },
    uGreen: { value: new T.Color('#023222') },
    uSilk: { value: new T.Color('#53765A') },
  };
  const geometry = new T.PlaneGeometry(36, 26, 80, 56);
  const material = new T.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uPhase;
      uniform vec2 uPointer;
      varying vec3 vNormalView;
      varying vec3 vView;
      varying float vFold;
      void main() {
        vec3 p = position;
        float a = p.x*.83 + p.y*.24 + sin(p.y*.32)*.9 + uTime*.047 + uPhase*.65 + uPointer.x*.13;
        float b = p.x*.31 - p.y*.54 + uTime*.026;
        float f = sin(a)*.69 + sin(2.*a+.8)*.16 + sin(b)*.17;
        float slope = cos(a)*.69 + cos(2.*a+.8)*.32;
        float dx = slope*.83 + cos(b)*.0527;
        float dy = slope*(.24 + cos(p.y*.32)*.288) - cos(b)*.0918;
        p.z += f;
        vNormalView = normalize(normalMatrix * vec3(-dx,-dy,1.));
        vec4 view = modelViewMatrix * vec4(p,1.);
        vView = -view.xyz;
        vFold = f;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float uMobile;
      uniform float uBooking;
      uniform vec2 uResolution;
      uniform vec3 uGreen;
      uniform vec3 uSilk;
      varying vec3 vNormalView;
      varying vec3 vView;
      varying float vFold;
      void main() {
        vec2 screen = gl_FragCoord.xy / uResolution;
        vec3 n = normalize(vNormalView);
        vec3 eye = normalize(vView);
        vec3 key = normalize(vec3(-.7,.65,1.15));
        vec3 edge = normalize(vec3(.8,-.1,.55));
        float diffuse = max(0.,dot(n,key));
        float ribbon = pow(max(0.,dot(n,normalize(key+eye))),42.);
        float sheen = pow(max(0.,dot(n,normalize(edge+eye))),18.);
        vec3 color = uGreen * (.36 + diffuse * .8);
        color += uSilk * (ribbon * .24 + sheen * .075);
        color *= .86 + .14 * smoothstep(-.65,.8,vFold);
        float halo = exp(-length((screen-vec2(.28,.52))*vec2(1.1,1.)) * 3.8);
        color += uSilk * halo * .09;
        float quiet = mix(smoothstep(.48,.91,screen.x),smoothstep(.48,.85,screen.y),uMobile);
        color = mix(color,uGreen * .64,quiet * .62 * (1.-uBooking));
        float vignette = 1. - .19 * smoothstep(.3,.85,length(screen-.5));
        gl_FragColor = vec4(color*vignette,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.position.z = -3.3;
  mesh.frustumCulled = false;
  return { mesh, uniforms, dispose: () => { geometry.dispose(); material.dispose(); } };
}
