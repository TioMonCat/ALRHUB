import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createDocs() {
  try {
    const eventRef = await addDoc(collection(db, "events"), {
      title: "Gran Premio de Mónaco - Resultado",
      track: "Circuit de Monaco",
      car: "Porsche 911 GT3 R",
      type: "Sprint",
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: "completed",
      description: "Carrera completada con muy buenos resultados.",
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      results: [
        { position: 1, name: "Piloto 1", time: "1:20:45.321", points: 25 },
        { position: 2, name: "Piloto 2", time: "1:20:50.112", points: 18 },
        { position: 3, name: "Piloto 3", time: "1:21:05.550", points: 15 }
      ]
    });
    console.log("Created completed event doc with ID: ", eventRef.id);

  } catch (error) {
    console.error("Error creating docs: ", error);
  } finally {
    process.exit(0);
  }
}

createDocs();
