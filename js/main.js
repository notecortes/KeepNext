// Archivo principal que inicializa la aplicación
import { appState, resetState } from "./state.js";
import { handleCredentialResponse, updateAuthUI, logout } from "./auth.js";
import { initializeFirebaseAuth, loginWithGoogle, logout as firebaseLogout } from "./firebase-auth.js";
import {
  loadDataFromStorage,
  loadThemePreference,
  loadSortPreference,
  loadManualOrder,
} from "./storage.js";
import { selectCategory, deleteCategory, saveCategory } from "./categories.js";
import {
  deleteItem,
  saveItem,
  editItem,
  handleSortChange,
  toggleSortDirection,
} from "./items.js";
import {
  renderCategories,
  openCategoryModal,
  openItemModal,
  closeModals,
  setupStarRating,
  setRating,
  toggleTheme,
  applyTheme,
} from "./ui.js";
import { searchItemInfo, applySearchResults } from "./api.js";
import { setupFilters } from "./filter.js";
import { initI18n, changeLanguage } from "./i18n.js";
// Sistema de fallback removido - OAuth funcionando correctamente
import { checkConfiguration } from "./config-checker.js";
import { config, isConfigured, showConfigHelp } from "./config.js";
import { initializeFirebase, showFirebaseConfigHelp, setupRealtimeSync } from "./firebase.js";
import { showDataStatus, forceSave, forceLoad, getUserDataStatus } from "./storage.js";

// Hacer funciones disponibles globalmente para los event handlers en HTML
window.handleCredentialResponse = handleCredentialResponse;
window.selectCategory = selectCategory;
window.deleteCategory = deleteCategory;
window.deleteItem = deleteItem;
window.editItem = editItem;
window.setRating = setRating;
window.applySearchResults = applySearchResults;

// Funciones de debugging disponibles globalmente
window.showDataStatus = showDataStatus;
window.forceSave = forceSave;
window.forceLoad = forceLoad;
window.getUserDataStatus = getUserDataStatus;

// Funciones de Firebase Auth disponibles globalmente
window.loginWithGoogle = loginWithGoogle;
window.firebaseLogout = firebaseLogout;

// Funciones de i18n disponibles globalmente
window.changeLanguage = changeLanguage;

// OAuth funcionando correctamente - sistema de fallback removido

// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  loadDataFromStorage();
});

// Inicialización
async function initializeApp() {
  // Inicializar sistema de idiomas primero
  await initI18n();

  // OAuth configurado correctamente

  // Configurar categorías por defecto si no existen
  if (appState.categories.length === 0) {
    appState.categories = [
      { id: "movies", name: "Películas", count: 0 },
      { id: "series", name: "Series", count: 0 },
      { id: "books", name: "Libros", count: 0 },
      { id: "games", name: "Videojuegos", count: 0 },
      { id: "restaurants", name: "Restaurantes", count: 0 },
    ];
  }

  // Cargar preferencias
  loadThemePreference();
  loadSortPreference();
  loadManualOrder();

  // Aplicar tema
  applyTheme();

  // Renderizar UI inicial
  renderCategories();
  
  // Actualizar UI de autenticación
  updateAuthUI();

  // Configurar filtros
  setupFilters();

  // Configurar autenticación (Google OAuth + fallback)
  await setupAuthenticationSystem();

  // Inicializar Firebase
  initializeFirebaseApp();
}

// Inicializar Firebase
async function initializeFirebaseApp() {
  try {
    const firebaseInitialized = await initializeFirebase();
    if (firebaseInitialized) {
      console.log("🔥 Firebase inicializado correctamente");
      
      // Inicializar Firebase Auth después de Firebase
      const authInitialized = await initializeFirebaseAuth();
      if (authInitialized) {
        console.log("🔐 Firebase Auth inicializado correctamente");
      } else {
        console.warn("⚠️ Firebase Auth no se pudo inicializar");
      }
    } else {
      showFirebaseConfigHelp();
    }
  } catch (error) {
    console.warn("⚠️ Error inicializando Firebase:", error);
    showFirebaseConfigHelp();
  }
}

// Función showFirebaseStatus eliminada - no es necesaria

function setupEventListeners() {
  // Botones principales
  document
    .getElementById("add-category-btn")
    ?.addEventListener("click", openCategoryModal);
  document
    .getElementById("add-item-btn")
    ?.addEventListener("click", openItemModal);
  document.getElementById("logout-btn")?.addEventListener("click", firebaseLogout);
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  // Controles de ordenamiento
  document
    .getElementById("sort-select")
    ?.addEventListener("change", handleSortChange);
  document
    .getElementById("sort-direction-btn")
    ?.addEventListener("click", toggleSortDirection);

  // Modales
  document
    .getElementById("save-category-btn")
    ?.addEventListener("click", saveCategory);
  document.getElementById("save-item-btn")?.addEventListener("click", saveItem);
  document
    .getElementById("search-info-btn")
    ?.addEventListener("click", searchItemInfo);

  // Cerrar modales
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", closeModals);
  });

  // Cerrar modal al hacer clic fuera
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModals();
      }
    });
  });

  // Sistema de estrellas
  setupStarRating();

  // Configurar filtro de búsqueda
  setupSearchFilter();

  // Soporte táctil (si es necesario)
  setupTouchSupport();
}

// Configurar filtro de búsqueda
function setupSearchFilter() {
  const filterInput = document.getElementById("filter-input");
  const clearFilterBtn = document.getElementById("clear-filter-btn");
  const searchFilterControls = document.getElementById(
    "search-filter-controls"
  );

  if (filterInput) {
    filterInput.addEventListener("input", (e) => {
      const searchText = e.target.value.trim();
      appState.filterText = searchText;

      // Mostrar/ocultar botón de limpiar
      if (searchText) {
        clearFilterBtn?.classList.remove("hidden");
      } else {
        clearFilterBtn?.classList.add("hidden");
      }

      // Re-renderizar elementos con filtro
      if (appState.currentCategory) {
        import("./ui.js").then(({ renderItems }) => {
          renderItems();
        });
      }
    });
  }

  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      filterInput.value = "";
      appState.filterText = "";
      clearFilterBtn.classList.add("hidden");

      // Re-renderizar elementos sin filtro
      if (appState.currentCategory) {
        import("./ui.js").then(({ renderItems }) => {
          renderItems();
        });
      }
    });
  }
}

// OAuth funcionando correctamente - función de fallback removida

// Limpiar cualquier elemento de fallback que pueda estar persistiendo
function cleanupFallbackElements() {
  // Eliminar elementos de fallback que puedan estar en el DOM
  const fallbackElements = [
    '.auth-fallback',
    '.local-mode-option',
    '#local-login-fallback',
    '#local-login-immediate',
    '#local-login-option',
    '.local-mode-option',
    '[id*="local-login"]',
    '[class*="auth-fallback"]'
  ];
  
  fallbackElements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      console.log(`🧹 Eliminando elemento de fallback: ${selector}`);
      element.remove();
    });
  });
  
  // También limpiar cualquier texto que contenga los mensajes de fallback
  const googleAuthContainer = document.getElementById("google-auth-container");
  if (googleAuthContainer) {
    const textContent = googleAuthContainer.textContent || '';
    if (textContent.includes('Continuar sin cuenta') || 
        textContent.includes('Continue without account') ||
        textContent.includes('Google OAuth no está disponible')) {
      console.log("🧹 Limpiando contenedor de autenticación con mensajes de fallback");
      // Solo mantener los elementos de Google OAuth
      const googleElements = googleAuthContainer.querySelectorAll('[id^="g_id_"], .config-message, .google-error');
      googleAuthContainer.innerHTML = '';
      googleElements.forEach(element => {
        googleAuthContainer.appendChild(element);
      });
    }
  }
  
  console.log("🧹 Elementos de fallback limpiados");
}

// Configurar sistema de autenticación completo
async function setupAuthenticationSystem() {
  try {
    // Limpiar cualquier elemento de fallback persistente
    cleanupFallbackElements();
    
    // Configurar Google OAuth
    setupGoogleAuth();
    console.log("✅ Google OAuth configurado correctamente");
  } catch (error) {
    console.error("❌ Error configurando Google OAuth:", error);
  }
}



// Configurar Google OAuth
async function setupGoogleAuth() {
  // Mostrar ayuda de configuración si es necesario
  showConfigHelp();

  const googleAuthContainer = document.getElementById("google-auth-container");

  if (isConfigured()) {
    // Crear elementos de Google OAuth dinámicamente
    googleAuthContainer.innerHTML = `
      <div id="g_id_onload" 
           data-client_id="${config.googleClientId}"
           data-context="signin" 
           data-ux_mode="popup"
           data-callback="handleCredentialResponse" 
           data-auto_prompt="false">
      </div>
      <div id="g_id_signin" 
           data-type="standard" 
           data-shape="rectangular" 
           data-theme="outline"
           data-text="signin_with" 
           data-size="large" 
           data-logo_alignment="left">
      </div>
    `;

    // Función para inicializar Google cuando esté disponible
    function initializeGoogleAuth() {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        try {
          // Inicializar Google Identity Services
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Renderizar el botón de login
          const googleSignInDiv = document.getElementById("g_id_signin");
          if (googleSignInDiv) {
            window.google.accounts.id.renderButton(googleSignInDiv, {
              type: "standard",
              shape: "rectangular",
              theme: "outline",
              text: "signin_with",
              size: "large",
              logo_alignment: "left",
            });
          }

          // Mostrar el prompt de login automático si está configurado
          window.google.accounts.id.prompt();

          console.log("✅ Google OAuth inicializado correctamente");
        } catch (error) {
          console.error("Error inicializando Google OAuth:", error);
          showGoogleError(
            "Error al inicializar Google OAuth. Verifica tu configuración."
          );
        }
      } else {
        // Si Google aún no está disponible, intentar de nuevo en 100ms
        setTimeout(initializeGoogleAuth, 100);
      }
    }

    // Inicializar Google Auth cuando esté disponible
    initializeGoogleAuth();

    console.log("✅ Google OAuth configurado correctamente");
  } else {
    // Mostrar mensaje de configuración
    googleAuthContainer.innerHTML = `
      <div class="config-message">
        <div style="background: var(--warning-color); color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem;">
          ⚙️ <strong>Configuración requerida</strong><br>
          <small>Revisa la consola para instrucciones de Google OAuth</small>
        </div>
      </div>
    `;
  }
}

// Función para mostrar errores de Google OAuth
function showGoogleError(message) {
  const googleAuthContainer = document.getElementById("google-auth-container");
  if (googleAuthContainer) {
    googleAuthContainer.innerHTML = `
      <div class="google-error">
        <div style="background: var(--danger-color); color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem;">
          ❌ <strong>Error de Google OAuth</strong><br>
          <small>${message}</small>
        </div>
      </div>
    `;
  }
}

// Soporte táctil básico
function setupTouchSupport() {
  // Detectar si es un dispositivo táctil
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    document.body.classList.add("touch-device");

    // Agregar eventos táctiles específicos si es necesario
    document.addEventListener(
      "touchstart",
      function (e) {
        // Manejar inicio de toque
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      function (e) {
        // Manejar fin de toque
      },
      { passive: true }
    );
  }
}

// Detectar cambios en el tema del sistema
if (window.matchMedia) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", function (e) {
      if (!localStorage.getItem("theme-preference")) {
        appState.darkMode = e.matches;
        applyTheme();
      }
    });
}

// Manejar errores globales
window.addEventListener("error", function (e) {
  console.error("Error global:", e.error);
  // Aquí podrías agregar lógica para reportar errores o mostrar mensajes al usuario
});

// Manejar promesas rechazadas
window.addEventListener("unhandledrejection", function (e) {
  console.error("Promesa rechazada:", e.reason);
  // Aquí podrías agregar lógica para manejar errores de API
});

console.log("Aplicación de colecciones inicializada correctamente");

// Registrar Service Worker para PWA
registerServiceWorker();

// Función para registrar Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado correctamente:', registration.scope);
      
      // Manejar actualizaciones del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nueva versión del Service Worker disponible');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            showUpdateAvailable(registration);
          }
        });
      });
      
      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('📦 Cache actualizado');
        }
      });
      
      // Verificar si hay una actualización esperando
      if (registration.waiting) {
        showUpdateAvailable(registration);
      }
      
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  } else {
    console.warn('⚠️ Service Workers no soportados en este navegador');
  }
}

// Mostrar notificación de actualización disponible
function showUpdateAvailable(registration) {
  // Crear notificación de actualización
  const updateNotification = document.createElement('div');
  updateNotification.id = 'update-notification';
  updateNotification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      max-width: 300px;
      font-size: 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.25rem;">🚀</span>
        <strong>Nueva versión disponible</strong>
      </div>
      <p style="margin: 0 0 1rem 0; opacity: 0.9;">
        Hay una actualización de la aplicación lista para instalar.
      </p>
      <div style="display: flex; gap: 0.5rem;">
        <button id="update-btn" style="
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
        ">
          Actualizar
        </button>
        <button id="dismiss-btn" style="
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.8125rem;
        ">
          Después
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(updateNotification);
  
  // Manejar botón de actualizar
  document.getElementById('update-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  
  // Manejar botón de descartar
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    updateNotification.remove();
  });
  
  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (document.getElementById('update-notification')) {
      updateNotification.remove();
    }
  }, 10000);
}

// Detectar cuando la app se instala como PWA
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA instalable detectada');
  
  // Prevenir el prompt automático
  e.preventDefault();
  
  // Guardar el evento para usarlo después
  window.deferredPrompt = e;
  
  // Mostrar botón de instalación personalizado
  showInstallButton();
});

// Mostrar botón de instalación
function showInstallButton() {
  const installButton = document.createElement('button');
  installButton.id = 'install-pwa-btn';
  installButton.innerHTML = `
    <span style="margin-right: 0.5rem;">📱</span>
    Instalar App
  `;
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  installButton.addEventListener('click', async () => {
    if (window.deferredPrompt) {
      // Mostrar el prompt de instalación
      window.deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó instalar la PWA');
      } else {
        console.log('❌ Usuario rechazó instalar la PWA');
      }
      
      // Limpiar el prompt
      window.deferredPrompt = null;
      installButton.remove();
    }
  });
  
  // Efectos hover
  installButton.addEventListener('mouseenter', () => {
    installButton.style.transform = 'translateY(-2px) scale(1.05)';
  });
  
  installButton.addEventListener('mouseleave', () => {
    installButton.style.transform = 'translateY(0) scale(1)';
  });
  
  document.body.appendChild(installButton);
  
  // Auto-remover después de 30 segundos
  setTimeout(() => {
    if (document.getElementById('install-pwa-btn')) {
      installButton.remove();
    }
  }, 30000);
}

// Detectar cuando la app se instala
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA instalada correctamente');
  
  // Remover botón de instalación si existe
  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.remove();
  }
  
  // Mostrar mensaje de éxito
  const successMessage = document.createElement('div');
  successMessage.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      font-size: 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.25rem;">🎉</span>
        <strong>¡App instalada correctamente!</strong>
      </div>
    </div>
  `;
  
  document.body.appendChild(successMessage);
  
  setTimeout(() => {
    successMessage.remove();
  }, 5000);
});

// Mostrar estado inicial de los datos después de la inicialización
setTimeout(() => {
  showDataStatus();
}, 1000);

// Configurar guardado automático periódico (cada 30 segundos si hay cambios)
let lastDataHash = null;
setInterval(() => {
  if (appState.user) {
    const currentDataHash = JSON.stringify({
      categories: appState.categories,
      items: appState.items,
      manualOrder: appState.manualOrder
    });
    
    if (lastDataHash && lastDataHash !== currentDataHash) {
      console.log("🔄 Detectados cambios, guardando automáticamente...");
      import('./storage.js').then(({ saveDataToStorage }) => {
        saveDataToStorage();
      });
    }
    
    lastDataHash = currentDataHash;
  }
}, 30000); // 30 segundos

// Limpieza periódica de elementos de fallback (cada 5 segundos)
setInterval(() => {
  cleanupFallbackElements();
}, 5000); // 5 segundos
