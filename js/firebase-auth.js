// Firebase Authentication directo (más simple y confiable)
import { appState, updateState } from "./state.js";
import { loadUserData } from "./storage.js";
import { setupRealtimeSync } from "./firebase.js";

let auth = null;
let isAuthInitialized = false;

// Inicializar Firebase Auth
export async function initializeFirebaseAuth() {
  try {
    // Verificar que Firebase esté disponible
    if (!window.firebaseAuth) {
      console.warn("⚠️ Firebase Auth no está disponible");
      return false;
    }

    auth = window.firebaseAuth;

    // Importar funciones de Firebase Auth
    const { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } =
      await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
      );

    // Configurar listener de cambios de autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("🔥 Usuario autenticado en Firebase:", user.displayName);

        // Actualizar estado de la aplicación
        updateState({
          user: {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            picture: user.photoURL,
          },
        });

        // Actualizar UI
        updateAuthUI();

        // Cargar datos del usuario
        try {
          await loadUserData();
          console.log("✅ Datos del usuario cargados correctamente");
        } catch (error) {
          console.error("❌ Error cargando datos del usuario:", error);
        }

        // Configurar sincronización en tiempo real
        try {
          const unsubscribe = await setupRealtimeSync(user.uid);
          if (unsubscribe) {
            updateState({ firebaseUnsubscribe: unsubscribe });
            console.log("🔄 Sincronización en tiempo real configurada");
          }
        } catch (error) {
          console.warn(
            "⚠️ No se pudo configurar sincronización en tiempo real:",
            error
          );
        }
      } else {
        console.log("👋 Usuario desconectado");

        // Limpiar estado
        updateState({
          user: null,
          firebaseUnsubscribe: null,
          lastSyncTime: null,
        });

        updateAuthUI();
      }
    });

    isAuthInitialized = true;
    console.log("🔥 Firebase Auth inicializado correctamente");
    return true;
  } catch (error) {
    console.error("Error inicializando Firebase Auth:", error);
    return false;
  }
}

// Login con Google usando Firebase Auth
export async function loginWithGoogle() {
  try {
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado");
    }

    const { GoogleAuthProvider, signInWithPopup } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
    );

    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    // Forzar selección de cuenta y consentimiento cada vez
    provider.setCustomParameters({
      prompt: "consent select_account",
      //prompt: 'consent'
      //prompt: 'select_account'
    });

    console.log("🔄 Iniciando login con Google...");
    const result = await signInWithPopup(auth, provider);

    console.log("✅ Login exitoso:", result.user.displayName);
    return result.user;
  } catch (error) {
    console.error("Error en login:", error);

    // Mostrar mensaje de error al usuario
    if (error.code === "auth/popup-closed-by-user") {
      console.log("ℹ️ Login cancelado por el usuario");
    } else if (error.code === "auth/popup-blocked") {
      alert(
        "El popup fue bloqueado. Por favor, permite popups para este sitio."
      );
    } else {
      alert("Error al iniciar sesión. Por favor, intenta de nuevo.");
    }

    throw error;
  }
}

// Logout
export async function logout() {
  try {
    if (!auth) {
      throw new Error("Firebase Auth no está inicializado");
    }

    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
    );

    console.log("👋 Cerrando sesión...");

    // Cancelar sincronización en tiempo real
    if (appState.firebaseUnsubscribe) {
      appState.firebaseUnsubscribe();
      console.log("🔄 Sincronización en tiempo real cancelada");
    }

    await signOut(auth);

    // Limpiar datos locales del usuario
    if (appState.user) {
      localStorage.removeItem(`collection_${appState.user.id}`);
      console.log("🗑️ Datos locales del usuario eliminados");
    }

    console.log("✅ Sesión cerrada correctamente");
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
}

// Actualizar UI de autenticación
function updateAuthUI() {
  const userInfo = document.getElementById("user-info");
  const googleAuthContainer = document.getElementById("google-auth-container");
  const userAvatar = document.getElementById("user-avatar");
  const userName = document.getElementById("user-name");

  if (appState.user) {
    // Usuario logueado
    if (userInfo) {
      userInfo.classList.remove("hidden");
    }
    if (googleAuthContainer) {
      googleAuthContainer.style.display = "none";
    }
    if (userAvatar && appState.user.picture) {
      userAvatar.src = appState.user.picture;
    }
    if (userName && appState.user.name) {
      userName.textContent = appState.user.name;
    }
  } else {
    // Usuario no logueado
    if (userInfo) {
      userInfo.classList.add("hidden");
    }
    if (googleAuthContainer) {
      googleAuthContainer.style.display = "block";

      // Crear botón de login si no existe
      if (!googleAuthContainer.querySelector(".firebase-login-btn")) {
        googleAuthContainer.innerHTML = `
          <button class="firebase-login-btn btn btn-primary" onclick="window.loginWithGoogle()">
            <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px;">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        `;
      }
    }
  }
}

// Verificar estado de autenticación
export function getAuthStatus() {
  return {
    initialized: isAuthInitialized,
    user: appState.user,
    authenticated: !!appState.user,
  };
}
