import { useMemo, useState } from 'react';
import ScreenHeader from '@ui/common/ScreenHeader';
import encyclopediaData from '@data/encyclopedia.json';

type Category = 'all' | 'person' | 'event' | 'instrument' | 'formation' | 'rhythm';

interface EncyclopediaEntry {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  unlockCondition: string;
  references: string[];
  content: string;
}

const ALL_ENTRIES: EncyclopediaEntry[] = (encyclopediaData as { entries: EncyclopediaEntry[] })
  .entries;

const CATEGORY_LABEL: Record<Category, string> = {
  all: '전체',
  person: '인물',
  event: '사건',
  instrument: '병기·악기',
  formation: '진법',
  rhythm: '장단',
};

function EncyclopediaScreen() {
  const [category, setCategory] = useState<Category>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return ALL_ENTRIES.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (query && !e.title.includes(query) && !e.content.includes(query)) return false;
      return true;
    });
  }, [category, query]);

  const selected = useMemo(
    () => ALL_ENTRIES.find((e) => e.id === selectedId) ?? null,
    [selectedId],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader title="역사 도감" />
      <main className="flex flex-1 flex-col gap-2 p-3 sm:flex-row">
        {/* 좌: 카테고리 + 목록 */}
        <aside className="flex flex-col gap-2 sm:w-1/3">
          <div className="flex flex-wrap gap-1">
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded border px-2 py-1 text-xs transition ${
                  category === c
                    ? 'border-dancheong-yellow bg-dancheong-red text-hanji'
                    : 'border-hanji/30 text-hanji/70'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded border border-hanji/30 bg-ink px-2 py-1 text-sm text-hanji placeholder:text-hanji/40"
          />
          <ul className="flex flex-col gap-1 overflow-y-auto">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full rounded border px-2 py-1 text-left text-sm transition ${
                    selectedId === e.id
                      ? 'border-dancheong-yellow bg-dancheong-blue/40'
                      : 'border-hanji/20 hover:border-dancheong-yellow/60'
                  }`}
                >
                  <span className="block font-bold">{e.title}</span>
                  <span className="text-[10px] text-hanji/50">{CATEGORY_LABEL[e.category]}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 우: 상세 */}
        <section className="flex-1">
          {selected ? (
            <article className="card-hanji">
              <h3 className="font-title text-2xl font-black text-ink">{selected.title}</h3>
              <p className="mt-1 text-xs text-ink/60">분류: {CATEGORY_LABEL[selected.category]}</p>
              <hr className="my-3 border-ink/20" />
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {selected.content}
              </p>
              {selected.references.length > 0 && (
                <div className="mt-3 border-t border-ink/20 pt-2">
                  <p className="text-xs font-bold text-ink/70">출전(出典)</p>
                  <ul className="mt-1 text-xs text-ink/60">
                    {selected.references.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ) : (
            <div className="card-hanji text-center text-sm text-ink/60">
              왼쪽에서 항목을 선택하시오.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default EncyclopediaScreen;
