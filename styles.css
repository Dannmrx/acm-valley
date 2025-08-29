:root {
    --primary-color: #4a6fa5;
    --secondary-color: #166088;
    --accent-color: #4cb5f5;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
    --success-color: #28a745;
    --error-color: #dc3545;
    --sidebar-width: 250px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: #f5f7fa;
    color: var(--dark-color);
    line-height: 1.6;
    display: flex;
    min-height: 100vh;
}

/* Auth Container - Login/Register */
.auth-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.auth-card {
    background: white;
    border-radius: 15px;
    padding: 2.5rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

.auth-header h2 {
    color: var(--secondary-color);
    margin-bottom: 0.5rem;
    font-size: 2rem;
}

.auth-header p {
    color: #666;
}

.auth-tabs {
    display: flex;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 2rem;
    overflow: hidden;
}

.auth-tab {
    flex: 1;
    padding: 12px;
    text-align: center;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 600;
    color: var(--dark-color); /* Cor do texto quando não ativo */
}

.auth-tab.active {
    background: var(--primary-color);
    color: white;
}

.auth-form {
    display: none;
}

.auth-form.active {
    display: block;
}

.input-group {
    position: relative;
    margin-bottom: 1.5rem;
}

.input-group i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
}

.input-group input {
    width: 100%;
    padding: 15px 15px 15px 45px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.input-group input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(76, 181, 245, 0.2);
}

.auth-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
    margin-bottom: 1rem;
}

.auth-btn:hover {
    transform: translateY(-2px);
}

.auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.forgot-password {
    text-align: center;
    color: var(--primary-color);
    text-decoration: none;
    font-size: 0.9rem;
    display: block;
    margin-top: 1rem;
}

.forgot-password:hover {
    text-decoration: underline;
}

/* Sidebar */
.sidebar {
    width: var(--sidebar-width);
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    padding: 1.5rem 0;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: 3px 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
}

.logo {
    text-align: center;
    padding: 0 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.logo p {
    font-size: 0.9rem;
    opacity: 0.8;
}

.sidebar-menu {
    list-style: none;
    padding: 1.5rem 0;
    flex-grow: 1;
}

.sidebar-menu li {
    margin-bottom: 0.5rem;
}

.sidebar-menu a {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: white;
    text-decoration: none;
    transition: all 0.3s;
    border-left: 4px solid transparent;
}

.sidebar-menu a:hover,
.sidebar-menu a.active {
    background-color: rgba(255, 255, 255, 0.1);
    border-left: 4px solid var(--accent-color);
}

.sidebar-menu i {
    margin-right: 10px;
    font-size: 1.2rem;
}

.logout-container {
    padding: 0 20px 20px;
    margin-top: auto;
}

.logout-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.logout-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* Main Content */
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    padding: 20px;
    transition: all 0.3s;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.page-title {
    font-size: 1.8rem;
    color: var(--secondary-color);
}

.user-info {
    display: flex;
    align-items: center;
}

.user-info img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    object-fit: cover;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
}

.card {
    background: white;
    border-radius: 10px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
