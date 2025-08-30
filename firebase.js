// firebase.js - Configuração e inicialização do Firebase

// Configuração do Firebase (substitua com suas próprias credenciais)
const firebaseConfig = {
    apiKey: "AIzaSyDPh85FgmCekJEgYqIibowgyEa3zhScHGc",
    authDomain: "hp-valley.firebaseapp.com",
    projectId: "hp-valley",
    storageBucket: "hp-valley.firebasestorage.app",
    messagingSenderId: "662561145881",
    appId: "1:662561145881:web:65be33ee20260c62885688"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Exportar para uso em outros arquivos
window.firebaseDb = db;
window.firebaseAuth = auth;
