/**
 * Traceur d'audience.
 *
 * Il accumule les signaux et les envoie par lots au relais /api/pp/collect,
 * qui les transmet au plugin. Trois principes :
 *
 *  - rien d'identifiant ne circule : la clé visiteur est un identifiant
 *    aléatoire, et aucun e-mail, nom ou identifiant de compte n'est joint ;
 *  - les envois sont groupés, pour ne pas faire une requête par clic ;
 *  - le départ de la page utilise sendBeacon, seule manière de faire partir un
 *    dernier lot alors que le navigateur ferme l'onglet.
 *
 * Tout échec est silencieux : la mesure ne doit jamais gêner le service.
 */

const ENDPOINT = "/api/pp/collect";
const VISITOR_KEY = "pp_visitor";
const SESSION_KEY = "pp_session_an";

/** Au-delà, le lot part sans attendre la fin du délai. */
const BATCH_SIZE = 10;

/** Délai de regroupement, en millisecondes. */
const BATCH_DELAY = 2500;

type Signal =
  | { t: "view"; k: string; p: string; ti: string; f: string }
  | { t: "ping"; k: string; d: number; s: number }
  | { t: "event"; c: string; a: string; l: string; v: number; p: string };

type Context = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  referrer: string;
  landing: string;
};

let queue: Signal[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let context: Context | null = null;
let currentView = { key: "", startedAt: 0, scroll: 0 };

/** Identifiant aléatoire, de la forme d'un UUID v4. */
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}

/**
 * Lit une clé persistée, ou en crée une.
 *
 * Le stockage peut échouer — navigation privée, cookies bloqués. Dans ce cas on
 * garde une clé en mémoire : la visite est mesurée, elle ne sera simplement pas
 * reliée à la suivante.
 */
function key(store: Storage | null, name: string): string {
  try {
    const existing = store?.getItem(name);

    if (existing) {
      return existing;
    }

    const fresh = uuid();
    store?.setItem(name, fresh);

    return fresh;
  } catch {
    return uuid();
  }
}

/** Contexte d'arrivée : utm de l'URL, sinon référent. */
function readContext(): Context {
  if (context) {
    return context;
  }

  const params = new URLSearchParams(window.location.search);

  context = {
    source: params.get("utm_source") ?? "",
    medium: params.get("utm_medium") ?? "",
    campaign: params.get("utm_campaign") ?? "",
    content: params.get("utm_content") ?? "",
    term: params.get("utm_term") ?? "",
    // Un référent interne n'apprend rien : c'est la page précédente du site.
    referrer: document.referrer.includes(window.location.host) ? "" : document.referrer,
    landing: window.location.pathname,
  };

  return context;
}

function send(immediate = false): void {
  if (queue.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    visitor: key(window.localStorage, VISITOR_KEY),
    session: key(window.sessionStorage, SESSION_KEY),
    viewport: window.innerWidth,
    ...readContext(),
    signals: queue,
  });

  queue = [];

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  try {
    if (immediate && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Mesure perdue : ce n'est pas un incident.
  }
}

function push(signal: Signal): void {
  if (typeof window === "undefined") {
    return;
  }

  queue.push(signal);

  if (queue.length >= BATCH_SIZE) {
    send();
    return;
  }

  if (!timer) {
    timer = setTimeout(() => send(), BATCH_DELAY);
  }
}

/**
 * Enregistre une page vue, et clôt la précédente.
 */
export function trackView(path: string, title: string, from: string): void {
  if (typeof window === "undefined") {
    return;
  }

  closeView();

  currentView = { key: uuid(), startedAt: Date.now(), scroll: 0 };

  push({ t: "view", k: currentView.key, p: path, ti: title.slice(0, 190), f: from });
}

/**
 * Clôt la vue courante : temps passé et profondeur de lecture.
 */
export function closeView(immediate = false): void {
  if (currentView.key === "") {
    return;
  }

  push({
    t: "ping",
    k: currentView.key,
    d: Math.round((Date.now() - currentView.startedAt) / 1000),
    s: currentView.scroll,
  });

  if (immediate) {
    send(true);
  }
}

/** Mémorise la profondeur de lecture atteinte. */
export function noteScroll(): void {
  const doc = document.documentElement;
  const height = doc.scrollHeight - doc.clientHeight;

  if (height <= 0) {
    return;
  }

  const depth = Math.round((doc.scrollTop / height) * 100);

  currentView.scroll = Math.max(currentView.scroll, Math.min(100, depth));
}

/**
 * Enregistre un événement métier.
 *
 * @param category Famille, ex. « compte », « planche ».
 * @param action   Ce qui vient de se produire, ex. « planche_generee ».
 * @param label    Précision libre.
 * @param value    Montant associé, en FCFA, quand il y en a un.
 */
export function trackEvent(category: string, action: string, label = "", value = 0): void {
  if (typeof window === "undefined") {
    return;
  }

  push({
    t: "event",
    c: category,
    a: action,
    l: label.slice(0, 190),
    v: Math.round(value),
    p: window.location.pathname,
  });
}

/** Force l'envoi du lot en attente. */
export function flush(immediate = false): void {
  send(immediate);
}
