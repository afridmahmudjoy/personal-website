(() => {
  'use strict';

  const canvas = document.getElementById('opening-bowl');
  const hero = document.getElementById('home');
  const statement = document.getElementById('scroll-statement');
  const statementCopy = document.getElementById('scroll-statement-copy');
  const headline = document.getElementById('hero-title');
  if (!canvas || !hero || !statement || !statementCopy || !headline) return;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const getPalette = () => document.documentElement.dataset.theme === 'light'
    ? { light: true, base: [255, 255, 255], inner: [155, 215, 226], glow: [78, 182, 174], rim: [204, 213, 255], ink: [11, 29, 58], accent: [8, 127, 116], highlightEnd: [112, 86, 181], ghost: [150, 169, 182] }
    : { light: false, base: [7, 17, 32], inner: [8, 37, 49], glow: [76, 221, 201], rim: [45, 54, 99], ink: [244, 248, 255], accent: [70, 231, 205], highlightEnd: [166, 138, 255], ghost: [128, 151, 174] };
  const targets = [
    [0, .30, .34, .22], [.03, .45, .38, .26], [.08, .65, .38, .22],
    [.18, .80, .38, .22], [.40, .95, .38, .19], [.66, 1.05, .46, .16],
    [.87, 1.05, .66, .13], [1.15, 1.10, .90, .10], [1.43, 1.30, 1.60, .10],
    [1.80, 2.40, 3.00, .10]
  ];

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t);
  const interpolate = (q) => {
    let index = 0;
    while (index < targets.length - 2 && q > targets[index + 1][0]) index++;
    const a = targets[index], b = targets[index + 1];
    const t = clamp((q - a[0]) / (b[0] - a[0]));
    const shape = [1, 2, 3].map((part) => a[part] + (b[part] - a[part]) * t);
    // Keep the bowl arc visible from the first frame in both themes.
    shape[0] += .38;
    return shape;
  };

  const makeLetters = (element) => {
    const label = element.getAttribute('aria-label') || element.textContent.replace(/\s+/g, ' ').trim();
    element.setAttribute('aria-label', label);
    const chars = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const parent = node.parentElement;
      const highlighted = Boolean(parent?.closest('.gradient-word'));
      const fragment = document.createDocumentFragment();
      const pieces = node.nodeValue.match(/\s+|\S+/g) || [];
      pieces.forEach((piece) => {
        if (/^\s+$/.test(piece)) {
          fragment.append(document.createTextNode(piece));
          return;
        }
        const word = document.createElement('span');
        word.className = 'reveal-word';
        for (const letter of piece) {
          const char = document.createElement('span');
          char.className = 'reveal-char';
          char.setAttribute('aria-hidden', 'true');
          char.textContent = letter;
          if (highlighted) char.dataset.highlight = 'true';
          chars.push(char);
          word.append(char);
        }
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    return chars;
  };

  const heroChars = makeLetters(headline);
  const statementChars = makeLetters(statementCopy);
  const paint = (chars, progress, spread, finalColor, accentColor, ghostColor) => {
    const amount = Math.max(1, chars.length);
    const highlighted = chars.filter((char) => char.dataset.highlight === 'true');
    chars.forEach((char, index) => {
      const local = clamp((progress * (1 + spread) - index / amount) / spread);
      const flagged = char.dataset.highlight === 'true';
      let color = ghostColor;
      let opacity = 0;
      let blur = 8;
      if (local > .0 && local < .35) {
        opacity = local / .35;
        blur = 8 - 6.5 * (local / .35);
      } else if (local < .7) {
        opacity = 1;
        color = mix(ghostColor, accentColor, smooth((local - .35) / .35));
        blur = 1.5 * (1 - smooth((local - .35) / .35));
      } else if (local >= .7) {
        opacity = 1;
        const palette = getPalette();
        const hueProgress = flagged ? highlighted.indexOf(char) / Math.max(1, highlighted.length - 1) : 0;
        color = flagged ? mix(accentColor, palette.highlightEnd, hueProgress) : mix(accentColor, finalColor, smooth((local - .7) / .3));
        blur = 0;
      }
      char.style.opacity = opacity.toFixed(3);
      char.style.color = `rgb(${color.map((value) => Math.round(value)).join(',')})`;
      char.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    });
  };

  const edgeDistance = (px, py, tip, half, aspect, curve) => {
    let nearest = Infinity;
    for (let index = 0; index < curve.length - 1; index++) {
      const a = curve[index], b = curve[index + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const scale = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy));
      const ex = px - (a[0] + scale * dx), ey = py - (a[1] + scale * dy);
      nearest = Math.min(nearest, Math.hypot(ex, ey));
    }
    const inside = py < tip && px < half * aspect * Math.pow(Math.max(0, 1 - py / tip), .72);
    // A small inner bias keeps the glow on the bowl edge instead of washing
    // most of the viewport with the filled surface.
    return (inside ? -nearest : nearest) - .035;
  };

  const drawBowl = (tip, half, softness, palette) => {
    const width = canvas.width, height = canvas.height, aspect = window.innerWidth / window.innerHeight;
    const curve = [];
    for (let index = 0; index < 48; index++) {
      const yy = -.3 + (tip + .3) * index / 47;
      curve.push([half * aspect * Math.pow(Math.max(0, 1 - yy / tip), .72), yy]);
    }
    const image = context.createImageData(width, height);
    let offset = 0;
    for (let y = 0; y < height; y++) {
      const py = y / height;
      for (let x = 0; x < width; x++) {
        const px = Math.abs(x / width - .5) * aspect;
        const distance = edgeDistance(px, py, tip, half, aspect, curve);
        const fill = 1 - smooth((distance + softness) / (2 * softness));
        let color;
        if (palette.light) {
          const rimBlend = smooth(fill / .42) * .86;
          const coreBlend = smooth((fill - .38) / .62) * .78;
          const surface = mix(palette.base, palette.rim, rimBlend);
          const core = mix(surface, palette.inner, coreBlend);
          const glow = Math.exp(-Math.pow((fill - .5) / .2, 2)) * .22;
          color = mix(core, palette.glow, glow);
        } else {
          const rim = mix(palette.base, palette.rim, smooth(fill / .42) * .78);
          const deep = mix(rim, palette.inner, smooth((fill - .22) / .68) * .76);
          const glow = Math.exp(-Math.pow((fill - .5) / .2, 2)) * .58;
          color = mix(deep, palette.glow, glow);
        }
        image.data[offset++] = color[0];
        image.data[offset++] = color[1];
        image.data[offset++] = color[2];
        image.data[offset++] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  };

  let frame = 0;
  let startTime = 0;
  let current = [.0, .0, .1];
  let lastScroll = -1;
  const update = (time) => {
    frame = 0;
    if (!startTime) startTime = time;
    const height = Math.max(1, window.innerHeight);
    const q = window.scrollY / height;
    const intro = reducedMotion ? 1 : smooth(clamp((time - startTime - 250) / 1050));
    const target = interpolate(q);
    const initial = [-.3, .3, .1];
    const idle = reducedMotion ? 0 : time;
    const wanted = [
      initial[0] + (target[0] + Math.sin(idle * .00033 + 1.3) * .02 - initial[0]) * intro,
      initial[1] + (target[1] + Math.sin(idle * .0005) * .015 - initial[1]) * intro,
      initial[2] + (target[2] - initial[2]) * intro
    ];
    if (reducedMotion || time - startTime < 1300) current = wanted;
    else current = current.map((value, index) => value + (wanted[index] - value) * .12);
    const palette = getPalette();
    // Keep the opening glow comfortably above the hero's lower edge, then
    // restore its full scroll transition as the first viewport is left.
    const openingScale = 1 - .16 * (1 - smooth(q));
    drawBowl(current[0] * openingScale, current[1], current[2] * openingScale, palette);

    const heroProgress = reducedMotion ? 1 : clamp((time - startTime - 220) / 1250);
    paint(heroChars, heroProgress, .35, palette.ink, palette.accent, palette.ghost);
    const statementProgress = reducedMotion ? 1 : clamp((q - .56) / 2.03);
    paint(statementChars, statementProgress, .16, palette.ink, palette.accent, palette.ghost);
    const rise = reducedMotion ? 0 : .205 * Math.pow(1 - clamp((q - .69) / .74), 2) * height;
    statementCopy.style.transform = `translateY(${rise.toFixed(1)}px)`;
    document.getElementById('main-nav')?.classList.toggle('statement-cta-on', statementProgress > .4);

    if (!reducedMotion && q < 2.3) frame = window.requestAnimationFrame(update);
  };
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };
  const onScroll = () => {
    const q = window.scrollY / Math.max(1, window.innerHeight);
    if (Math.abs(q - lastScroll) < .002) return;
    lastScroll = q;
    schedule();
  };

  const renderStatic = () => {
    const palette = getPalette();
    const q = window.scrollY / Math.max(1, window.innerHeight);
    const shape = interpolate(q);
    const openingScale = 1 - .16 * (1 - smooth(q));
    drawBowl(shape[0] * openingScale, shape[1], shape[2] * openingScale, palette);
    paint(heroChars, 1, .35, palette.ink, palette.accent, palette.ghost);
    paint(statementChars, 1, .16, palette.ink, palette.accent, palette.ghost);
  };
  if (reducedMotion) {
    renderStatic();
  } else {
    window.requestAnimationFrame(update);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  new MutationObserver(() => {
    if (reducedMotion) renderStatic();
    else schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
