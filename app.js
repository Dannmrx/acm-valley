// app.js

let currentUser = null;
let userData = null;
let allInformes = []; // Armazena todos os informes carregados
const functions = firebase.functions();

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
    context.font = "bold 18px Segoe UI";
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(initials, 20, 21);
    return canvas.toDataURL();
};

const updateUIForUser = () => {
    if (userData) {
        document.getElementById('userName').textContent = `Olá, ${userData.name.split(' ')[0]}`;
        document.getElementById('userAvatar').src = userData.photoURL || createAvatar(userData.name);
        
        const isAdmin = userData.isAdmin === true;
        const isModerator = userData.isModerator === true;
        
        document.getElementById('adminBadge').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('modBadge').style.display = isModerator && !isAdmin ? 'inline-block' : 'none';

        const canManageContent = isAdmin || isModerator;

        document.getElementById('adminInformeControls').style.display = canManageContent ? 'block' : 'none';
        document.getElementById('campaignsNav').style.display = canManageContent ? 'block' : 'none';
        
        const adminCourseControls = document.getElementById('adminCourseControls');
        if (adminCourseControls) {
            adminCourseControls.style.display = canManageContent ? 'flex' : 'none';
        }
        
        const adminViewToggle = document.getElementById('adminViewToggle');
        if (adminViewToggle) {
            adminViewToggle.style.display = canManageContent ? 'inline-flex' : 'none';
        }
    }
};

// --- LÓGICA DE NAVEGAÇÃO (ROTEAMENTO) ---

window.handleNavigation = () => {
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
        appContent.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        const activeContent = document.getElementById(hash);
        if (activeContent) activeContent.style.display = 'block';

        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-tab="${hash}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        document.getElementById('pageTitle').textContent = activeLink ? activeLink.textContent.trim() : 'Início';

        const header = document.querySelector('.header');
        if (hash === 'home') {
            header.classList.remove('header-with-stripe');
        } else {
            header.classList.add('header-with-stripe');
        }

        if (hash === 'home') loadLatestInformes();
        if (hash === 'info') loadAndRenderInformes();
        if (hash === 'appointments') loadAndRenderAppointments();
        if (hash === 'doctors') loadAndRenderDoctors();
        if (hash === 'campaigns') loadAndRenderCampaigns();
        if (hash === 'courses') {
            const coursesList = document.getElementById('coursesList');
            const approvalsList = document.getElementById('approvalsList');
            const reportsList = document.getElementById('reportsList');
            
            coursesList.style.display = 'block';
            approvalsList.style.display = 'none';
            reportsList.style.display = 'none';
            
            document.querySelectorAll('#adminViewToggle button').forEach(btn => btn.classList.remove('active'));
            document.getElementById('viewCoursesBtn').classList.add('active');

            loadAndRenderCourses();
        }

    } else {
        authContainer.style.display = 'flex';
        appContent.classList.remove('active');
        appContent.style.display = 'none';
    }
};

// --- LÓGICA DE DADOS (FIRESTORE) ---

const renderInformesHTML = (container, informesToRender) => {
    if (!container) return;
    if (informesToRender.length === 0) {
        container.innerHTML = `<div class="card"><p>Nenhum informe disponível no momento.</p></div>`;
        return;
    }

    let html = '';
    const canManage = userData.isAdmin || userData.isModerator;
    const canDelete = userData.isAdmin;

    informesToRender.forEach(informe => {
        if (informe.dataCriacao && typeof informe.dataCriacao.toDate === 'function') {
            const date = informe.dataCriacao.toDate().toLocaleDateString('pt-BR');
            const defaultImage = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';
            html += `
            <article class="news-card" data-id="${informe.id}">
                <div class="news-card-image" style="background-image: url('${informe.imageURL || defaultImage}')"></div>
                <div class="news-card-content">
                    <h3>${informe.titulo}</h3>
                    <p>${informe.conteudo.substring(0, 100)}...</p>
                </div>
                <div class="news-card-footer">
                    <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                    ${canManage ? `
                    <div class="admin-actions">
                        <button class="btn-icon edit-informe-btn" data-id="${informe.id}"><i class="fas fa-edit"></i></button>
                        ${canDelete ? `<button class="btn-icon delete-informe-btn" data-id="${informe.id}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>` : ''}
                </div>
            </article>`;
        }
    });
    container.innerHTML = html;

    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', () => {
            const informeId = card.dataset.id;
            openViewInformeModal(informeId);
        });
    });
    
    document.querySelectorAll('.edit-informe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditInformeModal(btn.dataset.id);
        });
    });

    document.querySelectorAll('.delete-informe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteInforme(btn.dataset.id);
        });
    });
};

const loadAndRenderInformes = async () => {
    const container = document.getElementById('informesList');
    if (!container) return;
    container.innerHTML = `<p>A carregar informes...</p>`;
    
    try {
        const snapshot = await db.collection('informes').orderBy('dataCriacao', 'desc').get();
        allInformes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderInformesHTML(container, allInformes);
    } catch (error) {
        console.error("Erro ao carregar informes:", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar os informes.</p>`;
    }
};

const loadLatestInformes = async () => {
    const container = document.getElementById('latestInformesList');
    if (!container) return;
    container.innerHTML = `<p>A carregar informes...</p>`;

    try {
        const snapshot = await db.collection('informes').orderBy('dataCriacao', 'desc').limit(3).get();
        const latestInformes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        latestInformes.forEach(informe => {
            if (!allInformes.some(i => i.id === informe.id)) {
                allInformes.push(informe);
            }
        });

        renderInformesHTML(container, latestInformes);
    } catch (error) {
        console.error("Erro ao carregar últimos informes:", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar os informes.</p>`;
    }
};

const deleteInforme = async (id) => {
    if (confirm('Tem a certeza de que quer excluir este informe? Esta ação não pode ser desfeita.')) {
        try {
            await db.collection('informes').doc(id).delete();
            loadAndRenderInformes();
        } catch (error) {
            console.error("Erro ao excluir informe:", error);
            alert("Ocorreu um erro ao excluir o informe.");
        }
    }
};

const loadAndRenderAppointments = async () => {
    const container = document.getElementById('appointmentsList');
    if (!container || !currentUser) return;
    container.innerHTML = `<div class="card"><p>A carregar agendamentos...</p></div>`;
    try {
        const snapshot = await db.collection('appointments').where('userId', '==', currentUser.uid).get();

        if (snapshot.empty) {
            container.innerHTML = `<div class="card"><p>Você ainda não tem agendamentos solicitados.</p></div>`;
            return;
        }

        const appointments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                appointments.push(data);
            }
        });

        appointments.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

        let html = '';
        if (appointments.length === 0) {
             container.innerHTML = `<div class="card"><p>Você ainda não tem agendamentos solicitados.</p></div>`;
             return;
        }

        appointments.forEach(app => {
            const date = app.createdAt.toDate().toLocaleDateString('pt-BR');
            html += `
            <div class="appointment-card">
                <div class="appointment-card-icon"><i class="fas fa-notes-medical"></i></div>
                <div class="appointment-card-info">
                    <h3>${app.specialty}</h3>
                    <p>Paciente: ${app.patientName}</p>
                    <p class="date">Solicitado em: ${date}</p>
                </div>
            </div>`;
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

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault
