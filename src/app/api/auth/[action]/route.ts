import { NextRequest, NextResponse } from "next/server";

import { closeSession, openSession } from "@/lib/server/session";
import { callWordPress, sessionToken } from "@/lib/server/wordpress";
import type { Account } from "@/lib/types";

/**
 * Entrée et sortie de session.
 *
 * Trois portes d'entrée — inscription, mot de passe, Google — et une sortie.
 * Toutes rendent la même chose au navigateur : le profil du compte, jamais le
 * jeton. Celui-ci est posé dans un cookie httpOnly par le serveur.
 */

type SessionResponse = {
  token: string;
  expiresAt: string;
  account: Account;
};

const ROUTES: Record<string, string> = {
  register: "/auth/register",
  login: "/auth/login",
  google: "/auth/google",
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
): Promise<NextResponse> {
  const { action } = await context.params;

  if (action === "logout") {
    const token = await sessionToken();

    if (token !== "") {
      await callWordPress("/auth/logout", { method: "POST" }, token);
    }

    await closeSession();

    return NextResponse.json({ ok: true });
  }

  const path = ROUTES[action];

  if (!path) {
    return NextResponse.json({ code: "pp_unknown_action", message: "Action inconnue." }, { status: 404 });
  }

  const body = await request.text();

  const result = await callWordPress<SessionResponse>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!result.ok || !result.data || !("token" in result.data)) {
    return NextResponse.json(result.data, { status: result.status });
  }

  await openSession(result.data.token, result.data.expiresAt);

  // Le jeton s'arrête ici : le navigateur reçoit le compte, et c'est tout.
  return NextResponse.json({ account: result.data.account }, { status: result.status });
}
