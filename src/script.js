import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Creation of a Twirl Galaxy
let twirlMaterial = null;
const TwirlGalaxy = () => {
  // Galaxy
  const parameters = {};
  parameters.count = 200000;
  parameters.size = 0.005;
  parameters.radius = 5;
  parameters.branches = 3;
  parameters.spin = 1;
  parameters.randomness = 0.5;
  parameters.randomnessPower = 3;
  parameters.insideColor = '#ff6030';
  parameters.outsideColor = '#1b3984';
  
  let geometry = null;
  let material = null;
  let points = null;
  
  const TwirlParameters = () =>
  {
    // Already have a galaxy? / Destroy the old one
    if(points !== null) {
      geometry.dispose(); // Free the memory from it
      material.dispose();
      scene.remove(points); // Bye bye points on the screen
    }
  
    // Geometry
    geometry = new THREE.BufferGeometry();
  
    const positions = new Float32Array(parameters.count * 3); // Vertex with X - Y - Z
    const colors = new Float32Array(parameters.count * 3); // 3 Value (RGB)\
    const scales = new Float32Array(parameters.count * 1); // Only one value for scale
    const randomness = new Float32Array(parameters.count * 3);
  
    const insideColor = new THREE.Color(parameters.insideColor);
    const outsideColor = new THREE.Color(parameters.outsideColor);
  
    for(let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;
  
      // Position
      const radius = Math.random() * parameters.radius;
  
      const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;
  
      positions[i3    ] = Math.cos(branchAngle) * radius;   // X axes
      positions[i3 + 1] = 0;                                   // Y axes
      positions[i3 + 2] = Math.sin(branchAngle) * radius;  // Z axes
  
      // Randomness
      const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
      const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
      const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
  
      randomness[i3 + 0] = randomX;
      randomness[i3 + 1] = randomY;
      randomness[i3 + 2] = randomZ;
  
      // Color
      const mixedColor = insideColor.clone();
      mixedColor.lerp(outsideColor, radius / parameters.radius);
  
      colors[i3    ] = mixedColor.r; // Red
      colors[i3 + 1] = mixedColor.g; // Green
      colors[i3 + 2] = mixedColor.b; // Blue
  
      // Scale
      scales[i] = Math.random();
    }
  
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(colors, 1));
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
  
    // Material
    material = new THREE.ShaderMaterial({
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      vertexShader: `
      uniform float uTime;
      uniform float uSize;
  
      attribute float aScale;
      attribute vec3 aRandomness;
  
      varying vec3 vColor;
  
      void main()
      {
        // Position
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
        // WE SPINNIN BABYYYY
        float angle = atan(modelPosition.x, modelPosition.z);
        float distanceToCenter = length(modelPosition.xz);
        float angleOffset = (1.0 / distanceToCenter) *uTime * 0.1;
        angle += angleOffset;
        modelPosition.x = cos(angle) * distanceToCenter; // Okay mess with this and the one under to have some
        modelPosition.z = sin(angle) * distanceToCenter; // crazy galaxy, worth spending some time on that.
  
        // Randomness
        modelPosition.xyz += aRandomness;
  
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
  
        // Size
        gl_PointSize = uSize * aScale;
        gl_PointSize *= (1.0 / -viewPosition.z);
  
        // Color
        vColor = color;
      }
      `,
      fragmentShader: `
      varying vec3 vColor;
  
      void main() {
        // Choose your Pokemon
  
        // // Disc
        // float strength = distance(gl_PointCoord, vec2(0.5)); // Figure out the distance of the particle and his the center.
        // strength = step(0.5, strength); // Make it closer to the edges.
        // strength = 1.0 - strength; // Invert it to get the circle.
  
        // // Diffuse point
        // float strength = distance(gl_PointCoord, vec2(0.5));
        // strength *= 2.0;
        // strength = 1.0 - strength;
        
        // Light point (Personal Favorite)
        float strength = distance(gl_PointCoord, vec2(0.5));
        strength = 1.0 - strength;
        strength = pow(strength, 10.0);
  
        // Final
        vec3 color = mix(vec3(0.0), vColor, strength);
  
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>;
      }
      `,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 8 * renderer.getPixelRatio()}
      }
    })
  
    // Points
    points = new THREE.Points(geometry, material);
    scene.add(points); // This add all the particles to the scene.

    // Need to be access outside of this scope
    twirlMaterial = material;
  }
  
  gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(TwirlGalaxy);
  gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(TwirlGalaxy);
  gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(TwirlGalaxy);
  gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(TwirlGalaxy);
  gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(TwirlGalaxy);
  gui.addColor(parameters, 'insideColor').onFinishChange(TwirlGalaxy);
  gui.addColor(parameters, 'outsideColor').onFinishChange(TwirlGalaxy);

  TwirlParameters();
}

// Size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})

// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Generate Galaxy
//TwirlGalaxy();

// Animate
const clock = new THREE.Clock();

const tick = () =>
{
  const elapsedTime = clock.getElapsedTime();

  // Update material
  //twirlMaterial.uniforms.uTime.value = elapsedTime; // For Twirl Galaxy Comment if no twirl (Gotta fix that, no need to be manual thing).

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
}

tick();