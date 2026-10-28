import * as THREE from 'three'
import { useRef, useEffect } from 'react'

export default function NeuralScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x02040a, 0.02)

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(0, 2, 6)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Nube de partículas flotantes
    const particleCount = 400
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      colors[i * 3] = 34 / 255
      colors[i * 3 + 1] = 211 / 255
      colors[i * 3 + 2] = 238 / 255
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.8 })
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Anillo orbital
    const ringGeometry = new THREE.RingGeometry(1.8, 2, 64)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    scene.add(ring)

    const orbLight = new THREE.PointLight(0x22d3ee, 2, 10)
    orbLight.position.set(0, 0, 0)
    scene.add(orbLight)

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    scene.add(ambientLight)

    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.01
      particles.rotation.y = time * 0.1
      particles.rotation.x = Math.sin(time * 0.5) * 0.1
      ring.rotation.z = time * 0.2
      orbLight.intensity = 1 + Math.sin(time * 2) * 0.5
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 -z-10" />
}
