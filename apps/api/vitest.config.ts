import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.integration.test.ts'],
    // Los tests de integración necesitan setup y corren en serie (comparten DB)
    fileParallelism: false,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', 'dist', '.next'],
  },
});