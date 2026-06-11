export class GalacticMap {
  constructor() {
    this.visible = false
    this._buildUI()
    this._listenKeys()
  }

  _buildUI() {
    // Overlay panel
    this.panel = document.createElement('div')
    this.panel.id = 'galactic-map'
    this.panel.innerHTML = `
      <div id="gmap-header">
        <span>◈ GALACTIC MAP</span>
        <span id="gmap-close" style="cursor:pointer;opacity:0.5">✕ CLOSE [N]</span>
      </div>
      <canvas id="gmap-canvas"></canvas>
      <div id="gmap-info">Hover a node to inspect · Click to travel</div>
    `
    document.body.appendChild(this.panel)

    // Add styles
    const style = document.createElement('style')
    style.textContent = `
      #galactic-map {
        position: fixed; inset: 0;
        z-index: 40;
        background: rgba(0, 0, 10, 0.92);
        backdrop-filter: blur(8px);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      #galactic-map.visible { display: flex; }
      #gmap-header {
        display: flex; justify-content: space-between;
        width: 700px;
        font-family: 'Courier New', monospace;
        font-size: 13px; letter-spacing: 4px;
        color: #00f5ff;
        text-shadow: 0 0 20px #00f5ff;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(0,245,255,0.2);
      }
      #gmap-canvas {
        border: 1px solid rgba(0,245,255,0.15);
        border-radius: 4px;
      }
      #gmap-info {
        font-family: 'Courier New', monospace;
        font-size: 11px; letter-spacing: 2px;
        color: rgba(0,245,255,0.4);
      }
    `
    document.head.appendChild(style)

    // Build the map canvas
    this.mapCanvas = document.getElementById('gmap-canvas')
    this.mapCanvas.width = 700
    this.mapCanvas.height = 450
    this.mctx = this.mapCanvas.getContext('2d')

    // Define locations
    this.locations = [
      { name: 'MILKY WAY CORE',    x: 350, y: 225, type: 'galaxy',   color: '#00f5ff', radius: 18 },
      { name: 'ANDROMEDA',         x: 180, y: 100, type: 'galaxy',   color: '#9b59ff', radius: 14 },
      { name: 'TRIANGULUM',        x: 520, y: 90,  type: 'galaxy',   color: '#7b69ff', radius: 10 },
      { name: 'BLACK HOLE Ω-3',    x: 120, y: 280, type: 'blackhole',color: '#ff4400', radius: 12 },
      { name: 'BLACK HOLE Σ-7',    x: 580, y: 320, type: 'blackhole',color: '#ff2200', radius: 14 },
      { name: 'NEBULA ORION',      x: 260, y: 360, type: 'nebula',   color: '#ff69b4', radius: 16 },
      { name: 'NEBULA CRAB',       x: 480, y: 380, type: 'nebula',   color: '#ff8800', radius: 12 },
      { name: 'WORMHOLE ALPHA',    x: 90,  y: 160, type: 'wormhole', color: '#8800ff', radius: 11 },
      { name: 'WORMHOLE BETA',     x: 610, y: 180, type: 'wormhole', color: '#6600cc', radius: 11 },
      { name: 'PULSAR PSR-01',     x: 350, y: 80,  type: 'pulsar',   color: '#ffffff', radius: 7  },
      { name: 'QUASAR QSO-99',     x: 200, y: 220, type: 'quasar',   color: '#ffff00', radius: 9  },
      { name: 'DARK VOID',         x: 460, y: 240, type: 'void',     color: '#223344', radius: 20 },
    ]

    // Connections between locations
    this.connections = [
      [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
      [1,7],[2,8],[1,10],[3,7],[4,8],
      [5,6],[5,3],[6,4],[9,0],[10,0],[11,4]
    ]

    this.hovered = null
    this._draw()
    this._bindMapEvents()

    document.getElementById('gmap-close').addEventListener('click', () => this.hide())
  }

  _draw() {
    const ctx = this.mctx
    const W = 700, H = 450

    // Background
    ctx.fillStyle = '#000008'
    ctx.fillRect(0, 0, W, H)

    // Background stars
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.3})`
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
    }

    // Draw connections
    this.connections.forEach(([a, b]) => {
      const la = this.locations[a]
      const lb = this.locations[b]
      ctx.beginPath()
      ctx.moveTo(la.x, la.y)
      ctx.lineTo(lb.x, lb.y)
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.08)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw nodes
    this.locations.forEach((loc, i) => {
      const isHovered = this.hovered === i
      const glow = isHovered ? 30 : 15

      // Outer glow
      const gradient = ctx.createRadialGradient(loc.x, loc.y, 0, loc.x, loc.y, loc.radius * 2.5)
      gradient.addColorStop(0, loc.color + 'aa')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(loc.x, loc.y, loc.radius * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Node body
      ctx.beginPath()
      ctx.arc(loc.x, loc.y, loc.radius * (isHovered ? 1.3 : 1), 0, Math.PI * 2)

      if (loc.type === 'blackhole') {
        ctx.fillStyle = '#000'
        ctx.fill()
        ctx.strokeStyle = loc.color
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (loc.type === 'wormhole') {
        ctx.fillStyle = 'transparent'
        ctx.strokeStyle = loc.color
        ctx.lineWidth = 2
        ctx.stroke()
        // Inner ring
        ctx.beginPath()
        ctx.arc(loc.x, loc.y, loc.radius * 0.5, 0, Math.PI * 2)
        ctx.strokeStyle = loc.color + '88'
        ctx.stroke()
      } else {
        ctx.fillStyle = loc.color + '44'
        ctx.fill()
        ctx.strokeStyle = loc.color
        ctx.lineWidth = isHovered ? 2 : 1
        ctx.stroke()
      }

      // Label
      ctx.fillStyle = isHovered ? loc.color : loc.color + '99'
      ctx.font = isHovered ? '10px Courier New' : '9px Courier New'
      ctx.textAlign = 'center'
      ctx.fillText(loc.name, loc.x, loc.y + loc.radius + 14)
    })

    // Type legend
    const types = [
      { label: '● GALAXY',    color: '#00f5ff' },
      { label: '◉ BLACK HOLE',color: '#ff4400' },
      { label: '❋ NEBULA',    color: '#ff69b4' },
      { label: '⊕ WORMHOLE',  color: '#8800ff' },
      { label: '✦ PULSAR',    color: '#ffffff'  },
    ]
    types.forEach((t, i) => {
      ctx.fillStyle = t.color
      ctx.font = '9px Courier New'
      ctx.textAlign = 'left'
      ctx.fillText(t.label, 12, 20 + i * 16)
    })
  }

  _bindMapEvents() {
    this.mapCanvas.addEventListener('mousemove', (e) => {
      const rect = this.mapCanvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let found = null
      this.locations.forEach((loc, i) => {
        const dx = mx - loc.x
        const dy = my - loc.y
        if (Math.sqrt(dx * dx + dy * dy) < loc.radius + 8) found = i
      })

      if (found !== this.hovered) {
        this.hovered = found
        this._draw()
        if (found !== null) {
          const loc = this.locations[found]
          document.getElementById('gmap-info').textContent =
            `[ ${loc.name} ] — TYPE: ${loc.type.toUpperCase()} — CLICK TO TRAVEL`
        } else {
          document.getElementById('gmap-info').textContent =
            'Hover a node to inspect · Click to travel'
        }
      }
    })

    this.mapCanvas.addEventListener('click', (e) => {
      if (this.hovered === null) return
      const loc = this.locations[this.hovered]
      this._travel(loc)
    })
  }

  _travel(loc) {
    document.getElementById('gmap-info').textContent =
      `TRAVELING TO ${loc.name}...`

    // Flash effect
    const flash = document.createElement('div')
    flash.style.cssText = `
      position:fixed;inset:0;z-index:45;
      background:${loc.color};opacity:0;
      pointer-events:none;transition:opacity 0.2s;
    `
    document.body.appendChild(flash)
    setTimeout(() => { flash.style.opacity = '0.3' }, 10)
    setTimeout(() => { flash.style.opacity = '0' }, 300)
    setTimeout(() => { flash.remove() }, 600)

    // Announce
    const announce = document.getElementById('mode-announce')
    announce.style.color = loc.color
    announce.style.textShadow = `0 0 40px ${loc.color}`
    announce.textContent = `ARRIVED: ${loc.name}`
    announce.style.opacity = '1'
    setTimeout(() => { announce.style.opacity = '0' }, 2500)

    this.hide()
  }

  _listenKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'n') this.toggle()
    })
  }

  toggle() { this.visible ? this.hide() : this.show() }
  show() { this.visible = true; this.panel.classList.add('visible'); this._draw() }
  hide() { this.visible = false; this.panel.classList.remove('visible') }
}