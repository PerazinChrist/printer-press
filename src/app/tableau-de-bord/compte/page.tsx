import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountPanel } from "@/components/dashboard/AccountPanel";
import { getAccount } from "@/lib/server/session";
import { serverGet } from "@/lib/server/wordpress";
import type { Session } from "@/lib/types";

export const metadata: Metadata = { title: "Mon compte" };

/**
 * Informations personnelles, mot de passe et état du compte.
 */
export default async function AccountPage() {
  const [account, data] = await Promise.all([
    getAccount(),
    serverGet<{ sessions: Session[] }>("/me/sessions"),
  ]);

  if (!account) {
    redirect("/connexion?suite=/tableau-de-bord/compte");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mon compte</h1>
        <p className="mt-1 text-sm text-ink-500">
          Ces informations servent à vous retrouver et à vous joindre en cas de problème sur une
          commande.
        </p>
      </div>

      <AccountPanel account={account} sessions={data?.sessions ?? []} />
    </div>
  );
}
