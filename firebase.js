// firebase.js - Configuração e inicialização do Firebase

// Configuração do Firebase (substitua com suas próprias credenciais)
const firebaseConfig = {
    apiKey: "sua-api-key",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "seu-messaging-sender-id",
    appId: "seu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const db = firebase.firestore();
const auth = firebase.auth();

// Exportar para uso em outros arquivos
window.firebaseDb = db;
window.firebaseAuth = auth;