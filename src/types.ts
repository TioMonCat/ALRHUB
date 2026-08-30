export enum FieldType {
  NUMBER = "number",
  SELECT = "select",
  TEXT = "text",
}

export interface SetupField {
  id: string;
  name: string;
  type: FieldType | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: string;
  options?: string[];
}

export interface SetupSection {
  id: string;
  name: string;
  fields: SetupField[];
}

export interface SetupTemplate {
  id: string;
  title: string;
  description: string;
  sections: SetupSection[];
  isCustom?: boolean;
}

export interface CarSetup {
  id: string;
  title: string;
  game: string;
  car: string;
  track: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
  customSections?: SetupSection[]; // Inline sections overrides for individual setups
  values: Record<string, string>; // mapping from fieldId -> value
  isFavorite?: boolean;
  lapTime?: string; // Lap time target or record (e.g., "1:47.345")
  weather?: "Dry" | "Wet" | "Mixed";
  setupType?: string; // "Libre" / "Fixed" for LMU, or "LFM" / "RSX" for AC
  ownerId?: string;
  creatorName?: string;
}

export interface HandlingRecommendation {
  targetFieldId?: string;
  fieldName: string;
  adjustment: string;
  reason: string;
}

export interface HandlingAnalysis {
  verdict: string;
  explanation: string;
  recommendations: HandlingRecommendation[];
  engineerNotes: string;
}

export type LicenseCategory = "GT" | "Prototipos" | "Fórmulas" | "Endurance";

export interface CategoryLicenseInfo {
  category: LicenseCategory;
  grade: "PRO-Elite" | "PRO" | "AM-Gold" | "AM-Silver" | "Rookie" | "Sin Licencia";
  safetyRating: number; // e.g. 4.85
  skillRating: number;  // e.g. 2450
  racesCompleted?: number;
}

export interface CategoryStats {
  races?: number;
  wins?: number;
  podiums?: number;
  poles?: number;
  fastestLaps?: number;
  dnfs?: number;
  totalPoints?: number;
  bestLap?: string;
  avgPosition?: number;
  consistency?: number;
  safetyRating?: number;
  skillRating?: number;
  grade?: "PRO-Elite" | "PRO" | "AM-Gold" | "AM-Silver" | "Rookie" | "Sin Licencia";
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: "admin" | "piloto" | "postulante";
  status: "pendiente" | "aprobado" | "rechazado" | "completar";
  rejectionReason?: string;
  preferredGame?: string;
  carPreference?: string;
  raceNumber?: string;
  steamId?: string;
  experience?: string;
  message?: string;
  instagram?: string;
  appliedAt?: string;
  country?: string;
  leagues?: string[];
  assignedVehicles?: string[];
  vehicles?: string[];
  skillRating?: number;
  safetyRating?: number;
  grade?: string;
  // Category Licenses
  categoryLicenses?: Partial<Record<LicenseCategory, CategoryLicenseInfo>>;
  // Global & Category-specific stats populated by telemetry/stats app
  stats?: {
    races?: number;
    wins?: number;
    podiums?: number;
    poles?: number;
    fastestLaps?: number;
    dnfs?: number;
    totalPoints?: number;
    bestLap?: string;
    avgPosition?: number;
    consistency?: number;
    // Category Breakdown
    categories?: Partial<Record<LicenseCategory, CategoryStats>>;
  };
}

export interface SimEvent {
  id?: string;
  pilotUid: string;
  pilotName: string;
  simulator: string;
  sessionType: string;
  isOnline: boolean;
  carModel: string;
  trackName: string;
  qualyPosition?: number | null;
  qualyBestLapTime?: number | null | string;
  racePosition?: number | null;
  raceBestLapTime?: number | null;
  averagePosition?: number;
  position?: number;
  lapsCompleted?: number;
  bestLapTimeSeconds?: number;
  bestLapTimeFormatted?: string;
  totalDistanceKm?: number;
  incidentsCount?: number;
  sessionTimestamp: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  authorPhoto?: string;
  category: "Comunicado" | "Carreras" | "Técnico" | "Anuncio";
  pinnable?: boolean;
}

export interface TeamEvent {
  id: string;
  title: string;
  track: string;
  car: string;
  date: string;
  type: "Carrera de Club" | "Resistencia" | "Sprint" | "Entrenamiento" | "Qualy" | "Reunión" | "Práctica" | "Test" | string;
  description?: string;
  status: "scheduled" | "completed";
  results?: Array<{
    position: string;
    name?: string;
    time?: string;
    points: number;
    category?: "GT3" | "LMP2";
    gridPosition?: string;
    bestLap?: string;
  }>;
  pinnable?: boolean;
  createdAt?: string;
  strategyNotes?: string;
  discordNotified24h?: boolean;
  discordNotified24hAt?: string;
}

export interface AttendanceRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  status: "yes" | "no" | "maybe";
  comments?: string;
  updatedAt: string;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  type: "single" | "multiple" | "text";
  options?: string[]; // Optional for open text polls
  votes: Record<string, any>; // maps userId -> value (number for single, number[] for multiple, string for text)
  allowedRoles?: string[]; // e.g. ["admin", "piloto", "postulante"]
  allowedSimulators?: string[]; // e.g. ["Assetto Corsa", "Le Mans Ultimate", "Ambos"]
  allowedClasses?: string[]; // e.g. ["GT3", "LMP2", "Reserva"]
  createdAt: string;
  creatorId: string;
  creatorName: string;
  isClosed?: boolean;
}

export interface GalleryFolder {
  id: string;
  name: string;
  pilotUid: string;
  pilotName: string;
  createdAt: string;
  color?: string;
  description?: string;
  allowedUids?: string[]; // Array of pilot UIDs permitted to upload/collaborate in this folder
}

export interface GalleryImage {
  id: string;
  folderId?: string; // Empty or undefined means "General / Raíz"
  folderName?: string;
  title: string;
  description?: string;
  url: string;
  r2Key: string;
  pilotUid: string;
  pilotName: string;
  pilotPhoto?: string;
  createdAt: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  tags?: string[];
}

