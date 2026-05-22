/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 한국 전통 단청 색상 팔레트 — 모든 UI 베이스 컬러
      colors: {
        dancheong: {
          red: '#a91b0d',
          blue: '#1f3a5f',
          green: '#3a7d44',
          yellow: '#e8b647',
          white: '#f4ecd8',
        },
        ink: '#1a1a1a',      // 먹색
        hanji: '#f4ecd8',    // 한지색
      },
      fontFamily: {
        // Noto Serif KR을 기본 본문체로, 굵은 weight를 제목용으로 활용
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        title: ['"Noto Serif KR"', 'serif'],
      },
      boxShadow: {
        dancheong: '0 0 0 2px #1a1a1a, 0 0 0 4px #e8b647, 0 4px 12px rgba(0,0,0,0.4)',
        ink: '0 4px 16px rgba(26,26,26,0.6)',
      },
      backgroundImage: {
        'hanji-texture': "linear-gradient(135deg, rgba(244,236,216,0.95) 0%, rgba(232,217,184,0.9) 100%)",
      },
    },
  },
  plugins: [],
};
