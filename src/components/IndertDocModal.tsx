import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  DollarSign,
  Landmark,
  CheckCircle2,
  AlertCircle,
  File,
  Paperclip,
} from 'lucide-react';
import {
  IndertDocument,
  IndertDocumentCategory,
  IndertDocumentStatus,
  Resident,
  UserAccount,
  CommunitySettings,
} from '../types';
import { ResidentSearchSelect } from './ResidentSearchSelect';

interface IndertDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: IndertDocument) => void;
  currentUser: UserAccount | null;
  residents: Resident[];
  settings: CommunitySettings;
  initialDoc?: IndertDocument | null;
}

export const IndertDocModal: React.FC<IndertDocModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  residents,
  settings,
  initialDoc,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(initialDoc?.title || '');
  const [category, setCategory] = useState<IndertDocumentCategory>(
    initialDoc?.category || 'expediente_indert'
  );
  const [documentNumber, setDocumentNumber] = useState(
    initialDoc?.documentNumber || settings.indertExpedienteNumber || ''
  );
  const [date, setDate] = useState(
    initialDoc?.date || new Date().toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState<string>(
    initialDoc?.amount ? initialDoc.amount.toString() : ''
  );
  const [relatedBlock, setRelatedBlock] = useState(initialDoc?.relatedBlock || '');
  const [relatedLot, setRelatedLot] = useState(initialDoc?.relatedLot || '');
  const [residentId, setResidentId] = useState(initialDoc?.residentId || '');
  const [notes, setNotes] = useState(initialDoc?.notes || '');
  const [status, setStatus] = useState<IndertDocumentStatus>(
    initialDoc?.status || 'en_tramite'
  );

  // File state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: 'pdf' | 'image' | 'doc' | 'sheet';
    dataUrl?: string;
  } | null>(
    initialDoc
      ? {
          name: initialDoc.fileName,
          size: initialDoc.fileSize,
          type: initialDoc.fileType,
          dataUrl: initialDoc.fileData,
        }
      : null
  );

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    // Firestore Document Limit is 1MB. Base64 adds ~33% overhead. Max safe file size is ~700KB.
    if (file.size > 700 * 1024) {
      alert('Error: El archivo excede el límite de 700 KB para almacenamiento en la base de datos (Firestore). Por favor, comprima el archivo antes de subirlo.');
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    const sizeStr =
      sizeInMB < 1
        ? `${Math.round(file.size / 1024)} KB`
        : `${sizeInMB.toFixed(1)} MB`;

    let fType: 'pdf' | 'image' | 'doc' | 'sheet' = 'pdf';
    if (file.type.includes('image')) fType = 'image';
    else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))
      fType = 'sheet';
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) fType = 'doc';

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        type: fType,
        dataUrl: reader.result as string,
      });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !documentNumber.trim()) {
      setError('Por favor complete el título y número de documento / expediente.');
      return;
    }

    const matchedResident = residents.find((r) => r.id === residentId);

    const newDoc: IndertDocument = {
      id: initialDoc?.id || `doc-${Date.now()}`,
      title: title.trim(),
      category,
      documentNumber: documentNumber.trim(),
      relatedBlock: relatedBlock || undefined,
      relatedLot: relatedLot || undefined,
      residentId: residentId || undefined,
      residentName: matchedResident ? matchedResident.fullName : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      date,
      uploadedBy: currentUser ? currentUser.fullName : settings.presidentName,
      fileType: selectedFile?.type || 'pdf',
      fileName: selectedFile?.name || `${documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: selectedFile?.size || '1.2 MB',
      fileData: selectedFile?.dataUrl,
      notes: notes.trim(),
      status,
    };

    onSave(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Header style Facebook */}
        <div className="bg-[#1877F2] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {initialDoc ? 'Editar Documento INDERT' : 'Cargar Documento INDERT / Factura'}
              </h2>
              <p className="text-xs text-blue-100">
                Gestiones de Ocupación, Regularización, Mensura y Rendición de Gastos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Archivo Adjunto (PDF, Imagen, Factura, Plano) *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#1877F2] bg-blue-50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-[#1877F2] bg-slate-50 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Archivo listo • {selectedFile.size} (Haga clic para cambiar)
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-8 h-8 text-[#1877F2] mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    Arrastra el archivo aquí o haz clic para seleccionarlo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Admite PDF de expediente, foto de factura de gasto, plano o acta (máx. 25MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título Descriptivo del Documento *
            </label>
            <input
              type="text"
              placeholder="Ej: Expediente INDERT N° 4821/2024 - Solicitud de Censo Ocupacional"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
              required
            />
          </div>

          {/* Category & Document Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoría de Gestión INDERT *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IndertDocumentCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="expediente_indert">Expediente INDERT & Regularización</option>
                <option value="mensura_planos">Mensura Judicial & Planos Topográficos</option>
                <option value="gastos_facturas">Factura de Gastos & Inversiones</option>
                <option value="recibos_aportes">Recibo de Aporte / Boleta Bancaria</option>
                <option value="actas_asambleas">Actas Vecinales & Resoluciones</option>
                <option value="identidad_titulacion">Legajo de Ocupante (C.I. y Arraigo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                N° de Expediente / Factura / Acta *
              </label>
              <input
                type="text"
                placeholder="Ej: Exp. 4821/24 o Factura 001-002-841"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
                required
              />
            </div>
          </div>

          {/* Date, Amount, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha del Documento *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monto / Costo ({settings.currencySymbol})
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00 (si es gasto)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado del Trámite *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IndertDocumentStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="en_tramite">En Trámite (Mesa de Entrada)</option>
                <option value="verificado">Verificado y Aprobado</option>
                <option value="observado">Observado / Requiere Corrección</option>
              </select>
            </div>
          </div>

          {/* Related Block, Lot and Resident */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <ResidentSearchSelect
              residents={residents}
              selectedResidentId={residentId}
              onSelect={(res) => {
                setResidentId(res.id);
                setRelatedBlock(res.block);
                setRelatedLot(res.lot);
              }}
              label="Ocupante / Titular del Lote (Opcional)"
              required={false}
              placeholder="Buscar por Nombre o Cédula..."
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Manzana Vinculada (Mz)
                </label>
                <input
                  type="text"
                  placeholder="Ej: A, B o General"
                  value={relatedBlock}
                  onChange={(e) => setRelatedBlock(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs uppercase font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Lote Vinculado
                </label>
                <input
                  type="text"
                  placeholder="Ej: 01, 02 o General"
                  value={relatedLot}
                  onChange={(e) => setRelatedLot(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones, Proveedor o Antecedentes INDERT
            </label>
            <textarea
              rows={2}
              placeholder="Detalle de la gestión, empresa proveedora de materiales, escribanía o juzgado actuante..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#1877F2] outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              Guardar y Registrar Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
