import { motion } from 'framer-motion';
import useBattleStore from '@stores/battleStore';

const TITLE_THRESHOLDS = [
  { combo: 100, label: '훈련도감의 위엄!', color: '#e8b647' },
  { combo: 50, label: '별기군의 기개!', color: '#a91b0d' },
  { combo: 30, label: '대오를 잡았다', color: '#7dd3fc' },
  { combo: 10, label: '리듬을 탄다', color: '#86efac' },
];

function ComboCounter() {
  const combo = useBattleStore((s) => s.comboCount);
  const title = TITLE_THRESHOLDS.find((t) => combo >= t.combo);
  const fontSize =
    combo >= 100 ? 'text-4xl' : combo >= 50 ? 'text-3xl' : combo >= 10 ? 'text-2xl' : 'text-xl';
  if (combo < 1) return null;
  return (
    <motion.div
      key={combo}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="text-center"
    >
      <div
        className={`font-title font-black tabular-nums ${fontSize}`}
        style={{ color: title?.color ?? '#f4ecd8' }}
      >
        {combo} <span className="text-sm opacity-70">콤보</span>
      </div>
      {title && (
        <div className="text-xs font-bold" style={{ color: title.color }}>
          {title.label}
        </div>
      )}
    </motion.div>
  );
}

export default ComboCounter;
