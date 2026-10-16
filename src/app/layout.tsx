import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

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

export const metadata: Metadata = {
  title: {
    default: "PrinterPress — vos planches de cartes de visite recto-verso, alignées au dixième de millimètre",
    template: "%s · PrinterPress",
  },
  description:
    "Déposez le recto et le verso de votre carte de visite : PrinterPress compose la planche A4 de 10 cartes à 300 dpi, avec repères de coupe et recto-verso superposé. 300 FCFA la planche.",
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
    description:
      "10 cartes 8,6 × 5,4 cm par page A4, recto et verso superposés, repères de coupe. 300 FCFA la planche.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#232a35",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
