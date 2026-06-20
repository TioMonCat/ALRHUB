import React, { useState } from "react";
import { UserProfile } from "../types";
import { Check, X, ShieldAlert, Award, FileText, Calendar, Mail, Inbox, Instagram } from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { COUNTRIES } from "../presets";

interface EvaluarPostulacionesProps {
  users: UserProfile[];
  isLoading: boolean;
}

export default function EvaluarPostulaciones({
  users,
  isLoading,
}: EvaluarPostulacionesProps) {
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [rejectingUid, setRejectingUid] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Candidates whose role is "postulante" or status is pending registration approval
  const candidates = users.filter((u) => u.role === "postulante" && u.status === "pendiente");

  const handleApprove = async (uid: string) => {
    setProcessingUid(uid);
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), {
        role: "piloto",
        status: "aprobado",
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReject = async (uid: string) => {
    if (!rejectionReason.trim()) {
      alert("Debes ingresar un motivo para el rechazo.");
      return;
    }
    setProcessingUid(uid);
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), {
        status: "rechazado",
        rejectionReason: rejectionReason.trim(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setProcessingUid(null);
      setRejectingUid(null);
      setRejectionReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-yellow-500" />
          Evaluar Postulaciones de Pilotos
        </h2>
        <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
          Comisión de fichajes • Evaluación de licencias y solicitudes de ingreso
        </p>
      </div>

      {isLoading ? (
        <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
      ) : candidates.length === 0 ? (
        <div className="border border-stone-800 border-dashed rounded-xl p-10 text-center space-y-2 max-w-xl">
          <Inbox className="w-8 h-8 text-stone-600 mx-auto" />
          <h3 className="font-bold text-stone-400 font-mono">BANDEJA DE ENTRADA VACÍA</h3>
          <p className="text-stone-500 text-xs">
            No hay nuevas solicitudes de pilotos pendientes de moderación en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((c) => (
            <div
              key={c.uid}
              className="bg-[#111113] border border-stone-800 hover:border-stone-700 p-5 rounded-2xl space-y-4 shadow-lg transition-all"
            >
              {/* Profile Card Header */}
              <div className="flex items-center gap-4.5 border-b border-stone-800/60 pb-3">
                {c.photoURL ? (
                  <img
                    src={c.photoURL}
                    alt={c.displayName}
                    className="w-11 h-11 rounded-full border border-stone-800 object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-stone-900 border border-stone-800 text-[#22d3ee] flex items-center justify-center text-xs font-mono font-black">
                    {c.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-extrabold text-white text-sm truncate">{c.displayName}</p>
                  <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-mono mt-0.5">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                </div>
              </div>

              {/* Application technical telemetry */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Simulador Preferido</p>
                  <p className="text-cyan-400 font-bold mt-0.5 truncate">{c.preferredGame || "Sin especificar"}</p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Vehículo Solicitado</p>
                  <p className={`font-bold mt-0.5 truncate ${
                    c.carPreference?.includes("LMP2") 
                      ? "text-fuchsia-400 font-extrabold" 
                      : c.carPreference?.includes("GT3") 
                      ? "text-rose-400 font-extrabold" 
                      : "text-stone-300"
                  }`}>{c.carPreference || "Sin especificar"}</p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Dorsal Pretendido</p>
                  <p className={`font-extrabold mt-0.5 ${
                    c.raceNumber === "32" ? "text-amber-400" : "text-[#64ffda]"
                  }`}>#{c.raceNumber || "00"}</p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Experiencia Autodeclarada</p>
                  <p className="text-amber-400 font-bold mt-0.5">{c.experience || "Sola"}</p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Steam ID</p>
                  <p className="text-cyan-400 font-bold mt-0.5">{c.steamId || "N/A"}</p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-[#e1306c] text-[8px] uppercase flex items-center gap-1 font-bold">
                    <Instagram className="w-2.5 h-2.5" /> Instagram
                  </p>
                  <p className="text-stone-200 font-bold mt-0.5 truncate" title={c.instagram || "Sin especificar"}>
                    {c.instagram || "N/A"}
                  </p>
                </div>
                <div className="bg-[#17171a] p-2.5 rounded-lg border border-stone-800/40">
                  <p className="text-stone-500 text-[8px] uppercase">Nacionalidad</p>
                  {(() => {
                    const countryItem = COUNTRIES.find((co) => co.code === c.country?.toLowerCase());
                    return countryItem ? (
                      <div className="flex items-center gap-1.5 mt-0.5 text-stone-200 font-bold text-xs">
                        <img
                          src={`https://flagcdn.com/w40/${countryItem.code}.png`}
                          alt={countryItem.name}
                          className="w-4 h-3 object-cover rounded-sm border border-stone-800/60"
                        />
                        <span className="truncate max-w-[70px]">{countryItem.name}</span>
                      </div>
                    ) : (
                      <p className="text-stone-500 font-bold mt-0.5">Sin esp.</p>
                    );
                  })()}
                </div>
              </div>

              {/* Message */}
              {c.message && (
                <div className="bg-[#18181A] text-stone-300 p-3 rounded-lg border border-stone-800 text-xs">
                  <p className="text-stone-500 font-mono text-[9px] uppercase tracking-wider mb-1">
                    Carta de Motivación / Notas del Postulante
                  </p>
                  <p className="font-sans leading-relaxed text-stone-200 italic">
                    "{c.message}"
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-stone-800/60">
                {rejectingUid === c.uid ? (
                  <div className="space-y-3">
                    <textarea
                      placeholder="Motivo del rechazo (para que el postulante lo vea)..."
                      className="w-full bg-[#18181A] border border-red-900/50 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-400 resize-none"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setRejectingUid(null);
                          setRejectionReason("");
                        }}
                        className="px-3.5 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-stone-400 hover:text-white text-[10.51px] transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleReject(c.uid)}
                        disabled={processingUid === c.uid}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-4 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[10.51px] transition-all cursor-pointer disabled:opacity-40"
                      >
                        Confirmar Rechazo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setRejectingUid(c.uid)}
                      disabled={processingUid === c.uid}
                      className="px-3.5 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-red-400 border border-red-500/10 hover:bg-red-950/20 text-[10.51px] transition-all cursor-pointer disabled:opacity-40"
                    >
                      Rechazar
                    </button>

                    <button
                      onClick={() => handleApprove(c.uid)}
                      disabled={processingUid === c.uid}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-[10.51px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Homologar Piloto
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
