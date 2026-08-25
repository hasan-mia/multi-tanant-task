import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/components/common/data-table.tsx",
      "src/components/common/resource-table.tsx",
      "src/features/**/components/**/*form*.tsx",
      "src/features/**/components/**/*drawer*.tsx",
      "src/features/**/components/**/*dialog*.tsx",
      "src/features/auth/components/**",
      "src/features/admin/components/admin-tenants-page.tsx",
      "src/features/admin/components/admin-subscription-plans-page.tsx",
    ],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
]);

export default eslintConfig;
