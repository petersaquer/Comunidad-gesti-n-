import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Check, User, CreditCard, MapPin, Phone, UserCheck, Users } from 'lucide-react';
import { Resident } from '../types';

interface ResidentSearchSelectProps {
  residents: Resident[];
  selectedResidentId?: string;
  onSelect: (resident: Resident) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export const ResidentSearchSelect: React.FC<ResidentSearchSelectProps> = ({
  residents,
  selectedResidentId,
  onSelect,
  disabled = false,
  label = 'Residente / Ocupante del Lote',
  required = true,
  placeholder = 'Buscar por nombre, Cédula (C.I.) o Manzana/Lote...',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedResident = useMemo(() => {
    return residents.find((r) => r.id === selectedResidentId);
  }, [residents, selectedResidentId]);

  // Unique blocks for quick filter chips
  const availableBlocks = useMemo(() => {
    const blocks = Array.from(new Set(residents.map((r) => r.block).filter(Boolean))).sort();
    return blocks;
  }, [residents]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSelectedBlockFilter('all');
    }
  }, [isModalOpen]);

  // Normalize search query (strip accents and lowercase)
  const normalizedQuery = useMemo(() => {
    return searchQuery
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }, [searchQuery]);

  const cleanDigits = useMemo(() => {
    return searchQuery.replace(/\D/g, '');
  }, [searchQuery]);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      // Block filter
      if (selectedBlockFilter !== 'all' && r.block !== selectedBlockFilter) {
        return false;
      }

      if (!normalizedQuery) return true;

      const nameNorm = (r.fullName || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const docRaw = (r.documentId || '').toLowerCase();
      const docClean = docRaw.replace(/\D/g, '');
      const blockNorm = (r.block || '').toLowerCase();
      const lotNorm = (r.lot || '').toLowerCase();
      const phoneClean = (r.phone || '').replace(/\D/g, '');

      return (
        nameNorm.includes(normalizedQuery) ||
        docRaw.includes(normalizedQuery) ||
        (cleanDigits.length >= 2 && docClean.includes(cleanDigits)) ||
        blockNorm === normalizedQuery ||
        `mz ${blockNorm}`.includes(normalizedQuery) ||
        `manzana ${blockNorm}`.includes(normalizedQuery) ||
        lotNorm === normalizedQuery ||
        `lote ${lotNorm}`.includes(normalizedQuery) ||
        (cleanDigits.length >= 4 && phoneClean.includes(cleanDigits))
      );
    });
  }, [residents, normalizedQuery, cleanDigits, selectedBlockFilter]);

  const handleSelect = (resident: Resident) => {
    onSelect(resident);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Label Bar */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-900 text-xs sm:text-sm">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {!disabled && selectedResident && (
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Asignado
          </span>
        )}
      </div>

      {/* Main trigger in the form (NO inline drop-downs, NO arrow bugs) */}
      {disabled ? (
        // Read-only state
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
            {selectedResident?.fullName ? (
              selectedResident.fullName.charAt(0).toUpperCase()
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {selectedResident?.fullName || 'Sin residente asignado'}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>C.I. {selectedResident?.documentId || 'S/D'}</span>
              <span>•</span>
              <span>
                Mz. {selectedResident?.block || '-'} - Lote {selectedResident?.lot || '-'}
              </span>
            </p>
          </div>
        </div>
      ) : selectedResident ? (
        // Selected Resident Card with quick "Cambiar" modal button
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/40 rounded-xl border-2 border-indigo-300 flex items-center justify-between gap-3 shadow-xs transition-all hover:border-indigo-400">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
              {selectedResident.fullName ? selectedResident.fullName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 break-words leading-tight">
                  {selectedResident.fullName}
                </h4>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200 shrink-0">
                  C.I. {selectedResident.documentId}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-600 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                  Mz. {selectedResident.block} - Lote {selectedResident.lot}
                </span>
                {selectedResident.phone && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    {selectedResident.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-300 shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cambiar</span>
          </button>
        </div>
      ) : (
        // Empty State: Prominent button to open the Search Modal
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full p-4 bg-indigo-50/70 hover:bg-indigo-100/80 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl text-left flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-indigo-950 group-hover:text-indigo-900">
                Seleccionar / Buscar Residente
              </p>
              <p className="text-[11px] text-indigo-600/90 font-medium truncate">
                Toca aquí para buscar por Nombre, Cédula o Manzana
              </p>
            </div>
          </div>

          <span className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-xs shrink-0 flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </span>
        </button>
      )}

      {/* DEDICATED SEARCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">
                    Buscar Residente u Ocupante
                  </h3>
                  <p className="text-xs text-slate-300 truncate">
                    Sector 16 • {residents.length} vecinos registrados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar (Sticky) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-indigo-600 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-11 pr-10 py-3 bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-sm sm:text-base font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-xs placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips (Manzanas) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Filtrar:</span>
                <button
                  type="button"
                  onClick={() => setSelectedBlockFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    selectedBlockFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  Todas las Manzanas ({residents.length})
                </button>
                {availableBlocks.map((block) => {
                  const count = residents.filter((r) => r.block === block).length;
                  return (
                    <button
                      key={block}
                      type="button"
                      onClick={() => setSelectedBlockFilter(block)}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        selectedBlockFilter === block
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                      }`}
                    >
                      Mz. {block} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Counter Banner */}
            <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-[11px] font-bold text-slate-500 shrink-0">
              <span>
                {filteredResidents.length}{' '}
                {filteredResidents.length === 1 ? 'residente encontrado' : 'residentes encontrados'}
              </span>
              {searchQuery && (
                <span className="text-indigo-700">
                  Buscando: "<span className="font-black">{searchQuery}</span>"
                </span>
              )}
            </div>

            {/* Scrollable Resident List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y-0">
              {filteredResidents.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No se encontró ningún residente
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No hay coincidencias para "{searchQuery}". Intente buscar con el número de
                    Cédula (C.I.), solo el primer nombre o apellido.
                  </p>
                  {selectedBlockFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedBlockFilter('all')}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                    >
                      Buscar en todas las manzanas
                    </button>
                  )}
                </div>
              ) : (
                filteredResidents.map((r) => {
                  const isSelected = r.id === selectedResidentId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelect(r)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-800'
                          }`}
                        >
                          {r.fullName ? r.fullName.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-xs sm:text-sm leading-snug break-words ${
                                isSelected
                                  ? 'font-black text-indigo-950'
                                  : 'font-bold text-slate-900 group-hover:text-indigo-900'
                              }`}
                            >
                              {r.fullName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 flex-wrap">
                            <span className="font-black text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 border border-indigo-200/80 shrink-0">
                              <CreditCard className="w-3 h-3 text-indigo-600" />
                              C.I. {r.documentId || 'S/D'}
                            </span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 shrink-0">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              Mz. {r.block} - Lote {r.lot}
                            </span>
                            {r.phone && (
                              <span className="text-slate-500 hidden sm:flex items-center gap-1 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {r.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs">
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Seleccionado</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-bold text-xs transition-colors flex items-center gap-1">
                            <span>Elegir</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando {filteredResidents.length} vecinos
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
