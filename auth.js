// ========== SYSTÈME AUTHENTIFICATION USER/ADMIN ==========

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.roles = {
      USER: 'user',
      ADMIN: 'admin'
    };
    
    // Utilisateurs prédéfinis (en prod: base de données)
    this.users = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123', // À hasher en production
        role: this.roles.ADMIN,
        name: 'Administrateur PM'
      }
    ];
    
    this.init();
  }
  
  init() {
    // Vérifier si session admin active
    const savedUser = localStorage.getItem('lexpar_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        if (this.isAdmin()) {
          this.showApp();
          this.updateUIForRole();
          return;
        }
      } catch (e) {
        console.error('Session invalide', e);
      }
    }
    
    // Par défaut: mode utilisateur sans login
    this.currentUser = {
      id: 0,
      username: 'user',
      role: this.roles.USER,
      name: 'Agent Utilisateur'
    };
    this.showApp();
    this.updateUIForRole();
  }
  
  login(username, password) {
    const user = this.users.find(u => 
      u.username === username && u.password === password
    );
    
    if (user) {
      // Ne pas stocker le mot de passe
      this.currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      };
      
      localStorage.setItem('lexpar_user', JSON.stringify(this.currentUser));
      this.showApp();
      this.updateUIForRole();
      return true;
    }
    
    return false;
  }
  
  logout() {
    localStorage.removeItem('lexpar_user');
    // Retour en mode utilisateur
    this.currentUser = {
      id: 0,
      username: 'user',
      role: this.roles.USER,
      name: 'Agent Utilisateur'
    };
    this.updateUIForRole();
    location.reload(); // Recharger pour réinitialiser l'interface
  }
  
  isAdmin() {
    return this.currentUser && this.currentUser.role === this.roles.ADMIN;
  }
  
  isUser() {
    return this.currentUser && this.currentUser.role === this.roles.USER;
  }
  
  showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
  
  showAdminLogin() {
    this.showLogin();
  }
  
  showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // Initialiser la carte après affichage
    setTimeout(() => {
      if (typeof initMap === 'function') {
        initMap();
      } else if (typeof map !== 'undefined' && map) {
        map.invalidateSize();
      }
    }, 100);
  }
  
  updateUIForRole() {
    if (!this.currentUser) return;
    
    // Afficher nom utilisateur dans top-bar
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = this.currentUser.name;
      userInfo.style.display = 'block';
    }
    
    // Afficher badge rôle
    const roleBadge = document.getElementById('role-badge');
    if (roleBadge) {
      roleBadge.textContent = this.isAdmin() ? '👮 ADMIN' : '👤 USER';
      roleBadge.className = this.isAdmin() ? 'role-badge admin' : 'role-badge user';
      roleBadge.style.display = 'inline-block';
    }
    
    // Gérer visibilité boutons logout et admin login
    const logoutBtn = document.getElementById('logout-btn');
    const adminLoginBtn = document.getElementById('btnAdminLogin');
    
    if (this.isAdmin()) {
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (adminLoginBtn) adminLoginBtn.style.display = 'none';
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (adminLoginBtn) adminLoginBtn.style.display = 'block';
    }
    
    // Permissions selon rôle
    if (this.isAdmin()) {
      this.enableAdminFeatures();
    } else {
      this.enableUserFeatures();
    }
  }
  
  enableAdminFeatures() {
    console.log('🔓 Mode ADMIN activé');
    
    // Admin peut tout faire
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'block';
    });
    
    // Bouton édition/suppression dans popups
    this.enableEditMode = true;
    
    // Stats avancées
    this.showAdminStats();
  }
  
  enableUserFeatures() {
    console.log('👤 Mode USER activé');
    
    // User peut supprimer avec confirmation mais pas autres fonctions admin
    document.querySelectorAll('.admin-only').forEach(el => {
      // Garder visible le bouton supprimer pour users
      if (el.id !== 'btnDelete') {
        el.style.display = 'none';
      }
    });
    
    this.enableEditMode = false;
  }
  
  showAdminStats() {
    // Stats uniquement pour admin
    if (!this.isAdmin()) return;
    
    const statsBtn = document.createElement('button');
    statsBtn.className = 'btn-secondary admin-only';
    statsBtn.innerHTML = '📊';
    statsBtn.title = 'Statistiques Admin';
    statsBtn.onclick = () => this.openStatsPanel();
    
    const topBarRight = document.querySelector('.top-bar-right');
    if (topBarRight) {
      topBarRight.appendChild(statsBtn);
    }
  }
  
  openStatsPanel() {
    alert('📊 Statistiques Admin\n\nFonctionnalité à développer:\n- Nombre total de données\n- Données par type\n- Logs accès\n- Gestion utilisateurs');
  }
  
  // Vérifier permission avant action
  checkPermission(action) {
    if (action === 'edit' || action === 'delete' || action === 'export') {
      return this.isAdmin();
    }
    return true; // Lecture autorisée pour tous
  }
}

// Instance globale
let authManager;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  authManager = new AuthManager();
  
  // Event listeners login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      
      if (authManager.login(username, password)) {
        document.getElementById('login-error').style.display = 'none';
        console.log('✅ Connexion réussie');
      } else {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('login-error').textContent = '❌ Identifiants incorrects';
      }
    });
  }
  
  // Bouton déconnexion
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        authManager.logout();
      }
    });
  }
  
  // Bouton Admin Login
  const adminLoginBtn = document.getElementById('btnAdminLogin');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', () => {
      authManager.showAdminLogin();
    });
  }
});

console.log('🔐 Système authentification chargé');
