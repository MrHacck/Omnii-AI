import coreWebVitals from "eslint-config-next/core-web-vitals.js";
import typescript from "eslint-config-next/typescript.js";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
