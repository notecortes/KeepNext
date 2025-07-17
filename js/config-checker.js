// Verificador de configuración para Google OAuth y Firebase
import { config } from './config.js';
import { firebaseConfig } from './firebase-config.js';

// Función para verificar la configuración completa
export function checkConfiguration() {
  console.group("🔧 Verificación de Configuración");
  
  const results = {
    domain: checkDomain(),
    googleOAuth: checkGoogleOAuth(),
    firebase: checkFirebase(),
    apis: checkAPIs(),
    overall: 'pending'
  };
  
  // Calcular resultado general
  const checks = Object.values(results).filter(r => r !== 'pending');
  const passed = checks.filter(r => r === 'pass').length;
  const total = checks.length;
  
  results.overall = passed === total ? 'pass' : 'partial';
  
  // Mostrar resumen
  console.log(`📊 Resultado: ${passed}/${total} verificaciones pasadas`);
  
  if (results.overall === 'pass') {
    console.log("✅ ¡Configuración completa! OAuth debería funcionar.");
  } else {
    console.log("⚠️ Configuración parcial. Revisa los elementos marcados.");
  }
  
  console.groupEnd();
  
  return results;
}

// Verificar dominio actual
function checkDomain() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isSecure = protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
  
  console.group("🌐 Verificación de Dominio");
  console.log(`Dominio actual: ${hostname}`);
  console.log(`Protocolo: ${protocol}`);
  console.log(`Seguro: ${isSecure ? '✅' : '❌'}`);
  
  if (!isSecure && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    console.warn("⚠️ OAuth requiere HTTPS en producción");
  }
  
  console.groupEnd();
  
  return isSecure ? 'pass' : 'warn';
}

// Verificar configuración de Google OAuth
function checkGoogleOAuth() {
  console.group("🔐 Verificación de Google OAuth");
  
  const clientId = config.googleClientId;
  console.log(`Client ID: ${clientId}`);
  
  // Verificar formato del Client ID
  const isValidFormat = clientId && clientId.includes('-') && clientId.includes('.apps.googleusercontent.com');
  console.log(`Formato válido: ${isValidFormat ? '✅' : '❌'}`);
  
  // Verificar si es el Client ID por defecto
  const isDefault = clientId.includes('313565959303') || clientId === 'TU_GOOGLE_CLIENT_ID_AQUI';
  if (isDefault) {
    console.warn("⚠️ Usando Client ID por defecto. Actualiza con tu propio Client ID.");
  }
  
  // Verificar configuración por dominio
  const hostname = window.location.hostname;
  console.log(`Configurado para dominio actual (${hostname}): ${config.googleClientId ? '✅' : '❌'}`);
  
  console.groupEnd();
  
  return isValidFormat && !isDefault ? 'pass' : 'warn';
}

// Verificar configuración de Firebase
function checkFirebase() {
  console.group("🔥 Verificación de Firebase");
  
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Configurado' : '❌ Faltante'}`);
  
  // Verificar si es configuración por defecto
  const isDefault = firebaseConfig.projectId === 'TU_PROJECT_ID' || 
                   firebaseConfig.apiKey === 'TU_API_KEY';
  
  if (isDefault) {
    console.warn("⚠️ Usando configuración por defecto de Firebase");
    console.groupEnd();
    return 'warn';
  }
  
  // Verificar formato de configuración
  const hasRequiredFields = firebaseConfig.apiKey && 
                           firebaseConfig.authDomain && 
                           firebaseConfig.projectId;
  
  console.log(`Configuración completa: ${hasRequiredFields ? '✅' : '❌'}`);
  
  console.groupEnd();
  
  return hasRequiredFields ? 'pass' : 'fail';
}

// Verificar APIs externas
function checkAPIs() {
  console.group("🌐 Verificación de APIs");
  
  const apis = config.apis;
  
  // OMDB API
  console.log(`OMDB API: ${apis.omdb.baseUrl}`);
  console.log(`OMDB Key: ${apis.omdb.apiKey ? '✅' : '❌'}`);
  
  // Google Books API
  console.log(`Google Books: ${apis.googleBooks.baseUrl}`);
  
  // RAWG API
  console.log(`RAWG API: ${apis.rawg.baseUrl}`);
  
  console.groupEnd();
  
  return 'pass'; // APIs son opcionales
}

// Función para probar OAuth en tiempo real
export async function testOAuth() {
  console.group("🧪 Prueba de OAuth");
  
  try {
    // Verificar si Google Identity está disponible
    if (!window.google || !window.google.accounts) {
      console.error("❌ Google Identity API no está cargada");
      console.groupEnd();
      return false;
    }
    
    console.log("✅ Google Identity API disponible");
    
    // Intentar inicializar (sin mostrar UI)
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: () => {}, // Callback vacío para prueba
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    
    console.log("✅ OAuth inicializado correctamente");
    console.groupEnd();
    return true;
    
  } catch (error) {
    console.error("❌ Error en OAuth:", error);
    console.groupEnd();
    return false;
  }
}

// Función para mostrar ayuda de configuración
export function showConfigurationHelp() {
  console.group("📚 Ayuda de Configuración");
  
  const hostname = window.location.hostname;
  
  console.log(`
🔧 CONFIGURACIÓN PARA: ${hostname}

1. 📋 Google Cloud Console:
   - Ve a: https://console.cloud.google.com/
   - Proyecto: saveitforlater-77eef
   - Credenciales > OAuth 2.0 Client IDs
   - Añadir origen: ${window.location.origin}

2. 🔥 Firebase Console:
   - Ve a: https://console.firebase.google.com/
   - Proyecto: saveitforlater-77eef
   - Authentication > Settings > Authorized domains
   - Añadir dominio: ${hostname}

3. 📁 Archivos a verificar:
   - js/config.js (Client ID correcto)
   - js/firebase-config.js (Configuración Firebase)

4. 🧪 Probar:
   - Ejecutar: checkConfiguration()
   - Ejecutar: testOAuth()
  `);
  
  console.groupEnd();
}

// Ejecutar verificación automática al cargar
if (typeof window !== 'undefined') {
  // Ejecutar después de que se cargue la página
  window.addEventListener('load', () => {
    setTimeout(() => {
      checkConfiguration();
    }, 2000);
  });
  
  // Hacer funciones disponibles globalmente para debugging
  window.checkConfiguration = checkConfiguration;
  window.testOAuth = testOAuth;
  window.showConfigurationHelp = showConfigurationHelp;
}