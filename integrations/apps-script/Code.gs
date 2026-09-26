var SHEET_ID = '158E65XNtEGMwRTpd_lA94P39jfFdPTMnAoUbZhhgFfI';
var EMAIL_NOTIF = 'guillaume.roque@iadfrance.fr';
function doGet(e) {
  if(e && e.parameter && e.parameter.action === 'presentation_sessions') {
    try { return poaJson_({ok:true,sessions:poaSessions_()}); }
    catch(err) { console.error(err); return poaJson_({ok:false,message:'Les dates sont temporairement indisponibles.'}); }
  }
  return traiterFormulaireSite_(e);
}
function doPost(e) {
  try {
    if(e && e.parameter && e.parameter.action === 'presentation_register') return poaJson_(poaInscrire_(e.parameter));
    var sortie = traiterFormulaireSite_(e), texte = sortie.getContent();
    var debut = texte.indexOf('('), fin = texte.lastIndexOf(')');
    var donnees = JSON.parse(debut >= 0 && fin > debut ? texte.substring(debut + 1, fin) : texte);
    donnees.ok = donnees.status === 'ok';
    return poaJson_(donnees);
  } catch(err) { console.error(err); return poaJson_({ok:false,message:'Erreur de traitement. Réessayez dans quelques instants.'}); }
}
// Included in Code.gs of the existing form project. Calendar advanced service required.
// Install relancerPresentationsTribu as a 15-minute time-driven trigger in Apps Script.
var POA_CALENDAR = 'guillaume.roque@iadfrance.fr';
var POA_SHEET = 'Inscriptions presentations';
var POA_SOURCES = ['7r18brunjqk6n025ca3is78kcg','1o35mtk63c31kt1v488ucchvcl','6akjaqq3bmf6ed02e41a9ok6bb','0o8tpmfj9kfn30i51ml7mm7bi8'];

function poaJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function poaSourceAutorisee_(ev) {
  return ev && ev.status !== 'cancelled' && ev.start && ev.start.dateTime &&
    (POA_SOURCES.indexOf(ev.id) >= 0 || /^7gg3st9cngbjq9mrchhbbhkfcj_/.test(ev.id));
}
function poaSessions_() {
  var items = [], token;
  do {
    var result = Calendar.Events.list(POA_CALENDAR, {
      timeMin: new Date().toISOString(), timeMax: new Date(Date.now()+365*86400000).toISOString(),
      singleEvents:true, orderBy:'startTime', maxResults:250, pageToken:token
    });
    (result.items || []).forEach(function(ev) {
      if (poaSourceAutorisee_(ev) && new Date(ev.start.dateTime).getTime()>Date.now()) {
        items.push({id:ev.id,date:Utilities.formatDate(new Date(ev.start.dateTime),'Europe/Paris','yyyy-MM-dd'),
          start:ev.start.dateTime,end:ev.end.dateTime,
          format:ev.location && !/^https?:/.test(ev.location) ? 'Narbonne' : 'En visio'});
      }
    });
    token=result.nextPageToken;
  } while(token);
  return items;
}
function poaSheet_() {
  var ss=SpreadsheetApp.openById(SHEET_ID), previous=ss.getActiveSheet(), sh=ss.getSheetByName(POA_SHEET);
  if(!sh){sh=ss.insertSheet(POA_SHEET);sh.appendRow(['Cle','Creation','Nom','Email','Telephone','Ville','Session source','Invitation','Confirmation email','Rappel 24h','Rappel 2h','Statut','Derniere erreur','Situation','Disponibilite','Message']);sh.setFrozenRows(1);ss.setActiveSheet(previous);}
  return sh;
}
function poaCell_(s){s=String(s||'').trim().slice(0,500);return /^[=+@-]/.test(s)?"'"+s:s;}
function poaHash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function poaInfos_(ev) {
  var start=new Date(ev.start.dateTime);
  var visio=!(ev.location && !/^https?:/.test(ev.location));
  var meet=ev.hangoutLink || ((ev.conferenceData||{}).entryPoints||[]).filter(function(x){return x.entryPointType==='video';}).map(function(x){return x.uri;})[0];
  return {date:Utilities.formatDate(start,'Europe/Paris','dd/MM/yyyy à HH:mm'),
    lieu:visio?(meet||MEET_TRIBU_IMMO):ev.location,
    detail:visio?'Visioconférence':'Bâtiment C · 1er étage',visio:visio};
}
function poaInvitation_(ev,email,nom,id) {
  var info=poaInfos_(ev);
  return {id:id,summary:'Présentation réseau iad — Tribu Immo',
    start:ev.start,end:ev.end,location:info.lieu,
    description:'Votre présentation avec Guillaume Roque.\n'+info.detail+'\n'+info.lieu+
      '\nHeure de Paris.\nPour annuler, refusez cette invitation ou répondez au mail de confirmation.\nContact : guillaume.roque@iadfrance.fr · 06 62 10 83 96',
    attendees:[{email:email,displayName:nom}],visibility:'private',
    guestsCanInviteOthers:false,guestsCanModify:false,guestsCanSeeOtherGuests:false,
    extendedProperties:{private:{tribuSource:ev.id}},
    reminders:{useDefault:false,overrides:[{method:'popup',minutes:120}]}};
}
function poaMail_(email,nom,ev,rappel) {
  if(MailApp.getRemainingDailyQuota()<1)return false;
  var info=poaInfos_(ev), titre=rappel?'Rappel — votre présentation iad':'Votre inscription à la présentation iad est confirmée';
  var texte='Bonjour '+nom+',\n\n'+(rappel?'Votre présentation approche.':'Votre inscription est confirmée. Une invitation Google Agenda vous est envoyée séparément : acceptez-la pour ajouter ce rendez-vous à votre agenda.')+
    '\n\nDate : '+info.date+' (heure de Paris)\n'+info.detail+'\n'+info.lieu+
    '\n\nPour annuler, refusez l’invitation Google Agenda ou répondez à ce message.\n\nGuillaume Roque · Tribu Immo\n06 62 10 83 96';
  var esc=echapperHtmlTribu_;
  MailApp.sendEmail({to:email,subject:titre+' — '+info.date,body:texte,replyTo:EMAIL_NOTIF,name:'Guillaume Roque — Tribu Immo',
    htmlBody:'<div style="font-family:Montserrat,Arial,sans-serif;color:#263746;max-width:620px;margin:auto;padding:24px;font-size:16px;line-height:1.7"><img src="https://tribu-immo.com/tribu-immo-logo.png" alt="Tribu Immo" width="140"><h1 style="font-size:24px;line-height:1.3">'+esc(titre)+'</h1><p>Bonjour '+esc(nom)+',</p><p>'+esc(rappel?'Votre présentation approche.':'Votre inscription est confirmée. Acceptez l’invitation Google Agenda reçue séparément pour ajouter ce rendez-vous à votre agenda.')+'</p><div style="background:#E9FCFF;padding:20px;border-left:4px solid #00B4EC"><strong>'+esc(info.date)+' (heure de Paris)</strong><br>'+esc(info.detail)+'<br>'+esc(info.lieu)+'</div>'+(info.visio?'<p><a href="'+esc(info.lieu)+'" style="display:inline-block;background:#006390;color:#fff;padding:14px 22px;border-radius:30px;text-decoration:none;font-weight:bold">Rejoindre la présentation</a></p>':'')+'<p>Pour annuler, refusez l’invitation Google Agenda ou répondez à ce message.</p><p>Guillaume Roque · Tribu Immo<br>06 62 10 83 96</p></div>'});
  return true;
}
function poaInscrire_(p) {
  if(p.societe || p.website) return {ok:false,message:'Inscription non validée.'};
  var email=String(p.email||'').trim().toLowerCase(),nom=nettoyer_(p.nom);
  if(!nom || !emailValide_(email) || !p.telephone || !p.ville || p.consentement!=='oui')
    return {ok:false,message:'Vérifiez les champs obligatoires et votre accord pour recevoir l’invitation et les rappels.'};
  var matches=poaSessions_().filter(function(s){return s.id===p.session || s.date===p.session;});
  if(matches.length!==1) return {ok:false,message:'Cette date n’est plus disponible. Actualisez la liste des présentations.'};
  var ev=Calendar.Events.get(POA_CALENDAR,matches[0].id);
  if(!poaSourceAutorisee_(ev)||new Date(ev.start.dateTime).getTime()<=Date.now()) return {ok:false,message:'Cette présentation n’est plus disponible.'};
  var key=poaHash_(ev.id+'|'+email),lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    var sh=poaSheet_(),rows=sh.getDataRange().getValues(),n=0;
    for(var i=1;i<rows.length;i++)if(rows[i][0]===key){n=i+1;break;}
    if(!n){
      // Limit repeated public form submissions by address; existing registrations remain retryable.
      var recent=rows.filter(function(r){return r[3]===email && new Date(r[1]).getTime()>Date.now()-86400000;}).length;
      if(recent>=5)return {ok:false,message:'Plusieurs demandes ont déjà été reçues. Contactez Guillaume pour une autre date.'};
      sh.appendRow([key,new Date(),poaCell_(nom),email,poaCell_(p.telephone),poaCell_(p.ville),ev.id,'','','','','en cours','',poaCell_(p.situation),poaCell_(p.disponibilite),poaCell_(p.message)]);n=sh.getLastRow();
    }
    var row=sh.getRange(n,1,1,13).getValues()[0];
    if(row[11]==='annulée')return {ok:false,message:'Cette inscription a été annulée. Contactez Guillaume pour la réactiver.'};
    var invitationId='ti'+key,invitation;
    if(!row[7]){
      try{invitation=Calendar.Events.get(POA_CALENDAR,invitationId);}catch(err){if(!/404|not found/i.test(String(err)))throw err;}
      if(!invitation)invitation=Calendar.Events.insert(poaInvitation_(ev,email,nom,invitationId),POA_CALENDAR,{sendUpdates:'all'});
      if(invitation.status==='cancelled')return {ok:false,message:'Cette invitation a été annulée. Contactez Guillaume.'};
      sh.getRange(n,8).setValue(invitationId);SpreadsheetApp.flush();
    }
    var sent=!!row[8],mailError='';
    if(!sent){
      try{sent=poaMail_(email,nom,ev,false);if(sent)sh.getRange(n,9).setValue(new Date());}
      catch(mailErr){mailError=String(mailErr).slice(0,500);}
    }
    sh.getRange(n,12,1,2).setValues([[sent?'confirmée':'email en attente',mailError]]);
    return {ok:true,calendarSent:true,emailSent:sent,emailPending:!sent,session:matches[0]};
  } catch(err){if(sh&&n)sh.getRange(n,13).setValue(String(err).slice(0,500));console.error(err);return {ok:false,message:'La confirmation n’a pas pu être finalisée. Réessayez avec la même adresse : votre demande sera reprise sans créer une seconde invitation.'};}
  finally{lock.releaseLock();}
}
function relancerPresentationsTribu() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try {
    var sh=poaSheet_(),rows=sh.getDataRange().getValues(),now=Date.now(),sources={};
    for(var i=1;i<rows.length;i++){
      var r=rows[i];if(!r[7] || r[11]==='annulée' || r[11]==='terminée')continue;
      try {
        var ev=sources[r[6]]||(sources[r[6]]=Calendar.Events.get(POA_CALENDAR,r[6]));
        var inv=Calendar.Events.get(POA_CALENDAR,r[7]);
        if(ev.status==='cancelled' || inv.status==='cancelled' || (inv.attendees||[]).some(function(a){return a.email.toLowerCase()===r[3]&&a.responseStatus==='declined';})){
          if(ev.status==='cancelled'&&inv.status!=='cancelled')Calendar.Events.remove(POA_CALENDAR,r[7],{sendUpdates:'all'});
          sh.getRange(i+1,12).setValue('annulée');continue;
        }
        var hours=(new Date(ev.start.dateTime).getTime()-now)/3600000;
        if(hours<=0){sh.getRange(i+1,12).setValue('terminée');continue;}
        var info=poaInfos_(ev);
        if(new Date(inv.start.dateTime).getTime()!==new Date(ev.start.dateTime).getTime() || new Date(inv.end.dateTime).getTime()!==new Date(ev.end.dateTime).getTime() || inv.location!==info.lieu){
          var upd=poaInvitation_(ev,r[3],r[2],r[7]);
          Calendar.Events.patch({start:upd.start,end:upd.end,location:upd.location,description:upd.description},POA_CALENDAR,r[7],{sendUpdates:'all'});
        }
        if(!r[8]){if(poaMail_(r[3],r[2],ev,false)){sh.getRange(i+1,9).setValue(new Date());sh.getRange(i+1,12,1,2).setValues([['confirmée','']]);}continue;}
        // Never send a reminder immediately after a last-minute registration.
        if(now-new Date(r[8]).getTime()<1800000)continue;
        var col=hours<=2?11:hours<=24?10:0;
        if(col&&!r[col-1]&&poaMail_(r[3],r[2],ev,true)){sh.getRange(i+1,col).setValue(new Date());}
        sh.getRange(i+1,13).setValue('');
      } catch(err){sh.getRange(i+1,13).setValue(String(err).slice(0,500));console.error(err);}
    }
  } finally{lock.releaseLock();}
}
function verifierPresentationsTribu() {
  var sessions=poaSessions_();
  if(!sessions.length)throw new Error('Aucune présentation disponible');
  poaSheet_();
  console.log(JSON.stringify({ok:true,sessions:sessions,mailQuota:MailApp.getRemainingDailyQuota(),test:'Aucun mail envoyé, aucune invitation créée'}));
}

