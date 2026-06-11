import './style.css'
import { Universe } from './universe.js'
import { PhysicsEngine } from './physics.js'
import { ModeManager } from './modes.js'
import { AudioEngine } from './audio.js'
import { AICore } from './ai-core.js'
import { CollapseSequence } from './collapse.js'
import { GalacticMap } from './galactic-map.js'
import { RealityFracture } from './reality-fracture.js'

// Init all systems
const universeCanvas = document.getElementById('universe-canvas')
const fabricCanvas = document.getElementById('fabric-canvas')

const universe = new Universe(universeCanvas)
const physics = new PhysicsEngine(fabricCanvas)
const audio = new AudioEngine()
const aiCore = new AICore()
const modes = new ModeManager(universe, physics)
const collapse = new CollapseSequence(universe, physics, audio, aiCore)
const galacticMap = new GalacticMap()
const realityFracture = new RealityFracture()

// FPS counter
let lastTime = performance.now()
let frames = 0

// Main loop
function loop() {
  requestAnimationFrame(loop)

  frames++
  const now = performance.now()
  if (now - lastTime >= 1000) {
    document.getElementById('fps-counter').textContent = frames + ' FPS'
    frames = 0
    lastTime = now
  }

  const timeDilation = modes.active.time
  universe.update()
  physics.update(timeDilation)
}

loop()

// AI reacts to keyboard modes
window.addEventListener('keydown', (e) => {
  const map = {
    t: 'timeDilation',
    h: 'hyperSpeed',
    q: 'quantum',
    g: 'glitch',
    m: 'idle',
    c: 'idle',
    n: 'idle'
  }
  if (map[e.key.toLowerCase()]) aiCore.react(map[e.key.toLowerCase()])

  // R = manual reality fracture
  if (e.key.toLowerCase() === 'r') {
    realityFracture.trigger()
    aiCore.react('glitch')
  }
})

console.log('%c THE UNIVERSE ENGINE ', 'background:#000;color:#00f5ff;font-size:20px;letter-spacing:4px')
console.log('%c T H Q G M C — alter reality ', 'background:#000;color:#9b59ff;font-size:12px')
console.log('%c N — Galactic Map | R — Reality Fracture ', 'background:#000;color:#ff69b4;font-size:12px')