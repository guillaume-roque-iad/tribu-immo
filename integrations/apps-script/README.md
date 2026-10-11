# Inscriptions aux présentations Tribu Immo

`Code.gs` remplace uniquement Code.gs dans le projet Apps Script « Script formulaire ». `EmailCandidat.gs` et les automatismes Google Forms existants sont conservés.

- Sans action dédiée, GET/POST conservent le traitement historique (prochain événement).
- `presentation_sessions` expose uniquement les séances autorisées à venir.
- `presentation_register` écrit dans l’onglet `Inscriptions presentations`, puis ajoute le participant aux invités de l’occurrence existante à la date choisie. Aucun événement supplémentaire n’est créé ; le lien Meet, les horaires et les invités existants sont conservés. Les anciennes invitations individuelles restent suivies par les rappels.
- Une clé par séance et adresse email, un verrou et une vérification des invités empêchent les doubles ajouts lors des nouvelles tentatives.
- Les emails en attente et les rappels sont traités par `relancerPresentationsTribu`, déclencheur horaire toutes les 15 minutes. Les rappels partent dans les fenêtres des 24 h et 2 h précédant la séance, sous réserve du quota Google. Aucun mail n’est envoyé après le début de la séance.
- Les confirmations sont mises en attente si le quota est épuisé. Les refus d’invitation interrompent les rappels.
- Les fonctions utilisent le service avancé Calendar existant et les autorisations déjà en place.

Tests sans envoi réel, depuis la racine du dépôt : `node integrations/apps-script/test.cjs`.
`verifierPresentationsTribu` contrôle les séances, l’onglet et le quota sans envoyer d’email ni créer d’événement.

## Contacts et simulateurs

`Leads.gs` et la route POST `lead_capture` enregistrent les coordonnées et les simulations des deux sites dans le tableau existant « Rejoindre l’équipe IAD France – Candidature Mandataire Immobilier (réponses) », onglet `Réponses au formulaire 1`. La source est limitée à Tribu Immo ou Team Lucky ; le responsable est déterminé côté serveur. Les réponses et résultats déclaratifs sont conservés dans la colonne H.

Un identifiant de soumission et un verrou empêchent les doublons à la nouvelle tentative. Le résultat n’est débloqué dans le navigateur qu’après une réponse confirmant `ok: true` et `saved: true`. Aucun contact n’est enregistré dans le navigateur après validation.

Chaque nouvelle demande déclenche une alerte HTML à Guillaume Roque, avec les logos intégrés en CID, les coordonnées cliquables et un lien vers la ligne du contact. Les colonnes AB à AF suivent l’identifiant, l’origine, le responsable et l’état de l’alerte. Une alerte déjà envoyée n’est pas renvoyée lors d’une nouvelle tentative. En cas d’échec, l’erreur est enregistrée et la fonction `reprendreAlertesSimulateur` permet une reprise manuelle ; aucun nouveau déclencheur horaire n’a été installé.

Le formulaire transmet explicitement le choix newsletter (case facultative non précochée) dans la colonne X. La synchronisation Brevo déjà installée dans « Script Google Sheet » contrôle les nouvelles lignes toutes les cinq minutes et conserve les refus et désabonnements. Cette route ne crée pas d’inscription à une présentation ; les routes de choix de séance restent séparées.

Version Apps Script 8 déployée le 11 octobre 2026 : alerte HTML vérifiée par réception d’un email de démonstration, sans créer de candidat.
