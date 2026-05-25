import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-src 'self' https://secure.networkmerchants.com https://jstest.authorize.net https://js.authorize.net",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The Stadian SDK ships extensionless ESM imports (built with
  // moduleResolution "bundler"). Transpile it so Next resolves it in
  // production the same way it does in dev.
  transpilePackages: ["@stadian/storefront-sdk"],
  images: {
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      ...(isDev ? [{ protocol: "http" as const, hostname: "localhost" }] : []),
    ],
  },
  turbopack: {},
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
