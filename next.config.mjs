// Plain JavaScript on purpose: Hostinger's build servers use an older Linux (glibc < 2.29),
// so Next.js falls back to its WebAssembly compiler, which cannot compile a next.config.ts.

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
};

export default nextConfig;
