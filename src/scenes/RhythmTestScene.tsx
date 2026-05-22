import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from '@core/audio/AudioEngine';
import { RhythmEngine } from '@core/rhythm/RhythmEngine';
import {
  KEYBOARD_MAP,
  type JudgmentGrade,
  type JudgmentResult,
  type Note,
  type RhythmChart,
  type StrokeType,
} from '@core/rhythm/types';
import useSettingsStore from '@stores/settingsStore';
import hwimoriRaw from '@data/rhythms/hwimori.json';
import jajinmoriRaw from '@data/rhythms/jajinmori.json';
import byeoldalgeoriRaw from '@data/rhythms/byeoldalgeori.json';

// JSON 파일에서 RhythmChart 형식으로 변환 (timeSignature를 튜플 타입으로 단언)
function asChart(raw: unknown): RhythmChart {
  const r = raw as RhythmChart;
  return { ...r, timeSignature: [r.timeSignature[0], r.timeSignature[1]] };
}

const CHARTS: Record<string, RhythmChart> = {
  hwimori: asChart(hwimoriRaw),
  jajinmori: asChart(jajinmoriRaw),
  byeoldalgeori: asChart(byeoldalgeoriRaw),
};

const VISIBLE_WINDOW_MS = 2000; // 2초간의 노트가 화면에 동시 표시
const HIT_LINE_RATIO = 0.85; // 노트가 떨어져 도달할 y 위치 (0=상단, 1=하단)

interface LaneInfo {
  id: 'left' | 'center' | 'right';
  label: string;
  strokes: StrokeType[];
  colorClass: string;
}

const LANES: LaneInfo[] = [
  { id: 'left', label: '궁편 (A/S)', strokes: ['Gung', 'Gu'], colorClass: 'bg-dancheong-blue/30' },
  {
    id: 'center',
    label: '양손 (Space)',
    strokes: ['Dung', 'Deo'],
    colorClass: 'bg-dancheong-yellow/20',
  },
  { id: 'right', label: '채편 (K/L)', strokes: ['Tta', 'Da'], colorClass: 'bg-dancheong-red/30' },
];

function strokeToLane(stroke: StrokeType): LaneInfo['id'] {
  if (stroke === 'Gung' || stroke === 'Gu') return 'left';
  if (stroke === 'Tta' || stroke === 'Da') return 'right';
  return 'center';
}

function strokeKorean(stroke: StrokeType): string {
  return { Gung: '궁', Gu: '구', Tta: '따', Da: '다', Dung: '덩', Deo: '더' }[stroke];
}

const GRADE_COLORS: Record<JudgmentGrade, string> = {
  Perfect: 'text-dancheong-yellow',
  Great: 'text-sky-300',
  Good: 'text-green-300',
  Bad: 'text-orange-300',
  Miss: 'text-gray-400',
};

const GRADE_KOREAN: Record<JudgmentGrade, string> = {
  Perfect: '완벽!',
  Great: '훌륭함',
  Good: '양호',
  Bad: '흐트러짐',
  Miss: '실기',
};

interface JudgmentCounts {
  Perfect: number;
  Great: number;
  Good: number;
  Bad: number;
  Miss: number;
}

/**
 * 리듬 테스트 씬 — Phase 2의 검증 도구.
 * 시작 버튼은 사용자 제스처(=AudioContext.resume 트리거)를 보장한다.
 */
function RhythmTestScene() {
  const audioRef = useRef<AudioEngine | null>(null);
  const engineRef = useRef<RhythmEngine | null>(null);
  const frameRef = useRef<number | null>(null);
  const { audioOffsetMs, visualMetronome } = useSettingsStore();

  const [chartId, setChartId] = useState<keyof typeof CHARTS>('hwimori');
  const [bpmMultiplier, setBpmMultiplier] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [judgmentCounts, setJudgmentCounts] = useState<JudgmentCounts>({
    Perfect: 0,
    Great: 0,
    Good: 0,
    Bad: 0,
    Miss: 0,
  });
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastJudgment, setLastJudgment] = useState<JudgmentResult | null>(null);
  const [visibleNotes, setVisibleNotes] = useState<Note[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [diagnostics, setDiagnostics] = useState({
    sampleRate: 0,
    avgInputLatency: 0,
    avgFrameTime: 0,
    missedNotes: 0,
  });
  const [metronomePulse, setMetronomePulse] = useState(false);

  // 차트 스케일링 (BPM 멀티플라이어 적용)
  const activeChart = useMemo<RhythmChart>(() => {
    const base = CHARTS[chartId];
    if (!base) throw new Error(`RhythmTestScene: unknown chart ${chartId}`);
    if (bpmMultiplier === 1.0) return base;
    return {
      ...base,
      bpm: base.bpm * bpmMultiplier,
      duration: base.duration / bpmMultiplier,
      notes: base.notes.map((n) => ({ ...n, time: n.time / bpmMultiplier })),
    };
  }, [chartId, bpmMultiplier]);

  // 엔진 인스턴스 lazy 생성
  const ensureEngines = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new AudioEngine();
      await audioRef.current.start();
    }
    audioRef.current.setAudioOffsetMs(audioOffsetMs);
    if (!engineRef.current) {
      engineRef.current = new RhythmEngine(audioRef.current);
    }
  }, [audioOffsetMs]);

  // 시각적 메트로놈을 위해 박자 이벤트 캐치
  const lastBeatRef = useRef(-1);

  const tick = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isRunning()) {
      const now = engine.getCurrentTime();
      setCurrentTime(now);
      setVisibleNotes(engine.getActiveNotes(VISIBLE_WINDOW_MS));
      // 시각적 메트로놈 (청각 보조)
      const beat = Math.floor(engine.getCurrentBeat());
      if (visualMetronome && beat !== lastBeatRef.current) {
        lastBeatRef.current = beat;
        setMetronomePulse(true);
        setTimeout(() => setMetronomePulse(false), 80);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [visualMetronome]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [tick]);

  // 컴포넌트 언마운트 시 엔진 정리
  useEffect(
    () => () => {
      engineRef.current?.dispose();
      audioRef.current?.dispose();
      engineRef.current = null;
      audioRef.current = null;
    },
    [],
  );

  const handleJudgment = useCallback((result: JudgmentResult) => {
    setLastJudgment(result);
    setJudgmentCounts((prev) => ({ ...prev, [result.grade]: prev[result.grade] + 1 }));
    if (result.grade === 'Miss' || result.grade === 'Bad') {
      setCombo(0);
    } else if (result.isCorrectStroke) {
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
    }
  }, []);

  const startSession = useCallback(async () => {
    await ensureEngines();
    const engine = engineRef.current;
    if (!engine) return;
    engine.loadChart(activeChart);
    engine.setJudgmentCallback(handleJudgment);
    setJudgmentCounts({ Perfect: 0, Great: 0, Good: 0, Bad: 0, Miss: 0 });
    setCombo(0);
    setMaxCombo(0);
    setLastJudgment(null);
    engine.start();
    setIsPlaying(true);
  }, [activeChart, ensureEngines, handleJudgment]);

  const stopSession = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
    const engine = engineRef.current;
    if (engine) {
      const diag = engine.getDiagnostics();
      setDiagnostics({
        sampleRate: diag.audioSampleRate,
        avgInputLatency: diag.averageInputLatencyMs,
        avgFrameTime: diag.averageFrameTimeMs,
        missedNotes: diag.missedNoteCount,
      });
      // 진단 콘솔 출력 (claude.md Phase 2 검증 요구사항)
      console.info('[RhythmTest] 진단', {
        sampleRate: diag.audioSampleRate,
        averageInputLatencyMs: diag.averageInputLatencyMs.toFixed(2),
        averageFrameTimeMs: diag.averageFrameTimeMs.toFixed(2),
        missedNoteCount: diag.missedNoteCount,
      });
    }
  }, []);

  // 입력 헬퍼 — 모든 입력 경로(키보드/터치/버튼)에서 공통 사용
  const inputStroke = useCallback((stroke: StrokeType) => {
    const audio = audioRef.current;
    const engine = engineRef.current;
    if (!audio) return;
    // 즉시 발음 (사용자 피드백)
    audio.playStroke(stroke);
    if (engine?.isRunning()) {
      engine.registerInput(stroke);
    }
  }, []);

  // 키보드 입력
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') {
        e.preventDefault();
        inputStroke(e.shiftKey ? 'Deo' : 'Dung');
        return;
      }
      const mapping = KEYBOARD_MAP[e.code];
      if (mapping) {
        e.preventDefault();
        inputStroke(mapping.stroke);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputStroke]);

  const totalJudged = Object.values(judgmentCounts).reduce((a, b) => a + b, 0);
  const weightedScore =
    judgmentCounts.Perfect * 1.0 +
    judgmentCounts.Great * 0.85 +
    judgmentCounts.Good * 0.6 +
    judgmentCounts.Bad * 0.3;
  const accuracy = totalJudged > 0 ? Math.round((weightedScore / totalJudged) * 100) : 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-ink text-hanji">
      {/* 상단 컨트롤 바 */}
      <div className="border-b border-dancheong-yellow/40 bg-ink/60 px-4 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="chartSelect" className="font-bold">
              장단
            </label>
            <select
              id="chartSelect"
              value={chartId}
              onChange={(e) => setChartId(e.target.value as keyof typeof CHARTS)}
              disabled={isPlaying}
              className="rounded border border-dancheong-yellow/40 bg-ink px-2 py-1 text-hanji"
            >
              <option value="hwimori">휘모리 (4/4, BPM 150)</option>
              <option value="jajinmori">자진모리 (12/8, BPM 120)</option>
              <option value="byeoldalgeori">별달거리 (4/4, BPM 130)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="bpmRange" className="font-bold">
              속도
            </label>
            <input
              id="bpmRange"
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={bpmMultiplier}
              onChange={(e) => setBpmMultiplier(Number(e.target.value))}
              disabled={isPlaying}
              className="accent-dancheong-red"
            />
            <span className="w-12 tabular-nums">{bpmMultiplier.toFixed(2)}x</span>
          </div>
          <div className="flex gap-2">
            {!isPlaying ? (
              <button
                type="button"
                onClick={startSession}
                className="rounded bg-dancheong-red px-4 py-1 font-bold text-hanji hover:bg-dancheong-red/80"
              >
                시작
              </button>
            ) : (
              <button
                type="button"
                onClick={stopSession}
                className="rounded bg-dancheong-blue px-4 py-1 font-bold text-hanji hover:bg-dancheong-blue/80"
              >
                정지
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 콤보 / 판정 / 진단 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hanji/20 px-4 py-2 text-sm">
        <div className="flex items-center gap-4">
          <span>
            콤보: <span className="font-bold text-dancheong-yellow tabular-nums">{combo}</span>{' '}
            (최고 {maxCombo})
          </span>
          <span>
            정확도:{' '}
            <span className="font-bold text-dancheong-yellow tabular-nums">{accuracy}%</span>
          </span>
          {lastJudgment && (
            <span className={`font-bold ${GRADE_COLORS[lastJudgment.grade]}`}>
              {GRADE_KOREAN[lastJudgment.grade]}
              {!lastJudgment.isCorrectStroke && lastJudgment.note && ' (오타법)'}
              <span className="ml-2 text-xs opacity-60">
                {lastJudgment.delta >= 0 ? '+' : ''}
                {lastJudgment.delta.toFixed(0)}ms
              </span>
            </span>
          )}
        </div>
        <div className="text-xs text-hanji/60">
          P {judgmentCounts.Perfect} ・ Gt {judgmentCounts.Great} ・ Go {judgmentCounts.Good}・ B{' '}
          {judgmentCounts.Bad} ・ M {judgmentCounts.Miss}
        </div>
      </div>

      {/* 노트 떨어지는 영역 + Hit Line */}
      <div
        className={`relative flex-1 overflow-hidden border-b border-dancheong-yellow/40 transition-colors ${metronomePulse ? 'bg-dancheong-yellow/10' : ''}`}
      >
        <div className="absolute inset-0 grid grid-cols-3">
          {LANES.map((lane) => (
            <div
              key={lane.id}
              className={`relative border-r border-hanji/10 last:border-r-0 ${lane.colorClass}`}
            >
              <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs text-hanji/60">
                {lane.label}
              </div>
            </div>
          ))}
        </div>

        {/* Hit Line */}
        <div
          className="absolute left-0 right-0 z-10 h-1 bg-dancheong-yellow shadow-[0_0_12px_rgba(232,182,71,0.8)]"
          style={{ top: `${HIT_LINE_RATIO * 100}%` }}
        />

        {/* 노트 */}
        {visibleNotes.map((note) => {
          const laneId = strokeToLane(note.stroke);
          const laneIdx = LANES.findIndex((l) => l.id === laneId);
          const dt = note.time - currentTime; // 초
          const progress = 1 - dt / (VISIBLE_WINDOW_MS / 1000); // 0=화면 위, 1=hit line
          const yPercent = progress * HIT_LINE_RATIO * 100;
          const isStrong =
            note.stroke === 'Gung' || note.stroke === 'Tta' || note.stroke === 'Dung';
          const isFormation = !!note.formationTag;
          const size = isStrong ? 60 : 36;
          const opacity = note.isGhost ? 0.35 : isStrong ? 1.0 : 0.7;
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
                backgroundColor:
                  laneId === 'left' ? '#1f3a5f' : laneId === 'right' ? '#a91b0d' : '#e8b647',
                color: laneId === 'center' ? '#1a1a1a' : '#f4ecd8',
                border: isFormation ? '3px solid #e8b647' : '2px solid #1a1a1a',
                boxShadow: isFormation ? '0 0 12px rgba(232,182,71,0.9)' : 'none',
                fontSize: size * 0.4,
              }}
            >
              {strokeKorean(note.stroke)}
            </div>
          );
        })}
      </div>

      {/* 하단 인터페이스 — 터치/클릭 버튼 */}
      <div className="grid grid-cols-3 gap-1 bg-ink/80 p-2 text-center">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => inputStroke('Gung')}
            className="rounded bg-dancheong-blue py-4 font-title text-lg font-bold text-hanji active:bg-dancheong-blue/70"
          >
            궁 (A)
          </button>
          <button
            type="button"
            onClick={() => inputStroke('Gu')}
            className="rounded bg-dancheong-blue/60 py-4 font-title text-base font-bold text-hanji active:bg-dancheong-blue/40"
          >
            구 (S)
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => inputStroke('Dung')}
            className="rounded bg-dancheong-yellow py-4 font-title text-lg font-bold text-ink active:bg-dancheong-yellow/70"
          >
            덩 (Sp)
          </button>
          <button
            type="button"
            onClick={() => inputStroke('Deo')}
            className="rounded bg-dancheong-yellow/60 py-4 font-title text-base font-bold text-ink active:bg-dancheong-yellow/40"
          >
            더 (⇧Sp)
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => inputStroke('Tta')}
            className="rounded bg-dancheong-red py-4 font-title text-lg font-bold text-hanji active:bg-dancheong-red/70"
          >
            따 (K)
          </button>
          <button
            type="button"
            onClick={() => inputStroke('Da')}
            className="rounded bg-dancheong-red/60 py-4 font-title text-base font-bold text-hanji active:bg-dancheong-red/40"
          >
            다 (L)
          </button>
        </div>
      </div>

      {/* 진단 패널 (정지 시 표시) */}
      {!isPlaying && diagnostics.sampleRate > 0 && (
        <div className="border-t border-dancheong-yellow/40 bg-ink/80 px-4 py-2 text-xs text-hanji/70">
          <span className="mr-3">샘플레이트: {diagnostics.sampleRate}Hz</span>
          <span className="mr-3">평균 입력 지연: {diagnostics.avgInputLatency.toFixed(1)}ms</span>
          <span className="mr-3">평균 프레임: {diagnostics.avgFrameTime.toFixed(1)}ms</span>
          <span>누락 노트: {diagnostics.missedNotes}</span>
        </div>
      )}
    </div>
  );
}

export default RhythmTestScene;
