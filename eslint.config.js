import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Disable unused imports/variables warnings
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Disable unused imports specifically
      "@typescript-eslint/no-unused-imports": "off",

  
      "@typescript-eslint/no-explicit-any": "warn", // Keep as warning instead of error
      "prefer-const": "warn", // Keep as warning instead of error
    },
  }
);
