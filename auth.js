// auth.js - Sistema de autenticação atualizado com Firebase

class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('acm_users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('acm_current_user') || 'null');
        this.initializeAuth();
    }

    initializeAuth() {
        const authContainer = document.getElementById('authContainer');
        const appContent = document.getElementById('appContent');

        // Verificar se há usuário logado no Firebase
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                // Usuário está logado no Firebase
                authContainer.style.display = 'none';
                appContent.classList.add('show');
                
                // Buscar dados adicionais do usuário no Firestore
                this.getUserDataFromFirebase(user.uid);
            } else {
                // Usuário não está logado
                authContainer.style.display = 'flex';
                appContent.classList.remove('show');
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
                this.updateUserInterface();
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
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
            await firebaseDb.collection('users').doc(user.uid).set({
                name,
                email,
                phone,
                passport,
                createdAt: new Date().toISOString()
            });

            // Atualizar usuário atual
            this.currentUser = {
                uid: user.uid,
                name,
                email,
                phone,
                passport
            };

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
            const userDoc = await firebaseDb.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = {
                    uid: user.uid,
                    ...userData
                };
                
                return this.currentUser;
            } else {
                throw new Error('Dados do usuário não encontrados');
            }
        } catch (error) {
            throw new Error(this.getFirebaseError(error.code));
        }
    }

    async logout() {
        try {
            await firebaseAuth.signOut();
            this.currentUser = null;
            localStorage.removeItem('acm_current_user');
            location.reload();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
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
            'auth/wrong-password': 'Senha incorreta'
        };
        
        return errors[errorCode] || 'Erro desconhecido';
    }

    // ... restante do código (updateUserInterface, hashPassword, etc) ...
    
    // Adicione estas funções para trabalhar com agendamentos no Firebase
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
            
            return docRef.id; // Retorna o ID do documento criado
        } catch (error) {
            console.error('Erro ao adicionar agendamento:', error);
            return false;
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
            return [];
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
            return false;
        }
    }
}
