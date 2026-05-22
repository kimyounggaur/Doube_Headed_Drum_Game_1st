import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Vite 본체와 타입이 충돌하지 않도록 vitest 설정을 별도 파일로 분리.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
