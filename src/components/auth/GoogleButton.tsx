"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bouton « Continuer avec Google ».
 *
 * Google rend le bouton lui-même, dans son propre conteneur : c'est une
 * exigence de leur bibliothèque, et un bouton redessiné à la main serait
 * refusé par leurs règles d'utilisation.
 *
 * Le jeton d'identité obtenu ici ne vaut rien tant qu'il n'a pas été vérifié :
 * il part vers /api/auth/google, qui le fait valider par Google côté serveur
 * avant d'ouvrir la moindre session.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

export function GoogleButton({
  clientId,
  onCredential,
  disabled = false,
}: {
  clientId: string;
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (clientId === "" || !container.current) {
      return;
    }

    const element = container.current;

    function render() {
      if (!window.google || !element) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });

      window.google.accounts.id.renderButton(element, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        locale: "fr",
        width: 320,
      });
    }

    if (window.google) {
      render();
      return;
    }

    // Le script n'est chargé que sur les pages qui en ont besoin : inutile de
    // faire porter un appel à Google à chaque visiteur de la page d'accueil.
    const existing = document.getElementById("google-identity") as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    script.id = "google-identity";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    script.addEventListener("error", () => setFailed(true));

    if (!existing) {
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener("load", render);
    };
  }, [clientId, onCredential]);

  if (clientId === "") {
    return null;
  }

  if (failed) {
    return (
      <p className="text-center text-sm text-ink-500">
        La connexion Google est indisponible pour le moment. Utilisez votre adresse e-mail.
      </p>
    );
  }

  return (
    <div
      ref={container}
      className={`flex justify-center ${disabled ? "pointer-events-none opacity-50" : ""}`}
    />
  );
}
