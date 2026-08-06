export interface LFMLicense {
  grade: string;
  color: string;
  badgeBg: string;
}

export function getLFMEloLicense(elo: number, races: number): LFMLicense {
  if (races < 10) {
    return {
      grade: "ROOKIE",
      color: "text-red-500",
      badgeBg: "bg-red-950/80 text-red-400 border border-red-500/50 font-black",
    };
  }
  if (elo >= 10000 && races >= 200) {
    return {
      grade: "HERO",
      color: "text-cyan-400",
      badgeBg: "bg-cyan-400 text-black font-extrabold border border-cyan-300",
    };
  }
  if (elo >= 8000 && races >= 200) {
    return {
      grade: "ALIEN",
      color: "text-lime-400",
      badgeBg: "bg-lime-400 text-black font-extrabold border border-lime-300",
    };
  }
  if (elo >= 6000 && races >= 150) {
    return {
      grade: "LEGEND",
      color: "text-purple-400",
      badgeBg: "bg-purple-600 text-white font-extrabold border border-purple-400",
    };
  }
  if (elo >= 5000 && races >= 100) {
    return {
      grade: "DIAMOND",
      color: "text-blue-400",
      badgeBg: "bg-blue-600 text-white font-extrabold border border-blue-400",
    };
  }
  if (elo >= 4000 && races >= 100) {
    return {
      grade: "PLATINUM",
      color: "text-stone-100",
      badgeBg: "bg-stone-950 text-white font-extrabold border border-stone-600",
    };
  }
  if (elo >= 3200 && races >= 50) {
    return {
      grade: "GOLD+",
      color: "text-yellow-400",
      badgeBg: "bg-yellow-400 text-black font-extrabold border border-yellow-300",
    };
  }
  if (elo >= 2500 && races >= 50) {
    return {
      grade: "GOLD",
      color: "text-yellow-400",
      badgeBg: "bg-yellow-400 text-black font-extrabold border border-yellow-300",
    };
  }
  if (elo >= 2000 && races >= 25) {
    return {
      grade: "SILVER+",
      color: "text-slate-300",
      badgeBg: "bg-slate-300 text-slate-900 font-extrabold border border-slate-200",
    };
  }
  if (elo >= 1700 && races >= 25) {
    return {
      grade: "SILVER",
      color: "text-slate-300",
      badgeBg: "bg-slate-300 text-slate-900 font-extrabold border border-slate-200",
    };
  }
  if (elo >= 1500) {
    return {
      grade: "BRONZE+",
      color: "text-amber-500",
      badgeBg: "bg-amber-800 text-amber-100 font-bold border border-amber-600",
    };
  }
  if (elo >= 1300) {
    return {
      grade: "BRONZE",
      color: "text-amber-500",
      badgeBg: "bg-amber-800 text-amber-100 font-bold border border-amber-600",
    };
  }
  if (elo >= 1000) {
    return {
      grade: "IRON+",
      color: "text-stone-400",
      badgeBg: "bg-stone-700 text-stone-200 font-bold border border-stone-500",
    };
  }
  return {
    grade: "IRON",
    color: "text-stone-400",
    badgeBg: "bg-stone-800 text-stone-300 font-bold border border-stone-600",
  };
}

export function getSRLicenseTier(sr: number): { grade: string; color: string; badgeBg: string } {
  if (sr >= 9.5) return { grade: "S", color: "text-emerald-400", badgeBg: "bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded" };
  if (sr >= 9.0) return { grade: "A1", color: "text-purple-400", badgeBg: "bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 8.5) return { grade: "A2", color: "text-purple-400", badgeBg: "bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 8.0) return { grade: "A3", color: "text-purple-400", badgeBg: "bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 7.5) return { grade: "B1", color: "text-yellow-400", badgeBg: "bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 7.0) return { grade: "B2", color: "text-yellow-400", badgeBg: "bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 6.5) return { grade: "B3", color: "text-yellow-400", badgeBg: "bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 6.0) return { grade: "C1", color: "text-slate-300", badgeBg: "bg-slate-300 text-slate-900 font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 5.5) return { grade: "C2", color: "text-slate-300", badgeBg: "bg-slate-300 text-slate-900 font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 5.0) return { grade: "C3", color: "text-slate-300", badgeBg: "bg-slate-300 text-slate-900 font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 4.5) return { grade: "D1", color: "text-amber-500", badgeBg: "bg-amber-700 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 4.0) return { grade: "D2", color: "text-amber-500", badgeBg: "bg-amber-700 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 3.5) return { grade: "D3", color: "text-amber-500", badgeBg: "bg-amber-700 text-white font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 3.0) return { grade: "E1", color: "text-stone-400", badgeBg: "bg-stone-600 text-stone-200 font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 2.0) return { grade: "E2", color: "text-stone-400", badgeBg: "bg-stone-600 text-stone-200 font-bold px-1.5 py-0.5 rounded" };
  if (sr >= 1.0) return { grade: "E3", color: "text-stone-400", badgeBg: "bg-stone-600 text-stone-200 font-bold px-1.5 py-0.5 rounded" };
  return { grade: "R", color: "text-red-400", badgeBg: "bg-red-950 text-red-400 border border-red-500/40 font-bold px-1.5 py-0.5 rounded" };
}

export type CategoryKey = "GT" | "Prototipos" | "Fórmulas";

export function categorizeSimEvent(e: { carModel?: string; simulator?: string; sessionType?: string; totalDistanceKm?: number }): CategoryKey {
  const car = (e.carModel || "").toLowerCase();
  const sim = (e.simulator || "").toLowerCase();

  if (
    car.includes("lmp") ||
    car.includes("hypercar") ||
    car.includes("oreca") ||
    car.includes("dpi") ||
    car.includes("gtp") ||
    car.includes("prototype") ||
    sim.includes("le mans")
  ) {
    return "Prototipos";
  }
  if (
    car.includes("f1") ||
    car.includes("f2") ||
    car.includes("f3") ||
    car.includes("f4") ||
    car.includes("formula") ||
    car.includes("indy") ||
    car.includes("fe") ||
    sim.includes("f1")
  ) {
    return "Fórmulas";
  }
  // Default covers all GT vehicles (GT1, GT2, GT3, GT4, GT500, Super GT, Cup cars, etc.)
  return "GT";
}
