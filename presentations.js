(() => {
  'use strict';
  const form = document.querySelector('form[data-presentation]');
  const session = document.getElementById('presentation-session');
  if (!form || !session) return;
  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const texts = {
    fr: ['Chargement des dates…', 'Choisissez une date…', 'Heure de Paris', 'Les dates ne sont pas disponibles. Actualisez la page ou contactez Guillaume au 06 62 10 83 96.', 'Inscription en cours…', 'Votre inscription est enregistrée.', 'Acceptez l’invitation Google Agenda envoyée à votre adresse email pour ajouter la présentation à votre agenda. Vous recevrez une confirmation et des rappels par email.', 'Votre email de confirmation est en attente d’envoi. Votre inscription et votre invitation Google Agenda sont bien enregistrées.', 'La confirmation n’a pas pu être vérifiée. Réessayez avec la même adresse : aucune seconde invitation ne sera créée.', 'En visio'],
    en: ['Loading dates…', 'Choose a date…', 'Paris time', 'Dates are unavailable. Refresh the page or contact Guillaume on +33 6 62 10 83 96.', 'Registering…', 'Your registration is recorded.', 'Accept the Google Calendar invitation sent to your email address to add the presentation to your calendar. You will receive an email confirmation and reminders.', 'Your confirmation email is queued. Your registration and Google Calendar invitation are recorded.', 'We could not verify confirmation. Try again with the same email address: no duplicate invitation will be created.', 'Online'],
    es: ['Cargando fechas…', 'Elige una fecha…', 'Hora de París', 'Fechas no disponibles. Actualiza la página o contacta con Guillaume: +33 6 62 10 83 96.', 'Inscripción en curso…', 'Tu inscripción está registrada.', 'Acepta la invitación de Google Calendar enviada a tu correo para añadir la presentación a tu calendario. Recibirás una confirmación y recordatorios por correo.', 'Tu correo de confirmación está pendiente de envío. Tu inscripción y la invitación de Google Calendar están registradas.', 'No hemos podido verificar la confirmación. Reinténtalo con el mismo correo: no se creará otra invitación.', 'En línea'],
    it: ['Caricamento delle date…', 'Scegli una data…', 'Ora di Parigi', 'Date non disponibili. Aggiorna la pagina o contatta Guillaume: +33 6 62 10 83 96.', 'Iscrizione in corso…', 'La tua iscrizione è registrata.', 'Accetta l’invito Google Calendar inviato al tuo indirizzo email per aggiungere la presentazione al calendario. Riceverai una conferma e dei promemoria via email.', 'La conferma via email è in attesa di invio. L’iscrizione e l’invito Google Calendar sono registrati.', 'Impossibile verificare la conferma. Riprova con lo stesso indirizzo email: non verrà creato un secondo invito.', 'Online'],
    de: ['Termine werden geladen…', 'Termin auswählen…', 'Pariser Zeit', 'Termine nicht verfügbar. Seite neu laden oder Guillaume kontaktieren: +33 6 62 10 83 96.', 'Anmeldung läuft…', 'Ihre Anmeldung ist registriert.', 'Nehmen Sie die per E-Mail gesendete Google-Kalender-Einladung an, um die Präsentation in Ihren Kalender aufzunehmen. Sie erhalten eine Bestätigung und Erinnerungen per E-Mail.', 'Ihre Bestätigungs-E-Mail wartet auf den Versand. Anmeldung und Google-Kalender-Einladung sind registriert.', 'Die Bestätigung konnte nicht geprüft werden. Versuchen Sie es mit derselben E-Mail-Adresse erneut: Es wird keine zweite Einladung erstellt.', 'Online'],
    pt: ['A carregar datas…', 'Escolha uma data…', 'Hora de Paris', 'Datas indisponíveis. Atualize a página ou contacte Guillaume: +33 6 62 10 83 96.', 'Inscrição em curso…', 'A sua inscrição está registada.', 'Aceite o convite Google Calendar enviado para o seu email para adicionar a apresentação ao calendário. Receberá uma confirmação e lembretes por email.', 'O seu email de confirmação aguarda envio. A inscrição e o convite Google Calendar estão registados.', 'Não foi possível verificar a confirmação. Tente novamente com o mesmo email: não será criado um segundo convite.', 'Online']
  };
  const ui = texts[lang] || texts.fr;
  const button = form.querySelector('[type="submit"]');
  const originalLabel = button.textContent;
  const status = document.createElement('p');
  status.className = 'notice';
  status.id = 'presentation-status';
  status.setAttribute('role', 'status');
  session.after(status);
  session.setAttribute('aria-describedby', status.id);
  const error = document.getElementById('f-erreur');
  let sessions = [], ready = false, busy = false;
  let requested = new URLSearchParams(location.search).get('session');
  const dateLabel = s => new Intl.DateTimeFormat(lang, {dateStyle:'full', timeStyle:'short', timeZone:'Europe/Paris'}).format(new Date(s.start)) + ' · ' + (s.format === 'En visio' ? ui[9] : s.format);
  function choose(value) {
    requested = value;
    const found = sessions.find(s => s.id === value || s.date === value);
    if (found) session.value = found.id;
  }
  async function loadSessions() {
    session.disabled = button.disabled = true;
    status.textContent = ui[0];
    try {
      const response = await fetch(TRIBU_EXEC + '?action=presentation_sessions', {signal:AbortSignal.timeout(45000)});
      const result = await response.json();
      if (!result.ok || !Array.isArray(result.sessions)) throw new Error('dates');
      sessions = result.sessions.filter(s => new Date(s.start).getTime() > Date.now());
      if (!sessions.length) throw new Error('empty');
      session.replaceChildren(new Option(ui[1], ''));
      sessions.forEach(s => session.add(new Option(dateLabel(s), s.id)));
      choose(requested);
      document.querySelectorAll('[data-poa-start]').forEach(card => {
        const date = card.querySelector('[data-session]')?.dataset.session;
        if (date && !sessions.some(s => s.date === date)) card.hidden = true;
      });
      ready = true;
      status.textContent = ui[2];
      session.disabled = button.disabled = false;
    } catch (_) { status.textContent = ui[3]; }
  }
  window.preparerInscriptionPresentation = function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!ready || busy || !form.reportValidity()) return false;
    const data = new FormData(form);
    if (data.get('societe')) return false;
    data.set('action', 'presentation_register');
    busy = true;
    button.disabled = true;
    button.textContent = ui[4];
    error.style.display = 'none';
    (async () => {
      try {
        const response = await fetch(TRIBU_EXEC, {method:'POST', body:data, signal:AbortSignal.timeout(60000)});
        const result = await response.json();
        if (!result.ok || !result.calendarSent) throw new Error(lang === 'fr' ? result.message || ui[8] : ui[8]);
        const success = document.getElementById('fs');
        const title = document.createElement('h3'); title.textContent = ui[5];
        const details = document.createElement('p'); details.textContent = dateLabel(result.session) + ' · ' + ui[2];
        const message = document.createElement('p'); message.textContent = result.emailPending ? ui[7] : ui[6];
        success.replaceChildren(title, details, message);
        form.style.display = 'none'; success.style.display = 'block'; success.focus();
        window.tribuEvt?.('presentation_inscription_confirmee', {session:result.session.date});
      } catch (err) {
        error.textContent = err.name === 'Error' ? err.message : ui[8];
        error.style.display = 'block';
        button.disabled = false;
      } finally { busy = false; button.textContent = originalLabel; }
    })();
    return false;
  };
  document.querySelectorAll('[data-session]').forEach(link => link.addEventListener('click', () => {choose(link.dataset.session); if(ready) session.focus({preventScroll:true});}));
  loadSessions();
})();
