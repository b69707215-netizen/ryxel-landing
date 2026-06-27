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

  var downloadHTML =
    '<h3 class="modal__title" id="modalTitle">Download SEORYX</h3>' +
    '<p class="modal__sub">Native desktop app \u00b7 v2.0 \u00b7 Free 30-day trial \u00b7 No credit card</p>' +
    '<div class="oslist">' +
    '  <button type="button" class="osopt" data-action="dl-os" data-os="Windows" data-file="SEORYX-Setup-2.0.exe"><span class="osopt__ico">\u229e</span><span class="osopt__txt"><b>Windows</b><small>10 / 11 \u00b7 64-bit \u00b7 .exe \u00b7 84 MB</small></span><span class="osopt__arrow">\u2193</span></button>' +
    '  <button type="button" class="osopt" data-action="dl-os" data-os="macOS" data-file="SEORYX-2.0.dmg"><span class="osopt__ico">\u2318</span><span class="osopt__txt"><b>macOS</b><small>12+ \u00b7 Apple Silicon &amp; Intel \u00b7 .dmg \u00b7 90 MB</small></span><span class="osopt__arrow">\u2193</span></button>' +
    '  <button type="button" class="osopt" data-action="dl-os" data-os="Linux" data-file="SEORYX-2.0.AppImage"><span class="osopt__ico">\u25b8</span><span class="osopt__txt"><b>Linux</b><small>AppImage \u00b7 x86_64 \u00b7 88 MB</small></span><span class="osopt__arrow">\u2193</span></button>' +
    '</div>';

  function downloadProgressHTML(os, file) {
    return '<h3 class="modal__title" id="modalTitle">Downloading SEORYX for ' + os + '</h3>' +
      '<p class="modal__sub">Free 30-day trial \u00b7 No credit card</p>' +
      '<div class="dl">' +
      '  <div class="dl__row"><span>' + file + '</span><span class="dl__size">v2.0</span></div>' +
      '  <div class="dl__bar"><i id="dlBar"></i></div>' +
      '  <div class="dl__status" id="dlStatus">Preparing download\u2026</div>' +
      '</div>' +
      '<button type="button" class="btn btn--primary btn--lg form__submit" data-action="start-dl" data-file="' + file + '">Start download</button>';
  }

  /* ---------- Global click delegation for actions ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var action = t.getAttribute('data-action');

    switch (action) {
      case 'download':
        e.preventDefault();
        openModal(downloadHTML);
        break;
      case 'dl-os':
        e.preventDefault();
        modalBody.innerHTML = downloadProgressHTML(t.getAttribute('data-os'), t.getAttribute('data-file'));
        var sb = modalBody.querySelector('button');
        if (sb) sb.focus();
        break;
      case 'start-dl':
        e.preventDefault();
        simulateDownload(t);
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
        toast('Opening SEORYX on ' + t.getAttribute('data-net') + '\u2026');
        break;
      case 'plan':
        e.preventDefault();
        toast('Starting your ' + t.getAttribute('data-plan') + ' plan \u2014 redirecting to checkout\u2026');
        break;
      case 'faq':
        e.preventDefault();
        var item = t.closest('.faq__item');
        if (item) {
          var wasOpen = item.classList.contains('open');
          $$('.faq__item.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.faq__q').setAttribute('aria-expanded', 'false'); });
          if (!wasOpen) { item.classList.add('open'); t.setAttribute('aria-expanded', 'true'); }
        }
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
    var file = btn.getAttribute('data-file') || 'SEORYX-2.0';
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
        status.textContent = 'Done \u2014 ' + file + ' ready';
        btn.disabled = false;
        btn.textContent = 'Download again';
        setTimeout(closeModal, 1100);
        toast('Download complete \u2014 check your Downloads folder');
      }
    }, 320);
  }

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
  var revealEls = $$('.hero__copy, .hero__app, .stat, .card, .step, .shot, .price, .vs__inner, .faq__item, .section__title, .section__lead, .cta__inner');
  var dirMap = [
    ['.hero__copy, .section__title, .section__lead', 'reveal--left'],
    ['.hero__app', 'reveal--right'],
    ['.card, .shot, .price', 'reveal--scale']
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

  /* ---------- Animated node-network background (hero) ---------- */
  var canvas = $('#netbg');
  if (canvas && canvas.getContext && !prefersReduced) {
    var ctx = canvas.getContext('2d');
    var heroEl = $('.hero');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var w = 0, h = 0;

    function resize() {
      var r = heroEl.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(26, Math.min(60, Math.round(w * h / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var dist = dx * dx + dy * dy;
          if (dist < 18000) {
            var o = (1 - dist / 18000) * 0.5;
            ctx.strokeStyle = 'rgba(212,175,105,' + o.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        var near = (mdx * mdx + mdy * mdy) < 14000;
        ctx.beginPath();
        ctx.fillStyle = near ? 'rgba(232,196,120,.95)' : 'rgba(212,175,105,.6)';
        ctx.arc(p.x, p.y, near ? 2.6 : 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (near) {
          ctx.strokeStyle = 'rgba(232,196,120,' + (1 - (mdx * mdx + mdy * mdy) / 14000).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(step);
    }

    var raf;
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    heroEl.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 200); }, { passive: true });
    resize();
    step();
  }

  /* ---------- Rotating dotted globe (SEORYX planet) ---------- */
  var globe = $('#globe');
  if (globe && globe.getContext) {
    var gx = globe.getContext('2d');
    var gdpr = Math.min(window.devicePixelRatio || 1, 2);
    var N = 620, tilt = -0.42, ang = 0;
    var pts = [];
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;          // 1 .. -1
      var rad = Math.sqrt(1 - y * y);
      var theta = i * 2.399963229728653;       // golden angle
      pts.push({ x: Math.cos(theta) * rad, y: y, z: Math.sin(theta) * rad });
    }
    var gs = 0;
    function gResize() {
      gs = globe.clientWidth;
      globe.width = gs * gdpr; globe.height = gs * gdpr;
      gx.setTransform(gdpr, 0, 0, gdpr, 0, 0);
    }
    function gDraw() {
      var c = gs / 2, R = gs * 0.34;
      gx.clearRect(0, 0, gs, gs);
      var ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var x1 = p.x * ca - p.z * sa;
        var z1 = p.x * sa + p.z * ca;
        var y2 = p.y * ct - z1 * st;
        var z2 = p.y * st + z1 * ct;
        var depth = (z2 + 1) / 2;              // 0 back .. 1 front
        var sx = c + x1 * R, sy = c + y2 * R;
        var size = 0.5 + depth * 1.7;
        var alpha = 0.12 + depth * depth * 0.78;
        gx.beginPath();
        gx.fillStyle = (depth > 0.55 ? 'rgba(232,196,120,' : 'rgba(212,175,105,') + alpha.toFixed(3) + ')';
        gx.arc(sx, sy, size, 0, Math.PI * 2);
        gx.fill();
      }
      // orbit satellite
      var oa = ang * 2.2;
      var ox = Math.cos(oa) * R * 1.32, oz = Math.sin(oa) * R * 1.32;
      var oy = -oz * st;
      gx.beginPath();
      gx.fillStyle = 'rgba(255,244,214,.95)';
      gx.arc(c + ox, c + oy, 2.4, 0, Math.PI * 2);
      gx.fill();
    }
    var grt;
    gResize();
    window.addEventListener('resize', function () { clearTimeout(grt); grt = setTimeout(function () { gResize(); if (prefersReduced) gDraw(); }, 200); }, { passive: true });
    if (prefersReduced) {
      gDraw();
    } else {
      (function spin() { ang += 0.0022; gDraw(); requestAnimationFrame(spin); })();
    }
  }
})();
