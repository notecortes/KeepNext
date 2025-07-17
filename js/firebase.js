// Configuración y funciones de Firebase
import { appState } from './state.js';

// Configuración de Firebase - REEMPLAZA CON TUS DATOS
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC8rvpOcMdbE0Rd3NQeH73UKdsRtcGfHPY",
    authDomain: "saveitforlater-77eef.firebaseapp.com",
    projectId: "saveitforlater-77eef",
    storageBucket: "saveitforlater-77eef.firebasestorage.app",
    messagingSenderId: "242756676535",
    appId: "1:242756676535:web:1c77e6c0da73ecf0a89632",
    measurementId: "G-VDL5PNCD3R"
  };

// Variables para Firebase
let db = null;
let isFirebaseInitialized = false;

// Inicializar Firebase
export async function initializeFirebase() {
  try {
    // Verificar si Firebase está configurado
    if (!isFirebaseConfigured()) {
      console.warn("🔥 Firebase no está configurado. Los datos se guardarán solo localmente.");
      return false;
    }

    // Importar Firebase dinámicamente
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getAuth, signInWithCredential, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    // Inicializar Firebase Auth
    const auth = getAuth(app);
    
    // Guardar referencia global para debugging
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    
    isFirebaseInitialized = true;
    console.log("🔥 Firebase inicializado correctamente");
    return true;
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
    return false;
  }
}

// Verificar si Firebase está configurado
function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "TU_API_KEY_AQUI" && 
         firebaseConfig.projectId !== "tu-proyecto-id";
}

// Función para limpiar campos undefined recursivamente
function cleanUndefinedFields(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedFields(item)).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        const cleanedValue = cleanUndefinedFields(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

// Guardar datos del usuario en Firebase
export async function saveUserDataToFirebase(userId, userData) {
  if (!isFirebaseInitialized || !userId) {
    console.warn("Firebase no inicializado o usuario no válido");
    return false;
  }

  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const userDoc = doc(db, 'users', userId);
    
    // Limpiar todos los datos de campos undefined
    const cleanedData = {
      categories: cleanUndefinedFields(userData.categories || []),
      items: cleanUndefinedFields(userData.items || []),
      manualOrder: cleanUndefinedFields(userData.manualOrder || {}),
      lastUpdated: new Date().toISOString(),
      userInfo: cleanUndefinedFields({
        name: appState.user?.name,
        email: appState.user?.email,
        picture: appState.user?.picture
      })
    };
    
    await setDoc(userDoc, cleanedData, { merge: true });

    console.log("✅ Datos guardados en Firebase");
    return true;
  } catch (error) {
    console.error("Error guardando en Firebase:", error);
    return false;
  }
}

// Cargar datos del usuario desde Firebase
export async function loadUserDataFromFirebase(userId) {
  if (!isFirebaseInitialized || !userId) {
    console.warn("Firebase no inicializado o usuario no válido");
    return null;
  }

  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ Datos cargados desde Firebase");
      return {
        categories: data.categories || [],
        items: data.items || [],
        manualOrder: data.manualOrder || {},
        lastUpdated: data.lastUpdated
      };
    } else {
      console.log("📄 No hay datos previos en Firebase para este usuario");
      return null;
    }
  } catch (error) {
    console.error("Error cargando desde Firebase:", error);
    return null;
  }
}

// Sincronizar datos automáticamente
export async function syncWithFirebase() {
  if (!isFirebaseInitialized || !appState.user) {
    return false;
  }

  const userData = {
    categories: appState.categories,
    items: appState.items,
    manualOrder: appState.manualOrder
  };

  return await saveUserDataToFirebase(appState.user.id, userData);
}

// Configurar sincronización en tiempo real (opcional)
export async function setupRealtimeSync(userId) {
  if (!isFirebaseInitialized || !userId) {
    return;
  }

  try {
    const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const userDoc = doc(db, 'users', userId);
    
    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Solo actualizar si los datos son más recientes
        if (data.lastUpdated && (!appState.lastSyncTime || new Date(data.lastUpdated) > new Date(appState.lastSyncTime))) {
          console.log("🔄 Datos actualizados desde Firebase");
          
          // Actualizar estado local
          import('./state.js').then(({ updateState }) => {
            updateState({
              categories: data.categories || appState.categories,
              items: data.items || [],
              manualOrder: data.manualOrder || {},
              lastSyncTime: data.lastUpdated
            });
          });

          // Re-renderizar UI
          import('./ui.js').then(({ renderCategories, renderItems }) => {
            renderCategories();
            if (appState.currentCategory) {
              renderItems();
            }
          });
        }
      }
    });

    console.log("🔄 Sincronización en tiempo real activada");
    return unsubscribe;
  } catch (error) {
    console.error("Error configurando sincronización en tiempo real:", error);
    return null;
  }
}

// Función para mostrar ayuda de configuración
export function showFirebaseConfigHelp() {
  if (!isFirebaseConfigured()) {
    console.warn(`
🔥 CONFIGURACIÓN DE FIREBASE REQUERIDA:

Para sincronizar datos entre dispositivos, necesitas:

1. Ir a Firebase Console: https://console.firebase.google.com/
2. Crear un nuevo proyecto
3. Habilitar Firestore Database
4. Obtener la configuración de tu app web
5. Reemplazar los valores en js/firebase.js:

const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

¡Una vez configurado, tus datos se sincronizarán automáticamente!
    `);
  }
}

// Verificar estado de Firebase
export function getFirebaseStatus() {
  return {
    configured: isFirebaseConfigured(),
    initialized: isFirebaseInitialized,
    connected: isFirebaseInitialized && db !== null
  };
}