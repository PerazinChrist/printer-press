import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AffiliationPanel } from "@/components/dashboard/AffiliationPanel";
import { getAccount } from "@/lib/server/session";
import { serverGet } from "@/lib/server/wordpress";
import type { Affiliation } from "@/lib/types";

export const metadata: Metadata = { title: "Mon affiliation" };

/**
 * Espace réservé aux affiliés.
 *
 * Le droit s'ouvre depuis l'administration : un compte ordinaire qui arriverait
 * sur cette adresse est renvoyé au tableau de bord plutôt que de voir un écran
 * vide qui lui promettrait un programme auquel il n'est pas inscrit.
 */
export default async function AffiliationPage() {
  const account = await getAccount();

  if (!account?.isAffiliate) {
    redirect("/tableau-de-bord");
  }

  const data = await serverGet<{ affiliation: Affiliation }>("/me/affiliation");

  if (!data) {
    return (
      <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-500">
        Impossible de charger votre affiliation pour le moment. Rechargez la page dans un instant.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mon affiliation</h1>
        <p className="mt-1 text-sm text-ink-500">
          Vous touchez {data.affiliation.rate} % de chaque planche payée avec l’un de vos codes.
          La commission se calcule sur le montant réellement encaissé, remise déduite.
        </p>
      </div>

      <AffiliationPanel affiliation={data.affiliation} />
    </div>
  );
}
