// assets/js/profile-3d.js
import * as THREE          from 'three';
import { PLYLoader }       from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls }   from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // Canvas & Renderer
  const canvas   = document.getElementById('avatar-canvas');
  if (!canvas) return console.error('avatar-canvas element not found');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // OPTIONAL: remove or keep axes helper
  scene.add(new THREE.AxesHelper(1));

  // Resize handling
  function resize() {
    const w = canvas.clientWidth,
          h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // OrbitControls for interactive rotation
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;       // smooths movement
  controls.dampingFactor  = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.5;          // how close you can zoom
  controls.maxDistance = 10;           // how far you can zoom

  // Load the PLY as a point cloud
  const loader = new PLYLoader();
  loader.load(
    '/assets/models/dog2.ply',
    geometry => {
      geometry.rotateX(Math.PI);       // flip if needed

      // If your PLY uses float colors, post‑scale them:
      const colorAttr = geometry.getAttribute('color');
      if (colorAttr) {
        for (let i = 0; i < colorAttr.array.length; i++) {
          colorAttr.array[i] *= 255;
        }
        colorAttr.needsUpdate = true;
      }

      const material = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // Auto‑frame the camera on the point cloud
      const bbox   = new THREE.Box3().setFromObject(points);
      const center = bbox.getCenter(new THREE.Vector3());
      const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
      camera.position.copy(
        center.clone().add(new THREE.Vector3(0, radius * 0.7, radius * 2.2))
      );
      camera.lookAt(center);

      // Start the loop
      animate();
      
      function animate() {
        requestAnimationFrame(animate);
        controls.update();            // required for damping
        renderer.render(scene, camera);
      }
    },
    xhr => console.log(`PLY ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
    err => console.error(err)
  );
}
