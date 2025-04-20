// assets/js/profile-3d.js
// If you loaded via <script> tags, skip imports:
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/js/loaders/GLTFLoader.js';

async function initAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight); // WebGLRenderer.domElement ↔ canvas :contentReference[oaicite:6]{index=6}

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  const loader = new THREE.GLTFLoader();
  const gltf = await loader.loadAsync('/assets/models/model.glb');
  scene.add(gltf.scene);

  (function animate() {
    requestAnimationFrame(animate);
    gltf.scene.rotation.y += 0.005;
    renderer.render(scene, camera);
  })();
}

window.addEventListener('DOMContentLoaded', initAvatar);