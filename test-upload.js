import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createDocs() {
  try {
    const newsRef = await addDoc(collection(db, "news"), {
      title: "Anuncio de Prueba",
      category: "General",
      content: "¡Hola! Este es un anuncio de prueba.",
      date: new Date().toISOString(),
      author: "Admin",
      authorPhoto: "",
      pinnable: true
    });
    console.log("Created news doc with ID: ", newsRef.id);

    const eventRef = await addDoc(collection(db, "events"), {
      title: "Gran Premio de Prueba",
      track: "Circuito de Prueba",
      car: "Coche Test",
      type: "Test",
      date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      status: "scheduled",
      description: "Evento autogenerado de prueba."
    });
    console.log("Created event doc with ID: ", eventRef.id);

  } catch (error) {
    console.error("Error creating docs: ", error);
  } finally {
    process.exit(0);
  }
}

createDocs();
