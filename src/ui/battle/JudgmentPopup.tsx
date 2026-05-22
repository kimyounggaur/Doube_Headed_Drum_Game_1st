import { motion, AnimatePresence } from 'framer-motion';
import type { JudgmentResult } from '@core/rhythm/types';

interface JudgmentPopupProps {
  judgment: JudgmentResult | null;
  /** 판정 발생 시각 (performance.now). 같은 값이면 같은 popup. */
  triggeredAt: number;
}

const GRADE_INFO = {
  Perfect: { label: '완벽!', color: '#e8b647' },
  Great: { label: '훌륭함', color: '#7dd3fc' },
  Good: { label: '양호', color: '#86efac' },
  Bad: { label: '흐트러짐', color: '#fdba74' },
  Miss: { label: '실기', color: '#9ca3af' },
} as const;

/**
 * Hit Line 위로 떠오르며 페이드되는 판정 텍스트.
 * 부모가 매번 새로운 triggeredAt을 넘기면 AnimatePresence가 키로 인식한다.
 */
function JudgmentPopup({ judgment, triggeredAt }: JudgmentPopupProps) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[60%] z-20 -translate-x-1/2">
      <AnimatePresence>
        {judgment && (
          <motion.div
            key={triggeredAt}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6 }}
            className="font-title text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ color: GRADE_INFO[judgment.grade].color }}
          >
            {GRADE_INFO[judgment.grade].label}
            {!judgment.isCorrectStroke && judgment.note && (
              <span className="ml-2 text-sm opacity-80">(오타법)</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default JudgmentPopup;
