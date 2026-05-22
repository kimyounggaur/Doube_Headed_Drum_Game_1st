import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@ui/common/ScreenHeader';
import useGameStore from '@stores/gameStore';
import useBattleStore from '@stores/battleStore';
import useCharacterStore from '@stores/characterStore';
import RankUpCutscene from '@ui/menu/RankUpCutscene';

function ResultScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const battleState = useBattleStore();
  const reset = useBattleStore((s) => s.reset);
  const rank = useCharacterStore((s) => s.getCurrentRank());
  const exp = useCharacterStore((s) => s.exp);

  const allyAlive = battleState.units.filter((u) => u.health > 0).length;
  const enemyAlive = battleState.enemyUnits.filter((u) => u.health > 0).length;
  const victory = enemyAlive === 0 && allyAlive > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title={t('result.title')} />
      <RankUpCutscene />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="card-hanji max-w-md text-center">
          <p
            className="font-title text-4xl font-black"
            style={{ color: victory ? '#3a7d44' : '#a91b0d' }}
          >
            {victory ? t('result.victory') : t('result.defeat')}
          </p>
          <hr className="my-4 border-ink/30" />
          <dl className="grid grid-cols-2 gap-2 text-sm text-ink">
            <dt className="font-bold">최고 콤보</dt>
            <dd className="tabular-nums">{maxCombo}</dd>
            <dt className="font-bold">획득 점수</dt>
            <dd className="tabular-nums">{score}</dd>
            <dt className="font-bold">최종 사기</dt>
            <dd className="tabular-nums">{Math.round(battleState.morale)}%</dd>
            <dt className="font-bold">잔여 아군</dt>
            <dd className="tabular-nums">{allyAlive}기</dd>
            <dt className="font-bold">현재 계급</dt>
            <dd>{rank.nameKorean}</dd>
            <dt className="font-bold">누적 EXP</dt>
            <dd className="tabular-nums">{exp}</dd>
          </dl>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/character')}
              className="flex-1 rounded border-2 border-dancheong-red bg-ink px-3 py-2 text-sm font-bold text-dancheong-yellow"
            >
              고수의 길
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                navigate('/');
              }}
              className="btn-dancheong flex-1"
            >
              {t('result.continue')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResultScreen;
