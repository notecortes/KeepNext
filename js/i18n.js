// Sistema de internacionalización (i18n)
import { appState, updateState } from './state.js';
import { saveLanguagePreference } from './storage.js';

// Idioma por defecto
const DEFAULT_LANGUAGE = 'es';

// Cache de traducciones cargadas
let translations = {};
let currentLanguage = DEFAULT_LANGUAGE;

// Inicializar sistema i18n
export async function initI18n() {
  // Cargar idioma guardado o detectar idioma del navegador
  const savedLanguage = localStorage.getItem('app-language');
  const browserLanguage = navigator.language.split('-')[0];
  
  currentLanguage = savedLanguage || 
    (browserLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE);
  
  await loadLanguage(currentLanguage);
  updateState({ currentLanguage });
  
  // Actualizar atributo lang del HTML
  const htmlRoot = document.getElementById('html-root');
  if (htmlRoot) {
    htmlRoot.setAttribute('lang', currentLanguage);
  }
  
  // Actualizar selector de idioma
  const languageSelector = document.getElementById('language-selector');
  if (languageSelector) {
    languageSelector.value = currentLanguage;
  }
  
  applyTranslations();
}

// Cargar archivo de idioma
export async function loadLanguage(language) {
  try {
    const response = await fetch(`./locales/${language}.json`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el idioma: ${language}`);
    }
    
    const languageData = await response.json();
    translations[language] = languageData;
    currentLanguage = language;
    
    console.log(`✅ Idioma cargado: ${language}`);
    return true;
  } catch (error) {
    console.error(`❌ Error cargando idioma ${language}:`, error);
    
    // Fallback al idioma por defecto si no es el que estamos intentando cargar
    if (language !== DEFAULT_LANGUAGE) {
      console.log(`🔄 Intentando cargar idioma por defecto: ${DEFAULT_LANGUAGE}`);
      return await loadLanguage(DEFAULT_LANGUAGE);
    }
    return false;
  }
}

// Cambiar idioma
export async function changeLanguage(newLanguage) {
  if (newLanguage === currentLanguage) return;
  
  const success = await loadLanguage(newLanguage);
  if (success) {
    currentLanguage = newLanguage;
    updateState({ currentLanguage: newLanguage });
    applyTranslations();
    saveLanguagePreference(newLanguage);
    
    // Actualizar atributo lang del HTML
    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) {
      htmlRoot.setAttribute('lang', newLanguage);
    }
    
    // Actualizar selector de idioma
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
      languageSelector.value = newLanguage;
    }
    
    // Actualizar título de la página
    const pageTitle = t('app.title');
    if (pageTitle !== 'app.title') {
      document.title = pageTitle;
    }
    
    console.log(`🌍 Idioma cambiado a: ${newLanguage}`);
  }
}

// Obtener traducción
export function t(key, params = {}) {
  const currentTranslations = translations[currentLanguage] || {};
  
  // Navegar por la estructura anidada usando notación de puntos
  const keys = key.split('.');
  let value = currentTranslations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Si no se encuentra la clave, intentar con idioma por defecto
      if (currentLanguage !== DEFAULT_LANGUAGE) {
        const defaultTranslations = translations[DEFAULT_LANGUAGE] || {};
        let defaultValue = defaultTranslations;
        
        for (const dk of keys) {
          if (defaultValue && typeof defaultValue === 'object' && dk in defaultValue) {
            defaultValue = defaultValue[dk];
          } else {
            defaultValue = key; // Mostrar la clave si no se encuentra traducción
            break;
          }
        }
        value = defaultValue;
      } else {
        value = key; // Mostrar la clave si no se encuentra traducción
      }
      break;
    }
  }
  
  // Si el valor final no es string, devolver la clave
  if (typeof value !== 'string') {
    value = key;
  }
  
  // Reemplazar parámetros en la traducción
  return replaceParams(value, params);
}

// Reemplazar parámetros en las traducciones
function replaceParams(text, params) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

// Aplicar traducciones a elementos con data-i18n
export function applyTranslations() {
  // Traducir elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key);
    
    // Determinar qué propiedad actualizar
    if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
      element.placeholder = translation;
    } else if (element.hasAttribute('title')) {
      element.title = translation;
    } else {
      element.textContent = translation;
    }
  });
  
  // Traducir elementos con data-i18n-html (para contenido HTML)
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    const translation = t(key);
    element.innerHTML = translation;
  });
  
  // Actualizar títulos de página
  const pageTitle = t('app.title');
  if (pageTitle !== 'app.title') {
    document.title = pageTitle;
  }
}

// Obtener idioma actual
export function getCurrentLanguage() {
  return currentLanguage;
}

// Obtener idiomas disponibles
export function getAvailableLanguages() {
  return [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
}

// Formatear números según el idioma
export function formatNumber(number) {
  return new Intl.NumberFormat(currentLanguage === 'en' ? 'en-US' : 'es-ES').format(number);
}

// Formatear fechas según el idioma
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  const locale = currentLanguage === 'en' ? 'en-US' : 'es-ES';
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(date));
}

// Pluralización simple
export function plural(count, singularKey, pluralKey) {
  const key = count === 1 ? singularKey : pluralKey;
  return t(key, { count });
}

// Función auxiliar para elementos dinámicos
export function translateElement(element, key, params = {}) {
  const translation = t(key, params);
  
  if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
    element.placeholder = translation;
  } else if (element.hasAttribute('title')) {
    element.title = translation;
  } else {
    element.textContent = translation;
  }
}