var TRIBU_EXEC = 'https://script.google.com/macros/s/AKfycbz6ZtOtnaGlVn0vLQr-kBl5aIjmCr2oCBlfJFzq8EiVZVpsG4gTRREGtLxAWQFbn8360Q/exec';

    function tribuAfficherSucces() {
      var fs = document.getElementById('fs'), fm = document.getElementById('fm');
      if (fs && fm) { fs.style.display = 'block'; fm.style.display = 'none'; }
      /* Marqueur de conversion : cree une page vue distincte dans Cloudflare
         Web Analytics, sans cookie ni identifiant. */
      try {
        if (window.history && history.pushState &&
            location.pathname.indexOf('/candidature-envoyee') === -1) {
          document.getElementById('fs').focus();
        if (window.tribuEvt) { window.tribuEvt('candidature_envoyee', { origine: 'formulaire' }); }
        }
      } catch (e) {}
    }

    function tribuErreur(btn, donnees) {
      btn.disabled = false;
      btn.textContent = (window.TribuUI||{}).submit||'Être recontacté par Guillaume ↗';
      var err = document.getElementById('f-erreur');
      if (!err) { return; }
      var corps = encodeURIComponent(
        'Nom : ' + (donnees.get('nom') || '') + '\n' +
        'E-mail : ' + (donnees.get('email') || '') + '\n' +
        'Telephone : ' + (donnees.get('telephone') || '') + '\n' +
        'Ville : ' + (donnees.get('ville') || '') + '\n' +
        'Situation : ' + (donnees.get('situation') || '') + '\n' +
        'Disponibilite : ' + (donnees.get('disponibilite') || '') + '\n\n' +
        (donnees.get('message') || ''));
      err.querySelector('a').href =
        'mailto:guillaume.roque@iadfrance.fr?subject=' +
        encodeURIComponent('Candidature La Tribu Immo') + '&body=' + corps;
      err.style.display = 'block';
    }

    /* Origine de la demande, rattachee au message pour etre visible
       dans la feuille de reponses comme dans l'e-mail. */
    function tribuOrigine() {
      var s = null;
      try { s = window.sessionStorage; } catch (e) {}
      var d = new Date();
      var deuxChiffres = function (n) { return (n < 10 ? '0' : '') + n; };
      return '\n\n--- Origine de la demande ---'
        + '\nDate : ' + deuxChiffres(d.getDate()) + '/' + deuxChiffres(d.getMonth() + 1)
          + '/' + d.getFullYear() + ' ' + deuxChiffres(d.getHours()) + ':' + deuxChiffres(d.getMinutes())
        + '\nLangue : ' + document.documentElement.lang + '\nPage du formulaire : ' + location.pathname
        + '\nPage d\'entree : ' + ((s && s.getItem('tribu_entree')) || location.pathname)
        + '\nReferent : ' + ((s && s.getItem('tribu_referent')) || '(inconnu)')
        + '\nUTM : ' + ((s && s.getItem('tribu_utm')) || '(aucun)');
    }

    function envoyerFormulaire(e) {
      e.preventDefault();
      var f = document.getElementById('fm');
      var btn = f.querySelector('.fsub');
      var err = document.getElementById('f-erreur');
      if (err) { err.style.display = 'none'; }

      var donnees = new FormData(f);
      /* Piege a robots : un humain ne remplit jamais ce champ masque. */
      if (donnees.get('societe')) { tribuAfficherSucces(); return; }
      donnees.set('message', (donnees.get('message') || '') + tribuOrigine());

      btn.disabled = true;
      btn.textContent = (window.TribuUI||{}).sending||'Envoi en cours\u2026';
      var patience = setTimeout(function () {
        btn.textContent = (window.TribuUI||{}).patience||'Envoi en cours\u2026 encore quelques secondes';
      }, 3500);

      /* Envoi POST : les coordonnees ne transitent jamais dans l'URL.
         Le succes n'est affiche qu'apres confirmation explicite du serveur. */
      fetch(TRIBU_EXEC, { method: 'POST', body: donnees, signal: AbortSignal.timeout(25000) })
        .then(function (r) {
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.text();
        })
        .then(function (t) {
          clearTimeout(patience);
          if (!t || JSON.parse(t).ok !== true) {
            throw new Error('reponse serveur non confirmee');
          }
          tribuAfficherSucces();
        })
        .catch(function () {
          clearTimeout(patience);
          tribuErreur(btn, donnees);
        });
    }
    
document.querySelectorAll('.menu-toggle').forEach(b=>b.addEventListener('click',()=>{const m=document.getElementById('main-menu');const open=m.classList.toggle('open');b.setAttribute('aria-expanded',String(open));b.setAttribute('aria-label',open?((window.TribuUI||{}).menuClose||'Fermer le menu'):((window.TribuUI||{}).menuOpen||'Ouvrir le menu'));}));document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{document.getElementById('main-menu').classList.remove('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('main-menu')?.classList.remove('open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');}});
