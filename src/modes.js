import { gsap } from 'gsap'

export class ModeManager {
  constructor(universe, physics) {
    this.universe = universe
    this.physics = physics
    this.active = {}
    this._listen()
  }

  _listen() {
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 't': this._toggle('time', () => this._timeDilation()); break
        case 'h': this._toggle('hyper', () => this._hyperSpeed()); break
        case 'q': this._toggle('quantum', () => this._quantumMode()); break
        case 'g': this._toggle('glitch', () => this._glitchField()); break
        case 'm': this._multiverse(); break
        case 'c': this._cosmicStorm(); break
      }
    })
  }

  _toggle(name, fn) {
    this.active[name] = !this.active[name]
    fn()
  }

  announce(text, color = '#00f5ff') {
    const el = document.getElementById('mode-announce')
    el.style.color = color
    el.style.textShadow = `0 0 40px ${color}, 0 0 80px ${color}`
    el.textContent = text
    el.style.opacity = '1'
    setTimeout(() => { el.style.opacity = '0' }, 2500)
    document.getElementById('mode-display').textContent = text
  }

  _timeDilation() {
    const on = this.active.time
    document.body.classList.toggle('time-dilation', on)
    this.universe.setTimeDilation(on)
    this.announce(on ? 'TIME DILATION ACTIVE' : 'TIME RESTORED', on ? '#ffd700' : '#00f5ff')
    // Audio pitch shift handled in audio.js via event
    window.dispatchEvent(new CustomEvent('timeDilation', { detail: { on } }))
  }

  _hyperSpeed() {
    const on = this.active.hyper
    document.body.classList.toggle('hyper-speed', on)
    this.universe.setHyperSpeed(on)
    this.physics.setGravityStrength(on ? 0.3 : 1.0)
    this.announce(on ? 'HYPER SPEED ENGAGED' : 'NORMAL SPEED', on ? '#ffffff' : '#00f5ff')
    window.dispatchEvent(new CustomEvent('hyperSpeed', { detail: { on } }))

    if (on) {
      // Stretch effect
      gsap.to('#universe-canvas', { scaleX: 1.0, scaleY: 0.95, duration: 0.3 })
    } else {
      gsap.to('#universe-canvas', { scaleX: 1, scaleY: 1, duration: 0.5 })
    }
  }

  _quantumMode() {
    const on = this.active.quantum
    document.body.classList.toggle('quantum-mode', on)
    this.announce(on ? 'QUANTUM MODE — SUPERPOSITION' : 'QUANTUM COLLAPSED', on ? '#cc44ff' : '#00f5ff')

    if (on) {
      // Duplicate and phase UI elements
      this.physics.addParticles(150)
      this._quantumInterval = setInterval(() => {
        const panels = document.querySelectorAll('#hud, #ai-terminal, #key-guide')
        panels.forEach(p => {
          gsap.to(p, {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 4,
            opacity: 0.5 + Math.random() * 0.5,
            duration: 0.2
          })
        })
      }, 300)
    } else {
      clearInterval(this._quantumInterval)
      gsap.to('#hud, #ai-terminal, #key-guide', { x: 0, y: 0, opacity: 1, duration: 0.5 })
    }
  }

  _glitchField() {
    const on = this.active.glitch
    document.body.classList.toggle('glitch-active', on)
    this.announce(on ? 'GLITCH FIELD ACTIVE' : 'REALITY RESTORED', on ? '#ff0044' : '#00f5ff')

    if (on) {
      this.physics.addParticles(100)
      this._glitchInterval = setInterval(() => {
        // Random RGB split on canvas
        const c = document.getElementById('universe-canvas')
        const offsets = [
          `translate(${(Math.random()-0.5)*6}px, 0) saturate(3)`,
          `translate(0, ${(Math.random()-0.5)*4}px) hue-rotate(${Math.random()*180}deg)`,
          `none`
        ]
        c.style.filter = offsets[Math.floor(Math.random() * 3)]
        setTimeout(() => { c.style.filter = 'none' }, 80)
      }, 150)
    } else {
      clearInterval(this._glitchInterval)
      document.getElementById('universe-canvas').style.filter = 'none'
    }
  }

  _multiverse() {
    const universes = [
      { bg: 0x050010, announce: 'UNIVERSE Ω — ANTIMATTER REALM', color: '#ff00ff' },
      { bg: 0x001505, announce: 'UNIVERSE Σ — DARK ENERGY PLANE', color: '#00ff88' },
      { bg: 0x100500, announce: 'UNIVERSE Λ — PLASMA DIMENSION', color: '#ff8800' },
      { bg: 0x000515, announce: 'UNIVERSE Θ — QUANTUM FOAM', color: '#0088ff' },
    ]
    const u = universes[Math.floor(Math.random() * universes.length)]

    gsap.to('#universe-canvas', {
      opacity: 0, duration: 0.5,
      onComplete: () => {
        this.universe.setMultiverseColor(u.bg)
        this.physics.addParticles(200)
        gsap.to('#universe-canvas', { opacity: 1, duration: 0.5 })
        this.announce(u.announce, u.color)
        // Reset after 6 seconds
        setTimeout(() => {
          gsap.to('#universe-canvas', {
            opacity: 0, duration: 0.5,
            onComplete: () => {
              this.universe.resetMultiverse()
              gsap.to('#universe-canvas', { opacity: 1, duration: 0.5 })
              this.announce('RETURNED TO PRIME UNIVERSE', '#00f5ff')
            }
          })
        }, 6000)
      }
    })
  }

  _cosmicStorm() {
    this.announce('COSMIC STORM UNLEASHED', '#ff6600')
    this.physics.addParticles(300)
    this.physics.setGravityStrength(3.0)

    // Screen shake
    let shakes = 0
    const shakeInterval = setInterval(() => {
      gsap.to('body', {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        duration: 0.05,
        onComplete: () => gsap.set('body', { x: 0, y: 0 })
      })
      shakes++
      if (shakes > 30) {
        clearInterval(shakeInterval)
        this.physics.setGravityStrength(1.0)
        this.announce('STORM SUBSIDING', '#00f5ff')
      }
    }, 100)

    window.dispatchEvent(new CustomEvent('cosmicStorm'))
  }
}