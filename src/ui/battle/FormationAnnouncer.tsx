import { motion, AnimatePresence } from 'framer-motion';
import useBattleStore from '@stores/battleStore';

/**
 * 진법 발동 시 화면 중앙에 거대한 한자 등장 후 페이드아웃.
 * battleStore.lastFormationEvent가 갱신되면 즉시 표시.
 */
function FormationAnnouncer() {
  const event = useBattleStore((s) => s.lastFormationEvent);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <AnimatePresence>
        {event && (
          <motion.div
            key={`${event.id}-${event.at}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="font-title text-7xl font-black text-dancheong-yellow drop-shadow-[0_2px_12px_rgba(232,182,71,0.9)] sm:text-9xl">
              {event.nameHanja}
            </div>
            <div className="mt-2 font-title text-xl font-bold tracking-widest text-hanji drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-2xl">
              {event.nameKorean}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FormationAnnouncer;
