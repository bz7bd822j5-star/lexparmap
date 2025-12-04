# 🔐 Système d'Authentification LexPar Map

## Vue d'ensemble

LexPar Map v2.1 implémente un système d'authentification avec **2 rôles** :
- **👤 USER** : Consultation uniquement
- **👮 ADMIN** : Consultation + Édition + Gestion

---

## 🔑 Comptes de test

### Utilisateur Standard
```
Identifiant : user
Mot de passe : user123
Rôle : USER (consultation)
```

### Administrateur
```
Identifiant : admin
Mot de passe : admin123
Rôle : ADMIN (tous pouvoirs)
```

---

## 📋 Fonctionnalités par rôle

### 👤 MODE USER

**Permissions :**
- ✅ Consulter la carte
- ✅ Voir tous les layers (Terrasses, Travaux, Perturbants, Arrêtés)
- ✅ Rechercher une adresse
- ✅ Géolocalisation "Autour de moi"
- ✅ Zoomer / déplacer la carte
- ✅ Voir les popups d'information

**Restrictions :**
- ❌ Pas d'édition de données
- ❌ Pas de suppression
- ❌ Pas d'export
- ❌ Pas de statistiques avancées
- ❌ Bouton "Supprimer" caché

---

### 👮 MODE ADMIN

**Permissions USER +**
- ✅ **Édition** : Modifier les données existantes
- ✅ **Suppression** : Bouton "Supprimer" visible
- ✅ **Export** : Exporter les données en JSON/CSV
- ✅ **Statistiques** : Bouton 📊 stats avancées
- ✅ **Logs** : Voir historique des actions
- ✅ **Gestion utilisateurs** : Ajouter/supprimer des comptes (à venir)

**Éléments visuels admin :**
- Badge doré **👮 ADMIN** dans top-bar
- Bouton "Supprimer" rouge visible
- Bouton 📊 Statistiques
- Options contextuelles supplémentaires dans popups

---

## 🔧 Implémentation technique

### Fichiers

```
auth.js           - Système authentification (AuthManager class)
index.html        - Écran login + app container
styles.css        - Styles login + badges rôle
```

### Classe AuthManager

```javascript
class AuthManager {
  constructor()               // Init + load session
  login(username, password)   // Authentification
  logout()                    // Déconnexion
  isAdmin()                   // Check si admin
  isUser()                    // Check si user
  checkPermission(action)     // Vérifier permission action
  updateUIForRole()           // Adapter UI selon rôle
}
```

### Stockage session

- **LocalStorage** : `lexpar_user`
- Format JSON : `{ id, username, role, name }`
- **Pas de mot de passe stocké** (sécurité)
- Session persistante (même après fermeture)

---

## 🚀 Utilisation

### 1. Première connexion

```
1. Ouvrir http://localhost:8000
2. Écran login s'affiche automatiquement
3. Entrer identifiant + mot de passe
4. Cliquer "Se connecter"
```

### 2. Session active

```
- Si déjà connecté → accès direct à l'app
- Badge rôle visible dans top-bar
- Permissions appliquées automatiquement
```

### 3. Déconnexion

```
- Cliquer bouton "🚪 Déco" (top-right)
- Confirmation demandée
- Retour à écran login
- Session effacée
```

---

## 🔒 Sécurité

### ⚠️ Version développement

**Cette version est un POC (Proof of Concept)** :
- Mots de passe en clair dans code (auth.js)
- Pas de backend sécurisé
- Pas de hash/salt
- Validation côté client uniquement

### ✅ Pour production

**À implémenter :**

1. **Backend API**
   ```javascript
   POST /api/login
   POST /api/logout
   GET /api/verify-token
   ```

2. **Hash mots de passe**
   ```javascript
   bcrypt.hash(password, 10)
   ```

3. **JWT Tokens**
   ```javascript
   jwt.sign({ userId, role }, SECRET_KEY, { expiresIn: '24h' })
   ```

4. **HTTPS obligatoire**
   ```
   Force SSL/TLS en production
   ```

5. **Rate limiting**
   ```javascript
   Max 5 tentatives / 15 min
   ```

6. **Session timeout**
   ```javascript
   Auto-déconnexion après 2h inactivité
   ```

---

## 🎨 Personnalisation UI

### Couleurs badges

```css
/* Admin */
.role-badge.admin {
  background: #d4af37;  /* Or */
  color: #0f3b5f;       /* Bleu foncé */
}

/* User */
.role-badge.user {
  background: #4dd0e1;  /* Bleu clair */
  color: #0f3b5f;
}
```

### Écran login

```css
.login-screen {
  background: linear-gradient(135deg, #0f3b5f 0%, #1a4d6f 50%, #0f3b5f 100%);
}

.login-container {
  border: 2px solid #d4af37; /* Bordure dorée */
}
```

---

## 📊 Gestion utilisateurs (Admin)

### Ajouter un utilisateur

```javascript
// Dans auth.js
this.users.push({
  id: 3,
  username: 'nouveau_user',
  password: 'pass123',
  role: 'user',
  name: 'Nouveau Agent'
});
```

### Modifier un rôle

```javascript
// Promouvoir user → admin
const user = this.users.find(u => u.id === 1);
user.role = this.roles.ADMIN;
```

---

## 🧪 Tests

### Test mode USER

```
1. Login : user / user123
2. Vérifier badge "👤 USER"
3. Vérifier bouton "Supprimer" caché
4. Vérifier pas de bouton 📊
5. Tester navigation carte (OK)
```

### Test mode ADMIN

```
1. Login : admin / admin123
2. Vérifier badge "👮 ADMIN"
3. Vérifier bouton "Supprimer" visible
4. Vérifier bouton 📊 statistiques
5. Tester toutes permissions
```

### Test session persistante

```
1. Login
2. Fermer navigateur
3. Rouvrir → toujours connecté
4. Logout → session effacée
5. Refresh → retour login
```

---

## 🔍 Debug

### Console logs

```javascript
// Voir utilisateur actuel
console.log(authManager.currentUser);

// Check si admin
console.log('Admin?', authManager.isAdmin());

// Voir tous les users
console.log(authManager.users);
```

### LocalStorage

```javascript
// Voir session stockée
localStorage.getItem('lexpar_user');

// Effacer session manuellement
localStorage.removeItem('lexpar_user');
```

---

## 📱 Responsive

Écran login optimisé pour :
- iPhone 16 Pro Max ✅
- Android (tous écrans) ✅
- iPad / Tablettes ✅
- Desktop ✅

```css
@media (max-width: 500px) {
  .login-container {
    padding: 30px 20px;
  }
  
  .login-title {
    font-size: 24px;
  }
}
```

---

## 🚀 Prochaines étapes

### Phase 2 : Backend

- [ ] API REST authentification
- [ ] Base de données utilisateurs
- [ ] JWT tokens
- [ ] Refresh tokens
- [ ] Password reset email

### Phase 3 : Permissions granulaires

- [ ] Permissions par layer
- [ ] Permissions géographiques (arrondissements)
- [ ] Permissions temporelles (horaires)
- [ ] Audit trail complet

### Phase 4 : Interface admin

- [ ] Panel gestion utilisateurs
- [ ] Logs d'activité
- [ ] Export rapports
- [ ] Dashboard analytics

---

## 📝 Notes importantes

1. **Sécurité** : Ne JAMAIS déployer en prod avec mots de passe hardcodés
2. **HTTPS** : Obligatoire pour login en production
3. **RGPD** : Documenter collecte/stockage données utilisateurs
4. **Backup** : Sauvegarder base users régulièrement
5. **2FA** : Envisager authentification 2 facteurs pour admin

---

## 📞 Support

Pour questions/bugs système auth :
- Vérifier logs console (F12)
- Tester avec comptes de test
- Vider localStorage si problème session
- Vérifier fichier `auth.js` chargé correctement

---

**Version** : 2.1
**Date** : 4 décembre 2025
**Auteur** : LexPar Map Team
