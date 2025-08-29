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


document.addEventListener('DOMContentLoaded', function() {
    // Elementos de autenticação
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');
    const logoutBtn = document.getElementById('logoutBtn');

    // Elementos principais
    const form = document.getElementById('appointmentForm');
    const alertBox = document.getElementById('alertBox');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const appointmentFormCard = document.getElementById('appointmentFormCard');
    const confirmationCard = document.getElementById('confirmationCard');
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    const pageTitle = document.getElementById('pageTitle');

    // Funções de autenticação
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
        hideAuthAlert();
    }

    function showAuthAlert(message, type) {
        authAlert.textContent = message;
        authAlert.className = 'alert';
        
        if (type === 'success') {
            authAlert.classList.add('alert-success');
        } else {
            authAlert.classList.add('alert-error');
        }
        
        authAlert.style.display = 'block';

        setTimeout(() => {
            authAlert.style.display = 'none';
        }, 5000);
    }

    function hideAuthAlert() {
        authAlert.style.display = 'none';
    }

    function setAuthLoading(formType, loading) {
        const btn = formType === 'login' ? document.getElementById('loginBtn') : document.getElementById('registerBtn');
        const spinner = formType === 'login' ? document.getElementById('loginSpinner') : document.getElementById('registerSpinner');
        const text = formType === 'login' ? document.getElementById('loginText') : document.getElementById('registerText');

        if (loading) {
            btn.disabled = true;
            spinner.style.display = 'inline-block';
            text.textContent = formType === 'login' ? 'Entrando...' : 'Cadastrando...';
        } else {
            btn.disabled = false;
            spinner.style.display = 'none';
            text.textContent = formType === 'login' ? 'Entrar' : 'Cadastrar';
        }
    }

    // Event listeners de autenticação
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        setAuthLoading('login', true);

        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
            
            const user = auth.login(email, password);
            showAuthAlert('Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                document.getElementById('authContainer').style.display = 'none';
                document.getElementById('appContent').classList.add('show');
                auth.updateUserInterface();
            }, 1000);

        } catch (error) {
            showAuthAlert(error.message, 'error');
        } finally {
            setAuthLoading('login', false);
        }
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        setAuthLoading('register', true);

        try {
            const userData = {
                name: document.getElementById('registerName').value,
                email: document.getElementById('registerEmail').value,
                phone: document.getElementById('registerPhone').value,
                passport: document.getElementById('registerPassport').value,
                password: document.getElementById('registerPassword').value,
                confirmPassword: document.getElementById('registerConfirmPassword').value
            };

            await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay
            
            const user = auth.register(userData);
            showAuthAlert('Cadastro realizado com sucesso! Faça o login.', 'success');
            
            setTimeout(() => {
                switchTab('login');
                registerForm.reset();
            }, 2000);

        } catch (error) {
            showAuthAlert(error.message, 'error');
        } finally {
            setAuthLoading('register', false);
        }
    });

    logoutBtn.addEventListener('click', function() {
        if (confirm('Deseja realmente sair?')) {
            auth.logout();
        }
    });

    // Fazer switchTab global
    window.switchTab = switchTab;

    // Menu toggle for mobile
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Navegação entre abas
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            pageTitle.textContent = this.textContent.trim();
        });
    });
    
    // Botão para novo agendamento
    newAppointmentBtn.addEventListener('click', function() {
        confirmationCard.style.display = 'none';
        appointmentFormCard.style.display = 'block';
        form.reset();
    });
    
    // Mapeamento das especialidades para as menções do Discord
    const specialtyMentions = {
        "Patologia": "@Patologia",
        "Ortopedia": "@Ortopedia",
        "Psicologia": "@Psicologia",
        "Psiquiatria": "@Psiquiatria",
        "Cardiologia": "@Cardiologia",
        "Oftalmologia": "@Oftalmologia",
        "Proctologia": "@Proctologia",
        "Odontologia": "@Odontologia",
        "Infectologia": "@Infectologia",
        "Clínica Geral": "@ClinicaGeral",
        "Hematologia": "@Hematologia",
        "Cirurgia Geral": "@CirurgiaGeral",
        "Cirurgia Plástica": "@CirurgiaPlastica",
        "Neurologia": "@Neurologia",
        "Urologia": "@Urologia",
        "Nutrição": "@Nutrição",
        "Traumatologia": "@Traumatologia"
    };
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            showAlert('Você precisa estar logado para agendar exames.', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const submitText = document.getElementById('submitText');

        // Mostrar loading
        submitBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        submitText.textContent = 'Agendando...';
        
        // Obter os valores do formulário
        const patientName = document.getElementById('patientName').value;
        const patientPassport = document.getElementById('patientPassport').value;
        const patientPhone = document.getElementById('patientPhone').value;
        const appointmentReason = document.getElementById('appointmentReason').value;
        const availability = document.getElementById('availability').value;
        const specialty = document.getElementById('specialty').value;
        
        // Validação simples
        if (!patientName || !patientPassport || !patientPhone || !appointmentReason || !availability || !specialty) {
            showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            submitText.textContent = 'Agendar Exame';
            return;
        }
        
        // Preencher detalhes da confirmação
        document.getElementById('confirmName').textContent = patientName;
        document.getElementById('confirmPassport').textContent = patientPassport;
        document.getElementById('confirmPhone').textContent = patientPhone;
        document.getElementById('confirmSpecialty').textContent = specialty;
        document.getElementById('confirmAvailability').textContent = availability;
        
        // Obter a menção da especialidade
        const specialtyMention = specialtyMentions[specialty] || specialty;
        
        // Construir a mensagem para o Discord - MODIFICADA para mostrar quem fez o agendamento
        const discordMessage = {
            content: `📑 Nova consulta agendada: 📑 
👤 Agendamento realizado por: ${currentUser.name}
👥 Nome do paciente: ${patientName}
🆔 Passaporte do paciente: ${patientPassport}
📱 Telefone do paciente: ${patientPhone}
➡️ Motivo da Consulta: ${appointmentReason}
➡️ Disponibilidade para se consultar: ${availability}
⚠️ Especialista: ${specialtyMention} ⚠️`
        };
        
        try {
            // URL do webhook do Discord
            const webhookURL = 'https://discord.com/api/webhooks/1410445227969216604/tAiOoujKxFUNYzPZL8Sf4uuzzyIEkoSLAMdm4ObkD2Uq_Adxs_Tb8TabDd7fS0WzL3L4';
            
            // Enviar para o webhook
            const response = await fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(discordMessage),
            });
            
            if (response.ok) {
                // Salvar agendamento no perfil do usuário
                const appointment = {
                    id: Date.now(),
                    patientName,
                    patientPassport,
                    patientPhone,
                    appointmentReason,
                    availability,
                    specialty,
                    createdAt: new Date().toISOString(),
                    status: 'Pendente'
                };

                // Atualizar dados do usuário
                const users = JSON.parse(localStorage.getItem('acm_users') || '[]');
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex].appointments = users[userIndex].appointments || [];
                    users[userIndex].appointments.push(appointment);
                    localStorage.setItem('acm_users', JSON.stringify(users));
                }

                // Mostrar tela de confirmação
                appointmentFormCard.style.display = 'none';
                confirmationCard.style.display = 'block';
            } else {
                console.error('Erro no servidor:', response.status, response.statusText);
                showAlert('Erro ao enviar agendamento. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            showAlert('Erro de conexão. Tente novamente.', 'error');
        } finally {
            // Esconder loading
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
            submitText.textContent = 'Agendar Exame';
        }
    });
    
    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = 'alert';
        
        if (type === 'success') {
            alertBox.classList.add('alert-success');
        } else if (type === 'error') {
            alertBox.classList.add('alert-error');
        }
        
        alertBox.style.display = 'block';
        
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
});
