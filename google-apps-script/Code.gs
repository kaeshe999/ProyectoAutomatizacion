/**
 * =============================================
 * GOOGLE APPS SCRIPT — BACKEND DE AUTOMATIZACIÓN
 * Reporte de Instalación de Lockers Inteligentes
 * =============================================
 *
 * INSTRUCCIONES:
 * 1. Ir a https://script.google.com
 * 2. Crear un nuevo proyecto
 * 3. Pegar todo este código en el archivo Code.gs
 * 4. Configurar las constantes SPREADSHEET_ID y ROOT_FOLDER_ID
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copiar la URL generada y pegarla en src/services/api.js
 */

// ⚠️ CONFIGURAR ESTOS VALORES:
const SPREADSHEET_ID = '1sqAhwFMkVxe7TXzr_GRsjqMfA_ua7QMg'; // ID del Google Spreadsheet maestro
const ROOT_FOLDER_ID = '1MuU4MD-_51C1BBs-xN_M169Jw-w0UEU5';       // ID de la carpeta raíz en Google Drive
const SHEET_NAME = 'Seguimiento';                    // Nombre de la hoja (pestaña)

/**
 * Endpoint principal — recibe los datos del formulario via POST
 */
function doPost(e) {
  try {
    // Parsear el payload JSON
    const payload = JSON.parse(e.postData.contents);
    
    // 1. Obtener o crear la carpeta del EDS en Drive
    const edsCode = payload.eds;
    const folder = getOrCreateEdsFolder(edsCode);
    
    // 2. Subir las fotos a la carpeta del EDS
    if (payload.fotos && payload.fotos.length > 0) {
      uploadPhotosToFolder(folder, payload.fotos, edsCode);
    }
    
    // 3. Hacer la carpeta pública (acceso con enlace)
    setFolderPublic(folder);
    
    // 4. Obtener el enlace de la carpeta
    const folderUrl = folder.getUrl();
    
    // 5. Insertar fila en el Spreadsheet
    const row = appendToSpreadsheet(payload, folderUrl);
    
    // 6. Responder con éxito
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Reporte registrado correctamente',
        folderUrl: folderUrl,
        row: row
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Responder con error
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint GET — para verificar que el script está activo
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'API de Reportes activa',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Busca una subcarpeta con el nombre del EDS dentro de la carpeta raíz.
 * Si no existe, la crea. Si existe, la reutiliza.
 */
function getOrCreateEdsFolder(edsCode) {
  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  
  // Buscar si ya existe una carpeta con ese nombre
  const folders = rootFolder.getFoldersByName(edsCode);
  
  if (folders.hasNext()) {
    // La carpeta ya existe, usarla
    return folders.next();
  } else {
    // Crear nueva carpeta
    const newFolder = rootFolder.createFolder(edsCode);
    Logger.log('Carpeta creada: ' + edsCode);
    return newFolder;
  }
}

/**
 * Sube las fotos (recibidas en base64) a la carpeta del EDS.
 * Cada foto se guarda con un nombre descriptivo.
 */
function uploadPhotosToFolder(folder, fotos, edsCode) {
  const timestamp = Utilities.formatDate(new Date(), 'America/Santiago', 'yyyyMMdd_HHmmss');
  
  fotos.forEach(function(foto, index) {
    // Extraer los datos base64 (remover el prefijo "data:image/...;base64,")
    const base64Data = foto.data.split(',')[1];
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      edsCode + '_' + timestamp + '_' + (index + 1) + '.jpg'
    );
    
    folder.createFile(blob);
    Logger.log('Foto subida: ' + blob.getName());
  });
}

/**
 * Establece los permisos de la carpeta para que sea accesible
 * mediante enlace (cualquier persona con el enlace puede ver).
 */
function setFolderPublic(folder) {
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Logger.log('Permisos actualizados para carpeta: ' + folder.getName());
  } catch (error) {
    Logger.log('Error al cambiar permisos: ' + error.toString());
    // No es crítico, continuar sin fallar
  }
}

/**
 * Calcula el número de semana del año para una fecha dada.
 */
function getWeekNumber(dateStr) {
  var date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    date = new Date();
  }
  var startOfYear = new Date(date.getFullYear(), 0, 1);
  var days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/**
 * Inserta una nueva fila en el Google Spreadsheet maestro
 * con todos los datos del reporte + el enlace a la carpeta de fotos.
 * 
 * Columnas esperadas en el Spreadsheet (pestaña "Seguimiento"):
 * A: Semana
 * B: Fecha
 * C: EDS
 * D: Comuna
 * E: Dirección
 * F: Región
 * G: Móvil
 * H: Código BLUE
 * I: Estado final del locker
 * J: Solución
 * K: Instalado
 * L: Módulos Instalados
 * M: Estado de lockers
 * N: Pruebas
 * O: Radier
 * P: Conexiones eléctricas
 * Q: Enchufado
 * R: Basura
 * S: Comentarios adicionales
 * T: Fotos (enlace a la carpeta de Drive)
 */
function appendToSpreadsheet(payload, folderUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error('No se encontró la hoja "' + SHEET_NAME + '" en el Spreadsheet');
  }
  
  const newRow = [
    '',                              // A: Semana (se llena manualmente)
    payload.fecha || '',             // B: Fecha
    payload.eds || '',               // C: EDS
    payload.comuna || '',            // D: Comuna
    payload.direccion || '',         // E: Dirección
    payload.region || '',            // F: Región
    payload.movil || '',             // G: Móvil
    payload.codigoBlue || '',        // H: Código BLUE
    '',                              // I: Estado final del locker (se llena manualmente)
    '',                              // J: Solución (se llena manualmente)
    payload.instalado || '',         // K: Instalado
    payload.modulosInstalados || '', // L: Módulos Instalados
    payload.estadoLocker || '',      // M: Estado de lockers
    payload.pruebas || '',           // N: Pruebas
    payload.radier || '',            // O: Radier
    payload.conexionElectrica || '', // P: Conexiones eléctricas
    payload.enchufado || '',         // Q: Enchufado
    payload.basura || '',            // R: Basura
    payload.comentarios || '',       // S: Comentarios adicionales
    folderUrl                        // T: Fotos
  ];
  
  sheet.appendRow(newRow);
  
  const lastRow = sheet.getLastRow();
  Logger.log('Fila insertada: ' + lastRow);
  
  return lastRow;
}

/**
 * Función de prueba — ejecutar manualmente para verificar la configuración
 */
function testSetup() {
  try {
    // Verificar acceso al Spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet accesible: ' + ss.getName());
    
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      Logger.log('✅ Hoja encontrada: ' + SHEET_NAME);
    } else {
      Logger.log('❌ Hoja no encontrada: ' + SHEET_NAME);
    }
    
    // Verificar acceso a la carpeta de Drive
    const folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    Logger.log('✅ Carpeta de Drive accesible: ' + folder.getName());
    
    Logger.log('\n🎉 ¡Configuración correcta! Puedes hacer el deploy.');
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    Logger.log('Verifica que SPREADSHEET_ID y ROOT_FOLDER_ID sean correctos.');
  }
}
