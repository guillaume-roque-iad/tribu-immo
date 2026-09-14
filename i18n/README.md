# Multilingual site

French is the editable source at the root. The same 39 pages are available under /en/, /es/, /it/, /de/ and /pt/. Visitors select a language using links to the equivalent page. Translation is static: no external translation service runs in visitors' browsers.

To update:
1. Read the latest main branch and edit the French source. Add a new page's French URL to sitemap.xml.
2. Translate every new or changed string in all five i18n/*.json dictionaries. Keys are exact trimmed French text nodes, relevant attributes and structured-data text. The *-overrides.json dictionaries take priority and contain editorial corrections.
3. Run `python scripts/build_languages.py` with Python 3 and lxml. Resolve missing-translation errors before publishing. All language pages, navigation, canonical and hreflang links and sitemap are generated together.
4. Verify changed pages on mobile, links, forms, exact numbers, dates and proper names. Commit the French source, dictionaries and generated pages in one update.

For weekly Google Calendar updates, change the French POA-AGENDA block and propagate the same verified in-person and video events to all five translated homepages. Preserve the exact datetime/data-poa-start values, timezone, addresses and meeting links. The visible French name is « Présentation des opportunités d’affaires », never the acronym POA. Date labels use the visitor's language with Europe/Paris as timezone.

Weekly articles must include all five translations and translated navigation/resource links. Preserve existing unrelated changes, form integration and event cards.

Initial article drafts were machine-assisted using publicly available OPUS-MT models, with editorial corrections stored separately. Review language-specific phrasing in the dictionaries when improving content. Never publish new French fallback paragraphs in translated routes.

Form field names and option values remain compatible with the existing Google Apps Script integration. Visible labels and status messages are localized. The French form values and chosen language remain available to the recipient.
