import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAwGoBJngOSH7b7u9gLuBHabw61kbcUi0g",
  authDomain: "escala-2cia.firebaseapp.com",
  projectId: "escala-2cia",
  storageBucket: "escala-2cia.firebasestorage.app",
  messagingSenderId: "784079968523",
  appId: "1:784079968523:web:b22e733f7c5f115e7e6a0e",
  measurementId: "G-VBVLX084JF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);