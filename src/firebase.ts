import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Support both default RTDB URL and project ID URL
const rtdbUrl = (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;
export const rtdb = getDatabase(app, rtdbUrl);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();

import { getLFMEloLicense, categorizeSimEvent, CategoryKey } from "./utils/lfm";

/**
 * Service function that queries the 'telemetry_sessions' collection filtering by pilotUid,
 * calculates aggregate racing statistics, and updates the pilot's user profile document in '/users/{uid}'.
 *
 * @param uid The Firebase Auth UID of the pilot to process
 * @returns The calculated aggregate statistics object
 */
export async function recalculateAndUpdatePilotStats(uid: string): Promise<any> {
  const pathUser = "users";
  try {
    const sessionsList: any[] = [];

    // 1. Primary source: Firestore subcollection 'users/{uid}/simEvents'
    try {
      const fsSubSnap = await getDocs(collection(db, pathUser, uid, "simEvents"));
      fsSubSnap.forEach((d) => sessionsList.push({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Firestore simEvents subcollection query note:", e);
    }

    // 2. Fallback source: Firestore root collection 'telemetry_sessions'
    try {
      const q = query(collection(db, "telemetry_sessions"), where("pilotUid", "==", uid));
      const fsRootSnap = await getDocs(q);
      fsRootSnap.forEach((d) => sessionsList.push({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Firestore telemetry_sessions query note:", e);
    }

    // 3. Realtime Database source: users/{uid}/simEvents
    try {
      const rtdbSnap = await get(ref(rtdb, `users/${uid}/simEvents`));
      if (rtdbSnap.exists()) {
        const val = rtdbSnap.val();
        if (typeof val === "object" && val !== null) {
          Object.entries(val).forEach(([id, item]: [string, any]) => {
            if (item && typeof item === "object") {
              sessionsList.push({ id, ...item });
            }
          });
        }
      }
    } catch (e) {
      console.warn("RTDB simEvents query note:", e);
    }

    // Deduplicate sessions
    const seen = new Set<string>();
    const uniqueSessions = sessionsList.filter((s) => {
      const key = s.id || `${s.sessionTimestamp}_${s.trackName}_${s.simulator}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let races = 0;
    let wins = 0;
    let podiums = 0;
    let poles = 0;
    let fastestLaps = 0;
    let minBestLapTimeSeconds = Infinity;
    let bestLap = "—:——.———";
    let totalPosition = 0;
    let totalLaps = 0;
    let totalIncidents = 0;

    // Per-category accumulator map
    const catStats: Record<CategoryKey, { races: number; wins: number; podiums: number; totalPos: number; totalIncidents: number; totalLaps: number }> = {
      GT: { races: 0, wins: 0, podiums: 0, totalPos: 0, totalIncidents: 0, totalLaps: 0 },
      Prototipos: { races: 0, wins: 0, podiums: 0, totalPos: 0, totalIncidents: 0, totalLaps: 0 },
      Fórmulas: { races: 0, wins: 0, podiums: 0, totalPos: 0, totalIncidents: 0, totalLaps: 0 },
    };

    uniqueSessions.forEach((data) => {
      races++;
      const cat = categorizeSimEvent(data);

      const pos = Number(data.racePosition ?? data.position ?? 0);
      if (pos === 1) {
        wins++;
        catStats[cat].wins++;
      }
      if (pos > 0 && pos <= 3) {
        podiums++;
        catStats[cat].podiums++;
      }

      const qualyPos = Number(data.qualyPosition ?? 0);
      if (qualyPos === 1) poles++;

      totalPosition += pos;
      catStats[cat].races++;
      catStats[cat].totalPos += pos;

      const laps = Number(data.lapsCompleted || 0);
      totalLaps += laps;
      catStats[cat].totalLaps += laps;

      const incidents = Number(data.incidentsCount || 0);
      totalIncidents += incidents;
      catStats[cat].totalIncidents += incidents;

      const bestLapSeconds = Number(data.bestLapTimeSeconds || data.raceBestLapTime || 0);
      if (bestLapSeconds > 0 && bestLapSeconds < minBestLapTimeSeconds) {
        minBestLapTimeSeconds = bestLapSeconds;
        bestLap = data.bestLapTimeFormatted || "—:——.———";
      }
    });

    const avgPosition = races > 0 ? parseFloat((totalPosition / races).toFixed(1)) : 0;

    let consistency = 100;
    if (races > 0 && totalLaps > 0) {
      const avgIncidentsPerLap = totalIncidents / totalLaps;
      consistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, avgIncidentsPerLap)) * 100)));
    } else if (races > 0) {
      consistency = totalIncidents === 0 ? 100 : Math.max(0, 100 - totalIncidents * 10);
    }

    // Base Elo starts at 1000 for everyone!
    let globalElo = 1000;
    if (races > 0) {
      // Calculate Elo starting at 1000
      globalElo += wins * 150 + podiums * 60 + poles * 30 + races * 15;
    }

    // Global Safety Rating starting at 0.00
    let globalSR = 0.00;
    if (races > 0) {
      const baseGain = races * 0.5 + totalLaps * 0.05;
      const penalty = totalIncidents * 0.2;
      globalSR = Math.min(9.99, Math.max(0.00, baseGain - penalty));
    }

    const globalLicense = getLFMEloLicense(globalElo, races);

    // Build Category Licenses map
    const categoryLicenses: Record<string, any> = {};
    (Object.keys(catStats) as CategoryKey[]).forEach((cat) => {
      const cs = catStats[cat];
      if (cs.races === 0) {
        categoryLicenses[cat] = {
          grade: "ROOKIE",
          skillRating: 1000,
          safetyRating: 0.00,
          racesCompleted: 0,
        };
      } else {
        const catElo = 1000 + cs.wins * 150 + cs.podiums * 60 + cs.races * 15;
        const catSR = Math.min(9.99, Math.max(0.00, cs.races * 0.5 + cs.totalLaps * 0.05 - cs.totalIncidents * 0.2));
        const lfm = getLFMEloLicense(catElo, cs.races);

        categoryLicenses[cat] = {
          grade: lfm.grade,
          skillRating: catElo,
          safetyRating: parseFloat(catSR.toFixed(2)),
          racesCompleted: cs.races,
        };
      }
    });

    const updatedStats = {
      races,
      wins,
      podiums,
      poles,
      fastestLaps,
      bestLap,
      avgPosition,
      consistency,
    };

    const userRef = doc(db, pathUser, uid);
    await updateDoc(userRef, {
      stats: updatedStats,
      skillRating: globalElo,
      safetyRating: parseFloat(globalSR.toFixed(2)),
      grade: globalLicense.grade,
      categoryLicenses,
    });

    return updatedStats;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${pathUser}/${uid}`);
  }
}
