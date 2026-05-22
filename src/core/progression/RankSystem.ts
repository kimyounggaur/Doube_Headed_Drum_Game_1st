// 계급 체계 — claude.md Phase 6 명세 그대로.
// "가챠 없이도 다음 단계가 기대되는" 진행 흐름을 만드는 게 목표.

export type RankId = 'militia' | 'musician' | 'special_army' | 'commander';

export interface RankDef {
  id: RankId;
  name: string;
  nameKorean: string;
  expRequired: number;
  troopCapacity: number;
  formationCount: number;
  /** 해금되는 진법 ID (FormationMatcher용) */
  unlockedFormations: string[];
  description: string;
}

export const RANK_TABLE: RankDef[] = [
  {
    id: 'militia',
    name: 'Militia',
    nameKorean: '의병',
    expRequired: 0,
    troopCapacity: 10,
    formationCount: 0,
    unlockedFormations: [],
    description: '시작 계급. 진법 없이 단일 명령만 사용.',
  },
  {
    id: 'musician',
    name: 'Military Musician',
    nameKorean: '군악대원',
    expRequired: 500,
    troopCapacity: 30,
    formationCount: 1,
    unlockedFormations: ['line'],
    description: '일자진 해금. 군영에서 정식 고수로 인정받음.',
  },
  {
    id: 'special_army',
    name: 'Special Army',
    nameKorean: '별기군',
    expRequired: 2000,
    troopCapacity: 100,
    formationCount: 3,
    unlockedFormations: ['line', 'circle', 'snake'],
    description: '원진·장사진 해금. 독립 부대 지휘 가능.',
  },
  {
    id: 'commander',
    name: 'Commander',
    nameKorean: '훈련도감 지휘관',
    expRequired: 5000,
    troopCapacity: 300,
    formationCount: 4,
    unlockedFormations: ['line', 'circle', 'snake', 'crane'],
    description: '학익진 + 별달거리 필살기 해금. 한 군영의 사령탑.',
  },
];

/** 누적 경험치 → 현재 계급 */
export function getRankFromExp(exp: number): RankDef {
  let current: RankDef = RANK_TABLE[0]!;
  for (const rank of RANK_TABLE) {
    if (exp >= rank.expRequired) current = rank;
  }
  return current;
}

/** 다음 계급까지 남은 경험치 (이미 최고 계급이면 null) */
export function getNextRank(exp: number): { rank: RankDef; remaining: number } | null {
  const currentIdx = RANK_TABLE.findIndex((r) => r.id === getRankFromExp(exp).id);
  const next = RANK_TABLE[currentIdx + 1];
  if (!next) return null;
  return { rank: next, remaining: next.expRequired - exp };
}

/**
 * 전투 결과 → EXP 계산.
 * 정확도(0~100), 최대 콤보, 클리어 시간(초), 최소 사기(0~100).
 * EXP 곡선: rank_n EXP = 500 * 1.8^n
 */
export function calculateBattleExp(params: {
  accuracy: number;
  maxCombo: number;
  clearTimeSec: number;
  minMorale: number;
  baseReward: number;
}): number {
  const accuracyMul = 0.5 + params.accuracy / 100; // 0.5~1.5
  const comboBonus = Math.floor(params.maxCombo / 10) * 0.1; // 콤보 10마다 +10%
  const timeBonus = params.clearTimeSec < 60 ? 0.2 : 0;
  const moralePenalty = params.minMorale < 30 ? -0.2 : 0;
  const multiplier = accuracyMul + comboBonus + timeBonus + moralePenalty;
  return Math.max(0, Math.round(params.baseReward * multiplier));
}

/** 두 EXP 시점 사이에 승진이 일어났는지 검사 */
export function detectPromotion(prevExp: number, newExp: number): RankDef | null {
  const prev = getRankFromExp(prevExp);
  const next = getRankFromExp(newExp);
  return prev.id !== next.id ? next : null;
}
