import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@ui/common/ScreenHeader';
import { listLevels } from '@core/level/LevelEngine';

function CampaignScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const levels = listLevels();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title={t('campaign.title')} />
      <main className="flex flex-1 flex-col items-center gap-3 p-4">
        {levels.map((l, idx) => (
          <button
            key={l.id}
            type="button"
            onClick={() => navigate(`/battle/${l.id}`)}
            className="card-hanji w-full max-w-md text-left transition hover:border-dancheong-yellow"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dancheong-red bg-ink font-title text-xl font-bold text-dancheong-yellow">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-title text-lg font-bold text-ink">{l.name}</h3>
                <p className="text-xs text-ink/60">{l.subtitle}</p>
                <p className="mt-1 text-sm text-ink/80">{l.objective}</p>
              </div>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}

export default CampaignScreen;
