# Audit du code legacy CinéResa

Fichier analysé : `src/server.ts` (151 lignes).

## 1. Cartographie des responsabilités

Légende : **PRÉS** = présentation (HTTP), **MÉTIER** = règle métier, **DATA** = accès aux données, **INFRA** = mail, paiement, temps, hasard.

| Lignes | Bloc de code | Responsabilité |
|---|---|---|
| 3-8 | imports, `express()`, `express.json()` | PRÉS (configuration HTTP) |
| 10 | `DB_FILE` (chemin du fichier JSON) | DATA |
| 12-18 | `readDb`, `writeDb` | DATA (lecture et écriture du disque via `fs`) |
| 23, 42-43 | déclaration de la route `GET /screenings`, `res.json` | PRÉS |
| 24 | `readDb()` | DATA |
| 25 | `new Date()` | INFRA (temps) |
| 27-28 | parcours des séances, ignorer celles déjà commencées | MÉTIER (+ INFRA temps) |
| 29-32 | calcul des places prises | MÉTIER |
| 33-40 | construction de l'objet séance, `remaining = capacity - taken` | MÉTIER (+ formatage de réponse) |
| 49 | déclaration de la route `POST /screenings/:id/bookings` | PRÉS |
| 50-51 | `readDb()`, recherche de la séance | DATA |
| 52 | séance introuvable : 404 | PRÉS (+ MÉTIER) |
| 54-57 | validation de l'email, 400 | MÉTIER (règle de validation) + PRÉS (400) |
| 59-62 | validation de `seats` (1 à 6), 400 | MÉTIER + PRÉS (400) |
| 64-66 | séance déjà commencée, 409 | MÉTIER + INFRA (temps) + PRÉS (409) |
| 68-75 | places restantes et capacité, 409 | MÉTIER + PRÉS (409) |
| 77-81 | calcul du prix (tarif étudiant, remise groupe) | MÉTIER |
| 83-85 | paiement (`Math.random`), 402 | INFRA (paiement, hasard) + PRÉS (402) |
| 87-96 | création de l'objet réservation (id, statut, dates) | MÉTIER + INFRA (`Date.now`, `new Date`) |
| 97-98 | `push` + `writeDb` | DATA |
| 100-104 | e-mail de confirmation (`console.log`) | INFRA (mail) |
| 106 | `res.status(201).json(booking)` | PRÉS |
| 112 | déclaration de la route `DELETE /bookings/:id` | PRÉS |
| 113-114 | `readDb()`, recherche de la réservation | DATA |
| 115-116 | introuvable (404), déjà annulée (409) | MÉTIER + PRÉS |
| 118 | recherche de la séance | DATA |
| 119-122 | annulation impossible à moins de 2h, 409 | MÉTIER + INFRA (temps) + PRÉS |
| 124-126 | passage à `CANCELLED`, `cancelledAt`, `writeDb` | MÉTIER + INFRA (temps) + DATA |
| 128 | e-mail d'annulation | INFRA (mail) |
| 129 | `res.json(b)` | PRÉS |
| 135 | déclaration de la route `GET /bookings` | PRÉS |
| 136-137 | `readDb()`, filtre par email | DATA |
| 138-143 | jointure réservation + séance, `res.json` | MÉTIER (jointure) + PRÉS |
| 146-149 | port, `app.listen` | PRÉS (démarrage) |
| 151 | `export default app` | PRÉS |

**Synthèse :** presque chaque route mélange HTTP, règles métier, accès disque, temps, hasard et mail dans une seule fonction. Aucune responsabilité n'est isolée.

## 2. Code smells

| # | Smell | Lignes | Conséquence concrète |
|---|---|---|---|
| 1 | **Duplication** du calcul des places prises | 29-32 et 69-72 | Si la règle change (nouveau statut, places bloquées), il faut penser à la modifier aux deux endroits. Sinon la liste affiche des places qui ne sont pas réservables. |
| 2 | **God function** : le handler POST fait tout | 49-107 | Validation, règles, prix, paiement, écriture, mail et HTTP sont mélangés. Impossible de tester ou réutiliser une règle isolément. |
| 3 | **Nombres magiques** | `6` (60), `0.7` (79), `4` et `0.9` (81), `0.05` (84), `2 * 60 * 60 * 1000` (120) | Le sens de ces valeurs n'est pas lisible. Changer une remise oblige à chercher chaque occurrence. |
| 4 | **Dépendances cachées non contrôlables** (`Math.random`, `new Date`, `fs`, `console.log`) | 25, 28, 64, 84, 88, 95, 119, 125 ; 13, 17 ; 101-104, 128 | Le paiement échoue au hasard (constaté pendant les tests : 402 sans raison). Les résultats dépendent de l'heure réelle et du disque. On ne peut pas écrire de test fiable sans modifier le code. |
| 5 | **Typage `any`** | 12, 16, 51, 114, 118, 137, 139, 140 | TypeScript ne détecte aucune faute de frappe (`b.seat` au lieu de `b.seats`). L'erreur n'apparaît qu'à l'exécution. |
| 6 | **Identifiant fragile** `"b" + Date.now()` | 88 | Deux réservations dans la même milliseconde auraient le même id : l'annulation toucherait la mauvaise. |
| 7 | **Cas non géré** : séance introuvable dans le DELETE | 118-119 | Si la séance d'une réservation n'existe plus, `s` est `undefined` et `s.startsAt` fait planter la route (erreur 500). `GET /bookings` gère ce cas (ligne 141), pas le DELETE : incohérence. |
| 8 | **Codes HTTP et messages dispersés** | 52, 56, 61, 65, 74, 85, 115, 116, 121 | Pour changer un message ou un code, il faut parcourir toutes les routes. Rien ne garantit la cohérence. |
| 9 | **Logique métier dans la couche HTTP** | 52-85, 115-122 | Les règles ne sont pas réutilisables hors d'Express (autre interface, tâche planifiée, test unitaire). |