import { appState, updateState } from './state.js';
import { renderItems } from './ui.js';

// Sistema de filtros y búsqueda
export function setupFilters() {
  setupFilterEventListeners();
}

// Configurar los event listeners del filtro
function setupFilterEventListeners() {
  const filterInput = document.getElementById('filter-input');
  const clearFilterBtn = document.getElementById('clear-filter-btn');
  
  if (!filterInput || !clearFilterBtn) return;
  
  // Filtrar mientras se escribe (con debounce)
  let filterTimeout;
  filterInput.addEventListener('input', (e) => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      handleFilterChange(e.target.value);
    }, 300);
  });
  
  // Limpiar filtro
  clearFilterBtn.addEventListener('click', () => {
    clearFilter();
  });
  
  // Limpiar filtro con Escape
  filterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearFilter();
    }
  });
}

// Manejar cambio en el filtro
function handleFilterChange(filterText) {
  updateState({ filterText: filterText.trim().toLowerCase() });
  
  // Mostrar/ocultar botón de limpiar
  const clearBtn = document.getElementById('clear-filter-btn');
  if (appState.filterText) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
  
  // Re-renderizar elementos con el filtro aplicado
  renderItems();
  
  // Mostrar mensaje si no hay resultados
  showFilterResults();
}

// Limpiar el filtro
export function clearFilter() {
  const filterInput = document.getElementById('filter-input');
  const clearBtn = document.getElementById('clear-filter-btn');
  
  if (filterInput) filterInput.value = '';
  updateState({ filterText: '' });
  if (clearBtn) clearBtn.classList.add('hidden');
  
  // Re-renderizar elementos sin filtro
  renderItems();
  
  // Enfocar el input
  if (filterInput) filterInput.focus();
}

// Filtrar elementos según el texto de búsqueda
export function filterItems(items) {
  if (!appState.filterText) {
    return items;
  }
  
  return items.filter(item => {
    const searchText = appState.filterText;
    
    // Buscar en título
    if (item.title.toLowerCase().includes(searchText)) {
      return true;
    }
    
    // Buscar en descripción
    if (item.description && item.description.toLowerCase().includes(searchText)) {
      return true;
    }
    
    // Buscar en dónde ver
    if (item.whereToWatch && item.whereToWatch.toLowerCase().includes(searchText)) {
      return true;
    }
    
    return false;
  });
}

// Mostrar resultados del filtro
function showFilterResults() {
  if (!appState.filterText) {
    hideFilterMessage();
    return;
  }
  
  const categoryItems = appState.items.filter(item => item.categoryId === appState.currentCategory);
  const filteredItems = filterItems(categoryItems);
  
  // Mostrar mensaje de resultados
  let existingMessage = document.getElementById('filter-results-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const message = document.createElement('div');
  message.id = 'filter-results-message';
  message.className = 'filter-results-message';
  
  if (filteredItems.length === 0) {
    message.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <p>No se encontraron elementos que coincidan con "<strong>${appState.filterText}</strong>"</p>
        <button onclick="window.clearFilter()" class="btn btn-secondary btn-sm">Limpiar búsqueda</button>
      </div>
    `;
  } else {
    const totalItems = categoryItems.length;
    message.innerHTML = `
      <div class="filter-info">
        <span class="filter-icon">🔍</span>
        <span>Mostrando ${filteredItems.length} de ${totalItems} elementos para "<strong>${appState.filterText}</strong>"</span>
        <button onclick="window.clearFilter()" class="clear-filter-link">Mostrar todos</button>
      </div>
    `;
  }
  
  const itemsContainer = document.getElementById('items-container');
  if (itemsContainer && itemsContainer.parentNode) {
    itemsContainer.parentNode.insertBefore(message, itemsContainer);
  }
}

// Ocultar mensaje del filtro
function hideFilterMessage() {
  const existingMessage = document.getElementById('filter-results-message');
  if (existingMessage) {
    existingMessage.remove();
  }
}

// Resaltar texto coincidente
export function highlightMatchText(text, searchText) {
  if (!searchText || !text) {
    return text;
  }
  
  const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

// Exportar función global
window.clearFilter = clearFilter;