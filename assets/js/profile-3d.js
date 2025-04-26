// assets/js/profile-3d.js
import * as THREE        from 'three';
import { GLTFLoader }    from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // 1. Grab the canvas
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }

  // 2. Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // 3. Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // 4. Lights
  // bright ambient
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  // hemisphere for soft sky/fill
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
  // single directional for contrast
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 5. Resize handling
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

  // 6. OrbitControls with auto‐rotate
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping      = true;
  controls.dampingFactor       = 0.1;
  controls.autoRotate          = true;
  controls.autoRotateSpeed     = 1.0;
  controls.enableZoom          = true;
  controls.enablePan           = false;

  // 7. Load GLB via GLTFLoader
  const loader = new GLTFLoader();
  loader.load(
    '/assets/models/dog2.glb',
    gltf => {
      const model = gltf.scene;

      // flip model right‐side up (GLTF is Z-up)
      model.rotation.x = Math.PI;

      scene.add(model);

      // auto‐frame camera on the model
      const bbox   = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;

      camera.position.copy(
        center.clone().add(new THREE.Vector3(0, radius * 0.5, radius * 2.3))
      );
      camera.lookAt(center);

      // 8. Render loop: autoRotate + user controls
      (function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      })();
    },
    xhr => console.log(`GLB ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
    err => console.error('Error loading GLB:', err)
  );
}
