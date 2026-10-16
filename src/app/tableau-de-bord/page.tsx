import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { serverGet } from "@/lib/server/wordpress";
import type { Overview } from "@/lib/types";

export const metadata: Metadata = { title: "Vue d’ensemble" };

/**
 * Première page après la connexion.
 *
 * Elle répond à trois questions, dans cet ordre : combien de planches puis-je
 * encore produire, où en sont mes dernières, et que faire maintenant.
 */
export default async function OverviewPage() {
  const overview = await serverGet<Overview>("/me/overview");

  if (!overview) {
    return (
      <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-500">
        Impossible de charger votre espace pour le moment. Rechargez la page dans un instant.
      </p>
    );
  }

  const { account, recentCards, recentSheets, transactions } = overview;
  const firstName = account.fullName.split(" ")[0] || "bienvenue";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Bonjour {firstName}.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Une planche recto-verso coûte {overview.priceLabel}. Votre solde vous en permet{" "}
              <strong className="text-ink">{overview.sheetsLeft}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/tableau-de-bord/planches">Nouvelle planche</ButtonLink>
            <ButtonLink href="/tableau-de-bord/credits" variant="ghost">
              Recharger
            </ButtonLink>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Solde", value: account.balanceLabel },
            { label: "Planches possibles", value: String(overview.sheetsLeft) },
            { label: "Cartes enregistrées", value: String(account.cardsCount) },
            { label: "Planches produites", value: String(account.sheetsCount) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-paper px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                {stat.label}
              </dt>
              <dd className="mt-1 text-2xl font-extrabold tracking-tight">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Dernières planches</h2>
            <Link href="/tableau-de-bord/planches" className="text-sm font-semibold text-ink-500 hover:text-ink">
              Tout voir
            </Link>
          </div>

          {recentSheets.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Aucune planche pour l’instant. Déposez une carte, réglez l’espacement, regardez
              l’aperçu — il est gratuit.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recentSheets.map((sheet) => (
                <li key={sheet.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{sheet.label}</p>
                    <p className="text-xs text-ink-500">
                      {sheet.gapMm} mm ·{" "}
                      {sheet.fitMode === "cover" ? "remplir le cadre" : "image entière"}
                      {sheet.cutMarks ? " · repères" : ""}
                    </p>
                  </div>
                  <a
                    href={sheet.files.frontPdf}
                    className="whitespace-nowrap text-sm font-semibold text-cyan hover:text-cyan-dark"
                  >
                    PDF recto
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Derniers mouvements</h2>
            <Link href="/tableau-de-bord/credits" className="text-sm font-semibold text-ink-500 hover:text-ink">
              Tout voir
            </Link>
          </div>

          {transactions.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Votre historique est vide. Il se remplira à votre première recharge.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{transaction.typeLabel}</p>
                    <p className="text-xs text-ink-500">
                      {new Date(transaction.createdAt.replace(" ", "T")).toLocaleDateString("fr-FR")}
                      {transaction.status === "en_attente" ? " · en attente de confirmation" : ""}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap text-sm font-bold ${
                      transaction.amount >= 0 ? "text-green" : "text-ink"
                    }`}
                  >
                    {transaction.amountLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {recentCards.length > 0 ? (
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Vos cartes</h2>
            <Link href="/tableau-de-bord/cartes" className="text-sm font-semibold text-ink-500 hover:text-ink">
              Gérer
            </Link>
          </div>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentCards.map((card) => (
              <li key={card.id} className="rounded-xl border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable. */}
                <img
                  src={card.frontUrl}
                  alt={card.name}
                  className="aspect-[86/54] w-full rounded-lg object-cover"
                />
                <p className="mt-2 truncate text-sm font-semibold">{card.name}</p>
                <p className="text-xs text-ink-500">
                  {card.sheetsCount} planche{card.sheetsCount > 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
