/**
 * Types partagés entre le front et l'API du plugin WordPress.
 *
 * Ils reproduisent exactement les charges utiles produites par les méthodes
 * to_payload() du plugin : toute divergence se verrait ici d'abord.
 */

export type Session = {
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
};

export type Account = {
  id: string;
  email: string;
  fullName: string;
  company: string;
  phone: string;
  city: string;
  avatarUrl: string;
  status: "actif" | "suspendu";
  hasPassword: boolean;
  googleLinked: boolean;
  balance: number;
  balanceLabel: string;
  cardsCount: number;
  sheetsCount: number;
  createdAt: string;
  lastLoginAt: string;
};

export type CardSide = {
  width: number;
  height: number;
  /** Vrai quand l'image fait au moins 1016 × 638 px, soit la carte à 300 dpi. */
  sharp: boolean;
};

export type Card = {
  id: string;
  name: string;
  frontUrl: string;
  backUrl: string;
  front: CardSide;
  back: CardSide;
  sheetsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Sheet = {
  id: string;
  label: string;
  gapMm: number;
  fitMode: "cover" | "contain";
  cutMarks: boolean;
  price: number;
  priceLabel: string;
  /** Code promo appliqué à la génération, s'il y en a eu un. */
  promoCode: string;
  discount: number;
  status: string;
  bytes: number;
  downloads: number;
  createdAt: string;
  files: {
    frontPdf: string;
    backPdf: string;
    frontPng: string;
    backPng: string;
  };
  previews: {
    front: string;
    back: string;
  };
};

export type Transaction = {
  id: string;
  type: "recharge" | "debit" | "ajustement" | "remboursement";
  typeLabel: string;
  amount: number;
  amountLabel: string;
  balanceAfter: number;
  status: "en_attente" | "valide" | "refuse" | "rembourse";
  method: string;
  reference: string;
  note: string;
  createdAt: string;
};

export type MomoSettings = {
  mtn: string;
  orange: string;
  name: string;
};

export type SheetSpecs = {
  cardWidthCm: number;
  cardHeightCm: number;
  perPage: number;
  cols: number;
  rows: number;
  dpi: number;
  pageFormat: string;
  defaultGapMm: number;
  maxGapMm: number;
  idealWidthPx: number;
  idealHeightPx: number;
};

export type PaymentCountry = {
  code: string;
  name: string;
  dial: string;
  currency: string;
  example: string;
};

export type PaymentSettings = {
  /** manuel | sebpay | simulation. */
  mode: string;
  /** Vrai quand la demande part sur le téléphone du client. */
  online: boolean;
  simulation: boolean;
  /** Clés de test SebPay : rien n'est réellement débité. */
  sandbox: boolean;
  countries: PaymentCountry[];
};

export type PaymentOperator = {
  slug: string;
  code: string;
  name: string;
  /** L'opérateur réclame un code obtenu par USSD avant de lancer la demande. */
  otp: boolean;
  ussd: string;
};

export type PaymentAttempt = {
  reference: string;
  /** attente | reussie | echouee | anomalie. */
  status: string;
  message: string;
  amount: number;
  credited: number;
  operator: string;
  phone: string;
  simulation: boolean;
  createdAt: string;
  settledAt: string;
};

export type Promo = {
  code: string;
  label: string;
  /** remise | credit. */
  type: string;
  /** Phrase prête à afficher, ex. « −50 % sur la planche : 150 FCFA ». */
  summary: string;
  /** Prix de la planche une fois la remise appliquée. */
  price: number;
  priceLabel: string;
  discount: number;
  discountLabel: string;
  /** Montant offert, pour un code de type crédit. */
  credit: number;
};

export type PublicSettings = {
  price: number;
  priceLabel: string;
  currency: string;
  minRecharge: number;
  googleEnabled: boolean;
  googleClientId: string;
  momo: MomoSettings;
  support: { phone: string; email: string };
  sheet: SheetSpecs;
  payment: PaymentSettings;
};

export type Overview = {
  account: Account;
  price: number;
  priceLabel: string;
  sheetsLeft: number;
  recentSheets: Sheet[];
  recentCards: Card[];
  transactions: Transaction[];
};

export type Wallet = {
  balance: number;
  balanceLabel: string;
  price: number;
  priceLabel: string;
  sheetsLeft: number;
  minRecharge: number;
  momo: MomoSettings;
  transactions: Transaction[];
};

/** Erreurs rattachées à un champ, telles que les renvoie le plugin. */
export type FieldErrors = Record<string, string>;

export type ApiError = {
  code: string;
  message: string;
  errors?: FieldErrors;
};
