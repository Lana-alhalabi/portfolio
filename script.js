/**
 * LANA PORTFOLIO — script.js
 *
 * Contents:
 *  1.  Starfield canvas
 *  2.  Scrolled nav (glass effect on scroll)
 *  3.  Active nav link highlight
 *  4.  Mobile menu toggle
 *  5.  Smooth anchor scrolling (polyfill fallback)
 *  6.  Scroll-reveal animations (IntersectionObserver)
 *  7.  Skill bar animations
 *  8.  Project category filter
 *  9.  Contact form validation & submission
 * 10.  CV download button check
 * 11.  Back-to-top button
 * 12.  Dynamic copyright year
 * 13.  Init
 */

'use strict';

/* ============================================================
   UTILITY
============================================================ */

/** Select one element. */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
/** Select all elements. */
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. STARFIELD CANVAS
   Draws a gentle, slowly-twinkling star field on the canvas
   element that sits in the .ambient-bg layer.
============================================================ */
function initStarfield() {
  const canvas = $('#starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, stars = [], animId;

  const STAR_COUNT  = 180;
  const STAR_COLOUR = 'rgba(255, 217, 235,'; // pink-pale base

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeStar() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.004 + 0.001,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function build() {
    stars = Array.from({ length: STAR_COUNT }, makeStar);
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    const t = ts * 0.001;

    for (const s of stars) {
      const alpha = 0.2 + 0.55 * Math.abs(Math.sin(t * s.speed * 60 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = STAR_COLOUR + alpha + ')';
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  // Respect reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    resize();
    build();
    // Static snapshot — no animation
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = STAR_COLOUR + '0.3)';
      ctx.fill();
    }
    return;
  }

  resize();
  build();
  animId = requestAnimationFrame(draw);

  window.addEventListener('resize', () => {
    resize();
    build();
  });
}

/* ============================================================
   2. SCROLLED NAV
   Adds/removes .scrolled class to the header as user scrolls.
============================================================ */
function initScrolledNav() {
  const header = $('#nav-header');
  if (!header) return;

  function update() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ============================================================
   3. ACTIVE NAV LINK
   Highlights the nav link matching the currently-visible section.
============================================================ */
function initActiveNav() {
  const sections  = $$('section[id]');
  const navLinks  = $$('.nav-link[data-section]');

  if (!sections.length || !navLinks.length) return;

  const navH = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-h')) || 68;

  function markActive() {
    let current = '';
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= navH + 40) {
        current = sec.id;
      }
    }
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }

  window.addEventListener('scroll', markActive, { passive: true });
  markActive();
}

/* ============================================================
   4. MOBILE MENU TOGGLE
============================================================ */
function initMobileMenu() {
  const toggle = $('#nav-toggle');
  const menu   = $('#mobile-menu');
  if (!toggle || !menu) return;

  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // Close on any mobile link click
  $$('.mobile-link', menu).forEach(link => {
    link.addEventListener('click', close);
  });

  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}

/* ============================================================
   5. SMOOTH ANCHOR SCROLLING
   Handles <a href="#id"> links with scroll-padding-top respect.
   The CSS scroll-behavior:smooth handles most cases; this also
   closes the mobile menu and updates the URL hash cleanly.
============================================================ */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update URL hash without jump
    history.pushState(null, '', '#' + targetId);
  });
}

/* ============================================================
   6. SCROLL REVEAL
   Uses IntersectionObserver to add .revealed to [data-reveal]
   elements as they enter the viewport.
============================================================ */
function initReveal() {
  // If reduced motion, reveal everything immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('[data-reveal]').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // reveal once
        }
      });
    },
    { threshold: 0.12 }
  );

  $$('[data-reveal]').forEach(el => observer.observe(el));
}

/* ============================================================
   7. SKILL BAR ANIMATIONS
   Reads the CSS custom property --skill-html etc. and sets the
   bar fill width once the skills section scrolls into view.
   This avoids fake percentages — you control all values in CSS.
============================================================ */
function initSkillBars() {
  const skillsSection = $('#skills');
  if (!skillsSection) return;

  // Map data-skill attribute → CSS variable name
  const CSS_VAR_PREFIX = '--skill-';

  function animateBars() {
    $$('.skill-bar-fill').forEach(bar => {
      const skill    = bar.dataset.skill;
      const cssVar   = CSS_VAR_PREFIX + skill;
      const target   = getComputedStyle(document.documentElement)
                         .getPropertyValue(cssVar).trim();
      if (target) {
        bar.style.width = target;
      }
    });
  }

  // Trigger when skills section enters view
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        animateBars();
        observer.disconnect();
      }
    },
    { threshold: 0.15 }
  );

  observer.observe(skillsSection);

  // Also trigger immediately if reduced-motion (no transition anyway)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animateBars();
  }
}

/* ============================================================
   8. PROJECT CATEGORY FILTER
============================================================ */
function initProjectFilter() {
  const filterBtns = $$('.filter-btn');
  const projects   = $$('.project-card');

  if (!filterBtns.length || !projects.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide projects
      projects.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ============================================================
   9. CONTACT FORM
   - Client-side validation
   - mailto: fallback (opens email client)
   - Formspree support (see comment below to enable)

   TO CONNECT FORMSPREE:
   1. Go to https://formspree.io and create a free account.
   2. Create a new form for your email address.
   3. Copy the endpoint URL (looks like: https://formspree.io/f/XXXXXXXX)
   4. Set FORMSPREE_ENDPOINT below.
   5. The form will POST to Formspree as JSON; no server needed.

   While FORMSPREE_ENDPOINT is empty (''), the form shows an info
   message and opens a pre-filled mailto: link instead.
============================================================ */

// ↓ REPLACE with your Formspree endpoint URL, or leave '' for mailto fallback
const FORMSPREE_ENDPOINT = '';

// ↓ REPLACE with your email address (used in mailto fallback)
const CONTACT_EMAIL = 'your.email@example.com';

function initContactForm() {
  const form       = $('#contact-form');
  const submitBtn  = $('#form-submit-btn');
  const statusEl   = $('#form-status');
  if (!form) return;

  /* ---- Validation helpers ---- */

  function showError(inputId, message) {
    const input = $('#' + inputId, form);
    const error = $('#' + inputId + '-error', form);
    if (input) input.classList.add('error');
    if (error) error.textContent = message;
  }

  function clearError(inputId) {
    const input = $('#' + inputId, form);
    const error = $('#' + inputId + '-error', form);
    if (input) input.classList.remove('error');
    if (error) error.textContent = '';
  }

  function clearAllErrors() {
    ['cf-name', 'cf-email', 'cf-service', 'cf-message'].forEach(clearError);
  }

  function setStatus(type, message) {
    statusEl.className = 'form-status ' + type;
    statusEl.textContent = message;
  }

  function clearStatus() {
    statusEl.className = 'form-status';
    statusEl.textContent = '';
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validate(data) {
    let valid = true;
    clearAllErrors();

    if (!data.name.trim()) {
      showError('cf-name', 'Please enter your name.');
      valid = false;
    }

    if (!data.email.trim()) {
      showError('cf-email', 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(data.email)) {
      showError('cf-email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!data.service) {
      showError('cf-service', 'Please select a service.');
      valid = false;
    }

    if (!data.message.trim() || data.message.trim().length < 20) {
      showError('cf-message', 'Please describe your project (at least 20 characters).');
      valid = false;
    }

    return valid;
  }

  /* ---- Clear error on input ---- */
  [['cf-name', 'name'], ['cf-email', 'email'], ['cf-service', 'service'], ['cf-message', 'message']]
    .forEach(([id]) => {
      const el = $('#' + id, form);
      if (el) el.addEventListener('input', () => clearError(id));
    });

  /* ---- Submit handler ---- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearStatus();

    const data = {
      name:    form.cf_name?.value    ?? $('[name="name"]',    form)?.value ?? '',
      email:   form.cf_email?.value   ?? $('[name="email"]',   form)?.value ?? '',
      service: form.cf_service?.value ?? $('[name="service"]', form)?.value ?? '',
      message: form.cf_message?.value ?? $('[name="message"]', form)?.value ?? '',
    };

    // Grab values directly to be safe
    data.name    = $('#cf-name',    form)?.value ?? '';
    data.email   = $('#cf-email',   form)?.value ?? '';
    data.service = $('#cf-service', form)?.value ?? '';
    data.message = $('#cf-message', form)?.value ?? '';

    if (!validate(data)) return;

    // ---- Path A: Formspree ----
    if (FORMSPREE_ENDPOINT) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name:    data.name,
            email:   data.email,
            service: data.service,
            message: data.message,
          }),
        });

        if (res.ok) {
          setStatus('success',
            '✦ Message sent! I\'ll get back to you within 1–2 business days.');
          form.reset();
        } else {
          const json = await res.json().catch(() => ({}));
          const errMsg = json?.errors?.map(e => e.message).join(', ')
            || 'Something went wrong. Please try emailing me directly.';
          setStatus('error-msg', '✗ ' + errMsg);
        }
      } catch {
        setStatus('error-msg',
          '✗ Could not send the message. Check your connection or email me directly.');
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
      return;
    }

    // ---- Path B: mailto fallback ----
    // We do NOT claim success. We open the user's email client instead.
    const subject = encodeURIComponent(
      'Project Inquiry — ' + (data.service || 'General') + ' — ' + data.name
    );
    const body = encodeURIComponent(
      'Hi Lana,\n\n'
      + 'Name: ' + data.name + '\n'
      + 'Email: ' + data.email + '\n'
      + 'Service: ' + data.service + '\n\n'
      + 'Project Details:\n' + data.message
      + '\n\n---\nSent from portfolio contact form'
    );

    setStatus('info',
      '📬 No backend is connected yet. Your email client will open with the details pre-filled.\n'
      + 'To enable direct form submissions, connect Formspree (see FORMSPREE_ENDPOINT in script.js).'
    );

    // Small delay so user reads the message
    setTimeout(() => {
      window.location.href =
        'mailto:' + CONTACT_EMAIL
        + '?subject=' + subject
        + '&body='    + body;
    }, 800);
  });
}

/* ============================================================
   10. CV DOWNLOAD BUTTON
   Checks whether the CV file actually exists. If not, shows
   a tooltip instead of navigating to a broken link.
============================================================ */
function initCVDownload() {
  const btn = $('#cv-download-btn');
  if (!btn) return;

  btn.addEventListener('click', e => {
    const href = btn.getAttribute('href');
    // If the path is still the placeholder, let the user know
    if (!href || href === 'assets/lana-cv.pdf') {
      // Try a HEAD request to check if the file exists
      fetch('assets/lana-cv.pdf', { method: 'HEAD' })
        .then(res => {
          if (!res.ok) {
            e.preventDefault();
            // Show a small note in the CV block
            const note = document.createElement('p');
            note.textContent = '⚠ CV file not added yet. Save your PDF as assets/lana-cv.pdf to enable this button.';
            note.style.cssText =
              'font-size:0.8rem;color:var(--clr-pink-light);margin-top:0.5rem;max-width:none;';
            const parent = btn.closest('.cv-download-block');
            if (parent && !parent.querySelector('.cv-missing-note')) {
              note.classList.add('cv-missing-note');
              parent.appendChild(note);
            }
          }
          // If res.ok, the download proceeds normally
        })
        .catch(() => {
          e.preventDefault();
          const note = document.createElement('p');
          note.textContent = '⚠ CV file not added yet. Save your PDF as assets/lana-cv.pdf to enable this button.';
          note.style.cssText =
            'font-size:0.8rem;color:var(--clr-pink-light);margin-top:0.5rem;max-width:none;';
          const parent = btn.closest('.cv-download-block');
          if (parent && !parent.querySelector('.cv-missing-note')) {
            note.classList.add('cv-missing-note');
            parent.appendChild(note);
          }
        });
    }
  });
}

/* ============================================================
   11. BACK TO TOP
============================================================ */
function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  function update() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', update, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  update();
}

/* ============================================================
   12. DYNAMIC COPYRIGHT YEAR
============================================================ */
function initYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   13. INIT — runs after DOM is parsed
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initScrolledNav();
  initActiveNav();
  initMobileMenu();
  initSmoothScroll();
  initReveal();
  initSkillBars();
  initProjectFilter();
  initContactForm();
  initCVDownload();
  initBackToTop();
  initYear();
});
