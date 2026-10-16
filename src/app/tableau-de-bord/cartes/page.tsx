import type { Metadata } from "next";

import { CardsManager } from "@/components/dashboard/CardsManager";
import { getPublicSettings, serverGet } from "@/lib/server/wordpress";
import type { Card } from "@/lib/types";

export const metadata: Metadata = { title: "Mes cartes" };

/**
 * Les cartes du client : un recto, un verso, un nom.
 *
 * Une carte sert autant de fois qu'on veut : c'est la planche qui se paie, pas
 * le dépôt du visuel.
 */
export default async function CardsPage() {
  const [data, settings] = await Promise.all([
    serverGet<{ cards: Card[] }>("/cards"),
    getPublicSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mes cartes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Vos visuels restent privés : ils sont stockés hors de la médiathèque du site et ne
          s’ouvrent que par un lien signé, valable deux heures.
        </p>
      </div>

      <CardsManager initialCards={data?.cards ?? []} specs={settings.sheet} />
    </div>
  );
}
