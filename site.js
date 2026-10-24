/* jetpackcomedy.com: the lights-first intro, sections rising in, the About photos fading through,
   the two Micdrop widget slots (one look each, never a morph), the sticky phone buy bar,
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
  // Micdrop's buyer fee per ticket face, as checkout charges it today ($20 GA → $3.48, $30 VIP → $4.29).
  // Used only when the events call leaves a ticket's fee out; a face price missing here shows without a fee line.
  var FEES = { 20: 3.48, 30: 4.29 };
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
    var face = e.minPrice, t = (e.availableTickets || []).filter(function (x) { return x.price === face && x.fee != null; })[0];
    var fee = t ? t.fee : FEES[face];
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
    // Next is the first show you can still buy before it starts, the one Micdrop's top widget shows: once tonight's show
    // has started the widget moves on to next Friday, and the phone bar has to say that Friday, not tonight.
    var next = list.filter(function (e) { return state(e).open && new Date(e.startDateTime).getTime() > now; })[0];
    // The first Friday sold out: Featured says so and moves on to the next one you can buy.
    var sold = list[0] && state(list[0]).sold && list[0] !== next ? list[0] : null;
    // The cards themselves are the Micdrop widgets' job (embeds below). These hand-drawn ones only go in where a widget never
    // settles, or with ?widgets=standin: filled while a widget loads, they were a second card format (and a second price) on screen.
    cards = { featured: next ? featured(next, sold) : empty(), list: list.length ? rows(list.filter(function (e) { return e !== next && e !== sold; })) : '' };
    [feat, slot].forEach(function (el) { if (el && (STANDIN || el.hasAttribute('data-gave-up'))) standin(el); });
    if (!next) { var b0 = document.querySelector('[data-buybar]'); if (b0) b0.remove(); }
    if (next) {
      var d = day(next.startDateTime);
      [].forEach.call(document.querySelectorAll('[data-next]'), function (a) { a.href = href(next); a.setAttribute('data-event', next.id); });
      var bar = document.querySelector('[data-buybar] > div');
      if (bar) bar.innerHTML = '<b>' + rel(next) + ' · ' + d.wd.slice(0, 3) + ', ' + d.md + '</b><small>Show ' + clock(next.startDateTime) + '</small>';
    }
    watchBar();
  }
  /* Micdrop's own saved widgets fill the two slots: widget 2 "Jetpack site · Next show" (Featured,
     Date range Next show) and widget 3 "Jetpack site · Upcoming shows" (List). ?widgets=standin keeps
     the hand-drawn stand-ins above, to compare.
     One look, never a morph (Peet, 2026-10-22: the cards "morph… three or four different card formats"). Each widget draws
     unseen in its slot, stacked over the page's own card: its "Loading…", its first two shows, the rest, its photos blurring
     in. It shows only once it has stopped changing, fading in. Until then the slot shows nothing: the page's own card is never
     shown (Peet, 2026-10-23: no fallback; its button sent a visitor on a slow phone to the Micdrop page). A widget still
     changing at 15s goes in as it is; one whose script never loads leaves the slot empty. */
  var STANDIN = /[?&]widgets=standin\b/.test(location.search), cards = null;
  function standin(el) {
    el.setAttribute('data-gave-up', '');
    if (!cards) return; // the events API hasn't answered yet: shows() fills it when it does
    el.innerHTML = cards[el.getAttribute('data-micdrop-slot')] || '';
    reveal(el);
    watchBar();
  }
  function embeds() {
    if (STANDIN) return;
    var k = ' data-widget-key="' + WIDGET_KEY + '"', boxes = [];
    [[document.querySelector('[data-micdrop-slot="featured"]'), '<micdrop-calendar widget-id="2" show-background="false"' + k + '></micdrop-calendar>'],
     [document.querySelector('[data-micdrop-slot="list"]'), '<micdrop-calendar widget-id="3"' + k + '></micdrop-calendar>']].forEach(function (x) {
      var el = x[0]; if (!el || el.querySelector('micdrop-calendar')) return;
      // stacked on the card in the slot's one grid cell, invisible and taking no height (site.css), so it draws at the card's
      // width and its lazy photos load as they would in place
      // The unseen state is inline, not a class (Safari kept a removed class's height: 0 on a phone, so the drawn widget
      // took no room and painted over the sections below it).
      var box = document.createElement('div'); box.className = 'mw-pending'; box.style.cssText = PENDING; box.innerHTML = x[1];
      el.appendChild(box); el.classList.add('mw-wait'); boxes.push([el, box]);
      var t0 = Date.now(), last = '', still0 = Date.now();
      (function wait() {
        if (!box.isConnected) return;
        var cal = box.firstChild, t = box.innerText, now = Date.now();
        var look = box.innerHTML.length + '|' + Math.round(cal.getBoundingClientRect().height);
        if (look !== last) { last = look; still0 = now; }
        var drawn = !/Loading/i.test(t) && /Get tickets|Sold out|Sales (closed|paused|ended)|On sale/i.test(t);
        // photos within a screen or so of the visible page are in (ones far below load lazily, as you scroll to them)
        var photos = [].every.call(box.querySelectorAll('img'), function (i) {
          var r = i.getBoundingClientRect(); return (i.complete && i.naturalWidth) || r.top > innerHeight * 2 || r.bottom < -innerHeight;
        });
        // and no fade is still running in it (a looping one, like a pulse, never ends, so it doesn't count)
        var moving = box.getAnimations && box.getAnimations({ subtree: true }).some(function (a) {
          return a.playState === 'running' && !(a.effect && a.effect.getTiming().iterations === Infinity);
        });
        var quiet = now - still0;
        // On a slow phone it can take longer than 15s: past that it goes in the moment it has drawn, however long that
        // takes (it used to stop watching at 15s and leave the slot empty for good).
        var late = now - t0 > 15000;
        if (drawn && (late || (quiet > 300 && ((photos && !moving) || quiet > 2500)))) return swap(el, box);
        setTimeout(wait, late ? 250 : 50);
      })();
    });
    if (document.querySelector('script[src*="venue-calendar.iife"]')) return;
    var sc = document.createElement('script'); sc.defer = true; sc.src = 'https://get-micdrop.com/embed/venue-calendar.iife.js';
    sc.onerror = function () { boxes.forEach(function (x) { giveUp(x[0], x[1]); }); };
    document.head.appendChild(sc);
  }
  // The room each settled widget takes, noted as the page goes away, for the head script to keep on a reload.
  addEventListener('pagehide', function () {
    var h = {}; [].forEach.call(document.querySelectorAll('[data-micdrop-slot].mw-live'), function (el) { h[el.getAttribute('data-micdrop-slot')] = el.offsetHeight; });
    try { sessionStorage.setItem('jp-slots', JSON.stringify({ w: innerWidth, h: h })); } catch (e) {}
  });
  var PENDING = 'height: 0; overflow: visible; opacity: 0; pointer-events: none';
  function shown(el, box) { box.classList.remove('mw-pending'); box.removeAttribute('style'); el.classList.remove('mw-wait'); }
  function giveUp(el, box) { if (box.isConnected && /Get tickets|Sold out|Sales|On sale/i.test(box.innerText)) swap(el, box); }
  // The settled widget takes the card's place. Unseen (the first 2.5s, or off screen): straight in. Seen: the card fades
  // out, then the widget fades in where it was while the slot glides to the widget's height (both at once read as a muddle
  // of two cards' words over each other).
  function swap(el, box) {
    var old = [].filter.call(el.children, function (c) { return c !== box; }), r = el.getBoundingClientRect();
    var seen = !still && !root.classList.contains('j-cards-wait') && old.length && r.bottom > 0 && r.top < innerHeight;
    el.classList.add('mw-live');
    if (!seen) {
      shown(el, box);
      old.forEach(function (c) { c.remove(); });
      // A slot reaching above the screen changed height: Chrome may keep what you're reading in place by itself (d comes back
      // 0); Safari doesn't, and the page would shift under the visitor (the widget's hero card is 30px taller on a phone).
      var d = el.getBoundingClientRect().bottom - r.bottom;
      if (d && r.top < 0) scrollBy({ top: d, behavior: 'instant' });
    } else {
      old.forEach(function (c) { c.style.transition = 'opacity .14s ease-in'; c.style.opacity = 0; c.style.pointerEvents = 'none'; });
      setTimeout(function () {
        var h0 = el.offsetHeight;
        old.forEach(function (c) { c.remove(); });
        shown(el, box);
        el.animate([{ height: h0 + 'px' }, { height: box.offsetHeight + 'px' }], { duration: 250, easing: 'cubic-bezier(.3,.7,.4,1)' });
        watchBar();
      }, 140);
    }
    watchBar();
  }
  // The widgets fetch their own shows, so they go in even when this call fails (it only fills the stand-ins and the
  // phone bar); before, one failed call left the stand-ins up for good. It gets one retry first.
  function load(again) {
    var h = WIDGET_KEY ? { 'X-Widget-Key': WIDGET_KEY } : {};
    fetch(API, { headers: h }).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) { shows(d.events || []); })
      .catch(function () { if (!again) setTimeout(function () { load(true); }, 1500); });
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
      // Pressed before the widget is ready, it waits for it (up to 60s) rather than leaving for the Micdrop page.
      if (w && !go && !/Go back/.test(w.innerText)) {
        ev.preventDefault();
        var n = 0;
        (function ready() {
          var b = w.isConnected && [].filter.call(w.querySelectorAll('a, button'), function (x) { return x.textContent.trim() === 'Get tickets'; })[0];
          if (b) b.click();
          else if (++n < 1200) setTimeout(ready, 50);
        })();
      } else if (w) {
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
  // Peet's pick from the intro playground (2026-10-22): 3.3s in all; every light in the room comes on one by one from
  // the outer walls in, each with one flicker; the room comes up around a dark sign, then the sign switches on last as
  // white LED neon on a clear acrylic board. Each lamp is a copy of the photo seen through a soft radial mask, over the
  // darkened photo; the sign parts are cut by images/intro/sign-*.png, masks made from the photo's own tubes.
  // Every light in hero-mid, as % of the photo: x, y, glow width, glow height (measured off a 1% grid, 2026-10-22).
  var LIGHTS = [
    [7.5, 21.5, 1.6, 4.5], [10.8, 20, 3, 5.5], [12.6, 20, 2.4, 5], [14.2, 20, 3, 5.5], [15.9, 20.3, 2.2, 5], // left mirror
    [20.9, 20.3, 3, 5.5], [22.6, 20.8, 2.2, 5],                                                             // left wall sconce
    [24.6, 12.6, 7.5, 9], [33.1, 14.6, 3.6, 7], [50.5, 8.4, 2.6, 4.4], [69.1, 15.2, 3.6, 7], [76.6, 11, 7.5, 9], // ceiling
    [77.6, 19.8, 2.2, 5], [78.7, 19.6, 3, 5.5],                                                             // right wall sconce
    [84.2, 19.6, 2.2, 5], [86, 19.2, 3, 5.5], [88.2, 19.8, 2.2, 5], [89.9, 19.2, 3, 5.5]                    // right mirror
  ];
  var CENTER = 50.5;                     // the bare bulb over the sign: where the run ends
  var NEON = [51, 29, 17, 9];
  var SIGN_BOX = [38.75, 23.125, 25, 12.5]; // left, top, width, height: the crop the sign masks were cut from
  var MASKS = 'images/intro/sign-';
  // The timeline at 3.3s. K stretches the lamp run and the room, PK the page's own rise-in, both from the 4s intro
  // they replace: the lamps run 300K → 1700K, the room comes up at 1950K, the sign at 2650K, the header drops at 3400K
  // and the page rises from 3550K, its rise-in PK × 1.4s. site.css carries the same times (.j-lights vars).
  var LEN = 3300, T = (LEN - 2610) / 1390, K = (1700 + 900 * T) / 3550, PK = 0.65 + 0.35 * T;
  var ROOM = [1950 * K, 900 * K], SIGN = [2650 * K, 1100 * K];
  // One lamp's blink: up, one flicker, settled by 42% (the playground's flicker 60).
  var BLINK = [{ offset: 0, opacity: 0 }, { offset: 0.108, opacity: 0.9 }, { offset: 0.2, opacity: 0 }, { offset: 0.336, opacity: 1 },
    { offset: 0.372, opacity: 0.83 }, { offset: 0.42, opacity: 1 }, { offset: 1, opacity: 1 }];
  var EASE = 'cubic-bezier(.45,0,.25,1)';
  var introDone = false;

  function glow(l, src) {
    var d = document.createElement('i');
    d.style.backgroundImage = 'url("' + src + '")';
    var m = 'radial-gradient(ellipse ' + l[2] + '% ' + l[3] + '% at ' + l[0] + '% ' + l[1] + '%, #000 30%, rgba(0,0,0,.55) 60%, transparent 100%)';
    d.style.webkitMaskImage = d.style.maskImage = m;
    return d;
  }
  // A piece of the sign: a colour cut out by one of the sign masks, placed on the sign, blurred for the glow.
  function signPart(mask, color, blur) {
    var d = document.createElement('i'), s = document.createElement('span'), m = 'url(' + MASKS + mask + '.png) 0 0/100% 100% no-repeat';
    d.className = 'sign';
    d.style.cssText = 'inset:auto;left:' + SIGN_BOX[0] + '%;top:' + SIGN_BOX[1] + '%;width:' + SIGN_BOX[2] + '%;height:' + SIGN_BOX[3] + '%;' +
      'background:none;filter:' + (blur ? 'blur(' + blur + 'px)' : 'none');
    s.style.cssText = 'position:absolute;inset:0;background:' + color + ';-webkit-mask:' + m + ';mask:' + m;
    d.appendChild(s);
    return d;
  }
  // The lamp layers sit exactly over the photo as object-fit: cover draws it, so the mask % match the photo.
  function place(box, img) {
    var w = box.clientWidth, h = box.clientHeight, iw = img.naturalWidth || 2400, ih = img.naturalHeight || 1600;
    var pos = getComputedStyle(img).objectPosition.split(' ').map(parseFloat);
    var s = Math.max(w / iw, h / ih), rw = iw * s, rh = ih * s;
    return { left: (w - rw) * pos[0] / 100, top: (h - rh) * pos[1] / 100, width: rw, height: rh };
  }
  function fit(l, media, img) {
    var r = place(media, img);
    Object.keys(r).forEach(function (k) { l.style[k] = r[k] + 'px'; });
  }
  // When each light starts: the outermost light on screen first, the one nearest the middle last, evenly spread over
  // the lights you can see (a phone shows only the middle of the room; the header covers the top). Off-screen ones
  // start with the first.
  function starts(media, img) {
    var r = place(media, img), m = media.getBoundingClientRect(), hd = document.querySelector('.j-hdr');
    var top = Math.max(0, (hd ? hd.getBoundingClientRect().bottom : 0) - m.top);
    var vx = [-r.left / r.width * 100, (media.clientWidth - r.left) / r.width * 100];
    var vy = [(top - r.top) / r.height * 100, (media.clientHeight - r.top) / r.height * 100];
    var at = LIGHTS.map(function () { return 300 * K; });
    var on = LIGHTS.map(function (l, i) { return i; }).filter(function (i) {
      var l = LIGHTS[i];
      return l[0] + l[2] * 0.3 >= vx[0] && l[0] - l[2] * 0.3 <= vx[1] && l[1] + l[3] * 0.2 >= vy[0] && l[1] - l[3] * 0.2 <= vy[1];
    }).sort(function (p, q) { return Math.abs(LIGHTS[q][0] - CENTER) - Math.abs(LIGHTS[p][0] - CENTER) || LIGHTS[p][0] - LIGHTS[q][0]; });
    on.forEach(function (i, n) { at[i] = (300 + 1400 * (on.length > 1 ? n / (on.length - 1) : 1)) * K; });
    return at;
  }
  function play(d, frames, dur, at, ease) {
    d.style.animation = 'none';
    d.animate(frames, { duration: Math.round(dur), delay: Math.round(at), fill: 'both', easing: ease || 'linear' });
  }
  // The sign: dark letters (the unlit tubes) while the room comes up around them, then white LED neon. It switches on in
  // one stage (Peet, 2026-10-23: the letters lit first and the glow after read as two): the tubes, both blooms, the
  // photo's glow and the board's cut edge all fade up together on one curve while the dark letters fade out.
  // The glow layers run at half the playground's strength (Peet, 2026-10-23). timed = false draws it lit.
  function sign(l, src, timed) {
    var unlit = signPart('unlit', 'rgb(40,11,13)'), neon = glow(NEON, src);
    unlit.classList.add('unlit'); neon.className = 'neon';
    neon.style.filter = 'brightness(1.25) saturate(.7)';
    l.appendChild(unlit); l.appendChild(neon);
    var ONE = 'cubic-bezier(.3,.6,.35,1)';
    var parts = [[neon, 0.5], [signPart('tubes', '#fff'), 0.8], [signPart('tubes', '#fff', 3), 0.375],
      [signPart('tubes', '#fff', 16), 0.25], [signPart('board', '#fff', 0.6), 0.08]]
      .map(function (p) { return [p[0], [{ opacity: 0 }, { opacity: p[1] }], ONE]; });
    parts.push([unlit, [{ opacity: 1 }, { opacity: 0 }], ONE]);
    parts.forEach(function (p) {
      if (!p[0].parentNode) l.appendChild(p[0]);
      if (timed) play(p[0], p[1], SIGN[1], SIGN[0], p[2]);
      else { p[0].style.animation = 'none'; p[0].style.opacity = p[1][p[1].length - 1].opacity; }
    });
    // the unlit tubes come up with the room, so the letters read as dark glass, not a hole
    if (timed) unlit.animate([{ filter: 'brightness(.06)' }, { filter: 'brightness(1)' }],
      { duration: Math.round(ROOM[1]), delay: Math.round(ROOM[0]), fill: 'both', easing: 'cubic-bezier(.3,.7,.4,1)' });
  }
  function lamps(media, img, timed) {
    var src = img.currentSrc || img.src, l = document.createElement('div');
    l.className = 'j-lamps';
    fit(l, media, img);
    var at = timed && starts(media, img);
    LIGHTS.forEach(function (x, i) {
      var d = glow(x, src);
      if (timed) play(d, BLINK, 800 * Math.max(K, 0.6), at[i]); else { d.style.animation = 'none'; d.style.opacity = 1; }
      l.appendChild(d);
    });
    sign(l, src, timed);
    media.appendChild(l);
    // Re-fit whenever the photo's box changes size (a window resize, the scrollbar coming back, the phone's
    // address bar), not only on a window resize: a layer left at the old size draws the lamps and the sign doubled.
    if ('ResizeObserver' in window) new ResizeObserver(function () { fit(l, media, img); }).observe(media);
    else addEventListener('resize', function () { fit(l, media, img); });
    return l;
  }
  // The head script decides whether the intro plays (j-intro-wait). It plays only once the hero photo is in:
  // a photo still missing after 1.5s skips it, so a slow phone gets the page, not a long dark wait.
  function intro() {
    var hero = document.querySelector('.a-hero');
    if (!hero || still || !root.classList.contains('j-intro-wait')) return end();
    var media = hero.querySelector('.a-hero-media'), img = hero.querySelector('.a-hero-img');
    words(hero.querySelector('h1'));
    var go = function () {
      if (introDone || !root.classList.contains('j-intro-wait')) return end();
      lamps(media, img, true);
      root.classList.remove('j-intro-wait');
      root.classList.add('j-intro');
      setTimeout(end, LEN);
    };
    var ready = function () { return img.complete && img.naturalWidth; }, started = false;
    var start = function () { if (!started) { started = true; ready() ? requestAnimationFrame(go) : end(); } };
    if (ready()) start();
    else { img.addEventListener('load', start); img.addEventListener('error', start); }
    setTimeout(start, 1500);
  }
  // The page as it is after the intro, and as a reload or Back finds it: everything in place, the lamps and the LED sign
  // lit over the photo and kept there as it resizes. Safe to call more than once.
  function end() {
    root.classList.remove('j-intro', 'j-intro-wait', 'j-lock', 'j-lights');
    if (introDone) return;
    introDone = true;
    glide();
    var media = document.querySelector('.a-hero-media'), img = media && media.querySelector('.a-hero-img');
    if (!img) return;
    var lit = function () {
      var l = media.querySelector('.j-lamps');
      if (l) l.getAnimations({ subtree: true }).forEach(function (a) { a.finish(); }); // cut short: jump to the lit end
      else l = lamps(media, img, false);
      l.classList.add('j-lit');
      fit(l, media, img);
    };
    if (img.complete && img.naturalWidth) lit(); else img.addEventListener('load', lit);
  }
  window.JP_END = end;

  /* ---------- gliding wheel scroll (Lenis, self-hosted in vendor/) ------------------------------- */
  // A mouse wheel or trackpad glides the page instead of stepping it (Peet's pick, 2026-10-22). It starts in end(), so
  // never while the intro holds scrolling, and never for reduced motion or touch-only devices (they keep native scroll).
  // It leaves the wheel alone over anything that scrolls by itself (a box inside a Micdrop widget) and whenever a dialog
  // is open: the widget's full-window show page and checkout are modal dialogs, and the page behind must not move.
  // Menu links keep the browser's own smooth jump, which stops under the header (scroll-padding-top in site.css).
  function glide() {
    if (still || window.JP_LENIS || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var s = document.createElement('script');
    s.src = 'vendor/lenis-1.3.11.min.js';
    s.onload = function () {
      if (!window.Lenis) return;
      window.JP_LENIS = new window.Lenis({
        autoRaf: true, lerp: 0.1, allowNestedScroll: true,
        prevent: function (n) { return n.localName === 'dialog'; },
        virtualScroll: function () { return !document.querySelector('dialog[open]') && !root.classList.contains('j-lock'); }
      });
    };
    document.head.appendChild(s);
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

  // The ticket widgets start first, and every part runs on its own: one part failing on some phone (friends' iPhones on fast
  // wifi, 2026-10-23) must never leave the show slots empty, which it did when the widgets came last.
  var oops = [], WHY = /[?&]why\b/.test(location.search), calls = [];
  // ?why also logs every request to Micdrop: what it asked for, its answer and how long it took, or that it never answered
  if (WHY && window.fetch) {
    var f0 = window.fetch;
    window.fetch = function (u, o) {
      var url = String(u && u.url || u), c = { u: url.replace(/^https:\/\/get-micdrop\.com/, '').slice(0, 70), t: Date.now(), s: 'waiting' };
      if (/micdrop/.test(url)) calls.push(c);
      return f0.apply(this, arguments).then(function (r) { c.s = r.status + ' ' + (Date.now() - c.t) + 'ms'; return r; },
        function (e) { c.s = 'FAILED ' + (Date.now() - c.t) + 'ms ' + (e && e.message); throw e; });
    };
  }
  addEventListener('error', function (e) { oops.push((e.message || 'load failed: ' + ((e.target && (e.target.src || e.target.href)) || '?')).slice(0, 160)); }, true);
  addEventListener('unhandledrejection', function (e) { oops.push('promise: ' + String(e.reason && (e.reason.message || e.reason)).slice(0, 160)); });
  [['embeds', embeds], ['load', load], ['intro', intro], ['map', map], ['signup', signup], ['reveal', reveal], ['fades', fades], ['watchBar', watchBar]]
    .forEach(function (x) { try { x[1](); } catch (e) { oops.push(x[0] + ': ' + e.message); } });

  // ?why: what the widgets did on this phone, written on the page after 20s, to screenshot when the shows don't appear
  if (WHY) setTimeout(function () {
    var sc = document.querySelector('script[src*="venue-calendar.iife"]');
    var lines = [navigator.userAgent, 'script: ' + (sc ? 'added' : 'missing') + ' · element: ' + (window.customElements && customElements.get('micdrop-calendar') ? 'defined' : 'NOT defined'),
      'root: ' + root.className];
    [].forEach.call(document.querySelectorAll('[data-micdrop-slot]'), function (el) {
      var cal = el.querySelector('micdrop-calendar');
      lines.push(el.getAttribute('data-micdrop-slot') + ': ' + el.className + ' · h ' + el.offsetHeight + ' · ' + (cal ? 'widget h ' + cal.offsetHeight + ' "' + (cal.innerText || '').replace(/\s+/g, ' ').slice(0, 90) + '"' : 'no widget'));
    });
    lines = lines.concat(oops.length ? oops : ['no errors']);
    lines = lines.concat(calls.map(function (c) { return c.s + ' · ' + c.u; }));
    if (performance.getEntriesByType) [].forEach.call(performance.getEntriesByType('resource'), function (r) {
      if (/micdrop/.test(r.name) && r.initiatorType !== 'fetch') lines.push((r.responseStatus || '') + ' ' + Math.round(r.duration) + 'ms ' + r.initiatorType + ' · ' + r.name.replace(/^https:\/\/get-micdrop\.com/, '').slice(0, 70));
    });
    var d = document.createElement('pre');
    d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;max-height:60vh;overflow:auto;white-space:pre-wrap;font:11px/1.35 ui-monospace,monospace;background:#fff;color:#000;padding:10px;border-radius:8px';
    d.textContent = lines.join('\n');
    document.body.appendChild(d);
  }, 20000);
})();
