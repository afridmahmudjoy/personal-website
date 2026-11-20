(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Short, non-blocking opening sequence.
  const preloader = $('#preloader');
  const progress = $('#load-progress');
  const loadLabel = $('#load-label');
  const entry = $('#entry-screen');
  let loadValue = 0;
  const loadTimer = window.setInterval(() => {
    loadValue = Math.min(100, loadValue + (loadValue < 65 ? 13 : 7));
    if (progress) progress.style.width = loadValue + '%';
    if (loadLabel) loadLabel.textContent = 'LOADING ' + String(loadValue).padStart(2, '0') + '%';
    if (loadValue >= 100) {
      window.clearInterval(loadTimer);
      window.setTimeout(() => {
        preloader && preloader.classList.add('is-done');
        entry && entry.classList.add('is-visible');
      }, reducedMotion ? 0 : 180);
    }
  }, reducedMotion ? 12 : 55);

  // Theme: dark-first, with the visitor's choice remembered locally.
  const themeButtons = $$('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(theme) {
    const light = theme === 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    themeButtons.forEach(button => {
      $('.theme-symbol', button).textContent = light ? '☾' : '☼';
      $('.theme-word', button).textContent = light ? 'DARK' : 'LIGHT';
      button.setAttribute('aria-pressed', String(light));
      button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    });
    if (themeMeta) themeMeta.content = light ? '#e9f5f2' : '#06100e';
  }
  applyTheme(storage.get('joy-v5-theme') === 'light' ? 'light' : 'dark');

  // Sound is opt-in and uses tiny local tones only; no background music or autoplay.
  let soundEnabled = storage.get('joy-v5-sound') === 'on';
  let audioContext = null;
  const soundButtons = $$('.sound-toggle');
  function syncSoundButtons() {
    soundButtons.forEach(button => {
      $('.sound-symbol', button).textContent = soundEnabled ? '♫' : '♪';
      $('.sound-word', button).textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
      button.setAttribute('aria-pressed', String(soundEnabled));
      button.setAttribute('aria-label', soundEnabled ? 'Turn sound effects off' : 'Turn sound effects on');
    });
  }
  function tone(frequency, duration, delay) {
    if (!soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext = audioContext || new Audio();
      if (audioContext.state === 'suspended') audioContext.resume();
      const start = audioContext.currentTime + (delay || 0);
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.012, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch (_) {}
  }
  function playSound(kind) {
    if (!soundEnabled) return;
    if (kind === 'enter') { tone(420, .13, 0); tone(620, .16, .09); tone(820, .19, .2); }
    else if (kind === 'toggle') { tone(520, .08, 0); tone(740, .1, .07); }
    else if (kind === 'navigate') { tone(390, .07, 0); }
    else { tone(650, .06, 0); }
  }
  syncSoundButtons();
  themeButtons.forEach(button => button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('joy-v5-theme', next);
    playSound('toggle');
  }));
  soundButtons.forEach(button => button.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    storage.set('joy-v5-sound', soundEnabled ? 'on' : 'off');
    syncSoundButtons();
    if (soundEnabled) playSound('toggle');
  }));

  // Popup-to-hero: the same DOM elements travel into their final positions.
  const shell = $('#experience-shell');
  const enterButton = $('#enter-button');
  const entryCard = $('.entry-card');
  let opened = false;
  function moveElement(elementId, targetId, duration) {
    const node = $('#' + elementId);
    const target = $('#' + targetId);
    const flightLayer = $('#flight-layer');
    if (!node || !target || !flightLayer) return Promise.resolve();

    const first = node.getBoundingClientRect();
    const placeholder = node.cloneNode(true);
    placeholder.removeAttribute('id');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.classList.add('flight-placeholder');
    target.appendChild(placeholder);
    const last = placeholder.getBoundingClientRect();

    flightLayer.appendChild(node);
    Object.assign(node.style, {
      position: 'fixed',
      left: first.left + 'px',
      top: first.top + 'px',
      width: first.width + 'px',
      height: first.height + 'px',
      margin: '0',
      zIndex: '1',
      transformOrigin: 'top left',
      pointerEvents: 'none'
    });

    function finish() {
      target.insertBefore(node, placeholder);
      placeholder.remove();
      ['position','left','top','width','height','margin','zIndex','transform','transformOrigin','pointerEvents'].forEach(name => {
        node.style.removeProperty(name.replace(/[A-Z]/g, char => '-' + char.toLowerCase()));
      });
    }

    if (!node.animate || reducedMotion || !first.width || !last.width) {
      finish();
      return Promise.resolve();
    }

    const dx = last.left - first.left;
    const dy = last.top - first.top;
    const sx = last.width / first.width;
    const sy = last.height / first.height;
    const to = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')';
    const animation = node.animate([
      { transform: 'translate(0,0) scale(1,1)' },
      { transform: to }
    ], {
      duration: duration || 950,
      easing: 'cubic-bezier(.2,.78,.18,1)',
      fill: 'both'
    });
    return animation.finished.then(() => { animation.cancel(); finish(); }).catch(() => { animation.cancel(); finish(); });
  }
  async function enterPortfolio() {
    if (opened) return;
    opened = true;
    shell.classList.add('is-ready');
    shell.setAttribute('aria-hidden', 'false');
    entryCard && entryCard.classList.add('is-launching');
    enterButton.disabled = true;
    playSound('enter');
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    await Promise.all([
      moveElement('move-photo', 'avatar-slot', reducedMotion ? 0 : 900),
      moveElement('move-name', 'name-slot', reducedMotion ? 0 : 1000),
      moveElement('move-role', 'role-slot', reducedMotion ? 0 : 950),
      moveElement('move-status', 'status-slot', reducedMotion ? 0 : 900),
      moveElement('move-intro', 'intro-slot', reducedMotion ? 0 : 1050),
      moveElement('move-tags', 'tags-slot', reducedMotion ? 0 : 1000)
    ]);
    entry.classList.add('is-leaving');
    window.setTimeout(() => {
      entry.style.display = 'none';
      $('#home') && $('#home').classList.add('is-active');
      updateSceneUI(0);
      shell.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 280);
    showToast('WELCOME TO THE JOY DIGITAL EXPERIENCE');
  }
  enterButton && enterButton.addEventListener('click', enterPortfolio);

  // Scene controller: wheel, touch, keyboard and quick navigation all share one state.
  const scenes = $$('.scene');
  const navItems = $$('.nav-item');
  const sceneProgress = $('#scene-progress-fill');
  const sceneCurrent = $('#scene-current');
  const scenePrev = $('#scene-prev');
  const sceneNext = $('#scene-next');
  let activeScene = 0;
  let sceneLocked = false;
  let wheelTotal = 0;
  let queuedWheelSteps = 0;
  let sceneUnlockTimer = 0;
  let wheelResetTimer = 0;
  function updateSceneUI(index) {
    activeScene = index;
    navItems.forEach((item, i) => {
      const active = i === index;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    if (sceneProgress) sceneProgress.style.width = (((index + 1) / scenes.length) * 100) + '%';
    if (sceneCurrent) sceneCurrent.textContent = String(index + 1).padStart(2, '0');
    const id = scenes[index] && scenes[index].id;
    if (id && history.replaceState) history.replaceState(null, '', '#' + id);
    const activeNav = navItems[index];
    if (activeNav && activeNav.scrollIntoView) activeNav.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    if (scenePrev) scenePrev.disabled = index === 0;
    if (sceneNext) sceneNext.disabled = index === scenes.length - 1;
  }
  function goToScene(index, options) {
    if (!opened) return;
    const nextIndex = Math.max(0, Math.min(scenes.length - 1, index));
    if (nextIndex === activeScene || sceneLocked) return;
    const opts = options || {};
    const direction = nextIndex > activeScene ? 1 : -1;
    const outgoing = scenes[activeScene];
    const incoming = scenes[nextIndex];
    sceneLocked = true;
    window.clearTimeout(sceneUnlockTimer);
    outgoing.classList.remove('is-active');
    outgoing.classList.add(direction > 0 ? 'is-exit-left' : 'is-exit-right');
    if (direction < 0) incoming.classList.add('is-enter-left');
    void incoming.offsetWidth;
    incoming.classList.add('is-active');
    window.requestAnimationFrame(() => incoming.classList.remove('is-enter-left'));
    updateSceneUI(nextIndex);
    if (!opts.silent) playSound('navigate');
    sceneUnlockTimer = window.setTimeout(() => {
      outgoing.classList.remove('is-exit-left', 'is-exit-right');
      sceneLocked = false;
      if (queuedWheelSteps !== 0) {
        const queuedDirection = queuedWheelSteps > 0 ? 1 : -1;
        queuedWheelSteps -= queuedDirection;
        goToScene(activeScene + queuedDirection);
      }
    }, reducedMotion ? 50 : 880);
  }
  navItems.forEach(item => item.addEventListener('click', () => goToScene(Number(item.dataset.go))));
  $$('[data-go]').forEach(item => {
    if (item.classList.contains('nav-item')) return;
    item.addEventListener('click', () => goToScene(Number(item.dataset.go)));
  });
  scenePrev && scenePrev.addEventListener('click', () => goToScene(activeScene - 1));
  sceneNext && sceneNext.addEventListener('click', () => goToScene(activeScene + 1));
  $('#back-home') && $('#back-home').addEventListener('click', () => goToScene(0));
  document.addEventListener('wheel', event => {
    if (!opened || !shell.contains(event.target)) return;
    if (event.target.closest('button,a,.quick-nav')) return;
    event.preventDefault();

    // Normalize mouse, trackpad, line-mode and page-mode wheel events.
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const raw = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    const delta = Math.max(-120, Math.min(120, raw * unit));
    if (!delta) return;

    // Opposite-direction input cancels instead of being mistaken for momentum.
    if (wheelTotal && Math.sign(wheelTotal) !== Math.sign(delta)) wheelTotal = 0;
    wheelTotal += delta;

    // A lower threshold and longer idle window make small trackpad gestures reliable.
    if (Math.abs(wheelTotal) >= 32) {
      const direction = wheelTotal > 0 ? 1 : -1;
      wheelTotal = 0;
      if (sceneLocked) {
        // Keep a short, bounded queue so quick scrolls don't disappear.
        queuedWheelSteps = Math.max(-3, Math.min(3, queuedWheelSteps + direction));
      } else {
        goToScene(activeScene + direction);
      }
    }

    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => { wheelTotal = 0; }, 240);
  }, { passive: false });
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTarget = null;
  shell.addEventListener('touchstart', event => {
    if (!opened || !event.changedTouches.length) return;
    touchTarget = event.target;
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });
  shell.addEventListener('touchend', event => {
    if (!opened || !event.changedTouches.length || sceneLocked) return;
    if (touchTarget && touchTarget.closest && touchTarget.closest('#orbit-wrap,button,a,.quick-nav')) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 48) return;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : (dy < 0 ? 1 : -1);
    goToScene(activeScene + direction);
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (!opened || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      goToScene(activeScene + 1);
    } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      goToScene(activeScene - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToScene(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToScene(scenes.length - 1);
    }
  });
  if (location.hash && opened === false) {
    // Entry is intentionally shown first; scene hashes are applied after the visitor enters.
    const desired = scenes.findIndex(scene => '#' + scene.id === location.hash);
    if (desired >= 0) window.addEventListener('joyv5:entered', () => goToScene(desired, { silent: true }), { once: true });
  }

  // Skills: circular orbit with drag, momentum, category filters and slow auto-rotation.
  const skills = [
    { name:'Adobe Photoshop',category:'Visual Design',context:'PRACTICAL DESIGN WORK',description:'Image treatment, promotional graphics and visual compositions for digital communication.',evidence:'Practical creative work and design projects. A matching certificate will be linked only when the original document is available.' },
    { name:'Canva',category:'Visual Design',context:'PRACTICAL DESIGN WORK',description:'Creating social media graphics, promotional layouts and communication materials.',evidence:'Applied in creative and social-content work. Formal certification is not claimed here.' },
    { name:'PicsArt',category:'Visual Design',context:'PRACTICAL DESIGN WORK',description:'Image editing and visual composition for digital graphics and creative content.',evidence:'Practical creative use. Formal certification is not claimed here.' },
    { name:'Graphic Design',category:'Visual Design',context:'CLIENT & COMMUNITY PROJECTS',description:'Visual communication through layout, typography, imagery and promotional design.',evidence:'Supported by freelance design work and creative contributions to organisations.' },
    { name:'Filmora',category:'Video & Content',context:'PRACTICAL CONTENT WORK',description:'Video-editing for assembling footage, basic effects, titles and social-ready edits.',evidence:'Practical editing experience. No formal certification is claimed here.' },
    { name:'CapCut',category:'Video & Content',context:'PRACTICAL CONTENT WORK',description:'Short-form editing, timing, captions and visual storytelling.',evidence:'Practical content-editing use. Formal certification is not claimed here.' },
    { name:'Facebook Marketing',category:'Digital Marketing',context:'DIGITAL PROMOTION',description:'Creating and supporting promotional content for Facebook audiences and business pages.',evidence:'Related to social-content and promotional campaign work. Specific campaign analytics are not published here.' },
    { name:'Instagram Marketing',category:'Digital Marketing',context:'DIGITAL PROMOTION',description:'Planning visual-first social content and promotional creatives for Instagram.',evidence:'Related to social-content and digital promotion work.' },
    { name:'Search Engine Optimization (SEO)',category:'Digital Marketing',context:'DIGITAL MARKETING KNOWLEDGE',description:'Foundational understanding of improving the discoverability and structure of online content.',evidence:'Listed as a digital-marketing skill; specific ranking results or formal certification are not claimed.' },
    { name:'C Programming',category:'Programming & ICT',context:'TECHNICAL FOUNDATION',description:'Foundational programming concepts using C, including syntax, logic and structured problem-solving.',evidence:'Technical learning and programming coursework. Presented as a foundation, not advanced software engineering expertise.' },
    { name:'Computer Programming',category:'Programming & ICT',context:'COURSEWORK',description:'Core programming concepts and structured approaches to solving computational problems.',evidence:'Covered through technical diploma studies and related learning.' },
    { name:'Programming Fundamentals',category:'Programming & ICT',context:'COURSEWORK',description:'Foundational concepts such as variables, conditions, loops, functions and logical problem-solving.',evidence:'Technical coursework and self-directed practice.' },
    { name:'Computer Applications',category:'Programming & ICT',context:'COURSEWORK',description:'Using common computer applications and digital tools to support productivity and everyday tasks.',evidence:'Covered in the ICT diploma programme.' },
    { name:'Information & Communication Technology',category:'Programming & ICT',context:'TECHNICAL EDUCATION',description:'A broad foundation in computer systems, digital communication and applied information technology.',evidence:'Formal technical study through the Diploma in Information & Communication Technology.' },
    { name:'Database Management Systems',category:'Programming & ICT',context:'COURSEWORK',description:'Foundational concepts in organising, storing and managing structured information in databases.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'Data Structures & Algorithms',category:'Programming & ICT',context:'COURSEWORK',description:'Foundational ways of organising data and approaching computational problems efficiently.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'Internet & Web Technology',category:'Programming & ICT',context:'COURSEWORK',description:'Core concepts related to the internet, web technologies and building blocks of online experiences.',evidence:'Covered in the ICT diploma programme, including web technology with programming.' },
    { name:'Data Communication & Networking',category:'Programming & ICT',context:'COURSEWORK',description:'Foundational concepts behind data transmission and how computer networks are structured.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'Windows & Linux',category:'Programming & ICT',context:'COURSEWORK',description:'Foundational knowledge of operating-system concepts across Windows and Linux environments.',evidence:'Covered in the Operating System subject of the ICT diploma programme.' },
    { name:'Cloud Computing',category:'Programming & ICT',context:'COURSEWORK',description:'An introduction to cloud-based computing concepts, services and digital infrastructure.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'System Analysis & Design',category:'Programming & ICT',context:'COURSEWORK',description:'Approaching information systems through requirements, analysis, planning and design concepts.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'Programming with Visual Tools',category:'Programming & ICT',context:'COURSEWORK',description:'An introduction to creating programmes with visual development tools and interfaces.',evidence:'Covered as a subject in the ICT diploma programme.' },
    { name:'Creative Thinking',category:'Business & Creativity',context:'PRACTICAL & COLLABORATIVE',description:'Exploring different approaches, developing concepts and finding useful ways to communicate ideas.',evidence:'Reflected in creative projects, event contributions and visual problem-solving.' },
    { name:'Communication',category:'Business & Creativity',context:'TEACHING & TEAMWORK',description:'Sharing information and ideas clearly with learners, collaborators and team members.',evidence:'Supported by ICT teaching, club responsibilities and collaborative activities.' },
    { name:'Teamwork',category:'Business & Creativity',context:'COMMUNITY INVOLVEMENT',description:'Working with others toward shared objectives and contributing reliably to group activities.',evidence:'Built through student clubs, volunteering and team-based initiatives.' },
    { name:'Event Management',category:'Leadership',context:'CLUB & COMMUNITY ACTIVITIES',description:'Helping coordinate activities, people and practical details for events and group initiatives.',evidence:'Supported by college club involvement and event-organising recognition.' },
    { name:'Team Leadership',category:'Leadership',context:'STUDENT LEADERSHIP',description:'Taking responsibility, supporting peers and helping a team work toward a shared outcome.',evidence:'Related to vice-president responsibilities and youth leadership involvement.' },
    { name:'Administration',category:'Leadership',context:'CLUB OPERATIONS',description:'Supporting organisation, coordination and day-to-day club responsibilities.',evidence:'Related to the Administration & IT leadership role in the English Language Club.' }
  ];
  const filterHost = $('#skill-filters');
  const orbitWrap = $('#orbit-wrap');
  const orbitNodes = $('#orbit-nodes');
  const skillName = $('#skill-name');
  const skillCategory = $('#skill-category');
  const skillDescription = $('#skill-description');
  const skillContext = $('#skill-context');
  const skillEvidence = $('#skill-evidence');
  const skillNumber = $('#skill-number');
  const skillTotal = $('#skill-total');
  const skillCategories = ['All'].concat(Array.from(new Set(skills.map(skill => skill.category))));
  let skillFilter = 'All';
  let visibleSkills = skills.slice();
  let selectedSkill = 0;
  let orbitRotation = 0;
  let orbitVelocity = 0;
  let pointerDown = false;
  let pointerMoved = false;
  let suppressSkillClickUntil = 0;
  let lastPointerX = 0;
  let lastMoveTime = 0;
  let pauseAutoUntil = 0;
  let lastOrbitRender = 0;
  const wrapIndex = (index, length) => ((index % length) + length) % length;
  function updateSkillDetails() {
    if (!visibleSkills.length) return;
    const skill = visibleSkills[selectedSkill];
    skillName.textContent = skill.name;
    skillCategory.textContent = skill.category.toUpperCase();
    skillDescription.textContent = skill.description;
    skillContext.textContent = skill.context;
    skillEvidence.textContent = skill.evidence;
    skillNumber.textContent = String(selectedSkill + 1).padStart(2, '0');
    skillTotal.textContent = String(visibleSkills.length).padStart(2, '0');
  }
  function renderOrbit() {
    if (!orbitNodes || !visibleSkills.length) return;
    const count = Math.min(9, visibleSkills.length);
    const middle = Math.floor(count / 2);
    orbitNodes.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const index = wrapIndex(selectedSkill + i - middle, visibleSkills.length);
      const skill = visibleSkills[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'orbit-node' + (index === selectedSkill ? ' is-selected' : '');
      button.dataset.skillIndex = String(index);
      button.textContent = skill.name;
      orbitNodes.appendChild(button);
    }
    updateOrbitPositions();
    updateSkillDetails();
  }
  function updateOrbitPositions() {
    if (!orbitNodes) return;
    const nodes = $$('.orbit-node', orbitNodes);
    const count = nodes.length;
    const middle = Math.floor(count / 2);
    const radius = window.innerWidth < 760 ? 34 : 38;
    nodes.forEach((node, i) => {
      const angle = ((i - middle) * (360 / count)) - 90 + orbitRotation;
      const radians = angle * Math.PI / 180;
      const x = 50 + Math.cos(radians) * radius;
      const y = 50 + Math.sin(radians) * radius;
      node.style.left = x + '%';
      node.style.top = y + '%';
      node.style.transform = 'translate(-50%,-50%) rotate(' + (-orbitRotation) + 'deg)';
    });
  }
  function stepOrbit(delta) {
    const count = Math.min(9, visibleSkills.length);
    const step = 360 / count;
    orbitRotation += delta;
    let changed = false;
    while (orbitRotation <= -step / 2) {
      selectedSkill = wrapIndex(selectedSkill + 1, visibleSkills.length);
      orbitRotation += step;
      changed = true;
    }
    while (orbitRotation >= step / 2) {
      selectedSkill = wrapIndex(selectedSkill - 1, visibleSkills.length);
      orbitRotation -= step;
      changed = true;
    }
    updateOrbitPositions();
    if (changed) updateSkillDetails();
  }
  function selectSkill(index) {
    selectedSkill = wrapIndex(index, visibleSkills.length);
    orbitRotation = 0;
    orbitVelocity = 0;
    renderOrbit();
    pauseAutoUntil = performance.now() + 3500;
    playSound('click');
  }
  function renderSkillFilters() {
    if (!filterHost) return;
    filterHost.innerHTML = '';
    skillCategories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'skill-filter' + (skillFilter === category ? ' is-active' : '');
      button.textContent = category === 'All' ? 'ALL SKILLS' : category.toUpperCase();
      button.addEventListener('click', () => {
        skillFilter = category;
        visibleSkills = category === 'All' ? skills.slice() : skills.filter(skill => skill.category === category);
        selectedSkill = 0;
        orbitRotation = 0;
        renderSkillFilters();
        renderOrbit();
        pauseAutoUntil = performance.now() + 2200;
      });
      filterHost.appendChild(button);
    });
  }
  renderSkillFilters();
  renderOrbit();
  orbitWrap && orbitWrap.addEventListener('pointerdown', event => {
    pointerDown = true;
    pointerMoved = false;
    lastPointerX = event.clientX;
    lastMoveTime = performance.now();
    orbitVelocity = 0;
    orbitWrap.classList.add('is-dragging');
    orbitWrap.setPointerCapture(event.pointerId);
    pauseAutoUntil = performance.now() + 10000;
  });
  orbitWrap && orbitWrap.addEventListener('pointermove', event => {
    if (!pointerDown) return;
    const dx = event.clientX - lastPointerX;
    const now = performance.now();
    if (Math.abs(dx) > 2) pointerMoved = true;
    const elapsed = Math.max(8, now - lastMoveTime);
    orbitVelocity = dx * 0.45 * (16 / elapsed);
    stepOrbit(dx * 0.52);
    lastPointerX = event.clientX;
    lastMoveTime = now;
  });
  function finishOrbitDrag() {
    if (!pointerDown) return;
    pointerDown = false;
    orbitWrap && orbitWrap.classList.remove('is-dragging');
    if (pointerMoved) suppressSkillClickUntil = performance.now() + 260;
    if (Math.abs(orbitVelocity) > .2) pauseAutoUntil = performance.now() + 1800;
  }
  orbitWrap && orbitWrap.addEventListener('pointerup', finishOrbitDrag);
  orbitWrap && orbitWrap.addEventListener('pointercancel', finishOrbitDrag);
  orbitWrap && orbitWrap.addEventListener('lostpointercapture', finishOrbitDrag);
  orbitNodes && orbitNodes.addEventListener('click', event => {
    if (performance.now() < suppressSkillClickUntil) return;
    const button = event.target.closest('.orbit-node');
    if (!button) return;
    selectSkill(Number(button.dataset.skillIndex));
  });
  $('#skill-prev') && $('#skill-prev').addEventListener('click', () => selectSkill(selectedSkill - 1));
  $('#skill-next') && $('#skill-next').addEventListener('click', () => selectSkill(selectedSkill + 1));
  orbitWrap && orbitWrap.addEventListener('mouseenter', () => { pauseAutoUntil = performance.now() + 100000; });
  orbitWrap && orbitWrap.addEventListener('mouseleave', () => { pauseAutoUntil = performance.now() + 1600; });
  let orbitFrame = 0;
  function animateOrbit(now) {
    if (!pointerDown && now > pauseAutoUntil) {
      if (Math.abs(orbitVelocity) > .12) {
        stepOrbit(orbitVelocity);
        orbitVelocity *= .91;
      } else {
        stepOrbit(-.11);
      }
    } else if (!pointerDown && Math.abs(orbitVelocity) > .12) {
      stepOrbit(orbitVelocity);
      orbitVelocity *= .91;
    }
    orbitFrame = window.requestAnimationFrame(animateOrbit);
  }
  orbitFrame = window.requestAnimationFrame(animateOrbit);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(orbitFrame);
    } else {
      orbitFrame = window.requestAnimationFrame(animateOrbit);
    }
  });

  // Project category filters.
  const projectFilters = $$('.filter-button');
  const projectCards = $$('.project-card');
  projectFilters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    projectFilters.forEach(item => item.classList.toggle('is-active', item === button));
    projectCards.forEach(card => { card.hidden = category !== 'All' && card.dataset.category !== category; });
    playSound('click');
  }));

  // Small JOY easter egg: five taps on the identity mark trigger one playful flourish.
  let identityTaps = 0;
  let identityTapTimer = 0;
  const identity = $('.identity');
  const avatarSlot = $('#avatar-slot');
  identity && identity.addEventListener('click', event => {
    if (event.target.closest('a')) event.preventDefault();
    goToScene(0, { silent: true });
    identityTaps += 1;
    window.clearTimeout(identityTapTimer);
    identityTapTimer = window.setTimeout(() => { identityTaps = 0; }, 1800);
    if (identityTaps >= 5) {
      identityTaps = 0;
      if (avatarSlot && avatarSlot.animate) avatarSlot.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(360deg) scale(1.18)' }, { transform: 'rotate(720deg) scale(1)' }], { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)' });
      showToast('YOU FOUND THE JOY SIGNATURE ✳');
      playSound('click');
    }
  });

  // Custom cursor is desktop-only and decorative; native pointer remains available.
  const cursorDot = $('.cursor-dot');
  const cursorRing = $('.cursor-ring');
  if (window.matchMedia('(pointer:fine)').matches && cursorDot && cursorRing) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    document.addEventListener('mousemove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
      cursorDot.style.transform = 'translate3d(' + pointerX + 'px,' + pointerY + 'px,0) translate(-50%,-50%)';
    });
    function drawCursor() {
      ringX += (pointerX - ringX) * .19;
      ringY += (pointerY - ringY) * .19;
      cursorRing.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
      window.requestAnimationFrame(drawCursor);
    }
    drawCursor();
    document.addEventListener('mouseover', event => {
      if (event.target.closest('a,button')) cursorRing.classList.add('is-hover');
    });
    document.addEventListener('mouseout', event => {
      if (event.target.closest('a,button')) cursorRing.classList.remove('is-hover');
    });
  }

  // Accessible status message and date.
  let toastTimer = 0;
  function showToast(message) {
    const toast = $('#site-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Honour deep links after the profile transformation has completed.
  const initialHash = location.hash;
  const enterOriginal = enterPortfolio;
  if (initialHash && initialHash !== '#home') {
    const desired = scenes.findIndex(scene => '#' + scene.id === initialHash);
    if (desired >= 0) {
      enterButton && enterButton.addEventListener('click', () => {
        window.setTimeout(() => goToScene(desired, { silent: true }), reducedMotion ? 50 : 1500);
      }, { once: true });
    }
  }

  // If the portrait file is ever moved, fail gracefully rather than showing a broken image.
  const portrait = $('#move-photo');
  portrait && portrait.addEventListener('error', () => {
    portrait.removeAttribute('src');
    portrait.alt = 'Afrid Mahmud Joy';
    portrait.style.background = 'linear-gradient(145deg,#135347,#071a16)';
  });
})();