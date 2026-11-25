import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark';
  isDark?: boolean;
  themeStyles?: {
    textPrimary?: string;
    textMuted?: string;
  };
  showSubtitle?: boolean;
  subtitleText?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  isDark = true,
  themeStyles,
  showSubtitle = true,
  subtitleText = 'Understand Every Conversation. Respond Like a Human.',
}) => {
  const uid = useId().replace(/:/g, '');
  const obsidianId = `sa-obs-${uid}`;
  const rimId = `sa-rim-${uid}`;
  const ribbonTopId = `sa-rib1-${uid}`;
  const ribbonBotId = `sa-rib2-${uid}`;
  const glowId = `sa-core-${uid}`;

  const iconSizes: Record<NonNullable<BrandLogoProps['size']>, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes: Record<NonNullable<BrandLogoProps['size']>, string> = {
    sm: 'text-sm sm:text-[15px]',
    md: 'text-base sm:text-[17px]',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  };

  const primaryTextClass =
    themeStyles?.textPrimary || (isDark ? 'text-white' : 'text-slate-900');
  const mutedTextClass =
    themeStyles?.textMuted || (isDark ? 'text-slate-400' : 'text-slate-500');

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Flagship Kinetic S-Ribbon & Orbital Prism Emblem */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-[1.04]`}
      >
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Situation AI Executive Logo"
        >
          <defs>
            <linearGradient
              id={obsidianId}
              x1="6"
              y1="4"
              x2="58"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#161B22" />
              <stop offset="100%" stopColor="#0D1117" />
            </linearGradient>

            <linearGradient
              id={rimId}
              x1="6"
              y1="4"
              x2="58"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient
              id={ribbonTopId}
              x1="16"
              y1="14"
              x2="46"
              y2="34"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            <linearGradient
              id={ribbonBotId}
              x1="18"
              y1="30"
              x2="48"
              y2="50"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            <filter id={glowId} x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1"
                floodColor="#0F172A"
                floodOpacity="0.45"
              />
            </filter>
          </defs>

          {/* Architectural Beveled Frame */}
          <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${obsidianId})`} />
          <rect
            x="3.9"
            y="3.9"
            width="56.2"
            height="56.2"
            rx="15.1"
            stroke={`url(#${rimId})`}
            strokeWidth="1.6"
          />

          {/* Precision Orbital Calibration Ring */}
          <circle
            cx="32"
            cy="32"
            r="21.5"
            stroke="#64748B"
            strokeOpacity="0.18"
            strokeWidth="1"
            strokeDasharray="2.5 3.5"
          />

          {/* Corner Micro Calibration Ticks */}
          <path
            d="M12 18V12H18M46 12H52V18M52 46V52H46M18 52H12V46"
            stroke="#64748B"
            strokeOpacity="0.22"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upper Kinetic 'S' Neural Ribbon */}
          <path
            d="M44.5 21.5C44.5 17.2 39.6 14.5 32.5 14.5C24.5 14.5 19.5 18.4 19.5 23.8C19.5 29.6 26.2 31.2 33 32.5"
            stroke={`url(#${ribbonTopId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Lower Kinetic 'S' Neural Ribbon */}
          <path
            d="M19.5 42.5C19.5 46.8 24.4 49.5 31.5 49.5C39.5 49.5 44.5 45.6 44.5 40.2C44.5 34.4 37.8 32.8 31 31.5"
            stroke={`url(#${ribbonBotId})`}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Metallic Specular Edge Highlights */}
          <path
            d="M42.8 20.8C41.2 18.1 37.2 16.5 32.5 16.5C26.4 16.5 22.3 19.1 21.7 22.5"
            stroke="#FFFFFF"
            strokeOpacity="0.45"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M21.2 43.2C22.8 45.9 26.8 47.5 31.5 47.5C37.6 47.5 41.7 44.9 42.3 41.5"
            stroke="#FFFFFF"
            strokeOpacity="0.3"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Situational North-Star Core */}
          <g filter={`url(#${glowId})`}>
            <path
              d="M32 24.8L34.5 30.1L39.8 32L34.5 33.9L32 39.2L29.5 33.9L24.2 32L29.5 30.1L32 24.8Z"
              fill="#F8FAFC"
            />
          </g>

          {/* Twin Signal Convergence Nodes */}
          <circle cx="44.5" cy="21.5" r="2.2" fill="#CBD5E1" />
          <circle cx="19.5" cy="42.5" r="2.2" fill="#93C5FD" />
        </svg>
      </div>

      {/* Executive Wordmark & Precision Lockup */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`font-black tracking-[-0.03em] whitespace-nowrap ${textSizes[size]} ${primaryTextClass}`}
            >
              SITUATION
            </span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-bold tracking-wider text-[10px] sm:text-[11px] bg-[#2563EB] text-white shrink-0`}
            >
              AI
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`text-[10.5px] mt-1 leading-none tracking-wide truncate whitespace-nowrap ${mutedTextClass}`}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
