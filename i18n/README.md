# Multilingual site

French is the editable source at the root. The same 39 pages are available under /en/, /es/, /it/, /de/ and /pt/. Visitors select a language using links to the equivalent page. Translation is static: no external translation service runs in visitors' browsers.

To update:
1. Read the latest main branch and edit the French source. Add the new French filename to i18n/pages.json (the source inventory; sitemap.xml is an index).
2. Translate every new or changed string in all five i18n/*.json dictionaries. Keys are exact trimmed French text nodes, relevant attributes and structured-data text. The *-overrides.json dictionaries take priority and contain editorial corrections.
3. Run `python scripts/build_languages.py` with Python 3 and lxml. Resolve missing-translation errors before publishing. All language pages, navigation, canonical and hreflang links and sitemap are generated together.
4. Verify changed pages on mobile, links, forms, exact numbers, dates and proper names. Commit the French source, dictionaries and generated pages in one update.

For weekly Google Calendar updates, change the French POA-AGENDA block and propagate the same verified in-person and video events to all five translated homepages. Preserve the exact datetime/data-poa-start values, timezone and addresses. NEVER publish a Google Meet access URL in HTML, JSON, ICS, dictionaries or browser scripts. Link to the dedicated presentation registration page instead. The visible French name is « Présentation des opportunités d’affaires », never the acronym POA. Date labels use the visitor's language with Europe/Paris as timezone.

Weekly articles must include all five translations and translated navigation/resource links. Preserve existing unrelated changes, form integration and event cards.

Initial article drafts were machine-assisted using publicly available OPUS-MT models, with editorial corrections stored separately. Review language-specific phrasing in the dictionaries when improving content. Never publish new French fallback paragraphs in translated routes.

Form field names and option values remain compatible with the existing Google Apps Script integration. Visible labels and status messages are localized. The French form values and chosen language remain available to the recipient.

## Publication safeguards (audit correction)

`build_languages.py` checks all translation keys before writing and then runs `finalize_site.py`. The finalizer removes expired agenda cards at generation time, generates six `/presentation-opportunites-affaires` pages and calendar reminder files, applies metadata corrections and creates a sitemap index with one sitemap per language. Run it after every agenda-only change too.

Legacy translations remain accessible with `noindex, follow`. Only add a filename to `i18n/reviewed-pages.json` after reviewing its entire visible content, headings and metadata in that language; correcting a title alone is insufficient. Unknown historical lastmod dates are omitted. `page-modifications.json` tracks content hashes and subsequent real changes. Do not reset all dates on every build.

Until the Apps Script project has been authenticated, corrected and verified, the presentation form must open a pre-filled email request to Guillaume and must not POST to the existing endpoint. This temporary safeguard prevents the legacy automation from assigning the next video session when a visitor selected another date. Automatic confirmation requires an authenticated update to the existing Apps Script project. Do not expose Meet links in static assets or claim that delivery is active before verification. Calendar downloads are reminders, not confirmed registrations. Never send fake test registrations.

Local seller/buyer content listed in `migrated-pages.json` belongs on immobiliernarbonne.com. Keep destination redirects and do not recreate local-market articles here. Keep professional advice on reconversion, practice, training, compensation and team development.
