import { ButtonLink } from "@/components/ui/Button";
import type { PublicSettings } from "@/lib/types";

/**
 * Dernier appel.
 *
 * Une reformulation de la promesse, un bouton, et le rappel que l'aperçu est
 * gratuit : le visiteur arrivé jusqu'ici hésite rarement sur le prix, il
 * hésite sur le risque.
 */
export function FinalCta({ settings }: { settings: PublicSettings }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="cut-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          La prochaine planche que vous imprimez peut être la bonne du premier coup.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
          Créez votre compte, déposez un recto et un verso, regardez l’aperçu. Vous ne payez{" "}
          {settings.priceLabel} que si vous décidez de générer vos fichiers.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/inscription" size="lg">
            Créer ma planche — {settings.priceLabel}
          </ButtonLink>
          <ButtonLink href="/connexion" variant="ghost" size="lg">
            J’ai déjà un compte
          </ButtonLink>
        </div>

        {settings.support.phone ? (
          <p className="mt-6 text-sm text-ink-500">
            Une question avant de commencer ? Écrivez-nous au{" "}
            <a
              href={`tel:${settings.support.phone.replace(/\s+/g, "")}`}
              className="font-semibold text-ink underline decoration-cyan decoration-2 underline-offset-4"
            >
              {settings.support.phone}
            </a>
            .
          </p>
        ) : null}
      </div>
    </section>
  );
}
