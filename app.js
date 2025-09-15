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

// ... (todas as outras funções de `renderInformesHTML` a `setupPasswordModal` continuam aqui, sem alterações) ...

// [COLE AQUI O RESTO DO SEU FICHEIRO APP.JS, DESDE A FUNÇÃO renderInformesHTML ATÉ AO FINAL]

// Event Listeners Globais
window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', () => {
    setupInformesModal();
    setupViewInformeModal();
    setupAppointmentForm();
    setupUserModal();
    setupCourseContentModal();
    setupCourseFormModal();
    setupCourseModal();
    setupProfileDropdown();
    setupAvatarModal();
    setupPasswordModal();
    setupCampaignModal();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // <-- ESTA É A LINHA QUE CORRIGE O PROBLEMA
            window.location.hash = e.currentTarget.getAttribute('href');
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });

    const viewCoursesBtn = document.getElementById('viewCoursesBtn');
    const viewApprovalsBtn = document.getElementById('viewApprovalsBtn');
    const sendReportsBtn = document.getElementById('sendReportsBtn');

    const switchAdminView = (activeView) => {
        const coursesList = document.getElementById('coursesList');
        const approvalsList = document.getElementById('approvalsList');
        const reportsList = document.getElementById('reportsList');
        
        coursesList.style.display = 'none';
        approvalsList.style.display = 'none';
        reportsList.style.display = 'none';

        document.querySelectorAll('#adminViewToggle button').forEach(btn => btn.classList.remove('active'));

        if(activeView === 'approvals') {
            approvalsList.style.display = 'block';
            viewApprovalsBtn.classList.add('active');
            loadAndRenderApprovals();
        } else if (activeView === 'reports') {
            reportsList.style.display = 'block';
            sendReportsBtn.classList.add('active');
            loadAndRenderReports();
        } else {
            coursesList.style.display = 'block';
            viewCoursesBtn.classList.add('active');
            loadAndRenderCourses();
        }
    };
    
    viewCoursesBtn.addEventListener('click', () => switchAdminView('courses'));
    viewApprovalsBtn.addEventListener('click', () => switchAdminView('approvals'));
    sendReportsBtn.addEventListener('click', () => switchAdminView('reports'));
});
