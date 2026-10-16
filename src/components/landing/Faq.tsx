import type { PublicSettings } from "@/lib/types";

/**
 * Questions fréquentes.
 *
 * Ce sont les objections qui empêchent d'acheter : la qualité, le format, le
 * paiement, ce qui se passe si ça rate. Les balises <details> du HTML font
 * l'accordéon sans une ligne de JavaScript — et restent ouvrables même si le
 * script de la page ne se charge pas.
 */
export function Faq({ settings }: { settings: PublicSettings }) {
  const { sheet } = settings;

  const questions = [
    {
      q: "Quelle taille doivent faire mes images ?",
      a: `L’idéal est ${sheet.idealWidthPx} × ${sheet.idealHeightPx} pixels, ce qui correspond à une carte de ${sheet.cardWidthCm} × ${sheet.cardHeightCm} cm à ${sheet.dpi} dpi. Une image plus grande ne pose aucun problème. Une image plus petite est acceptée, mais la plateforme vous signale qu’elle sera moins nette — avant que vous ne payiez.`,
    },
    {
      q: "Mon visuel n’est pas au bon format, que se passe-t-il ?",
      a: "Vous choisissez. « Remplir le cadre » agrandit le visuel jusqu’à occuper toute la carte et rogne le surplus — à utiliser si votre visuel a du fond perdu. « Image entière » garde tout le visuel et ajoute du blanc autour. L’aperçu montre le résultat avant paiement.",
    },
    {
      q: "Dans quel sens dois-je imprimer le recto-verso ?",
      a: "Comme vous voulez. Les marges étant symétriques sur les deux axes, le verso se superpose au recto que la feuille soit retournée sur le grand côté ou sur le petit. La seule consigne est d’imprimer à l’échelle 100 % — « Taille réelle » — et jamais « Ajuster à la page ».",
    },
    {
      q: "Pourquoi un espacement entre les cartes ?",
      a: `Avec ${sheet.defaultGapMm} mm d’espace, chaque carte a ses propres bords et le blanc absorbe les petits écarts d’une découpe aux ciseaux ou à la règle. À 0, les cartes sont jointives : une seule coupe droite traverse la planche, ce qui va plus vite mais suppose un massicot. Vous réglez de 0 à ${sheet.maxGapMm.toLocaleString("fr-FR")} mm.`,
    },
    {
      q: "Comment je paie ?",
      a: `Vous rechargez votre compte${
        settings.momo.mtn || settings.momo.orange ? " par MTN Mobile Money ou Orange Money" : ""
      }, puis chaque planche recto-verso débite ${settings.priceLabel}. La recharge minimale est de ${settings.minRecharge} ${settings.currency}. Votre historique affiche chaque mouvement avec le solde qui en résulte.`,
    },
    {
      q: "Et si la génération échoue ?",
      a: "Le montant vous est restitué automatiquement, et la ligne de remboursement apparaît dans votre historique. Vous ne payez que des fichiers réellement produits.",
    },
    {
      q: "Mes visuels sont-ils visibles par d’autres ?",
      a: "Non. Ils sont stockés en dehors de la médiathèque du site, dans un dossier fermé, et ne sont accessibles que par des liens signés valables deux heures, générés pour votre session. Personne ne peut tomber dessus en devinant une adresse.",
    },
    {
      q: "Puis-je refaire une planche déjà payée ?",
      a: "Oui : vos planches restent dans votre espace et se retéléchargent autant de fois que nécessaire, sans repayer. Un nouveau paiement n’intervient que pour une nouvelle génération — par exemple si vous changez l’espacement ou le visuel.",
    },
  ];

  return (
    <section id="questions" className="border-b border-line bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-wide text-magenta">Questions fréquentes</p>
        <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Ce qu’on nous demande avant de commencer.
        </h2>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {questions.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-bold">
                {item.q}
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-line text-ink-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
