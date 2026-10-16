import { NextRequest, NextResponse } from "next/server";

import { callWordPress, sessionToken } from "@/lib/server/wordpress";

/**
 * Relais vers l'API du plugin.
 *
 * Le navigateur appelle /api/pp/cards ; cette route ajoute la clé d'API et le
 * jeton de session — tous deux hors d'atteinte du JavaScript de la page — puis
 * transmet la réponse telle quelle.
 *
 * Le corps est relayé en flux brut : c'est ce qui permet d'envoyer aussi bien
 * du JSON qu'un formulaire multipart contenant les visuels d'une carte, sans
 * avoir à le décoder ici.
 */

type Context = { params: Promise<{ path: string[] }> };

async function relay(request: NextRequest, context: Context): Promise<NextResponse> {
  const { path } = await context.params;
  const target = `/${path.join("/")}${request.nextUrl.search}`;

  const method = request.method.toUpperCase();
  const init: RequestInit = { method };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    const headers = new Headers();

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    init.headers = headers;
    init.body = await request.arrayBuffer();
  }

  const token = await sessionToken();
  const result = await callWordPress(target, init, token);

  return NextResponse.json(result.data, { status: result.status });
}

export const GET = relay;
export const POST = relay;
export const PUT = relay;
export const PATCH = relay;
export const DELETE = relay;
