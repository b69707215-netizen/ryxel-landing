(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Sticky header + scroll parallax (debounced via rAF) ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  var orbs = $$('.orb');
  var heroGlow = $('.hero__glow');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle('scrolled', y > 8);
      if (toTop) toTop.classList.toggle('show', y > 600);
      if (!prefersReduced && y < 900) {
        orbs.forEach(function (o) {
          var s = parseFloat(o.getAttribute('data-speed')) || 0;
          o.style.translate = '0 ' + (y * s).toFixed(1) + 'px';
        });
        if (heroGlow) heroGlow.style.translate = '0 ' + (y * 0.12).toFixed(1) + 'px';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth scroll for anchor links ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) { e.preventDefault(); return; }
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      nav && nav.classList.remove('mobile-open');
    });
  });
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Mobile nav ---------- */
  var toggle = $('#navToggle');
  var nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('mobile-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Toasts ---------- */
  var toasts = $('#toasts');
  function toast(msg, type) {
    if (!toasts) return;
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.innerHTML = '<span class="toast__ico">' + (type === 'error' ? '!' : '\u2713') + '</span><span>' + msg + '</span>';
    toasts.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    setTimeout(function () {
      el.classList.remove('in');
      setTimeout(function () { el.remove(); }, 350);
    }, 3400);
  }

  /* ---------- Modal ---------- */
  var modal = $('#modal');
  var modalBody = $('#modalBody');
  var lastFocus = null;
  function openModal(html) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modalBody.innerHTML = html;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var f = modal.querySelector('input, button, a');
    if (f) f.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  var loginHTML =
    '<h3 class="modal__title" id="modalTitle">Welcome back</h3>' +
    '<p class="modal__sub">Log in to your RYXEL account.</p>' +
    '<form class="form" data-form="login">' +
    '  <label>Email<input type="email" required placeholder="you@agency.com" /></label>' +
    '  <label>Password<input type="password" required placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" minlength="6" /></label>' +
    '  <button type="submit" class="btn btn--primary btn--lg form__submit">Log in</button>' +
    '  <p class="form__alt">No account? <a href="#" data-action="download-link">Download &amp; start free trial</a></p>' +
    '</form>';

  var downloadHTML =
    '<h3 class="modal__title" id="modalTitle">Download RYXEL for Windows</h3>' +
    '<p class="modal__sub">v2.0 \u00b7 64-bit \u00b7 Windows 10 / 11 \u00b7 Free 14-day trial</p>' +
    '<div class="dl">' +
    '  <div class="dl__row"><span>RYXEL-Setup-2.0.exe</span><span class="dl__size">84 MB</span></div>' +
    '  <div class="dl__bar"><i id="dlBar"></i></div>' +
    '  <div class="dl__status" id="dlStatus">Preparing download\u2026</div>' +
    '</div>' +
    '<button type="button" class="btn btn--primary btn--lg form__submit" data-action="start-dl">Start download</button>';

  /* ---------- Global click delegation for actions ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var action = t.getAttribute('data-action');

    switch (action) {
      case 'download':
      case 'download-link':
        e.preventDefault();
        openModal(downloadHTML);
        break;
      case 'start-dl':
        e.preventDefault();
        simulateDownload(t);
        break;
      case 'login':
        e.preventDefault();
        openModal(loginHTML);
        break;
      case 'webversion':
        // anchor handles scroll; just notify
        toast('Loading the web version preview\u2026');
        break;
      case 'pdf':
        e.preventDefault();
        toast('Generating \u201c' + t.getAttribute('data-report') + '\u201d PDF\u2026');
        break;
      case 'edit':
        e.preventDefault();
        toast('Opening \u201c' + t.getAttribute('data-report') + '\u201d schedule\u2026');
        break;
      case 'social':
        e.preventDefault();
        toast('Opening RYXEL on ' + t.getAttribute('data-net') + '\u2026');
        break;
      case 'close-modal':
        e.preventDefault();
        closeModal();
        break;
    }
  });

  function simulateDownload(btn) {
    var bar = $('#dlBar');
    var status = $('#dlStatus');
    if (!bar) return;
    btn.disabled = true;
    var p = 0;
    status.textContent = 'Downloading\u2026';
    var iv = setInterval(function () {
      p = Math.min(100, p + Math.random() * 16 + 6);
      bar.style.width = p + '%';
      status.textContent = 'Downloading\u2026 ' + Math.round(p) + '%';
      if (p >= 100) {
        clearInterval(iv);
        status.textContent = 'Done \u2014 RYXEL-Setup-2.0.exe ready';
        btn.disabled = false;
        btn.textContent = 'Download again';
        setTimeout(closeModal, 1100);
        toast('Download complete \u2014 check your Downloads folder');
      }
    }, 320);
  }

  /* ---------- Login form submit ---------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form="login"]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('.form__submit');
    btn.disabled = true;
    btn.textContent = 'Signing in\u2026';
    setTimeout(function () {
      closeModal();
      toast('Signed in successfully. Welcome back!');
    }, 900);
  });

  /* ---------- Keyword filter chips ---------- */
  var chips = $$('.chip[data-filter]');
  var rows = $$('.kw-table tbody tr');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('chip--active'); });
      chip.classList.add('chip--active');
      var f = chip.getAttribute('data-filter');
      rows.forEach(function (r) {
        var pos = parseInt(r.getAttribute('data-pos'), 10);
        var trend = r.getAttribute('data-trend');
        var show =
          f === 'all' ||
          (f === 'top10' && pos <= 10) ||
          (f === 'improved' && trend === 'improved') ||
          (f === 'drops' && trend === 'drops');
        r.classList.toggle('hidden', !show);
      });
    });
  });

  /* ---------- Scroll reveal (with directional variants) ---------- */
  var revealEls = $$('.hero__copy, .hero__app, .stat, .card, .step, .shot, .section__title, .section__lead, .cta__inner');
  var dirMap = [
    ['.hero__copy, .section__title, .section__lead', 'reveal--left'],
    ['.hero__app', 'reveal--right'],
    ['.card, .shot', 'reveal--scale']
  ];
  revealEls.forEach(function (el) { el.classList.add('reveal'); });
  dirMap.forEach(function (pair) {
    $$(pair[0]).forEach(function (el) { el.classList.add(pair[1]); });
  });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var sibs = Array.prototype.indexOf.call(en.target.parentNode.children, en.target);
          setTimeout(function () { en.target.classList.add('in'); }, (sibs % 6) * 70);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  var counters = $$('[data-count]');
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (prefersReduced) { el.innerHTML = target.toFixed(decimals) + suffix; return; }
    var start = null, dur = 1500;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.innerHTML = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Animate chart bars when in view ---------- */
  var barGroups = $$('.bars');
  function playBars(group) {
    $$('i', group).forEach(function (bar, i) {
      var h = bar.style.getPropertyValue('--h');
      bar.style.height = '0%';
      setTimeout(function () { bar.style.height = h; }, prefersReduced ? 0 : i * 60);
    });
  }
  if ('IntersectionObserver' in window && !prefersReduced) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { playBars(en.target); bio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    barGroups.forEach(function (g) { bio.observe(g); });
  }

  /* ---------- Subtle parallax tilt on hero app ---------- */
  var app = $('.hero__app');
  if (app && !prefersReduced && window.matchMedia('(pointer:fine)').matches) {
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
      var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      app.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { app.style.transform = ''; });
  }
})();
