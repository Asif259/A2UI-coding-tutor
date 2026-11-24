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

export const FolderIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.09a1.5 1.5 0 0 1 1.06.44l.36.36h4.49A1.5 1.5 0 0 1 13 4.3v7.7A1.5 1.5 0 0 1 11.5 13.5h-9A1.5 1.5 0 0 1 1 12v-8.5z" />
  </svg>
);

export const FileIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M3 1.5A1.5 1.5 0 0 1 4.5 0h5.5a1.5 1.5 0 0 1 1.06.44l3.5 3.5A1.5 1.5 0 0 1 16 4.5v9A1.5 1.5 0 0 1 14.5 15h-10A1.5 1.5 0 0 1 3 13.5v-12zM8.5.5v4h4l-1.5-2a1.5 1.5 0 0 0-1.06-.44h-1.38z" />
  </svg>
);

export const BugIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1zm0 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-4-3a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm7 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zM5 10a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1zm7 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1z" />
  </svg>
);

export const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z" />
  </svg>
);
