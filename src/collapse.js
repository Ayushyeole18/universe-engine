import { gsap } from 'gsap'

export class CollapseSequence {
  constructor(universe, physics, audio, aiCore) {
    this.universe = universe
    this.physics = physics
    this.audio = audio
    this.ai = aiCore
    this.running = false

    document.getElementById('collapse-btn').addEventListener('click', () => this.start())
    document.getElementById('recreate-btn').addEventListener('click', () => this.recreate())
  }

  start() {
    if (this.running) return
    this.running = true

    const overlay = document.getElementById('collapse-overlay')
    const phaseText = document.getElementById('collapse-phase-text')
    overlay.style.opacity = '1'
    overlay.classList.add('active')

    this.audio.playCollapseAlarm()
    this.ai.react('collapse')
    window.dispatchEvent(new CustomEvent('universeCollapse'))

    const phases = [
      { text: 'PHASE 1 — STELLAR COLLAPSE INITIATED', color: '#ffff00', delay: 0 },
      { text: 'PHASE 2 — GALAXIES DISTORTING', color: '#ff8800', delay: 3000 },
      { text: 'PHASE 3 — GRAVITY APPROACHING INFINITY', color: '#ff4400', delay: 6000 },
      { text: 'PHASE 4 — BLACK HOLES MERGING', color: '#ff2200', delay: 9000 },
      { text: 'PHASE 5 — SINGULARITY FORMING', color: '#ff0000', delay: 12000 },
      { text: 'PHASE 6 — ALL MATTER CONVERGING', color: '#ffffff', delay: 15000 },
    ]

    phases.forEach(({ text, color, delay }) => {
      setTimeout(() => {
        phaseText.textContent = text
        phaseText.style.color = color
        phaseText.style.textShadow = `0 0 60px ${color}`
        overlay.style.background = `radial-gradient(circle, transparent 0%, rgba(0,0,0,0.4) 100%)`
      }, delay)
    })

    // Progressive screen pull inward
    let progress = 0
    const collapseInterval = setInterval(() => {
      progress += 0.003
      this.universe.collapseToSingularity(progress)

      // Suck all UI toward center
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const factor = progress * 0.5
      gsap.to('#hud', { x: (cx - window.innerWidth / 2) * factor, y: cy * factor * 0.3, duration: 0.1 })
      gsap.to('#key-guide', { x: (cx - 80) * factor, y: -cy * factor * 0.3, duration: 0.1 })
      gsap.to('#ai-terminal', { x: -(cx - 180) * factor, y: -cy * factor * 0.3, duration: 0.1 })

      // Increase gravity spiral
      this.physics.setGravityStrength(1 + progress * 20)

      // Screen distortion
      if (progress > 0.3) {
        document.body.style.transform = `scale(${1 + progress * 0.1}) perspective(${800 - progress * 600}px)`
      }

      if (progress >= 1) {
        clearInterval(collapseInterval)
        this._terminate()
      }
    }, 50)

    // Camera shake
    let shakeCount = 0
    const shakeInterval = setInterval(() => {
      const intensity = shakeCount / 300 * 15
      gsap.to('#universe-canvas', {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
        duration: 0.05
      })
      shakeCount++
      if (shakeCount > 300) clearInterval(shakeInterval)
    }, 50)
  }

  _terminate() {
    this.audio.playTerminated()
    // Flash to white
    gsap.to('#collapse-overlay', {
      backgroundColor: '#ffffff',
      opacity: 1,
      duration: 0.5,
      onComplete: () => {
        // Then black
        gsap.to('#collapse-overlay', {
          backgroundColor: '#000000',
          duration: 1,
          onComplete: () => {
            document.getElementById('terminated-screen').classList.add('visible')
            document.getElementById('collapse-overlay').style.opacity = '0'
          }
        })
      }
    })
  }

  recreate() {
    document.getElementById('terminated-screen').classList.remove('visible')
    document.body.style.transform = ''
    document.getElementById('universe-canvas').style.transform = ''
    document.getElementById('hud').style.transform = ''
    document.getElementById('key-guide').style.transform = ''
    document.getElementById('ai-terminal').style.transform = ''
    document.getElementById('collapse-overlay').style.opacity = '0'
    document.getElementById('collapse-overlay').classList.remove('active')
    this.universe.collapseToSingularity(0)
    this.physics.setGravityStrength(1.0)
    this.physics.addParticles(200)
    this.running = false
    this.ai.react('idle')

    // Big bang flash
    gsap.from('#universe-canvas', { opacity: 0, scale: 0.01, duration: 2, ease: 'power4.out' })
  }
}