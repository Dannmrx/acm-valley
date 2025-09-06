// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authAlert = document.getElementById('authAlert');

    // Função para mostrar alertas na tela de login/registo
    const showAuthAlert = (message, type) => {
        authAlert.textContent = message;
        authAlert.className = `alert ${type}`;
        authAlert.style.display = 'block';
        setTimeout(() => { authAlert.style.display = 'none'; }, 5000);
    };

    // Altera a URL (hash) quando o utilizador clica nas abas de Login/Cadastro
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            window.location.hash = tabName;
        });
    });

    // Observador principal: verifica se o utilizador está logado ou não
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Se estiver logado, inicia a aplicação principal
            await window.loadAndInitApp(user);
        } else {
            // Se não estiver logado, limpa os dados e mostra a tela de login
            if (window.clearApp) {
                window.clearApp();
            }
            // A função handleNavigation (do app.js) vai garantir que a tela de auth seja exibida
            window.handleNavigation(); 
        }
    });

    // Lógica do formulário de Login
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
            // Sucesso! O onAuthStateChanged vai tratar do resto e redirecionar para #home.
        } catch (error) {
            showAuthAlert('Email ou senha inválidos.', 'error');
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    });

    // Lógica do formulário de Registo
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
            // Salva os dados adicionais no Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name, email, phone, passport, isAdmin: false, createdAt: new Date()
            });
            showAuthAlert('Cadastro realizado com sucesso! Por favor, faça o login.', 'success');
            window.location.hash = 'login'; // Redireciona para a aba de login
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

    // Lógica do botão de Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
});
