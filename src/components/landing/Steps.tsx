import { ImageZone } from "@/components/ImageZone";
import { ButtonLink } from "@/components/ui/Button";
import { IMAGE_ZONES } from "@/lib/image-zones";
import type { PublicSettings } from "@/lib/types";

/**
 * Le plan en trois étapes.
 *
 * Le visiteur doit voir le chemin entier avant de s'engager : ce qu'il donne,
 * ce qu'il règle, ce qu'il reçoit. Le paiement apparaît à sa vraie place — à la
 * troisième étape, après l'aperçu.
 */
export function Steps({ settings }: { settings: PublicSettings }) {
  const { sheet } = settings;

  const steps = [
    {
      zone: IMAGE_ZONES.stepUpload,
      title: "Déposez le recto et le verso",
      body: `Deux images, JPG, PNG ou WebP. La définition idéale est ${sheet.idealWidthPx} × ${sheet.idealHeightPx} px — la carte à ${sheet.dpi} dpi. En dessous, la plateforme vous prévient avant que vous ne payiez.`,
    },
    {
      zone: IMAGE_ZONES.stepSettings,
      title: "Réglez, puis regardez l’aperçu",
      body: `Espacement entre les cartes de 0 à ${sheet.maxGapMm.toLocaleString("fr-FR")} mm, cadrage « remplir le cadre » ou « image entière », repères de coupe. L’aperçu est gratuit et montre la planche réelle.`,
    },
    {
      zone: IMAGE_ZONES.stepDownload,
      title: `Générez pour ${settings.priceLabel}`,
      body: "Vous recevez quatre fichiers : le PDF du recto, celui du verso, et les deux planches en PNG 300 dpi. Ils restent dans votre espace, téléchargeables autant de fois que nécessaire.",
    },
  ];

  return (
    <section id="etapes" className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-cyan">En trois étapes</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Vous apportez deux images. Vous repartez avec une planche prête pour le massicot.
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col">
              <ImageZone zone={step.zone} className="mb-5" />

              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-magenta text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-500">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-line bg-paper px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-base font-medium leading-relaxed">
            Vos cartes restent enregistrées : la fois suivante, une nouvelle planche se produit en
            deux clics, sans rien redéposer.
          </p>
          <ButtonLink href="/inscription" size="lg">
            Commencer maintenant
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
