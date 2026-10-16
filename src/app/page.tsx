import { Audience } from "@/components/landing/Audience";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Steps } from "@/components/landing/Steps";
import { getAccount } from "@/lib/server/session";
import { getPublicSettings } from "@/lib/server/wordpress";

/**
 * Page d'accueil.
 *
 * L'ordre des sections suit le chemin d'une décision : la promesse et le
 * modèle à essayer, le plan en trois étapes, les gens à qui c'est destiné, les
 * objections, et un dernier appel.
 *
 * Le tarif et la géométrie viennent du plugin : ce que la page promet est
 * exactement ce que le service facture et produit. Le compte connecté est lu
 * ici pour que l'en-tête sache à qui il parle.
 */
export default async function HomePage() {
  const [settings, account] = await Promise.all([getPublicSettings(), getAccount()]);

  return (
    <>
      <SiteHeader priceLabel={settings.priceLabel} account={account} />

      <main>
        <Hero settings={settings} />
        <Steps settings={settings} />
        <Audience settings={settings} />
        <Faq settings={settings} />
        <FinalCta settings={settings} />
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
