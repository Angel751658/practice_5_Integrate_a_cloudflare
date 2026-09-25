import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
		}),
	],
	test: {
		coverage: {
			provider: 'istanbul',
			include: ['src/**/*.ts'],
			reporter: ['text', 'html', 'json-summary', 'lcov'],
			reportsDirectory: './coverage',
		},
	},
});
