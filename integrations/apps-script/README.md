# Inscriptions aux présentations Tribu Immo

`Code.gs` remplace uniquement Code.gs dans le projet Apps Script « Script formulaire ». `EmailCandidat.gs` et les automatismes Google Forms existants sont conservés.

- Sans action dédiée, GET/POST conservent le traitement historique (prochain événement).
- `presentation_sessions` expose uniquement les séances autorisées à venir.
- `presentation_register` écrit dans l’onglet `Inscriptions presentations`, puis crée une invitation individuelle à la date choisie. L’événement source et les invitations historiques restent inchangés.
- Un identifiant déterministe empêche les doubles invitations lors des nouvelles tentatives.
- Les emails en attente et les rappels sont traités par `relancerPresentationsTribu`, déclencheur horaire toutes les 15 minutes. Les rappels partent dans les fenêtres des 24 h et 2 h précédant la séance, sous réserve du quota Google. Aucun mail n’est envoyé après le début de la séance.
- Les confirmations sont mises en attente si le quota est épuisé. Les refus d’invitation interrompent les rappels.
- Les fonctions utilisent le service avancé Calendar existant et les autorisations déjà en place.

Tests sans envoi réel, depuis la racine du dépôt : `node integrations/apps-script/test.cjs`.
`verifierPresentationsTribu` contrôle les séances, l’onglet et le quota sans envoyer d’email ni créer d’événement.
