document.getElementById('year').textContent = new Date().getFullYear();
// Placeholder social links are intentionally disabled until real URLs are added.
document.querySelectorAll('[data-placeholder-link]').forEach((link) => {
  const destination = link.getAttribute('href') || '';
  if (destination.includes('YOUR_')) {
    link.addEventListener('click', (event) => event.preventDefault());
    link.setAttribute('aria-disabled', 'true');
    link.style.opacity = '0.55';
    link.style.cursor = 'default';
  }
});
