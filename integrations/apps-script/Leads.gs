// Contacts et simulations des deux sites : destination fixe, jamais choisie par le navigateur.
var LEADS_SHEET_ID = '18oo7Hu93VyLJpWWEgWRv0WCSYTaaN4CqZIBcOiUi-VQ';
function enregistrerLead_(p) {
  if (p.societe || p.website) return {ok:false,message:'Demande invalide.'};
  function txt(v,n){var s=String(v==null?'':v).trim().slice(0,n||2000);return /^[=+@\-]/.test(s)?"'"+s:s;}
  var email=String(p.email||'').trim().toLowerCase();
  if(!String(p.nom||'').trim() || !emailValide_(email) || !String(p.telephone||'').trim() || !String(p.ville||'').trim() || !p.consentement) return {ok:false,message:'Coordonnées ou consentement manquants.'};
  if(p.source_site!=='Tribu Immo' && p.source_site!=='Team Lucky')return {ok:false,message:'Origine invalide.'};
  var simulation={};
  if(p.simulation){if(p.simulation.length>30000)return {ok:false,message:'Simulation trop volumineuse.'};simulation=JSON.parse(p.simulation);}
  var s=simulation.reponses||{}, r=simulation.resultats||{};
  function num(v){return typeof v==='number'&&isFinite(v)?v:'';}
  var ident=String(p.submission_id||'');
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(ident)) return {ok:false,message:'Identifiant absent.'};
  var sh=SpreadsheetApp.openById(LEADS_SHEET_ID).getSheetByName('Simulations');
  if(!sh || sh.getRange(1,33).getValue()!=='Site / marque')throw Error('Structure du suivi non reconnue');
  var lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    var last=sh.getLastRow();
    if(last>1 && sh.getRange(2,32,last-1,1).createTextFinder(ident).matchEntireCell(true).findNext())return {ok:true,saved:true,duplicate:true};
    var page=String(p.page||''), utm=page.indexOf('?')>=0?page.slice(page.indexOf('?')+1):'';
    var note=String(p.message||'').slice(0,12000);
    if(p.simulation)note+='\nRéponses et résultats de la simulation (déclaratifs) :\n'+p.simulation;
    sh.appendRow([
      new Date(),txt(p.nom),"'"+String(p.telephone||'').trim().slice(0,100),txt(email),txt(p.ville),txt(p.situation),txt(p.disponibilite),
      txt(({beginner:'Je débute',pro:'Je suis conseiller',manager:'J’intègre une équipe'})[s.profile]||''),num(r.ca),num(s.sales),num(s.fee),num(s.share),num(s.current),
      s.team==='yes'?'Oui':s.team==='no'?'Non':'',num(s.count),'','','','',num(s.teamca),num(r.total),
      typeof r.total==='number'?num(r.total/12):'',num(r.teamBase),num(r.tip),txt(utm),txt(page),txt(p.referent),
      'Nouveau','',txt(note,45000),txt(p.consentement),ident,p.source_site,p.source_site==='Team Lucky'?'Élodie Cimiotta':'Guillaume Roque'
    ]);
    SpreadsheetApp.flush();
    return {ok:true,saved:true};
  } finally {lock.releaseLock();}
}
