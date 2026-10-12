'use strict';
/* =========================================================
   main.js  |  Gayathri's portfolio
   0 Settings   1 Helpers      2 Toast + sound   3 Intro
   4 Hero text  5 Cursor + trail + magnets       6 Scroll + nav
   7 Reveals    8 Pop-ups      9 Concept demo    10 Easter egg
   11 Start-up
   ========================================================= */


/* ---------- 0. SETTINGS: easy things to change ---------- */
const SETTINGS = {
  introSeconds: 3,                    // how long the intro lasts
  rotatorWords: ['Python', 'HTML', 'CSS', 'JavaScript', 'cyber security basics'],
  rotatorEveryMs: 2400,               // how often the hero word changes
  trailMaxParticles: 140,             // lower = lighter on slow computers
  magnetStrength: 0.12,               // 0 = no pull, 1 = sticks to the cursor
  magnetRadius: 15,                   // how close (px) before the pull starts
  heroReach: 220,                     // how far (px) the cursor affects the big letters
};


/* ---------- 1. HELPERS ---------- */
const root = document.documentElement;
const $  = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


/* ---------- 2. TOAST (little message) + SOUND ---------- */
const toastEl = $('#toast');
let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

let audioCtx = null;
let soundOn = false;                  // sound is OFF until you press the button

function blip(freq) {
  if (!soundOn || !audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.04, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}

function initSound() {
  const button = $('#sound-toggle');
  button.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && !audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();   // allowed because the user clicked
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    button.setAttribute('aria-pressed', String(soundOn));
    button.textContent = soundOn ? 'Sound on' : 'Sound off';
    blip(660);
  });

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const target = e.target.closest('a, button');
    if (target && !target.contains(e.relatedTarget)) blip(420 + Math.random() * 200);
  });
}


/* ---------- 3. INTRO ---------- */
const intro = $('#intro');
const introLines = $('#intro-lines');
const introBar = $('#intro-bar');
const INTRO_TEXT = [
  '> booting gayathri.exe',
  '> loading curiosity ......... ok',
  '> skill level: beginner (honest build)',
  '> compiling first website ... ok',
  '> ready.',
];
let introTimers = [];

function finishIntro() {
  introTimers.forEach(clearTimeout);
  introTimers = [];
  intro.classList.add('is-done');
  intro.inert = true;                                  // keyboard can't reach a hidden intro
  document.body.classList.remove('no-scroll');
  try { localStorage.setItem('introSeen', '1'); } catch (e) { /* storage blocked: fine */ }
  startHero();
}

function playIntro() {
  intro.inert = false;
  intro.classList.remove('is-done', 'is-instant');
  introLines.innerHTML = '';
  introBar.style.width = '0%';
  document.body.classList.add('no-scroll');

  const step = (SETTINGS.introSeconds * 1000) / INTRO_TEXT.length;
  INTRO_TEXT.forEach((line, i) => {
    introTimers.push(setTimeout(() => {
      const p = document.createElement('p');
      p.textContent = line;
      introLines.appendChild(p);
      introBar.style.width = ((i + 1) / INTRO_TEXT.length) * 100 + '%';
    }, i * step));
  });
  introTimers.push(setTimeout(finishIntro, SETTINGS.introSeconds * 1000 + 500));
  $('#intro-skip').focus();
}

function initIntro() {
  if (!intro) { startHero(); return; }

  $('#intro-skip').addEventListener('click', finishIntro);
  intro.addEventListener('click', finishIntro);        // click anywhere to skip
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !intro.classList.contains('is-done')) finishIntro();
  });
  $('#replay-intro').addEventListener('click', () => {
    window.scrollTo(0, 0);
    playIntro();
  });

  let seen = false;
  try { seen = localStorage.getItem('introSeen') === '1'; } catch (e) { /* ignore */ }

  if (seen || prefersReducedMotion) {                   // repeat visitors skip straight in
    intro.classList.add('is-done', 'is-instant');
    intro.inert = true;
    startHero();
  } else {
    playIntro();
  }
}


/* ---------- 4. HERO: kinetic letters + rotating word ---------- */
const heroLetters = [];

function splitHeroLetters() {
  const title = $('#hero-title');
  if (!title) return;
  let count = 0;
  $$('.k-line', title).forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = '';
    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.className = 'k-letter';
      span.textContent = char;
      span.style.setProperty('--i', count++);
      span.setAttribute('aria-hidden', 'true');       // the h1's aria-label reads "Gayathri" instead
      line.appendChild(span);
      heroLetters.push(span);
    });
  });
}

function startHero() {
  root.classList.add('hero-ready');
  $$('#home [data-reveal]').forEach((el) => el.classList.add('in'));
}

function reactHeroLetters(x, y) {
  if (window.scrollY > window.innerHeight) return;      // only while the hero is on screen
  // Read all positions first, then write: much faster than mixing the two.
  const rects = heroLetters.map((el) => el.getBoundingClientRect());
  heroLetters.forEach((el, i) => {
    const r = rects[i];
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height / 2);
    const near = Math.max(0, 1 - Math.hypot(dx, dy) / SETTINGS.heroReach);   // 0 to 1
    el.style.setProperty('--near', near.toFixed(2));
    el.style.translate = `${(-dx * near * 0.12).toFixed(1)}px ${(-dy * near * 0.12).toFixed(1)}px`;
    el.style.rotate = `${(dx * near * 0.03).toFixed(1)}deg`;
  });
}

function initRotator() {
  const el = $('#rotator');
  if (!el) return;
  const words = SETTINGS.rotatorWords;
  if (prefersReducedMotion) { el.textContent = 'Python, HTML, CSS and JavaScript'; return; }

  const noise = '!<>-_[]{}=+*^?#01';
  function scrambleTo(word) {
    let frame = 0;
    const total = 14;
    const timer = setInterval(() => {
      frame++;
      const keep = Math.floor((word.length * frame) / total);
      const rest = [...word.slice(keep)].map((c) => (c === ' ' ? ' ' : noise[Math.floor(Math.random() * noise.length)])).join('');
      el.textContent = word.slice(0, keep) + rest;
      if (frame >= total) { clearInterval(timer); el.textContent = word; }
    }, 35);
  }

  let index = 0;
  setInterval(() => {
    index = (index + 1) % words.length;
    scrambleTo(words[index]);
  }, SETTINGS.rotatorEveryMs);
}


/* ---------- 5. CURSOR + TRAIL + MAGNETS + SPOTLIGHT ---------- */
let trailColors = ['#c6ff3d', '#8b4dff'];
function refreshTrailColors() {
  const styles = getComputedStyle(root);
  trailColors = [styles.getPropertyValue('--accent').trim(), styles.getPropertyValue('--accent-2').trim()];
}

function initCursor() {
  // Touch screens and "reduce motion" users keep the normal cursor and skip all of this.
  if (!hasFinePointer || prefersReducedMotion) return;

  const dot = $('.cursor-dot');
  const ring = $('.cursor-ring');
  const label = $('.cursor-label');
  const coords = $('#coords');
  const canvas = $('#trail');
  const ctx = canvas.getContext('2d');
  const magnets = $$('[data-magnetic]');
  const spotlights = $$('[data-spotlight]');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0, height = 0;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  refreshTrailColors();

  const particles = [];
  let x = -100, y = -100;          // where the mouse is
  let rx = -100, ry = -100;        // where the ring is (it chases the mouse)
  let lastX = null, lastY = null;
  let shown = false, moved = false, running = false;

  function spawn(dx, dy, speed) {
    const count = Math.min(3, Math.floor(speed / 8));
    for (let i = 0; i < count && particles.length < SETTINGS.trailMaxParticles; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: -dx * 0.06 + (Math.random() - 0.5) * 1.2,
        vy: -dy * 0.06 + (Math.random() - 0.5) * 1.2,
        size: 1.5 + Math.min(speed / 12, 4) * Math.random(),
        life: 1,
        color: trailColors[Math.random() < 0.65 ? 0 : 1],
      });
    }
  }

  function updateInterface() {
    reactHeroLetters(x, y);
    // Magnets
    magnets.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const reach = Math.max(r.width, r.height) / 2 + SETTINGS.magnetRadius;
      if (Math.hypot(dx, dy) < reach) {
        el.style.translate = `${dx * SETTINGS.magnetStrength}px ${dy * SETTINGS.magnetStrength}px`;
        el.dataset.pulled = '1';
      } else if (el.dataset.pulled) {
        el.style.translate = '';
        delete el.dataset.pulled;
      }
    });
    // Spotlights
    spotlights.forEach((el) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (x - r.left) + 'px');
      el.style.setProperty('--my', (y - r.top) + 'px');
    });
    coords.textContent = `x ${String(Math.round(x)).padStart(4, '0')} / y ${String(Math.round(y)).padStart(4, '0')}`;
  }

  function frame() {
    if (moved) { moved = false; updateInterface(); }

    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 0.022;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Keep looping only while something is still moving (saves battery).
    if (particles.length || moved || Math.hypot(x - rx, y - ry) > 0.5) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) {                                   // first mouse movement: switch the custom cursor on
      shown = true;
      root.classList.add('custom-cursor');
      rx = e.clientX; ry = e.clientY;
    }
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    dot.style.opacity = ring.style.opacity = '1';

    if (lastX !== null) {
      const dx = x - lastX, dy = y - lastY;
      spawn(dx, dy, Math.hypot(dx, dy));           // faster movement = more sparks
    }
    lastX = x; lastY = y;
    moved = true;
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });

  // Ring changes shape over links, buttons and anything with data-cursor-label.
  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest('a, button, [data-cursor-label], [data-magnetic]');
    const text = target && target.dataset.cursorLabel;
    ring.classList.toggle('is-link', !!target && !text);
    ring.classList.toggle('has-label', !!text);
    label.textContent = text || '';
  });
  document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
  root.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
}


/* ---------- 6. SCROLL EFFECTS + NAVIGATION ---------- */
function initScroll() {
  const nav = $('#nav');
  const gridBg = $('.grid-bg');
  const parallaxEls = $$('[data-speed]');
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    if (!prefersReducedMotion) {
      if (y < window.innerHeight * 1.5) {
        parallaxEls.forEach((el) => { el.style.translate = `0 ${(y * el.dataset.speed).toFixed(1)}px`; });
      }
      gridBg.style.backgroundPosition = `0 ${(-y * 0.12).toFixed(1)}px`;
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

function initNav() {
  const nav = $('#nav');
  const menuBtn = $('#menu-toggle');
  const links = $$('.nav-links a');

  // Mobile menu
  function setMenu(open) {
    nav.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('no-scroll', open);
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('nav-open')));
  links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) { setMenu(false); menuBtn.focus(); }
  });

  // Highlight the link for the section you're reading
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const match = links.find((a) => a.getAttribute('href') === '#' + entry.target.id);
      if (match) match.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => {
    const section = $(a.getAttribute('href'));
    if (section) observer.observe(section);
  });
}


/* ---------- 7. SCROLL REVEALS ---------- */
function initReveals() {
  const items = $$('[data-reveal]').filter((el) => !el.closest('#home'));   // hero reveals wait for the intro
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => observer.observe(el));
}


/* ---------- 8. POP-UPS (native <dialog>) ---------- */
function initDialogs() {
  let opener = null;

  $$('[data-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.open);
      if (!dialog) return;
      opener = button;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      root.classList.add('modal-open');
      document.body.classList.add('no-scroll');
    });
  });

  $$('dialog').forEach((dialog) => {
    // Clicking the dark area outside the box closes it.
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    // Runs for every way of closing: Close button, Escape key, backdrop click.
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) {
        root.classList.remove('modal-open');
        document.body.classList.remove('no-scroll');
      }
      if (opener) opener.focus();                       // put the keyboard back where it was
    });
  });

  $$('[data-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
}


/* ---------- 9. CONCEPT DEMO inside the Survival of VITians pop-up ---------- */
function initDemo() {
  const textEl = $('#demo-text');
  if (!textEl) return;
  const choicesEl = $('#demo-choices');
  const meter = $('#demo-meter');
  const value = $('#demo-value');

  // EDIT ME: each choice is [button text, change in stress]
  const scenes = [
    { text: 'It is 11:40 pm. You have a quiz at 9 am, and your friends are heading out for a late snack.',
      choices: [['Revise for one more hour', 8], ['Go with them, revise at 6 am', 4], ['Sleep early', -8]] },
    { text: 'Your lab record is due on Friday and you have not started it.',
      choices: [['Do it all tonight', 12], ['Do a bit each day', -5], ['Copy a friend\'s and hope', 15]] },
    { text: 'A club you like is recruiting, but your week is already full.',
      choices: [['Join and manage somehow', 6], ['Join next semester', -3], ['Skip it', 0]] },
  ];

  let stress = 40;
  let sceneIndex = 0;

  function setStress(n) {
    stress = Math.max(0, Math.min(100, n));
    meter.style.width = stress + '%';
    value.textContent = stress;
  }

  function endingText() {
    if (stress <= 30) return 'Ending: Calm Survivor. You kept your head above water.';
    if (stress <= 60) return 'Ending: Balanced Chaos. Not perfect, but you made it.';
    return 'Ending: Running on Caffeine. Time for a break!';
  }

  function render() {
    choicesEl.innerHTML = '';
    if (sceneIndex >= scenes.length) {
      textEl.textContent = endingText();
      const again = document.createElement('button');
      again.type = 'button'; again.className = 'btn btn-small'; again.textContent = 'Play again';
      again.addEventListener('click', () => { sceneIndex = 0; setStress(40); render(); });
      choicesEl.appendChild(again);
      return;
    }
    const scene = scenes[sceneIndex];
    textEl.textContent = scene.text;
    scene.choices.forEach(([label, change]) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'btn btn-small'; button.textContent = label;
      button.addEventListener('click', () => { setStress(stress + change); sceneIndex++; render(); });
      choicesEl.appendChild(button);
    });
  }

  setStress(40);
  render();
}


/* ---------- 10. EASTER EGG + PLACEHOLDER LINKS ---------- */
function initEasterEgg() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let position = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === code[position]) {
      position++;
      if (position === code.length) {
        position = 0;
        const on = root.classList.toggle('glitch-mode');
        refreshTrailColors();
        showToast(on ? 'Glitch mode unlocked. Enter the code again to undo it.' : 'Back to normal.');
      }
    } else {
      position = key === code[0] ? 1 : 0;
    }
  });
}

function initPlaceholderLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && /YOUR/.test(link.getAttribute('href'))) {
      e.preventDefault();
      showToast('Placeholder link. Replace the YOUR_... part in index.html first.');
    }
  });
}


/* ---------- 11. START-UP: runs everything ---------- */
splitHeroLetters();
initReveals();
initNav();
initScroll();
initDialogs();
initDemo();
initRotator();
initSound();
initCursor();
initEasterEgg();
initPlaceholderLinks();
initIntro();