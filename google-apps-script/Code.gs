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
const SPREADSHEET_ID = '11rLA9GaLGu9xose2l2noYHXG9_jaYP__OdPoO6b2otMA'; // ID del Google Spreadsheet maestro
const ROOT_FOLDER_ID = '1MuU4MD-_51C1BBs-xN_M169Jw-w0UEU5';       // ID de la carpeta raíz en Google Drive
const SHEET_NAME = 'Seguimiento';                    // Nombre de la hoja (pestaña)

// ── Spreadsheets para autocompletado de EDS ──────────────────────────────────
// Sheet 1: Listado de lockers (columnas: ID Locker, EDS Copec, Dirección, Comuna, Region, Cantidad de modulos)
const LOCKERS_SPREADSHEET_ID = '1UD4J7amneoLV9um58PBZfZ7hksv89p_7ulCRMPcuoyQ';
const LOCKERS_SHEET_GID      = 1050990605;

// Sheet 2: Listado EDS con datos de instalación (columnas: COD EDS, DIRECCIÓN, COMUNA, REGIÓN, # MODULOS A INSTALAR)
const EDS_SPREADSHEET_ID = '1pS6tC8aWJ5aAzsaCVb2_YfEKA26f30XRVBoPhLZAWL0';
const EDS_SHEET_GID      = 1887844170;

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
 * Endpoint GET — health check y lookup de EDS
 * Para buscar una EDS: ?action=lookup&eds=CODIGO
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  // Lookup de EDS para autocompletado del formulario
  if (params.action === 'lookup' && params.eds) {
    return lookupEdsData(params.eds.toString().trim());
  }

  // Health check por defecto
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'API de Reportes activa',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Convierte región a nombre canónico del formulario.
 * Acepta número (13), romano (XIII) o texto en mayúsculas (METROPOLITANA).
 */
function normalizeRegion(valor) {
  if (!valor) return null;
  var v = valor.toString().trim().toUpperCase().replace(/^0+/, '');

  // Mapa numérico y romano
  var mapNum = {
    '1':'Tarapacá','I':'Tarapacá',
    '2':'Antofagasta','II':'Antofagasta',
    '3':'Atacama','III':'Atacama',
    '4':'Coquimbo','IV':'Coquimbo',
    '5':'Valparaíso','V':'Valparaíso',
    '6':"O'Higgins",'VI':"O'Higgins",
    '7':'Maule','VII':'Maule',
    '8':'Biobío','VIII':'Biobío',
    '9':'La Araucanía','IX':'La Araucanía',
    '10':'Los Lagos','X':'Los Lagos',
    '11':'Aysén','XI':'Aysén',
    '12':'Magallanes','XII':'Magallanes',
    '13':'Metropolitana','XIII':'Metropolitana',
    '14':'Los Ríos','XIV':'Los Ríos',
    '15':'Arica y Parinacota','XV':'Arica y Parinacota',
    '16':'Ñuble','XVI':'Ñuble'
  };
  if (mapNum[v]) return mapNum[v];

  // Mapa de texto en mayúsculas (como viene del Maestro Oficial)
  var mapText = {
    'METROPOLITANA':'Metropolitana',
    'VALPARAISO':'Valparaíso','VALPARAÍSO':'Valparaíso',
    'BIOBIO':'Biobío','BIOBÍO':'Biobío','BIO BIO':'Biobío','BÍO BÍO':'Biobío',
    'ARAUCANIA':'La Araucanía','ARAUCANÍA':'La Araucanía','LA ARAUCANIA':'La Araucanía',
    'LOS RIOS':'Los Ríos','LOS RÍOS':'Los Ríos',
    'LOS LAGOS':'Los Lagos',
    'AYSEN':'Aysén','AYSÉN':'Aysén',
    'MAGALLANES':'Magallanes','MAGALLANES Y ANTARTICA':'Magallanes',
    'OHIGGINS':"O'Higgins","O'HIGGINS":"O'Higgins",'LIBERTADOR':"O'Higgins",
    'MAULE':'Maule',
    'NUBLE':'Ñuble','ÑUBLE':'Ñuble',
    'COQUIMBO':'Coquimbo',
    'ATACAMA':'Atacama',
    'ANTOFAGASTA':'Antofagasta',
    'TARAPACA':'Tarapacá','TARAPACÁ':'Tarapacá',
    'ARICA Y PARINACOTA':'Arica y Parinacota','ARICA':'Arica y Parinacota'
  };
  if (mapText[v]) return mapText[v];

  return null;
}

/**
 * Convierte un valor numérico de módulos a la opción del formulario.
 * Redondea al entero más cercano.
 */
function modulosToFormOption(valor) {
  var n = Math.round(parseFloat(valor.toString().replace(',', '.')));
  if (isNaN(n) || n < 1 || n > 5) return null;
  return n === 1 ? '1 módulo' : (n + ' módulos');
}

/**
 * Abre un spreadsheet y retorna la hoja por GID.
 */
function getSheetByGid(spreadsheetId, gid) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return ss.getSheets()[0];
}

/**
 * Busca una EDS en ambos spreadsheets y devuelve datos normalizados.
 *
 * Prioridad:
 *  1. "Listado-Ubicaciones" (LOCKERS_SPREADSHEET) — COD EDS — tiene # MODULOS A INSTALAR
 *  2. "Maestro Oficial"     (EDS_SPREADSHEET)     — EDS Copec / ID Locker — fallback
 *
 * Retorna { status:'found', data:{direccion,comuna,region,modulosInstalados} }
 *      o  { status:'notfound' }
 */
function lookupEdsData(edsCode) {
  try {
    var search = edsCode.toString().trim();

    // Buscar en ambas hojas y combinar resultados
    // Listado-Ubicaciones tiene prioridad para dirección/comuna/región/módulos
    // Maestro Oficial aporta codigoBlue (ID Locker)
    var r1 = searchListadoUbicaciones(search) || {};
    var r2 = searchMaestroOficial(search)     || {};

    // Merge: r1 tiene prioridad, r2 rellena lo que falta
    var merged = {};
    var fields = ['direccion', 'comuna', 'region', 'modulosInstalados', 'codigoBlue'];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (r1[f]) merged[f] = r1[f];
      else if (r2[f]) merged[f] = r2[f];
    }

    if (Object.keys(merged).length > 0) {
      Logger.log('EDS encontrada: ' + edsCode + ' → ' + JSON.stringify(merged));
      return ContentService.createTextOutput(JSON.stringify({ status: 'found', data: merged }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    Logger.log('EDS no encontrada: ' + edsCode);
    return ContentService.createTextOutput(JSON.stringify({ status: 'notfound' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error en lookupEdsData: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Busca en "Plan Implementación Smartlockers" → hoja "Listado-Ubicaciones".
 *
 * ESTRUCTURA ESPECIAL: fila 1 = etiquetas de grupo (ignorar),
 *                      fila 2 = encabezados reales,
 *                      fila 3 en adelante = datos.
 *
 * Columnas usadas: COD EDS, DIRECCIÓN, COMUNA, REGIÓN (número), DESC. REGIÓN, # MODULOS A INSTALAR
 */
function searchListadoUbicaciones(search) {
  var sheet = getSheetByGid(LOCKERS_SPREADSHEET_ID, LOCKERS_SHEET_GID);
  var data  = sheet.getDataRange().getValues();

  // Necesitamos al menos 3 filas (fila-grupo + fila-header + 1 dato)
  if (data.length < 3) return null;

  // Fila 2 (índice 1) = encabezados reales
  var headers = data[1].map(function(h) { return h.toString().trim(); });

  var idxEds     = findColIndex(headers, ['COD EDS']);
  var idxDir     = findColIndex(headers, ['DIRECCIÓN', 'DIRECCION']);
  var idxComuna  = findColIndex(headers, ['COMUNA']);
  var idxRegion  = findColIndex(headers, ['REGIÓN', 'REGION']);
  var idxDescReg = findColIndex(headers, ['DESC. REGIÓN', 'DESC. REGION']);
  var idxModulos = findColIndex(headers, ['# MODULOS A INSTALAR', '# MÓDULOS A INSTALAR']);

  if (idxEds < 0) {
    Logger.log('Listado-Ubicaciones: columna COD EDS no encontrada. Headers: ' + JSON.stringify(headers.slice(0,10)));
    return null;
  }

  // Datos desde fila 3 (índice 2)
  for (var r = 2; r < data.length; r++) {
    var cellEds = data[r][idxEds];
    if (cellEds === null || cellEds === undefined || cellEds === '') continue;
    if (cellEds.toString().trim() === search) {
      var regionRaw  = idxRegion  >= 0 ? data[r][idxRegion].toString().trim()  : '';
      var descReg    = idxDescReg >= 0 ? data[r][idxDescReg].toString().trim() : '';
      var regionNombre = normalizeRegion(regionRaw) || normalizeRegion(descReg);

      var modRaw  = idxModulos >= 0 ? data[r][idxModulos] : '';
      var modulos = modulosToFormOption(modRaw.toString());

      var result = {};
      if (idxDir    >= 0 && data[r][idxDir])    result.direccion         = data[r][idxDir].toString().trim();
      if (idxComuna >= 0 && data[r][idxComuna]) result.comuna            = data[r][idxComuna].toString().trim();
      if (regionNombre)                          result.region            = regionNombre;
      if (modulos)                               result.modulosInstalados = modulos;

      return Object.keys(result).length > 0 ? result : null;
    }
  }
  return null;
}

/**
 * Busca en "MAESTRO Información - Lockers Blue Express" → hoja "Maestro Oficial".
 *
 * Encabezado normal en fila 1.
 * Columnas: EDS Copec, Dirección, Comuna, Region (texto mayúsc.), Cantidad de modulos
 * También acepta búsqueda por ID Locker como alternativa.
 */
function searchMaestroOficial(search) {
  var sheet = getSheetByGid(EDS_SPREADSHEET_ID, EDS_SHEET_GID);
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0].map(function(h) { return h.toString().trim(); });

  var idxEdsCopec = findColIndex(headers, ['EDS Copec', 'EDS COPEC']);
  var idxIdLocker = findColIndex(headers, ['ID Locker', 'ID LOCKER']);
  var idxDir      = findColIndex(headers, ['Dirección', 'DIRECCIÓN', 'Direccion', 'DIRECCION']);
  var idxComuna   = findColIndex(headers, ['Comuna', 'COMUNA']);
  var idxRegion   = findColIndex(headers, ['Region', 'Región', 'REGION', 'REGIÓN']);
  var idxModulos  = findColIndex(headers, ['Cantidad de modulos', 'Cantidad de módulos', 'CANTIDAD DE MODULOS']);

  // Buscar solo por EDS Copec (ID Locker es lo que queremos extraer, no buscar)
  if (idxEdsCopec < 0) return null;

  for (var r = 1; r < data.length; r++) {
    if (data[r][idxEdsCopec].toString().trim() !== search) continue;

    var regionNombre = idxRegion  >= 0 ? normalizeRegion(data[r][idxRegion].toString().trim()) : null;
    var modulos      = idxModulos >= 0 ? modulosToFormOption(data[r][idxModulos].toString())   : null;
    var idLocker     = idxIdLocker >= 0 ? data[r][idxIdLocker].toString().trim() : '';

    var result = {};
    if (idxDir    >= 0 && data[r][idxDir])    result.direccion         = data[r][idxDir].toString().trim();
    if (idxComuna >= 0 && data[r][idxComuna]) result.comuna            = data[r][idxComuna].toString().trim();
    if (regionNombre)                          result.region            = regionNombre;
    if (modulos)                               result.modulosInstalados = modulos;
    // ID Locker → Código Blue del formulario
    if (idLocker && idLocker !== '-' && idLocker !== '')
                                               result.codigoBlue        = idLocker;

    return Object.keys(result).length > 0 ? result : null;
  }
  return null;
}

/**
 * Busca la primera columna cuyos encabezados coincida exactamente con alguno de los candidatos
 * (comparación en mayúsculas para ignorar capitalización).
 */
function findColIndex(headers, candidates) {
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].trim().toUpperCase();
    for (var c = 0; c < candidates.length; c++) {
      if (h === candidates[c].trim().toUpperCase()) return i;
    }
  }
  return -1;
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
 * Inserta una nueva fila en el Google Spreadsheet maestro.
 * 
 * Columnas en el Spreadsheet (pestaña "Seguimiento"):
 * A: Semana (vacío - se llena manualmente)
 * B: Fecha
 * C: EDS
 * D: Comuna
 * E: Dirección
 * F: Región
 * G: Móvil
 * H: Código BLUE
 * I: Estado final del locker (vacío - se llena manualmente)
 * J: Solución (vacío - se llena manualmente)
 * K: Instalado
 * L: Módulos Instalados
 * M: Estado de lockers
 * N: Pruebas
 * O: Radier
 * P: Conexiones eléctricas
 * Q: Enchufado
 * R: Basura
 * S: Comentarios adicionales
 * T: Fotos (enlace carpeta Drive)
 */
function appendToSpreadsheet(payload, folderUrl) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Hoja "' + SHEET_NAME + '" no encontrada. Usando primera hoja.');
      sheet = ss.getSheets()[0];
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
    Logger.log('Fila insertada en fila: ' + lastRow);
    
    return lastRow;
  } catch (error) {
    Logger.log('Error en appendToSpreadsheet: ' + error.toString());
    throw new Error('Error al escribir en planilla: ' + error.message);
  }
}

/**
 * Función de prueba — ejecutar manualmente para verificar la configuración
 */
function testSetup() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet accesible: ' + ss.getName());
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      Logger.log('✅ Hoja encontrada: ' + SHEET_NAME);
    } else {
      Logger.log('❌ Hoja no encontrada: ' + SHEET_NAME);
    }
    const folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    Logger.log('✅ Carpeta de Drive accesible: ' + folder.getName());
    Logger.log('\n🎉 ¡Configuración correcta! Puedes hacer el deploy.');
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * ─────────────────────────────────────────────────────────────────
 * DIAGNÓSTICO: ejecuta esta función manualmente desde el editor
 * para verificar acceso a los spreadsheets de ubicaciones y ver
 * exactamente qué columnas y valores están disponibles.
 *
 * Pasos:
 *  1. Abre el editor de Apps Script
 *  2. Selecciona "testLookupDiagnostico" en el menú desplegable
 *  3. Haz clic en ▶ Ejecutar
 *  4. Abre "Registros de ejecución" y copia el resultado aquí
 * ─────────────────────────────────────────────────────────────────
 */
function testLookupDiagnostico() {
  Logger.log('════════════════════════════════════════');
  Logger.log('DIAGNÓSTICO DE LOOKUP DE EDS');
  Logger.log('════════════════════════════════════════');

  // ── Sheet 2 (EDS instalación) ────────────────────────────────
  Logger.log('\n--- SHEET 2 (EDS_SPREADSHEET) ---');
  try {
    var ss2 = SpreadsheetApp.openById(EDS_SPREADSHEET_ID);
    Logger.log('✅ Acceso OK: ' + ss2.getName());
    var sheet2 = getSheetByGid(EDS_SPREADSHEET_ID, EDS_SHEET_GID);
    Logger.log('   Hoja: ' + sheet2.getName() + ' (GID ' + sheet2.getSheetId() + ')');
    var data2 = sheet2.getDataRange().getValues();
    Logger.log('   Filas totales (incl. header): ' + data2.length);
    Logger.log('   ENCABEZADOS: ' + JSON.stringify(data2[0]));
    if (data2.length > 1) {
      Logger.log('   FILA 2 (primer dato): ' + JSON.stringify(data2[1]));
      Logger.log('   FILA 3: ' + (data2.length > 2 ? JSON.stringify(data2[2]) : 'no existe'));
    }
  } catch(e) {
    Logger.log('❌ ERROR Sheet2: ' + e.toString());
  }

  // ── Sheet 1 (Lockers) ────────────────────────────────────────
  Logger.log('\n--- SHEET 1 (LOCKERS_SPREADSHEET) ---');
  try {
    var ss1 = SpreadsheetApp.openById(LOCKERS_SPREADSHEET_ID);
    Logger.log('✅ Acceso OK: ' + ss1.getName());
    var sheet1 = getSheetByGid(LOCKERS_SPREADSHEET_ID, LOCKERS_SHEET_GID);
    Logger.log('   Hoja: ' + sheet1.getName() + ' (GID ' + sheet1.getSheetId() + ')');
    var data1 = sheet1.getDataRange().getValues();
    Logger.log('   Filas totales (incl. header): ' + data1.length);
    Logger.log('   ENCABEZADOS: ' + JSON.stringify(data1[0]));
    if (data1.length > 1) {
      Logger.log('   FILA 2 (primer dato): ' + JSON.stringify(data1[1]));
      Logger.log('   FILA 3: ' + (data1.length > 2 ? JSON.stringify(data1[2]) : 'no existe'));
    }
  } catch(e) {
    Logger.log('❌ ERROR Sheet1: ' + e.toString());
  }

  Logger.log('\n════════════════════════════════════════');
  Logger.log('FIN DIAGNÓSTICO');
  Logger.log('════════════════════════════════════════');
}
