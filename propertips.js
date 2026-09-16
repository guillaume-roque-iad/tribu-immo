(function () {
  'use strict';

  var INVITATION_URL = 'https://www.nosrezo.com/signup.php?code_invitation=KXECW41680';
  var SOURCE_URL = 'https://www.propertips.com/';

  var translations = {
    fr: {
      nav: 'Propertips', eyebrow: 'RECOMMANDATION IMMOBILIÈRE',
      title: 'Recommandez un proche et soyez rémunéré.',
      intro: 'Avec propertips, vous pouvez recommander un proche qui souhaite vendre ou acheter. Si la transaction aboutit, je vous reverse 6 % de ma commission d’agence.',
      step1: 'Inscription gratuite', step2: 'Vous recommandez un proche', step3: 'Vous suivez l’avancement',
      reward: '6 %', rewardLabel: 'de ma commission d’agence', rewardSub: 'pour vous',
      rewardText: 'Via propertips, si votre recommandation aboutit à une transaction.',
      cta: 'S’inscrire gratuitement', invitation: 'Invitation Guillaume Roque',
      note: 'Rémunération sous réserve de l’aboutissement de la transaction et des conditions applicables de propertips. Les sommes perçues peuvent constituer un revenu imposable.',
      source: 'Informations officielles'
    },
    es: {
      nav: 'Propertips', eyebrow: 'RECOMENDACIÓN INMOBILIARIA',
      title: 'Recomienda a alguien y recibe una remuneración.',
      intro: 'Con propertips puedes recomendar a una persona que quiera vender o comprar. Si la operación se completa, te abono el 6 % de mi comisión de agencia.',
      step1: 'Registro gratuito', step2: 'Recomienda a alguien', step3: 'Sigue el progreso',
      reward: '6 %', rewardLabel: 'de mi comisión de agencia', rewardSub: 'para ti',
      rewardText: 'A través de propertips, si tu recomendación finaliza en una operación.',
      cta: 'Registrarme gratis', invitation: 'Invitación Guillaume Roque',
      note: 'Remuneración sujeta a la finalización de la operación y a las condiciones aplicables de propertips. Las cantidades percibidas pueden estar sujetas a impuestos.',
      source: 'Información oficial'
    },
    en: {
      nav: 'Propertips', eyebrow: 'PROPERTY REFERRALS',
      title: 'Refer someone and get rewarded.',
      intro: 'With propertips, you can refer someone who wants to sell or buy. If the transaction completes, I give you 6% of my agency commission.',
      step1: 'Free registration', step2: 'Refer someone you know', step3: 'Track the progress',
      reward: '6%', rewardLabel: 'of my agency commission', rewardSub: 'for you',
      rewardText: 'Through propertips, if your referral leads to a completed transaction.',
      cta: 'Register for free', invitation: 'Guillaume Roque invitation',
      note: 'Reward subject to completion of the transaction and the applicable propertips terms. Amounts received may be taxable.',
      source: 'Official information'
    },
    it: {
      nav: 'Propertips', eyebrow: 'SEGNALAZIONE IMMOBILIARE',
      title: 'Segnala una persona e ricevi una remunerazione.',
      intro: 'Con propertips puoi segnalare una persona che desidera vendere o acquistare. Se la transazione va a buon fine, ti riconosco il 6% della mia commissione d’agenzia.',
      step1: 'Iscrizione gratuita', step2: 'Segnala una persona', step3: 'Segui l’avanzamento',
      reward: '6%', rewardLabel: 'della mia commissione d’agenzia', rewardSub: 'per te',
      rewardText: 'Tramite propertips, se la tua segnalazione porta a una transazione conclusa.',
      cta: 'Iscriviti gratuitamente', invitation: 'Invito Guillaume Roque',
      note: 'Remunerazione soggetta al completamento della transazione e alle condizioni applicabili di propertips. Le somme percepite possono essere imponibili.',
      source: 'Informazioni ufficiali'
    },
    de: {
      nav: 'Propertips', eyebrow: 'IMMOBILIENEMPFEHLUNG',
      title: 'Empfehlen Sie jemanden und erhalten Sie eine Vergütung.',
      intro: 'Mit propertips können Sie jemanden empfehlen, der verkaufen oder kaufen möchte. Kommt die Transaktion zustande, erhalten Sie 6 % meiner Maklerprovision.',
      step1: 'Kostenlose Anmeldung', step2: 'Jemanden empfehlen', step3: 'Fortschritt verfolgen',
      reward: '6 %', rewardLabel: 'meiner Maklerprovision', rewardSub: 'für Sie',
      rewardText: 'Über propertips, wenn Ihre Empfehlung zu einer abgeschlossenen Transaktion führt.',
      cta: 'Kostenlos registrieren', invitation: 'Einladung Guillaume Roque',
      note: 'Vergütung vorbehaltlich des Abschlusses der Transaktion und der geltenden propertips-Bedingungen. Erhaltene Beträge können steuerpflichtig sein.',
      source: 'Offizielle Informationen'
    },
    pt: {
      nav: 'Propertips', eyebrow: 'RECOMENDAÇÃO IMOBILIÁRIA',
      title: 'Recomende alguém e seja remunerado.',
      intro: 'Com a propertips, pode recomendar alguém que queira vender ou comprar. Se a transação for concluída, atribuo-lhe 6% da minha comissão de agência.',
      step1: 'Registo gratuito', step2: 'Recomende alguém', step3: 'Acompanhe o progresso',
      reward: '6%', rewardLabel: 'da minha comissão de agência', rewardSub: 'para si',
      rewardText: 'Através da propertips, se a sua recomendação resultar numa transação concluída.',
      cta: 'Registar gratuitamente', invitation: 'Convite Guillaume Roque',
      note: 'Remuneração sujeita à conclusão da transação e às condições aplicáveis da propertips. Os montantes recebidos podem ser tributáveis.',
      source: 'Informações oficiais'
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
        '.pt-section{padding:92px 0;background:linear-gradient(180deg,#f8fdff 0%,#eaf8fd 100%);border-top:1px solid rgba(0,180,236,.12);border-bottom:1px solid rgba(0,180,236,.12)}',
        '.pt-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);gap:54px;align-items:center}',
        '.pt-section .eyebrow{color:#006390;margin-bottom:14px}',
        '.pt-copy h2{font-size:clamp(34px,4.4vw,56px);line-height:1.04;letter-spacing:-.04em;margin:0 0 20px;color:#111;max-width:760px}',
        '.pt-intro{font-size:17px;line-height:1.72;color:#435365;max-width:720px;margin:0 0 30px}',
        '.pt-intro strong{color:#111}',
        '.pt-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0;padding:0;list-style:none}',
        '.pt-step{background:#fff;border:1px solid rgba(60,74,95,.10);border-radius:18px;padding:18px;box-shadow:0 8px 24px rgba(34,52,68,.045);min-height:118px}',
        '.pt-step-num{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#00b4ec;color:#111;font-size:12px;font-weight:900;margin-bottom:13px}',
        '.pt-step strong{display:block;font-size:13.5px;line-height:1.4;color:#26313f}',
        '.pt-card{background:#314154;color:#fff;border-radius:28px;padding:32px;box-shadow:0 20px 48px rgba(38,54,69,.18)}',
        '.pt-brand{display:block;color:#95ebff;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}',
        '.pt-reward{text-align:center;padding:6px 0 18px}',
        '.pt-reward-number{font-size:clamp(60px,7vw,84px);font-weight:850;line-height:.92;letter-spacing:-.06em;color:#00b4ec}',
        '.pt-reward-label{font-size:17px;font-weight:750;line-height:1.35;color:#fff;margin-top:10px}',
        '.pt-reward-sub{font-size:20px;font-weight:850;color:#95ebff;margin-top:2px}',
        '.pt-reward-text{font-size:12.5px;line-height:1.55;color:rgba(255,255,255,.72);text-align:center;margin:0 0 24px}',
        '.pt-cta{display:flex;align-items:center;justify-content:center;width:100%;min-height:54px;padding:14px 20px;border-radius:999px;background:#00b4ec;color:#111!important;text-decoration:none;font-weight:850;font-style:italic;transition:transform .2s,background .2s}',
        '.pt-cta:hover{background:#95ebff;transform:translateY(-1px)}',
        '.pt-invitation{display:block;text-align:center;font-size:10.5px;color:rgba(255,255,255,.55);margin-top:11px}',
        '.pt-note{font-size:10.5px!important;line-height:1.55!important;color:#738090!important;margin:22px 0 0!important;max-width:720px!important}',
        '.pt-note a{color:#006390;font-weight:750}',
        '@media(max-width:900px){.pt-section{padding:70px 0}.pt-grid{grid-template-columns:1fr;gap:34px}.pt-card{max-width:620px}.pt-steps{grid-template-columns:1fr}.pt-step{min-height:0;display:flex;align-items:center;gap:14px}.pt-step-num{margin-bottom:0;flex:0 0 32px}}',
        '@media(max-width:560px){.pt-section{padding:56px 0}.pt-card{padding:24px 20px;border-radius:22px}.pt-copy h2{font-size:32px}.pt-intro{font-size:15.5px}.pt-reward-number{font-size:68px}}'
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
          '<p class="pt-intro">' + t.intro + '</p>' +
          '<ol class="pt-steps">' +
            '<li class="pt-step"><span class="pt-step-num">1</span><strong>' + t.step1 + '</strong></li>' +
            '<li class="pt-step"><span class="pt-step-num">2</span><strong>' + t.step2 + '</strong></li>' +
            '<li class="pt-step"><span class="pt-step-num">3</span><strong>' + t.step3 + '</strong></li>' +
          '</ol>' +
          '<p class="pt-note">' + t.note + ' <a href="' + SOURCE_URL + '" target="_blank" rel="noopener noreferrer">' + t.source + ' ↗</a></p>' +
        '</div>' +
        '<aside class="pt-card" aria-label="Propertips">' +
          '<span class="pt-brand">propertips · groupe iad</span>' +
          '<div class="pt-reward">' +
            '<div class="pt-reward-number">' + t.reward + '</div>' +
            '<div class="pt-reward-label">' + t.rewardLabel + '</div>' +
            '<div class="pt-reward-sub">' + t.rewardSub + '</div>' +
          '</div>' +
          '<p class="pt-reward-text">' + t.rewardText + '</p>' +
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
