import { appState, updateState } from './state.js';
import { renderCategories, renderItems, closeModals } from './ui.js';
import { saveDataToStorage } from './storage.js';

// Variable para rastrear si estamos editando
let editingItemId = null;

export function resetEditingItemId() {
  editingItemId = null;
}

// Gestión de elementos
export function deleteItem(itemId) {
  // Importar función de traducción dinámicamente
  import('./i18n.js').then(({ t }) => {
    if (confirm(t('items.delete_confirm'))) {
      const item = appState.items.find((i) => i.id === itemId);
      
      updateState({
        items: appState.items.filter((i) => i.id !== itemId)
      });

      // Actualizar contador de categoría
      const category = appState.categories.find((c) => c.id === item.categoryId);
      if (category) {
        category.count--;
      }

      renderCategories();
      renderItems();
      saveDataToStorage();
    }
  });
}

export function saveItem() {
  const title = document.getElementById("item-title").value.trim();
  const description = document.getElementById("item-description").value.trim();
  const image = document.getElementById("item-image").value.trim();
  const whereToWatch = document
    .getElementById("item-where-to-watch")
    .value.trim();

  if (!title) {
    // Importar función de traducción dinámicamente
    import('./i18n.js').then(({ t }) => {
      alert(t('items.title_required'));
    });
    return;
  }

  if (editingItemId) {
    // Estamos editando un elemento existente
    const itemIndex = appState.items.findIndex(item => item.id === editingItemId);
    if (itemIndex !== -1) {
      const updatedItems = [...appState.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        title: title,
        description: description,
        image: image,
        whereToWatch: whereToWatch,
        rating: appState.currentRating,
        updatedAt: new Date().toISOString(),
        // Mantener metadatos existentes o añadir nuevos si están disponibles
        metadata: window.currentItemMetadata || updatedItems[itemIndex].metadata || null,
      };

      updateState({ items: updatedItems });
    }
    editingItemId = null;
  } else {
    // Creando un nuevo elemento
    const item = {
      id: Date.now().toString(),
      categoryId: appState.currentCategory,
      title: title,
      description: description,
      image: image,
      whereToWatch: whereToWatch,
      rating: appState.currentRating,
      createdAt: new Date().toISOString(),
      // Incluir metadatos si están disponibles
      metadata: window.currentItemMetadata || null,
    };

    updateState({
      items: [...appState.items, item]
    });

    // Actualizar contador de categoría
    const category = appState.categories.find(
      (c) => c.id === appState.currentCategory
    );
    if (category) {
      category.count++;
    }
  }

  renderCategories();
  renderItems();
  closeModals();
  saveDataToStorage();
}

export function editItem(itemId) {
  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;

  editingItemId = itemId;

  // Llenar el formulario con los datos del elemento
  document.getElementById("item-title").value = item.title || "";
  document.getElementById("item-description").value = item.description || "";
  document.getElementById("item-image").value = item.image || "";
  document.getElementById("item-where-to-watch").value = item.whereToWatch || "";

  // Establecer la valoración
  updateState({ currentRating: item.rating || 0 });

  // Cambiar el título del modal
  import('./i18n.js').then(({ t }) => {
    document.getElementById("item-modal-title").textContent = t('items.edit');
  });

  // Mostrar el modal
  document.getElementById("item-modal").classList.remove("hidden");
  document.getElementById("item-title").focus();

  // Actualizar la visualización de estrellas
  import('./ui.js').then(({ updateStarDisplay }) => {
    updateStarDisplay();
  });
}

// Sistema de ordenamiento
export function sortItems(items) {
  const sortedItems = [...items];

  switch (appState.sortBy) {
    case "manual":
      const categoryKey = appState.currentCategory;
      const manualOrder = appState.manualOrder[categoryKey] || [];

      sortedItems.sort((a, b) => {
        const indexA = manualOrder.indexOf(a.id);
        const indexB = manualOrder.indexOf(b.id);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
      break;
    case "newest":
      sortedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "oldest":
      sortedItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case "title-asc":
      sortedItems.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      sortedItems.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "rating-high":
      sortedItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "rating-low":
      sortedItems.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      break;
  }

  if (appState.sortBy !== "manual") {
    if (
      appState.sortDirection === "asc" &&
      ["newest", "rating-high"].includes(appState.sortBy)
    ) {
      sortedItems.reverse();
    } else if (
      appState.sortDirection === "desc" &&
      ["oldest", "title-asc", "rating-low"].includes(appState.sortBy)
    ) {
      sortedItems.reverse();
    }
  }

  return sortedItems;
}

export function handleSortChange(event) {
  updateState({ sortBy: event.target.value });
  updateSortDirection();
  renderItems();
  saveSortPreference();
}

export function toggleSortDirection() {
  updateState({
    sortDirection: appState.sortDirection === "desc" ? "asc" : "desc"
  });
  updateSortDirectionButton();
  renderItems();
  saveSortPreference();
}

function updateSortDirection() {
  if (appState.sortBy === "manual") {
    document.getElementById("sort-direction-btn").style.display = "none";
    return;
  } else {
    document.getElementById("sort-direction-btn").style.display = "flex";
  }

  const defaultDesc = ["newest", "rating-high"];
  updateState({
    sortDirection: defaultDesc.includes(appState.sortBy) ? "desc" : "asc"
  });
  updateSortDirectionButton();
}

function updateSortDirectionButton() {
  const btn = document.getElementById("sort-direction-btn");
  const isReversed = appState.sortDirection === "asc";

  btn.classList.toggle("reversed", isReversed);
  btn.textContent = isReversed ? "↑" : "↓";

  btn.title = `Cambiar dirección (${
    isReversed ? "ascendente" : "descendente"
  })`;
}

// Importar funciones necesarias
import { saveSortPreference } from './storage.js';