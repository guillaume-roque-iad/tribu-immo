// Archive expired presentations as text, without keeping registration links.
(() => {
 const cards=[...document.querySelectorAll('[data-poa-start]')];
 const expired=cards.filter(c=>Date.parse(c.dataset.poaStart)<=Date.now());
 if(!expired.length)return;
 const section=expired[0].closest('section');if(!section)return;
 let archive=section.querySelector('[data-presentation-archive]');
 if(!archive){archive=document.createElement('details');archive.className='project-archive';archive.dataset.presentationArchive='';const title=document.createElement('summary');title.textContent=({fr:'Présentations passées',es:'Presentaciones anteriores',en:'Past presentations',de:'Vergangene Präsentationen',pt:'Apresentações anteriores',it:'Presentazioni passate',ca:'Presentacions anteriors'})[document.documentElement.lang.slice(0,2)]||'Past presentations';archive.append(title,document.createElement('ul'));section.append(archive);}
 expired.forEach(c=>{const item=document.createElement('li');item.textContent=(c.querySelector('time')||c.querySelector('h3')||c).textContent.trim();archive.querySelector('ul').append(item);c.remove();});
})();
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
        if (window.tribuEvt) { window.tribuEvt(fm.dataset.presentation ? 'presentation_demande_envoyee' : 'candidature_envoyee', { origine: 'formulaire', ...(fm.dataset.presentation ? { session: fm.elements.session.value } : {}) }); }
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

      if(!donnees.get('action')){
        donnees.set('action','lead_capture');
        donnees.set('source_site','Tribu Immo');
        donnees.set('page',location.href.split('#')[0]);
        donnees.set('referent',document.referrer);
        donnees.set('submission_id',f.dataset.submissionId||(f.dataset.submissionId=crypto.randomUUID()));
        var simFrame=document.getElementById('simulator-frame');
        if(simFrame&&simFrame.contentWindow.tribuSimulation)donnees.set('simulation',JSON.stringify(simFrame.contentWindow.tribuSimulation));
      }
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
    
// Un menu commun à toutes les pages françaises, sans dupliquer les liens ajoutés par le passé.
(() => {
 const menu=document.getElementById('main-menu');
 if(!menu || document.documentElement.lang.slice(0,2)!=='fr')return;
 if(!menu.hasAttribute('data-simplified-nav')){
  menu.innerHTML=`<a href="/decouvrir-iad">Découvrir iad</a>
<details class="nav-project"><summary>Mon projet <span aria-hidden="true">⌄</span></summary><div class="nav-project-menu">
  <a href="/parcours-reconversion.html">Me reconvertir</a>
  <a href="/parcours-mandataire.html">Changer de réseau</a>
  <a href="/parcours-equipe.html">Développer mon équipe</a>
  <a href="/parcours-international.html">Travailler à l’international</a>
</div></details>
<details class="nav-project"><summary>La Tribu Immo <span aria-hidden="true">⌄</span></summary><div class="nav-project-menu">
  <a href="/guillaume-roque">Guillaume et l’accompagnement</a>
  <a href="/#temoignages">Témoignages des conseillers</a>
  <a href="/#vie-equipe">Vie d’équipe</a>
  <a href="/#seminaires-nationaux">Séminaires</a>
</div></details>
<a href="/simulateur">Simulateur de revenus</a>
<a class="nav-propertips-link" href="/#propertips" aria-label="Découvrir propertips by iad"><img src="/propertips-logo.svg" alt="propertips by iad" width="132" height="45" decoding="async"><span>Recommander un proche</span></a>
<a href="/presentation-opportunites-affaires">Présentations iad</a>
<a class="btn small" href="/#rejoindre">Échanger avec Guillaume <span aria-hidden="true">↗</span></a>`;
  menu.setAttribute('data-simplified-nav','');
 }
 document.addEventListener('click',e=>{
  menu.querySelectorAll('.nav-project[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.querySelectorAll('.nav-project[open]').forEach(d=>d.open=false);});
 menu.querySelectorAll('.nav-project-menu a').forEach(link=>link.addEventListener('click',()=>{const d=link.closest('details');if(d)d.open=false;}));
})();

// Shared navigation for team videos and member testimonials.
(() => {
  const menu = document.getElementById('main-menu');
  if (!menu || menu.hasAttribute('data-simplified-nav')) return;
  const labels = {
    fr: ['Team building', 'Séminaires nationaux', 'Témoignages'],
    en: ['Team building', 'National seminars', 'Testimonials'],
    es: ['Team building', 'Seminarios nacionales', 'Testimonios'],
    it: ['Team building', 'Seminari nazionali', 'Testimonianze'],
    de: ['Teambuilding', 'Nationale Seminare', 'Erfahrungsberichte'],
    pt: ['Team building', 'Seminários nacionais', 'Testemunhos']
  };
  const lang = document.documentElement.lang.slice(0, 2);
  const locale = labels[lang] ? lang : 'fr';
  const base = locale === 'fr' ? '/' : '/' + locale + '/';
  const before = menu.querySelector('a[href$="#guillaume"]') || menu.querySelector('.btn');
  ['vie-equipe', 'seminaires-nationaux', 'temoignages'].forEach((id, i) => {
    if (menu.querySelector('a[href$="#' + id + '"]')) return;
    const link = document.createElement('a');
    link.href = (id === 'seminaires-nationaux' ? '/' : base) + '#' + id;
    link.textContent = labels[locale][i] + (id === 'seminaires-nationaux' && locale !== 'fr' ? ' (FR)' : '');
    menu.insertBefore(link, before);
  });
})();



// Accès au simulateur depuis toutes les pages du site.
(()=>{const menu=document.getElementById('main-menu');if(!menu||menu.hasAttribute('data-simplified-nav'))return;const existing=menu.querySelector('a[href="/simulateur"]');const a=existing||document.createElement('a');a.href='/simulateur';const lang=document.documentElement.lang.slice(0,2);a.textContent=({fr:'Simulateur de revenus',en:'Income simulator (FR)',es:'Simulador de ingresos (FR)',it:'Simulatore di reddito (FR)',de:'Einkommenssimulator (FR)',pt:'Simulador de rendimentos (FR)'})[lang]||'Simulateur de revenus';if(!existing)menu.insertBefore(a,menu.querySelector('.btn'));})();

(()=>{const h=document.querySelector(".header");if(h&&window.ResizeObserver)new ResizeObserver(()=>document.documentElement.style.setProperty("--header-height",h.getBoundingClientRect().height+"px")).observe(h);})();

// Fetch below-the-fold video posters only as the visitor approaches them.
// Native video controls and preload="none" remain available without JavaScript.
(() => {
  const videos = document.querySelectorAll('video[data-poster]');
  const reveal = video => { video.poster = video.dataset.poster; video.removeAttribute('data-poster'); };
  if (!('IntersectionObserver' in window)) { videos.forEach(reveal); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
    });
  }, {rootMargin: '400px 0px'});
  videos.forEach(video => observer.observe(video));
})();

// Recruitment planning entry point; the detailed page is currently in French.
(()=>{const menu=document.querySelector('.nav-links');if(!menu||menu.hasAttribute('data-simplified-nav')||menu.querySelector('a[href="/preparer-mon-projet"]'))return;const a=document.createElement('a');a.href='/preparer-mon-projet';a.textContent=document.documentElement.lang.startsWith('fr')?'Préparer mon projet':'Projet & budget (FR)';menu.insertBefore(a,menu.querySelector('.btn'));a.addEventListener('click',()=>{menu.classList.remove('open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');});})();

 
// Navigation unifiée : menu hamburger toujours visible, pictogrammes et fermeture accessible.
(() => {
  const menu=document.getElementById('main-menu');
  const toggle=document.querySelector('.menu-toggle');
  if(!menu || !toggle) return;
  const locale=document.documentElement.lang.slice(0,2);
  const textByLang={
    fr:['Menu','Fermer le menu'],
    en:['Menu','Close menu'],
    es:['Menú','Cerrar menú'],
    it:['Menu','Chiudi menu'],
    de:['Menü','Menü schließen'],
    pt:['Menu','Fechar menu']
  };
  const labels=textByLang[locale] || textByLang.fr;
  const glyph=document.createElement('span');
  glyph.className='menu-hamburger';
  glyph.setAttribute('aria-hidden','true');
  const caption=document.createElement('span');
  caption.className='menu-caption';
  caption.textContent=labels[0];
  toggle.replaceChildren(glyph,caption);
  function setOpen(open){
    menu.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?labels[1]:labels[0]);
    glyph.classList.toggle('is-open',open);
    caption.textContent=open?labels[1]:labels[0];
    if(!open) menu.querySelectorAll('.nav-project[open]').forEach(d=>{d.open=false});
  }
  // Pictogrammes vectoriels officiels iad, déjà présents dans /assets/iad-icons/.
  function mark(element, filename){
    if(!element || element.querySelector('.nav-iad-icon'))return;
    const img=document.createElement('img');
    img.className='nav-iad-icon';
    img.src='/assets/iad-icons/'+filename+'.svg';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.width=24;
    img.height=24;
    img.decoding='async';
    element.prepend(img);
  }
  const icons=[
    [/decouvrir-iad/, 'home'],
    [/parcours-reconversion/, 'growth'],
    [/parcours-mandataire/, 'key'],
    [/parcours-equipe/, 'team'],
    [/parcours-international/, 'globe'],
    [/simulateur/, 'growth'],
    [/presentation-opportunites-affaires|#poa/, 'document'],
    [/#temoignages|#vie-equipe/, 'team'],
    [/#seminaires-nationaux/, 'check'],
    [/\/guillaume-roque|#guillaume/, 'team'],
    [/#accompagnement/, 'check'],
    [/#remuneration/, 'growth'],
    [/preparer-mon-projet/, 'document'],
    [/#newsletter/, 'mail'],
    [/#rejoindre/, 'mail']
  ];
  menu.querySelectorAll('a').forEach(link=>{
    const href=link.getAttribute('href')||'';
    const pair=icons.find(([regex])=>regex.test(href));
    if(pair)mark(link,pair[1]);
  });
  menu.querySelectorAll('.nav-project summary').forEach((summary,i)=>mark(summary,i===0?'document':'team'));
  setOpen(false);
  toggle.addEventListener('click',()=>setOpen(!menu.classList.contains('open')));
  menu.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
  document.addEventListener('click',e=>{if(!toggle.contains(e.target)&&!menu.contains(e.target))setOpen(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
})();


/* Lien propertips avec son logo dans le menu commun des pages du site. */
(() => {
  const nav=document.getElementById('main-menu');
  if(!nav || nav.querySelector('.nav-propertips-link'))return;
  const link=document.createElement('a');
  link.className='nav-propertips-link';
  link.href='/#propertips';
  link.setAttribute('aria-label','Découvrir propertips by iad');
  const img=document.createElement('img');
  img.src='/propertips-logo.svg';
  img.alt='propertips by iad';
  img.width=132;
  img.height=45;
  img.decoding='async';
  const caption=document.createElement('span');
  const lang=(document.documentElement.lang||'fr').slice(0,2);
  caption.textContent=({
    fr:'Recommander un proche',
    en:'Refer someone',
    es:'Recomendar a alguien',
    it:'Segnala una persona',
    de:'Jemanden empfehlen',
    pt:'Recomendar alguém'
  })[lang]||'Recommander un proche';
  link.append(img,caption);
  nav.insertBefore(link,nav.querySelector('a.btn')||null);
  link.addEventListener('click',()=>{
    nav.classList.remove('open');
    const toggle=document.querySelector('.menu-toggle');
    if(toggle){
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Ouvrir le menu');
      toggle.querySelector('.menu-hamburger')?.classList.remove('is-open');
      if(toggle.querySelector('.menu-caption'))toggle.querySelector('.menu-caption').textContent='Menu';
    }
  });
})();
