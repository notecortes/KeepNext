// Configuración de la aplicación
export const config = {
  // Configuración dinámica de Google Client ID basada en el dominio
  googleClientId: getGoogleClientId(),
  
  // Configuración de desarrollo local
  isDevelopment:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1",

  // URLs de APIs (puedes cambiarlas si usas otras)
  apis: {
    omdb: {
      baseUrl: "https://www.omdbapi.com/",
      apiKey: "trilogy", // API key gratuita de OMDB
    },
    googleBooks: {
      baseUrl: "https://www.googleapis.com/books/v1/",
    },
    rawg: {
      baseUrl: "https://api.rawg.io/api/",
    },
  },
  
  // Configuración de autenticación alternativa
  auth: {
    enableGoogleAuth: true,
    enableLocalAuth: true,
    fallbackToLocal: true
  }
};

// Función para obtener el Google Client ID correcto según el dominio
function getGoogleClientId() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Configuraciones por dominio
  const domainConfigs = {
    // Desarrollo local
    'localhost': "242756676535-clg9vecmutibkr2nib7np1tr38mlptp2.apps.googleusercontent.com",
    '127.0.0.1': "242756676535-clg9vecmutibkr2nib7np1tr38mlptp2.apps.googleusercontent.com",
    
    // Tu dominio de producción
    'ncoge.com': "242756676535-clg9vecmutibkr2nib7np1tr38mlptp2.apps.googleusercontent.com",
    'www.ncoge.com': "242756676535-clg9vecmutibkr2nib7np1tr38mlptp2.apps.googleusercontent.com",
    // 'tu-dominio.com': "TU_CLIENT_ID_PARA_ESTE_DOMINIO",
    // 'otro-dominio.netlify.app': "OTRO_CLIENT_ID",
  };
  
  // Buscar configuración específica para el dominio
  if (domainConfigs[hostname]) {
    return domainConfigs[hostname];
  }
  
  // Client ID por defecto (usa el de tu proyecto Firebase)
  return "242756676535-clg9vecmutibkr2nib7np1tr38mlptp2.apps.googleusercontent.com";
}

// Función para verificar si la configuración está completa
export function isConfigured() {
  return (
    config.googleClientId !== "TU_GOOGLE_CLIENT_ID_AQUI" &&
    config.googleClientId.length > 0
  );
}

// Función para mostrar ayuda de configuración
export function showConfigHelp() {
  if (!isConfigured()) {
    console.warn(`
🔧 CONFIGURACIÓN REQUERIDA:

Para usar el login con Google, necesitas:

1. Ir a Google Cloud Console: https://console.cloud.google.com/
2. Crear un proyecto o seleccionar uno existente
3. Habilitar Google Identity API
4. Crear credenciales OAuth 2.0
5. Copiar tu Client ID
6. Reemplazar "TU_GOOGLE_CLIENT_ID_AQUI" en js/config.js

Dominios autorizados para desarrollo:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:8000
- http://127.0.0.1:8000

¡Una vez configurado, podrás guardar tus datos en la nube!
    `);
  }
}
