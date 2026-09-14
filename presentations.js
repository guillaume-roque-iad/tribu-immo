(() => {
  'use strict';

  const form = document.querySelector('form[data-presentation]');
  const session = document.getElementById('presentation-session');
  if (!form || !session) return;

  const copy = {
    fr: {
      subject: 'Demande de participation — Présentation des opportunités d’affaires',
      intro: 'Bonjour Guillaume, je souhaite participer à la présentation suivante :',
      session: 'Session', name: 'Nom', email: 'E-mail', phone: 'Téléphone',
      city: 'Ville', situation: 'Situation', availability: 'Disponibilité',
      message: 'Précision', close: 'Merci de me confirmer ma participation et de me communiquer les informations d’accès.'
    },
    en: {
      subject: 'Participation request — Business opportunity presentation',
      intro: 'Hello Guillaume, I would like to attend the following presentation:',
      session: 'Session', name: 'Name', email: 'Email', phone: 'Phone',
      city: 'City', situation: 'Current situation', availability: 'Availability',
      message: 'Additional information', close: 'Please confirm my participation and send me the access details.'
    },
    es: {
      subject: 'Solicitud de participación — Presentación de oportunidades de negocio',
      intro: 'Hola Guillaume, me gustaría participar en la siguiente presentación:',
      session: 'Sesión', name: 'Nombre', email: 'Correo electrónico', phone: 'Teléfono',
      city: 'Ciudad', situation: 'Situación actual', availability: 'Disponibilidad',
      message: 'Información adicional', close: 'Por favor, confirma mi participación y envíame los datos de acceso.'
    },
    it: {
      subject: 'Richiesta di partecipazione — Presentazione delle opportunità di business',
      intro: 'Buongiorno Guillaume, vorrei partecipare alla seguente presentazione:',
      session: 'Sessione', name: 'Nome', email: 'E-mail', phone: 'Telefono',
      city: 'Città', situation: 'Situazione attuale', availability: 'Disponibilità',
      message: 'Informazioni aggiuntive', close: 'Conferma la mia partecipazione e inviami le informazioni di accesso.'
    },
    de: {
      subject: 'Teilnahmeanfrage — Präsentation der Geschäftsmöglichkeiten',
      intro: 'Hallo Guillaume, ich möchte an der folgenden Präsentation teilnehmen:',
      session: 'Termin', name: 'Name', email: 'E-Mail', phone: 'Telefon',
      city: 'Ort', situation: 'Aktuelle Situation', availability: 'Verfügbarkeit',
      message: 'Zusätzliche Information', close: 'Bitte bestätige meine Teilnahme und sende mir die Zugangsinformationen.'
    },
    pt: {
      subject: 'Pedido de participação — Apresentação das oportunidades de negócio',
      intro: 'Olá Guillaume, gostaria de participar na seguinte apresentação:',
      session: 'Sessão', name: 'Nome', email: 'E-mail', phone: 'Telefone',
      city: 'Cidade', situation: 'Situação atual', availability: 'Disponibilidade',
      message: 'Informação adicional', close: 'Confirma a minha participação e envia-me os dados de acesso.'
    }
  };

  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const ui = copy[lang] || copy.fr;

  function choose(value) {
    if ([...session.options].some(option => option.value === value)) {
      session.value = value;
      window.tribuEvt?.('presentation_date_choisie', { session: value });
    }
  }

  window.preparerInscriptionPresentation = function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!form.reportValidity()) return false;
    const data = new FormData(form);
    if (data.get('societe')) return false;

    const selectedText = session.selectedOptions[0]?.text || '';
    const optionText = name => form.elements[name]?.selectedOptions?.[0]?.text || '';
    const lines = [
      ui.intro, '',
      ui.session + ' : ' + selectedText,
      ui.name + ' : ' + (data.get('nom') || ''),
      ui.email + ' : ' + (data.get('email') || ''),
      ui.phone + ' : ' + (data.get('telephone') || ''),
      ui.city + ' : ' + (data.get('ville') || ''),
      ui.situation + ' : ' + optionText('situation'),
      ui.availability + ' : ' + optionText('disponibilite'),
      ui.message + ' : ' + (data.get('message') || ''), '',
      ui.close
    ];

    window.tribuEvt?.('presentation_demande_email_preparee', { session: session.value });
    window.location.href = 'mailto:guillaume.roque@iadfrance.fr?subject=' +
      encodeURIComponent(ui.subject) + '&body=' + encodeURIComponent(lines.join('\n'));
    return false;
  };

  choose(new URLSearchParams(window.location.search).get('session'));
  document.querySelectorAll('[data-session]').forEach(link => {
    link.addEventListener('click', () => choose(link.dataset.session));
  });
  session.addEventListener('change', () => choose(session.value));
})();
