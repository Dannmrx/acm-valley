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

    // Função para trocar entre as abas de Login e Cadastro
    const switchAuthTab = (tabName) => {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const activeTab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        const activeForm = document.getElementById(`${tabName}Form`);
        if (activeForm) activeForm.classList.add('active');
    };
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });

    // Observador principal: a fonte da verdade para o estado de autenticação
    auth.onAuthStateChanged(async (user) => {
        document.body.classList.remove('loading'); // Remove a tela de carregamento

        if (user) {
            // Se o utilizador está logado, inicia a aplicação principal.
            if (window.loadAndInitApp) {
                await window.loadAndInitApp(user);
            }
            
            // CORREÇÃO DEFINITIVA: Após a app estar pronta, verifica se estamos numa página de auth.
            // Se estivermos, navega para a home.
            const currentHash = window.location.hash.replace('#', '');
            if (!currentHash || currentHash === 'login' || currentHash === 'register') {
                window.location.hash = 'home';
            } else {
                // Se já estivermos numa página válida (ex: recarregou em #info),
                // chama o handleNavigation diretamente para renderizar o conteúdo.
                if (window.handleNavigation) {
                    window.handleNavigation();
                }
            }
        } else {
            // Se o utilizador não está logado, limpa os dados e mostra a tela de login.
            if (window.clearApp) window.clearApp();
            
            // Garante que, ao fazer logout ou ao entrar sem sessão, a página de login é mostrada.
            window.location.hash = 'login';
            if (window.handleNavigation) window.handleNavigation();
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
            // Sucesso! O onAuthStateChanged vai tratar de toda a lógica de navegação.
            // A linha que mudava o hash foi REMOVIDA daqui para evitar a corrida.
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
            await db.collection('users').doc(userCredential.user.uid).set({
                name, email, phone, passport, isAdmin: false, createdAt: new Date()
            });
            showAuthAlert('Cadastro realizado com sucesso! Por favor, faça o login.', 'success');
            switchAuthTab('login');
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

    // Garante que a aba de autenticação correta é mostrada ao carregar a página
    const initialAuthHash = window.location.hash.replace('#', '');
    if (initialAuthHash === 'register') {
        switchAuthTab('register');
    } else {
        switchAuthTab('login');
    }
});

