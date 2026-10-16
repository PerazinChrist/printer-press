import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SheetStudio } from "@/components/dashboard/SheetStudio";
import { getAccount } from "@/lib/server/session";
import { getPublicSettings, serverGet } from "@/lib/server/wordpress";
import type { Card, Sheet } from "@/lib/types";

export const metadata: Metadata = { title: "Mes planches" };

/**
 * L'atelier de production.
 *
 * Tout est chargé côté serveur avant l'affichage : la liste des cartes, les
 * planches déjà produites et le solde. L'écran s'ouvre donc utilisable, sans
 * état de chargement.
 */
export default async function SheetsPage() {
  const [cardsData, sheetsData, settings, account] = await Promise.all([
    serverGet<{ cards: Card[] }>("/cards"),
    serverGet<{ sheets: Sheet[] }>("/sheets"),
    getPublicSettings(),
    getAccount(),
  ]);

  if (!account) {
    redirect("/connexion?suite=/tableau-de-bord/planches");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mes planches</h1>
        <p className="mt-1 text-sm text-ink-500">
          Réglez, regardez l’aperçu gratuit, puis générez pour {settings.priceLabel}.
        </p>
      </div>

      <SheetStudio
        cards={cardsData?.cards ?? []}
        initialSheets={sheetsData?.sheets ?? []}
        specs={settings.sheet}
        price={settings.price}
        priceLabel={settings.priceLabel}
        account={account}
      />
    </div>
  );
}
