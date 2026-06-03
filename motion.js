// ─────────────────────────────────────────────────
// Echor — motion.js
// Reveal-on-scroll, hero copy injection, ripple click.
// All slow & gentle. No bouncy easings.
// ─────────────────────────────────────────────────

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero copy (so Tweaks can swap it via setHero)
  const HERO_VARIANTS = {
    a: {
      title: '見つけたことばを、<br/><span class="quiet">ここに。</span>',
      sub:   'echorは、まだきれいにまとまっていない<span class="sp-block">断片を残す場所です。</span>'
    },
    b: {
      title: '自分の中に残ったことばを、<br/><span class="quiet">そっと置いておく。</span>',
      sub:   'ことばの箱庭。<br/>完成された一行ではなく、まだ揺れている一行のための場所。'
    },
    c: {
      title: 'まだことばにならないものを、<br/><span class="quiet">置いておく。</span>',
      sub:   '小説の一節も、深夜に浮かんだ感情も。<br/>あなたにとって大事な“断片”を、Echorに。'
    }
  };

  window.__echor = window.__echor || {};
  window.__echor.setHero = function(key){
    const v = HERO_VARIANTS[key] || HERO_VARIANTS.a;
    const t = document.getElementById('hero-title');
    const s = document.getElementById('hero-sub');
    if(t) t.innerHTML = v.title;
    if(s) s.innerHTML = v.sub;
  };
  window.__echor.setHero('a');

  // reveal on scroll — slow fade up
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.12
  });

  document.querySelectorAll('.reveal').forEach(el => {
    if(prefersReduced){ el.classList.add('is-in'); return; }
    io.observe(el);
  });

  // hero gets revealed immediately on load (no scroll trigger needed)
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero .reveal').forEach(el => {
      el.classList.add('is-in');
    });
  });

  // gentle ripple on click anywhere within hero
  const hero = document.querySelector('.hero');
  if(hero && !prefersReduced){
    hero.addEventListener('click', (ev) => {
      if(ev.target.closest('form,button,a,input')) return;
      const r = hero.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      const dot = document.createElement('span');
      dot.className = 'click-ripple';
      dot.style.left = x + 'px';
      dot.style.top  = y + 'px';
      hero.appendChild(dot);
      setTimeout(() => dot.remove(), 2400);
    });
  }

  // form submit → just a soft state, no real submission
  document.querySelectorAll('form.notify').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const input = form.querySelector('input');
      if(!input.value){ input.focus(); return; }
      const span = btn.querySelector('span');
      const original = span.textContent;
      span.textContent = 'おしらせします。';
      btn.querySelector('.arr').textContent = '✓';
      btn.style.background = 'var(--accent)';
      input.value = '';
      setTimeout(() => {
        span.textContent = original;
        btn.querySelector('.arr').textContent = '→';
        btn.style.background = '';
      }, 3200);
    });
  });
})();

/* click-ripple style injected here so it ships with motion */
(function(){
  const s = document.createElement('style');
  s.textContent = `
    .click-ripple{
      position:absolute; width:8px; height:8px; border-radius:99px;
      transform:translate(-50%,-50%);
      border:1px solid var(--ink-3);
      pointer-events:none;
      animation: clickRipple 2.4s ease-out forwards;
    }
    @keyframes clickRipple{
      0%  { width:0; height:0; opacity:.8;}
      100%{ width:280px; height:280px; opacity:0;}
    }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────
// Garden — quiet convergence, with deliberate timing.
//
// The section breathes in two staged signals, both written onto .garden-field:
//   --gp-atmos (0→1): the AIR. starts after the user has dwelt briefly with
//                     the section visible. drives the warm tint, anchor opacity.
//   --gp-pull  (0→1): the FRAGMENTS. lags ~half a beat behind --gp-atmos,
//                     ramps slowly. drives the per-fragment pull and shadow.
//
// Both are decoupled from raw scroll position. We compute:
//   visibility — how much of the section's vertical extent is comfortably
//                inside a centered viewport band (top 25% / bottom 25%
//                excluded), 0..1
//   dwell      — integrates over time when visibility is high; bleeds off
//                slowly when low. This is what creates the half-beat lag.
// Then --gp-atmos eases toward dwell; --gp-pull eases toward
// max(0, dwell - 0.35), so pull begins only after the air has settled.
//
// Each fragment carries a per-element pull vector toward (48%, 54%).
// The anchor's pull is forced to ~0 so it stands still — the calm center
// that everything else aligns its breath to.
// ─────────────────────────────────────────────────
(function setupGarden(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const field = document.querySelector('.garden-field');
  if(!field) return;

  // Gravity point inside the field, in percent
  const CX = 49, CY = 54;

  function assignPull(el){
    // The anchor is the still center — it does not pull.
    if(el.classList.contains('ka-anchor')){
      el.style.setProperty('--pull-x', '0px');
      el.style.setProperty('--pull-y', '0px');
      return;
    }
    const sx = parseFloat(el.style.getPropertyValue('--x')) || 50;
    const sy = parseFloat(el.style.getPropertyValue('--y')) || 50;
    const dx = CX - sx;
    const dy = CY - sy;
    const dist = Math.hypot(dx, dy);
    // Tiny drift used only during the PULL phase, before settle takes over.
    // Closer fragments drift slightly more so causal "場ができた → 寄る" reads,
    // and the drift is clamped so a fragment never slides into the anchor.
    //   raw curve:     8 - dist/8
    //   distance cap:  ≤ dist * 0.25
    //   absolute cap:  ≤ 6%
    let strength = 8.0 - dist / 8.0;
    strength = Math.min(strength, dist * 0.25);
    strength = Math.max(2.0, Math.min(6.0, strength));
    if(el.classList.contains('pebble')){
      strength *= 0.55;
    }
    const ux = dist > 0.01 ? dx / dist : 0;
    const uy = dist > 0.01 ? dy / dist : 0;
    const rect = field.getBoundingClientRect();
    const px = ux * strength * (rect.width  / 100);
    const py = uy * strength * (rect.height / 100);
    el.style.setProperty('--pull-x', px.toFixed(2) + 'px');
    el.style.setProperty('--pull-y', py.toFixed(2) + 'px');
  }

  // Compute each fragment's LAND vector: the full translation needed to bring
  // it from its scattered position to its pile slot near the anchor.
  // Slot offsets live on each element as data-slot-x / data-slot-y / data-slot-r
  // (px relative to anchor centre, degrees absolute). The CSS reads these via
  // --land-x / --land-y / --land-r-deg and interpolates from pull→land using
  // --gp-settle and the per-class --settle-start / --settle-end window.
  function assignLand(el){
    const slotX = parseFloat(el.dataset.slotX);
    const slotY = parseFloat(el.dataset.slotY);
    const slotR = parseFloat(el.dataset.slotR);
    if(isNaN(slotX) || isNaN(slotY)) return;
    const sx = parseFloat(el.style.getPropertyValue('--x')) || 50;
    const sy = parseFloat(el.style.getPropertyValue('--y')) || 50;
    const rect = field.getBoundingClientRect();
    // target_centre_px = anchor_centre_px + slot_px
    // current_centre_px = (sx/100) * field_w
    // land = target − current = ((CX − sx)/100) * field_w + slotX
    const landX = ((CX - sx) / 100) * rect.width  + slotX;
    const landY = ((CY - sy) / 100) * rect.height + slotY;
    el.style.setProperty('--land-x', landX.toFixed(2) + 'px');
    el.style.setProperty('--land-y', landY.toFixed(2) + 'px');
    if(!isNaN(slotR)){
      el.style.setProperty('--land-r-deg', slotR + 'deg');
    }
  }

  function assignAllPulls(){
    field.querySelectorAll('.kakera, .pebble').forEach(assignPull);
    field.querySelectorAll('.kakera').forEach(assignLand);
  }
  assignAllPulls();

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(assignAllPulls);
  });

  if(prefersReduced){
    field.style.setProperty('--gp-atmos',  '0.4');
    field.style.setProperty('--gp-pull',   '0.3');
    field.style.setProperty('--gp-settle', '0.2');
    // Backwards-compat var name for any old CSS still reading --gp
    field.style.setProperty('--gp', '0.35');
    return;
  }

  const section = field.closest('section');

  // State
  let dwell    = 0;   // 0..1, accumulates while section comfortably visible
  let atmos    = 0;   // 0..1, smoothed toward dwell
  let pull     = 0;   // 0..1, smoothed toward max(0, dwell - LAG_OFFSET)
  let settle   = 0;   // 0..1, smoothed toward max(0, dwell - SETTLE_OFFSET)
  let lastT    = performance.now();

  // Tuning
  const LAG_OFFSET     = 0.20; // pull begins after atmos has built this much
  const SETTLE_OFFSET  = 0.45; // settle begins after pull is well underway
  const DWELL_RISE_SEC = 1.4;  // seconds of comfortable visibility → dwell=1
  const DWELL_FALL_SEC = 2.2;  // seconds to bleed dwell off when not visible
  const ATMOS_EASE     = 0.05; // per-frame approach (slow, but a touch faster)
  const PULL_EASE      = 0.035;
  const SETTLE_EASE    = 0.022; // settle eases in even slower — papers come to rest

  function visibility(){
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    // Define a "comfort band": the central 50% of the viewport.
    const bandTop    = vh * 0.25;
    const bandBottom = vh * 0.75;
    // How much of the section's vertical extent sits inside the band.
    const overlap = Math.max(0, Math.min(r.bottom, bandBottom) - Math.max(r.top, bandTop));
    // Reference: full band height
    const ref = Math.min(bandBottom - bandTop, r.height);
    if(ref <= 0) return 0;
    return Math.max(0, Math.min(1, overlap / ref));
  }

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function tick(now){
    const dt = Math.min(0.1, (now - lastT) / 1000); // clamp big gaps
    lastT = now;

    const v = visibility();
    // Dwell integrates visibility over time. Rising and falling rates differ
    // so the air builds slowly and bleeds off even slower — no abrupt drains.
    if(v > 0.2){
      dwell += (v / DWELL_RISE_SEC) * dt;
    } else {
      dwell -= (1 / DWELL_FALL_SEC) * dt * (1 - v);
    }
    dwell = Math.max(0, Math.min(1, dwell));

    // Atmos targets eased dwell. The ease curve makes the first beat of dwell
    // do less work, so nothing happens at the moment of entry.
    const atmosTarget = easeOutCubic(Math.max(0, (dwell - 0.08) / 0.92));
    atmos += (atmosTarget - atmos) * ATMOS_EASE;

    // Pull lags atmos by LAG_OFFSET — fragments wait for the air to be there
    // before they start to align their breath.
    const pullTarget = easeOutCubic(Math.max(0, (dwell - LAG_OFFSET) / (1 - LAG_OFFSET)));
    pull += (pullTarget - pull) * PULL_EASE;

    // Settle lags pull — papers come to rest only after they've moved.
    // Drives the anchor-stack sheets and the resting-shadow on near fragments.
    const settleTarget = easeOutCubic(Math.max(0, (dwell - SETTLE_OFFSET) / (1 - SETTLE_OFFSET)));
    settle += (settleTarget - settle) * SETTLE_EASE;

    field.style.setProperty('--gp-atmos',  atmos.toFixed(4));
    field.style.setProperty('--gp-pull',   pull.toFixed(4));
    field.style.setProperty('--gp-settle', settle.toFixed(4));
    // Backwards-compat: anything still reading --gp gets the atmos signal.
    field.style.setProperty('--gp', atmos.toFixed(4));

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

// ─────────────────────────────────────────────────
// Linger — section 02 "残ってしまうことば".
// Normal scroll flow (no sticky). --mp (merge progress, 0..1) is computed
// from .linger-canvas's position relative to the viewport: mp = 0 when
// the canvas top is at the viewport bottom (just entering), mp = 1 when
// the canvas bottom is at the viewport top (just exiting). Memos fade in
// as the canvas scrolls through.
//
// The whole thing reads as "scrolling past, the air shifted" rather than
// a sticky stage performance.
// ─────────────────────────────────────────────────
(function setupLinger(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.querySelector('#linger');
  if(!section) return;
  const track = section.querySelector('.linger-track');
  if(!track) return;

  if(prefersReduced){
    section.style.setProperty('--mp', '1');
    return;
  }

  let mp = 0, target = 0;

  function compute(){
    // --mp is computed from the TRACK's position, not the canvas.
    // The canvas is sticky inside the track, so its bounding rect doesn't
    // move during the pin range. The track itself, however, scrolls
    // normally — that's what we read to advance the merge progress.
    const r = track.getBoundingClientRect();
    const vh = window.innerHeight;
    // Travel: from "track top at viewport top" to "track bottom at
    // viewport bottom". That's (track.height - vh) px of scroll.
    const travel = track.offsetHeight - vh;
    if(travel <= 0){ target = 1; return; }
    // -r.top = how far the track has scrolled past the viewport top.
    const t = Math.max(0, Math.min(1, -r.top / travel));
    target = t;
  }

  function tick(){
    mp += (target - mp) * 0.12;
    if(Math.abs(target - mp) < 0.0005) mp = target;
    section.style.setProperty('--mp', mp.toFixed(4));
    requestAnimationFrame(tick);
  }

  compute();
  tick();
  window.addEventListener('scroll', compute, { passive: true });
  window.addEventListener('resize', compute);
})();

// ─────────────────────────────────────────────────
// Linger mobile fade — 480px 以下のみ動作。
// 2段階分離演出:
//   Stage 1) quote が画面に入り始めたら早めにフェードイン
//            → threshold 0.2 / rootMargin なし（viewport 全体）
//   Stage 2) quote center が viewport center 付近に来たら memo を起動
//            → rootMargin -50% + threshold 0.4 で発火
//            → 900ms 後から 220ms 間隔でカード順次出現
// Stage 2 の IO は Stage 1 発火後に動的に生成 (per-quote)。
// ─────────────────────────────────────────────────
(function setupLingerMobileFade(){
  if(!window.matchMedia('(max-width: 480px)').matches) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(prefersReduced){
    document.querySelectorAll('#linger .linger-quote, #linger .linger-memo')
      .forEach(el => el.classList.add('linger-card-in'));
    return;
  }

  // Stage 2: quote が viewport 中央付近に来たら memo を遅延出現させる
  function armMemoTrigger(quote, group) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(!e.isIntersecting) return;
        io.unobserve(e.target);
        group.querySelectorAll('.linger-memo').forEach((memo, i) => {
          setTimeout(() => memo.classList.add('linger-card-in'), 500 + i * 200);
        });
      });
    }, {
      rootMargin: '0px 0px -50% 0px',  // effective root = viewport 上半分
      threshold: 0.4                    // quote center ≈ viewport center で発火
    });
    io.observe(quote);
  }

  // Stage 1: quote が画面に入り始めたら即フェードイン、その後 memo trigger をセット
  const quoteShowIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      quoteShowIO.unobserve(e.target);
      e.target.classList.add('linger-card-in');

      const group = e.target.closest('.linger-group');
      if(group) armMemoTrigger(e.target, group);
    });
  }, { threshold: 0.2 });  // 20% 見えたら quote 表示（早め）

  document.querySelectorAll('#linger .linger-quote').forEach(q => quoteShowIO.observe(q));
})();