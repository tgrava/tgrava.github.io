// assets/js/profile-3d.js
import * as THREE    from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

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

  // 3. Create scene and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);
  camera.lookAt(0, 0, 0);

  // 4. Handle resize after camera exists
  function resizeRenderer() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  // Initial size
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);

  // 5. Add lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 6. Helpers (optional)
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // 7. Load PLY model
loader.load(
  '/assets/models/dog2.ply',
  geometry => {
    geometry.computeVertexNormals();

    const material = new THREE.MeshNormalMaterial();
    const mesh     = new THREE.Mesh(geometry, material);

    // temporarily disable center/scale
    // geometry.center();
    // mesh.scale.set(0.01, 0.01, 0.01);

    scene.add(mesh);

    // debug bounding box & reframe camera
    const bbox   = new THREE.Box3().setFromObject(mesh);
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
    console.log('BBox:', bbox.min, bbox.max);

    camera.position.copy(center.clone().add(new THREE.Vector3(0, radius * 2, radius * 2)));
    camera.lookAt(center);

    animate(mesh);
  },
  xhr => console.log(`PLY Load ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
  err => console.error('Error loading PLY:', err)
);

  // 8. Animation loop
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}
