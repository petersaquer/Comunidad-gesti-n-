import React, { useState } from 'react';
import {
  X,
  Server,
  Terminal,
  Copy,
  Check,
  Globe,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Download,
} from 'lucide-react';

interface HestiaCpDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HestiaCpDeployModal: React.FC<HestiaCpDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const deployCommand = `cd /home/admin/web/comunidad.org/public_html
git clone <URL_REPO> .
chmod +x hestiacp-deploy.sh
./hestiacp-deploy.sh admin comunidad.org`;

  const nginxSnippet = `location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location ~* \\.(?:css|js|woff2?|svg|gif|png|jpe?g|ico|webp)$ {
    proxy_pass http://127.0.0.1:3000;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="hestiacp-deploy-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl text-blue-400 border border-blue-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Instalación en Servidor HestiaCP
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                  Node.js / PM2 / Nginx
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guía y script de despliegue rápido para servidores VPS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
          {/* Quick Summary Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-blue-950 text-sm">
                Arquitectura Segura y Robusta (Node.js + SQLite 3)
              </p>
              <p className="mt-1 text-blue-800 leading-relaxed">
                El sistema utiliza una base de datos local SQLite con Node.js y Express. 
                El script automatizado descargará las dependencias, compilará el código y configurará 
                <strong> PM2</strong> como gestor de procesos en segundo plano.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>Crear Dominio en HestiaCP</span>
              </div>
              <p className="text-xs text-slate-600 pl-7">
                Accede a HestiaCP &gt; <strong>Web</strong> &gt; <strong>+ Añadir Dominio</strong> (ej. <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">comunidad.org</code>). Habilita el certificado gratuito SSL Let's Encrypt.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Ejecutar Instalador Automático por SSH</span>
                </div>
                <button
                  onClick={() => copyToClipboard(deployCommand, 'script')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'script' ? '¡Copiado!' : 'Copiar comandos'}
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg overflow-x-auto shadow-inner whitespace-pre">
                {deployCommand}
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                Este script instala Node.js (si no existe), PM2, clona dependencias y compila la app lista para usar. Reemplaza el usuario 'admin' y el dominio por el tuyo real.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Configurar Plantilla Proxy en Nginx</span>
                </div>
                <button
                  onClick={() => copyToClipboard(nginxSnippet, 'nginx')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'nginx' ? '¡Copiado!' : 'Copiar Proxy Nginx'}
                </button>
              </div>
              <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg overflow-x-auto shadow-inner whitespace-pre">
                {nginxSnippet}
              </div>
              <p className="text-[11px] text-slate-500 pl-7">
                Edita la configuración Nginx del dominio en HestiaCP (Botón ✏️ &gt; Configuración Avanzada) e inserta esto para que las peticiones web se conecten al puerto 3000 de Node.js en segundo plano.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Ubuntu 20.04/22.04/24.04, Debian 11/12 y HestiaCP v1.8+</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
