// ===== TIME SLIDER =====
(function () {
  const slider    = document.getElementById('time-slider');
  const celestial = document.getElementById('celestial');
  const timeHm    = document.getElementById('time-hm');
  const timePeriod= document.getElementById('time-period');
  const bgSun     = document.getElementById('bg-sun');
  const bgMoon    = document.getElementById('bg-moon');

  // Arc helpers — returns {x, y} as viewport percentages for a body at phase t ∈ [0,1]
  function arc(t, xMin, xMax, yPeak, yEdge) {
    return {
      x: xMin + (xMax - xMin) * t,
      y: yEdge - (yEdge - yPeak) * Math.sin(t * Math.PI)
    };
  }

  // dawn 5–7 am → 0→1, full day 7–17, dusk 5–7 pm → 1→0, else 0
  function dayMix(hour) {
    if (hour < 5)          return 0;
    if (hour < 7)          return (hour - 5) / 2;
    if (hour < 17)         return 1;
    if (hour < 19)         return (19 - hour) / 2;
    return 0;
  }

  function applyTime(minutes) {
    const hour  = minutes / 60;
    const isDay = hour >= 6 && hour < 18;

    // ── Continuous colour blend ────────────────────────────
    document.documentElement.style.setProperty(
      '--day-mix', (dayMix(hour) * 100).toFixed(1) + '%'
    );

    // ── Slider indicator ──────────────────────────────────
    const pct = Math.max(2.5, Math.min(97.5, (minutes / 1439) * 100));
    celestial.style.left = pct + '%';
    if (isDay) {
      celestial.textContent = '☀️';
      celestial.className   = 'celestial-body is-day';
    } else {
      celestial.textContent = '🌙';
      celestial.className   = 'celestial-body is-night';
    }

    // ── Time label ────────────────────────────────────────
    const rawHour = Math.floor(hour);
    const mins    = String(minutes % 60).padStart(2, '0');
    const h12     = rawHour % 12 || 12;
    timeHm.textContent    = h12 + ':' + mins;
    timePeriod.textContent = hour < 12 ? 'AM' : 'PM';

    // ── Background sun (arcs 6 am → noon → 6 pm) ─────────
    const sunT  = Math.max(0, Math.min(1, (hour - 6) / 12));
    const sunPos = arc(sunT, 6, 94, 10, 68);
    bgSun.style.left    = sunPos.x + '%';
    bgSun.style.top     = sunPos.y + 'vh';
    bgSun.style.opacity =
      hour < 5  ? '0' :
      hour < 6  ? String(hour - 5) :
      hour < 18 ? '1' :
      hour < 19 ? String(19 - hour) : '0';

    // ── Background moon (arcs 6 pm → midnight → 6 am) ────
    // Normalise night phase: 6pm=0, midnight=0.5, 6am=1
    const moonT = hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12;
    const moonPos = arc(moonT, 6, 94, 12, 68);
    bgMoon.style.left    = moonPos.x + '%';
    bgMoon.style.top     = moonPos.y + 'vh';
    bgMoon.style.opacity =
      (hour >= 7 && hour < 17)  ? '0' :
      (hour >= 6 && hour < 7)   ? String(7 - hour) :
      (hour >= 17 && hour < 18) ? String(hour - 17) : '1';
  }

  // Initialise to current local time
  const now      = new Date();
  const initMins = now.getHours() * 60 + now.getMinutes();
  slider.value   = initMins;
  applyTime(initMins);

  slider.addEventListener('input', function () {
    applyTime(Number(this.value));
  });
})();

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
