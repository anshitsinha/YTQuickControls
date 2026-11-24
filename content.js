(() => {
  'use strict';
  if (window.__yssLoaded) return;
  window.__yssLoaded = true;

  const MIN = 0.25, MAX = 16;
  const STEP = 0.25;      // per scroll notch / per < > key press
  const BIG_STEP = 1;     // per notch while holding Shift
  const VOL_STEP = 5;     // volume % per notch while holding right mouse button
  const KEY = 'ytSpeedScroll.rate';

  let desired = 1;
  try { desired = parseFloat(localStorage.getItem(KEY)) || 1; } catch {}
  let lastNonOne = desired !== 1 ? desired : 2;
  let enforceUntil = 0;   // window after a new video loads where YouTube's reset gets overridden
  let wheelAcc = 0;
  const hooked = new WeakSet();

  const fmt = r => +r.toFixed(2) + 'x';
  const player = () => document.getElementById('movie_player');
  const video = () => player()?.querySelector('video');

  function save() {
    try { localStorage.setItem(KEY, String(desired)); } catch {}
  }

  function updateLabel() {
    const b = player()?.querySelector('.yss-btn');
    const v = video();
    if (b) b.textContent = fmt(v ? v.playbackRate : desired);
  }

  // Top-centre speed popup. Built from YouTube's own bezel classes so it picks up
  // the player's default look (and its fade animation); style.css only adds a
  // fallback in case YouTube renames them. YouTube's own popup element is driven
  // by its internal state, so we keep a separate copy instead of poking at it.
  let bezelTimer;
  function showBezel(text) {
    const p = player();
    if (!p) return;
    let box = p.querySelector('.yss-bezel');
    if (!box) {
      box = document.createElement('div');
      box.className = 'yss-bezel';
      // No innerHTML: YouTube enforces Trusted Types
      const w = document.createElement('div');
      w.className = 'ytp-bezel-text-wrapper';
      const t = document.createElement('div');
      t.className = 'ytp-bezel-text';
      w.appendChild(t);
      box.appendChild(w);
      p.appendChild(box);
    }
    const wrap = box.firstElementChild;
    wrap.firstElementChild.textContent = text;
    box.hidden = false;
    // Restart YouTube's fade-out animation on every change
    wrap.style.animation = 'none';
    void wrap.offsetWidth;
    wrap.style.animation = '';
    clearTimeout(bezelTimer);
    bezelTimer = setTimeout(() => { box.hidden = true; }, 1000);
  }

  function setRate(r) {
    desired = Math.min(MAX, Math.max(MIN, Math.round(r * 100) / 100));
    if (desired !== 1) lastNonOne = desired;
    save();
    const v = video();
    if (v && v.playbackRate !== desired) v.playbackRate = desired;
    updateLabel();
    showBezel(fmt(desired));
  }

  function apply(v) {
    if (v.playbackRate !== desired) v.playbackRate = desired;
  }

  function hookVideo(v) {
    if (hooked.has(v)) return;
    hooked.add(v);
    v.addEventListener('loadstart', () => { enforceUntil = Date.now() + 3000; });
    v.addEventListener('loadedmetadata', () => apply(v));
    v.addEventListener('playing', () => { if (Date.now() < enforceUntil) apply(v); });
    v.addEventListener('ratechange', () => {
      if (v.playbackRate !== desired) {
        if (Date.now() < enforceUntil) {
          // YouTube resetting speed on a new video / ad: keep ours
          v.playbackRate = desired;
          return;
        }
        // Changed via YouTube's own speed menu: adopt it
        desired = v.playbackRate;
        if (desired !== 1) lastNonOne = desired;
        save();
      }
      updateLabel();
    });
    apply(v);
  }

  function onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    // Shift+wheel on Windows arrives as deltaX
    wheelAcc += e.deltaY || e.deltaX;
    if (Math.abs(wheelAcc) < 50) return;   // smooths trackpads
    const dir = wheelAcc < 0 ? 1 : -1;     // scroll up = faster
    wheelAcc = 0;
    setRate(desired + dir * (e.shiftKey ? BIG_STEP : STEP));
  }

  // Hold right mouse button + scroll over the video: volume (scroll up = louder).
  // The volume itself is changed by main.js through YouTube's player API.
  let volAcc = 0, suppressMenu = false;
  window.addEventListener('wheel', e => {
    if (!(e.buttons & 2)) return;
    const p = player();
    if (!p || !p.contains(e.target) || e.target.closest('.yss-btn')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    suppressMenu = true;
    volAcc += e.deltaY;
    if (Math.abs(volAcc) < 50) return;     // smooths trackpads
    const dir = volAcc < 0 ? 1 : -1;
    volAcc = 0;
    document.dispatchEvent(new CustomEvent('yss-volume', { detail: dir * VOL_STEP }));
  }, { capture: true, passive: false });

  document.addEventListener('yss-volume-done', e => showBezel(e.detail + '%'));

  // Releasing the right button after a volume scroll shouldn't open the context menu
  window.addEventListener('contextmenu', e => {
    if (!suppressMenu) return;
    suppressMenu = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  window.addEventListener('mousedown', e => { if (e.button === 2) suppressMenu = false; }, true);

  function isTyping(e) {
    const t = e.composedPath()[0];
    return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }

  // Shift+> / Shift+< : replaces YouTube's own shortcut (which stops at 2x)
  window.addEventListener('keydown', e => {
    if (e.key !== '>' && e.key !== '<') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (!video() || isTyping(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    setRate(desired + (e.key === '>' ? STEP : -STEP));
  }, true);

  function ensure() {
    const p = player();
    if (!p) return;
    const v = p.querySelector('video');
    if (v) hookVideo(v);
    const controls = p.querySelector('.ytp-right-controls');
    if (!controls || controls.querySelector('.yss-btn')) return;

    const b = document.createElement('button');
    b.className = 'ytp-button yss-btn';
    b.title = 'Scroll: speed (Shift = bigger steps) · Click: toggle 1x';
    b.setAttribute('aria-label', 'Playback speed');
    b.addEventListener('wheel', onWheel, { passive: false });
    b.addEventListener('click', e => {
      e.stopPropagation();
      setRate(desired === 1 ? lastNonOne : 1);
    });
    controls.prepend(b);
    updateLabel();
  }

  ensure();
  document.addEventListener('yt-navigate-finish', ensure);
  setInterval(ensure, 1500); // YouTube rebuilds the player sometimes; this is a single cheap lookup
})();
