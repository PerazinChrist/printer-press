"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CardDropzone } from "@/components/dashboard/CardDropzone";
import { PromoField } from "@/components/dashboard/PromoField";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiSend } from "@/lib/api";
import type { Account, Card, Promo, Sheet, SheetSpecs } from "@/lib/types";

/**
 * L'atelier : régler, voir l'aperçu, puis produire.
 *
 * L'aperçu est gratuit et montre la planche réelle, filigranée. La génération
 * débite le prix affiché sur le bouton — jamais ailleurs, jamais autre chose.
 * Un crédit insuffisant n'est pas une erreur technique : c'est un message qui
 * explique et renvoie à la recharge.
 */
export function SheetStudio({
  cards,
  initialSheets,
  specs,
  price,
  priceLabel,
  account,
}: {
  cards: Card[];
  initialSheets: Sheet[];
  specs: SheetSpecs;
  price: number;
  priceLabel: string;
  account: Account;
}) {
  const router = useRouter();

  const [cardList, setCardList] = useState<Card[]>(cards);
  // « depot » quand le client arrive avec ses fichiers, « enregistree »
  // quand il reprend une carte déjà déposée.
  const [source, setSource] = useState<"depot" | "enregistree">(
    cards.length > 0 ? "enregistree" : "depot",
  );
  const [sheets, setSheets] = useState<Sheet[]>(initialSheets);
  const [balance, setBalance] = useState(account.balance);
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [label, setLabel] = useState(cards[0]?.name ?? "");
  const [gapMm, setGapMm] = useState(specs.defaultGapMm);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [cutMarks, setCutMarks] = useState(true);
  const [side, setSide] = useState<"front" | "back">("front");

  const [preview, setPreview] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [lowCredit, setLowCredit] = useState(false);
  const [done, setDone] = useState<Sheet | null>(null);
  const [promo, setPromo] = useState<Promo | null>(null);

  const selected = cardList.find((card) => card.id === cardId);
  // Le prix affiché suit le code appliqué ; celui qui sera débité est
  // recalculé par le serveur à partir du code revalidé.
  const duePrice = promo ? promo.price : price;
  const dueLabel = promo ? promo.priceLabel : priceLabel;
  const settingsPayload = { cardId, gapMm, fitMode, cutMarks };

  function selectCard(id: string) {
    setCardId(id);
    setDone(null);

    const card = cardList.find((item) => item.id === id);

    if (card) {
      setLabel(card.name);
    }
  }

  /**
   * Une carte déposée ici devient aussitôt la carte de travail.
   *
   * Rien d'autre à faire : la sélection déclenche la composition de l'aperçu,
   * et le client voit sa planche quelques secondes après avoir posé ses deux
   * fichiers.
   */
  function adoptCard(card: Card) {
    setCardList((previous) => [card, ...previous]);
    setCardId(card.id);
    setLabel(card.name);
    setSource("enregistree");
    setDone(null);
  }

  /**
   * L'aperçu se compose tout seul, et se recompose à chaque réglage.
   *
   * Un bouton « voir l'aperçu » obligeait à cliquer pour constater l'effet de
   * ce qu'on venait de régler : le client réglait à l'aveugle. L'attente de
   * 700 ms laisse finir un déplacement de curseur avant de relancer une
   * composition à 300 dpi, et la dernière signature demandée est mémorisée
   * pour ne jamais recomposer deux fois la même planche.
   */
  const lastRequested = useRef("");

  useEffect(() => {
    if (cardId === "") {
      return;
    }

    const signature = JSON.stringify({ ...settingsPayload, side });

    if (signature === lastRequested.current) {
      return;
    }

    const timer = setTimeout(async () => {
      lastRequested.current = signature;
      setPreviewing(true);
      setPreviewError("");

      try {
        const result = await apiSend<{ preview: { url: string; side: string } }>(
          "/sheets/preview",
          { ...settingsPayload, side },
        );

        setPreview(result.preview.url);
      } catch (failure) {
        // Une composition ratée ne doit pas rester affichée comme si elle
        // avait abouti : on efface et on explique.
        lastRequested.current = "";
        setPreview("");
        setPreviewError(
          failure instanceof ApiRequestError
            ? failure.message
            : "L’aperçu n’a pas pu être composé.",
        );
      } finally {
        setPreviewing(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [cardId, gapMm, fitMode, cutMarks, side]); // eslint-disable-line react-hooks/exhaustive-deps -- settingsPayload est reconstruit à chaque rendu.

  async function generate() {
    if (cardId === "") {
      return;
    }

    setGenerating(true);
    setError("");
    setLowCredit(false);

    try {
      const result = await apiSend<{ sheet: Sheet; account: Account }>("/sheets", {
        ...settingsPayload,
        label,
        promoCode: promo?.code ?? "",
      });

      setSheets((previous) => [result.sheet, ...previous]);
      setBalance(result.account.balance);
      setDone(result.sheet);
      // Le code vient d'être consommé : le laisser affiché promettrait une
      // remise que la planche suivante n'aura pas.
      setPromo(null);

      // Le solde est affiché dans l'en-tête, rendu côté serveur : sans ce
      // rafraîchissement, il resterait celui d'avant le débit.
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiRequestError) {
        setError(failure.message);
        setLowCredit(failure.status === 402);
      } else {
        setError("La génération a échoué. Votre crédit n’a pas été débité.");
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Vos visuels</h2>

            {cardList.length > 0 ? (
              <div className="flex rounded-full border border-line p-0.5 text-xs font-semibold">
                {(
                  [
                    ["depot", "Nouveaux fichiers"],
                    ["enregistree", "Carte enregistrée"],
                  ] as const
                ).map(([value, libelle]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSource(value)}
                    className={`rounded-full px-3 py-1.5 transition-colors ${
                      source === value ? "bg-ink text-white" : "text-ink-500"
                    }`}
                  >
                    {libelle}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {source === "depot" ? (
            <div className="mt-4">
              <CardDropzone specs={specs} onCreated={adoptCard} />
            </div>
          ) : (
            <label className="mt-4 block">
              <span className="text-sm font-semibold">Carte</span>
              <select
                value={cardId}
                onChange={(event) => selectCard(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-cyan"
              >
                {cardList.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>

              {selected ? (
                <span className="mt-2 flex gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable. */}
                  <img
                    src={selected.frontUrl}
                    alt={`${selected.name} — recto`}
                    className="aspect-[86/54] w-24 rounded-lg border border-line object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable. */}
                  <img
                    src={selected.backUrl}
                    alt={`${selected.name} — verso`}
                    className="aspect-[86/54] w-24 rounded-lg border border-line object-cover"
                  />
                </span>
              ) : null}
            </label>
          )}

          <h3 className="mt-7 font-bold">Réglages de la planche</h3>

          <label className="mt-4 block">
            <span className="text-sm font-semibold">Nom de la planche</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
            />
            <span className="mt-1 block text-xs text-ink-500">
              Il sert à nommer vos fichiers : « Planche recto — {label || "…"}.pdf ».
            </span>
          </label>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Espace entre les cartes</span>
              <span className="font-mono text-sm font-bold">
                {gapMm.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} mm
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={specs.maxGapMm}
              step={0.1}
              value={gapMm}
              onChange={(event) => setGapMm(Number(event.target.value))}
              className="mt-2 w-full accent-magenta"
            />

            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              {gapMm === 0
                ? "Cartes jointives : une seule coupe droite traverse la planche. À réserver au massicot."
                : "Chaque carte a ses propres bords : le blanc absorbe les écarts d’une découpe à la main."}
            </p>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Cadrage du visuel</legend>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                { value: "cover", title: "Remplir le cadre", hint: "rogne le surplus" },
                { value: "contain", title: "Image entière", hint: "ajoute du blanc" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-colors ${
                    fitMode === option.value ? "border-cyan bg-cyan/5" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="fit"
                    value={option.value}
                    checked={fitMode === option.value}
                    onChange={() => setFitMode(option.value as "cover" | "contain")}
                    className="sr-only"
                  />
                  <span className="block font-semibold">{option.title}</span>
                  <span className="block text-xs text-ink-500">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={cutMarks}
              onChange={(event) => setCutMarks(event.target.checked)}
              className="mt-1 h-4 w-4 accent-magenta"
            />
            <span>
              <span className="font-semibold">Repères de coupe</span>
              <span className="block text-xs text-ink-500">
                Traits fins dans les marges, hors de la zone des cartes.
              </span>
            </span>
          </label>

          {selected && (!selected.front.sharp || !selected.back.sharp) ? (
            <p className="mt-5 rounded-xl border border-yellow/60 bg-yellow/10 px-4 py-3 text-xs leading-relaxed">
              L’un de vos visuels fait moins de {specs.idealWidthPx} × {specs.idealHeightPx} px : la
              planche sortira un peu moins nette. Regardez l’aperçu avant de payer.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">Aperçu</h2>
              <p className="text-xs text-ink-500">
                {previewing
                  ? "Composition en cours…"
                  : "Gratuit, et mis à jour à chaque réglage."}
              </p>
            </div>

            <div className="flex rounded-full border border-line p-0.5 text-xs font-semibold">
              {(["front", "back"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSide(value)}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    side === value ? "bg-ink text-white" : "text-ink-500"
                  }`}
                >
                  {value === "front" ? "Recto" : "Verso"}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-4 flex aspect-[210/297] items-center justify-center overflow-hidden rounded-xl border border-line bg-paper">
            {preview !== "" ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL signée externe, non optimisable.
              <img
                src={preview}
                alt="Aperçu de la planche"
                className={`h-full w-full object-contain transition-opacity ${
                  previewing ? "opacity-40" : "opacity-100"
                }`}
              />
            ) : (
              <p className="max-w-xs px-6 text-center text-sm leading-relaxed text-ink-500">
                {previewError !== ""
                  ? previewError
                  : cardId === ""
                    ? "Déposez un recto et un verso : l’aperçu de votre planche s’affiche ici tout seul."
                    : "L’aperçu de votre planche s’affiche ici dans un instant."}
              </p>
            )}

            {previewing ? (
              <span className="absolute bottom-3 right-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                Mise à jour…
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            L’aperçu montre la planche telle qu’elle sera produite — même grille, mêmes repères —
            avec un filigrane en plus. Il ne coûte rien.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-white p-6">
        <PromoField
          type="remise"
          applied={promo}
          onApply={setPromo}
          onClear={() => setPromo(null)}
        />
      </section>

      <section className="rounded-2xl border border-line bg-ink p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Produire la planche recto-verso</h2>
            <p className="mt-1 text-sm text-white/70">
              Quatre fichiers livrés : PDF et PNG, pour le recto comme pour le verso. Solde actuel :{" "}
              {balance.toLocaleString("fr-FR")} FCFA, soit {Math.floor(balance / Math.max(1, price))}{" "}
              planche{Math.floor(balance / Math.max(1, price)) > 1 ? "s" : ""}.
            </p>

            {promo ? (
              <p className="mt-2 text-sm font-semibold text-yellow">
                {promo.summary} — code {promo.code}.
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={generate}
            size="lg"
            disabled={generating || cardId === ""}
          >
            {generating
              ? "Composition en cours…"
              : duePrice === 0
                ? "Générer — offerte"
                : `Générer — ${dueLabel}`}
          </Button>
        </div>

        {error !== "" ? (
          <div className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm">
            <p>{error}</p>
            {lowCredit ? (
              <Link
                href="/tableau-de-bord/credits"
                className="mt-2 inline-block font-bold text-yellow underline underline-offset-4"
              >
                Recharger mon compte
              </Link>
            ) : null}
          </div>
        ) : null}

        {done ? (
          <div className="mt-5 rounded-xl bg-white p-5 text-ink">
            <p className="font-bold">« {done.label} » est prête.</p>
            <p className="mt-1 text-sm text-ink-500">
              Imprimez à l’échelle 100 % — « Taille réelle » —, jamais « Ajuster à la page ».
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <DownloadLink href={done.files.frontPdf} label="PDF recto" primary />
              <DownloadLink href={done.files.backPdf} label="PDF verso" primary />
              <DownloadLink href={done.files.frontPng} label="PNG recto" />
              <DownloadLink href={done.files.backPng} label="PNG verso" />
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-bold">
          Planches produites{" "}
          {sheets.length > 0 ? <span className="text-ink-500">({sheets.length})</span> : null}
        </h2>

        {sheets.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-ink-500">
            Aucune planche pour l’instant.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sheets.map((sheet) => (
              <li
                key={sheet.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">{sheet.label}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(sheet.createdAt.replace(" ", "T")).toLocaleDateString("fr-FR")} ·{" "}
                    {sheet.gapMm} mm ·{" "}
                    {sheet.fitMode === "cover" ? "remplir le cadre" : "image entière"}
                    {sheet.cutMarks ? " · repères" : ""} · {sheet.priceLabel}
                    {sheet.promoCode !== "" ? ` · code ${sheet.promoCode}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <DownloadLink href={sheet.files.frontPdf} label="PDF recto" primary />
                  <DownloadLink href={sheet.files.backPdf} label="PDF verso" primary />
                  <DownloadLink href={sheet.files.frontPng} label="PNG recto" />
                  <DownloadLink href={sheet.files.backPng} label="PNG verso" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DownloadLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
        primary
          ? "bg-ink text-white hover:bg-ink-700"
          : "border border-line text-ink-500 hover:text-ink"
      }`}
    >
      {label}
    </a>
  );
}
