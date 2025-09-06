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
                        <button class="btn-icon edit-informe"><i class="fas fa-edit"></i></button>
                    </div>` : ''}
                </div>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.edit-informe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.closest('.informe-card').dataset.id;
                openEditInformeModal(id);
            });
        });
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

const showTab = (tabId) => {
    if (!tabId) tabId = 'home';

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        document.getElementById('pageTitle').textContent = activeLink.textContent.trim();
    }

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active');
    } else {
        document.getElementById('home').classList.add('active');
        document.querySelector('.nav-link[data-tab="home"]').classList.add('active');
        document.getElementById('pageTitle').textContent = 'Início';
    }

    if (tabId === 'info') renderInformes();
    if (tabId === 'appointments') renderAppointments();
};

const handleNavigation = () => {
    const hash = window.location.hash.replace('#', '');
    
    if (currentUser) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('appContent').style.display = 'block';
        if (hash === 'login' || hash === 'register' || !hash) {
            showTab('home');
            history.replaceState(null, null, '#home');
        } else {
            showTab(hash);
        }
    } else {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContent').style.display = 'none';
        
        const authTab = (hash === 'register') ? 'register' : 'login';
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${authTab}"]`).classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${authTab}Form`).classList.add('active');
    }
};

const setupTabListeners = () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tabId = e.currentTarget.dataset.tab;
            window.location.hash = tabId;
            
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
            
            document.getElementById('confirmName').textContent = appointmentData.patientName;
            document.getElementById('confirmPassport').textContent = appointmentData.patientPassport;
            document.getElementById('confirmPhone').textContent = appointmentData.patientPhone;
            document.getElementById('confirmSpecialty').textContent = appointmentData.specialty;
            document.getElementById('confirmAvailability').textContent = appointmentData.availability;

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
        updateUIForUser();
    });
};

const setupMobileMenu = () => {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
};

const setupInformesModal = () => {
    const modal = document.getElementById('editInformeModal');
    const addBtn = document.getElementById('addInformeBtn');
    const cancelBtn = document.getElementById('cancelInformeBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('informeForm');
    
    const openModal = (informe = null) => {
        form.reset();
        document.getElementById('informeId').value = '';
        document.getElementById('deleteInformeBtn').style.display = 'none';

        if (informe) {
            document.getElementById('modalInformeTitle').textContent = 'Editar Informe';
            document.getElementById('informeId').value = informe.id;
            document.getElementById('informeTitulo').value = informe.titulo;
            document.getElementById('informeConteudo').value = informe.conteudo;
            document.getElementById('deleteInformeBtn').style.display = 'inline-block';
        } else {
            document.getElementById('modalInformeTitle').textContent = 'Adicionar Novo Informe';
        }
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };

    addBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form['informeId'].value;
        const data = {
            titulo: form['informeTitulo'].value,
            conteudo: form['informeConteudo'].value,
        };

        const btn = form.querySelector('#saveInformeBtn');
        btn.disabled = true;

        try {
            if (id) {
                data.dataEdicao = new Date();
                await db.collection('informes').doc(id).update(data);
            } else {
                data.dataCriacao = new Date();
                await db.collection('informes').add(data);
            }
            closeModal();
            await renderInformes();
        } catch (error) {
            console.error("Erro ao salvar informe:", error);
        } finally {
            btn.disabled = false;
        }
    });
    
    window.openEditInformeModal = async (id) => {
        try {
            const doc = await db.collection('informes').doc(id).get();
            if (doc.exists) {
                openModal({ id: doc.id, ...doc.data() });
            }
        } catch(error) {
            console.error("Erro ao abrir modal:", error);
        }
    };
};

const loadAndInitApp = async (user) => {
    currentUser = user;
    await loadUserData(user.uid);
    updateUIForUser();
    handleNavigation();
};

window.clearApp = () => {
    currentUser = null;
    userData = null;
    document.getElementById('informesList').innerHTML = '';
    document.getElementById('appointmentsList').innerHTML = '';
};

document.addEventListener('DOMContentLoaded', () => {
    setupTabListeners();
    setupAppointmentForm();
    setupMobileMenu();
    setupInformesModal();

    window.addEventListener('hashchange', handleNavigation);
    
    // A lógica em auth.js irá chamar handleNavigation
});
