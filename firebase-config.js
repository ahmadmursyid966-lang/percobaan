// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, onSnapshot, query, orderBy, where, setDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDcNndTobwmrEmVornYccnmMYtcdnJTSZk",
    authDomain: "kelas-6-ja-far.firebaseapp.com",
    projectId: "kelas-6-ja-far",
    storageBucket: "kelas-6-ja-far.firebasestorage.app",
    messagingSenderId: "686575532451",
    appId: "1:686575532451:web:9905790c437ab69743c216",
    measurementId: "G-RD9X79QFEN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, getDoc, onSnapshot, query, orderBy, where, setDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove };
