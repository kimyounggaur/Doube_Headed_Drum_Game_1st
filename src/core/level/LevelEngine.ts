import type { UnitType } from '@core/battle/types';
import level1 from '@data/levels/level_1_basic_rhythms.json';
import level2 from '@data/levels/level_2_dynamics.json';
import level3 from '@data/levels/level_3_waeku_raid.json';

// ----- 데이터 주도 레벨 정의 (claude.md Phase 5) -----
// 새 레벨을 추가하려면 JSON 파일만 만들고 LEVEL_REGISTRY에 등록하면 된다.

export type LevelStage = 'Intro' | 'Tutorial' | 'MainPlay' | 'BossPhase' | 'Result';

interface UnitSpec {
  type: UnitType;
  position: { x: number; y: number };
  /** 적군 유닛만 사용 */
  health?: number;
}

interface RawTutorialStep {
  phase: string;
  duration: number;
  instruction: string;
  expectedStrokes?: { time: number; stroke: string }[];
  demonstrationMode?: boolean;
  completionRule?: string;
  enemies?: { type: string; position: number[]; health: number }[];
  chartRef?: string;
}

interface RawLevel {
  id: string;
  name: string;
  subtitle?: string;
  scenario: string;
  objective: string;
  scene: string;
  timeOfDay: string;
  weather: string;
  bgm: string;
  chartRhythm?: 'hwimori' | 'jajinmori' | 'byeoldalgeori';
  instructor: {
    name: string;
    portrait?: string;
    voiceLines: {
      intro: string;
      praise_perfect: string;
      scold_miss: string;
      victory: string;
    };
  };
  tutorialSteps?: RawTutorialStep[];
  allies?: UnitSpec[];
  enemies?: UnitSpec[];
  successCondition: {
    type: string;
    minAccuracy?: number;
  };
  rewards: {
    exp: number;
    title?: string;
  };
  bpmRamp?: { from: number; to: number };
  forbiddenStrokes?: string[];
}

export interface LoadedLevel {
  id: string;
  name: string;
  subtitle: string;
  scenario: string;
  objective: string;
  scene: string;
  timeOfDay: string;
  weather: string;
  bgm: string;
  chartRhythm: 'hwimori' | 'jajinmori' | 'byeoldalgeori';
  instructorName: string;
  instructorLines: {
    intro: string;
    praise_perfect: string;
    scold_miss: string;
    victory: string;
  };
  allies: { type: UnitType; position: { x: number; y: number } }[];
  enemies: { type: UnitType; position: { x: number; y: number }; health: number }[];
  successMinAccuracy: number;
  rewards: { exp: number; title?: string };
  bpmRamp?: { from: number; to: number };
  forbiddenStrokes?: string[];
  tutorialSteps: RawTutorialStep[];
}

const LEVEL_REGISTRY: Record<string, RawLevel> = {
  level_1_basic: level1 as RawLevel,
  level_2_dynamics: level2 as RawLevel,
  level_3_waeku_raid: level3 as RawLevel,
};

// 데모용 기본 부대: 보병 3 + 궁수 2 (아군), 보병 2 + 궁수 1 (적군)
const DEFAULT_ALLIES: UnitSpec[] = [
  { type: 'Infantry', position: { x: 1, y: 1 } },
  { type: 'Infantry', position: { x: 2, y: 1 } },
  { type: 'Infantry', position: { x: 3, y: 1 } },
  { type: 'Archer', position: { x: 1, y: 0 } },
  { type: 'Archer', position: { x: 3, y: 0 } },
];

const DEFAULT_ENEMIES: UnitSpec[] = [
  { type: 'Infantry', position: { x: 1, y: 3 }, health: 80 },
  { type: 'Infantry', position: { x: 3, y: 3 }, health: 80 },
  { type: 'Archer', position: { x: 2, y: 4 }, health: 60 },
];

/**
 * 레벨 데이터를 로드해서 BattleScreen이 쓸 정규화된 형식으로 변환.
 * JSON에 없는 필드는 합리적 기본값을 사용 (예: chartRhythm은 hwimori).
 */
export function loadLevel(levelId: string): LoadedLevel {
  const raw = LEVEL_REGISTRY[levelId] ?? LEVEL_REGISTRY.level_1_basic;
  if (!raw) throw new Error(`LevelEngine: 레벨을 찾을 수 없습니다: ${levelId}`);

  const allies = (raw.allies && raw.allies.length > 0 ? raw.allies : DEFAULT_ALLIES).map((a) => ({
    type: a.type,
    position: a.position,
  }));

  const enemies = (raw.enemies && raw.enemies.length > 0 ? raw.enemies : DEFAULT_ENEMIES).map(
    (e) => ({
      type: e.type,
      position: e.position,
      health: e.health ?? 80,
    }),
  );

  return {
    id: raw.id,
    name: raw.name,
    subtitle: raw.subtitle ?? '',
    scenario: raw.scenario,
    objective: raw.objective,
    scene: raw.scene,
    timeOfDay: raw.timeOfDay,
    weather: raw.weather,
    bgm: raw.bgm,
    chartRhythm: raw.chartRhythm ?? 'hwimori',
    instructorName: raw.instructor.name,
    instructorLines: raw.instructor.voiceLines,
    allies,
    enemies,
    successMinAccuracy: raw.successCondition.minAccuracy ?? 50,
    rewards: raw.rewards,
    ...(raw.bpmRamp && { bpmRamp: raw.bpmRamp }),
    ...(raw.forbiddenStrokes && { forbiddenStrokes: raw.forbiddenStrokes }),
    tutorialSteps: raw.tutorialSteps ?? [],
  };
}

export function listLevels(): { id: string; name: string; subtitle: string; objective: string }[] {
  return Object.values(LEVEL_REGISTRY).map((l) => ({
    id: l.id,
    name: l.name,
    subtitle: l.subtitle ?? '',
    objective: l.objective,
  }));
}
