import { appState, updateState } from './state.js';
import { sortItems } from './items.js';
import { saveDataToStorage, saveThemePreference } from './storage.js';
import { t, applyTranslations, translateElement, plural } from './i18n.js';

// Renderizado de categorías
export function renderCategories() {
  const container = document.getElementById("categories-container");
  container.innerHTML = "";

  appState.categories.forEach((category) => {
    const categoryCard = createCategoryCard(category);
    container.appendChild(categoryCard);
  });
}

// Función para obtener imagen de fondo según el tipo de categoría
function getCategoryBackgroundImage(categoryName) {
  const name = categoryName.toLowerCase();
  
  // Mapeo de categorías a imágenes
  const categoryImages = {
    // Películas
    'películas': 'https://images.unsplash.com/photo-1489599904472-af35ff2c8e5c?w=400&h=300&fit=crop&crop=center',
    'movies': 'https://images.unsplash.com/photo-1489599904472-af35ff2c8e5c?w=400&h=300&fit=crop&crop=center',
    'cine': 'https://images.unsplash.com/photo-1489599904472-af35ff2c8e5c?w=400&h=300&fit=crop&crop=center',
    'film': 'https://images.unsplash.com/photo-1489599904472-af35ff2c8e5c?w=400&h=300&fit=crop&crop=center',
    
    // Series
    'series': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop&crop=center',
    'tv': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop&crop=center',
    'televisión': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop&crop=center',
    'shows': 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop&crop=center',
    
    // Libros
    'libros': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
    'books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
    'lectura': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
    'literatura': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
    
    // Videojuegos
    'videojuegos': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    'games': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    'gaming': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    'juegos': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
    
    // Música
    'música': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center',
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center',
    'musica': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center',
    
    // Documentales
    'documentales': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop&crop=center',
    'documentaries': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop&crop=center',
    
    // Anime
    'anime': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
    'manga': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
    
    // Podcasts
    'podcasts': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop&crop=center',
    'podcast': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop&crop=center',
    
    // Arte
    'arte': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&crop=center',
    'art': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop&crop=center',
    
    // Deportes
    'deportes': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&crop=center',
    'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&crop=center',
    
    // Viajes
    'viajes': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
    'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
    'lugares': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
    
    // Restaurantes
    'restaurantes': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center',
    'restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center',
    'comida': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&crop=center',
    'food': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&crop=center',
    'gastronomía': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center',
    'gastronomy': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center',
    'cocina': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
    'cuisine': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
    'cafeterías': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&crop=center',
    'cafes': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&crop=center',
    'bares': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop&crop=center',
    'bars': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop&crop=center'
  };
  
  // Buscar imagen específica
  for (const [key, image] of Object.entries(categoryImages)) {
    if (name.includes(key)) {
      return image;
    }
  }
  
  // Imagen por defecto si no se encuentra una específica
  return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center';
}

// Función para obtener icono según el tipo de categoría
function getCategoryIcon(categoryName) {
  const name = categoryName.toLowerCase();
  
  const categoryIcons = {
    'películas': '🎬', 'movies': '🎬', 'cine': '🎬', 'film': '🎬',
    'series': '📺', 'tv': '📺', 'televisión': '📺', 'shows': '📺',
    'libros': '📚', 'books': '📚', 'lectura': '📚', 'literatura': '📚',
    'videojuegos': '🎮', 'games': '🎮', 'gaming': '🎮', 'juegos': '🎮',
    'música': '🎵', 'music': '🎵', 'musica': '🎵',
    'documentales': '🎥', 'documentaries': '🎥',
    'anime': '🎌', 'manga': '🎌',
    'podcasts': '🎙️', 'podcast': '🎙️',
    'arte': '🎨', 'art': '🎨',
    'deportes': '⚽', 'sports': '⚽',
    'viajes': '✈️', 'travel': '✈️', 'lugares': '✈️',
    'restaurantes': '🍽️', 'restaurants': '🍽️', 'comida': '🍕', 'food': '🍕',
    'gastronomía': '👨‍🍳', 'gastronomy': '👨‍🍳', 'cocina': '🍳', 'cuisine': '🍳',
    'cafeterías': '☕', 'cafes': '☕', 'bares': '🍻', 'bars': '🍻'
  };
  
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  
  return '📁'; // Icono por defecto
}

function createCategoryCard(category) {
  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.categoryId = category.id;

  const countText = category.count === 1 
    ? t('categories.count_singular', { count: category.count })
    : t('categories.count', { count: category.count });

  const backgroundImage = getCategoryBackgroundImage(category.name);
  const categoryIcon = getCategoryIcon(category.name);

  card.innerHTML = `
    <div class="category-background" style="background-image: url('${backgroundImage}')"></div>
    <div class="category-overlay"></div>
    <div class="category-content">
      <button class="delete-category" onclick="window.deleteCategory('${category.id}')" title="${t('buttons.delete')}">&times;</button>
      <div class="category-icon">${categoryIcon}</div>
      <h3 class="category-title">${category.name}</h3>
      <div class="category-count">${countText}</div>
    </div>
  `;

  card.addEventListener("click", () => window.selectCategory(category.id));
  return card;
}

// Renderizado de elementos
export function renderItems() {
  const container = document.getElementById("items-container");
  const manualHint = document.getElementById("manual-sort-hint");
  container.innerHTML = "";

  let categoryItems = appState.items.filter(
    (item) => item.categoryId === appState.currentCategory
  );

  // Aplicar filtro de búsqueda
  if (appState.filterText) {
    categoryItems = categoryItems.filter(item => {
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

  // Mostrar/ocultar hint de ordenamiento manual
  if (appState.sortBy === "manual") {
    manualHint.classList.remove("hidden");
    container.classList.add("manual-sort");
  } else {
    manualHint.classList.add("hidden");
    container.classList.remove("manual-sort");
  }

  // Ordenar elementos
  categoryItems = sortItems(categoryItems);

  categoryItems.forEach((item, index) => {
    const itemCard = createItemCard(item, index);
    container.appendChild(itemCard);
  });

  // Configurar drag & drop si está en modo manual
  if (appState.sortBy === "manual") {
    setupDragAndDrop();
  }
}

function createItemCard(item, index) {
  const card = document.createElement("div");
  card.className = "item-card";
  card.dataset.itemId = item.id;
  card.dataset.index = index;

  // Hacer la tarjeta arrastrable solo en modo manual
  if (appState.sortBy === "manual") {
    card.draggable = true;
  }

  const starsHtml = createStarsHtml(item.rating, false);
  const dragHandle =
    appState.sortBy === "manual" ? '<div class="drag-handle">⋮⋮</div>' : "";

  // Mostrar información de dónde ver (solo para películas y series)
  const whereToWatchHtml = item.whereToWatch
    ? `<div class="where-to-watch">📺 Ver en: ${item.whereToWatch}</div>`
    : "";

  // Crear información adicional basada en metadatos guardados
  const additionalInfoHtml = createAdditionalInfoHtml(item);

  // Debug: verificar si el campo existe
  if (item.whereToWatch) {
    console.log(`Item ${item.title} tiene whereToWatch: ${item.whereToWatch}, categoryId: ${item.categoryId}`);
  }

  card.innerHTML = `
    <div class="item-actions">
      <button class="edit-item" onclick="window.editItem('${item.id}')" title="Editar">✏️</button>
      <button class="delete-item" onclick="window.deleteItem('${item.id}')" title="Eliminar">&times;</button>
    </div>
    ${dragHandle}
    <img class="item-image" src="${
      item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'%3E%3Crect width='280' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='14' fill='%2364748b'%3ESin Imagen%3C/text%3E%3C/svg%3E"
    }" alt="${item.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'280\\' height=\\'200\\' viewBox=\\'0 0 280 200\\'%3E%3Crect width=\\'280\\' height=\\'200\\' fill=\\'%23f1f5f9\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'system-ui\\' font-size=\\'14\\' fill=\\'%2364748b\\'%3ESin Imagen%3C/text%3E%3C/svg%3E'">
    <div class="item-content">
      <h3 class="item-title">${item.title}</h3>
      <div class="item-rating">${starsHtml}</div>
      ${additionalInfoHtml}
      ${whereToWatchHtml}
      <p class="item-description">${item.description || "Sin descripción"}</p>
    </div>
  `;

  return card;
}

function createStarsHtml(rating, interactive = true) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    const activeClass = i <= rating ? "active" : "";
    const clickHandler = interactive ? `onclick="setRating(${i})"` : "";
    starsHtml += `<span class="star ${activeClass}" ${clickHandler}>★</span>`;
  }
  return starsHtml;
}

// Crear información adicional basada en metadatos guardados
function createAdditionalInfoHtml(item) {
  let infoHtml = "";
  
  // Información específica por tipo de contenido
  if (item.metadata) {
    const meta = item.metadata;
    
    // Para películas
    if (meta.type === "movie") {
      const movieInfo = [];
      if (meta.year) movieInfo.push(`📅 ${meta.year}`);
      if (meta.genre) movieInfo.push(`🎭 ${meta.genre}`);
      if (meta.director) movieInfo.push(`🎬 ${meta.director}`);
      if (meta.rating && meta.rating !== "N/A") movieInfo.push(`⭐ ${t('metadata.rating_imdb')}: ${meta.rating}/10`);
      
      if (movieInfo.length > 0) {
        infoHtml = `<div class="item-metadata">${movieInfo.join(" • ")}</div>`;
      }
    }
    
    // Para series
    else if (meta.type === "series") {
      const seriesInfo = [];
      if (meta.year) seriesInfo.push(`📅 ${meta.year}`);
      if (meta.genre) seriesInfo.push(`🎭 ${meta.genre}`);
      if (meta.seasons) seriesInfo.push(`📺 ${meta.seasons} ${t('metadata.seasons')}`);
      if (meta.rating && meta.rating !== "N/A") seriesInfo.push(`⭐ ${t('metadata.rating_imdb')}: ${meta.rating}/10`);
      
      if (seriesInfo.length > 0) {
        infoHtml = `<div class="item-metadata">${seriesInfo.join(" • ")}</div>`;
      }
    }
    
    // Para libros
    else if (meta.type === "book") {
      const bookInfo = [];
      if (meta.authors && meta.authors.length > 0) bookInfo.push(`✍️ ${meta.authors.join(", ")}`);
      if (meta.publishedDate) bookInfo.push(`📅 ${meta.publishedDate}`);
      if (meta.pageCount) bookInfo.push(`📄 ${meta.pageCount} ${t('metadata.pages')}`);
      if (meta.rating) bookInfo.push(`⭐ ${meta.rating}/5`);
      
      if (bookInfo.length > 0) {
        infoHtml = `<div class="item-metadata">${bookInfo.join(" • ")}</div>`;
      }
    }
    
    // Para videojuegos
    else if (meta.type === "game") {
      const gameInfo = [];
      if (meta.released) gameInfo.push(`📅 ${meta.released}`);
      if (meta.genres && meta.genres.length > 0) gameInfo.push(`🎮 ${meta.genres.slice(0, 2).join(", ")}`);
      if (meta.platforms && meta.platforms.length > 0) gameInfo.push(`🖥️ ${meta.platforms.slice(0, 2).join(", ")}`);
      if (meta.rating) gameInfo.push(`⭐ ${meta.rating}/5`);
      if (meta.metacritic) gameInfo.push(`🏆 ${t('metadata.rating_metacritic')}: ${meta.metacritic}/100`);
      
      if (gameInfo.length > 0) {
        infoHtml = `<div class="item-metadata">${gameInfo.join(" • ")}</div>`;
      }
    }
    
    // Para restaurantes
    else if (meta.type === "restaurant") {
      const restaurantInfo = [];
      if (meta.cuisine) restaurantInfo.push(`🍽️ ${meta.cuisine}`);
      if (meta.priceRange) restaurantInfo.push(`💰 ${meta.priceRange}`);
      if (meta.location) restaurantInfo.push(`📍 ${meta.location}`);
      if (meta.rating) restaurantInfo.push(`⭐ ${meta.rating}/5`);
      if (meta.phone) restaurantInfo.push(`📞 ${meta.phone}`);
      if (meta.hours) restaurantInfo.push(`🕒 ${meta.hours}`);
      
      if (restaurantInfo.length > 0) {
        infoHtml = `<div class="item-metadata">${restaurantInfo.join(" • ")}</div>`;
      }
    }
  }
  
  return infoHtml;
}

// Modales
export function openCategoryModal() {
  document.getElementById("category-modal").classList.remove("hidden");
  document.getElementById("category-name").focus();
}

export function openItemModal() {
  if (!appState.currentCategory) {
    alert(t('items.select_category_first'));
    return;
  }

  // Resetear el estado de edición para crear un nuevo elemento
  resetEditingState();

  // Cambiar el título del modal
  document.getElementById("item-modal-title").textContent = t('items.new');

  document.getElementById("item-modal").classList.remove("hidden");
  document.getElementById("item-title").focus();
  updateState({ currentRating: 0 });
  updateStarDisplay();
}

function resetEditingState() {
  // Importar la función para resetear el estado de edición
  import('./items.js').then(({ resetEditingItemId }) => {
    resetEditingItemId();
  });
}

export function closeModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.add("hidden");
  });

  // Limpiar formularios
  document.getElementById("category-name").value = "";
  document.getElementById("item-title").value = "";
  document.getElementById("item-description").value = "";
  document.getElementById("item-image").value = "";
  document.getElementById("item-where-to-watch").value = "";
  document.getElementById("search-results").classList.add("hidden");
  updateState({ currentRating: 0 });
  updateStarDisplay();

  // Resetear el estado de edición
  import('./items.js').then(({ resetEditingItemId }) => {
    resetEditingItemId();
  });

  // Resetear el título del modal
  document.getElementById("item-modal-title").textContent = t('items.new');

  // Limpiar metadatos temporales
  window.currentItemMetadata = null;
}

// Sistema de estrellas
export function setupStarRating() {
  document.querySelectorAll(".stars-container .star").forEach((star) => {
    star.addEventListener("click", function () {
      const rating = parseInt(this.dataset.rating);
      setRating(rating);
    });

    star.addEventListener("mouseenter", function () {
      const rating = parseInt(this.dataset.rating);
      highlightStars(rating);
    });
  });

  document
    .querySelector(".stars-container")
    .addEventListener("mouseleave", function () {
      updateStarDisplay();
    });
}

export function setRating(rating) {
  updateState({ currentRating: rating });
  updateStarDisplay();
}

function highlightStars(rating) {
  document.querySelectorAll(".stars-container .star").forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

export function updateStarDisplay() {
  highlightStars(appState.currentRating);
}

// Gestión del modo oscuro
export function toggleTheme() {
  updateState({ darkMode: !appState.darkMode });
  applyTheme();
  saveThemePreference();
}

export function applyTheme() {
  const body = document.body;
  const themeIcon = document.querySelector(".theme-icon");

  if (appState.darkMode) {
    body.setAttribute("data-theme", "dark");
    themeIcon.textContent = "☀️";
  } else {
    body.removeAttribute("data-theme");
    themeIcon.textContent = "🌙";
  }
}

// Sistema de Drag & Drop (simplificado)
function setupDragAndDrop() {
  const container = document.getElementById("items-container");
  const cards = container.querySelectorAll(".item-card");

  cards.forEach((card) => {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    card.addEventListener("dragover", handleDragOver);
    card.addEventListener("dragenter", handleDragEnter);
    card.addEventListener("dragleave", handleDragLeave);
    card.addEventListener("drop", handleDrop);
  });
}

function handleDragStart(e) {
  updateState({ draggedElement: e.target });
  e.target.classList.add("dragging");
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  document.querySelectorAll(".item-card").forEach(card => {
    card.classList.remove("drag-over");
  });
  updateState({ draggedElement: null });
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDragEnter(e) {
  e.preventDefault();
  if (e.target.classList.contains("item-card")) {
    e.target.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  if (e.target.classList.contains("item-card")) {
    e.target.classList.remove("drag-over");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const draggedCard = appState.draggedElement;
  const targetCard = e.target.closest(".item-card");
  
  if (draggedCard && targetCard && draggedCard !== targetCard) {
    // Lógica para reordenar elementos
    const draggedId = draggedCard.dataset.itemId;
    const targetId = targetCard.dataset.itemId;
    
    // Actualizar orden manual
    const categoryKey = appState.currentCategory;
    const currentOrder = appState.manualOrder[categoryKey] || [];
    
    // Remover el elemento arrastrado de su posición actual
    const filteredOrder = currentOrder.filter(id => id !== draggedId);
    
    // Encontrar la posición del elemento objetivo
    const targetIndex = filteredOrder.indexOf(targetId);
    
    // Insertar el elemento arrastrado en la nueva posición
    if (targetIndex !== -1) {
      filteredOrder.splice(targetIndex, 0, draggedId);
    } else {
      filteredOrder.push(draggedId);
    }
    
    // Actualizar el estado
    const newManualOrder = { ...appState.manualOrder };
    newManualOrder[categoryKey] = filteredOrder;
    updateState({ manualOrder: newManualOrder });
    
    // Re-renderizar y guardar
    renderItems();
    saveDataToStorage();
  }
  
  targetCard.classList.remove("drag-over");
}