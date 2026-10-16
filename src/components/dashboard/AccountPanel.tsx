"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ApiRequestError, apiSend } from "@/lib/api";
import type { Account, FieldErrors, Session } from "@/lib/types";

/**
 * Informations du compte et mot de passe.
 *
 * L'adresse e-mail n'est pas modifiable : elle identifie le compte et sert de
 * point d'entrée à la connexion Google. La changer suppose de vérifier les deux
 * adresses, ce que la V1 ne fait pas — mieux vaut un champ désactivé et une
 * explication qu'un formulaire qui casse un compte.
 */
export function AccountPanel({
  account,
  sessions,
}: {
  account: Account;
  sessions: Session[];
}) {
  const router = useRouter();
  const [openSessions, setOpenSessions] = useState<Session[]>(sessions);
  const [closing, setClosing] = useState(false);

  const [profile, setProfile] = useState({
    fullName: account.fullName,
    company: account.company,
    phone: account.phone,
    city: account.city,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [savedAt, setSavedAt] = useState("");
  const [busy, setBusy] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setSavedAt("");

    try {
      await apiSend<{ account: Account }>("/me", profile, "PATCH");
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { timeStyle: "short" }));
    } catch (failure) {
      if (failure instanceof ApiRequestError) {
        setErrors(failure.errors);
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordErrors({});
    setPasswordMessage("");

    try {
      await apiSend("/me/password", passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setPasswordMessage(
        "Mot de passe enregistré. Vos autres sessions ont été fermées — c’est voulu.",
      );
    } catch (failure) {
      if (failure instanceof ApiRequestError) {
        setPasswordErrors(failure.errors);

        if (Object.keys(failure.errors).length === 0) {
          setPasswordMessage(failure.message);
        }
      }
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">Mes informations</h2>

        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Adresse e-mail</span>
            <input
              value={account.email}
              disabled
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink-500"
            />
            <span className="mt-1 block text-xs text-ink-500">
              Elle identifie votre compte. Écrivez-nous pour la changer.
            </span>
          </label>

          {(
            [
              { field: "fullName", label: "Nom complet" },
              { field: "company", label: "Entreprise" },
              { field: "phone", label: "Téléphone" },
              { field: "city", label: "Ville" },
            ] as const
          ).map((item) => (
            <label key={item.field} className="block">
              <span className="text-sm font-semibold">{item.label}</span>
              <input
                value={profile[item.field]}
                onChange={(event) =>
                  setProfile((previous) => ({ ...previous, [item.field]: event.target.value }))
                }
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan ${
                  errors[item.field] ? "border-magenta" : "border-line"
                }`}
              />
              {errors[item.field] ? (
                <span className="mt-1 block text-xs font-medium text-magenta">
                  {errors[item.field]}
                </span>
              ) : null}
            </label>
          ))}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {savedAt !== "" ? (
              <span className="text-xs text-green">Enregistré à {savedAt}.</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-bold">
            {account.hasPassword ? "Changer mon mot de passe" : "Définir un mot de passe"}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {account.hasPassword
              ? "Toutes vos sessions seront fermées, y compris celle-ci."
              : "Votre compte a été créé avec Google. Un mot de passe vous permettra aussi de vous connecter par e-mail."}
          </p>

          <form onSubmit={savePassword} className="mt-5 space-y-4">
            {account.hasPassword ? (
              <label className="block">
                <span className="text-sm font-semibold">Mot de passe actuel</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      currentPassword: event.target.value,
                    }))
                  }
                  className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan ${
                    passwordErrors.currentPassword ? "border-magenta" : "border-line"
                  }`}
                />
                {passwordErrors.currentPassword ? (
                  <span className="mt-1 block text-xs font-medium text-magenta">
                    {passwordErrors.currentPassword}
                  </span>
                ) : null}
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-semibold">Nouveau mot de passe</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) =>
                  setPasswords((previous) => ({ ...previous, newPassword: event.target.value }))
                }
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-cyan ${
                  passwordErrors.newPassword ? "border-magenta" : "border-line"
                }`}
              />
              <span className="mt-1 block text-xs text-ink-500">
                8 caractères minimum, avec au moins une lettre et un chiffre.
              </span>
              {passwordErrors.newPassword ? (
                <span className="mt-1 block text-xs font-medium text-magenta">
                  {passwordErrors.newPassword}
                </span>
              ) : null}
            </label>

            {passwordMessage !== "" ? (
              <p className="rounded-xl bg-paper px-4 py-3 text-sm">{passwordMessage}</p>
            ) : null}

            <Button type="submit" variant="secondary" disabled={passwordBusy}>
              {passwordBusy ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Sessions ouvertes</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                Chaque appareil où vous êtes resté connecté. Si vous en voyez un que vous ne
                reconnaissez pas, fermez tout et changez de mot de passe.
              </p>
            </div>

            {openSessions.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                disabled={closing}
                onClick={async () => {
                  setClosing(true);

                  try {
                    await apiSend("/me/sessions", undefined, "DELETE");
                    setOpenSessions([]);
                    // Celle-ci tombe aussi : on repasse par la connexion.
                    router.push("/connexion");
                    router.refresh();
                  } finally {
                    setClosing(false);
                  }
                }}
              >
                {closing ? "…" : "Tout fermer"}
              </Button>
            ) : null}
          </div>

          {openSessions.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Aucune session ouverte.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {openSessions.map((session) => (
                <li key={`${session.createdAt}-${session.ip}`} className="py-3">
                  <p className="font-semibold">{deviceLabel(session.userAgent)}</p>
                  <p className="text-xs text-ink-500">
                    {session.ip || "adresse inconnue"} · ouverte le{" "}
                    {new Date(session.createdAt.replace(" ", "T")).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-bold">Votre compte</h2>

          <dl className="mt-4 space-y-3 text-sm">
            {[
              { label: "Connexion Google", value: account.googleLinked ? "Reliée" : "Non reliée" },
              { label: "Cartes enregistrées", value: String(account.cardsCount) },
              { label: "Planches produites", value: String(account.sheetsCount) },
              {
                label: "Compte créé le",
                value: new Date(account.createdAt.replace(" ", "T")).toLocaleDateString("fr-FR"),
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-ink-500">{row.label}</dt>
                <dd className="font-semibold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

/**
 * Nom lisible d'un appareil à partir de son user-agent.
 *
 * On ne cherche pas l'exactitude : « Chrome sur Windows » suffit à ce que
 * quelqu'un reconnaisse — ou non — sa propre machine.
 */
function deviceLabel(userAgent: string): string {
  if (userAgent === "") {
    return "Appareil inconnu";
  }

  const navigateur =
    /Edg\//.test(userAgent) ? "Edge"
    : /OPR\//.test(userAgent) ? "Opera"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Safari\//.test(userAgent) ? "Safari"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : "Navigateur";

  const systeme =
    /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Windows/.test(userAgent) ? "Windows"
    : /Mac OS/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux"
    : "";

  return systeme === "" ? navigateur : `${navigateur} sur ${systeme}`;
}
