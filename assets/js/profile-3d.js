// assets/js/profile-3d.js
import * as THREE        from 'three';
import { GLTFLoader }    from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener('DOMContentLoaded', initAvatar);

function initAvatar() {
  // Canvas & Renderer
  const canvas   = document.getElementById('avatar-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding      = THREE.sRGBEncoding;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0;

  // Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1, 3);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  const fillLight = new THREE.PointLight(0xffffff, 0.5);
  camera.add(fillLight);
  scene.add(camera);

  // Resize handling
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // OrbitControls (auto-rotate + manual)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor     = 0.1;
  controls.autoRotate        = true;
  controls.autoRotateSpeed   = 1.0;
  controls.enableZoom        = true;
  controls.enablePan         = false;

  // Load your GLB
  new GLTFLoader().load('/assets/models/dog2.glb', gltf => {
    const model = gltf.scene;
    model.rotation.x = Math.PI; // Z-up → Y-up
    scene.add(model);

    // compute bounds to frame camera
    const bbox   = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getBoundingSphere(new THREE.Sphere()).radius;
    camera.position.copy(center.clone().add(new THREE.Vector3(0, radius * 0.5, radius * 2.3)));
    camera.lookAt(center);

    // add smoke as child of model at your Blender coordinates
    const smokeMesh = createSmokeMesh(radius);
    // Blender coords relative to model origin:
    smokeMesh.position.set(0.28365, 0.011415, -0.17834);
    model.add(smokeMesh);

    // animation loop
    const clock = new THREE.Clock();
    (function animate() {
      const t = clock.getElapsedTime();

      // update smoke time uniform
      smokeMesh.material.uniforms.uTime.value = t;

      // make smoke face the camera
      smokeMesh.lookAt(camera.position);

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    })();
  },
  xhr => console.log(`GLB ${(xhr.loaded/xhr.total*100).toFixed(1)}%`),
  err => console.error(err));

  // Factory for the smoke mesh
  function createSmokeMesh(radius) {
    // load perlin texture
    const tex = new THREE.TextureLoader().load('/images/perlin.png', t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });

    // vertex shader
    const vs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
      void main(){
        vUv = uv;
        vec3 p = position;
        float n = texture(uPerlin, vec2(uv.y*0.2, -uTime*0.01)).r;
        p.xz = rot(n*3.0)*p.xz;
        vec2 w = vec2(
          texture(uPerlin, vec2(0.3,-uTime*0.03)).r-0.5,
          texture(uPerlin, vec2(0.7,-uTime*0.03)).r-0.5
        );
        p.xz += w * uv.y * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `;
    // fragment shader
    const fs = `
      varying vec2 vUv;
      uniform float uTime;
      uniform sampler2D uPerlin;
      void main(){
        vec2 uv = vUv;
        uv.y -= uTime * 0.02;
        float a = texture(uPerlin, uv).r;
        a = smoothstep(0.3,1.0,a);
        a *= smoothstep(0.0,0.1,uv.x)*smoothstep(1.0,0.9,uv.x);
        a *= smoothstep(0.0,0.1,uv.y)*smoothstep(1.0,0.4,uv.y);
        gl_FragColor = vec4(vec3(0.2), a * 0.6);
      }
    `;

    // material
    const mat = new THREE.ShaderMaterial({
      vertexShader:   vs,
      fragmentShader: fs,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.DoubleSide,
      uniforms: {
        uTime:   { value: 0 },
        uPerlin: { value: tex }
      }
    });

    // plane geometry: width=radius, height=radius*8
    const geo = new THREE.PlaneGeometry(1,1,16,64);
    geo.translate(0,0.5,0);
    geo.scale(radius, radius*8, 1);

    return new THREE.Mesh(geo, mat);
  }
}
