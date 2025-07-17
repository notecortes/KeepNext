// Service Worker para Mi Colección Personal PWA
const CACHE_NAME = 'mi-coleccion-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Archivos estáticos para cachear
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  
  // JavaScript files
  '/js/main.js',
  '/js/state.js',
  '/js/ui.js',
  '/js/items.js',
  '/js/categories.js',
  '/js/storage.js',
  '/js/api.js',
  '/js/filter.js',
  '/js/i18n.js',
  '/js/config.js',
  '/js/firebase.js',
  '/js/firebase-auth.js',
  '/js/firebase-config.js',
  '/js/config-checker.js',
  
  // Localization files
  '/locales/es.json',
  '/locales/en.json',
  
  // Configuration files
  '/firebase.key.txt',
  '/firestore.rules',
  
  // Fallback offline page
  '/offline.html'
];

// URLs externas importantes
const EXTERNAL_RESOURCES = [
  'https://accounts.google.com/gsi/client',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
];

// APIs que pueden funcionar offline con cache
const API_CACHE_PATTERNS = [
  /^https:\/\/www\.omdbapi\.com\//,
  /^https:\/\/www\.googleapis\.com\/books\//,
  /^https:\/\/api\.rawg\.io\/api\//
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cache de archivos estáticos
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Cacheando archivos estáticos...');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Cache de recursos externos
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('🌐 Cacheando recursos externos...');
        return Promise.allSettled(
          EXTERNAL_RESOURCES.map(url => 
            cache.add(url).catch(err => 
              console.warn(`⚠️ No se pudo cachear: ${url}`, err)
            )
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker instalado correctamente');
      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todas las pestañas
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activado correctamente');
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estrategia para diferentes tipos de recursos
  if (request.method === 'GET') {
    if (isStaticFile(request.url)) {
      // Archivos estáticos: Cache First
      event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request.url)) {
      // APIs: Network First con fallback a cache
      event.respondWith(networkFirstWithCache(request));
    } else if (isImageRequest(request.url)) {
      // Imágenes: Cache First con network fallback
      event.respondWith(cacheFirstWithNetwork(request));
    } else {
      // Otros recursos: Network First
      event.respondWith(networkFirst(request));
    }
  }
});

// Estrategia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Error en cache first:', error);
    return getOfflineFallback(request);
  }
}

// Estrategia Network First con Cache
async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔄 Red no disponible, usando cache para:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Estrategia Cache First con Network fallback
async function cacheFirstWithNetwork(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

// Estrategia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Verificar si es un archivo estático
function isStaticFile(url) {
  return STATIC_FILES.some(file => url.includes(file)) ||
         url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.json') ||
         url.includes('manifest.json');
}

// Verificar si es una petición a API
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
         url.includes('omdbapi.com') ||
         url.includes('googleapis.com') ||
         url.includes('rawg.io');
}

// Verificar si es una imagen
function isImageRequest(url) {
  return url.includes('images.unsplash.com') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.png') ||
         url.includes('.gif') ||
         url.includes('.webp') ||
         url.includes('.svg');
}

// Obtener fallback offline
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    // Para páginas HTML, devolver página offline
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Aplicación offline', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (isImageRequest(request.url)) {
    // Para imágenes, devolver imagen placeholder
    return new Response(getOfflineImageSVG(), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  // Para otros recursos, devolver respuesta vacía
  return new Response('Recurso no disponible offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// SVG placeholder para imágenes offline
function getOfflineImageSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f1f5f9"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui" font-size="16" fill="#64748b">
        📱 Modo Offline
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui" font-size="12" fill="#94a3b8">
        Imagen no disponible
      </text>
    </svg>
  `;
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Manejar actualizaciones en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Sincronización en segundo plano');
    event.waitUntil(doBackgroundSync());
  }
});

// Función de sincronización en segundo plano
async function doBackgroundSync() {
  try {
    // Aquí puedes añadir lógica para sincronizar datos
    // cuando la conexión se restaure
    console.log('✅ Sincronización completada');
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  }
}

// Manejar notificaciones push (para futuras implementaciones)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Abrir App',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 Service Worker cargado correctamente');