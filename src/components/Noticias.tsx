import React, { useState } from "react";
import { NewsItem, UserProfile } from "../types";
import { Plus, Trash, AlertTriangle, FileText } from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";

interface NoticiasProps {
  news: NewsItem[];
  currentUserProfile: UserProfile | null;
  isLoading: boolean;
  dbReadOnly?: boolean;
}

export default function Noticias({
  news,
  currentUserProfile,
  isLoading,
  dbReadOnly = false,
}: NoticiasProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NewsItem["category"]>("Comunicado");
  const [pinnable, setPinnable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUserProfile?.role === "admin";

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !currentUserProfile || dbReadOnly) return;
    setIsSubmitting(true);

    const newBulletin: Omit<NewsItem, "id"> = {
      title,
      content,
      category,
      pinnable,
      date: new Date().toISOString(),
      author: currentUserProfile.displayName,
      authorPhoto: currentUserProfile.photoURL,
    };

    const path = "news";
    try {
      await addDoc(collection(db, path), newBulletin);
      setTitle("");
      setContent("");
      setPinnable(false);
      setCategory("Comunicado");
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!isAdmin || dbReadOnly) return;

    const path = `news/${id}`;
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const getCategoryColor = (cat: NewsItem["category"]) => {
    switch (cat) {
      case "Comunicado":
        return "bg-cyan-950/40 text-cyan-400 border border-cyan-900/40";
      case "Carreras":
        return "bg-rose-950/40 text-rose-400 border border-rose-900/40";
      case "Técnico":
        return "bg-amber-950/40 text-amber-400 border border-amber-900/40";
      case "Anuncio":
        return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40";
      default:
        return "bg-stone-900 text-stone-400 border border-stone-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Noticias y Anuncios
          </h2>
          <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
            Comunicados de boxes • Paddock Informativo ALR
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            {showAddForm ? "Cancelar" : "Publicar Anuncio"}
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add News Form */}
      {showAddForm && isAdmin && (
        <form onSubmit={handleCreateNews} className="bg-[#111113] border border-stone-800 p-5 rounded-xl space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest">
            NUEVA PUBLICACIÓN EN BOXES
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Título del Comunicado *
              </label>
              <input
                type="text"
                required
                placeholder="Título impactante..."
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                Categoría *
              </label>
              <select
                required
                className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsItem["category"])}
              >
                <option value="Comunicado">Comunicado (General)</option>
                <option value="Carreras">Carreras (Eventos / GP)</option>
                <option value="Técnico">Técnico (Ingeniería / Setups)</option>
                <option value="Anuncio">Anuncio (Reglamento / Admin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              Contenido del Mensaje (Markdown o Texto Plano) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detalles del anuncio para los pilotos..."
              className="w-full bg-[#18181B] border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-sans"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinnable"
              checked={pinnable}
              onChange={(e) => setPinnable(e.target.checked)}
              className="rounded bg-[#18181B] border-stone-800 text-cyan-400 focus:ring-0"
            />
            <label htmlFor="pinnable" className="text-xs text-stone-400 font-mono cursor-pointer selection:bg-transparent select-none">
              Fijar publicación en cabecera principal (Anuncio Destacado)
            </label>
          </div>

          {dbReadOnly && (
            <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 text-amber-400 rounded-lg text-[11px] font-mono leading-relaxed">
              ⚠️ La base de datos está en modo de solo lectura. No puedes publicar anuncios en este momento.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || dbReadOnly}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
          >
            {dbReadOnly ? "Solo Lectura" : isSubmitting ? "Publicando..." : "Publicar Ahora"}
          </button>
        </form>
      )}

      {/* News Listings Feed */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
          <div className="h-28 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
        </div>
      ) : news.length === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-bold text-stone-400 font-mono">SIN ANUNCIOS DISPONIBLES</h3>
          <p className="text-stone-500 text-xs">No se han registrado anuncios oficiales por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {/* List Bulletins */}
          {news.map((item) => (
            <div
              key={item.id}
              className={`bg-[#111113]/90 relative border border-stone-800 hover:border-stone-700 transition-all p-5 md:p-6 rounded-xl space-y-4 shadow-md ${
                item.pinnable ? "ring-1 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : ""
              }`}
            >
              {item.pinnable && (
                <div className="absolute top-0 right-12 transform -translate-y-1/2 bg-amber-500 text-black text-[8px] font-black tracking-widest font-mono uppercase px-2 py-0.5 rounded-full shadow-md z-10">
                  FIJADO
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] uppercase font-mono tracking-widest font-bold px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => !dbReadOnly && handleDeleteNews(item.id)}
                    disabled={dbReadOnly}
                    className={`p-1.5 rounded border transition-all ${
                      dbReadOnly 
                        ? "text-stone-700 bg-stone-950 border-stone-900 cursor-not-allowed opacity-40" 
                        : "text-stone-500 hover:text-red-400 bg-stone-900 hover:bg-red-950/20 border-stone-800 hover:border-red-900/50 cursor-pointer"
                    }`}
                    title={dbReadOnly ? "No es posible eliminar en modo de solo lectura" : "Eliminar Noticia"}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-white font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              <div className="border-t border-stone-800/60 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.authorPhoto ? (
                    <img src={item.authorPhoto} alt="Author avatar" className="w-5.5 h-5.5 rounded-full border border-stone-800" />
                  ) : (
                    <div className="w-5.5 h-5.5 bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/35 rounded-full text-[9px] font-bold flex items-center justify-center font-mono">
                      {item.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-stone-400 font-mono">
                    Publicado por: <strong className="text-stone-300 font-bold">{item.author}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
