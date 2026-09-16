(function(){
'use strict';
function polish(){
 var s=document.getElementById('propertips'); if(!s||s.dataset.polished==='1') return !!s;
 var card=s.querySelector('.pt-card,.propertips-card'); if(!card) return false;
 var css=document.createElement('style'); css.id='propertips-polish-styles'; css.textContent=[
 '.pt-section,.propertips-home{background:linear-gradient(180deg,#f8fcfe 0%,#eef9fd 100%)!important;padding-top:88px!important;padding-bottom:88px!important}',
 '.pt-grid,.propertips-wrap{gap:48px!important;align-items:center!important}',
 '.pt-copy h2,.propertips-copy h2{font-size:clamp(34px,4.2vw,54px)!important;line-height:1.06!important;letter-spacing:-.04em!important;margin-bottom:18px!important}',
 '.pt-copy>p,.propertips-copy>p{max-width:690px!important;color:#526170!important;line-height:1.7!important}',
 '.pt-points,.propertips-steps{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;counter-reset:ptstep}',
 '.pt-points li,.propertips-steps li{position:relative!important;background:#fff!important;border:1px solid rgba(60,74,95,.1)!important;border-radius:16px!important;padding:16px 18px 16px 58px!important;min-height:54px!important;color:#344252!important;box-shadow:0 6px 20px rgba(38,56,74,.035)!important}',
 '.pt-points li:before{counter-increment:ptstep;content:counter(ptstep)!important;position:absolute!important;left:16px!important;top:50%!important;transform:translateY(-50%)!important;width:30px!important;height:30px!important;border-radius:50%!important;background:#e9fcff!important;color:#006390!important;display:grid!important;place-items:center!important;font-weight:800!important}',
 '.propertips-steps strong{position:absolute;left:16px;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;background:#e9fcff;color:#006390!important;display:grid!important;place-items:center;font-size:12px!important;margin:0!important}',
 '.pt-card,.propertips-card{background:#26384a!important;border-radius:28px!important;padding:30px!important;box-shadow:0 22px 54px rgba(38,56,74,.18)!important;border:1px solid rgba(255,255,255,.06)!important}',
 '.propertips-logo-wrap{border-radius:15px!important;min-height:76px!important;margin-bottom:20px!important}',
 '.pt-reward,.propertips-amount{font-size:clamp(64px,7vw,84px)!important;color:#00b4ec!important;text-align:center!important;line-height:.95!important;margin:4px 0 8px!important}',
 '.pt-reward-label,.pt-polish-label{font-size:18px!important;font-weight:800!important;line-height:1.3!important;color:#fff!important;text-align:center!important;margin-bottom:10px!important}',
 '.pt-reward-text,.propertips-card>p{font-size:12.5px!important;line-height:1.55!important;color:rgba(255,255,255,.74)!important;text-align:center!important;margin-bottom:22px!important}',
 '.pt-cta,.propertips-cta{min-height:54px!important;border-radius:999px!important;background:#00b4ec!important;color:#111!important;box-shadow:none!important}',
 '.propertips-video-trigger{aspect-ratio:auto!important;min-height:48px!important;margin:12px 0 0!important;border:1px solid rgba(255,255,255,.2)!important;border-radius:999px!important;background:transparent!important;box-shadow:none!important;padding:10px 16px!important}',
 '.propertips-video-poster{flex-direction:row!important;padding:0!important;gap:10px!important}',
 '.propertips-play{width:30px!important;height:30px!important;box-shadow:none!important;flex:0 0 30px!important}',
 '.propertips-play:before{border-top-width:5px!important;border-bottom-width:5px!important;border-left-width:8px!important;margin-left:2px!important}',
 '.propertips-video-label{font-size:12px!important}',
 '.propertips-invitation,.propertips-invite,.pt-invitation{margin-top:10px!important;color:rgba(255,255,255,.52)!important}',
 '.propertips-commission{display:none!important}',
 '@media(max-width:900px){.pt-section,.propertips-home{padding-top:64px!important;padding-bottom:64px!important}.pt-grid,.propertips-wrap{gap:30px!important}}',
 '@media(max-width:560px){.pt-card,.propertips-card{padding:22px!important;border-radius:22px!important}}'
 ].join(''); document.head.appendChild(css);
 var old=s.querySelector('.propertips-commission'); if(old) old.remove();
 var amt=s.querySelector('.propertips-amount'); if(amt){amt.textContent='6 %'; var p=amt.nextElementSibling; if(p&&p.tagName==='P'){p.textContent='Si votre recommandation aboutit à une transaction conclue via Propertips, je vous reverse 6 % de ma commission d’agence.'; p.className='pt-reward-text';} if(!s.querySelector('.pt-polish-label')){var l=document.createElement('div');l.className='pt-polish-label';l.textContent='de ma commission d’agence pour vous';amt.insertAdjacentElement('afterend',l);}}
 var note=s.querySelector('.propertips-note'); if(note) note.innerHTML='Rémunération sous réserve de l’aboutissement de la transaction et des conditions applicables de Propertips. Les sommes perçues peuvent constituer un revenu imposable. <a href="https://www.propertips.com/" target="_blank" rel="noopener noreferrer">Informations officielles ↗</a>';
 var video=s.querySelector('.propertips-video-trigger'), cta=s.querySelector('.pt-cta,.propertips-cta'); if(video&&cta) cta.insertAdjacentElement('afterend',video);
 s.dataset.polished='1'; return true;
}
function init(){if(polish())return;var o=new MutationObserver(function(){if(polish())o.disconnect();});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){o.disconnect();},12000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();