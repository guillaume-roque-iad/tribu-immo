"""Preserve brand names, professional identifiers and place names in static dictionaries."""
import json,re
from pathlib import Path
_RULES=json.loads((Path(__file__).resolve().parents[1]/'i18n/protected-terms.json').read_text())
def protect_translation(source,value):
    if not isinstance(value,str): return value
    if source in _RULES['terms']: return source
    for term,aliases in _RULES['aliases'].items():
        if term not in source: continue
        for alias in sorted(aliases,key=len,reverse=True):
            value=re.sub(r'(?<!\w)'+re.escape(alias)+r'(?!\w)',lambda _:term,value,flags=re.I if '.' in term else 0)
    return value
