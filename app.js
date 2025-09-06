// app.js

let currentUser = null;
let userData = null;

// --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

const createAvatar = (name) => {
    if (!name) return '';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const context = canvas.getContext('2d');
    context.fillStyle = "#3498db";
    context.fillRect(0, 0, 40, 40);
    context.font = "18px Segoe UI";
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initials, 20, 20);
    return canvas.toDataURL();
};

const updateUIForUser = () => {
    if (userData) {
        document.getElementById('userName').textContent = `Olá, ${userData.name.split(' ')[0]}`;
        document.getElementById('userAvatar').src = userData.photoURL || createAvatar(userData.name);
        const isAdmin = userData.isAdmin === true;
        document.getElementById('adminBadge').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('adminInformeControls').style.display = isAdmin ? 'block' : 'none';
    }
};

// --- LÓGICA DE NAVEGAÇÃO (ROTEAMENTO) ---

const handleNavigation = () => {
    const hash = window.location.hash.replace('#', '') || (auth.currentUser ? 'home' : 'login');
    const isLoggedIn = !!auth.currentUser;

    const authContainer = document.getElementById('authContainer');
    const appContent = document.getElementById('appContent');
    const authPages = ['login', 'register'];

    if (isLoggedIn && authPages.includes(hash)) {
        window.location.hash = 'home';
        return;
    }
    if (!isLoggedIn && !authPages.includes(hash)) {
        window.location.hash = 'login';
        return;
    }

    if (isLoggedIn) {
        authContainer.style.display = 'none';
        appContent.style.display = 'block';
        
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        const activeContent = document.getElementById(hash);
        if (activeContent) activeContent.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-tab="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        document.getElementById('pageTitle').textContent = activeLink ? activeLink.textContent.trim() : 'Início';

        // Carregar conteúdo dinâmico da aba
        if (hash === 'info') loadAndRenderInformes();
        if (hash === 'appointments') loadAndRenderAppointments();

    } else {
        authContainer.style.display = 'flex';
        appContent.style.display = 'none';

        document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(el => el.classList.remove('active'));
        
        const activeTab = document.querySelector(`.auth-tab[data-tab="${hash}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        const activeForm = document.getElementById(`${hash}Form`);
        if (activeForm) activeForm.classList.add('active');
    }
};

// --- LÓGICA DE DADOS (FIRESTORE) ---

const loadAndRenderInformes = async () => {
    const container = document.getElementById('informesList');
    if (!container) return;
    container.innerHTML = `<p>A carregar informes...</p>`;
    
    try {
        const snapshot = await db.collection('informes').orderBy('dataCriacao', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = `<div class="card"><p>Nenhum informe disponível no momento.</p></div>`;
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const informe = { id: doc.id, ...doc.data() };
            const date = informe.dataCriacao.toDate().toLocaleDateString('pt-BR');
            const defaultImage = 'https://via.placeholder.com/400x200.png?text=Noticia';
            html += `
            <article class="news-card" data-id="${informe.id}">
                <div class="news-card-image" style="background-image: url('${informe.imageURL || defaultImage}')"></div>
                <div class="news-card-content">
                    <h3>${informe.titulo}</h3>
                    <p>${informe.conteudo.substring(0, 100)}...</p>
                </div>
                <div class="news-card-footer">
                    <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                    ${userData && userData.isAdmin ? `<button class="btn-icon edit-informe-btn" data-id="${informe.id}"><i class="fas fa-edit"></i></button>` : ''}
                </div>
            </article>`;
        });
        container.innerHTML = html;
        
        document.querySelectorAll('.edit-informe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditInformeModal(btn.dataset.id);
            });
        });
    } catch (error) {
        console.error("Erro ao carregar informes:", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar os informes.</p>`;
    }
};

const loadAndRenderAppointments = async () => {
    const container = document.getElementById('appointmentsList');
    if (!container || !currentUser) return;
    container.innerHTML = `<div class="card"><p>A carregar agendamentos...</p></div>`;
    try {
        const snapshot = await db.collection('appointments').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = `<div class="card"><p>Você ainda não tem agendamentos.</p></div>`;
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const app = doc.data();
            const date = app.createdAt.toDate().toLocaleDateString('pt-BR');
            html += `<div class="card"><strong>${date}</strong> - ${app.specialty} (Paciente: ${app.patientName})</div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar agendamentos: ", error);
        container.innerHTML = `<div class="card"><p>Ocorreu um erro ao carregar os seus agendamentos.</p></div>`;
    }
};

const setupAppointmentForm = () => {
    const form = document.getElementById('appointmentForm');
    const formCard = document.getElementById('appointmentFormCard');
    const confirmationCard = document.getElementById('confirmationCard');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;

        const appointmentData = {
            userId: currentUser.uid,
            patientName: form.patientName.value,
            patientPassport: form.patientPassport.value,
            patientPhone: form.patientPhone.value,
            appointmentReason: form.appointmentReason.value,
            availability: form.availability.value,
            specialty: form.specialty.value,
            createdAt: new Date(),
        };

        try {
            await db.collection('appointments').add(appointmentData);
            document.getElementById('confirmName').textContent = appointmentData.patientName;
            document.getElementById('confirmSpecialty').textContent = appointmentData.specialty;
            formCard.style.display = 'none';
            confirmationCard.style.display = 'block';
        } catch (error) {
            console.error("Erro ao agendar:", error);
            const alertBox = document.getElementById('alertBox');
            alertBox.textContent = "Erro ao agendar. Tente novamente.";
            alertBox.className = "alert error";
            alertBox.style.display = 'block';
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById('newAppointmentBtn').addEventListener('click', () => {
        form.reset();
        // Preencher novamente os dados do utilizador logado
        if (userData) {
            form.patientName.value = userData.name || '';
            form.patientPassport.value = userData.passport || '';
            form.patientPhone.value = userData.phone || '';
        }
        formCard.style.display = 'block';
        confirmationCard.style.display = 'none';
    });
};


// --- LÓGICA DO MODAL ---
const setupInformesModal = () => {
    const modal = document.getElementById('editInformeModal');
    const addBtn = document.getElementById('addInformeBtn');
    const cancelBtn = document.getElementById('cancelInformeBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('informeForm');

    window.openEditInformeModal = async (id = null) => {
        form.reset();
        document.getElementById('informeId').value = id || '';
        if (id) {
            document.getElementById('modalInformeTitle').textContent = 'Editar Informe';
            const doc = await db.collection('informes').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                form.informeTitulo.value = data.titulo;
                form.informeConteudo.value = data.conteudo;
                form.informeImageURL.value = data.imageURL || '';
            }
        } else {
            document.getElementById('modalInformeTitle').textContent = 'Adicionar Novo Informe';
        }
        modal.style.display = 'flex';
    };

    const closeEditInformeModal = () => modal.style.display = 'none';

    addBtn.addEventListener('click', () => openEditInformeModal());
    cancelBtn.addEventListener('click', closeEditInformeModal);
    closeModalBtn.addEventListener('click', closeEditInformeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.informeId.value;
        const data = {
            titulo: form.informeTitulo.value,
            conteudo: form.informeConteudo.value,
            imageURL: form.informeImageURL.value,
            dataCriacao: new Date()
        };
        try {
            if (id) {
                await db.collection('informes').doc(id).update({ ...data, dataEdicao: new Date() });
            } else {
                await db.collection('informes').add({ ...data, criadoPor: currentUser.uid });
            }
            closeEditInformeModal();
            loadAndRenderInformes();
        } catch (error) {
            console.error("Erro ao salvar informe:", error);
        }
    });
};

// --- INICIALIZAÇÃO DA APLICAÇÃO ---

window.loadAndInitApp = async (user) => {
    currentUser = user;
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) userData = userDoc.data();
    
    // Preencher formulário de agendamento com dados do utilizador
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm && userData) {
        appointmentForm.patientName.value = userData.name || '';
        appointmentForm.patientPassport.value = userData.passport || '';
        appointmentForm.patientPhone.value = userData.phone || '';
    }

    updateUIForUser();
    handleNavigation();
};

window.clearApp = () => {
    currentUser = null;
    userData = null;
};

// Event Listeners Globais
window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', () => {
    // A verificação inicial é feita pelo onAuthStateChanged em auth.js
    setupInformesModal();
    setupAppointmentForm();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
});
