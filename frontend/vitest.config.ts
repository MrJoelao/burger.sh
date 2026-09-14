import { defineConfig } from 'vitest/config';
import path from 'path';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
      },
    },
    include: [
      'src/**/*.test.{js,ts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'tests/e2e/**'],
  },
});