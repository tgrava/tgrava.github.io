// assets/js/profile-3d.js
import * as THREE    from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

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

  // 3. Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // 4. Lights (you can remove these once you switch to MeshBasicMaterial)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 5. Helpers (optional)
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // 6. Resize handling
  function resizeRenderer() {
    const width  = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeRenderer);
  resizeRenderer();

  // 7. Load the PLY
  const loader = new PLYLoader();
  loader.load(
  '/assets/models/dog2.ply',
  geometry => {
    // Flip if you still need to correct orientation
    geometry.rotateX(Math.PI);

    // Scale colors up if you post‑scaled them (see earlier discussion),
    // otherwise skip this if your PLY uses uchar colors.
    const colorAttr = geometry.getAttribute('color');
    if (colorAttr) {
      for (let i = 0; i < colorAttr.array.length; i++) {
        colorAttr.array[i] *= 255;
      }
      colorAttr.needsUpdate = true;
    }

    // Use a PointsMaterial instead of a Mesh material
    const material = new THREE.PointsMaterial({
      size: 0.01,           // adjust to taste
      vertexColors: true    // use your red/green/blue attributes
    });

    // Create a Points object instead of a Mesh
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Auto‑frame camera if you like
    const bbox   = new THREE.Box3().setFromObject(points);
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
    camera.position.copy(center.clone().add(new THREE.Vector3(0, radius * 1.5, radius * 1)));
    camera.lookAt(center);

    // Render loop (points will spin just like a mesh)
    (function animate() {
      requestAnimationFrame(animate);
      points.rotation.y += 0.005;
      renderer.render(scene, camera);
    })();
  },
  xhr => console.log(`PLY Load ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
  err => console.error('Error loading PLY:', err)
);


  // 8. Render loop
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}
