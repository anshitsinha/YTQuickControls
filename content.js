(() => {
  'use strict';
  if (window.__yssLoaded) return;
  window.__yssLoaded = true;

  const MIN = 0.25, MAX = 16;
  const STEP = 0.25;      // per scroll notch / per < > key press
  const BIG_STEP = 1;     // per notch while holding Shift
  const VOL_STEP = 5;     // volume % per notch while holding right mouse button

  let lastNonOne = 2;     // what a click on the speed button toggles back to (memory only)
  let wheelAcc = 0;
  const hooked = new WeakSet();

  const fmt = r => +r.toFixed(2) + 'x';
  const player = () => document.getElementById('movie_player');
  const video = () => player()?.querySelector('video');
  const rate = () => video()?.playbackRate || 1;

  function updateLabel() {
    const b = player()?.querySelector('.yss-btn');
    if (b) b.textContent = fmt(rate());
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
    const v = video();
    if (!v) return;
    const next = Math.min(MAX, Math.max(MIN, Math.round(r * 100) / 100));
    if (next !== 1) lastNonOne = next;
    v.playbackRate = next;
    updateLabel();
    showBezel(fmt(next));
  }

  // Only keeps the button label in sync (speed changed from YouTube's menu, new video, ...)
  function hookVideo(v) {
    if (hooked.has(v)) return;
    hooked.add(v);
    v.addEventListener('ratechange', updateLabel);
    updateLabel();
  }

  function onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    // Shift+wheel on Windows arrives as deltaX
    wheelAcc += e.deltaY || e.deltaX;
    if (Math.abs(wheelAcc) < 50) return;   // smooths trackpads
    const dir = wheelAcc < 0 ? 1 : -1;     // scroll up = faster
    wheelAcc = 0;
    setRate(rate() + dir * (e.shiftKey ? BIG_STEP : STEP));
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
    setRate(rate() + (e.key === '>' ? STEP : -STEP));
  }, true);

  // Opens YouTube's own settings menu straight on the Quality submenu.
  // The Quality row is found by its label, or (for non-English UIs) by its
  // value looking like "1080p" / "Auto (720p)".
  function openQuality() {
    const p = player();
    const gear = p?.querySelector('.ytp-settings-button');
    if (!gear) return;
    const menu = p.querySelector('.ytp-settings-menu');
    const isOpen = menu && menu.style.display !== 'none' && menu.offsetParent !== null;
    if (isOpen) { gear.click(); return; }   // second press closes the menu
    gear.click();
    let tries = 0;
    (function pick() {
      const items = p.querySelectorAll('.ytp-settings-menu .ytp-panel-menu .ytp-menuitem');
      const q = [...items].find(i =>
        /quality/i.test(i.querySelector('.ytp-menuitem-label')?.textContent || '') ||
        /\d{3,4}p/.test(i.querySelector('.ytp-menuitem-content')?.textContent || ''));
      if (q) q.click();
      else if (++tries < 20) requestAnimationFrame(pick);
    })();
  }

  // Label = current quality, reported by main.js (player API lives in the page world)
  let qLabel = '';
  document.addEventListener('yss-quality', e => {
    qLabel = String(e.detail || '');
    const b = player()?.querySelector('.yss-qbtn');
    if (b) b.textContent = qLabel || 'Quality';
  });

  function ensureQualityBtn(controls) {
    if (controls.querySelector('.yss-qbtn')) return;
    const b = document.createElement('button');
    b.className = 'ytp-button yss-qbtn';
    b.textContent = qLabel || 'Quality';
    b.title = 'Quality settings';
    b.setAttribute('aria-label', 'Quality settings');
    b.addEventListener('click', e => {
      e.stopPropagation();
      openQuality();
    });
    controls.prepend(b);
    document.dispatchEvent(new CustomEvent('yss-quality-req'));
  }

  function ensure() {
    const p = player();
    if (!p) return;
    const v = p.querySelector('video');
    if (v) hookVideo(v);
    const controls = p.querySelector('.ytp-right-controls');
    if (!controls) return;
    ensureQualityBtn(controls);
    if (controls.querySelector('.yss-btn')) return;

    const b = document.createElement('button');
    b.className = 'ytp-button yss-btn';
    b.title = 'Scroll: speed (Shift = bigger steps) · Click: toggle 1x';
    b.setAttribute('aria-label', 'Playback speed');
    b.addEventListener('wheel', onWheel, { passive: false });
    b.addEventListener('click', e => {
      e.stopPropagation();
      setRate(rate() === 1 ? lastNonOne : 1);
    });
    controls.prepend(b);
    updateLabel();
  }

  ensure();
  document.addEventListener('yt-navigate-finish', ensure);
  setInterval(ensure, 1500); // YouTube rebuilds the player sometimes; this is a single cheap lookup
})();
