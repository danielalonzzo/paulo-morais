import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCROYGriQ-5RWiLVCRwGz9KaDUKE6zNR2w",
    authDomain: "pmorais.pt",
    databaseURL: "https://paulo-morais-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "paulo-morais",
    storageBucket: "paulo-morais.firebasestorage.app",
    messagingSenderId: "431406968000",
    appId: "1:431406968000:web:a759ddc6912639d7c69125",
    measurementId: "G-GYWR102Y9N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
