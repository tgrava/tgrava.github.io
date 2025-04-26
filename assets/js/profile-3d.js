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
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;

  // 2. Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // 3. Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  const fillLight = new THREE.PointLight(0xffffff, 0.5);
  camera.add(fillLight);
  scene.add(camera);

  // 4. Resize handling
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

  // 5. Controls (auto-rotate + interaction)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor     = 0.1;
  controls.autoRotate        = true;
  controls.autoRotateSpeed   = 1.0;
  controls.enableZoom        = true;
  controls.enablePan         = false;

  // 6. Load the GLB model
  const loader = new GLTFLoader();
  loader.load(
    '/assets/models/dog2.glb',
    gltf => {
      const model = gltf.scene;
      // Flip Z-up → Y-up
      model.rotation.x = Math.PI;
      scene.add(model);

      // Compute bounding box to find top center
      const bbox      = new THREE.Box3().setFromObject(model);
      const min       = bbox.min, max = bbox.max;
      const topCenter = new THREE.Vector3(
        (min.x + max.x) / 2,
        max.y,
        (min.z + max.z) / 2
      );

      // Auto-frame camera around model
      const center = bbox.getCenter(new THREE.Vector3());
      const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0, radius * 0.5, radius * 2.3))
      );
      camera.lookAt(center);

      // Add the smoke plume at the top center
      addSmoke(topCenter, radius);

      // Render loop
      (function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      })();
    },
    xhr => console.log(`GLB ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
    err => console.error('Error loading GLB:', err)
  );

  // 7. Smoke setup
  function addSmoke(position, radius) {
    // 7.1 Load Perlin noise texture from /images
    const texLoader = new THREE.TextureLoader();
    const perlinTex = texLoader.load(
      '/images/perlin.png',
      tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; }
    );

    // 7.2 Shader code for the smoke
    const vs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      mat2 rot(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }
      void main(){
        vUv = uv;
        vec3 p = position;
        float n = texture(uPerlin, vec2(uv.y*0.2, uTime*0.02)).r;
        p.xz = rot(n*3.0)*p.xz;
        vec2 w = vec2(
          texture(uPerlin, vec2(0.3,uTime*0.05)).r-0.5,
          texture(uPerlin, vec2(0.7,uTime*0.05)).r-0.5
        );
        p.xz += w * uv.y * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `;
    const fs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      void main(){
        vec2 uv = vUv;
        uv.y += uTime * 0.05;
        float a = texture(uPerlin, uv).r;
        a = smoothstep(0.3,1.0,a);
        a *= smoothstep(0.0,0.1,uv.x) * smoothstep(1.0,0.9,uv.x);
        a *= smoothstep(0.0,0.1,uv.y) * smoothstep(1.0,0.4,uv.y);
        // dark gray smoke
        gl_FragColor = vec4(vec3(0.2), a * 0.6);
      }
    `;

    // 7.3 Create ShaderMaterial
    const smokeMat = new THREE.ShaderMaterial({
      vertexShader:   vs,
      fragmentShader: fs,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.DoubleSide,
      uniforms: {
        uTime:   { value: 0 },
        uPerlin: { value: perlinTex }
      }
    });

    // 7.4 Smoke plane geometry
    const smokeGeo = new THREE.PlaneGeometry(1, 1, 16, 64);
    smokeGeo.translate(0, 0.5, 0);
    smokeGeo.scale(2, radius * 1.5, 1);

    // 7.5 Mesh & position
    const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
    smokeMesh.position.copy(position).add(new THREE.Vector3(0, radius * 0.1, 0));
    smokeMesh.lookAt(camera.position);
    scene.add(smokeMesh);

    // 7.6 Animate the smoke
    const clock = new THREE.Clock();
    (function tick() {
      smokeMat.uniforms.uTime.value = clock.getElapsedTime();
      requestAnimationFrame(tick);
    })();
  }
}
