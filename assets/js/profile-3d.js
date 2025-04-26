// assets/js/profile-3d.js
import * as THREE        from 'three';
import { GLTFLoader }    from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // 1. Canvas & Renderer
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;

  // 2. Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, -100);

  // 3. Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  const fillLight = new THREE.PointLight(0xffffff, 0.5);
  camera.add(fillLight);
  scene.add(camera);

  // 4. Handle resizing
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // 5. Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor     = 0.1;
  controls.autoRotate        = true;
  controls.autoRotateSpeed   = 1.0;
  controls.enableZoom        = true;
  controls.enablePan         = false;

  // 6. Load your model
  new GLTFLoader().load(
    '/assets/models/dog2.glb',
    gltf => {
      const model = gltf.scene;
      model.rotation.x = Math.PI; // flip Z-up → Y-up
      scene.add(model);

      // Frame the camera around the model
      const bbox   = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0, radius * 0.5, radius * 2.3))
      );
      camera.lookAt(center);

      // 7. Add the smoke mesh
      const smokeMesh = createSmokeMesh(radius);
      // KEEP your Blender‐derived coords (note Y & Z axis swap comment)
      smokeMesh.position.set(0.25129, 0.174452, 0.0);
      model.add(smokeMesh);

      // 8. Theme‐toggle listener to update smoke color
      function updateSmokeColor() {
        const css = getComputedStyle(document.documentElement).getPropertyValue('--smoke-color').trim();
        const [r,g,b] = css.split(',').map(s => parseFloat(s));
        smokeMesh.material.uniforms.uSmokeColor.value.set(r, g, b);
      }
      document.getElementById('theme-toggle').addEventListener('click', () => {
        requestAnimationFrame(updateSmokeColor);
      });
      updateSmokeColor();

      // 9. Render loop
      const clock = new THREE.Clock();
      (function animate() {
        const t = clock.getElapsedTime();
        smokeMesh.material.uniforms.uTime.value = t;
        smokeMesh.lookAt(camera.position);
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      })();
    },
    xhr => console.log(`GLB ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
    err => console.error('Error loading GLB:', err)
  );

  // 10. Builds a smoke mesh that loops forever at constant size
  function createSmokeMesh(radius) {
    const tex = new THREE.TextureLoader().load('/images/perlin.png', t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });

    const vs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      mat2 rot(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }
      void main(){
        vUv = uv;
        vec3 p = position;
        float n = texture(uPerlin, vec2(uv.y*0.2, -uTime*0.01)).r;
        p.xz = rot(n*3.0)*p.xz;
        vec2 wind = vec2(
          texture(uPerlin, vec2(0.3,-uTime*0.03)).r - 0.5,
          texture(uPerlin, vec2(0.7,-uTime*0.03)).r - 0.5
        );
        p.xz += wind * uv.y * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `;
    const fs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      uniform vec3 uSmokeColor;
      void main(){
        vec2 uv = vUv;
        float speed = 0.02;
        uv.y = fract(uv.y - uTime * speed);
        float a = texture(uPerlin, uv).r;
        a = smoothstep(0.3,1.0,a);
        a *= smoothstep(0.0,0.1,uv.x) * smoothstep(1.0,0.9,uv.x);
        a *= smoothstep(0.0,0.1,uv.y) * smoothstep(1.0,0.4,uv.y);
        gl_FragColor = vec4(uSmokeColor, a * 0.6);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader:   vs,
      fragmentShader: fs,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.DoubleSide,
      uniforms: {
        uTime:       { value: 0 },
        uPerlin:     { value: tex },
        uSmokeColor: { value: new THREE.Color(0.2,0.2,0.2) }
      }
    });

    const geo = new THREE.PlaneGeometry(1, 1, 16, 64);
    geo.translate(0, 0.5, 0);
    const smokeWidth  = radius * 0.4;  // ~40% of mug radius
    const smokeHeight = radius * 1.0;  // equal to mug radius
    geo.scale(smokeWidth, smokeHeight, 1);

    return new THREE.Mesh(geo, mat);
  }
}
