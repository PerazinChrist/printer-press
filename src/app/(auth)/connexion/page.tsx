import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { getPublicSettings } from "@/lib/server/wordpress";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à vos cartes, vos planches et votre solde PrinterPress.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const settings = await getPublicSettings();
  const { suite } = await searchParams;

  return (
    <AuthForm
      mode="login"
      googleClientId={settings.googleClientId}
      next={suite ?? "/tableau-de-bord"}
    />
  );
}
