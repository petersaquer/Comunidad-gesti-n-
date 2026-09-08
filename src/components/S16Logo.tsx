import React from 'react';

interface S16LogoProps {
  appName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  communitySubtitle?: string;
  variant?: 'light' | 'dark' | 'brand';
  className?: string;
}

export const S16Logo: React.FC<S16LogoProps> = ({
  appName,
  size = 'md',
  showText = true,
  communitySubtitle,
  variant = 'brand',
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      badge: 'w-7 h-7 sm:w-8 sm:h-8 text-xs rounded-lg',
      number: 'text-xs font-black',
      title: 'text-xs sm:text-sm font-black',
      subtitle: 'text-[9px]',
    },
    md: {
      badge: 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm rounded-lg sm:rounded-xl',
      number: 'text-xs sm:text-sm font-black tracking-tighter',
      title: 'text-sm sm:text-base font-extrabold',
      subtitle: 'text-[10px] sm:text-[11px]',
    },
    lg: {
      badge: 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base rounded-xl sm:rounded-2xl',
      number: 'text-sm sm:text-base font-black tracking-tighter',
      title: 'text-base sm:text-lg font-black',
      subtitle: 'text-xs',
    },
    xl: {
      badge: 'w-12 h-12 sm:w-16 sm:h-16 text-base sm:text-xl rounded-2xl',
      number: 'text-base sm:text-xl font-black tracking-tighter',
      title: 'text-lg sm:text-2xl font-black',
      subtitle: 'text-xs sm:text-sm',
    },
  }[size];

  const badgeBg =
    variant === 'light'
      ? 'bg-white text-[#1877F2] shadow-sm border border-slate-200'
      : variant === 'dark'
      ? 'bg-slate-900 text-white shadow-md border border-slate-700'
      : 'bg-white text-[#1877F2] shadow-xs ring-2 ring-white/20';

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 select-none min-w-0 ${className}`}>
      {/* S16 Badge Icon */}
      <div
        className={`${sizeClasses.badge} ${badgeBg} flex items-center justify-center font-black transition-transform shrink-0 relative overflow-hidden`}
        title="Sistema S16"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
        <span className={sizeClasses.number}>S16</span>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap">
            <span
              className={`${sizeClasses.title} tracking-tight font-black truncate max-w-[125px] xs:max-w-[180px] sm:max-w-[280px] md:max-w-none ${
                variant === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            >
              {appName || 'Sistema S16'}
            </span>
            <span className="text-[8px] sm:text-[9px] font-extrabold bg-blue-700 text-blue-100 px-1 sm:px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              INDERT
            </span>
          </div>
          {communitySubtitle && (
            <p
              className={`${sizeClasses.subtitle} font-medium hidden sm:block truncate sm:max-w-[240px] md:max-w-[340px] ${
                variant === 'light' ? 'text-slate-500' : 'text-blue-100'
              }`}
            >
              {communitySubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
