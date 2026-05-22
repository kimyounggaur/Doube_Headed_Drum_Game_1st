import type { ReactNode } from 'react';

interface MenuButtonProps {
  children: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
  disabled?: boolean;
}

// 단청 색상 + 한지 텍스처 느낌의 메뉴 버튼.
// hover 시 적색→청색으로 전환되어 단청 5색의 전통적 대비를 표현.
function MenuButton({ children, onClick, ariaLabel, disabled = false }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? undefined}
      className="btn-dancheong w-full disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default MenuButton;
