// js/app.js

let currentUser = null;
let userData = null;

const isAdmin = () => userData && userData.isAdmin === true;

const showAlert = (message, type) => {
    const alertBox = document.getElementById('alertBox');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
};

const updateUIForUser = () => {
    if (!currentUser || !userData) return;

    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const adminBadge = document.getElementById('adminBadge');
    const adminInformeControls = document.getElementById('adminInformeControls');

    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'U')}&background=3498db&color=fff&size=40`;
    userName.textContent = `Olá, ${userData.name || currentUser.email}`;

    if (isAdmin()) {
        adminBadge.style.display = 'inline-block';
        adminInformeControls.style.display = 'block';
    } else {
        adminBadge.style.display = 'none';
        adminInformeControls.style.display = 'none';
    }

    // Preencher automaticamente o formulário de agendamento
    document.getElementById('patientName').value = userData.name || '';
    document.getElementById('patientPassport').value = userData.passport || '';
    document.getElementById('patientPhone').value = userData.phone || '';
};

const loadUserData = async (uid) => {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            userData = userDoc.data();
        } else {
            console.warn("Documento do utilizador não encontrado no Firestore.");
            userData = { name: currentUser.email, isAdmin: false };
        }
    } catch (error) {
        console.error("Erro ao carregar dados do utilizador:", error);
        userData = { name: currentUser.email, isAdmin: false };
    }
};

const renderInformes = async () => {
    const container = document.getElementById('informesList');
    container.innerHTML = '<p>A carregar informes...</p>';
    try {
        const snapshot = await db.collection('informes').orderBy('dataCriacao', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = '<div class="card"><p>Nenhum informe disponível no momento.</p></div>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const informe = { id: doc.id, ...doc.data() };
            const date = new Date(informe.dataCriacao.seconds * 1000).toLocaleDateString('pt-BR');
            html += `
                <div class="card informe-card" data-id="${informe.id}">
                    <div class="informe-header">
                        <h3>${informe.titulo}</h3>
                        <span class="informe-date">${date}</span>
                    </div>
                    <div class="informe-content"><p>${informe.conteudo.replace(/\n/g, '<br>')}</p></div>
                    ${isAdmin() ? `
                    <div class="informe-actions">
                        <button class="btn-icon edit-informe" data-id="${informe.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-informe" data-id="${informe.id}"><i class="fas fa-trash"></i></button>
                    </div>` : ''}
                </div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar informes:", error);
        container.innerHTML = '<div class="card"><p style="color:red;">Erro ao carregar informes.</p></div>';
    }
};

const renderAppointments = async () => {
    const container = document.getElementById('appointmentsList');
    container.innerHTML = '<p>A carregar agendamentos...</p>';
    try {
        const snapshot = await db.collection('appointments').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = '<div class="card"><p>Você ainda não tem agendamentos.</p></div>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const app = doc.data();
            const date = new Date(app.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
            html += `
                <div class="confirmation-details">
                    <h3><i class="fas fa-calendar-check"></i> ${app.specialty}</h3>
                    <p><strong>Paciente:</strong> ${app.patientName}</p>
                    <p><strong>Status:</strong> <span style="font-weight: bold; color: var(--warning-color);">${app.status === 'pending' ? 'Pendente de Confirmação' : app.status}</span></p>
                    <p><strong>Solicitado em:</strong> ${date}</p>
                </div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        container.innerHTML = '<div class="card"><p style="color:red;">Erro ao carregar agendamentos.</p></div>';
    }
};

const setupTabListeners = () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tabId = e.currentTarget.dataset.tab;
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            document.getElementById('pageTitle').textContent = e.currentTarget.textContent.trim();

            if (tabId === 'info') renderInformes();
            if (tabId === 'appointments') renderAppointments();

            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
};

const setupAppointmentForm = () => {
    const form = document.getElementById('appointmentForm');
    const btn = document.getElementById('submitBtn');
    const spinner = btn.querySelector('.loading-spinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return showAlert('Você precisa estar logado para agendar.', 'error');
        
        const appointmentData = {
            patientName: form['patientName'].value,
            patientPassport: form['patientPassport'].value,
            patientPhone: form['patientPhone'].value,
            appointmentReason: form['appointmentReason'].value,
            availability: form['availability'].value,
            specialty: form['specialty'].value,
            userId: currentUser.uid,
            userName: userData.name,
            userEmail: currentUser.email,
            createdAt: new Date(),
            status: 'pending'
        };

        btn.disabled = true;
        spinner.style.display = 'inline-block';

        try {
            await db.collection('appointments').add(appointmentData);
            document.getElementById('appointmentFormCard').style.display = 'none';
            document.getElementById('confirmationCard').style.display = 'block';
            Object.keys(appointmentData).forEach(key => {
                const span = document.getElementById(`confirm${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (span) span.textContent = appointmentData[key];
            });
        } catch (error) {
            showAlert('Erro ao enviar o seu agendamento. Tente novamente.', 'error');
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    });

    document.getElementById('newAppointmentBtn').addEventListener('click', () => {
        document.getElementById('appointmentFormCard').style.display = 'block';
        document.getElementById('confirmationCard').style.display = 'none';
        form.reset();
        updateUIForUser(); // Preenche novamente os dados do utilizador
    });
};

const setupMobileMenu = () => {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
};

// Função de inicialização principal da aplicação
const loadAndInitApp = async (user) => {
    currentUser = user;
    await loadUserData(user.uid);
    updateUIForUser();

    // Carregar dados da aba ativa
    const activeTab = document.querySelector('.nav-link.active').dataset.tab;
    if (activeTab === 'info') renderInformes();
    if (activeTab === 'appointments') renderAppointments();
};

// Função para limpar a UI no logout
window.clearApp = () => {
    currentUser = null;
    userData = null;
    document.getElementById('informesList').innerHTML = '';
    document.getElementById('appointmentsList').innerHTML = '';
};

// Adiciona os event listeners quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupTabListeners();
    setupAppointmentForm();
    setupMobileMenu();
    // A lógica de autenticação (em auth.js) irá chamar loadAndInitApp
});
