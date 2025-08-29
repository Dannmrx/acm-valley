// Sistema de autenticação e gerenciamento de usuários
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('acm_users') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('acm_current_user') || 'null');
        this.initializeAuth();
    }

    initializeAuth() {
        const authContainer = document.getElementById('authContainer');
        const appContent = document.getElementById('appContent');

        if (this.currentUser) {
            authContainer.style.display = 'none';
            appContent.classList.add('show');
            this.updateUserInterface();
        } else {
            authContainer.style.display = 'flex';
            appContent.classList.remove('show');
        }
    }

    register(userData) {
        const { name, email, phone, passport, password, confirmPassword } = userData;

        // Validações
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }

        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        if (this.users.find(user => user.email === email)) {
            throw new Error('E-mail já cadastrado');
        }

        if (this.users.find(user => user.passport === passport)) {
            throw new Error('Passaporte/RG já cadastrado');
        }

        // Criar novo usuário
        const newUser = {
            id: Date.now(),
            name,
            email,
            phone,
            passport,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            appointments: []
        };

        this.users.push(newUser);
        localStorage.setItem('acm_users', JSON.stringify(this.users));

        return newUser;
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('E-mail não encontrado');
        }

        if (user.password !== this.hashPassword(password)) {
            throw new Error('Senha incorreta');
        }

        this.currentUser = { ...user };
        delete this.currentUser.password;
        localStorage.setItem('acm_current_user', JSON.stringify(this.currentUser));

        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('acm_current_user');
        location.reload();
    }

    hashPassword(password) {
        // Simulação de hash (em produção, use bcrypt ou similar)
        return btoa(password + 'acm_salt');
    }

    updateUserInterface() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser) {
            userName.textContent = `Olá, ${this.currentUser.name.split(' ')[0]}`;
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=4a6fa5&color=fff`;
            
            // Preencher dados do usuário no formulário de agendamento (opcional)
            // document.getElementById('patientName').value = this.currentUser.name;
            // document.getElementById('patientPassport').value = this.currentUser.passport;
            // document.getElementById('patientPhone').value = this.currentUser.phone;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Inicializar sistema de autenticação
const auth = new AuthSystem();
