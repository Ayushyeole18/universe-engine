export class RealityFracture {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = `
      position:fixed;inset:0;z-index:25;
      pointer-events:none;
      width:100%;height:100%;
    `
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.cracks = []
    this.active = false
    this._resize()
    window.addEventListener('resize', () => this._resize())
    this._scheduleRandom()
  }

  _resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  _scheduleRandom() {
    // Random fracture every 20-40 seconds
    const delay = 20000 + Math.random() * 20000
    setTimeout(() => {
      this.trigger()
      this._scheduleRandom()
    }, delay)
  }

  trigger() {
    if (this.active) return
    this.active = true
    this.cracks = []

    // Announce
    const announce = document.getElementById('mode-announce')
    announce.style.color = '#ff0000'
    announce.style.textShadow = '0 0 40px #ff0000'
    announce.textContent = 'REALITY FRACTURE DETECTED'
    announce.style.opacity = '1'
    setTimeout(() => { announce.style.opacity = '0' }, 2000)

    // Generate crack origins
    const origins = 3 + Math.floor(Math.random() * 3)
    for (let o = 0; o < origins; o++) {
      const ox = window.innerWidth * (0.2 + Math.random() * 0.6)
      const oy = window.innerHeight * (0.2 + Math.random() * 0.6)
      this._generateCrack(ox, oy, 0, 8 + Math.random() * 6)
    }

    // Animate in
    let alpha = 0
    const fadeIn = setInterval(() => {
      alpha = Math.min(alpha + 0.05, 1)
      this._draw(alpha)
      if (alpha >= 1) clearInterval(fadeIn)
    }, 30)

    // Hold, then heal
    setTimeout(() => {
      let fadeAlpha = 1
      const fadeOut = setInterval(() => {
        fadeAlpha = Math.max(fadeAlpha - 0.02, 0)
        this._draw(fadeAlpha)
        if (fadeAlpha <= 0) {
          clearInterval(fadeOut)
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
          this.active = false

          // "Self-healed" message
          const announce = document.getElementById('mode-announce')
          announce.style.color = '#00ff88'
          announce.textContent = 'REALITY SELF-HEALED'
          announce.style.opacity = '1'
          setTimeout(() => { announce.style.opacity = '0' }, 1500)
        }
      }, 40)
    }, 3500)
  }

  _generateCrack(x, y, depth, length) {
    if (depth > 5 || length < 10) return
    const angle = Math.random() * Math.PI * 2
    const endX = x + Math.cos(angle) * length
    const endY = y + Math.sin(angle) * length
    this.cracks.push({ x1: x, y1: y, x2: endX, y2: endY, depth })

    // Branch
    const branches = depth < 2 ? 3 : 2
    for (let b = 0; b < branches; b++) {
      this._generateCrack(endX, endY, depth + 1, length * (0.5 + Math.random() * 0.3))
    }
  }

  _draw(alpha) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.cracks.forEach(crack => {
      const lineAlpha = alpha * (1 - crack.depth * 0.15)
      ctx.beginPath()
      ctx.moveTo(crack.x1, crack.y1)
      ctx.lineTo(crack.x2, crack.y2)

      // White crack line
      ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha * 0.9})`
      ctx.lineWidth = Math.max(0.5, 2 - crack.depth * 0.3)
      ctx.stroke()

      // Red glow underneath
      ctx.strokeStyle = `rgba(255, 50, 0, ${lineAlpha * 0.5})`
      ctx.lineWidth = Math.max(1, 4 - crack.depth * 0.5)
      ctx.stroke()
    })

    // Vignette darkening at crack origins
    if (this.cracks.length > 0) {
      const first = this.cracks[0]
      const grad = ctx.createRadialGradient(first.x1, first.y1, 0, first.x1, first.y1, 200)
      grad.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.15})`)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }
}