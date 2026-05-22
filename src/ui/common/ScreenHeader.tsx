import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ScreenHeaderProps {
  title: string;
}

// 공통 화면 헤더 — 뒤로가기 버튼 + 제목 + 단청 하단선
function ScreenHeader({ title }: ScreenHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <header className="relative flex items-center justify-between border-b-2 border-dancheong-yellow/60 px-4 py-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded border border-dancheong-yellow/60 px-3 py-1 text-sm text-hanji hover:bg-dancheong-yellow/20"
      >
        ← {t('campaign.back')}
      </button>
      <h2 className="font-title text-xl font-bold text-dancheong-yellow">{title}</h2>
      <div className="w-16" /> {/* 좌우 대칭용 빈 공간 */}
    </header>
  );
}

export default ScreenHeader;
