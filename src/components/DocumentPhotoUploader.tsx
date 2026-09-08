import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { generateSampleCIDocument } from '../utils/ciGenerator';

interface DocumentPhotoUploaderProps {
  fullName: string;
  documentId: string;
  maritalStatus?: string;
  frontUrl?: string;
  backUrl?: string;
  onChangeFront: (url: string) => void;
  onChangeBack: (url: string) => void;
}

export const DocumentPhotoUploader: React.FC<DocumentPhotoUploaderProps> = ({
  fullName,
  documentId,
  maritalStatus,
  frontUrl,
  backUrl,
  onChangeFront,
  onChangeBack,
}) => {
  const [zoomSide, setZoomSide] = useState<'frente' | 'dorso' | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'frente' | 'dorso'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (side === 'frente') {
        onChangeFront(dataUrl);
      } else {
        onChangeBack(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSample = (side: 'frente' | 'dorso') => {
    const docNumber = documentId.trim() || '4.500.123';
    const name = fullName.trim() || 'Juan Pérez González';
    const sample = generateSampleCIDocument(name, docNumber, side, {
      maritalStatus: maritalStatus || 'SOLTERO/A',
    });
    if (side === 'frente') {
      onChangeFront(sample);
    } else {
      onChangeBack(sample);
    }
  };

  const handleGenerateBothSamples = () => {
    const docNumber = documentId.trim() || '4.500.123';
    const name = fullName.trim() || 'Juan Pérez González';
    onChangeFront(
      generateSampleCIDocument(name, docNumber, 'frente', {
        maritalStatus: maritalStatus || 'SOLTERO/A',
      })
    );
    onChangeBack(
      generateSampleCIDocument(name, docNumber, 'dorso', {
        maritalStatus: maritalStatus || 'SOLTERO/A',
      })
    );
  };

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-[#1877F2]" />
            <span>Fotocopia de Cédula de Identidad (Ambos Lados)</span>
          </h4>
          <p className="text-xs text-slate-500">
            Requisito INDERT: Suba fotos nítidas del Frente (Anverso) y Dorso (Reverso)
          </p>
        </div>

        {/* Quick sample generator button */}
        <button
          type="button"
          onClick={handleGenerateBothSamples}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
          title="Generar formato oficial de muestra con los datos actuales"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Generar C.I. de Muestra</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={frontInputRef}
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'frente')}
      />
      <input
        type="file"
        ref={backInputRef}
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'dorso')}
      />

      {/* Dual Side Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lado 1: FRENTE / ANVERSO */}
        <div className="border border-slate-200 bg-white rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              1. Frente / Anverso
            </span>
            {frontUrl ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cargado
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                Pendiente
              </span>
            )}
          </div>

          {/* Preview or Drop Area */}
          {frontUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-32 flex items-center justify-center">
              <img
                src={frontUrl}
                alt="Cédula Frente"
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setZoomSide('frente')}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomSide('frente')}
                  className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Ampliar vista"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver</span>
                </button>
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Cambiar foto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cambiar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFront('')}
                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#1877F2] rounded-lg p-3 h-32 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors"
            >
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-700">Subir Foto Frente</p>
              <p className="text-[10px] text-slate-400">JPG, PNG o PDF</p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => frontInputRef.current?.click()}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>{frontUrl ? 'Reemplazar' : 'Seleccionar archivo'}</span>
            </button>
            {!frontUrl && (
              <button
                type="button"
                onClick={() => handleGenerateSample('frente')}
                className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Cargar muestra
              </button>
            )}
          </div>
        </div>

        {/* Lado 2: DORSO / REVERSO */}
        <div className="border border-slate-200 bg-white rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              2. Dorso / Reverso
            </span>
            {backUrl ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cargado
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                Pendiente
              </span>
            )}
          </div>

          {/* Preview or Drop Area */}
          {backUrl ? (
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-32 flex items-center justify-center">
              <img
                src={backUrl}
                alt="Cédula Dorso"
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setZoomSide('dorso')}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomSide('dorso')}
                  className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Ampliar vista"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver</span>
                </button>
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Cambiar foto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cambiar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeBack('')}
                  className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-bold cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => backInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#1877F2] rounded-lg p-3 h-32 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition-colors"
            >
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-700">Subir Foto Dorso</p>
              <p className="text-[10px] text-slate-400">Firma, huella y código</p>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => backInputRef.current?.click()}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>{backUrl ? 'Reemplazar' : 'Seleccionar archivo'}</span>
            </button>
            {!backUrl && (
              <button
                type="button"
                onClick={() => handleGenerateSample('dorso')}
                className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                Cargar muestra
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomSide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">
                Cédula de Identidad - {zoomSide === 'frente' ? 'Frente (Anverso)' : 'Dorso (Reverso)'}
              </h3>
              <button
                type="button"
                onClick={() => setZoomSide(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex items-center justify-center bg-slate-900 rounded-xl mt-3">
              <img
                src={zoomSide === 'frente' ? frontUrl : backUrl}
                alt="Documento C.I."
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Titular: <strong>{fullName || 'No especificado'}</strong></span>
              <span>C.I. N°: <strong>{documentId || 'S/N'}</strong></span>
              <button
                type="button"
                onClick={() => setZoomSide(null)}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold cursor-pointer"
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
