import { appState, updateState } from './state.js';
import { loadUserData } from './storage.js';
import { setupRealtimeSync } from './firebase.js';

// Configuración de Google Auth
export async function handleCredentialResponse(response) {
  const responsePayload = decodeJwtResponse(response.credential);

  updateState({
    user: {
      id: responsePayload.sub,
      name: responsePayload.name,
      email: responsePayload.email,
      picture: responsePayload.picture,
    }
  });

  updateAuthUI();
  
  console.log(`👤 Usuario logueado: ${responsePayload.name} (${responsePayload.email})`);
  
  // NUEVO: Autenticar también en Firebase Auth
  try {
    await authenticateWithFirebase(response.credential);
    console.log("🔥 Usuario autenticado en Firebase");
  } catch (error) {
    console.error("❌ Error autenticando en Firebase:", error);
  }
  
  // Cargar datos del usuario (Firebase primero, localStorage como respaldo)
  try {
    await loadUserData();
    console.log("✅ Datos del usuario cargados correctamente");
  } catch (error) {
    console.error("❌ Error cargando datos del usuario:", error);
  }
  
  // Configurar sincronización en tiempo real con Firebase
  try {
    const unsubscribe = await setupRealtimeSync(responsePayload.sub);
    if (unsubscribe) {
      // Guardar la función para poder cancelar la sincronización al hacer logout
      updateState({ firebaseUnsubscribe: unsubscribe });
      console.log("🔄 Sincronización en tiempo real configurada");
    }
  } catch (error) {
    console.warn("⚠️ No se pudo configurar sincronización en tiempo real:", error);
  }
}

// NUEVA FUNCIÓN: Autenticar en Firebase usando el token de Google
async function authenticateWithFirebase(googleCredential) {
  try {
    console.log("🔄 Intentando autenticar en Firebase...");
    
    // Verificar que Firebase Auth esté disponible
    if (!window.firebaseAuth) {
      throw new Error("Firebase Auth no está inicializado");
    }

    // Importar las funciones necesarias de Firebase Auth
    const { GoogleAuthProvider, signInWithCredential } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    // Crear credencial de Google para Firebase
    const credential = GoogleAuthProvider.credential(googleCredential);
    
    // Autenticar en Firebase
    const result = await signInWithCredential(window.firebaseAuth, credential);
    
    console.log("🔥 Firebase Auth exitoso:", result.user.uid);
    return result.user;
  } catch (error) {
    console.error("Error en Firebase Auth:", error);
    
    // Si falla la autenticación, continuar sin Firebase Auth
    // Los datos se guardarán solo localmente
    console.warn("⚠️ Continuando sin Firebase Auth - solo datos locales");
    return null;
  }
}

function decodeJwtResponse(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(jsonPayload);
}

export function updateAuthUI() {
  const userInfo = document.getElementById("user-info");
  const googleAuthContainer = document.getElementById("google-auth-container");
  const userAvatar = document.getElementById("user-avatar");
  const userName = document.getElementById("user-name");

  if (appState.user) {
    // Usuario logueado - mostrar info del usuario y ocultar login
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
    // Usuario no logueado - ocultar info del usuario y mostrar login
    if (userInfo) {
      userInfo.classList.add("hidden");
    }
    if (googleAuthContainer) {
      googleAuthContainer.style.display = "block";
    }
  }
}

export async function logout() {
  console.log("👋 Cerrando sesión...");
  
  // Cancelar sincronización en tiempo real con Firebase
  if (appState.firebaseUnsubscribe) {
    appState.firebaseUnsubscribe();
    console.log("🔄 Sincronización en tiempo real cancelada");
  }

  // Limpiar estado del usuario
  updateState({ 
    user: null, 
    currentCategory: null,
    firebaseUnsubscribe: null,
    lastSyncTime: null,
    // Resetear a categorías por defecto
    categories: [
      { id: "movies", name: "Películas", count: 0 },
      { id: "series", name: "Series", count: 0 },
      { id: "books", name: "Libros", count: 0 },
      { id: "games", name: "Videojuegos", count: 0 },
    ],
    items: [],
    manualOrder: {}
  });

  // Limpiar UI
  document.getElementById("items-title").textContent = "Selecciona una categoría";
  document.getElementById("add-item-btn").classList.add("hidden");
  document.getElementById("sort-controls").classList.add("hidden");
  const searchFilterControls = document.getElementById("search-filter-controls");
  if (searchFilterControls) {
    searchFilterControls.classList.add("hidden");
  }
  document.getElementById("items-container").innerHTML = "";

  updateAuthUI();
  
  // Cargar datos locales (sin usuario)
  try {
    await loadUserData();
    console.log("💾 Datos locales cargados después del logout");
  } catch (error) {
    console.error("❌ Error cargando datos locales:", error);
  }
  
  // Re-renderizar UI
  import('./ui.js').then(({ renderCategories }) => {
    renderCategories();
  });
}