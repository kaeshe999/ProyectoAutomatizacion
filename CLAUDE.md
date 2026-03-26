# CLAUDE.md — KubiAT_HW

## Propósito del Proyecto

PWA mobile-first que automatiza el proceso de reporte de instalación de lockers inteligentes Kubi. Los instaladores en terreno completan un formulario, adjuntan fotos, y el sistema organiza todo automáticamente en Google Drive y Google Sheets — eliminando el proceso manual anterior (WhatsApp + Excel).

**Mercado objetivo**: Chile (regiones, timezone America/Santiago)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 6 (PWA) |
| Backend | Google Apps Script (serverless) |
| Almacenamiento fotos | Google Drive |
| Base de datos | Google Sheets |
| Styling | CSS vanilla (dark theme, glassmorphism) |
| Font | Plus Jakarta Sans |

**Sin TypeScript** — proyecto en JavaScript puro (JSX).

---

## Estructura del Proyecto

```
src/
├── main.jsx                    # Punto de entrada React
├── App.jsx                     # Componente raíz, estado global, submit
├── App.css                     # Todos los estilos (~834 líneas)
├── index.css                   # Reset global
├── components/
│   ├── FormField.jsx           # Input/select/textarea reutilizable
│   └── PhotoUploader.jsx       # Compresión + grid de fotos
├── config/
│   └── formOptions.js          # Config centralizada de campos (FORM_FIELDS)
└── services/
    └── api.js                  # submitReport() — fetch al backend

google-apps-script/
├── Code.gs                     # Backend: doPost(), creación Drive/Sheets
└── README.md                   # Guía de despliegue
```

---

## Arquitectura y Flujo de Datos

```
Usuario (móvil/desktop)
  → Llena formulario React (4 secciones)
  → Sube fotos (comprimidas a 1200px, 70% JPEG via Canvas API)
  → Submit → POST /api (Vite proxy en dev)
       ↓
Google Apps Script (doPost)
  → Crea/obtiene carpeta en Drive (por código EDS)
  → Decodifica base64 → sube JPEGs a Drive
  → Comparte carpeta (anyone with link)
  → Inserta fila en Google Sheets
  → Retorna JSON con URL carpeta + número de fila
       ↓
Frontend muestra estado (enviando → éxito/error)
  → Reset del formulario después de 6 segundos
```

---

## Convenciones del Código

- **Idioma**: Etiquetas UI en español, código en inglés (camelCase)
- **CSS**: Mobile-first, breakpoints en 375px / 480px / 768px
- **Componentes**: Funcionales con hooks (`useState`, `useCallback`)
- **Config driven**: `FORM_FIELDS` en `formOptions.js` define todo el formulario
- **Nombres CSS**: kebab-case, inspirado en BEM (`.form-section`, `.photo-thumb`)
- **Colores clave**: `#75D8A3` (Kubi green), dark theme base `#0a0f1a`

---

## Campos del Formulario (16 total)

**Sección 1 — Información General** (7 campos):
`fecha`, `edsCode`, `comuna`, `direccion`, `region`, `movil`, `codigoBlue`

**Sección 2 — Estado de Instalación** (8 campos):
`instalado`, `modulosInstalados`, `estadoLocker`, `pruebas`, `radier`, `conexionElectrica`, `enchufado`, `basura`

**Sección 3** — `comentarios` (textarea, opcional)

**Sección 4** — Fotos de evidencia (mínimo 1, requerido)

---

## Backend (Google Apps Script)

- **Endpoint producción**: configurado en `vite.config.js` como proxy y en `api.js`
- `doPost(e)`: recibe JSON, procesa fotos, crea carpeta Drive, inserta en Sheets
- `doGet(e)`: health check
- `testSetup()`: función de diagnóstico — ejecutar manualmente en el editor de Apps Script
- La carpeta en Drive se nombra con el código EDS para evitar duplicados
- El ID del Spreadsheet y el ID de la carpeta raíz de Drive están hardcodeados en `Code.gs`

---

## Desarrollo Local

```bash
npm install
npm run dev        # http://localhost:5173
```

El proxy de Vite (`vite.config.js`) redirige `/api` → URL de Google Apps Script para evitar CORS en desarrollo.

```bash
npm run build      # Build producción en /dist
npm run preview    # Preview del build
```

---

## Despliegue

1. **Frontend**: subir `/dist` a cualquier hosting estático (Vercel, Netlify, GitHub Pages)
2. **Backend**: desplegar `Code.gs` en Google Apps Script como Web App
   - Ejecutar como: `Yo`
   - Quién tiene acceso: `Cualquier persona`
   - Copiar la URL del despliegue al proxy en `vite.config.js` y a `api.js`

---

## Patrones y Reglas a Seguir

- **No agregar TypeScript** — el proyecto es intencional en JS
- **Mobile-first siempre** — testear en viewports de 375px
- **No usar librerías de UI externas** — todo CSS custom para mantener el bundle pequeño
- **Compresión de imágenes obligatoria** — no subir fotos sin pasar por Canvas
- **Mantener config centralizada** — nuevos campos van en `formOptions.js`, no hardcodeados en componentes
- **Glassmorphism consistente** — usar `backdrop-filter: blur()` + `rgba()` para nuevos paneles
- **El backend es serverless** — no agregar estado persistente en Apps Script entre requests

---

## Funcionalidades Pendientes / Áreas de Mejora

(Actualizar según se agreguen features)

- [ ] Modo offline con sincronización posterior (Service Worker)
- [ ] Historial local de reportes enviados
- [ ] Preview del PDF de reporte antes de enviar
- [ ] Notificaciones push cuando el reporte es procesado
- [ ] Panel de administración para ver reportes (Google Sheets embed o dashboard)
- [ ] Validación del código EDS contra una lista predefinida
- [ ] Firma digital del instalador
- [ ] Geolocalización automática de la instalación
