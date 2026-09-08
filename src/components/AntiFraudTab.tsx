import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  UserX,
  History,
  Eye,
  Plus,
} from 'lucide-react';
import { Resident, CommunitySettings } from '../types';

interface AntiFraudTabProps {
  residents: Resident[];
  settings: CommunitySettings;
  onSelectResident: (resident: Resident) => void;
  onEditResident: (resident: Resident) => void;
}

export const AntiFraudTab: React.FC<AntiFraudTabProps> = ({
  residents,
  settings,
  onSelectResident,
  onEditResident,
}) => {
  const [docQuery, setDocQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    searched: boolean;
    exactMatch: Resident | null;
    similarMatches: Resident[];
  }>({
    searched: false,
    exactMatch: null,
    similarMatches: [],
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const query = docQuery.trim().toLowerCase();
    if (!query) return;

    // Cleaned search
    const cleanQ = query.replace(/[^0-9a-z]/g, '');

    const exact = residents.find((r) => {
      const cleanDoc = r.documentId.toLowerCase().replace(/[^0-9a-z]/g, '');
      return cleanDoc === cleanQ || r.fullName.toLowerCase() === query;
    });

    const similars = residents.filter((r) => {
      if (exact && r.id === exact.id) return false;
      return (
        r.fullName.toLowerCase().includes(query) ||
        r.documentId.toLowerCase().includes(query) ||
        (r.previousSettlementHistory && r.previousSettlementHistory.toLowerCase().includes(query))
      );
    });

    setSearchResult({
      searched: true,
      exactMatch: exact || null,
      similarMatches: similars,
    });
  };

  const flaggedResidents = residents.filter((r) => r.isFraudRisk || r.status === 'flagged');

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-rose-600/90 rounded-xl text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Sistema Anti-Fraude & Control de Doble Ocupación de Terrenos
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
              Herramienta de verificación comunitaria para evitar el acaparamiento ilícito, reventa ilegal de
              lotes o que personas que ya hayan ocupado o recibido un terreno en otro asentamiento intenten
              adjudicarse un nuevo lote de forma fraudulenta.
            </p>
          </div>
        </div>

        {/* Real-time Verification Form */}
        <form onSubmit={handleVerify} className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-antifraud-query"
              type="text"
              placeholder="Ingrese Cédula (C.I. / D.N.I.) o Nombre para verificar antecedentes..."
              value={docQuery}
              onChange={(e) => setDocQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            Verificar Antecedentes
          </button>
        </form>
      </div>

      {/* Verification Query Results */}
      {searchResult.searched && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-150">
          <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-600" />
            Resultado de la Verificación en Base de Datos de Ocupación
          </h4>

          {searchResult.exactMatch ? (
            <div
              className={`p-5 rounded-xl border ${
                searchResult.exactMatch.isFraudRisk
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <UserX className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                      {searchResult.exactMatch.isFraudRisk
                        ? '🚨 ALERTA: REGISTRO CON OBSERVACIÓN DE FRAUDE'
                        : '⚠️ RESIDENTE YA REGISTRADO EN EL PADRÓN'}
                    </span>
                    <h5 className="text-base font-bold text-slate-900 mt-1">
                      {searchResult.exactMatch.fullName}
                    </h5>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      C.I.: <strong>{searchResult.exactMatch.documentId}</strong> • Asignado a Manzana{' '}
                      <strong>{searchResult.exactMatch.block}</strong> - Lote{' '}
                      <strong>{searchResult.exactMatch.lot}</strong>
                    </p>

                    <div className="mt-2 text-xs bg-white/80 p-3 rounded-lg border border-slate-200">
                      <strong>Historial de Ocupaciones / Antecedentes:</strong>
                      <p className="mt-0.5 text-slate-700">
                        {searchResult.exactMatch.previousSettlementHistory}
                      </p>
                      {searchResult.exactMatch.fraudNotes && (
                        <p className="mt-1 font-semibold text-rose-700">
                          Motivo de Alerta: {searchResult.exactMatch.fraudNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectResident(searchResult.exactMatch!)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Ver Ficha Completa
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">No registra antecedentes negativos ni lotes duplicados.</span>
                  <p className="text-emerald-800 text-[11px]">
                    El documento o nombre consultado no figura con antecedentes de doble ocupación en el sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Similar Matches */}
          {searchResult.similarMatches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 mb-2">
                Coincidencias Parciales o Menciones en Antecedentes ({searchResult.similarMatches.length})
              </h5>
              <div className="space-y-2">
                {searchResult.similarMatches.map((sim) => (
                  <div
                    key={sim.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{sim.fullName}</span> (C.I. {sim.documentId})
                      - Mz {sim.block} Lote {sim.lot}
                      <p className="text-[11px] text-slate-500 mt-0.5">{sim.previousSettlementHistory}</p>
                    </div>
                    <button
                      onClick={() => onSelectResident(sim)}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Inspeccionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flagged Residents Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Expedientes de Residentes en Observación / Sospecha de Fraude ({flaggedResidents.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Casos con antecedentes en otros asentamientos o alertas de traspaso irregular
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Residente & C.I.</th>
                <th className="py-3 px-3.5">Ubicación Lote</th>
                <th className="py-3 px-3.5">Antecedente / Asentamiento Previo</th>
                <th className="py-3 px-3.5">Dictamen de Alerta</th>
                <th className="py-3 px-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flaggedResidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No hay residentes marcados en alerta de fraude actualmente.
                  </td>
                </tr>
              ) : (
                flaggedResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{r.fullName}</div>
                      <span className="font-mono text-slate-500 text-[11px]">C.I. {r.documentId}</span>
                    </td>

                    <td className="py-3 px-3.5 font-bold text-slate-800">
                      Mz. {r.block} - Lote {r.lot}
                      <span className="block text-[11px] text-slate-400 font-normal">{r.sector}</span>
                    </td>

                    <td className="py-3 px-3.5 text-slate-700 max-w-xs">
                      {r.previousSettlementHistory || 'Sin datos'}
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-semibold text-[11px] border border-rose-200">
                        {r.fraudNotes || 'En investigación vecinal'}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => onSelectResident(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
