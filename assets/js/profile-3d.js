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
-    // currently you have something like:
-    // const material = new THREE.MeshStandardMaterial({ vertexColors: true });
+    // 1️⃣ Make sure normals exist (in case you switch back to a lit material later)
+    geometry.computeVertexNormals();
+
+    // 2️⃣ Check if the PLY actually gave us a color attribute
+    if (!geometry.hasAttribute('color')) {
+      console.warn('PLY has no color attribute; geometry attributes:', Object.keys(geometry.attributes));
+    }
+
+    // 3️⃣ Use a basic, unlit material so we see raw vertex colors
+    const material = new THREE.MeshBasicMaterial({
+      vertexColors: true,    // use the geometry.attributes.color
+      side: THREE.DoubleSide // optional: see both faces
+    });
+
     const mesh = new THREE.Mesh(geometry, material);

+    // 4️⃣ If your model is still upside‑down, flip it back
+    mesh.rotation.x = Math.PI;
+
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
