import { motion, AnimatePresence } from 'framer-motion';
import type { JudgmentResult } from '@core/rhythm/types';

interface StrokeImpactProps {
  judgment: JudgmentResult | null;
  triggeredAt: number;
}

/**
 * Perfect 시 금색 한자 "完璧" + 묵 번짐 파동.
 * 잘못된 타법은 회색 X자 + 화면 미세 셰이크 (셰이크는 부모가 처리).
 */
function StrokeImpact({ judgment, triggeredAt }: StrokeImpactProps) {
  const showHanja = judgment?.grade === 'Perfect';
  const showError = judgment !== null && !judgment.isCorrectStroke;

  return (
    <div className="pointer-events-none absolute inset-0 z-25 flex items-center justify-center">
      <AnimatePresence>
        {showHanja && (
          <motion.div
            key={`hanja-${triggeredAt}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.4, 1.6, 1.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="font-title text-7xl font-black text-dancheong-yellow"
            style={{
              textShadow: '0 0 24px rgba(232,182,71,0.9), 0 0 8px rgba(0,0,0,0.8)',
              filter: 'drop-shadow(0 0 4px #1a1a1a)',
            }}
          >
            完璧
          </motion.div>
        )}
        {showError && (
          <motion.div
            key={`err-${triggeredAt}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.2, 1.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-6xl text-gray-400/80"
          >
            ✕
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StrokeImpact;
