// app.js

let currentUser = null;
let userData = null;

// Função para gerar um avatar com as iniciais do utilizador
const createAvatar = (name) => {
    if (!name) return '';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const context = canvas.getContext('2d');
    context.fillStyle = "#3498db"; // Cor de fundo do avatar
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
        document.getElementById('adminBadge').style.display = userData.isAdmin ? 'inline-block' : 'none';
        document.getElementById('adminInformeControls').style.display = userData.isAdmin ? 'block' : 'none';
    }
};

const renderPageContent = (tabId) => {
    const contentArea = document.getElementById(tabId);
    if (!contentArea) return;

    // Limpa o conteúdo anterior para evitar duplicados
    contentArea.innerHTML = '';

    // Adiciona conteúdo com base na aba
    switch (tabId) {
        case 'home':
            contentArea.innerHTML = `
                <div class="welcome-banner">
                    <div class="welcome-text">
                        <h2>Alta Centro Médico - Valley</h2>
                        <p>Cuidando da sua saúde com excelência e tecnologia.</p>
                    </div>
                    <div class="welcome-icon"><i class="fas fa-heartbeat"></i></div>
                </div>
                <div class="card"><h2>Nossos Serviços</h2></div>`;
            break;
        case 'exams':
            contentArea.innerHTML = `<div class="card"><h2>Agendamento de Exames</h2></div>`;
            break;
        case 'info':
            // O conteúdo dos informes é carregado dinamicamente
            loadAndRenderInformes();
            break;
        case 'appointments':
            contentArea.innerHTML = `<div class="card"><h2>Meus Agendamentos</h2><div id="appointmentsList"></div></div>`;
            loadAndRenderAppointments();
            break;
        // Adicione outros casos conforme necessário
    }
};

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
        if (activeContent) {
            activeContent.classList.add('active');
            renderPageContent(hash);
        }

        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-tab="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        const pageTitle = activeLink ? activeLink.textContent.trim() : 'Início';
        document.getElementById('pageTitle').textContent = pageTitle;

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
            const defaultImage = 'https://images.unsplash.com/photo-1516549655169-98e4a234281e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNTc5fDB8MXxzZWFyY2h8N3x8bWVkaWNhbHxlbnwwfHx8fDE2Mzc2NDIwMzc&ixlib=rb-1.2.1&q=80&w=400';

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
    container.innerHTML = `<p>A carregar agendamentos...</p>`;

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
            html += `<div class="card"><strong>${date}</strong> - ${app.specialty}</div>`;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Erro ao carregar agendamentos: ", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar os seus agendamentos.</p>`;
    }
};


// Lógica do Modal de Informes
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

    const closeEditInformeModal = () => {
        modal.style.display = 'none';
    };

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
                await db.collection('informes').doc(id).update(data);
            } else {
                await db.collection('informes').add(data);
            }
            closeEditInformeModal();
            loadAndRenderInformes();
        } catch (error) {
            console.error("Erro ao salvar informe:", error);
        }
    });
};


// Função de inicialização principal
window.loadAndInitApp = async (user) => {
    currentUser = user;
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
        userData = userDoc.data();
    }
    updateUIForUser();
    handleNavigation();
};

// Função para limpar o estado da aplicação no logout
window.clearApp = () => {
    currentUser = null;
    userData = null;
};


// Event Listeners
window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', () => {
    // A verificação inicial é feita pelo onAuthStateChanged em auth.js
    setupInformesModal();
});
