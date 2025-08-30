// app.js - Sistema principal de agendamentos médicos

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

    // Elementos de especialistas
    const toggleEditBtn = document.getElementById('toggleEditBtn');
    const specialistFormContainer = document.getElementById('specialistFormContainer');
    const specialistForm = document.getElementById('specialistForm');
    const cancelSpecialistBtn = document.getElementById('cancelSpecialistBtn');

    // Variáveis de estado
    let editMode = false;
    let specialists = [];

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

    // Inicialização
    initializeApp();

    function initializeApp() {
        setupNumericValidation();
        setupNavigation();
        setupAppointmentForm();
        setupSpecialists();
        
        // Verificar se estamos na aba de agendamentos e carregar
        if (document.getElementById('appointments').classList.contains('active')) {
            renderUserAppointments();
        }
        
        // Inicializar eventos de auth quando estiver pronto
        const checkAuthReady = setInterval(() => {
            if (window.auth) {
                clearInterval(checkAuthReady);
                setupAuthEvents();
                setupLogoutEvent();
            }
        }, 100);
    }

    // ===== CONFIGURAÇÃO DE VALIDAÇÃO NUMÉRICA =====
    function setupNumericValidation() {
        const numericInputs = [
            'registerPhone', 'registerPassport', 'patientPhone', 'patientPassport'
        ];

        numericInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', function() {
                    this.value = this.value.replace(/[^0-9]/g, '');
                });
            }
        });
    }

    // ===== CONFIGURAÇÃO DE NAVEGAÇÃO =====
    function setupNavigation() {
        // Menu toggle for mobile
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
        }
        
        // Navegação entre abas
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                    
                    pageTitle.textContent = this.textContent.trim();
                    
                    // Carregar conteúdo específico da aba
                    if (tabId === 'appointments') {
                        renderUserAppointments();
                    } else if (tabId === 'specialists') {
                        renderSpecialists();
                    }
                });
            });
        }
        
        // Botão para novo agendamento
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', function() {
                confirmationCard.style.display = 'none';
                appointmentFormCard.style.display = 'block';
                if (form) form.reset();
            });
        }
    }

    // ===== CONFIGURAÇÃO DO FORMULÁRIO DE AGENDAMENTO =====
    function setupAppointmentForm() {
        if (!form) return;
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!window.auth) {
                showAlert('Sistema não inicializado. Recarregue a página.', 'error');
                return;
            }
            
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
            
            // Validação
            if (!patientName || !patientPassport || !patientPhone || !appointmentReason || !availability || !specialty) {
                showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
                submitBtn.disabled = false;
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Agendar Exame';
                return;
            }
            
            // Validação numérica
            if (!/^\d+$/.test(patientPhone)) {
                showAlert('O telefone deve conter apenas números.', 'error');
                submitBtn.disabled = false;
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Agendar Exame';
                return;
            }
            
            if (!/^\d+$/.test(patientPassport)) {
                showAlert('O passaporte deve conter apenas números.', 'error');
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
            
            // Construir a mensagem para o Discord
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
                
                if (!response.ok) {
                    throw new Error('Erro ao enviar para Discord');
                }
                
                // Salvar no Firebase
                const appointmentData = {
                    patientName,
                    patientPassport,
                    patientPhone,
                    appointmentReason,
                    availability,
                    specialty
                };
                
                const appointmentId = await auth.addAppointment(appointmentData);
                
                if (appointmentId) {
                    // Mostrar tela de confirmação
                    appointmentFormCard.style.display = 'none';
                    confirmationCard.style.display = 'block';
                } else {
                    throw new Error('Erro ao salvar agendamento');
                }
            } catch (error) {
                console.error('Erro:', error);
                showAlert('Erro ao processar agendamento. Tente novamente.', 'error');
            } finally {
                // Esconder loading
                submitBtn.disabled = false;
                loadingSpinner.style.display = 'none';
                submitText.textContent = 'Agendar Exame';
            }
        });
    }

    // ===== SISTEMA DE AUTENTICAÇÃO =====
    function setupAuthEvents() {
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (!window.auth) {
                    showAuthAlert('Sistema não inicializado. Recarregue a página.', 'error');
                    return;
                }
                
                setAuthLoading('login', true);

                try {
                    const email = document.getElementById('loginEmail').value;
                    const password = document.getElementById('loginPassword').value;

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    const user = await auth.login(email, password);
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
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (!window.auth) {
                    showAuthAlert('Sistema não inicializado. Recarregue a página.', 'error');
                    return;
                }
                
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

                    // Validações
                    if (userData.password !== userData.confirmPassword) {
                        throw new Error('As senhas não coincidem');
                    }

                    if (userData.password.length < 6) {
                        throw new Error('A senha deve ter pelo menos 6 caracteres');
                    }

                    if (!/^\d+$/.test(userData.phone)) {
                        throw new Error('O telefone deve conter apenas números');
                    }

                    if (!/^\d+$/.test(userData.passport)) {
                        throw new Error('O passaporte/RG deve conter apenas números');
                    }

                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    const user = await auth.register(userData);
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
        }
    }

    function setupLogoutEvent() {
        if (logoutBtn && window.auth) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Deseja realmente sair?')) {
                    auth.logout().then(() => {
                        location.reload();
                    }).catch(error => {
                        console.error('Erro no logout:', error);
                    });
                }
            });
        }
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

    function showAuthAlert(message, type) {
        if (!authAlert) return;
        
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
        if (authAlert) {
            authAlert.style.display = 'none';
        }
    }

    // ===== SISTEMA DE AGENDAMENTOS =====
    async function renderUserAppointments() {
        const appointmentsContainer = document.getElementById('appointmentsList');
        if (!appointmentsContainer) return;
        
        if (!window.auth) {
            appointmentsContainer.innerHTML = '<p>Carregando...</p>';
            return;
        }
        
        try {
            const appointments = await auth.getUserAppointments();
            
            if (appointments.length === 0) {
                appointmentsContainer.innerHTML = `
                    <div class="confirmation-details">
                        <p>Você ainda não possui agendamentos.</p>
                        <p>Vá para a aba <a href="#" class="nav-link" data-tab="exams">Exames</a> para agendar sua consulta.</p>
                    </div>
                `;
                
                // Adicionar event listener para os links de navegação
                const navLinks = appointmentsContainer.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const tabId = this.getAttribute('data-tab');
                        switchTab(tabId);
                    });
                });
                
                return;
            }
            
            // Separar agendamentos por status
            const pendingAppointments = appointments.filter(a => a.status === 'Pendente' || a.status === 'Confirmado');
            const pastAppointments = appointments.filter(a => a.status === 'Realizado' || a.status === 'Cancelado');
            
            let html = '';
            
            // Agendamentos pendentes/confirmados
            if (pendingAppointments.length > 0) {
                html += `<h3><i class="fas fa-calendar-check"></i> Próximos Agendamentos</h3>`;
                
                pendingAppointments.forEach(appointment => {
                    const appointmentDate = formatAppointmentDate(appointment.createdAt);
                    html += `
                        <div class="confirmation-details appointment-card">
                            <h4>${appointment.specialty}</h4>
                            <p><strong>Paciente:</strong> ${appointment.patientName}</p>
                            <p><strong>Data do agendamento:</strong> ${appointmentDate}</p>
                            <p><strong>Telefone:</strong> ${appointment.patientPhone}</p>
                            <p><strong>Status:</strong> <span class="status-${appointment.status.toLowerCase()}">${appointment.status}</span></p>
                            ${appointment.status === 'Pendente' ? 
                                `<button class="btn-delete cancel-appointment" data-id="${appointment.id}">Cancelar Agendamento</button>` : 
                                ''}
                        </div>
                    `;
                });
            }
            
            // Histórico de agendamentos
            if (pastAppointments.length > 0) {
                html += `<h3><i class="fas fa-history"></i> Histórico de Agendamentos</h3>`;
                
                pastAppointments.forEach(appointment => {
                    const appointmentDate = formatAppointmentDate(appointment.createdAt);
                    html += `
                        <div class="confirmation-details appointment-card">
                            <p><strong>${appointmentDate}</strong> - ${appointment.specialty} 
                            <span class="status-${appointment.status.toLowerCase()}">(${appointment.status})</span></p>
                            <p><strong>Paciente:</strong> ${appointment.patientName}</p>
                        </div>
                    `;
                });
            }
            
            appointmentsContainer.innerHTML = html;
            
            // Adicionar event listeners para os botões de cancelar
            const cancelButtons = appointmentsContainer.querySelectorAll('.cancel-appointment');
            cancelButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const appointmentId = this.getAttribute('data-id');
                    cancelAppointment(appointmentId);
                });
            });
            
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            appointmentsContainer.innerHTML = `
                <div class="alert alert-error">
                    Erro ao carregar agendamentos. Tente novamente.
                </div>
            `;
        }
    }

    function formatAppointmentDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async function cancelAppointment(appointmentId) {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                const success = await auth.cancelAppointment(appointmentId);
                if (success) {
                    renderUserAppointments();
                    showAlert('Agendamento cancelado com sucesso!', 'success');
                } else {
                    throw new Error('Erro ao cancelar');
                }
            } catch (error) {
                console.error('Erro ao cancelar agendamento:', error);
                showAlert('Erro ao cancelar agendamento. Tente novamente.', 'error');
            }
        }
    }

    // ===== SISTEMA DE ESPECIALISTAS =====
    function setupSpecialists() {
        if (!toggleEditBtn || !specialistForm || !cancelSpecialistBtn) return;
        
        loadSpecialists();
        
        toggleEditBtn.addEventListener('click', toggleEditMode);
        specialistForm.addEventListener('submit', saveSpecialist);
        cancelSpecialistBtn.addEventListener('click', cancelEdit);
        
        // Delegation para botões de editar e excluir
        const specialistsList = document.getElementById('specialistsList');
        if (specialistsList) {
            specialistsList.addEventListener('click', function(e) {
                if (e.target.closest('.edit-specialist')) {
                    const id = e.target.closest('.edit-specialist').dataset.id;
                    editSpecialist(id);
                }
                
                if (e.target.closest('.delete-specialist')) {
                    const id = e.target.closest('.delete-specialist').dataset.id;
                    deleteSpecialist(id);
                }
            });
        }
    }

    function loadSpecialists() {
        const savedSpecialists = localStorage.getItem('acm_specialists');
        if (savedSpecialists) {
            specialists = JSON.parse(savedSpecialists);
        } else {
            // Dados iniciais
            specialists = [
                {
                    id: 1,
                    name: "Dr. Carlos Silva",
                    specialty: "Cardiologista",
                    crm: "CRM: 12345",
                    description: "Formado pela USP com especialização em Harvard"
                },
                {
                    id: 2,
                    name: "Dra. Ana Santos",
                    specialty: "Ortopedista",
                    crm: "CRM: 54321",
                    description: "Especialista em cirurgia de coluna e articulações"
                },
                {
                    id: 3,
                    name: "Dr. Roberto Alves",
                    specialty: "Neurologista",
                    crm: "CRM: 98765",
                    description: "Doutor em neurologia pela UNIFESP"
                }
            ];
            saveSpecialists();
        }
        renderSpecialists();
    }

    function saveSpecialists() {
        localStorage.setItem('acm_specialists', JSON.stringify(specialists));
    }

    function renderSpecialists() {
        const specialistsList = document.getElementById('specialistsList');
        if (!specialistsList) return;
        
        specialistsList.innerHTML = '';
        
        specialists.forEach(specialist => {
            const specialistCard = document.createElement('div');
            specialistCard.className = 'service-card';
            specialistCard.innerHTML = `
                <div class="card-actions">
                    <button class="btn-edit edit-specialist" data-id="${specialist.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete delete-specialist" data-id="${specialist.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="service-icon">
                    <i class="fas fa-user-md"></i>
                </div>
                <h3>${specialist.name}</h3>
                <p>${specialist.specialty} - ${specialist.crm}</p>
                <p>${specialist.description}</p>
            `;
            specialistsList.appendChild(specialistCard);
        });
        
        // Atualizar classe de modo de edição
        if (editMode) {
            specialistsList.classList.add('edit-mode');
            toggleEditBtn.innerHTML = '<i class="fas fa-times"></i> Sair do Modo Edição';
        } else {
            specialistsList.classList.remove('edit-mode');
            toggleEditBtn.innerHTML = '<i class="fas fa-edit"></i> Modo Edição';
        }
    }

    function toggleEditMode() {
        editMode = !editMode;
        renderSpecialists();
        
        // Se saindo do modo edição, esconder o formulário
        if (!editMode) {
            specialistFormContainer.style.display = 'none';
            specialistForm.reset();
        }
    }

    function editSpecialist(id) {
        if (!editMode) return;
        
        const specialist = specialists.find(s => s.id === id);
        if (specialist) {
            document.getElementById('specialistId').value = specialist.id;
            document.getElementById('specialistName').value = specialist.name;
            document.getElementById('specialistSpecialty').value = specialist.specialty;
            document.getElementById('specialistCrm').value = specialist.crm;
            document.getElementById('specialistDescription').value = specialist.description;
            
            document.getElementById('formTitle').textContent = 'Editar Especialista';
            specialistFormContainer.style.display = 'block';
            
            // Scroll para o formulário
            specialistFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function saveSpecialist(e) {
        e.preventDefault();
        
        if (!editMode) return;
        
        const id = document.getElementById('specialistId').value;
        const name = document.getElementById('specialistName').value;
        const specialty = document.getElementById('specialistSpecialty').value;
        const crm = document.getElementById('specialistCrm').value;
        const description = document.getElementById('specialistDescription').value;
        
        if (!name || !specialty || !crm || !description) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        if (id) {
            // Editar existente
            const index = specialists.findIndex(s => s.id === parseInt(id));
            if (index !== -1) {
                specialists[index] = { 
                    id: parseInt(id), 
                    name, 
                    specialty, 
                    crm, 
                    description 
                };
            }
        } else {
            // Adicionar novo
            const newId = specialists.length > 0 ? Math.max(...specialists.map(s => s.id)) + 1 : 1;
            specialists.push({ 
                id: newId, 
                name, 
                specialty, 
                crm, 
                description 
            });
        }
        
        saveSpecialists();
        renderSpecialists();
        cancelEdit();
        
        showAlert('Especialista salvo com sucesso!', 'success');
    }

    function deleteSpecialist(id) {
        if (!editMode) return;
        
        if (confirm('Tem certeza que deseja excluir este especialista?')) {
            specialists = specialists.filter(s => s.id !== id);
            saveSpecialists();
            renderSpecialists();
            showAlert('Especialista excluído com sucesso!', 'success');
        }
    }

    function cancelEdit() {
        specialistForm.reset();
        document.getElementById('specialistId').value = '';
        specialistFormContainer.style.display = 'none';
        document.getElementById('formTitle').textContent = 'Adicionar Novo Especialista';
    }

    // ===== FUNÇÕES UTilitárias =====
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

    function showAlert(message, type) {
        if (!alertBox) return;
        
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

    // Funções globais
    window.switchTab = switchTab;
});

// Inicializar auth se disponível
if (typeof AuthSystem !== 'undefined') {
    window.auth = new AuthSystem();
}
