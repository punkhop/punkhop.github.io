/* jetpackcomedy.com: the lights-first intro, sections rising in, the About photos fading through,
   the two Micdrop widget slots filled from Micdrop's public events API, the sticky phone buy bar,
   the phone menu, FAQ, and the GA4 select_content event on every Get tickets.
   Built from the 2026-10 redesign prototype (jetpackcomedy repo, 2026-10-20-micdrop-widgets/proto2). */
(function () {
  'use strict';
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.JP_MOTION = true;

  /* ---------- Micdrop: the two widget slots ----------------------------------------------------- */
  // Venue 1 is Bar Lubitsch. A site outside get-micdrop.com needs its widget key (Micdrop dashboard →
  // Widgets, with jetpackcomedy.com on its allowed list); without one the API answers 403 and the
  // server-rendered cards stay up, linking to the Jetpack page on Micdrop.
  var API = 'https://get-micdrop.com/api/v2/public/events/venue/1?limit=100';
  var WIDGET_KEY = 'wk_6b89d4e8aeeb2981ce399083eda2a1a4'; // public embed key, allows jetpackcomedy.com and its subdomains
  var TZ = 'America/Los_Angeles';
  // Micdrop's buyer fee per ticket face, as checkout charges it today ($20 GA → $2.85, $30 VIP → $3.46).
  // The public API doesn't carry fees yet; a face price missing here shows without a fee line.
  var FEES = { 20: 2.85, 30: 3.46 };
  // Micdrop's scarcity canon (venue-calendar lib/constants/scarcity.ts): "Selling fast" at 20% left,
  // never above 30 seats or below 6.
  function fast(e) {
    var t = e.totalSeats, r = e.remainingSeats;
    if (!t || r == null || r <= 0) return false;
    return r <= Math.max(Math.min(t * 0.2, 30), 6);
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function href(e) { return 'https://get-micdrop.com/e/' + e.id + '-' + (e.slug || slug(e.title)); }
  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parts(iso, o) {
    var f = {}; new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: TZ }, o)).formatToParts(new Date(iso)).forEach(function (p) { f[p.type] = p.value; });
    return f;
  }
  function clock(iso) { var p = parts(iso, { hour: 'numeric', minute: '2-digit' }); return p.hour + ':' + p.minute; }
  function day(iso) { var p = parts(iso, { weekday: 'long', month: 'short', day: 'numeric' }); return { wd: p.weekday, md: p.month + ' ' + p.day }; }
  function ymd(d) { var p = parts(d, { year: 'numeric', month: '2-digit', day: '2-digit' }); return Date.UTC(+p.year, +p.month - 1, +p.day); }
  // The bar's "This Friday / Next Friday / Friday", counted in Los Angeles days.
  function rel(e) { var d = Math.round((ymd(e.startDateTime) - ymd(new Date())) / 864e5); return d < 7 ? 'This ' + day(e.startDateTime).wd : d < 14 ? 'Next ' + day(e.startDateTime).wd : day(e.startDateTime).wd; }
  function price(e) {
    var face = e.minPrice, fee = FEES[face];
    return fee == null ? { total: money(face), cap: '' } : { total: money(face + fee), cap: 'incl. ' + money(fee) + ' fee' };
  }
  // Micdrop's ticket-button canon (venue-calendar lib/api/cta.ts): open, or why not.
  function state(e) {
    if (e.salesStatus === 'paused') return { open: false, label: 'Sales paused' };
    if (e.salesStatus === 'ended') return { open: false, label: 'Sales ended' };
    if (e.salesStatus === 'sold_out' || e.remainingSeats <= 0) return { open: false, sold: true, label: 'Sold out' };
    if (e.salesStatus === 'not_started') return { open: false, label: 'On sale ' + day(firstSale(e) || e.startDateTime).md };
    return { open: true, fast: fast(e) };
  }
  function firstSale(e) {
    var t = (e.availableTickets || []).map(function (x) { return x.effectiveSalesBegin; }).filter(Boolean).sort()[0];
    return t || null;
  }
  function facts(e) {
    return '<span>' + (e.doorsOpenTime ? 'Doors ' + clock(e.doorsOpenTime) + ' · ' : '') + 'Show ' + clock(e.startDateTime) + ' PM</span><span>Bar Lubitsch</span>';
  }
  function buy(e, cls, cta) {
    return '<a class="mw-btn ' + cls + '" href="' + href(e) + '" target="_blank" rel="noopener" data-event="' + e.id + '"' + (cta ? ' data-cta="' + cta + '"' : '') + '>Get tickets</a>';
  }

  function featured(n, sold) {
    var d = day(n.startDateTime), p = price(n), s = state(n);
    return '<div class="mw mw-next" data-widget>' +
      (sold ? '<div class="mw-soldnote"><span class="mw-badge sold">Sold out</span><span>' + day(sold.startDateTime).wd.slice(0, 3) + ', ' + day(sold.startDateTime).md + ' — no tickets at the door</span></div>' : '') +
      (s.fast ? '<div class="mw-next-top"><span class="mw-badge fast">Selling fast</span></div>' : '') +
      '<div class="mw-next-date">' + d.wd + ', ' + d.md + '</div>' +
      '<div class="mw-next-title">' + esc(n.title) + '</div>' +
      '<div class="mw-next-facts">' + facts(n) + '</div>' +
      '<div class="mw-next-buy"><div class="mw-price"><b>' + p.total + '</b>' + (p.cap ? '<span>' + p.cap + '</span>' : '') + '</div>' + buy(n, 'lg', 'hero') + '</div></div>';
  }
  function rows(list) {
    if (!list.length) return '<div class="mw mw-rows" data-widget><p class="mw-only">Only this Friday is on sale right now.</p></div>';
    return '<div class="mw mw-rows" data-widget>' + list.map(function (e) {
      var d = day(e.startDateTime), s = state(e);
      return '<div class="mw-row' + (s.sold ? ' sold' : '') + '"><div class="d"><span>' + d.wd.slice(0, 3).toUpperCase() + '</span><b>' + d.md + '</b></div>' +
        '<div class="l"><b class="ttl">' + esc(e.title) + '</b>' + (s.fast ? '<span class="mw-badge fast">Selling fast</span>' : '') + '</div>' +
        '<div class="p">' + price(e).total + '</div>' +
        (s.open ? buy(e, 'sm') : '<span class="mw-btn off sm">' + s.label + '</span>') + '</div>';
    }).join('') + '</div>';
  }
  function empty() {
    return '<div class="mw-empty"><b>No shows on sale yet</b><p>Every Friday · Doors 8pm · Show 8:30</p>' +
      '<a class="mw-btn ghost" href="https://instagram.com/jetpackcomedy" target="_blank" rel="noopener">Follow on Instagram</a></div>';
  }

  function shows(events) {
    var now = Date.now();
    var list = events.filter(function (e) {
      return e.visibility === 'public' && e.isPublished !== false && e.status !== 'canceled' && e.status !== 'postponed' &&
        e.status !== 'ended' && new Date(e.startDateTime).getTime() > now - 3 * 36e5;
    }).sort(function (a, b) { return new Date(a.startDateTime) - new Date(b.startDateTime); });
    var feat = document.querySelector('[data-micdrop-slot="featured"]'), slot = document.querySelector('[data-micdrop-slot="list"]');
    var next = list.filter(function (e) { return state(e).open; })[0];
    // The first Friday sold out: Featured says so and moves on to the next one you can buy.
    var sold = list[0] && state(list[0]).sold && list[0] !== next ? list[0] : null;
    if (feat) feat.innerHTML = next ? featured(next, sold) : empty();
    if (slot) slot.innerHTML = list.length ? rows(list.filter(function (e) { return e !== next && e !== sold; })) : '';
    if (!next) { var b0 = document.querySelector('[data-buybar]'); if (b0) b0.remove(); }
    if (next) {
      var d = day(next.startDateTime);
      [].forEach.call(document.querySelectorAll('[data-next]'), function (a) { a.href = href(next); a.setAttribute('data-event', next.id); });
      var bar = document.querySelector('[data-buybar] > div');
      if (bar) bar.innerHTML = '<b>' + rel(next) + ' · ' + d.wd.slice(0, 3) + ', ' + d.md + '</b><small>Show ' + clock(next.startDateTime) + '</small>';
    }
    embeds(feat, slot);
    watchBar();
    reveal(document.querySelector('[data-micdrop-slot="list"]'));
  }
  /* Micdrop's own saved widgets fill the two slots: widget 2 "Jetpack site · Next show" (Featured,
     Date range Next show) and widget 3 "Jetpack site · Upcoming shows" (List). ?widgets=standin keeps
     the hand-drawn stand-ins above, to compare. */
  function embeds(feat, slot) {
    if (/[?&]widgets=standin\b/.test(location.search)) return;
    var k = ' data-widget-key="' + WIDGET_KEY + '"';
    if (feat) feat.innerHTML = '<micdrop-calendar widget-id="2" show-background="false"' + k + '></micdrop-calendar>';
    if (slot) slot.innerHTML = '<micdrop-calendar widget-id="3"' + k + '></micdrop-calendar>';
    var sc = document.createElement('script'); sc.defer = true; sc.src = 'https://get-micdrop.com/embed/venue-calendar.iife.js';
    document.head.appendChild(sc);
  }
  function load() {
    var h = WIDGET_KEY ? { 'X-Widget-Key': WIDGET_KEY } : {};
    fetch(API, { headers: h }).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) { shows(d.events || []); })
      .catch(function () { /* the server-rendered cards stay */ });
  }

  /* ---------- the sticky phone buy bar: hidden while the ticket card or a ticket button is on screen */
  var barIO = null;
  function watchBar() {
    var bar = document.querySelector('[data-buybar]'); if (!bar || !('IntersectionObserver' in window)) return;
    if (barIO) barIO.disconnect();
    var zones = document.querySelectorAll('[data-micdrop-slot="featured"] > *, [data-micdrop-slot] .mw-btn:not(.off):not(.ghost)'), seen = new Set();
    barIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      var hide = seen.size > 0;
      bar.classList.toggle('on', !hide);
      root.classList.toggle('j-bar-on', !hide);
    }, { threshold: 0 });
    [].forEach.call(zones, function (z) { barIO.observe(z); });
  }

  /* ---------- clicks: menu, FAQ, and the GA4 ticket event --------------------------------------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act], a'); if (!t) return;
    if (t.dataset.act === 'menu') {
      var open = root.classList.toggle('j-menu-open'); t.setAttribute('aria-expanded', open);
    } else if (t.dataset.act === 'faq') {
      var item = t.closest('.j-faq-item'), o = item.classList.toggle('open'); t.setAttribute('aria-expanded', o);
    } else if (t.closest('.j-menu')) {
      root.classList.remove('j-menu-open'); document.querySelector('.j-menu-btn').setAttribute('aria-expanded', 'false');
    }
    // The header and phone-bar Get tickets open the next show in the top widget, on this page, the way
    // tapping the widget's own button does (setting the address instead opens it in both widgets).
    if (t.hasAttribute('data-next')) {
      var w = document.querySelector('[data-micdrop-slot="featured"] micdrop-calendar');
      var go = w && !/Go back/.test(w.innerText) && [].filter.call(w.querySelectorAll('a, button'), function (x) { return x.textContent.trim() === 'Get tickets'; })[0];
      if (w && (go || /Go back/.test(w.innerText))) {
        ev.preventDefault();
        if (go) go.click();
        // Measured once the show has drawn, i.e. the widget has grown (opening it moves the widget up the hero), and only when its
        // top isn't already just under the header.
        // The newer widget opens the show as its own full-window page instead; then there's nothing to scroll to.
        var tries = 0, h0 = w.offsetHeight;
        (function land() {
          if (document.querySelector('dialog[open]')) return;
          if (go && w.offsetHeight < h0 + 100 && ++tries < 40) return setTimeout(land, 50);
          var hd = document.querySelector('header'), h = hd ? hd.offsetHeight : 0, top = w.getBoundingClientRect().top;
          if (top < h || top > innerHeight * 0.3) scrollTo({ top: top + scrollY - h - 12, behavior: still ? 'auto' : 'smooth' });
        })();
      }
    }
    if (t.tagName === 'A' && /get-micdrop\.com\//.test(t.href) && typeof gtag === 'function') {
      gtag('event', 'select_content', { content_type: 'event', item_id: t.getAttribute('data-event') || 'jetpack-comedy' });
    }
  });
  var scrolled = false;
  addEventListener('scroll', function () {
    var s = scrollY > 8; if (s !== scrolled) { scrolled = s; root.classList.toggle('j-scrolled', s); }
  }, { passive: true });

  /* ---------- the lights-first intro ------------------------------------------------------------ */
  // Where the lamps sit in venue/hero-mid (both sizes are 3:2), as % of the photo: x, y, glow width, glow height.
  var SCONCES = [[11, 15, 7, 10], [16, 16, 6, 9], [21, 17, 5, 8], [79, 16, 5, 8], [86, 15, 6, 9], [90, 16, 5, 8]];
  var CHANDELIERS = [[25, 9, 9, 12], [33, 11, 5, 9], [50.5, 6, 3, 5], [69, 11, 5, 9], [77, 7, 9, 12]];
  var NEON = [51, 29, 17, 9];
  // Sconces blink on in pairs from the outside in, then the chandeliers from the middle out, then the neon
  // buzzes and the room comes up; the page arrives after. The whole intro takes 4s: the lamps run at
  // k × their 3.55s, the page's own rise-in keeps its 1.4s.
  var SCONCE_AT = [300, 620, 940, 1010, 690, 370], CHAND_AT = [1800, 1600, 1400, 1650, 1850];
  var K = (4000 - 1400) / 3550;
  var introDone = false;

  function glow(l, src) {
    var d = document.createElement('i');
    d.style.backgroundImage = 'url("' + src + '")';
    var m = 'radial-gradient(ellipse ' + l[2] + '% ' + l[3] + '% at ' + l[0] + '% ' + l[1] + '%, #000 30%, rgba(0,0,0,.55) 60%, transparent 100%)';
    d.style.webkitMaskImage = d.style.maskImage = m;
    return d;
  }
  // The lamp layers sit exactly over the photo as object-fit: cover draws it, so the mask % match the photo.
  function place(box, img) {
    var w = box.clientWidth, h = box.clientHeight, iw = img.naturalWidth || 2400, ih = img.naturalHeight || 1600;
    var pos = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
    var s = Math.max(w / iw, h / ih), rw = iw * s, rh = ih * s;
    return { left: (w - rw) * pos[0] / 100, top: (h - rh) * pos[1] / 100, width: rw, height: rh };
  }
  function intro() {
    var hero = document.querySelector('.a-hero');
    if (!hero || still || !root.classList.contains('j-intro-wait')) return end();
    var media = hero.querySelector('.a-hero-media'), img = hero.querySelector('.a-hero-img');
    root.style.setProperty('--sp', K);
    words(hero.querySelector('h1'));
    var go = function () {
      if (introDone) return;
      var src = img.currentSrc || img.src, r = place(media, img);
      var lamps = document.createElement('div');
      lamps.className = 'j-lamps';
      Object.keys(r).forEach(function (k) { lamps.style[k] = r[k] + 'px'; });
      SCONCES.forEach(function (l, i) { var d = glow(l, src); d.style.animationDelay = SCONCE_AT[i] * K + 'ms'; lamps.appendChild(d); });
      CHANDELIERS.forEach(function (l, i) { var d = glow(l, src); d.style.animationDelay = CHAND_AT[i] * K + 'ms'; lamps.appendChild(d); });
      var neon = glow(NEON, src); neon.className = 'neon'; lamps.appendChild(neon);
      media.appendChild(lamps);
      root.classList.remove('j-intro-wait');
      root.classList.add('j-intro');
      setTimeout(end, 3550 * K + 1400);
    };
    var started = false, start = function () { if (!started) { started = true; requestAnimationFrame(go); } };
    if (img.complete && img.naturalWidth) start();
    else { img.addEventListener('load', start); img.addEventListener('error', start); }
    setTimeout(start, 3000);
  }
  // The lamps stay lit once the intro is over, held at their final glow and kept over the photo as it resizes.
  function end() {
    introDone = true;
    root.classList.remove('j-intro', 'j-intro-wait', 'j-lights');
    var l = document.querySelector('.j-lamps');
    if (!l) return;
    l.classList.add('j-lit');
    var media = l.parentNode, img = media.querySelector('.a-hero-img');
    addEventListener('resize', function () {
      var r = place(media, img);
      Object.keys(r).forEach(function (k) { l.style[k] = r[k] + 'px'; });
    });
  }
  // Each word of the headline rises on its own, 100ms apart.
  function words(h) {
    if (!h) return;
    var i = 0;
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 1) return walk(c);
        if (c.nodeType !== 3 || !c.nodeValue.trim()) return;
        var f = document.createDocumentFragment();
        c.nodeValue.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) return f.appendChild(document.createTextNode(t));
          var s = document.createElement('span'); s.className = 'j-word'; s.style.setProperty('--wi', i++); s.textContent = t; f.appendChild(s);
        });
        c.parentNode.replaceChild(f, c);
      });
    })(h);
  }

  /* ---------- sections rise in as they scroll into view; siblings follow 70ms apart ------------- */
  var REVEAL = '.j-sec h2, .j-sub, .mw-rows .mw-row, .a-room-grid figure, .a-room-txt .j-body, .j-rev, .j-faq-item, ' +
    '.j-find-txt > *, .j-find-map, .j-find-photo, .j-foot-in > *';
  var io = null;
  function reveal(scope) {
    if (still || !('IntersectionObserver' in window)) return;
    io = io || new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        // a row rises together, so ones parked to the side still show
        [].forEach.call(e.target.parentNode.children, function (s) { if (s === e.target || s.classList.contains('j-rise')) { s.classList.add('in'); io.unobserve(s); } });
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    var seen = new Map();
    (scope || document).querySelectorAll(REVEAL).forEach(function (el) {
      if (el.closest('.a-hero')) return;
      var p = el.parentNode, i = seen.get(p) || 0; seen.set(p, i + 1);
      el.style.setProperty('--ri', Math.min(i, 6));
      // already on screen or scrolled past: stays put
      if (scope && el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('j-rise');
      io.observe(el);
    });
  }

  /* ---------- About photos: each frame crossfades to its next photo, the three out of step ------ */
  // Only the first photo of each frame loads with the page; each next one loads a turn ahead of its fade,
  // and nothing runs while About is off screen.
  function fades() {
    var figs = [].slice.call(document.querySelectorAll('.j-fade')), room = document.getElementById('room');
    if (!figs.length || !room) return;
    function get(img) {
      if (img && img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
    }
    function after(f, n) { var ims = f.querySelectorAll('img'), i = [].indexOf.call(ims, f.querySelector('img.on')); return ims[(i + n) % ims.length]; }
    var tick = 0, timer = null;
    function step() {
      var f = figs[tick++ % figs.length], cur = f.querySelector('img.on'), nx = after(f, 1);
      if (!nx.complete || !nx.naturalWidth) { get(nx); return; } // not here yet: this frame waits a turn
      cur.classList.remove('on'); nx.classList.add('on');
      get(after(f, 1));
    }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        figs.forEach(function (f) { get(after(f, 1)); });
        if (!timer) timer = setInterval(step, still ? 6000 : 2200);
      } else { clearInterval(timer); timer = null; }
    }, { rootMargin: '300px 0px' }).observe(room);
  }

  /* ---------- the map loads as Find us comes near, not with the page ---------------------------- */
  function map() {
    var f = document.querySelector('.j-find-map iframe[data-src]'); if (!f) return;
    var go = function () { f.src = f.getAttribute('data-src'); f.removeAttribute('data-src'); };
    if (!('IntersectionObserver' in window)) return go();
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { rootMargin: '600px 0px' });
    o.observe(f);
  }

  /* ---------- the mailing list form: /api/signup (a Worker on the same address) adds to SendGrid -- */
  function signup() {
    var f = document.querySelector('[data-signup]'); if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = f.querySelector('button'), msg = f.querySelector('.j-signup-msg');
      if (!msg) { msg = document.createElement('p'); msg.className = 'j-signup-msg'; msg.setAttribute('role', 'status'); f.appendChild(msg); }
      btn.disabled = true; msg.textContent = '';
      fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email.value }) })
        .then(function (r) { if (!r.ok) throw r.status; f.querySelector('div').remove(); msg.textContent = 'You\u2019re on the list.'; }) // Micdrop site builder's site_mailing_success
        .catch(function () { btn.disabled = false; msg.textContent = 'That didn\u2019t go through. Try again in a minute.'; }); // new words
    });
  }

  intro();
  map();
  signup();
  reveal();
  fades();
  watchBar();
  load();
})();
