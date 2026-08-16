// frontend/eslint.config.js
//
// Flat config (ESLint 9+). The project previously referenced a lint script
// with no config and no eslint installed, so this is the first configuration
// the codebase has had — hence the deliberately narrow rule set below.
//
//   npm run lint        report only
//   npm run lint:fix    apply the safe autofixes

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "app/**", // generated Android project — hand-authored, never lint or fix
      "public/**",
      "scripts/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      /* The rules worth having on a React codebase: they catch real defects
       * rather than style. A stale dependency array is a genuine bug class,
       * and this project already carries one acknowledged suppression. */
      ...reactHooks.configs.recommended.rules,

      /* Unused symbols are how dead code accumulates — this audit already
       * found an unrendered import and an empty module. Underscore-prefixed
       * names stay allowed for deliberate discards. */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      /* `any` is widespread in the existing data-mapping layer, where feeds
       * arrive loosely typed. Warn so new instances are visible without
       * failing the build on the existing ones. */
      "@typescript-eslint/no-explicit-any": "warn",

      /* Console noise has repeatedly reached production here. Errors and
       * warnings are legitimate; log and debug are not. */
      "no-console": ["warn", { allow: ["warn", "error"] }],

      /* Empty blocks usually mean an unfinished branch. */
      "no-empty": ["warn", { allowEmptyCatch: true }],

      /* The interface uses non-breaking and narrow no-break spaces
       * deliberately — a thin space before a unit in "6 mph", and a
       * non-breaking one holding "Dark Mode" together. Those are correct
       * typography, so only flag stray invisibles in code. */
      "no-irregular-whitespace": [
        "error",
        { skipStrings: true, skipTemplates: true, skipJSXText: true },
      ],
    },
  },

  {
    /* Node test files run outside the browser. */
    files: ["src/**/*.test.mjs"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  }
);
