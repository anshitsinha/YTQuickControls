// Runs in the page's own JS world so it can use YouTube's player API.
// content.js asks for volume changes via a DOM event; going through the API
// (instead of setting video.volume) keeps YouTube's slider and saved volume in sync.
(() => {
  'use strict';
  document.addEventListener('yss-volume', e => {
    const p = document.getElementById('movie_player');
    if (!p || typeof p.setVolume !== 'function') return;
    const delta = Number(e.detail) || 0;
    const start = p.isMuted() ? 0 : p.getVolume();
    const vol = Math.min(100, Math.max(0, Math.round(start + delta)));
    p.setVolume(vol);
    if (vol > 0) p.unMute(); else p.mute();
    document.dispatchEvent(new CustomEvent('yss-volume-done', { detail: vol }));
  });
})();
