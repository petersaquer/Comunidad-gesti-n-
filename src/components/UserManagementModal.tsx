import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Crown,
  Coins,
  FileText,
  Home,
  Scale,
  UserCheck,
  UserPlus,
  Search,
  Check,
  KeyRound,
  LogIn,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { UserAccount, UserRole, UserPermissions } from '../types';
import { UserBadge } from './UserBadge';
import {
  ROLE_CONFIGS,
  PERMISSION_DEFINITIONS,
  hasPermission,
} from '../utils/permissionUtils';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount | null;
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserAccount) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'directiva' | 'residentes'>('all');

  // Edit / Grant Permissions state
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('residente');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [assignedBlock, setAssignedBlock] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>({});

  // New User Creation state
  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newDocumentId, setNewDocumentId] = useState('');
  const [newPhone, setNewPhone] = useState('+595');
  const [newEmail, setNewEmail] = useState('');
  const [newBlock, setNewBlock] = useState('A');
  const [newLot, setNewLot] = useState('01');

  // Open the permission editor for a user
  const handleStartEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setCustomRoleTitle(user.customRoleTitle || '');
    setAssignedBlock(user.assignedBlock || (user.role === 'delegado' ? user.block || 'A' : ''));

    // Inherit current permissions or default from role
    const defaultPerms = ROLE_CONFIGS[user.role].defaultPermissions;
    setPermissions({
      ...defaultPerms,
      ...(user.permissions || {}),
    });
  };

  // Handle role selection change: auto-populate default permissions
  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    const defaults = ROLE_CONFIGS[newRole].defaultPermissions;
    setPermissions({ ...defaults });
    if (!customRoleTitle) {
      setCustomRoleTitle(ROLE_CONFIGS[newRole].badgeTitle);
    }
  };

  // Toggle individual permission checkbox
  const handleTogglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save the updated role and permissions
  const handleSaveRoleAndPermissions = () => {
    if (!editingUser) return;

    // Protection: Prevent demoting the last admin/presidente
    const isCurrentAdmin = editingUser.role === 'admin' || editingUser.role === 'presidente';
    const isNewRoleAdmin = selectedRole === 'admin' || selectedRole === 'presidente';
    const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'presidente').length;

    if (isCurrentAdmin && !isNewRoleAdmin && adminCount <= 1) {
      alert('Seguridad del Sistema: No puede degradar al único Administrador/Presidente de la plataforma. Primero asigne o cree otro usuario con rol de Administrador.');
      return;
    }

    const updated: UserAccount = {
      ...editingUser,
      role: selectedRole,
      customRoleTitle: customRoleTitle.trim() || undefined,
      assignedBlock: selectedRole === 'delegado' ? assignedBlock.trim() || undefined : undefined,
      permissions,
    };

    onSaveUser(updated);
    setEditingUser(null);
  };

  // Create a brand new user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newDocumentId.trim()) return;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      fullName: newFullName.trim(),
      documentId: newDocumentId.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      role: selectedRole,
      customRoleTitle: customRoleTitle.trim() || undefined,
      assignedBlock: selectedRole === 'delegado' ? assignedBlock.trim() || undefined : undefined,
      permissions,
      barrio: 'Sector 16',
      block: newBlock,
      lot: newLot,
      createdAt: new Date().toISOString().split('T')[0],
      avatarColor:
        selectedRole === 'tesorera'
          ? 'bg-emerald-600'
          : selectedRole === 'admin'
          ? 'bg-amber-600'
          : selectedRole === 'secretaria'
          ? 'bg-indigo-600'
          : 'bg-blue-600',
      authProvider: 'local',
    };

    onSaveUser(newUser);
    setIsCreatingNewUser(false);
    // Reset form
    setNewFullName('');
    setNewDocumentId('');
    setNewEmail('');
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter === 'directiva') {
        const isDir = ['admin', 'tesorera', 'secretaria', 'delegado', 'sindico', 'directiva'].includes(
          u.role
        );
        if (!isDir) return false;
      } else if (roleFilter === 'residentes') {
        if (u.role !== 'residente') return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(term) ||
        u.documentId.toLowerCase().includes(term) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        u.phone.includes(term) ||
        (u.block && u.block.toLowerCase().includes(term)) ||
        (u.lot && u.lot.toLowerCase().includes(term)) ||
        (u.customRoleTitle && u.customRoleTitle.toLowerCase().includes(term)) ||
        ROLE_CONFIGS[u.role]?.label.toLowerCase().includes(term)
      );
    });
  }, [users, roleFilter, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Gestión de Administradores, Roles e Insignias</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Control de Permisos
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Nombre a la Tesorera, Secretaría, Delegados de Manzana y asigne insignias oficiales de la comisión vecinal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader: Search, Filter Tabs & Create Button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('directiva')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                roleFilter === 'directiva'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Directiva & Roles
            </button>
            <button
              onClick={() => setRoleFilter('residentes')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'residentes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vecinos Censados
            </button>
          </div>

          {/* Search Box & New User Button */}
          <div className="flex items-center gap-2 flex-1 sm:justify-end">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, C.I., rol..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1877F2] focus:border-[#1877F2]"
              />
            </div>
            <button
              onClick={() => {
                setSelectedRole('tesorera');
                setCustomRoleTitle('Tesorera Titular');
                setPermissions(ROLE_CONFIGS.tesorera.defaultPermissions);
                setIsCreatingNewUser(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm">No se encontraron usuarios</p>
              <p className="text-xs">Pruebe ajustando el término de búsqueda o filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((user) => {
                const isCurrent = currentUser?.id === user.id;
                const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.residente;

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-xl p-4 border transition-all hover:shadow-xs flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'border-blue-300 bg-blue-50/20 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top bar: Badge & Current User tag */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <UserBadge
                          role={user.role}
                          customTitle={user.customRoleTitle}
                          assignedBlock={user.assignedBlock}
                          size="md"
                          withGlow={user.role === 'admin' || user.role === 'tesorera'}
                        />
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#1877F2] border border-blue-200">
                            Sesión Actual
                          </span>
                        )}
                      </div>

                      {/* Name & Document ID */}
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {user.fullName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                        <span>C.I. N° {user.documentId}</span>
                        {user.block && user.lot && (
                          <span className="text-slate-400">• Mz {user.block} - Lote {user.lot}</span>
                        )}
                      </p>

                      {/* Contact details */}
                      <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {user.phone && (
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.phone}
                          </span>
                        )}
                        {user.email && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]">{user.email}</span>
                          </span>
                        )}
                      </div>

                      {/* Permissions Tags */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {hasPermission(user, 'canManageUsers') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                            👑 Admin Usuarios
                          </span>
                        )}
                        {hasPermission(user, 'canManageFinances') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                            💰 Cobros & Fondos
                          </span>
                        )}
                        {hasPermission(user, 'canManageLandRequests') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                            📑 Solicitudes Lote
                          </span>
                        )}
                        {hasPermission(user, 'canManageResidents') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
                            🏘️ Padrón
                          </span>
                        )}
                        {hasPermission(user, 'canManageIndertDocs') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                            🏛️ INDERT
                          </span>
                        )}
                        {hasPermission(user, 'canManageShifts') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-900 border border-orange-200">
                            🧹 Faenas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Card Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleStartEditUser(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        title="Otorgar permisos o cambiar de rol"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#1877F2]" />
                        <span>Otorgar Rol / Insignia</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUser(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1877F2] text-xs font-bold transition-colors cursor-pointer"
                            title={`Iniciar sesión como ${user.fullName}`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Probar Rol</span>
                          </button>
                        )}
                        {users.length > 1 && !isCurrent && (
                          <button
                            onClick={() => {
                              const isTargetAdmin = user.role === 'admin' || user.role === 'presidente';
                              const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'presidente').length;
                              if (isTargetAdmin && adminCount <= 1) {
                                alert('Seguridad: No se puede eliminar al único Administrador/Presidente del sistema.');
                                return;
                              }
                              if (confirm(`¿Eliminar al usuario ${user.fullName}?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            💡 Los cambios de rol otorgan de inmediato la insignia correspondiente en la cabecera, recibos de caja y posteos comunitarios.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* MODAL 2: Otorgar Rol y Permisos Específicos */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-60 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="bg-linear-to-r from-blue-900 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    Otorgar Rol e Insignia a {editingUser.fullName}
                  </h4>
                  <p className="text-xs text-slate-300">
                    C.I.: {editingUser.documentId} • Mz {editingUser.block || '-'}-Lote {editingUser.lot || '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Role Selection Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Seleccionar Tipo de Usuario / Cargo Comunal:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      {
                        role: 'admin',
                        title: '👑 Presidente / Admin',
                        desc: 'Acceso total y otorgar permisos a otros',
                        badgeColor: 'border-amber-300 bg-amber-50/50',
                      },
                      {
                        role: 'tesorera',
                        title: '💰 Tesorera / Tesorero',
                        desc: 'Cobro de cuotas, recibos y rendición de gastos',
                        badgeColor: 'border-emerald-300 bg-emerald-50/50',
                      },
                      {
                        role: 'secretaria',
                        title: '📝 Secretaria / Secretario',
                        desc: 'Actas comunales, censo y expedientes INDERT',
                        badgeColor: 'border-indigo-300 bg-indigo-50/50',
                      },
                      {
                        role: 'delegado',
                        title: '🏘️ Delegado/a de Manzana',
                        desc: 'Faenas barriales y reclamos de su manzana',
                        badgeColor: 'border-orange-300 bg-orange-50/50',
                      },
                      {
                        role: 'sindico',
                        title: '⚖️ Síndico Fiscalizador',
                        desc: 'Auditoría y control de transparencia de cuentas',
                        badgeColor: 'border-cyan-300 bg-cyan-50/50',
                      },
                      {
                        role: 'residente',
                        title: '👤 Vecino / Ocupante',
                        desc: 'Portal personal y consulta de estado de cuenta',
                        badgeColor: 'border-slate-200 bg-slate-50',
                      },
                    ] as const
                  ).map((item) => {
                    const isSelected = selectedRole === item.role;
                    return (
                      <button
                        type="button"
                        key={item.role}
                        onClick={() => handleRoleChange(item.role)}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30'
                            : `${item.badgeColor} hover:border-slate-400`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {item.title}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#1877F2] font-black" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insignia Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Insignia que portará en el sistema:
                  </span>
                  <div className="mt-1">
                    <UserBadge
                      role={selectedRole}
                      customTitle={customRoleTitle}
                      assignedBlock={assignedBlock}
                      size="md"
                      withGlow={true}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Identificación Oficial</span>
                  <span className="text-xs font-extrabold text-slate-700">Comisión Sector 16</span>
                </div>
              </div>

              {/* Custom Title & Assigned Block fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Personalizado de la Insignia (Opcional):
                  </label>
                  <input
                    type="text"
                    value={customRoleTitle}
                    onChange={(e) => setCustomRoleTitle(e.target.value)}
                    placeholder={ROLE_CONFIGS[selectedRole].badgeTitle}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1877F2]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ej: "Tesorera Titular 2026", "Secretaría de Actas"
                  </p>
                </div>

                {selectedRole === 'delegado' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Manzana Asignada:
                    </label>
                    <select
                      value={assignedBlock}
                      onChange={(e) => setAssignedBlock(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#1877F2]"
                    >
                      <option value="A">Manzana A</option>
                      <option value="B">Manzana B</option>
                      <option value="C">Manzana C</option>
                      <option value="D">Manzana D</option>
                      <option value="E">Manzana E</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Granular Permissions Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Permisos Específicos Otorgados:
                  </label>
                  <button
                    type="button"
                    onClick={() => setPermissions(ROLE_CONFIGS[selectedRole].defaultPermissions)}
                    className="text-[11px] text-[#1877F2] font-semibold hover:underline cursor-pointer"
                  >
                    Restaurar por defecto del cargo
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const isChecked = Boolean(permissions[perm.key]);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="mt-0.5 rounded text-[#1877F2] focus:ring-[#1877F2] cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-xs">{perm.label}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRoleAndPermissions}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Otorgar Insignia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Crear Nuevo Usuario Directivo / Admin */}
      {isCreatingNewUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-60 overflow-y-auto">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95"
          >
            <div className="bg-linear-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-white" />
                <h4 className="font-extrabold text-sm sm:text-base">
                  Crear Nuevo Usuario / Cargo Comunal
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNewUser(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre y Apellido Completo *:
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ej: Marta Delgado Silva"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    C.I. / Cédula *:
                  </label>
                  <input
                    type="text"
                    required
                    value={newDocumentId}
                    onChange={(e) => setNewDocumentId(e.target.value)}
                    placeholder="Ej: 3.190.224"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono Celular:
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+595981..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo Electrónico (Opcional):
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@s16.org.py"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Manzana:
                  </label>
                  <select
                    value={newBlock}
                    onChange={(e) => setNewBlock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                  >
                    <option value="A">Manzana A</option>
                    <option value="B">Manzana B</option>
                    <option value="C">Manzana C</option>
                    <option value="D">Manzana D</option>
                    <option value="Admin">Sede / Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lote:
                  </label>
                  <input
                    type="text"
                    value={newLot}
                    onChange={(e) => setNewLot(e.target.value)}
                    placeholder="01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cargo / Rol a Otorgar:
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-[#1877F2]"
                >
                  <option value="tesorera">💰 Tesorera / Tesorero Comunal</option>
                  <option value="secretaria">📝 Secretaria / Secretario de Actas</option>
                  <option value="admin">👑 Presidente / Administrador</option>
                  <option value="delegado">🏘️ Delegado/a de Manzana</option>
                  <option value="sindico">⚖️ Síndico Fiscalizador</option>
                  <option value="residente">👤 Ocupante / Vecino Censado</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Vista Previa de la Insignia:
                </span>
                <UserBadge role={selectedRole} customTitle={customRoleTitle} size="md" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingNewUser(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Crear Usuario y Asignar Rol</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
