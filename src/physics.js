export class PhysicsEngine {
  constructor(fabricCanvas) {
    this.canvas = fabricCanvas
    this.ctx = fabricCanvas.getContext('2d')
    this.particles = []
    this.mouse = { x: 0, y: 0, active: false }
    this.gravityStrength = 1.0
    this.darkMatterBodies = []
    this.clickGravityPoints = [] // NEW — click-based gravity wells
    this._resize()
    this._spawnParticles(200)
    this._spawnDarkMatter()
    window.addEventListener('resize', () => this._resize())
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
      this.mouse.active = true
    })
    // NEW — click creates a temporary downward gravity burst
    window.addEventListener('click', (e) => {
      this._clickGravityBurst(e.clientX, e.clientY)
    })
  }

  _resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.W = window.innerWidth
    this.H = window.innerHeight
  }

  _spawnParticles(n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        mass: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
        hue: Math.random() * 60 + 180,
        life: 1.0,
        falling: false // NEW
      })
    }
  }

  _spawnDarkMatter() {
    for (let i = 0; i < 5; i++) {
      this.darkMatterBodies.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        mass: 3 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      })
    }
  }

  // NEW — click creates a gravity well that pulls everything DOWN
  _clickGravityBurst(cx, cy) {
    // Add a temporary gravity point at click location
    const point = {
      x: cx,
      y: cy,
      strength: 12,
      radius: 300,
      life: 1.0,         // fades out over time
      downwardBias: 8    // extra downward pull
    }
    this.clickGravityPoints.push(point)

    // Spawn burst particles at click
    this.addParticles(30, cx, cy)

    // Pull nearby particles downward
    this.particles.forEach(p => {
      const dx = p.x - cx
      const dy = p.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 350) {
        const force = (1 - dist / 350) * 6
        p.vx += dx / dist * -force * 0.3   // slight inward
        p.vy += force * 1.8                 // strong downward
        p.falling = true
      }
    })

    // UI element fall effect — shake and drop
    this._dropUIElements(cx, cy)
  }

  // NEW — makes UI panels visually "fall" then bounce back
  _dropUIElements(cx, cy) {
    const elements = [
      { id: 'hud', delay: 0 },
      { id: 'key-guide', delay: 80 },
      { id: 'ai-terminal', delay: 120 },
      { id: 'collapse-btn-wrap', delay: 160 },
    ]

    elements.forEach(({ id, delay }) => {
      const el = document.getElementById(id)
      if (!el) return

      // Distance from click to element center
      const rect = el.getBoundingClientRect()
      const ex = rect.left + rect.width / 2
      const ey = rect.top + rect.height / 2
      const dx = ex - cx
      const dy = ey - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const impact = Math.max(0, 1 - dist / 700) // closer = more impact

      if (impact < 0.05) return // too far, skip

      const fallY = 18 * impact
      const fallX = (dx / Math.max(dist, 1)) * 6 * impact

      setTimeout(() => {
        // Drop down
        el.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        el.style.transform = `translate(${fallX}px, ${fallY}px)`

        // Bounce back with spring
        setTimeout(() => {
          el.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          el.style.transform = 'translate(0px, 0px)'
        }, 150)

        // Clean up
        setTimeout(() => {
          el.style.transition = ''
          el.style.transform = ''
        }, 800)
      }, delay)
    })
  }

  addParticles(n, x, y) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: x || Math.random() * this.W,
        y: y || Math.random() * this.H,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        mass: 0.5 + Math.random() * 2,
        size: 1 + Math.random() * 3,
        hue: Math.random() * 360,
        life: 1.0,
        falling: false
      })
    }
    if (this.particles.length > 800) {
      this.particles.splice(0, this.particles.length - 800)
    }
  }

  _applyGravity(p, bx, by, mass, strength) {
    const dx = bx - p.x
    const dy = by - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5 || dist > 400) return
    const force = (strength * mass * p.mass) / (dist * dist)
    p.vx += (dx / dist) * force
    p.vy += (dy / dist) * force
  }

  _drawFabric() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.W, this.H)

    const GRID = 50
    const cols = Math.ceil(this.W / GRID) + 1
    const rows = Math.ceil(this.H / GRID) + 1

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = col * GRID
        const gy = row * GRID

        let wx = 0, wy = 0

        // Mouse warp
        if (this.mouse.active) {
          const dx = gx - this.mouse.x
          const dy = gy - this.mouse.y
          const d = Math.sqrt(dx * dx + dy * dy)
          const pull = Math.max(0, 80 - d) * 0.4
          wx += -(dx / Math.max(d, 1)) * pull
          wy += -(dy / Math.max(d, 1)) * pull
        }

        // Click gravity warp — bends grid downward
        this.clickGravityPoints.forEach(pt => {
          const dx = gx - pt.x
          const dy = gy - pt.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < pt.radius) {
            const pull = (1 - d / pt.radius) * pt.strength * pt.life
            wx += -(dx / Math.max(d, 1)) * pull * 0.3
            wy += pull * 1.2 // downward bias on grid
          }
        })

        if (!this._grid) this._grid = []
        if (!this._grid[row]) this._grid[row] = []
        this._grid[row][col] = { x: gx + wx, y: gy + wy }
      }
    }

    // Draw horizontal lines
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.07)'
    ctx.lineWidth = 0.5
    for (let row = 0; row < rows; row++) {
      ctx.beginPath()
      for (let col = 0; col < cols; col++) {
        const pt = this._grid[row][col]
        col === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
      }
      ctx.stroke()
    }

    // Draw vertical lines
    for (let col = 0; col < cols; col++) {
      ctx.beginPath()
      for (let row = 0; row < rows; row++) {
        const pt = this._grid[row][col]
        row === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
      }
      ctx.stroke()
    }

    // Draw click gravity ripples
    this.clickGravityPoints.forEach(pt => {
      if (pt.life <= 0) return
      const radius = (1 - pt.life) * pt.radius
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0, 245, 255, ${pt.life * 0.3})`
      ctx.lineWidth = 1
      ctx.stroke()

      // Second ripple
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, radius * 0.5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(155, 89, 255, ${pt.life * 0.2})`
      ctx.stroke()
    })
  }

  _drawParticles() {
    const ctx = this.ctx
    this.particles.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.life * 0.8})`
      ctx.fill()
    })
  }

  update(timeDilation = false) {
    const speed = timeDilation ? 0.15 : 1.0

    // Decay click gravity points
    this.clickGravityPoints = this.clickGravityPoints.filter(pt => {
      pt.life -= 0.012 * speed
      pt.strength *= 0.97
      return pt.life > 0
    })

    // Move dark matter
    this.darkMatterBodies.forEach(dm => {
      dm.x += dm.vx * speed
      dm.y += dm.vy * speed
      if (dm.x < 0 || dm.x > this.W) dm.vx *= -1
      if (dm.y < 0 || dm.y > this.H) dm.vy *= -1
    })

    // Update particles
    this.particles.forEach(p => {
      // Mouse gravity
      if (this.mouse.active) {
        this._applyGravity(p, this.mouse.x, this.mouse.y, 8, 0.0015 * this.gravityStrength)
      }

      // Dark matter gravity
      this.darkMatterBodies.forEach(dm => {
        this._applyGravity(p, dm.x, dm.y, dm.mass, 0.0008 * this.gravityStrength)
      })

      // Click gravity points — pull down
      this.clickGravityPoints.forEach(pt => {
        const dx = pt.x - p.x
        const dy = pt.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < pt.radius && dist > 2) {
          const force = (pt.strength * pt.life) / (dist * 0.8)
          p.vx += (dx / dist) * force * 0.01
          p.vy += force * 0.035  // downward bias
        }
      })

      // Damping
      p.vx *= 0.99
      p.vy *= 0.99

      // Max speed
      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (spd > 8) { p.vx = (p.vx / spd) * 8; p.vy = (p.vy / spd) * 8 }

      p.x += p.vx * speed
      p.y += p.vy * speed

      // Wrap edges
      if (p.x < 0) p.x = this.W
      if (p.x > this.W) p.x = 0
      if (p.y < 0) p.y = this.H
      if (p.y > this.H) p.y = 0
    })

    this._drawFabric()
    this._drawParticles()

    const el = document.getElementById('particle-count')
    if (el) el.textContent = this.particles.length + ' PARTICLES'
  }

  setGravityStrength(v) { this.gravityStrength = v }
}