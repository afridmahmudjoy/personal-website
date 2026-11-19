(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const symbol = document.querySelector('.theme-symbol');
  const word = document.querySelector('.theme-word');
  const saved = (() => { try { return localStorage.getItem('amj-theme'); } catch (_) { return null; } })();
  const applyTheme = theme => {
    root.dataset.theme = theme;
    const light = theme === 'light';
    if (symbol) symbol.textContent = light ? '☾' : '☼';
    if (word) word.textContent = light ? 'DARK' : 'LIGHT';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(light));
      toggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f2f4ed' : '#0b0e0d';
  };
  applyTheme(saved === 'light' ? 'light' : 'dark');
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('amj-theme', next); } catch (_) {}
  });

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  if (window.matchMedia('(pointer:fine)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    document.addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      dot.style.opacity = '1'; ring.style.opacity = '1';
      dot.style.left = x + 'px'; dot.style.top = y + 'px';
    });
    const animate = () => {
      rx += (x - rx) * .18; ry += (y - ry) * .18;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animate);
    };
    animate();
    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }
})();

/* =====================================
   SCROLL REVEAL ANIMATION
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  const revealElements = document.querySelectorAll(
    ".hero-copy, .hero-art, .hero-bottom, " +
    ".about-section, .experience-section, " +
    ".leadership-section, .skills-section, " +
    ".work-section, .credentials-section, " +
    ".brand-section, .next-section, .contact-section"
  );

  revealElements.forEach((element) => {
    element.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
});
