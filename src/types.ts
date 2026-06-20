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
  type: "Carrera de Club" | "Resistencia" | "Sprint" | "Entrenamiento";
  description?: string;
  status: "scheduled" | "completed";
  results?: Array<{
    position: string;
    name: string;
    time?: string;
    points: number;
    category?: "GT3" | "LMP2";
    gridPosition?: string;
    bestLap?: string;
  }>;
  pinnable?: boolean;
  createdAt?: string;
  strategyNotes?: string;
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
