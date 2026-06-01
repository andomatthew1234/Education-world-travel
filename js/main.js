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

  const themeToggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('ewt-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    root.classList.toggle('dark-mode', isDark);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      const icon = themeToggle.querySelector('.theme-icon');
      if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    }
    localStorage.setItem('ewt-theme', mode);
  };

  if (themeToggle) {
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
    themeToggle.addEventListener('click', () => {
      const nextTheme = root.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }
});
