import type { ApiError, FieldErrors } from "@/lib/types";

/**
 * Client HTTP du navigateur.
 *
 * Tout passe par /api/pp/… : le navigateur ne connaît ni l'adresse de
 * WordPress, ni la clé d'API, ni le jeton de session.
 */

/** Erreur d'API, avec le code et les messages par champ du plugin. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: FieldErrors;

  constructor(status: number, payload: Partial<ApiError>) {
    super(payload.message ?? "Une erreur est survenue.");
    this.name = "ApiRequestError";
    this.status = status;
    this.code = payload.code ?? "pp_error";
    this.errors = payload.errors ?? {};
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text === "" ? null : JSON.parse(text);
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = (payload ?? {}) as Record<string, unknown>;
    const data = (error.data ?? {}) as Record<string, unknown>;

    // Session expirée ou fermée ailleurs : inutile de laisser le client buter
    // sur une suite d'erreurs incompréhensibles, on le ramène à la connexion
    // en gardant la page où il allait.
    if (response.status === 401 && typeof window !== "undefined") {
      const here = window.location.pathname;

      if (here.startsWith("/tableau-de-bord")) {
        window.location.href = `/connexion?suite=${encodeURIComponent(here)}`;
      }
    }

    throw new ApiRequestError(response.status, {
      code: typeof error.code === "string" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : undefined,
      // WordPress range les erreurs de champ sous « data », là où le reste de
      // la charge utile est à plat.
      errors: (data.errors as FieldErrors) ?? undefined,
    });
  }

  return payload as T;
}

/** Lecture. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/pp${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return parse<T>(response);
}

/** Écriture JSON. */
export async function apiSend<T>(
  path: string,
  body: unknown,
  method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST",
): Promise<T> {
  const response = await fetch(`/api/pp${path}`, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parse<T>(response);
}

/** Envoi de fichiers (visuels d'une carte). */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  // Surtout ne pas fixer Content-Type : le navigateur doit poser lui-même la
  // frontière multipart, qu'il est le seul à connaître.
  const response = await fetch(`/api/pp${path}`, {
    method: "POST",
    body: form,
  });

  return parse<T>(response);
}

/** Inscription, connexion, connexion Google, déconnexion. */
export async function authRequest<T>(
  action: "register" | "login" | "google" | "logout",
  payload?: unknown,
): Promise<T> {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  return parse<T>(response);
}
