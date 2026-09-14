(function(){
'use strict';
var strings={"fr": {"menuOpen": "Ouvrir le menu", "menuClose": "Fermer le menu", "submit": "Être recontacté par Guillaume ↗", "sending": "Envoi en cours…", "patience": "Envoi en cours… encore quelques secondes"}, "en": {"menuOpen": "Open menu", "menuClose": "Close menu", "submit": "Ask Guillaume to contact me ↗", "sending": "Sending…", "patience": "Sending… a few more seconds"}, "es": {"menuOpen": "Abrir menú", "menuClose": "Cerrar menú", "submit": "Quiero que Guillaume me contacte ↗", "sending": "Enviando…", "patience": "Enviando… unos segundos más"}, "it": {"menuOpen": "Apri menu", "menuClose": "Chiudi menu", "submit": "Chiedi a Guillaume di contattarmi ↗", "sending": "Invio in corso…", "patience": "Invio in corso… ancora qualche secondo"}, "de": {"menuOpen": "Menü öffnen", "menuClose": "Menü schließen", "submit": "Kontakt durch Guillaume anfragen ↗", "sending": "Wird gesendet…", "patience": "Wird gesendet… noch einen Moment"}, "pt": {"menuOpen": "Abrir menu", "menuClose": "Fechar menu", "submit": "Pedir contacto a Guillaume ↗", "sending": "A enviar…", "patience": "A enviar… mais alguns segundos"}};
var lang=document.documentElement.lang||'fr';
window.TribuUI=strings[lang]||strings.fr;
var locales={fr:'fr-FR',en:'en-GB',es:'es-ES',it:'it-IT',de:'de-DE',pt:'pt-PT'};
document.addEventListener('DOMContentLoaded',function(){
 document.querySelectorAll('time[data-localize-date]').forEach(function(el){
  var raw=el.getAttribute('datetime');var d=new Date(raw.length===10?raw+'T12:00:00Z':raw);
  if(!isNaN(d))el.textContent=new Intl.DateTimeFormat(locales[lang],{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(d);
 });
 document.querySelectorAll('.language-bar a').forEach(function(a){a.hash=location.hash;});
});
})();
