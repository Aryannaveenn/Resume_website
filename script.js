// Scroll reveal
const revealEls = document.querySelectorAll(
  '#about, #experience, #skills, #education, #contact, ' +
  '.skill-group, .stat-card, .edu-card'
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

// Experience carousel
const timeline = document.querySelector('.timeline');
const prevBtn = document.querySelector('.timeline-nav.prev');
const nextBtn = document.querySelector('.timeline-nav.next');
const currentLabel = document.querySelector('.timeline-current');
const totalLabel = document.querySelector('.timeline-total');

if (timeline && prevBtn && nextBtn) {
  const items = timeline.querySelectorAll('.timeline-item');
  const total = items.length;
  if (totalLabel) totalLabel.textContent = total;

  const getIndex = () => {
    const step = timeline.scrollWidth / total;
    return Math.round(timeline.scrollLeft / step);
  };

  const update = () => {
    const idx = getIndex();
    if (currentLabel) currentLabel.textContent = idx + 1;
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= total - 1;
  };

  const scrollToIndex = idx => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    const target = items[clamped];
    if (target) {
      timeline.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
  };

  prevBtn.addEventListener('click', () => scrollToIndex(getIndex() - 1));
  nextBtn.addEventListener('click', () => scrollToIndex(getIndex() + 1));

  let scrollTimer;
  timeline.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(update, 80);
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
}
