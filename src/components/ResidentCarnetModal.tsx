import React from 'react';
import { X, User, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Resident, CommunitySettings } from '../types';

interface ResidentCarnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident;
  settings: CommunitySettings;
}

export const ResidentCarnetModal: React.FC<ResidentCarnetModalProps> = ({
  isOpen,
  onClose,
  resident,
  settings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800">Carnet Comunitario</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <User className="w-10 h-10" />
          </div>
          
          <h3 className="font-bold text-xl text-slate-900 text-center mb-1">
            {resident.fullName}
          </h3>
          <p className="text-sm text-slate-500 mb-4">CI: {resident.documentId}</p>

          <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2 mb-6 w-full justify-center border border-slate-100">
            <MapPin className="w-4 h-4 text-[#1877F2]" />
            <span className="font-medium text-slate-700">
              {settings.communityName} • Mz {resident.block} - Lt {resident.lot}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <QRCodeSVG 
              value={resident.id} 
              size={180} 
              level="H" 
              includeMargin={true}
            />
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Muestra este código QR a la comisión para registrar tu asistencia a faenas y reuniones.
          </p>
        </div>
      </div>
    </div>
  );
};
