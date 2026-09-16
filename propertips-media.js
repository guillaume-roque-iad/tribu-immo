(function () {
  'use strict';

  var VIDEO_ID = 'd-kWucxZf6I';
  var labels = {
    fr: { video: 'Découvrir l’application en vidéo', play: 'Lire la vidéo de présentation', close: 'Fermer la vidéo', commissionTitle: '6 % de ma commission d’agence pour vous', commissionText: 'Si votre recommandation aboutit à une transaction conclue via Propertips, je vous reverse 6 % de ma commission d’agence.' },
    es: { video: 'Descubrir la aplicación en vídeo', play: 'Ver el vídeo de presentación', close: 'Cerrar el vídeo', commissionTitle: '6 % de mi comisión de agencia para ti', commissionText: 'Si tu recomendación da lugar a una operación concluida a través de Propertips, te abono el 6 % de mi comisión de agencia.' },
    en: { video: 'Discover the app in a video', play: 'Play the presentation video', close: 'Close video', commissionTitle: '6% of my agency commission for you', commissionText: 'If your referral results in a completed transaction through Propertips, I pay you 6% of my agency commission.' },
    it: { video: 'Scopri l’app in video', play: 'Guarda il video di presentazione', close: 'Chiudi il video', commissionTitle: 'Il 6% della mia commissione di agenzia per te', commissionText: 'Se la tua segnalazione porta a una transazione conclusa tramite Propertips, ti riconosco il 6% della mia commissione di agenzia.' },
    de: { video: 'Die App im Video entdecken', play: 'Präsentationsvideo abspielen', close: 'Video schließen', commissionTitle: '6 % meiner Maklerprovision für Sie', commissionText: 'Wenn Ihre Empfehlung über Propertips zu einer abgeschlossenen Transaktion führt, zahle ich Ihnen 6 % meiner Maklerprovision.' },
    pt: { video: 'Descobrir a aplicação em vídeo', play: 'Ver o vídeo de apresentação', close: 'Fechar vídeo', commissionTitle: '6% da minha comissão de agência para si', commissionText: 'Se a sua recomendação resultar numa transação concluída através da Propertips, pago-lhe 6% da minha comissão de agência.' }
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
      '.propertips-logo-wrap{background:#fff;border-radius:18px;padding:13px 20px;margin:0 0 18px;display:flex;align-items:center;justify-content:center;min-height:86px}',
      '.propertips-logo-wrap img{display:block;width:min(230px,100%);height:auto}',
      '.propertips-video-trigger{width:100%;border:0;border-radius:18px;overflow:hidden;padding:0;margin:0 0 18px;cursor:pointer;background:linear-gradient(135deg,#006f98,#004f72);color:#fff;position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);font:inherit}',
      '.propertips-video-trigger:hover .propertips-play{transform:scale(1.07)}',
      '.propertips-video-trigger:focus-visible{outline:3px solid #95ebff;outline-offset:3px}',
      '.propertips-video-poster{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center}',
      '.propertips-video-poster img{width:132px;max-width:48%;height:auto;filter:brightness(0) invert(1);opacity:.96}',
      '.propertips-play{width:62px;height:62px;border-radius:50%;background:#ea584a;display:grid;place-items:center;transition:transform .2s;box-shadow:0 10px 26px rgba(0,0,0,.22)}',
      '.propertips-play::before{content:"";display:block;margin-left:4px;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:17px solid #fff}',
      '.propertips-video-label{font-size:13px;font-weight:800;line-height:1.35;color:#fff}',
      '.propertips-commission{margin:0 0 24px;padding:18px 20px;border-radius:18px;background:rgba(234,88,74,.14);border:1px solid rgba(234,88,74,.45);text-align:center}',
      '.propertips-commission strong{display:block;color:#fff;font-size:18px;line-height:1.25;margin-bottom:7px}',
      '.propertips-commission span{display:block;color:rgba(255,255,255,.84);font-size:12px;line-height:1.55}',
      '.propertips-video-modal{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,20,30,.88);backdrop-filter:blur(5px)}',
      '.propertips-video-dialog{position:relative;width:min(390px,92vw);max-height:92vh;display:flex;align-items:center;justify-content:center}',
      '.propertips-video-frame{width:min(390px,88vw);height:min(82vh,693px);aspect-ratio:9/16;border:0;border-radius:20px;background:#000;box-shadow:0 24px 80px rgba(0,0,0,.5)}',
      '.propertips-video-close{position:absolute;right:-10px;top:-14px;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#111;font-size:25px;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 6px 22px rgba(0,0,0,.3)}',
      '.propertips-video-close:focus-visible{outline:3px solid #00b4ec;outline-offset:3px}',
      'body.propertips-video-open{overflow:hidden}',
      '@media(max-width:560px){.propertips-logo-wrap{min-height:76px;padding:11px 16px}.propertips-logo-wrap img{width:min(205px,100%)}.propertips-video-trigger{border-radius:15px}.propertips-video-frame{height:min(80vh,640px)}.propertips-commission{border-radius:15px;padding:16px}.propertips-commission strong{font-size:16px}}'
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
    video.innerHTML =
      '<span class="propertips-video-poster">' +
        '<span class="propertips-play" aria-hidden="true"></span>' +
        '<span class="propertips-video-label">' + t.video + '</span>' +
      '</span>';
    logoWrap.insertAdjacentElement('afterend', video);
    video.addEventListener('click', openVideo);

    var commission = document.createElement('div');
    commission.className = 'propertips-commission';
    commission.innerHTML = '<strong>' + t.commissionTitle + '</strong><span>' + t.commissionText + '</span>';
    video.insertAdjacentElement('afterend', commission);

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
