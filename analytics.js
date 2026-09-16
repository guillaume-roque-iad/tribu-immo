
(function () {
  var ID = 'G-84HH2T5FZV', CLE = 'tribu_consentement_mesure';
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Refus par défaut, y compris pour les usages publicitaires (Consent Mode v2). */
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted',
    security_storage: 'granted', wait_for_update: 500
  });

  var charge = false;
  function chargerMesure() {
    if (charge) { return; }
    charge = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ID, { anonymize_ip: true, send_page_view: true });
  }

  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

  var bandeau = document.getElementById('bandeau-cookies');
  function masquer() { if (bandeau) { bandeau.style.display = 'none'; } }

  function accepter() {
    ecrire('accepte');
    gtag('consent', 'update', { analytics_storage: 'granted' });
    chargerMesure();
    masquer();
  }
  function refuser() { ecrire('refuse'); masquer(); }

  window.tribuRetirerConsentement = function () {
    ecrire('refuse');
    try { document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n.indexOf('_ga') === 0) {
        document.cookie = n + '=; Max-Age=0; path=/';
        document.cookie = n + '=; Max-Age=0; path=/; domain=.' + location.hostname;
      }
    }); } catch (e) {}
    alert('Votre consentement a été retiré. La mesure Google Analytics est désactivée sur ce site.');
    location.reload();
  };

  var choix = lire();
  if (choix === 'accepte') { gtag('consent', 'update', { analytics_storage: 'granted' }); chargerMesure(); masquer(); }
  else if (choix === 'refuse') { masquer(); }

  var a = document.getElementById('bc-accepter'), r = document.getElementById('bc-refuser');
  if (a) { a.addEventListener('click', accepter); }
  if (r) { r.addEventListener('click', refuser); }

  /* ---- Événements de conversion ----
     tribuEvt empile dans dataLayer : si la mesure est refusée, rien n'est transmis. */
  window.tribuEvt = function (nom, params) { if (lire() !== 'accepte') { return; } gtag('event', nom, params || {}); };

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-evt]') : null;
    if (!el) { return; }
    var m = { 'presentation-date': 'presentation_date_selectionnee', 'clic-telephone': 'clic_telephone', 'clic-email': 'clic_email',
              'clic-profil-iad': 'clic_profil_iad',
              'clic-sortant-iad-estimation': 'clic_sortant_iad_estimation',
              'clic-sortant-immobiliernarbonne-estimation': 'clic_sortant_immobiliernarbonne_estimation',
              'clic-estimation': 'clic_estimation',
              'clic-propertips': 'clic_propertips' };
    var nom = m[el.getAttribute('data-evt')];
    if (nom) { window.tribuEvt(nom, { page: location.pathname }); }
  }, true);

  /* Ouverture du formulaire de candidature (recrutement) : premier champ activé.
     Le formulaire d'estimation vendeur a été retiré de ce site — il vit sur immobiliernarbonne.com. */
  (function () {
    var f = document.getElementById('fm');
    if (!f) { return; }
    var vu = false;
    f.addEventListener('focusin', function () {
      if (vu) { return; }
      vu = true;
      window.tribuEvt('formulaire_recrutement_ouvert', { page: location.pathname });
    });
  })();

  /* Téléchargement d'un guide : bouton d'impression PDF. */
  var imp = document.querySelector('.btn-print button');
  if (imp) { imp.addEventListener('click', function () {
    window.tribuEvt('guide_telecharge', { page: location.pathname }); }); }

  /* Modules Propertips : contenu puis enrichissement logo + vidéo. */
  (function () {
    var s = document.createElement('script');
    s.src = '/propertips.js?v=20260916';
    s.defer = true;
    document.head.appendChild(s);

    var m = document.createElement('script');
    m.src = '/propertips-media.js?v=20260916g';
    m.defer = true;
    document.head.appendChild(m);
  })();

})();

