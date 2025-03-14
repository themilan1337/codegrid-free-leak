// 1. Basic Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
document.querySelector(".corridor").appendChild(renderer.domElement);

// 2. Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfffffff, 0.5);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x000000, 0.5);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

const light1 = new THREE.PointLight(0xffffff, 2, 1);
light1.position.set(2, 3, 2);
scene.add(light1);

const light2 = new THREE.PointLight(0xffffff, 2, 1);
light2.position.set(-2, 3, -2);
scene.add(light2);

// 3. Camera and Movement Setup
const initialAngle = Math.PI / 4;
const radius = Math.sqrt(50);
let currentAngle = initialAngle;
let targetAngle = initialAngle;
let currentY = 0;
let targetY = 0;

camera.position.set(5, 0, 5);
camera.lookAt(0, 0, 0);

// 4. Parallax Control Setup
let mouseX = 0;
let mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener("mousemove", (event) => {
  mouseX = (event.clientX - windowHalfX) / windowHalfX;
  mouseY = (event.clientY - windowHalfY) / windowHalfY;
  targetAngle = initialAngle + -mouseX * 0.35;
  targetY = -mouseY * 1.5;
});

// 5. Model Loading and Material Setup
const emissiveColors = {
  screen: new THREE.Color(0x00ff00),
  lamp: new THREE.Color(0xffaa00),
  light: new THREE.Color(0xffffff),
  default: new THREE.Color(0xffffff),
};

const loader = new THREE.GLTFLoader();
loader.load("./assets/scene.gltf", function (gltf) {
  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        let emissiveColor = emissiveColors.default;
        for (const [key, color] of Object.entries(emissiveColors)) {
          if (child.name.toLowerCase().includes(key)) {
            emissiveColor = color;
            break;
          }
        }

        const newMaterial = new THREE.MeshStandardMaterial({
          color: child.material.color,
          map: child.material.map,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          roughness: 5.0,
          metalness: 0.125,
        });

        if (child.material.map) {
          newMaterial.map.encoding = THREE.sRGBEncoding;
          newMaterial.map.flipY = false;
        }

        child.material = newMaterial;
      }
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  scene.add(model);
  document.querySelector(".loading").style.display = "none";
});

// 6. Post-processing Setup
const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  2.0,
  0.25,
  0.5
);

// 7. Film Grain Effect
const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.15 },
    speed: { value: 2.0 },
    size: { value: 1.0 },
  },

  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,

  fragmentShader: `
      uniform float time;
      uniform float amount;
      uniform float speed;
      uniform float size;
      uniform sampler2D tDiffuse;
      varying vec2 vUv;

      float random(vec2 co) {
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        vec2 position = vUv;
        position *= size;
        float grain = random(position * time * speed);
        color.rgb += grain * amount;
        gl_FragColor = color;
      }
    `,
};

const filmGrainPass = new THREE.ShaderPass(FilmGrainShader);
filmGrainPass.renderToScreen = true;

const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(filmGrainPass);

// 8. Animation and Render Loop
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function animate() {
  requestAnimationFrame(animate);

  filmGrainPass.uniforms.time.value = performance.now() * 0.001;

  currentAngle = lerp(currentAngle, targetAngle, 0.025);
  currentY = lerp(currentY, targetY, 0.025);

  camera.position.x = Math.cos(currentAngle) * radius;
  camera.position.z = Math.sin(currentAngle) * radius;
  camera.position.y = lerp(camera.position.y, currentY, 0.05);

  camera.lookAt(0, 0, 0);

  composer.render();
}

// 9. Window Resize Handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize, false);

animate();
