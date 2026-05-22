import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import useBattleStore from '@stores/battleStore';

interface Rocket {
  id: number;
  startX: number;
  endX: number;
}

/**
 * 신기전(별달거리) 발동 시 16발 화살이 포물선으로 날아가는 효과.
 * battleStore.lastFormationEvent의 id가 'singijeon'일 때 트리거.
 */
function SingijeonLaunch() {
  const event = useBattleStore((s) => s.lastFormationEvent);
  const [rockets, setRockets] = useState<Rocket[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (event?.id === 'singijeon') {
      const created: Rocket[] = Array.from({ length: 16 }, (_, i) => ({
        id: Date.now() + i,
        startX: 10 + Math.random() * 80,
        endX: 10 + Math.random() * 80,
      }));
      setRockets(created);
      setActive(true);
      const t = setTimeout(() => setActive(false), 1400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [event]);

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          {rockets.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ left: `${r.startX}%`, bottom: '15%', opacity: 1 }}
              animate={{
                left: `${r.endX}%`,
                bottom: ['15%', '90%', '60%'],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1.0, delay: idx * 0.04, ease: 'easeOut' }}
              className="absolute h-3 w-1 rounded bg-dancheong-yellow shadow-[0_0_8px_rgba(232,182,71,1)]"
            />
          ))}
          {/* 화면 셰이크는 부모에서 처리 — 여기는 폭발 잔향 비네팅만 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 bg-dancheong-red/30"
          />
        </div>
      )}
    </AnimatePresence>
  );
}

export default SingijeonLaunch;
