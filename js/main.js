document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.site-nav .nav-link');
  const nav = document.querySelector('.site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const currentPath = window.location.pathname.toLowerCase();

  links.forEach((link) => {
    const target = link.getAttribute('href');
    if (!target) return;
    if (target.trim().startsWith('#')) return;
    const resolved = new URL(target, window.location.origin + currentPath).pathname.toLowerCase();
    if (currentPath.endsWith(resolved) || resolved.endsWith(currentPath)) {
      links.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    }

    link.addEventListener('click', (event) => {
      links.forEach((item) => item.classList.remove('active'));
      event.currentTarget.classList.add('active');
      if (nav && navToggle && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
});
