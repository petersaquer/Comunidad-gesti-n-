import React, { useState } from 'react';
import { 
  Users, Plus, QrCode, Calendar as CalendarIcon, 
  MapPin, Clock, Search, ExternalLink, X, ShieldAlert,
  CheckCircle2, Download, FileText
} from 'lucide-react';
import { Meeting, Resident, CommunitySettings, UserAccount } from '../types';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AttendanceKPIs } from './AttendanceKPIs';
import * as XLSX from 'xlsx';
import { generateMeetingAttendancePDF } from '../utils/meetingAttendancePdfGenerator';
import { 
  formatParaguayDate, 
  formatParaguayTime, 
  formatParaguayLongDateTime, 
  getParaguayTodayISO 
} from '../utils/paraguayDate';

interface MeetingsTabProps {
  meetings: Meeting[];
  residents: Resident[];
  settings: CommunitySettings;
  currentUser: UserAccount;
  onSaveMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (id: string) => void;
}

export const MeetingsTab: React.FC<MeetingsTabProps> = ({
  meetings,
  residents,
  settings,
  currentUser,
  onSaveMeeting,
  onDeleteMeeting
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  
  const activeMeetings = meetings.filter(m => m.status === 'active');
  const pastMeetings = meetings.filter(m => m.status === 'completed' || m.status === 'scheduled').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handle PDF Export for meeting attendance
  const handleExportPDF = (meeting: Meeting) => {
    try {
      setGeneratingPdfId(meeting.id);
      generateMeetingAttendancePDF({
        meeting,
        residents,
        settings,
      });
    } catch (err) {
      console.error('Error al exportar acta de reunión en PDF:', err);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Handle WhatsApp notification
  const handleNotifyWhatsApp = (meeting: Meeting) => {
    const formattedDate = formatParaguayLongDateTime(meeting.date);
    const message = `🔔 *Convocatoria a Reunión Comunal*\n\nEstimados vecinos de ${settings.communityName},\n\nSe convoca a la reunión: *${meeting.title}*.\n📅 Fecha y Hora (Paraguay): ${formattedDate}\n📍 Lugar: Sede Comunal\n\nPor favor, presentar su Carnet QR para el registro de asistencia.\n\nAtte. Comisión Directiva.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToExcel = (meeting: Meeting) => {
    // Generate a complete census report with attendance status
    const meetingDateFormatted = formatParaguayDate(meeting.date);
    const allResidentsData = residents.map(resident => {
      const isPresent = meeting.attendees.includes(resident.id) || meeting.attendees.includes(resident.documentId);
      
      return {
        'Estado': isPresent ? 'PRESENTE' : 'AUSENTE (FALTA)',
        'Nombre Completo': resident.fullName,
        'Cédula de Identidad': resident.documentId,
        'Manzana': resident.block || '-',
        'Lote': resident.lot || '-',
        'Fecha de Reunión': meetingDateFormatted
      };
    });

    if (allResidentsData.length === 0) {
      alert("No hay residentes registrados en el censo para generar el acta.");
      return;
    }

    // Sort so Presentes are at the top, then by Block/Lot
    allResidentsData.sort((a, b) => {
      if (a.Estado === b.Estado) {
        return a.Manzana.localeCompare(b.Manzana) || a.Lote.localeCompare(b.Lote);
      }
      return a.Estado === 'PRESENTE' ? -1 : 1;
    });

    const ws = XLSX.utils.json_to_sheet(allResidentsData);
    
    // Add column widths
    const wscols = [
      {wch: 20}, // Estado
      {wch: 35}, // Nombre
      {wch: 15}, // Cedula
      {wch: 10}, // Manzana
      {wch: 10}, // Lote
      {wch: 20}, // Fecha
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Control de Asistencia");
    
    const fileName = `Acta_Asistencia_INDERT_${meeting.title.replace(/\s+/g, '_')}_${getParaguayTodayISO()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const startMeeting = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      onSaveMeeting({ ...meeting, status: 'active' });
    }
  };

  const endMeeting = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      onSaveMeeting({ ...meeting, status: 'completed' });
    }
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    
    const newMeeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title: newTitle,
      date: new Date(newDate).toISOString(),
      status: 'scheduled',
      attendees: [],
      createdAt: new Date().toISOString()
    };
    onSaveMeeting(newMeeting);
    setIsNewMeetingModalOpen(false);
    setNewTitle('');
    setNewDate('');
  };

  const handleAutoCreateAndScan = () => {
    const autoMeeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title: `Reunión Extraordinaria ${formatParaguayDate()}`,
      date: new Date().toISOString(),
      status: 'active',
      attendees: [],
      createdAt: new Date().toISOString()
    };
    onSaveMeeting(autoMeeting);
    setIsScannerOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-[#1877F2]" />
              Asistencias y Reuniones
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              Control de asistencia por QR y actas de reuniones
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {meetings.length > 0 && (
              <button
                onClick={() => {
                  const target = activeMeetings[0] || pastMeetings[0];
                  if (target) handleExportPDF(target);
                }}
                disabled={generatingPdfId !== null}
                className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                title="Descargar Acta Oficial de Asistencia y Quórum en PDF"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{generatingPdfId !== null ? 'Generando PDF...' : 'Descargar Acta en PDF'}</span>
              </button>
            )}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Escanear QR
            </button>
            <button
              onClick={() => setIsNewMeetingModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Nueva Reunión
            </button>
          </div>
        </div>
      </div>

      <AttendanceKPIs meetings={meetings} residents={residents} />

      {activeMeetings.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 text-indigo-800">
            <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">No hay ninguna reunión activa</p>
              <p className="text-sm opacity-80">Puedes crear una manualmente o iniciar una escaneando un carnet ahora mismo.</p>
            </div>
          </div>
          <button 
            onClick={handleAutoCreateAndScan}
            className="w-full md:w-auto px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-100 font-bold text-sm rounded-xl border border-indigo-200 transition-colors whitespace-nowrap"
          >
            Auto-Crear y Escanear
          </button>
        </div>
      )}

      {/* Active Meetings */}
      {activeMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Reuniones en Curso
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {activeMeetings.map((mtg) => (
              <div key={mtg.id} className="bg-white border border-emerald-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-black text-xl text-slate-800">{mtg.title}</h3>
                    <p className="text-emerald-600 font-medium text-sm flex items-center gap-1.5 mt-1">
                      <Clock className="w-4 h-4" /> Activa ahora
                    </p>
                    <p className="text-slate-500 text-sm mt-3">
                      Asistencias registradas: <span className="font-bold text-slate-800">{mtg.attendees.length}</span> residentes
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" /> Seguir Escaneando
                    </button>
                    <button
                      onClick={() => handleExportPDF(mtg)}
                      disabled={generatingPdfId === mtg.id}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                      title="Descargar Acta Oficial de Asistencia y Quórum en PDF"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>{generatingPdfId === mtg.id ? 'Generando PDF...' : 'Descargar Acta en PDF'}</span>
                    </button>
                    <button 
                      onClick={() => endMeeting(mtg.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Finalizar Reunión
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past/Scheduled Meetings */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Historial y Programadas</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {pastMeetings.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No hay reuniones registradas.
            </div>
          ) : (
            pastMeetings.map((mtg) => (
              <div key={mtg.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-800 text-lg">{mtg.title}</h3>
                    {mtg.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">Finalizada</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">Programada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> {formatParaguayDate(mtg.date)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatParaguayTime(mtg.date)}</span>
                  </div>
                  {mtg.status === 'completed' && (
                    <p className="text-sm text-slate-600 mt-2">
                      Total asistencias: <b>{mtg.attendees.length}</b>
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPDF(mtg)}
                    disabled={generatingPdfId === mtg.id}
                    className="p-2 text-slate-800 hover:bg-slate-100 disabled:text-slate-400 rounded-xl transition-colors tooltip-trigger flex items-center gap-1.5 font-bold text-xs border border-slate-300 cursor-pointer shadow-2xs"
                    title="Descargar Acta Oficial de Asistencia y Quórum en PDF"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">
                      {generatingPdfId === mtg.id ? 'Generando...' : 'Acta PDF'}
                    </span>
                  </button>
                  {mtg.status === 'completed' && (
                    <button
                      onClick={() => exportToExcel(mtg)}
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors tooltip-trigger flex items-center gap-1.5 font-bold text-xs border border-emerald-200 cursor-pointer"
                      title="Descargar Planilla en Excel (.xlsx)"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                  )}
                  {mtg.status === 'scheduled' && (
                    <button
                      onClick={() => handleNotifyWhatsApp(mtg)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors tooltip-trigger"
                      title="Notificar por WhatsApp"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  )}
                  {mtg.status === 'scheduled' && (
                    <button
                      onClick={() => startMeeting(mtg.id)}
                      className="px-4 py-1.5 bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Iniciar
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteMeeting(mtg.id)}
                    className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Meeting Modal */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Programar Reunión</h2>
              <button onClick={() => setIsNewMeetingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título / Motivo</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Asamblea Ordinaria"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha y Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-[#1877F2] focus:border-transparent outline-none px-4 py-3"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsNewMeetingModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl shadow-xs transition-colors">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal 
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          activeMeetings={activeMeetings}
          residents={residents}
          onSaveMeeting={onSaveMeeting}
        />
      )}
    </div>
  );
};

// Extracted QR Scanner Component
const QRScannerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeMeetings: Meeting[];
  residents: Resident[];
  onSaveMeeting: (meeting: Meeting) => void;
}> = ({ isOpen, onClose, activeMeetings, residents, onSaveMeeting }) => {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; resident?: Resident } | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    let scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: {width: 250, height: 250}, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      // Find resident
      const resident = residents.find(r => r.id === decodedText || r.documentId === decodedText);
      
      if (!resident) {
        setScanResult({ success: false, message: 'Código QR no reconocido o residente no encontrado.' });
        setTimeout(() => setScanResult(null), 3000);
        return;
      }

      // Record attendance in ALL active meetings (or the first one)
      if (activeMeetings.length > 0) {
        const meeting = activeMeetings[0]; // Auto-select first active meeting
        if (!meeting.attendees.includes(resident.id)) {
          const updatedMeeting = { ...meeting, attendees: [...meeting.attendees, resident.id] };
          onSaveMeeting(updatedMeeting);
          setScanResult({ success: true, message: `Asistencia registrada para: ${resident.fullName}`, resident });
        } else {
          setScanResult({ success: true, message: `${resident.fullName} ya estaba registrado/a.`, resident });
        }
      } else {
        setScanResult({ success: false, message: 'No hay ninguna reunión activa para registrar asistencia.' });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    }

    function onScanFailure(error: any) {
      // Ignore background scan failures
    }

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isOpen, activeMeetings, residents, onSaveMeeting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-xl">
          <div>
            <h2 className="font-bold text-slate-800">Escanear Asistencia</h2>
            <p className="text-xs text-slate-500">Apunta la cámara al carnet del residente</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {scanResult && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${scanResult.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            {scanResult.success ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <ShieldAlert className="w-6 h-6 flex-shrink-0" />}
            <div>
              <p className="font-bold text-sm">{scanResult.message}</p>
              {scanResult.resident && <p className="text-xs opacity-90">Mz {scanResult.resident.block} - Lt {scanResult.resident.lot}</p>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl overflow-hidden shadow-xl p-2">
          <div id="qr-reader" className="w-full border-none"></div>
        </div>
      </div>
    </div>
  );
};
