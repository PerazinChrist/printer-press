import { ImageZone } from "@/components/ImageZone";
import { ButtonLink } from "@/components/ui/Button";
import { IMAGE_ZONES } from "@/lib/image-zones";
import type { PublicSettings } from "@/lib/types";

/**
 * Promesse d'ouverture.
 *
 * Une seule promesse, vérifiable, dans le titre ; le prix juste en dessous, et
 * un seul bouton qui compte. Le visiteur doit pouvoir dire ce que fait le
 * service et combien il coûte après cinq secondes de lecture.
 */
export function Hero({ settings }: { settings: PublicSettings }) {
  const { sheet } = settings;

  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div className="cut-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-500">
            <span className="h-2 w-2 rounded-full bg-magenta" />
            Imprimeurs · Infographes · Entrepreneurs
          </p>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Vos cartes de visite recto-verso,
            <span className="block text-cyan">prêtes à imprimer en 2 minutes.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
            Déposez le recto et le verso. PrinterPress compose la planche {sheet.pageFormat} de{" "}
            {sheet.perPage} cartes à {sheet.dpi} dpi, repères de coupe compris — et le verso tombe
            pile sur le recto, quel que soit le sens de retournement de votre imprimante.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/inscription" size="lg">
              Créer ma planche — {settings.priceLabel}
            </ButtonLink>

            {/* Le modèle est le moyen le plus court de lever le doute : on
                l'imprime chez soi et on juge l'alignement soi-même. */}
            <a
              href="/modele-printerpress.pdf"
              download
              className="inline-flex items-center justify-center gap-3 rounded-full border border-line bg-white px-7 py-3.5 text-base font-bold transition-colors hover:border-ink-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[10px] font-bold text-white">
                PDF
              </span>
              Tester avec le modèle
            </a>
          </div>

          <p className="mt-4 text-sm text-ink-500">
            Le modèle est une vraie planche recto-verso, gratuite : imprimez-la pour vérifier votre
            imprimante avant de payer quoi que ce soit. Ensuite, l’aperçu de vos propres cartes
            reste gratuit lui aussi — vous ne payez {settings.priceLabel} qu’à la génération.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
            {[
              { value: `${sheet.perPage} cartes`, label: `par page ${sheet.pageFormat}` },
              { value: `${sheet.dpi} dpi`, label: "qualité imprimeur" },
              { value: "PDF + PNG", label: "recto et verso" },
              { value: "≤ 0,08 mm", label: "d’écart recto-verso" },
            ].map((item) => (
              <div key={item.value}>
                <dt className="text-xl font-extrabold tracking-tight">{item.value}</dt>
                <dd className="text-xs leading-tight text-ink-500">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <ImageZone zone={IMAGE_ZONES.hero} priority className="shadow-[0_30px_80px_-40px_rgba(35,42,53,0.6)]" />

          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-line bg-white px-5 py-4 shadow-lg sm:block">
            <p className="text-3xl font-extrabold leading-none text-magenta">
              {settings.price}
              <span className="ml-1 text-sm font-bold text-ink-500">FCFA</span>
            </p>
            <p className="mt-1 text-xs font-medium text-ink-500">la planche recto-verso</p>
          </div>
        </div>
      </div>
    </section>
  );
}
