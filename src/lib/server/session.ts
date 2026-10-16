import { cookies } from "next/headers";

import { SESSION_COOKIE, callWordPress, sessionToken } from "@/lib/server/wordpress";
import type { Account } from "@/lib/types";

/**
 * Gestion du cookie de session.
 *
 * Le jeton n'est jamais remis au JavaScript de la page : il vit dans un cookie
 * httpOnly, posé et retiré ici. Une faille d'injection sur le tableau de bord
 * ne permettrait donc pas de l'emporter.
 */

/**
 * Pose le cookie de session.
 *
 * @param token     Jeton émis par le plugin.
 * @param expiresAt Échéance au format MySQL UTC.
 */
export async function openSession(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  const expiry = Date.parse(expiresAt.replace(" ", "T") + "Z");

  // Le cookie expire avec le jeton : garder un cookie plus longtemps que la
  // session donnerait des déconnexions inexplicables au milieu d'un travail.
  const maxAge = Number.isNaN(expiry)
    ? 60 * 60 * 24 * 30
    : Math.max(60, Math.floor((expiry - Date.now()) / 1000));

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

/**
 * Retire le cookie de session.
 */
export async function closeSession(): Promise<void> {
  const store = await cookies();

  store.delete(SESSION_COOKIE);
}

/**
 * Retourne le compte connecté, ou null.
 *
 * Utilisé par les pages serveur du tableau de bord : elles reçoivent le profil
 * déjà chargé, donc aucune page ne s'affiche vide le temps d'un appel.
 */
export async function getAccount(): Promise<Account | null> {
  const token = await sessionToken();

  if (token === "") {
    return null;
  }

  const result = await callWordPress<{ account: Account }>("/me", { method: "GET" }, token);

  if (!result.ok || !result.data || !("account" in result.data)) {
    return null;
  }

  return result.data.account;
}
