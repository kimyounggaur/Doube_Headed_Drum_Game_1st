// 리듬 엔진 타입 정의 — claude.md의 6타법 매핑을 그대로 따른다.
// 좌측(궁편) = Gung/Gu(강/약), 우측(채편) = Tta/Da, 양손 = Dung/Deo

export type StrokeType = 'Gung' | 'Gu' | 'Tta' | 'Da' | 'Dung' | 'Deo';

export type StrokeSide = 'Left' | 'Right' | 'Both';
export type StrokeIntensity = 'Strong' | 'Weak';

export type JudgmentGrade = 'Perfect' | 'Great' | 'Good' | 'Bad' | 'Miss';

// 타이밍 윈도우 (밀리초). 음수 delta = 플레이어가 빠름.
export const JUDGMENT_WINDOWS_MS = {
  Perfect: 25,
  Great: 50,
  Good: 100,
  Bad: 150,
  // Miss는 |delta| > 150 또는 노트가 윈도우를 지나친 경우
} as const;

export interface Note {
  id: string;
  /** 노트 시작 시각 (초, 트랙 시작 = 0) */
  time: number;
  stroke: StrokeType;
  /** '다다' 같은 고스트 노트 — 시각 표기는 약하게, 판정 없음 */
  isGhost?: boolean;
  /** '학익진' 등 진법 콤보 마커 — UI에서 금색 테두리로 강조 */
  formationTag?: string;
}

export interface RhythmChart {
  name: string;
  bpm: number;
  /** [4, 4] 또는 [12, 8] 등 */
  timeSignature: [number, number];
  /** 전체 길이 (초) */
  duration: number;
  notes: Note[];
  metadata?: {
    historicalContext?: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    /** 음원 파일 경로 (Phase 7 이후) — 미설정 시 합성음만 사용 */
    audioFile?: string;
  };
}

export interface JudgmentResult {
  grade: JudgmentGrade;
  /** 실제 입력 시각과 노트 목표 시각의 차이 (ms, 음수 = 빠름) */
  delta: number;
  note: Note | null;
  /** 잘못된 타법이면 false */
  isCorrectStroke: boolean;
}

export interface RhythmDiagnostics {
  audioSampleRate: number;
  averageInputLatencyMs: number;
  averageFrameTimeMs: number;
  missedNoteCount: number;
}

/** 키보드 매핑: claude.md Phase 2 명세 그대로 */
export const KEYBOARD_MAP: Record<string, { stroke: StrokeType; needsShift?: boolean }> = {
  KeyA: { stroke: 'Gung' },
  KeyS: { stroke: 'Gu' },
  KeyK: { stroke: 'Tta' },
  KeyL: { stroke: 'Da' },
  Space: { stroke: 'Dung' }, // Shift 동시 누름은 RhythmTestScene에서 분기 처리
};
