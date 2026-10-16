import { NextRequest, NextResponse } from "next/server";

/**
 * Garde d’entrée du tableau de bord (fichier « proxy » de Next 16).
 *
 * Elle ne vérifie que la présence du cookie : valider le jeton demanderait un
 * appel à WordPress à chaque navigation, pour un gain nul — les pages et
 * l'API refusent de toute façon un jeton invalide. Le rôle du middleware est
 * d'éviter l'écran vide à qui n'est pas connecté, pas de faire la sécurité.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has("pp_session");

  if (!hasSession) {
    const login = new URL("/connexion", request.url);

    // On mémorise la page demandée : après connexion, l'utilisateur reprend
    // là où il allait plutôt que sur un tableau de bord générique.
    login.searchParams.set("suite", request.nextUrl.pathname);

    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tableau-de-bord/:path*"],
};
