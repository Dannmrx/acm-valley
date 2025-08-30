// auth.js - Sistema de autenticação com Firebase

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.initializeAuth();
    }

    initializeAuth() {
        const authContainer = document.getElementById('authContainer');
        const appContent = document.getElementById('appContent');

        // Verificar se há usuário logado no Firebase
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                // Usuário está logado no Firebase
                this.getUserDataFromFirebase(user.uid)
                    .then(() => {
                        authContainer.style.display = 'none';
                        appContent.classList.add('show');
                        this.updateUserInterface();
                    })
                    .catch(error => {
                        console.error('Erro ao carregar dados do usuário:', error);
                        this.logout();
                    });
            } else {
                // Usuário não está logado
                authContainer.style.display = 'flex';
                appContent.classList.remove('show');
                this.currentUser = null;
            }
        });
    }

    async getUserDataFromFirebase(uid) {
        try {
            const userDoc = await firebaseDb.collection('users').doc(uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    uid: uid,
                    ...userData
                };
                
                // Salvar também no localStorage para persistência
                localStorage.setItem('acm_current_user', JSON.stringify(this.currentUser));
                
                return this.currentUser;
            } else {
                // Se não existir documento do usuário, criar um
                const user = firebaseAuth.currentUser;
                if (user) {
                    const userData = {
                        name: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        createdAt: new Date().toISOString()
                    };
                    
                    await firebaseDb.collection('users').doc(user.uid).set(userData);
                    this.currentUser = { uid: user.uid, ...userData };
                    localStorage.setItem('acm_current_user', JSON.stringify(this.currentUser));
                    
                    return this.currentUser;
                }
                throw new Error('Usuário não encontrado');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            throw error;
        }
    }

    async register(userData) {
        const { name, email, phone, passport, password, confirmPassword } = userData;

        // Validações
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }

        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        try {
            // Criar usuário no Firebase Auth
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Salvar dados adicionais no Firestore
            const userInfo = {
                name,
                email,
                phone,
                passport,
                createdAt: new Date().toISOString(),
                appointments: []
            };

            await firebaseDb.collection('users').doc(user.uid).set(userInfo);

            // Atualizar usuário atual
            this.currentUser = {
                uid: user.uid,
                ...userInfo
            };

            // Salvar no localStorage também
            localStorage.setItem('acm_current_user', JSON.stringify(this.currentUser));

            return this.currentUser;
        } catch (error) {
            throw new Error(this.getFirebaseError(error.code));
        }
    }

    async login(email, password) {
        try {
            // Fazer login com Firebase Auth
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Buscar dados adicionais do usuário
            await this.getUserDataFromFirebase(user.uid);
            
            return this.currentUser;
        } catch (error) {
            throw new Error(this.getFirebaseError(error.code));
        }
    }

    async logout() {
        try {
            await firebaseAuth.signOut();
            this.currentUser = null;
            localStorage.removeItem('acm_current_user');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            throw error;
        }
    }

    getFirebaseError(errorCode) {
        const errors = {
            'auth/email-already-in-use': 'E-mail já cadastrado',
            'auth/invalid-email': 'E-mail inválido',
            'auth/operation-not-allowed': 'Operação não permitida',
            'auth/weak-password': 'Senha fraca',
            'auth/user-disabled': 'Usuário desativado',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
        };
        
        return errors[errorCode] || 'Erro desconhecido. Tente novamente.';
    }

    updateUserInterface() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser) {
            userName.textContent = `Olá, ${this.currentUser.name.split(' ')[0]}`;
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=4a6fa5&color=fff&rounded=true&size=40`;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Funções para agendamentos
    async addAppointment(appointmentData) {
        if (!this.currentUser) return false;
        
        try {
            const appointment = {
                ...appointmentData,
                userId: this.currentUser.uid,
                status: 'Pendente',
                createdAt: new Date().toISOString()
            };
            
            // Adicionar ao Firestore
            const docRef = await firebaseDb.collection('appointments').add(appointment);
            
            // Atualizar lista de agendamentos do usuário
            await firebaseDb.collection('users').doc(this.currentUser.uid).update({
                appointments: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            });
            
            return docRef.id;
        } catch (error) {
            console.error('Erro ao adicionar agendamento:', error);
            throw new Error('Erro ao salvar agendamento');
        }
    }

    async getUserAppointments() {
        if (!this.currentUser) return [];
        
        try {
            const snapshot = await firebaseDb
                .collection('appointments')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
                
            const appointments = [];
            snapshot.forEach(doc => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return appointments;
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            throw new Error('Erro ao carregar agendamentos');
        }
    }

    async cancelAppointment(appointmentId) {
        try {
            await firebaseDb.collection('appointments').doc(appointmentId).update({
                status: 'Cancelado',
                cancelledAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            throw new Error('Erro ao cancelar agendamento');
        }
    }
}

// Inicializar sistema de autenticação
let auth;

// Esperar o Firebase estar pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se Firebase foi carregado
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        auth = new AuthSystem();
        window.authSystem = auth; // Para acesso global se necessário
    } else {
        console.error('Firebase não foi carregado corretamente');
        // Mostrar mensagem de erro para o usuário
        const authAlert = document.getElementById('authAlert');
        if (authAlert) {
            authAlert.textContent = 'Erro de configuração. Recarregue a página.';
            authAlert.classList.add('alert-error');
            authAlert.style.display = 'block';
        }
    }
});
