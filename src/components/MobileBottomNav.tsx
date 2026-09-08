import React from 'react';
import {
  Home,
  Landmark,
  Users,
  DollarSign,
  User,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserAccount | null;
  pendingDebtsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  pendingDebtsCount,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around select-none">
      {/* Home / Muro */}
      <button
        onClick={() => onSelectTab('feed')}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          activeTab === 'feed' ? 'text-[#1877F2]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">Inicio</span>
      </button>

      {/* INDERT Docs */}
      <button
        onClick={() => onSelectTab('indert')}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer relative ${
          activeTab === 'indert' ? 'text-[#1877F2]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Landmark className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">INDERT</span>
        <span className="absolute top-1 right-3 w-2 h-2 bg-[#1877F2] rounded-full"></span>
      </button>

      {/* Padrón */}
      <button
        onClick={() => onSelectTab('residents')}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          activeTab === 'residents' ? 'text-[#1877F2]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">Padrón</span>
      </button>

      {/* Finanzas */}
      <button
        onClick={() => onSelectTab('finances')}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer relative ${
          activeTab === 'finances' ? 'text-[#1877F2]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <DollarSign className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">Finanzas</span>
        {pendingDebtsCount > 0 && (
          <span className="absolute top-1 right-2 bg-[#E41E3F] text-white text-[9px] font-bold px-1 rounded-full">
            {pendingDebtsCount}
          </span>
        )}
      </button>

      {/* Mi Cuenta */}
      <button
        onClick={() => onSelectTab('my_account')}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          activeTab === 'my_account' ? 'text-[#1877F2]' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-bold">Mi Lote</span>
      </button>
    </div>
  );
};
