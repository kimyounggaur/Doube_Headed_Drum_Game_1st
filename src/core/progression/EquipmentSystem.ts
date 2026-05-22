import equipmentData from '@data/equipment.json';
import type { RankId } from './RankSystem';

export type EquipmentSlot = 'weapon' | 'armor' | 'sticks';

export interface EquipmentEffects {
  attack_multiplier?: number;
  enemy_morale_aura?: number;
  damage_reduction?: number;
  speed_penalty?: number;
  morale_bonus?: number;
  judgment_window_bonus_ms?: number;
  combo_morale_bonus?: number;
  byeoldalgeori_bonus?: string;
  rocket_count?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  nameHanja?: string;
  tier: number;
  rank_required: RankId;
  effects: EquipmentEffects;
  description: string;
  historicalNote?: string;
}

interface EquipmentData {
  weapons: EquipmentItem[];
  armor: EquipmentItem[];
  sticks: EquipmentItem[];
}

const DATA = equipmentData as EquipmentData;

export interface EquippedSet {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  sticks: EquipmentItem | null;
}

/** 슬롯별 사용 가능한 장비 목록 (rank 제약 적용) */
export function getAvailableItems(slot: EquipmentSlot, rank: RankId): EquipmentItem[] {
  const list = slot === 'weapon' ? DATA.weapons : slot === 'armor' ? DATA.armor : DATA.sticks;
  const rankOrder: RankId[] = ['militia', 'musician', 'special_army', 'commander'];
  const currentIdx = rankOrder.indexOf(rank);
  return list.filter((item) => rankOrder.indexOf(item.rank_required) <= currentIdx);
}

export function findItem(id: string): EquipmentItem | null {
  return (
    DATA.weapons.find((w) => w.id === id) ??
    DATA.armor.find((a) => a.id === id) ??
    DATA.sticks.find((s) => s.id === id) ??
    null
  );
}

/**
 * 장착 효과의 단순 합산.
 * 능력치는 곱연산(attack_multiplier 등), 보너스는 가산.
 */
export function aggregateEffects(set: EquippedSet): EquipmentEffects {
  const result: EquipmentEffects = {};
  for (const item of [set.weapon, set.armor, set.sticks]) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item.effects)) {
      const k = key as keyof EquipmentEffects;
      if (typeof value === 'number') {
        if (k === 'attack_multiplier') {
          result[k] = (result[k] ?? 1) * value;
        } else {
          // @ts-expect-error - 동적 키 합산
          result[k] = (result[k] ?? 0) + value;
        }
      } else if (typeof value === 'string') {
        // @ts-expect-error - 문자열 키는 마지막 것 우선
        result[k] = value;
      }
    }
  }
  return result;
}

/** 기본 세트 (의병 시작) */
export function getStarterSet(): EquippedSet {
  return {
    weapon: findItem('training_janggu'),
    armor: findItem('cheollik'),
    sticks: findItem('bamboo_sticks'),
  };
}
