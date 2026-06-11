export class AICore {
  constructor() {
    this.log = document.getElementById('ai-log')
    this.responses = {
      idle: [
        'Monitoring spacetime curvature... nominal.',
        'Dark matter density: 26.8% of total mass-energy.',
        'Hawking radiation detected at black hole cluster Ω-3.',
        'Quantum fluctuations within acceptable parameters.',
        'Cosmic microwave background: 2.725 K.',
        'Gravitational wave frequency: 0.001 Hz.',
        'Stellar nucleosynthesis ongoing in sector 7.',
        'Neutrino flux: 65 billion per cm² per second.',
      ],
      timeDilation: [
        'WARNING: Temporal distortion field activated.',
        'Time dilation factor: 6.67 × local frame.',
        'Relativistic effects observable. Lorentz factor increasing.',
        'Causality maintained — barely.',
      ],
      hyperSpeed: [
        'Engaging hyperdrive. Alcubierre metric: stable.',
        'WARNING: Cherenkov radiation detected.',
        'Faster-than-light travel: exotic matter consumed.',
        'Destination: unknown. Trajectory: impossible.',
      ],
      quantum: [
        'Quantum superposition initiated. Reality fragmenting.',
        'Wave function: uncollapsed. Observer required.',
        'Schrödinger state: both alive and terminated.',
        'Quantum entanglement detected across 14 dimensions.',
      ],
      glitch: [
        'CRITICAL: Spacetime integrity compromised.',
        'ERROR: Reality.exe has encountered a fatal exception.',
        'Temporal paradox detected. Attempting self-repair.',
        'D̷A̷T̷A̷ ̷C̷O̷R̷R̷U̷P̷T̷I̷O̷N̷ ̷D̷E̷T̷E̷C̷T̷E̷D̷',
      ],
      collapse: [
        'WARNING: Gravitational collapse sequence initiated.',
        'CRITICAL: Black holes merging. Singularity forming.',
        'All matter converging to a single point.',
        'Universe termination in progress...',
        'UNIVERSE CORE OFFLINE.',
      ]
    }
    this._idleTimer = null
    this._startIdleLoop()
  }

  _startIdleLoop() {
    const loop = () => {
      this._addMessage(this._random('idle'))
      this._idleTimer = setTimeout(loop, 4000 + Math.random() * 4000)
    }
    this._idleTimer = setTimeout(loop, 2000)
  }

  _random(category) {
    const arr = this.responses[category]
    return arr[Math.floor(Math.random() * arr.length)]
  }

  _addMessage(text) {
    const line = document.createElement('div')
    line.style.marginBottom = '4px'
    line.style.opacity = '0'
    line.style.transition = 'opacity 0.3s'
    line.textContent = '> ' + text
    this.log.appendChild(line)
    requestAnimationFrame(() => { line.style.opacity = '1' })

    // Keep only last 6 messages
    while (this.log.children.length > 6) {
      this.log.removeChild(this.log.firstChild)
    }
    this.log.scrollTop = this.log.scrollHeight
  }

  react(event) {
    clearTimeout(this._idleTimer)
    const msg = this._random(event) || this._random('idle')
    this._addMessage(msg)
    setTimeout(() => this._startIdleLoop(), 5000)
  }
}