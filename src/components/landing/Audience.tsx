import { ImageZone } from "@/components/ImageZone";
import { IMAGE_ZONES } from "@/lib/image-zones";
import type { PublicSettings } from "@/lib/types";

/**
 * Pour qui.
 *
 * Trois métiers nommés, avec le gain propre à chacun. Un visiteur qui se
 * reconnaît dans une ligne lit la suite ; une promesse adressée à « tout le
 * monde » ne parle à personne.
 */
export function Audience({ settings }: { settings: PublicSettings }) {
  const profiles = [
    {
      title: "Imprimeurs et cybercafés",
      body: `Vous imprimez pour vos clients toute la journée. Une planche prête en deux minutes, c’est une commande traitée pendant que le client attend — et plus de rames gâchées à cause d’un verso décalé.`,
    },
    {
      title: "Infographes et freelances",
      body: "Vous livrez le visuel, pas le calage. La planche sort de la plateforme au format exact, et vous envoyez un PDF que n’importe quel imprimeur sait ouvrir.",
    },
    {
      title: "Entrepreneurs et commerçants",
      body: `Vous imprimez vos propres cartes, parfois dix à la fois. ${settings.priceLabel} la planche, sans logiciel à acheter ni gabarit à télécharger.`,
    },
  ];

  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cyan">Pour qui</p>

          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Fait pour ceux qui impriment eux-mêmes.
          </h2>

          <div className="mt-8 space-y-6">
            {profiles.map((profile) => (
              <div key={profile.title} className="border-l-4 border-line pl-5">
                <h3 className="font-bold">{profile.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{profile.body}</p>
              </div>
            ))}
          </div>
        </div>

        <ImageZone zone={IMAGE_ZONES.audience} />
      </div>
    </section>
  );
}
