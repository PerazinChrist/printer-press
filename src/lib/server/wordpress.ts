import { cookies, headers } from "next/headers";

import type { PublicSettings } from "@/lib/types";

/**
 * Pont serveur vers l'API du plugin PrinterPress Core.
 *
 * Aucune requête du navigateur ne part directement vers WordPress. Elle passe
 * toujours par une route de ce projet, qui ajoute deux choses que le
 * navigateur n'a pas à connaître :
 *
 *  - la clé d'API, qui prouve que l'appel vient bien du site ;
 *  - le jeton de session, rangé dans un cookie httpOnly donc illisible par le
 *    JavaScript de la page — un script injecté ne peut pas le voler.
 *
 * C'est ce qui permet d'avoir une interface entièrement cliente sans jamais
 * exposer un secret.
 */

/** Nom du cookie portant le jeton de session. */
export const SESSION_COOKIE = "pp_session";

/** Base de l'API REST du plugin, sans slash final. */
export const WP_API_URL = (process.env.PP_API_URL ?? "").replace(/\/+$/, "");

/** Clé d'API, visible dans WordPress › PrinterPress › Réglages. */
export const WP_API_KEY = process.env.PP_API_KEY ?? "";

export type WpResult<T> = {
  status: number;
  ok: boolean;
  data: T;
};

/**
 * Appelle l'API du plugin.
 *
 * @param path  Chemin relatif, ex. « /auth/login ».
 * @param init  Options fetch. Le corps peut être une chaîne JSON ou un flux.
 * @param token Jeton de session à présenter, le cas échéant.
 */
export async function callWordPress<T = unknown>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<WpResult<T>> {
  if (WP_API_URL === "") {
    return {
      status: 500,
      ok: false,
      data: {
        code: "pp_not_configured",
        message:
          "PP_API_URL n'est pas défini. Copiez .env.local.example en .env.local et renseignez l'adresse de WordPress.",
      } as T,
    };
  }

  const outgoing = new Headers(init.headers);
  outgoing.set("Accept", "application/json");

  if (WP_API_KEY !== "") {
    outgoing.set("X-PP-Key", WP_API_KEY);
  }

  if (token) {
    outgoing.set("Authorization", `Bearer ${token}`);
  }

  // L'IP réelle du visiteur : sans elle, WordPress ne verrait que celle de ce
  // serveur et les quotas anti-abus fermeraient le service à tout le monde
  // après quelques inscriptions.
  const clientIp = await visitorIp();

  if (clientIp !== "") {
    outgoing.set("X-PP-Client-IP", clientIp);
  }

  // Le navigateur du visiteur, et non celui de ce serveur : c'est ce que le
  // client relira dans la liste de ses sessions pour reconnaître — ou non —
  // l'appareil depuis lequel il s'est connecté.
  const agent = await visitorAgent();

  if (agent !== "") {
    outgoing.set("User-Agent", agent);
  }

  let response: Response;

  try {
    response = await fetch(`${WP_API_URL}${path}`, {
      ...init,
      headers: outgoing,
      cache: "no-store",
    });
  } catch {
    return {
      status: 502,
      ok: false,
      data: {
        code: "pp_unreachable",
        message: "Le service est momentanément injoignable. Réessayez dans un instant.",
      } as T,
    };
  }

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text === "" ? null : JSON.parse(text);
  } catch {
    // WordPress renvoie parfois du HTML (erreur PHP, page de maintenance) : le
    // laisser remonter tel quel afficherait du balisage au visiteur.
    data = {
      code: "pp_bad_response",
      message: "Réponse inattendue du serveur.",
    };
  }

  return {
    status: response.status,
    ok: response.ok,
    data: data as T,
  };
}

/**
 * Jeton de session de la requête courante, s'il y en a un.
 */
export async function sessionToken(): Promise<string> {
  const store = await cookies();

  return store.get(SESSION_COOKIE)?.value ?? "";
}

/**
 * Adresse IP du visiteur, telle que la voit l'hébergement.
 */
async function visitorIp(): Promise<string> {
  const incoming = await headers();
  const forwarded = incoming.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return incoming.get("x-real-ip") ?? "";
}

/**
 * User-agent du visiteur, tel que son navigateur l'annonce.
 */
async function visitorAgent(): Promise<string> {
  const incoming = await headers();

  return (incoming.get("user-agent") ?? "").slice(0, 255);
}

/**
 * Réglages publics : tarif, numéros Mobile Money, géométrie de la planche.
 *
 * Lus sur le serveur à chaque rendu plutôt qu'écrits en dur : le prix affiché
 * sur la page d'accueil est littéralement celui que le plugin facturera.
 *
 * Si l'API ne répond pas — installation neuve, WordPress éteint — on retombe
 * sur les valeurs de lancement. Une page d'accueil qui s'affiche avec le bon
 * argumentaire vaut mieux qu'une page blanche.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const result = await callWordPress<PublicSettings>("/settings");

  if (result.ok && result.data && typeof result.data === "object" && "price" in result.data) {
    return result.data;
  }

  return FALLBACK_SETTINGS;
}

/** Valeurs de repli, identiques aux défauts du plugin. */
export const FALLBACK_SETTINGS: PublicSettings = {
  price: 300,
  priceLabel: "300 FCFA",
  currency: "FCFA",
  minRecharge: 300,
  googleEnabled: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "") !== "",
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  momo: { mtn: "", orange: "", name: "" },
  support: { phone: "", email: "" },
  sheet: {
    cardWidthCm: 8.6,
    cardHeightCm: 5.4,
    perPage: 10,
    cols: 2,
    rows: 5,
    dpi: 300,
    pageFormat: "A4",
    defaultGapMm: 3,
    maxGapMm: 4.2,
    idealWidthPx: 1016,
    idealHeightPx: 638,
  },
  // Sans API joignable, on n'annonce aucun paiement en ligne : mieux vaut un
  // service annoncé en retrait qu'un formulaire qui échouerait au dernier clic.
  payment: {
    mode: "manuel",
    online: false,
    simulation: false,
    sandbox: false,
    countries: [],
  },
};

/**
 * Lecture authentifiée depuis une page serveur.
 *
 * Les pages du tableau de bord s'affichent déjà remplies : aucune n'attend un
 * aller-retour du navigateur pour montrer un solde ou une liste de cartes.
 *
 * @param path Chemin relatif, ex. « /me/overview ».
 */
export async function serverGet<T>(path: string): Promise<T | null> {
  const token = await sessionToken();

  if (token === "") {
    return null;
  }

  const result = await callWordPress<T>(path, { method: "GET" }, token);

  return result.ok ? result.data : null;
}
