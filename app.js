document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ App.js carregado - Iniciando inicialização...');

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

    // ===== FUNÇÕES DE AUTENTICAÇÃO =====
    function switchTab(tabName) {
        const loginTab = document.querySelector('.auth-tab:first-child');
        const registerTab = document.querySelector('.auth-tab:last-child');
        const loginFormElement = document.getElementById('loginForm');
        const registerFormElement = document.getElementById('registerForm');

        if (tabName === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginFormElement.classList.add('active');
            registerFormElement.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerFormElement.classList.add('active');
            loginFormElement.classList.remove('active');
        }
        hideAuthAlert();
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

    function setAuthLoading(formType, loading) {
        const btn = formType === 'login' ? document.getElementById('loginBtn') : document.getElementById('registerBtn');
        const spinner = formType === 'login' ? document.getElementById('loginSpinner') : document.getElementById('registerSpinner');
        const text = formType === 'login' ? document.getElementById('loginText') : document.getElementById('registerText');

        if (!btn || !spinner || !text) return;

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

    // ===== FUNÇÃO PARA VERIFICAR SE AUTH ESTÁ PRONTO =====
    async function ensureAuthReady() {
        if (!window.auth) {
            console.warn('Auth não encontrado no window, aguardando...');
            // Esperar um pouco e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!window.auth) {
                throw new Error('Sistema de autenticação não carregado');
            }
        }
        
        try {
            // Verificar se o auth tem o método ensureReady
            if (window.auth.ensureReady && typeof window.auth.ensureReady === 'function') {
                await window.auth.ensureReady();
            } else {
                // Fallback: esperar um pouco se o método ensureReady não existir
                console.warn('Método ensureReady não disponível, usando fallback');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao verificar auth:', error);
            throw new Error('Sistema de autenticação não está pronto');
        }
    }

    // ===== EVENT LISTENERS DE AUTENTICAÇÃO =====
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                await ensureAuthReady();
                setAuthLoading('login', true);

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                // Usar o método login do auth
                const user = await window.auth.login(email, password);
                showAuthAlert('Login realizado com sucesso!', 'success');
                
                setTimeout(() => {
                    document.getElementById('authContainer').style.display = 'none';
                    document.getElementById('appContent').classList.add('show');
                    window.auth.updateUserInterface();
                }, 1000);

            } catch (error) {
                console.error('Erro no login:', error);
                showAuthAlert(error.message, 'error');
            } finally {
                setAuthLoading('login', false);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                await ensureAuthReady();
                setAuthLoading('register', true);

                const userData = {
                    name: document.getElementById('registerName').value,
                    email: document.getElementById('registerEmail').value,
                    phone: document.getElementById('registerPhone').value,
                    passport: document.getElementById('registerPassport').value,
                    password: document.getElementById('registerPassword').value,
                    confirmPassword: document.getElementById('registerConfirmPassword').value
                };

                // Validações adicionais
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

                // Usar o método register do auth
                const user = await window.auth.register(userData);
                showAuthAlert('Cadastro realizado com sucesso! Faça o login.', 'success');
                
                setTimeout(() => {
                    switchTab('login');
                    registerForm.reset();
                }, 2000);

            } catch (error) {
                console.error('Erro no registro:', error);
                showAuthAlert(error.message, 'error');
            } finally {
                setAuthLoading('register', false);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Deseja realmente sair?')) {
                ensureAuthReady().then(() => {
                    window.auth.logout();
                }).catch(error => {
                    console.error('Erro ao fazer logout:', error);
                    showAuthAlert('Erro ao sair. Recarregue a página.', 'error');
                });
            }
        });
    }

    // ===== NAVEGAÇÃO E OUTRAS FUNCIONALIDADES =====
    window.switchTab = switchTab;

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                tabContents.forEach(content => content.classList.remove('active'));
                
                const tabId = this.getAttribute('data-tab');
                const tabElement = document.getElementById(tabId);
                if (tabElement) {
                    tabElement.classList.add('active');
                }
                
                if (pageTitle) {
                    pageTitle.textContent = this.textContent.trim();
                }

                // Carregar conteúdo específico da aba
                if (tabId === 'appointments') {
                    renderUserAppointments();
                }
            });
        });
    }
    
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', function() {
            if (confirmationCard) confirmationCard.style.display = 'none';
            if (appointmentFormCard) appointmentFormCard.style.display = 'block';
            if (form) form.reset();
        });
    }
    
    // ===== FORMULÁRIO DE AGENDAMENTO =====
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                await ensureAuthReady();
                
                const currentUser = window.auth.getCurrentUser();
                if (!currentUser) {
                    showAlert('Você precisa estar logado para agendar exames.', 'error');
                    return;
                }

                const submitBtn = document.getElementById('submitBtn');
                const loadingSpinner = document.getElementById('loadingSpinner');
                const submitText = document.getElementById('submitText');

                if (!submitBtn || !loadingSpinner || !submitText) return;

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
                if (document.getElementById('confirmName')) {
                    document.getElementById('confirmName').textContent = patientName;
                }
                if (document.getElementById('confirmPassport')) {
                    document.getElementById('confirmPassport').textContent = patientPassport;
                }
                if (document.getElementById('confirmPhone')) {
                    document.getElementById('confirmPhone').textContent = patientPhone;
                }
                if (document.getElementById('confirmSpecialty')) {
                    document.getElementById('confirmSpecialty').textContent = specialty;
                }
                if (document.getElementById('confirmAvailability')) {
                    document.getElementById('confirmAvailability').textContent = availability;
                }
                
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
                    
                if (response.ok) {
                try {
                    // Salvar no Firebase usando o método do auth
                    const appointmentData = {
                        patientName,
                        patientPassport,
                        patientPhone,
                        appointmentReason,
                        availability,
                        specialty,
                        status: 'Confirmado', // Status sempre confirmado (sem cancelamento)
                        createdAt: new Date().toISOString()
                    };
                    
                    const appointmentId = await window.auth.addAppointment(appointmentData);
                    
                    if (appointmentId) {
                        // Mostrar tela de confirmação
                        if (appointmentFormCard) appointmentFormCard.style.display = 'none';
                        if (confirmationCard) confirmationCard.style.display = 'block';
                        showAlert('Agendamento realizado com sucesso!', 'success');
                    } else {
                        throw new Error('Erro ao salvar agendamento no banco de dados');
                    }
                } catch (firebaseError) {
                    console.error('Erro no Firebase:', firebaseError);
                    // Mesmo com erro no Firebase, o Discord foi enviado
                        showAlert('Agendamento enviado, mas houve um erro no sistema. Contate o administrador.', 'warning');
                }
            } else {
                const discordError = await response.text();
                console.error('Erro Discord:', discordError);
                throw new Error('Erro ao enviar para o Discord');
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
            } catch (error) {
                console.error('Erro de autenticação:', error);
                showAlert('Erro de sistema. Recarregue a página.', 'error');
            }
        });
    }
    
    // ===== FUNÇÃO PARA RENDERIZAR AGENDAMENTOS =====
    async function renderUserAppointments() {
        const appointmentsContainer = document.getElementById('appointmentsList');
        if (!appointmentsContainer) return;
        
        try {
            await ensureAuthReady();
            const appointments = await window.auth.getUserAppointments();
            
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
            
            // Separar agendamentos por status (removido status de Cancelado)
            const activeAppointments = appointments.filter(a => a.status === 'Confirmado' || a.status === 'Pendente');
            const pastAppointments = appointments.filter(a => a.status === 'Realizado');
            
            let html = '';
            
            // Agendamentos ativos
            if (activeAppointments.length > 0) {
                html += `<h3><i class="fas fa-calendar-check"></i> Agendamentos Confirmados</h3>`;
                
                activeAppointments.forEach(appointment => {
                    const appointmentDate = formatAppointmentDate(appointment.createdAt);
                    html += `
                        <div class="confirmation-details appointment-card">
                            <h4>${appointment.specialty}</h4>
                            <p><strong>Paciente:</strong> ${appointment.patientName}</p>
                            <p><strong>Data do agendamento:</strong> ${appointmentDate}</p>
                            <p><strong>Telefone:</strong> ${appointment.patientPhone}</p>
                            <p><strong>Status:</strong> <span class="status-${appointment.status.toLowerCase()}">${appointment.status}</span></p>
                        </div>
                    `;
                });
            }
            
            // Histórico de agendamentos realizados
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

    // ===== INICIALIZAÇÃO FINAL =====
    console.log('✅ App inicializado. Verificando auth...');
    
    // Verificação inicial com timeout para carregamento
    setTimeout(async () => {
        try {
            await ensureAuthReady();
            console.log('✅ Auth carregado corretamente e pronto para uso');
            
            // Se houver usuário logado, atualizar a interface
            if (window.auth && window.auth.getCurrentUser()) {
                window.auth.updateUserInterface();
            }
        } catch (error) {
            console.warn('Auth não carregado ainda:', error.message);
            console.log('Scripts carregados:', 
                Array.from(document.scripts).map(s => s.src || s.innerHTML.substring(0, 100)));
        }
    }, 2000);
});
