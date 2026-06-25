import React, { useState, useEffect } from "react";
import { CarSetup, SetupTemplate, SetupSection, SetupField, FieldType, UserProfile, NewsItem, TeamEvent, AttendanceRecord } from "./types";
import { DEFAULT_TEMPLATES, LE_MANS_ULTIMATE_GT3_TEMPLATE } from "./presets";
import SetupHub from "./components/SetupHub";
import SetupDetail from "./components/SetupDetail";
import SetupCompare from "./components/SetupCompare";
import FuelCalculator from "./components/FuelCalculator";

// Import Team Portal Screens
import Inicio from "./components/Inicio";
import Noticias from "./components/Noticias";
import Roster from "./components/Roster";
import Temporada from "./components/Temporada";
import Asistencia from "./components/Asistencia";
import GestionAdmin from "./components/GestionAdmin";
import EvaluarPostulaciones from "./components/EvaluarPostulaciones";
import ALRLogo from "./components/ALRLogo";

// Icons
import { 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  Award, 
  Calendar, 
  FileText, 
  Trophy, 
  Settings, 
  Users, 
  Compass, 
  ChevronRight, 
  Database,
  Sliders,
  CheckCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Shield,
  Fuel
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Firebase
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./firebase";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDoc, addDoc } from "firebase/firestore";

const sanitizeForFirestore = <T,>(data: T): T => {
  if (data === undefined) return null as any;
  if (data === null) return null as any;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === "object") {
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = (data as any)[key];
        if (val !== undefined) {
          clean[key] = sanitizeForFirestore(val);
        }
      }
    }
    return clean;
  }
  return data;
};

export default function App() {
  // Navigation Menu options
  type TabType = "inicio" | "noticias" | "roster" | "temporada" | "garaje" | "asistencia" | "gestion_admin" | "evaluar_postulaciones";
  const [activeTab, setActiveTab] = useState<TabType>("inicio");

  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Role Simulator Overwrite (For Reviewing & Testing the three roles in AI Studio)
  const [simulatedRole, setSimulatedRole] = useState<"admin" | "piloto" | "postulante" | "real" | null>("real");

  // Portal shared synced databases
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [systemSettings, setSystemSettings] = useState({ adminOnlySetups: false });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  // Setup Hub / Garage Manager State (Reads fromusers/default_user/setups to sync team-wide)
  const [setups, setSetups] = useState<CarSetup[]>([]);
  const [templates, setTemplates] = useState<SetupTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoadingCloudSetups, setIsLoadingCloudSetups] = useState(false);

  // Garage internal sub-view
  const [garageView, setGarageView] = useState<"hub" | "detail" | "compare">("hub");
  const [selectedSetupId, setSelectedSetupId] = useState<string | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<[string, string] | null>(null);

  // Responsive Menu trigger state
  const [isSandwichMenuOpen, setIsSandwichMenuOpen] = useState(false);
  const [showFuelCalc, setShowFuelCalc] = useState(false);

  // States & helper functions for self-management / real database-level testing
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);

  // Email/Password authentication states
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [dbError, setDbError] = useState<{ hasError: boolean; message: string; isQuota: boolean } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const isCompleted = localStorage.getItem("alr_onboarding_completed");
    if (!isCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("alr_onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const handleDatabaseListenerError = (error: any) => {
    console.error("Database listener error caught:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const lowercaseMsg = errMsg.toLowerCase();
    const isQuota = lowercaseMsg.includes("quota") || 
                    lowercaseMsg.includes("exceeded") || 
                    lowercaseMsg.includes("resource-exhausted") || 
                    lowercaseMsg.includes("permission") ||
                    lowercaseMsg.includes("insufficient") ||
                    lowercaseMsg.includes("offline") ||
                    lowercaseMsg.includes("network");
    
    setDbError({
      hasError: true,
      message: errMsg,
      isQuota: isQuota
    });
  };

  const handlePromoteSelfToAdmin = async () => {
    if (!firebaseUser || !currentUserProfile) return;
    setIsLoadingPortal(true);
    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        role: "admin",
        status: "aprobado"
      });
      setSimulatedRole("real");
      setIsRolesDropdownOpen(false);
    } catch (e) {
      console.error("Error promoting self inside App.tsx:", e);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleDemoteSelfToPostulante = async () => {
    if (!firebaseUser || !currentUserProfile) return;
    setIsLoadingPortal(true);
    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      await updateDoc(userRef, {
        role: "postulante",
        status: "pendiente"
      });
      setSimulatedRole("real");
      setIsRolesDropdownOpen(false);
    } catch (e) {
      console.error("Error demoting self inside App.tsx:", e);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  // 1. LISTEN TO FIREBASE AUTHENTICATION
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIsLoadingAuth(true);
      if (user) {
        setFirebaseUser(user);
        
        try {
          // Write or Sync profile details in the 'users/{uid}' collection
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          const email = user.email || "";
          const isOwnerAdmin = email.toLowerCase() === "jaminecraft844@gmail.com";

          if (!userDoc.exists()) {
            // New registration default: Postulante - Completed details pending (unless they are the owner)
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split("@")[0] || "Piloto ALR",
              email: email,
              photoURL: user.photoURL || "",
              role: isOwnerAdmin ? "admin" : "postulante",
              status: isOwnerAdmin ? "aprobado" : "completar",
              carPreference: "",
              raceNumber: "",
              steamId: "",
              instagram: "",
              experience: "",
              message: "",
              appliedAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setCurrentUserProfile(newProfile);
          } else {
            // If profile exists but isOwnerAdmin starts with a different metadata, upgrade them to Admin
            const existing = userDoc.data() as UserProfile;
            if (isOwnerAdmin && existing.role !== "admin") {
              await updateDoc(userRef, { role: "admin", status: "aprobado" });
              existing.role = "admin";
              existing.status = "aprobado";
            }
            setCurrentUserProfile(existing);
          }
        } catch (error) {
          console.error("Error setting up user profile in Auth Listener:", error);
        }
      } else {
        setFirebaseUser(null);
        setCurrentUserProfile(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. SUBSCRIBE TO CENTRAL DATABASES (Only if authenticated)
  useEffect(() => {
    if (!firebaseUser) return;

    setIsLoadingPortal(true);

    // Profile listener (Keep profile synced live)
    const unsubscribeProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserProfile(docSnap.data() as UserProfile);
      }
    }, (error) => {
      console.error("Profile onSnapshot error:", error);
      setIsLoadingPortal(false);
      handleDatabaseListenerError(error);
    });

    // All Users listener (essential for showing official rosters & evaluating nominations)
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
      setAllUsers(usersList);
      setIsLoadingPortal(false);
    }, (error) => {
      console.error("Users onSnapshot error:", error);
      setIsLoadingPortal(false);
      handleDatabaseListenerError(error);
    });

    // Settings listener
    const unsubscribeSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(docSnap.data() as { adminOnlySetups: boolean });
      } else {
        // Init default settings if missing
        if (currentUserProfile?.role === "admin") {
          setDoc(doc(db, "settings", "general"), { adminOnlySetups: false }).catch(console.error);
        }
      }
    }, (error) => {
      console.error("Settings onSnapshot error:", error);
      handleDatabaseListenerError(error);
    });

    // News Bulletins listener
    const unsubscribeNews = onSnapshot(collection(db, "news"), async (snapshot) => {
      const newsList: NewsItem[] = [];
      snapshot.forEach((doc) => {
        newsList.push({ id: doc.id, ...doc.data() } as NewsItem);
      });
      if (snapshot.empty) {
        setNews([]);
        const email = firebaseUser?.email || "";
        if (email.toLowerCase() === "jaminecraft844@gmail.com") {
          addDoc(collection(db, "news"), {
            title: "Anuncio de Prueba",
            category: "General",
            content: "¡Hola! Este es un anuncio automático de prueba para confirmar que el sistema funciona.",
            date: new Date().toISOString().split("T")[0],
            author: "Admin",
            authorPhoto: "",
            pinnable: true
          }).catch(console.error);
        }
      } else {
        // Sort news: Pinned news first, then sorted by date (latest first)
        newsList.sort((a, b) => {
          if (a.pinnable && !b.pinnable) return -1;
          if (!a.pinnable && b.pinnable) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setNews(newsList);
      }
    }, (error) => {
      console.error("News onSnapshot error:", error);
      setIsLoadingPortal(false);
      handleDatabaseListenerError(error);
    });

    // Events Season calendar listener
    const unsubscribeEvents = onSnapshot(collection(db, "events"), async (snapshot) => {
      const eventsList: TeamEvent[] = [];
      snapshot.forEach((doc) => {
        eventsList.push({ id: doc.id, ...doc.data() } as TeamEvent);
      });
      if (snapshot.empty) {
        setEvents([]);
        const email = firebaseUser?.email || "";
        if (email.toLowerCase() === "jaminecraft844@gmail.com") {
          addDoc(collection(db, "events"), {
            title: "Gran Premio de Prueba",
            track: "Circuito de Prueba",
            car: "Coche Test",
            type: "Test",
            date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, ""),
            status: "scheduled",
            description: "Evento autogenerado de prueba."
          }).catch(console.error);
        }
      } else {
        setEvents(eventsList);
      }
    }, (error) => {
      console.error("Events onSnapshot error:", error);
      setIsLoadingPortal(false);
      handleDatabaseListenerError(error);
    });

    // RSVP Attendance logs list
    const unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
      const attList: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        attList.push(doc.data() as AttendanceRecord);
      });
      setAttendance(attList);
    }, (error) => {
      console.error("Attendance onSnapshot error:", error);
      setIsLoadingPortal(false);
      handleDatabaseListenerError(error);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeUsers();
      unsubscribeSettings();
      unsubscribeNews();
      unsubscribeEvents();
      unsubscribeAttendance();
    };
  }, [firebaseUser]);

  // 3. SECURE CENTRAL ENTRAINMENT FOR TEAM GARAGE SETUPS (SHARED PADDOCK DRIVE)
  useEffect(() => {
    setIsLoadingCloudSetups(true);
    // Synced under the master namespace "default_user" so ALL accepted pilots are part of the collective box engineering
    const setupsPath = `users/default_user/setups`;
    const templatesPath = `users/default_user/templates`;

    const unsubscribeSetups = onSnapshot(
      collection(db, setupsPath),
      async (snapshot) => {
        const cloudSetups: CarSetup[] = [];
        snapshot.forEach((doc) => {
          cloudSetups.push(doc.data() as CarSetup);
        });

        if (snapshot.empty) {
          setSetups([]);
        } else {
          cloudSetups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSetups(cloudSetups);
        }
        setIsLoadingCloudSetups(false);
      },
      (error) => {
        setIsLoadingCloudSetups(false);
        handleDatabaseListenerError(error);
      }
    );

    const unsubscribeTemplates = onSnapshot(
      collection(db, templatesPath),
      (snapshot) => {
        const cloudTemplates: any[] = [];
        snapshot.forEach((doc) => {
          cloudTemplates.push(doc.data());
        });

        // Dynamic Merger: Combine hardcoded code defaults with user's Firestore overrides & deletions
        let mergedTemplates: SetupTemplate[] = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));

        cloudTemplates.forEach((cloudTpl) => {
          const isBase = DEFAULT_TEMPLATES.some((dt) => dt.id === cloudTpl.id);
          if (isBase) {
            if (cloudTpl.isDeleted) {
              // Intentionally deleted base template: remove from list
              mergedTemplates = mergedTemplates.filter((t) => t.id !== cloudTpl.id);
            } else {
              // Edited base template: override the default structure with the cloud customized one
              // Compare standard fields metadata to see if it's outdated compared to presets.ts
              const baseOption = DEFAULT_TEMPLATES.find((dt) => dt.id === cloudTpl.id);
              if (baseOption) {
                let hasDifference = false;
                
                const updatedCloudTpl = {
                  ...cloudTpl,
                  sections: (cloudTpl.sections || []).map((sec: any) => {
                    const baseSec = baseOption.sections.find((bs) => bs.id === sec.id);
                    if (baseSec && sec.fields) {
                      return {
                        ...sec,
                        fields: sec.fields.map((f: any) => {
                          const baseField = baseSec.fields.find((bf) => bf.id === f.id);
                          if (baseField) {
                            if (
                              f.min !== baseField.min ||
                              f.max !== baseField.max ||
                              f.step !== baseField.step ||
                              f.unit !== baseField.unit ||
                              f.defaultValue !== baseField.defaultValue
                            ) {
                              hasDifference = true;
                              return {
                                ...f,
                                min: baseField.min,
                                max: baseField.max,
                                step: baseField.step,
                                unit: baseField.unit,
                                defaultValue: baseField.defaultValue
                              };
                            }
                          }
                          return f;
                        })
                      };
                    }
                    return sec;
                  })
                };

                if (hasDifference) {
                  // Push updated base template to the merge state
                  mergedTemplates = mergedTemplates.map((t) => 
                    t.id === cloudTpl.id ? updatedCloudTpl : t
                  );
                } else {
                  mergedTemplates = mergedTemplates.map((t) => 
                    t.id === cloudTpl.id ? cloudTpl : t
                  );
                }
              } else {
                mergedTemplates = mergedTemplates.map((t) => 
                  t.id === cloudTpl.id ? cloudTpl : t
                );
              }
            }
          } else {
            // New template created by the user
            if (!cloudTpl.isDeleted) {
              const exists = mergedTemplates.some((t) => t.id === cloudTpl.id);
              if (!exists) {
                mergedTemplates.push(cloudTpl);
              } else {
                mergedTemplates = mergedTemplates.map((t) => 
                  t.id === cloudTpl.id ? cloudTpl : t
                );
              }
            }
          }
        });

        setTemplates(mergedTemplates);
      },
      (error) => {
        handleDatabaseListenerError(error);
      }
    );

    return () => {
      unsubscribeSetups();
      unsubscribeTemplates();
    };
  }, []);

  // 4. GARAGE SETUP MODIFICATION IMPLEMENTATIONS
  const updateCustomSections = async (setup: CarSetup, updatedSections: SetupSection[]) => {
    const setupsPath = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, setupsPath, setup.id), { customSections: updatedSections });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, setupsPath);
    }
  };

  const getEffectiveSections = (setup: CarSetup, baseTemplate: SetupTemplate) => {
    return setup.customSections || baseTemplate.sections;
  };

  const handleCreateSetup = async (title: string, game: string, car: string, track: string, templateId: string, setupType?: string, initialValues?: Record<string, string>) => {
    const sourceTemplate = templates.find((t) => t.id === templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE;

    const valuesRecord: Record<string, string> = {};
    if (sourceTemplate.sections) {
      sourceTemplate.sections.forEach((sec) => {
        if (sec.fields) {
          sec.fields.forEach((f) => {
            valuesRecord[f.id] = (initialValues && initialValues[f.id] !== undefined)
              ? initialValues[f.id]
              : (f.defaultValue || "0");
          });
        }
      });
    }

    const newSetup: CarSetup = {
      id: `setup-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title || "Untitled Setup",
      game: game || "Unknown Game",
      car: car || "Unknown Car",
      track: track || "Unknown Track",
      templateId: templateId || "le-mans-ultimate-base",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      values: valuesRecord,
      customSections: sourceTemplate.sections, // Start by directly embedding the template's sections for editability without polluting globals
      ownerId: firebaseUser?.uid || "default_user",
      creatorName: firebaseUser?.displayName || "Piloto En Pruebas",
    };
    
    if (setupType) {
      newSetup.setupType = setupType;
    }

    const path = `users/default_user/setups`;
    
    // 1. Optimistically update local setups list so the state includes the new setup immediately
    setSetups((prev) => {
      if (prev.some((s) => s.id === newSetup.id)) return prev;
      return [newSetup, ...prev];
    });

    // 2. Instantly transition UI views
    setSelectedSetupId(newSetup.id);
    setGarageView("detail");

    // 3. Perform background Firestore commit without blocking UI transitions
    setDoc(doc(db, path, newSetup.id), newSetup).catch((e) => {
      console.error("Failed to commit created setup to Firestore backend:", e);
      handleFirestoreError(e, OperationType.WRITE, path);
    });
  };

  const handleDeleteSetup = async (id: string) => {
    const targetSetup = setups.find((s) => s.id === id);
    const isOwner = targetSetup && (
      targetSetup.ownerId === firebaseUser?.uid || 
      !targetSetup.ownerId || 
      targetSetup.ownerId === "default_user"
    );
    const isAllowed = isTeamAdmin || isOwner;

    if (!isAllowed) {
      console.warn("No autorizado para eliminar este reglamento.");
      return;
    }

    const path = `users/default_user/setups`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
    if (selectedSetupId === id) {
      setGarageView("hub");
    }
  };

  const handleCreateTemplate = async (title: string, description: string) => {
    const tplId = `template-id-${Date.now()}`;
    const newTpl: SetupTemplate = {
      id: tplId,
      title: title || "Nueva Plantilla",
      description: description || "Sin descripción",
      sections: [
        {
          id: `sec-${Date.now()}`,
          name: "General",
          fields: [
            { id: `field-press-${Date.now()}`, name: "Presión Delantera Izquierda", type: FieldType.NUMBER, min: 10, max: 40, step: 0.5, unit: "psi", defaultValue: "26" }
          ]
        }
      ]
    };
    const path = `users/default_user/templates`;
    try {
      const sanitized = sanitizeForFirestore({ ...newTpl, ownerId: "default_user" });
      await setDoc(doc(db, path, tplId), sanitized);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const path = `users/default_user/templates`;
    try {
      const isBaseTemplate = DEFAULT_TEMPLATES.some((dt) => dt.id === id);
      if (isBaseTemplate) {
        // For base/default templates, mark as deleted instead of purging, to avoid synchronization loop recreating it
        await setDoc(doc(db, path, id), { id, isDeleted: true });
      } else {
        await deleteDoc(doc(db, path, id));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleUpdateTemplate = async (updatedTpl: SetupTemplate) => {
    const path = `users/default_user/templates`;
    
    // Optimistically update templates state immediately for a fast, responsive UI
    setTemplates((prev) => {
      const match = prev.some((t) => t.id === updatedTpl.id);
      if (match) {
        return prev.map((t) => (t.id === updatedTpl.id ? updatedTpl : t));
      }
      return [updatedTpl, ...prev];
    });

    try {
      const sanitized = sanitizeForFirestore({ ...updatedTpl, ownerId: "default_user" });
      await setDoc(doc(db, path, updatedTpl.id), sanitized);
    } catch (e) {
      console.error("Failed to persist updated template to Firestore:", e);
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const targetSetup = setups.find((s) => s.id === id);
    if (!targetSetup) return;

    const path = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, path, id), { isFavorite: !targetSetup.isFavorite });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleUpdateSetupValues = async (updatedValues: Record<string, string>) => {
    if (!selectedSetupId) return;
    const path = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, path, selectedSetupId), {
        values: updatedValues,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleUpdateSetupMeta = async (meta: {
    title: string;
    car: string;
    track: string;
    notes: string;
    lapTime?: string;
    weather?: "Dry" | "Wet" | "Mixed";
    setupType?: string;
  }) => {
    if (!selectedSetupId) return;
    const path = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, path, selectedSetupId), {
        title: meta.title,
        car: meta.car,
        track: meta.track,
        notes: meta.notes,
        lapTime: meta.lapTime || "",
        weather: meta.weather || "Dry",
        setupType: meta.setupType || "",
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const handleAddNewSection = async (sectionName: string) => {
    if (!selectedSetupId) return;
    const activeSetup = setups.find((s) => s.id === selectedSetupId);
    if (!activeSetup) return;

    const baseTemplate = templates.find(t => t.id === activeSetup.templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE;
    const currentSections = getEffectiveSections(activeSetup, baseTemplate);

    const newSec: SetupSection = {
      id: `sec-${Date.now()}`,
      name: sectionName,
      fields: [],
    };
    const updatedSections = [...currentSections, newSec];
    await updateCustomSections(activeSetup, updatedSections);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedSetupId) return;
    const activeSetup = setups.find((s) => s.id === selectedSetupId);
    if (!activeSetup) return;

    const baseTemplate = templates.find(t => t.id === activeSetup.templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE;
    const currentSections = getEffectiveSections(activeSetup, baseTemplate);

    const updatedSections = currentSections.filter((s) => s.id !== sectionId);
    await updateCustomSections(activeSetup, updatedSections);
  };

  const handleAddNewField = async (sectionId: string, fieldData: Omit<SetupField, "id">) => {
    if (!selectedSetupId) return;
    const activeSetup = setups.find((s) => s.id === selectedSetupId);
    if (!activeSetup) return;

    const baseTemplate = templates.find(t => t.id === activeSetup.templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE;
    const currentSections = getEffectiveSections(activeSetup, baseTemplate);

    const newField: SetupField = {
      ...fieldData,
      id: `field-${Date.now()}`,
    };
    
    Object.keys(newField).forEach(key => {
      if (newField[key as keyof SetupField] === undefined) {
        delete newField[key as keyof SetupField];
      }
    });

    const updatedSections = currentSections.map((s) =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    );
    const nextValues = { ...activeSetup.values, [newField.id]: fieldData.defaultValue || "" };

    const setupsPath = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, setupsPath, selectedSetupId), { 
        customSections: updatedSections,
        values: nextValues 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, setupsPath);
    }
  };

  const handleDeleteField = async (sectionId: string, fieldId: string) => {
    if (!selectedSetupId) return;
    const activeSetup = setups.find((s) => s.id === selectedSetupId);
    if (!activeSetup) return;

    const baseTemplate = templates.find(t => t.id === activeSetup.templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE;
    const currentSections = getEffectiveSections(activeSetup, baseTemplate);

    const updatedSections = currentSections.map((sec) =>
      sec.id === sectionId ? { ...sec, fields: sec.fields.filter((f) => f.id !== fieldId) } : sec
    );

    const nextValues = { ...activeSetup.values };
    delete nextValues[fieldId];

    const setupsPath = `users/default_user/setups`;
    try {
      await updateDoc(doc(db, setupsPath, selectedSetupId), { 
        customSections: updatedSections,
        values: nextValues 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, setupsPath);
    }
  };

  const handleImportBackup = async (importedSetups: CarSetup[], importedTemplates: SetupTemplate[]) => {
    const setupsPath = `users/default_user/setups`;
    const templatesPath = `users/default_user/templates`;
    try {
      for (const t of importedTemplates) {
        if (t.isCustom) {
          await setDoc(doc(db, templatesPath, t.id), { ...t, ownerId: "default_user" });
        }
      }
      for (const s of importedSetups) {
        await setDoc(doc(db, setupsPath, s.id), { ...s, ownerId: "default_user" });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, setupsPath);
    }
  };

  // Email & Password Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authEmail || !authPassword) {
      setAuthError("Por favor completa todos los campos.");
      return;
    }
    setIsLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setAuthSuccess("¡Sesión iniciada correctamente!");
    } catch (error: any) {
      console.error("Sign-In error:", error);
      let friendlyMessage = `Error al iniciar sesión: ${error.message || error}`;
      if (error.code === "auth/operation-not-allowed") {
        friendlyMessage = "El proveedor de Correo/Contraseña está desactivado en la consola de Firebase del proyecto. Por favor, actívalo en Firebase Console.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        friendlyMessage = "Correo electrónico o contraseña incorrectos.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "El formato de correo electrónico no es válido.";
      }
      setAuthError(friendlyMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Email & Password Registration (Sign Up)
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authEmail || !authPassword || !authDisplayName) {
      setAuthError("Por favor completa todos los campos requeridos.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setIsLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const user = userCredential.user;
      
      // Update display name setup on Firebase Auth
      await updateProfile(user, { displayName: authDisplayName });

      // Send verification email link dynamically to the newly created user inbox
      try {
        await sendEmailVerification(user);
      } catch (evErr) {
        console.warn("Firebase email verification error, moving forward:", evErr);
      }

      // Save initial profile straight to DB
      const userRef = doc(db, "users", user.uid);
      const email = user.email || authEmail;
      const isOwnerAdmin = email.toLowerCase() === "jaminecraft844@gmail.com";

      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: authDisplayName,
        email: email,
        photoURL: "",
        role: isOwnerAdmin ? "admin" : "postulante",
        status: isOwnerAdmin ? "aprobado" : "completar",
        carPreference: "",
        raceNumber: "",
        steamId: "",
        instagram: "",
        experience: "",
        message: "",
        appliedAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      setCurrentUserProfile(newProfile);
      setAuthSuccess("¡Cuenta de piloto creada correctamente en boxes!");
    } catch (error: any) {
      console.error("Sign-Up error:", error);
      let friendlyMessage = `Error al registrar el piloto: ${error.message || error}`;
      if (error.code === "auth/operation-not-allowed") {
        friendlyMessage = "El proveedor de Correo/Contraseña está desactivado en tu proyecto Firebase. Por favor, actívalo en tu consola de Firebase.";
      } else if (error.code === "auth/email-already-in-use") {
        friendlyMessage = "Este correo electrónico ya está registrado.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "Formato de correo electrónico no válido.";
      } else if (error.code === "auth/weak-password") {
        friendlyMessage = "La contraseña es muy débil (mínimo 6 caracteres).";
      }
      setAuthError(friendlyMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Local Offline Simulation Bypass Mode Handler
  const handleBypassDemo = () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoadingAuth(true);

    const simulatedEmail = authEmail || "piloto.demo@apexlatam.com";
    const simulatedName = authDisplayName || simulatedEmail.split("@")[0] || "Piloto Demo";

    const mockUser = {
      uid: "demo-piloto-uid",
      email: simulatedEmail,
      displayName: simulatedName,
      photoURL: "",
    };

    setFirebaseUser(mockUser);

    const isOwnerAdmin = simulatedEmail.toLowerCase() === "jaminecraft844@gmail.com";
    const mockProfile: UserProfile = {
      uid: "demo-piloto-uid",
      displayName: simulatedName,
      email: simulatedEmail,
      photoURL: "",
      role: isOwnerAdmin ? "admin" : "postulante",
      status: isOwnerAdmin ? "aprobado" : "pendiente",
      carPreference: "",
      raceNumber: "",
      steamId: "",
      instagram: "",
      experience: "",
      message: "",
      appliedAt: new Date().toISOString(),
    };

    setCurrentUserProfile(mockProfile);
    setIsLoadingAuth(false);
    setAuthSuccess("¡Acceso de Prueba Local Inicializado correctamente!");
  };

  // Sign out trigger
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveTab("inicio");
      setIsSandwichMenuOpen(false);
    } catch (error) {
      console.error("Sign-Out error:", error);
    }
  };

  // 5. CONTEXT RESOLUTION OF CURRENT LOGGED-IN ROLES & OVERWRITES
  const getSimulatedProfile = (): UserProfile | null => {
    if (simulatedRole && simulatedRole !== "real") {
      // Force return simulated profile even if DB sync hasn't populated currentUserProfile yet
      return {
        ...(currentUserProfile || {
          uid: firebaseUser?.uid || "mock-id",
          displayName: firebaseUser?.displayName || "Piloto En Pruebas",
          email: firebaseUser?.email || "",
          photoURL: firebaseUser?.photoURL || "",
          carPreference: "",
          raceNumber: "",
          steamId: "",
          instagram: "",
          message: "",
          appliedAt: new Date().toISOString()
        }),
        role: simulatedRole,
        status: simulatedRole === "postulante" ? "pendiente" : "aprobado",
        experience: simulatedRole === "postulante" ? "Iniciado" : simulatedRole === "piloto" ? "Avanzado" : "Elite"
      };
    }

    if (!currentUserProfile) return null;
    return currentUserProfile;
  };

  const resolvedProfile = getSimulatedProfile();
  
  // Roster summaries
  const officialPilotsCount = allUsers.filter(
    (u) => (u.role === "piloto" || u.role === "admin") && u.status === "aprobado"
  ).length;

  const role = resolvedProfile?.role?.toLowerCase() || "";
  const status = resolvedProfile?.status?.toLowerCase() || "";
  
  const isApprovedMember = !!resolvedProfile && (role === "piloto" || role === "admin") && status === "aprobado";
  const isTeamAdmin = !!resolvedProfile && role === "admin";

  const activeSetupDef = setups.find((s) => s.id === selectedSetupId);
  const activeTemplateDef = activeSetupDef
    ? templates.find((t) => t.id === activeSetupDef.templateId) || LE_MANS_ULTIMATE_GT3_TEMPLATE
    : LE_MANS_ULTIMATE_GT3_TEMPLATE;

  // Navigation Options (Sandwich Menu) based on access permissions
  const menuOptions = [
    { id: "inicio", name: "Inicio", icon: Compass, alwaysVisible: true },
    { id: "noticias", name: "Noticias y anuncios", icon: FileText, requiresPilot: true },
    { id: "roster", name: "Roster oficial", icon: Award, requiresPilot: true },
    { id: "temporada", name: "Temporada Standings", icon: Trophy, requiresPilot: true },
    { id: "asistencia", name: "Asistencia RSVP", icon: Clock, requiresPilot: true },
    { id: "garaje", name: "Setups", icon: Sliders, requiresPilot: true },
    { id: "gestion_admin", name: "Gestión Admin", icon: Settings, requiresAdmin: true },
    { id: "evaluar_postulaciones", name: "Evaluar postulaciones", icon: ShieldAlert, requiresAdmin: true },
  ];

  const visibleOptions = menuOptions.filter((opt) => {
    if (opt.id === "inicio" && !isApprovedMember && !isTeamAdmin) return false;
    if (opt.alwaysVisible) return true;
    if (opt.requiresAdmin && isTeamAdmin) return true;
    if (opt.requiresPilot && (isApprovedMember || isTeamAdmin)) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col font-sans select-none antialiased relative">
      {/* Visual background grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 dot-grid z-0"></div>

      {/* Main App Bar / Navigation Header */}
      <header className="h-16 flex items-center bg-transparent z-45 sticky top-0 mt-2 mb-4 mx-4 lg:mx-8">
        <div className="w-full mx-auto flex items-center justify-between gap-4 bg-[#111113]/80 backdrop-blur-xl border border-stone-800/60 rounded-2xl px-4 py-2 shadow-2xl">
          
          {/* Logo ALR */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0 hover:opacity-80 transition-opacity" onClick={() => { setActiveTab("inicio"); setIsSandwichMenuOpen(false); }}>
            <ALRLogo size={32} className="drop-shadow-[0_0_8px_rgba(34,211,238,0.25)]" />
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-2">
                <span className="font-black tracking-widest text-sm text-white uppercase font-display">ALR Paddock</span>
                <span className="text-[8.5px] text-cyan-400 font-mono bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 uppercase tracking-widest font-black hidden md:inline-block">
                  Racing Hub
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Menu (Desktop) */}
          {firebaseUser && (firebaseUser.emailVerified || simulatedRole !== "real" || firebaseUser.email === "jaminecraft844@gmail.com") && (
            <div className="hidden lg:flex items-center justify-center flex-1 gap-1.5 mx-4 overflow-x-auto hide-scrollbar">
              {visibleOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = activeTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setActiveTab(opt.id as TabType); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? "bg-stone-800 text-cyan-400 border border-stone-700 shadow-sm"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* User Sign-In Action */}
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            {firebaseUser ? (
              <div className="flex items-center gap-4">
                {/* Role badge (clean text display) */}
                <div className={`px-2.5 py-1 rounded border text-[10px] font-mono font-bold uppercase tracking-wide ${
                  resolvedProfile?.role === "admin"
                    ? "bg-red-950/10 text-red-400 border-red-950/40"
                    : resolvedProfile?.role === "piloto"
                    ? "bg-cyan-950/10 text-cyan-400 border-cyan-950/40"
                    : "bg-stone-900 text-stone-400 border-stone-800"
                }`}>
                  {resolvedProfile?.role === "admin" ? "ADMIN" : resolvedProfile?.role === "piloto" ? "PILOTO" : "POSTULANTE"}
                </div>

                {/* User Card */}
                <div className="hidden md:flex items-center gap-2.5 bg-[#141416]/90 px-3 py-1.5 rounded-lg border border-stone-850">
                  {firebaseUser.photoURL ? (
                    <img src={firebaseUser.photoURL} alt="V" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#10b981]/25 text-[#10b981] flex items-center justify-center text-[10px] font-bold">
                      {firebaseUser.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <p className="text-stone-300 font-bold max-w-[120px] truncate">{firebaseUser.displayName}</p>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-stone-400 hover:text-red-400 bg-stone-900/60 p-2 rounded-lg border border-stone-850 cursor-pointer"
                  title="Desconectarse"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-950 text-[#66FCF1] border border-cyan-500/20 px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Acceso de Pilotos
              </div>
            )}

            {/* Sandwich Menu trigger button (Mobile & Tablet) */}
            {firebaseUser && (firebaseUser.emailVerified || simulatedRole !== "real" || firebaseUser.email === "jaminecraft844@gmail.com") && (
              <button
                onClick={() => setIsSandwichMenuOpen(!isSandwichMenuOpen)}
                className="lg:hidden p-2 text-stone-400 hover:text-white bg-stone-900 rounded-lg border border-stone-850 cursor-pointer"
              >
                {isSandwichMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Responsive Sandwich menu side-drawer */}
      <AnimatePresence>
        {isSandwichMenuOpen && firebaseUser && (firebaseUser.emailVerified || simulatedRole !== "real" || firebaseUser.email === "jaminecraft844@gmail.com") && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 right-0 w-72 bg-[#0D0D10] border-l border-stone-800 z-50 p-6 flex flex-col justify-between shadow-2xl lg:hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-850 pb-4">
                <div className="flex items-center gap-2">
                  <ALRLogo size={32} />
                  <p className="font-extrabold text-white text-xs font-mono uppercase tracking-widest">MENÚ ALR</p>
                </div>
                <button
                  onClick={() => setIsSandwichMenuOpen(false)}
                  className="p-1 text-stone-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {visibleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = activeTab === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveTab(opt.id as TabType);
                        setIsSandwichMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/20"
                          : "text-stone-400 hover:text-white hover:bg-stone-900/40"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-stone-400" />
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout drawer footer */}
            <div className="border-t border-stone-850 pt-5 space-y-4">
              <div className="flex items-center gap-3">
                {firebaseUser.photoURL && (
                  <img src={firebaseUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <p className="text-white text-xs font-bold leading-none">{firebaseUser.displayName}</p>
                  <span className="text-[9px] text-[#66FCF1] font-mono leading-none mt-1 uppercase block">
                    {resolvedProfile?.role || "Postulante"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full bg-[#1A1113] hover:bg-red-950/20 text-red-400 border border-red-900/30 font-bold py-2.5 rounded-xl text-xs uppercase font-mono cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Body Screen Router */}
      <main className="flex-1 w-full mx-auto px-4 lg:px-8 xl:px-12 py-6 z-10 transition-all duration-300">
        {dbError && dbError.hasError && (
          <div className="mb-6 bg-red-950/30 border border-red-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-500 to-amber-500" />
            <div className="flex items-start gap-3.5 pl-2">
              <span className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 mt-0.5 md:mt-0 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <ShieldAlert className="w-5 h-5 animate-pulse text-red-400" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400 font-mono uppercase tracking-wider">
                  {dbError.isQuota ? "⚠️ PÁGINA NO DISPONIBLE PARA REGISTROS O CAMBIOS HOY (MODO SOLO LECTURA)" : "⚠️ CONEXIÓN DE BASE DE DATOS INACTIVA"}
                </h4>
                <p className="text-xs text-stone-200 leading-relaxed mt-1.5 font-sans">
                  {dbError.isQuota 
                    ? "Hemos alcanzado la cuota de escritura diaria de la base de datos de Google Firebase en nuestro plan de desarrollo. El portal simracing se encuentra congelado temporalmente para guardar nueva información hoy. Tu cuenta de prueba, tu ficha de piloto y las secciones siguen visibles porque la base de datos permite leer lo que ya existe, pero no se registrarán nuevos pilotos, setups o respuestas de asistencia hasta que el límite se reinicie mañana. ¡Sentimos las molestias!"
                    : `Se detectó un inconveniente al conectar con el servidor de la base de datos (${dbError.message}). Los datos cargados actualmente se mantendrán disponibles localmente en tu navegador de forma provisional.`}
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-[10px] text-amber-400/80 font-mono uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Estado: Modo Consulta • Cuota diaria agotada en Spark Plan
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* USER IS NOT LOGGED IN SPLASH SCREEN */}
          {!firebaseUser && !isLoadingAuth && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto text-center space-y-8 py-16"
            >
              <div className="flex justify-center">
                <ALRLogo size={360} className="drop-shadow-[0_0_35px_rgba(88,194,243,0.18)]" />
              </div>

              <div className="space-y-4.5">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display uppercase">
                  APEX LATAM RACING
                </h1>
                <p className="text-stone-400 text-sm md:text-base leading-relaxed font-sans max-w-lg mx-auto">
                  Bienvenido a la plataforma integrada de <strong className="text-white">Apex Latam Racing</strong>. 
                  Inicia sesión para gestionar el <strong className="text-cyan-400 font-medium">Garaje y Reglajes de Setups</strong>, 
                  coordinar tu <strong className="text-cyan-400 font-medium">Asistencia y Carreras</strong> (con horarios sincronizados a tu zona local), 
                  revisar nuestro <strong className="text-cyan-400 font-medium font-mono">Roster</strong> de pilotos oficiales y postularte para competir con nosotros.
                </p>
              </div>

              {/* Login and Registration Card */}
              <div className="bg-[#111113] border border-stone-850 p-6 md:p-8 rounded-2xl relative overflow-hidden flex flex-col shadow-2xl text-left">
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none" />
                
                {/* Form Mode Tabs Selector */}
                <div className="flex border-b border-stone-850 mb-6 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(false);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 pb-3 text-center transition-all cursor-pointer font-bold tracking-wider uppercase ${
                      !isSignUpMode
                        ? "text-cyan-400 border-b-2 border-cyan-400 font-extrabold"
                        : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 pb-3 text-center transition-all cursor-pointer font-bold tracking-wider uppercase ${
                      isSignUpMode
                        ? "text-cyan-400 border-b-2 border-cyan-400 font-extrabold"
                        : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    Registrar Piloto
                  </button>
                </div>

                {/* Form Submissions */}
                <form onSubmit={isSignUpMode ? handleEmailSignUp : handleEmailSignIn} className="space-y-4 font-sans text-stone-300">
                  <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400 mb-2">
                    {isSignUpMode ? "REGISTRO DE FICHA DE PILOTO (CONTRATO ALR)" : "ACCESO AUTORIZADO A BOXES"}
                  </h3>

                  {/* Feedback Alerts */}
                  {authError && (
                    <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-xl text-xs font-mono space-y-3.5 leading-relaxed shadow-lg">
                      <div className="flex items-start gap-2.5">
                        <span className="text-red-500 font-bold text-sm">⚠</span>
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#FF6363] uppercase tracking-wider text-[10px]">Error de Conexión / Registro</p>
                          <p className="text-stone-300">{authError}</p>
                        </div>
                      </div>

                      {/* Explicit interactive solution box for Firebase console configuration */}
                      {(authError.includes("desactivado") || authError.includes("operation-not-allowed")) && (
                        <div className="bg-[#0c0c0e] border border-stone-850 p-3.5 rounded-xl space-y-2.5 mt-2.5">
                          <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider">
                            Pasos para activarlo en Firebase:
                          </p>
                          <ol className="list-decimal list-inside text-[10px] text-stone-400 space-y-1.5 leading-normal">
                            <li>Ve a la pestaña <strong>Sign-in method</strong> de tu consola Firebase.</li>
                            <li>Haz clic en <strong>Agregar nuevo proveedor</strong> &gt; selecciona <strong>Correo electrónico/Contraseña</strong>.</li>
                            <li>Marca <strong>Habilitar</strong> (el primer interruptor) y haz clic en <strong>Guardar</strong>.</li>
                          </ol>
                          <a
                            href="https://console.firebase.google.com/project/gen-lang-client-0321320600/authentication/providers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex justify-center items-center w-full bg-cyan-950 text-[#66FCF1] border border-cyan-500/20 hover:bg-cyan-900 hover:text-white text-[10px] font-mono px-3 py-2 rounded-lg uppercase font-black tracking-wider transition-all mt-1 cursor-pointer"
                          >
                            Abrir Consola de Firebase ↗
                          </a>
                        </div>
                      )}


                    </div>
                  )}

                  {authSuccess && (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-450 p-4 rounded-xl text-xs font-mono space-y-2 leading-relaxed shadow-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div>
                          <p className="font-extrabold text-[#4ADE80] uppercase tracking-wider text-[10px]">Operación Exitosa</p>
                          <p className="text-stone-300">{authSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isSignUpMode && (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        Nombre de Piloto / Indicativo
                      </label>
                      <input
                        type="text"
                        required
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        placeholder="Ej: Pedro González"
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="piloto@apexlatam.com"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                    />
                    {!isSignUpMode && (
                      <span className="text-[9px] text-stone-500 font-mono italic block pt-0.5">
                        Mismo correo/contraseña utilizado al registrarse.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {isSignUpMode ? "CREAR FICHA OFICIAL" : "INGRESAR A BOXES"}
                  </button>
                </form>


              </div>
            </motion.div>
          )}

          {/* IS LOADING SPINNER FOR PRE-LOADING DATA */}
          {(isLoadingAuth || (firebaseUser && isLoadingPortal)) && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-stone-400 font-mono uppercase tracking-widest animate-pulse">Sincronizando con Pistas...</p>
            </div>
          )}

          {/* EMAIL VERIFICATION REQUIRED SCREEN */}
          {firebaseUser && !firebaseUser.emailVerified && simulatedRole === "real" && firebaseUser.email !== "jaminecraft844@gmail.com" && !isLoadingPortal && !isLoadingAuth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto my-10 bg-[#111113] border border-stone-850 rounded-2xl p-6 shadow-2xl relative overflow-hidden font-sans"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-amber-950/40 border border-amber-900/40 rounded-full flex items-center justify-center mx-auto text-amber-400 font-extrabold text-xl animate-bounce">
                  ✉
                </div>
                
                <h2 className="text-stone-100 font-extrabold tracking-tight text-base uppercase font-sans">
                  Verificación de Correo Requerida
                </h2>
                
                <p className="text-stone-400 text-xs leading-relaxed">
                  Para registrarte como piloto real en el club y evitar correos falsos o temporales, debes confirmar que eres dueño de esta dirección. Te hemos enviado un correo de verificación.
                </p>

                <div className="bg-[#0b0b0d] p-3 rounded-lg border border-stone-850 font-mono text-[11px] text-stone-350 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-stone-500 uppercase tracking-wider">Dirección Registrada</span>
                  <span className="text-cyan-400 font-bold break-all">{firebaseUser.email}</span>
                </div>

                {verificationSuccess && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 rounded-lg text-xs font-mono">
                    {verificationSuccess}
                  </div>
                )}

                {verificationError && (
                  <div className="p-2.5 bg-red-955/30 border border-red-900/40 text-red-400 rounded-lg text-xs font-mono">
                    {verificationError}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    onClick={async () => {
                      setVerificationSuccess(null);
                      setVerificationError(null);
                      try {
                        if (auth.currentUser) {
                          await auth.currentUser.reload();
                          setFirebaseUser({ ...auth.currentUser });
                          if (auth.currentUser.emailVerified) {
                            setVerificationSuccess("¡Correo verificado correctamente!");
                          } else {
                            setVerificationError("El correo aún no ha sido verificado. Por favor haz clic en el enlace que te enviamos.");
                          }
                        }
                      } catch (err: any) {
                        console.error("Error al actualizar:", err);
                        setVerificationError("Error al recargar el estado. Inténtalo de nuevo.");
                      }
                    }}
                    className="w-full bg-cyan-950/50 hover:bg-cyan-900/60 text-[#66FCF1] border border-cyan-500/30 rounded-xl py-2.5 text-xs uppercase font-mono tracking-wider font-extrabold transition-all cursor-pointer shadow-md"
                  >
                    🔄 Ya lo he verificado (Actualizar)
                  </button>

                  <button
                    onClick={async () => {
                      setVerificationSuccess(null);
                      setVerificationError(null);
                      try {
                        if (auth.currentUser) {
                          await sendEmailVerification(auth.currentUser);
                          setVerificationSuccess("¡Te hemos enviado un nuevo enlace de verificación! Revisa tu bandeja de entrada y spam.");
                        }
                      } catch (err: any) {
                        setVerificationError("Por favor espera un momento antes de volver a solicitar el reenvío.");
                      }
                    }}
                    className="w-full bg-[#161619] hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-xl py-2 text-xs uppercase font-mono transition-all cursor-pointer"
                  >
                    Reenviar correo de confirmación
                  </button>

                  <div className="border-t border-stone-900 pt-3">
                    <button
                      onClick={() => signOut(auth)}
                      className="text-[11.5px] text-red-400 hover:text-red-300 hover:underline cursor-pointer uppercase font-mono bg-transparent border-0"
                    >
                      🚪 Cerrar sesión / Usar otra cuenta
                    </button>
                  </div>
                </div>

                <p className="text-[9px] text-stone-600 font-mono uppercase tracking-wider pt-2">
                  Soporte Técnico • Apex Latam Racing
                </p>
              </div>
            </motion.div>
          )}

          {/* ACTIVE DISPATCHED VIEWS */}
          {firebaseUser && !isLoadingPortal && !isLoadingAuth && (firebaseUser.emailVerified || simulatedRole !== "real" || firebaseUser.email === "jaminecraft844@gmail.com") && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              
              {/* TAB 1: INICIO */}
              {activeTab === "inicio" && (
                <Inicio
                  currentUserProfile={resolvedProfile}
                  news={news}
                  events={events}
                  setups={setups}
                  onNavigate={(view) => setActiveTab(view as TabType)}
                  pilotsCount={officialPilotsCount}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

              {/* TAB 2: NOTICIAS */}
              {activeTab === "noticias" && (
                <Noticias
                  news={news}
                  currentUserProfile={resolvedProfile}
                  isLoading={false}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

              {/* TAB 3: ROSTER */}
              {activeTab === "roster" && isApprovedMember && (
                <Roster
                  users={allUsers}
                  isLoading={false}
                />
              )}

              {/* TAB 4: TEMPORADA */}
              {activeTab === "temporada" && isApprovedMember && (
                <Temporada
                  events={events}
                  currentUserProfile={resolvedProfile}
                  isLoading={false}
                  pilots={allUsers}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

              {/* TAB 5: GARAJE COLECTIVO */}
              {activeTab === "garaje" && (
                <div className="space-y-6">
                  {/* Garage Hub Context Header */}
                  <div className="flex items-center justify-between border-b border-stone-850 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-cyan-400" />
                        Garaje Técnico Sincronizado ALR
                      </h2>
                      <p className="text-xs text-stone-500 font-mono mt-1 uppercase tracking-wider">
                        Setups • Repositorio Compartido de Reglajes
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFuelCalc(!showFuelCalc)}
                        className={`text-xs px-3 py-2 rounded-lg font-mono flex items-center gap-1.5 transition-all cursor-pointer border
                          ${showFuelCalc 
                            ? "bg-cyan-950/40 border-cyan-500/50 text-[#66FCF1] shadow-[0_0_10px_rgba(102,252,241,0.15)]" 
                            : "bg-[#121619] border-stone-850 text-stone-300 hover:text-[#66FCF1]"}`}
                      >
                        <Fuel className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>⛽ CALCULADORA DE COMBUSTIBLE</span>
                      </button>

                      <button
                        disabled={!isTeamAdmin}
                        onClick={() => {
                          const newStatus = !systemSettings.adminOnlySetups;
                          setDoc(doc(db, "settings", "general"), { adminOnlySetups: newStatus }, { merge: true })
                            .catch(console.error);
                        }}
                        className={`text-xs p-2 rounded-lg text-right font-mono flex items-center gap-1.5 transition-all
                          ${systemSettings.adminOnlySetups 
                            ? "bg-amber-950/40 border border-amber-900/50 text-amber-500" 
                            : "bg-[#121619] border border-cyan-950/40 text-[#66FCF1]"}
                          ${isTeamAdmin ? "cursor-pointer hover:bg-stone-800" : "cursor-default opacity-80"}
                        `}
                      >
                        <Database className={`w-4 h-4 ${systemSettings.adminOnlySetups ? "text-amber-500" : "text-cyan-400"}`} />
                        {systemSettings.adminOnlySetups ? "MODO ADMINS" : "COLECTIVO ACTIVO"}
                      </button>
                    </div>
                  </div>

                  {/* FUEL CALCULATOR OVERLAY / COLLAPSIBLE */}
                  <AnimatePresence>
                    {showFuelCalc && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden z-25 relative mb-2"
                      >
                        <FuelCalculator onClose={() => setShowFuelCalc(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* GARAGE VIEW DECIDER */}
                  <AnimatePresence mode="wait">
                    {garageView === "hub" && (
                      <motion.div key="hub" className="z-10 relative">
                        <SetupHub
                          setups={setups}
                          templates={templates}
                          onSelectSetup={(id) => {
                            setSelectedSetupId(id);
                            setGarageView("detail");
                          }}
                          onDeleteSetup={handleDeleteSetup}
                          onToggleFavorite={handleToggleFavorite}
                          onCreateSetup={handleCreateSetup}
                          onImportBackup={handleImportBackup}
                          onCompareSetups={(idA, idB) => {
                            setSelectedCompareIds([idA, idB]);
                            setGarageView("compare");
                          }}
                          readOnly={dbError?.hasError || (systemSettings.adminOnlySetups ? !isTeamAdmin : false)}
                          isTeamAdmin={isTeamAdmin}
                          isApprovedMember={isApprovedMember}
                          currentUserId={firebaseUser?.uid}
                          onCreateTemplate={handleCreateTemplate}
                          onDeleteTemplate={handleDeleteTemplate}
                          onUpdateTemplate={handleUpdateTemplate}
                        />
                      </motion.div>
                    )}

                    {garageView === "detail" && (
                      <motion.div key="detail">
                        {activeSetupDef ? (
                          <SetupDetail
                            setup={activeSetupDef}
                            template={activeTemplateDef}
                            onGoBack={() => setGarageView("hub")}
                            onUpdateSetupValues={handleUpdateSetupValues}
                            onUpdateSetupMeta={handleUpdateSetupMeta}
                            onAddNewSection={handleAddNewSection}
                            onDeleteSection={handleDeleteSection}
                            onAddNewField={handleAddNewField}
                            onDeleteField={handleDeleteField}
                            readOnly={
                              dbError?.hasError || (systemSettings.adminOnlySetups 
                                ? !isTeamAdmin 
                                : !(isTeamAdmin || !activeSetupDef.ownerId || activeSetupDef.ownerId === firebaseUser?.uid || activeSetupDef.ownerId === "default_user"))
                            }
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-12 text-stone-500">
                            <div className="w-8 h-8 rounded-full border-2 border-[#66FCF1] border-t-transparent animate-spin mb-4" />
                            <p className="font-mono text-xs uppercase tracking-widest">Sincronizando setup...</p>
                            <button onClick={() => setGarageView("hub")} className="mt-6 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded font-mono text-[10px] uppercase font-bold border border-stone-800 transition-all">
                              Retornar a Boxes
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {garageView === "compare" && selectedCompareIds && (
                      <motion.div key="compare">
                        <SetupCompare
                          setupA={setups.find((s) => s.id === selectedCompareIds[0])!}
                          setupB={setups.find((s) => s.id === selectedCompareIds[1])!}
                          templates={templates}
                          onGoBack={() => setGarageView("hub")}
                          onSelectSetup={(id) => {
                            setSelectedSetupId(id);
                            setGarageView("detail");
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* TAB 6: ASISTENCIA */}
              {activeTab === "asistencia" && isApprovedMember && (
                <Asistencia
                  events={events}
                  attendance={attendance}
                  currentUserProfile={resolvedProfile}
                  isLoading={false}
                  pilots={allUsers}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

              {/* TAB 7: GESTION ADMIN */}
              {activeTab === "gestion_admin" && isTeamAdmin && (
                <GestionAdmin
                  users={allUsers}
                  isLoading={false}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

              {/* TAB 8: EVALUAR POSTULACIONES */}
              {activeTab === "evaluar_postulaciones" && isTeamAdmin && (
                <EvaluarPostulaciones
                  users={allUsers}
                  isLoading={false}
                  dbReadOnly={!!dbError?.hasError}
                />
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>



      {/* Welcome Onboarding Modal for New Users */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111113] border border-stone-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8"
            >
              {/* Ambient Background Glows */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4 border-b border-stone-850 pb-5">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl shrink-0">
                    <ALRLogo size={48} className="drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight font-display uppercase">
                      ¡Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">ALR Simracing</span>!
                    </h3>
                    <p className="text-[10px] text-stone-400 font-mono mt-1 uppercase tracking-wider">Apex Latam Racing Hub • Guía de Inicio</p>
                  </div>
                </div>

                <p className="text-sm text-stone-300 leading-relaxed font-sans">
                  Te damos la bienvenida a nuestro paddock digital. Diseñamos esta plataforma exclusiva para gestionar y planificar de manera profesional el desempeño deportivo de nuestra escudería en pista.
                </p>

                <div className="space-y-4 pt-2">
                  <p className="text-xs font-mono font-bold text-[#66FCF1] uppercase tracking-wider">Tu Camino como Piloto ALR:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="bg-[#18181b]/50 border border-stone-850 p-4 rounded-2xl flex gap-3">
                      <span className="p-2 bg-yellow-950/20 text-yellow-500 border border-yellow-500/20 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center font-bold text-sm">1</span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Completa tu Ficha</h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Ingresa a tu perfil, selecciona tus simuladores y coche preferido, y provee tu Steam ID. Es el primer paso obligatorio.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#18181b]/50 border border-stone-850 p-4 rounded-2xl flex gap-3">
                      <span className="p-2 bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center font-bold text-sm">2</span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aprobación de Contrato</h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Los Comisarios recibirán una alerta instantánea en Discord para revisar tu perfil y firmar tu contrato oficial.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#18181b]/50 border border-stone-850 p-4 rounded-2xl flex gap-3">
                      <span className="p-2 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center font-bold text-sm">3</span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Garaje de Setups</h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Accede a los setups colectivos oficiales de la escudería, compara telemetría y sube tus propios reglajes.
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#18181b]/50 border border-stone-850 p-4 rounded-2xl flex gap-3">
                      <span className="p-2 bg-fuchsia-950/20 text-fuchsia-400 border border-fuchsia-500/20 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center font-bold text-sm">4</span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Calendario y RSVP</h4>
                        <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                          Mantente informado sobre las próximas carreras de liga y confirma tu asistencia para planificar estrategias.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="border-t border-stone-850 pt-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                  <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Listo para correr • ALR Paddock v2.0
                  </div>
                  <button
                    onClick={handleCloseOnboarding}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-cyan-500/10 cursor-pointer w-full md:w-auto"
                  >
                    Comenzar mi Carrera
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decorative Paddock Footer */}
      <footer className="border-t border-[#1F1F23]/60 py-5 bg-[#0D0D10]/95 text-stone-500 text-[10.51px] font-mono mt-auto z-10 w-full select-none">
        <div className="w-full px-4 lg:px-8 xl:px-12 flex justify-between h-[40px]">
          {/* Contenido futuro */}
        </div>
      </footer>
    </div>
  );
}
