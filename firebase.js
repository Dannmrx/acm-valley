// firebase.js

// A sua configuração do Firebase, que conecta o seu site ao seu projeto.
const firebaseConfig = {
    apiKey: "AIzaSyDPh85FgmCekJEgYqIibowgyEa3zhScHGc",
    authDomain: "hp-valley.firebaseapp.com",
    projectId: "hp-valley",
    storageBucket: "hp-valley.appspot.com",
    messagingSenderId: "662561145881",
    appId: "1:662561145881:web:65be33ee20260c62885688"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Disponibiliza os serviços do Firebase (Autenticação, Banco de Dados e Armazenamento)
// para serem usados noutros ficheiros (auth.js e app.js).
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
