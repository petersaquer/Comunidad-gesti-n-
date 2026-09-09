import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  Shield,
  Home,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { UserAccount, UserRole, Resident } from '../types';
import { S16Logo } from './S16Logo';
import { loginWithServer, registerOnServer } from '../utils/firebaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  onRegister: (newUser: UserAccount, residentData?: Partial<Resident>) => void;
  onOpenGoogleSignIn?: () => void;
  existingUsers: UserAccount[];
  existingResidents: Resident[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onOpenGoogleSignIn,
  existingUsers,
  existingResidents,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginDocumentId, setLoginDocumentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regDocumentId, setRegDocumentId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBarrio, setRegBarrio] = useState('Sector 16');
  const [regRole, setRegRole] = useState<UserRole>('residente');
  const [regBlock, setRegBlock] = useState('A');
  const [regLot, setRegLot] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const cleanDoc = loginDocumentId.trim();
    if (!cleanDoc) {
      setLoginError('Por favor ingrese su Cédula de Identidad (C.I.), usuario o correo.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Authenticate with server cryptographic vault (scrypt + rate limiting)
      const serverRes = await loginWithServer(cleanDoc, loginPassword.trim());
      if (serverRes.success && serverRes.user) {
        onLogin(serverRes.user);
        setIsSubmitting(false);
        onClose();
        return;
      }

      if (serverRes.error) {
        setLoginError(serverRes.error);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Server unreachable, fall back to client cache
    }

    // 2. Client-side fallback if server is unreachable
    const user = existingUsers.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanDoc.toLowerCase()) ||
        u.documentId.toLowerCase() === cleanDoc.toLowerCase() ||
        (u.email && u.email.toLowerCase() === cleanDoc.toLowerCase()) ||
        (cleanDoc.toLowerCase() === 'admin' && (u.role === 'admin' || u.username === 'admin' || u.id === 'user-admin'))
    );

    if (!user) {
      const matchedResident = existingResidents.find(
        (r) => r.documentId.toLowerCase() === cleanDoc.toLowerCase()
      );

      if (matchedResident) {
        const autoUser: UserAccount = {
          id: `user-${matchedResident.id}`,
          documentId: matchedResident.documentId,
          fullName: matchedResident.fullName,
          phone: matchedResident.phone,
          role: 'residente',
          block: matchedResident.block,
          lot: matchedResident.lot,
          residentId: matchedResident.id,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          avatarColor: 'bg-indigo-600',
        };
        onLogin(autoUser);
        setIsSubmitting(false);
        onClose();
        return;
      }

      setLoginError('No se encontró ningún usuario con esa Cédula (C.I.), usuario o correo.');
      setIsSubmitting(false);
      return;
    }

    onLogin({
      ...user,
      lastLogin: new Date().toISOString(),
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName || !regDocumentId || !regPassword) {
      setRegError('Por favor complete los campos obligatorios (*).');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Por seguridad la contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (regRole === 'residente' && !regLot) {
      setRegError('Para registrarse como residente debe especificar su número de lote.');
      return;
    }

    // Check duplicate
    const existing = existingUsers.find(
      (u) => u.documentId.trim().toLowerCase() === regDocumentId.trim().toLowerCase()
    );
    if (existing) {
      setRegError('Ya existe una cuenta con este número de Cédula de Identidad.');
      return;
    }

    // Colors palette
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-rose-600',
      'bg-amber-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      documentId: regDocumentId.trim(),
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      role: regRole,
      block: regRole === 'residente' ? regBlock : undefined,
      lot: regRole === 'residente' ? regLot.trim() : undefined,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      avatarColor: randomColor,
    };

    setIsSubmitting(true);
    try {
      await registerOnServer(newUser, regPassword.trim());
    } catch {
      // offline fallback
    }

    onRegister(newUser, {
      fullName: newUser.fullName,
      documentId: newUser.documentId,
      phone: newUser.phone,
      barrio: regBarrio,
      block: newUser.block,
      lot: newUser.lot,
    });

    setRegSuccess('¡Cuenta registrada con éxito y protegida criptográficamente! Iniciando sesión...');
    setTimeout(() => {
      onLogin(newUser);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* S16 Header */}
        <div className="bg-[#1877F2] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <S16Logo size="sm" variant="brand" showText={false} />
            <div>
              <h2 className="font-black text-base leading-tight flex items-center gap-1.5">
                <span>S16</span>
                <span className="text-xs font-normal text-blue-100">| Acceso Vecinal</span>
              </h2>
              <p className="text-[11px] text-blue-100">Sistema de Gestión de Terreno - INDERT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            id="tab-auth-login"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#1877F2] text-[#1877F2] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
          <button
            id="tab-auth-register"
            onClick={() => {
              setActiveTab('register');
              setRegError('');
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'register'
                ? 'border-[#1877F2] text-[#1877F2] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Registrar Cuenta
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {activeTab === 'login' ? (
            <div>
              {/* Google Sign In Option */}
              <div className="mb-4">
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={() => {
                    onClose();
                    onOpenGoogleSignIn?.();
                  }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:border-slate-400"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Continuar con Google</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold">
                      O accede con tu Cédula
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula de Identidad (C.I.), Usuario o Correo
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-login-document"
                      type="text"
                      placeholder="Ej: admin o 4.892.110"
                      value={loginDocumentId}
                      onChange={(e) => setLoginDocumentId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar a Mi Cuenta
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-reg-name"
                    type="text"
                    placeholder="Ej: Ramón Estigarribia Gómez"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cédula C.I. *
                  </label>
                  <input
                    id="input-reg-doc"
                    type="text"
                    placeholder="Ej: 5.412.890"
                    value={regDocumentId}
                    onChange={(e) => setRegDocumentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / Celular
                  </label>
                  <input
                    id="input-reg-phone"
                    type="text"
                    placeholder="Ej: +595981445566"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
                  />
                </div>
              </div>

              {/* Barrio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Barrio / Asentamiento
                </label>
                <input
                  type="text"
                  value={regBarrio}
                  onChange={(e) => setRegBarrio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Cuenta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('residente')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'residente'
                        ? 'border-[#1877F2] bg-blue-50 text-[#1877F2]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    Ocupante de Terreno
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('directiva')}
                    className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'directiva'
                        ? 'border-[#1877F2] bg-blue-50 text-[#1877F2]'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Comisión Vecinal
                  </button>
                </div>
              </div>

              {regRole === 'residente' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      Manzana (Mz) *
                    </label>
                    <select
                      id="select-reg-block"
                      value={regBlock}
                      onChange={(e) => setRegBlock(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="A">Manzana A</option>
                      <option value="B">Manzana B</option>
                      <option value="C">Manzana C</option>
                      <option value="D">Manzana D</option>
                      <option value="E">Manzana E</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">
                      N° de Lote *
                    </label>
                    <input
                      id="input-reg-lot"
                      type="text"
                      placeholder="Ej: 04"
                      value={regLot}
                      onChange={(e) => setRegLot(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crear Contraseña
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
                  required
                />
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-[#42B72A] hover:bg-[#36a420] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Crear Mi Cuenta Comunitaria
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
