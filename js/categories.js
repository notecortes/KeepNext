import { appState, updateState } from './state.js';
import { renderCategories, renderItems } from './ui.js';
import { saveDataToStorage } from './storage.js';

// Gestión de categorías
export function selectCategory(categoryId) {
  updateState({ currentCategory: categoryId });

  // Actualizar UI de categorías
  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.remove("active");
  });
  document
    .querySelector(`[data-category-id="${categoryId}"]`)
    .classList.add("active");

  // Mostrar elementos de la categoría
  const category = appState.categories.find((c) => c.id === categoryId);
  document.getElementById("items-title").textContent = category.name;
  document.getElementById("add-item-btn").classList.remove("hidden");
  document.getElementById("sort-controls").classList.remove("hidden");
  
  // Mostrar controles de búsqueda/filtro
  const searchFilterControls = document.getElementById("search-filter-controls");
  if (searchFilterControls) {
    searchFilterControls.classList.remove("hidden");
  }
  document.getElementById("search-filter-controls").classList.remove("hidden");

  renderItems();
}

export function deleteCategory(categoryId) {
  // Importar función de traducción dinámicamente
  import('./i18n.js').then(({ t }) => {
    if (confirm(t('categories.delete_confirm'))) {
      updateState({
        categories: appState.categories.filter((c) => c.id !== categoryId),
        items: appState.items.filter((i) => i.categoryId !== categoryId)
      });

      if (appState.currentCategory === categoryId) {
        updateState({ currentCategory: null });
        document.getElementById("items-title").textContent = t('items.title');
        document.getElementById("add-item-btn").classList.add("hidden");
        document.getElementById("sort-controls").classList.add("hidden");
        document.getElementById("search-filter-controls").classList.add("hidden");
        document.getElementById("items-container").innerHTML = "";
      }

      renderCategories();
      saveDataToStorage();
    }
  });
}

export function saveCategory() {
  const name = document.getElementById("category-name").value.trim();

  if (!name) {
    // Importar función de traducción dinámicamente
    import('./i18n.js').then(({ t }) => {
      alert(t('validation.required_field'));
    });
    return;
  }

  const id = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (appState.categories.find((c) => c.id === id)) {
    // Importar función de traducción dinámicamente
    import('./i18n.js').then(({ t }) => {
      alert(t('categories.name_exists') || "Ya existe una categoría con ese nombre");
    });
    return;
  }

  const newCategory = {
    id: id,
    name: name,
    count: 0,
  };

  updateState({
    categories: [...appState.categories, newCategory]
  });

  renderCategories();
  closeModals();
  saveDataToStorage();
}

function closeModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.add("hidden");
  });

  // Limpiar formularios
  document.getElementById("category-name").value = "";
}