(function () {
  'use strict';

  var INVITATION_URL = 'https://www.nosrezo.com/signup.php?code_invitation=KXECW41680';
  var SOURCE_URL = 'https://www.propertips.com/';

  var translations = {
    fr: {
      nav: 'Propertips',
      eyebrow: 'LE BOUCHE-À-OREILLE QUI CRÉE DES OPPORTUNITÉS',
      title: 'Votre réseau connaît sûrement quelqu’un qui a un projet immobilier.',
      intro: 'Avec propertips, vous pouvez mettre un proche qui souhaite vendre ou acheter en relation avec un conseiller iad. Si la transaction aboutit, votre recommandation peut être rémunérée.',
      step1: 'Inscription gratuite',
      step2: 'Recommandation suivie dans l’application',
      step3: 'Si la transaction aboutit, je vous reverse 6 % de ma commission d’agence via propertips',
      reward: '6 %',
      rewardLabel: 'de ma commission d’agence pour vous',
      rewardText: 'Si votre recommandation aboutit à une transaction conclue via propertips, je vous reverse 6 % de ma commission d’agence.',
      cta: 'Créer mon compte Propertips',
      invitation: 'Lien d’invitation de Guillaume Roque',
      note: 'Rémunération sous réserve de l’aboutissement de la transaction et des conditions applicables de propertips. Les sommes perçues peuvent constituer un revenu imposable.',
      source: 'Voir les informations officielles'
    },
    es: {
      nav: 'Propertips',
      eyebrow: 'EL BOCA A BOCA QUE CREA OPORTUNIDADES',
      title: 'Seguro que en tu entorno alguien tiene un proyecto inmobiliario.',
      intro: 'Con propertips puedes poner en contacto a una persona que quiere vender o comprar con un asesor iad. Si la operación se completa, tu recomendación puede ser remunerada.',
      step1: 'Registro gratuito',
      step2: 'Seguimiento de la recomendación en la aplicación',
      step3: 'Si la operación se completa, te abono el 6 % de mi comisión de agencia a través de propertips',
      reward: '6 %',
      rewardLabel: 'de mi comisión de agencia para ti',
      rewardText: 'Si tu recomendación da lugar a una operación concluida a través de propertips, te abono el 6 % de mi comisión de agencia.',
      cta: 'Crear mi cuenta Propertips',
      invitation: 'Enlace de invitación de Guillaume Roque',
      note: 'Remuneración sujeta a la finalización de la operación y a las condiciones aplicables de propertips. Las cantidades percibidas pueden estar sujetas a impuestos.',
      source: 'Ver la información oficial'
    },
    en: {
      nav: 'Propertips',
      eyebrow: 'WORD OF MOUTH THAT CREATES OPPORTUNITIES',
      title: 'Someone in your network probably has a property project.',
      intro: 'With propertips, you can introduce someone who wants to sell or buy to an iad property adviser. If the transaction completes, your referral may be rewarded.',
      step1: 'Free registration',
      step2: 'Track your referral in the app',
      step3: 'If the transaction completes, I give you 6% of my agency commission through propertips',
      reward: '6%',
      rewardLabel: 'of my agency commission for you',
      rewardText: 'If your referral results in a completed transaction through propertips, I give you 6% of my agency commission.',
      cta: 'Create my Propertips account',
      invitation: 'Guillaume Roque invitation link',
      note: 'Reward subject to completion of the transaction and the applicable propertips terms. Amounts received may be taxable.',
      source: 'See official information'
    },
    it: {
      nav: 'Propertips',
      eyebrow: 'IL PASSAPAROLA CHE CREA OPPORTUNITÀ',
      title: 'Nella tua rete c’è sicuramente qualcuno con un progetto immobiliare.',
      intro: 'Con propertips puoi mettere in contatto una persona che vuole vendere o acquistare con un consulente iad. Se la transazione va a buon fine, la tua segnalazione può essere remunerata.',
      step1: 'Iscrizione gratuita',
      step2: 'Segnalazione monitorata nell’app',
      step3: 'Se la transazione va a buon fine, ti riconosco il 6% della mia commissione d’agenzia tramite propertips',
      reward: '6%',
      rewardLabel: 'della mia commissione d’agenzia per te',
      rewardText: 'Se la tua segnalazione porta a una transazione conclusa tramite propertips, ti riconosco il 6% della mia commissione d’agenzia.',
      cta: 'Crea il mio account Propertips',
      invitation: 'Link di invito di Guillaume Roque',
      note: 'Remunerazione soggetta al completamento della transazione e alle condizioni applicabili di propertips. Le somme percepite possono essere imponibili.',
      source: 'Vedi le informazioni ufficiali'
    },
    de: {
      nav: 'Propertips',
      eyebrow: 'MUNDPROPAGANDA, DIE CHANCEN SCHAFFT',
      title: 'In Ihrem Netzwerk kennt bestimmt jemand ein Immobilienprojekt.',
      intro: 'Mit propertips können Sie jemanden, der verkaufen oder kaufen möchte, mit einem iad Immobilienberater in Kontakt bringen. Kommt die Transaktion zustande, kann Ihre Empfehlung vergütet werden.',
      step1: 'Kostenlose Registrierung',
      step2: 'Empfehlung in der App verfolgen',
      step3: 'Kommt die Transaktion zustande, erhalten Sie über propertips 6 % meiner Maklerprovision',
      reward: '6 %',
      rewardLabel: 'meiner Maklerprovision für Sie',
      rewardText: 'Führt Ihre Empfehlung über propertips zu einer abgeschlossenen Transaktion, erhalten Sie 6 % meiner Maklerprovision.',
      cta: 'Mein Propertips-Konto erstellen',
      invitation: 'Einladungslink von Guillaume Roque',
      note: 'Vergütung vorbehaltlich des Abschlusses der Transaktion und der geltenden propertips-Bedingungen. Erhaltene Beträge können steuerpflichtig sein.',
      source: 'Offizielle Informationen ansehen'
    },
    pt: {
      nav: 'Propertips',
      eyebrow: 'O BOCA A BOCA QUE CRIA OPORTUNIDADES',
      title: 'Na sua rede, alguém certamente tem um projeto imobiliário.',
      intro: 'Com a propertips, pode colocar alguém que pretende vender ou comprar em contacto com um consultor iad. Se a transação for concluída, a sua recomendação pode ser remunerada.',
      step1: 'Registo gratuito',
      step2: 'Acompanhamento da recomendação na aplicação',
      step3: 'Se a transação for concluída, atribuo-lhe 6% da minha comissão de agência através da propertips',
      reward: '6%',
      rewardLabel: 'da minha comissão de agência para si',
      rewardText: 'Se a sua recomendação resultar numa transação concluída através da propertips, atribuo-lhe 6% da minha comissão de agência.',
      cta: 'Criar a minha conta Propertips',
      invitation: 'Link de convite de Guillaume Roque',
      note: 'Remuneração sujeita à conclusão da transação e às condições aplicáveis da propertips. Os montantes recebidos podem ser tributáveis.',
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
        '.pt-reward{font-size:clamp(56px,7vw,82px);font-weight:800;line-height:.95;letter-spacing:-.05em;margin-bottom:8px;color:#fff}',
        '.pt-reward-label{font-size:17px;line-height:1.35;font-weight:800;color:#95ebff;margin-bottom:14px}',
        '.pt-reward-text{font-size:13px;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:28px}',
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
          '<div class="pt-reward">' + t.reward + '</div>' +
          '<div class="pt-reward-label">' + t.rewardLabel + '</div>' +
          '<div class="pt-reward-text">' + t.rewardText + '</div>' +
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
