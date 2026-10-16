"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { authRequest } from "@/lib/api";
import type { Account } from "@/lib/types";

/**
 * En-tête du site.
 *
 * Trois choses y tiennent, dans cet ordre d'importance : le prix, le modèle
 * d'exemple, et l'état de la session. Un visiteur déjà connecté ne doit pas
 * retrouver « Se connecter » en haut de page — c'est le signe le plus sûr
 * qu'un site a perdu de vue qui le consulte.
 */

const LINKS = [
  { href: "#etapes", label: "Comment ça marche" },
  { href: "#questions", label: "Questions" },
];

export function SiteHeader({
  priceLabel,
  account,
}: {
  priceLabel: string;
  account: Account | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);

    try {
      await authRequest("logout");
    } finally {
      setOpen(false);
      setLeaving(false);
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo-mark.png"
            alt="PrinterPress"
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-lg object-contain"
          />
          <span className="text-lg font-extrabold tracking-tight">
            Printer<span className="text-cyan">Press</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}

          <a
            href="/modele-printerpress.pdf"
            download
            className="flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-magenta"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-[10px] font-bold text-white">
              PDF
            </span>
            Modèle d’exemple
          </a>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {account ? (
            <>
              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                className="text-sm font-semibold text-ink-500 transition-colors hover:text-ink"
              >
                {leaving ? "…" : "Déconnexion"}
              </button>
              <ButtonLink href="/tableau-de-bord" variant="secondary">
                Mon espace · {account.balanceLabel}
              </ButtonLink>
            </>
          ) : (
            <>
              <Link href="/connexion" className="text-sm font-semibold text-ink hover:text-magenta">
                Se connecter
              </Link>
              <ButtonLink href="/inscription">Créer ma planche — {priceLabel}</ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-line p-2 lg:hidden"
          aria-expanded={open}
          aria-label="Ouvrir le menu"
        >
          <span className="block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink-500"
              >
                {link.label}
              </a>
            ))}
            <a href="/modele-printerpress.pdf" download className="text-sm font-semibold text-ink">
              Télécharger le modèle d’exemple (PDF)
            </a>
          </nav>

          <div className="mt-4 flex flex-col gap-2">
            {account ? (
              <>
                <ButtonLink href="/tableau-de-bord" variant="secondary" className="w-full">
                  Mon espace · {account.balanceLabel}
                </ButtonLink>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink-500"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <ButtonLink href="/inscription" className="w-full">
                  Créer ma planche — {priceLabel}
                </ButtonLink>
                <ButtonLink href="/connexion" variant="ghost" className="w-full">
                  Se connecter
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="ink-rule" />
    </header>
  );
}
