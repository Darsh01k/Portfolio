import { initParticles } from './particles.js';

const container = document.getElementById('particles-bg');
if (container) {
  initParticles(container, {
    particleColors: ['#ffffff'],
    particleCount: 400,
    particleSpread: 10,
    speed: 0.1,
    moveParticlesOnHover: false,
    alphaParticles: true,
    particleBaseSize: 80,
    sizeRandomness: 1,
    cameraDistance: 20,
    disableRotation: false,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  });
}
