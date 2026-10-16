import Image from "next/image";
import Link from "next/link";

import type { PublicSettings } from "@/lib/types";

/**
 * Pied de page.
 *
 * Le support est annoncé avec un vrai numéro dès qu'il est renseigné dans les
 * réglages du plugin : un service qui prend de l'argent doit montrer où le
 * joindre quand quelque chose cloche.
 */
export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white">
      <div className="ink-rule" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="PrinterPress"
              width={44}
              height={44}
              className="h-10 w-10 rounded-lg bg-white object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight">PrinterPress</span>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Impression &amp; création graphique. La plateforme compose vos planches de cartes de
            visite recto-verso, prêtes à imprimer et à découper — {settings.priceLabel} la planche.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">Le service</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <a href="#etapes" className="hover:text-cyan">
                Comment ça marche
              </a>
            </li>
            <li>
              <a href="/modele-printerpress.pdf" download className="hover:text-cyan">
                Modèle d’exemple (PDF)
              </a>
            </li>
            <li>
              <a href="#questions" className="hover:text-cyan">
                Questions fréquentes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">Votre espace</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/inscription" className="hover:text-cyan">
                Créer un compte
              </Link>
            </li>
            <li>
              <Link href="/connexion" className="hover:text-cyan">
                Se connecter
              </Link>
            </li>
            {settings.support.phone ? (
              <li>
                <a href={`tel:${settings.support.phone.replace(/\s+/g, "")}`} className="hover:text-cyan">
                  {settings.support.phone}
                </a>
              </li>
            ) : null}
            {settings.support.email ? (
              <li>
                <a href={`mailto:${settings.support.email}`} className="hover:text-cyan">
                  {settings.support.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PrinterPress — Vos idées, nos impressions.</p>
          <p>
            Planches A4 · {settings.sheet.perPage} cartes de {settings.sheet.cardWidthCm} ×{" "}
            {settings.sheet.cardHeightCm} cm · {settings.sheet.dpi} dpi
          </p>
        </div>
      </div>
    </footer>
  );
}
