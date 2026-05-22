import { motion, AnimatePresence } from 'framer-motion';
import useBattleStore from '@stores/battleStore';
import type { BattleUnit, FormationId } from '@core/battle/types';

// 5x5 그리드 전장 — PIXI 대체용 React 렌더링.
// Phase 4 후반에 PIXI로 마이그레이션 가능하지만, 9:16 모바일에서는 React만으로도 충분.

const GRID_SIZE = 5;

const FORMATION_LABEL: Record<FormationId, string> = {
  Crane: '학익',
  Line: '일자',
  Snake: '장사',
  Circle: '원진',
};

function UnitIcon({ unit, side }: { unit: BattleUnit; side: 'ally' | 'enemy' }) {
  const dead = unit.health <= 0;
  const hpRatio = unit.maxHealth > 0 ? unit.health / unit.maxHealth : 0;
  const color = side === 'ally' ? '#1f3a5f' : '#a91b0d';
  const typeIcon = unit.type === 'Infantry' ? '盾' : unit.type === 'Archer' ? '弓' : '帥';
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: dead ? 0.5 : 1, opacity: dead ? 0.3 : 1, rotate: dead ? 90 : 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="relative flex h-full w-full flex-col items-center justify-center"
    >
      {/* 부대 깃발 */}
      <div
        className="flex h-7 w-7 items-center justify-center rounded font-title text-sm font-bold text-hanji"
        style={{
          backgroundColor: color,
          border: '2px solid #e8b647',
          opacity: dead ? 0.4 : 1,
          filter: dead ? 'grayscale(1)' : 'none',
        }}
      >
        {typeIcon}
      </div>
      {/* HP 바 */}
      {!dead && (
        <div className="mt-1 h-1 w-7 overflow-hidden rounded-sm border border-ink/60 bg-ink">
          <div
            className="h-full transition-all"
            style={{
              width: `${hpRatio * 100}%`,
              backgroundColor: hpRatio > 0.5 ? '#3a7d44' : hpRatio > 0.2 ? '#e8b647' : '#a91b0d',
            }}
          />
        </div>
      )}
      {/* 진법 라벨 */}
      {!dead && unit.currentFormation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-dancheong-yellow">
          {FORMATION_LABEL[unit.currentFormation]}
        </div>
      )}
    </motion.div>
  );
}

function Battlefield() {
  const { units, enemyUnits } = useBattleStore();

  // 적군은 위쪽(0~1행), 아군은 아래쪽(3~4행)
  const grid: BattleUnit[][] = Array.from({ length: GRID_SIZE }, () => []);
  for (const u of units) {
    const row = Math.min(GRID_SIZE - 1, Math.max(0, 4 - u.position.y));
    grid[row]?.push(u);
  }
  for (const u of enemyUnits) {
    const row = Math.min(GRID_SIZE - 1, Math.max(0, u.position.y));
    grid[row]?.push(u);
  }

  return (
    <div className="relative flex-1 overflow-hidden border-b border-dancheong-yellow/30 bg-gradient-to-b from-dancheong-red/15 via-ink to-dancheong-blue/15">
      {/* 중앙 경계선 (전선) */}
      <div className="absolute left-0 right-0 top-1/2 z-10 h-px bg-dancheong-yellow/40" />
      <div className="absolute left-2 top-[calc(50%-10px)] z-10 text-xs text-dancheong-yellow/70">
        — 전선 —
      </div>

      {/* 5x5 그리드 */}
      <div className="grid h-full w-full grid-rows-5">
        {Array.from({ length: GRID_SIZE }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="grid grid-cols-5 border-b border-hanji/5 last:border-b-0"
          >
            {Array.from({ length: GRID_SIZE }).map((__, colIdx) => {
              const unitsInCell = (grid[rowIdx] ?? []).filter((u) => u.position.x === colIdx);
              return (
                <div
                  key={`cell-${rowIdx}-${colIdx}`}
                  className="relative border-r border-hanji/5 last:border-r-0"
                >
                  <AnimatePresence>
                    {unitsInCell.map((unit) => (
                      <UnitIcon key={unit.id} unit={unit} side={unit.isEnemy ? 'enemy' : 'ally'} />
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Battlefield;
