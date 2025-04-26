// assets/js/profile-3d.js
import * as THREE        from 'three';
import { GLTFLoader }    from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // --- Basic scene & renderer setup ---
  const canvas   = document.getElementById('avatar-canvas');
  if (!canvas) return console.error('avatar-canvas element not found');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // --- Lights ---
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 10, 7);
  scene.add(dir);
  // head-mounted fill light
  const fill = new THREE.PointLight(0xffffff, 0.5);
  camera.add(fill);
  scene.add(camera);

  // --- Resize Handling ---
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

  // --- Controls (auto-rotate + user) ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor     = 0.1;
  controls.autoRotate        = true;
  controls.autoRotateSpeed   = 1.0;
  controls.enableZoom        = true;
  controls.enablePan         = false;

  // --- Load the GLB model ---
  const loader = new GLTFLoader();
  loader.load(
    '/assets/models/dog2.glb',
    gltf => {
      const model = gltf.scene;
      // flip right-side up
      model.rotation.x = Math.PI;
      scene.add(model);

      // auto-frame camera on the loaded model
      const bbox   = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0, radius * 0.5, radius * 2.3))
      );
      camera.lookAt(center);

      // once model is in place, add the smoke
      addSmoke(center, radius);

      // --- Render Loop ---
      (function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      })();
    },
    xhr => console.log(`GLB ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
    err => console.error('Error loading GLB:', err)
  );

  // --- Smoke Setup Function ---
  function addSmoke(modelCenter, modelRadius) {
    // 1. Load a tileable Perlin noise texture (you must put perlin.png under /assets/images/)
    const texLoader = new THREE.TextureLoader();
    const perlinTex = texLoader.load('/images/perlin.png', tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });

    // 2. Define our smoke shaders
    const smokeVertexShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      // simple 2D rotation
      mat2 rot(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
      }
      void main() {
        vUv = uv;
        vec3 pos = position;
        // twist via perlin
        float noise = texture(uPerlin, vec2(uv.y * 0.2, uTime * 0.02)).r;
        pos.xz = rot(noise * 3.0) * pos.xz;
        // wind offset
        vec2 wind = vec2(
          texture(uPerlin, vec2(0.3, uTime * 0.05)).r - 0.5,
          texture(uPerlin, vec2(0.7, uTime * 0.05)).r - 0.5
        );
        pos.xz += wind * uv.y * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    const smokeFragmentShader = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      void main() {
        vec2 uv = vUv;
        uv.y += uTime * 0.05;
        float alpha = texture(uPerlin, uv).r;
        alpha = smoothstep(0.4, 1.0, alpha);
        // fade edges
        alpha *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        alpha *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.5);
      }
    `;

    // 3. Create the ShaderMaterial
    const smokeMat = new THREE.ShaderMaterial({
      vertexShader: smokeVertexShader,
      fragmentShader: smokeFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPerlin: { value: perlinTex }
      }
    });

    // 4. Create a tall plane for the smoke
    const smokeGeo = new THREE.PlaneGeometry(1, 1, 16, 64);
    smokeGeo.translate(0, 0.5, 0);
    smokeGeo.scale(1.5, 3 * modelRadius, 1.5);

    const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);

    // Position it over your mug: here we offset from the model’s center
    // tweak Y/Z offsets to match your mug’s spout
    smokeMesh.position.copy(modelCenter).add(new THREE.Vector3(0, modelRadius * 1.1, 0));

    scene.add(smokeMesh);

    // 5. Animate the uTime uniform
    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      smokeMat.uniforms.uTime.value = clock.getElapsedTime();
    }
    tick();
  }
}
