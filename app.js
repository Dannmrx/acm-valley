// app.js

let currentUser = null;
let userData = null;
let allInformes = [];
const functions = firebase.functions();

// --- FUNÇÕES DE FORMATAÇÃO E UI ---

const formatPhoneInput = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 3) {
        value = value.substring(0, 3) + '-' + value.substring(3, 6);
    }
    input.value = value;
};

const formatPhone = (phone) => {
    if (!phone || phone.length !== 6) return phone;
    return phone.substring(0, 3) + '-' + phone.substring(3);
};

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

        const canManageContent = isAdmin || isModerator || userData.role === 'Diretor-Geral' || userData.role === 'Diretor Presidente';

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
        if (hash === 'doctors') loadAndRenderDoctors();
        if (hash === 'campaigns') loadAndRenderCampaigns();
        if (hash === 'profile') loadAndRenderProfilePage();
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

const setupAppointmentForm = () => {
    const form = document.getElementById('appointmentForm');
    const formCard = document.getElementById('appointmentFormCard');
    const confirmationCard = document.getElementById('confirmationCard');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;

        let imageUrl = null;
        const imageFile = form.examRequestImage.files[0];

        try {
            if (imageFile) {
                const storageRef = firebase.storage().ref();
                const imagePath = `exam_requests/${currentUser.uid}/${new Date().getTime()}_${imageFile.name}`;
                const fileRef = storageRef.child(imagePath);
                
                await fileRef.put(imageFile);
                imageUrl = await fileRef.getDownloadURL();
            }

            const appointmentData = {
                userId: currentUser.uid,
                creatorName: userData.name,       
                creatorEmail: currentUser.email,
                patientName: form.patientName.value,
                patientPassport: form.patientPassport.value,
                patientPhone: form.patientPhone.value.replace(/\D/g, ''),
                appointmentReason: form.appointmentReason.value,
                availability: form.availability.value,
                specialty: form.specialty.value,
                createdAt: new Date(),
                requestImageUrl: imageUrl
            };

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
        formCard.style.display = 'block';
        confirmationCard.style.display = 'none';
    });
};

const setupInformesModal = () => {
    const modal = document.getElementById('editInformeModal');
    const addBtn = document.getElementById('addInformeBtn');

    if (!modal || !addBtn) return;

    const cancelBtn = document.getElementById('cancelInformeBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('informeForm');
    const deleteBtn = document.getElementById('deleteInformeBtn');

    window.openEditInformeModal = async (id = null) => {
        form.reset();
        document.getElementById('informeId').value = id || '';
        if (id) {
            document.getElementById('modalInformeTitle').textContent = 'Editar Informe';
            if (userData.isAdmin) deleteBtn.style.display = 'inline-block';
            const doc = await db.collection('informes').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                form.informeTitulo.value = data.titulo;
                form.informeConteudo.value = data.conteudo;
                form.informeImageURL.value = data.imageURL || '';
            }
        } else {
            document.getElementById('modalInformeTitle').textContent = 'Adicionar Novo Informe';
            deleteBtn.style.display = 'none';
        }
        modal.style.display = 'flex';
    };

    const closeEditInformeModal = () => modal.style.display = 'none';

    addBtn.addEventListener('click', () => openEditInformeModal());
    cancelBtn.addEventListener('click', closeEditInformeModal);
    closeModalBtn.addEventListener('click', closeEditInformeModal);

    deleteBtn.addEventListener('click', () => {
        const id = form.informeId.value;
        if (id) {
            closeEditInformeModal();
            deleteInforme(id);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.informeId.value;
        const data = {
            titulo: form.informeTitulo.value,
            conteudo: form.informeConteudo.value,
            imageURL: form.informeImageURL.value,
        };
        try {
            if (id) {
                await db.collection('informes').doc(id).update({ ...data, dataEdicao: new Date() });
            } else {
                await db.collection('informes').add({ ...data, criadoPor: currentUser.uid, dataCriacao: new Date() });
            }
            closeEditInformeModal();
            if (document.getElementById('info').style.display === 'block') {
                loadAndRenderInformes();
            }
            if (document.getElementById('home').style.display === 'block') {
                loadLatestInformes();
            }
        } catch (error) {
            console.error("Erro ao salvar informe:", error);
        }
    });
};

const setupViewInformeModal = () => {
    const modal = document.getElementById('viewInformeModal');
    if (!modal) return;
    const closeModalBtn = modal.querySelector('.close-modal');

    window.openViewInformeModal = (informeId) => {
        const informe = allInformes.find(i => i.id === informeId);
        if (!informe) return;

        const defaultImage = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';
        
        document.getElementById('viewInformeImage').src = informe.imageURL || defaultImage;
        document.getElementById('viewInformeTitle').textContent = informe.titulo;
        document.getElementById('viewInformeDate').textContent = informe.dataCriacao.toDate().toLocaleDateString('pt-BR');
        document.getElementById('viewInformeContent').textContent = informe.conteudo;

        modal.style.display = 'flex';
    };

    const closeViewInformeModal = () => modal.style.display = 'none';
    closeModalBtn.addEventListener('click', closeViewInformeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeViewInformeModal();
        }
    });
};

const loadAndRenderDoctors = async () => {
    // ... (função sem alterações) ...
};

const setupUserModal = () => {
    // ... (função sem alterações) ...
};

const loadAndRenderCourses = async () => {
    // ... (função sem alterações) ...
};

const renderCourseCard = (course, completedCourses, canManageCourses) => {
    // ... (função sem alterações) ...
};

const setupCourseEventListeners = () => {
    // ... (função sem alterações) ...
};

const setupCourseContentModal = () => {
    // ... (função sem alterações) ...
};

const setupCourseFormModal = () => {
    // ... (função sem alterações) ...
};

const setupCourseModal = () => {
    // ... (função sem alterações) ...
};

const loadAndRenderApprovals = async () => {
    // ... (função sem alterações) ...
};

const loadAndRenderReports = async (showArchived = false) => {
    // ... (função sem alterações) ...
};

const setupReportSelection = () => {
    // ... (função sem alterações) ...
};

const setupSeasonalBanner = async () => {
    // ... (função sem alterações) ...
};

const loadAndRenderCampaigns = async () => {
    // ... (função sem alterações) ...
};

const setupCampaignModal = () => {
    // ... (função sem alterações) ...
};

// --- FUNÇÕES PARA A PÁGINA DE PERFIL ---

const loadAndRenderProfilePage = async () => {
    if (!currentUser || !userData) return;

    // Preencher formulário com dados do usuário
    document.getElementById('profileName').value = userData.name || '';
    document.getElementById('profileEmail').value = userData.email || '';
    document.getElementById('profilePhone').value = formatPhone(userData.phone) || '';
    document.getElementById('profileSpecialty').value = userData.specialty || '';

    // Carregar resumo de cursos concluídos
    const coursesContainer = document.getElementById('profileCompletedCourses');
    coursesContainer.innerHTML = '<p>Carregando...</p>';
    try {
        const completedSnapshot = await db.collection('users').doc(currentUser.uid).collection('completedCourses').where('status', '==', 'approved').get();
        if (completedSnapshot.empty) {
            coursesContainer.innerHTML = '<p>Nenhum curso concluído e aprovado.</p>';
        } else {
            const courseIds = completedSnapshot.docs.map(doc => doc.id);
            const coursesSnapshot = await db.collection('courses').get();
            const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const completedCoursesInfo = allCourses.filter(course => courseIds.includes(course.id));
            
            let coursesHtml = '<ul>';
            completedCoursesInfo.forEach(course => {
                coursesHtml += `<li><i class="fas ${course.icon || 'fa-book'}"></i> ${course.name}</li>`;
            });
            coursesHtml += '</ul>';
            coursesContainer.innerHTML = coursesHtml;
        }
    } catch (error) {
        console.error("Erro ao carregar cursos concluídos:", error);
        coursesContainer.innerHTML = '<p>Erro ao carregar cursos.</p>';
    }

    // Carregar resumo de agendamentos
    const appointmentsContainer = document.getElementById('profileAppointments');
    appointmentsContainer.innerHTML = '<p>Carregando...</p>';
    try {
        const appointmentsSnapshot = await db.collection('appointments').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').limit(5).get();
        if (appointmentsSnapshot.empty) {
            appointmentsContainer.innerHTML = '<p>Nenhum agendamento recente.</p>';
        } else {
            let appointmentsHtml = '<ul>';
            appointmentsSnapshot.forEach(doc => {
                const app = doc.data();
                if (app.createdAt && typeof app.createdAt.toDate === 'function') {
                    const date = app.createdAt.toDate().toLocaleDateString('pt-BR');
                    appointmentsHtml += `<li><i class="fas fa-stethoscope"></i> ${app.specialty} para ${app.patientName} - ${date}</li>`;
                }
            });
            appointmentsHtml += '</ul>';
            appointmentsContainer.innerHTML = appointmentsHtml;
        }
    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        appointmentsContainer.innerHTML = '<p>Erro ao carregar agendamentos.</p>';
    }
};

const setupProfileForm = () => {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProfileBtn');
        const alertBox = document.getElementById('profileAlert');
        saveBtn.disabled = true;
        
        const updatedData = {
            phone: document.getElementById('profilePhone').value.replace(/\D/g, ''),
            specialty: document.getElementById('profileSpecialty').value,
        };

        try {
            await db.collection('users').doc(currentUser.uid).update(updatedData);
            
            userData.phone = updatedData.phone;
            userData.specialty = updatedData.specialty;

            alertBox.textContent = 'Informações atualizadas com sucesso!';
            alertBox.className = 'alert success';
            alertBox.style.display = 'block';

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alertBox.textContent = 'Ocorreu um erro ao salvar. Tente novamente.';
            alertBox.className = 'alert error';
            alertBox.style.display = 'block';
        } finally {
            saveBtn.disabled = false;
            setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
        }
    });
};


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.loadAndInitApp = async (user) => {
    currentUser = user;
    try {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            userData = userDoc.data();
        } else {
            console.warn("Documento do utilizador não encontrado. A criar um perfil básico.");
            const newUserProfile = { name: user.email.split('@')[0], email: user.email, role: 'Utilizador', isAdmin: false, isModerator: false, createdAt: new Date(), crm: Math.floor(100000 + Math.random() * 900000).toString() };
            await userDocRef.set(newUserProfile); 
            userData = newUserProfile; 
        }
    } catch (error) {
        console.error("Erro ao buscar ou criar dados do utilizador:", error);
        userData = null; 
    }
    
    updateUIForUser();
    handleNavigation();
    setupSeasonalBanner();
};

window.clearApp = () => {
    currentUser = null;
    userData = null;
};

// --- LÓGICA DO MENU DE PERFIL ---
const setupProfileDropdown = () => {
    // ... (função sem alterações) ...
};

const setupAvatarModal = () => {
    // ... (função sem alterações) ...
};

const setupPasswordModal = () => {
    // ... (função sem alterações) ...
};

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
    setupProfileForm();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
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
