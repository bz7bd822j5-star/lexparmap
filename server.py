# Serveur local avec Service Worker
# Lancez avec: python3 server.py

import http.server
import socketserver
import mimetypes
import os
from pathlib import Path

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ServiceWorkerHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Handler avec headers PWA appropriés"""

    def end_headers(self):
        """Ajouter headers personnalisés"""
        
        # CORS pour Nominatim
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        
        # Cache Control
        if self.path.endswith('.js') or self.path.endswith('.css'):
            # Assets: Cache 30 jours (SW gérera les updates)
            self.send_header('Cache-Control', 'public, max-age=2592000')
        elif self.path.endswith('.json'):
            # JSON: Cache 24 heures (SW gérera les updates)
            self.send_header('Cache-Control', 'public, max-age=86400')
        elif self.path.endswith('.html'):
            # HTML: Pas de cache (SW gérera)
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        else:
            # Défaut: Cache 1 heure
            self.send_header('Cache-Control', 'public, max-age=3600')
        
        # MIME types importants
        if self.path.endswith('.webmanifest') or self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json; charset=utf-8')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        
        # PWA Headers
        self.send_header('Service-Worker-Allowed', '/')
        
        # Pour Service Worker fonctionner
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        
        super().end_headers()

    def do_GET(self):
        """Gérer les routes"""
        
        # Route: / → /index.html
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        # Supporter manifest à la racine
        if self.path == '/manifest' or self.path == '/manifest.webmanifest':
            self.path = '/manifest.json'
        
        # Service Worker à la racine
        if self.path == '/service-worker' or self.path == '/sw':
            self.path = '/sw.js'
        
        try:
            return super().do_GET()
        except Exception as e:
            print(f"❌ Erreur: {e}")
            self.send_error(500, "Erreur serveur")

def run_server():
    """Lancer le serveur"""
    os.chdir(DIRECTORY)
    
    Handler = ServiceWorkerHTTPHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"""
╔════════════════════════════════════════════════════════════╗
║  🚀 Serveur LexPar Map v2 + Service Worker               ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  URL:        http://localhost:{PORT}                      ║
║  Directory:  {DIRECTORY}                    
║                                                            ║
║  📱 Sur iPhone/Android:                                   ║
║     1. Réseau local: ifconfig | grep "inet "             ║
║     2. Accès: http://<IP>:{PORT}                         ║
║                                                            ║
║  🔄 Service Worker:                                      ║
║     - Auto-enregistré au chargement                      ║
║     - Vérifiez: DevTools → Application → SW              ║
║     - Console: swManager.getStatus()                     ║
║                                                            ║
║  📋 Headers appliqués:                                   ║
║     ✅ CORS enabled                                      ║
║     ✅ Cache-Control approprié                           ║
║     ✅ Security headers                                  ║
║     ✅ Service-Worker-Allowed: /                         ║
║                                                            ║
║  Ctrl+C pour quitter                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        """)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ Serveur arrêté")

if __name__ == "__main__":
    run_server()
