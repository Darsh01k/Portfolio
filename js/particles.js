class ParticleSystem {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clock = new THREE.Clock();
    this.rafId = 0;
    this.orbs = [];
    this.init();
  }

  init() {
    const container = document.getElementById('particle-canvas');
    if (!container) return;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    this.camera.position.z = 50;

    const colors = ['#5266eb','#e8a838','#8b5cf6','#ec4899','#14b8a6','#6366f1','#a855f7','#f97316'];
    const texSize = 128;

    for (let i = 0; i < 10; i++) {
      const color = colors[i % colors.length];
      const canvas = document.createElement('canvas');
      canvas.width = texSize;
      canvas.height = texSize;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(texSize/2, texSize/2, 0, texSize/2, texSize/2, texSize/2);
      grad.addColorStop(0, color);
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, texSize, texSize);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.06 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      // orb 0 = very large, orb 1 = very small, rest random
      let size;
      if (i === 0) size = 14;
      else if (i === 1) size = 1.2;
      else size = 3 + Math.random() * 6;

      const sprite = new THREE.Sprite(material);
      sprite.scale.set(size, size, 1);

      const orb = {
        sprite,
        baseX: (Math.random() - 0.5) * 100,
        baseY: (Math.random() - 0.5) * 100,
        baseZ: -25 + Math.random() * 50,
        depthFactor: 0.1 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        breatheSpeed: 0.2 + Math.random() * 0.3,
        breatheAmp: 0.03 + Math.random() * 0.06,
        baseScale: size,
      };
      sprite.position.set(orb.baseX, orb.baseY, orb.baseZ);
      this.scene.add(sprite);
      this.orbs.push(orb);
    }

    document.addEventListener('mousemove', (e) => {
      this.mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(this.rafId); }
      else { this.animate(); }
    });

    this.animate();
  }

  animate() {
    this.rafId = requestAnimationFrame(() => this.animate());
    if (document.hidden) return;

    const t = this.clock.getElapsedTime();

    // Smooth mouse follow
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.05;

    const maxShift = 20;

    for (const orb of this.orbs) {
      const df = orb.depthFactor;
      orb.sprite.position.x = orb.baseX + this.mouse.x * maxShift * df;
      orb.sprite.position.y = orb.baseY + this.mouse.y * maxShift * df;

      const breathe = 1 + Math.sin(t * orb.breatheSpeed + orb.phase) * orb.breatheAmp;
      const s = orb.baseScale * breathe;
      orb.sprite.scale.set(s, s, 1);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

let particleInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE !== 'undefined' && document.getElementById('particle-canvas')) {
    particleInstance = new ParticleSystem();
  }
});
