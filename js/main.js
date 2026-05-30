document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.site-nav .nav-link');
  const currentPath = window.location.pathname.toLowerCase();

  links.forEach((link) => {
    const target = link.getAttribute('href');
    if (!target) return;
    const resolved = new URL(target, window.location.origin + currentPath).pathname.toLowerCase();
    if (currentPath.endsWith(resolved) || resolved.endsWith(currentPath)) {
      links.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    }

    link.addEventListener('click', (event) => {
      links.forEach((item) => item.classList.remove('active'));
      event.currentTarget.classList.add('active');
    });
  });
});
