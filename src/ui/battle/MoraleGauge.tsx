import { motion } from 'framer-motion';
import useBattleStore from '@stores/battleStore';

/**
 * 사기 게이지 — 깃발이 펄럭이는 정도로 사기 표현.
 * 30% 이하: 늘어짐, 80% 이상: 휘날림.
 */
function MoraleGauge() {
  const morale = useBattleStore((s) => s.morale);
  const isHigh = morale >= 80;
  const isLow = morale <= 30;
  const color = isHigh ? '#e8b647' : isLow ? '#a91b0d' : '#3a7d44';

  return (
    <div className="flex items-center gap-2">
      <motion.span
        className="text-2xl"
        animate={
          isHigh
            ? { rotate: [0, -8, 8, -8, 8, 0], y: [0, -1, 1, -1, 0] }
            : isLow
              ? { rotate: 30, opacity: 0.6 }
              : { rotate: [0, -3, 3, 0] }
        }
        transition={{ repeat: Infinity, duration: isHigh ? 0.6 : 1.2 }}
        style={{ display: 'inline-block', color }}
      >
        🚩
      </motion.span>
      <div className="flex flex-col">
        <span className="text-xs text-hanji/60">사기</span>
        <span className="font-title text-lg font-bold tabular-nums" style={{ color }}>
          {Math.round(morale)}%
        </span>
      </div>
    </div>
  );
}

export default MoraleGauge;
