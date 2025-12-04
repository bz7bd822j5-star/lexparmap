/* ========================================================
   📱 SERVICE WORKER CLIENT - Enregistrement & Gestion
   ======================================================== */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isOnline = navigator.onLine;
    this.cacheSize = 0;

    this.init();
  }

  /**
   * Initialiser le Service Worker
   */
  async init() {
    // Vérifier support
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers non supportés');
      return;
    }

    try {
      // Détection du chemin pour GitHub Pages
      let swPath = '/sw.js';
      let swScope = '/';
      if (window.location.pathname.startsWith('/lexparmap/')) {
        swPath = '/lexparmap/sw.js';
        swScope = '/lexparmap/';
      }
      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: swScope,
      });

      console.log('✅ Service Worker enregistré:', this.registration);

      // Écouter les mises à jour
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        this.checkForUpdates();
      }, 60 * 60 * 1000); // 1 heure

      // État online/offline
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Afficher infos cache
      this.updateCacheInfo();
    } catch (error) {
      console.error('❌ Erreur enregistrement Service Worker:', error);
    }
  }

  /**
   * Vérifier les mises à jour disponibles
   */
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('🔄 Vérification mises à jour effectuée');
    } catch (error) {
      console.error('❌ Erreur vérification mises à jour:', error);
    }
  }

  /**
   * Gestion: nouvelle version détectée
   */
  handleUpdateFound() {
    const newWorker = this.registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Nouvelle version disponible
        console.log('📦 Nouvelle version disponible');
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Afficher notification de mise à jour
   */
  showUpdateNotification() {
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: #0d47a1;
        color: white;
        padding: 12px 16px;
        text-align: center;
        z-index: 999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-weight: 500;
      ">
        ✨ Nouvelle version disponible!
        <button id="update-btn" style="
          margin-left: 12px;
          padding: 6px 12px;
          background: #f39c12;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: bold;
        ">
          Mettre à jour
        </button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    document.getElementById('update-btn').addEventListener('click', () => {
      this.acceptUpdate();
    });

    // Fermer auto après 5 secondes (persistera en bannière)
    setTimeout(() => {
      const btn = document.getElementById('update-btn');
      if (btn) {
        btn.textContent = 'Rafraîchir maintenant';
        btn.style.background = '#e74c3c';
      }
    }, 5000);
  }

  /**
   * Accepter la mise à jour
   */
  acceptUpdate() {
    if (!this.registration || !this.registration.waiting) return;

    // Dire au Service Worker en attente de prendre contrôle
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Quand le nouveau SW prend contrôle, rafraîchir la page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('🚀 Chargement nouvelle version...');
        refreshing = true;
        window.location.reload();
      }
    });
  }

  /**
   * Gérer les messages du Service Worker
   */
  handleServiceWorkerMessage(data) {
    const { type, url } = data;

    if (type === 'CACHE_UPDATED') {
      console.log(`♻️ Cache mis à jour: ${url}`);
      // Notifier l'utilisateur si données importantes
      if (
        url.includes('travaux.json') ||
        url.includes('perturbants.json')
      ) {
        this.showDataUpdatedNotification(url);
      }
    }
  }

  /**
   * Notification: données mises à jour
   */
  showDataUpdatedNotification(url) {
    // Toast simple
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 998;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        ✓ Données mises à jour
      </div>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * Gestion: retour online
   */
  handleOnline() {
    console.log('🟢 Retour en ligne');
    this.isOnline = true;

    // Marquer l'état
    document.body.style.opacity = '1';

    // Resynchroniser données si nécessaire
    this.syncData();

    // Notifier l'utilisateur
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 998;
        font-size: 14px;
      ">
        ✓ Connecté
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  /**
   * Gestion: offline
   */
  handleOffline() {
    console.log('🔴 Vous êtes hors ligne');
    this.isOnline = false;

    // Feedback visuel (demi-transparent)
    document.body.style.opacity = '0.8';

    // Notifier l'utilisateur
    const banner = document.createElement('div');
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 998;
        font-size: 14px;
      ">
        📶 Mode hors ligne (données en cache)
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
  }

  /**
   * Synchroniser données
   */
  async syncData() {
    // Utiliser Background Sync si disponible
    if ('sync' in this.registration) {
      try {
        await this.registration.sync.register('sync-data');
        console.log('🔄 Synchronisation en arrière-plan enregistrée');
      } catch (err) {
        console.warn('Background Sync non disponible:', err);
      }
    }
  }

  /**
   * Vider le cache
   */
  async clearCache() {
    if (!this.registration) return;

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('✅ Cache vidé');
          this.updateCacheInfo();
          resolve(true);
        }
      };

      // Envoyer message au Service Worker
      this.registration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    });
  }

  /**
   * Mettre en cache des URLs spécifiques
   */
  async cacheUrls(urls) {
    if (!this.registration) return;

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        console.log(`✅ ${event.data.cached} URLs mises en cache`);
        resolve(event.data);
      };

      this.registration.active.postMessage(
        { type: 'CACHE_URLS', payload: { urls } },
        [channel.port2]
      );
    });
  }

  /**
   * Obtenir taille du cache
   */
  async getCacheSize() {
    if (!this.registration) return 0;

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const sizeInMB = (event.data.size / (1024 * 1024)).toFixed(2);
        this.cacheSize = sizeInMB;
        resolve(event.data.size);
      };

      this.registration.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [channel.port2]
      );
    });
  }

  /**
   * Afficher infos cache dans console
   */
  async updateCacheInfo() {
    const size = await this.getCacheSize();
    const sizeInMB = (size / (1024 * 1024)).toFixed(2);

    console.log(`%c💾 Cache: ${sizeInMB} MB`, 'color: #3498db; font-weight: bold;');
  }

  /**
   * Obtenir l'état de la PWA
   */
  getStatus() {
    return {
      registered: !!this.registration,
      online: this.isOnline,
      cacheSize: this.cacheSize,
      updateAvailable: !!this.registration?.waiting,
    };
  }
}

/* ========================================================
   🚀 INITIALISER LE MANAGER
   ======================================================== */

const swManager = new ServiceWorkerManager();

// Exposer globalement pour debugging
window.swManager = swManager;

console.log('%c📱 PWA Manager initialisé', 'color: #27ae60; font-weight: bold;');
console.log('Utilisez: swManager.checkForUpdates(), swManager.clearCache(), etc.');
