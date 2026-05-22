import { create } from 'zustand';
import {
  type BattleUnit,
  type Buff,
  type CommandType,
  type FormationId,
  type UnitType,
} from '@core/battle/types';

interface BattleState {
  units: BattleUnit[]; // 아군
  enemyUnits: BattleUnit[]; // 적군
  morale: number; // 전군 평균 (0~100)
  comboCount: number;
  maxCombo: number;
  activeBuffs: Buff[]; // 전군 공통 버프
  /** 최근 발동한 진법/특수기 (UI Announcer에서 사용) */
  lastFormationEvent: { id: string; nameKorean: string; nameHanja: string; at: number } | null;

  // ----- 액션 -----
  setupBattle: (allies: BattleUnit[], enemies: BattleUnit[]) => void;
  applyCommand: (command: CommandType, intensity: number) => void;
  applyDamage: (unitId: string, damage: number, isEnemy: boolean) => void;
  updateMorale: (delta: number) => void;
  addBuff: (buff: Buff) => void;
  expireBuffs: (dt: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setFormationEvent: (e: BattleState['lastFormationEvent']) => void;
  applyFormationBuff: (formationId: FormationId, durationMs: number) => void;
  /** 모든 유닛에 isReady=true 부여 (preparation delay 후) */
  setReady: (isEnemy: boolean) => void;
  reset: () => void;
}

const initialState = {
  units: [] as BattleUnit[],
  enemyUnits: [] as BattleUnit[],
  morale: 70,
  comboCount: 0,
  maxCombo: 0,
  activeBuffs: [] as Buff[],
  lastFormationEvent: null as BattleState['lastFormationEvent'],
};

/**
 * 명령 → 효과 매핑.
 * intensity는 0~1 (Perfect=1.0). 이미 사기 modifier가 곱해진 값.
 */
function applyCommandEffect(
  state: BattleState,
  command: CommandType,
  intensity: number,
): Partial<BattleState> {
  if (intensity <= 0) return {};

  const allies = state.units.filter((u) => u.health > 0);
  const enemies = state.enemyUnits.filter((u) => u.health > 0);

  switch (command) {
    case 'AdvanceShieldWall': {
      // 보병 1칸 전진
      const newAllies = state.units.map((u) =>
        u.type === 'Infantry' && u.health > 0
          ? { ...u, position: { ...u.position, x: Math.min(4, u.position.x + 1) } }
          : u,
      );
      return { units: newAllies };
    }
    case 'Regroup': {
      // 보병 체력 회복 (최대치의 15% * intensity)
      const newAllies = state.units.map((u) =>
        u.type === 'Infantry' && u.health > 0
          ? { ...u, health: Math.min(u.maxHealth, u.health + u.maxHealth * 0.15 * intensity) }
          : u,
      );
      return { units: newAllies };
    }
    case 'VolleyFire': {
      // 궁수 일제사격: 가장 가까운 적에게 attackPower만큼 데미지
      const archers = allies.filter((u) => u.type === 'Archer');
      const totalDamage = archers.reduce((sum, a) => sum + a.attackPower * intensity, 0);
      if (enemies.length === 0) return {};
      const target = enemies[0];
      if (!target) return {};
      const newEnemies = state.enemyUnits.map((u) =>
        u.id === target.id ? { ...u, health: Math.max(0, u.health - totalDamage) } : u,
      );
      return { enemyUnits: newEnemies };
    }
    case 'AimReload': {
      // 다음 사격 치명타 buff
      const buff: Buff = {
        id: `aim-${Date.now()}`,
        effect: 'CriticalChance',
        multiplier: 2.0,
        durationMs: 3000,
        remainingMs: 3000,
        label: '조준 완료',
      };
      return { activeBuffs: [...state.activeBuffs, buff] };
    }
    case 'AllOutAttack': {
      // 전군 총공격: 모든 적에게 총합 데미지
      const totalDamage = allies.reduce((sum, a) => sum + a.attackPower * intensity * 1.2, 0);
      const perEnemy = enemies.length > 0 ? totalDamage / enemies.length : 0;
      const newEnemies = state.enemyUnits.map((u) =>
        u.health > 0 ? { ...u, health: Math.max(0, u.health - perEnemy) } : u,
      );
      return { enemyUnits: newEnemies };
    }
    case 'Retreat': {
      // 전군 후퇴 + 회피 buff
      const newAllies = state.units.map((u) =>
        u.health > 0 ? { ...u, position: { ...u.position, x: Math.max(0, u.position.x - 1) } } : u,
      );
      const buff: Buff = {
        id: `retreat-${Date.now()}`,
        effect: 'Defense',
        multiplier: 1.5,
        durationMs: 2000,
        remainingMs: 2000,
        label: '산개 방어',
      };
      return { units: newAllies, activeBuffs: [...state.activeBuffs, buff] };
    }
    case 'Special_Singijeon': {
      // 신기전: 모든 적에게 500 데미지 * intensity
      const newEnemies = state.enemyUnits.map((u) =>
        u.health > 0 ? { ...u, health: Math.max(0, u.health - 500 * intensity) } : u,
      );
      return { enemyUnits: newEnemies };
    }
    // Formation_X는 applyFormationBuff로 별도 처리
    default:
      return {};
  }
}

const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  setupBattle: (allies, enemies) =>
    set({
      ...initialState,
      units: allies,
      enemyUnits: enemies,
    }),

  applyCommand: (command, intensity) => {
    const patch = applyCommandEffect(get(), command, intensity);
    if (Object.keys(patch).length > 0) {
      set(patch);
    }
  },

  applyDamage: (unitId, damage, isEnemy) =>
    set((s) => {
      const list = isEnemy ? s.enemyUnits : s.units;
      const updated = list.map((u) =>
        u.id === unitId ? { ...u, health: Math.max(0, u.health - damage) } : u,
      );
      return isEnemy ? { enemyUnits: updated } : { units: updated };
    }),

  updateMorale: (delta) => set((s) => ({ morale: Math.max(0, Math.min(100, s.morale + delta)) })),

  addBuff: (buff) => set((s) => ({ activeBuffs: [...s.activeBuffs, buff] })),

  expireBuffs: (dtMs) =>
    set((s) => ({
      activeBuffs: s.activeBuffs
        .map((b) => ({ ...b, remainingMs: b.remainingMs - dtMs }))
        .filter((b) => b.remainingMs > 0),
    })),

  incrementCombo: () =>
    set((s) => {
      const next = s.comboCount + 1;
      return { comboCount: next, maxCombo: Math.max(s.maxCombo, next) };
    }),

  resetCombo: () => set({ comboCount: 0 }),

  setFormationEvent: (e) => set({ lastFormationEvent: e }),

  applyFormationBuff: (formationId, durationMs) => {
    // 진법별 버프 — formations.json의 효과를 단순화
    const buffMap: Record<FormationId, Omit<Buff, 'id' | 'remainingMs'>> = {
      Crane: {
        effect: 'AttackSpeed',
        multiplier: 1.3,
        durationMs,
        label: '학익진',
      },
      Line: {
        effect: 'Defense',
        multiplier: 1.5,
        durationMs,
        label: '일자진',
      },
      Snake: {
        effect: 'Speed',
        multiplier: 1.4,
        durationMs,
        label: '장사진',
      },
      Circle: {
        effect: 'Survivability',
        multiplier: 1.5,
        durationMs,
        label: '원진',
      },
    };
    const def = buffMap[formationId];
    if (!def) return;
    const buff: Buff = {
      ...def,
      id: `formation-${formationId}-${Date.now()}`,
      remainingMs: durationMs,
    };
    // 같은 진법은 갱신 (중첩 방지)
    set((s) => ({
      activeBuffs: [...s.activeBuffs.filter((b) => b.label !== def.label), buff],
      units: s.units.map((u) => ({ ...u, currentFormation: formationId })),
    }));
  },

  setReady: (isEnemy) =>
    set((s) => {
      const list = isEnemy ? s.enemyUnits : s.units;
      const updated = list.map((u) => ({ ...u, isReady: true }));
      return isEnemy ? { enemyUnits: updated } : { units: updated };
    }),

  reset: () => set(initialState),
}));

export default useBattleStore;

// ------ 데모 부대 생성 헬퍼 ------

let unitIdCounter = 0;
function nextUnitId(prefix: string): string {
  unitIdCounter += 1;
  return `${prefix}-${unitIdCounter}`;
}

export function createAllyUnit(type: UnitType, position: { x: number; y: number }): BattleUnit {
  const base: BattleUnit = {
    id: nextUnitId('ally'),
    type,
    position,
    health: 100,
    maxHealth: 100,
    morale: 70,
    attackPower: type === 'Archer' ? 35 : 25,
    defense: type === 'Infantry' ? 20 : 10,
    speed: type === 'Infantry' ? 1.0 : 0.8,
    isReady: true,
    buffs: [],
    isEnemy: false,
  };
  return base;
}

export function createEnemyUnit(
  type: UnitType,
  position: { x: number; y: number },
  hp = 120,
): BattleUnit {
  return {
    id: nextUnitId('enemy'),
    type,
    position,
    health: hp,
    maxHealth: hp,
    morale: 60,
    attackPower: 20,
    defense: 15,
    speed: 0.9,
    isReady: true,
    buffs: [],
    isEnemy: true,
  };
}
