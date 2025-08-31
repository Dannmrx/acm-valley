// firebase.js - Configuração e inicialização do Firebase

// Verificar se o Firebase SDK foi carregado corretamente
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK não foi carregado! Verifique os scripts no HTML.');
    throw new Error('Firebase SDK não carregado');
}

console.log('✅ Firebase SDK carregado com sucesso');

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDPh85FgmCekJEgYqIibowgyEa3zhScHGc",
    authDomain: "hp-valley.firebaseapp.com",
    projectId: "hp-valley",
    storageBucket: "hp-valley.firebasestorage.app",
    messagingSenderId: "662561145881",
    appId: "1:662561145881:web:65be33ee20260c62885688"
};

// Inicializar Firebase apenas se não foi inicializado
let app;
let db;
let auth;

// Promessa para garantir que o Firebase está pronto
window.firebaseReady = new Promise((resolve, reject) {
    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso');
        } else {
            app = firebase.app(); // Usar app já existente
            console.log('✅ Firebase já estava inicializado, usando instância existente');
        }

        // Inicializar serviços
        db = firebase.firestore();
        auth = firebase.auth();

        // Exportar para uso em outros arquivos
        window.firebaseDb = db;
        window.firebaseAuth = auth;

        console.log('✅ Serviços do Firebase inicializados:');
        console.log('   - Firestore:', typeof db);
        console.log('   - Auth:', typeof auth);

        resolve({ db, auth });
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        reject(error);
    }
});

// Função para verificar se o Auth está pronto
window.waitForAuth = function() {
    return new Promise((resolve, reject) {
        const checkAuth = () => {
            if (auth && typeof auth === 'object') {
                console.log('✅ Auth está pronto para uso');
                resolve(auth);
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        
        checkAuth();
        
        // Timeout após 10 segundos
        setTimeout(() => {
            reject(new Error('Auth não carregado após 10 segundos'));
        }, 10000);
    });
};

// Verificar se tudo foi carregado corretamente
setTimeout(() => {
    console.log('✅ Firebase status final:');
    console.log('   - Firebase:', typeof firebase);
    console.log('   - Firestore:', typeof firebaseDb);
    console.log('   - Auth:', typeof firebaseAuth);
}, 1000);
