import { Routes, Route, Navigate } from 'react-router-dom';
import MainMenuScreen from '@ui/menu/MainMenuScreen';
import CampaignScreen from '@ui/menu/CampaignScreen';
import TrainingScreen from '@ui/menu/TrainingScreen';
import CodexScreen from '@ui/menu/CodexScreen';
import CharacterScreen from '@ui/menu/CharacterScreen';
import EncyclopediaScreen from '@ui/menu/EncyclopediaScreen';
import SettingsScreen from '@ui/menu/SettingsScreen';
import BattleScreen from '@ui/battle/BattleScreen';
import ResultScreen from '@ui/battle/ResultScreen';

// 라우팅 구조: 메인메뉴 → (캠페인 | 수련 | 도감 | 설정) → 전투 → 결과
function App() {
  return (
    <div className="min-h-[100dvh] w-full bg-ink text-hanji font-serif">
      <Routes>
        <Route path="/" element={<MainMenuScreen />} />
        <Route path="/campaign" element={<CampaignScreen />} />
        <Route path="/training" element={<TrainingScreen />} />
        <Route path="/codex" element={<CodexScreen />} />
        <Route path="/character" element={<CharacterScreen />} />
        <Route path="/encyclopedia" element={<EncyclopediaScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/battle/:levelId" element={<BattleScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
