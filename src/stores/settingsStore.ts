import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  audioOffsetMs: number;
  visualMetronome: boolean;
  colorblindMode: boolean;
  setAudioOffset: (ms: number) => void;
  setVisualMetronome: (enabled: boolean) => void;
  setColorblindMode: (enabled: boolean) => void;
}

// 사용자 설정 — localStorage 영구 저장.
// 리듬 게임 특성상 audioOffsetMs(입력 지연 보정)은 캘리브레이션 결과를 보관한다.
const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioOffsetMs: 0,
      visualMetronome: false,
      colorblindMode: false,
      setAudioOffset: (ms) => set({ audioOffsetMs: ms }),
      setVisualMetronome: (enabled) => set({ visualMetronome: enabled }),
      setColorblindMode: (enabled) => set({ colorblindMode: enabled }),
    }),
    {
      name: 'janggu-settings',
    },
  ),
);

export default useSettingsStore;
