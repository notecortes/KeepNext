import { appState } from "./state.js";
import { config } from "./config.js";

// Búsqueda de información con APIs reales
export async function searchItemInfo() {
  const title = document.getElementById("item-title").value.trim();

  if (!title) {
    // Importar función de traducción dinámicamente
    const { t } = await import("./i18n.js");
    alert(t("items.title_required"));
    return;
  }

  const searchResults = document.getElementById("search-results");
  // Importar función de traducción dinámicamente
  const { t } = await import("./i18n.js");
  searchResults.innerHTML = `<p>${t("search.searching")}</p>`;
  searchResults.classList.remove("hidden");

  try {
    let searchData = null;

    // Determinar el tipo de búsqueda según la categoría actual
    const currentCategory = appState.categories.find(
      (c) => c.id === appState.currentCategory
    );
    const categoryName = currentCategory
      ? currentCategory.name.toLowerCase()
      : "";

    if (categoryName.includes("película") || categoryName.includes("movie")) {
      searchData = await searchMovie(title);
    } else if (categoryName.includes("serie") || categoryName.includes("tv")) {
      searchData = await searchTVShow(title);
    } else if (
      categoryName.includes("libro") ||
      categoryName.includes("book")
    ) {
      searchData = await searchBook(title);
    } else if (
      categoryName.includes("juego") ||
      categoryName.includes("game")
    ) {
      searchData = await searchGame(title);
    } else if (
      categoryName.includes("restaurante") ||
      categoryName.includes("restaurant") ||
      categoryName.includes("comida") ||
      categoryName.includes("food")
    ) {
      searchData = await searchRestaurant(title);
    } else {
      // Búsqueda general - intentar múltiples APIs
      searchData = await searchGeneral(title);
    }

    if (searchData) {
      displaySearchResults(searchData);
    } else {
      const { t } = await import("./i18n.js");
      searchResults.innerHTML = `<p>${t("search.not_found")}</p>`;
    }
  } catch (error) {
    console.error("Error en búsqueda:", error);
    const { t } = await import("./i18n.js");
    searchResults.innerHTML = `<p>${t("search.error")}</p>`;
  }
}

// Búsqueda de películas usando OMDB API
async function searchMovie(title) {
  try {
    // Primero buscar múltiples resultados
    const searchResponse = await fetch(
      `${config.apis.omdb.baseUrl}?s=${encodeURIComponent(
        title
      )}&type=movie&apikey=${config.apis.omdb.apiKey}`
    );
    const searchData = await searchResponse.json();

    if (searchData.Response === "True" && searchData.Search) {
      // Obtener detalles de los primeros 10 resultados
      const moviePromises = searchData.Search.slice(0, 10).map(
        async (movie) => {
          try {
            const detailResponse = await fetch(
              `${config.apis.omdb.baseUrl}?i=${movie.imdbID}&apikey=${config.apis.omdb.apiKey}`
            );
            const detailData = await detailResponse.json();

            if (detailData.Response === "True") {
              return {
                title: detailData.Title,
                description:
                  detailData.Plot !== "N/A"
                    ? detailData.Plot
                    : `${detailData.Title} (${detailData.Year}) - ${detailData.Genre}. Dirigida por ${detailData.Director}.`,
                image: detailData.Poster !== "N/A" ? detailData.Poster : null,
                year: detailData.Year,
                genre: detailData.Genre,
                director: detailData.Director,
                rating:
                  detailData.imdbRating !== "N/A"
                    ? detailData.imdbRating
                    : null,
                type: "movie",
              };
            }
          } catch (error) {
            console.error("Error obteniendo detalles de película:", error);
          }
          return null;
        }
      );

      const movies = await Promise.all(moviePromises);
      return movies.filter((movie) => movie !== null);
    }
  } catch (error) {
    console.error("Error buscando película:", error);
  }
  return null;
}

// Búsqueda de series usando OMDB API
async function searchTVShow(title) {
  try {
    // Primero buscar múltiples resultados
    const searchResponse = await fetch(
      `${config.apis.omdb.baseUrl}?s=${encodeURIComponent(
        title
      )}&type=series&apikey=${config.apis.omdb.apiKey}`
    );
    const searchData = await searchResponse.json();

    if (searchData.Response === "True" && searchData.Search) {
      // Obtener detalles de los primeros 10 resultados
      const seriesPromises = searchData.Search.slice(0, 10).map(
        async (series) => {
          try {
            const detailResponse = await fetch(
              `${config.apis.omdb.baseUrl}?i=${series.imdbID}&apikey=${config.apis.omdb.apiKey}`
            );
            const detailData = await detailResponse.json();

            if (detailData.Response === "True") {
              return {
                title: detailData.Title,
                description:
                  detailData.Plot !== "N/A"
                    ? detailData.Plot
                    : `${detailData.Title} (${detailData.Year}) - Serie de ${detailData.Genre}. ${detailData.totalSeasons} temporadas.`,
                image: detailData.Poster !== "N/A" ? detailData.Poster : null,
                year: detailData.Year,
                genre: detailData.Genre,
                seasons: detailData.totalSeasons,
                rating:
                  detailData.imdbRating !== "N/A"
                    ? detailData.imdbRating
                    : null,
                type: "series",
              };
            }
          } catch (error) {
            console.error("Error obteniendo detalles de serie:", error);
          }
          return null;
        }
      );

      const series = await Promise.all(seriesPromises);
      return series.filter((serie) => serie !== null);
    }
  } catch (error) {
    console.error("Error buscando serie:", error);
  }
  return null;
}

// Búsqueda de libros usando Google Books API
async function searchBook(title) {
  try {
    const apiKey = config.apis.googleBooks.apiKey
      ? `&key=${config.apis.googleBooks.apiKey}`
      : "";
    const response = await fetch(
      `${config.apis.googleBooks.baseUrl}volumes?q=${encodeURIComponent(
        title
      )}&maxResults=15${apiKey}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const books = data.items.map((item) => {
        const book = item.volumeInfo;
        return {
          title: book.title,
          description:
            book.description ||
            `${book.title} por ${
              book.authors ? book.authors.join(", ") : "Autor desconocido"
            }. ${book.categories ? book.categories.join(", ") : ""}`,
          image: book.imageLinks
            ? book.imageLinks.large ||
              book.imageLinks.medium ||
              book.imageLinks.thumbnail
            : null,
          authors: book.authors,
          publishedDate: book.publishedDate,
          categories: book.categories,
          pageCount: book.pageCount,
          rating: book.averageRating,
          type: "book",
        };
      });

      return books.length === 1 ? books[0] : books;
    }
  } catch (error) {
    console.error("Error buscando libro:", error);
  }
  return null;
}

// Búsqueda de videojuegos usando RAWG API
async function searchGame(title) {
  try {
    const apiKey = config.apis.rawg.apiKey
      ? `&key=${config.apis.rawg.apiKey}`
      : "";
    const response = await fetch(
      `${config.apis.rawg.baseUrl}games?search=${encodeURIComponent(
        title
      )}&page_size=15${apiKey}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const games = data.results.map((game) => ({
        title: game.name,
        description:
          game.description_raw ||
          `${game.name} - Videojuego lanzado en ${
            game.released || "fecha desconocida"
          }. Géneros: ${
            game.genres
              ? game.genres.map((g) => g.name).join(", ")
              : "No especificado"
          }.`,
        image: game.background_image,
        released: game.released,
        genres: game.genres ? game.genres.map((g) => g.name) : [],
        platforms: game.platforms
          ? game.platforms.map((p) => p.platform.name)
          : [],
        rating: game.rating,
        metacritic: game.metacritic,
        type: "game",
      }));

      return games.length === 1 ? games[0] : games;
    }
  } catch (error) {
    console.error("Error buscando videojuego:", error);
  }
  return null;
}

// Búsqueda de restaurantes usando datos simulados (ya que no hay API gratuita confiable)
async function searchRestaurant(title) {
  try {
    // Simulamos una búsqueda de restaurantes con datos realistas
    const restaurantTypes = [
      'Italiano', 'Mexicano', 'Japonés', 'Chino', 'Francés', 'Español', 
      'Americano', 'Mediterráneo', 'Tailandés', 'Indio', 'Árabe', 'Peruano'
    ];
    
    const priceRanges = ['$', '$$', '$$$', '$$$$'];
    const locations = [
      'Centro', 'Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste',
      'Downtown', 'Uptown', 'Midtown', 'Barrio Histórico', 'Zona Comercial'
    ];
    
    // Generar datos simulados basados en el título de búsqueda
    const restaurants = [];
    const baseNames = [
      title,
      `${title} Grill`,
      `${title} Bistro`,
      `${title} Restaurant`,
      `Casa ${title}`,
      `El ${title}`,
      `La ${title}`,
      `${title} Kitchen`,
      `${title} Café`,
      `${title} Bar & Grill`
    ];
    
    for (let i = 0; i < Math.min(8, baseNames.length); i++) {
      const cuisine = restaurantTypes[Math.floor(Math.random() * restaurantTypes.length)];
      const priceRange = priceRanges[Math.floor(Math.random() * priceRanges.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const rating = (3.5 + Math.random() * 1.5).toFixed(1);
      
      restaurants.push({
        title: baseNames[i],
        description: `Restaurante de cocina ${cuisine.toLowerCase()} ubicado en ${location}. Conocido por su ambiente acogedor y excelente servicio. Especialidades de la casa incluyen platos tradicionales con un toque moderno.`,
        image: getRestaurantImage(cuisine),
        cuisine: cuisine,
        priceRange: priceRange,
        location: location,
        rating: rating,
        phone: generatePhoneNumber(),
        hours: generateHours(),
        type: 'restaurant'
      });
    }
    
    return restaurants.length === 1 ? restaurants[0] : restaurants;
  } catch (error) {
    console.error('Error buscando restaurante:', error);
  }
  return null;
}

// Función auxiliar para obtener imagen de restaurante según tipo de cocina
function getRestaurantImage(cuisine) {
  const cuisineImages = {
    'Italiano': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center',
    'Mexicano': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&crop=center',
    'Japonés': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&crop=center',
    'Chino': 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400&h=300&fit=crop&crop=center',
    'Francés': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center',
    'Español': 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop&crop=center',
    'Americano': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&crop=center',
    'Mediterráneo': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&crop=center',
    'Tailandés': 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=300&fit=crop&crop=center',
    'Indio': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&crop=center',
    'Árabe': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&crop=center',
    'Peruano': 'https://images.unsplash.com/photo-1571197119282-7c4a2b8b8c8c?w=400&h=300&fit=crop&crop=center'
  };
  
  return cuisineImages[cuisine] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center';
}

// Función auxiliar para generar número de teléfono
function generatePhoneNumber() {
  const formats = [
    '+1 (555) 123-4567',
    '+34 91 123 45 67',
    '+52 55 1234 5678',
    '(555) 123-4567',
    '555-123-4567'
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

// Función auxiliar para generar horarios
function generateHours() {
  const schedules = [
    'Lun-Dom: 12:00-23:00',
    'Lun-Jue: 18:00-24:00, Vie-Dom: 12:00-01:00',
    'Mar-Dom: 13:00-22:30',
    'Lun-Vie: 12:00-15:00, 19:00-23:00, Sáb-Dom: 12:00-24:00',
    'Todos los días: 11:00-23:30'
  ];
  return schedules[Math.floor(Math.random() * schedules.length)];
}

// Búsqueda general que intenta múltiples APIs
async function searchGeneral(title) {
  let result = await searchMovie(title);
  if (result) return result;

  result = await searchTVShow(title);
  if (result) return result;

  result = await searchBook(title);
  if (result) return result;

  result = await searchGame(title);
  if (result) return result;

  result = await searchRestaurant(title);
  if (result) return result;

  return null;
}

// Mostrar resultados de búsqueda
async function displaySearchResults(data) {
  const searchResults = document.getElementById("search-results");
  const { t } = await import("./i18n.js");

  // Si data es un array (múltiples resultados)
  if (Array.isArray(data)) {
    const query = document.getElementById("item-title").value;
    let resultsHtml = `
      <div class="multiple-search-results">
        <div class="search-results-header">
          <h4>${t("search.found", { count: data.length, query: query })}</h4>
          <div class="search-results-controls" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-top: 1rem;">
            <div class="control-group">
              <label style="font-size: 0.875rem; margin-right: 0.5rem;">🔍 ${t(
                "buttons.filter"
              )}:</label>
              <select onchange="filterResultsByType(this.value)" class="btn btn-secondary" style="font-size: 0.875rem;">
                <option value="all">${t("search.filters.all")}</option>
                <option value="movie">${t("search.filters.movie")}</option>
                <option value="series">${t("search.filters.series")}</option>
                <option value="book">${t("search.filters.book")}</option>
                <option value="game">${t("search.filters.game")}</option>
              </select>
            </div>
            <div class="control-group">
              <label style="font-size: 0.875rem; margin-right: 0.5rem;">📊 ${t(
                "buttons.sort"
              )}:</label>
              <select onchange="sortResults(this.value)" class="btn btn-secondary" style="font-size: 0.875rem;">
                <option value="relevance">${t("search.sort.relevance")}</option>
                <option value="title">${t("search.sort.title")}</option>
                <option value="year">${t("search.sort.year")}</option>
                <option value="rating">${t("search.sort.rating")}</option>
              </select>
            </div>
            <button onclick="toggleResultsView()" class="btn btn-secondary" id="toggle-view-btn" style="font-size: 0.875rem;">
              📋 ${t("search.compact_view")}
            </button>
            <button onclick="document.getElementById('search-results').classList.add('hidden')" class="btn btn-secondary" style="font-size: 0.875rem;">
              ❌ ${t("buttons.close")}
            </button>
          </div>
        </div>
        <div class="search-results-container" id="search-results-container" style="max-height: 60vh; overflow-y: auto; margin-top: 1rem;">
    `;

    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      const additionalInfo = await getAdditionalInfo(item);
      const shortDescription =
        item.description.length > 150
          ? item.description.substring(0, 150) + "..."
          : item.description;

      resultsHtml += `
        <div class="search-result-card" data-index="${index}" style="
          margin-bottom: 1rem; 
          border: 1px solid var(--border-color); 
          border-radius: 0.5rem; 
          padding: 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
        " onmouseover="this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.boxShadow='var(--shadow)'">
          <div class="search-result-content" style="display: flex; gap: 1rem;">
            ${
              item.image
                ? `
              <div class="search-result-image" style="flex-shrink: 0;">
                <img src="${item.image}" alt="${item.title}" style="
                  width: 80px; 
                  height: 120px; 
                  object-fit: cover; 
                  border-radius: 0.375rem;
                  box-shadow: var(--shadow);
                ">
              </div>
            `
                : `
              <div class="search-result-image" style="
                flex-shrink: 0;
                width: 80px; 
                height: 120px; 
                background: var(--border-color);
                border-radius: 0.375rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
                font-size: 0.75rem;
              ">
                ${t("metadata.no_image")}
              </div>
            `
            }
            <div class="search-result-info" style="flex: 1; min-width: 0;">
              <h5 style="margin: 0 0 0.5rem 0; color: var(--primary-color); font-size: 1.1rem;">${
                item.title
              }</h5>
              <div class="search-result-meta" style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                ${additionalInfo}
              </div>
              <div class="search-result-description">
                <p class="description-text" style="
                  font-size: 0.875rem; 
                  line-height: 1.4; 
                  margin: 0;
                  color: var(--text-primary);
                ">${shortDescription}</p>
                ${
                  item.description.length > 150
                    ? `
                  <button onclick="toggleDescription(${index})" class="btn-link" style="
                    background: none; 
                    border: none; 
                    color: var(--primary-color); 
                    cursor: pointer; 
                    font-size: 0.75rem;
                    padding: 0;
                    margin-top: 0.25rem;
                  ">
                    Ver más...
                  </button>
                `
                    : ""
                }
              </div>
            </div>
            <div class="search-result-actions" style="flex-shrink: 0; display: flex; flex-direction: column; gap: 0.5rem;">
              <button onclick="applySearchResultByIndex(${index})" class="btn btn-primary" style="
                font-size: 0.875rem;
                padding: 0.5rem 1rem;
                white-space: nowrap;
              ">
                📥 ${t("buttons.use")}
              </button>
              <button onclick="previewResult(${index})" class="btn btn-secondary" style="
                font-size: 0.875rem;
                padding: 0.5rem 1rem;
                white-space: nowrap;
              ">
                👁️ ${t("buttons.preview")}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    resultsHtml += `
        </div>
        <div class="search-results-footer" style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">
            ${t("search.tip")}
          </p>
        </div>
      </div>
    `;

    // Guardar datos para funciones auxiliares
    window.searchResultsData = data;

    searchResults.innerHTML = resultsHtml;
  } else {
    // Resultado único (comportamiento original)
    const additionalInfo = await getAdditionalInfo(data);

    searchResults.innerHTML = `
      <div class="search-result-card">
        <h4>${t("search.found_single")}</h4>
        <div class="search-result-content">
          ${
            data.image
              ? `
            <div class="search-result-image">
              <img src="${data.image}" alt="${data.title}" style="max-width: 150px; height: auto; border-radius: 0.375rem;">
            </div>
          `
              : ""
          }
          <div class="search-result-info">
            <h5>${data.title}</h5>
            ${additionalInfo}
            <p><strong>${t("items.description")}:</strong></p>
            <p class="description-text">${data.description}</p>
          </div>
        </div>
        <div class="search-result-actions">
          <button onclick="window.applySearchResults(\`${data.description.replace(
            /`/g,
            "\\`"
          )}\`, '${data.image || ""}')" class="btn btn-primary">
            📥 ${t("search.apply_info")}
          </button>
          <button onclick="document.getElementById('search-results').classList.add('hidden')" class="btn btn-secondary">
            ❌ ${t("buttons.close")}
          </button>
        </div>
      </div>
    `;
  }
}

// Función auxiliar para obtener información adicional según el tipo
async function getAdditionalInfo(data) {
  const { t } = await import("./i18n.js");

  switch (data.type) {
    case "movie":
      return `
        ${
          data.year
            ? `<p><strong>${t("metadata.year")}:</strong> ${data.year}</p>`
            : ""
        }
        ${
          data.genre
            ? `<p><strong>${t("metadata.genre")}:</strong> ${data.genre}</p>`
            : ""
        }
        ${
          data.director
            ? `<p><strong>${t("metadata.director")}:</strong> ${
                data.director
              }</p>`
            : ""
        }
        ${
          data.rating
            ? `<p><strong>${t("metadata.rating_imdb")}:</strong> ${
                data.rating
              }/10</p>`
            : ""
        }
      `;
    case "series":
      return `
        ${
          data.year
            ? `<p><strong>${t("metadata.year")}:</strong> ${data.year}</p>`
            : ""
        }
        ${
          data.genre
            ? `<p><strong>${t("metadata.genre")}:</strong> ${data.genre}</p>`
            : ""
        }
        ${
          data.seasons
            ? `<p><strong>${t("metadata.seasons")}:</strong> ${
                data.seasons
              }</p>`
            : ""
        }
        ${
          data.rating
            ? `<p><strong>${t("metadata.rating_imdb")}:</strong> ${
                data.rating
              }/10</p>`
            : ""
        }
      `;
    case "book":
      return `
        ${
          data.authors
            ? `<p><strong>${t(
                "metadata.authors"
              )}:</strong> ${data.authors.join(", ")}</p>`
            : ""
        }
        ${
          data.publishedDate
            ? `<p><strong>${t("metadata.published_date")}:</strong> ${
                data.publishedDate
              }</p>`
            : ""
        }
        ${
          data.pageCount
            ? `<p><strong>${t("metadata.pages")}:</strong> ${
                data.pageCount
              }</p>`
            : ""
        }
        ${data.rating ? `<p><strong>Rating:</strong> ${data.rating}/5</p>` : ""}
      `;
    case "game":
      return `
        ${
          data.released
            ? `<p><strong>${t("metadata.release_date")}:</strong> ${
                data.released
              }</p>`
            : ""
        }
        ${
          data.genres
            ? `<p><strong>${t("metadata.genres")}:</strong> ${data.genres.join(
                ", "
              )}</p>`
            : ""
        }
        ${
          data.platforms
            ? `<p><strong>${t("metadata.platforms")}:</strong> ${data.platforms
                .slice(0, 3)
                .join(", ")}${data.platforms.length > 3 ? "..." : ""}</p>`
            : ""
        }
        ${data.rating ? `<p><strong>Rating:</strong> ${data.rating}/5</p>` : ""}
        ${
          data.metacritic
            ? `<p><strong>${t("metadata.rating_metacritic")}:</strong> ${
                data.metacritic
              }/100</p>`
            : ""
        }
      `;
    case "restaurant":
      return `
        ${
          data.cuisine
            ? `<p><strong>${t("metadata.cuisine")}:</strong> ${data.cuisine}</p>`
            : ""
        }
        ${
          data.priceRange
            ? `<p><strong>${t("metadata.price_range")}:</strong> ${data.priceRange}</p>`
            : ""
        }
        ${
          data.location
            ? `<p><strong>${t("metadata.location")}:</strong> ${data.location}</p>`
            : ""
        }
        ${data.rating ? `<p><strong>Rating:</strong> ${data.rating}/5</p>` : ""}
        ${
          data.phone
            ? `<p><strong>${t("metadata.phone")}:</strong> ${data.phone}</p>`
            : ""
        }
        ${
          data.hours
            ? `<p><strong>${t("metadata.hours")}:</strong> ${data.hours}</p>`
            : ""
        }
      `;
    default:
      return "";
  }
}

export function applySearchResults(description, image) {
  document.getElementById("item-description").value = description;
  document.getElementById("item-image").value = image;
  document.getElementById("search-results").classList.add("hidden");
}

// Funciones auxiliares para la nueva interfaz de múltiples resultados

// Alternar entre vista compacta y expandida
window.toggleResultsView = async function () {
  const container = document.getElementById("search-results-container");
  const toggleBtn = document.getElementById("toggle-view-btn");
  const cards = container.querySelectorAll(".search-result-card");
  const { t } = await import("./i18n.js");

  if (container.classList.contains("compact-view")) {
    // Cambiar a vista expandida
    container.classList.remove("compact-view");
    toggleBtn.textContent = `📋 ${t("search.compact_view")}`;

    cards.forEach((card) => {
      const content = card.querySelector(".search-result-content");
      content.style.display = "flex";
      const description = card.querySelector(".search-result-description");
      description.style.display = "block";
    });
  } else {
    // Cambiar a vista compacta
    container.classList.add("compact-view");
    toggleBtn.textContent = `📖 ${t("search.expanded_view")}`;

    cards.forEach((card) => {
      const content = card.querySelector(".search-result-content");
      content.style.display = "flex";
      content.style.alignItems = "center";
      const description = card.querySelector(".search-result-description");
      description.style.display = "none";
    });
  }
};

// Alternar descripción completa/resumida
window.toggleDescription = async function (index) {
  const card = document.querySelector(`[data-index="${index}"]`);
  const descriptionElement = card.querySelector(".description-text");
  const toggleButton = card.querySelector(".btn-link");
  const fullDescription = window.searchResultsData[index].description;
  const shortDescription =
    fullDescription.length > 150
      ? fullDescription.substring(0, 150) + "..."
      : fullDescription;
  const { t } = await import("./i18n.js");

  if (descriptionElement.textContent === shortDescription) {
    // Mostrar descripción completa
    descriptionElement.textContent = fullDescription;
    toggleButton.textContent = t("search.show_less");
  } else {
    // Mostrar descripción resumida
    descriptionElement.textContent = shortDescription;
    toggleButton.textContent = t("search.show_more");
  }
};

// Previsualizar resultado en modal
window.previewResult = async function (index) {
  const item = window.searchResultsData[index];
  const additionalInfo = await getAdditionalInfo(item);
  const { t } = await import("./i18n.js");

  // Crear modal de previsualización
  const modalHtml = `
    <div id="preview-modal" class="modal" style="display: block;">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>${t("search.preview_title", { title: item.title })}</h3>
          <button onclick="closePreviewModal()" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            ${
              item.image
                ? `
              <div style="flex-shrink: 0;">
                <img src="${item.image}" alt="${item.title}" style="
                  width: 150px; 
                  height: 225px; 
                  object-fit: cover; 
                  border-radius: 0.5rem;
                  box-shadow: var(--shadow);
                ">
              </div>
            `
                : ""
            }
            <div style="flex: 1;">
              <h4 style="color: var(--primary-color); margin-top: 0;">${
                item.title
              }</h4>
              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                ${additionalInfo}
              </div>
            </div>
          </div>
          <div>
            <h5>📝 ${t("search.full_description")}:</h5>
            <p style="line-height: 1.6; text-align: justify;">${
              item.description
            }</p>
          </div>
        </div>
        <div class="modal-footer">
          <button onclick="applySearchResultByIndex(${index})" class="btn btn-primary">
            📥 ${t("search.use_result")}
          </button>
          <button onclick="closePreviewModal()" class="btn btn-secondary">
            ❌ ${t("buttons.close")}
          </button>
        </div>
      </div>
    </div>
  `;

  // Añadir modal al DOM
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Cerrar modal al hacer clic fuera
  document
    .getElementById("preview-modal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        closePreviewModal();
      }
    });
};

// Cerrar modal de previsualización
window.closePreviewModal = function () {
  const modal = document.getElementById("preview-modal");
  if (modal) {
    modal.remove();
  }
};

// Filtrar resultados por tipo
window.filterResultsByType = function (type) {
  const cards = document.querySelectorAll(".search-result-card");
  const data = window.searchResultsData;

  cards.forEach((card, index) => {
    const item = data[index];
    if (type === "all" || item.type === type) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
};

// Ordenar resultados
window.sortResults = function (criteria) {
  const container = document.getElementById("search-results-container");
  const data = window.searchResultsData;

  // Crear copia ordenada de los datos
  let sortedData = [...data];

  switch (criteria) {
    case "title":
      sortedData.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "year":
      sortedData.sort((a, b) => {
        const yearA = a.year || a.released || a.publishedDate || "0";
        const yearB = b.year || b.released || b.publishedDate || "0";
        return yearB.localeCompare(yearA);
      });
      break;
    case "rating":
      sortedData.sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      });
      break;
  }

  // Actualizar datos globales
  window.searchResultsData = sortedData;

  // Re-renderizar resultados
  displaySearchResults(sortedData);
};

// Aplicar resultado por índice (soluciona el problema de sintaxis)
window.applySearchResultByIndex = function (index) {
  const item = window.searchResultsData[index];
  if (item) {
    // Aplicar información básica
    document.getElementById("item-description").value = item.description || "";
    document.getElementById("item-image").value = item.image || "";

    // Guardar metadatos en un campo oculto o en el estado global para usar al guardar
    window.currentItemMetadata = {
      type: item.type,
      year: item.year,
      genre: item.genre,
      director: item.director,
      rating: item.rating,
      seasons: item.seasons,
      authors: item.authors,
      publishedDate: item.publishedDate,
      pageCount: item.pageCount,
      categories: item.categories,
      released: item.released,
      genres: item.genres,
      platforms: item.platforms,
      metacritic: item.metacritic,
    };

    document.getElementById("search-results").classList.add("hidden");
    console.log(
      "✅ Información aplicada:",
      item.title,
      "con metadatos:",
      window.currentItemMetadata
    );
  }
};
