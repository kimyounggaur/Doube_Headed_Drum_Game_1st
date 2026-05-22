import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getRankFromExp,
  getNextRank,
  detectPromotion,
  type RankDef,
  type RankId,
} from '@core/progression/RankSystem';
import {
  getStarterSet,
  findItem,
  type EquippedSet,
  type EquipmentSlot,
} from '@core/progression/EquipmentSystem';

interface CharacterState {
  exp: number;
  equippedWeaponId: string;
  equippedArmorId: string;
  equippedSticksId: string;
  /** 획득한 칭호 목록 */
  titles: string[];
  /** 가장 최근의 승진 (RankUpCutscene 표시용). null이면 표시 안 함 */
  pendingPromotion: RankDef | null;

  // ----- 액션 -----
  addExp: (amount: number) => RankDef | null;
  equip: (slot: EquipmentSlot, itemId: string) => void;
  acknowledgePromotion: () => void;
  awardTitle: (title: string) => void;
  getCurrentRank: () => RankDef;
  getEquippedSet: () => EquippedSet;
  reset: () => void;
}

const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => {
      const starter = getStarterSet();
      return {
        exp: 0,
        equippedWeaponId: starter.weapon?.id ?? 'training_janggu',
        equippedArmorId: starter.armor?.id ?? 'cheollik',
        equippedSticksId: starter.sticks?.id ?? 'bamboo_sticks',
        titles: [],
        pendingPromotion: null,

        addExp: (amount) => {
          const prev = get().exp;
          const next = prev + amount;
          const promo = detectPromotion(prev, next);
          set({ exp: next, ...(promo && { pendingPromotion: promo }) });
          return promo;
        },

        equip: (slot, itemId) => {
          const item = findItem(itemId);
          if (!item) return;
          const key: keyof CharacterState =
            slot === 'weapon'
              ? 'equippedWeaponId'
              : slot === 'armor'
                ? 'equippedArmorId'
                : 'equippedSticksId';
          set({ [key]: itemId } as Partial<CharacterState>);
        },

        acknowledgePromotion: () => set({ pendingPromotion: null }),

        awardTitle: (title) =>
          set((s) => ({ titles: s.titles.includes(title) ? s.titles : [...s.titles, title] })),

        getCurrentRank: () => getRankFromExp(get().exp),

        getEquippedSet: () => ({
          weapon: findItem(get().equippedWeaponId),
          armor: findItem(get().equippedArmorId),
          sticks: findItem(get().equippedSticksId),
        }),

        reset: () => {
          const s = getStarterSet();
          set({
            exp: 0,
            equippedWeaponId: s.weapon?.id ?? 'training_janggu',
            equippedArmorId: s.armor?.id ?? 'cheollik',
            equippedSticksId: s.sticks?.id ?? 'bamboo_sticks',
            titles: [],
            pendingPromotion: null,
          });
        },
      };
    },
    { name: 'janggu-character' },
  ),
);

/** 현재 계급에서 다음 계급으로의 진행도 (0~1) */
export function getRankProgress(exp: number): number {
  const current = getRankFromExp(exp);
  const next = getNextRank(exp);
  if (!next) return 1;
  const span = next.rank.expRequired - current.expRequired;
  if (span <= 0) return 0;
  return (exp - current.expRequired) / span;
}

export function rankOrder(rankId: RankId): number {
  return ['militia', 'musician', 'special_army', 'commander'].indexOf(rankId);
}

export default useCharacterStore;
