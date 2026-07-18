import { UserProfile } from "../types";

export const mockPilots: UserProfile[] = [
  {
    uid: "pilot-1",
    displayName: "Juan Pérez",
    email: "juan@example.com",
    photoURL: "",
    role: "piloto",
    status: "aprobado",
    preferredGame: "Assetto Corsa",
    carPreference: "Ferrari 296 GT3",
    raceNumber: "05",
    steamId: "123456789",
    experience: "Veterano",
    instagram: "juanpilot",
    country: "es",
  },
  {
    uid: "pilot-2",
    displayName: "Ana Gómez",
    email: "ana@example.com",
    photoURL: "",
    role: "piloto",
    status: "aprobado",
    preferredGame: "Le Mans Ultimate",
    carPreference: "Oreca 07 LMP2",
    raceNumber: "32",
    steamId: "987654321",
    experience: "Novata",
    instagram: "anapilot",
    country: "mx",
  },
];
