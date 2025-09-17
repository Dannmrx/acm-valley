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
        if (hash === 'appointments') loadAndRenderAppointments();
        if (hash === 'doctors') loadAndRenderDoctors();
        if (hash === 'campaigns') loadAndRenderCampaigns();
        if (hash === 'profile') loadAndRenderProfilePage(); // NOVA CHAMADA DE FUNÇÃO
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
                patientPhone: form.patientPhone.value,
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
    const container = document.getElementById('doctorsList');
    if (!container) return;
    container.innerHTML = `<p>A carregar equipa...</p>`;

    const roleOrder = {
        'Diretor Presidente': 10, 'Diretor-Geral': 9, 'Coordenador-Geral': 8,
        'Supervisor': 7, 'Médico': 6, 'Residente': 5, 'Interno': 4,
        'Paramédico': 3, 'Estagiário': 2, 'Estudante': 1, 'Utilizador': 0
    };

    const normalizeRoleForCSS = (role) => {
        return role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '-');
    };

    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            container.innerHTML = '<p>Nenhum utilizador encontrado.</p>';
            return;
        }

        const usersList = [];
        
        snapshot.docs.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            usersList.push(user);
        });
        
        usersList.sort((a, b) => {
            const orderA = roleOrder[a.role || 'Utilizador'] || 0;
            const orderB = roleOrder[b.role || 'Utilizador'] || 0;
            return orderB - orderA;
        });
        
        let html = '';
        const canManageUsers = userData.isAdmin || userData.isModerator;

        usersList.forEach(user => {
            const role = user.role || 'Utilizador';
            const roleClass = normalizeRoleForCSS(role);
            html += `
                <div class="service-card">
                    ${canManageUsers ? `<button class="btn-icon admin-edit-btn" data-id="${user.id}"><i class="fas fa-pencil-alt"></i></button>` : ''}
                    <div class="service-icon">
                        <img src="${user.photoURL || createAvatar(user.name)}" />
                    </div>
                    <h3>${user.name}</h3>
                    <p>${user.specialty || 'Sem especialidade'}</p>
                    <span class="role-tag ${roleClass}">${role}</span>
                    <div class="doctor-details">
                        <p><i class="fas fa-id-card"></i> <strong>Passaporte:</strong> ${user.passport || 'N/A'}</p>
                        <p><i class="fas fa-notes-medical"></i> <strong>CRM:</strong> ${user.crm || 'N/A'}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        document.querySelectorAll('.admin-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditUserModal(btn.dataset.id));
        });

    } catch (error) {
        console.error("Erro ao carregar utilizadores:", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar a equipa.</p>`;
    }
};

const setupUserModal = () => {
    const modal = document.getElementById('editUserModal');
    if (!modal) return;
    const form = document.getElementById('userForm');
    const cancelBtn = document.getElementById('cancelUserBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const deleteBtn = document.getElementById('deleteUserBtn');
    const permissionsContainer = document.getElementById('permissionsContainer');

    window.openEditUserModal = async (id) => {
        form.reset();
        document.getElementById('userId').value = id;
        try {
            const doc = await db.collection('users').doc(id).get();
            if (doc.exists) {
                const user = doc.data();
                document.getElementById('userNameModal').textContent = user.name;
                document.getElementById('userEmailModal').textContent = user.email;
                document.getElementById('userRole').value = user.role || 'Utilizador';
                document.getElementById('userSpecialty').value = user.specialty || '';
                
                if(userData.isAdmin) {
                    permissionsContainer.style.display = 'block';
                    document.getElementById('userIsModerator').checked = user.isModerator || false;
                    document.getElementById('userIsAdmin').checked = user.isAdmin || false;
                    deleteBtn.style.display = 'inline-block';
                } else {
                    permissionsContainer.style.display = 'none';
                    deleteBtn.style.display = 'none';
                }

                modal.style.display = 'flex';
            }
        } catch (error) {
            console.error("Erro ao abrir modal do utilizador:", error);
        }
    };

    const closeUserModal = () => modal.style.display = 'none';

    cancelBtn.addEventListener('click', closeUserModal);
    closeModalBtn.addEventListener('click', closeUserModal);

    deleteBtn.addEventListener('click', async () => {
        const userId = document.getElementById('userId').value;
        if (userId && confirm('Tem a certeza de que quer excluir os dados deste utilizador do sistema? A sua conta de login NÃO será apagada.')) {
            try {
                await db.collection('users').doc(userId).delete();
                closeUserModal();
                loadAndRenderDoctors();
            } catch (error) {
                console.error("Erro ao excluir utilizador:", error);
                alert('Ocorreu um erro ao excluir o utilizador.');
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const updatedData = {
            role: document.getElementById('userRole').value,
            specialty: document.getElementById('userSpecialty').value,
        };
        
        if(userData.isAdmin) {
            updatedData.isModerator = document.getElementById('userIsModerator').checked;
            updatedData.isAdmin = document.getElementById('userIsAdmin').checked;
        }

        try {
            await db.collection('users').doc(userId).update(updatedData);
            closeUserModal();
            loadAndRenderDoctors();
        } catch (error) {
            console.error("Erro ao atualizar utilizador:", error);
            alert('Ocorreu um erro ao atualizar os dados.');
        }
    });
};

const loadAndRenderCourses = async () => {
    const container = document.getElementById('coursesList');
    if (!container) return;
    container.innerHTML = `<p>A carregar cursos...</p>`;

    try {
        if (!userData) throw new Error("Dados do utilizador não disponíveis.");

        const [coursesSnapshot, completedSnapshot] = await Promise.all([
            db.collection('courses').get(),
            db.collection('users').doc(currentUser.uid).collection('completedCourses').get()
        ]);

        const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const completedCourses = {};
        completedSnapshot.docs.forEach(doc => {
            completedCourses[doc.id] = doc.data();
        });

        const canManageCourses = userData.isAdmin || userData.isModerator || userData.role === 'Diretor-Geral' || userData.role === 'Diretor Presidente';
        const userRole = userData.role || 'Utilizador';
        
        const coursesByRole = {};
        const roleOrder = [ "Estudante", "Estagiário", "Paramédico", "Interno", "Residente", "Médico", "Supervisor", "Coordenador-Geral", "Diretor-Geral", "Diretor Presidente" ];
        
        allCourses.forEach(course => {
            if (course.roles && course.roles.length > 0) {
                course.roles.forEach(role => {
                    if (!coursesByRole[role]) {
                        coursesByRole[role] = [];
                    }
                    coursesByRole[role].push(course);
                });
            }
        });

        let html = '';

        if (canManageCourses) {
            roleOrder.forEach(role => {
                const coursesInRole = coursesByRole[role];
                if (coursesInRole && coursesInRole.length > 0) {
                    html += `<div class="course-role-group">
                                <div class="course-role-header collapsible-header">
                                    <h3>${role}</h3>
                                    <i class="fas fa-chevron-down report-chevron"></i>
                                </div>
                                <div class="collapsible-content">`;
                    
                    coursesInRole.forEach(course => {
                        html += renderCourseCard(course, completedCourses, canManageCourses);
                    });
                    
                    html += `</div></div>`;
                }
            });
        } else {
            const userCourses = coursesByRole[userRole];
            if (userCourses && userCourses.length > 0) {
                 userCourses.forEach(course => {
                    html += renderCourseCard(course, completedCourses, canManageCourses);
                });
            } else {
                 html = '<div class="card"><p>Não há cursos designados para o seu cargo no momento.</p></div>';
            }
        }
        
        container.innerHTML = html;
        setupCourseEventListeners();
        
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    header.classList.toggle('expanded');
                    const content = header.nextElementSibling;
                    if (content && content.classList.contains('collapsible-content')) {
                        content.classList.toggle('expanded');
                    }
                }
            });
        });

    } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar os cursos.</p>';
    }
};

const renderCourseCard = (course, completedCourses, canManageCourses) => {
    const completionData = completedCourses[course.id];
    const status = completionData ? completionData.status : null;
    let statusHTML = '';

    if (status) {
        if (status === 'approved') {
            statusHTML = `<button class="btn-secondary btn-sm status-tag approved" disabled><i class="fas fa-check"></i> Aprovado</button>`;
        } else if (status === 'reproved') {
            statusHTML = `<button class="btn-primary btn-sm retry-course-btn" data-course-id="${course.id}"><i class="fas fa-redo"></i> Tentar Novamente</button>`;
        } else {
            statusHTML = `<button class="btn-secondary btn-sm status-tag pending" disabled><i class="fas fa-clock"></i> Pendente</button>`;
        }
    } else {
        statusHTML = `<button class="btn-primary btn-sm complete-course-btn">Marcar como Concluído</button>`;
    }

    let responsesButtonHTML = '';
    if (canManageCourses) {
        const url = course.responsesURL || '#';
        const disabledClass = !course.responsesURL ? 'disabled' : '';
        const target = course.responsesURL ? 'target="_blank"' : '';
        responsesButtonHTML = `<a href="${url}" ${target} class="btn-secondary btn-sm view-responses-btn ${disabledClass}"><i class="fas fa-file-alt"></i> Ver Respostas</a>`;
    }

    return `
        <div class="course-card ${status ? status : ''}" data-course-id="${course.id}">
            <div class="completion-badge" style="display: ${status === 'approved' ? 'block' : 'none'};"><i class="fas fa-check-circle"></i></div>
            <div class="course-icon"><i class="fas ${course.icon || 'fa-book'}"></i></div>
            <div class="course-info">
                <h3>${course.name}</h3>
                <p>${course.description}</p>
            </div>
            <div class="course-actions">
                ${course.embedCode ? `<button class="btn-icon play-video-btn" 
                    data-embed-code="${encodeURIComponent(course.embedCode)}" 
                    data-video-title="${course.name}" 
                    data-description="${encodeURIComponent(course.description || '')}">
                    <i class="fas fa-play-circle"></i></button>` : ''}
                
                ${course.formURL ? `<button class="btn-secondary btn-sm open-form-btn" 
                    data-form-url="${course.formURL}" 
                    data-form-title="${course.name}">
                    <i class="fas fa-question-circle"></i> Questionário</button>` : ''}
                
                ${responsesButtonHTML}
                
                ${statusHTML}
                
                ${canManageCourses ? `<button class="btn-icon edit-course-btn" data-id="${course.id}"><i class="fas fa-edit"></i></button>` : ''}
            </div>
        </div>
    `;
}

const setupCourseEventListeners = () => {
    document.querySelectorAll('.play-video-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCourseContentModal(
                decodeURIComponent(btn.dataset.embedCode),
                btn.dataset.videoTitle,
                decodeURIComponent(btn.dataset.description)
            );
        });
    });
    
    document.querySelectorAll('.open-form-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCourseFormModal(btn.dataset.formUrl, btn.dataset.formTitle);
        });
    });

    document.querySelectorAll('.complete-course-btn, .retry-course-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const courseId = e.target.closest('.course-card').dataset.courseId;
            if(courseId) {
                await db.collection('users').doc(currentUser.uid).collection('completedCourses').doc(courseId).set({
                    completedAt: new Date(),
                    status: 'pending'
                });
                loadAndRenderCourses();
            }
        });
    });
    
    document.querySelectorAll('.edit-course-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const coursesSnapshot = await db.collection('courses').get();
            const allCoursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            openEditCourseModal(btn.dataset.id, allCoursesData);
        });
    });
}

const setupCourseContentModal = () => {
    const modal = document.getElementById('courseContentModal');
    if (!modal) return;
    const closeModalBtn = modal.querySelector('.close-modal');

    window.openCourseContentModal = (embedCode, title, description) => {
        const contentTitle = document.getElementById('courseContentTitle');
        const contentDescription = document.getElementById('courseContentDescription');
        const contentEmbed = document.getElementById('courseContentEmbed');
        const detailsColumn = document.querySelector('.course-modal-details');

        contentTitle.textContent = title;

        if (description && description.trim() !== '') {
            contentDescription.textContent = description;
            detailsColumn.style.display = 'block';
        } else {
            contentDescription.textContent = '';
            detailsColumn.style.display = 'none';
        }

        let cleanEmbedCode = embedCode;
        cleanEmbedCode = cleanEmbedCode.replace(/target="_blank"/gi, '');
        cleanEmbedCode = cleanEmbedCode.replace(/onclick="window\.open\([^)]+\)"/gi, '');
        cleanEmbedCode = cleanEmbedCode.replace(/onclick="[^"]*window\.open[^"]*"/gi, '');

        contentEmbed.innerHTML = cleanEmbedCode;
        
        contentEmbed.querySelectorAll('a').forEach(link => {
            link.target = '_self';
            link.removeAttribute('onclick');
        });

        modal.style.display = 'flex';
    };

    const closeCourseContentModal = () => {
        const contentEmbed = document.getElementById('courseContentEmbed');
        contentEmbed.innerHTML = '';
        modal.style.display = 'none';
    };

    closeModalBtn.addEventListener('click', closeCourseContentModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCourseContentModal();
        }
    });
};

const setupCourseFormModal = () => {
    const modal = document.getElementById('courseFormModal');
    if (!modal) return;
    const closeModalBtn = modal.querySelector('.close-modal');
    const iframe = document.getElementById('courseFormEmbed');

    const closeCourseFormModal = () => {
        iframe.src = ''; 
        modal.style.display = 'none';
    };

    closeModalBtn.addEventListener('click', closeCourseFormModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCourseFormModal();
        }
    });

    window.openCourseFormModal = (url, title) => {
        let embedUrl = url.replace('/viewform', '/viewform?embedded=true');
        
        document.getElementById('courseFormTitle').textContent = `Questionário: ${title}`;
        iframe.src = embedUrl;
        modal.style.display = 'flex';
    };
};

const setupCourseModal = () => {
    const modal = document.getElementById('editCourseModal');
    if (!modal) return;
    const form = document.getElementById('courseForm');
    const addBtn = document.getElementById('addCourseBtn');
    const cancelBtn = document.getElementById('cancelCourseBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const deleteBtn = document.getElementById('deleteCourseBtn');
    const rolesContainer = document.getElementById('courseRolesCheckboxes');
    
    const roles = ["Estudante", "Estagiário", "Paramédico", "Interno", "Residente", "Médico", "Supervisor", "Coordenador-Geral", "Diretor-Geral", "Diretor Presidente"];
    rolesContainer.innerHTML = roles.map(role => `
        <div class="checkbox-item">
            <input type="checkbox" id="role-${role.toLowerCase().replace(/ /g, '-')}" name="roles" value="${role}">
            <label for="role-${role.toLowerCase().replace(/ /g, '-')}">${role}</label>
        </div>
    `).join('');

    window.openEditCourseModal = async (id = null, allCourses) => {
        form.reset();
        document.getElementById('courseId').value = id || '';
        if (id) {
            document.getElementById('modalCourseTitle').textContent = 'Editar Curso';
            if (userData.isAdmin) deleteBtn.style.display = 'inline-block';
            const course = allCourses.find(c => c.id === id);
            if (course) {
                form.courseName.value = course.name;
                form.courseDescription.value = course.description;
                form.courseIcon.value = course.icon;
                form.courseEmbedCode.value = course.embedCode || '';
                form.courseFormURL.value = course.formURL || '';
                form.courseResponsesURL.value = course.responsesURL || '';
                (course.roles || []).forEach(role => {
                    const checkbox = rolesContainer.querySelector(`input[value="${role}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        } else {
            document.getElementById('modalCourseTitle').textContent = 'Adicionar Novo Curso';
            deleteBtn.style.display = 'none';
        }
        modal.style.display = 'flex';
    };

    const closeCourseModal = () => modal.style.display = 'none';

    addBtn.addEventListener('click', async () => {
        const snapshot = await db.collection('courses').get();
        const allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        openEditCourseModal(null, allCourses);
    });
    cancelBtn.addEventListener('click', closeCourseModal);
    closeModalBtn.addEventListener('click', closeCourseModal);

    deleteBtn.addEventListener('click', async () => {
        const courseId = document.getElementById('courseId').value;
        if (courseId && confirm('Tem a certeza de que quer excluir este curso?')) {
            try {
                await db.collection('courses').doc(courseId).delete();
                closeCourseModal();
                loadAndRenderCourses();
            } catch (error) {
                console.error("Erro ao excluir curso:", error);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.courseId.value;
        const selectedRoles = Array.from(rolesContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        const courseData = {
            name: form.courseName.value,
            description: form.courseDescription.value,
            icon: form.courseIcon.value,
            embedCode: form.courseEmbedCode.value,
            formURL: form.courseFormURL.value,
            responsesURL: form.courseResponsesURL.value,
            roles: selectedRoles
        };
        try {
            if (id) {
                await db.collection('courses').doc(id).update(courseData);
            } else {
                await db.collection('courses').add(courseData);
            }
            closeCourseModal();
            loadAndRenderCourses();
        } catch (error) {
            console.error("Erro ao salvar curso:", error);
        }
    });
};

const loadAndRenderApprovals = async () => {
    const container = document.getElementById('approvalsList');
    if (!container) return;
    container.innerHTML = '<p>A carregar conclusões pendentes...</p>';

    try {
        const usersSnapshot = await db.collection('users').get();
        const coursesSnapshot = await db.collection('courses').get();
        
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const approvalsByCourse = {};

        for (const user of allUsers) {
            const completedSnapshot = await db.collection('users').doc(user.id).collection('completedCourses').get();
            completedSnapshot.forEach(doc => {
                const completion = { id: doc.id, ...doc.data() };
                if (!approvalsByCourse[completion.id]) {
                    const courseInfo = allCourses.find(c => c.id === completion.id);
                    if (courseInfo) {
                        approvalsByCourse[completion.id] = {
                            ...courseInfo,
                            completions: []
                        };
                    }
                }
                if (approvalsByCourse[completion.id]) {
                    approvalsByCourse[completion.id].completions.push({
                        ...completion,
                        userName: user.name,
                        userId: user.id
                    });
                }
            });
        }
        
        let html = '';
        const coursesWithCompletions = Object.values(approvalsByCourse);

        if (coursesWithCompletions.length === 0) {
            container.innerHTML = '<div class="card"><p>Nenhuma conclusão de curso registada até ao momento.</p></div>';
            return;
        }

        coursesWithCompletions.forEach(course => {
            html += `
                <div class="course-approval-card">
                    <h3>${course.name}</h3>
                    <div class="user-approval-list">
            `;
            const pendingCompletions = course.completions.filter(c => c.status === 'pending');
            
            if (pendingCompletions.length > 0) {
                 pendingCompletions.forEach(comp => {
                    const date = comp.completedAt.toDate().toLocaleDateString('pt-BR');
                    html += `
                        <div class="user-approval-item">
                            <div class="user-info">
                                <img src="${createAvatar(comp.userName)}" alt="${comp.userName}">
                                <span>${comp.userName}</span>
                            </div>
                            <span class="completion-date">${date}</span>
                            <div class="approval-actions">
                                ${course.responsesURL ? `<a href="${course.responsesURL}" target="_blank" class="btn-secondary btn-sm"><i class="fas fa-eye"></i> Ver Respostas</a>` : ''}
                                <button class="btn-danger btn-sm reprove-btn" data-user-id="${comp.userId}" data-course-id="${course.id}"><i class="fas fa-times"></i> Reprovar</button>
                                <button class="btn-primary btn-sm approve-btn" data-user-id="${comp.userId}" data-course-id="${course.id}"><i class="fas fa-check"></i> Aprovar</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                html += '<p>Nenhuma conclusão pendente para este curso.</p>';
            }
            html += `</div></div>`;
        });
        container.innerHTML = html;

        const updateStatus = async (userId, courseId, status) => {
             try {
                const docRef = db.collection('users').doc(userId).collection('completedCourses').doc(courseId);
                await docRef.update({ status: status });
                loadAndRenderApprovals();
            } catch(error) {
                console.error(`Erro ao ${status} a conclusão: `, error);
                alert(`Não foi possível ${status} a conclusão.`);
            }
        };

        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                updateStatus(btn.dataset.userId, btn.dataset.courseId, 'approved');
            });
        });
        document.querySelectorAll('.reprove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                updateStatus(btn.dataset.userId, btn.dataset.courseId, 'reproved');
            });
        });


    } catch (error) {
        console.error("Erro ao carregar aprovações: ", error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar as aprovações.</p>';
    }
};

const loadAndRenderReports = async (showArchived = false) => {
    const container = document.getElementById('reportsList');
    container.innerHTML = `<p>A carregar dados para relatórios...</p>`;

    const roleOrder = [ "Estudante", "Estagiário", "Paramédico", "Interno", "Residente", "Médico", "Supervisor", "Coordenador-Geral", "Diretor-Geral", "Diretor Presidente" ];

    try {
        const usersSnapshot = await db.collection('users').get();
        const coursesSnapshot = await db.collection('courses').get();

        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let approvedCompletions = [];
        for (const user of allUsers) {
            const completedSnapshot = await db.collection('users').doc(user.id).collection('completedCourses')
                .where('status', '==', 'approved').get();
            
            completedSnapshot.forEach(doc => {
                approvedCompletions.push({
                    userId: user.id,
                    userName: user.name,
                    role: user.role,
                    courseId: doc.id,
                    ...doc.data()
                });
            });
        }
        
        const filteredCompletions = approvedCompletions.filter(comp => {
            return showArchived ? comp.reportSent === true : comp.reportSent !== true;
        });

        const reportsByRole = {};
        filteredCompletions.forEach(comp => {
            const courseInfo = allCourses.find(c => c.id === comp.courseId);
            if (!courseInfo || !courseInfo.roles) return;

            courseInfo.roles.forEach(role => {
                if (!reportsByRole[role]) {
                    reportsByRole[role] = {};
                }
                if(!reportsByRole[role][courseInfo.name]){
                    reportsByRole[role][courseInfo.name] = {
                        courseId: courseInfo.id,
                        users: []
                    };
                }
                const userAlreadyInList = reportsByRole[role][courseInfo.name].users.some(user => user.id === comp.userId);
                if (!userAlreadyInList) {
                    reportsByRole[role][courseInfo.name].users.push({
                        id: comp.userId,
                        name: comp.userName
                    });
                }
            });
        });
        
        let html = `
            <div class="card">
                <h3>Gerar Relatório de Cursos Aprovados</h3>
                <p>Selecione os cursos que deseja incluir no relatório e clique em "Enviar Selecionados".</p>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="showArchivedReportsToggle">
                    <label for="showArchivedReportsToggle">Mostrar Relatórios Já Enviados</label>
                </div>
                 <div id="alertDiscord" class="alert" style="display:none;"></div>
                <button class="btn-primary" id="sendSelectedReportBtn"></button>
            </div>
        `;
        
        const sortedRoles = Object.keys(reportsByRole).sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b));

        if(sortedRoles.length === 0) {
            const message = showArchived ? "Não há relatórios arquivados." : "Nenhum curso novo aprovado para gerar relatórios.";
            html += `<div class="card"><p>${message}</p></div>`;
            container.innerHTML = html;
            document.getElementById('showArchivedReportsToggle').checked = showArchived;
            document.getElementById('showArchivedReportsToggle').addEventListener('change', (e) => loadAndRenderReports(e.target.checked));
            document.getElementById('sendSelectedReportBtn').style.display = 'none';
            return;
        }

        sortedRoles.forEach(role => {
            html += `
                <div class="report-selection-card ${showArchived ? 'archived' : ''}">
                    <div class="report-role-header collapsible-header">
                        <input type="checkbox" class="role-checkbox" data-role="${role}" id="role-check-${role}">
                        <label for="role-check-${role}"><h3>${role}</h3></label>
                        <i class="fas fa-chevron-down report-chevron"></i>
                    </div>
                    <div class="collapsible-content">
            `;
            const coursesInRole = reportsByRole[role];
            Object.keys(coursesInRole).forEach(courseName => {
                const courseData = coursesInRole[courseName];
                html += `
                    <div class="user-approval-item course-item">
                         <div class="report-info course-header collapsible-header">
                            <input type="checkbox" class="course-checkbox" 
                                data-role="${role}" 
                                data-course-name="${courseName}">
                            <strong>${courseName}</strong>
                            <i class="fas fa-chevron-down report-chevron"></i>
                        </div>
                        <div class="report-user-list collapsible-content">`;
                courseData.users.forEach(user => {
                    html += `
                            <div class="report-user-item">
                                <input type="checkbox" class="report-checkbox user-checkbox" 
                                    data-role="${role}" 
                                    data-course-name="${courseName}" 
                                    data-course-id="${courseData.courseId}"
                                    data-user-id="${user.id}"
                                    data-user-name="${user.name}">
                                <span>${user.name}</span>
                            </div>`;
                });
                html += `</div></div>`;
            });
            html += `</div></div>`;
        });
        
        container.innerHTML = html;
        document.getElementById('showArchivedReportsToggle').checked = showArchived;
        const sendBtn = document.getElementById('sendSelectedReportBtn');
        sendBtn.style.display = 'inline-flex';
        sendBtn.innerHTML = showArchived
            ? '<i class="fas fa-redo"></i> Reenviar Selecionados'
            : '<i class="fas fa-paper-plane"></i> Enviar Selecionados';

        setupReportSelection();

    } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar os dados para os relatórios.</p>';
    }
};


const setupReportSelection = () => {
    document.getElementById('showArchivedReportsToggle').addEventListener('change', (e) => {
        loadAndRenderReports(e.target.checked);
    });

    document.querySelectorAll('.role-checkbox').forEach(roleCheckbox => {
        roleCheckbox.addEventListener('change', (e) => {
            const role = e.target.dataset.role;
            const isChecked = e.target.checked;
            const parentCard = e.target.closest('.report-selection-card');
            parentCard.querySelectorAll(`.report-checkbox[data-role="${role}"]`).forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    });

    document.querySelectorAll('.course-checkbox').forEach(courseCheckbox => {
        courseCheckbox.addEventListener('change', (e) => {
            const courseName = e.target.dataset.courseName;
            const role = e.target.dataset.role;
            const isChecked = e.target.checked;
            const parentItem = e.target.closest('.course-item');
            parentItem.querySelectorAll(`.user-checkbox[data-course-name="${courseName}"][data-role="${role}"]`).forEach(userCheckbox => {
                userCheckbox.checked = isChecked;
            });
        });
    });

    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                const content = header.nextElementSibling;
                if(content && content.classList.contains('collapsible-content')) {
                    header.classList.toggle('expanded');
                    content.classList.toggle('expanded');
                }
            }
        });
    });

    const sendBtn = document.getElementById('sendSelectedReportBtn');
    if (!sendBtn) return;
    
    sendBtn.addEventListener('click', async () => {
        if (document.getElementById('showArchivedReportsToggle').checked) {
            if (!confirm('Tem a certeza de que quer reenviar estes relatórios já arquivados?')) {
                return;
            }
        }

        const selectedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        const alertBox = document.getElementById('alertDiscord');

        if (selectedCheckboxes.length === 0) {
            alertBox.textContent = 'Nenhum formando selecionado para o relatório.';
            alertBox.className = 'alert error';
            alertBox.style.display = 'block';
            setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
            return;
        }

        const reportData = {};
        const updatesToPerform = [];

        selectedCheckboxes.forEach(cb => {
            const { role, courseName, courseId, userId, userName } = cb.dataset;

            if (!reportData[role]) {
                reportData[role] = {};
            }
            if (!reportData[role][courseName]) {
                reportData[role][courseName] = { users: [] };
            }

            reportData[role][courseName].users.push(userName);
            
            if (!document.getElementById('showArchivedReportsToggle').checked) {
                updatesToPerform.push(
                    db.collection('users').doc(userId).collection('completedCourses').doc(courseId).update({ reportSent: true })
                );
            }
        });

        let description = '';
        const today = new Date().toLocaleDateString('pt-BR');
        const roleOrder = [ "Estudante", "Estagiário", "Paramédico", "Interno", "Residente", "Médico", "Supervisor", "Coordenador-Geral", "Diretor-Geral", "Diretor Presidente" ];
        const sortedRoles = Object.keys(reportData).sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b));

        sortedRoles.forEach(role => {
            description += `\n__**Cargo: ${role}**__\n\n`;
            Object.keys(reportData[role]).forEach(courseName => {
                const course = reportData[role][courseName];
                description += `**${courseName}**\n`;
                const userList = course.users.map(user => `• ${user}`).join('\n');
                description += `${userList}\n\n`;
            });
            description += '---\n';
        });
        
        const embed = {
            title: `Relatório de Cursos Aprovados - ${today}`,
            description: description,
            color: 2829617,
            footer: { text: `Sistema ACM Valley` }
        };

        const sendReportFunction = functions.httpsCallable('sendCourseReport');
        try {
            alertBox.textContent = 'A enviar relatório...';
            alertBox.className = 'alert';
            alertBox.style.display = 'block';
            await sendReportFunction({ embed });
            
            await Promise.all(updatesToPerform);

            alertBox.textContent = 'Relatório enviado com sucesso!';
            alertBox.className = 'alert success';
            loadAndRenderReports(document.getElementById('showArchivedReportsToggle').checked);

        } catch (error) {
            console.error("Erro ao chamar a Cloud Function ou arquivar:", error);
            alertBox.textContent = 'Erro ao enviar o relatório. Tente novamente.';
            alertBox.className = 'alert error';
        }
         setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
    });
};

const setupSeasonalBanner = async () => {
    const banner = document.querySelector('.welcome-banner');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerSubtitle = document.getElementById('bannerSubtitle');
    const bannerIcon = document.getElementById('bannerIcon');

    if (!banner || !bannerTitle || !bannerSubtitle || !bannerIcon) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const snapshot = await db.collection('campaigns').get();
        let activeCampaign = null;

        snapshot.forEach(doc => {
            const campaign = { id: doc.id, ...doc.data() };
            const startDate = new Date(campaign.startDate + 'T00:00:00');
            const endDate = new Date(campaign.endDate + 'T23:59:59');

            if (today >= startDate && today <= endDate) {
                activeCampaign = campaign;
            }
        });

        if (activeCampaign) {
            banner.style.setProperty('--campaign-color-1', activeCampaign.color1);
            banner.style.setProperty('--campaign-color-2', activeCampaign.color2);
            banner.classList.add('seasonal-campaign');
            bannerTitle.textContent = activeCampaign.title;
            bannerSubtitle.textContent = activeCampaign.subtitle;
            bannerIcon.className = activeCampaign.icon;
        } else {
            banner.classList.remove('seasonal-campaign');
            bannerTitle.textContent = 'Alta Centro Médico - Valley';
            bannerSubtitle.textContent = 'Cuidando da sua saúde com excelência e tecnologia.';
            bannerIcon.className = 'fas fa-heartbeat';
        }
    } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
    }
};

const loadAndRenderCampaigns = async () => {
    const container = document.getElementById('campaignsList');
    if (!container) return;
    container.innerHTML = `<p>A carregar campanhas...</p>`;

    try {
        const snapshot = await db.collection('campaigns').orderBy('startDate', 'desc').get();
        if (snapshot.empty) {
            container.innerHTML = `<div class="card"><p>Nenhuma campanha encontrada.</p></div>`;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const campaign = { id: doc.id, ...doc.data() };
            const today = new Date();
            const startDate = new Date(campaign.startDate + 'T00:00:00');
            const endDate = new Date(campaign.endDate + 'T23:59:59');
            const isActive = today >= startDate && today <= endDate;

            html += `
                <div class="campaign-card ${isActive ? 'active' : ''}">
                    <div class="campaign-color-preview" style="background: linear-gradient(90deg, ${campaign.color1}, ${campaign.color2});"></div>
                    <div class="campaign-info">
                        <h3>${campaign.name} ${isActive ? '<span class="status-badge">Ativa</span>' : ''}</h3>
                        <p><i class="fas fa-calendar-alt"></i> ${new Date(campaign.startDate + 'T00:00:00').toLocaleDateString()} - ${new Date(campaign.endDate + 'T00:00:00').toLocaleDateString()}</p>
                    </div>
                    <div class="campaign-actions">
                        <button class="btn-icon edit-campaign-btn" data-id="${campaign.id}"><i class="fas fa-edit"></i></button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        document.querySelectorAll('.edit-campaign-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditCampaignModal(btn.dataset.id));
        });

    } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
        container.innerHTML = `<p>Ocorreu um erro ao carregar as campanhas.</p>`;
    }
};

const setupCampaignModal = () => {
    const modal = document.getElementById('editCampaignModal');
    if (!modal) return;
    const addBtn = document.getElementById('addCampaignBtn');
    const cancelBtn = document.getElementById('cancelCampaignBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('campaignForm');
    const deleteBtn = document.getElementById('deleteCampaignBtn');

    window.openEditCampaignModal = async (id = null) => {
        form.reset();
        document.getElementById('campaignId').value = id || '';
        if (id) {
            document.getElementById('modalCampaignTitle').textContent = 'Editar Campanha';
            if (userData.isAdmin) deleteBtn.style.display = 'inline-block';
            const doc = await db.collection('campaigns').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                form.campaignName.value = data.name;
                form.campaignTitle.value = data.title;
                form.campaignSubtitle.value = data.subtitle;
                form.campaignIcon.value = data.icon;
                form.campaignColor1.value = data.color1;
                form.campaignColor2.value = data.color2;
                form.startDate.value = data.startDate;
                form.endDate.value = data.endDate;
            }
        } else {
            document.getElementById('modalCampaignTitle').textContent = 'Adicionar Nova Campanha';
            deleteBtn.style.display = 'none';
        }
        modal.style.display = 'flex';
    };

    const closeCampaignModal = () => modal.style.display = 'none';

    addBtn.addEventListener('click', () => openEditCampaignModal());
    cancelBtn.addEventListener('click', closeCampaignModal);
    closeModalBtn.addEventListener('click', closeCampaignModal);

    deleteBtn.addEventListener('click', async () => {
        const id = form.campaignId.value;
        if (id && confirm('Tem a certeza de que quer excluir esta campanha?')) {
            try {
                await db.collection('campaigns').doc(id).delete();
                closeCampaignModal();
                loadAndRenderCampaigns();
                setupSeasonalBanner();
            } catch (error) {
                console.error("Erro ao excluir campanha:", error);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.campaignId.value;
        const data = {
            name: form.campaignName.value,
            title: form.campaignTitle.value,
            subtitle: form.campaignSubtitle.value,
            icon: form.campaignIcon.value,
            color1: form.campaignColor1.value,
            color2: form.campaignColor2.value,
            startDate: form.startDate.value,
            endDate: form.endDate.value,
        };
        try {
            if (id) {
                await db.collection('campaigns').doc(id).update(data);
            } else {
                await db.collection('campaigns').add(data);
            }
            closeCampaignModal();
            loadAndRenderCampaigns();
            setupSeasonalBanner();
        } catch (error) {
            console.error("Erro ao salvar campanha:", error);
        }
    });
};

// --- NOVAS FUNÇÕES PARA A PÁGINA DE PERFIL ---

const loadAndRenderProfilePage = async () => {
    if (!currentUser || !userData) return;

    // Preencher formulário com dados do usuário
    document.getElementById('profileName').value = userData.name || '';
    document.getElementById('profileEmail').value = userData.email || '';
    document.getElementById('profilePhone').value = userData.phone || '';
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
                const date = app.createdAt.toDate().toLocaleDateString('pt-BR');
                appointmentsHtml += `<li><i class="fas fa-stethoscope"></i> ${app.specialty} - ${date}</li>`;
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
            phone: document.getElementById('profilePhone').value,
            specialty: document.getElementById('profileSpecialty').value,
        };

        try {
            await db.collection('users').doc(currentUser.uid).update(updatedData);
            
            // Atualiza os dados locais para refletir na UI imediatamente
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
    const userInfo = document.getElementById('userInfo');
    const dropdown = document.getElementById('profileDropdown');
    const container = document.querySelector('.user-profile-container');

    userInfo.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = container.classList.toggle('open');
        dropdown.style.display = isOpen ? 'block' : 'none';
    });

    window.addEventListener('click', () => {
        if (container.classList.contains('open')) {
            container.classList.remove('open');
            dropdown.style.display = 'none';
        }
    });
};

const setupAvatarModal = () => {
    const modal = document.getElementById('changeAvatarModal');
    if (!modal) return;
    const grid = document.getElementById('avatarGrid');
    const openBtn = document.getElementById('changeAvatarBtn');
    const cancelBtn = document.getElementById('cancelAvatarBtn');
    const saveBtn = document.getElementById('saveAvatarBtn');
    const closeModalBtn = modal.querySelector('.close-modal');

    const avatars = [
       'https://i.imgur.com/AJj2Xao.jpeg', 'https://i.imgur.com/od7vSZd.jpeg',
        'https://i.imgur.com/TSfNQyn.jpeg', 'https://i.imgur.com/kcTBKxm.jpeg',
        'https://i.imgur.com/oTXMeWR.jpeg', 'https://i.imgur.com/HYd7Aqq.jpeg',
        'https://i.imgur.com/7YgxtDd.png', 'https://i.imgur.com/Bj24M4h.png',
        'https://i.imgur.com/yKH4MoJ.png', 'https://i.imgur.com/O90W9Hl.png',
        'https://i.imgur.com/xQeBpOY.png', 'https://i.imgur.com/XFs98rZ.png',
    ];

    let selectedAvatar = userData?.photoURL || '';

    const renderAvatars = () => {
        grid.innerHTML = '';
        avatars.forEach(url => {
            const isSelected = url === selectedAvatar;
            grid.innerHTML += `
                <div class="avatar-option ${isSelected ? 'selected' : ''}" data-url="${url}">
                    <img src="${url}" alt="Avatar">
                </div>
            `;
        });
        
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedAvatar = option.dataset.url;
            });
        });
    };

    const openModal = () => {
        selectedAvatar = userData?.photoURL || '';
        renderAvatars();
        modal.style.display = 'flex';
    };
    const closeModal = () => modal.style.display = 'none';

    openBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);

    saveBtn.addEventListener('click', async () => {
        if (!selectedAvatar) return;
        try {
            await db.collection('users').doc(currentUser.uid).update({ photoURL: selectedAvatar });
            userData.photoURL = selectedAvatar;
            updateUIForUser();
            closeModal();
        } catch (error) {
            console.error("Erro ao salvar o avatar:", error);
        }
    });
};

const setupPasswordModal = () => {
    const modal = document.getElementById('changePasswordModal');
    if (!modal) return;
    const form = document.getElementById('changePasswordForm');
    const openBtn = document.getElementById('changePasswordBtn');
    const cancelBtn = document.getElementById('cancelPasswordBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const alertBox = document.getElementById('passwordAlert');

    const showAlert = (message, type) => {
        alertBox.textContent = message;
        alertBox.className = `alert ${type}`;
        alertBox.style.display = 'block';
    };

    const openModal = () => {
        form.reset();
        alertBox.style.display = 'none';
        modal.style.display = 'flex';
    };
    const closeModal = () => modal.style.display = 'none';

    openBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmNewPassword = form.confirmNewPassword.value;

        if (newPassword !== confirmNewPassword) {
            return showAlert('As novas senhas não coincidem.', 'error');
        }
        if (newPassword.length < 6) {
            return showAlert('A nova senha deve ter pelo menos 6 caracteres.', 'error');
        }

        try {
            const user = auth.currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            
            showAlert('Senha alterada com sucesso!', 'success');
            setTimeout(closeModal, 2000);

        } catch (error) {
            console.error("Erro ao alterar a senha:", error);
            if(error.code === 'auth/wrong-password') {
                showAlert('A senha atual está incorreta.', 'error');
            } else {
                showAlert('Ocorreu um erro. Tente novamente.', 'error');
            }
        }
    });
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
    setupProfileForm(); // NOVA CHAMADA DE FUNÇÃO

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
