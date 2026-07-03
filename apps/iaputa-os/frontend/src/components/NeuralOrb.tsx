import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface NeuralOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
  volume?: number;
}

const COLORS = {
  idle:       { core: new THREE.Color(0x8b5cf6), glow: new THREE.Color(0x6366f1), particles: new THREE.Color(0xa78bfa), ambient: new THREE.Color(0x1a1a2e) },
  listening:  { core: new THREE.Color(0x00f5ff), glow: new THREE.Color(0x06b6d4), particles: new THREE.Color(0x22d3ee), ambient: new THREE.Color(0x0a1a2e) },
  thinking:   { core: new THREE.Color(0xff006e), glow: new THREE.Color(0xec4899), particles: new THREE.Color(0xf472b6), ambient: new THREE.Color(0x2e0a1a) },
  speaking:   { core: new THREE.Color(0x06ff8f), glow: new THREE.Color(0x10b981), particles: new THREE.Color(0x34d399), ambient: new THREE.Color(0x0a2e1a) },
  error:      { core: new THREE.Color(0xff0054), glow: new THREE.Color(0xef4444), particles: new THREE.Color(0xf87171), ambient: new THREE.Color(0x2e0a0a) },
};

const NeuralOrb: React.FC<NeuralOrbProps> = ({ state = 'idle', volume = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const ringsRef = useRef<THREE.Group | null>(null);
  const targetColorRef = useRef(COLORS.idle);
  const currentColorRef = useRef(COLORS.idle);

  const init = useCallback(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.offsetWidth / containerRef.current.offsetHeight, 0.1, 100);
    camera.position.z = 5;

    // Core Orb - Icosahedron with custom shader
    const orbGeometry = new THREE.IcosahedronGeometry(1.2, 4);
    const orbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: COLORS.idle.core },
        uVolume: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uVolume;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vUv = uv;
          vNormal = normal;
          vPosition = position;
          
          float noise = snoise(position * 1.5 + uTime * 0.5) * 0.15;
          noise += snoise(position * 3.0 + uTime * 0.3) * 0.08;
          noise += uVolume * snoise(position * 5.0 + uTime) * 0.1;
          
          vec3 newPosition = position + normal * noise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uVolume;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          // Fresnel effect
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
          
          // Inner glow
          float innerGlow = pow(max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
          
          // Color mix
          vec3 coreColor = uColor;
          vec3 glowColor = mix(uColor, vec3(1.0), 0.3);
          
          // Final color
          vec3 finalColor = mix(coreColor * 0.5, glowColor, fresnel);
          finalColor += vec3(1.0) * innerGlow * 0.3;
          finalColor += uVolume * 0.2;
          
          float alpha = 0.7 + fresnel * 0.3 + uVolume * 0.2;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);
    orbRef.current = orb;

    // Particle system
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(angle);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(angle);
      positions[i * 3 + 2] = radius * Math.cos(theta);
      
      sizes[i] = Math.random() * 4 + 1;
      angles[i] = angle;
      radii[i] = radius;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: COLORS.idle.particles },
        uVolume: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uVolume;
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          float angle = atan(pos.y, pos.x) + uTime * 0.2;
          float radius = length(pos.xy);
          pos.x = cos(angle) * radius;
          pos.y = sin(angle) * radius;
          pos.z += sin(uTime + length(pos) * 2.0) * 0.2;
          
          vAlpha = 0.3 + sin(uTime * 2.0 + length(pos)) * 0.3 + uVolume * 0.4;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (2.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Glowing rings
    const rings = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(1.5 + i * 0.4, 0.01, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: COLORS.idle.glow,
        transparent: true,
        opacity: 0.3 / (i + 1),
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + i * 0.3;
      ring.rotation.y = i * 0.5;
      rings.add(ring);
    }
    scene.add(rings);
    ringsRef.current = rings;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Point light
    const pointLight = new THREE.PointLight(COLORS.idle.core, 1, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Animation
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;

      // Smooth color transition
      const target = targetColorRef.current;
      const current = currentColorRef.current;
      current.core.lerp(target.core, 0.02);
      current.glow.lerp(target.glow, 0.02);
      current.particles.lerp(target.particles, 0.02);

      // Update orb uniforms
      if (orbMaterial.uniforms) {
        orbMaterial.uniforms.uTime.value = time;
        orbMaterial.uniforms.uColor.value.copy(current.core);
        orbMaterial.uniforms.uVolume.value = volume;
      }

      // Update particle uniforms
      if (particleMaterial.uniforms) {
        particleMaterial.uniforms.uTime.value = time;
        particleMaterial.uniforms.uColor.value.copy(current.particles);
        particleMaterial.uniforms.uVolume.value = volume;
      }

      // Rotate rings
      if (ringsRef.current) {
        ringsRef.current.children.forEach((ring, i) => {
          ring.rotation.z = time * (0.1 + i * 0.05);
          ring.rotation.x = Math.PI / 2 + Math.sin(time * 0.5 + i) * 0.3;
          (ring as THREE.Mesh).material.opacity = (0.3 / (i + 1)) * (0.5 + volume * 0.5);
          ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).color.copy(current.glow);
        });
      }

      // Scale orb with volume
      if (orbRef.current) {
        const scale = 1 + volume * 0.3;
        orbRef.current.scale.setScalar(scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update target color on state change
  useEffect(() => {
    targetColorRef.current = COLORS[state];
  }, [state]);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
};

export default NeuralOrb;
