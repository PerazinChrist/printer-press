import Image from "next/image";
import Link from "next/link";

import { getPublicSettings } from "@/lib/server/wordpress";

/**
 * Cadre des pages de connexion et d'inscription.
 *
 * La colonne de gauche rappelle ce qu'on vient chercher et combien ça coûte :
 * l'inscription est le moment où l'on doute, et un formulaire seul sur fond
 * blanc laisse ce doute sans réponse.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const { sheet } = settings;

  const points = [
    `${sheet.perPage} cartes de ${sheet.cardWidthCm} × ${sheet.cardHeightCm} cm par planche ${sheet.pageFormat}`,
    `Recto et verso superposés, ${sheet.dpi} dpi, repères de coupe`,
    "Aperçu gratuit : vous voyez la planche avant de payer",
    `${settings.priceLabel} la planche recto-verso, sans abonnement`,
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div className="cut-grid pointer-events-none absolute inset-0 opacity-10" />

        <Link href="/" className="relative flex items-center gap-3">
          <Image
            src="/logo-mark.png"
            alt="PrinterPress"
            width={48}
            height={48}
            className="h-11 w-11 rounded-lg bg-white object-contain"
          />
          <span className="text-lg font-extrabold tracking-tight">PrinterPress</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-extrabold leading-tight tracking-tight">
            Vos planches de cartes de visite, justes du premier coup.
          </h2>

          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-white/80">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-cyan" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Vos idées, nos impressions.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image
              src="/logo-mark.png"
              alt="PrinterPress"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-extrabold tracking-tight">PrinterPress</span>
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
}
