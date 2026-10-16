import type { Metadata } from "next";

import { WalletPanel } from "@/components/dashboard/WalletPanel";
import { getPublicSettings, serverGet } from "@/lib/server/wordpress";
import type { Wallet } from "@/lib/types";

export const metadata: Metadata = { title: "Crédits" };

/**
 * Le porte-monnaie du client.
 *
 * Rien n'est débité ici : cet écran sert à recharger et à relire l'historique.
 * Le débit, lui, se produit au moment où une planche est réellement livrée.
 */
export default async function CreditsPage() {
  const [wallet, settings] = await Promise.all([
    serverGet<Wallet>("/wallet"),
    getPublicSettings(),
  ]);

  if (!wallet) {
    return (
      <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-500">
        Impossible de charger votre solde pour le moment. Rechargez la page dans un instant.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Crédits</h1>
        <p className="mt-1 text-sm text-ink-500">
          Chaque planche recto-verso coûte {wallet.priceLabel}. Votre crédit n’expire pas.
        </p>
      </div>

      <WalletPanel wallet={wallet} payment={settings.payment} />
    </div>
  );
}
