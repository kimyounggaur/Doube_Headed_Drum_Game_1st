import type { StrokeType, JudgmentGrade } from '@core/rhythm/types';

// 군령 시스템 타입 — claude.md의 6타법 매핑을 그대로 따른다.

export type UnitType = 'Infantry' | 'Archer' | 'AllForces';

export type FormationId = 'Crane' | 'Line' | 'Snake' | 'Circle';

export type CommandType =
  | 'AdvanceShieldWall' // 궁 → 보병 전진/방패벽
  | 'Regroup' // 구 → 보병 재정비
  | 'VolleyFire' // 따 → 궁수 일제사격
  | 'AimReload' // 다 → 조준/장전
  | 'AllOutAttack' // 덩 → 전군 총공격
  | 'Retreat' // 더 → 전군 후퇴/산개
  | 'Formation_Crane' // 학익진
  | 'Formation_Line' // 일자진
  | 'Formation_Snake' // 장사진
  | 'Formation_Circle' // 원진
  | 'Special_Singijeon'; // 별달거리 → 신기전

export type BuffEffect =
  | 'CriticalChance'
  | 'AttackSpeed'
  | 'Defense'
  | 'Speed'
  | 'Survivability'
  | 'AttackMultiplier';

export interface Buff {
  id: string;
  effect: BuffEffect;
  multiplier: number;
  durationMs: number;
  remainingMs: number;
  /** UI 표시용 한국어 라벨 */
  label?: string;
}

export interface BattleUnit {
  id: string;
  type: UnitType;
  /** 5x5 그리드 좌표 (0~4) */
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  /** 0-100. 평균이 부대 능력치에 곱연산으로 적용. */
  morale: number;
  attackPower: number;
  defense: number;
  /** 칸/초 단위 이동속도 */
  speed: number;
  /** 명령 수행 가능 상태. 명령 발동 후 prepDelayMs 동안 false. */
  isReady: boolean;
  currentFormation?: FormationId;
  buffs: Buff[];
  /** 적군 여부 */
  isEnemy: boolean;
}

/** 시간이 포함된 스트로크 입력 — FormationMatcher의 4박 슬라이딩 윈도우 입력 */
export interface StrokeWithTime {
  stroke: StrokeType;
  /** 트랙 시간 (초) */
  time: number;
  grade: JudgmentGrade;
  isCorrectStroke: boolean;
}

/** 6타법 → 단일 명령 매핑 (즉시 명령). 진법은 별도 처리. */
export const STROKE_TO_COMMAND: Record<StrokeType, CommandType> = {
  Gung: 'AdvanceShieldWall',
  Gu: 'Regroup',
  Tta: 'VolleyFire',
  Da: 'AimReload',
  Dung: 'AllOutAttack',
  Deo: 'Retreat',
};

/** 판정 등급 → 명령 위력 배율 */
export const GRADE_TO_INTENSITY: Record<JudgmentGrade, number> = {
  Perfect: 1.0,
  Great: 0.85,
  Good: 0.6,
  Bad: 0.3,
  Miss: 0.0,
};

/** 부대가 명령을 받은 후 실행까지 걸리는 준비 시간 (ms) */
export const COMMAND_PREP_MS = 500;

/** 슬라이딩 윈도우 길이 (초) — 진법 매칭 시 최근 N초 입력만 본다 */
export const FORMATION_WINDOW_SEC = 4.0;
