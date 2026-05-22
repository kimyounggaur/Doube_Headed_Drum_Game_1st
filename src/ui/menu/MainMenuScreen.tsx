import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import MenuButton from '@ui/common/MenuButton';

// 메인 메뉴 — 단청 스타일 4개 버튼, 모바일 세로화면 우선
function MainMenuScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const items = [
    { key: 'campaign', label: `1. ${t('mainMenu.campaign')}`, to: '/campaign' },
    { key: 'training', label: `2. ${t('mainMenu.training')}`, to: '/training' },
    { key: 'codex', label: `3. ${t('mainMenu.codex')}`, to: '/codex' },
    { key: 'settings', label: `4. ${t('mainMenu.settings')}`, to: '/settings' },
  ];

  return (
    <main className="safe-area flex min-h-[100dvh] flex-col items-center justify-between px-6 py-10">
      {/* 상단: 게임 제목 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mt-4 text-center"
      >
        <h1 className="font-title text-5xl font-black tracking-widest text-dancheong-yellow drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-6xl">
          {t('game.title')}
        </h1>
        <p className="mt-2 font-title text-xl tracking-[0.4em] text-hanji sm:text-2xl">
          {t('game.subtitle')}
        </p>
        <p className="mt-4 text-sm italic text-dancheong-yellow/80 sm:text-base">
          “{t('game.tagline')}”
        </p>
      </motion.header>

      {/* 중앙: 4개 단청 버튼 (세로 배치) */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="my-8 flex w-full max-w-sm flex-col gap-4"
        aria-label={t('game.title')}
      >
        {items.map((item, idx) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.1, duration: 0.4 }}
          >
            <MenuButton onClick={() => navigate(item.to)} ariaLabel={item.label}>
              {item.label}
            </MenuButton>
          </motion.div>
        ))}
      </motion.nav>

      {/* 하단: 크레딧 */}
      <footer className="mb-2 text-center text-xs text-hanji/50">
        <p>{t('mainMenu.footerCredits')}</p>
        <p className="mt-1 text-[10px] text-hanji/30">v0.1.0 — Prototype</p>
      </footer>
    </main>
  );
}

export default MainMenuScreen;
