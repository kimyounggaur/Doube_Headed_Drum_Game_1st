import { useNavigate } from 'react-router-dom';
import ScreenHeader from '@ui/common/ScreenHeader';
import useCharacterStore, { getRankProgress } from '@stores/characterStore';
import { getNextRank } from '@core/progression/RankSystem';
import { getAvailableItems, type EquipmentSlot } from '@core/progression/EquipmentSystem';
import RankUpCutscene from '@ui/menu/RankUpCutscene';

interface SlotRowProps {
  slot: EquipmentSlot;
  label: string;
}

function SlotRow({ slot, label }: SlotRowProps) {
  const { exp, equip, getEquippedSet } = useCharacterStore();
  const rank = useCharacterStore((s) => s.getCurrentRank());
  const equipped = getEquippedSet();
  const items = getAvailableItems(slot, rank.id);
  const currentId =
    slot === 'weapon'
      ? equipped.weapon?.id
      : slot === 'armor'
        ? equipped.armor?.id
        : equipped.sticks?.id;

  return (
    <div className="card-hanji">
      <div className="flex items-center justify-between gap-2">
        <span className="font-title font-bold text-ink">{label}</span>
        <select
          value={currentId ?? ''}
          onChange={(e) => equip(slot, e.target.value)}
          className="rounded border border-ink/40 bg-hanji px-2 py-1 text-sm text-ink"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.nameHanja ? `(${item.nameHanja})` : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-ink/70">
        {(() => {
          const cur = items.find((i) => i.id === currentId);
          return cur?.description ?? '';
        })()}
      </p>
      <p className="text-[10px] text-ink/40">현재 EXP {exp}</p>
    </div>
  );
}

function CharacterScreen() {
  const navigate = useNavigate();
  const rank = useCharacterStore((s) => s.getCurrentRank());
  const titles = useCharacterStore((s) => s.titles);
  const exp = useCharacterStore((s) => s.exp);
  const progress = getRankProgress(exp);
  const next = getNextRank(exp);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title="고수의 길" />
      <RankUpCutscene />
      <main className="flex flex-1 flex-col gap-3 p-4">
        {/* 계급 카드 */}
        <div className="card-hanji">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink/60">{rank.name}</p>
              <p className="font-title text-2xl font-black text-ink">{rank.nameKorean}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded border border-ink px-2 py-1 text-xs"
            >
              메인
            </button>
          </div>
          <p className="mt-2 text-sm text-ink/80">{rank.description}</p>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-ink/70">
              <span>EXP {exp}</span>
              {next ? (
                <span>
                  다음: {next.rank.nameKorean} (-{next.remaining})
                </span>
              ) : (
                <span>최고 계급 달성</span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded bg-ink/30">
              <div
                className="h-full bg-dancheong-red transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-xs text-ink/70">
            <span className="font-bold">운용 병력:</span> {rank.troopCapacity}명
            <span className="ml-3 font-bold">진법:</span> {rank.formationCount}개
            {rank.unlockedFormations.length > 0 && (
              <span className="ml-1">({rank.unlockedFormations.join(', ')})</span>
            )}
          </div>
        </div>

        {/* 장비 슬롯 */}
        <SlotRow slot="weapon" label="장구" />
        <SlotRow slot="armor" label="복장" />
        <SlotRow slot="sticks" label="채" />

        {/* 명예의 전당 */}
        {titles.length > 0 && (
          <div className="card-hanji">
            <p className="font-title font-bold text-ink">명예의 전당</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {titles.map((t) => (
                <span
                  key={t}
                  className="rounded bg-dancheong-yellow/30 px-2 py-0.5 text-xs text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CharacterScreen;
