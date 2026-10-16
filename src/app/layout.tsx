import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Tracker } from "@/components/Tracker";
import { getPublicSettings } from "@/lib/server/wordpress";

import "./globals.css";

/**
 * Une seule fonte, trois graisses. Un site qui vend se lit vite : la variété
 * typographique ralentit la lecture sans rien ajouter à l'argument.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

/**
 * Métadonnées de la page.
 *
 * Le tarif vient des réglages du plugin, comme partout ailleurs : le prix
 * annoncé dans un résultat de recherche ou dans un aperçu WhatsApp est celui
 * qui sera facturé, même après un changement en back-office.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const { sheet } = settings;

  return {
    title: {
      default:
        "PrinterPress — vos planches de cartes de visite recto-verso, alignées au dixième de millimètre",
      template: "%s · PrinterPress",
    },
    description: `Déposez le recto et le verso de votre carte de visite : PrinterPress compose la planche ${sheet.pageFormat} de ${sheet.perPage} cartes à ${sheet.dpi} dpi, avec repères de coupe et recto-verso superposé. ${settings.priceLabel} la planche.`,
    keywords: [
      "cartes de visite",
      "planche d'impression",
      "recto verso",
      "A4",
      "300 dpi",
      "imprimerie",
      "Cameroun",
    ],
    openGraph: {
      title: "PrinterPress — planches de cartes de visite prêtes à imprimer",
      description: `${sheet.perPage} cartes ${sheet.cardWidthCm} × ${sheet.cardHeightCm} cm par page ${sheet.pageFormat}, recto et verso superposés, repères de coupe. ${settings.priceLabel} la planche.`,
      type: "website",
      locale: "fr_FR",
      // Ce qui s'affiche quand le lien part sur WhatsApp ou Facebook.
      images: [
        {
          url: "/images/partage-reseaux.jpg",
          width: 1424,
          height: 752,
          alt: "PrinterPress — planches de cartes de visite recto-verso",
        },
      ],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#232a35",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="antialiased">
        {children}
        <Tracker />
      </body>
    </html>
  );
}
