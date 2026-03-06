# 🚀 Guía de Deploy — Google Apps Script

## Paso 1: Preparar Google Sheets

1. Abre [Google Sheets](https://sheets.google.com) y crea un nuevo Spreadsheet
2. Nombra la primera hoja como **"Hoja 1"** (o cambia `SHEET_NAME` en el código)
3. En la **fila 1**, agrega los encabezados:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fecha | EDS | Comuna | Dirección | Región | Móvil | Código Blue | Instalado | Módulos Instalados | Estado Locker | Pruebas | Radier | Conexión Eléctrica | Enchufado | Basura | Comentarios | FOTOS |

4. Copia el **ID del Spreadsheet** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

## Paso 2: Preparar Google Drive

1. Abre [Google Drive](https://drive.google.com)
2. Crea una carpeta llamada **"Reportes Lockers"** (o el nombre que prefieras)
3. Abre la carpeta y copia su **ID** de la URL:
   ```
   https://drive.google.com/drive/folders/[ESTE_ES_EL_ID]
   ```

## Paso 3: Crear el Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Crea un nuevo proyecto → Nómbralo "API Reportes Lockers"
3. Borra el código por defecto y pega todo el contenido de `Code.gs`
4. Reemplaza las constantes:
   ```javascript
   const SPREADSHEET_ID = 'PEGA_TU_SPREADSHEET_ID';
   const ROOT_FOLDER_ID = 'PEGA_TU_FOLDER_ID';
   ```
5. Guarda (Ctrl+S)

## Paso 4: Probar la configuración

1. En el menú superior, selecciona la función `testSetup`
2. Haz clic en **▶ Ejecutar**
3. La primera vez pedirá permisos → **Autorizar**
4. Revisa el **Log** (Ver > Registros): debes ver ✅ en todo

## Paso 5: Deploy como Web App

1. Clic en **Deploy** > **New deployment**
2. En tipo, selecciona **Web app**
3. Configurar:
   - **Description**: "API Reportes v1"
   - **Execute as**: **Me** (tu cuenta)
   - **Who has access**: **Anyone** (Cualquier persona)
4. Clic en **Deploy**
5. **Copia la URL** generada (se ve como `https://script.google.com/macros/s/.../exec`)

## Paso 6: Conectar el Frontend

1. Abre el archivo `src/services/api.js` en tu proyecto
2. Reemplaza `'TU_URL_DE_APPS_SCRIPT_AQUI'` con la URL copiada
3. ¡Listo! El formulario ahora enviará datos a tu Spreadsheet y Drive

## ⚠️ Nota sobre actualizaciones

Si modificas el código de Apps Script después del deploy:
1. Deploy > **Manage deployments**
2. Clic en el **✏️ lápiz** de edición
3. En **Version**, selecciona **New version**
4. Clic en **Deploy**
