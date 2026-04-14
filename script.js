// Scroll reveal
const revealEls = document.querySelectorAll(
  '#about, #experience, #skills, #education, #contact, ' +
  '.timeline-item, .skill-group, .stat-card, .edu-card'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);

revealEls.forEach(el => observer.observe(el));

// Active nav highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + sec.id) {
          a.style.color = 'var(--accent-light)';
        }
      });
    }
  });
}, { passive: true });
