import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAccount } from "@/lib/server/session";
import { getPublicSettings } from "@/lib/server/wordpress";

/**
 * Cadre authentifié.
 *
 * Le proxy écarte déjà les visiteurs sans cookie ; ici on vérifie que le jeton
 * vaut encore quelque chose. Un compte suspendu ou une session révoquée depuis
 * l'administration se traduit donc par un retour à la page de connexion, et non
 * par un tableau de bord vide.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [account, settings] = await Promise.all([getAccount(), getPublicSettings()]);

  if (!account) {
    redirect("/connexion?suite=/tableau-de-bord");
  }

  return (
    <DashboardShell account={account} price={settings.price}>
      {children}
    </DashboardShell>
  );
}
