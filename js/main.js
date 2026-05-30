document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.site-nav .nav-link');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      links.forEach((item) => item.classList.remove('active'));
      event.currentTarget.classList.add('active');
    });
  });
});
