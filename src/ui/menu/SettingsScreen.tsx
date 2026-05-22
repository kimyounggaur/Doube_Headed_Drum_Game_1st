import { useTranslation } from 'react-i18next';
import ScreenHeader from '@ui/common/ScreenHeader';
import useSettingsStore from '@stores/settingsStore';

function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { audioOffsetMs, visualMetronome, setAudioOffset, setVisualMetronome } = useSettingsStore();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title={t('settings.title')} />
      <main className="flex flex-1 flex-col gap-4 p-6">
        <section className="card-hanji">
          <label htmlFor="audioOffset" className="flex flex-col gap-2 text-base">
            <span className="font-bold">{t('settings.audioOffset')}</span>
            <span className="text-sm opacity-60">현재: {audioOffsetMs} ms</span>
            <input
              id="audioOffset"
              type="range"
              min={-200}
              max={200}
              step={1}
              value={audioOffsetMs}
              onChange={(e) => setAudioOffset(Number(e.target.value))}
              className="accent-dancheong-red"
            />
          </label>
        </section>

        <section className="card-hanji">
          <label htmlFor="visualMetronome" className="flex items-center justify-between gap-3">
            <span className="font-bold">{t('settings.visualMetronome')}</span>
            <input
              id="visualMetronome"
              type="checkbox"
              checked={visualMetronome}
              onChange={(e) => setVisualMetronome(e.target.checked)}
              className="size-5 accent-dancheong-red"
            />
          </label>
        </section>

        <section className="card-hanji">
          <label htmlFor="lang" className="flex items-center justify-between gap-3">
            <span className="font-bold">{t('settings.language')}</span>
            <select
              id="lang"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="rounded border border-ink/40 bg-hanji px-2 py-1 text-ink"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </label>
        </section>
      </main>
    </div>
  );
}

export default SettingsScreen;
