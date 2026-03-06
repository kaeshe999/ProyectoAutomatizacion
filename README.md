# 📦 Sistema de Reportes de Instalación — Kubi Lockers

> Aplicación web desarrollada como proyecto de automatización durante mi práctica, con el objetivo de digitalizar y automatizar el proceso de reporte de instalaciones de lockers inteligentes en terreno.

---

## 🎯 Problema que resuelve

En la empresa, los instaladores de lockers completaban **checklists en papel** y enviaban fotos de forma manual (por WhatsApp o correo). Luego, el equipo de oficina debía:

1. Crear carpetas manualmente en Google Drive por cada sucursal (EDS)
2. Subir las fotos una por una
3. Tipear los datos del checklist en un Google Sheets

Este proceso era **lento, propenso a errores y difícil de escalar**. Esta app automatiza todo ese flujo de punta a punta.

---

## 🏗️ Arquitectura

```
📱 PWA React + Vite           ⚙️ Google Apps Script           ☁️ Google Workspace
(Formulario mobile)    →     (Web App — doPost)         →    📁 Drive + 📊 Sheets
```

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React 18 + Vite 6 | Mobile-first, rápida, componentes reutilizables |
| **Backend / API** | Google Apps Script (Web App) | Cero costo, integración nativa con Drive y Sheets, sin servidor |
| **Almacenamiento de fotos** | Google Drive | Carpetas automáticas por EDS, enlaces compartidos |
| **Base de datos** | Google Sheets | Ya era la fuente de verdad del equipo, fácil de consultar |
| **Tipografía** | Plus Jakarta Sans (Google Fonts) | Diseño premium, moderno |

---

## 🧰 Tecnologías utilizadas

### Frontend
- **React 18** — Librería de UI basada en componentes
- **Vite 6** — Bundler ultrarrápido con HMR (Hot Module Replacement)
- **CSS vanilla** — Estilos mobile-first con gradientes, glassmorphism y micro-animaciones
- **Canvas API** — Compresión de imágenes del lado del cliente antes de enviarlas
- **Fetch API** — Comunicación con el backend via POST

### Backend
- **Google Apps Script** — Plataforma serverless de Google para automatización
  - `doPost()` — Endpoint REST que recibe los datos del formulario
  - `DriveApp` — API para crear carpetas y subir archivos en Google Drive
  - `SpreadsheetApp` — API para insertar filas en Google Sheets

### Herramientas de desarrollo
- **Node.js + npm** — Gestión de dependencias y scripts
- **Vite Dev Server** — Proxy inverso para evitar errores CORS en desarrollo
- **Git** — Control de versiones

---

## 📂 Estructura del proyecto

```
ProyectoAutomatizacion/
├── index.html                      # HTML base con meta tags PWA
├── vite.config.js                  # Config Vite + proxy para desarrollo
├── package.json                    # Dependencias y scripts
├── src/
│   ├── main.jsx                    # Entry point de React
│   ├── App.jsx                     # Componente principal con el formulario
│   ├── App.css                     # Estilos globales (mobile-first, dark theme)
│   ├── index.css                   # Reset CSS base
│   ├── components/
│   │   ├── FormField.jsx           # Componente reutilizable (input, select, textarea)
│   │   └── PhotoUploader.jsx       # Carga de fotos con compresión y preview
│   ├── config/
│   │   └── formOptions.js          # Opciones de dropdowns (regiones, estados, etc.)
│   └── services/
│       └── api.js                  # Servicio de envío al backend (fetch + manejo de errores)
└── google-apps-script/
    ├── Code.gs                     # Script completo del backend
    └── README.md                   # Guía de deploy del Apps Script
```

---

## 🔄 Flujo de funcionamiento

1. **El instalador** abre la app en su celular (es una PWA mobile-first)
2. **Llena el formulario** con datos de la instalación (EDS, comuna, región, estado del locker, etc.)
3. **Adjunta fotos** de evidencia — se comprimen automáticamente con Canvas antes de enviar
4. **Envía el reporte** → el frontend convierte las fotos a base64 y hace un POST al backend
5. **Google Apps Script** recibe el payload y:
   - Busca o crea una carpeta en Drive con el código EDS
   - Sube las fotos a esa carpeta
   - Hace la carpeta pública (acceso con enlace)
   - Inserta una fila en el Google Sheets con todos los datos + link a la carpeta
6. **El instalador recibe confirmación** con un enlace directo a la carpeta de Drive

---

## 🚀 Cómo correr el proyecto en local

### Requisitos previos
- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

### Instalación

```bash
# Clonar o descargar el proyecto
git clone <url-del-repositorio>

# Entrar al directorio
cd ProyectoAutomatizacion

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## ⚙️ Configuración del backend (Google Apps Script)

Para que la app funcione end-to-end, es necesario configurar el backend:

1. Crear un **Google Spreadsheet** y copiar su ID de la URL
2. Crear una **carpeta raíz** en Google Drive y copiar su ID
3. Ir a [script.google.com](https://script.google.com) → Nuevo proyecto
4. Pegar el código de `google-apps-script/Code.gs`
5. Actualizar las constantes `SPREADSHEET_ID` y `ROOT_FOLDER_ID`
6. **Deploy** → New deployment → Web app → Execute as: Me → Who has access: Anyone
7. Copiar la URL generada y pegarla en `src/services/api.js`

> Para más detalles, ver la guía en [`google-apps-script/README.md`](./google-apps-script/README.md)

---

## 📊 Campos del formulario

| Campo | Tipo | Requerido |
|---|---|---|
| Fecha | date | ✅ |
| EDS (Código Sucursal) | text | ✅ |
| Comuna | text | ✅ |
| Dirección | text | ✅ |
| Región | select (16 regiones) | ✅ |
| Móvil | text | ❌ |
| Código Blue | text | ❌ |
| Instalado | select (Sí/No) | ✅ |
| Módulos Instalados | select (1-5) | ✅ |
| Estado Locker | select | ✅ |
| Pruebas | select | ✅ |
| Radier | select | ✅ |
| Conexión Eléctrica | select | ✅ |
| Enchufado | select (Sí/No) | ✅ |
| Basura | select | ✅ |
| Comentarios | textarea | ❌ |
| Fotos de evidencia | imágenes | ✅ (mínimo 1) |

---

## 📱 Características destacadas

- **Mobile-first** — Diseñada para usarse desde el celular del instalador en terreno
- **Compresión de imágenes** — Las fotos se comprimen automáticamente (max 1200px, calidad 70%) para reducir el tamaño del payload
- **Drag & Drop** — Soporte para arrastrar fotos además de seleccionarlas
- **Validación de formulario** — Todos los campos requeridos se validan antes de enviar
- **Feedback visual** — Estados de carga, éxito y error con animaciones
- **Diseño premium** — Dark theme con gradientes, glassmorphism y micro-animaciones
- **Sin costos de infraestructura** — Todo el backend corre en Google Apps Script (gratuito)

---

## 👨‍💻 Autor

Matias Ramos E. 
 Kubi Lockers 

---

## 📄 Licencia

Uso interno — Kubi Lockers.
