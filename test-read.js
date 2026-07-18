import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const configPath = "./firebase-applet-config.json";
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testRead() {
  try {
    const querySnapshot = await getDocs(collection(db, "news"));
    console.log("Read ok, docs: ", querySnapshot.size);
  } catch (error) {
    console.error("Read Error: ", error);
  }
}

testRead();
