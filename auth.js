// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');
    const appContent = document.getElementById('appContent');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authAlert = document.getElementById('authAlert');

    // Função para mostrar alertas na tela de autenticação
    const showAuthAlert = (message, type) => {
        authAlert.textContent = message;
        authAlert.className = `alert ${type}`;
        authAlert.style.display = 'block';
        setTimeout(() => { authAlert.style.display = 'none'; }, 5000);
    };

    // Lógica para alternar entre abas de login e registo
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${tabName}Form`).classList.add('active');
        });
    });

    // Monitorizar o estado da autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Utilizador está logado
            await loadAndInitApp(user); // Função principal do app.js
            authContainer.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            // Utilizador está desligado
            authContainer.style.display = 'flex';
            appContent.style.display = 'none';
            if(window.clearApp) {
                window.clearApp(); // Limpa dados da app se o utilizador fizer logout
            }
        }
    });

    // Event listener do formulário de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['loginEmail'].value;
        const password = loginForm['loginPassword'].value;
        const btn = loginForm.querySelector('.auth-btn');
        const spinner = btn.querySelector('.loading-spinner');

        btn.disabled = true;
        spinner.style.display = 'inline-block';

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged irá tratar da mudança de ecrã
        } catch (error) {
            showAuthAlert('Email ou senha inválidos.', 'error');
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    });

    // Event listener do formulário de Registo
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm['registerName'].value;
        const email = registerForm['registerEmail'].value;
        const phone = registerForm['registerPhone'].value;
        const passport = registerForm['registerPassport'].value;
        const password = registerForm['registerPassword'].value;
        const confirmPassword = registerForm['registerConfirmPassword'].value;
        const btn = registerForm.querySelector('.auth-btn');
        const spinner = btn.querySelector('.loading-spinner');

        if (password !== confirmPassword) {
            return showAuthAlert('As senhas não coincidem.', 'error');
        }
        
        btn.disabled = true;
        spinner.style.display = 'inline-block';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // Salvar dados adicionais no Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name, email, phone, passport, isAdmin: false, createdAt: new Date()
            });
            showAuthAlert('Cadastro realizado com sucesso! Por favor, faça o login.', 'success');
            // Mudar para a aba de login
            document.querySelector('.auth-tab[data-tab="login"]').click();
            loginForm.reset();
            registerForm.reset();
        } catch (error) {
            let message = 'Ocorreu um erro ao registar.';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este e-mail já está em uso.';
            } else if (error.code === 'auth/weak-password') {
                message = 'A senha deve ter pelo menos 6 caracteres.';
            }
            showAuthAlert(message, 'error');
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    });

    // Event listener do botão de Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
});
