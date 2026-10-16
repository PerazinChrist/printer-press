"use client";

import { useState } from "react";

import { ApiRequestError, apiSend } from "@/lib/api";
import type { Promo } from "@/lib/types";

/**
 * Saisie d'un code promo.
 *
 * Le code est vérifié par le serveur avant la génération, pour que le client
 * voie le prix remisé sur le bouton plutôt que de le découvrir sur son solde.
 * Il sera revalidé au moment de facturer : ce qui s'affiche ici n'engage rien.
 *
 * Les refus sont explicites — expiré, déjà utilisé, épuisé — parce qu'un code
 * promo n'est pas un secret, et qu'un client qui comprend pourquoi ça ne marche
 * pas cesse de réessayer.
 */
export function PromoField({
  type,
  applied,
  onApply,
  onClear,
}: {
  /** remise (planche) ou credit (porte-monnaie). */
  type: "remise" | "credit";
  applied: Promo | null;
  onApply: (promo: Promo) => void;
  onClear: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check(event: React.FormEvent) {
    event.preventDefault();

    if (code.trim() === "") {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await apiSend<{ promo: Promo }>("/promos/verification", { code, type });

      onApply(result.promo);
      setCode("");
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError ? failure.message : "Ce code n’a pas pu être vérifié.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-green/40 bg-green/5 px-4 py-3">
        <div>
          <p className="text-sm font-bold">
            Code {applied.code} appliqué
          </p>
          <p className="text-xs leading-relaxed text-ink-500">{applied.summary}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            onClear();
            setError("");
          }}
          className="whitespace-nowrap text-xs font-semibold text-ink-500 underline underline-offset-4 hover:text-ink"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={check} className="space-y-2">
      <span className="text-sm font-semibold">Code promo (facultatif)</span>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="BIENVENUE"
          className="w-full rounded-xl border border-line px-4 py-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-cyan"
        />
        <button
          type="submit"
          disabled={busy || code.trim() === ""}
          className="whitespace-nowrap rounded-xl border border-line px-4 text-sm font-bold transition-colors hover:border-ink-300 disabled:opacity-50"
        >
          {busy ? "…" : "Appliquer"}
        </button>
      </div>

      {error !== "" ? <p className="text-xs font-medium text-magenta">{error}</p> : null}
    </form>
  );
}
