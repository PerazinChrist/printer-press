"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/Button";
import { ApiRequestError, authRequest } from "@/lib/api";
import type { Account, FieldErrors } from "@/lib/types";

/**
 * Formulaire de connexion et d'inscription.
 *
 * Un seul composant pour les deux : les champs changent, le reste — gestion des
 * erreurs par champ, bouton Google, redirection — est rigoureusement identique,
 * et deux copies finiraient par diverger.
 */

type Mode = "login" | "register";

export function AuthForm({
  mode,
  googleClientId,
  next,
}: {
  mode: Mode;
  googleClientId: string;
  next: string;
}) {
  const router = useRouter();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const destination = next.startsWith("/") ? next : "/tableau-de-bord";

  function update(field: keyof typeof values, value: string | boolean) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function handleFailure(error: unknown) {
    if (error instanceof ApiRequestError) {
      setErrors(error.errors);
      setMessage(Object.keys(error.errors).length > 0 ? "" : error.message);
      return;
    }

    setMessage("Connexion impossible. Vérifiez votre réseau et réessayez.");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");

    try {
      await authRequest<{ account: Account }>(
        mode,
        mode === "login"
          ? { email: values.email, password: values.password }
          : values,
      );

      router.push(destination);
      router.refresh();
    } catch (error) {
      handleFailure(error);
    } finally {
      setBusy(false);
    }
  }

  const onCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setErrors({});
      setMessage("");

      try {
        await authRequest<{ account: Account }>("google", { idToken });
        router.push(destination);
        router.refresh();
      } catch (error) {
        handleFailure(error);
      } finally {
        setBusy(false);
      }
    },
    [destination, router],
  );

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {mode === "login" ? "Content de vous revoir." : "Créez votre compte."}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        {mode === "login"
          ? "Retrouvez vos cartes, vos planches et votre solde."
          : "Deux minutes, et votre première planche est prête. L’aperçu reste gratuit."}
      </p>

      {googleClientId !== "" ? (
        <div className="mt-8">
          <GoogleButton clientId={googleClientId} onCredential={onCredential} disabled={busy} />

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-300">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "register" ? (
          <Field
            label="Votre nom"
            value={values.fullName}
            error={errors.fullName}
            autoComplete="name"
            onChange={(value) => update("fullName", value)}
          />
        ) : null}

        <Field
          label="Adresse e-mail"
          type="email"
          value={values.email}
          error={errors.email}
          autoComplete="email"
          onChange={(value) => update("email", value)}
        />

        <Field
          label="Mot de passe"
          type="password"
          value={values.password}
          error={errors.password}
          hint={mode === "register" ? "8 caractères minimum, avec une lettre et un chiffre." : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={(value) => update("password", value)}
        />

        {mode === "register" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Téléphone (facultatif)"
                value={values.phone}
                error={errors.phone}
                autoComplete="tel"
                onChange={(value) => update("phone", value)}
              />
              <Field
                label="Entreprise (facultatif)"
                value={values.company}
                error={errors.company}
                autoComplete="organization"
                onChange={(value) => update("company", value)}
              />
            </div>

            <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-500">
              <input
                type="checkbox"
                checked={values.acceptTerms}
                onChange={(event) => update("acceptTerms", event.target.checked)}
                className="mt-1 h-4 w-4 flex-none accent-magenta"
              />
              <span>
                J’accepte les conditions d’utilisation et le traitement de mes visuels pour la
                seule production de mes planches.
                {errors.acceptTerms ? (
                  <span className="mt-1 block font-medium text-magenta">{errors.acceptTerms}</span>
                ) : null}
              </span>
            </label>
          </>
        ) : null}

        {message !== "" ? (
          <p className="rounded-xl border border-magenta/30 bg-magenta/5 px-4 py-3 text-sm font-medium text-magenta-dark">
            {message}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy
            ? "Un instant…"
            : mode === "login"
              ? "Se connecter"
              : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-bold text-ink hover:text-magenta">
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            Vous avez déjà un compte ?{" "}
            <Link href="/connexion" className="font-bold text-ink hover:text-magenta">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-cyan ${
          error ? "border-magenta" : "border-line"
        }`}
      />
      {error ? <span className="mt-1 block text-xs font-medium text-magenta">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-xs text-ink-500">{hint}</span> : null}
    </label>
  );
}
