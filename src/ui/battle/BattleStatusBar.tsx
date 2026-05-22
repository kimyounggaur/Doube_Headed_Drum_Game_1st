import { motion } from 'framer-motion';
import { useMemo } from 'react';
import useBattleStore from '@stores/battleStore';

/**
 * 상단 상태바 — 양군 병력 비율을 가로 바로 표시.
 * 한 쪽이 70% 이상 차지하면 깃발이 펄럭임 (CSS animation).
 */
function BattleStatusBar() {
  const { units, enemyUnits } = useBattleStore();

  const ratio = useMemo(() => {
    const allyHp = units.reduce((s, u) => s + Math.max(0, u.health), 0);
    const enemyHp = enemyUnits.reduce((s, u) => s + Math.max(0, u.health), 0);
    const total = allyHp + enemyHp;
    if (total === 0) return 0.5;
    return allyHp / total;
  }, [units, enemyUnits]);

  const allyPct = Math.round(ratio * 100);
  const enemyPct = 100 - allyPct;
  const allyDominant = ratio >= 0.7;
  const enemyDominant = ratio <= 0.3;

  return (
    <div className="border-b border-dancheong-yellow/40 bg-ink/80 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <motion.span
          animate={allyDominant ? { x: [0, -2, 2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.4 }}
          className="font-bold text-dancheong-blue"
        >
          🟦 아군 {allyPct}%
        </motion.span>
        <motion.span
          animate={enemyDominant ? { x: [0, -2, 2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.4 }}
          className="font-bold text-dancheong-red"
        >
          {enemyPct}% 적군 🟥
        </motion.span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-sm border border-dancheong-yellow/40 bg-ink">
        <motion.div
          className="absolute left-0 top-0 h-full bg-dancheong-blue"
          style={{ width: `${allyPct}%` }}
          animate={{ width: `${allyPct}%` }}
          transition={{ duration: 0.3 }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-dancheong-red"
          style={{ width: `${enemyPct}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-dancheong-yellow" />
      </div>
    </div>
  );
}

export default BattleStatusBar;
