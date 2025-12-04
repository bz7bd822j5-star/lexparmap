// ========== SYSTÈME AUTHENTIFICATION USER/ADMIN ==========

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.roles = {
      ADMIN: 'admin'
    };
    // Seul l'admin existe
    this.users = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: this.roles.ADMIN,
        name: 'Administrateur PM'
      }
    ];
    this.showApp();
  }
  
  init() {
    // Désactivé : plus de mode utilisateur direct
    // L'écran de login est affiché au démarrage
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
  
