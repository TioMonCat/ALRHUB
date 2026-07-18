import React, { useState } from "react";
import { UserProfile } from "../types";
import { Settings, Shield, User, Hash, Save, ShieldCheck, UserX, ToggleLeft } from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { COUNTRIES } from "../presets";

interface GestionAdminProps {
  users: UserProfile[];
  isLoading: boolean;
  dbReadOnly?: boolean;
}

export default function GestionAdmin({ users, isLoading, dbReadOnly = false }: GestionAdminProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserProfile["role"]>("piloto");
  const [status, setStatus] = useState<UserProfile["status"]>("aprobado");
  const [raceNumber, setRaceNumber] = useState("");
  const [preferredGame, setPreferredGame] = useState("");
  const [steamId, setSteamId] = useState("");
  const [instagram, setInstagram] = useState("");
  const [carPreference, setCarPreference] = useState("");
  const [experience, setExperience] = useState("");
  const [country, setCountry] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEditUser = (u: UserProfile) => {
    setEditingUserId(u.uid);
    setRole(u.role);
    setStatus(u.status);
    setRaceNumber(u.raceNumber || "");
    setPreferredGame(u.preferredGame || "");
    setSteamId(u.steamId || "");
    setInstagram(u.instagram || "");
    setCarPreference(u.carPreference || "");
    setExperience(u.experience || "");
    setCountry(u.country || "");
  };

  const handleSaveUser = async (uid: string) => {
    if (dbReadOnly) {
      setErrorMsg("La base de datos está en modo de solo lectura. No puedes guardar cambios.");
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, "users", uid), {
        role,
        status,
        raceNumber,
        preferredGame,
        steamId,
        instagram,
        carPreference,
        experience,
        country,
      });
      setEditingUserId(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error al actualizar piloto. No tienes permisos reales en la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (dbReadOnly) {
      setErrorMsg("La base de datos está en modo de solo lectura. No puedes eliminar pilotos.");
      return;
    }
    setErrorMsg(null);
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setErrorMsg(
        "No se pudo eliminar al piloto del sistema. Esto sucede si no tienes permisos reales de Administrador en el panel de Firebase o si estás usando el rol simulado. (La base de datos rechaza la acción y Firestore restaura el piloto)."
      );
    }
  };

  const pendingUsers = users.filter((u) => u.status !== "aprobado");
  const approvedUsers = users.filter((u) => u.status === "aprobado");

  const renderUserTable = (
    userList: UserProfile[],
    title: string,
    subtitle: string,
    emptyMessage: string,
    accentColor: string
  ) => {
    return (
      <div className="space-y-3 bg-stone-950/40 border border-stone-800/40 rounded-xl p-4 md:p-5">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-6 ${accentColor} rounded-full`} />
          <div>
            <h3 className="text-sm font-black text-white tracking-wide uppercase font-mono flex items-center gap-2">
              {title}
              <span className="text-[10px] px-2 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-400 font-bold font-mono">
                {userList.length} {userList.length === 1 ? "usuario" : "usuarios"}
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 font-mono mt-0.5">{subtitle}</p>
          </div>
        </div>

        {userList.length === 0 ? (
          <div className="bg-[#111113]/50 border border-stone-800/40 p-10 rounded-xl text-center text-xs font-mono text-stone-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="bg-[#111113] border border-stone-800 rounded-xl overflow-hidden shadow-lg mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-stone-900/60 text-stone-500 font-mono text-[9.51px] uppercase tracking-wider border-b border-stone-800/60">
                    <th className="py-3 px-4">Piloto / Cuenta</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Dorsal</th>
                    <th className="py-3 px-4">Steam ID</th>
                    <th className="py-3 px-4">Instagram</th>
                    <th className="py-3 px-4">Nacionalidad</th>
                    <th className="py-3 px-4">Simulador</th>
                    <th className="py-3 px-4">Vehículo Preferido</th>
                    <th className="py-3 px-4">Experiencia</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/40 text-stone-300">
                  {userList.map((u) => {
                    const isEditing = u.uid === editingUserId;
                    const isSystemRoot = u.email === "jaminecraft844@gmail.com";

                    return (
                      <tr key={u.uid} className="hover:bg-stone-900/10 font-sans">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-stone-800" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-mono font-black text-white">
                                {u.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold text-white text-xs truncate max-w-[150px]">{u.displayName}</p>
                              <p className="text-[10px] text-stone-500 font-mono truncate max-w-[150px]">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role selection */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white text-center focus:outline-none"
                              value={role}
                              onChange={(e) => setRole(e.target.value as UserProfile["role"])}
                              disabled={isSystemRoot}
                            >
                              <option value="postulante">Postulante</option>
                              <option value="piloto">Piloto</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[9.51px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              u.role === "admin"
                                ? "bg-red-950/20 text-red-400 border border-red-500/15"
                                : u.role === "piloto"
                                ? "bg-cyan-950/20 text-cyan-400 border border-cyan-500/15"
                                : "bg-stone-900 text-stone-400 border border-stone-800"
                            }`}>
                              {u.role === "admin" && <Shield className="w-2.5 h-2.5" />}
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* Status Selection */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white text-center focus:outline-none"
                              value={status}
                              onChange={(e) => setStatus(e.target.value as UserProfile["status"])}
                              disabled={isSystemRoot}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="aprobado">Aprobado</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              u.status === "aprobado"
                                ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/20"
                                : u.status === "pendiente"
                                ? "bg-amber-950/20 text-amber-500 border border-amber-900/20"
                                : "bg-red-950/20 text-red-400 border border-red-900/20"
                            }`}>
                              {u.status}
                            </span>
                          )}
                        </td>

                        {/* Racing Number / Dorsal */}
                        <td className="py-3 px-4 text-center font-mono">
                          {isEditing ? (
                            carPreference === "Ferrari 296 | GT3" ? (
                              <select
                                className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-16 text-center focus:outline-none"
                                value={raceNumber}
                                onChange={(e) => setRaceNumber(e.target.value)}
                              >
                                <option value="--">--</option>
                                <option value="05">05</option>
                                <option value="08">08</option>
                              </select>
                            ) : carPreference === "Oreca 07 | LMP2" ? (
                              <select
                                className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-16 text-center focus:outline-none"
                                value={raceNumber}
                                onChange={(e) => setRaceNumber(e.target.value)}
                              >
                                <option value="--">--</option>
                                <option value="32">32</option>
                                <option value="43">43</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                required
                                className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-14 text-center focus:outline-none"
                                value={raceNumber}
                                onChange={(e) => setRaceNumber(e.target.value)}
                              />
                            )
                          ) : (
                            <span className={`${
                              u.raceNumber === "32" || u.raceNumber === "43" ? "text-fuchsia-400 font-extrabold" : "text-cyan-400"
                            } font-extrabold`}>#{u.raceNumber || "00"}</span>
                          )}
                        </td>

                        {/* Steam ID */}
                        <td className="py-3 px-4 truncate max-w-[124px]">
                          {isEditing ? (
                            <input
                              type="text"
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-28 focus:outline-none"
                              value={steamId}
                              onChange={(e) => setSteamId(e.target.value)}
                            />
                          ) : (
                            <span className="text-stone-300 font-mono text-xs">{u.steamId || "--"}</span>
                          )}
                        </td>

                        {/* Instagram */}
                        <td className="py-3 px-4 truncate max-w-[124px]">
                          {isEditing ? (
                            <input
                              type="text"
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white w-28 focus:outline-none"
                              placeholder="@usuario"
                              value={instagram}
                              onChange={(e) => setInstagram(e.target.value)}
                            />
                          ) : (
                            <span className="text-pink-400 font-medium text-xs truncate block max-w-[110px]" title={u.instagram}>
                              {u.instagram || "--"}
                            </span>
                          )}
                        </td>

                        {/* Nacionalidad */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-28 focus:outline-none"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                            >
                              <option value="">--</option>
                              {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.flagEmoji} {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (() => {
                            const matchedCountry = COUNTRIES.find((c) => c.code === u.country?.toLowerCase());
                            return matchedCountry ? (
                              <div className="flex items-center gap-1.5 text-stone-300 font-mono text-xs">
                                <img
                                  src={`https://flagcdn.com/w40/${matchedCountry.code}.png`}
                                  alt={matchedCountry.name}
                                  className="w-4 h-3 object-cover rounded-sm border border-stone-800/60 flex-shrink-0"
                                />
                                <span className="truncate max-w-[70px]" title={matchedCountry.name}>
                                  {matchedCountry.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-500 font-mono text-xs">--</span>
                            );
                          })()}
                        </td>

                        {/* Simulador */}
                        <td className="py-3 px-4 truncate max-w-[124px]">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-28 focus:outline-none"
                              value={preferredGame}
                              onChange={(e) => setPreferredGame(e.target.value)}
                            >
                              <option value="">--</option>
                              <option value="Assetto Corsa">Assetto Corsa</option>
                              <option value="Le Mans Ultimate">Le Mans Ultimate</option>
                              <option value="Ambos">Ambos</option>
                            </select>
                          ) : (
                            <span className="text-stone-300 font-mono text-xs text-cyan-400">{u.preferredGame || "--"}</span>
                          )}
                        </td>

                        {/* Car preferencia */}
                        <td className="py-3 px-4 truncate max-w-[124px]">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white font-mono w-28 focus:outline-none"
                              value={carPreference}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCarPreference(val);
                                if (val === "Ferrari 296 | GT3") {
                                  if (raceNumber !== "05" && raceNumber !== "08" && raceNumber !== "--") {
                                    setRaceNumber("--");
                                  }
                                } else if (val === "Oreca 07 | LMP2") {
                                  if (raceNumber !== "32" && raceNumber !== "43" && raceNumber !== "--") {
                                    setRaceNumber("--");
                                  }
                                }
                              }}
                            >
                              <option value="">--</option>
                              <option value="Ferrari 296 | GT3">Ferrari 296 | GT3</option>
                              <option value="Oreca 07 | LMP2">Oreca 07 | LMP2</option>
                            </select>
                          ) : (
                            <span className={`${
                              u.carPreference?.includes("LMP2") 
                                ? "text-fuchsia-400 font-bold" 
                                : u.carPreference?.includes("GT3") 
                                ? "text-rose-400 font-bold" 
                                : "text-stone-300"
                            } font-mono text-xs`}>{u.carPreference || "--"}</span>
                          )}
                        </td>

                        {/* Licence Grade / Experience */}
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select
                              className="bg-[#18181b] border border-stone-800 rounded p-1 text-xs text-white focus:outline-none"
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                            >
                              <option value="Iniciado">Iniciado</option>
                              <option value="Intermedio">Intermedio</option>
                              <option value="Avanzado">Avanzado</option>
                              <option value="Elite">Elite</option>
                            </select>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs">{u.experience || "Sola"}</span>
                          )}
                        </td>

                        {/* Action trigger button */}
                        <td className="py-3 px-4 text-right">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="text-stone-400 hover:text-white bg-stone-900 border border-stone-800 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveUser(u.uid)}
                                disabled={isSaving || dbReadOnly}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1 rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isSaving ? "..." : "Guardar"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEditUser(u)}
                                className="text-stone-400 hover:text-white bg-stone-900 border border-stone-800 px-2.5 py-1 rounded text-[10.51px] font-mono uppercase transition-all cursor-pointer"
                              >
                                Editar
                              </button>
                              {!isSystemRoot && (
                                deletingUserId === u.uid ? (
                                  <div className="flex items-center gap-1.5 bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded">
                                    <span className="text-[10px] text-red-400 font-bold font-mono">¿Borrar?</span>
                                    <button
                                      onClick={() => {
                                        handleDeleteUser(u.uid);
                                        setDeletingUserId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[9.5px] font-bold cursor-pointer transition-colors"
                                    >
                                      Sí
                                    </button>
                                    <button
                                      onClick={() => setDeletingUserId(null)}
                                      className="px-1.5 py-0.5 bg-stone-850 hover:bg-stone-800 text-stone-300 rounded border border-stone-800 text-[9.5px] font-bold cursor-pointer transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => !dbReadOnly && setDeletingUserId(u.uid)}
                                    disabled={dbReadOnly}
                                    className={`px-2.5 py-1 rounded text-[10.51px] font-mono uppercase transition-all ${
                                      dbReadOnly 
                                        ? "text-stone-700 bg-stone-950 border border-stone-900 cursor-not-allowed opacity-40" 
                                        : "text-red-400 hover:text-white hover:bg-red-900/50 bg-stone-900 border border-red-900/50 cursor-pointer"
                                    }`}
                                  >
                                    Eliminar
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-stone-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Gestión Admin de Escudería
        </h2>
        <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
          Consola maestra • Auditoría de licencias, roles y dorsales de la delegación
        </p>
      </div>

      {dbReadOnly && (
        <div className="p-3.5 bg-red-950/25 border border-red-500/25 rounded-xl text-red-400 text-xs font-mono flex flex-col md:flex-row items-baseline md:items-center justify-between gap-3 shadow-md relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
          <div className="flex items-start gap-2.5 pl-1.5">
            <span className="text-red-400 font-bold text-sm animate-pulse">⚠️</span>
            <div className="space-y-0.5">
              <p className="font-extrabold text-red-400 uppercase tracking-wider text-[10px]">CONSOLA EN MODO CONSULTA • CUOTA AGOTADA</p>
              <p className="text-stone-300">
                La cuota de escritura diaria de Firebase se ha completado. No puedes guardar cambios de piloto, reasignar roles, dorsales ni dar de baja pilotos temporalmente hoy.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-xs font-mono flex items-center justify-between gap-3 animate-fade-in">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white px-2 py-0.5 rounded bg-red-900/20 hover:bg-red-900/40 transition-colors font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="h-44 bg-[#111113] border border-stone-800 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-8 animate-fade-in">
          {renderUserTable(
            pendingUsers,
            "Postulaciones y Pilotos Pendientes",
            "Nuevas solicitudes de ingreso o perfiles que aún no han sido aprobados por la administración",
            "No hay postulaciones ni pilotos pendientes de aprobación en este momento.",
            "bg-amber-500"
          )}

          {renderUserTable(
            approvedUsers,
            "Delegación Oficial Aprobada",
            "Pilotos y administradores validados, autorizados y listados oficialmente en el equipo",
            "No hay pilotos oficiales aprobados en el sistema actualmente.",
            "bg-emerald-500"
          )}
        </div>
      )}
    </div>
  );
}
