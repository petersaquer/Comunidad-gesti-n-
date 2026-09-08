import React from 'react';
import {
  Plus,
  Landmark,
  Droplets,
  Calendar,
  Compass,
  FileCheck,
  Zap,
} from 'lucide-react';
import { UserAccount, CommunitySettings } from '../types';

interface FacebookStoriesProps {
  currentUser: UserAccount | null;
  settings: CommunitySettings;
  onOpenNewDoc: () => void;
  onSelectTab: (tab: string) => void;
}

export const FacebookStories: React.FC<FacebookStoriesProps> = ({
  currentUser,
  settings,
  onOpenNewDoc,
  onSelectTab,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar select-none">
      {/* Story 1: Create / Upload Shortcut */}
      <div
        onClick={onOpenNewDoc}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer group hover:shadow-md transition-all relative"
      >
        <div className="h-28 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
          <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </div>
        <div className="p-2 text-center bg-white">
          <p className="text-[11px] font-bold text-slate-800 leading-tight">
            Subir Documento
          </p>
          <span className="text-[9px] text-[#1877F2] font-semibold">INDERT / Gasto</span>
        </div>
      </div>

      {/* Story 2: Expediente INDERT */}
      <div
        onClick={() => onSelectTab('indert')}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-gradient-to-b from-blue-700 to-indigo-900 text-white p-2.5 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-all relative group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#1877F2] bg-white text-[#1877F2] flex items-center justify-center font-bold text-xs shadow-xs">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-200 block">
            INDERT
          </span>
          <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">
            Exp. 4821/2024 en Trámite
          </p>
          <span className="text-[9px] text-emerald-300 font-bold block mt-1">
            ● Activo
          </span>
        </div>
      </div>

      {/* Story 3: Red de Agua Potable */}
      <div
        onClick={() => onSelectTab('finances')}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-gradient-to-b from-cyan-600 to-sky-900 text-white p-2.5 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-all relative group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-white text-cyan-700 flex items-center justify-center font-bold text-xs shadow-xs">
          <Droplets className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-200 block">
            Servicio Comunal
          </span>
          <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">
            Red de Agua: Factura de Tubos Rendida
          </p>
          <span className="text-[9px] text-white/90 font-medium block mt-1">
            {settings.currencySymbol}620 Invertidos
          </span>
        </div>
      </div>

      {/* Story 4: Mensura y Planos Topográficos */}
      <div
        onClick={() => onSelectTab('indert')}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-gradient-to-b from-purple-700 to-slate-900 text-white p-2.5 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-all relative group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 bg-white text-purple-700 flex items-center justify-center font-bold text-xs shadow-xs">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-200 block">
            Topografía
          </span>
          <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">
            Plano Georreferenciado UTM
          </p>
          <span className="text-[9px] text-purple-200 font-medium block mt-1">
            Mz A, B y C
          </span>
        </div>
      </div>

      {/* Story 5: Próxima Asamblea Comunal */}
      <div
        onClick={() => onSelectTab('feed')}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-950 text-white p-2.5 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-all relative group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-amber-300 bg-white text-amber-700 flex items-center justify-center font-bold text-xs shadow-xs">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200 block">
            Convocatoria
          </span>
          <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">
            Asamblea de Pobladores
          </p>
          <span className="text-[9px] text-amber-200 font-bold block mt-1">
            Domingo 09:00 hs
          </span>
        </div>
      </div>

      {/* Story 6: Mi Lote & Titulación */}
      <div
        onClick={() => onSelectTab('my_account')}
        className="w-28 sm:w-32 h-40 sm:h-44 rounded-2xl bg-gradient-to-b from-emerald-600 to-teal-950 text-white p-2.5 flex flex-col justify-between overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition-all relative group"
      >
        <div className="w-8 h-8 rounded-full border-2 border-emerald-300 bg-white text-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs">
          <FileCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-200 block">
            Mi Cuenta
          </span>
          <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">
            Certificado de Ocupación
          </p>
          <span className="text-[9px] text-emerald-200 font-bold block mt-1">
            Descargar
          </span>
        </div>
      </div>
    </div>
  );
};
