import { appState, updateState } from './state.js';
import { renderCategories, renderItems } from './ui.js';
import { syncWithFirebase, loadUserDataFromFirebase } from './firebase.js';

// Función para combinar categorías existentes con las nuevas por defecto
function mergeWithDefaultCategories(userCategories) {
  // Categorías por defecto actuales
  const defaultCategories = [
    { id: "movies", name: "Películas", count: 0 },
    { id: "series", name: "Series", count: 0 },
    { id: "books", name: "Libros", count: 0 },
    { id: "games", name: "Videojuegos", count: 0 },
    { id: "restaurants", name: "Restaurantes", count: 0 },
  ];
  
  // Crear un mapa de las categorías existentes del usuario
  const userCategoryMap = new Map();
  userCategories.forEach(category => {
    userCategoryMap.set(category.id, category);
  });
  
  // Combinar: mantener las del usuario y añadir las nuevas por defecto
  const mergedCategories = [...userCategories];
  
  defaultCategories.forEach(defaultCategory => {
    if (!userCategoryMap.has(defaultCategory.id)) {
      console.log(`➕ Añadiendo nueva categoría: ${defaultCategory.name}`);
      mergedCategories.push(defaultCategory);
    }
  });
  
  return mergedCategories;
}

// Gestión de datos híbrida (localStorage + Firebase)
export async function saveDataToStorage() {
  const data = {
    categories: appState.categories,
    items: appState.items,
    user: appState.user,
    manualOrder: appState.manualOrder,
  };

  // Guardar en localStorage (respaldo local)
  if (appState.user) {
    localStorage.setItem(
      `collection_${appState.user.id}`,
      JSON.stringify(data)
    );
  } else {
    localStorage.setItem("collection_local", JSON.stringify(data));
  }

  // Sincronizar con Firebase si el usuario está logueado
  if (appState.user) {
    try {
      await syncWithFirebase();
      console.log("💾 Datos guardados localmente y sincronizados con Firebase");
    } catch (error) {
      console.warn("⚠️ Datos guardados localmente, pero falló la sincronización con Firebase:", error);
    }
  }
}

export async function loadDataFromStorage() {
  // Si hay usuario logueado, intentar cargar desde Firebase primero
  if (appState.user) {
    try {
      const firebaseData = await loadUserDataFromFirebase(appState.user.id);
      
      if (firebaseData) {
        // Datos encontrados en Firebase
        const updatedCategories = mergeWithDefaultCategories(firebaseData.categories || []);
        
        updateState({
          categories: updatedCategories,
          items: firebaseData.items || [],
          manualOrder: firebaseData.manualOrder || {}
        });
        
        console.log("☁️ Datos cargados desde Firebase");
        
        // Si se añadieron nuevas categorías, guardar los datos actualizados
        if (updatedCategories.length > (firebaseData.categories || []).length) {
          console.log("🔄 Nuevas categorías detectadas, actualizando datos...");
          setTimeout(() => {
            saveDataToStorage();
          }, 1000);
        }
        
        // También guardar en localStorage como respaldo
        const backupData = {
          categories: firebaseData.categories,
          items: firebaseData.items,
          user: appState.user,
          manualOrder: firebaseData.manualOrder,
        };
        localStorage.setItem(`collection_${appState.user.id}`, JSON.stringify(backupData));
        
        renderCategories();
        if (appState.currentCategory) {
          renderItems();
        }
        return;
      }
    } catch (error) {
      console.warn("⚠️ Error cargando desde Firebase, usando datos locales:", error);
    }
  }

  // Fallback: cargar desde localStorage
  let data = null;

  if (appState.user) {
    data = localStorage.getItem(`collection_${appState.user.id}`);
  } else {
    data = localStorage.getItem("collection_local");
  }

  if (data) {
    const parsedData = JSON.parse(data);
    updateState({
      categories: parsedData.categories || appState.categories,
      items: parsedData.items || [],
      manualOrder: parsedData.manualOrder || {}
    });

    console.log("💾 Datos cargados desde localStorage");
    renderCategories();
    if (appState.currentCategory) {
      renderItems();
    }
  }
}

export async function loadUserData() {
  await loadDataFromStorage();
}

// Gestión de preferencias
export function saveThemePreference() {
  localStorage.setItem(
    "theme-preference",
    appState.darkMode ? "dark" : "light"
  );
}

export function loadThemePreference() {
  const savedTheme = localStorage.getItem("theme-preference");

  if (savedTheme) {
    updateState({ darkMode: savedTheme === "dark" });
  } else {
    updateState({
      darkMode: window.matchMedia && 
               window.matchMedia("(prefers-color-scheme: dark)").matches
    });
  }
}

export function saveSortPreference() {
  localStorage.setItem(
    "sort-preference",
    JSON.stringify({
      sortBy: appState.sortBy,
      sortDirection: appState.sortDirection,
    })
  );
}

export function loadSortPreference() {
  const saved = localStorage.getItem("sort-preference");
  if (saved) {
    const { sortBy, sortDirection } = JSON.parse(saved);
    updateState({
      sortBy: sortBy || "manual",
      sortDirection: sortDirection || "desc"
    });
  }
}

// Guardar preferencia de idioma
export function saveLanguagePreference(language) {
  localStorage.setItem('app-language', language);
}

export function loadManualOrder() {
  // Esta función se puede expandir si necesitas lógica específica
  // para cargar el orden manual desde el storage
}

// Función de utilidad para verificar el estado de los datos
export function getUserDataStatus() {
  const status = {
    hasUser: !!appState.user,
    userId: appState.user?.id || null,
    userName: appState.user?.name || null,
    categoriesCount: appState.categories.length,
    itemsCount: appState.items.length,
    hasLocalData: false,
    hasFirebaseData: false,
    lastSync: appState.lastSyncTime
  };

  // Verificar si hay datos locales
  if (appState.user) {
    const localData = localStorage.getItem(`collection_${appState.user.id}`);
    status.hasLocalData = !!localData;
  } else {
    const localData = localStorage.getItem("collection_local");
    status.hasLocalData = !!localData;
  }

  return status;
}

// Función para mostrar el estado de los datos en la consola
export function showDataStatus() {
  const status = getUserDataStatus();
  
  console.group("📊 Estado de los Datos");
  console.log("👤 Usuario:", status.hasUser ? `${status.userName} (${status.userId})` : "No logueado");
  console.log("📁 Categorías:", status.categoriesCount);
  console.log("📄 Elementos:", status.itemsCount);
  console.log("💾 Datos locales:", status.hasLocalData ? "✅ Disponibles" : "❌ No encontrados");
  console.log("☁️ Última sincronización:", status.lastSync ? new Date(status.lastSync).toLocaleString() : "Nunca");
  console.groupEnd();
}

// Función para forzar guardado manual (útil para debugging)
export async function forceSave() {
  console.log("🔄 Forzando guardado de datos...");
  try {
    await saveDataToStorage();
    showDataStatus();
    console.log("✅ Guardado forzado completado");
  } catch (error) {
    console.error("❌ Error en guardado forzado:", error);
  }
}

// Función para forzar carga manual (útil para debugging)
export async function forceLoad() {
  console.log("🔄 Forzando carga de datos...");
  try {
    await loadDataFromStorage();
    showDataStatus();
    console.log("✅ Carga forzada completada");
  } catch (error) {
    console.error("❌ Error en carga forzada:", error);
  }
}