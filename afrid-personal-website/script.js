(() => {
  'use strict';

  const root = document.documentElement;
  // V4 cinematic JOY loader: short, animated, and skipped for reduced motion.
  const joyLoader = document.getElementById('joy-loader');
  if (joyLoader) {
    const statusEl = document.getElementById('loader-status');
    const percentEl = document.getElementById('loader-percent');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loaderStages = ['INITIALIZING INTERFACE','SYNCING CREATIVE MODULES','PREPARING PORTFOLIO'];
    if (reduceMotion) { joyLoader.classList.add('is-leaving'); window.setTimeout(() => joyLoader.remove(), 80); }
    else {
      let stage = 0; let percent = 0;
      const stageTimer = window.setInterval(() => { stage = (stage + 1) % loaderStages.length; if(statusEl) statusEl.textContent = loaderStages[stage]; }, 560);
      const percentTimer = window.setInterval(() => { percent = Math.min(100, percent + Math.ceil(Math.random()*9)); if(percentEl) percentEl.textContent = String(percent).padStart(2,'0')+'%'; if(percent >= 100) window.clearInterval(percentTimer); }, 110);
      window.setTimeout(() => { window.clearInterval(stageTimer); if(percentEl) percentEl.textContent='100%'; joyLoader.classList.add('is-leaving'); window.setTimeout(() => joyLoader.remove(), 700); }, 2050);
    }
  }

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
      if (symbol) symbol.textContent = isLight ? '☾' : '☼';
      if (word) word.textContent = isLight ? 'DARK' : 'LIGHT';
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    });
    if (themeMeta) themeMeta.content = isLight ? '#eaf7f7' : '#071312';
  };
  applyTheme(storage.get('amj-v4-theme') === 'light' ? 'light' : 'dark');
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storage.set('amj-v4-theme', next);
    playSound('toggle');
  }));

  // Move the opening portrait into the main-page identity as the portfolio opens.
  const exploreButton = document.getElementById('explore-button');
  const portfolio = document.getElementById('portfolio-content');
  const openingPortrait = document.querySelector('.portrait-image');
  const destinationAvatar = portfolio?.querySelector('.brand-avatar');
  let portfolioOpened = false;

  exploreButton?.addEventListener('click', () => {
    if (!portfolio || portfolioOpened) return;
    portfolioOpened = true;

    const exploreTitle = exploreButton.querySelector('strong');
    const exploreSubtitle = exploreButton.querySelector('small');
    if (exploreTitle) exploreTitle.textContent = 'PROFILE READY';
    if (exploreSubtitle) exploreSubtitle.textContent = 'WELCOME TO MY PORTFOLIO';
    exploreButton.setAttribute('aria-expanded', 'true');
    portfolio.hidden = false;
    const aboutSection = document.getElementById('about');
    aboutSection?.classList.add('profile-summary-pending');
    playSound('launch');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!openingPortrait || !destinationAvatar || reducedMotion) {
      const aboutSection = document.getElementById('about');
      window.setTimeout(() => {
        aboutSection?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        if (reducedMotion) {
          aboutSection?.classList.remove('profile-summary-pending');
          aboutSection?.classList.add('profile-summary-reveal');
        } else {
          window.setTimeout(() => {
            aboutSection?.classList.remove('profile-summary-pending');
            aboutSection?.classList.add('profile-summary-reveal');
          }, 520);
        }
      }, 120);
      return;
    }

    const startRect = openingPortrait.getBoundingClientRect();
    if (!startRect.width || !startRect.height) {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // The travelling clone stays fixed to the viewport while the page switches scenes.
    const portraitFlight = openingPortrait.cloneNode(true);
    portraitFlight.className = 'shared-portrait-flight';
    portraitFlight.alt = '';
    portraitFlight.setAttribute('aria-hidden', 'true');
    Object.assign(portraitFlight.style, {
      left: startRect.left + 'px',
      top: startRect.top + 'px',
      width: startRect.width + 'px',
      height: startRect.height + 'px',
      borderRadius: '2px'
    });
    document.body.appendChild(portraitFlight);
    destinationAvatar.classList.add('is-arriving');
    openingPortrait.classList.add('portrait-in-flight');

    // Reveal the portfolio at its own top so the avatar has a real destination.
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, window.scrollY + portfolio.getBoundingClientRect().top);
    root.style.scrollBehavior = previousScrollBehavior;

    let finished = false;
    let finishTimer = 0;
    const finishPortraitFlight = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(finishTimer);
      portraitFlight.remove();
      openingPortrait.classList.remove('portrait-in-flight');
      destinationAvatar.classList.remove('is-arriving');
      const aboutSection = document.getElementById('about');
      window.setTimeout(() => {
        aboutSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          aboutSection?.classList.remove('profile-summary-pending');
          aboutSection?.classList.add('profile-summary-reveal');
        }, 520);
      }, 180);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetRect = destinationAvatar.getBoundingClientRect();
        if (!targetRect.width || !targetRect.height) {
          finishPortraitFlight();
          return;
        }
        destinationAvatar.classList.add('is-arriving');
        portraitFlight.style.left = targetRect.left + 'px';
        portraitFlight.style.top = targetRect.top + 'px';
        portraitFlight.style.width = targetRect.width + 'px';
        portraitFlight.style.height = targetRect.height + 'px';
        portraitFlight.style.borderRadius = '11px';
        portraitFlight.style.boxShadow = '0 3px 18px rgba(0,0,0,.3), 0 0 18px rgba(67,234,209,.2)';
      });
    });

    portraitFlight.addEventListener('transitionend', (event) => {
      if (event.target === portraitFlight && event.propertyName === 'width') finishPortraitFlight();
    });
    finishTimer = window.setTimeout(finishPortraitFlight, 1350);
  });

  // Mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menuButton?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('open') ?? false;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    playSound('navigate');
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    playSound('navigate');
  }));

 // Interface sounds enabled by default; generated locally with Web Audio.
  let soundEnabled = storage.get('amj-v4-sound') !== 'off';
  let audioContext = null;
  const soundButtons = [...document.querySelectorAll('.sound-toggle')];
  const syncSoundButtons = () => soundButtons.forEach((button) => {
    const word = button.querySelector('.sound-word');
    const symbol = button.querySelector('.sound-symbol');
    if (word) word.textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
    if (symbol) symbol.textContent = soundEnabled ? '♫' : '♪';
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
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch (_) { /* Audio is a decorative enhancement; the site works without it. */ }
  };
  function playSound(kind = 'click') {
    if (!soundEnabled) return;
    const patterns = {
      click: [[680, .075, 'sine', .018, 0]],
      toggle: [[520, .09, 'sine', .018, 0], [760, .11, 'sine', .014, .07]],
      navigate: [[420, .06, 'triangle', .014, 0]],
      swipe: [[330, .07, 'triangle', .016, 0], [510, .07, 'triangle', .012, .045]],
      popup: [[480, .08, 'sine', .014, 0], [620, .1, 'sine', .015, .06]],
      launch: [[390, .12, 'sine', .018, 0], [520, .13, 'sine', .018, .1], [780, .18, 'sine', .018, .2]],
    };
    (patterns[kind] || patterns.click).forEach(([frequency, duration, type, volume, delay]) => playTone(frequency, duration, type, volume, delay));
  }

  

  // Soft airy wind sound while scrolling.
  let scrollAudio = null;
  let scrollSoundTimer = null;

  function updateScrollSound(distance) {
    if (!soundEnabled || distance < 0.8) {
      stopScrollSound();
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      audioContext ||= new AudioContextClass();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      if (scrollSoundTimer) {
        clearTimeout(scrollSoundTimer);
        scrollSoundTimer = null;
      }

      if (!scrollAudio) {
        const bufferSize = audioContext.sampleRate * 2;
        const noiseBuffer = audioContext.createBuffer(
          1, bufferSize, audioContext.sampleRate
        );

        const data = noiseBuffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.025 * white) / 1.025;
          data[i] = lastOut * 3.5;
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const gain = audioContext.createGain();

        source.buffer = noiseBuffer;
        source.loop = true;

        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;

        gain.gain.value = 0.0001;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        source.start();

        scrollAudio = { source, filter, gain };
      }

      const speed = Math.min(distance, 25);

      scrollAudio.filter.frequency.setTargetAtTime(
        650 + speed * 65, now, 0.08
      );

      scrollAudio.gain.gain.setTargetAtTime(
        Math.min(0.018, 0.003 + speed * 0.00055),
        now,
        0.08
      );

      scrollSoundTimer = window.setTimeout(() => {
        stopScrollSound();
      }, 180);

    } catch (_) {
      // Scrolling remains functional if audio is unavailable.
    }
  }

  function stopScrollSound() {
    if (scrollSoundTimer) {
      clearTimeout(scrollSoundTimer);
      scrollSoundTimer = null;
    }

    if (!scrollAudio || !audioContext) return;

    const currentAudio = scrollAudio;
    scrollAudio = null;

    try {
      currentAudio.gain.gain.setTargetAtTime(
        0.0001,
        audioContext.currentTime,
        0.12
      );

      window.setTimeout(() => {
        try {
          currentAudio.source.stop();
        } catch (_) {}
      }, 500);
    } catch (_) {}
  }
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
    { name: 'Canva', category: 'Visual Design', context: 'PRACTICAL DESIGN WORK', description: 'A design platform used to create social media graphics, promotional layouts and communication materials.', evidence: 'Applied in creative and social-content work. No certificate is linked until a verified file is supplied.', certificate: null },
    { name: 'PicsArt', category: 'Visual Design', context: 'PRACTICAL DESIGN WORK', description: 'Image editing and visual composition for digital graphics and creative content.', evidence: 'Practical creative use. Formal certification is not claimed here.', certificate: null },
    { name: 'Graphic Design', category: 'Visual Design', context: 'CLIENT & COMMUNITY PROJECTS', description: 'Visual communication through layout, typography, imagery and promotional design.', evidence: 'Supported by freelance design work and creative contributions to organisations.', certificate: null },
    { name: 'Filmora', category: 'Video & Content', context: 'PRACTICAL CONTENT WORK', description: 'Video-editing software for assembling footage, basic effects, titles and social-ready edits.', evidence: 'Practical editing experience. No formal certification is claimed here.', certificate: null },
    { name: 'CapCut', category: 'Video & Content', context: 'PRACTICAL CONTENT WORK', description: 'A video editing tool for short-form content, timing, captions and visual storytelling.', evidence: 'Practical content-editing use. Formal certification is not claimed here.', certificate: null },
    { name: 'Facebook Marketing', category: 'Digital Marketing', context: 'DIGITAL PROMOTION', description: 'Creating and supporting promotional content for Facebook audiences and business pages.', evidence: 'Related to social-content and promotional campaign work. Specific campaign analytics are not published here.', certificate: null },
    { name: 'Instagram Marketing', category: 'Digital Marketing', context: 'DIGITAL PROMOTION', description: 'Planning visual-first social content and promotional creatives for Instagram.', evidence: 'Related to social-content and digital promotion work.', certificate: null },
    { name: 'Search Engine Optimization (SEO)', category: 'Digital Marketing', context: 'DIGITAL MARKETING KNOWLEDGE', description: 'Foundational understanding of improving the discoverability and structure of online content.', evidence: 'Listed as a digital-marketing skill; this portfolio does not claim specific ranking results or formal certification.', certificate: null },
    { name: 'C Programming', category: 'Programming & ICT', context: 'TECHNICAL FOUNDATION', description: 'Foundational programming concepts using the C language, including syntax, logic and structured problem-solving.', evidence: 'Technical learning and programming coursework. Presented as a foundation, not as a claim of advanced software engineering expertise.', certificate: null },
    { name: 'Computer Programming', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Core programming concepts and structured approaches to solving computational problems.', evidence: 'Covered through technical diploma studies and related learning.', certificate: null },
    { name: 'Programming Fundamentals', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts such as variables, conditions, loops, functions and logical problem-solving.', evidence: 'Technical coursework and self-directed practice.', certificate: null },
    { name: 'Computer Applications', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Using common computer applications and digital tools to support productivity and everyday tasks.', evidence: 'Covered in the ICT diploma programme.', certificate: null },
    { name: 'Information & Communication Technology', category: 'Programming & ICT', context: 'TECHNICAL EDUCATION', description: 'A broad foundation in computer systems, digital communication and applied information technology.', evidence: 'Formal technical study through the Diploma in Information & Communication Technology.', certificate: null },
    { name: 'Database Management Systems', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts in organising, storing and managing structured information in databases.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Data Structures & Algorithms', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational ways of organising data and approaching computational problems efficiently.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Internet & Web Technology', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Core concepts related to the internet, web technologies and building blocks of online experiences.', evidence: 'Covered in the ICT diploma programme, including a subject combining web technology with programming.', certificate: null },
    { name: 'Data Communication & Networking', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational concepts behind how data is transmitted and how computer networks are structured.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Windows & Linux', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Foundational knowledge of operating-system concepts and working environments across Windows and Linux.', evidence: 'Covered in the Operating System subject of the ICT diploma programme.', certificate: null },
    { name: 'Cloud Computing', category: 'Programming & ICT', context: 'COURSEWORK', description: 'An introduction to cloud-based computing concepts, services and digital infrastructure.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'System Analysis & Design', category: 'Programming & ICT', context: 'COURSEWORK', description: 'Approaching information systems through requirements, analysis, planning and design concepts.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Programming with Visual Tools', category: 'Programming & ICT', context: 'COURSEWORK', description: 'An introduction to creating programmes with visual development tools and interfaces.', evidence: 'Covered as a subject in the ICT diploma programme.', certificate: null },
    { name: 'Creative Thinking', category: 'Business & Creativity', context: 'PRACTICAL & COLLABORATIVE', description: 'Exploring different approaches, developing concepts and finding useful ways to communicate ideas.', evidence: 'Reflected in creative projects, event contributions and visual problem-solving.', certificate: null },
    { name: 'Communication', category: 'Business & Creativity', context: 'TEACHING & TEAMWORK', description: 'Sharing information and ideas clearly with learners, collaborators and team members.', evidence: 'Supported by ICT teaching, club responsibilities and collaborative activities.', certificate: null },
    { name: 'Teamwork', category: 'Business & Creativity', context: 'COMMUNITY INVOLVEMENT', description: 'Working with others toward shared objectives and contributing reliably to group activities.', evidence: 'Built through student clubs, volunteering and team-based initiatives.', certificate: null },
    { name: 'Event Management', category: 'Leadership', context: 'CLUB & COMMUNITY ACTIVITIES', description: 'Helping coordinate activities, people and practical details for events and group initiatives.', evidence: 'Supported by college club involvement and event-organising recognition.', certificate: null },
    { name: 'Team Leadership', category: 'Leadership', context: 'STUDENT LEADERSHIP', description: 'Taking responsibility, supporting peers and helping a team work toward a shared outcome.', evidence: 'Related to vice-president responsibilities and youth leadership involvement.', certificate: null },
    { name: 'Administration', category: 'Leadership', context: 'CLUB OPERATIONS', description: 'Supporting organisation, coordination and day-to-day club responsibilities.', evidence: 'Related to the Administration & IT leadership role in the English Language Club.', certificate: null },
  ];

  const stage = document.getElementById('skill-stage');
  const filterHost = document.getElementById('skill-filters');
  const count = document.getElementById('skill-count');
  const progressFill = document.getElementById('skill-progress-fill');
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
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

      if (window.matchMedia('(pointer: fine)').matches) {
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

  if (prevButton) prevButton.disabled = total < 2;
  if (nextButton) nextButton.disabled = total < 2;
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
  prevButton?.addEventListener('click', () => moveSkill(-1));
  nextButton?.addEventListener('click', () => moveSkill(1));
  stage?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveSkill(-1);
    if (event.key === 'ArrowRight') moveSkill(1);
  });

  // Unified mouse, pen and touch dragging.
  let dragStartX = null;
  let dragPointerId = null;
  let dragMoved = false;
let suppressCardClickUntil = 0;
let carouselTouching = false;
  
  const resetCardDrag = () => {
    stage?.querySelectorAll('.skill-card').forEach((card) => {
      card.style.translate = '';
    });
  };

  stage?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('.skill-more')) return;

    dragStartX = event.clientX;
    dragPointerId = event.pointerId;
    dragMoved = false;

    carouselTouching = true;
    stopAutoRotation();

    stage.classList.add('is-dragging');

    try {
      stage.setPointerCapture(event.pointerId);
    } catch (_) {}
  });

  stage?.addEventListener('pointermove', (event) => {
    if (dragStartX === null || event.pointerId !== dragPointerId) return;

    const dx = event.clientX - dragStartX;

    if (Math.abs(dx) > 4) dragMoved = true;
    if (!dragMoved) return;

    stage.querySelectorAll('.skill-card').forEach((card) => {
      card.style.translate = `${dx}px 0`;
    });
  });

  const finishPointerDrag = (event) => {
    if (dragStartX === null || event.pointerId !== dragPointerId) return;

    const dx = event.clientX - dragStartX;
    const shouldMove = dragMoved && Math.abs(dx) > 48;

    if (dragMoved) {
      suppressCardClickUntil = Date.now() + 420;
    }

    dragStartX = null;
    dragPointerId = null;

    stage.classList.remove('is-dragging');
    resetCardDrag();

    carouselTouching = false;

if (shouldMove) {
  moveSkill(dx < 0 ? 1 : -1);
} else {
  startAutoRotation();
}

    try {
      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    } catch (_) {}
  };

  stage?.addEventListener('pointerup', finishPointerDrag);

  const cancelPointerDrag = () => {
    if (dragStartX === null) return;

    dragStartX = null;
    dragPointerId = null;
    dragMoved = false;

    resetCardDrag();
    stage?.classList.remove('is-dragging');

    carouselTouching = false;
    startAutoRotation();
  };

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
const AUTO_ROTATE_DELAY = 2000;

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
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.explore-button, .nav-cta, .carousel-arrow, .skill-more, .turquoise-link').forEach((control) => {
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
    }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
    revealSections.forEach((section) => {
      section.classList.add('reveal-section');
      revealObserver.observe(section);
    });
  } else {
    revealSections.forEach((section) => section.classList.add('is-visible'));
  }

  // Desktop-only custom cursor. The native pointer remains on touch devices.
  if (window.matchMedia('(pointer: fine)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
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
      document.addEventListener('mouseover', (event) => {
        if (event.target.closest('a, button, .skill-card')) ring.classList.add('hovering');
      });
      document.addEventListener('mouseout', (event) => {
        if (event.target.closest('a, button, .skill-card')) ring.classList.remove('hovering');
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

  // Small click cue for ordinary links and buttons; specific controls above play their own tone.
  document.addEventListener('click', (event) => {
    const control = event.target.closest('a, button');
    if (!control) return;
    control.classList.remove('tap-pulse');
    void control.offsetWidth;
    control.classList.add('tap-pulse');
    window.setTimeout(() => control.classList.remove('tap-pulse'), 380);
    if (control.matches('.theme-toggle, .sound-toggle, .menu-toggle, .carousel-arrow, .skill-more, .expand-subjects, #explore-button')) return;
    playSound('click');
  });


/* =========================================
   GLASS DOCK ACTIVE SECTION NAVIGATION
========================================= */

const glassDock = document.querySelector('#glass-dock');

if (glassDock) {
  const dockLinks = [...glassDock.querySelectorAll('.dock-item')];

  const dockSections = dockLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  // Smooth navigation
  dockLinks.forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);

      if (!target) return;

      event.preventDefault();

      // Home button: close portfolio and return to opening screen
      if (href === '#home') {
        portfolio.hidden = true;
        portfolioOpened = false;

        exploreButton?.setAttribute('aria-expanded', 'false');

        const exploreTitle = exploreButton?.querySelector('strong');
        const exploreSubtitle = exploreButton?.querySelector('small');

        if (exploreTitle) exploreTitle.textContent = 'EXPLORE PORTFOLIO';
        if (exploreSubtitle) exploreSubtitle.textContent = 'DISCOVER MY JOURNEY';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.replaceState(null, '', '#home');

        return;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      history.replaceState(null, '', href);
    });
  });

  // Highlight the current section
  const dockObserver = new IntersectionObserver(entries => {
    const visibleSections = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visibleSections.length) return;

    const currentId = visibleSections[0].target.id;

    dockLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${currentId}`;

      link.classList.toggle('active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'location');
        link.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }, {
    rootMargin: '-20% 0px -55% 0px',
    threshold: [0, 0.1, 0.25, 0.5]
  });

  dockSections.forEach(section => dockObserver.observe(section));
}
})();
