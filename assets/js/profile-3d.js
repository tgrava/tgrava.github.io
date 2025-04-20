// assets/js/profile-3d.js
import * as THREE    from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // 1. Canvas & Renderer
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);

  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // 2. Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);
  camera.lookAt(0, 0, 0);

  // 3. Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 4. Helpers (optional)
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // 5. Load PLY model
  const loader = new PLYLoader();
  loader.load(
    '/assets/models/dog2.ply',
    geometry => {
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh     = new THREE.Mesh(geometry, material);

      geometry.computeBoundingBox();
      geometry.center();
      mesh.scale.set(0.01, 0.01, 0.01);

      scene.add(mesh);
      animate(mesh);
    },
    xhr => console.log(`PLY Load ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
    err => console.error('Error loading PLY:', err)
  );

  // 6. Render loop
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}
