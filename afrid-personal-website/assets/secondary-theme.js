(() => {
  const root = document.documentElement;
  const controls = [...document.querySelectorAll('.detail-theme-toggle')];
  const meta = document.querySelector('meta[name="theme-color"]');
  const read = () => {
    try { return localStorage.getItem('amj-v5-theme'); } catch (_) { return null; }
  };
  const write = (theme) => {
    try { localStorage.setItem('amj-v5-theme', theme); } catch (_) {}
  };
  const apply = (theme) => {
    const light = theme === 'light';
    root.dataset.theme = light ? 'light' : 'dark';
    controls.forEach((control) => {
      control.textContent = light ? 'DARK' : 'LIGHT';
      control.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      control.setAttribute('aria-pressed', String(light));
    });
    if (meta) meta.content = light ? '#f5f8f8' : '#071120';
  };
  apply(read() === 'dark' ? 'dark' : 'light');
  controls.forEach((control) => control.addEventListener('click', () => {
    const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    write(theme);
    apply(theme);
  }));
})();
