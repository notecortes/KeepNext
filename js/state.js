// Estado global de la aplicación
export const appState = {
  user: null,
  categories: [],
  items: [],
  currentCategory: null,
  currentRating: 0,
  darkMode: false,
  sortBy: "manual",
  sortDirection: "desc",
  draggedElement: null,
  manualOrder: {},
  filterText: "",
  firebaseUnsubscribe: null,
  lastSyncTime: null,
  currentLanguage: "es",
};

// Funciones para gestionar el estado
export function updateState(updates) {
  Object.assign(appState, updates);
}

export function resetState() {
  appState.user = null;
  appState.currentCategory = null;
  appState.items = [];
  appState.categories = [
    { id: "movies", name: "Películas", count: 0 },
    { id: "series", name: "Series", count: 0 },
    { id: "books", name: "Libros", count: 0 },
    { id: "games", name: "Videojuegos", count: 0 },
    { id: "restaurants", name: "Restaurantes", count: 0 },
  ];
}
