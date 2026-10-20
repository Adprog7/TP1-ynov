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

## 3. Analyse des principes SOLID

### S — Single Responsibility Principle (responsabilité unique)
Avant la refactorisation, `server.ts` gérait les routes HTTP, les règles métier, l'accès aux données, le paiement et les e-mails dans les mêmes fonctions.
Après la refactorisation, ces responsabilités sont réparties entre plusieurs classes :
- `ScreeningService` : gestion des séances.
- `BookingService` : règles métier des réservations.
- `BookingStatsService` : calcul des places prises et restantes.
- `ScreeningRepository` et `BookingRepository` : accès aux données.
- `Payment` : simulation du paiement.
- `Mailer` : envoi des messages de confirmation et d'annulation.

### O — Open/Closed Principle (ouvert/fermé)
Le calcul du prix est isolé dans `price.ts`, ce qui permet de le tester et de le modifier sans réécrire les routes HTTP.
Cependant, l'ajout de nouvelles règles tarifaires nécessite encore de modifier `calculatePrice`.

### L — Liskov Substitution Principle (substitution de Liskov)
Ce principe est peu concerné par le projet : les classes utilisées ne reposent pas sur une hiérarchie d'héritage métier.
`BookingError` hérite de `Error` et conserve son comportement général d'erreur.

### I — Interface Segregation Principle (ségrégation des interfaces)
Le projet n'utilise pas encore d'interfaces TypeScript dédiées. Les services dépendent directement des classes concrètes des repositories, du paiement et du mailer.
Il serait possible de définir des interfaces pour faciliter le remplacement de ces dépendances et les tests.

### D — Dependency Inversion Principle (inversion des dépendances)
La séparation en services et repositories améliore l'organisation du code.
Cependant, les services instancient directement leurs dépendances avec `new`. Ils restent donc couplés aux implémentations concrètes, notamment pour le paiement et l'accès aux données.
Une amélioration possible serait d'injecter ces dépendances dans les constructeurs.


## 4. Graphe des dépendances

### Graphe des dépendances de `POST /screenings/:id/bookings`

```text
POST /screenings/:id/bookings
└── presentation/routes.ts
    └── BookingService
        ├── ScreeningRepository
        │   └── JsonDatabase
        │       └── fs (lecture du fichier JSON)
        ├── BookingRepository
        │   └── JsonDatabase
        │       └── fs (lecture et écriture du fichier JSON)
        ├── BookingStatsService
        │   └── BookingRepository
        │       └── JsonDatabase → fs
        ├── price.ts
        │   └── calculatePrice()
        ├── Payment
        │   └── Math.random()
        ├── Mailer
        │   └── console.log()
        ├── new Date()
        │   └── Vérification de la date de séance et création de createdAt
        ├── Date.now()
        │   └── Génération de l'identifiant de réservation
        └── BookingError
            └── Traduction en réponse HTTP dans routes.ts
```

Les dépendances sont instanciées ou appelées directement dans le code. Sans mécanisme d'injection ou de remplacement, elles sont donc difficiles à substituer dans les tests.

```

### Lecture du graphe

- `server.ts` reçoit les requêtes HTTP et délègue le travail aux services.
- Les services appliquent les règles métier.
- Les repositories gèrent l'accès aux données JSON via `JsonDatabase`.
- `BookingStatsService` centralise les calculs de places.
- `Payment` et `Mailer` isolent respectivement le paiement simulé et les messages.
- `price.ts` contient une fonction indépendante pour calculer les tarifs.

### Limite actuelle

Les services créent eux-mêmes leurs dépendances avec `new`. Le graphe montre donc une séparation des responsabilités, mais pas encore une inversion complète des dépendances.


### Remplacement des dépendances dans les tests

| Dépendance | Rôle | Remplaçable sans modifier le code ? |
| `new Date()` | Vérifier si la séance a commencé et créer les dates | Pas directement par injection. Des mocks peuvent toutefois permettre de contrôler l'heure utilisée dans les tests. |
| `Date.now()` | Générer l'identifiant de réservation | Pas directement par injection. Des mocks peuvent permettre de contrôler la valeur retournée. |
| `Math.random()` | Simuler l'acceptation ou le refus du paiement | Pas directement par injection. La fonction peut néanmoins être simulée dans les tests. |
| `fs` | Lire et écrire `data/db.json` | Pas directement par injection. Les appels au système de fichiers peuvent être simulés avec des mocks. |
| `console.log` | Simuler l'envoi des e-mails | Pas directement par injection. Les appels peuvent être interceptés ou simulés dans les tests. |
| `BookingRepository` | Lire et enregistrer les réservations | Pas remplaçable par une autre implémentation via injection, car le service instancie directement le repository avec `new`. |
| `ScreeningRepository` | Rechercher la séance | Pas remplaçable par une autre implémentation via injection, car le service instancie directement le repository avec `new`. |
| `calculatePrice` | Calculer le tarif | La fonction pure peut être testée indépendamment. Son remplacement dans `BookingService` est moins simple, car elle est importée directement. |
| `BookingError` | Représenter les erreurs métier | Le service construit directement cette classe. Son remplacement par une autre implémentation n'est pas prévu dans le code actuel. |

Ces dépendances sont difficiles à remplacer directement, car le code ne prévoit pas de mécanisme d'injection de dépendances. Certaines peuvent néanmoins être simulées avec des mocks. Une injection de dépendances permettrait de remplacer plus facilement les repositories, le paiement et le mailer, tandis qu'une abstraction de l'horloge faciliterait les tests liés aux dates.

### Conclusion

Le découpage en couches facilite la compréhension et les tests. Cependant, certaines dépendances concrètes restent directement instanciées par les services. Au TP1, le calcul du prix et celui des places restantes sont testés avec Vitest. Les autres règles métier pourraient être testées plus facilement en isolant davantage les dépendances au temps, au hasard, au disque et aux notifications. L'injection de dépendances et l'extraction de fonctions métier pures permettraient d'écrire des tests unitaires plus fiables sans démarrer le serveur ni modifier la base JSON.


## 5. Bilan de la testabilité

### Règles testables sans démarrer le serveur ni modifier la base JSON

- Le calcul du prix normal, avec le tarif étudiant et la remise de groupe : la fonction `calculatePrice` est pure. Elle dépend uniquement de ses paramètres et peut être testée avec Vitest.
- Le calcul du nombre de places restantes : `countRemainingSeats` peut être testé directement avec une capacité et un nombre de places prises.
- Les autres règles métier, comme la validation de l'e-mail, le nombre de places autorisées, la capacité disponible ou les conditions d'annulation, pourraient être testées de manière isolée si elles étaient extraites dans des fonctions pures ou si leurs dépendances étaient remplaçables.

### Règles qui restent difficiles à tester isolément

- La disponibilité réelle des places dépend des réservations lues dans le fichier JSON.
- La recherche d'une séance ou d'une réservation dépend des données persistées.
- Le paiement dépend de `Math.random()` : son résultat n'est pas contrôlable facilement depuis un test sans modifier le code.
- Les règles liées à la date dépendent de l'heure réelle fournie par `new Date()`.
- L'enregistrement des réservations dépend de l'écriture sur le disque via `fs`.
- Les notifications dépendent de `console.log`, qui simule l'envoi des e-mails.

### Conclusion

Le découpage en couches facilite la compréhension et les tests. Cependant, certaines dépendances concrètes restent directement instanciées par les services. Au TP1, le calcul du prix et celui des places restantes sont testés avec Vitest. Les autres règles métier pourraient être testées plus facilement en isolant davantage les dépendances au temps, au hasard, au disque et aux notifications. L'injection de dépendances et l'extraction de fonctions métier pures permettraient d'écrire des tests unitaires plus fiables sans démarrer le serveur ni modifier la base JSON.