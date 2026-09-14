"""Apply publishing safeguards after translations; no network or private meeting data."""
from pathlib import Path
import json, re, copy, hashlib, datetime
from urllib.parse import quote
from lxml import html as H, etree as E
R=Path(__file__).resolve().parents[1]
LANGS=['fr','en','es','it','de','pt'];BASE='https://tribu-immo.com'
NOW=datetime.datetime.now(datetime.timezone.utc)
def save(p,d):p.write_text(H.tostring(d,encoding='unicode',doctype='<!DOCTYPE html>'))
def meta(d,key,value,attr='name'):
 es=d.xpath('//meta[@'+attr+'="'+key+'"]')
 e=es[0] if es else H.Element('meta',{attr:key});e.set('content',value)
 if not es:d.find('head').append(e)
def trans(k,l):
 if l=='fr':return k
 m=json.loads((R/f'i18n/{l}.json').read_text());m.update(json.loads((R/f'i18n/{l}-overrides.json').read_text()));return m.get(k,k)
def route(l,slug=''):return ('/' if l=='fr' else '/'+l+'/')+slug
# Review policy is explicit: legacy machine translations remain available but not indexed.
titles=json.loads((R/'i18n/title-overrides.json').read_text())
review=json.loads((R/'i18n/reviewed-pages.json').read_text())
for l in LANGS:
 for p in (R if l=='fr' else R/l).glob('*.html'):
  d=H.fromstring(p.read_text());head=d.find('head')
  if head is None:continue
  if l!='fr':
   old=json.loads((R/f'i18n/{l}.json').read_text());new=json.loads((R/f'i18n/{l}-overrides.json').read_text())
   replacements={v:new[k] for k,v in old.items() if k in new and v!=new[k]}
   for e in d.iter():
    if not isinstance(e.tag,str):continue
    for field in ['text','tail']:
     t=getattr(e,field)
     if t and e.tag not in ('script','style') and t.strip() in replacements:setattr(e,field,t.replace(t.strip(),replacements[t.strip()]))
    for a in ('content','alt','title','placeholder','aria-label'):
     if e.get(a) in replacements:e.set(a,replacements[e.get(a)])
   if p.name not in review.get(l,[]):meta(d,'robots','noindex, follow')
   else:meta(d,'robots','index, follow')
  for e in d.xpath('//*[@data-poa-start]'):
   if datetime.datetime.fromisoformat(e.get('data-poa-start'))<=NOW:e.getparent().remove(e)
  title=d.find('.//title')
  if title is not None and title.text:
   title.text=titles.get(str(p.relative_to(R)),title.text)
   title.text=title.text.replace('\\','').replace('IAD的','iad |')
   if len(title.text)>65:
    title.text=re.sub(r'\s*[|—–]\s*(La )?Tribu Immo.*$','',title.text)
  description=d.xpath('//meta[@name="description"]/@content')
  if not description or not description[0].strip():
   # A short page-specific description instead of an empty tag.
   first=d.xpath('//main//p[normalize-space(string())]')
   if p.name=='simulateur-outil.html':meta(d,'description','Simulateur de rémunération iad et dispositifs : outil de calcul indicatif de Tribu Immo.')
   elif first:meta(d,'description',re.sub(r'\s+',' ',first[0].text_content()).strip()[:250])
  if title is not None:
   meta(d,'og:title',title.text,'property')
   desc=d.xpath('//meta[@name="description"]/@content')
   if desc:meta(d,'og:description',desc[0],'property')
   meta(d,'og:image',BASE+'/tribu-immo-logo.png','property')
   canonical=d.xpath('//link[@rel="canonical"]/@href')
   if canonical:meta(d,'og:url',canonical[0],'property')
  save(p,d)
# Use direct destination links for migrated local advice; keep professional navigation focused.
migrated=json.loads((R/'i18n/migrated-pages.json').read_text())
for l in LANGS:
 for p in (R if l=='fr' else R/l).glob('*.html'):
  d=H.fromstring(p.read_text())
  if d.find('head') is None:continue
  for a in d.xpath('//a[@href]'):
   href=a.get('href');key=href.removeprefix(BASE).split('#')[0].strip('/').removesuffix('.html')
   for code in LANGS[1:]:
    if key.startswith(code+'/'):key=key[len(code)+1:]
   if key in migrated:a.set('href',migrated[key])
  save(p,d)
# Dedicated presentation page, generated from the same verified agenda and translated form.
for l in LANGS:
 source=R/('index.html' if l=='fr' else l+'/index.html');d=H.fromstring(source.read_text())
 cards=d.xpath('//*[@data-poa-start]')
 for a in d.xpath('//*[@data-poa-start]//a[contains(@href,"meet.google.com")]'):
  a.set('href',route(l,'presentation-opportunites-affaires')+'?session='+a.getparent().get('data-poa-start')[:10]+'#inscription');a.attrib.pop('target',None);a.attrib.pop('rel',None);a.text=trans('Je m’inscris gratuitement ↗',l)
  a.set('data-evt','presentation-date')
 save(source,d)
 doc=copy.deepcopy(d);main=doc.find('body').find('main')
 section=copy.deepcopy(doc.xpath('//*[@id="poa"]')[0]);contact=copy.deepcopy(doc.xpath('//*[@id="rejoindre"]')[0])
 for c in list(main):main.remove(c)
 main.append(section);main.append(contact)
 heading=section.xpath('.//*[@id="poa-title"]')[0];heading.tag='h1'
 contact.set('id','inscription')
 intro=contact.xpath('.//*[contains(concat(" ",@class," ")," contact-layout ")]')[0][0]
 intro.clear();h=E.SubElement(intro,'h2');h.text=trans('Choisissez votre présentation',l)
 p=E.SubElement(intro,'p');p.text=trans('Votre demande sera transmise à Guillaume. Il vous confirmera votre participation et vous communiquera les informations d’accès.',l)
 form=contact.xpath('.//form')[0];form.set('data-presentation','true')
 form.set('onsubmit','return preparerInscriptionPresentation(event);')
 field=H.Element('div',{'class':'fg'});label=E.SubElement(field,'label',{'for':'presentation-session'});label.text=trans('Session souhaitée *',l)
 select=E.SubElement(field,'select',id='presentation-session',name='session',required='required');op=E.SubElement(select,'option',value='');op.text=trans('Choisissez votre présentation',l)
 graph=[]
 desc=trans('Votre demande sera transmise à Guillaume. Il vous confirmera votre participation et vous communiquera les informations d’accès.',l)
 for card in section.xpath('.//*[@data-poa-start]'):
  start=card.get('data-poa-start');day=start[:10];online='Google Meet' in card.text_content()
  end=start.replace('18:30:00','19:15:00' if online else '19:30:00')
  title=card.xpath('.//span')[0].text_content();date=card.xpath('.//time')[0].text_content();time=card.xpath('.//strong')[0].text_content()
  op=E.SubElement(select,'option',value=day);op.text=f'{date} · {time} · {title}';op.set('data-label',op.text)
  a=card.xpath('.//a')[0];a.set('href','#inscription');a.set('data-session',day);a.set('data-evt','presentation-date');a.text=trans('Je m’inscris gratuitement ↗',l)
  icsdir=R/'agenda'/l;icsdir.mkdir(parents=True,exist_ok=True)
  def utc(t):return datetime.datetime.fromisoformat(t).astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
  location=trans('En ligne sur Google Meet',l) if online else '2 Espace Soleil, 11100 Narbonne, France'
  # Saving a calendar reminder is not a confirmed registration; no access URL is embedded.
  desc=trans('Votre demande sera transmise à Guillaume. Il vous confirmera votre participation et vous communiquera les informations d’accès.',l)
  def esc(t):return t.replace('\\','\\\\').replace(';','\\;').replace(',','\\,').replace('\n','\\n')
  lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tribu Immo//Presentations//FR','BEGIN:VEVENT','UID:'+day+'@tribu-immo.com','DTSTAMP:20260914T000000Z','DTSTART:'+utc(start),'DTEND:'+utc(end),'SUMMARY:'+esc(title),'LOCATION:'+esc(location),'DESCRIPTION:'+esc(desc),'URL:'+BASE+route(l,'presentation-opportunites-affaires'),'END:VEVENT','END:VCALENDAR']
  (icsdir/(day+'.ics')).write_bytes(('\r\n'.join(lines)+'\r\n').encode())
  cal=E.SubElement(card,'a',href='/agenda/'+l+'/'+day+'.ics',download='',**{'class':'textlink'});cal.text=trans('Ajouter à mon agenda ↗',l)
  graph.append({'@type':'Event','@id':BASE+'/presentation-opportunites-affaires#'+day,'name':title,'description':desc,'startDate':start,'endDate':end,'eventStatus':'https://schema.org/EventScheduled','eventAttendanceMode':'https://schema.org/OnlineEventAttendanceMode' if online else 'https://schema.org/OfflineEventAttendanceMode','location':{'@type':'VirtualLocation','url':BASE+route(l,'presentation-opportunites-affaires')} if online else {'@type':'Place','name':'Espace Soleil, bâtiment C, 1er étage','address':{'@type':'PostalAddress','streetAddress':'2 Espace Soleil','postalCode':'11100','addressLocality':'Narbonne','addressCountry':'FR'}},'organizer':{'@type':'Person','name':'Guillaume Roque','url':BASE+'/guillaume-roque'},'isAccessibleForFree':True,'url':BASE+route(l,'presentation-opportunites-affaires')+'?session='+day})
 form.insert(0,field)
 if not graph:
  form.set('hidden','hidden')
  section.xpath('.//*[@id="poa-empty"]')[0].attrib.pop('hidden',None)
 button=form.xpath('.//button[@type="submit"]')[0];button.text=trans('Je m’inscris gratuitement ↗',l)
 mail_note=E.Element('p',{'class':'notice form-mail-note'})
 mail_note.text=trans('Votre messagerie s’ouvrira avec une demande préremplie. Envoyez-la pour transmettre votre demande à Guillaume ; votre participation ne sera confirmée qu’après sa réponse.',l)
 button.addnext(mail_note)
 success=doc.xpath('//*[@id="fs"]/p')[0];success.text=desc
 for script in doc.xpath('//script[@type="application/ld+json"]'):script.getparent().remove(script)
 sc=E.SubElement(doc.find('head'),'script',type='application/ld+json');sc.text=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)
 url=BASE+route(l,'presentation-opportunites-affaires')
 doc.find('.//title').text=trans('Présentation des opportunités d’affaires | Tribu Immo',l)
 meta(doc,'description',trans('Consultez les prochaines présentations du réseau iad avec Guillaume Roque, à Narbonne ou en visio, et demandez à participer gratuitement.',l))
 meta(doc,'og:title',doc.find('.//title').text,'property');meta(doc,'og:description',doc.xpath('//meta[@name="description"]/@content')[0],'property');meta(doc,'og:url',url,'property')
 # Pages inherit unreviewed headers/footer: keep translations noindex until reviewed in full.
 for e in doc.xpath('//link[@rel="canonical"]'):e.set('href',url)
 for e in doc.xpath('//link[@hreflang]'):e.set('href',BASE+route('fr' if e.get('hreflang')=='x-default' else e.get('hreflang'),'presentation-opportunites-affaires'))
 for e in doc.xpath('//nav[@class="language-bar"]//a'):e.set('href',route(e.get('hreflang'),'presentation-opportunites-affaires'))
 for e in doc.xpath('//header//a[starts-with(@href,"#")]'):e.set('href',route(l)+e.get('href'))
 sc=E.SubElement(doc.find('body'),'script',src='/presentations.js',defer='defer')
 save(R/((l+'/' if l!='fr' else '')+'presentation-opportunites-affaires.html'),doc)
# Generate independent sitemaps. Unknown historic lastmod is omitted rather than invented.
ns='http://www.sitemaps.org/schemas/sitemap/0.9'
statepath=R/'i18n/page-modifications.json';state=json.loads(statepath.read_text()) if statepath.exists() else {}
redirects={line.split()[0] for line in (R/'_redirects').read_text().splitlines() if line and not line.startswith('#')}
for l in LANGS:
 root=E.Element('urlset',nsmap={None:ns})
 for p in sorted((R if l=='fr' else R/l).glob('*.html')):
  doc=H.fromstring(p.read_text());canonical=doc.xpath('//link[@rel="canonical"]/@href')
  if not canonical or 'noindex' in ','.join(doc.xpath('//meta[@name="robots"]/@content')):continue
  u=canonical[0]
  if u.removeprefix(BASE) in redirects:continue
  path=str(p.relative_to(R));digest=hashlib.sha256(p.read_bytes()).hexdigest();entry=state.get(path)
  if entry and entry['sha256']!=digest:entry={'sha256':digest,'lastmod':NOW.date().isoformat()}
  elif not entry:entry={'sha256':digest} # no trustworthy full history in shallow clones
  state[path]=entry
  el=E.SubElement(root,'url');E.SubElement(el,'loc').text=u
  if entry.get('lastmod'):E.SubElement(el,'lastmod').text=entry['lastmod']
 (R/f'sitemap-{l}.xml').write_bytes(E.tostring(root,xml_declaration=True,encoding='UTF-8'))
index=E.Element('sitemapindex',nsmap={None:ns})
for l in LANGS:
 if len(E.parse(str(R/f'sitemap-{l}.xml')).getroot()):E.SubElement(E.SubElement(index,'sitemap'),'loc').text=BASE+f'/sitemap-{l}.xml'
(R/'sitemap.xml').write_bytes(E.tostring(index,xml_declaration=True,encoding='UTF-8'))
statepath.write_text(json.dumps(state,indent=2)+'\n')
print('Finalized event pages, metadata, expiry filtering and sitemaps')
