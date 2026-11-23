/*
 * Motion layer. Runs after app.js renders a page, through window.almaMotion(root).
 * Uses GSAP + ScrollTrigger from the CDN. If GSAP is missing or the visitor prefers reduced motion,
 * this file does nothing and the CSS fallbacks (clip-path mask, data-reveal, press feedback) still apply.
 * Animates only transform, opacity and clip-path. Easing: expo.out for reveals, power4.inOut for transitions.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ctx = null;

  function addHeroMotion(root, gsap, ScrollTrigger) {
    var hero = root.querySelector('.hero');
    if (!hero) return;

    // Ambient: a warm halo that drifts on its own. Paused while the hero is off screen.
    var glow = document.createElement('div');
    glow.className = 'hero-glow';
    glow.setAttribute('aria-hidden', 'true');
    hero.insertBefore(glow, hero.firstChild);
    var drift = gsap.to(glow, { x: -70, y: 50, duration: 9, repeat: -1, yoyo: true, ease: 'power4.inOut' });
    ScrollTrigger.create({
      trigger: hero, start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { self.isActive ? drift.play() : drift.pause(); }
    });

    // Entrance: the wordmark rises from below its mask line.
    gsap.from('.hero-wordmark', { yPercent: 70, duration: 1.3, ease: 'expo.out', delay: 0.2 });

    // Scroll-linked: the wordmark travels up faster than the photo, which gives depth as you scroll.
    gsap.to('.hero-wordmark', {
      yPercent: -30, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 }
    });
    gsap.to('.hero-photo', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 }
    });
  }

  function splitHeadings(root, gsap, ScrollTrigger) {
    root.querySelectorAll('.section h2, .preview h3').forEach(function (h) {
      var text = h.textContent.trim();
      if (!text) return;
      h.setAttribute('aria-label', text);
      h.innerHTML = text.split(/\s+/).map(function (w) {
        return '<span class="w" aria-hidden="true"><span class="wi">' + w + '</span></span>';
      }).join(' ');
      gsap.from(h.querySelectorAll('.wi'), {
        yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });
  }

  function addCardMotion(root, gsap, ScrollTrigger) {
    // Centre-band activation: a card lights up when it crosses the middle of the screen.
    // This works the same on touch screens, where hover does not exist.
    root.querySelectorAll('.learn-item').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 62%', end: 'bottom 38%',
        toggleClass: { targets: el, className: 'is-active' }
      });
    });

    // Track rows rise in a long, staggered line as they enter.
    var rows = root.querySelectorAll('.track-item');
    rows.forEach(function (el) {
      gsap.from(el, {
        y: 60, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  window.almaMotion = function (root) {
    var heroVideo = root.querySelector("video.hero-photo");
    if (heroVideo && !reduce.matches) { var pr = heroVideo.play(); if (pr && pr.catch) pr.catch(function () {}); }
    if (ctx) { ctx.revert(); ctx = null; }
    if (!window.gsap || !window.ScrollTrigger || reduce.matches) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    ctx = gsap.context(function () {
      addHeroMotion(root, gsap, ScrollTrigger);
      splitHeadings(root, gsap, ScrollTrigger);
      addCardMotion(root, gsap, ScrollTrigger);
    }, root);
  };
})();
