// assets/js/profile-3d.js
import * as THREE    from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // ─── 1. Grab the canvas ──────────────────────────────────────────────
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) {
    console.error('avatar-canvas element not found');
    return;
  }

  // ─── 2. Renderer ────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  // ─── 3. Scene & Camera ─────────────────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // ─── 4. Lights ─────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // ─── 5. Helpers (optional) ─────────────────────────────────────────
  scene.add(new THREE.GridHelper(5, 10));
  scene.add(new THREE.AxesHelper(1));

  // ─── 6. Handle Resizing ─────────────────────────────────────────────
  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeRenderer);
  resizeRenderer(); // initial sizing

  // ─── 7. Load the PLY ────────────────────────────────────────────────
  const loader = new PLYLoader();
loader.load(
  '/assets/models/dog2.ply',
  geometry => {
    // 1. Compute normals (for lighting)
    geometry.computeVertexNormals();

    // 2. Create a material that reads vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,       // ← pick up per‑vertex colors from the PLY
      side: THREE.DoubleSide    // ← optional, if you need faces visible from both sides
    });

    // 3. Wrap in a mesh
    const mesh = new THREE.Mesh(geometry, material);

    // 4. Flip upside‑down (PLY usually has Z‑up; three.js is Y‑up)
    mesh.rotation.x = Math.PI;

    // 5. (Re‑)compute bounds & auto‑frame as before
    const bbox   = new THREE.Box3().setFromObject(mesh);
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;

    camera.position.copy(
      center.clone().add(new THREE.Vector3(0, radius * 1.5, radius * 1.5))
    );
    camera.lookAt(center);

    // 6. Add to scene & animate
    scene.add(mesh);
    animate(mesh);
  },
  xhr => console.log(`PLY Load ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
  err => console.error('Error loading PLY:', err)
);

  // ─── 8. Render Loop ─────────────────────────────────────────────────
  function animate(model) {
    requestAnimationFrame(() => animate(model));
    model.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
}
