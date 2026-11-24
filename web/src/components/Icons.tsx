export function Logo({ className = "logo" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 132 20" fill="none">
        <text
          x="0"
          y="15"
          fill="currentColor"
          fontFamily="Geist, sans-serif"
          fontWeight="500"
          fontSize="14"
          letterSpacing="1.4"
        >
          A2UI TUTOR
        </text>
      </svg>
    </span>
  );
}

export const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="square" />
  </svg>
);

export const Plus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M8 2v12M2 8h12" strokeLinecap="square" />
  </svg>
);

export const MenuIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 5h12M2 11h12" strokeLinecap="square" />
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="square" />
  </svg>
);

export const SlidersIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M3 4h10M3 8h10M3 12h10" strokeLinecap="square" />
    <circle cx="6" cy="4" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="7" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
