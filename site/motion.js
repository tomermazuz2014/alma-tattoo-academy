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
    gsap.fromTo('.hero-wordmark', { yPercent: 0 }, {
      yPercent: 45, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 2.5 }
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

  function addMarquee(root, gsap, ScrollTrigger) {
    var track = root.querySelector('.marquee-track');
    if (!track) return;
    // Endless loop, transform only. It keeps running at all times and speeds up only a little with scroll.
    var loop = gsap.to(track, { xPercent: -50, duration: 72, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var boost = Math.min(Math.abs(self.getVelocity()) / 1200, 0.6);
        gsap.to(loop, { timeScale: 1 + boost, duration: 0.5, overwrite: true });
      }
    });
  }

  // Camera-style sequence for the hero photos: a shutter flash, then the next photo.
  // Runs only while the hero is on screen. Under reduced motion the first photo stays still.
  function startShutter(root) {
    var shots = root.querySelectorAll('.hero-shots .shot');
    var flash = root.querySelector('.shutter-flash');
    if (!shots.length) return null;
    shots[0].classList.add('is-on');
    var i = 0, timer = null;
    function next() {
      if (!document.body.contains(shots[0])) { clearInterval(timer); return; }
      shots[i].classList.remove('is-on');
      i = (i + 1) % shots.length;
      shots[i].classList.add('is-on');
      if (flash) { flash.classList.remove('is-flash'); void flash.offsetWidth; flash.classList.add('is-flash'); }
      if (printImg) { printImg.src = shots[i].getAttribute("src"); printWrap.classList.remove("is-out"); void printWrap.offsetWidth; printWrap.classList.add("is-out"); }
      if (body) { body.classList.remove("is-shot"); void body.offsetWidth; body.classList.add("is-shot"); }
    }
    var cam = root.querySelector(".hero-cam"); var printWrap = root.querySelector(".cam-print"); var printImg = printWrap && printWrap.querySelector("img"); var body = root.querySelector(".cam-body");
    if (cam) cam.addEventListener("click", function () { next(); });
    return { stop: function () { clearInterval(timer); } };
  }

  // Gallery camera: every press flashes, shakes the body, closes the iris, and ejects a print.
  // Each print is kept in a row below, so the gallery fills up as the visitor shoots.
  function restart(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function initGallery(root) {
    var btn = root.querySelector('.gallery .cam-video-btn');
    var vid = root.querySelector('.gallery .cam-video');
    if (!btn) return;
    var rig = root.querySelector('.gallery .cam-rig');
    var body = root.querySelector('.gallery .cam-body');
    var burst = root.querySelector('.gallery .flash-burst');
    var eject = root.querySelector('.gallery .cam-eject');
    var prints = root.querySelector('.gallery .prints');
    var shots = ['/assets/img/shots/s1.jpg', '/assets/img/shots/s2.jpg', '/assets/img/shots/s3.jpg', '/assets/img/shots/s4.jpg', '/assets/img/shots/s5.jpg'];
    var n = 0;
    btn.addEventListener('click', function () {
      var src = shots[n % shots.length];
      if (vid) { try { vid.currentTime = 0; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
      n++;
      restart(rig, 'is-shake');
      restart(body, 'is-shot');
      restart(burst, 'is-burst');
      eject.innerHTML = '<div class="print is-ejecting"><img src="' + src + '" alt=""></div>';
      setTimeout(function () {
        var p = document.createElement('div');
        p.className = 'print is-kept';
        p.innerHTML = '<img src="' + src + '" alt="">';
        prints.insertBefore(p, prints.firstChild);
        while (prints.children.length > 8) prints.removeChild(prints.lastChild);
        eject.innerHTML = '';
      }, 2200);
    });
  }

  // Keeps the hero video running: autoplays muted, resumes after pauses, stalls and errors,
  // restarts when the tab becomes visible again, and runs a light watchdog while it is on screen.
  function keepVideoPlaying(video) {
    if (!video || video.dataset.kept) return;
    video.dataset.kept = '1';
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.setAttribute('playsinline', '');
    function play() {
      if (reduce.matches) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked; the watchdog retries */ });
    }
    function reload() { try { video.load(); } catch (e) {} play(); }
    video.addEventListener('pause', function () { if (!document.hidden && !reduce.matches) play(); });
    video.addEventListener('ended', function () { video.currentTime = 0; play(); });
    video.addEventListener('stalled', reload);
    video.addEventListener('error', function () { setTimeout(reload, 1000); });
    video.addEventListener('abort', reload);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) play(); });
    var lastTime = -1, stuck = 0;
    var watchdog = setInterval(function () {
      if (!document.body.contains(video)) { clearInterval(watchdog); return; }
      if (document.hidden || reduce.matches) return;
      if (video.paused) play();
      if (video.currentTime === lastTime) { stuck++; if (stuck >= 2) { stuck = 0; reload(); } } else { stuck = 0; }
      lastTime = video.currentTime;
    }, 2500);
    play();
  }

  window.almaMotion = function (root) {
    var heroVideo = root.querySelector("video.hero-video");
    if (heroVideo) keepVideoPlaying(heroVideo);
    if (ctx) { ctx.revert(); ctx = null; }
    initGallery(root);
    if (window.almaUpdatePastHero) window.almaUpdatePastHero();
    var shutterTimer = startShutter(root);
    if (!window.gsap || !window.ScrollTrigger || reduce.matches) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    ctx = gsap.context(function () {
      addHeroMotion(root, gsap, ScrollTrigger);
      splitHeadings(root, gsap, ScrollTrigger);
      addCardMotion(root, gsap, ScrollTrigger);
      addMarquee(root, gsap, ScrollTrigger);
    }, root);
  };
  // The header logo appears only after the visitor scrolls past the home hero.
  // Pages without a hero always show it.
  function updatePastHero() {
    var hasHero = !!document.querySelector('.hero');
    var past = !hasHero || window.scrollY > window.innerHeight * 0.55;
    document.body.classList.toggle('past-hero', past);
  }
  window.addEventListener('scroll', updatePastHero, { passive: true });
  window.addEventListener('resize', updatePastHero);
  window.almaUpdatePastHero = updatePastHero;
})();
