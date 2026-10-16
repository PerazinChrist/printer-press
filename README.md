# PrinterPress — V1

Plateforme de composition de **planches d'impression pour cartes de visite
recto-verso**. Le client dépose un recto et un verso ; la plateforme rend deux
PDF A4 (et deux PNG) à 300 dpi, dix cartes par page, repères de coupe compris,
recto et verso superposés. **300 FCFA la planche.**

La V1 ne fait que ce service. Rien d'autre n'est annoncé ni promis.

## Les deux moitiés du projet

| | Où | Rôle |
|---|---|---|
| **Front** | ce dépôt (Next.js 16, React 19, Tailwind 4) | Page d'accueil et tableau de bord client. |
| **Backend** | `C:\xampp\htdocs\simplyprint\wp-content\plugins\printerpress-core` | Comptes, moteur d'imposition, crédits, administration. |

Le navigateur ne parle jamais directement à WordPress : il appelle
`/api/pp/…`, une route de ce projet qui ajoute la clé d'API et le jeton de
session — tous deux rangés côté serveur, hors d'atteinte du JavaScript de la
page.

## Mise en route

1. **Activer le plugin** dans WordPress, puis ouvrir *PrinterPress › Réglages* :
   prix, numéros Mobile Money, identifiant Google, et la clé d'API à recopier.
2. **Configurer le front** :

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Valeur |
   |---|---|
   | `PP_API_URL` | `http://localhost/simplyprint/wp-json/pp/v1` |
   | `PP_API_KEY` | la clé affichée dans les réglages du plugin |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | le même identifiant que dans les réglages |

3. **Lancer** :

   ```bash
   npm run dev
   ```

Sans `.env.local`, la page d'accueil s'affiche quand même, avec les valeurs de
lancement (300 FCFA, géométrie standard) : c'est voulu, une page d'accueil ne
doit pas dépendre d'une base de données pour exister. Le tableau de bord, lui,
a besoin de l'API.

## Structure

```
src/
  app/
    page.tsx                  page d'accueil
    (auth)/connexion|inscription
    tableau-de-bord/          vue d'ensemble, cartes, planches, crédits, compte
    api/pp/[...path]          relais vers l'API du plugin
    api/auth/[action]         ouverture et fermeture de session (cookie httpOnly)
  components/
    landing/                  sections de la page d'accueil
    dashboard/                atelier, cartes, porte-monnaie, compte
    auth/                     formulaire et bouton Google
    ui/, ImageZone.tsx
  lib/
    server/wordpress.ts       pont serveur vers le plugin
    server/session.ts         cookie de session
    api.ts                    client HTTP du navigateur
    image-zones.ts            catalogue des visuels à produire
    types.ts
  proxy.ts                    garde d'entrée du tableau de bord
```

## Paiement

Trois modes, choisis dans *PrinterPress › Réglages* :

| Mode | Ce que vit le client |
|---|---|
| **manuel** | Il verse au numéro Mobile Money affiché, déclare sa référence, vous confirmez depuis *Transactions*. |
| **sebpay** | La demande part sur son téléphone, il valide, son solde augmente dans la seconde. |
| **simulation** | Les mêmes écrans, mais c'est lui qui choisit l'issue. Pour la recette, sans clés ni argent. |

Le mode SebPay demande les clés de https://new.sebpay.bj : elles restent dans
WordPress — c'est lui qui appelle SebPay, jamais le navigateur — et l'adresse IP
de sortie du serveur doit être déclarée chez SebPay (le bouton « Tester la
connexion » l'affiche). Sans clés valides, le mode retombe tout seul sur
« manuel » : le client n'arrive jamais dans un formulaire qui échoue au dernier
clic. Le déclaratif manuel reste accessible même quand SebPay fonctionne — un
opérateur en panne ne doit pas fermer la caisse.

Deux chemins ramènent l'issue d'un paiement : le rappel signé de SebPay
(webhook) et le sondage du navigateur. Les deux peuvent arriver ensemble ; le
règlement est protégé par une écriture conditionnelle, et un paiement ne crédite
qu'une fois. C'est le montant **réellement encaissé** qui est porté au solde,
jamais celui qui avait été demandé.

## Le parcours « Mes planches »

Tout se fait sur un seul écran : on y dépose le recto et le verso (glisser-
déposer ou clic), la carte est créée dès que les deux faces sont là, et
l'aperçu se compose aussitôt — puis se recompose à chaque réglage. Un client
qui revient peut reprendre une carte déjà déposée en basculant sur « Carte
enregistrée ». L'écran *Mes cartes* reste là pour renommer, remplacer une face
ou faire le ménage.

## Mesure d'audience

Le composant `Tracker` (posé une fois dans la mise en page racine) envoie les
pages vues, le temps passé et la profondeur de lecture au relais
`/api/pp/collect`. Les événements métier — inscription, connexion, carte
déposée, aperçu, planche générée avec son montant, recharge — partent par
`trackEvent()` depuis les composants concernés.

Tout se lit dans WordPress › **Audience** : vue d'ensemble, pages, sources
(utm), événements, temps réel, et un entonnoir « du visiteur à la planche
payée » qui montre où les gens s'arrêtent. Rien d'identifiant n'est conservé :
clé visiteur aléatoire, pas d'adresse IP en clair, paramètres d'URL retirés des
chemins. « Do Not Track » est respecté par défaut.

## Codes promo

Créés dans *PrinterPress › Codes promo*. Deux familles :

| Famille | Effet | Où le client le saisit |
|---|---|---|
| **Remise** | Réduit le prix d'une planche — en pourcentage, d'un montant fixe, ou 100 % pour l'offrir. | Dans l'atelier, avant de générer. |
| **Crédit offert** | Porte une somme directement au solde. | Page *Crédits*, encadré « Code cadeau ». |

Chaque code a une fenêtre de dates, un quota global et un quota par client ; les
utilisations sont consignées. Le code est **revalidé au moment de facturer** et
le prix remisé recalculé côté serveur — ce que le navigateur annonce comme prix
n'entre jamais dans un débit. Un code n'est consommé qu'une fois la planche
réellement livrée : une génération qui échoue le laisse disponible.

## Modèle d'exemple

`public/modele-printerpress.pdf` est une vraie planche recto-verso (2 pages A4,
300 dpi) proposée au téléchargement depuis l'en-tête, le héros et le pied de
page. Les deux faces portent une mire au même endroit : imprimée en recto-verso,
elles doivent se superposer par transparence. C'est la démonstration la plus
courte du service — et elle ne coûte rien à personne.

Pour la régénérer après un changement de géométrie, rejouer le script
`modele.php` du dossier de travail (il compose les deux faces puis écrit le PDF
via `PP_PDF::from_jpegs`).

## Visuels à fournir

Les emplacements d'images s'affichent sur la page d'accueil sous forme de
cadres dessinés, avec le sujet attendu et le format. Pour en livrer un :
déposer le fichier dans `public/images/` **sous le nom exact indiqué** — il
remplace l'emplacement au rechargement, sans toucher au code.

| Réf. | Fichier | Sujet | Format |
|---|---|---|---|
| A1 | `planche-a4.jpg` | Une planche A4 imprimée, tenue en main ou posée sur un plan de travail, montrant les 10 cartes et les repères de coupe. | 1024 × 1280 ✓ |
| A4 | `atelier-impression.jpg` | Un imprimeur, infographe ou gérant de cybercafé au travail. | 1024 × 1280 ✓ |
| B1 | `etape-1-depot.png` | Capture de l'écran de dépôt du recto et du verso. | 900 × 675 ✓ |
| B2 | `etape-2-reglages.png` | Capture des réglages avec l'aperçu. | 900 × 675 ✓ |
| B3 | `etape-3-telechargement.png` | Capture des quatre fichiers livrés. | 900 × 675 ✓ |
| C1 | `partage-reseaux.jpg` | Visuel de partage WhatsApp / Facebook. | 1424 × 752 ✓ |

Les six visuels sont livrés (✓). Pour en remplacer un : déposer le fichier
sous le même nom, la page le reprend au rechargement.

## Géométrie, vérifiée

Mesures relevées sur une planche réellement produite par le moteur, espacement
3 mm :

| | Valeur |
|---|---|
| Carte | 8,600 × 5,400 cm |
| Grille | 17,50 × 28,20 cm (2 × 5) |
| Marges gauche / droite | 1,750 cm — identiques |
| Marges haut / bas | 0,750 cm — identiques |
| Planche | 2480 × 3508 px à 300 dpi |
| Écart résiduel | ≤ 0,08 mm (1 pixel) |

L'espacement est réglable de 0 à 4,2 mm. Le maximum vient de la contrainte
verticale : cinq rangées de 5,4 cm plus quatre espaces, en gardant 5 mm de
marge en haut et en bas.

## À l'impression

Échelle **100 %** / « Taille réelle ». Jamais « Ajuster à la page » : c'est la
seule chose qui puisse encore introduire un décalage.
