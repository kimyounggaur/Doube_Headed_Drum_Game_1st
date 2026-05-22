import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// 프로젝트 비전: "리듬은 곧 전술이다" — 단일 AudioContext 동기화를 위해 모든 오디오는 Tone.js로 통합.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Doube_Headed_Drum_Game_1st/' : '/',
  plugins: [react()],
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
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    // Tone.js + Framer Motion + i18next 등이 합쳐져 sourcemap 생성이 무거워 메모리 압박이 큼.
    // 프로덕션은 false, 디버깅 필요 시 환경변수로 토글.
    sourcemap: process.env.SOURCEMAP === 'true',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-audio': ['tone'],
          'vendor-motion': ['framer-motion', 'gsap'],
          'vendor-pixi': ['pixi.js'],
        },
      },
    },
  },
});
