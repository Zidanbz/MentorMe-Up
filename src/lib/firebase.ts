// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "insync-hub",
  "appId": "1:964747994911:web:10f0968bffa7190cc2b22a",
  "storageBucket": "insync-hub.firebasestorage.app",
  "apiKey": "AIzaSyAcrb5zX_3opTl6vGy_EooloI9UtdG2zP0",
  "authDomain": "insync-hub.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "964747994911"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
