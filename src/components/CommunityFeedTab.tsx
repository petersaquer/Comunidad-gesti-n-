import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Share2,
  Image,
  Paperclip,
  Send,
  Landmark,
  FileText,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Trash2,
  BookOpen,
} from 'lucide-react';
import {
  UserAccount,
  CommunitySettings,
  IndertDocument,
  Contribution,
  Expense,
  Resident,
  CommunityPost,
  PostComment,
} from '../types';
import { downloadIndertDocument } from '../utils/fileDownloader';
import { downloadCommunityGuidePdf } from '../utils/communityDocPdfGenerator';
import { isAdministrativeUser } from '../utils/privacyUtils';
import { formatGuaranies } from '../utils/currency';

interface CommunityFeedTabProps {
  currentUser: UserAccount | null;
  settings: CommunitySettings;
  indertDocs: IndertDocument[];
  contributions: Contribution[];
  expenses: Expense[];
  residents: Resident[];
  posts?: CommunityPost[];
  onSavePost?: (post: CommunityPost) => void;
  onToggleLike?: (postId: string) => void;
  onAddComment?: (postId: string, comment: PostComment) => void;
  onDeletePost?: (postId: string) => void;
  onOpenNewDoc: () => void;
  onOpenNewContribution: () => void;
  onSelectTab: (tab: string) => void;
}

export const CommunityFeedTab: React.FC<CommunityFeedTabProps> = ({
  currentUser,
  settings,
  indertDocs,
  contributions,
  expenses,
  residents,
  posts: externalPosts,
  onSavePost,
  onToggleLike: externalToggleLike,
  onAddComment: externalAddComment,
  onDeletePost,
  onOpenNewDoc,
  onOpenNewContribution,
  onSelectTab,
}) => {
  const isAdmin = isAdministrativeUser(currentUser);
  const canManageIndertDocs = isAdmin || currentUser?.permissions?.canManageIndertDocs;
  const canManageFinances = isAdmin || currentUser?.permissions?.canManageFinances;

  const [newPostText, setNewPostText] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  // Internal fallback state if external posts not supplied
  const [internalPosts, setInternalPosts] = useState<CommunityPost[]>([]);

  // Active posts are either from SQLite appState or internal fallback
  const posts = externalPosts !== undefined ? externalPosts : internalPosts;

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: currentUser ? currentUser.fullName : settings.presidentName,
      authorRole:
        currentUser?.role === 'admin'
          ? 'Presidente Comisión INDERT'
          : currentUser?.role === 'directiva'
          ? 'Miembro de Directiva'
          : `Residente Mz ${currentUser?.block || 'A'} Lote ${currentUser?.lot || '01'}`,
      authorAvatarColor: currentUser?.avatarColor || 'bg-blue-600',
      date: 'Recién publicado • Público',
      content: newPostText.trim(),
      likes: 0,
      hasLiked: false,
      comments: [],
    };

    if (onSavePost) {
      onSavePost(newPost);
    } else {
      setInternalPosts([newPost, ...posts]);
    }
    setNewPostText('');
  };

  const handleToggleLike = (postId: string) => {
    if (externalToggleLike) {
      externalToggleLike(postId);
    } else {
      setInternalPosts(
        posts.map((p) => {
          if (p.id === postId) {
            const hasLiked = !p.hasLiked;
            return {
              ...p,
              hasLiked,
              likes: hasLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
            };
          }
          return p;
        })
      );
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: PostComment = {
      id: `comment-${Date.now()}`,
      userName: currentUser ? currentUser.fullName : 'Vecino de la Comunidad',
      userRole: currentUser
        ? `Mz ${currentUser.block || 'A'} - Lote ${currentUser.lot || '01'}`
        : 'Residente',
      text,
      time: 'Justo ahora',
    };

    if (externalAddComment) {
      externalAddComment(postId, newComment);
    } else {
      setInternalPosts(
        posts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              comments: [...p.comments, newComment],
            };
          }
          return p;
        })
      );
    }

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  // Financial overview calculations
  const totalPaid = contributions.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalPaid - totalExpenses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Main Feed Column (2 cols on desktop) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Create Post Box - Facebook Style */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <form onSubmit={handleCreatePost}>
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full ${
                  currentUser?.avatarColor || 'bg-blue-600'
                } text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
              >
                {currentUser ? currentUser.fullName.charAt(0) : 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  id="input-create-post"
                  rows={2}
                  placeholder={`¿Qué novedades hay en el asentamiento hoy, ${
                    currentUser ? currentUser.fullName.split(' ')[0] : 'Vecino'
                  }?`}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-[#1877F2] rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#1877F2]/20 outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 sm:gap-2">
                {canManageIndertDocs && (
                  <button
                    type="button"
                    onClick={onOpenNewDoc}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Landmark className="w-4 h-4 text-[#1877F2]" />
                    <span className="hidden sm:inline">Adjuntar Doc INDERT</span>
                    <span className="sm:hidden">Doc</span>
                  </button>
                )}

                {canManageFinances && (
                  <button
                    type="button"
                    onClick={onOpenNewDoc}
                    className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Subir Factura</span>
                    <span className="sm:hidden">Factura</span>
                  </button>
                )}
              </div>

              <button
                id="btn-publish-post"
                type="submit"
                disabled={!newPostText.trim()}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  newPostText.trim()
                    ? 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Publicar
              </button>
            </div>
          </form>
        </div>

        {/* Community Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => {
            const attachedDoc = post.attachedDocId
              ? indertDocs.find((d) => d.id === post.attachedDocId)
              : null;

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3"
              >
                {/* Author info header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${post.authorAvatarColor} text-white font-extrabold text-sm flex items-center justify-center shadow-xs`}
                    >
                      {post.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{post.authorName}</h4>
                        {post.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              post.badgeType === 'indert'
                                ? 'bg-blue-100 text-[#1877F2]'
                                : post.badgeType === 'finances'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {post.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{post.authorRole}</p>
                      <span className="text-[10px] text-slate-400">{post.date}</span>
                    </div>
                  </div>

                  {(isAdmin || (currentUser && currentUser.fullName === post.authorName)) && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Deseas eliminar esta publicación del muro comunitario?')) {
                          if (onDeletePost) {
                            onDeletePost(post.id);
                          } else {
                            setInternalPosts(posts.filter((p) => p.id !== post.id));
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {post.content}
                </div>

                {/* Attached Document Card (if any) */}
                {attachedDoc && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-[#1877F2] text-white rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {attachedDoc.title}
                        </p>
                        <p className="text-[11px] text-blue-700">
                          {attachedDoc.documentNumber} • {attachedDoc.fileSize} • Oficial INDERT
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadIndertDocument(attachedDoc, settings)}
                      className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                )}

                {/* Likes count & engagement info */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px]">
                      👍
                    </span>
                    <strong>{post.likes}</strong> vecinos
                  </span>
                  <span>{post.comments.length} comentarios</span>
                </div>

                {/* Facebook Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      post.hasLiked
                        ? 'text-[#1877F2] bg-blue-50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Me Gusta
                  </button>

                  <button
                    onClick={() =>
                      setActiveCommentPostId(
                        activeCommentPostId === post.id ? null : post.id
                      )
                    }
                    className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comentar
                  </button>

                  <button
                    onClick={() => {
                      alert('Enlace del comunicado copiado para enviar por WhatsApp al grupo de vecinos.');
                    }}
                    className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir
                  </button>
                </div>

                {/* Comments Section */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {comment.userName.charAt(0)}
                      </div>
                      <div className="bg-slate-100 rounded-2xl p-2.5 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{comment.userName}</span>
                          <span className="text-[10px] text-slate-400">{comment.time}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-blue-800 block mb-0.5">
                          {comment.userRole}
                        </span>
                        <p className="text-slate-700 leading-snug">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment input */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1877F2] font-bold flex items-center justify-center text-[10px] shrink-0">
                      {currentUser ? currentUser.fullName.charAt(0) : 'U'}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Escribe un comentario o pregunta..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [post.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-100 rounded-full text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#1877F2]"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="absolute right-2 top-1.5 text-[#1877F2] hover:text-blue-700 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar Column (Facebook Style Widgets) */}
      <div className="space-y-4">
        {/* Community Guide Official PDF Card */}
        <div className="bg-linear-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-2xl p-4 text-slate-950 shadow-sm border border-amber-400/40 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-xs sm:text-sm">
                Guía Comunitaria Oficial
              </h3>
              <span className="text-[10px] font-bold text-slate-900">
                Manifiesto de Transparencia INDERT
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-900 font-medium leading-relaxed">
            Documento descargable en PDF para toda la comunidad: derechos del lote, cuotas comunales y prevención de estafas.
          </p>
          <button
            id="btn-feed-download-community-guide"
            onClick={() => downloadCommunityGuidePdf(settings)}
            className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 text-white hover:text-amber-300 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Descargar Guía en PDF
          </button>
        </div>

        {/* INDERT Status Widget */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#1877F2]" />
              Expediente INDERT General
            </h3>
            <span className="text-[10px] font-bold bg-blue-100 text-[#1877F2] px-2 py-0.5 rounded-md">
              Oficial
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">N° de Expediente Matriz:</span>
              <span className="font-bold text-slate-900 text-sm">
                {settings.indertExpedienteNumber || 'Exp. INDERT 4821/2024'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Reconocimiento Comisión:</span>
                <span className="font-bold text-emerald-700">Res. 612/24 (Aprobada)</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Mensura Judicial:</span>
                <span className="font-bold text-[#1877F2]">Plano Ingresado</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Censo Ocupacional:</span>
                <span className="font-bold text-slate-800">
                  {residents.length} familias verificadas
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('indert')}
              className="w-full mt-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#1877F2] font-bold text-xs rounded-xl transition-colors cursor-pointer text-center block"
            >
              Ver Legajo y Descargar Documentos
            </button>
          </div>
        </div>

        {/* Quick Treasury Balance Widget */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Caja Comunal & Transparencia
            </h3>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              Auditoría
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-semibold block">Recaudado</span>
              <span className="font-bold text-emerald-700 text-sm">
                {formatGuaranies(totalPaid)}
              </span>
            </div>
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[10px] text-rose-800 font-semibold block">Gastos Rendidos</span>
              <span className="font-bold text-rose-700 text-sm">
                {formatGuaranies(totalExpenses)}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Saldo en Caja:</span>
            <span
              className={`text-sm font-extrabold ${
                netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatGuaranies(netBalance)}
            </span>
          </div>

          <button
            onClick={() => onSelectTab('finances')}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center block"
          >
            Ver Balance Detallado & Facturas
          </button>
        </div>

        {/* Directory & Emergency Contacts Widget */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2.5 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Comisión Directiva Reconocida
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{settings.presidentName}</p>
                <span className="text-[10px] text-slate-500">Presidente</span>
              </div>
              <span className="text-[11px] font-mono text-blue-700 font-semibold">
                {settings.contactPhone}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{settings.treasurerName}</p>
                <span className="text-[10px] text-slate-500">Tesorera</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                +595981778899
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
