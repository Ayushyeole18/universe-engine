export class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.ambienceNode = null
    this.initialized = false
    // Initialize on first user interaction
    document.addEventListener('click', () => this._init(), { once: true })
    document.addEventListener('keydown', () => this._init(), { once: true })
  }

  _init() {
    if (this.initialized) return
    this.initialized = true
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.3
    this.masterGain.connect(this.ctx.destination)
    this._startAmbience()
    this._listenToEvents()
  }

  _startAmbience() {
    // Deep cosmic hum — layered oscillators
    const freqs = [40, 60, 80, 110]
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.04
      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start()
      // Slow wobble
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.1 + Math.random() * 0.2
      lfoGain.gain.value = freq * 0.03
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()
    })
  }

  _playTone(freq, type, duration, volume = 0.15) {
    if (!this.initialized) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  _playNoise(duration, volume = 0.1) {
    if (!this.initialized) return
    const bufferSize = this.ctx.sampleRate * duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.gain.setValueAtTime(volume, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    gain.connect(this.masterGain)
    source.start()
  }

  _listenToEvents() {
    window.addEventListener('timeDilation', (e) => {
      if (e.detail.on) {
        this._playTone(60, 'sawtooth', 2, 0.2)
        this.masterGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 1)
      } else {
        this._playTone(120, 'sine', 1, 0.15)
        this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5)
      }
    })

    window.addEventListener('hyperSpeed', (e) => {
      if (e.detail.on) {
        this._playTone(200, 'sawtooth', 0.5, 0.2)
        setTimeout(() => this._playTone(400, 'sawtooth', 0.5, 0.2), 200)
        setTimeout(() => this._playTone(800, 'sawtooth', 1.0, 0.2), 400)
      }
    })

    window.addEventListener('cosmicStorm', () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this._playNoise(0.3, 0.15), i * 200)
        setTimeout(() => this._playTone(80 + i * 40, 'sawtooth', 0.3, 0.1), i * 200)
      }
    })

    window.addEventListener('universeCollapse', () => {
      this._playTone(40, 'sawtooth', 8, 0.3)
      this._playNoise(3, 0.2)
    })
  }

  playCollapseAlarm() {
    if (!this.initialized) return
    let freq = 880
    const interval = setInterval(() => {
      this._playTone(freq, 'square', 0.2, 0.2)
      freq = freq === 880 ? 440 : 880
    }, 300)
    setTimeout(() => clearInterval(interval), 4000)
  }

  playTerminated() {
    if (!this.initialized) return
    this._playTone(30, 'sine', 4, 0.4)
    this._playNoise(2, 0.15)
  }
}