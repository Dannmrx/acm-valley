/* --- VARIAVEIS GLOBAIS --- */
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
    --success-color: #27ae60;
    --warning-color: #f1c40f;
    --moderator-color: #9b59b6; /* Roxo para moderador */
    --light-color: #ecf0f1;
    --dark-color: #222f3e;
    --text-color: #576574;
    --text-color-light: #ffffff;
    --border-color: #dfe6e9;
    --background-color: #f5f7fa;
    --border-radius: 8px;
    --box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    --box-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.12);
    --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* --- ESTILOS GERAIS (RESET) --- */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--font-family);
    line-height: 1.6;
    font-size: 16px;
}

/* --- TELA DE CARREGAMENTO --- */
body.loading .auth-container,
body.loading .app-content {
    visibility: hidden;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--background-color);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.3s ease;
}

body:not(.loading) .loading-overlay {
    opacity: 0;
    pointer-events: none;
}

.loading-spinner-page {
    width: 50px;
    height: 50px;
    border: 5px solid var(--border-color);
    border-top-color: var(--secondary-color);
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* --- LAYOUT PRINCIPAL --- */
.app-content {
    display: none; /* Inicia escondido */
    min-height: 100vh;
}
.auth-container {
    display: flex; /* Inicia visível */
    min-height: 100vh;
}

.app-content.active {
    display: flex;
}

.main-content {
    margin-left: 250px;
    transition: margin-left 0.3s ease-in-out;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    flex-grow: 1;
}

.container {
    padding: 30px;
    flex-grow: 1;
}

/* --- CABEÇALHO (HEADER) --- */
.header {
    background: var(--text-color-light);
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 999;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-color);
}

.user-profile-container {
    position: relative;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 5px;
    border-radius: var(--border-radius);
    transition: background-color 0.2s ease;
}

.user-info:hover {
    background-color: var(--light-color);
}

.user-info img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border-color);
}

.user-info span {
    font-weight: 600;
    color: var(--text-color);
}

.admin-badge, .mod-badge {
    color: white;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
}
.admin-badge { background: var(--accent-color); }
.mod-badge { background: var(--moderator-color); }

.profile-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow-hover);
    padding: 10px 0;
    width: 200px;
    z-index: 1001;
    margin-top: 5px;
}

.profile-dropdown a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    color: var(--text-color);
    text-decoration: none;
    font-size: 15px;
    transition: background-color 0.2s ease;
}

.profile-dropdown a:hover {
    background-color: var(--light-color);
}

.profile-dropdown a i {
    width: 20px;
    text-align: center;
    color: var(--primary-color);
}


/* --- BARRA LATERAL (SIDEBAR) --- */
.sidebar {
    position: fixed;
    left: 0; top: 0;
    height: 100%;
    width: 250px;
    background: var(--dark-color);
    color: var(--text-color-light);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
    flex-shrink: 0;
}

.logo {
    padding: 25px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
}
.logo h2 { font-size: 22px; }
.logo p { font-size: 12px; opacity: 0.7; }

.sidebar-menu {
    list-style: none;
    padding: 20px 0;
    flex-grow: 1;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 15px 25px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    border-left: 4px solid transparent;
}

.nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color-light);
}

.nav-link.active {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-color-light);
    border-left: 4px solid var(--secondary-color);
    font-weight: 600;
}

.nav-link i {
    margin-right: 15px;
    width: 20px;
    text-align: center;
}

.logout-container {
    padding: 20px;
}

.logout-btn {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-color-light);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s ease-in-out;
}

.logout-btn:hover { background: var(--accent-color); }

/* --- RODAPÉ (FOOTER) --- */
.footer {
    background: var(--text-color-light);
    color: var(--text-color);
    text-align: center;
    padding: 20px;
    border-top: 1px solid var(--border-color);
    font-size: 14px;
}

/* --- CONTEÚDO DAS PÁGINAS --- */
.page-header {
    margin-bottom: 30px;
}
.page-header.centered-header {
    text-align: center;
}
.page-header h2 {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 5px;
}
.page-header p {
    font-size: 16px;
    color: var(--text-color);
}

.tab-content { display: none; }
.tab-content.active { display: block; animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* --- CARDS PADRÃO --- */
.card {
    background: var(--text-color-light);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 25px;
    margin-bottom: 25px;
}
.card h3 {
    margin-bottom: 20px;
    font-size: 20px;
    color: var(--primary-color);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

/* --- BANNER DE BOAS-VINDAS --- */
.welcome-banner {
    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
    background-size: 200% 200%;
    color: var(--text-color-light);
    border-radius: var(--border-radius);
    padding: 40px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: gradient-animation 10s ease infinite;
}

/* Reutilizando a animação de gradiente para a tela de login */
@keyframes gradient-animation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.welcome-text h2 {
    font-size: 28px;
    margin-bottom: 5px;
}
.welcome-icon i {
    font-size: 50px;
    opacity: 0.5;
    animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* --- BOTÕES DE ACESSO RÁPIDO (CTA) --- */
.cta-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 40px;
}
.cta-button {
    background-color: var(--text-color-light);
    border-radius: var(--border-radius);
    padding: 25px;
    text-decoration: none;
    color: var(--text-color);
    box-shadow: var(--box-shadow);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}
.cta-button:hover {
    transform: translateY(-5px);
    box-shadow: var(--box-shadow-hover);
    background-color: var(--secondary-color);
    color: var(--text-color-light);
}
.cta-button i {
    font-size: 28px;
    margin-bottom: 15px;
    color: var(--secondary-color);
    transition: color 0.3s ease;
}
.cta-button:hover i {
    color: var(--text-color-light);
}
.cta-button span {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-color);
    transition: color 0.3s ease;
}
.cta-button:hover span {
    color: var(--text-color-light);
}
.cta-button p {
    font-size: 14px;
    margin-top: 5px;
    transition: color 0.3s ease;
}
.cta-button:hover p {
    color: rgba(255,255,255,0.8);
}

/* --- GRID DE SERVIÇOS E MÉDICOS --- */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
}

.service-card {
    background: var(--text-color-light);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 25px;
    text-align: center;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    position: relative;
}
.service-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--box-shadow);
}
.service-icon {
    background-color: var(--secondary-color);
    color: var(--text-color-light);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px auto;
    font-size: 24px;
}
.service-card h3 {
    margin-bottom: 10px;
    color: var(--primary-color);
    font-size: 18px;
}
.admin-edit-btn {
    position: absolute;
    top: 15px;
    right: 15px;
}

/* --- FORMULÁRIOS --- */
.form-group {
    margin-bottom: 20px;
}
.form-group label, .form-group > strong {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 14px;
}
.form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    outline: none;
    border-color: var(--secondary-color);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}
.form-group textarea {
    min-height: 120px;
    resize: vertical;
}
.form-group.checkbox-group {
    display: flex;
    align-items: center;
    gap: 10px;
}
.form-group.checkbox-group input {
    width: auto;
}
.checkbox-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
.checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
}
.required { color: var(--accent-color); }

/* --- BOTÕES MODERNIZADOS --- */
.btn-primary, .btn-secondary, .btn-danger, .auth-btn {
    border: none;
    padding: 12px 25px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.btn-primary, .auth-btn {
    background: var(--secondary-color);
    color: var(--text-color-light);
}
.btn-primary:hover, .auth-btn:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
.btn-secondary {
    background: #bdc3c7;
    color: var(--dark-color);
}
.btn-secondary:hover {
    background: #95a5a6;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.btn-danger {
    background: var(--accent-color);
    color: var(--text-color-light);
}
.btn-danger:hover {
    background: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
.auth-btn {
    width: 100%;
    padding: 15px;
    font-size: 18px;
}
.auth-btn:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    box-shadow: none;
    transform: translateY(0);
}

.btn-sm {
    padding: 8px 16px;
    font-size: 14px;
}

/* --- PÁGINA DE INFORMES (NOTÍCIAS) --- */
.news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
}
#latestInformesList.news-grid {
    max-width: 1000px;
    margin: 0 auto 40px auto;
}
.news-card {
    background: var(--text-color-light);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;
}
.news-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--box-shadow-hover);
}
.news-card-image {
    height: 180px;
    background-size: cover;
    background-position: center;
}
.news-card-content {
    padding: 20px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}
.news-card-content h3 {
    margin: 0 0 10px 0;
    font-size: 20px;
    color: var(--primary-color);
    border: none;
    padding: 0;
}
.news-card-content p {
    flex-grow: 1;
    color: 555;
    margin-bottom: 15px;
}
.news-card-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #7f8c8d;
}
.admin-actions {
    display: flex;
    gap: 10px;
}
.btn-icon {
    background: none; border: none; cursor: pointer;
    font-size: 16px; color: #95a5a6;
    padding: 5px; border-radius: 50%;
    width: 32px; height: 32px;
    transition: all 0.2s;
}
.btn-icon:hover {
    background-color: var(--border-color);
    color: var(--primary-color);
}
.btn-icon.delete-informe-btn:hover {
    color: var(--accent-color);
}

/* --- PÁGINA DE AGENDamentos --- */
.appointments-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.appointment-card {
    background: var(--text-color-light);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-left: 5px solid var(--secondary-color);
    display: flex;
    align-items: center;
    gap: 20px;
}
.appointment-card-icon {
    font-size: 24px;
    color: var(--secondary-color);
}
.appointment-card-info h3 {
    font-size: 18px;
    color: var(--primary-color);
    margin: 0 0 5px 0;
    border: none;
    padding: 0;
}
.appointment-card-info p {
    margin: 0;
    color: var(--text-color);
    font-size: 14px;
}
.appointment-card-info .date {
    font-weight: 600;
    color: #7f8c8d;
    font-size: 14px;
}

/* --- ESTILOS PARA CARGOS --- */
.role-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: 700;
    margin-top: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.role-tag.estudante { background-color: #2ecc71; color: white; }
.role-tag.estagiario { background-color: #F5F5DC; color: #8B4513; }
.role-tag.paramedico { background-color: #9b59b6; color: white; }
.role-tag.interno { background-color: #16a085; color: white; }
.role-tag.residente { background-color: #2980b9; color: white; }
.role-tag.medico { background-color: #bdc3c7; color: #2c3e50; }
.role-tag.supervisor { background-color: #34495e; color: white; }
.role-tag.coordenador-geral { background-color: #7f5539; color: white; }
.role-tag.diretor-geral { background-color: #c0392b; color: white; }
.role-tag.diretor-presidente { background-color: #f1c40f; color: #2c3e50; }
.role-tag.utilizador { background-color: #ecf0f1; color: #2c3e50; border: 1px solid #bdc3c7;}

/* --- ESTILOS PARA O MAPA DE LOCALIZAÇÃO --- */
.location-map {
    width: 100%;
    height: auto;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
}

/* --- PÁGINA DE CURSOS --- */
.admin-controls-container {
    display: none;
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}
.courses-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.course-card {
    background-color: var(--text-color-light);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: all 0.2s ease-in-out;
    border-left: 5px solid var(--secondary-color);
    position: relative;
}
.course-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--box-shadow-hover);
}
.course-icon {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    background-color: var(--secondary-color);
    color: var(--text-color-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
}
.course-info {
    flex-grow: 1;
}
.course-info h3 {
    margin: 0 0 5px 0;
    padding: 0;
    border: none;
    font-size: 18px;
    color: var(--primary-color);
}
.course-info p {
    margin: 0;
    color: var(--text-color);
}
.course-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.course-actions .btn-icon {
    color: var(--secondary-color);
}
.course-actions .btn-icon:hover {
    background-color: var(--light-color);
}

.course-actions a.btn-secondary.disabled {
    background-color: #e0e0e0;
    border-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
    pointer-events: none;
}


.completion-badge {
    display: none;
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 20px;
    color: var(--success-color);
}
.course-card.approved {
    border-left-color: var(--success-color);
}
.course-card.approved .completion-badge {
    display: block;
}

.course-card.reproved {
    border-left-color: var(--accent-color);
}

.status-tag {
    font-weight: bold;
    padding: 6px 12px;
    border-radius: var(--border-radius);
    font-size: 12px;
    text-transform: uppercase;
}
.status-tag.approved {
    background-color: var(--success-color);
    color: white;
}
.status-tag.reproved {
    background-color: var(--accent-color);
    color: white;
}
.status-tag.pending {
    background-color: var(--warning-color);
    color: var(--dark-color);
}


/* --- PÁGINA DE MÉDICOS (NOVO) --- */
.doctor-details {
    font-size: 14px;
    color: var(--text-color);
    margin-top: 15px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.doctor-details p {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.doctor-details i {
    color: var(--secondary-color);
    width: 15px;
    text-align: center;
}

/* --- PÁGINA DE APROVAÇÕES E RELATÓRIOS (ADMIN) --- */
.approvals-container, .reports-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.course-approval-card, .report-selection-card {
    background-color: var(--text-color-light);
    padding: 25px;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
}
.course-approval-card h3 {
    font-size: 20px;
    color: var(--primary-color);
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
}
.user-approval-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.user-approval-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    background-color: var(--background-color);
    border-radius: var(--border-radius);
    flex-wrap: wrap;
    gap: 15px;
}
.user-approval-item .user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-grow: 1;
}
.user-approval-item .user-info img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}
.user-approval-item .user-info span {
    font-weight: 600;
}
.completion-date {
    font-size: 14px;
    color: var(--text-color);
    flex-shrink: 0;
}
.approval-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

/* Estilos de Relatórios */
.report-selection-card .report-role-header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 15px;
}
.report-role-header h3 {
    margin: 0;
    border: none;
    padding: 0;
    font-size: 20px;
}
.report-role-header label {
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
}
.report-info {
    flex-grow: 1;
    display: flex;
    align-items: center;
    gap: 15px;
}
.report-info p {
    font-size: 14px;
    color: var(--text-color);
    margin: 0;
}
.report-item-details {
    display: flex;
    flex-direction: column;
}

input[type="checkbox"].report-checkbox,
input[type="checkbox"].role-checkbox {
    width: 20px;
    height: 20px;
    cursor: pointer;
}


/* --- MODAL --- */
.modal { display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); align-items: center; justify-content: center; animation: modalFadeIn 0.3s ease; }
@keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-content {
    background-color: white;
    border-radius: var(--border-radius);
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    padding: 30px;
    position: relative;
    max-height: 90vh; /* Limita a altura máxima do modal */
    overflow-y: auto; /* Adiciona a barra de rolagem vertical se necessário */
}
.modal.modal-lg .modal-content {
    max-width: 900px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 20px;
}
.modal-header h2 {
    margin: 0;
}

.course-embed-container {
    position: relative;
    width: 100%;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
    height: 0;
}
.course-embed-container > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
}
.close-modal { position: absolute; top: 15px; right: 20px; font-size: 28px; cursor: pointer; color: #bdc3c7; transition: color 0.2s; }
.close-modal:hover { color: var(--dark-color); }
.modal-content h3, .modal-content h2 { margin-bottom: 25px; color: var(--primary-color); display: flex; align-items: center; gap: 10px; }
.form-buttons { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 25px; width: 100%; }
.form-buttons .btn-danger { margin-right: auto; } /* Empurra o botão de excluir para a esquerda */

/* NOVO: Estilos para Modal de Visualização de Informe */
.informe-modal-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
}
.informe-modal-date {
    font-size: 14px;
    color: #7f8c8d;
    margin-bottom: 20px;
}
.informe-modal-content {
    line-height: 1.7;
    white-space: pre-wrap; /* Preserva as quebras de linha do texto */
}

/* NOVO: Modal de Seleção de Avatar */
.avatar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
}
.avatar-option {
    width: 100%;
    padding-top: 100%; /* Mantém o aspect-ratio 1:1 */
    position: relative;
    cursor: pointer;
    border-radius: 50%;
    border: 3px solid transparent;
    transition: all 0.2s ease;
}
.avatar-option img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}
.avatar-option.selected {
    border-color: var(--secondary-color);
    transform: scale(1.1);
}

/* --- AUTENTICAÇÃO (ATUALIZADO COM GRADIENTE) --- */
.auth-container { 
    position: relative;
    justify-content: center; 
    align-items: center; 
    padding: 20px; 
    overflow: hidden;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color), var(--moderator-color));
    background-size: 400% 400%;
    animation: gradient-animation 15s ease infinite;
}

.auth-card { 
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: var(--border-radius); 
    box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
    width: 100%; 
    max-width: 450px; 
    overflow: hidden; 
    z-index: 2;
}
.auth-header { background: transparent; color: var(--primary-color); padding: 30px; text-align: center; }
.auth-header h2 { font-size: 28px; margin-bottom: 5px; }
.auth-tabs { display: flex; }
.auth-tab { flex: 1; padding: 15px; background: transparent; border: none; cursor: pointer; font-weight: 600; font-size: 16px; transition: all 0.2s; border-bottom: 3px solid transparent; color: var(--text-color);}
.auth-tab.active { border-bottom: 3px solid var(--secondary-color); color: var(--primary-color); }
.auth-form { display: none; padding: 30px; }
.auth-form.active { display: block; }
.input-group { 
    display: flex; 
    align-items: center; 
    margin-bottom: 25px; /* Aumenta o espaço */
    border: none;
    border-bottom: 2px solid var(--border-color);
    border-radius: 0; 
    background: transparent;
    padding: 5px 0;
}
.input-group i { padding: 0 15px 0 5px; color: var(--text-color); }
.input-group input { 
    border: none; 
    padding-left: 0; 
    background: transparent;
    font-size: 16px;
    color: var(--primary-color);
}
.input-group input::placeholder {
    color: var(--text-color);
    opacity: 0.7;
}
.input-group:focus-within {
    border-bottom-color: var(--secondary-color);
}
.input-group input:focus { box-shadow: none; }
.forgot-password { display: block; text-align: center; margin-top: 20px; color: var(--secondary-color); text-decoration: none; font-size: 14px; }
.loading-spinner { display: none; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s ease infinite; }
.alert { padding: 15px; margin-bottom: 20px; border-radius: var(--border-radius); display: none; }
.alert.error { background: #fbe9e7; color: #c62828; }
.alert.success { background: #e8f5e9; color: #2e7d32; }

/* CONFIRMAÇÃO AGENDAMENTO */
.confirmation-icon { color: var(--success-color); font-size: 50px; margin-bottom: 15px; }
.confirmation h2 { color: var(--primary-color); }
.confirmation p { margin-bottom: 20px; }
.confirmation-details { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: var(--border-radius); border-left: 4px solid var(--secondary-color); }
.confirmation-details h3 { font-size: 18px; margin-bottom: 10px; }
.confirmation-details p { font-size: 16px; margin: 5px 0; }

/* RESPONSIVIDADE */
@media (max-width: 992px) {
    .sidebar { transform: translateX(-250px); }
    .sidebar.active { transform: translateX(0); }
    .main-content { margin-left: 0; }
    .menu-toggle { display: block; position: fixed; top: 20px; left: 20px; z-index: 1001; background: var(--dark-color); color: white; border: none; width: 45px; height: 45px; border-radius: 50%; font-size: 20px; cursor: pointer; }
    .header { padding-left: 80px; }
}

@media (max-width: 768px) {
    .container { padding: 20px; }
    .header { flex-direction: column; gap: 10px; align-items: flex-start; padding-left: 70px; }
    .page-header h2 { font-size: 24px; }
    .news-grid, .services-grid { grid-template-columns: 1fr; }
    .form-buttons { flex-direction: column; gap: 15px; }
    .form-buttons button { width: 100%; }
    .form-buttons .btn-danger { margin-right: 0; order: 3; }
}

/* NOVO: Estilos para layout do modal de curso */
.course-modal-layout {
    display: flex;
    gap: 20px;
}
.course-modal-details {
    flex: 0 0 250px; /* Largura fixa para os detalhes */
}
.course-modal-content-area {
    flex: 1; /* Ocupa o espaço restante */
}

