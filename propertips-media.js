(function () {
  'use strict';

  var VIDEO_ID = 'd-kWucxZf6I';
  var labels = {
    fr: { video: 'Voir la vidéo de présentation', play: 'Lire la vidéo de présentation', close: 'Fermer la vidéo' },
    es: { video: 'Ver el vídeo de presentación', play: 'Ver el vídeo de presentación', close: 'Cerrar el vídeo' },
    en: { video: 'Watch the presentation video', play: 'Play the presentation video', close: 'Close video' },
    it: { video: 'Guarda il video di presentazione', play: 'Guarda il video di presentazione', close: 'Chiudi il video' },
    de: { video: 'Präsentationsvideo ansehen', play: 'Präsentationsvideo abspielen', close: 'Video schließen' },
    pt: { video: 'Ver o vídeo de apresentação', play: 'Ver o vídeo de apresentação', close: 'Fechar vídeo' }
  };

  function text() {
    var lang = (document.documentElement.lang || 'fr').toLowerCase().split('-')[0];
    return labels[lang] || labels.fr;
  }

  function addStyles() {
    if (document.getElementById('propertips-media-styles')) return;
    var style = document.createElement('style');
    style.id = 'propertips-media-styles';
    style.textContent = [
      '.propertips-logo-wrap{background:#fff;border-radius:16px;padding:12px 18px;margin:0 0 24px;display:flex;align-items:center;justify-content:center;min-height:78px;border:1px solid rgba(255,255,255,.18)}',
      '.propertips-logo-wrap img{display:block;width:min(210px,100%);height:auto}',
      '.propertips-video-trigger{width:100%;min-height:48px;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:11px 18px;margin:12px 0 0;cursor:pointer;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:inherit;font-size:12.5px;font-weight:750;transition:background .2s,border-color .2s,transform .2s}',
      '.propertips-video-trigger:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.42);transform:translateY(-1px)}',
      '.propertips-video-trigger:focus-visible{outline:3px solid #95ebff;outline-offset:3px}',
      '.propertips-play{width:28px;height:28px;border-radius:50%;background:#ea584a;display:grid;place-items:center;flex:0 0 28px}',
      '.propertips-play::before{content:"";display:block;margin-left:2px;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:8px solid #fff}',
      '.propertips-video-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,20,30,.88);backdrop-filter:blur(5px)}',
      '.propertips-video-dialog{position:relative;width:min(390px,92vw);max-height:92vh;display:flex;align-items:center;justify-content:center}',
      '.propertips-video-frame{width:min(390px,88vw);height:min(82vh,693px);aspect-ratio:9/16;border:0;border-radius:20px;background:#000;box-shadow:0 24px 80px rgba(0,0,0,.5)}',
      '.propertips-video-close{position:absolute;right:-10px;top:-14px;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#111;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 6px 22px rgba(0,0,0,.3)}',
      '.propertips-video-close:focus-visible{outline:3px solid #00b4ec;outline-offset:3px}',
      'body.propertips-video-open{overflow:hidden}',
      '@media(max-width:560px){.propertips-logo-wrap{min-height:70px;padding:10px 14px;margin-bottom:20px}.propertips-logo-wrap img{width:min(190px,100%)}.propertips-video-trigger{min-height:46px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function trackVideo() {
    if (typeof window.tribuEvt === 'function') {
      window.tribuEvt('clic_video_propertips', { page: location.pathname });
    } else if (typeof window.trackEvent === 'function') {
      window.trackEvent('click_propertips_video', { emplacement: 'bloc_propertips' });
    }
  }

  function openVideo() {
    if (document.querySelector('.propertips-video-modal')) return;
    var t = text();
    trackVideo();

    var modal = document.createElement('div');
    modal.className = 'propertips-video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', t.video);
    modal.innerHTML =
      '<div class="propertips-video-dialog">' +
        '<iframe class="propertips-video-frame" src="https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?autoplay=1&rel=0&modestbranding=1" title="' + t.video + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' +
        '<button type="button" class="propertips-video-close" aria-label="' + t.close + '">×</button>' +
      '</div>';

    function close() {
      document.body.classList.remove('propertips-video-open');
      modal.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.querySelector('.propertips-video-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('propertips-video-open');
    document.body.appendChild(modal);
    modal.querySelector('.propertips-video-close').focus();
  }

  function enhance() {
    var section = document.getElementById('propertips');
    if (!section || section.getAttribute('data-media-enhanced') === '1') return !!section;

    var card = section.querySelector('.pt-card, .propertips-card');
    if (!card) return false;
    addStyles();

    var brand = card.querySelector('.pt-brand, .propertips-brand');
    var logoWrap = document.createElement('div');
    logoWrap.className = 'propertips-logo-wrap';
    logoWrap.innerHTML = '<img src="/propertips-logo.svg?v=20260916b" alt="propertips by iad" width="333" height="114" loading="lazy" decoding="async">';
    if (brand) brand.replaceWith(logoWrap); else card.prepend(logoWrap);

    var t = text();
    var video = document.createElement('button');
    video.type = 'button';
    video.className = 'propertips-video-trigger';
    video.setAttribute('aria-label', t.play);
    video.innerHTML = '<span class="propertips-play" aria-hidden="true"></span><span>' + t.video + '</span>';

    var cta = card.querySelector('.pt-cta, .propertips-cta');
    if (cta) cta.insertAdjacentElement('afterend', video); else card.appendChild(video);
    video.addEventListener('click', openVideo);

    section.setAttribute('data-media-enhanced', '1');
    return true;
  }

  function init() {
    if (enhance()) return;
    var observer = new MutationObserver(function () {
      if (enhance()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
