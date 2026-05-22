import { motion, AnimatePresence } from 'framer-motion';
import useCharacterStore from '@stores/characterStore';

/**
 * 승진 컷신 — 한지 펄럭임 + 임명장 효과.
 * "그대를 OO에 임명하노라" 텍스트, 10초 이내 종료.
 */
function RankUpCutscene() {
  const promotion = useCharacterStore((s) => s.pendingPromotion);
  const acknowledge = useCharacterStore((s) => s.acknowledgePromotion);

  return (
    <AnimatePresence>
      {promotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
          onClick={acknowledge}
        >
          {/* 한지 두루마리 */}
          <motion.div
            initial={{ scaleY: 0, rotate: -2 }}
            animate={{ scaleY: 1, rotate: 0 }}
            exit={{ scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, duration: 0.8 }}
            className="relative max-w-md rounded border-4 border-dancheong-red bg-hanji-texture px-8 py-12 text-center shadow-2xl"
            style={{ originY: 0.5 }}
          >
            {/* 위·아래 두루마리 봉 */}
            <div className="absolute left-0 right-0 top-0 h-2 bg-gradient-to-b from-dancheong-red to-dancheong-yellow" />
            <div className="absolute left-0 right-0 bottom-0 h-2 bg-gradient-to-t from-dancheong-red to-dancheong-yellow" />

            <p className="font-title text-sm text-ink/70">임명장 任命狀</p>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 font-title text-lg text-ink"
            >
              그대를
            </motion.p>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
              className="my-3 font-title text-5xl font-black text-dancheong-red drop-shadow"
            >
              {promotion.nameKorean}
            </motion.p>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="font-title text-lg text-ink"
            >
              에 임명하노라
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="mt-6 text-xs text-ink/60"
            >
              운용 병력 {promotion.troopCapacity}명 · 진법 {promotion.formationCount}개 해금
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="mt-2 text-xs text-ink/50"
            >
              화면을 누르면 닫힙니다
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RankUpCutscene;
