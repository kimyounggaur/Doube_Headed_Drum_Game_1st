import type { StrokeType } from '@core/rhythm/types';

interface RhythmInterfaceProps {
  onStroke: (stroke: StrokeType) => void;
}

/**
 * 화면 하단 큰 터치 영역 — 좌(궁편) / 중앙(양손) / 우(채편).
 * 모바일에서 양손 동시 터치를 위해 각 영역은 단순 onClick + touchstart.
 */
function RhythmInterface({ onStroke }: RhythmInterfaceProps) {
  return (
    <div className="grid h-full grid-cols-3 gap-1 bg-ink/80 p-1">
      {/* 궁편 (좌) */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Gung');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Gung');
          }}
          className="flex-1 rounded bg-dancheong-blue font-title text-base font-bold text-hanji active:bg-dancheong-blue/70"
        >
          궁<br />
          <span className="text-xs opacity-70">A</span>
        </button>
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Gu');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Gu');
          }}
          className="flex-1 rounded bg-dancheong-blue/60 font-title text-sm font-bold text-hanji active:bg-dancheong-blue/40"
        >
          구<br />
          <span className="text-xs opacity-70">S</span>
        </button>
      </div>

      {/* 양손 (중앙) */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Dung');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Dung');
          }}
          className="flex-1 rounded bg-dancheong-yellow font-title text-base font-bold text-ink active:bg-dancheong-yellow/70"
        >
          덩<br />
          <span className="text-xs opacity-70">Space</span>
        </button>
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Deo');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Deo');
          }}
          className="flex-1 rounded bg-dancheong-yellow/60 font-title text-sm font-bold text-ink active:bg-dancheong-yellow/40"
        >
          더<br />
          <span className="text-xs opacity-70">⇧Space</span>
        </button>
      </div>

      {/* 채편 (우) */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Tta');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Tta');
          }}
          className="flex-1 rounded bg-dancheong-red font-title text-base font-bold text-hanji active:bg-dancheong-red/70"
        >
          따<br />
          <span className="text-xs opacity-70">K</span>
        </button>
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onStroke('Da');
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            onStroke('Da');
          }}
          className="flex-1 rounded bg-dancheong-red/60 font-title text-sm font-bold text-hanji active:bg-dancheong-red/40"
        >
          다<br />
          <span className="text-xs opacity-70">L</span>
        </button>
      </div>
    </div>
  );
}

export default RhythmInterface;
