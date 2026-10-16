"use client";

import { useEffect, useRef, useState } from "react";

import { ApiRequestError, apiUpload } from "@/lib/api";
import { trackEvent } from "@/lib/track";
import type { Card, SheetSpecs } from "@/lib/types";

/**
 * Dépôt direct du recto et du verso, depuis l'atelier.
 *
 * Le client arrive avec deux fichiers ; il doit pouvoir les poser et voir sa
 * planche, sans passer par un écran de gestion. Dès que les deux faces sont
 * là, l'envoi part tout seul : un bouton « enregistrer » de plus n'aurait rien
 * ajouté, sinon un clic.
 *
 * Les dimensions sont lues dans le navigateur avant l'envoi. C'est le seul
 * moment où l'on peut prévenir « cette image est un peu juste » sans faire
 * attendre : la réponse du serveur, elle, arrive après le téléversement.
 */

type Visual = {
  file: File;
  url: string;
  width: number;
  height: number;
};

export function CardDropzone({
  specs,
  onCreated,
  busyLabel = "Envoi des visuels…",
}: {
  specs: SheetSpecs;
  onCreated: (card: Card) => void;
  busyLabel?: string;
}) {
  const [front, setFront] = useState<Visual | null>(null);
  const [back, setBack] = useState<Visual | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sent = useRef(false);

  // Les aperçus locaux tiennent par une URL d'objet : sans révocation, chaque
  // fichier reposé laisserait une image en mémoire jusqu'au rechargement.
  useEffect(() => {
    return () => {
      [front, back].forEach((visual) => {
        if (visual) {
          URL.revokeObjectURL(visual.url);
        }
      });
    };
  }, [front, back]);

  // Dès que les deux faces sont posées, la carte part vers le serveur.
  useEffect(() => {
    if (!front || !back || busy || sent.current) {
      return;
    }

    async function upload() {
      sent.current = true;
      setBusy(true);
      setError("");

      const form = new FormData();
      form.append("name", name.trim() === "" ? defaultName() : name.trim());
      form.append("front", front!.file);
      form.append("back", back!.file);

      try {
        const result = await apiUpload<{ card: Card }>("/cards", form);

        trackEvent("carte", "carte_deposee", `${front!.width}x${front!.height}`);
        onCreated(result.card);
        setFront(null);
        setBack(null);
        setName("");
      } catch (failure) {
        setError(
          failure instanceof ApiRequestError
            ? failure.message
            : "Les visuels n’ont pas pu être envoyés. Réessayez.",
        );
      } finally {
        sent.current = false;
        setBusy(false);
      }
    }

    upload();
  }, [front, back, busy, name, onCreated]);

  async function accept(file: File | undefined, side: "front" | "back") {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Déposez une image : JPG, PNG ou WebP.");
      return;
    }

    setError("");

    const visual = await read(file);

    if (side === "front") {
      setFront(visual);
    } else {
      setBack(visual);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slot
          title="Recto"
          visual={front}
          specs={specs}
          disabled={busy}
          onPick={(file) => accept(file, "front")}
          onRemove={() => setFront(null)}
        />
        <Slot
          title="Verso"
          visual={back}
          specs={specs}
          disabled={busy}
          onPick={(file) => accept(file, "back")}
          onRemove={() => setBack(null)}
        />
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">Nom de la carte (facultatif)</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={defaultName()}
          disabled={busy}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
        />
      </label>

      {busy ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
          {busyLabel}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          Posez les deux faces : l’aperçu de la planche se compose aussitôt. Définition idéale{" "}
          {specs.idealWidthPx} × {specs.idealHeightPx} px, soit la carte à {specs.dpi} dpi.
        </p>
      )}

      {error !== "" ? (
        <p className="mt-3 rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Une face : zone de dépôt, puis vignette une fois le fichier posé.
 */
function Slot({
  title,
  visual,
  specs,
  disabled,
  onPick,
  onRemove,
}: {
  title: string;
  visual: Visual | null;
  specs: SheetSpecs;
  disabled: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const sharp = visual ? visual.width >= specs.idealWidthPx && visual.height >= specs.idealHeightPx : true;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {visual ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="text-xs font-semibold text-ink-500 underline underline-offset-4 hover:text-ink"
          >
            Remplacer
          </button>
        ) : null}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          onPick(event.dataTransfer.files[0]);
        }}
        className={`mt-1.5 flex aspect-[86/54] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          over ? "border-cyan bg-cyan/5" : visual ? "border-line" : "border-line bg-paper hover:border-ink-300"
        }`}
      >
        {visual ? (
          // eslint-disable-next-line @next/next/no-img-element -- aperçu local, jamais servi par le serveur.
          <img src={visual.url} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-xs leading-relaxed text-ink-500">
            Glissez l’image ici
            <span className="mt-1 block font-semibold text-ink">ou cliquez pour choisir</span>
          </span>
        )}
      </button>

      {visual ? (
        <p className={`mt-1.5 text-xs ${sharp ? "text-ink-500" : "text-magenta"}`}>
          {visual.width} × {visual.height} px
          {sharp ? "" : " · un peu juste pour 300 dpi"}
        </p>
      ) : null}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

/** Lit les dimensions d'un fichier avant tout envoi. */
function read(file: File): Promise<Visual> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () =>
      resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight });

    // Une image illisible ne doit pas bloquer le dépôt : le serveur la
    // refusera avec un message clair, et c'est lui qui fait foi.
    image.onerror = () => resolve({ file, url, width: 0, height: 0 });

    image.src = url;
  });
}

/** « Carte du 16 octobre » : un nom qu'on reconnaît sans l'avoir choisi. */
function defaultName(): string {
  return `Carte du ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}
