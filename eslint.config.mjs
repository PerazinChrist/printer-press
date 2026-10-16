import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Configuration ESLint à plat.
 *
 * eslint-config-next 16 expose directement ses configurations « flat » : passer
 * par FlatCompat, comme le faisaient les versions précédentes, fait échouer
 * ESLint 9 sur une structure circulaire.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "documents/**"],
  },
];

export default eslintConfig;
