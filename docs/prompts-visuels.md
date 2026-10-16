# Visuels PrinterPress — prompts et styles

Trois images se génèrent (A1, A4, C1), trois se capturent (B1, B2, B3).

La charte, à rappeler dans chaque prompt : anthracite `#232a35`, cyan
`#00a8e8`, magenta `#ec008c`, jaune `#ffc800`, fond papier `#f6f8fb`.

**Règle commune :** demander les images **sans aucun texte**. Les modèles
écrivent des lettres approximatives, et une planche de cartes de visite couverte
de faux mots ruinerait la promesse de précision. Le texte et le logo
s'ajoutent après, ou se composent avec le vrai fichier.

---

## A1 · `planche-a4.jpg` — la planche en main (1400 × 1050, 4:3)

C'est l'image qui doit faire comprendre le produit en une seconde. Un modèle ne
sait pas dessiner une grille de 10 cartes aux bonnes proportions avec des
repères de coupe : **il faut composer**.

**Méthode recommandée (2 minutes)**

1. Générer la scène *sans la feuille* avec le prompt ci-dessous.
2. Y incruster `visuels-source/planche-reelle-recto-300dpi.jpg` — la vraie
   planche sortie du moteur, 2480 × 3508 px — avec une légère perspective et
   une ombre portée. ChatGPT et Gemini acceptent tous deux une image jointe :
   « incruste cette feuille sur le plan de travail, en perspective, ombre douce ».

**Prompt (scène seule)**

```
Top-down product photography of an empty light wooden desk in a small print
shop, soft natural window light from the left, a paper trimmer and a steel
ruler pushed to the edge of the frame, a pair of hands about to place a sheet
of paper in the centre, clean uncluttered composition with large empty space in
the middle for a single A4 sheet, muted cool grey and off-white palette with
subtle cyan and magenta accents, shallow depth of field, 50mm lens, commercial
editorial photography, high detail, no text, no lettering, no printed
documents.
```

**Négatif** : `text, letters, words, logos, watermark, cluttered desk, messy, busy background, neon colors, cartoon, 3d render`

**Mots-clés Magnific** : `flat lay product photography` · `top down desk workspace` · `soft window light` · `editorial commercial shot` · `scandinavian minimal studio`

---

## A4 · `atelier-impression.jpg` — le métier (1100 × 1300, portrait 5:6)

Le visiteur doit s'y reconnaître. Une photo locale et vraie vaudrait mieux ;
à défaut, viser le documentaire, pas la banque d'images souriante.

**Prompt**

```
Environmental portrait of a Cameroonian print shop owner in his thirties
standing beside a desktop laser printer in a small bright workshop in Yaoundé,
holding a freshly printed A4 sheet up to the light to check the alignment,
focused and calm expression, not smiling at the camera, plain polo shirt,
shelves with paper reams and colour swatches softly out of focus behind him,
warm afternoon light through a window, natural skin tones, documentary
photography, 35mm lens, f/2, Kodak Portra colour rendition, vertical framing,
no text, no visible brand names.
```

**Variante** : remplacer par *a young Cameroonian woman graphic designer at her
desk, dual monitors showing a colour layout* — le second public du service.

**Négatif** : `stock photo smile, thumbs up, fake office, western corporate setting, text, logos, watermark, plastic skin, over-saturated`

**Mots-clés Magnific** : `environmental portrait documentary` · `small business owner at work` · `warm natural window light` · `35mm reportage` · `Kodak Portra film look`

---

## C1 · `partage-reseaux.jpg` — l'aperçu WhatsApp / Facebook (1200 × 630)

Visuel de partage. Le texte « 300 FCFA la planche recto-verso » et le logo
s'ajoutent **après** la génération, dans un outil de mise en page : c'est la
seule façon d'avoir une typographie nette.

**Prompt (fond seul)**

```
Wide banner background for a printing service, dark charcoal #232a35 surface
with a subtle paper grain, a soft diagonal sweep of cyan #00a8e8 and magenta
#ec008c light across the lower right, a faint grid of thin lines suggesting cut
marks in the background, large clean empty space on the left two thirds for a
logo and a headline, premium minimal graphic design, studio lighting, 16:9
banner, no text, no letters.
```

**Négatif** : `text, typography, letters, logo, watermark, busy pattern, clip art`

**Mots-clés Magnific** : `brand banner background` · `duotone CMYK gradient` · `dark minimal graphic poster` · `negative space hero background` · `studio gradient light sweep`

---

## B1 · B2 · B3 — à capturer, pas à générer

`etape-1-depot.png`, `etape-2-reglages.png`, `etape-3-telechargement.png`
(900 × 675 chacune) sont des **captures du vrai tableau de bord**. Une interface
inventée par un modèle montrerait des boutons qui n'existent pas : le visiteur
s'en apercevrait à la première connexion.

Marche à suivre, une fois connecté sur `/tableau-de-bord/planches` :

1. **B1** — la section « Vos visuels » avec les deux zones de dépôt.
2. **B2** — les réglages (espacement, cadrage, repères) à côté de l'aperçu composé.
3. **B3** — le bandeau « votre planche est prête » avec les quatre boutons de téléchargement.

Cadrer large, fenêtre à 1440 px, puis recadrer en 4:3.

---

## Réglages des outils

| Outil | Ce qui marche |
|---|---|
| **ChatGPT (GPT Image)** | Un paragraphe descriptif, pas une liste de mots-clés. Préciser le format : « format paysage 4:3 ». Joindre la planche réelle pour A1. |
| **Gemini (Nano Banana / Imagen)** | Même prompt ; excellent pour incruster une image jointe dans une scène. Lui donner la planche et demander la mise en perspective. |
| **Magnific** | Pour agrandir ensuite : *Creativity* basse (photo = fidélité), *Resemblance* haute, *HDR* basse. Les mots-clés ci-dessus servent de « style ». |

## Livraison

Déposer les fichiers dans `public/images/` **sous le nom exact** indiqué : la
zone dessinée disparaît au rechargement, sans toucher à une ligne de code.
