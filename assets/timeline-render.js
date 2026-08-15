/* Renders the overview gantt and the day-by-day cards from window.TRIP_DAYS.
   Locations resolve against window.PLACES (assets/places.js) so coordinates
   live in exactly one place. */
(function () {
  'use strict';

  var DAY_START = 7 * 60;   // 07:00
  var DAY_END = 23 * 60 + 30;
  var SPAN = DAY_END - DAY_START;
  var LABEL_PAD = 26;       // px of bar chrome (icon + padding) a label must clear
  var CHAR_PX = 5.7;        // approx width of the 11px label face

  var ICONS = {
    car:    '<path d="M4 16.2v-3.4L5.6 8.4A2 2 0 017.5 7h9a2 2 0 011.9 1.4L20 12.8v3.4"/><circle cx="7.6" cy="16.4" r="1.5"/><circle cx="16.4" cy="16.4" r="1.5"/><path d="M4 13h16"/>',
    hike:   '<path d="M3 18.5l5.6-9.2 3.4 5.4 2.6-4L21 18.5z"/>',
    lift:   '<path d="M3 6h18"/><path d="M12 6v3.2"/><rect x="7.6" y="9.2" width="8.8" height="6.6" rx="1.6"/>',
    fork:   '<path d="M7 3v6.2M9.6 3v6.2M8.3 9.2V21"/><path d="M15.4 3c1.9 1.4 1.9 5 0 6.4V21"/>',
    wine:   '<path d="M8 3h8l-.7 5.2A3.4 3.4 0 0112 11.6a3.4 3.4 0 01-3.3-3.4z"/><path d="M12 11.6V19M9.2 19h5.6"/>',
    sight:  '<rect x="3" y="7" width="18" height="12.5" rx="2.2"/><circle cx="12" cy="13.2" r="3.2"/><path d="M8.8 7l1.3-2.2h3.8L15.2 7"/>',
    boat:   '<path d="M3.2 17.4c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 5.6 0"/><path d="M5.4 14l1.4-4.6h10.4L18.6 14"/><path d="M12 9.4V4.2"/>',
    plane:  '<path d="M21 4.2L3 11l7.2 2.8L13 21z"/><path d="M21 4.2l-10.8 9.6"/>',
    bed:    '<path d="M3 19v-9M3 13.6h18V19M21 19v-5.4a2 2 0 00-2-2h-6.6v2"/><circle cx="7.2" cy="10.8" r="2.1"/>',
    church: '<path d="M12 2.4v4.8M10.1 4.6h3.8"/><path d="M6 21V11.2l6-4 6 4V21"/><path d="M9.6 21v-3.8a2.4 2.4 0 014.8 0V21"/>',
    spa:    '<path d="M3 15.4c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 19.4c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M12 11.4c0-3 2-4 2-6.2-2 1-4 2-4 4.6"/>',
  };
  var KIND_LABEL = { drive: 'On the road', mountain: 'Mountain', town: 'Town & indoors' };

  function svg(key, cls) {
    var p = ICONS[key] || ICONS.sight;
    return '<span class="' + (cls || 'ic') + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg></span>';
  }
  function mins(hhmm) {
    var b = hhmm.split(':');
    return (+b[0]) * 60 + (+b[1]);
  }
  function pct(m) { return ((m - DAY_START) / SPAN) * 100; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- location lookup: single source of truth is assets/places.js ----
  var BY_NAME = {};
  (window.PLACES || []).forEach(function (p) { BY_NAME[p.n] = p; });
  var missing = [];
  function place(name) {
    if (!name) return null;
    var p = BY_NAME[name];
    if (!p) { missing.push(name); return null; }
    return p;
  }
  function mapsSearch(p) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.q);
  }
  function mapsDir(p) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.q);
  }
  var PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10.4" r="2.6"/></svg>';

  function navBtn(name, small) {
    var p = place(name);
    if (!p) return '';
    return '<a class="nav-btn' + (small ? ' sm' : '') + '" target="_blank" rel="noopener" href="' + esc(mapsDir(p)) +
      '">' + PIN + 'Navigate<span class="sr-only"> to ' + esc(p.n) + '</span></a>';
  }

  // ---------- overview gantt ----------
  function renderGantt(el) {
    var h = [];
    // header row with the hour scale
    h.push('<div class="g-row head"><div class="g-lab"><span class="d">Day</span></div><div class="g-plot">');
    for (var t = 8 * 60; t <= 22 * 60; t += 120) {
      h.push('<span class="g-hr" style="left:' + pct(t).toFixed(3) + '%">' + String(t / 60).padStart(2, '0') + ':00</span>');
    }
    h.push('</div></div>');

    window.TRIP_DAYS.forEach(function (d) {
      h.push('<div class="g-row">');
      h.push('<div class="g-lab"><a href="#d' + d.n + '"><span class="d">' + esc(d.date) +
        (d.star ? ' <span class="tl-star" aria-label="highlight">★</span>' : '') +
        '</span><span class="w">Day ' + d.n + '</span></a></div>');
      h.push('<div class="g-plot">');
      for (var tk = 8 * 60; tk <= 22 * 60; tk += 120) {
        h.push('<span class="g-tick" style="left:' + pct(tk).toFixed(3) + '%"></span>');
      }
      // main track
      h.push('<div class="g-track">');
      d.acts.forEach(function (a, i) {
        var s = mins(a.s), e = mins(a.e);
        var left = pct(s), w = ((e - s) / SPAN) * 100;
        h.push('<button type="button" class="g-bar k-' + a.k + (a.opt ? ' opt' : '') +
          '" style="left:' + left.toFixed(3) + '%;width:calc(' + w.toFixed(3) + '% - 2px)"' +
          ' data-day="' + d.n + '" data-i="' + i + '"' +
          ' aria-label="' + esc(a.s + '–' + a.e + ' ' + a.t) + '">' +
          svg(a.i) + '<span class="lb"></span></button>');
      });
      h.push('</div>');
      // plan-B track
      if (d.planB) {
        var bs = mins(d.planB.s), be = mins(d.planB.e);
        h.push('<div class="g-track b"><div class="g-bfall" data-day="' + d.n + '" data-i="b"' +
          ' style="left:' + pct(bs).toFixed(3) + '%;width:calc(' + (((be - bs) / SPAN) * 100).toFixed(3) + '% - 2px)"' +
          ' aria-label="Plan B for ' + esc(d.date) + '"><span class="lb">Plan B</span></div></div>');
      }
      h.push('</div></div>');
    });
    el.innerHTML = h.join('');
  }

  // Fit labels to the bar they sit in — truncate the source string so nothing
  // is ever visually clipped. Re-run on resize.
  function fitLabels() {
    document.querySelectorAll('.g-bar').forEach(function (bar) {
      var d = window.TRIP_DAYS.find(function (x) { return x.n === +bar.dataset.day; });
      var a = d.acts[+bar.dataset.i];
      var lb = bar.querySelector('.lb');
      var room = bar.getBoundingClientRect().width - LABEL_PAD;
      var max = Math.floor(room / CHAR_PX);
      if (max < 6) { lb.textContent = ''; return; }
      // whole words only — a truncated stub ("Villa Carl") reads worse than no label
      var short = a.sh || a.t.split(' — ')[0].split(' (')[0];
      if (short.length > max) {
        var out = '';
        short.split(' ').every(function (w) {
          var cand = out ? out + ' ' + w : w;
          if (cand.length > max) return false;
          out = cand;
          return true;
        });
        short = out;
      }
      // never end on punctuation or a dangling function word
      short = short.replace(/[\s/→·,–—-]+$/, '')
                   .replace(/\s+(at|the|to|of|in|on|and|a|an|for|past|via|from|by|over|up|down|into)$/i, '')
                   .replace(/[\s/→·,–—-]+$/, '');
      lb.textContent = short.length >= 3 ? short : '';
    });
  }

  // ---------- tooltip ----------
  function wireTooltip() {
    var tip = document.createElement('div');
    tip.className = 'g-tip';
    tip.setAttribute('role', 'status');
    document.body.appendChild(tip);

    function show(el, html) {
      tip.innerHTML = html;
      tip.classList.add('on');
      var r = el.getBoundingClientRect();
      var tr = tip.getBoundingClientRect();
      var left = Math.min(Math.max(8, r.left), window.innerWidth - tr.width - 8);
      var top = r.top - tr.height - 9;
      if (top < 8) top = r.bottom + 9;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    function hide() { tip.classList.remove('on'); }

    document.addEventListener('mouseover', function (ev) {
      var bar = ev.target.closest('.g-bar,.g-bfall');
      if (!bar) return;
      var d = window.TRIP_DAYS.find(function (x) { return x.n === +bar.dataset.day; });
      if (bar.dataset.i === 'b') {
        show(bar, '<b>Plan B — ' + esc(d.date) + '</b><span class="tm">if it rains</span><br>' + esc(d.planB.why));
      } else {
        var a = d.acts[+bar.dataset.i];
        show(bar, '<b>' + esc(a.t) + '</b><span class="tm">' + esc(d.date + ' · ' + a.s + '–' + a.e) +
          '</span>' + (a.note ? '<br>' + esc(a.note) : ''));
      }
    });
    document.addEventListener('mouseout', function (ev) {
      if (ev.target.closest('.g-bar,.g-bfall')) hide();
    });
    document.addEventListener('focusin', function (ev) {
      var bar = ev.target.closest('.g-bar');
      if (bar) bar.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
    document.addEventListener('focusout', hide);
    // tapping a bar jumps to that day's detail
    document.addEventListener('click', function (ev) {
      var bar = ev.target.closest('.g-bar,.g-bfall');
      if (!bar) return;
      var target = document.getElementById('d' + bar.dataset.day);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    window.addEventListener('scroll', hide, { passive: true });
  }

  // ---------- day cards ----------
  function renderDays(el) {
    var h = [];
    window.TRIP_DAYS.forEach(function (d) {
      h.push('<article class="tl-day" id="d' + d.n + '">');
      h.push('<div class="tl-dhead"><span class="tl-chip">' + esc(d.date) + '</span><h3>' + esc(d.title) + '</h3>' +
        (d.star ? '<span class="tl-star" title="Highlight">★</span>' : '') + '</div>');
      h.push('<p class="tl-base"><b>Sleeping:</b> ' + esc(d.base) + (d.note ? ' · ' + esc(d.note) : '') + '</p>');
      if (d.critical) h.push('<p class="tl-crit">⚠ ' + esc(d.critical) + '</p>');

      h.push('<ul class="tl-acts">');
      d.acts.forEach(function (a) {
        h.push('<li class="tl-act k-' + a.k + '">');
        h.push('<span class="tm">' + esc(a.s) + '–' + esc(a.e) + '</span>');
        h.push(svg(a.i));
        h.push('<div class="bd"><div class="nm">' + esc(a.t) +
          (a.opt ? '<span class="opt-tag">optional</span>' : '') + '</div>');
        if (a.note) h.push('<div class="nt">' + esc(a.note) + '</div>');
        h.push(navBtn(a.p));
        h.push('</div></li>');
      });
      h.push('</ul>');

      if (d.flex) {
        h.push('<div class="tl-flex"><span class="bdg">Flex</span><div class="nm">' + esc(d.flex.t) + '</div>' +
          '<div class="nt">' + esc(d.flex.note) + '</div>' + navBtn(d.flex.p, true) + '</div>');
      }
      if (d.planB) {
        h.push('<div class="tl-fall"><div class="hd"><span class="bdg">Plan B</span></div>');
        h.push('<p class="why"><b>What breaks:</b> ' + esc(d.planB.why) + '</p><ul>');
        d.planB.opts.forEach(function (o) {
          h.push('<li>' + esc(o.t) + navBtn(o.p, true) + '</li>');
        });
        h.push('</ul>');
        if (d.planB.cold) h.push('<p class="tl-cold"><b>Hard cold:</b> ' + esc(d.planB.cold) + '</p>');
        h.push('</div>');
      }
      h.push('</article>');
    });
    el.innerHTML = h.join('');
  }

  function renderLegend(el) {
    var h = [];
    ['drive', 'mountain', 'town'].forEach(function (k) {
      h.push('<span class="tl-key"><span class="sw" style="background:var(--k-' + k + ')"></span>' + KIND_LABEL[k] + '</span>');
    });
    h.push('<span class="tl-key"><span class="sw b"></span>Plan B — the wet-weather swap</span>');
    el.innerHTML = h.join('');
  }

  function init() {
    if (!window.TRIP_DAYS || !window.PLACES) return;
    renderLegend(document.getElementById('legend'));
    renderGantt(document.getElementById('gantt'));
    renderDays(document.getElementById('days'));
    fitLabels();
    wireTooltip();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitLabels, 120); });
    if (missing.length) console.warn('timeline: unresolved places ->', missing);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
