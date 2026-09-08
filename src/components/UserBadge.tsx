import React from 'react';
import {
  Crown,
  Coins,
  FileText,
  Home,
  Scale,
  Shield,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types';
import { getUserRoleConfig } from '../utils/permissionUtils';

interface UserBadgeProps {
  role: UserRole;
  customTitle?: string;
  assignedBlock?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  withGlow?: boolean;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  role,
  customTitle,
  assignedBlock,
  size = 'sm',
  showIcon = true,
  withGlow = false,
  className = '',
}) => {
  const config = getUserRoleConfig(role);

  const getRoleIcon = () => {
    const iconClasses = {
      xs: 'w-2.5 h-2.5',
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }[size];

    switch (role) {
      case 'admin':
        return <Crown className={`${iconClasses} text-amber-500 shrink-0`} />;
      case 'tesorera':
        return <Coins className={`${iconClasses} text-emerald-600 shrink-0`} />;
      case 'secretaria':
        return <FileText className={`${iconClasses} text-indigo-600 shrink-0`} />;
      case 'delegado':
        return <Home className={`${iconClasses} text-orange-600 shrink-0`} />;
      case 'sindico':
        return <Scale className={`${iconClasses} text-cyan-600 shrink-0`} />;
      case 'directiva':
        return <Shield className={`${iconClasses} text-blue-600 shrink-0`} />;
      case 'residente':
      default:
        return <UserCheck className={`${iconClasses} text-slate-500 shrink-0`} />;
    }
  };

  const displayText =
    customTitle ||
    (role === 'delegado' && assignedBlock ? `Delegado Mz ${assignedBlock}` : config.badgeTitle);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1 font-semibold rounded-md',
    sm: 'px-2 py-0.5 text-xs gap-1.5 font-bold rounded-lg',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-bold rounded-lg',
    lg: 'px-3 py-1.5 text-sm gap-2 font-black rounded-xl',
  }[size];

  // Distinct insignia styling per role
  const badgeThemeClasses = {
    admin:
      'bg-linear-to-r from-amber-50 via-amber-100/70 to-yellow-50 text-amber-900 border border-amber-300 shadow-2xs',
    tesorera:
      'bg-linear-to-r from-emerald-50 via-teal-50 to-emerald-100/60 text-emerald-900 border border-emerald-300 shadow-2xs',
    secretaria:
      'bg-linear-to-r from-indigo-50 via-purple-50 to-indigo-100/60 text-indigo-900 border border-indigo-300 shadow-2xs',
    delegado:
      'bg-linear-to-r from-orange-50 via-amber-50 to-orange-100/60 text-orange-950 border border-orange-300 shadow-2xs',
    sindico:
      'bg-linear-to-r from-cyan-50 via-sky-50 to-cyan-100/60 text-cyan-950 border border-cyan-300 shadow-2xs',
    directiva:
      'bg-linear-to-r from-blue-50 via-indigo-50 to-blue-100/60 text-blue-950 border border-blue-300 shadow-2xs',
    residente: 'bg-slate-100 text-slate-700 border border-slate-200',
  }[role];

  const baseDisplay = className.includes('hidden') ? '' : 'inline-flex';

  return (
    <span
      className={`${baseDisplay} items-center tracking-tight transition-all select-none ${sizeClasses} ${badgeThemeClasses} ${
        withGlow && role === 'admin' ? 'ring-2 ring-amber-400/40 shadow-sm' : ''
      } ${withGlow && role === 'tesorera' ? 'ring-2 ring-emerald-400/40 shadow-sm' : ''} ${className}`}
      title={config.description}
    >
      {showIcon && getRoleIcon()}
      <span className="truncate whitespace-nowrap">{displayText}</span>
      {role === 'tesorera' && size !== 'xs' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      )}
      {role === 'admin' && size !== 'xs' && (
        <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
      )}
    </span>
  );
};
