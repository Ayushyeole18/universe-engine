import * as THREE from 'three'
import starVertexShader from './shaders/starVertex.glsl?raw'
import starFragmentShader from './shaders/starFragment.glsl?raw'

export class Universe {
  constructor(canvas) {
    this.canvas = canvas
    this.clock = new THREE.Clock()
    this.blackHoles = []
    this.wormholes = []
    this.hyperSpeed = false
    this.timeDilation = false
    this.multiverseColor = null
    this._init()
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000005)

    // Scene + Camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    this.camera.position.set(0, 0, 300)

    // Build everything
    this._buildStars()
    this._buildNebula()
    this._buildGalaxies()
    this._buildBlackHoles()
    this._buildWormholes()
    this._buildCosmicDust()

    // Resize
    window.addEventListener('resize', () => this._onResize())
  }

  _buildStars() {
    const COUNT = 15000
    const positions = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const brightness = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const r = 800 + Math.random() * 1200
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      sizes[i] = 0.3 + Math.random() * 2.5
      brightness[i] = 0.4 + Math.random() * 0.6
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.starField = new THREE.Points(geo, mat)
    this.scene.add(this.starField)
  }

  _buildNebula() {
    const nebulaColors = [0x3a0080, 0x800040, 0x004080, 0x008060]
    for (let n = 0; n < 4; n++) {
      const COUNT = 3000
      const positions = new Float32Array(COUNT * 3)
      const cx = (Math.random() - 0.5) * 600
      const cy = (Math.random() - 0.5) * 300
      const cz = -200 - Math.random() * 400

      for (let i = 0; i < COUNT; i++) {
        positions[i * 3]     = cx + (Math.random() - 0.5) * 300
        positions[i * 3 + 1] = cy + (Math.random() - 0.5) * 200
        positions[i * 3 + 2] = cz + (Math.random() - 0.5) * 100
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const mat = new THREE.PointsMaterial({
        color: nebulaColors[n],
        size: 4,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      this.scene.add(new THREE.Points(geo, mat))
    }
  }

  _buildGalaxies() {
    for (let g = 0; g < 3; g++) {
      const COUNT = 5000
      const positions = new Float32Array(COUNT * 3)
      const cx = (Math.random() - 0.5) * 800
      const cy = (Math.random() - 0.5) * 400
      const cz = -400 - Math.random() * 600

      for (let i = 0; i < COUNT; i++) {
        const arm = Math.floor(Math.random() * 2) * Math.PI
        const r = 20 + Math.random() * 120
        const angle = arm + r * 0.04 + (Math.random() - 0.5) * 0.8
        positions[i * 3]     = cx + r * Math.cos(angle)
        positions[i * 3 + 1] = cy + r * Math.sin(angle) * 0.4
        positions[i * 3 + 2] = cz + (Math.random() - 0.5) * 20
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const mat = new THREE.PointsMaterial({
        color: 0xaaddff,
        size: 1.2,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      this.scene.add(new THREE.Points(geo, mat))
    }
  }

  _buildBlackHoles() {
  const configs = [
    { pos: new THREE.Vector3(-120, 40, -80),  diskColor: 0xff6600, glowColor: 0xff3300, size: 10 },
    { pos: new THREE.Vector3(150, -60, -120), diskColor: 0xff3300, glowColor: 0xff1100, size: 14 },
    { pos: new THREE.Vector3(20, 100, -60),   diskColor: 0xff9900, glowColor: 0xffaa00, size: 8  },
  ]

  configs.forEach((cfg, i) => {
    const group = new THREE.Group()
    group.position.copy(cfg.pos)

    // Event horizon — pure black sphere
    const horizonGeo = new THREE.SphereGeometry(cfg.size, 32, 32)
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const horizon = new THREE.Mesh(horizonGeo, horizonMat)
    group.add(horizon)

    // Inner glow ring
    const innerGeo = new THREE.TorusGeometry(cfg.size * 1.4, cfg.size * 0.25, 16, 100)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.rotation.x = Math.PI / 2
    group.add(inner)

    // Accretion disk — multiple rings at different tilts
    for (let r = 0; r < 3; r++) {
      const diskGeo = new THREE.TorusGeometry(
        cfg.size * (2.2 + r * 0.8),
        cfg.size * (0.18 - r * 0.03),
        16, 100
      )
      const diskMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? cfg.diskColor : r === 1 ? cfg.glowColor : 0xffddaa,
        transparent: true,
        opacity: 0.8 - r * 0.2,
        blending: THREE.AdditiveBlending
      })
      const disk = new THREE.Mesh(diskGeo, diskMat)
      disk.rotation.x = Math.PI / 3 + r * 0.15
      disk.rotation.z = r * 0.2
      group.add(disk)
    }

    // Outer soft glow sphere (lensing effect)
    const lensGeo = new THREE.SphereGeometry(cfg.size * 3.5, 32, 32)
    const lensMat = new THREE.MeshBasicMaterial({
      color: cfg.glowColor,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
    const lens = new THREE.Mesh(lensGeo, lensMat)
    group.add(lens)

    // Jet beams (relativistic jets)
    const jetGeo = new THREE.CylinderGeometry(0.3, 2, cfg.size * 8, 8, 1, true)
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    const jetTop = new THREE.Mesh(jetGeo, jetMat)
    jetTop.position.y = cfg.size * 4
    const jetBottom = new THREE.Mesh(jetGeo, jetMat)
    jetBottom.position.y = -cfg.size * 4
    group.add(jetTop, jetBottom)

    // Orbiting debris particles
    const debrisCount = 80
    const debrisPositions = new Float32Array(debrisCount * 3)
    for (let d = 0; d < debrisCount; d++) {
      const angle = (d / debrisCount) * Math.PI * 2 + Math.random() * 0.3
      const orbitR = cfg.size * (1.6 + Math.random() * 2.5)
      debrisPositions[d * 3]     = Math.cos(angle) * orbitR
      debrisPositions[d * 3 + 1] = (Math.random() - 0.5) * cfg.size * 0.4
      debrisPositions[d * 3 + 2] = Math.sin(angle) * orbitR * 0.3
    }
    const debrisGeo = new THREE.BufferGeometry()
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3))
    const debrisMat = new THREE.PointsMaterial({
      color: cfg.diskColor,
      size: 0.8,
      transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    const debris = new THREE.Points(debrisGeo, debrisMat)
    group.add(debris)

    this.scene.add(group)
    this.blackHoles.push({
      group, inner, debris,
      disks: group.children.filter(c => c.geometry && c.geometry.type === 'TorusGeometry'),
      speed: 0.003 + i * 0.001
    })
  })
}

  _buildWormholes() {
    for (let w = 0; w < 2; w++) {
      const geo = new THREE.TorusGeometry(25, 8, 20, 60)
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8800ff,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        (w === 0 ? -200 : 200),
        (Math.random() - 0.5) * 100,
        -100 - Math.random() * 100
      )
      this.scene.add(mesh)
      this.wormholes.push(mesh)
    }
  }

  _buildCosmicDust() {
    const COUNT = 8000
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 1000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 500
      positions[i * 3 + 2] = -50 - Math.random() * 300
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0x664422,
      size: 0.8,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    this.scene.add(new THREE.Points(geo, mat))
  }

  update() {
    const t = this.clock.getElapsedTime()
    const speed = this.timeDilation ? 0.15 : this.hyperSpeed ? 4.0 : 1.0

    // Rotate star field slowly
    this.starField.rotation.y = t * 0.01 * speed
    this.starField.rotation.x = Math.sin(t * 0.005) * 0.05

    // Animate black holes
this.blackHoles.forEach((bh, i) => {
  bh.group.rotation.y += bh.speed * 0.3 * speed
  bh.disks.forEach((d, di) => {
    d.rotation.z += bh.speed * (1 + di * 0.4) * speed
  })
  if (bh.debris) bh.debris.rotation.y += bh.speed * 1.5 * speed
  if (bh.inner) {
    bh.inner.material.opacity = 0.7 + Math.sin(t * 3 + i) * 0.3
  }
})

    // Animate wormholes
    this.wormholes.forEach((w, i) => {
      w.rotation.x = t * 0.3 * speed
      w.rotation.y = t * 0.2 * speed
      w.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.05)
    })

    // Camera drift
    if (!this.hyperSpeed) {
      this.camera.position.x = Math.sin(t * 0.05) * 15
      this.camera.position.y = Math.cos(t * 0.03) * 8
      this.camera.position.z = 300 + Math.sin(t * 0.02) * 20
    } else {
      // Hyper speed — rush forward
      this.camera.position.z -= 3
      if (this.camera.position.z < -200) this.camera.position.z = 300
    }

    // Multiverse color tint
    if (this.multiverseColor) {
      this.renderer.setClearColor(this.multiverseColor)
    }

    this.renderer.render(this.scene, this.camera)
  }

  setHyperSpeed(on) { this.hyperSpeed = on }
  setTimeDilation(on) { this.timeDilation = on }
  setMultiverseColor(color) { this.multiverseColor = color }
  resetMultiverse() {
    this.multiverseColor = null
    this.renderer.setClearColor(0x000005)
  }

  collapseToSingularity(progress) {
    // progress 0→1: everything scales inward
    const s = 1 - progress * 0.98
    this.scene.scale.setScalar(Math.max(s, 0.02))
    this.camera.position.z = 300 - progress * 295
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}