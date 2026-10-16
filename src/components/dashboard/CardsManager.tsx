"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiGet, apiSend, apiUpload } from "@/lib/api";
import type { Card, Sheet, SheetSpecs } from "@/lib/types";

/**
 * Gestion des cartes : dépôt, renommage, remplacement d'une face, suppression.
 *
 * Les deux visuels partent tels quels vers le serveur, sans redimensionnement
 * dans le navigateur : réduire une image avant l'envoi ferait perdre
 * exactement la définition dont dépend la netteté à l'impression.
 */
export function CardsManager({
  initialCards,
  specs,
}: {
  initialCards: Card[];
  specs: SheetSpecs;
}) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Les planches d'une carte ne sont chargées qu'au clic : une liste de
  // vingt cartes n'a pas à déclencher vingt requêtes au chargement.
  const [sheets, setSheets] = useState<Record<string, Sheet[]>>({});
  const [openCard, setOpenCard] = useState("");
  const [loadingSheets, setLoadingSheets] = useState("");
  const frontInput = useRef<HTMLInputElement>(null);
  const backInput = useRef<HTMLInputElement>(null);

  async function createCard(event: React.FormEvent) {
    event.preventDefault();

    const front = frontInput.current?.files?.[0];
    const back = backInput.current?.files?.[0];

    if (!front || !back) {
      setError("Choisissez le visuel du recto et celui du verso.");
      return;
    }

    setBusy(true);
    setError("");

    const form = new FormData();
    form.append("name", name.trim() === "" ? "Carte sans nom" : name.trim());
    form.append("front", front);
    form.append("back", back);

    try {
      const { card } = await apiUpload<{ card: Card }>("/cards", form);

      setCards((previous) => [card, ...previous]);
      setName("");

      if (frontInput.current) frontInput.current.value = "";
      if (backInput.current) backInput.current.value = "";
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError
          ? failure.message
          : "Le dépôt a échoué. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function replaceSide(card: Card, side: "front" | "back", file: File) {
    setBusy(true);
    setError("");

    const form = new FormData();
    form.append(side, file);

    try {
      const updated = await apiUpload<{ card: Card }>(`/cards/${card.id}`, form);

      setCards((previous) => previous.map((item) => (item.id === card.id ? updated.card : item)));
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError ? failure.message : "Le remplacement a échoué.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function rename(card: Card, nextName: string) {
    if (nextName.trim() === "" || nextName === card.name) {
      return;
    }

    const form = new FormData();
    form.append("name", nextName.trim());

    try {
      const updated = await apiUpload<{ card: Card }>(`/cards/${card.id}`, form);

      setCards((previous) => previous.map((item) => (item.id === card.id ? updated.card : item)));
    } catch {
      setError("Le nouveau nom n’a pas pu être enregistré.");
    }
  }

  async function toggleSheets(card: Card) {
    if (openCard === card.id) {
      setOpenCard("");
      return;
    }

    setOpenCard(card.id);

    if (sheets[card.id]) {
      return;
    }

    setLoadingSheets(card.id);

    try {
      const result = await apiGet<{ sheets: Sheet[] }>(`/cards/${card.id}/planches`);

      setSheets((previous) => ({ ...previous, [card.id]: result.sheets }));
    } catch {
      setError("Les planches de cette carte n’ont pas pu être chargées.");
    } finally {
      setLoadingSheets("");
    }
  }

  async function remove(card: Card) {
    if (!window.confirm(`Supprimer « ${card.name} » ? Vos planches déjà produites restent accessibles.`)) {
      return;
    }

    try {
      await apiSend(`/cards/${card.id}`, undefined, "DELETE");
      setCards((previous) => previous.filter((item) => item.id !== card.id));
    } catch {
      setError("La suppression a échoué.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">Déposer une carte</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          Deux images — le recto et le verso — en JPG, PNG ou WebP. Définition idéale :{" "}
          {specs.idealWidthPx} × {specs.idealHeightPx} px, soit la carte à {specs.dpi} dpi.
        </p>

        <form onSubmit={createCard} className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-3">
            <span className="text-sm font-semibold">Nom de la carte</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Cartes — Boulangerie Awa"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
            />
          </label>

          <FileField label="Recto" inputRef={frontInput} />
          <FileField label="Verso" inputRef={backInput} />

          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Envoi…" : "Enregistrer la carte"}
            </Button>
          </div>
        </form>

        {error !== "" ? (
          <p className="mt-4 rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
            {error}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-bold">
          Vos cartes {cards.length > 0 ? <span className="text-ink-500">({cards.length})</span> : null}
        </h2>

        {cards.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-500">
            Aucune carte enregistrée. Déposez votre premier recto-verso ci-dessus.
          </p>
        ) : (
          <ul className="mt-4 grid gap-5 md:grid-cols-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-2xl border border-line bg-white p-5">
                <input
                  defaultValue={card.name}
                  onBlur={(event) => rename(card, event.target.value)}
                  className="w-full rounded-lg border border-transparent px-2 py-1 text-base font-bold outline-none transition-colors hover:border-line focus:border-cyan"
                />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(["front", "back"] as const).map((side) => {
                    const info = side === "front" ? card.front : card.back;
                    const url = side === "front" ? card.frontUrl : card.backUrl;

                    return (
                      <div key={side}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable. */}
                        <img
                          src={url}
                          alt={`${card.name} — ${side === "front" ? "recto" : "verso"}`}
                          className="aspect-[86/54] w-full rounded-lg border border-line object-cover"
                        />

                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {side === "front" ? "Recto" : "Verso"}
                        </p>
                        <p className={`text-xs ${info.sharp ? "text-ink-500" : "text-magenta"}`}>
                          {info.width} × {info.height} px
                          {info.sharp ? "" : " · un peu juste pour 300 dpi"}
                        </p>

                        <label className="mt-1 inline-block cursor-pointer text-xs font-semibold text-cyan hover:text-cyan-dark">
                          Remplacer
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];

                              if (file) {
                                replaceSide(card, side, file);
                              }

                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  {card.sheetsCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => toggleSheets(card)}
                      className="text-xs font-semibold text-cyan hover:text-cyan-dark"
                    >
                      {openCard === card.id ? "Masquer" : "Voir"} {card.sheetsCount} planche
                      {card.sheetsCount > 1 ? "s" : ""}
                    </button>
                  ) : (
                    <span className="text-xs text-ink-500">Aucune planche produite</span>
                  )}

                  <button
                    type="button"
                    onClick={() => remove(card)}
                    className="text-xs font-semibold text-ink-500 hover:text-magenta"
                  >
                    Supprimer
                  </button>
                </div>

                {openCard === card.id ? (
                  <div className="mt-3 rounded-xl bg-paper p-3">
                    {loadingSheets === card.id ? (
                      <p className="text-xs text-ink-500">Chargement…</p>
                    ) : (sheets[card.id] ?? []).length === 0 ? (
                      <p className="text-xs text-ink-500">
                        Aucune planche produite à partir de cette carte.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {(sheets[card.id] ?? []).map((sheet) => (
                          <li key={sheet.id} className="flex gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable. */}
                            <img
                              src={sheet.previews.front}
                              alt={`Planche ${sheet.label}`}
                              className="aspect-[210/297] w-12 rounded border border-line bg-white object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{sheet.label}</p>
                              <p className="text-xs text-ink-500">
                                {new Date(sheet.createdAt.replace(" ", "T")).toLocaleDateString(
                                  "fr-FR",
                                )}{" "}
                                · {sheet.gapMm} mm ·{" "}
                                {sheet.fitMode === "cover" ? "remplir le cadre" : "image entière"}
                                {sheet.cutMarks ? " · repères" : ""} · {sheet.priceLabel}
                                {sheet.promoCode !== "" ? ` · code ${sheet.promoCode}` : ""}
                              </p>

                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {[
                                  ["PDF recto", sheet.files.frontPdf],
                                  ["PDF verso", sheet.files.backPdf],
                                  ["PNG recto", sheet.files.frontPng],
                                  ["PNG verso", sheet.files.backPng],
                                ].map(([label, href]) => (
                                  <a
                                    key={label}
                                    href={href}
                                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-bold text-ink-500 hover:text-ink"
                                  >
                                    {label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FileField({
  label,
  inputRef,
}: {
  label: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
      />
    </label>
  );
}
