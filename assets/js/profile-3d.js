// assets/js/profile-3d.js
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // 1. Get the canvas element
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }

  // 2. Create renderer
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);

  function resizeRenderer() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  // 3. Create scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);
  camera.lookAt(0, 0, 0);

  // 4. Add lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 5. Helpers (optional)
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // 6. Load PLY model
  const loader = new PLYLoader();
  loader.load(
    '/assets/models/dog2.ply',
    geometry => {
      // Wrap geometry in a mesh
      const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geometry, material);

      // Center and scale
      geometry.computeBoundingBox();
      geometry.center();
      mesh.scale.set(0.01, 0.01, 0.01);

      scene.add(mesh);
      animate(mesh);
    },
    xhr => console.log(`PLY Load ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
    err => console.error('Error loading PLY:', err)
  );

  // 7. Animation loop
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}