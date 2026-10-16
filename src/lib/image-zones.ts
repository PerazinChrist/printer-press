/**
 * Catalogue des visuels attendus par la page d'accueil.
 *
 * Tant qu'une image n'est pas fournie, la zone s'affiche comme un emplacement
 * dessiné, avec ce qu'il doit contenir et au bon format. La page reste donc
 * lisible et présentable, et la liste des visuels à produire se lit directement
 * à l'écran — personne n'a à deviner ce qui manque.
 *
 * Pour livrer une image : déposer le fichier dans /public/images/ sous le nom
 * indiqué par `file`. Le composant ImageZone l'affiche dès qu'il existe.
 */

export type ImageZoneSpec = {
  /** Identifiant court, affiché sur l'emplacement. */
  id: string;
  /** Nom de fichier attendu dans /public/images/. */
  file: string;
  /** Ce que l'image doit montrer. */
  subject: string;
  /** Pourquoi elle est là — ce qu'elle doit prouver au visiteur. */
  intent: string;
  /** Dimensions conseillées, en pixels. */
  width: number;
  height: number;
  /** Priorité : une page peut sortir sans les secondaires. */
  priority: "essentielle" | "secondaire";
};

export const IMAGE_ZONES: Record<string, ImageZoneSpec> = {
  hero: {
    id: "A1",
    file: "planche-a4.jpg",
    subject:
      "Une planche A4 imprimée, tenue à la main ou posée sur un plan de travail, montrant les 10 cartes et les repères de coupe.",
    intent:
      "Le visiteur doit comprendre le produit en une seconde, avant même de lire le titre.",
    width: 1400,
    height: 1050,
    priority: "essentielle",
  },
  stepUpload: {
    id: "B1",
    file: "etape-1-depot.png",
    subject: "Capture de l'écran de dépôt du recto et du verso dans le tableau de bord.",
    intent: "Prouver que c'est simple : deux fichiers, rien d'autre.",
    width: 900,
    height: 675,
    priority: "secondaire",
  },
  stepSettings: {
    id: "B2",
    file: "etape-2-reglages.png",
    subject:
      "Capture des réglages : espacement entre les cartes, cadrage, repères de coupe, avec l'aperçu à côté.",
    intent: "Montrer que le client garde la main sur le rendu.",
    width: 900,
    height: 675,
    priority: "secondaire",
  },
  stepDownload: {
    id: "B3",
    file: "etape-3-telechargement.png",
    subject: "Capture des fichiers livrés : PDF recto, PDF verso, PNG recto, PNG verso.",
    intent: "Lever le doute sur ce qu'on reçoit réellement après paiement.",
    width: 900,
    height: 675,
    priority: "secondaire",
  },
  audience: {
    id: "A4",
    file: "atelier-impression.jpg",
    subject:
      "Photo d'un imprimeur, d'un infographe ou d'un gérant de cybercafé au travail devant son écran ou son imprimante.",
    intent:
      "Le visiteur doit se reconnaître. Une photo locale et vraie vaut mieux qu'une banque d'images.",
    width: 1100,
    height: 1300,
    priority: "essentielle",
  },
  openGraph: {
    id: "C1",
    file: "partage-reseaux.jpg",
    subject:
      "Visuel de partage : logo PrinterPress, la planche A4, et la phrase « 300 FCFA la planche recto-verso ».",
    intent: "Ce qui s'affiche quand le lien est envoyé sur WhatsApp ou Facebook.",
    width: 1200,
    height: 630,
    priority: "secondaire",
  },
};

/** Les visuels, dans l'ordre où ils apparaissent sur la page. */
export const IMAGE_ZONE_LIST: ImageZoneSpec[] = Object.values(IMAGE_ZONES);
