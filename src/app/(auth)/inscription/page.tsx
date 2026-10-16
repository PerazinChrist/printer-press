import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { getPublicSettings } from "@/lib/server/wordpress";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte PrinterPress et composez votre première planche de cartes de visite recto-verso.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const settings = await getPublicSettings();
  const { suite } = await searchParams;

  return (
    <AuthForm
      mode="register"
      googleClientId={settings.googleClientId}
      next={suite ?? "/tableau-de-bord"}
    />
  );
}
