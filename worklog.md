# Worklog — Projet Zalspor

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Cloner github.com/topmuch/zalspors, installer, lancer le dev, ajouter boutons "Ajouter" (Réservations + Calendrier) et corriger la création d'admin.

Work Log:
- Tentative de clone de https://github.com/topmuch/zalspors → ÉCHEC (404 : repo privé ou inexistant, GitHub demande une authentification).
- Vérification de l'API GitHub : repo inaccessible publiquement.
- Décision : reconstruire l'application "Zalspor" (gestion de réservations d'installations sportives) de zéro dans /home/z/my-project (Next.js 16 + Prisma + shadcn/ui), avec toutes les fonctionnalités demandées :
  1. Dashboard admin avec section Réservations + bouton "Ajouter une réservation" (dialog + POST /api/reservations)
  2. Section Calendrier + bouton "Ajouter un événement" (dialog + POST /api/calendar)
  3. Section Administrateurs avec bouton "Créer un administrateur" PLEINEMENT FONCTIONNEL (POST /api/admins avec hash scrypt)
- Stack : Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma + SQLite, sessions par token (Authorization Bearer).

Stage Summary:
- Repo GitHub inaccessible → reconstruction complète de l'app dans le projet courant.
- Prochaines étapes : schéma Prisma, seed, frontend, API, tests navigateur.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Construire l'application Zalspor complète (schéma, seed, frontend, backend) et vérifier boutons Ajouter + création admin.

Work Log:
- Schéma Prisma (prisma/schema.prisma) : Admin, Session, Facility, Reservation, CalendarEvent + relations. `bun run db:push` OK.
- src/lib/auth.ts : hachage scrypt (Node crypto, zéro dépendance), sessions Bearer 7 jours, getAuthAdmin/unauthorizedResponse.
- prisma/seed.ts + exécution : 2 admins (admin@zalspor.com/admin123 SUPER_ADMIN, moussa@zalspor.com), 6 installations, 10 réservations, 6 événements. (Correction d'une faute de frappe `facilityEmail`→`customerEmail`.)
- Thème : primaire émeraude (globals.css), layout.tsx FR + metadata Zalspor, scrollbar personnalisée `.zalspor-scroll`.
- Frontend (src/components/zalspor/) : types.ts, api.ts (client + token localStorage), landing.tsx (hero + booking dialog public), admin-login.tsx, admin-dashboard.tsx (shell + 5 sections), reservations-section.tsx (bouton « Ajouter une réservation » + dialog + filtres + actions), calendar-section.tsx (grille mensuelle date-fns fr + bouton « Ajouter un événement » + dialogue détails du jour), admins-section.tsx (bouton « Créer un administrateur » + validation complète), overview-section.tsx (stats + AreaChart recharts), facilities-section.tsx.
- page.tsx : orchestration SPA (public/connexion/dashboard) avec restauration de session.
- API routes : /api/auth/login|logout|me, /api/admins (GET, POST création avec validations + hash scrypt + doublon email 409), /api/admins/[id] (PATCH/DELETE + protection dernier super admin), /api/reservations (GET, POST public+admin avec détection de conflits d'horaire 409), /api/reservations/[id] (PATCH statut, DELETE), /api/calendar (GET, POST), /api/calendar/[id] (PATCH, DELETE), /api/facilities (GET public, POST), /api/facilities/[id] (PATCH), /api/stats.
- Image hero générée via z-ai SDK (scripts/generate-hero.ts, 1536x768 car l'API exige des multiples de 32) → public/hero-sports.png.
- Corrections : icône lucide `UserShield` inexistante → `ShieldCheck` ; breakpoint `xs` invalide → `sm:` ; useEffect au lieu d'un hack useState ; nettoyage code mort.
- Lint : 0 erreur. `GET /` 200.

Stage Summary:
- App Zalspor complète et fonctionnelle sur le port 3000.
- Les 3 demandes sont implémentées : bouton Ajouter (Réservations), bouton Ajouter (Calendrier), bouton Créer un administrateur.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Vérification end-to-end avec agent-browser (golden path complet) + analyse visuelle VLM.

Work Log:
- agent-browser sur http://localhost:3000 : landing OK (6 installations chargées depuis la BD, hero image 200).
- Connexion admin (admin@zalspor.com / admin123) OK → dashboard avec stats (10 réservations, 153 000 FCFA estimés, 6 événements, 2 admins).
- Bouton « Ajouter une réservation » → dialogue rempli (« Test Navigateur », tennis, confirmée) → POST 201 → compteur 10→11, dialogue fermé, toast affiché.
- Bouton « Ajouter un événement » (Calendrier) → « Tournoi amical de démonstration » → POST 201 → « 7 événements », jour du 3 sept. passe à 5 éléments.
- Bouton « Créer un administrateur » → compte « Bineta Fall » (bineta.fall@zalspor.com / bineta123, Admin) créé → apparaît dans la table → DÉCONNEXION puis RECONNEXION avec ce nouveau compte : succès (« Bonjour Bineta 👋 ») — preuve que la création d'admin fonctionne de bout en bout (hash + session).
- Réservation publique depuis la landing : conflit d'horaire détecté (409, contrôle anti-chevauchement OK) puis création réussie sur créneau libre (12:00-13:00) avec référence générée.
- Changement de statut (Confirmer une réservation en attente) : 3→2 en attente, 8→9 confirmées.
- Dialogue détails du jour (calendrier) : liste des événements + réservations du 3 sept. avec suppression.
- Responsive mobile (375x812) : nav compacte, aucune erreur console ; footer sticky vérifié (gap 0 sur page courte, poussé naturellement sur page longue 4873px).
- VLM (z-ai vision) sur captures desktop + mobile : design professionnel, pas de texte superposé ni d'élément cassé (remarques : widget dev Next.js + animations au scroll — comportements attendus).
- dev.log : toutes les routes API en 200, aucune erreur runtime ; lint final : 0 erreur.

Stage Summary:
- ✅ Golden path complet vérifié dans le navigateur : les 3 fonctionnalités demandées (Ajouter réservation, Ajouter événement calendrier, Créer admin) fonctionnent réellement.
- App prête : prévisualisation via le panneau de droite (bouton « Open in New Tab »).

---
Task ID: 4
Agent: main (Z.ai Code)
Task: Générer un terrain de football et l'intégrer dans le hero de la page d'accueil.

Work Log:
- Skill image-generation chargé ; génération via script SDK (scripts/generate-hero-football.ts) car la CLI bloque 1536x768 alors que l'API exige des multiples de 32.
- Image « terrain de football » générée en 1536x768 (ratio 2:1 exact pour le conteneur aspect-[2/1] du hero) → public/hero-football.png (188 Ko).
- Prompt : pelouse verte rayée, lignes blanches, buts avec filets, projecteurs, heure dorée, perspective aérienne légère, photoréaliste, sans texte.
- landing.tsx : src de l'Image du hero remplacé (/hero-sports.png → /hero-football.png) + alt mis à jour.
- Vérification VLM de l'image brute : vrai terrain de football, aucun texte, aucun artefact, qualité pro.
- agent-browser : page / chargée, aucune erreur console/page ; captures desktop + mobile (375x812) analysées par VLM → hero bien cadré, pas de déformation ni débordement, carte stats en overlay intacte.
- Lint : 0 erreur ; dev.log : GET / 200 et /api/facilities 200, aucune erreur runtime.

Stage Summary:
- ✅ Hero de la page d'accueil : image de terrain de football générée par IA et intégrée (desktop + mobile vérifiés).
- Ancienne image gymnase conservée en secours dans public/hero-sports.png.

---
Task ID: 5
Agent: main (Z.ai Code)
Task: Intégrer le logo uploadé (remplacer le texte Zalspor), créer les pages « À propos » et « Le Concept », et supprimer toutes les autres catégités de sport (tennis, gym, basket…) — site 100% location de terrains de football à l'heure.

Work Log:
- Logo uploadé copié : upload/logo (2).webp → public/logo.webp (96×96, écusson « ZALFOOT », fond transparent, verts). Vérifié via VLM.
- Nouveau composant brand.tsx (Brand : logo seul + sous-titre optionnel, zéro texte de marque).
- Rebranding complet Zalspor → Zalfoot (visible) : header/footer landing, login, dashboard, toasts, e-mails démo (@zalfoot.com), métadonnées (title + favicon /logo.webp), clé localStorage zalfoot_token.
- landing.tsx réécrite : SPA à 3 vues (accueil / concept / apropos) via state + goTo() avec scroll ; nav desktop + burger mobile + footer communs ; footer sticky conservé (mt-auto).
  - Accueil : hero football uniquement (badge « Location de terrains de football à l'heure », stats dynamiques), section « Nos terrains de football » (icône Trophy, badge type supprimé), fonctionnement, CTA contact.
  - Le Concept : 3 piliers (réservation 1 min, prix transparents, terrains prêts), « Pour qui ? » (4 cibles), tarifs à l'heure (cartes avec bouton Réserver), CTA.
  - À propos : histoire (photo + stats), mission, valeurs (Simplicité/Transparence/Passion), contact + CTA.
- Bug corrigé : présélection du terrain dans BookingDialog désormais appliquée à chaque ouverture (useEffect sur open/preselectedFacilityId).
- Suppression des autres sports : seed réécrit (3 terrains FOOTBALL : A synthétique 11v11 15k, B naturel 11v11 12k, C five 5v5 8k ; 10 réservations + 6 événements foot), reseed exécuté.
- types.ts : FACILITY_TYPE_LABELS réduit à FOOTBALL ; facilities-section : champ Type supprimé (FOOTBALL forcé), textes « terrain » ; API POST /api/facilities : VALID_TYPES = {FOOTBALL} (défaut automatique) ; labels « Installation » → « Terrain » partout (calendrier, réservations, overview).
- Vérifications navigateur (agent-browser) : accueil (logo sans texte ZALSPOR, 3 terrains), navigation Concept + À propos (sections complètes validées par VLM), réservation publique end-to-end (présélection Terrain A, 409 sur conflit 18h-19h, 201 sur créneau libre 21h-22h, toast + référence), connexion admin@zalfoot.com/admin123 OK (dashboard : logo + « Dashboard administrateur », stats 11 résas/3 terrains/6 événements), dialogue « Ajouter un terrain » sans champ type (POST 201 testé, terrain test supprimé de la BD ensuite), mobile 375×812 (menu burger, Concept/À propres, aucune erreur console, footer en bas).
- Lint : 0 erreur. dev.log : uniquement des 200/201 récents (erreurs UserShield/hero-sports = anciennes entrées du log cumulatif).

Stage Summary:
- ✅ Logo ZALFOOT intégré partout, texte Zalspor supprimé, onglet « Zalfoot — Location de terrains de football à l'heure ».
- ✅ Pages « Le Concept » et « À propos » créées (vues SPA sur la route /) et validées desktop + mobile.
- ✅ Site recentré 100% football à l'heure : 3 terrains en BD, création de terrain limitée au football, réservation testée de bout en bout.

---
Task ID: 6-b
Agent: full-stack-developer (dashboard admin)
Task: Améliorer le dashboard administrateur — logo 2x, auto-refresh temps réel + toast nouvelle réservation, colonne Paiement & « Marquer payé », section « Paiement Wave » (nouveau payment-section.tsx), cartes revenus Wave dans la vue d'ensemble.

Work Log:
- worklog.md (tâches 1–5) lu avant de commencer ; fichiers interdits (prisma/, api/, lib/, landing.tsx, booking-dialog.tsx, types.ts, brand.tsx, page.tsx, api.ts) non touchés.
- admin-login.tsx + admin-dashboard.tsx : <Brand size={40}/> → size={80}, header h-16 → h-24 (logo 80px vérifié au navigateur : 80×80, header 97px, rien de coupé, sous-titre lisible).
- admin-dashboard.tsx : polling setInterval 10 s (nettoyé au démontage) + refresh sur visibilitychange/focus (si onglet visible) via loadAll ; badge d'en-tête remplacé par « Temps réel · Auto-sync HH:mm:ss » (state lastSyncTime + key, icône Activity pulsée pendant le refresh) ; détection des nouvelles réservations via useRef<Set<id>> (pas de toast au 1er chargement ni si le total diminue, un seul toast groupé « 2 nouvelles réservations reçues 🎉 » si plusieurs, formatDateFr + startTime dans la description) ; option announceNew propagée uniquement au polling/visibility pour éviter les doublons de toast après les actions admin (onRefresh des sections met quand même à jour le référentiel d'ids).
- admin-dashboard.tsx : section 'payment' ajoutée au type DashboardSection + NAV_ITEMS (icône Wallet, mobileLabel « Paiement ») + rendu <PaymentSection onUnauthorized={...}/> ; sidebar sticky top-28 alignée sur le header h-24.
- payment-section.tsx (NOUVEAU, self-contained) : titre « Paiement Wave » + carte d'état (badge vert « Activé » + lien tronqué 60 car. + bouton « Ouvrir » window.open _blank noopener / badge outline « Non configuré » + texte d'aide Wave Business) ; formulaire (Label, Input placeholder https://pay.wave.com/..., Loader2, boutons « Enregistrer » / « Effacer ») avec validation inline client (/^https?:\/\//i, ≤ 500) et erreurs ApiError (401 → onUnauthorized), GET /api/settings au montage (pré-remplissage), PUT /api/settings auth pour sauver/vider, aide mentionnant les balises {amount} et {reference}.
- reservations-section.tsx : colonne « Paiement » (entre Statut et Source, hidden md:table-cell) = badge méthode Wave/Sur place (outline) ou « — », badge Payé/Impayé (PAYMENT_STATUS_META) + montant formatPrice en 11px dessous ; cellule Créneau « 23:00 – minuit » via formatHourLabel ; menu d'actions : « Marquer payé » (BadgeCheck émeraude) / « Marquer impayé » (Wallet) factorisés en updatePayment(id, paymentStatus) → PATCH /api/reservations/[id], busyId + 401 → onUnauthorized + toast « Paiement mis à jour » ; bug minuit corrigé : canSubmit passe par timeToMinutes/isValidSlot (« 00:00 » fin de journée = 1440) au lieu de la comparaison de chaînes qui rejetait 23:00→00:00.
- overview-section.tsx : carte unique « Revenus estimés » remplacée par « Revenus estimés » (CircleDollarSign, hint « X en attente de paiement ») + « Encaissé (payé) » (Wallet, formatPrice(paidRevenue), hint « paiements Wave & sur place reçus ») → 7 cartes, grille sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ; liste « Prochaines réservations » : créneau « startTime–formatHourLabel(endTime) » ajouté + mini-badge Payé/Impayé (text-[10px]) seulement si paymentMethod renseigné.
- Vérifications agent-browser (desktop 1440×900 + mobile 375×812) : login + dashboard OK ; « Marquer payé »/« Marquer impayé » testés (toast + ligne mise à jour, état DB restauré) ; réservation 23:00→00:00 créée puis supprimée (bouton ENABLED, « 23:00 – minuit » affiché, 201) ; section Paiement : erreur inline sur lien sans http(s), enregistrement + persistance après reload (badge Activé + Ouvrir), « Effacer » → désactivation ; toasts temps réel vérifiés : réservation publique créée via API → toast « Nouvelle réservation reçue 🎉 » au polling ≤ 10 s, 2 créations d'un coup → « 2 nouvelles réservations reçues 🎉 » groupées, suppressions → aucun toast, compteur auto-retourné à 10 ; 4 réservations de test supprimées (données propres) ; captures analysées par VLM (header/logo/cartes/payment/mobile sans chevauchement).
- bun run lint : 0 erreur, 0 avertissement. dev.log : uniquement des 200/201, aucune erreur runtime.

Stage Summary:
- ✅ Dashboard admin en temps réel : polling 10 s + reprise sur visibilité, badge « Temps réel · Auto-sync HH:mm:ss », toast (unique et groupé) à chaque nouvelle réservation client.
- ✅ Paiements visibles et pilotables : colonne Paiement (méthode + statut + montant FCFA), actions « Marquer payé » / « Marquer impayé », cartes « Revenus estimés » / « Encaissé (payé) », affichage « minuit » pour 00:00, bug 23:00→00:00 corrigé.
- ✅ Nouvelle section « Paiement Wave » (payment-section.tsx) : configuration du lien Wave Business avec balises {amount}/{reference}, activation/désactivation persistées, navigation desktop + mobile.

---
Task ID: 6-a / 6-c / 6-d
Agent: main (Z.ai Code)
Task: Refonte complète de la réservation client — calendrier visible + créneaux horaires 08:00→minuit (passés grisés/interdits), validation nom + téléphone, paiement Wave Business, dashboard auto-actualisé ; logo 2x sur la landing.

Work Log:
- Schéma Prisma : Reservation + amount (FCFA), paymentStatus (UNPAID/PAID), paymentMethod (WAVE/ON_SITE) ; nouveau model Setting (clé/valeur). db:push OK (serveur dev redémarré pour recharger le client Prisma). Seed enrichi (montants + paiements Wave/sur place, créneaux alignés à l'heure pile) puis reseed.
- src/lib/time.ts (NOUVEAU) : nowInDakar() (Intl, fuseau Africa/Dakar), timeToMinutes avec « 00:00 » fin de journée = 1440, isSlotPast, constantes 08:00→00:00 (16 créneaux).
- API /api/availability (NOUVEAU, public) : ?date= → 16 créneaux avec état PAST/BOOKED/CLOSED/FREE (réservations PENDING+CONFIRMED + événements calendrier non-DISPONIBILITE, passé calculé à l'heure de Dakar) ; ?month= → créneaux libres par jour (calendrier : jours complets barrés, point ambre « bientôt complet »).
- API /api/settings (NOUVEAU) : GET public { wavePaymentLink } + PUT admin (validation http(s)://, ≤ 500 car., chaîne vide = désactivé) — le lien Wave Business est configuré par l'admin, l'utilisateur le fournira.
- POST /api/reservations : téléphone OBLIGATOIRE côté public (≥ 8 chiffres), créneaux 08:00→minuit à l'heure pile uniquement, créneau passé → 400 « déjà passé », montant calculé serveur (durée × tarif), paymentMethod WAVE + paymentStatus UNPAID par défaut ; gestion minuit corrigée dans la détection de conflits (23:00→00:00 réservable, 409 sur conflit). PATCH /api/reservations/[id] : paymentStatus (Marquer payé) en plus du statut. GET /api/stats : paidRevenue + unpaidReservations, revenus basés sur amount.
- booking-dialog.tsx (NOUVEAU, ~470 lignes) : assistant 3 étapes — 1) terrain + calendrier mensuel date-fns fr (nav mois, passé désactivé, +60 j max, jours complets barrés) + grille 16 créneaux (libres cliquables, sélection d'heures CONSÉCUTIVES, PAST/BOOKED/CLOSED grisés + libellés, compteur « X libres / 16 ») + récap prix live ; 2) récap terrain/créneau/total + nom* + téléphone (Wave)* + bouton « Valider et payer X FCFA » bleu Wave ; 3) référence + bouton « Payer X FCFA avec Wave » (window.open, {amount}/{reference} remplacés) ou carte « Wave en cours d'activation » si non configuré ; retour auto à l'étape 1 + rafraîchissement des créneaux sur 409/400.
- landing.tsx : ancien BookingDialog (formulaire heures libres) supprimé, nouveau dialogue intégré ; logo 40→80px (header h-24) et footer 28→56px ; textes horaires « De 8 h à minuit » (hero + terrains) ; section « Comment ça marche » étape 2 = « Payez avec Wave » ( Waves).
- Tests API curl : téléphone absent 400, créneau passé 400, hors 08:00→00:00 400, 23:00→00:00 créé 201 (15 000 FCFA, WAVE/UNPAID), conflit 409.
- Vérifications agent-browser desktop 1440×900 : dialogue complet (créneaux passés grisés jusqu'à ~18:00, 19h-20h « Réservé », sélection 20:00+21:00 = 30 000 FCFA, soumission Fatou Ndiaye → étape confirmation) ; lien Wave test configuré via la section Paiement (https://pay.wave.com/m/M_ZALFOOT/c/sn/?amount={amount}) puis nouvelle résa → bouton « Payer 15 000 FCFA avec Wave » → nouvel onglet https://pay.wave.com/m/M_ZALFOOT?amount=15000 (montant bien injecté) ; dashboard : 11→12 réservations SANS rechargement (polling 10 s) + toast « Nouvelle réservation reçue 🎉 Awa Cissé — lun. 7 sept. 16:00 » détecté à T+2 s ; « Marquer payé » testé (Impayé→Payé) ; 4 réservations de test supprimées ensuite.
- Vérification mobile 375×812 : dialogue utilisable, créneaux passés grisés, aucun défaut ; micro-fix appliqué sur la ligne « Créneaux du … / X libres » (truncate + shrink-0) après détection VLM, re-vérifié OK.
- Logo mesuré au navigateur : 80×80 px affichés dans un header de 96 px (2x exact). Lint : 0 erreur. dev.log : aucune erreur runtime, toutes les routes en 200.

Stage Summary:
- ✅ Nouveau système de réservation : calendrier visible + créneaux 08:00→minuit, créneaux passés/réservés grisés et refusés côté serveur, nom + téléphone obligatoires, montant calculé, paiement Wave (bouton + redirection avec {amount}/{reference}).
- ✅ Lien Wave Business configurable par l'admin (section « Paiement » du dashboard) — prêt à recevoir le lien réel de l'utilisateur ; sans lien, la réservation reste enregistrée avec message d'attente.
- ✅ Dashboard auto-actualisé (polling 10 s + toast) dès qu'un client réserve — vérifié end-to-end.
- ✅ Logo 2x (80 px) partout : landing, login, dashboard, footer.

---
Task ID: 8
Agent: main (Z.ai Code)
Task: Réservation en PAGE dédiée (fini la modale) · 25 000 F/h avec acompte 5 000 F versé via Wave · intégration du lien de paiement Wave réel + icône Wave fournie.

Work Log:
- Icône Wave fournie (upload/wave.png, 332×419, fond noir opaque : icône pingouin + wordmark) copiée dans public/ ; extraction de l'icône seule via PIL flood-fill depuis les bords (noir extérieur → transparent, pingouin noir intérieur préservé) → public/wave-logo.png (255×253, coins arrondis transparents), vérifiée par VLM sur fond blanc.
- Nouveau src/lib/pricing.ts : DEPOSIT_PER_HOUR = 5000 + computeDeposit(hours) ; ré-exporté depuis types.ts pour le client.
- Schéma Prisma : Reservation.depositAmount (Float?) ajouté ; db:push + redémarrage du serveur dev (setsid nohup, le client Prisma en mémoire ne connaissait pas le nouveau champ).
- scripts/apply-new-pricing.ts exécuté : 3 terrains → 25 000 FCFA/h (tarif unique), Setting wave_payment_link = https://pay.wave.com/m/M_sn_if40h6RgxkCj/c/sn/?amount={amount} ({amount} = acompte), 10 réservations recalculées (amount + depositAmount). Seed.ts mis en cohérence pour les prochains reseed.
- API POST /api/reservations : depositAmount = 5 000 F × heures calculé et stocké côté serveur (curl : 2 h → total 50 000, acompte 10 000, WAVE/UNPAID). API /api/stats : paidRevenue = somme des acomptes des réservations PAID.
- reservation-page.tsx (NOUVEAU, ~700 lignes, remplace booking-dialog.tsx supprimé) : PAGE complète — en-tête avec retour accueil + badges (25 000 F/h, acompte Wave 5 000 F/h, solde sur place) + stepper cliquable 1 Créneau/2 Coordonnées/3 Paiement ; étape 1 : terrain + calendrier mensuel + grille 16 créneaux (passés/réservés grisés, légende) + carte récap Total/Acompte/Solde ; étape 2 : résumé + formulaire nom + téléphone (Wave) + note avec icône Wave ; étape 3 : confirmation + référence + bloc paiement bleu Wave avec icône + bouton « Payer X FCFA avec Wave » (window.open buildWaveUrl {amount=acompte, reference}) + solde sur place + actions. Scroll-to-top à chaque étape.
- landing.tsx : vue SPA 'reserver' (4e page) rendue dans main ; openBooking() → goTo('reserver') (plus de Dialogue) ; entrée « Réserver un terrain » ajoutée au menu burger mobile ; textes acompte (Comment ça marche étape 2, cartes tarifs du Concept « Acompte de 5 000 F/h à la réservation »).
- Admin : reservations-section (colonne Paiement = méthode + badge Acompte reçu/dû + « Acompte X · Total Y », actions « Acompte reçu »/« Acompte non reçu », toasts adaptés), overview-section (« Acomptes encaissés — acomptes Wave reçus (5 000 F/h) », hint « en attente d'acompte »), payment-section (icône Wave dans le titre, aide {amount} = acompte).
- Vérifications agent-browser desktop 1440×900 : clic « Réserver ce terrain » → PAGE dédiée (H1 + stepper + 3 terrains 25 000 F/h) ; créneaux passés jusqu'à 18h grisés (heure Dakar 18h31), 19h réservé ; sélection 20h+21h → « Continuer — acompte 10 000 FCFA » ; étape 2 → Aminata Touré → 201 + toast + étape 3 « Payer 10 000F CFA avec Wave » avec icône (VLM) ; clic → NOUVEL ONGLET https://pay.wave.com/m/M_sn_if40h6RgxkCj?amount=10000 ( redirection réelle du lien fourni, page « Pay with Wave » + QR code capturée et vérifiée VLM) ; dashboard : compteur 11→12 SANS rechargement, toast « Nouvelle réservation reçue 🎉 » capturé via wait --text après création API d'une résa client ; « Acompte reçu » testé (badge passe de dû à reçu, acompte affiché) ; section Paiement : icône Wave + badge Activé + lien réel + formulaire.
- Vérifications mobile 375×812 : dashboard restauré (cartes Acomptes encaissés 75 000 F), déconnexion puis parcours complet : Réserver maintenant → page dédiée empilée (VLM), 22h sélectionné → « Payer 5 000F CFA avec Wave » (1 h × 5 000 exactement), aucune erreur console, footer poussé naturellement sur page longue.
- Nettoyage : 7 réservations de test supprimées (BD revenue aux 10 réservations seedées). Lint : 0 erreur. dev.log : aucune erreur runtime.

Stage Summary:
- ✅ Réservation = PAGE dédiée (vue SPA « reserver »), plus aucune modale.
- ✅ Tarification : 25 000 FCFA/h (tous terrains, recalculés), acompte de 5 000 FCFA/heure réservée payé via Wave, solde sur place.
- ✅ Lien Wave Business réel intégré et configuré en BD : https://pay.wave.com/m/M_sn_if40h6RgxkCj/c/sn/?amount={amount} — pour 1 h, ouvre exactement le lien fourni (amount=5000) ; vérifié sur la vraie page Wave (QR code).
- ✅ Icône Wave (fournie) extraite avec fond transparent et intégrée : en-tête de la page réservation, note étape 2, bloc + bouton de paiement étape 3, section Paiement du dashboard.
- ✅ Dashboard admin : auto-update + toast à chaque résa client (inchangé et re-vérifié), colonne Paiement avec acomptes, actions « Acompte reçu », carte « Acomptes encaissés ».

---
Task ID: 9
Agent: main (Z.ai Code)
Task: Repenser « Nos terrains de football » (gazon synthétique) · page Horaires & Tarifs (25 000 F/h, acompte 5 000 F, 08h–minuit) · page Calendrier public (réservations en cours/à venir) · page Contact (Kaolack-Mbour, +221 78 278 49 49) · remplacer l'icône Wave par l'image fournie sur la page de paiement.

Work Log:
- Image gazon synthétique générée via z-ai SDK (scripts/generate-gazon.ts, 1536×768) → public/gazon-synthetique.png (close-up fibres + ligne blanche, vérifiée VLM : aucun texte/artefact).
- Image Wave fournie (upload/wave.png = 332×419, pingouin bleu + wordmark « Wave » sur fond noir, identique à public/wave-icon.png) copiée → public/wave-brand.png ; intégrée TELLE QUELLE (coins arrondis) sur la page de paiement.
- Section « Nos terrains de football » repensée : bannière gazon synthétique (image + badge « 100 % gazon synthétique » + chips Éclairage nocturne/Buts avec filets/Vestiaires & douches) + cartes terrains avec icône Sprout et badge « Gazon synthétique » ; adresse → Croisement Kaolack - Mbour.
- BD : scripts/update-terrains-synthetique.ts exécuté — Terrain B « Gazon naturel » → « Gazon synthétique », Terrain C renommé « Gazon synthétique 5v5 », descriptions synthétiques, événement maintenance mis à jour (fibres) ; seed.ts aligné. Vérif : 3 terrains 25 000 FCFA/h en base.
- NOUVELLE page « Horaires & Tarifs » (horaires-page.tsx) : horaires 08:00→00:00 7j/7 avec frise horaire 08→24 + nocturnes ; tarif 25 000 FCFA/h ; « Comment payer » (acompte 5 000 F/h via Wave avec image wave-brand + solde 20 000 F/h sur place) ; tableau exemples 1h→4h (Total/Acompte/Solde) ; CTA Réserver + téléphone.
- NOUVELLE page « Calendrier » (calendrier-page.tsx) : API publique GET /api/reservations/public créée (PENDING+CONFIRMED, date ≥ aujourd'hui Dakar, créneaux terminés exclus, flag `live` calculé serveur, AUCUNE donnée sensible — ni tél ni e-mail) ; grille mensuelle date-fns fr (mois passés désactivés, +2 mois max, points colorés par statut, compte « X résa. »), détail du jour cliquable, « Prochaines réservations », légende En cours/Confirmée/En attente, polling 30 s + reprise sur visibilité (badge « Actualisation auto · HH:mm:ss », badge « X matchs en cours » pulsé).
- NOUVELLE page « Contact » (contact-page.tsx) : cartes Adresse (Croisement Kaolack - Mbour, Sénégal), Téléphone (+221 78 278 49 49, bouton Appeler tel:+221782784949), Horaires (7j/7 · 08:00→00:00) + panneau photo avec adresse en surimpression + CTA.
- landing.tsx : vues SPA 'horaires'/'calendrier'/'contact' ajoutées ; nav 6 liens (Terrains, Horaires & Tarifs, Calendrier, Le Concept, À propos, Contact) — desktop lg:flex, burger < lg, « Espace admin » visible ≥ xl ; footer : téléphone + adresse + nav complète flex-wrap ; contact CTA accueil : +221 78 278 49 49 (lien), horaires 8 h→minuit, e-mail fictif supprimé ; mentions Dakar remplacées (À propos, badge terrains, layout.tsx metadata + keywords Kaolack/Mbour/gazon synthétique).
- reservation-page.tsx : /wave-logo.png → /wave-brand.png aux 4 emplacements (badge en-tête h-4, note étape 2 h-[43px], bloc paiement étape 3 h-16, bouton « Payer » h-7) avec width/height intrinsèques 332×419 + classes h-X w-auto (ratio préservé, avertissements next/image corrigés) ; gazon-synthetique.png en loading="eager" (LCP).
- Vérifications agent-browser desktop 1440×900 : accueil (nav 6 liens, bannière gazon + 3 cartes badges, VLM OK après scroll — l'espace vide du full-screenshot initial était un artefact whileInView) ; Horaires & Tarifs (frise, cartes, tableau, VLM : « impeccable ») ; Calendrier (points colorés, détail jeu. 3 sept. avec ASC Jaraaf « En cours », « 1 match en cours », auto-sync 19:13:14 puis 19:18:12→19:18:42 = polling 30 s vérifié) ; Contact (coordonnées exactes, VLM conforme) ; réservation end-to-end : créneaux passés grisés jusqu'à 19 h (19 h 16), 22 h sélectionné → formulaire → 201 → étape 3 avec image Wave nette (VLM) → clic « Payer 5 000F CFA » → NOUVEL ONGLET https://pay.wave.com/m/M_sn_if40h6RgxkCj?amount=5000 (lien exact de l'utilisateur) ; 2 réservations de test créées puis supprimées (base revenue à 10 résas seedées).
- Vérifications mobile 375×812 : accueil + burger (8 entrées), footer en bas avec tél + adresse, Horaires empilées, Calendrier utilisable (grille + badge en cours) — VLM OK ; zéro erreur console, zéro avertissement image après correction.
- bun run lint : 0 erreur. dev.log : uniquement 200/201, aucune erreur runtime.

Stage Summary:
- ✅ « Nos terrains de football » repensés autour du gazon synthétique (bannière + badges + 3 terrains renommés en BD et dans le seed).
- ✅ Page « Horaires & Tarifs » : 08:00→minuit 7j/7, 25 000 FCFA/h, acompte 5 000 FCFA/h via Wave, solde sur place, tableau d'exemples.
- ✅ Page « Calendrier » publique : toutes les réservations en cours/à venir (sans données sensibles), auto-actualisation 30 s, badge « match en cours » en temps réel, détail par jour.
- ✅ Page « Contact » : Zalfoot — Croisement Kaolack - Mbour, Sénégal — +221 78 278 49 49 (lien tel:) + horaires ; coordonnées propagées accueil/footer/À propos/metadata.
- ✅ Icône Wave remplacée par l'image fournie (pingouin + wordmark) sur toute la page de paiement ; bouton vérifié → lien Wave exact amount=5000.
- Remarque : « acompte 50000f » du message interprété comme coquille → 5 000 F conservé (cohérent avec le lien Wave amount=5000 et les demandes précédentes).

---
Task ID: 10
Agent: main (Z.ai Code)
Task: Refonte onglet Réservations (plus de scroll horizontal, tri date+heure récentes) · bouton mode sombre · onglet Paramètres (SEO, nom & logo, e-mails de commande) · élargissement 16:9 dashboard + accueil · « Espace admin » → « Connexion ».

Work Log:
- Élargissement 16:9 : tous les conteneurs `max-w-7xl` → `max-w-[1920px]` (landing, admin-dashboard, admin-login, horaires-page, calendrier-page, contact-page, reservation-page). Vérifié : header 1920px pleins, pas d'overflow, hero/cartes bien répartis.
- Mode sombre : `next-themes` (ThemeProvider attribute="class", default light) ajouté dans layout.tsx ; NOUVEAU theme-toggle.tsx (icônes Sun/Moon masquées via CSS dark → zéro décalage d'hydratation) intégré dans le header de l'accueil, du dashboard et de la page connexion. Bloc .dark déjà présent dans globals.css. Vérifié desktop + VLM (accueil et dashboard sombres impeccables).
- « Espace admin » → « Connexion » (3 emplacements : bouton header ≥ xl, bouton hero, menu burger mobile) avec icône LogIn.
- Tri des réservations par date et heure RÉCENTES : API GET /api/reservations orderBy date DESC + startTime DESC ; section ReservationsSection : tri par défaut « Récentes » (date+heure décroissantes) + bouton de bascule « Prochaines » (aujourd'hui/futur d'abord, passés ensuite) ; libellés « Aujourd'hui »/« Demain » en vert, réservations passées estompées (opacity-55) + mention « passé », référence/source en sous-ligne compacte.
- Refonte ReservationsSection (suppression du scroll horizontal gauche) : table compacte 6 colonnes (Client+tél, Terrain ≥ xl, Créneau, Statut, Paiement, Actions) sans colonne Référence dédiée ; vue cartes empilées < md ; plus de double scroll vertical interne (le flux suit la page) ; recherche étendue au téléphone ; menu d'actions partagé. Vérifié : scrollWidth == clientWidth à 1440px (1118=1118) et 1920px (1598=1598), 11 lignes, bodyScrollX false ; mobile 375px : 11 cartes, table masquée, zéro overflow.
- Onglet Paramètres (NOUVEAU settings-section.tsx, NAV_ITEMS « Paramètres » icône Settings) :
  · Carte « Nom & logo du site » : champ nom + upload logo (POST /api/settings/logo, FormData, PNG/JPG/WebP/SVG/GIF ≤ 2 Mo → public/uploads/, upsert réglage site_logo) + bouton Réinitialiser.
  · Carte « Référencement (SEO) » : titre (70), description (320), mots-clés (400) avec compteurs + aperçu façon résultat Google ; appliqué via generateMetadata() DANS layout.tsx (lecture DB) → <title>/<meta description>/<keywords>/<icon> dynamiques (vérifié : « Zalfoot — Location de terrains… »).
  · Carte « Notifications e-mail de commande » : switch activation + adresse de réception + bloc SMTP complet (hôte, port, SSL, utilisateur, mot de passe, expéditeur, badge Configuré/À compléter) + bouton « Envoyer un e-mail de test ».
- lib/settings.ts (NOUVEAU) : clés Setting (site_name, site_logo, seo_*, notification_email, email_notifications_enabled, smtp_*), getPublicSettings/getFullSettings, validateSetting par champ. API /api/settings réécrite : GET public (siteName, siteLogo, wavePaymentLink) / GET ?full=1 (admin) / PUT partiel multi-clés validé (rétro-compatible avec payment-section : wavePaymentLink conservé).
- lib/email.ts (NOUVEAU, nodemailer installé) : sendReservationNotification (HTML + texte, client/créneau/montants/acompte/référence) branchée sur POST /api/reservations (asynchrone, catch silencieux, skip si désactivé ou SMTP incomplet) ; sendTestEmail pour le bouton de test ; timeouts de connexion 8 s.
- Brand dynamique : hook useSiteIdentity (site-settings.ts, cache module + invalidation après upload/save) → logo et alt personnalisables partout instantanément.
- Tests API curl : PUT multi-clés OK + validation (e-mail invalide rejeté) ; upload logo 201 + fichier servi 200 ; test-email sans SMTP → message clair ; POST réservation → notification e-mail sautée silencieusement (201 intact) ; tri API vérifié (10 sept → 1 sept, heures décroissantes).
- Tests agent-browser (desktop 1440×900 + 1920×1080 + mobile 375×812) : accueil large + toggle sombre (classe .dark ON, VLM OK) ; Connexion ×3 ; login → dashboard (nav 7 onglets) ; Réservations sans scroll + toggle Prochaines (Aujourd'hui 18:00→20:00, Demain 17:00→19:00) ; Paramètres (3 cartes, compteurs, aperçu Google) ; toast « Envoi impossible — SMTP incomplet… » capturé ; dashboard sombre VLM OK ; mobile : cartes réservations + Paramètres empilés, zéro overflow, footer OK ; page réservation intacte (créneaux passés grisés).
- Nettoyage : réservation et logo de test supprimés, SEO remis à « Location de terrains de football à l'heure », lint 0 erreur, dev.log sans erreur runtime.

Stage Summary:
- ✅ Onglet Réservations refait : plus AUCUN scroll horizontal (desktop table compacte + mobile cartes), colonnes fusionnées, tout visible directement.
- ✅ Réservations classées par date et heure récentes (date+heure décroissantes) + bascule « Prochaines » disponible ; « Aujourd'hui »/« Demain » mis en évidence, passés estompés.
- ✅ Bouton mode sombre partout (accueil, connexion, dashboard) avec persistance — thème sombre complet et lisible.
- ✅ Onglet Paramètres : nom & logo du site (upload instantané appliqué partout), SEO dynamique (title/meta/icon via generateMetadata), notifications e-mail de commande (adresse de réception + SMTP complet + e-mail de test). Envoi réel dès que l'admin renseigne son SMTP (Brevo/Gmail/OVH…).
- ✅ Dashboard et accueil élargis en 16:9 (conteneurs 1920px, largeur pleine vérifiée à 1920×1080).
- ✅ « Espace admin » remplacé par « Connexion » (header, hero, burger mobile).

---
Task ID: 11
Agent: main (Z.ai Code)
Task: Supprimer le « Rappel démo » du dashboard · terrains désactivés invisibles sur l'accueil · audit complet de la connexion accueil ↔ dashboard (réservations, déactivation).

Work Log:
- « Rappel démo » supprimé : bloc (MapPin + « Connecté avec admin@… » + « Créer un administrateur… ») retiré de la sidebar du dashboard (admin-dashboard.tsx) ; MapPin conservé (icône nav Terrains). Vérifié par VLM : sidebar = uniquement GESTION + 7 entrées.
- API /api/facilities?all=1 (NOUVEAU) : les admins reçoivent aussi les terrains désactivés (401 sans token) ; la route publique sans paramètre ne renvoie QUE les terrains actifs. Dashboard (loadAll) → apiFetch('/api/facilities?all=1') : la section Terrains affiche 3 cartes avec badges Actif/Inactif et boutons Désactiver/Réactiver même quand inactifs.
- Calendrier public (/api/reservations/public) : filtre facility: { active: true } ajouté — les réservations d'un terrain désactivé n'apparaissent plus sur la page Calendrier.
- Audit connexion accueil ↔ dashboard (vérifié end-to-end au navigateur) :
  · Terrains : désactivation Terrain C en BD → /api/facilities 1 seul terrain, accueil = 1 carte (pas de Terrain C), page réservation = A seulement, calendrier public sans résa C, /api/availability → 404, POST /api/reservations sur terrain désactivé → 404 « Terrain introuvable ou inactif » (création impossible).
  · Désactivation des 3 terrains depuis le dashboard (bouton Désactiver ×3) → accueil : 0 carte, stat hero « 0 », page réservation : état vide propre « Aucun terrain n'est disponible pour le moment ».
  · Réactivation des 3 terrains depuis le dashboard (Réactiver ×3) → accueil : 3 cartes + 3 boutons « Réserver ce terrain » actifs, stat hero « 3 » (après rechargement de la page — comportement attendu).
  · Réservations : réservation « Test Synchro Accueil » créée (20:00–21:00, 14 sept) → visible immédiatement sur la page Calendrier public (jour « 14 · 1 résa. » → détail « lun. 14 sept. 2026, 20:00 → 21:00, En attente, Terrain A, Test Synchro Accueil ») ; dashboard temps réel déjà vérifié (polling 10 s + toast) ; tarif 25 000 F/h + acompte 5 000 F/h pilotés par le tarif BD du terrain et le lien Wave des Paramètres.
  · Statistiques hero et section terrains de l'accueil alimentées par /api/facilities (mêmes données que le dashboard).
- Nettoyage : réservation de test supprimée (11 réservations seedées en BD), 3 terrains réactivés, lint 0 erreur, dev.log sans erreur, aucune erreur de page au navigateur.

Stage Summary:
- ✅ « Rappel démo » supprimé de la sidebar du dashboard.
- ✅ Terrains désactivés invisibles partout côté public : accueil (cartes + stats), page réservation (état vide propre), calendrier public, API availability (404) et création de résa bloquée (404) — le dashboard continue de les voir avec boutons Réactiver.
- ✅ Connexion accueil ↔ dashboard vérifiée de bout en bout : désactivation/réactivation de terrains reflétées côté public, nouvelles réservations visibles instantanément sur le calendrier public et le dashboard (temps réel), tarifs/acomptes/lien Wave pilotés par les données du dashboard.
