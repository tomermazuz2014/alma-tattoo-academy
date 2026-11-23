(function () {
  'use strict';

  var C = window.ALMA_COURSE;
  var main = document.getElementById('main');
  var STORE_KEY = 'alma-academy:read:v1';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 899px)');
  var BRAND = 'ALMA Tattoo Academy';
  // URL prefix for hosting under a subpath. build-pages.js sets this for the GitHub Pages build; empty locally.
  var BASE = '/alma-tattoo-academy';

  document.documentElement.classList.add('js');

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Wrap Latin runs, numbers and section numbers in LTR isolates. Escaping happens per piece
  // so the wrapping never touches HTML entities.
  var LTR_RE = /[A-Za-z0-9][A-Za-z0-9 .,\-()\/]*[A-Za-z0-9)]|[A-Za-z0-9]/g;
  function ltr(s) {
    var out = '', last = 0, m;
    LTR_RE.lastIndex = 0;
    while ((m = LTR_RE.exec(s))) {
      out += esc(s.slice(last, m.index)) + '<bdi dir="ltr" class="en">' + esc(m[0]) + '</bdi>';
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function findChapter(id) {
    for (var i = 0; i < C.chapters.length; i++) if (C.chapters[i].id === id) return C.chapters[i];
    return null;
  }
  function allItems(ch) {
    var list = [];
    if (ch.intro) list.push(ch.intro);
    return list.concat(ch.sections || []);
  }
  function published(it) { return !!it && it.status === 'published'; }
  function urlOf(ch, it) { return '/learn/' + ch.id + '/' + it.slug; }

  function getRead() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function setRead(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }
  function keyOf(ch, it) { return ch.id + '/' + it.slug; }
  function isRead(ch, it) { return getRead().indexOf(keyOf(ch, it)) > -1; }
  function toggleRead(ch, it) {
    var list = getRead(), k = keyOf(ch, it), i = list.indexOf(k);
    if (i > -1) list.splice(i, 1); else list.push(k);
    setRead(list);
    return i === -1;
  }

  /* ---------- rendering blocks ---------- */

  function renderBlock(b) {
    switch (b.t) {
      case 'p':
        return '<p' + (b.cls ? ' class="' + b.cls + '"' : '') + '>' + ltr(b.text) + '</p>';
      case 'h2':
        return '<h2>' + ltr(b.text) + '</h2>';
      case 'ul':
        return '<ul class="bullets">' + b.items.map(function (i) { return '<li>' + ltr(i) + '</li>'; }).join('') + '</ul>';
      case 'cards':
        return '<div class="cards">' + b.items.map(function (c) {
          return '<article class="card"><h3>' + ltr(c.title) + '</h3><p>' + ltr(c.text) + '</p></article>';
        }).join('') + '</div>';
      case 'table':
        return '<div class="table-wrap"><table class="terms"><thead><tr>' +
          b.head.map(function (h) { return '<th scope="col">' + ltr(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          b.rows.map(function (r) {
            return '<tr>' + r.map(function (c, i) {
              return '<td data-label="' + esc(b.head[i]) + '">' + ltr(c) + '</td>';
            }).join('') + '</tr>';
          }).join('') +
          '</tbody></table></div>';
      case 'principle':
        return '<aside class="principle"><p class="principle-label">' + esc(b.label) + '</p><p>' + ltr(b.text) + '</p></aside>';
      case 'example':
        return '<aside class="example"><p class="principle-label">' + esc(b.label) + '</p>' +
          b.paras.map(function (p) { return '<p>' + ltr(p) + '</p>'; }).join('') + '</aside>';
      default:
        return '';
    }
  }
  function renderBlocks(blocks) { return blocks.map(renderBlock).join(''); }

  function sectionLabel(it) {
    return it.id ? '<bdi dir="ltr" class="en">' + esc(it.id) + '</bdi>' : '';
  }

  /* ---------- course rows (used by course page, TOC and home) ---------- */

  function courseRow(ch, it) {
    if (!published(it)) {
      return '<li><div class="sec-soon-row">' +
        '<span class="sec-num">' + sectionLabel(it) + '</span>' +
        '<span class="row-title">' + ltr(it.title) + '</span>' +
        '<span class="status">בהכנה</span>' +
        (it.summary ? '<p class="row-summary">' + ltr(it.summary) + '</p>' : '') +
        '</div></li>';
    }
    return '<li><a href="' + urlOf(ch, it) + '" data-link>' +
      '<span class="sec-num">' + (it.id ? sectionLabel(it) : 'מבוא') + '</span>' +
      '<span class="row-title">' + ltr(it.title) + '</span>' +
      (isRead(ch, it) ? '<span class="row-read">נקרא</span>' : '<span></span>') +
      '</a></li>';
  }

  /* ---------- pages ---------- */

  function homePage() {
    var ch = findChapter('chapter-01');
    var first = ch.intro.blocks[0].text;

    var track = C.chapters.map(function (c) {
      if (c.status !== 'published') {
        return '<li class="track-item"><span class="track-num">' + esc(c.number) + '</span><div>' +
          '<p class="track-title">' + ltr(c.titleEn || ('פרק ' + c.number)) + '</p>' +
          (c.summary ? '<p class="row-summary">' + ltr(c.summary) + '</p>' : '') +
          '<span class="status">בהכנה</span></div></li>';
      }
      return '<li class="track-item"><span class="track-num">' + esc(c.number) + '</span><div>' +
        '<p class="track-title">' + ltr(c.titleHe) + '</p>' +
        '<p class="track-en">' + ltr(c.titleEn) + '</p>' +
        '<ol class="sub-list" aria-label="סעיפים בפרק ' + esc(c.number) + '">' +
        allItems(c).map(function (it) { return courseRow(c, it); }).join('') +
        '</ol></div></li>';
    }).join('');

    return '' +
      '<section class="hero" aria-labelledby="hero-title">' +
        '<figure class="hero-frame">' +
          /* Kling loop: decorative, muted, no controls. */
        '<video class="hero-video" src="/assets/video/hero-shaked.mp4" poster="/assets/img/hero-shaked-poster.jpg" muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>' +
        '</figure>' +
        '<div class="hero-copy">' +
          '<h1 id="hero-title" class="hero-title" dir="ltr" aria-label="The art of tattooing starts with fundamentals.">' +
            'The art of tattooing starts with fundamentals.'.split(' ').map(function (w, i) {
              return '<span class="split-word" aria-hidden="true"><span class="' + (/fundamentals/i.test(w) ? 'hl' : '') + '" style="--i:' + i + '">' + esc(w) + '</span></span>';
            }).join(' ') +
          '</h1>' +
          '<div class="actions">' +
            '<a class="btn btn-primary" href="/course" data-link>לצפייה בקורס</a>' +
            '<a class="btn-link" href="/learn/chapter-01/what-is-a-tattoo" data-link>לקריאת פרק לדוגמה</a>' +
          '</div>' +
        '</div>' +
        '<span class="hero-wordmark" aria-hidden="true">ALMA</span>' +
'<div class="hero-badge" aria-hidden="true"><svg viewBox="0 0 200 200" focusable="false"><circle cx="173.26" cy="100" r="9" fill="#D8BF4A"/><circle cx="164.38" cy="136.26" r="5" fill="#D8BF4A"/><circle cx="137.74" cy="163.64" r="5" fill="#D8BF4A"/><circle cx="100.74" cy="174.00" r="9" fill="#D8BF4A"/><circle cx="64.48" cy="163.64" r="5" fill="#D8BF4A"/><circle cx="37.10" cy="137.00" r="5" fill="#D8BF4A"/><circle cx="26.00" cy="100" r="9" fill="#D8BF4A"/><circle cx="35.62" cy="63.74" r="5" fill="#D8BF4A"/><circle cx="62.26" cy="36.36" r="5" fill="#D8BF4A"/><circle cx="99.26" cy="26.00" r="9" fill="#D8BF4A"/><circle cx="135.52" cy="36.36" r="5" fill="#D8BF4A"/><circle cx="162.90" cy="63.00" r="5" fill="#D8BF4A"/><circle cx="100" cy="100" r="30" fill="#B5482A"/><path d="M88 100 h24 M100 88 v24" stroke="#F4ECDB" stroke-width="4" stroke-linecap="round"/></svg></div>' +
      '</section>' +

      marqueeHtml() +
      '<section class="section" aria-labelledby="learn-title" data-reveal>' +
        '<div class="wrap">' +
          '<h2 id="learn-title">מה לומדים</h2>' +
          '<div class="learn-grid">' +
            learnItem('01', 'יסודות האמנות', 'קומפוזיציה, קריאות הדימוי והתאמת העיצוב למבנה הגוף.') +
            learnItem('02', 'הבנת העור', 'העור כרקמה חיה, שכבותיו והתנהגותו של הפיגמנט לאורך זמן.') +
            learnItem('03', 'החשיבה הטכנית', 'הציוד, מגבלות הטכניקה ושליטה בתנועה ובדיוק.') +
            learnItem('04', 'האחריות המקצועית', 'בטיחות, הסכמה מדעת וגבולות היכולת המקצועית.') +
          '</div>' +
          '<p class="note">התרגול המעשי במסגרת הקורס מתבצע על עור סינתטי בלבד.</p>' +
        '</div>' +
      '</section>' +

      '<section class="section section-tint" aria-labelledby="track-title" data-reveal>' +
        '<div class="wrap">' +
          '<h2 id="track-title">מסלול הלימוד</h2>' +
          '<p class="section-lead">שמונה פרקים, שנקראים לפי הסדר. פרק 01 זמין כבר עכשיו.</p>' +
          '<ol class="track">' + track + '</ol>' +
        '</div>' +
      '</section>' +

      '<section class="section gallery" aria-labelledby="gallery-title">' +
        '<div class="wrap">' +
          '<h2 id="gallery-title">מהסטודיו</h2>' +
          '<div class="gallery-stage">' +
            '<button type="button" class="cam-video-btn" aria-label="צילום"><video class="cam-video" src="/assets/video/camera-shot.mp4" poster="/assets/img/camera-shot-poster.jpg" muted playsinline preload="metadata"></video></button>' +
          '</div>' +
          '<p class="gallery-hint">לחצי על הכפתור כדי לצלם</p>' +
          '<div class="prints" aria-live="polite"></div>' +
        '</div>' +
      '</section>' +

      '<section class="section section-warm" aria-labelledby="preview-title" data-reveal>' +
        '<div class="wrap preview" data-reveal>' +
          '<div>' +
            '<h2 id="preview-title">הצצה לפרק 01</h2>' +
            '<p class="chapter-line"><bdi dir="ltr" class="en">CHAPTER 01 — ' + esc(ch.titleEn) + '</bdi></p>' +
            '<h3>' + ltr(ch.titleHe) + '</h3>' +
          '</div>' +
          '<div>' +
            '<p class="body">' + ltr(first) + '</p>' +
            '<p class="preview-link"><a class="btn-link" href="/learn/chapter-01/what-is-a-tattoo" data-link>לסעיף 1.1: מהו קעקוע?</a></p>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  // Ambient band: an endless line of brand words. motion.js drives it; without JS it stays still.
  function marqueeHtml() {
    var words = ['ALMA TATTOO ACADEMY', 'אמנות הקעקוע מתחילה ביסודות', 'עור סינתטי בלבד', 'יסודות · סקיצה · בטיחות', 'שיקול דעת לפני המכונה'];
    var one = words.map(function (w) { return '<span class="marquee-item">' + ltr(w) + '</span><span class="marquee-dot" aria-hidden="true">✳</span>'; }).join('');
    return '<div class="marquee" aria-hidden="true"><div class="marquee-track">' + one + one + '</div></div>';
  }

  function learnItem(num, title, text) {
    var delay = (parseInt(num, 10) - 1) * 90;
    return '<article class="learn-item" data-reveal style="--d:' + delay + 'ms">' +
      '<h3>' + ltr(title) + '</h3><p>' + ltr(text) + '</p></article>';
  }

  function coursePage() {
    var ch = findChapter('chapter-01');
    var rest = C.chapters.filter(function (c) { return c.id !== 'chapter-01'; }).map(function (c) {
      return '<article class="chapter soon"><div class="chapter-head"><span class="track-num">' + esc(c.number) +
        '</span><div><h2>' + ltr(c.titleEn || ('פרק ' + c.number)) + '</h2>' +
        (c.summary ? '<p class="row-summary">' + ltr(c.summary) + '</p>' : '') +
        '<p class="status">בהכנה</p></div></div></article>';
    }).join('');

    return '' +
      '<section class="wrap course-head">' +
        '<a class="back-link" href="/" data-link>לדף הבית</a>' +
        '<p class="eyebrow">' + ltr(BRAND) + '</p>' +
        '<h1>' + ltr(C.title) + '</h1>' +
        '<p class="lede">' + ltr(C.description) + '</p>' +
        '<dl class="course-meta"><dt>למי הקורס מיועד</dt><dd>' + ltr(C.audience) + '</dd></dl>' +
        '<p style="margin-top:var(--s8)"><a class="btn btn-primary" href="/learn/chapter-01/what-is-a-tattoo" data-link>לקריאת פרק לדוגמה</a></p>' +
      '</section>' +

      '<section class="section" aria-labelledby="toc-title">' +
        '<div class="wrap">' +
          '<h2 id="toc-title">תוכן העניינים</h2>' +
          '<article class="chapter">' +
            '<div class="chapter-head"><span class="track-num">' + esc(ch.number) + '</span><div>' +
              '<h2>' + ltr(ch.titleHe) + '</h2>' +
              '<p class="en">' + ltr(ch.titleEn) + '</p>' +
            '</div></div>' +
            '<div class="chapter-body"><ol class="course-rows">' +
              allItems(ch).map(function (it) { return courseRow(ch, it); }).join('') +
            '</ol></div>' +
          '</article>' +
          rest +
        '</div>' +
      '</section>';
  }

  function soonPage(ch, it) {
    return '<section class="wrap plain-page">' +
      '<p class="chapter-line">' + ltr('פרק ' + ch.number) + '</p>' +
      '<h1>' + ltr(it.title) + '</h1>' +
      '<p>הסעיף בהכנה. החומר המלא יופיע כאן כשיפורסם.</p>' +
      '<a class="btn-link" href="/course" data-link>חזרה לעמוד הקורס</a>' +
      '</section>';
  }

  function notFoundPage() {
    return '<section class="wrap plain-page"><p class="eyebrow">שגיאה 404</p>' +
      '<h1>העמוד לא נמצא.</h1>' +
      '<p>אפשר לחזור לעמוד הבית או לתוכן הקורס.</p>' +
      '<p><a class="btn-link" href="/" data-link>לדף הבית</a> &nbsp; <a class="btn-link" href="/course" data-link>לעמוד הקורס</a></p>' +
      '</section>';
  }

  function tocInner(ch, current) {
    var items = allItems(ch);
    return '<div class="toc-chapter">' +
      '<p class="toc-chapter-title">פרק ' + ltr(ch.number) + ' · ' + ltr(ch.titleEn) + '</p>' +
      '<ol class="toc-list">' + items.map(function (it) {
        if (!published(it)) {
          return '<li class="toc-soon"><span class="sec-num">' + sectionLabel(it) + '</span><span>' + ltr(it.title) + '</span><span class="status">בהכנה</span></li>';
        }
        var isCur = current && current.slug === it.slug;
        return '<li><a class="toc-link" href="' + urlOf(ch, it) + '" data-link' + (isCur ? ' aria-current="page"' : '') + '>' +
          '<span class="sec-num">' + (it.id ? sectionLabel(it) : 'מבוא') + '</span>' +
          '<span>' + ltr(it.title) + '</span>' +
          (isRead(ch, it) ? '<span class="read-dot" aria-label="נקרא">✓</span>' : '') +
          '</a></li>';
      }).join('') + '</ol></div>';
  }

  function readerPage(ch, cur) {
    var items = allItems(ch).filter(published);
    var idx = items.indexOf(cur);
    var prev = items[idx - 1], next = items[idx + 1];
    var read = isRead(ch, cur);
    var heading = cur.id ? sectionLabel(cur) + ' — ' + ltr(cur.title) : ltr(cur.title);

    var pager = '<nav class="pager" aria-label="ניווט בין סעיפים">' +
      (prev
        ? '<a href="' + urlOf(ch, prev) + '" data-link><span class="pager-label">סעיף קודם</span><span class="pager-title">' + (prev.id ? sectionLabel(prev) + ' — ' : '') + ltr(prev.title) + '</span></a>'
        : '<span class="pager-empty"></span>') +
      (next
        ? '<a class="next" href="' + urlOf(ch, next) + '" data-link><span class="pager-label">סעיף הבא</span><span class="pager-title">' + (next.id ? sectionLabel(next) + ' — ' : '') + ltr(next.title) + '</span></a>'
        : '<span class="pager-empty"></span>') +
      '</nav>';

    return '' +
      '<div class="reader">' +
        '<aside class="toc" id="toc" aria-label="תוכן העניינים">' +
          '<div class="toc-head"><p>תוכן העניינים</p>' +
            '<button type="button" class="btn btn-ghost toc-close" aria-label="סגירת תוכן העניינים">סגירה</button></div>' +
          tocInner(ch, cur) +
        '</aside>' +
        '<div class="toc-backdrop" hidden></div>' +
        '<article class="reader-body">' +
          '<div class="reader-inner">' +
            '<div class="reader-top">' +
              '<a class="back-link" href="/course" data-link>חזרה לעמוד הקורס</a>' +
              '<button type="button" class="btn btn-ghost toc-toggle" aria-controls="toc" aria-expanded="false">תוכן העניינים</button>' +
            '</div>' +
            '<header class="reader-head">' +
              '<p class="chapter-line">' + ltr('פרק ' + ch.number + ' · CHAPTER ' + ch.number + ' — ' + ch.titleEn) + '</p>' +
              '<h1>' + heading + '</h1>' +
            '</header>' +
            '<section>' + renderBlocks(cur.blocks) + '</section>' +
            '<footer class="reader-foot">' +
              '<div class="read-control">' +
                '<button type="button" class="btn btn-read" data-read data-chapter="' + esc(ch.id) + '" data-slug="' + esc(cur.slug) + '" aria-pressed="' + read + '">' +
                  (read ? 'סומן כנקרא' : 'סיימתי לקרוא') + '</button>' +
                '<p class="read-status" aria-live="polite">סימון הקריאה נשמר במכשיר זה.</p>' +
              '</div>' +
              pager +
            '</footer>' +
          '</div>' +
        '</article>' +
      '</div>';
  }

  /* ---------- routing ---------- */

  function render(html, title) {
    closeToc(false);
    main.innerHTML = html;
    document.title = title ? title + ' · ' + BRAND : BRAND;
    bindPage();
    main.focus({ preventScroll: true });
  }

  function route() {
    var path = location.pathname;
    if (BASE && path.indexOf(BASE) === 0) path = path.slice(BASE.length);
    path = path.replace(/\/+$/, '') || '/';
    if (path === '/') return render(homePage());
    if (path === '/course') return render(coursePage(), C.title);

    var m = path.match(/^\/learn\/([\w-]+)\/([\w-]+)$/);
    if (m) {
      var ch = findChapter(m[1]);
      var item = ch && allItems(ch).filter(function (it) { return it.slug === m[2]; })[0];
      if (item) {
        if (!published(item)) return render(soonPage(ch, item), item.title);
        return render(readerPage(ch, item), item.title);
      }
    }
    render(notFoundPage(), 'העמוד לא נמצא');
  }

  function go(path) {
    if (path !== location.pathname) history.pushState({}, '', path);
    route();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-link]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var u = new URL(a.href);
    if (u.origin !== location.origin) return;
    e.preventDefault();
    go(u.pathname);
  });
  window.addEventListener('popstate', route);

  /* ---------- reader interactions ---------- */

  function tocEl() { return document.getElementById('toc'); }
  function openToc() {
    var toc = tocEl(); if (!toc || !mobile.matches) return;
    toc.classList.add('is-open');
    main.querySelector('.toc-backdrop').hidden = false;
    main.querySelector('.toc-toggle').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    toc.querySelector('.toc-close').focus();
  }
  function closeToc(returnFocus) {
    var toc = tocEl(); if (!toc) return;
    var wasOpen = toc.classList.contains('is-open');
    toc.classList.remove('is-open');
    var bd = main.querySelector('.toc-backdrop'); if (bd) bd.hidden = true;
    var t = main.querySelector('.toc-toggle');
    if (t) t.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (wasOpen && returnFocus && t) t.focus();
  }

  main.addEventListener('click', function (e) {
    var read = e.target.closest('[data-read]');
    if (read) {
      var ch = findChapter(read.dataset.chapter);
      var it = ch && allItems(ch).filter(function (x) { return x.slug === read.dataset.slug; })[0];
      if (!it) return;
      var on = toggleRead(ch, it);
      read.setAttribute('aria-pressed', String(on));
      read.textContent = on ? 'סומן כנקרא' : 'סיימתי לקרוא';
      read.classList.remove('pulse'); void read.offsetWidth; read.classList.add('pulse');
      var status = main.querySelector('.read-status');
      if (status) status.textContent = on ? 'הסימון נשמר במכשיר זה ויופיע גם לאחר רענון.' : 'הסימון הוסר.';
      return;
    }
    if (e.target.closest('.toc-toggle')) return openToc();
    if (e.target.closest('.toc-close') || e.target.closest('.toc-backdrop')) return closeToc(true);
    if (e.target.closest('.toc-link')) return; // navigation handled by data-link
  });

  document.addEventListener('keydown', function (e) {
    var toc = tocEl();
    if (!toc || !toc.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeToc(true); return; }
    if (e.key === 'Tab') {
      var f = toc.querySelectorAll('a[href], button:not([hidden])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- reveal & scroll-linked motion ---------- */

  var revealIO = null;
  function bindPage() {
    // Prefix root-relative links and images with BASE (no-op locally, where BASE is empty).
    if (BASE) {
      main.querySelectorAll('a[href^="/"], img[src^="/"], video[src^="/"], video[poster^="/"]').forEach(function (el) {
        ['href', 'src', 'poster'].forEach(function (attr) {
          var v = el.getAttribute(attr);
          if (v && v.charAt(0) === '/' && v.indexOf(BASE) !== 0) el.setAttribute(attr, BASE + v);
        });
      });
    }
    var els = main.querySelectorAll('[data-reveal]');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      if (revealIO) revealIO.disconnect();
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var el = en.target;
            el.classList.add('is-in');
            revealIO.unobserve(el);
            // Drop the stagger delay once the reveal has played, so hover responds immediately.
            setTimeout(function () { el.style.transitionDelay = '0ms'; }, 1000);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(function (el) { revealIO.observe(el); });
    }
    onScroll();
    if (window.almaMotion) window.almaMotion(main);
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    if (reduceMotion.matches) return;
    var img = main.querySelector('.hero-frame img');
    if (img && !mobile.matches) {
      var r = img.parentNode.getBoundingClientRect();
      var p = clamp(r.top / window.innerHeight, -1, 1);
      img.style.setProperty('--py', (p * -24).toFixed(1) + 'px');
    }
    var track = main.querySelector('.track');
    if (track) {
      var tr = track.getBoundingClientRect();
      var prog = clamp((window.innerHeight * 0.7 - tr.top) / Math.max(tr.height, 1), 0, 1);
      track.style.setProperty('--p', prog.toFixed(3));
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  route();
})();
