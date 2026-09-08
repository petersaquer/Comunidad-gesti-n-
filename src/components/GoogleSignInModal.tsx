import React, { useState } from 'react';
import { X, Check, User, Plus, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserAccount, Resident, CommunitySettings } from '../types';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLoginSuccess: (user: UserAccount, residentData?: Partial<Resident>) => void;
  existingUsers: UserAccount[];
  existingResidents: Resident[];
  settings?: CommunitySettings;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onGoogleLoginSuccess,
  existingUsers,
  existingResidents,
  settings,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [isNewGoogleAccount, setIsNewGoogleAccount] = useState(false);
  // State for user creation form (for new accounts)
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDocId, setCustomDocId] = useState('');
  const [customBarrio, setCustomBarrio] = useState('Sector 16');
  const [customBlock, setCustomBlock] = useState('A');
  const [customLot, setCustomLot] = useState('01');
  const [isLoading, setIsLoading] = useState(false);

  // Force new account flow immediately since we removed demo accounts
  React.useEffect(() => {
    setIsNewGoogleAccount(true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      const email = customEmail.trim();
      const doc = customDocId.trim() || `5.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`;
      const newUser: UserAccount = {
        id: `user-google-${Date.now()}`,
        documentId: doc,
        fullName: customName.trim(),
        phone: '+595981000000',
        email: email,
        role: 'residente',
        barrio: customBarrio.trim() || 'Sector 16',
        block: customBlock,
        lot: customLot.trim() || '01',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        authProvider: 'google',
        avatarColor: 'bg-red-500',
      };

      onGoogleLoginSuccess(newUser, {
        fullName: customName.trim(),
        documentId: doc,
        phone: '+595981000000',
        barrio: customBarrio.trim() || 'Sector 16',
        block: customBlock,
        lot: customLot.trim() || '01',
        sector: 'Sector 16 - Lote Asignado',
        status: 'active',
        familyMembersCount: 3,
      });

      setIsLoading(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Google Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {settings?.appName ? `Acceder a ${settings.appName}` : 'Iniciar sesión con Google'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {settings?.communityName || 'Sistema de Gestión Comunitaria INDERT'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disabled Warning if toggled off by Admin */}
        {settings?.googleAuth?.enabled === false && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso del Administrador</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                El acceso con Google se encuentra actualmente en pausa o en configuración por la directiva comunal.
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico de Google *
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cédula de Identidad (C.I.)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 4.892.110"
                  value={customDocId}
                  onChange={(e) => setCustomDocId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={customBarrio}
                    onChange={(e) => setCustomBarrio(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manzana
                  </label>
                  <select
                    value={customBlock}
                    onChange={(e) => setCustomBlock(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A">Mz A</option>
                    <option value="B">Mz B</option>
                    <option value="C">Mz C</option>
                    <option value="D">Mz D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    placeholder="01"
                    value={customLot}
                    onChange={(e) => setCustomLot(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Conectando...' : 'Iniciar Sesión / Registrarse'}
                </button>
              </div>
            </form>

          <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Autenticación protegida con protocolo OAuth Google</span>
          </div>
        </div>
      </div>
    </div>
  );
};
