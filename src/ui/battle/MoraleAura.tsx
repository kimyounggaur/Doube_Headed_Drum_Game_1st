import useBattleStore from '@stores/battleStore';

/**
 * 사기 상태에 따라 전장 화면 위에 깔리는 오버레이.
 * - 100%: 황금 비네팅
 * - <30%: 회색 채도 감소 + 짙은 비네팅
 */
function MoraleAura() {
  const morale = useBattleStore((s) => s.morale);
  const isHigh = morale >= 80;
  const isLow = morale <= 30;

  let vignetteColor = 'transparent';
  let saturation = 1;

  if (isHigh) {
    vignetteColor = 'rgba(232,182,71,0.18)';
    saturation = 1.15;
  } else if (isLow) {
    vignetteColor = 'rgba(0,0,0,0.45)';
    saturation = 0.55;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-15 transition-all duration-700"
      style={{
        boxShadow: `inset 0 0 80px ${vignetteColor}`,
        filter: `saturate(${saturation})`,
      }}
    />
  );
}

export default MoraleAura;
