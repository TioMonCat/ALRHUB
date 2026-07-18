import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

/**
 * Service function that queries the 'telemetry_sessions' collection filtering by pilotUid,
 * calculates aggregate racing statistics, and updates the pilot's user profile document in '/users/{uid}'.
 *
 * @param uid The Firebase Auth UID of the pilot to process
 * @returns The calculated aggregate statistics object
 */
export async function recalculateAndUpdatePilotStats(uid: string): Promise<any> {
  const pathSessions = "telemetry_sessions";
  const pathUser = "users";
  try {
    const q = query(collection(db, pathSessions), where("pilotUid", "==", uid));
    const querySnapshot = await getDocs(q);

    let races = 0;
    let wins = 0;
    let podiums = 0;
    let poles = 0; // standard default
    let fastestLaps = 0; // standard default
    let minBestLapTimeSeconds = Infinity;
    let bestLap = "—:——.———";
    let totalPosition = 0;
    let totalLaps = 0;
    let totalIncidents = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      races++;

      const pos = Number(data.position || 0);
      if (pos === 1) wins++;
      if (pos > 0 && pos <= 3) podiums++;

      totalPosition += pos;

      const laps = Number(data.lapsCompleted || 0);
      totalLaps += laps;

      const incidents = Number(data.incidentsCount || 0);
      totalIncidents += incidents;

      const bestLapSeconds = Number(data.bestLapTimeSeconds || 0);
      if (bestLapSeconds > 0 && bestLapSeconds < minBestLapTimeSeconds) {
        minBestLapTimeSeconds = bestLapSeconds;
        bestLap = data.bestLapTimeFormatted || "—:——.———";
      }
    });

    const avgPosition = races > 0 ? parseFloat((totalPosition / races).toFixed(1)) : 0;

    // Consistency formula: based on avg incidents per completed lap
    // 0 incidents/lap = 100% consistency. 1 or more incidents/lap = 0% consistency.
    let consistency = 100;
    if (races > 0 && totalLaps > 0) {
      const avgIncidentsPerLap = totalIncidents / totalLaps;
      consistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, avgIncidentsPerLap)) * 100)));
    } else if (races > 0) {
      // Fallback if lapsCompleted is missing or 0 but sessions exist
      consistency = totalIncidents === 0 ? 100 : Math.max(0, 100 - totalIncidents * 10);
    }

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
    });

    return updatedStats;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${pathUser}/${uid}`);
  }
}
