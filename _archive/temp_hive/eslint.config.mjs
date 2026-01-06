import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    ignores: ['cortex/**', 'lib/mutations/**', 'lib/genesisDraft.ts', 'public/mutations/**'],
  },
];

export default config;
