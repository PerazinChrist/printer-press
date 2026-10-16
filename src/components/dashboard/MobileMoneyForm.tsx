"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiGet, apiSend } from "@/lib/api";
import type {
  PaymentAttempt,
  PaymentOperator,
  PaymentSettings,
  Transaction,
} from "@/lib/types";

/**
 * Recharge par Mobile Money, via SebPay.
 *
 * Le client choisit un montant, son opérateur et son numéro ; la demande part
 * sur son téléphone ; il valide, et le crédit arrive. Rien ne se saisit ici qui
 * ressemble à un code secret : la validation se fait sur le téléphone, et c'est
 * ce qui rend l'opération sûre.
 *
 * L'écran interroge le serveur toutes les trois secondes tant que la demande
 * attend. C'est le serveur qui interroge SebPay, jamais le navigateur : la clé
 * secrète ne quitte pas WordPress.
 */

const POLL_MS = 3000;

/** Au-delà, la demande n'aboutira plus : l'opérateur a laissé expirer. */
const GIVE_UP_MS = 4 * 60 * 1000;

export function MobileMoneyForm({
  payment,
  price,
  minRecharge,
  onCredited,
}: {
  payment: PaymentSettings;
  price: number;
  minRecharge: number;
  onCredited: (balanceLabel: string, balance: number, transactions?: Transaction[]) => void;
}) {
  const countries = payment.countries.length > 0 ? payment.countries : [];
  const [country, setCountry] = useState(countries[0]?.code ?? "CM");
  const [operators, setOperators] = useState<PaymentOperator[]>([]);
  const [operator, setOperator] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [amount, setAmount] = useState(price * 5);

  const [attempt, setAttempt] = useState<PaymentAttempt | null>(null);
  const [providerLink, setProviderLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(0);

  const selected = operators.find((item) => item.slug === operator);
  const current = countries.find((item) => item.code === country);
  const presets = [1, 5, 10, 30].map((count) => ({ count, total: price * count }));

  // Catalogue des opérateurs du pays choisi.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");

      try {
        const result = await apiGet<{ operators: PaymentOperator[] }>(
          `/wallet/sebpay/operateurs?pays=${country}`,
        );

        if (cancelled) {
          return;
        }

        setOperators(result.operators);
        setOperator(result.operators[0]?.slug ?? "");
      } catch (failure) {
        if (!cancelled) {
          setOperators([]);
          setError(
            failure instanceof ApiRequestError
              ? failure.message
              : "La liste des opérateurs n’a pas pu être chargée.",
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [country]);

  // Suivi de la demande en cours.
  useEffect(() => {
    if (!attempt || attempt.status !== "attente") {
      return;
    }

    const timer = setInterval(async () => {
      const result = await apiGet<{
        payment: PaymentAttempt;
        balance: number;
        balanceLabel: string;
      }>(`/wallet/sebpay/collectes/${attempt.reference}`).catch(() => null);

      if (!result) {
        return;
      }

      setAttempt(result.payment);

      if (result.payment.status !== "attente") {
        onCredited(result.balanceLabel, result.balance);
      } else if (Date.now() - startedAt.current > GIVE_UP_MS) {
        setError(
          "La demande n’a pas été validée sur le téléphone. Vous pouvez en relancer une.",
        );
        setAttempt(null);
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [attempt, onCredited]);

  async function start(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setProviderLink(null);

    try {
      const result = await apiSend<{ payment: PaymentAttempt; providerLink: string | null }>(
        "/wallet/sebpay/collectes",
        { amount, country, operator, phone, otp },
      );

      startedAt.current = Date.now();
      setAttempt(result.payment);
      setProviderLink(result.providerLink);
      setOtp("");
    } catch (failure) {
      if (failure instanceof ApiRequestError) {
        setError(failure.message);
      } else {
        setError("La demande n’a pas pu être envoyée. Réessayez.");
      }
    } finally {
      setBusy(false);
    }
  }

  /** Téléphone simulé : réservé au mode de recette. */
  async function respond(outcome: "valide" | "refuse" | "expire") {
    if (!attempt) {
      return;
    }

    setBusy(true);

    try {
      const result = await apiSend<{
        payment: PaymentAttempt;
        balance: number;
        balanceLabel: string;
      }>("/wallet/sebpay/simulations", { reference: attempt.reference, outcome });

      setAttempt(result.payment);
      onCredited(result.balanceLabel, result.balance);
    } catch (failure) {
      setError(failure instanceof ApiRequestError ? failure.message : "Simulation impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (attempt) {
    return (
      <AttemptPanel
        attempt={attempt}
        providerLink={providerLink}
        simulation={payment.simulation}
        busy={busy}
        error={error}
        onRespond={respond}
        onRestart={() => {
          setAttempt(null);
          setError("");
        }}
      />
    );
  }

  return (
    <form onSubmit={start} className="space-y-4">
      {payment.sandbox ? (
        <p className="rounded-xl border border-yellow/60 bg-yellow/10 px-4 py-3 text-xs leading-relaxed">
          Mode test SebPay : la demande part réellement sur le téléphone, mais aucun argent n’est
          débité.
        </p>
      ) : null}

      {payment.simulation ? (
        <p className="rounded-xl border border-cyan/40 bg-cyan/5 px-4 py-3 text-xs leading-relaxed">
          Mode simulation : aucune demande ne part vers un vrai téléphone. Vous choisirez vous-même
          l’issue, comme si vous l’aviez validée.
        </p>
      ) : null}

      <div>
        <span className="text-sm font-semibold">Montant</span>

        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => setAmount(preset.total)}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                amount === preset.total
                  ? "border-magenta bg-magenta text-white"
                  : "border-line text-ink-500 hover:text-ink"
              }`}
            >
              {preset.total.toLocaleString("fr-FR")} FCFA
              <span className="ml-1 font-medium opacity-70">
                · {preset.count} planche{preset.count > 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>

        <input
          type="number"
          min={minRecharge}
          step={50}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-3 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold">Pays</span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-cyan"
          >
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Opérateur</span>
          <select
            value={operator}
            onChange={(event) => setOperator(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-cyan"
          >
            {operators.length === 0 ? <option value="">—</option> : null}
            {operators.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Numéro à débiter</span>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={current?.example ?? "6 99 00 00 00"}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
        />
        <span className="mt-1 block text-xs text-ink-500">
          C’est sur ce numéro que la demande de validation va arriver.
        </span>
      </label>

      {selected?.otp ? (
        <label className="block">
          <span className="text-sm font-semibold">Code de confirmation</span>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
          />
          <span className="mt-1 block text-xs text-ink-500">
            {selected.ussd
              ? `${selected.name} demande un code : composez ${selected.ussd} sur votre téléphone, puis recopiez-le ici.`
              : `${selected.name} demande un code reçu par USSD.`}
          </span>
        </label>
      ) : null}

      {error !== "" ? (
        <p className="rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy || operator === ""} className="w-full">
        {busy ? "Envoi…" : `Payer ${amount.toLocaleString("fr-FR")} FCFA`}
      </Button>
    </form>
  );
}

/**
 * Suivi d'une demande en cours ou terminée.
 */
function AttemptPanel({
  attempt,
  providerLink,
  simulation,
  busy,
  error,
  onRespond,
  onRestart,
}: {
  attempt: PaymentAttempt;
  providerLink: string | null;
  simulation: boolean;
  busy: boolean;
  error: string;
  onRespond: (outcome: "valide" | "refuse" | "expire") => void;
  onRestart: () => void;
}) {
  const waiting = attempt.status === "attente";
  const credited = attempt.status === "reussie" || attempt.status === "anomalie";

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border px-5 py-5 ${
          credited ? "border-green/40 bg-green/5" : waiting ? "border-line bg-paper" : "border-magenta/30 bg-magenta/5"
        }`}
      >
        <p className="text-sm font-bold">
          {waiting
            ? "Validez la demande sur votre téléphone"
            : credited
              ? `Crédit reçu : ${attempt.credited.toLocaleString("fr-FR")} FCFA`
              : "Paiement non abouti"}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          {waiting ? (
            <>
              {attempt.operator} a envoyé une demande de {attempt.amount.toLocaleString("fr-FR")}{" "}
              FCFA au {attempt.phone}. Saisissez votre code sur le téléphone : votre solde se met à
              jour ici tout seul.
            </>
          ) : (
            attempt.message ||
            (credited
              ? "Votre solde a été mis à jour."
              : "Aucun montant n’a été débité.")
          )}
        </p>

        {waiting ? (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
            En attente de votre validation…
          </p>
        ) : null}

        {providerLink && waiting ? (
          <a
            href={providerLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Ouvrir la page de l’opérateur
          </a>
        ) : null}
      </div>

      {simulation && waiting ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Téléphone simulé
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => onRespond("valide")} disabled={busy}>
              Je valide
            </Button>
            <Button type="button" variant="ghost" onClick={() => onRespond("refuse")} disabled={busy}>
              Je refuse
            </Button>
            <Button type="button" variant="ghost" onClick={() => onRespond("expire")} disabled={busy}>
              Je ne réponds pas
            </Button>
          </div>
        </div>
      ) : null}

      {error !== "" ? (
        <p className="rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
          {error}
        </p>
      ) : null}

      {!waiting ? (
        <Button type="button" variant="ghost" onClick={onRestart} className="w-full">
          Faire une autre recharge
        </Button>
      ) : null}
    </div>
  );
}
