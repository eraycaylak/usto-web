// USTO — landing etkileşimleri
(function () {
  'use strict';

  // Tema geçişi
  var themeBtn = document.getElementById('theme-btn');
  var root = document.documentElement;
  function currentTheme() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function applyIcon() { if (themeBtn) themeBtn.textContent = currentTheme() === 'dark' ? '☀️' : '🌙'; }
  applyIcon();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('usto-theme', next); } catch (e) {}
      applyIcon();
    });
  }

  // Mobil menü (basit anchor listesi görünürlüğü)
  var menuBtn = document.getElementById('menu-btn');
  var links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.style.display === 'flex';
      links.style.display = open ? '' : 'flex';
      if (!open) {
        links.style.position = 'absolute';
        links.style.top = '68px'; links.style.left = '0'; links.style.right = '0';
        links.style.flexDirection = 'column'; links.style.gap = '4px';
        links.style.background = 'var(--color-card)';
        links.style.borderBottom = '1px solid var(--color-border)';
        links.style.padding = '16px 20px';
      }
      menuBtn.setAttribute('aria-expanded', String(!open));
    });
  }

  // Reveal-on-scroll (reduce-motion'a saygı)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // Service worker (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
    });
  }
})();
