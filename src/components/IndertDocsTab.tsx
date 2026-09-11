import React, { useState } from 'react';
import {
  Landmark,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Edit2,
  Printer,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import {
  IndertDocument,
  IndertDocumentCategory,
  IndertDocumentStatus,
  CommunitySettings,
  UserAccount,
} from '../types';
import { formatGuaranies } from '../utils/currency';
import { formatParaguayDate } from '../utils/paraguayDate';
import { downloadIndertDocument } from '../utils/fileDownloader';
import { isAdministrativeUser } from '../utils/privacyUtils';

interface IndertDocsTabProps {
  documents: IndertDocument[];
  settings: CommunitySettings;
  currentUser: UserAccount | null;
  onOpenNewDoc: () => void;
  onEditDoc: (doc: IndertDocument) => void;
  onDeleteDoc: (id: string) => void;
}

export const IndertDocsTab: React.FC<IndertDocsTabProps> = ({
  documents,
  settings,
  currentUser,
  onOpenNewDoc,
  onEditDoc,
  onDeleteDoc,
}) => {
  const isAdmin = isAdministrativeUser(currentUser);
  const canManageIndertDocs = isAdmin || currentUser?.permissions?.canManageIndertDocs;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.residentName && doc.residentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.relatedBlock && `mz ${doc.relatedBlock}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || doc.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI calculations
  const totalDocs = documents.length;
  const inProcessDocs = documents.filter((d) => d.status === 'en_tramite').length;
  const verifiedDocs = documents.filter((d) => d.status === 'verificado').length;
  const totalExpenseDocs = documents
    .filter((d) => d.category === 'gastos_facturas' && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const getCategoryLabel = (cat: IndertDocumentCategory) => {
    switch (cat) {
      case 'expediente_indert':
        return 'Expediente INDERT';
      case 'mensura_planos':
        return 'Mensura & Planos';
      case 'gastos_facturas':
        return 'Factura de Gasto';
      case 'recibos_aportes':
        return 'Recibo de Aporte';
      case 'actas_asambleas':
        return 'Acta / Resolución';
      case 'identidad_titulacion':
        return 'Legajo Ocupante';
      default:
        return 'Gestión';
    }
  };

  const getCategoryBadgeClass = (cat: IndertDocumentCategory) => {
    switch (cat) {
      case 'expediente_indert':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mensura_planos':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gastos_facturas':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'recibos_aportes':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'actas_asambleas':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'identidad_titulacion':
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  const handleDownloadAllSummary = () => {
    const summaryText = `
================================================================================
INSTITUTO NACIONAL DE DESARROLLO RURAL Y DE LA TIERRA (I.N.D.E.R.T.)
${settings.communityName.toUpperCase()}
COLONIA / ASENTAMIENTO: ${settings.settlementLocation}
EXPEDIENTE INDERT PRINCIPAL: ${settings.indertExpedienteNumber || '4821/2024'}
FECHA DE EMISIÓN DEL LEGAJO: ${formatParaguayDate()}
================================================================================

FUNDAMENTACIÓN JURÍDICA Y MARCO LEGAL VIGENTE (REPÚBLICA DEL PARAGUAY):
1. CONSTITUCIÓN NACIONAL (1992):
   - Art. 42: Libertad inalienable de libre asociación con fines comunitarios lícitos.
   - Arts. 114 y 115: Reforma Agraria, fomento a la pequeña propiedad y arraigo familiar.
2. ESTATUTO AGRARIO (LEY N° 1863/2002 Y LEY N° 2419/2004 - INDERT):
   - Reconocimiento de las Comisiones Vecinales como interlocutoras comunitarias válidas.
   - Art. 56: Prohibición de venta especulativa de tierras del Estado. La Comisión NO vende
     tierras; únicamente administra aportes para mensuras, caños y trámites de regularización.
3. LEY N° 3966/2010 ORGÁNICA MUNICIPAL:
   - Reconocimiento de personería por Resolución Municipal para gestión de caminos y obras.
4. CÓDIGO CIVIL PARAGUAYO (ART. 1909 Y CONC.):
   - Tutela jurídica de la posesión pacífica, pública y de buena fe de las familias censadas.
5. VALIDEZ DE CUOTAS Y SANCIONES ASAMBLEARIAS:
   - Las cuotas sociales y multas aprobadas por la Asamblea Soberana son legítimas y obligatorias.

================================================================================
ÍNDICE CONSOLIDADO DE EXPEDIENTES, MENSURAS, FACTURAS Y RENDICIONES DE GASTOS:
--------------------------------------------------------------------------------
${documents
  .map(
    (d, idx) => `
[${idx + 1}] ${d.title}
  - Número / Identificador: ${d.documentNumber}
  - Categoría: ${getCategoryLabel(d.category)}
  - Fecha: ${d.date} | Estado: ${d.status.toUpperCase()}
  ${d.amount ? `- Monto respaldado: ${formatGuaranies(d.amount)}` : ''}
  ${d.relatedBlock ? `- Loteamiento: Mz ${d.relatedBlock} Lote ${d.relatedLot || 'Todos'}` : ''}
  - Archivo registrado: ${d.fileName} (${d.fileSize})
  - Responsable: ${d.uploadedBy}
  - Observaciones: ${d.notes || 'Ninguna'}
`
  )
  .join('\n--------------------------------------------------------------------------------\n')}

TOTAL DOCUMENTOS AUDITADOS: ${totalDocs}
TOTAL GASTOS CON FACTURA RENDIDOS: ${formatGuaranies(totalExpenseDocs)}

CERTIFICACIÓN DE LA COMISIÓN VECINAL:
${settings.presidentName} (Presidente)          ${settings.treasurerName} (Tesorera)
================================================================================
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INDERT_Legajo_Consolidado_${settings.indertExpedienteNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'General'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Banner de Presentación INDERT - Estilo Facebook Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Documentación INDERT, Gestiones & Gastos
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1877F2] border border-blue-200">
                  {settings.indertExpedienteNumber || 'Exp. INDERT N° 4821/2024'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Legajo digital oficial para regularización de tierras fiscales, mensura judicial,
                planos georreferenciados, facturas de compras de cañerías, tendido eléctrico y
                rendición de cuentas comunitarias.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageIndertDocs && (
              <button
                id="btn-upload-indert-doc"
                onClick={onOpenNewDoc}
                className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Cargar Documento / Factura
              </button>
            )}
            <button
              id="btn-download-all-indert"
              onClick={handleDownloadAllSummary}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-300"
              title="Descargar legajo consolidado en texto imprimible"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Descargar Resumen Completo
            </button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">Total Documentos</span>
            <span className="text-base sm:text-lg font-bold text-slate-800">
              {totalDocs} legajos
            </span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] font-medium text-blue-700 block">En Trámite INDERT</span>
            <span className="text-base sm:text-lg font-bold text-[#1877F2]">
              {inProcessDocs} gestiones activas
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700 block">Verificados / Oficiales</span>
            <span className="text-base sm:text-lg font-bold text-emerald-700">
              {verifiedDocs} aprobados
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
            <span className="text-[11px] font-medium text-rose-700 block">Facturas de Gastos</span>
            <span className="text-base sm:text-lg font-bold text-rose-700">
              {formatGuaranies(totalExpenseDocs)} rendidos
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-search-indert-docs"
              type="text"
              placeholder="Buscar por expediente INDERT, título, factura, lote o titular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="verificado">Verificados</option>
              <option value="en_tramite">En Trámite</option>
              <option value="observado">Observados</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1877F2] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({documents.length})
          </button>
          <button
            onClick={() => setSelectedCategory('expediente_indert')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'expediente_indert'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Expedientes INDERT
          </button>
          <button
            onClick={() => setSelectedCategory('mensura_planos')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'mensura_planos'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Planos & Mensura
          </button>
          <button
            onClick={() => setSelectedCategory('gastos_facturas')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'gastos_facturas'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Facturas de Gastos
          </button>
          <button
            onClick={() => setSelectedCategory('recibos_aportes')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'recibos_aportes'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Recibos de Aportes
          </button>
          <button
            onClick={() => setSelectedCategory('actas_asambleas')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'actas_asambleas'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Actas & Resoluciones
          </button>
          <button
            onClick={() => setSelectedCategory('identidad_titulacion')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'identidad_titulacion'
                ? 'bg-[#1877F2] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Legajos Ocupantes
          </button>
        </div>
      </div>

      {/* Document List: Responsive Facebook Style Cards */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No se encontraron documentos con este filtro</p>
          <p className="text-xs text-slate-400 mt-1">
            Puedes cargar una factura de gasto, acta de asamblea o expediente INDERT usando el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header of the Card */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        doc.category
                      )}`}
                    >
                      {getCategoryLabel(doc.category)}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {doc.documentNumber}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      doc.status === 'verificado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'en_tramite'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {doc.status === 'verificado' && <CheckCircle2 className="w-3 h-3" />}
                    {doc.status === 'en_tramite' && <Clock className="w-3 h-3" />}
                    {doc.status === 'observado' && <AlertTriangle className="w-3 h-3" />}
                    {doc.status === 'verificado'
                      ? 'Verificado'
                      : doc.status === 'en_tramite'
                      ? 'En Trámite'
                      : 'Observado'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-1.5">
                  {doc.title}
                </h3>

                {/* Amount if applicable */}
                {doc.amount && (
                  <div className="inline-flex items-center gap-1 text-sm font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 mb-2">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      Importe: {formatGuaranies(doc.amount)}
                    </span>
                  </div>
                )}

                {/* Notes & Description */}
                {doc.notes && (
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {doc.notes}
                  </p>
                )}

                {/* Metadata tags */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {doc.date}
                  </span>

                  {doc.relatedBlock && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      Mz {doc.relatedBlock} Lote {doc.relatedLot || 'Todos'}
                    </span>
                  )}

                  {doc.residentName && (
                    <span className="flex items-center gap-1 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {doc.residentName}
                    </span>
                  )}

                  <span className="text-slate-400">
                    Subido por: <strong className="text-slate-600">{doc.uploadedBy}</strong>
                  </span>
                </div>
              </div>

              {/* Card Actions: Download & Manage */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <FileText className="w-4 h-4 text-[#1877F2]" />
                  <span className="line-clamp-1 max-w-[120px] sm:max-w-[180px]">
                    {doc.fileName}
                  </span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                    {doc.fileSize}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-download-doc-${doc.id}`}
                    onClick={() => downloadIndertDocument(doc, settings)}
                    className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Descargar documento oficial"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>

                  {canManageIndertDocs && (
                    <>
                      <button
                        onClick={() => onEditDoc(doc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar documento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el registro del documento "${doc.title}"?`)) {
                            onDeleteDoc(doc.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
