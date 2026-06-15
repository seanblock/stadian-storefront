import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      "vendor/**",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextConfig,
];
