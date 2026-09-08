import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  Lock,
  Eye,
  FileText,
  X,
  Landmark,
  HeartHandshake,
  CheckCircle2,
  Building2,
  Users,
  Coins,
  Download,
  Printer,
  FileCheck,
  Ban,
  HelpCircle,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CommunitySettings } from '../types';
import { downloadCommunityGuidePdf } from '../utils/communityDocPdfGenerator';

interface LegalTermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CommunitySettings;
  defaultTab?: 'disclaimer' | 'terms' | 'privacy' | 'transparency';
  initialTab?: 'disclaimer' | 'terms' | 'privacy' | 'transparency';
  onOpenCommunityGuideModal?: () => void;
}

type TabType = 'disclaimer' | 'terms' | 'privacy' | 'transparency';

export const LegalTermsPrivacyModal: React.FC<LegalTermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  settings,
  defaultTab = 'disclaimer',
  initialTab,
  onOpenCommunityGuideModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || defaultTab);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || defaultTab);
    }
  }, [isOpen, initialTab, defaultTab]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadCommunityGuidePdf(settings);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-4xl h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header with Paraguay Flag Accent Bar */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 sm:p-5 shrink-0">
          {/* Flag Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 flex">
            <div className="w-1/3 bg-[#D52B1E]" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-[#0038A8]" />
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 shadow-xs">
                <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider">
                    USO INTERNO COMUNITARIO
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 truncate">
                    {settings.communityName} • Paraguay
                  </span>
                </div>
                <h2 className="text-sm sm:text-lg font-black text-white leading-tight mt-0.5 truncate">
                  Marco Legal, Términos, Privacidad & Transparencia
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-200/80 leading-tight line-clamp-1 sm:line-clamp-none mt-0.5">
                  Herramienta tecnológica vecinal de uso interno para la autogestión comunitaria y rendición de cuentas pública
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Descargar PDF Oficial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-4 gap-1.5 sm:gap-2 overflow-x-auto shrink-0 py-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'disclaimer'
                ? 'bg-amber-50 text-amber-900 shadow-xs border border-amber-300 ring-1 ring-amber-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-extrabold">1. Descargo Legal (No Gubernamental)</span>
          </button>

          <button
            onClick={() => setActiveTab('transparency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'transparency'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-300 ring-1 ring-emerald-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Transparencia & Caja Abierta</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'terms'
                ? 'bg-blue-50 text-blue-900 shadow-xs border border-blue-300 ring-1 ring-blue-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>3. Términos & Condiciones</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-indigo-50 text-indigo-900 shadow-xs border border-indigo-300 ring-1 ring-indigo-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Políticas de Privacidad (Datos)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 text-slate-700">
          
          {/* TAB 1: DESCARGO LEGAL NO GUBERNAMENTAL */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              
              {/* Highlight Critical Warning */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-300/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      Declaración Expresa de Naturaleza No Gubernamental y Uso Interno
                    </h3>
                    <p className="text-[11px] sm:text-xs text-amber-950/90 leading-relaxed mt-1">
                      Este sistema informático (ComunidApp / Sistema S16) es una <strong>herramienta tecnológica privada y autónoma de autogestión vecinal</strong> desarrollada para el <strong>uso interno exclusivo</strong> de la Comisión Vecinal Pro-Tierra y los residentes censados de la comunidad.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px] text-amber-950 font-medium">
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 flex items-start gap-2">
                    <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span><strong>NO es un sistema oficial del Estado:</strong> No pertenece ni está operado por el I.N.D.E.R.T., MUVH, Catastro ni la Municipalidad.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Carácter Social y Probatorio:</strong> Los certificados y actas generados son de orden gremial interno y acreditan posesión comunitaria de buena fe.</span>
                  </div>
                </div>
              </div>

              {/* Clarification Points */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-slate-500">
                  Precisiones Jurídicas e Institucionales
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      🏛️
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900">Titulación Exclusiva</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      La titulación definitiva y los actos administrativos vinculantes son potestad exclusiva del I.N.D.E.R.T., el Poder Judicial y los Registros Públicos (DGRP).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      📋
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900">Finalidad del Sistema</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Organizar el censo vecinal, registrar aportes para gastos de mensura y apertura de calles, y resguardar la antigüedad de ocupación familiar.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                      🤝
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900">Autonomía Vecinal</h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Amparado en el derecho constitucional de libre asociación pacífica, participación comunitaria y defensa de los derechos colectivos (Art. 42 CN).
                    </p>
                  </div>
                </div>
              </div>

              {/* Institutional Reference */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Para trámites formales de expedientes matrices, mensuras judiciales y titulación definitiva del asentamiento, consulte directamente en las oficinas regionales o sede central del <strong>Instituto Nacional de Desarrollo Rural y de la Tierra (I.N.D.E.R.T.)</strong> con el número de expediente <strong className="text-slate-900">{settings.indertExpedienteNumber || '4821/2024'}</strong>.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: TRANSPARENCIA Y CAJA ABIERTA */}
          {activeTab === 'transparency' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span>Compromiso Comunitario de Transparencia Total & Rendición de Cuentas</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Todo ingreso económico y gasto efectuado en la comunidad se registra digitalmente en tiempo real, garantizando que los vecinos puedan auditar el destino de sus aportes en cualquier momento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>Recibo Digital Alfanumérico Único</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Cada aporte (cuota social, gastos de mensura, obras de agua o luz) genera automáticamente un comprobante inalterable con código único, fecha y firma digital de Tesorería.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-800">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Libro de Caja Abierto las 24 Horas</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    El balance consolidado, el detalle cronológico de gastos (combustible de maquinaria, caños, honorarios de agrimensor) y el saldo en caja están disponibles públicamente.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-800">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Régimen de Doble Firma & Control Social</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Ningún gasto mayor se ejecuta sin la aprobación conjunta de Presidencia y Tesorería, y debe ser ratificado en las Asambleas Comunitarias periódicas.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-800">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Auditoría y Copia de Seguridad Inmutable</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    El historial financiero se resguarda en base de datos protegida con posibilidad de exportación a PDF y hojas de cálculo para revisión de los síndicos vecinales.
                  </p>
                </div>
              </div>

              {/* Banner de Autoridades Responsables */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block">Mesa Directiva Responsable de la Rendición:</span>
                  <span className="text-slate-600 text-[11px]">
                    Presidencia: <strong className="text-slate-900">{settings.presidentName || 'Designado'}</strong> • Tesorería: <strong className="text-slate-900">{settings.treasurerName || 'Designado'}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                  Caja Auditada
                </span>
              </div>

            </div>
          )}

          {/* TAB 3: TÉRMINOS Y CONDICIONES */}
          {activeTab === 'terms' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150 text-xs leading-relaxed">
              
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <h3 className="font-black text-blue-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#1877F2]" />
                  <span>Términos y Condiciones de Uso del Sistema Comunitario</span>
                </h3>
                <p className="text-[11px] text-blue-900/80 mt-0.5">
                  Reglamento aplicable a todos los miembros de la Comisión Vecinal, administradores, censistas y residentes registrados.
                </p>
              </div>

              <div className="space-y-3">
                {/* Cláusula 1 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-blue-800">
                    Cláusula 1: Objeto y Alcance del Servicio
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    El presente sistema informático tiene como fin exclusivo brindar soporte administrativo, registral y financiero a la Comisión Vecinal Pro-Tierra de <strong className="text-slate-800">{settings.communityName}</strong>. Su utilización implica la aceptación irrestricta de las normas comunitarias y del Estatuto Agrario (Ley N° 1863/02).
                  </p>
                </div>

                {/* Cláusula 2 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-blue-800">
                    Cláusula 2: Veracidad de la Información y Declaración Jurada
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Todo postulante y residente declara bajo fe de juramento que los datos suministrados (identidad, grupo familiar, residencia efectiva y constancia de no poseer inmueble) son auténticos. La falsedad documental acarrea la nulidad automática de cualquier adjudicación provisoria interna.
                  </p>
                </div>

                {/* Cláusula 3 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-blue-800">
                    Cláusula 3: Prohibición Expresa de Especulación y Reventa Clandestina
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Queda terminantemente prohibida la venta, alquiler o cesión informal de lotes con fines lucrativos. La tierra sujeta a reforma agraria tiene carácter social y familiar. Todo traspaso legítimo de mejoras requiere dictamen formal de la Comisión y actualización en el padrón digital.
                  </p>
                </div>

                {/* Cláusula 4 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-blue-800">
                    Cláusula 4: Aportes Comunitarios y Comprobantes de Pago
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Los aportes recaudados están destinados única y exclusivamente a financiar gastos colectivos (mensura topográfica, apertura de calles, tendido eléctrico y agua potable). Ningún pago es válido sin la emisión del recibo digital emitido por el sistema.
                  </p>
                </div>

                {/* Cláusula 5 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-blue-800">
                    Cláusula 5: Convivencia y Resolución de Conflictos
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Cualquier controversia de linderos o convivencia vecinal será tratada en primera instancia por el Comité de Mediación Comunitaria en base a los registros topográficos y las actas de asamblea.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: POLÍTICAS DE PRIVACIDAD */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150 text-xs leading-relaxed">
              
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                <h3 className="font-black text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-700" />
                  <span>Políticas de Privacidad y Protección de Datos Personales</span>
                </h3>
                <p className="text-[11px] text-indigo-900/80 mt-0.5">
                  En cumplimiento del marco legal paraguayo sobre protección de datos personales (Ley N° 1682/01 y Ley N° 6534/20).
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Responsable */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-indigo-800">
                    1. Responsable del Tratamiento de los Datos
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    La Comisión Vecinal Pro-Tierra de <strong className="text-slate-800">{settings.communityName}</strong> actúa como custodia de los datos recabados en el padrón censal del Sistema S16.
                  </p>
                </div>

                {/* 2. Datos Recabados */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-indigo-800">
                    2. Datos Personales Recabados
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Se registran: Nombre y apellido del titular y cónyuge, N° de Cédula de Identidad, teléfono de contacto, integrantes del grupo familiar, condiciones especiales de salud o vulnerabilidad (SENADIS), identificación de manzana y lote, y comprobantes de aportes comunitarios.
                  </p>
                </div>

                {/* 3. Finalidad */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-indigo-800">
                    3. Finalidad Estricta y Prohibición de Comercialización
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Los datos se utilizan exclusivamente para fines censales, expedición de certificados de ocupación para servicios básicos (ANDE, ESSAP), gestión de expedientes ante el INDERT y defensa de la posesión pacífica comunitaria. <strong>Se garantiza que los datos personales NUNCA serán vendidos, alquilados ni transferidos a empresas comerciales ni a terceros ajenos a la comunidad.</strong>
                  </p>
                </div>

                {/* 4. Seguridad */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-indigo-800">
                    4. Medidas de Seguridad Digital y Custodia
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    El acceso al sistema está restringido mediante credenciales seguras de usuario con roles diferenciados (Administrador, Tesorero, Censista y Vecino). Se realizan respaldos periódicos encriptados para evitar la pérdida o alteración de los registros.
                  </p>
                </div>

                {/* 5. Derechos ARCO */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <h4 className="font-black text-slate-900 text-[11px] uppercase text-indigo-800">
                    5. Derechos de Acceso, Rectificación y Supresión (ARCO)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Cada titular de lote o miembro de la comunidad tiene derecho a consultar sus datos registrados, solicitar la corrección de errores de tipeo o actualización de su grupo familiar dirigiéndose a la Secretaría de la Comisión.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documentación de Autogestión Vecinal • Sector 16</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generando...' : 'Descargar Guía & Términos PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
