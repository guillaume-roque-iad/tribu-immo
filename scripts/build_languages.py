import json,re,pathlib,lxml.html as H
from datetime import date
ROOT=pathlib.Path(__file__).resolve().parents[1]
from lxml import etree
pagefiles=json.loads((ROOT/'i18n/pages.json').read_text())
pagefiles=[p for p in pagefiles if p != 'simulateur.html']
src={f:(ROOT/f).read_text() for f in pagefiles};out=ROOT
LANGS={'fr':'Français','es':'Español','en':'English','it':'Italiano','de':'Deutsch','pt':'Português'}
LABELS={'fr':'Langue','es':'Idioma','en':'Language','it':'Lingua','de':'Sprache','pt':'Idioma'}
locales={'fr':'fr-FR','es':'es-ES','en':'en-GB','it':'it-IT','de':'de-DE','pt':'pt-PT'}
paths=[p for p in src if p.endswith('.html')]
def url(p,lang):return ('/' if lang=='fr' else '/'+lang+'/')+('' if p=='index.html' else p[:-5])
def rewrite_link(href,lang):
 if href.startswith('https://tribu-immo.com'):href=href[len('https://tribu-immo.com'):]
 if not href or href.startswith(('#','mailto:','tel:','http:','https:','//','javascript:','data:')):return href
 part,sep,frag=href.partition('#');part,q,query=part.partition('?')
 for code in LANGS:
  if part.startswith('/'+code+'/'):part=part[len(code)+1:];break
 p=part.lstrip('/');p=('index.html' if not p else p if p.endswith('.html') else p+'.html')
 if p in paths:return url(p,lang)+(q+query if q else '')+(sep+frag if sep else '')
 return '/'+href.lstrip('/')
pending={}
def write(path,content):
 pending[path]=content
missing={}
for lang in LANGS:
 mapping={} if lang=='fr' else json.load(open(ROOT/'i18n'/(lang+'.json')))
 over=ROOT/'i18n'/(lang+'-overrides.json')
 if over.exists():mapping.update(json.load(open(over)))
 def trans(t):
  if not t or not t.strip():return t
  s=t.strip();v=mapping.get(s,s)
  if lang!='fr' and s not in mapping and re.search('[A-Za-zÀ-ÿ]',s):missing.setdefault(lang,set()).add(s)
  return t[:len(t)-len(t.lstrip())]+v+t[len(t.rstrip()):]
 for path in paths:
  doc=H.fromstring(src[path])
  for old in doc.xpath('//nav[@class="language-bar"] | //link[@href="/languages.css"] | //script[@src="/languages.js"]'):old.getparent().remove(old)
  doc.set('lang',lang)
  for e in doc.xpath('//option[not(@value)]'):e.set('value',e.text_content())
  if lang!='fr':
   for e in doc.iter():
    if not isinstance(e.tag,str):continue
    if e.tag not in ('script','style'):e.text=trans(e.text)
    e.tail=trans(e.tail)
    for attr in ('placeholder','aria-label','alt','title'):
     if e.get(attr):e.set(attr,trans(e.get(attr)))
    if e.tag=='meta' and (e.get('name') in ('description','keywords') or e.get('property') in ('og:title','og:description','twitter:title','twitter:description')):e.set('content',trans(e.get('content')))
  for e in doc.xpath('//*[@href]'):
   if e.tag!='link':e.set('href',rewrite_link(e.get('href'),lang))
  for e in doc.xpath('//*[@src]'):
   s=e.get('src')
   if not s.startswith(('/','http:','https:','data:')):e.set('src','/'+s)
  canonical='https://tribu-immo.com'+url(path,lang)
  for e in doc.xpath('//link[@rel="canonical"]'):e.set('href',canonical)
  for e in doc.xpath('//meta[@property="og:url"]'):e.set('content',canonical)
  for e in doc.xpath('//meta[@property="og:locale"]'):e.set('content',locales[lang].replace('-','_'))
  for e in doc.xpath('//link[@hreflang]'):e.getparent().remove(e)
  head=doc.find('head')
  for code in LANGS:head.append(H.Element('link',rel='alternate',hreflang=code,href='https://tribu-immo.com'+url(path,code)))
  head.append(H.Element('link',rel='alternate',hreflang='x-default',href='https://tribu-immo.com'+url(path,'fr')))
  head.append(H.Element('link',rel='stylesheet',href='/languages.css'))
  head.append(H.Element('script',src='/languages.js',defer='defer'))
  bar=H.Element('nav',{'class':'language-bar','aria-label':LABELS[lang]})
  inner=H.Element('div',{'class':'wrap language-inner'});bar.append(inner)
  label=H.Element('span');label.text=LABELS[lang]+' :';inner.append(label)
  for code,name in LANGS.items():
   a=H.Element('a',href=url(path,code),hreflang=code,lang=code);a.text=name
   if code==lang:a.set('aria-current','page')
   inner.append(a)
  doc.xpath('//header')[0].insert(0,bar)
  def ld(x):
   if isinstance(x,list):return [ld(v) for v in x]
   if not isinstance(x,dict):return x
   for k,v in list(x.items()):
    if k in ('name','headline','description','text','jobTitle') and isinstance(v,str):x[k]=trans(v)
    elif k=='inLanguage':x[k]=locales[lang]
    elif k=='url' and isinstance(v,str) and v.startswith('https://tribu-immo.com'):x[k]='https://tribu-immo.com'+rewrite_link(v,lang)
    elif k=='@id' and isinstance(v,str) and ('#page' in v or '#article' in v):x[k]=canonical+('#article' if '#article' in v else '#page')
    else:x[k]=ld(v)
   return x
  for e in doc.xpath('//script[@type="application/ld+json"]'):e.text=json.dumps(ld(json.loads(e.text)),ensure_ascii=False)
  for e in doc.xpath('//time[@datetime]'):
   e.set('data-localize-date','')
  write(path if lang=='fr' else lang+'/'+path,H.tostring(doc,encoding='unicode',doctype='<!DOCTYPE html>'))
if missing:raise RuntimeError(str(missing))
for path,content in pending.items():
 f=out/path;f.parent.mkdir(exist_ok=True,parents=True);f.write_text(content)
for p,c in src.items():
 if not p.endswith('.html') and p!='sitemap.xml':write(p,c)
import runpy
runpy.run_path(str(ROOT/'scripts/finalize_site.py'),run_name='__main__')
print('built',len(paths)*len(LANGS),'pages')
