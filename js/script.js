document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');

  function startSite() {

  // ─── THEME TOGGLE ───
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  html.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ─── ROCKET CURSOR + RAF LOOP ───
  const rocket = document.getElementById('cursorRocket');
  let mx = 0, my = 0;
  let pRx = 0, pRy = 0;
  let rocketAngle = -90;
  let targetAngle = -90;
  const ANGLE_OFFSET = 45;

  // Cursor lock for rocket landing animation
  let cursorLocked = false;
  let lockX = 0, lockY = 0;
  let lockStartX = 0, lockStartY = 0;
  let lockStartTime = 0;
  let lockDuration = 400;
  let lockCallback = null;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Consolidated RAF loop: rocket position, blob parallax (NO DOM spawns)
  const blobs = document.querySelectorAll('.mesh-blob');
  let spawnInterval = null;

  function animateCursor() {
    if (!rocket) return;

    if (cursorLocked) {
      const elapsed = performance.now() - lockStartTime;
      const t = Math.min(elapsed / lockDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cx = lockStartX + (lockX - lockStartX) * ease;
      const cy = lockStartY + (lockY - lockStartY) * ease;
      const scale = 1 - ease * 0.35;
      rocket.style.transform = `translate(${cx - 16}px,${cy - 16}px) rotate(180deg) scale(${scale})`;
      if (t >= 1 && lockCallback) {
        for (let i = 0; i < 30; i++) {
          const s = document.createElement('div');
          s.className = 'spark';
          const a = Math.random() * Math.PI * 2;
          const d = 15 + Math.random() * 50;
          const sz = 3 + Math.random() * 6;
          s.style.cssText = `left:${lockX}px;top:${lockY}px;width:${sz}px;height:${sz}px;background:${['#e8a838','#f59e0b','#f97316','#5266eb'][Math.floor(Math.random()*4)]};--sx:${Math.cos(a)*d}px;--sy:${Math.sin(a)*d}px`;
          document.body.appendChild(s);
          setTimeout(() => { if (s.parentNode) s.remove(); }, 800);
        }
        for (let i = 0; i < 20; i++) spawnCloud(lockX, lockY);
        rocket.style.transform = `translate(${lockX - 16}px,${lockY - 16}px) rotate(180deg) scale(1)`;
        lockCallback();
        cursorLocked = false;
        lockCallback = null;
      }
    } else {
      const dx = mx - pRx;
      const dy = my - pRy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let diff = targetAngle - rocketAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        rocketAngle += diff * 0.15;
        rocket.style.transform = `translate(${mx - 16}px,${my - 16}px) rotate(${rocketAngle + ANGLE_OFFSET}deg)`;
      } else {
        rocket.style.transform = `translate(${mx - 16}px,${my - 16}px) rotate(${rocketAngle + ANGLE_OFFSET}deg)`;
      }
      pRx = mx;
      pRy = my;

      if (blobs.length) {
        const bx = (mx / window.innerWidth - 0.5) * 2;
        const by = (my / window.innerHeight - 0.5) * 2;
        blobs.forEach((blob, i) => {
          blob.style.transform = `translate(${bx * (5 + i * 3)}px, ${by * (5 + i * 3)}px)`;
        });
      }
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Decoupled DOM spawn: every 60ms, not in RAF
  function doSpawn() {
    if (cursorLocked || !rocket) return;
    spawnSparks(mx, my, rocketAngle, 6);
    spawnCloud(mx, my);
  }
  spawnInterval = setInterval(doSpawn, 60);

  function spawnSparks(x, y, angle, count) {
    const rad = (angle + 180 + ANGLE_OFFSET) * (Math.PI / 180);
    const colors = ['#e8a838', '#f59e0b', '#f97316', '#5266eb'];
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const scatter = rad + (Math.random() - 0.5) * 0.5;
      const d = 8 + Math.random() * 30;
      const sz = 2 + Math.random() * 5;
      s.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};--sx:${Math.cos(scatter)*d}px;--sy:${Math.sin(scatter)*d}px`;
      document.body.appendChild(s);
      setTimeout(() => { if (s.parentNode) s.remove(); }, 700);
    }
  }

  function spawnCloud(x, y) {
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('div');
      c.className = 'cloud-puff';
      const sz = 8 + Math.random() * 18;
      const driftX = (Math.random() - 0.5) * 24;
      c.style.cssText = `left:${x+(Math.random()-0.5)*12}px;top:${y+(Math.random()-0.5)*12}px;width:${sz}px;height:${sz}px;--cdx:${driftX}px`;
      document.body.appendChild(c);
      setTimeout(() => { if (c.parentNode) c.remove(); }, 2500);
    }
  }

  // Page Visibility: pause RAF + interval when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && spawnInterval) {
      clearInterval(spawnInterval);
      spawnInterval = null;
    } else if (!document.hidden && !spawnInterval) {
      spawnInterval = setInterval(doSpawn, 80);
    }
  });

  // ─── GENERAL ROCKET LANDING ───
  function landRocketOnElement(el, callback) {
    if (cursorLocked) return;
    const rect = el.getBoundingClientRect();
    lockX = rect.left + rect.width / 2;
    lockY = rect.top + rect.height / 2;
    lockStartX = mx;
    lockStartY = my;
    lockStartTime = performance.now();
    cursorLocked = true;
    lockCallback = callback;
  }

  // ─── PROJECT CARD ROCKET LANDING ───
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.project-link')) return;
      const name = this.dataset.project;
      if (name) {
        e.preventDefault();
        landRocketOnElement(this, () => {
          setTimeout(() => openProject(name), 150);
        });
      }
    });
  });

  // ─── BUTTONS & INTERACTIVE ELEMENTS LANDING ───
  function performAction(el) {
    const dataAction = el.dataset.action;
    if (dataAction && typeof window[dataAction] === 'function') {
      window[dataAction]();
      return;
    }
    const href = el.getAttribute('href');
    if (href && href !== '#') {
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open(href, el.target || '_self');
      }
    } else {
      el.click();
    }
  }

  document.querySelectorAll('.btn, .contact-card').forEach(el => {
    if (el.closest('#contactForm')) return;
    el.addEventListener('click', function(e) {
      if (cursorLocked) return;
      const hasAction = this.dataset.action || (this.getAttribute('href') && this.getAttribute('href') !== '#');
      if (!hasAction) return;
      e.preventDefault();
      landRocketOnElement(this, () => performAction(this));
    });
  });

  // ─── CONTACT FORM ───
  const contactForm = document.getElementById('contactForm');
  const cfSuccess = document.getElementById('cfSuccess');
  const cfError = document.getElementById('cfError');
  if (contactForm) {
    const submitBtn = contactForm.querySelector('.cf-submit');
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (cursorLocked) return;
      if (cfError) cfError.classList.remove('visible');
      const form = this;
      landRocketOnElement(submitBtn, () => {
        const data = new FormData(form);
        fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        }).then(r => r.json()).then(res => {
          if (res.ok) {
            form.reset();
            if (cfSuccess) cfSuccess.classList.add('visible');
          } else {
            if (cfError) cfError.classList.add('visible');
          }
        }).catch(() => {
          if (cfError) cfError.classList.add('visible');
        });
      });
    });
  }

  document.querySelectorAll('.nav-link').forEach(el => {
    el.addEventListener('click', function(e) {
      if (cursorLocked) return;
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      landRocketOnElement(this, () => {
        if (href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });

  // ─── PARTICLE BURST ON CLICK ───
  document.addEventListener('click', (e) => {
    const colors = ['#5266eb', '#6b7df5', '#8b5cf6', '#e8a838'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'burst-particle';
      const size = 2 + Math.random() * 4;
      const angle = (Math.PI * 2 / 12) * i;
      const dist = 20 + Math.random() * 40;
      p.style.cssText = `
        position: fixed; left: ${e.clientX}px; top: ${e.clientY}px;
        width: ${size}px; height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        --bx: ${Math.cos(angle) * dist}px;
        --by: ${Math.sin(angle) * dist}px;
        pointer-events: none; z-index: 99999;
        border-radius: 50%;
        animation: burstFade 0.8s ease-out forwards;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  });

  // ─── TYPEWRITER ───
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    const phrases = [
      'Computer Science Engineer',
      'Full-Stack Developer',
      'AI Application Builder',
      'Problem Solver'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let isWaiting = false;

    function typeStep() {
      const current = phrases[phraseIdx];
      if (!isDeleting && !isWaiting) {
        charIdx++;
        typewriterEl.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          isWaiting = true;
          setTimeout(() => {
            isWaiting = false;
            isDeleting = true;
            typeStep();
          }, 2000);
          return;
        }
        setTimeout(typeStep, 60 + Math.random() * 60);
      } else if (isDeleting) {
        charIdx--;
        typewriterEl.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(typeStep, 300);
          return;
        }
        setTimeout(typeStep, 30 + Math.random() * 30);
      }
    }
    setTimeout(typeStep, 1500);
  }

  // ─── MAGNETIC BUTTONS ───
  const magneticBtns = document.querySelectorAll('.btn');
  magneticBtns.forEach(btn => {
    let magnetThrottle = 0;
    btn.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - magnetThrottle < 30) return;
      magnetThrottle = now;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      if (dist < 100) {
        const strength = 0.3;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      }
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ─── 3D TILT CARDS ───
  const tiltCards = document.querySelectorAll('.project-card, .contact-card, .edu-card');
  tiltCards.forEach(card => {
    let tiltThrottle = 0;
    card.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - tiltThrottle < 30) return;
      tiltThrottle = now;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    });
  });

  // ─── GRADIENT MESH BLOBS (handled in RAF loop above) ───

  // ─── SECTION PROGRESS INDICATOR ───
  const spDots = document.querySelectorAll('.sp-dot');
  const spFill = document.getElementById('spFill');
  const sections = document.querySelectorAll('section[id]');
  if (spDots.length && sections.length) {
    const sectionObs = new IntersectionObserver((entries) => {
      let maxVisible = 0;
      let activeId = '';
      entries.forEach(entry => {
        if (entry.intersectionRatio > maxVisible) {
          maxVisible = entry.intersectionRatio;
          activeId = entry.target.id;
        }
      });
      if (activeId) {
        spDots.forEach(d => d.classList.toggle('active', d.dataset.section === activeId));
        if (spFill) {
          const idx = Array.from(sections).findIndex(s => s.id === activeId);
          spFill.style.height = ((idx + 1) / sections.length * 100) + '%';
        }
      }
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
    sections.forEach(s => sectionObs.observe(s));

    spDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = document.getElementById(dot.dataset.section);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ─── GSAP SCROLL REVEALS ───
  if (typeof gsap !== 'undefined') {
    try {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray('.section-header').forEach(header => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: header, start: 'top 85%', toggleActions: 'play none none none' } });
        tl.from(header.querySelector('.section-eyebrow'), { opacity: 0, y: 20, duration: 0.35, ease: 'power1.out' });
        tl.from(header.querySelector('.section-title'), { opacity: 0, y: 20, duration: 0.35, ease: 'power1.out' }, '-=0.2');
      });

      gsap.utils.toArray('.about-card, .about-info, .project-card, .edu-card, .skill-category, .contact-card').forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          opacity: 0, y: 30, duration: 0.35, delay: i * 0.04, ease: 'power1.out', force3D: true
        });
      });

      gsap.utils.toArray('.stat-number').forEach(el => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          onEnter: () => animateCounter(el)
        });
      });

      ScrollTrigger.refresh();
      window.addEventListener('load', () => ScrollTrigger.refresh());
    } catch (e) {
      console.warn('GSAP error:', e);
      const revealEls = document.querySelectorAll('.about-card, .about-info, .project-card, .edu-card, .skill-category, .contact-card, .section-header');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('reveal', 'visible'); obs.unobserve(entry.target); } });
      }, { threshold: 0.1 });
      revealEls.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
    }
  } else {
    const revealEls = document.querySelectorAll('.about-card, .about-info, .project-card, .edu-card, .skill-category, .contact-card, .section-header');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('reveal', 'visible'); obs.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    revealEls.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
  }

  // ─── COUNTER ANIMATION ───
  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + '+';
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Fallback counter observer
  if (typeof gsap === 'undefined') {
    document.querySelectorAll('.stat-number').forEach(el => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  // ─── MOBILE MENU ───
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ─── NAVBAR SCROLL ───
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ====== DIAGRAM BUILDER ======
  function buildNode(icon, label, sublabel, accent) {
    return `<div class="diagram-node ${accent || ''}">
      <span class="node-icon">${icon}</span>
      <span class="node-label">${label}</span>
      ${sublabel ? `<span class="node-sublabel">${sublabel}</span>` : ''}
    </div>`;
  }
  function buildArrow() {
    return `<span class="diagram-arrow">&#9654;</span>`;
  }
  function buildVConnector(text) {
    return `<div class="diagram-vconnector">&#9660; ${text} &#9660;</div>`;
  }
  function buildLane(label, accent, children) {
    return `<div class="diagram-lane" data-label="${label}">${children}</div>`;
  }

  function renderClipcheckDiagram() {
    const external = buildLane('External Services', '', [
      buildNode('☁️', 'YouTube API', 'InnerTube / yt-dlp', 'accent-1'),
      buildArrow(),
      buildNode('🔎', 'Serper.dev', 'Web Search API', 'accent-1'),
      buildArrow(),
      buildNode('🧠', 'OpenRouter / Groq / NVIDIA', 'AI Inference (Llama 3.3 70B)', 'accent-1')
    ].join(''));
    const backend = buildLane('Backend — Express / Node.js', '', [
      buildNode('📜', 'Transcript Extractor', 'Multi-strategy fallback', 'accent-2'),
      buildArrow(),
      buildNode('🔍', 'Claim Extractor', 'AI extracts facts + timestamps', 'accent-2'),
      buildArrow(),
      buildNode('🌐', 'Web Search', 'Google / DuckDuckGo', 'accent-2'),
      buildArrow(),
      buildNode('✅', 'AI Verifier', 'TRUE / FALSE / MISLEADING', 'accent-2'),
      buildArrow(),
      buildNode('📊', 'Report Generator', 'Score + Evidence + Sources', 'accent-2')
    ].join(''));
    const frontend = buildLane('Frontend — Vanilla JS SPA (Vercel)', '', [
      buildNode('📹', 'Input', 'URL / Text / Language', 'accent-3'),
      buildArrow(),
      buildNode('⏳', 'Processing', 'Progress + Mini-games', 'accent-3'),
      buildArrow(),
      buildNode('📋', 'Results', 'Claims + Timeline + Score', 'accent-3'),
      buildArrow(),
      buildNode('📤', 'Share / Compare', 'URLs / History', 'accent-3')
    ].join(''));
    const flow = `<div class="diagram-flow">
      ${buildNode('👤', 'User', 'Submits URL or Text', 'accent-4')}
      ${buildArrow()}
      ${buildNode('🎯', 'Decision', 'URL or Text Mode', 'accent-4')}
      ${buildArrow()}
      ${buildNode('🔄', 'AI Pipeline', 'Claims → Search → Verify', 'accent-4')}
      ${buildArrow()}
      ${buildNode('📄', 'Report', 'Verdicts + Citations', 'accent-4')}
    </div>`;
    return `<div class="diagram">${external}${buildVConnector('API Calls')}${backend}${buildVConnector('REST / Polling')}${frontend}${flow}</div>`;
  }

  function renderMediflowDiagram() {
    const client = buildLane('Client Layer — React 19 SPA (Vercel)', '', [
      buildNode('👤', 'Patient', 'Book / View Records', 'accent-1'),
      buildArrow(),
      buildNode('👨‍⚕️', 'Doctor', 'Schedule / Prescriptions', 'accent-1'),
      buildArrow(),
      buildNode('🏢', 'Hospital Admin', 'Manage Doctors / Patients', 'accent-1'),
      buildArrow(),
      buildNode('🔐', 'Platform Admin', 'System-wide Management', 'accent-1')
    ].join(''));
    const backend = buildLane('Backend — Spring Boot / Java 21 (Render)', '', [
      buildNode('🔑', 'JWT Auth', 'Login / Google OAuth2 / RBAC', 'accent-2'),
      buildArrow(),
      buildNode('🎮', 'Controllers', 'REST Endpoints (10)', 'accent-2'),
      buildArrow(),
      buildNode('⚙️', 'Services', 'Business Logic Layer', 'accent-2'),
      buildArrow(),
      buildNode('🗄️', 'Repositories', 'JPA / Hibernate ORM', 'accent-2')
    ].join(''));
    const db = buildLane('Database — PostgreSQL (Neon)', '', [
      buildNode('👥', 'Users', 'Patients + Doctors + Admins', 'accent-3'),
      buildArrow(),
      buildNode('📅', 'Appointments', 'Schedules + Statuses', 'accent-3'),
      buildArrow(),
      buildNode('📋', 'Medical Records', 'History + Diagnoses', 'accent-3'),
      buildArrow(),
      buildNode('💊', 'Prescriptions', 'Medications + PDF Export', 'accent-3')
    ].join(''));
    const flow = `<div class="diagram-flow">
      ${buildNode('👤', 'User', 'Login → Role-based Dashboard', 'accent-4')}
      ${buildArrow()}
      ${buildNode('🔒', 'Auth Gate', 'JWT Validation + RBAC', 'accent-4')}
      ${buildArrow()}
      ${buildNode('⚡', 'Features', 'Appointments / Management', 'accent-4')}
      ${buildArrow()}
      ${buildNode('💾', 'Persistence', 'PostgreSQL via Neon', 'accent-4')}
    </div>`;
    return `<div class="diagram">${client}${buildVConnector('REST + JWT')}${backend}${buildVConnector('JPA / Hibernate')}${db}${flow}</div>`;
  }

  // ====== PROJECT OVERLAY ======
  const overlay = document.getElementById('projectOverlay');

  const projectData = {
    clipcheck: {
      title: 'ClipCheck',
      subtitle: 'AI-Powered Fact-Checking Platform',
      badge: 'AI / Full-Stack',
      tech: ['AI', 'Node.js', 'Express', 'JavaScript', 'OpenRouter', 'Serper.dev', 'YouTube API'],
      renderDiagram: renderClipcheckDiagram,
      sections: [
        { heading: 'How It Works', items: [
          'Submit a video URL (YouTube, Twitter/X, TikTok, Instagram, Facebook, Vimeo) or paste raw text',
          'AI extracts the transcript automatically using multiple fallback strategies (InnerTube API, yt-dlp, YouTube Transcript API)',
          'AI extracts all verifiable factual claims from the transcript with context and category labels',
          'Each claim is searched against the web using Serper.dev API (with DuckDuckGo fallback)',
          'AI evaluates each claim against web evidence and returns a verdict: True, False, Misleading, or Unverifiable',
          'A structured report is generated with color-coded badges, truth score, cited sources, and explanations'
        ]},
        { heading: 'Key Features', items: [
          'YouTube video sync — claims highlight as the video plays with timestamp mapping',
          'Live fact-checking — pause and fact-check the current moment',
          'Multi-language support (15+ languages)',
          'Shareable unique report URLs',
          'Session-based history (no login required)',
          'Gamification — points, streaks, XP, mini-games while waiting',
          'Chrome extension for one-click YouTube fact-checking',
          'Multi-provider AI fallback (OpenRouter → Groq → NVIDIA)'
        ]},
        { heading: 'Architecture & Deployment', text: 'Frontend is a vanilla JS SPA deployed on Vercel. Backend is a Node.js/Express API running on Render in a Docker container (Node 22 Alpine + Python + ffmpeg + yt-dlp). Uses in-memory storage persisted to disk via JSON. AI inference via OpenRouter (Meta Llama 3.3 70B) with Groq and NVIDIA fallbacks.' }
      ],
      links: { live: 'https://clipcheck-ai.vercel.app/', github: 'https://github.com/Darsh01k' }
    },
    mediflow: {
      title: 'MediFlow',
      subtitle: 'Multi-Role Healthcare Management Platform',
      badge: 'Java / Spring Boot / React',
      tech: ['Java 21', 'Spring Boot 3.3', 'React 19', 'PostgreSQL', 'Tailwind CSS', 'JWT', 'Vercel', 'Render', 'Neon'],
      renderDiagram: renderMediflowDiagram,
      sections: [
        { heading: 'How It Works', items: [
          'Four user roles with distinct dashboards: Patient, Doctor, Hospital Admin, Platform Admin',
          'JWT-based authentication with role-based access control (RBAC) for all routes and APIs',
          'Patients can search doctors/hospitals, book appointments, view medical history and prescriptions',
          'Doctors manage schedules, accept appointments, write digital prescriptions and clinical notes',
          'Hospital admins onboard doctors, manage patients, and oversee hospital operations',
          'Platform admins manage all users, hospitals, and system health from a central dashboard'
        ]},
        { heading: 'Key Features', items: [
          'Google OAuth2 social login alongside email/password authentication',
          'Nearby hospital search using geolocation',
          'Digital prescription generation with PDF export',
          'Chart.js dashboards with real-time analytics for each role',
          'Address autocomplete and city autocomplete for better UX',
          'Toast notifications, loading states, and error boundaries throughout',
          'Rate limiting, CORS, and session timeout security measures',
          'Mobile-first responsive design with Tailwind CSS'
        ]},
        { heading: 'Architecture & Deployment', text: 'Frontend is a React 19 SPA with Vite, deployed on Vercel. Backend is a Java 21 Spring Boot 3.3 REST API deployed on Render via Docker. Database uses Neon PostgreSQL with JPA/Hibernate ORM. Communication is via RESTful JSON with JWT tokens in Authorization headers.' }
      ],
      links: { live: 'https://mediflow-care.vercel.app/', github: 'https://github.com/Darsh01k' }
    }
  };

  function renderOverlaySections(sections) {
    return sections.map(s => {
      if (s.items) {
        return `<div class="overlay-section"><h3>${s.heading}</h3><ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
      } else if (s.text) {
        return `<div class="overlay-section"><h3>${s.heading}</h3><p>${s.text}</p></div>`;
      }
    }).join('');
  }

  window.openProject = function(name) {
    const project = projectData[name];
    if (!project) return;
    document.getElementById('overlayBadge').textContent = project.badge;
    document.getElementById('overlayHeading').textContent = project.title;
    document.getElementById('overlaySub').textContent = project.subtitle;
    document.getElementById('overlayTech').innerHTML = project.tech.map(t => `<span>${t}</span>`).join('');
    const imgWrap = document.getElementById('overlayImgWrap');
    if (imgWrap) imgWrap.innerHTML = `<img src="assets/images/${name}.png" alt="${project.title}" loading="lazy">`;
    document.getElementById('diagramWrap').innerHTML = project.renderDiagram();
    document.getElementById('overlayBody').innerHTML = renderOverlaySections(project.sections);
    document.getElementById('overlayLinks').innerHTML = `
      <a href="${project.links.live}" target="_blank" rel="noopener noreferrer" class="ol-btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View Live Site
      </a>
      <a href="${project.links.github}" target="_blank" rel="noopener noreferrer" class="ol-btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        View on GitHub
      </a>`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    const scrollWrap = overlay.querySelector('.overlay-scroll-wrap');
    if (scrollWrap) scrollWrap.scrollTop = 0;
    // GSAP entrance animation
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(overlay.querySelector('.overlay-scroll-wrap'),
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    }
  };

  window.closeProjectOverlay = function() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Overlay close/backdrop listeners (replaces inline onclick for CSP)
  overlay.querySelector('.overlay-close-btn').addEventListener('click', closeProjectOverlay);
  overlay.querySelector('.overlay-backdrop').addEventListener('click', closeProjectOverlay);

  // ─── RESUME DRAWER (slide-in) ───
  const resumeDrawer = document.getElementById('resumeDrawer');
  const resumeBackdrop = document.getElementById('resumeDrawerBackdrop');
  const resumeEmbed = document.getElementById('resumeEmbedDrawer');

  window.openResumeViewer = function() {
    resumeEmbed.src = 'assets/resume/Darsh%20updated.pdf';
    resumeDrawer.classList.add('active');
    resumeBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeResumeViewer = function() {
    resumeDrawer.classList.remove('active');
    resumeBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { resumeEmbed.src = ''; }, 400);
  };

  document.getElementById('navResume').addEventListener('click', (e) => {
    e.preventDefault();
    openResumeViewer();
  });
  document.getElementById('resumeDrawerClose').addEventListener('click', closeResumeViewer);
  resumeBackdrop.addEventListener('click', closeResumeViewer);

  // ─── BACK TO TOP ───
  const backToTop = document.getElementById('backToTop');
  const progressCircle = document.querySelector('.bt-progress circle');
  const circumference = 157.08;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    backToTop.classList.toggle('visible', scrollY > 600);
    if (progressCircle) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? scrollY / h : 0;
      progressCircle.style.strokeDashoffset = circumference * (1 - pct);
    }
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── ESC KEY ───
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectOverlay();
      if (resumeDrawer.classList.contains('active')) closeResumeViewer();
    }
  });

  } // end startSite

  // ─── LOADER ANIMATION ───
  const siteContent = document.getElementById('site-content');
  if (typeof gsap !== 'undefined' && loader) {
    const tl = gsap.timeline({
      onComplete: () => {
        loader.classList.add('hidden');
        startSite();
      }
    });

    // 1. Fade in planet
    tl.to('.loader-planet', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);

    // 2. Rocket shake + exhaust
    tl.to('.loader-rocket-wrapper', { scale: 1.08, duration: 0.1, yoyo: true, repeat: 7, ease: 'power1.inOut' }, 0.2);
    tl.to('.loader-exhaust', { opacity: 1, duration: 0.2 }, 0.2);

    // 3. Exhaust fades just before launch
    tl.to('.loader-exhaust', { opacity: 0, duration: 0.2 }, 1.1);

    // 4. Rocket launches straight upward (no rotation)
    tl.to('.loader-rocket-wrapper', {
      y: -(window.innerHeight * 0.48),
      duration: 1.3,
      ease: 'power2.in',
    }, 1.0);

    // 5. Rocket lands on planet - scale down + burst
    tl.to('.loader-rocket-wrapper', { scale: 0.4, duration: 0.25, ease: 'back.in(2)' }, 2.4);
    tl.to('.loader-rocket img', { filter: 'drop-shadow(0 0 40px rgba(82,102,235,0.9))', duration: 0.25 }, 2.4);
    tl.call(() => {
      const px = window.innerWidth / 2;
      const py = window.innerHeight * 0.18 + 32;
      const colors = ['#5266eb', '#6b7df5', '#8b5cf6', '#e8a838'];
      for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        const a = Math.random() * Math.PI * 2;
        const d = 15 + Math.random() * 50;
        const sz = 2 + Math.random() * 5;
        p.style.cssText = `position:fixed;left:${px}px;top:${py}px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*4)]};--bx:${Math.cos(a)*d}px;--by:${Math.sin(a)*d}px;pointer-events:none;z-index:100001;border-radius:50%;animation:burstFade 0.8s ease-out forwards;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
      }
    }, null, null, 2.4);

    // 6. Fade rocket out, keep planet
    tl.to('.loader-rocket-wrapper', { opacity: 0, duration: 0.15 }, 2.4);

    // 7. Flash overlay
    tl.to(loader, { backgroundColor: '#ffffff', duration: 0.08 }, 2.5);
    tl.to(loader, { backgroundColor: '', duration: 0.06 }, 2.58);

    // 8. Planet zooms in to fill screen
    tl.to('.loader-planet', {
      scale: 18, opacity: 1, duration: 0.8, ease: 'power2.in',
    }, 2.6);

    // 9. Site content zooms out (camera pulls back from planet)
    if (siteContent) {
      gsap.set(siteContent, { scale: 1.6, opacity: 0 });
      tl.to(siteContent, {
        scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out',
        onComplete: () => { siteContent.style.transform = 'none'; }
      }, 2.7);
    }

    // 10. Fade loader text
    tl.to('.loader-text', { opacity: 0, duration: 0.2 }, 2.5);

    // 11. Planet fades out as site takes over
    tl.to('.loader-planet', { opacity: 0, duration: 0.35 }, 3.2);

    // 12. Hide loader
    tl.to(loader, { opacity: 0, duration: 0.3 }, 3.4);
  } else {
    if (loader) loader.remove();
    if (siteContent) siteContent.style.opacity = '1';
    startSite();
  }

});
