// assets/js/profile-3d.js
window.addEventListener('DOMContentLoaded', initAvatar);

async function initAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return console.error('avatar-canvas element not found');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 1, 3);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // Now that the loader script is present, this works:
  const loader = new THREE.GLTFLoader();
  const gltf = await loader.loadAsync('/assets/models/model.glb');
  scene.add(gltf.scene);

  (function animate() {
    requestAnimationFrame(animate);
    gltf.scene.rotation.y += 0.005;
    renderer.render(scene, camera);
  })();
}
