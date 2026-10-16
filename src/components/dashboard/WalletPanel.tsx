"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { MobileMoneyForm } from "@/components/dashboard/MobileMoneyForm";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiGet, apiSend } from "@/lib/api";
import type { PaymentSettings, Transaction, Wallet } from "@/lib/types";

/**
 * Crédits : solde, recharge, historique.
 *
 * Deux chemins, selon ce qui est ouvert sur la plateforme :
 *
 *  - en ligne, la demande part sur le téléphone du client et le crédit arrive
 *    tout seul ;
 *  - à défaut, le client verse par Mobile Money au numéro affiché et déclare
 *    son versement, que l'administration confirme.
 *
 * Le second reste accessible même quand le premier fonctionne : un opérateur
 * en panne ne doit pas fermer la caisse.
 */
export function WalletPanel({
  wallet,
  payment,
}: {
  wallet: Wallet;
  payment: PaymentSettings;
}) {
  const router = useRouter();

  const [balanceLabel, setBalanceLabel] = useState(wallet.balanceLabel);
  const [balance, setBalance] = useState(wallet.balance);
  const [transactions, setTransactions] = useState<Transaction[]>(wallet.transactions);
  const [showManual, setShowManual] = useState(!payment.online);

  const sheetsLeft = Math.floor(balance / Math.max(1, wallet.price));

  /** Après un encaissement, le solde et l'historique sont relus d'un bloc. */
  const refresh = useCallback(
    async (label: string, amount: number) => {
      setBalanceLabel(label);
      setBalance(amount);

      const fresh = await apiGet<Wallet>("/wallet").catch(() => null);

      if (fresh) {
        setTransactions(fresh.transactions);
        setBalanceLabel(fresh.balanceLabel);
        setBalance(fresh.balance);
      }

      // L'en-tête du tableau de bord affiche le solde, rendu côté serveur.
      router.refresh();
    },
    [router],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Solde", value: balanceLabel },
          { label: "Planches possibles", value: `${sheetsLeft}` },
          { label: "Prix d’une planche", value: wallet.priceLabel },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-bold">Recharger mon compte</h2>

          {payment.online ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                La demande arrive sur votre téléphone : vous validez avec votre code, et votre
                solde augmente dans la seconde.
              </p>

              <div className="mt-5">
                <MobileMoneyForm
                  payment={payment}
                  price={wallet.price}
                  minRecharge={wallet.minRecharge}
                  onCredited={refresh}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowManual((value) => !value)}
                className="mt-6 text-sm font-semibold text-ink-500 underline decoration-line underline-offset-4 hover:text-ink"
              >
                {showManual ? "Masquer" : "J’ai déjà envoyé l’argent à la main"}
              </button>
            </>
          ) : null}

          {showManual ? (
            <ManualDeclaration
              wallet={wallet}
              compact={payment.online}
              onDeclared={(transaction) => {
                setTransactions((previous) => [transaction, ...previous]);
                router.refresh();
              }}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <GiftCode onCredited={refresh} />

          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">Historique</h2>

            {transactions.length === 0 ? (
              <p className="mt-4 text-sm text-ink-500">Aucun mouvement pour l’instant.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{transaction.typeLabel}</p>
                    <p className="text-xs text-ink-500">
                      {new Date(transaction.createdAt.replace(" ", "T")).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                      {transaction.reference !== "" ? ` · ${transaction.reference}` : ""}
                    </p>
                    {transaction.note !== "" ? (
                      <p className="mt-1 text-xs text-ink-500">{transaction.note}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        transaction.amount >= 0 ? "text-green" : "text-ink"
                      }`}
                    >
                      {transaction.amountLabel}
                    </p>
                    <p className="text-xs text-ink-500">
                      {transaction.status === "en_attente"
                        ? "en attente"
                        : transaction.status === "valide"
                          ? "validé"
                          : transaction.status === "refuse"
                            ? "refusé"
                            : "remboursé"}
                    </p>
                  </div>
                </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Encaissement d'un code offrant du crédit.
 *
 * Séparé du formulaire de recharge : ce n'est pas un paiement, et le mêler aux
 * champs Mobile Money laisserait croire qu'il faut verser quelque chose.
 */
function GiftCode({
  onCredited,
}: {
  onCredited: (balanceLabel: string, balance: number) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (code.trim() === "") {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await apiSend<{
        credited: number;
        balance: number;
        balanceLabel: string;
        message: string;
      }>("/promos/credit", { code });

      setMessage(result.message);
      setCode("");
      onCredited(result.balanceLabel, result.balance);
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError ? failure.message : "Ce code n’a pas pu être utilisé.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-bold">Code cadeau</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-500">
        Un code qui offre du crédit s’encaisse ici. Une remise sur une planche, elle, se saisit au
        moment de générer.
      </p>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="CADEAU"
          className="w-full rounded-xl border border-line px-4 py-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-cyan"
        />
        <Button type="submit" variant="ghost" disabled={busy || code.trim() === ""}>
          {busy ? "…" : "Utiliser"}
        </Button>
      </form>

      {error !== "" ? <p className="mt-3 text-sm font-medium text-magenta">{error}</p> : null}
      {message !== "" ? <p className="mt-3 text-sm font-medium text-green">{message}</p> : null}
    </div>
  );
}

/**
 * Versement déclaré à la main, confirmé ensuite par l'administration.
 */
function ManualDeclaration({
  wallet,
  compact,
  onDeclared,
}: {
  wallet: Wallet;
  compact: boolean;
  onDeclared: (transaction: Transaction) => void;
}) {
  const [amount, setAmount] = useState(wallet.price * 10);
  const [method, setMethod] = useState<"momo_mtn" | "momo_om" | "especes">("momo_mtn");
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const hasMomo = wallet.momo.mtn !== "" || wallet.momo.orange !== "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSent("");

    try {
      const result = await apiSend<{ transaction: Transaction; message: string }>(
        "/wallet/recharge",
        { amount, method, reference, payerPhone },
      );

      onDeclared(result.transaction);
      setSent(result.message);
      setReference("");
    } catch (failure) {
      setError(
        failure instanceof ApiRequestError
          ? failure.message
          : "La demande n’a pas pu être envoyée.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "mt-4 border-t border-line pt-5" : "mt-5"}>
      {hasMomo ? (
        <div className="rounded-xl bg-paper px-5 py-4 text-sm leading-relaxed">
          <p className="font-semibold">1. Envoyez le montant à l’un de ces numéros :</p>
          <ul className="mt-2 space-y-1">
            {wallet.momo.mtn !== "" ? (
              <li>
                MTN MoMo — <strong className="font-mono">{wallet.momo.mtn}</strong>
              </li>
            ) : null}
            {wallet.momo.orange !== "" ? (
              <li>
                Orange Money — <strong className="font-mono">{wallet.momo.orange}</strong>
              </li>
            ) : null}
          </ul>
          {wallet.momo.name !== "" ? (
            <p className="mt-2 text-ink-500">
              Vérifiez que le destinataire affiché est bien {wallet.momo.name}.
            </p>
          ) : null}
          <p className="mt-3 font-semibold">2. Déclarez votre versement ci-dessous.</p>
        </div>
      ) : (
        <p className="rounded-xl bg-paper px-5 py-4 text-sm leading-relaxed text-ink-500">
          Les numéros de paiement ne sont pas encore publiés. Contactez-nous pour recharger.
        </p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Montant versé</span>
          <input
            type="number"
            min={wallet.minRecharge}
            step={50}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
          />
          <span className="mt-1 block text-xs text-ink-500">
            Minimum {wallet.minRecharge.toLocaleString("fr-FR")} FCFA.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Moyen de paiement</span>
          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as "momo_mtn" | "momo_om" | "especes")
            }
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-cyan"
          >
            <option value="momo_mtn">MTN Mobile Money</option>
            <option value="momo_om">Orange Money</option>
            <option value="especes">Espèces</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Référence du transfert</span>
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex. 2501234567"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Numéro émetteur</span>
            <input
              value={payerPhone}
              onChange={(event) => setPayerPhone(event.target.value)}
              placeholder="6XX XX XX XX"
              className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-cyan"
            />
          </label>
        </div>

        {error !== "" ? (
          <p className="rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
            {error}
          </p>
        ) : null}

        {sent !== "" ? (
          <p className="rounded-xl border border-green/30 bg-green/5 px-4 py-3 text-sm font-medium text-green">
            {sent}
          </p>
        ) : null}

        <Button type="submit" variant={compact ? "ghost" : "primary"} disabled={busy} className="w-full">
          {busy ? "Envoi…" : "Déclarer mon versement"}
        </Button>
      </form>
    </div>
  );
}
