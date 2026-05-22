import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface InstructorDialogProps {
  line: string | null;
  instructorName: string;
  onDismiss: () => void;
}

/**
 * 교관 말풍선 — 좌측 상단, 타이핑 효과 50ms/char, 5초 후 자동 닫힘.
 * 탭/클릭 시 즉시 닫힘.
 */
function InstructorDialog({ line, instructorName, onDismiss }: InstructorDialogProps) {
  const [typed, setTyped] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!line) {
      setTyped('');
      return undefined;
    }
    setTyped('');
    let idx = 0;
    const type = () => {
      idx += 1;
      setTyped(line.slice(0, idx));
      if (idx < line.length) {
        timerRef.current = setTimeout(type, 50);
      } else {
        autoCloseRef.current = setTimeout(onDismiss, 5000);
      }
    };
    type();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, [line, onDismiss]);

  return (
    <AnimatePresence>
      {line && (
        <motion.button
          type="button"
          onClick={onDismiss}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="absolute left-2 top-2 z-20 max-w-[80%] cursor-pointer text-left"
        >
          <div className="flex items-start gap-2 rounded border-2 border-dancheong-yellow bg-ink/90 px-3 py-2 shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dancheong-yellow bg-dancheong-red font-title text-lg font-bold text-hanji">
              敎
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dancheong-yellow">{instructorName}</span>
              <span className="text-sm text-hanji">{typed}</span>
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default InstructorDialog;
