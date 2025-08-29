function switchTab(tabName) {
    const loginTab = document.querySelector('.auth-tab:first-child');
    const registerTab = document.querySelector('.auth-tab:last-child');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tabName === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Sistema de autenticação
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

    hashPassword(password) {
        return btoa(password + 'acm_salt');
    }

    updateUserInterface() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser) {
            userName.textContent = `Olá, ${this.currentUser.name.split(' ')[0]}`;
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=4a6fa5&color=fff`;
        }
    }
}

// Inicializar sistema de autenticação
const auth = new AuthSystem();

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
            const user = auth.login(email, password);
            alert('Login realizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value,
            passport: document.getElementById('registerPassport').value,
            password: document.getElementById('registerPassword').value,
            confirmPassword: document.getElementById('registerConfirmPassword').value
        };

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay
            alert('Cadastro realizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    });
});
