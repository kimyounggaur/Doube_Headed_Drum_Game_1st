import { create } from 'zustand';

// Phase 3~5에서 확장될 글로벌 게임 상태 (전투 진행, 점수, 캠페인 진행도 등)
interface GameState {
  currentLevelId: string | null;
  score: number;
  maxCombo: number;
  setCurrentLevel: (id: string | null) => void;
  recordScore: (points: number, combo: number) => void;
  reset: () => void;
}

const useGameStore = create<GameState>((set) => ({
  currentLevelId: null,
  score: 0,
  maxCombo: 0,
  setCurrentLevel: (id) => set({ currentLevelId: id }),
  recordScore: (points, combo) =>
    set((state) => ({
      score: state.score + points,
      maxCombo: Math.max(state.maxCombo, combo),
    })),
  reset: () => set({ currentLevelId: null, score: 0, maxCombo: 0 }),
}));

export default useGameStore;
