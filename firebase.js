// firebase.js

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDPh85FgmCekJEgYqIibowgyEa3zhScHGc",
    authDomain: "hp-valley.firebaseapp.com",
    projectId: "hp-valley",
    storageBucket: "hp-valley.appspot.com",
    messagingSenderId: "662561145881",
    appId: "1:662561145881:web:65be33ee20260c62885688"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços e exportar
const auth = firebase.auth();
const db = firebase.firestore();
