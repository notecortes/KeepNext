# 🎬 Mi Colección de Entretenimiento

Una aplicación web moderna para gestionar tu colección personal de películas, series, libros y videojuegos con sincronización en la nube.

## ✨ Características Principales

### 🔐 **Autenticación**
- Login con Google OAuth
- Datos separados por usuario
- Sesiones seguras

### ☁️ **Sincronización Multi-Dispositivo**
- Datos sincronizados con Firebase Firestore
- Acceso desde cualquier navegador/dispositivo
- Sincronización en tiempo real
- Respaldo local automático

### 📱 **Gestión de Colecciones**
- Categorías personalizables (Películas, Series, Libros, Videojuegos)
- Crear, editar y eliminar elementos
- Sistema de valoración con estrellas (1-5)
- Campo "Dónde verla" para películas y series
- Imágenes y descripciones

### 🔍 **Búsqueda Inteligente**
- **Múltiples resultados** de APIs reales:
  - OMDB API (películas y series)
  - Google Books API (libros)
  - RAWG API (videojuegos)
- Información automática (descripción, imágenes, detalles)
- Filtros en tiempo real por texto

### 🎨 **Interfaz Moderna**
- Diseño responsive (móvil y escritorio)
- Modo oscuro/claro automático
- Drag & drop para reordenar
- Animaciones suaves
- Iconos intuitivos

### 📊 **Organización Avanzada**
- Múltiples opciones de ordenamiento
- Orden manual con drag & drop
- Filtros por texto en tiempo real
- Contadores automáticos por categoría

## 🚀 Configuración Rápida

### **1. Configurar Google OAuth**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto y habilita Google Identity API
3. Crea credenciales OAuth 2.0 para aplicación web
4. Añade `http://localhost:8000` como origen autorizado
5. Copia tu Client ID

**Edita `js/config.js`:**
```javascript
export const config = {
  googleClientId: "TU_CLIENT_ID_AQUI", // Reemplaza con tu Client ID real
  // ... resto de configuración
};
```

### **2. Configurar Firebase (Opcional pero Recomendado)**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto y habilita Firestore
3. Configura autenticación con Google
4. Copia la configuración de tu app web

**Edita `js/firebase.js`:**
```javascript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  // ... resto de configuración
};
```

### **3. Ejecutar la Aplicación**

```bash
# Opción más fácil con Python
python -m http.server 8000

# O con Node.js
npx http-server -p 8000

# Ve a http://localhost:8000
```

## 📁 Estructura del Proyecto

```
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── js/
│   ├── main.js             # Inicialización principal
│   ├── config.js           # Configuración (Google, APIs)
│   ├── state.js            # Estado global de la aplicación
│   ├── auth.js             # Autenticación con Google
│   ├── firebase.js         # Integración con Firebase
│   ├── storage.js          # Gestión de datos (local + nube)
│   ├── categories.js       # Gestión de categorías
│   ├── items.js            # Gestión de elementos
│   ├── ui.js               # Interfaz de usuario
│   ├── api.js              # Integración con APIs externas
│   └── filter.js           # Sistema de filtros
├── GOOGLE_SETUP.md         # Guía de configuración Google OAuth
├── FIREBASE_SETUP.md       # Guía de configuración Firebase
├── API_CONFIG.md           # Configuración de APIs externas
└── README.md               # Este archivo
```

## 🎯 Cómo Usar

### **Gestión Básica**
1. **Crear categorías** personalizadas o usar las predeterminadas
2. **Añadir elementos** con el botón "+"
3. **Buscar información** automáticamente desde APIs
4. **Editar elementos** con el botón ✏️
5. **Eliminar** con el botón ×

### **Funciones Avanzadas**
- **Filtrar**: Usa el campo de búsqueda para filtrar por texto
- **Reordenar**: Arrastra elementos en modo "Orden manual"
- **Valorar**: Haz clic en las estrellas para valorar (1-5)
- **Cambiar tema**: Botón 🌙/☀️ para modo oscuro/claro

### **Sincronización**
- **Login**: Haz clic en "Iniciar sesión con Google"
- **Automática**: Los datos se sincronizan automáticamente
- **Multi-dispositivo**: Accede desde cualquier navegador
- **Offline**: Funciona sin internet, sincroniza al reconectar

## 🔧 APIs Utilizadas

### **Incluidas (Gratuitas)**
- **OMDB API**: Películas y series (1000 requests/día)
- **Google Books API**: Libros (sin límite básico)
- **RAWG API**: Videojuegos (20,000 requests/mes)

### **Opcionales (Mejores límites)**
- Puedes obtener tus propias API keys para más requests
- Configuración en `js/config.js`

## 🎨 Personalización

### **Temas**
- Modo oscuro/claro automático
- Colores CSS personalizables en `styles.css`
- Variables CSS para fácil personalización

### **Categorías**
- Categorías predeterminadas: Películas, Series, Libros, Videojuegos
- Crear categorías personalizadas ilimitadas
- Iconos y contadores automáticos

### **Campos**
- Título, descripción, imagen, valoración
- Campo "Dónde verla" para contenido audiovisual
- Extensible para más campos personalizados

## 📊 Estado de Configuración

La aplicación muestra indicadores visuales del estado:

- **✅ Verde**: Todo configurado y funcionando
- **⚙️ Amarillo**: Configuración parcial (solo local)
- **❌ Rojo**: Error de configuración

## 🔒 Privacidad y Seguridad

### **Datos Locales**
- Almacenados en localStorage del navegador
- No se envían a terceros sin tu consentimiento
- Cada usuario tiene datos separados

### **Firebase (Opcional)**
- Datos encriptados en tránsito y reposo
- Reglas de seguridad: solo tú accedes a tus datos
- Respaldo automático y recuperación

### **Google OAuth**
- Solo se usa para identificación
- No se accede a otros datos de Google
- Puedes revocar acceso en cualquier momento

## 🆘 Solución de Problemas

### **Login no funciona**
- Verifica el Client ID en `js/config.js`
- Revisa las URLs autorizadas en Google Cloud Console
- Usa un servidor local (no abrir archivo directamente)

### **Datos no se sincronizan**
- Verifica la configuración de Firebase
- Revisa la consola para errores específicos
- Asegúrate de estar logueado

### **APIs no funcionan**
- Verifica tu conexión a internet
- Algunas APIs tienen límites diarios
- Considera obtener tus propias API keys

## 🎉 Funcionalidades Completas

Una vez configurado, tendrás:

✅ **Login con Google** completamente funcional  
✅ **Sincronización multi-dispositivo** con Firebase  
✅ **Búsquedas automáticas** con múltiples resultados  
✅ **Filtros en tiempo real** por texto  
✅ **Edición completa** de elementos  
✅ **Drag & drop** para reordenar  
✅ **Modo oscuro/claro** automático  
✅ **Diseño responsive** para móviles  
✅ **Datos seguros** y privados  
✅ **Funciona offline** con sincronización posterior  

## 📱 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (modernos)
- **Dispositivos**: Escritorio, tablet, móvil
- **Sistemas**: Windows, macOS, Linux, iOS, Android
- **Requisitos**: JavaScript habilitado, conexión a internet (opcional)

## 🌟 Próximas Funcionalidades

Ideas para futuras mejoras:
- Exportar/importar datos
- Compartir listas con otros usuarios
- Recomendaciones basadas en gustos
- Estadísticas y gráficos
- Integración con más APIs
- Notificaciones de nuevos lanzamientos

---

**¡Disfruta gestionando tu colección de entretenimiento!** 🎬📚🎮

Para soporte o preguntas, revisa los archivos de configuración incluidos o abre un issue en el repositorio.