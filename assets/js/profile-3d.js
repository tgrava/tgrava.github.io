// assets/js/profile-3d.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { PLYLoader } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/jsm/loaders/PLYLoader.js';

window.addEventListener('DOMContentLoaded', initAvatar);

async function initAvatar() {
  // 1. Grab the canvas
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }

  // 2. Renderer
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

  // 3. Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);
  camera.lookAt(0, 0, 0);

  // 4. Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // 5. Helpers (optional—you can remove these)
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // 6. Load PLY
  const loader = new PLYLoader();
  loader.load(
    '/assets/models/dog2.ply',
    geometry => {
      // Wrap geometry in a mesh
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh     = new THREE.Mesh(geometry, material);

      // Center and scale to fit view
      geometry.computeBoundingBox();
      geometry.center();  
      mesh.scale.set(0.01, 0.01, 0.01);

      scene.add(mesh);

      // 7. Animate
      animate(mesh);
    },
    xhr => {
      console.log(`PLY Load ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`);
    },
    err => {
      console.error('Error loading PLY:', err);
    }
  );

  // 8. Render loop
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}