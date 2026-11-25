(() => {
  'use strict';

  const root = document.documentElement;
  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>',
    moon: '<svg viewBox="0 0 24 24" focusable="false"><path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="M15.5 9.5a4 4 0 0 1 0 5m2.5-7.5a8 8 0 0 1 0 11"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>'
  };
  // 
  
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };

  // Theme switching works on both the opening screen and the revealed portfolio.
  const themeButtons = [...document.querySelectorAll('.theme-toggle')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    root.dataset.theme = isLight ? 'light' : 'dark';
    themeButtons.forEach((button) => {
      const symbol = button.querySelector('.theme-symbol');
      const word = button.querySelector('.theme-word');
      if (symbol) symbol.innerHTML = isLight ? ICONS.moon : ICONS.sun;
      if (word) word.textContent = isLight ? 'DARK' : 'LIGHT';
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    });
    if (themeMeta) themeMeta.content = isLight ? '#ffffff' : '#071312';
  };
  applyTheme(storage.get('amj-v4-theme') === 'light' ? 'light' : 'dark');
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('amj-v4-theme', next);
    playSound(next === 'light' ? 'theme-light' : 'theme-dark');
  }));

  // The portfolio is available through normal scrolling; the hero action is a guided entry point.
  const exploreButton = document.getElementById('explore-button');
  exploreButton?.addEventListener('click', () => {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;
    playSound('launch');
    aboutSection.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
    aboutSection.classList.remove('profile-summary-reveal');
    requestAnimationFrame(() => aboutSection.classList.add('profile-summary-reveal'));
  });

  // Mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const moreButton = document.querySelector('.nav-more-toggle');
  const moreMenu = document.getElementById('more-menu');
  const closeMoreMenu = (returnFocus = false) => {
    if (!moreButton || !moreMenu) return;
    moreMenu.hidden = true;
    moreButton.setAttribute('aria-expanded', 'false');
    moreButton.closest('.nav-more')?.classList.remove('open');
    if (returnFocus) moreButton.focus();
  };
  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    if (!isOpen) closeMoreMenu();
    playSound('navigate');
  });
  moreButton?.addEventListener('click', () => {
    const isOpen = moreButton.getAttribute('aria-expanded') === 'true';
    moreMenu.hidden = isOpen;
    moreButton.setAttribute('aria-expanded', String(!isOpen));
    moreButton.closest('.nav-more')?.classList.toggle('open', !isOpen);
    playSound('navigate');
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
    closeMoreMenu();
    playSound('navigate');
  }));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-more')) closeMoreMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && moreButton?.getAttribute('aria-expanded') === 'true') {
      closeMoreMenu(true);
    }
  });

 // Sound effects are opt-in and generated locally with Web Audio.
  let soundEnabled = storage.get('amj-v4-sound') === 'on';
  let audioContext = null;
  let activeClickEvent = null;
  let clickSoundPlayed = false;
  const soundButtons = [...document.querySelectorAll('.sound-toggle')];
  document.addEventListener('click', (event) => {
    activeClickEvent = event;
    clickSoundPlayed = false;
  }, true);
  const syncSoundButtons = () => soundButtons.forEach((button) => {
    const word = button.querySelector('.sound-word');
    const symbol = button.querySelector('.sound-symbol');
    if (word) word.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
    if (symbol) symbol.innerHTML = soundEnabled ? ICONS.soundOn : ICONS.soundOff;
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', soundEnabled ? 'Turn sound effects off' : 'Turn sound effects on');
  });
  syncSoundButtons();
  const playTone = (frequency, duration, type = 'sine', volume = 0.025, delay = 0) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const start = audioContext.currentTime + delay;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.075, volume * 2.8), start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch (_) { /* Audio is a decorative enhancement; the site works without it. */ }
  };
  function playSound(kind = 'click') {
    if (!soundEnabled) return;
    if (activeClickEvent?.eventPhase) clickSoundPlayed = true;
    const patterns = {
      click: [[740, .05, 'sine', .018, 0], [1040, .065, 'sine', .014, .022]],
      toggle: [[520, .07, 'sine', .012, 0], [760, .09, 'sine', .009, .05]],
      'theme-light': [[520, .085, 'sine', .012, 0], [720, .11, 'sine', .009, .055], [960, .13, 'sine', .006, .11]],
      'theme-dark': [[960, .085, 'sine', .009, 0], [720, .11, 'sine', .008, .055], [520, .13, 'sine', .006, .11]],
      navigate: [[420, .06, 'triangle', .014, 0]],
      swipe: [[330, .07, 'triangle', .016, 0], [510, .07, 'triangle', .012, .045]],
      popup: [[480, .08, 'sine', .014, 0], [620, .1, 'sine', .015, .06]],
      launch: [[390, .12, 'sine', .018, 0], [520, .13, 'sine', .018, .1], [780, .18, 'sine', .018, .2]],
    };
    (patterns[kind] || patterns.click).forEach(([frequency, duration, type, volume, delay]) => playTone(frequency, duration, type, volume, delay));
  }

  

  // Scroll sound removed by request. Keep no-op functions for existing event calls.
  function updateScrollSound() {}
  function stopScrollSound() {}

  // Sound effects toggle.
soundButtons.forEach((button) => {
  button.addEventListener('click', () => {
    soundEnabled = !soundEnabled;

    storage.set('amj-v4-sound', soundEnabled ? 'on' : 'off');
    syncSoundButtons();

    if (!soundEnabled) {
      stopScrollSound();
    } else {
      playSound('toggle');
    }
  });
});
  // Skill data: evidence wording stays conservative until actual certificates/work samples are attached.
  const skills = [
    { name: 'Adobe Photoshop', category: 'Visual Design', context: 'PRACTICAL DESIGN WORK', description: 'A visual editing and design tool used for image treatment, promotional graphics and visual compositions.', evidence: 'Practical creative work and design projects. Add a matching certificate only when the original document is available.', certificate: null },
    { name: 'Canva', category: 'Visual Design', context: 'PRACTICAL DESIGN WORK', description: 'A design platform used to create social media graphics, promotional layouts and communication materials.', evidence: 'Applied in creative and social content work. No certificate is linked until a verified file is supplied.', certificate: null },
    { name: 'PicsArt', category: 'Visual Design', context: 'PRACTICAL DESIGN WORK', description: 'Image editing and visual composition for digital graphics and creative content.', evidence: 'Practical creative use. Formal certification is not claimed here.', certificate: null },
    { name: 'Graphic Design', category: 'Visual Design', context: 'CLIENT & COMMUNITY PROJECTS', description: 'Visual communication through layout, typography, imagery and promotional design.', evidence: 'Supported by freelance design work and creative contributions to organisations.', certificate: null },
    { name: 'Filmora', category: 'Video & Content', context: 'PRACTICAL CONTENT WORK', description: 'Video editing software for assembling footage, basic effects, titles and social ready edits.', evidence: 'Practical editing experience. No formal certification is claimed here.', certificate: null },
    { name: 'CapCut', category: 'Video & Content', context: 'PRACTICAL CONTENT WORK', description: 'A video editing tool for short form content, timing, captions and visual storytelling.', evidence: 'Practical content editing use. Formal certification is not claimed here.', certificate: null },
    { name: 'Facebook Marketing', category: 'Digital Marketing', context: 'DIGITAL PROMOTION', description: 'Creating and supporting promotional content for Facebook audiences and business pages.', evidence: 'Related to social content and promotional campaign work. Specific campaign analytics are not published here.', certificate: null },
    { name: 'Instagram Marketing', category: 'Digital Marketing', context: 'DIGITAL PROMOTION', description: 'Planning visual first social content and promotional creatives for Instagram.', evidence: 'Related to social content and digital promotion work.', certificate: null },
    { name: 'Search Engine Optimization (SEO)', category: 'Digital Marketing', context: 'DIGITAL MARKETING KNOWLEDGE', description: 'Foundational understanding of improving the discoverability and structure of online content.', evidence: 'Listed as a digital marketing skill; this portfolio does not claim specific ranking results or formal certification.', certificate: null },
    { name: 'C Programming', category: 'Programming & ICT', context: 'TECHNICAL FOUNDATION', description: 'Foundational programming concepts using the C language, including syntax, logic and structured problem solving.', evidence: 'Technical learning and programming coursework. Presented as a foundation, not as a claim of advanced software engineering expertise.', certificate: null },
    { name: 'Computer Programming', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Core programming concepts and structured approaches to solving computational problems.', evidence: 'Covered through technical diploma studies and related learning.', certificate: null },
    { name: 'Programming Fundamentals', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts such as variables, conditions, loops, functions and logical problem solving.', evidence: 'Technical coursework and self directed practice.', certificate: null },
    { name: 'Computer Applications', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Using common computer applications and digital tools to support productivity and everyday tasks.', evidence: 'Covered in the ICT diploma programme.', certificate: null },
    { name: 'Information & Communication Technology', category: 'Programming & ICT', context: 'TECHNICAL EDUCATION', description: 'A broad foundation in computer systems, digital communication and applied information technology.', evidence: 'Formal technical study through the Diploma in Information & Communication Technology.', certificate: null },
    { name: 'Database Management Systems', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts in organising, storing and managing structured information in databases.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Data Structures & Algorithms', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational ways of organising data and approaching computational problems efficiently.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Internet & Web Technology', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Core concepts related to the internet, web technologies and building blocks of online experiences.', evidence: 'Covered in the ICT diploma programme, including a subject combining web technology with programming.', certificate: null },
    { name: 'Data Communication & Networking', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts behind how data is transmitted and how computer networks are structured.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Windows & Linux', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational knowledge of operating system concepts and working environments across Windows and Linux.', evidence: 'Covered in the Operating System subject of the ICT diploma programme.', certificate: null },
    { name: 'Cloud Computing', category: 'Programming & ICT', context: 'COURSEWORK', description: 'An introduction to cloud based computing concepts, services and digital infrastructure.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'System Analysis & Design', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Approaching information systems through requirements, analysis, planning and design concepts.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Programming with Visual Tools', category: 'Programming & ICT', context: 'COURSEWORK', description: 'An introduction to creating programmes with visual development tools and interfaces.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Creative Thinking', category: 'Business & Creativity', context: 'PRACTICAL & COLLABORATIVE', description: 'Exploring different approaches, developing concepts and finding useful ways to communicate ideas.', evidence: 'Reflected in creative projects, event contributions and visual problem solving.', certificate: null },
    { name: 'Communication', category: 'Business & Creativity', context: 'TEACHING & TEAMWORK', description: 'Sharing information and ideas clearly with learners, collaborators and team members.', evidence: 'Supported by ICT teaching, club responsibilities and collaborative activities.', certificate: null },
    { name: 'Teamwork', category: 'Business & Creativity', context: 'COMMUNITY INVOLVEMENT', description: 'Working with others toward shared objectives and contributing reliably to group activities.', evidence: 'Built through student clubs, volunteering and team based initiatives.', certificate: null },
    { name: 'Event Management', category: 'Leadership', context: 'CLUB & COMMUNITY ACTIVITIES', description: 'Helping coordinate activities, people and practical details for events and group initiatives.', evidence: 'Supported by college club involvement and event organising recognition.', certificate: null },
    { name: 'Team Leadership', category: 'Leadership', context: 'STUDENT LEADERSHIP', description: 'Taking responsibility, supporting peers and helping a team work toward a shared outcome.', evidence: 'Related to vice president responsibilities and youth leadership involvement.', certificate: null },
    { name: 'Administration', category: 'Leadership', context: 'CLUB OPERATIONS', description: 'Supporting organisation, coordination and day to day club responsibilities.', evidence: 'Related to the Administration & IT leadership role in the English Language Club.', certificate: null },
  ];

  const stage = document.getElementById('skill-stage');
  const filterHost = document.getElementById('skill-filters');
  const count = document.getElementById('skill-count');
  const progressFill = document.getElementById('skill-progress-fill');
  const dialog = document.getElementById('skill-dialog');
  const toast = document.getElementById('toast');
  let toastTimer = 0;
  let activeFilter = 'All';
  let visibleSkills = skills;
  let activeIndex = 0;
    const categories = ['All', ...new Set(skills.map((skill) => skill.category))];
  categories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category === 'All' ? 'ALL SKILLS' : category.toUpperCase();
    button.setAttribute('aria-pressed', String(category === activeFilter));
    button.addEventListener('click', () => {
      activeFilter = category;
      visibleSkills = category === 'All' ? skills : skills.filter((skill) => skill.category === category);
      activeIndex = 0;
      filterHost?.querySelectorAll('button').forEach((child) => {
  child.setAttribute('aria-pressed', String(child === button));
});
      renderSkills();
      playSound('navigate');
      if (typeof startAutoRotation === 'function') startAutoRotation();
    });
    filterHost?.appendChild(button);
  });

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const openSkillDetails = (skill) => {
    if (!dialog) return;
    document.getElementById('dialog-category').textContent = `${skill.category.toUpperCase()} / SKILL DETAILS`;
    document.getElementById('dialog-title').textContent = skill.name;
    document.getElementById('dialog-description').textContent = skill.description;
    document.getElementById('dialog-evidence').textContent = skill.evidence;
    const certificateLink = document.getElementById('dialog-certificate');
    if (skill.certificate) {
      certificateLink.href = skill.certificate;
      certificateLink.hidden = false;
    } else {
      certificateLink.hidden = true;
      certificateLink.removeAttribute('href');
    }
    if (typeof stopAutoRotation === 'function') stopAutoRotation();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else showToast('Skill details are available in this card.');
    playSound('popup');
  };


const skillCardCache = new Map();

const renderSkills = () => {
  if (!stage) return;

  const total = visibleSkills.length;
  const activeNames = new Set(visibleSkills.map(skill => skill.name));

  // Remove filtered-out cards from the stage, but keep them cached.
  [...stage.querySelectorAll('.skill-card')].forEach(card => {
    if (!activeNames.has(card.dataset.skillName)) {
      card.remove();
    }
  });

  visibleSkills.forEach((skill, index) => {
    // Reuse the original card instead of recreating it.
    let card = skillCardCache.get(skill.name);

    if (!card) {
      card = document.createElement('article');
      card.className = 'skill-card';

      card.innerHTML = `
        <div class="skill-card-head">
          <span class="skill-card-category"></span>
          <span class="skill-card-index"></span>
        </div>
        <h3></h3>
        <p></p>
        <div class="skill-card-footer">
          <span class="skill-context"></span>
          <button class="skill-more interactive" type="button">
            MORE DETAILS <span aria-hidden="true">↗</span>
          </button>
        </div>
      `;

      // Attach event listeners only once.
      card.addEventListener('click', (event) => {
        if (Date.now() < suppressCardClickUntil) return;

        const currentIndex = visibleSkills.indexOf(card._skill);
        if (currentIndex < 0) return;

        if (currentIndex !== activeIndex) {
          activeIndex = currentIndex;
          renderSkills();
          playSound('swipe');
          startAutoRotation();
        } else if (!event.target.closest('button')) {
          openSkillDetails(card._skill);
        }
      });

      card.querySelector('.skill-more').addEventListener('click', (event) => {
        event.stopPropagation();
        openSkillDetails(card._skill);
      });

      if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        card.addEventListener('pointermove', (event) => {
          if (card.dataset.slot !== 'active') return;

          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;

          card.style.setProperty('--tilt-y', `${x * 5}deg`);
          card.style.setProperty('--tilt-x', `${-y * 4}deg`);
        });

        card.addEventListener('pointerleave', () => {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      }

      skillCardCache.set(skill.name, card);
    }

    // Update the skill data on the reused card.
    card._skill = skill;
    card.dataset.skillName = skill.name;

    card.setAttribute('aria-label', `${skill.name}, ${skill.category}`);

    card.querySelector('.skill-card-category').textContent =
      skill.category.toUpperCase();

    card.querySelector('.skill-card-index').textContent =
      `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

    card.querySelector('h3').textContent = skill.name;
    card.querySelector('p').textContent = skill.description;
    card.querySelector('.skill-context').textContent = skill.context;

    // Calculate the shortest circular distance.
    let offset = index - activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    let slot = 'hidden';

    if (offset === 0) slot = 'active';
    else if (offset === -1) slot = 'prev';
    else if (offset === 1) slot = 'next';
    else if (offset === -2) slot = 'far-prev';
    else if (offset === 2) slot = 'far-next';

    // Update position without destroying the card.
    card.dataset.slot = slot;
    card.dataset.offset = String(offset);
    card.style.setProperty('--carousel-offset', offset);

    if (slot !== 'active') {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }

    // Append only when the card is not already in the stage.
    if (card.parentElement !== stage) {
      stage.appendChild(card);
    }
  });

  if (count) {
    count.textContent =
      `${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }

  if (progressFill) {
    progressFill.style.width =
      `${((activeIndex + 1) / Math.max(total, 1)) * 100}%`;
  }

};

      const moveSkill = (direction) => {
    if (visibleSkills.length < 2) return;

    activeIndex =
      (activeIndex + direction + visibleSkills.length) % visibleSkills.length;

    renderSkills();
    playSound('swipe');

    if (typeof startAutoRotation === 'function') {
      startAutoRotation();
    }
  };
  stage?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveSkill(-1);
    if (event.key === 'ArrowRight') moveSkill(1);
  });

  // Unified, continuous pointer drag for mouse, pen and touch.
  let dragStartX = null;
  let dragLastX = null;
  let dragStartTime = 0;
  let dragPointerId = null;
  let dragMoved = false;
  let suppressCardClickUntil = 0;
  let carouselTouching = false;

  const resetCardDrag = () => {
    stage?.querySelectorAll('.skill-card').forEach((card) => {
      card.style.translate = '0px 0px';
    });
  };

  const cancelPointerDrag = (event) => {
    if (dragStartX === null) return;
    if (event && event.pointerId !== dragPointerId) return;

    dragStartX = null;
    dragLastX = null;
    dragPointerId = null;
    dragMoved = false;
    stage?.classList.remove('is-dragging');
    resetCardDrag();
    carouselTouching = false;
    startAutoRotation();
  };

  stage?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.skill-more')) return;
    if (dragStartX !== null) return;

    dragStartX = event.clientX;
    dragLastX = event.clientX;
    dragStartTime = performance.now();
    dragPointerId = event.pointerId;
    dragMoved = false;
    carouselTouching = true;
    stopAutoRotation();
    stage.classList.add('is-dragging');

    try { stage.setPointerCapture(event.pointerId); } catch (_) {}
  });

  stage?.addEventListener('pointermove', (event) => {
    if (dragStartX === null || event.pointerId !== dragPointerId) return;
    const dx = event.clientX - dragStartX;
    dragLastX = event.clientX;
    if (Math.abs(dx) > 5) dragMoved = true;
    if (!dragMoved) return;

    // Live movement follows the pointer; side cards get a softer parallax response.
    stage.querySelectorAll('.skill-card').forEach((card) => {
      const slot = card.dataset.slot;
      const factor = slot === 'active' ? 1 : (slot === 'prev' || slot === 'next' ? 0.72 : 0.42);
      card.style.translate = `${dx * factor}px 0px`;
    });
  });

  const finishPointerDrag = (event) => {
    if (dragStartX === null || event.pointerId !== dragPointerId) return;

    const dx = event.clientX - dragStartX;
    const elapsed = Math.max(1, performance.now() - dragStartTime);
    const velocity = dx / elapsed; // px/ms
    const threshold = Math.max(42, Math.min(78, stage.clientWidth * 0.12));
    const shouldMove = dragMoved && (Math.abs(dx) > threshold || Math.abs(velocity) > 0.55);

    if (dragMoved) suppressCardClickUntil = Date.now() + 450;

    // Change card positions while drag offsets still exist, then animate those
    // offsets back to zero. This avoids the old reset-then-slide double motion.
    dragStartX = null;
    dragLastX = null;
    dragPointerId = null;
    stage.classList.remove('is-dragging');

    if (shouldMove) {
      activeIndex = (activeIndex + (dx < 0 ? 1 : -1) + visibleSkills.length) % visibleSkills.length;
      renderSkills();
      playSound('swipe');
    }
    resetCardDrag();
    carouselTouching = false;
    startAutoRotation();

    try {
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    } catch (_) {}
  };

  stage?.addEventListener('pointerup', finishPointerDrag);
  stage?.addEventListener('pointercancel', cancelPointerDrag);
  stage?.addEventListener('lostpointercapture', cancelPointerDrag);

  stage?.addEventListener('click', (event) => {
    if (Date.now() < suppressCardClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  dialog?.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('close', () => { if (typeof startAutoRotation === 'function') startAutoRotation(); });
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  

 // Elegant automatic 3D carousel rotation, paused during interaction.
let autoRotateTimer = null;
const AUTO_ROTATE_DELAY = 3200;

  const stopAutoRotation = () => {
    if (autoRotateTimer !== null) {
      window.clearTimeout(autoRotateTimer);
      autoRotateTimer = null;
    }
  };

  const startAutoRotation = () => {
    stopAutoRotation();
    if (
      !stage ||
      (dialog && dialog.open) ||
      carouselTouching ||
      visibleSkills.length < 2 ||
      document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

        autoRotateTimer = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % visibleSkills.length;
      renderSkills();
      startAutoRotation();
    }, AUTO_ROTATE_DELAY);
  };

      document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoRotation();
    else startAutoRotation();
  });

  // Render the first skill cards immediately.
  renderSkills();
  startAutoRotation();
  // Diploma subject list.
  const subjectToggle = document.querySelector('.expand-subjects');
  const subjectList = document.getElementById('subject-list');
  subjectToggle?.addEventListener('click', () => {
    const expanded = subjectToggle.getAttribute('aria-expanded') === 'true';
    subjectToggle.setAttribute('aria-expanded', String(!expanded));
    if (subjectList) subjectList.hidden = expanded;
    const symbol = subjectToggle.querySelector('span');
    if (symbol) symbol.textContent = expanded ? '＋' : '−';
    playSound('navigate');
  });

  // Subtle desktop magnetic response for primary controls.
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.explore-button, .nav-cta, .skill-more, .turquoise-link').forEach((control) => {
      control.addEventListener('pointermove', (event) => {
        const rect = control.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, 1);
        const dy = (event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height, 1);
        control.style.transform = `translate(${dx * 3}px, ${dy * 3}px)`;
      });
      control.addEventListener('pointerleave', () => { control.style.transform = ''; });
    });
  }

  // Current year + scroll-speed-reactive hyperspace streaks. The starfield itself stays anchored.
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  let scrollTicking = false;
  let previousScrollY = window.scrollY;
  let starWarpResetTimer;

  const setStarWarp = (distance) => {
    // Scroll delta drives streak length and brightness; the starfield stays anchored.
    const warp = Math.min(distance, 240);
    const streakLength = Math.round(70 + warp * 5.8);
    const primaryOpacity = Math.min(0.96, 0.08 + warp / 175);
    const secondaryOpacity = Math.min(0.78, 0.04 + warp / 250);
    root.style.setProperty('--warp-streak-length', `${streakLength}px`);
    root.style.setProperty('--warp-streak-opacity', String(primaryOpacity));
    root.style.setProperty('--warp-secondary-opacity', String(secondaryOpacity));
  };

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;

    window.requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const scrollDistance = Math.abs(currentScrollY - previousScrollY);
      setStarWarp(scrollDistance);
      window.clearTimeout(starWarpResetTimer);
      starWarpResetTimer = window.setTimeout(() => {
        root.style.setProperty('--warp-streak-length', '70px');
        root.style.setProperty('--warp-streak-opacity', '.08');
        root.style.setProperty('--warp-secondary-opacity', '.04');
      }, 260);
      updateScrollSound(scrollDistance);
      previousScrollY = currentScrollY;
      scrollTicking = false;
    });
  }, { passive: true });

  // Floating circular scroll progress button. Clicking it returns to the page opening.
  const scrollTopButton = document.getElementById('scroll-progress-top');
  const scrollProgressValue = document.getElementById('scroll-progress-value');
  if (scrollTopButton && scrollProgressValue) {
    const circumference = 2 * Math.PI * 18;
    scrollProgressValue.style.strokeDasharray = String(circumference);
    const updateScrollProgress = () => {
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      scrollProgressValue.style.strokeDashoffset = String(circumference * (1 - progress));
      scrollTopButton.classList.toggle('is-visible', window.scrollY > 240);
      scrollTopButton.hidden = false;
    };
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    // Draggable scroll-to-top control (touch + mouse).
    const dragKey = 'joy-scroll-progress-position';
    let dragPos = null;
    try { dragPos = JSON.parse(localStorage.getItem(dragKey) || 'null'); } catch (_) {}
    if (dragPos && Number.isFinite(dragPos.x) && Number.isFinite(dragPos.y)) {
      scrollTopButton.style.left = dragPos.x + 'px';
      scrollTopButton.style.top = dragPos.y + 'px';
      scrollTopButton.style.right = 'auto';
      scrollTopButton.style.bottom = 'auto';
    }
    let pointerStart = null, lastPoint = null, velocity = { x: 0, y: 0 };
    let moved = false, dragging = false, raf = 0;
    const clampPos = (x, y) => ({
      x: Math.max(8, Math.min(window.innerWidth - scrollTopButton.offsetWidth - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - scrollTopButton.offsetHeight - 8, y))
    });
    const place = (x, y, save = false) => {
      const p = clampPos(x, y);
      scrollTopButton.style.left = p.x + 'px'; scrollTopButton.style.top = p.y + 'px';
      scrollTopButton.style.right = 'auto'; scrollTopButton.style.bottom = 'auto';
      if (save) { try { localStorage.setItem(dragKey, JSON.stringify(p)); } catch (_) {} }
      return p;
    };
    const animateThrow = (vx, vy) => {
      cancelAnimationFrame(raf);
      let x = scrollTopButton.offsetLeft, y = scrollTopButton.offsetTop;
      const step = () => {
        vx *= 0.92; vy *= 0.92; x += vx; y += vy;
        const maxX = window.innerWidth - scrollTopButton.offsetWidth - 8, maxY = window.innerHeight - scrollTopButton.offsetHeight - 8;
        if (x < 8 || x > maxX) { x = Math.max(8, Math.min(maxX, x)); vx *= -0.42; }
        if (y < 8 || y > maxY) { y = Math.max(8, Math.min(maxY, y)); vy *= -0.42; }
        place(x, y);
        if (Math.abs(vx) + Math.abs(vy) > 0.6) raf = requestAnimationFrame(step);
        else { scrollTopButton.classList.remove('is-dragging','is-throwing'); place(x, y, true); }
      };
      scrollTopButton.classList.add('is-throwing'); raf = requestAnimationFrame(step);
    };
    scrollTopButton.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      pointerStart = { x: e.clientX, y: e.clientY, left: scrollTopButton.offsetLeft, top: scrollTopButton.offsetTop };
      lastPoint = { x: e.clientX, y: e.clientY, t: performance.now() }; velocity = { x: 0, y: 0 };
      moved = false; dragging = true; cancelAnimationFrame(raf);
      scrollTopButton.classList.add('is-dragging'); scrollTopButton.classList.remove('is-throwing');
      try { scrollTopButton.setPointerCapture(e.pointerId); } catch (_) {}
    });
    scrollTopButton.addEventListener('pointermove', (e) => {
      if (!dragging || !pointerStart) return;
      const dx = e.clientX - pointerStart.x, dy = e.clientY - pointerStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (!moved) return;
      e.preventDefault();
      const now = performance.now(), dt = Math.max(1, now - lastPoint.t);
      velocity = { x: (e.clientX - lastPoint.x) / dt * 16, y: (e.clientY - lastPoint.y) / dt * 16 };
      lastPoint = { x: e.clientX, y: e.clientY, t: now };
      place(pointerStart.left + dx, pointerStart.top + dy);
    });
    const finishDrag = (e) => {
      if (!dragging) return;
      dragging = false; scrollTopButton.classList.remove('is-dragging');
      if (moved) { e.preventDefault(); animateThrow(velocity.x, velocity.y); }
      else { scrollTopButton.classList.remove('is-throwing'); scrollTopButton.style.transform = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); history.replaceState(null, '', '#home'); }
      pointerStart = null;
    };
    scrollTopButton.addEventListener('pointerup', finishDrag);
    scrollTopButton.addEventListener('pointercancel', finishDrag);
    window.addEventListener('resize', () => {
      if (scrollTopButton.style.left && scrollTopButton.style.top) place(scrollTopButton.offsetLeft, scrollTopButton.offsetTop, true);
    });
  }

  // Scroll reveals for portfolio sections, without hiding content when observers are unavailable.
  const revealSections = [...document.querySelectorAll('.portfolio-content main > section, .contact-section')];
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -35px 0px' });
    revealSections.forEach((section) => {
      section.classList.add('reveal-section');
      revealObserver.observe(section);
    });
  } else {
    revealSections.forEach((section) => section.classList.add('is-visible'));
  }

  // Desktop-only custom cursor. The native pointer remains on touch devices.
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      root.classList.add('has-custom-cursor');
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      let ringX = x;
      let ringY = y;
      document.addEventListener('mousemove', (event) => {
        x = event.clientX;
        y = event.clientY;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
      }, { passive: true });
      const animateCursor = () => {
        ringX += (x - ringX) * .19;
        ringY += (y - ringY) * .19;
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
        window.requestAnimationFrame(animateCursor);
      };
      animateCursor();
      const hoverTargets = 'a, button, [role="button"], .skill-card';
      document.addEventListener('mouseover', (event) => {
        if (event.target instanceof Element && event.target.closest(hoverTargets)) ring.classList.add('hovering');
      });
      document.addEventListener('mouseout', (event) => {
        const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
        if (!nextTarget?.closest(hoverTargets)) ring.classList.remove('hovering');
      });
      document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      });
      document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      });
    }
  }

  // Global turquoise click ripple — subtle visual feedback anywhere on the page.
  document.addEventListener('click', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 720);
  }, { passive: true });

  // Universal click feedback — includes blank areas, side margins and non-interactive surfaces.
  document.addEventListener('click', (event) => {
    if (clickSoundPlayed) return;
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('a, button, [role="button"], [tabindex="0"], .document-reveal');
    if (!control) {
      playSound('click');
      return;
    }
    if (control.matches('a, button')) {
      control.classList.remove('tap-pulse');
      void control.offsetWidth;
      control.classList.add('tap-pulse');
      window.setTimeout(() => control.classList.remove('tap-pulse'), 380);
    }
    playSound('click');
  });


})();

/* V4 work gallery: nearby cards drift a few pixels toward the pointer. */
(() => {
  const galleries = [...document.querySelectorAll('.work-gallery')];
  const cards = [...document.querySelectorAll('.work-gallery [data-magnetic-card]')];
  const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!galleries.length || !cards.length || !pointerFine.matches || reducedMotion.matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'work-magnetic-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span>VIEW</span><b>↗</b>';
  document.body.appendChild(cursor);

  let pointerX = 0;
  let pointerY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let frame = 0;
  let overCard = false;
  const radius = 480;

  const updateAttraction = () => {
    const cursorDx = pointerX - cursorX;
    const cursorDy = pointerY - cursorY;
    cursorX += cursorDx * .2;
    cursorY += cursorDy * .2;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const dx = pointerX - (rect.left + rect.width / 2);
      const dy = pointerY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (!distance || distance >= radius) {
        card.style.setProperty('--magnetic-x', '0px');
        card.style.setProperty('--magnetic-y', '0px');
        return;
      }
      const strength = 1 - distance / radius;
      const pull = Math.min(22, distance * .14) * strength;
      card.style.setProperty('--magnetic-x', `${(dx / distance * pull).toFixed(2)}px`);
      card.style.setProperty('--magnetic-y', `${(dy / distance * pull).toFixed(2)}px`);
    });

    if (Math.abs(cursorDx) > .15 || Math.abs(cursorDy) > .15) {
      frame = window.requestAnimationFrame(updateAttraction);
    } else {
      frame = 0;
    }
  };

  galleries.forEach((gallery) => gallery.addEventListener('pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    const target = event.target instanceof Element ? event.target : null;
    overCard = Boolean(target?.closest('[data-magnetic-card]'));
    cursor.classList.toggle('is-visible', overCard);
    if (!frame) frame = window.requestAnimationFrame(updateAttraction);
  }, { passive: true }));

  const resetAttraction = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    overCard = false;
    cursor.classList.remove('is-visible');
    cards.forEach((card) => {
      card.style.setProperty('--magnetic-x', '0px');
      card.style.setProperty('--magnetic-y', '0px');
    });
  };
  galleries.forEach((gallery) => {
    gallery.addEventListener('pointerleave', resetAttraction);
    gallery.addEventListener('pointercancel', resetAttraction);
  });

})();
;

// The magnetic VIEW cursor replaces the repeated per-card open label on every device.
(() => {
  document.querySelectorAll('.work-gallery [data-magnetic-card]').forEach((card) => {
    const link = card.querySelector('.work-open-link');
    if (!link) return;
    const openWork = () => window.open(link.href, '_blank', 'noopener,noreferrer');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `Open ${card.querySelector('h3')?.textContent.trim() || 'project'}`);
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, video, summary, details')) return;
      openWork();
    });
    card.addEventListener('keydown', (event) => {
      if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      openWork();
    });
  });
})();
;

// V4 diploma preview privacy blur: click/tap to reveal or conceal.
document.querySelectorAll('.document-reveal').forEach(button => {
  button.addEventListener('click', () => {
    const preview = button.closest('.document-preview');
    const revealed = preview.classList.toggle('is-revealed');
    button.setAttribute('aria-pressed', String(revealed));
    button.querySelector('strong').textContent = revealed ? 'DOCUMENT VISIBLE' : 'DOCUMENT PROTECTED';
    button.querySelector('small').textContent = revealed ? 'CLICK TO CONCEAL' : 'CLICK TO REVEAL';
    button.querySelector('.reveal-hint').textContent = revealed ? 'Tap to hide' : 'Tap to view';
  });
});


/* V4: keep the Mac-style dock anchored at the bottom; add only a tiny scroll lift. */
(() => {
  const dock = document.getElementById('glass-dock');
  if (!dock) return;
  let settleTimer = 0;
  const onScroll = () => {
    dock.classList.add('dock-scroll-motion');
    dock.style.setProperty('transform', 'translateX(-50%) translateY(-3px)', 'important');
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      dock.classList.remove('dock-scroll-motion');
      dock.style.setProperty('transform', 'translateX(-50%) translateY(0)', 'important');
    }, 180);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    dock.style.setProperty('transform', 'translateX(-50%) translateY(0)', 'important');
  }, { passive: true });
})();
// V4 document preview expansion: compact cards, full-size on demand.
(() => {
  const dialog = document.createElement('div');
  dialog.className = 'document-lightbox';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Expanded document preview');
  dialog.innerHTML = '<div class="document-lightbox-panel"><button class="document-lightbox-close" type="button" aria-label="Close document preview">✕</button><iframe title="Expanded document preview" allow="autoplay"></iframe></div>';
  document.body.appendChild(dialog);
  const frame = dialog.querySelector('iframe');
  const close = () => { dialog.classList.remove('is-open'); frame.removeAttribute('src'); document.body.style.overflow = ''; };
  dialog.querySelector('.document-lightbox-close').addEventListener('click', close);
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dialog.classList.contains('is-open')) close(); });
  document.querySelectorAll('.document-reveal').forEach(button => {
    button.addEventListener('click', () => {
      const preview = button.closest('.document-preview');
      const existing = preview.querySelector('.document-expand');
      if (preview.classList.contains('is-revealed')) {
        if (!existing) {
          const expand = document.createElement('button');
          expand.type = 'button'; expand.className = 'document-expand'; expand.textContent = 'EXPAND ↗';
          expand.addEventListener('click', event => {
            event.stopPropagation();
            const source = preview.querySelector('iframe')?.getAttribute('src');
            if (!source) return;
            frame.src = source; dialog.classList.add('is-open'); document.body.style.overflow = 'hidden';
          });
          preview.appendChild(expand);
        }
      } else existing?.remove();
    });
  });
})();


/* V4 loader: deterministic greeting cycle with a fail-safe dismissal. */
(() => {
  const loader = document.getElementById('joy-loader');
  const greeting = document.getElementById('joy-loader-greeting');
  if (!loader || !greeting) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const greetings = ['Hello', 'স্বাগতম', 'こんにちは', 'أهلًا', 'स्वागत है', 'Hola', '你好'];
  let index = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add('is-exiting');
    window.setTimeout(() => loader.remove(), reducedMotion ? 80 : 550);
  };
  const watchdog = window.setTimeout(finish, 5000);
  const step = () => {
    if (finished || !loader.isConnected) { window.clearTimeout(watchdog); return; }
    if (index >= greetings.length) {
      window.clearTimeout(watchdog);
      window.setTimeout(finish, reducedMotion ? 80 : 120);
      return;
    }
    greeting.classList.remove('is-changing');
    greeting.textContent = greetings[index];
    const duration = index === 0 ? 620 : 330;
    index += 1;
    if (reducedMotion) { window.setTimeout(step, 100); return; }
    window.setTimeout(() => {
      greeting.classList.add('is-changing');
      window.setTimeout(() => {
        if (!finished && greeting.isConnected && index < greetings.length) greeting.classList.remove('is-changing');
      }, 110);
      window.setTimeout(step, 150);
    }, duration);
  };
  step();
})();
/* V4 certificate cards: gentle cursor-driven 3D tilt, reset smoothly on exit */
(() => {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.skill-certificate-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--certificate-tilt-y', (x * 4).toFixed(2) + 'deg');
      card.style.setProperty('--certificate-tilt-x', (-y * 3).toFixed(2) + 'deg');
    });
    const reset = () => { card.style.setProperty('--certificate-tilt-x','0deg'); card.style.setProperty('--certificate-tilt-y','0deg'); };
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
  });
})();

/* Cover identity labels: Focus Shift transition beneath the portrait. */
(() => {
 const host = document.querySelector('.hero-skill-words');
 if (!host) return;
 const items = Array.from(host.children).filter(el => el.tagName === 'SPAN').map(el => el.textContent.trim()).filter(Boolean);
 if (!items.length) return;
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const activate = index => items.forEach((_, i) => {
   const el = host.children[i];
   el.classList.toggle('focus-shift-active', i === index);
 });
 if (reduced) { activate(0); return; }
 let index = 0;
 activate(index);
 const cycle = () => {
   host.children[index]?.classList.remove('focus-shift-active');
   index = (index + 1) % items.length;
   host.children[index]?.classList.add('focus-shift-active');
   window.setTimeout(cycle, 2600);
 };
 window.setTimeout(cycle, 2600);
})();


/* Five-part mental health campaign carousel. */
(() => {
  document.querySelectorAll('[data-project-carousel]').forEach((carousel) => {
    const images = (carousel.dataset.images || '').split('|').filter(Boolean);
    const image = carousel.querySelector('.awareness-carousel-image');
    const count = carousel.querySelector('[data-carousel-count]');
    const card = carousel.closest('[data-magnetic-card]');
    const openLink = card?.querySelector('.work-open-link');
    if (images.length < 2 || !image || !count || !card || !openLink) return;
    let index = 0;
    const show = (next) => {
      index = (next + images.length) % images.length;
      image.src = images[index];
      image.alt = `Mental health awareness social graphic ${index + 1} of ${images.length}`;
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
      openLink.href = images[index];
    };
    carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(index - 1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1));
  });
})();

/* Removed the pointer-tracked name glow; the name keeps a steady hover appearance. */


/* Render a built-in preview when a project artwork file cannot be loaded. */
(() => {
  document.querySelectorAll('img[data-preview-fallback]').forEach((image) => {
    let fallbackUsed = false;
    const showFallback = () => {
      if (fallbackUsed) return;
      fallbackUsed = true;
      const fallback = image.getAttribute('data-preview-fallback');
      if (fallback) image.src = fallback;
    };
    image.addEventListener('error', showFallback);
    if (image.complete && !image.naturalWidth) showFallback();
  });
})();

/* Four native horizontal rails for the full portfolio, with an in-page project viewer. */
(() => {
  const mount = document.getElementById('portfolio-collections');
  const groups = window.portfolioProjectGroups;
  const dialog = document.getElementById('portfolio-dialog');
  if (!mount || !dialog || !Array.isArray(groups) || !groups.length) return;

  const media = document.getElementById('portfolio-dialog-media');
  const title = document.getElementById('portfolio-dialog-title');
  const kicker = document.getElementById('portfolio-dialog-kicker');
  const category = document.getElementById('portfolio-dialog-category');
  const fileName = document.getElementById('portfolio-dialog-file');
  const format = document.getElementById('portfolio-dialog-format');
  const projectFocus = document.getElementById('portfolio-dialog-focus');
  const discipline = document.getElementById('portfolio-dialog-discipline');
  const caseCopy = document.getElementById('portfolio-dialog-copy');
  const openOriginal = document.getElementById('portfolio-dialog-open');
  const count = document.getElementById('portfolio-dialog-count');
  const closeButton = dialog.querySelector('.portfolio-dialog-close');
  const previousButton = document.getElementById('portfolio-dialog-previous');
  const nextButton = document.getElementById('portfolio-dialog-next');
  const cursorNodes = [...document.querySelectorAll('.cursor-dot, .cursor-ring')];
  let activeGroup = 0;
  let activeProject = 0;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  groups.forEach((group) => {
    const section = make('section', 'portfolio-category');
    section.id = `work-${group.id}`;
    section.setAttribute('aria-labelledby', `portfolio-heading-${group.id}`);

    const header = make('div', 'portfolio-category-heading');
    const copy = make('div');
    copy.append(make('span', 'portfolio-category-kicker', `${group.number} / COLLECTION`));
    const heading = make('h3', '', group.title);
    heading.id = `portfolio-heading-${group.id}`;
    copy.append(heading, make('p', '', group.description));

    const tools = make('div', 'portfolio-rail-tools');
    tools.append(make('span', 'portfolio-rail-count', `${group.projects.length} PROJECTS`));
    const previous = make('button', 'portfolio-rail-arrow', '←');
    previous.type = 'button';
    previous.setAttribute('aria-label', `Scroll ${group.title} left`);
    const next = make('button', 'portfolio-rail-arrow', '→');
    next.type = 'button';
    next.setAttribute('aria-label', `Scroll ${group.title} right`);
    tools.append(previous, next);
    header.append(copy, tools);

    const rail = make('div', 'portfolio-rail');
    rail.setAttribute('role', 'group');
    rail.setAttribute('aria-label', `${group.title} projects`);
    const projectCards = [];
    group.projects.forEach((project, projectIndex) => {
      const card = make('button', 'portfolio-card');
      card.type = 'button';
      card.dataset.projectIndex = String(projectIndex);
      card.setAttribute('aria-label', `Open ${project.title}, ${group.title}`);

      const art = make('span', 'portfolio-card-art');
      const image = make('img');
      image.src = project.preview;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      art.append(image, make('span', 'portfolio-card-kind', project.format));
      if (project.type === 'video') art.append(make('span', 'portfolio-card-play', '▶'));

      const cardCopy = make('span', 'portfolio-card-copy');
      cardCopy.append(make('span', 'portfolio-card-index', `${String(projectIndex + 1).padStart(2, '0')} / ${group.title.toUpperCase()}`));
      cardCopy.append(make('span', 'portfolio-card-title', project.title));
      const action = make('span', 'portfolio-card-open');
      action.append(make('span', '', 'VIEW PROJECT'), make('span', '', '↗'));
      cardCopy.append(action);
      card.append(art, cardCopy);
      card.addEventListener('click', () => showProject(groups.indexOf(group), projectIndex, true));
      rail.append(card);
      projectCards.push(card);
    });

    // Duplicate the cards once so the slow rail can loop without a visible jump.
    const loopCards = projectCards.map((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.loopClone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      clone.addEventListener('click', () => showProject(groups.indexOf(group), Number(clone.dataset.projectIndex), true));
      rail.append(clone);
      return clone;
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let autoTimer = 0;
    let settleTimer = 0;
    let railVisible = false;
    let drag = null;
    let touchPointerId = null;
    let suppressClick = false;
    let loopPoint = 0;
    const motionAllowed = group.projects.length > 1 && !reduceMotion.matches;
    const getContentLeft = (card) => card.getBoundingClientRect().left
      - rail.getBoundingClientRect().left + rail.scrollLeft;

    const stopAuto = () => {
      if (autoTimer) window.clearTimeout(autoTimer);
      if (settleTimer) window.clearTimeout(settleTimer);
      autoTimer = 0;
      settleTimer = 0;
      if (rail.classList.contains('is-auto-scrolling')) {
        rail.scrollTo({ left: rail.scrollLeft, behavior: 'auto' });
      }
      rail.classList.remove('is-auto-scrolling');
    };
    const canAutoScroll = () => motionAllowed && railVisible && !drag && !document.hidden
      && !dialog.open && !rail.matches(':hover') && !rail.contains(document.activeElement);
    const normalizeLoop = () => {
      if (loopPoint > 0 && rail.scrollLeft >= loopPoint - 2) {
        const wrapped = rail.scrollLeft - loopPoint;
        rail.scrollLeft = wrapped > 0 ? wrapped % loopPoint : 0;
      }
    };
    const startAuto = (delay = 5200) => {
      if (!canAutoScroll() || autoTimer || settleTimer) return;
      autoTimer = window.setTimeout(() => {
        autoTimer = 0;
        if (!canAutoScroll()) return;
        normalizeLoop();
        const nextCard = [...projectCards, ...loopCards]
          .find((card) => getContentLeft(card) > rail.scrollLeft + 8);
        const nextLeft = nextCard ? Math.max(0, getContentLeft(nextCard) - 2) : loopPoint;
        rail.classList.add('is-auto-scrolling');
        rail.scrollTo({ left: nextLeft, behavior: 'smooth' });
        settleTimer = window.setTimeout(() => {
          settleTimer = 0;
          normalizeLoop();
          rail.classList.remove('is-auto-scrolling');
          startAuto(4300);
        }, 1050);
      }, delay);
    };
    const pauseAuto = (resumeDelay = 0) => {
      stopAuto();
      if (resumeDelay) startAuto(resumeDelay);
    };

    if (motionAllowed) {
      rail.addEventListener('pointerenter', () => pauseAuto());
      rail.addEventListener('pointerleave', () => startAuto(1600));
      rail.addEventListener('focusin', () => pauseAuto());
      rail.addEventListener('focusout', (event) => {
        if (!rail.contains(event.relatedTarget)) startAuto(1600);
      });
    }

    rail.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pauseAuto();
      // Let the browser handle touch scrolling so phones keep native swipe momentum.
      if (event.pointerType === 'touch') {
        touchPointerId = event.pointerId;
        return;
      }
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: rail.scrollLeft, moved: false };
      rail.classList.add('is-dragging');
      rail.setPointerCapture(event.pointerId);
    });
    rail.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) drag.moved = true;
      if (drag.moved) {
        rail.scrollLeft = drag.scroll - dx;
        event.preventDefault();
      }
    }, { passive: false });
    const finishDrag = (event) => {
      if (touchPointerId === event.pointerId) {
        touchPointerId = null;
        if (motionAllowed && !rail.matches(':hover')) startAuto(6500);
        return;
      }
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 0);
      }
      drag = null;
      rail.classList.remove('is-dragging');
      normalizeLoop();
      if (motionAllowed && !rail.matches(':hover')) startAuto(6500);
    };
    rail.addEventListener('pointerup', finishDrag);
    rail.addEventListener('pointercancel', finishDrag);
    rail.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const scrollRail = (direction) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: reduced ? 'auto' : 'smooth' });
    };
    previous.addEventListener('click', () => { pauseAuto(6500); scrollRail(-1); });
    next.addEventListener('click', () => { pauseAuto(6500); scrollRail(1); });
    section.append(header, rail);
    mount.append(section);
    if (loopCards[0]) loopPoint = getContentLeft(loopCards[0]);
    if (motionAllowed) {
      if ('IntersectionObserver' in window) {
        const railObserver = new IntersectionObserver(([entry]) => {
          railVisible = entry.isIntersecting;
          if (railVisible) startAuto(2200);
          else stopAuto();
        }, { threshold: 0.12 });
        railObserver.observe(rail);
      } else {
        railVisible = true;
        startAuto(2200);
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAuto();
        else startAuto(1800);
      });
      dialog.addEventListener('close', () => startAuto(1800));
    }
  });

  function showProject(groupIndex, projectIndex, openDialog = false) {
    activeGroup = groupIndex;
    activeProject = projectIndex;
    const group = groups[activeGroup];
    const project = group.projects[activeProject];
    media.replaceChildren();

    if (project.type === 'video') {
      const video = make('video', '');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = project.preview;
      video.src = project.asset;
      video.setAttribute('aria-label', project.title);
      media.append(video);
    } else if (project.type === 'pdf') {
      const frame = make('iframe', '');
      frame.src = `${project.asset}#view=FitH`;
      frame.title = `${project.title} PDF preview`;
      media.append(frame);
    } else {
      const image = make('img', '');
      image.src = project.asset;
      image.alt = project.title;
      image.decoding = 'async';
      media.append(image);
    }

    title.textContent = project.title;
    category.textContent = group.title.toUpperCase();
    kicker.textContent = `CASE STUDY / ${group.number}.${String(activeProject + 1).padStart(2, '0')}`;
    projectFocus.textContent = project.title;
    discipline.textContent = group.title;
    fileName.textContent = project.fileName;
    format.textContent = project.format;
    const caseSummaries = {
      posters: 'A campaign visual focused on the subject named in the title. Explore the artwork at full size, then move through the complete poster collection.',
      logos: 'A standalone identity mark from the supplied logo collection. Explore the full-size artwork and compare it with other marks in this collection.',
      presentations: 'A complete slide deck, available as a PDF. Browse it in its original format, then move through the other presentation projects.',
      videos: 'A motion project available for playback. Play the supplied video here, then move through the rest of the motion collection.'
    };
    caseCopy.textContent = caseSummaries[group.id] || 'Explore the finished project and its deliverable.';
    openOriginal.href = project.asset;
    openOriginal.textContent = project.type === 'image' ? 'VIEW FULL IMAGE ↗' : 'OPEN PROJECT FILE ↗';
    count.textContent = `${String(activeProject + 1).padStart(2, '0')} / ${String(group.projects.length).padStart(2, '0')}`;
    previousButton.disabled = group.projects.length < 2;
    nextButton.disabled = group.projects.length < 2;
    if (openDialog && !dialog.open) {
      cursorNodes.forEach((node) => dialog.append(node));
      dialog.showModal();
    }
  }

  previousButton.addEventListener('click', () => {
    const length = groups[activeGroup].projects.length;
    showProject(activeGroup, (activeProject + length - 1) % length);
  });
  nextButton.addEventListener('click', () => {
    const length = groups[activeGroup].projects.length;
    showProject(activeGroup, (activeProject + 1) % length);
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    media.replaceChildren();
    cursorNodes.forEach((node) => document.body.append(node));
  });

  // Scroll-linked premium fade for the opening cover. Reverse scrolling restores it naturally.
  const openingScreen = document.querySelector('.opening');
  if (openingScreen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let coverTickPending = false;
    const updateCoverFade = () => {
      coverTickPending = false;
      const bounds = openingScreen.getBoundingClientRect();
      const distance = Math.max(1, openingScreen.offsetHeight);
      const progress = Math.min(1, Math.max(0, -bounds.top / distance));
      openingScreen.style.setProperty('--cover-scroll-progress', progress.toFixed(3));
    };
    const scheduleCoverFade = () => {
      if (coverTickPending) return;
      coverTickPending = true;
      requestAnimationFrame(updateCoverFade);
    };
    window.addEventListener('scroll', scheduleCoverFade, { passive: true });
    window.addEventListener('resize', scheduleCoverFade, { passive: true });
    updateCoverFade();
  }

})();