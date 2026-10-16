"use client";

import { useState } from "react";

import type { Affiliation } from "@/lib/types";

/**
 * Espace affiliation : codes, ventes apportées, gains.
 *
 * L'affilié cherche d'abord une seule chose — combien lui reste-t-il à
 * recevoir. C'est donc le chiffre de gauche, et le reste du tableau sert à le
 * justifier ligne par ligne.
 */
export function AffiliationPanel({ affiliation }: { affiliation: Affiliation }) {
  const { codes, earnings, totals, rate, since } = affiliation;
  const [copied, setCopied] = useState("");

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      // Le presse-papiers peut être refusé : le code reste lisible à l'écran.
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Reste à percevoir", value: totals.dueLabel },
          { label: "Déjà versé", value: totals.paidLabel },
          { label: "Gains cumulés", value: totals.totalLabel },
          {
            label: "Ventes apportées",
            value: `${totals.sales}`,
            hint: `${totals.clients} client${totals.clients > 1 ? "s" : ""} · ${totals.volumeLabel} encaissés`,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">{stat.value}</p>
            {stat.hint ? <p className="mt-1 text-xs text-ink-500">{stat.hint}</p> : null}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">Mes codes</h2>
          <p className="text-xs text-ink-500">
            Commission de {rate} %
            {since !== "" ? ` · affilié depuis le ${formatDate(since)}` : ""}
          </p>
        </div>

        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            Aucun code ne vous est encore rattaché. Nous vous en attribuons un depuis
            l’administration — écrivez-nous si vous attendez toujours.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {codes.map((code) => (
              <li
                key={code.code}
                className="flex items-start justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-base font-extrabold tracking-wider">{code.code}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{code.summary}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {code.uses} utilisation{code.uses > 1 ? "s" : ""}
                    {code.maxUses > 0 ? ` sur ${code.maxUses}` : ""}
                    {code.active ? "" : " · suspendu"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => copy(code.code)}
                  className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink-500 transition-colors hover:border-ink-300 hover:text-ink"
                >
                  {copied === code.code ? "Copié" : "Copier"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">Mes gains</h2>
        <p className="mt-1 text-sm text-ink-500">
          Une ligne par planche payée avec l’un de vos codes.
        </p>

        {earnings.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            Rien pour l’instant. Dès qu’une planche est payée avec votre code, elle apparaît ici.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Code</th>
                  <th className="pb-2 pr-3">Planche</th>
                  <th className="pb-2 pr-3 text-right">Encaissé</th>
                  <th className="pb-2 pr-3 text-right">Ma part</th>
                  <th className="pb-2 text-right">Statut</th>
                </tr>
              </thead>

              <tbody>
                {earnings.map((earning, index) => (
                  <tr key={`${earning.code}-${earning.createdAt}-${index}`} className="border-b border-line/60">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-ink-500">
                      {formatDate(earning.createdAt)}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs font-bold">{earning.code}</td>
                    <td className="py-2.5 pr-3 text-ink-500">{earning.sheet || "—"}</td>
                    <td className="py-2.5 pr-3 text-right whitespace-nowrap text-ink-500">
                      {earning.baseLabel}
                    </td>
                    <td className="py-2.5 pr-3 text-right whitespace-nowrap font-bold">
                      {earning.amountLabel}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {earning.status === "payee" ? (
                        <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink-500">
                          Versé{earning.paidAt !== "" ? ` le ${formatDate(earning.paidAt)}` : ""}
                        </span>
                      ) : (
                        <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-bold text-cyan-dark">
                          Acquis
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Les dates arrivent au format MySQL, que Safari refuse de lire tel quel. */
function formatDate(value: string): string {
  const parsed = new Date(value.replace(" ", "T"));

  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("fr-FR");
}
