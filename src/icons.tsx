import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 16, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Music = (p: IconProps) => (
  <I {...p}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></I>
);
export const Activity = (p: IconProps) => (
  <I {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></I>
);
export const Play = (p: IconProps) => (
  <I {...p}><polygon points="6 3 20 12 6 21 6 3" /></I>
);
export const Square = (p: IconProps) => (
  <I {...p}><rect x="4" y="4" width="16" height="16" rx="2" /></I>
);
export const Pause = (p: IconProps) => (
  <I {...p}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></I>
);
export const Shield = (p: IconProps) => (
  <I {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></I>
);
export const Camera = (p: IconProps) => (
  <I {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></I>
);
export const AlertTriangle = (p: IconProps) => (
  <I {...p}><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></I>
);
export const Bot = (p: IconProps) => (
  <I {...p}><path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M9 13v2" /><path d="M15 13v2" /></I>
);
export const Sparkles = (p: IconProps) => (
  <I {...p}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" /><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" /></I>
);
export const Send = (p: IconProps) => (
  <I {...p}><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></I>
);
export const Code2 = (p: IconProps) => (
  <I {...p}><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></I>
);
export const GitBranch = (p: IconProps) => (
  <I {...p}><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></I>
);
export const Lock = (p: IconProps) => (
  <I {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></I>
);
export const Unlock = (p: IconProps) => (
  <I {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></I>
);
export const Grid3x3 = (p: IconProps) => (
  <I {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></I>
);
export const Zap = (p: IconProps) => (
  <I {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></I>
);
