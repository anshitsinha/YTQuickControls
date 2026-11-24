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

  // Current quality for content.js's quality button label
  const Q = {
    tiny: '144p', small: '240p', medium: '360p', large: '480p',
    hd720: '720p', hd1080: '1080p', hd1440: '1440p', hd2160: '2160p',
    hd2880: '2880p', highres: '4320p'
  };
  const hookedPlayers = new WeakSet();
  function reportQuality() {
    const p = document.getElementById('movie_player');
    if (!p || typeof p.getPlaybackQuality !== 'function') return;
    // Event-driven instead of polling: YouTube tells us when quality changes
    if (!hookedPlayers.has(p)) {
      hookedPlayers.add(p);
      p.addEventListener('onPlaybackQualityChange', reportQuality);
    }
    const label = Q[p.getPlaybackQuality()] || '';
    document.dispatchEvent(new CustomEvent('yss-quality', { detail: label }));
  }
  // content.js asks when its button is (re)created. Its first ask can come before
  // this script runs, so also report on startup and after each YouTube navigation.
  document.addEventListener('yss-quality-req', reportQuality);
  document.addEventListener('yt-navigate-finish', reportQuality);
  reportQuality();
})();
