// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authAlert = document.getElementById('authAlert');

    const showAuthAlert = (message, type) => {
        authAlert.textContent = message;
        authAlert.className = `alert ${type}`;
        authAlert.style.display = 'block';
        setTimeout(() => { authAlert.style.display = 'none'; }, 5000);
    };

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            window.location.hash = tabName;
        });
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Se o utilizador está logado, a função loadAndInitApp (de app.js) será chamada
            // para carregar os dados e iniciar a navegação da aplicação.
            if (window.loadAndInitApp) {
                await window.loadAndInitApp(user);
            }
        } else {
            // Se o utilizador não está logado, a função handleNavigation (de app.js)
            // irá garantir que o ecrã de autenticação correto é mostrado.
            if (window.handleNavigation) {
                window.handleNavigation();
            }
        }
    });

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
            // onAuthStateChanged irá tratar da navegação para #home
        } catch (error) {
            showAuthAlert('Email ou senha inválidos.', 'error');
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    });

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
            await db.collection('users').doc(userCredential.user.uid).set({
                name, email, phone, passport, isAdmin: false, createdAt: new Date()
            });
            showAuthAlert('Cadastro realizado com sucesso! Por favor, faça o login.', 'success');
            window.location.hash = 'login';
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

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.hash = 'login';
        });
    });
});
