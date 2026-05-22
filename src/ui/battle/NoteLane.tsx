import type { Note, StrokeType } from '@core/rhythm/types';

interface NoteLaneProps {
  notes: Note[];
  currentTime: number;
  visibleWindowSec: number;
  hitLineRatio: number;
}

function strokeKorean(stroke: StrokeType): string {
  return { Gung: '궁', Gu: '구', Tta: '따', Da: '다', Dung: '덩', Deo: '더' }[stroke];
}

function strokeLane(stroke: StrokeType): 0 | 1 | 2 {
  if (stroke === 'Gung' || stroke === 'Gu') return 0;
  if (stroke === 'Dung' || stroke === 'Deo') return 1;
  return 2;
}

/**
 * 노트 렌더링 — RhythmTestScene과 BattleScreen에서 공유.
 * 3레인(궁편/양손/채편), Hit Line은 부모 컴포넌트가 그린다.
 */
function NoteLane({ notes, currentTime, visibleWindowSec, hitLineRatio }: NoteLaneProps) {
  return (
    <>
      {notes.map((note) => {
        const dt = note.time - currentTime;
        const progress = 1 - dt / visibleWindowSec; // 0=상단, 1=hit line
        const yPercent = progress * hitLineRatio * 100;
        const isStrong = note.stroke === 'Gung' || note.stroke === 'Tta' || note.stroke === 'Dung';
        const isFormation = !!note.formationTag;
        const size = isStrong ? 56 : 32;
        const opacity = note.isGhost ? 0.3 : isStrong ? 1.0 : 0.7;
        const laneIdx = strokeLane(note.stroke);
        return (
          <div
            key={note.id}
            className="absolute pointer-events-none flex items-center justify-center rounded-full font-bold text-hanji"
            style={{
              left: `${(laneIdx + 0.5) * (100 / 3)}%`,
              top: `${yPercent}%`,
              width: size,
              height: size,
              transform: 'translate(-50%, -50%)',
              opacity,
              backgroundColor: laneIdx === 0 ? '#1f3a5f' : laneIdx === 2 ? '#a91b0d' : '#e8b647',
              color: laneIdx === 1 ? '#1a1a1a' : '#f4ecd8',
              border: isFormation ? '3px solid #e8b647' : '2px solid #1a1a1a',
              boxShadow: isFormation ? '0 0 12px rgba(232,182,71,0.9)' : 'none',
              fontSize: size * 0.4,
            }}
          >
            {strokeKorean(note.stroke)}
          </div>
        );
      })}
    </>
  );
}

export default NoteLane;
