"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authRequest } from "@/lib/api";
import type { Account } from "@/lib/types";

/**
 * Cadre du tableau de bord.
 *
 * Le solde est affiché en permanence, converti en nombre de planches : c'est
 * l'unité dans laquelle le client raisonne. « 2 400 FCFA » demande un calcul,
 * « 8 planches » se comprend tout de suite.
 */

const NAV = [
  { href: "/tableau-de-bord", label: "Vue d’ensemble", exact: true },
  { href: "/tableau-de-bord/cartes", label: "Mes cartes" },
  { href: "/tableau-de-bord/planches", label: "Mes planches" },
  { href: "/tableau-de-bord/credits", label: "Crédits" },
  { href: "/tableau-de-bord/compte", label: "Mon compte" },
];

export function DashboardShell({
  account,
  price,
  children,
}: {
  account: Account;
  price: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const sheetsLeft = Math.floor(account.balance / Math.max(1, price));

  async function logout() {
    setLeaving(true);

    try {
      await authRequest("logout");
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="PrinterPress"
              width={40}
              height={40}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-extrabold tracking-tight">PrinterPress</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-none">{account.balanceLabel}</p>
              <p className="text-xs text-ink-500">
                {sheetsLeft} planche{sheetsLeft > 1 ? "s" : ""} possible
                {sheetsLeft > 1 ? "s" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={leaving}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-500 transition-colors hover:border-ink-300 hover:text-ink"
            >
              {leaving ? "…" : "Déconnexion"}
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-magenta text-ink"
                    : "border-transparent text-ink-500 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
