"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { closeView, flush, noteScroll, trackView } from "@/lib/track";

/**
 * Mesure d'audience, posée une fois pour tout le site.
 *
 * Elle déclare une page vue à chaque changement d'adresse — navigation côté
 * client comprise, sans quoi un site en React ne compterait qu'une seule page
 * par visite — puis clôt la vue quand l'onglet passe en arrière-plan.
 *
 * Le composant ne rend rien : il n'a pas à peser sur l'affichage.
 */
export function Tracker() {
  const pathname = usePathname();
  const previous = useRef("");

  useEffect(() => {
    trackView(pathname, document.title, previous.current);
    previous.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // « visibilitychange » est le seul signal fiable sur mobile : « unload »
    // n'est pas déclenché quand l'utilisateur bascule d'application.
    function onHidden() {
      if (document.visibilityState === "hidden") {
        closeView(true);
      }
    }

    function onScroll() {
      noteScroll();
    }

    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", () => closeView(true));
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("scroll", onScroll);
      flush();
    };
  }, []);

  return null;
}
