(function () {
  'use strict';

  var INVITATION_URL = 'https://www.nosrezo.com/signup.php?code_invitation=KXECW41680';
  var SOURCE_URL = 'https://www.propertips.com/';

  var translations = {
    fr: {
      nav: 'Propertips',
      eyebrow: 'LE BOUCHE-À-OREILLE QUI CRÉE DES OPPORTUNITÉS',
      title: 'Votre réseau connaît sûrement quelqu’un qui a un projet immobilier.',
      intro: 'Avec propertips, vous pouvez mettre un proche qui souhaite vendre ou acheter en relation avec un conseiller iad. Si la transaction aboutit, l’apporteur peut être rémunéré.',
      step1: 'Inscription gratuite',
      step2: 'Recommandation suivie dans l’application',
      step3: 'Rémunération si la transaction aboutit, selon les conditions propertips',
      amount: '≈ 500 €*',
      amountLabel: 'rémunération moyenne inférieure constatée en 2025 pour la mise en vente de biens',
      cta: 'Créer mon compte Propertips',
      invitation: 'Lien d’invitation de Guillaume Roque',
      note: '* Source propertips : moyenne constatée pour l’année civile 2025, calculée sur les honoraires HT perçus par les partenaires, sous réserve des conditions applicables. Les sommes perçues peuvent constituer un revenu imposable.',
      source: 'Voir les informations officielles'
    },
    es: {
      nav: 'Propertips',
      eyebrow: 'EL BOCA A BOCA QUE CREA OPORTUNIDADES',
      title: 'Seguro que en tu entorno alguien tiene un proyecto inmobiliario.',
      intro: 'Con propertips puedes poner en contacto a una persona que quiere vender o comprar con un asesor iad. Si la operación se completa, quien realiza la recomendación puede recibir una remuneración.',
      step1: 'Registro gratuito',
      step2: 'Seguimiento de la recomendación en la aplicación',
      step3: 'Remuneración si la operación se completa, según las condiciones de propertips',
      amount: '≈ 500 €*',
      amountLabel: 'remuneración media inferior observada en 2025 para recomendaciones de venta',
      cta: 'Crear mi cuenta Propertips',
      invitation: 'Enlace de invitación de Guillaume Roque',
      note: '* Fuente propertips: media observada durante 2025, calculada sobre los honorarios sin impuestos percibidos por los socios, sujeta a las condiciones aplicables. Los importes percibidos pueden estar sujetos a impuestos.',
      source: 'Ver la información oficial'
    },
    en: {
      nav: 'Propertips',
      eyebrow: 'WORD OF MOUTH THAT CREATES OPPORTUNITIES',
      title: 'Someone in your network probably has a property project.',
      intro: 'With propertips, you can introduce someone who wants to sell or buy to an iad property adviser. If the transaction completes, the referrer may receive a reward.',
      step1: 'Free registration',
      step2: 'Track your referral in the app',
      step3: 'Reward if the transaction completes, subject to propertips terms',
      amount: '≈ €500*',
      amountLabel: 'lower average reward observed in 2025 for property sale referrals',
      cta: 'Create my Propertips account',
      invitation: 'Guillaume Roque invitation link',
      note: '* Source: propertips. Average observed in calendar year 2025, calculated on pre-tax fees received by partners and subject to applicable terms. Amounts received may be taxable.',
      source: 'See official information'
    },
    it: {
      nav: 'Propertips',
      eyebrow: 'IL PASSAPAROLA CHE CREA OPPORTUNITÀ',
      title: 'Nella tua rete c’è sicuramente qualcuno con un progetto immobiliare.',
      intro: 'Con propertips puoi mettere in contatto una persona che vuole vendere o acquistare con un consulente iad. Se la transazione va a buon fine, chi effettua la segnalazione può essere remunerato.',
      step1: 'Iscrizione gratuita',
      step2: 'Segnalazione monitorata nell’app',
      step3: 'Remunerazione se la transazione va a buon fine, secondo le condizioni propertips',
      amount: '≈ 500 €*',
      amountLabel: 'remunerazione media inferiore osservata nel 2025 per le segnalazioni di vendita',
      cta: 'Crea il mio account Propertips',
      invitation: 'Link di invito di Guillaume Roque',
      note: '* Fonte propertips: media osservata nell’anno 2025, calcolata sugli onorari al netto delle imposte percepiti dai partner e soggetta alle condizioni applicabili. Le somme percepite possono essere imponibili.',
      source: 'Vedi le informazioni ufficiali'
    },
    de: {
      nav: 'Propertips',
      eyebrow: 'MUNDPROPAGANDA, DIE CHANCEN SCHAFFT',
      title: 'In Ihrem Netzwerk kennt bestimmt jemand ein Immobilienprojekt.',
      intro: 'Mit propertips können Sie jemanden, der verkaufen oder kaufen möchte, mit einem iad Immobilienberater in Kontakt bringen. Kommt die Transaktion zustande, kann der Empfehlungsgeber vergütet werden.',
      step1: 'Kostenlose Registrierung',
      step2: 'Empfehlung in der App verfolgen',
      step3: 'Vergütung bei erfolgreicher Transaktion gemäß den propertips-Bedingungen',
      amount: '≈ 500 €*',
      amountLabel: 'niedriger beobachteter Durchschnitt 2025 für Verkaufsempfehlungen',
      cta: 'Mein Propertips-Konto erstellen',
      invitation: 'Einladungslink von Guillaume Roque',
      note: '* Quelle: propertips. Beobachteter Durchschnitt im Kalenderjahr 2025, berechnet auf Grundlage der von Partnern vereinnahmten Honorare ohne Steuern und vorbehaltlich der geltenden Bedingungen. Erhaltene Beträge können steuerpflichtig sein.',
      source: 'Offizielle Informationen ansehen'
    },
    pt: {
      nav: 'Propertips',
      eyebrow: 'O BOCA A BOCA QUE CRIA OPORTUNIDADES',
      title: 'Na sua rede, alguém certamente tem um projeto imobiliário.',
      intro: 'Com a propertips, pode colocar alguém que pretende vender ou comprar em contacto com um consultor iad. Se a transação for concluída, quem faz a recomendação pode ser remunerado.',
      step1: 'Registo gratuito',
      step2: 'Acompanhamento da recomendação na aplicação',
      step3: 'Remuneração se a transação for concluída, de acordo com as condições propertips',
      amount: '≈ 500 €*',
      amountLabel: 'remuneração média inferior observada em 2025 para recomendações de venda',
      cta: 'Criar a minha conta Propertips',
      invitation: 'Link de convite de Guillaume Roque',
      note: '* Fonte propertips: média observada no ano civil de 2025, calculada sobre os honorários sem impostos recebidos pelos parceiros e sujeita às condições aplicáveis. Os montantes recebidos podem ser tributáveis.',
      source: 'Ver informações oficiais'
    }
  };

  function init() {
    if (document.getElementById('propertips')) return;

    var anchor = document.getElementById('remuneration');
    if (!anchor) return;

    var lang = (document.documentElement.lang || 'fr').toLowerCase().split('-')[0];
    var t = translations[lang] || translations.fr;

    if (!document.getElementById('propertips-styles')) {
      var style = document.createElement('style');
      style.id = 'propertips-styles';
      style.textContent = [
        '.pt-section{background:#e9fcff;padding:92px 0;border-top:1px solid #d0cdc6;border-bottom:1px solid #d0cdc6}',
        '.pt-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:64px;align-items:center}',
        '.pt-section .eyebrow{color:#006390}',
        '.pt-copy h2{font-size:clamp(34px,4.5vw,58px);line-height:1.03;letter-spacing:-.04em;margin:0 0 22px;color:#111}',
        '.pt-copy>p{font-size:17px;line-height:1.75;color:#3c4a5f;max-width:720px;margin:0 0 28px}',
        '.pt-points{display:grid;gap:12px;margin:0;padding:0;list-style:none}',
        '.pt-points li{display:flex;gap:12px;align-items:flex-start;color:#26313f;font-size:14px;line-height:1.55}',
        '.pt-points li::before{content:"✓";width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:#00b4ec;color:#111;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}',
        '.pt-card{background:#3c4a5f;color:#fff;border-radius:28px;padding:38px;box-shadow:0 18px 40px rgba(60,74,95,.16)}',
        '.pt-brand{display:inline-block;font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#95ebff;margin-bottom:24px}',
        '.pt-amount{font-size:clamp(48px,6vw,72px);font-weight:800;line-height:1;letter-spacing:-.05em;margin-bottom:10px}',
        '.pt-amount-label{font-size:13px;line-height:1.55;color:rgba(255,255,255,.82);margin-bottom:28px}',
        '.pt-cta{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:54px;padding:14px 22px;border-radius:999px;background:#00b4ec;color:#111!important;text-decoration:none;font-weight:800;font-style:italic;transition:transform .2s,background .2s}',
        '.pt-cta:hover{background:#95ebff;transform:translateY(-1px)}',
        '.pt-invitation{display:block;text-align:center;font-size:11px;color:rgba(255,255,255,.68);margin-top:12px}',
        '.pt-note{font-size:11px!important;line-height:1.55!important;color:#647184!important;margin:24px 0 0!important;max-width:none!important}',
        '.pt-note a{color:#006390;font-weight:700}',
        '@media(max-width:900px){.pt-section{padding:70px 0}.pt-grid{grid-template-columns:1fr;gap:38px}.pt-card{max-width:620px}}',
        '@media(max-width:560px){.pt-section{padding:56px 0}.pt-card{padding:28px 22px;border-radius:22px}.pt-copy h2{font-size:34px}}'
      ].join('');
      document.head.appendChild(style);
    }

    var section = document.createElement('section');
    section.className = 'pt-section';
    section.id = 'propertips';
    section.setAttribute('aria-labelledby', 'propertips-title');
    section.innerHTML =
      '<div class="wrap pt-grid">' +
        '<div class="pt-copy">' +
          '<div class="eyebrow">' + t.eyebrow + '</div>' +
          '<h2 id="propertips-title">' + t.title + '</h2>' +
          '<p>' + t.intro + '</p>' +
          '<ul class="pt-points"><li>' + t.step1 + '</li><li>' + t.step2 + '</li><li>' + t.step3 + '</li></ul>' +
          '<p class="pt-note">' + t.note + ' <a href="' + SOURCE_URL + '" target="_blank" rel="noopener noreferrer">' + t.source + ' ↗</a></p>' +
        '</div>' +
        '<aside class="pt-card" aria-label="Propertips">' +
          '<span class="pt-brand">propertips · groupe iad</span>' +
          '<div class="pt-amount">' + t.amount + '</div>' +
          '<div class="pt-amount-label">' + t.amountLabel + '</div>' +
          '<a class="pt-cta" data-evt="clic-propertips" href="' + INVITATION_URL + '" target="_blank" rel="noopener noreferrer">' + t.cta + ' <span aria-hidden="true">↗</span></a>' +
          '<span class="pt-invitation">' + t.invitation + '</span>' +
        '</aside>' +
      '</div>';

    anchor.insertAdjacentElement('afterend', section);

    var nav = document.querySelector('.nav-links');
    if (nav && !nav.querySelector('a[href="#propertips"]')) {
      var link = document.createElement('a');
      link.href = '#propertips';
      link.textContent = t.nav;
      var before = nav.querySelector('a[href*="#poa"]');
      if (before) nav.insertBefore(link, before); else nav.appendChild(link);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
