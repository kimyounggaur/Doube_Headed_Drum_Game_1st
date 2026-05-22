import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@ui/common/ScreenHeader';
import useCharacterStore from '@stores/characterStore';

function CodexScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rank = useCharacterStore((s) => s.getCurrentRank());

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title={t('codex.title')} />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <button
          type="button"
          onClick={() => navigate('/character')}
          className="card-hanji text-left transition hover:border-dancheong-yellow"
        >
          <p className="font-title text-lg font-bold text-ink">고수의 길</p>
          <p className="mt-1 text-xs text-ink/60">현재 계급: {rank.nameKorean}</p>
          <p className="mt-2 text-sm text-ink/80">계급 진행도, 장비 슬롯, 명예의 전당</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/encyclopedia')}
          className="card-hanji text-left transition hover:border-dancheong-yellow"
        >
          <p className="font-title text-lg font-bold text-ink">역사 도감</p>
          <p className="mt-1 text-xs text-ink/60">인물 ・ 사건 ・ 병기 ・ 진법 ・ 장단</p>
          <p className="mt-2 text-sm text-ink/80">
            장구의 역사, 임진왜란, 이순신과 한산도 대첩, 4대 진법의 역사적 사용 사례 등
          </p>
        </button>
      </main>
    </div>
  );
}

export default CodexScreen;
