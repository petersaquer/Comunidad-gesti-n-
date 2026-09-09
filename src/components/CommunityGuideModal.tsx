import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Users,
  Building2,
  CheckCircle2,
  HelpCircle,
  X,
  Phone,
  Landmark,
  Scale,
  Sparkles,
  ExternalLink,
  Coins,
  ArrowRightLeft,
  BookOpen,
  Check,
  HeartHandshake,
  Clock,
  UserCheck,
  ShieldAlert,
  ClipboardList,
  Home,
  CheckCircle,
  QrCode,
  Calendar,
  Cloud,
} from 'lucide-react';
import { CommunitySettings } from '../types';
import { downloadCommunityGuidePdf } from '../utils/communityDocPdfGenerator';

interface CommunityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CommunitySettings;
}

type GuideTabType =
  | 'summary'
  | 'apply'
  | 'legal'
  | 'antifraud'
  | 'rights'
  | 'transfers'
  | 'treasury'
  | 'steps'
  | 'meetings_qr'
  | 'digital_id_time'
  | 'disclaimer_terms';

export const CommunityGuideModal: React.FC<CommunityGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTabType>('summary');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadCommunityGuidePdf(settings);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header with Paraguay Flag Accent Strip */}
        <div className="relative bg-gradient-to-r from-[#1877F2] to-blue-800 text-white p-3.5 sm:p-5 shrink-0">
          {/* Flag Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 flex">
            <div className="w-1/3 bg-[#D52B1E]" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-[#0038A8]" />
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 tracking-wider shadow-xs">
                    USO INTERNO COMUNITARIO
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-white/20 text-white tracking-wider">
                    NO OFICIAL GUBERNAMENTAL
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-100 truncate">
                    {settings.indertExpedienteNumber ? `Exp. ${settings.indertExpedienteNumber}` : 'Exp. 4821/2024'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-lg font-black text-white leading-tight mt-0.5 truncate">
                  Guía Comunitaria, Acceso a Lote & Transparencia
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-100/90 leading-tight line-clamp-1 sm:line-clamp-none mt-0.5">
                  Requisitos para postular a un terreno, prioridades sociales, tiempos de aprobación y Estatuto Agrario
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Desktop quick download */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-xs items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Descargar PDF Oficial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar guía"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Mobile-Friendly Horizontal Scroll) */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-4 gap-1.5 sm:gap-2 overflow-x-auto shrink-0 py-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'summary'
                ? 'bg-white text-[#1877F2] shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#1877F2]" />
            <span>1. ¿Qué es el Sistema?</span>
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'apply'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-300 ring-1 ring-emerald-400/30'
                : 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-extrabold">2. ¿Cómo Acceder a un Lote? (Prioridades)</span>
          </button>

          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'legal'
                ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Marco Legal INDERT</span>
          </button>

          <button
            onClick={() => setActiveTab('antifraud')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'antifraud'
                ? 'bg-red-50 text-red-700 shadow-xs border border-red-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
            <span>4. Anti-Fraude</span>
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'rights'
                ? 'bg-blue-50 text-blue-800 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-700" />
            <span>5. Derechos y Deberes</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'transfers'
                ? 'bg-amber-50 text-amber-800 shadow-xs border border-amber-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span>6. Cesión & Lotes</span>
          </button>

          <button
            onClick={() => setActiveTab('treasury')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'treasury'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-emerald-700" />
            <span>7. Tesorería & Rendición</span>
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'steps'
                ? 'bg-purple-50 text-purple-800 shadow-xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-700" />
            <span>8. Guía Móvil & Glosario</span>
          </button>

          <button
            onClick={() => setActiveTab('meetings_qr')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'meetings_qr'
                ? 'bg-blue-50 text-[#1877F2] shadow-xs border border-blue-300 ring-1 ring-blue-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#1877F2]" />
            <span className="font-extrabold">9. Asambleas & Control QR</span>
          </button>

          <button
            onClick={() => setActiveTab('digital_id_time')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'digital_id_time'
                ? 'bg-teal-50 text-teal-800 shadow-xs border border-teal-300 ring-1 ring-teal-400/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-extrabold">10. Carnet Digital & Horario Oficial</span>
          </button>

          <button
            onClick={() => setActiveTab('disclaimer_terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'disclaimer_terms'
                ? 'bg-amber-50 text-amber-950 shadow-xs border border-amber-300 ring-1 ring-amber-400/40'
                : 'text-amber-800 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-extrabold">11. Descargo Legal, Términos & Privacidad</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 text-slate-700">
          
          {/* TAB 1: ¿QUÉ ES EL SISTEMA? */}
          {activeTab === 'summary' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
                    Definición Oficial del Sistema S16 INDERT
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-900/80 leading-relaxed mt-0.5">
                    Infraestructura digital comunitaria creada por la Comisión Vecinal Pro-Tierra para registrar el padrón de ocupantes legítimos, la delimitación física de lotes, el historial de aportes y los trámites ante el INDERT de forma transparente e inviolable.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    🏛️
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">Respaldo INDERT</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sustenta el expediente matriz, planos censales y antecedentes oficiales para la mensura judicial y titulación definitiva.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    💎
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">Transparencia Total</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Cada aporte genera un recibo digital con código inalterable. La rendición de ingresos y egresos está abierta las 24 horas.
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    🛡️
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">Protección del Lote</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Acredita la antigüedad de ocupación pacífica, mejoras construidas y composición familiar de cada hogar.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-900 uppercase tracking-wider text-slate-500">
                  ¿Para qué sirve en el día a día?
                </h4>
                <div className="space-y-2">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">Emisión de Certificados de Ocupación:</span>
                      <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                        Para tramitar luz (ANDE), agua potable (ESSAP/Junta de Saneamiento), matrículas escolares y gestiones ante la policía o juzgados.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">Control de Faenas y Trabajos Comunitarios:</span>
                      <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                        Registra la asistencia y colaboración de cada vecino en las mingas ambientales, apertura de calles y limpieza de espacios públicos.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">Prioridad para Familias Vulnerables:</span>
                      <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                        Identifica a familias con niños con discapacidad, adultos mayores y madres cabeza de hogar para proteger su permanencia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ¿CÓMO ACCEDER A UN LOTE? (GUÍA DE POSTULACIÓN Y PRIORIDADES) */}
          {activeTab === 'apply' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              {/* Highlight Hero Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>Guía Integral para el Postulante a un Lote Comunitario</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  El acceso a un lote en el asentamiento se rige por principios de <strong>justicia social, arraigo efectivo, transparencia pública y no discriminación</strong>, conforme a la <strong>Ley 1863/02 (Estatuto Agrario)</strong> y los reglamentos de la Comisión Vecinal Pro-Tierra reconocida por el INDERT.
                </p>
              </div>

              {/* SECCIÓN: ESCALA DE PRIORIDADES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>¿Quiénes tienen PRIORIDAD para la adjudicación de un lote?</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Criterios Sociales
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prioridad 1 */}
                  <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                      PRIORIDAD 1
                    </div>
                    <h4 className="text-xs font-black text-red-950 flex items-center gap-1.5">
                      <span>Alta Vulnerabilidad Social</span>
                    </h4>
                    <ul className="text-[11px] text-red-900/90 space-y-1 leading-tight pt-1">
                      <li>• <strong>Madres solteras / jefas de hogar</strong> con hijos menores a su cargo.</li>
                      <li>• Familias con integrantes con <strong>discapacidad física, sensorial o intelectual</strong> (SENADIS).</li>
                      <li>• <strong>Adultos mayores</strong> en situación de desamparo habitacional o salud precaria.</li>
                      <li>• Familias con 3 o más hijos menores de edad sin techo propio.</li>
                    </ul>
                  </div>

                  {/* Prioridad 2 */}
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                      PRIORIDAD 2
                    </div>
                    <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <span>Familias & Arraigo Local</span>
                    </h4>
                    <ul className="text-[11px] text-blue-900/90 space-y-1 leading-tight pt-1">
                      <li>• Parejas con hijos que vivan alquiladas o en condición de hacinamiento en la zona.</li>
                      <li>• Trabajadores dependientes o cuentapropistas con ingresos destinados al sustento familiar.</li>
                      <li>• Vecinos con participación comprobada en faenas y comisiones comunitarias previas.</li>
                    </ul>
                  </div>

                  {/* Prioridad 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-slate-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                      PRIORIDAD 3
                    </div>
                    <h4 className="text-xs font-black text-slate-950 flex items-center gap-1.5">
                      <span>Jóvenes & Nuevos Hogares</span>
                    </h4>
                    <ul className="text-[11px] text-slate-700 space-y-1 leading-tight pt-1">
                      <li>• Parejas jóvenes recién constituidas que inician su primer proyecto de vida.</li>
                      <li>• Jóvenes trabajadores sin inmueble propio que buscan arraigarse en la comunidad.</li>
                      <li>• Postulantes individuales sin propiedades registradas en la DGRP.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: CRITERIOS DE INHABILITACIÓN (QUIÉNES NO CALIFICAN) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>¿Quiénes quedan INHABILITADOS o RECHAZADOS para recibir un lote?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-950">
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Propietarios de otros inmuebles:</strong> Personas que ya tengan vivienda o terreno inscrito en Registros Públicos.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Especuladores o acaparadores:</strong> Quienes pretendan el lote para alquilarlo, revenderlo o lucrar sin vivir en él.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Antecedentes de violencia vecinal:</strong> Personas con antecedentes de agresión grave a la comunidad o usurpaciones previas.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">✕</span>
                    <span><strong>Lotes ociosos:</strong> Quienes no asuman el compromiso de habitar y edificar mejoras habitacionales inmediatas.</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: PASO A PASO PARA POSTULAR (TIMELINE & TIEMPOS DE APROBACIÓN) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1877F2]" />
                    <span>Paso a Paso del Trámite y Tiempos Oficiales de Aprobación</span>
                  </h3>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Plazo: 15 a 30 días
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Step 1 */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      1
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-900">Presentación de Solicitud y Carpeta Familiar</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Día 1</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        El interesado presenta el formulario de postulación ante la Secretaría de la Comisión Vecinal con fotocopias de C.I. de todo el grupo familiar y constancia de no poseer inmueble.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      2
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-900">Evaluación Socio-Ambiental e Inspección Técnica</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">Días 2 al 10</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        La Comisión realiza una entrevista social y verifica en el Sistema S16 la disponibilidad de un lote vacante (no adjudicado, libre de litigios y respetando el trazado de calles y plazas públicas).
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      3
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-900">Sesión de Evaluación y Dictamen Comunitario</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Días 11 al 20 (Aprobación)</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        La mesa directiva de la Comisión evalúa el orden de prioridades sociales y emite la <strong>Resolución o Dictamen Fundado</strong> de asignación provisoria del lote.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      4
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-900">Firma de Acta de Posesión y Registro en Sistema S16</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Día 21 al 25</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        Se asienta en el Libro de Actas formal, se carga al postulante en el padrón digital del Sistema S16 y se emite su <strong>Certificado Oficial de Ocupación</strong> para trámites de luz y agua.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3 hover:border-blue-300 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      5
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-extrabold text-slate-900">Plazo Perentorio de Arraigo y Construcción de Mejoras</span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">30 a 90 días</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                        El adjudicado tiene hasta <strong>30 días</strong> para cercar y limpiar el terreno, y hasta <strong>90 días</strong> para habitarlo efectivamente con su familia. Si el lote permanece en abandono u ocioso sin justificación, la adjudicación caduca de pleno derecho.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: REQUISITOS EN CARPETA (CHECKLIST) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-700" />
                  <span>Documentación Obligatoria a Presentar (Carpeta de Postulación)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Fotocopia autenticada de C.I. del solicitante, cónyuge e hijos.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Certificado de Vida y Residencia expedido por la Comisaría Jurisdiccional.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Declaración Jurada de no poseer ningún otro inmueble en Paraguay.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Constancia de vulnerabilidad / SENADIS (en caso de discapacidad o enfermedad).</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: PREGUNTAS FRECUENTES DEL POSTULANTE */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#1877F2]" />
                  <span>Preguntas Frecuentes de Quienes Buscan un Terreno</span>
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-0.5">
                    <span className="font-bold text-slate-900">¿Cuánto cuesta el terreno otorgado por el Estado / INDERT?</span>
                    <p className="text-slate-600">
                      La tierra fiscal o sujeta a expropiación tiene un fin social. El precio de la tierra se abona directamente al INDERT en cuotas semestrales o anuales accesibles según la tasación oficial. Los aportes comunales cobrados por la comisión cubren únicamente gastos de mensura, topografía y obras básicas de agua y luz.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-0.5">
                    <span className="font-bold text-slate-900">¿Puedo postular si no tengo trabajo formal?</span>
                    <p className="text-slate-600">
                      Sí. El Estatuto Agrario prioriza a familias de escasos recursos, trabajadores independientes, albañiles, vendedoras y amas de casa. Lo fundamental es la necesidad real de vivienda y la voluntad de habitar el lote.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 space-y-0.5">
                    <span className="font-bold text-slate-900">¿Qué ocurre si salgo sorteado/adjudicado y no construyo de inmediato?</span>
                    <p className="text-slate-600">
                      Debe notificar por escrito a la Comisión Vecinal acreditando el motivo (por ejemplo, compra paulatina de materiales o razones de salud). Si no hay comunicación y pasan los 90 días, el lote se reasigna a otra familia en lista de espera prioritaria.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARCO LEGAL INDERT & PARAGUAY */}
          {activeTab === 'legal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-indigo-950">
                    Sustento Jurídico en la Legislación Paraguaya
                  </h3>
                  <p className="text-[11px] sm:text-xs text-indigo-900/80 leading-relaxed mt-0.5">
                    Todas las actuaciones de la Comisión Vecinal y los datos del Sistema S16 se fundamentan en el ordenamiento legal agrario y constitucional del Paraguay:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900">
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px]">CONSTITUCIÓN NACIONAL</span>
                    <span>ARTÍCULOS 114 Y 115 • DE LA REFORMA AGRARIA</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Garantiza el fomento a la pequeña propiedad, el acceso a la tierra con fines de vivienda digna y producción familiar, y la erradicación del latifundio improductivo.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-900">
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px]">LEY N° 1863/02</span>
                    <span>ESTATUTO AGRARIO Y REQUISITOS DE ARRAIGO</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Establece la condición de beneficiario a quienes no posean otro inmueble, ejerzan posesión pacífica, efectiva y continua, y prohíbe la especulación o venta clandestina de lotes bajo régimen del Estado.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">LEY N° 2419/04</span>
                    <span>CREACIÓN Y ATRIBUCIONES DEL I.N.D.E.R.T.</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Órgano estatal rector encargado de tramitar la compra, expropiación, mensura pericial y posterior titulación definitiva de las fracciones adjudicadas a las familias censadas.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px]">CÓDIGO CIVIL</span>
                    <span>ART. 1909 Y SS. • PROTECCIÓN POSESORIA</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Protege a todo poseedor de buena fe que ejerza ocupación pública e ininterrumpida e incorpore mejoras habitacionales (casas, cercas, cultivos) en el inmueble.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ¿QUÉ PROBLEMAS Y ESTAFAS EVITA? */}
          {activeTab === 'antifraud' && (
            <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150">
              <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-red-950">
                    Blindaje Comunitario contra Malas Prácticas y Estafas
                  </h3>
                  <p className="text-[11px] sm:text-xs text-red-900/80 mt-0.5 leading-relaxed">
                    Este sistema fue programado con candados digitales y blindaje anti-fraude para erradicar las malas prácticas históricas en asentamientos:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-red-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-red-700 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px]">1. CANDADO DIGITAL</span>
                    <span>EVITA LA VENTA DOBLE DE LOTES</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="text-slate-800">Problema:</strong> Venta fraudulenta del mismo lote a dos o más familias.
                    <br />
                    <strong className="text-emerald-700">Solución:</strong> El sistema bloquea de forma inalterable cualquier intento de registrar una Manzana y Lote ya adjudicados.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px]">2. RECIBO INALTERABLE</span>
                    <span>EVITA COBROS PARALELOS O INFORMALES</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="text-slate-800">Problema:</strong> Cobros en papelitos sueltos o por personas no autorizadas.
                    <br />
                    <strong className="text-emerald-700">Solución:</strong> Todo pago requiere recibo oficial digital emitido por el sistema con código único y firma de Tesorería.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-indigo-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-800 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 text-[10px]">3. CAJA ABIERTA 24H</span>
                    <span>EVITA EL DESVÍO DE FONDOS COMUNITARIOS</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="text-slate-800">Problema:</strong> Falta de rendición de cuentas sobre el destino del dinero comunal.
                    <br />
                    <strong className="text-emerald-700">Solución:</strong> Cada egreso (combustible, tubos, tractor, mensura) se registra con comprobante y descuenta en tiempo real.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-800 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px]">4. HISTORIAL INALTERABLE</span>
                    <span>EVITA DESPOJOS INJUSTOS DE POSESIÓN</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="text-slate-800">Problema:</strong> Desalojo arbitrario de vecinos alegando que no tienen arraigo.
                    <br />
                    <strong className="text-emerald-700">Solución:</strong> El sistema custodia la fecha de inicio de posesión, mejoras y actas de asamblea que acreditan antigüedad.
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px]">5. RESPALDO DIGITAL</span>
                    <span>EVITA LA PÉRDIDA O EXTRAVÍO DE CUADERNOS</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 leading-relaxed">
                    <strong className="text-slate-800">Problema:</strong> Deterioro, pérdida o extravío de libros físicos de actas.
                    <br />
                    <strong className="text-emerald-700">Solución:</strong> Copias de seguridad automáticas y base de datos relacional protegida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DERECHOS Y DEBERES */}
          {activeTab === 'rights' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Rights Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs sm:text-sm">
                    <Scale className="w-4 h-4 text-[#1877F2]" />
                    <span>Derechos de Cada Familia</span>
                  </div>

                  <ul className="space-y-2 text-[11px] sm:text-xs text-blue-950">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                      <span><strong>Recibo Oficial:</strong> Exigir el comprobante digital por cada suma abonada.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                      <span><strong>Certificado de Ocupación:</strong> Solicitarlo para trámites de luz, agua y juzgados.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                      <span><strong>Rendición de Cuentas:</strong> Ver el balance de ingresos y egresos comunales 24h.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                      <span><strong>Voz y Voto:</strong> Participar en las asambleas del asentamiento.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
                      <span><strong>Respeto al Lote:</strong> No ser perturbado sin acta formal comunitaria.</span>
                    </li>
                  </ul>
                </div>

                {/* Duties Card */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Deberes con la Comunidad</span>
                  </div>

                  <ul className="space-y-2 text-[11px] sm:text-xs text-emerald-950">
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span><strong>Aporte de Cuota Social:</strong> Abonar la cuota mensual para obras y gestoría.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span><strong>Asistir a Asambleas:</strong> Concurrir a las reuniones convocadas por la comisión.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span><strong>Participación en Faenas:</strong> Colaborar en las mingas de limpieza de calles.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span><strong>Respeto a los Límites:</strong> No mover mojones ni invadir calles públicas.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span><strong>Convivencia Pacífica:</strong> Mantener respeto mutuo entre todos los vecinos.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Official Authorities Box */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-900 mb-2">
                  Autoridades Oficiales de la Comisión Vecinal Pro-Tierra
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Presidencia</span>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-xs">{settings.presidentName || 'Por definir'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Tesorería</span>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-xs">{settings.treasurerName || 'Por definir'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Secretaría</span>
                    <span className="font-bold text-slate-900 text-[11px] sm:text-xs">{settings.secretaryName || 'Por definir'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROTOCOLO DE CESIÓN Y REUBICACIÓN */}
          {activeTab === 'transfers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                    Protocolo Oficial de Cesión de Mejoras y Reubicación Vecinal
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-900/80 leading-relaxed mt-0.5">
                    Queda prohibida la venta clandestina de lotes fiscales. Todo traspaso o cesión de mejoras debe respetar el procedimiento oficial:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    A
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">Comparecencia Personal de Ambas Partes:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      El vecino cedente y la familia postulante deben presentarse ante la Comisión con sus Cédulas de Identidad vigentes.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    B
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">Inspección In Situ y Libre de Litigio:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      La Comisión verifica que el lote no posea litigios de linderos, que las mejoras sean reales y que el postulante califique como beneficiario según el Estatuto Agrario.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    C
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">Acta Formal en Libro Comunitario y Registro S16:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      Se asienta en el Libro de Actas, se actualiza el padrón del sistema digital con la nueva titularidad y se remite la constancia al INDERT.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    D
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">Garantía en Reubicaciones Técnicas:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                      Si por trazado de calles, tendido de ANDE o servidumbre ambiental una familia debe ser reubicada, la Comisión garantiza un lote equivalente dentro del asentamiento sin costo adicional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TESORERÍA Y RENDICIÓN DE CUENTAS */}
          {activeTab === 'treasury' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                    Régimen de Tesorería, Facturas y Rendición Permanente
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-900/80 leading-relaxed mt-0.5">
                    La transparencia financiera es la máxima prioridad para evitar desconfianza y garantizar el buen uso de los fondos de la comunidad:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Destino Exclusivo de Fondos:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    Gestoría técnica, agrimensura, mensura judicial, motoniveladora para calles y cañerías para agua potable.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Comprobante Digital Obligatorio:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    Ningún miembro de la comisión puede recibir dinero sin expedir el recibo electrónico generado por el sistema.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Régimen de Doble Firma:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    Todo retiro bancario o erogación mayor requiere la autorización conjunta de Presidencia y Tesorería.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Balance Público 24 Horas:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    El balance en tiempo real con comprobantes de compras y gastos está a disposición de cualquier vecino en la plataforma.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: GUÍA MÓVIL, GLOSARIO Y PREGUNTAS FRECUENTES */}
          {activeTab === 'steps' && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
              <div className="p-3 sm:p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-purple-950">
                    Consulta Individual desde el Celular & Glosario
                  </h3>
                  <p className="text-[11px] sm:text-xs text-purple-900/80 mt-0.5">
                    Cualquier vecino puede verificar su estado en menos de 1 minuto sin necesidad de contraseñas complicadas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Ingresar a la Plataforma</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                    Abre el navegador web de tu celular e ingresa al enlace oficial proporcionado por la comisión.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Tocar &quot;Portal del Residente&quot;</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                    En la barra superior encontrarás la pestaña o botón &quot;Portal del Residente / Mi Cuenta&quot;.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Escribir tu Número de C.I.</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                    Ingresa los dígitos de tu Cédula de Identidad (ej: 4567890) y presiona &quot;Buscar Mi Padrón&quot;.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#1877F2] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      4
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Descargar tu Certificado</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                    Revisa tu Manzana, Lote, historial de aportes y descarga en PDF tu Certificado de Ocupación con firma oficial.
                  </p>
                </div>
              </div>

              {/* Glossary Box */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                  <span>Glosario de Términos Agrarios INDERT</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-slate-900">Padrón Censal:</span>
                    <p className="text-slate-600 mt-0.5">Lista oficial de familias censadas con acreditación de residencia efectiva.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-slate-900">Expediente Matriz:</span>
                    <p className="text-slate-600 mt-0.5">Número de trámite central ante el INDERT para compra o regularización.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-slate-900">Mensura Judicial:</span>
                    <p className="text-slate-600 mt-0.5">Operación pericial y topográfica judicial que fija los linderos del asentamiento.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="font-bold text-slate-900">Certificado de Ocupación:</span>
                    <p className="text-slate-600 mt-0.5">Constancia extendida por la Comisión que certifica posesión legítima y pacífica.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ASAMBLEAS VECINALES & CONTROL DE ASISTENCIA QR EN VIVO */}
          {activeTab === 'meetings_qr' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              
              {/* Header Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
                    Sistema de Asambleas Soberanas & Control Biométrico / QR de Asistencia
                  </h3>
                  <p className="text-[11px] sm:text-xs text-blue-900/90 leading-relaxed mt-1">
                    La Asamblea General de Pobladores es la <strong>máxima autoridad democrática de la comunidad</strong> (Estatuto Agrario Ley 1863/02 y Ley 2419/04). Para otorgar validez jurídica a las decisiones comunales ante el INDERT, la asistencia debe ser verificable, transparente y documentada de forma fehaciente.
                  </p>
                </div>
              </div>

              {/* Grid: 4 Pasos del Proceso de Asambleas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1877F2] font-black text-xs flex items-center justify-center">1</span>
                    <span>Convocatoria Formal Vía WhatsApp</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    La Secretaría emite la citación oficial estandarizada con fecha, hora oficial paraguaya, lugar del asentamiento, orden del día estricto e indicación de asistencia obligatoria portando el Carnet Digital con Código QR.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">2</span>
                    <span>Escaneo de Asistencia en Tiempo Real</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    En la mesa de entrada de la asamblea, la Secretaría de Actas o los Delegados de Manzana activan el <strong>escáner con cámara en vivo</strong>. Al apuntar al QR del vecino, el sistema valida en segundos la identidad, manzana y lote, computando la asistencia con estampa horaria paraguaya.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">3</span>
                    <span>Actas Censales Homologadas en Excel</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Con un solo clic se genera la <strong>Planilla Oficial en Formato Excel (.xlsx)</strong> con encabezado institucional, ordenamiento por Manzana y Lote, distinción clara de <em>PRESENTE</em> o <em>AUSENTE (FALTA)</em>, cálculo de quorum y espacio para firmas de la Mesa Directiva.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">4</span>
                    <span>Régimen de Faltas e Inasistencias</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    El sistema descuenta automáticamente las inasistencias en el legajo del residente. Acumular 3 o más faltas consecutivas injustificadas debilita la prioridad social ante la Asamblea General y el INDERT para la adjudicación definitiva del lote.
                  </p>
                </div>
              </div>

              {/* Protocol Details Callout */}
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-400/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      ¿Por qué la Asistencia a Asambleas es Decisiva para tu Título de Propiedad del INDERT?
                    </h4>
                    <p className="text-[11px] sm:text-xs text-amber-950/90 leading-relaxed mt-1">
                      Conforme al <strong>Estatuto Agrario (Ley N° 1863/02)</strong> y la reglamentación del <strong>INDERT</strong>, la adjudicación de tierras públicas no es un simple trámite administrativo: <strong>exige demostrar arraigo efectivo, posesión pacífica y participación activa en el desarrollo comunitario</strong>. Las planillas de asistencia y actas de asamblea refrendadas son el medio probatorio fundamental que los inspectores y peritos del INDERT exigen a la Comisión Vecinal para certificar que el solicitante realmente vive en la comunidad y no es un especulador.
                    </p>
                  </div>
                </div>
              </div>

              {/* Consecuencias Graduales de las Inasistencias */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Régimen Disciplinario: Escala de Consecuencias por Inasistencia</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="font-black text-amber-900 block text-xs">⚠️ 1 Falta Injustificada</span>
                    <p className="text-slate-600 leading-snug">
                      Alerta preventiva automática en el portal vecinal <em>"Mi Cuenta / Mi Lote"</em>. Se notifica al residente para que regularice su justificación ante la Secretaría.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 space-y-1">
                    <span className="font-black text-orange-900 block text-xs">⚠️ 2 Faltas Consecutivas</span>
                    <p className="text-slate-600 leading-snug">
                      Apercibimiento formal por el Delegado de Manzana. Pérdida temporal del derecho a voz y voto en la siguiente asamblea deliberativa.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-300 space-y-1">
                    <span className="font-black text-rose-900 block text-xs">🚫 3 Faltas Consecutivas (o 5 en el año)</span>
                    <p className="text-slate-600 leading-snug">
                      <strong>Pérdida de prioridad social</strong> para adjudicación del lote. Presunción de falta de arraigo. La Comisión queda facultada para inspección in situ y remitir informe al INDERT para eventual reasignación a familias con necesidad real.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reglas de Acreditación y Justificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-slate-700">
                
                {/* Box A: Quién puede acreditarse */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    ¿Quién Puede Representar al Lote en la Asamblea?
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                    <li><strong>Titular Censado:</strong> Es el responsable primario de concurrir con su Carnet QR o Cédula física.</li>
                    <li><strong>Cónyuge o Pareja Acreditada:</strong> Puede votar con pleno derecho si figura debidamente en la ficha familiar del censo.</li>
                    <li><strong>Hijo/a Mayor de Edad:</strong> Solo en caso excepcional con autorización escrita y firmada por el titular, exhibiendo su C.I.</li>
                    <li><strong>Prohibición de Poderes Múltiples:</strong> Ningún vecino puede representar a más de un lote ni traer carnets ajenos. Un lote equivale a un solo voto.</li>
                  </ul>
                </div>

                {/* Box B: Justificación de inasistencias */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    Protocolo de Justificación de Faltas
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px]">
                    <li><strong>Plazo Máximo:</strong> Hasta <strong>72 horas hábiles</strong> posteriores a la asamblea ante la Secretaría de Actas.</li>
                    <li><strong>Causales Válidas:</strong> Certificado médico de reposo expedido por centro de salud, constancia laboral de turno u orden de trabajo en otra localidad, o fuerza mayor manifiesta.</li>
                    <li><strong>Registro en el Sistema:</strong> La Secretaría asienta la justificación, reflejándose en el acta oficial con el estado <em>"Ausente con Justificativo"</em>, sin penalización en el legajo del INDERT.</li>
                    <li><strong>Auditoría en "Mi Cuenta":</strong> El vecino puede verificar en su pantalla que la falta fue debidamente justificada.</li>
                  </ul>
                </div>

              </div>

            </div>
          )}

          {/* TAB 10: CARNET DIGITAL DEL RESIDENTE, HORARIO OFICIAL & NUBE */}
          {activeTab === 'digital_id_time' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              
              {/* Header Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-teal-950">
                    Carnet Digital del Vecino, Horario Oficial de Paraguay & Nube Segura
                  </h3>
                  <p className="text-[11px] sm:text-xs text-teal-900/90 leading-relaxed mt-1">
                    Modernización tecnológica al servicio de la soberanía comunitaria: cada vecino dispone de su credencial digital, la plataforma opera bajo la hora legal de la República del Paraguay y los datos se resguardan de forma inmutable en la nube.
                  </p>
                </div>
              </div>

              {/* 3 Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                
                {/* Pillar 1: Carnet Digital */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs sm:text-sm">
                    <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Carnet Digital con QR</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Disponible las 24 horas en la sección <strong>"Mi Cuenta / Mi Lote"</strong>. Muestra el nombre del titular, Cédula de Identidad protegida, Manzana, Lote, estado de linderos amojonados y un Código QR individual para trámites comunales y asambleas.
                  </p>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                    Inviolable e Intransferible
                  </span>
                </div>

                {/* Pillar 2: Horario Oficial */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-[#1877F2] shrink-0" />
                    <span>Hora Oficial de Paraguay</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sincronización estricta con el huso oficial de Paraguay (<code>America/Asuncion</code>, UTC-4 / UTC-3). Evita desfasajes en recibos de dinero, transferencias bancarias (SIPAP / Billeteras) y actas de asamblea emitidas ante instituciones públicas.
                  </p>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                    Reloj en Vivo en la Barra
                  </span>
                </div>

                {/* Pillar 3: Persistencia en la Nube */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs sm:text-sm">
                    <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Nube Google Firestore</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toda la información del censo, aportes de tesorería y expedientes se almacena de forma segura en Google Cloud Firestore. Esto garantiza que ningún dato se pierda por rotura o extravío de computadoras o teléfonos de la directiva.
                  </p>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                    Respaldo Seguro 24/7
                  </span>
                </div>

              </div>

              {/* Reubicaciones y Transparencia */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                  Registro Histórico Inmutable de Reubicaciones de Terreno:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para blindar a la comunidad contra ventas ilegales o dobles asignaciones, cualquier cambio de parcela (por trazado topográfico de calles, cesión consentida o fuerza mayor) queda asentado en un registro histórico permanente con Manzana Anterior, Manzana Nueva, fecha oficial paraguaya, motivo documentado y número de resolución del Comité.
                </p>
              </div>

            </div>
          )}

          {/* TAB 11: DESCARGO LEGAL, TÉRMINOS & POLÍTICAS DE PRIVACIDAD */}
          {activeTab === 'disclaimer_terms' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
              
              {/* Box 1: Descargo No Gubernamental */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">
                      Aviso Legal Importante: Naturaleza No Gubernamental y Uso Interno
                    </h3>
                    <p className="text-[11px] sm:text-xs text-amber-950/90 leading-relaxed mt-1">
                      El Sistema ComunidApp / S16 es una <strong>herramienta tecnológica privada de autogestión vecinal</strong> creada y administrada por la Comisión Vecinal Pro-Tierra de {settings.communityName} para el <strong>uso interno exclusivo</strong> de los residentes de la comunidad.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px] text-amber-950 font-medium">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-300 flex items-start gap-2 shadow-2xs">
                    <span className="text-red-600 font-black shrink-0 text-sm">❌</span>
                    <span><strong>NO es un sistema oficial del Estado:</strong> No depende orgánica ni formalmente del INDERT, MUVH, Catastro Nacional ni Municipalidades.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-amber-300 flex items-start gap-2 shadow-2xs">
                    <span className="text-blue-600 font-black shrink-0 text-sm">⚖️</span>
                    <span><strong>Validez Gremial y Social:</strong> Las constancias emitidas certifican posesión pacífica vecinal y aportes comunitarios, sin sustituir títulos públicos de propiedad.</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Compromiso de Transparencia 24/7 */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs sm:text-sm">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  <span>Pacto de Transparencia Absoluta & Rendición de Cuentas</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Todos los ingresos por aportes sociales y todos los egresos (mensura topográfica, red de agua, caminos, honorarios legales) se asientan de forma pública con emisión obligatoria de recibo digital numerado, accesibles las 24 horas por cualquier miembro del padrón.
                </p>
              </div>

              {/* Box 3: Términos y Condiciones */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Términos y Condiciones del Padrón Comunitario & Régimen de Tierras</span>
                </h4>
                
                <div className="space-y-2.5 text-[11px] text-slate-600">
                  <p>
                    <strong className="text-slate-800">• Declaración Jurada de Datos:</strong> Al registrarse, el vecino manifiesta bajo fe de juramento la veracidad de su identidad, estado civil y residencia efectiva en el lote. La falsedad anula cualquier derecho adquirido.
                  </p>
                  <p>
                    <strong className="text-slate-800">• Normas de Asignación (Ley N° 1863/02 Estatuto Agrario):</strong> Exigencia de 18 años de edad, no poseer otros inmuebles inscriptos a su nombre ni del cónyuge en Registros Públicos / Catastro Nacional, y destinar el lote a residencia familiar pacífica e ininterrumpida.
                  </p>
                  <p>
                    <strong className="text-slate-800">• Escala Oficial de Prioridades Sociales:</strong> Orden riguroso de prelación: 1) Madres solteras cabezas de familia con hijos menores, 2) Personas con discapacidad (SENADIS) o enfermedades crónicas, 3) Adultos mayores desamparados, 4) Familias jóvenes sin vivienda propia, 5) Vecinos censados activos en faenas comunales.
                  </p>
                  <p>
                    <strong className="text-slate-800">• Plazos de Ocupación Efectiva (30-60 días):</strong> El adjudicatario está obligado a iniciar mejoras habitacionales habitables y residir en un plazo máximo de 30 a 60 días. Se prohíbe mantener terrenos en abandono. Rige el principio de un solo lote por familia.
                  </p>
                  <p>
                    <strong className="text-slate-800">• Prohibición Estricta de Especulación:</strong> Los lotes asignados son para residencia familiar. Queda estrictamente prohibida la venta, subarriendo o cesión informal con fines lucrativos (nulos de pleno derecho).
                  </p>
                  <p>
                    <strong className="text-slate-800">• Causales de Revocación y Recuperación:</strong> Abandono mayor a 90 días, reventa clandestina, 3 faltas consecutivas o 5 alternadas a asambleas sin justificación médica/laboral, o conductas graves contra la seguridad vecinal.
                  </p>
                  <p>
                    <strong className="text-slate-800">• Cumplimiento de Deberes Sociales:</strong> El residente se compromete al abono de las cuotas sociales fijadas en asamblea y a la participación en faenas de interés común.
                  </p>
                </div>
              </div>

              {/* Box 4: Políticas de Privacidad (Protección de Datos Personales) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Políticas de Privacidad & Protección de Datos (Ley N° 1682/01 y Ley N° 6534/20)</span>
                </h4>
                
                <div className="space-y-2 text-[11px] text-slate-600">
                  <p>
                    <strong className="text-indigo-900">• Custodia Exclusiva:</strong> La Comisión Vecinal es la única depositaria de los datos del censo (Cédula de Identidad, teléfonos, grupo familiar, delimitación física).
                  </p>
                  <p>
                    <strong className="text-indigo-900">• No Comercialización:</strong> Se garantiza de forma absoluta que los datos personales NUNCA serán vendidos, compartidos ni transferidos a empresas comerciales ni a terceros con fines publicitarios.
                  </p>
                  <p>
                    <strong className="text-indigo-900">• Derechos ARCO:</strong> Todo censado puede solicitar la rectificación, consulta o actualización de su legajo dirigiéndose a la Secretaría de la Comisión.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Fixed Footer with Clear Mobile Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 hidden sm:flex">
            <span>Comisión Vecinal Reconocida por INDERT</span>
            <span className="font-medium">{settings.communityName}</span>
          </div>

          <div className="flex items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200/70 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Cerrar
            </button>

            <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
              <button
                onClick={handlePrint}
                className="hidden sm:flex px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>

              <button
                id="btn-modal-download-guide-pdf"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF Completo'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
