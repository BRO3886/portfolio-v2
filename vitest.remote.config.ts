import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Opt-in: calls the real Cloudflare Images binding with your wrangler login. Billed per transformation.
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './test/remote/wrangler.toml' }, remoteBindings: true })],
  test: { include: ['test/remote/**/*.remote.test.ts'] },
});
