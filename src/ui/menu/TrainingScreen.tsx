import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@ui/common/ScreenHeader';
import RhythmTestScene from '@scenes/RhythmTestScene';

// Phase 2: RhythmTestScene을 무관 수련의 첫 콘텐츠로 연결.
// 사용자가 "수련 시작"을 누르면 AudioContext가 사용자 제스처로 활성화된다.
function TrainingScreen() {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <ScreenHeader title={t('training.title')} />
        <RhythmTestScene />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title={t('training.title')} />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="card-hanji max-w-md text-center">
          <p className="text-lg font-bold">{t('training.selectRhythm')}</p>
          <ul className="mt-3 space-y-1 text-sm opacity-70">
            <li>휘모리 (4/4, BPM 150) — 빠른 4박, 전투 절정</li>
            <li>자진모리 (12/8, BPM 120) — 4박×3분할, 행진과 추격</li>
            <li>별달거리 (4/4, BPM 130) — 사설 장단, 신기전 패턴 포함</li>
          </ul>
          <p className="mt-4 text-xs opacity-60">
            키보드: A(궁) S(구) K(따) L(다) Space(덩) ⇧Space(더)
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="btn-dancheong mt-6 w-full"
          >
            수련 시작
          </button>
        </div>
      </main>
    </div>
  );
}

export default TrainingScreen;
