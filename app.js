// app.js

let currentUser = null;
let userData = null;
let allInformes = []; // Armazena todos os informes carregados

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
        document.getElementById('adminBadge').style.display = isAdmin ? 'inline-block' : 'none';
        document.getElementById('adminInformeControls').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('adminCourseControls').style.display = isAdmin ? 'flex' : 'none';
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

        if (hash === 'home') loadLatestInformes();
        if (hash === 'info') loadAndRenderInformes();
        if (hash === 'appointments') loadAndRenderAppointments();
        if (hash === 'doctors') loadAndRenderDoctors();
        if (hash === 'courses') loadAndRenderCourses();

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
                    ${userData && userData.isAdmin ? `
                    <div class="admin-actions">
                        <button class="btn-icon edit-informe-btn" data-id="${informe.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-informe-btn" data-id="${informe.id}"><i class="fas fa-trash"></i></button>
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;

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
        formCard.style.display = 'block';
        confirmationCard.style.display = 'none';
    });
};

const setupInformesModal = () => {
    const modal = document.getElementById('editInformeModal');
    const addBtn = document.getElementById('addInformeBtn');
    const cancelBtn = document.getElementById('cancelInformeBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('informeForm');
    const deleteBtn = document.getElementById('deleteInformeBtn');

    window.openEditInformeModal = async (id = null) => {
        form.reset();
        document.getElementById('informeId').value = id || '';
        if (id) {
            document.getElementById('modalInformeTitle').textContent = 'Editar Informe';
            deleteBtn.style.display = 'inline-block';
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
            if (document.getElementById('info').classList.contains('active')) {
                loadAndRenderInformes();
            }
            if (document.getElementById('home').classList.contains('active')) {
                loadLatestInformes();
            }
        } catch (error) {
            console.error("Erro ao salvar informe:", error);
        }
    });
};

const setupViewInformeModal = () => {
    const modal = document.getElementById('viewInformeModal');
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

    const normalizeRoleForCSS = (role) => {
        return role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ /g, '-');
    };

    try {
        const snapshot = await db.collection('users').orderBy('name').get();
        if (snapshot.empty) {
            container.innerHTML = '<p>Nenhum utilizador encontrado.</p>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            const role = user.role || 'Utilizador';
            const roleClass = normalizeRoleForCSS(role);
            html += `
                <div class="service-card">
                    ${userData.isAdmin ? `<button class="btn-icon admin-edit-btn" data-id="${user.id}"><i class="fas fa-pencil-alt"></i></button>` : ''}
                    <div class="service-icon">
                        <img src="${user.photoURL || createAvatar(user.name)}" style="width:100%; height:100%; border-radius:50%;"/>
                    </div>
                    <h3>${user.name}</h3>
                    <p>${user.specialty || 'Sem especialidade'}</p>
                    <span class="role-tag ${roleClass}">${role}</span>
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
    const form = document.getElementById('userForm');
    const cancelBtn = document.getElementById('cancelUserBtn');
    const closeModalBtn = modal.querySelector('.close-modal');
    const deleteBtn = document.getElementById('deleteUserBtn');

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
                document.getElementById('userIsAdmin').checked = user.isAdmin || false;
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
            isAdmin: document.getElementById('userIsAdmin').checked
        };
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
        const snapshot = await db.collection('courses').get();
        const allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userRole = userData.role || 'Utilizador';
        const userCourses = allCourses.filter(course => course.roles && course.roles.includes(userRole));

        if (userCourses.length === 0) {
            container.innerHTML = '<div class="card"><p>Não há cursos designados para o seu cargo no momento.</p></div>';
            return;
        }

        let html = '';
        userCourses.forEach(course => {
            html += `
                <div class="course-card">
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
                        ${userData.isAdmin ? `<button class="btn-icon edit-course-btn" data-id="${course.id}"><i class="fas fa-edit"></i></button>` : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        document.querySelectorAll('.play-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openCourseContentModal(
                    decodeURIComponent(btn.dataset.embedCode),
                    btn.dataset.videoTitle,
                    decodeURIComponent(btn.dataset.description)
                );
            });
        });
        

        document.querySelectorAll('.edit-course-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const coursesSnapshot = await db.collection('courses').get();
                const allCoursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                openEditCourseModal(btn.dataset.id, allCoursesData);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        container.innerHTML = '<p>Ocorreu um erro ao carregar os cursos.</p>';
    }
};

const setupCourseContentModal = () => {
    const modal = document.getElementById('courseContentModal');
    const closeModalBtn = modal.querySelector('.close-modal');

    window.openCourseContentModal = (embedCode, title, description) => {
        const contentTitle = document.getElementById('courseContentTitle');
        const contentDescription = document.getElementById('courseContentDescription');
        const contentEmbed = document.getElementById('courseContentEmbed');

        contentTitle.textContent = title;
        contentEmbed.innerHTML = embedCode;

        // Esconde o parágrafo da descrição se não houver texto
        if (description && description.trim() !== '') {
            contentDescription.textContent = description;
            contentDescription.style.display = 'block';
        } else {
            contentDescription.textContent = '';
            contentDescription.style.display = 'none';
        }

        modal.style.display = 'flex';
    };

    const closeCourseContentModal = () => {
        const contentEmbed = document.getElementById('courseContentEmbed');
        contentEmbed.innerHTML = ''; // Limpa o conteúdo ao fechar
        modal.style.display = 'none';
    };

    closeModalBtn.addEventListener('click', closeCourseContentModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCourseContentModal();
        }
    });
};

const setupCourseModal = () => {
    const modal = document.getElementById('editCourseModal');
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
            deleteBtn.style.display = 'inline-block';
            const course = allCourses.find(c => c.id === id);
            if (course) {
                form.courseName.value = course.name;
                form.courseDescription.value = course.description;
                form.courseIcon.value = course.icon;
                form.courseEmbedCode.value = course.embedCode || '';
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

    document.getElementById('seedCoursesBtn').addEventListener('click', async () => {
        if (!confirm('Isto irá adicionar os cursos iniciais à base de dados, caso ainda não existam. Deseja continuar?')) return;
        
        const initialCourses = {
            'Estudante': [{ name: 'Anamnese', description: 'Aprenda a realizar uma entrevista inicial completa.', icon: 'fa-file-medical' },{ name: 'Noções sobre Medicamentos', description: 'Conceitos básicos sobre fármacos e as suas aplicações.', icon: 'fa-pills' },{ name: 'Comunicação e Modulação', description: 'Técnicas de comunicação eficaz com pacientes.', icon: 'fa-comments' }],
            'Estagiário': [{ name: 'Anatomia básica', description: 'Revisão dos sistemas fundamentais do corpo humano.', icon: 'fa-bone' },{ name: 'Comportamento, conduta e mediação de conflitos', description: 'Como lidar com situações difíceis no ambiente clínico.', icon: 'fa-users' },{ name: 'Direção defensiva', description: 'Procedimentos seguros no transporte de emergência.', icon: 'fa-car' }],
            'Paramédico': [{ name: 'Anatomia', description: 'Estudo aprofundado da anatomia humana.', icon: 'fa-heartbeat' },{ name: 'Procedimento de Lockdown', description: 'Protocolos de segurança e contenção em situações críticas.', icon: 'fa-shield-alt' }],
            'Interno': [{ name: 'Radiologia e Criação de Laudos Médicos', description: 'Interpretação de exames de imagem e elaboração de laudos.', icon: 'fa-x-ray' },{ name: 'Procedimentos médicos', description: 'Técnicas e práticas para procedimentos clínicos comuns.', icon: 'fa-procedures' }],
            'Residente': [{ name: 'Exames Laboratoriais e Técnicas de coletas', description: 'Análise de resultados e métodos de coleta de amostras.', icon: 'fa-vial' },{ name: 'Cirurgia básica', description: 'Princípios e técnicas fundamentais da cirurgia.', icon: 'fa-syringe' }]
        };
        
        const batch = db.batch();
        const coursesRef = db.collection('courses');
        
        for (const role in initialCourses) {
            for (const course of initialCourses[role]) {
                const newCourseRef = coursesRef.doc();
                batch.set(newCourseRef, { ...course, roles: [role] });
            }
        }
        
        try {
            await batch.commit();
            alert('Cursos iniciais adicionados com sucesso!');
            loadAndRenderCourses();
        } catch (error) {
            console.error("Erro ao popular cursos:", error);
            alert('Ocorreu um erro ao adicionar os cursos.');
        }
    });

};


// --- INICIALIZAÇÃO DA APLICAÇÃO ---
window.loadAndInitApp = async (user) => {
    currentUser = user;
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) userData = userDoc.data();
    
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
    setupInformesModal();
    setupViewInformeModal();
    setupAppointmentForm();
    setupUserModal();
    setupCourseContentModal();
    setupCourseModal();

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            window.location.hash = e.currentTarget.getAttribute('href');
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });
});
