// URL del Google Apps Script Web App
// En desarrollo, usamos el proxy de Vite (/api) para evitar CORS.
// En producción, se usa la URL directa.
const APPS_SCRIPT_DIRECT_URL = 'https://script.google.com/macros/s/AKfycbwgEnxPN5ugdFcT6WqO00CY7ByYZWwLYMvQL9YLzZuNadq-vqcE2xh96OPVta1nEpXnyw/exec';
const API_URL = import.meta.env.DEV ? '/api' : APPS_SCRIPT_DIRECT_URL;

/**
 * El backend ya devuelve los campos normalizados con los nombres exactos del formulario:
 * { direccion, comuna, region, modulosInstalados }
 * Esta función simplemente retorna los datos tal cual (solo filtra vacíos).
 */
export function mapEdsDataToForm(rawData) {
    const result = {};
    const allowed = ['direccion', 'comuna', 'region', 'modulosInstalados', 'codigoBlue', 'movil'];
    for (const key of allowed) {
        if (rawData[key] && rawData[key].toString().trim() !== '') {
            result[key] = rawData[key].toString().trim();
        }
    }
    return result;
}

/**
 * Busca una EDS en el listado de ubicaciones para autocompletar el formulario.
 * Retorna { status: 'found', data: {...} } | { status: 'notfound' } | { status: 'error' }
 *
 * @param {string} edsCode - Código EDS a buscar
 */
export async function lookupEds(edsCode) {
    const url = `${API_URL}?action=lookup&eds=${encodeURIComponent(edsCode)}`;
    try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            return { status: 'error', message: 'Respuesta inválida del servidor' };
        }
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}

/**
 * Envía el reporte del instalador al backend de Google Apps Script.
 * En desarrollo, la petición pasa por el proxy de Vite (sin CORS).
 * 
 * @param {Object} formData - Datos del formulario (texto)
 * @param {Array} photos - Array de fotos comprimidas en base64
 * @returns {Object} Respuesta del servidor
 */
export async function submitReport(formData, photos) {
    const payload = {
        ...formData,
        fotos: photos.map(p => ({
            name: p.name,
            data: p.data
        }))
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        // Leer el texto de la respuesta
        const responseText = await response.text();

        // Intentar parsear como JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            // Google Apps Script devolvió HTML en vez de JSON (error del script)
            // Intentar extraer el mensaje de error del HTML
            const errorMatch = responseText.match(/Error[:\s]*(.*?)(?:<|$)/i)
                || responseText.match(/"message":"(.*?)"/);
            const errorMsg = errorMatch ? errorMatch[1].trim() : 'Error del servidor (respuesta no JSON)';
            console.error('Respuesta del servidor:', responseText.substring(0, 500));
            throw new Error(errorMsg);
        }

        if (result.status === 'success') {
            return {
                success: true,
                message: 'Reporte enviado correctamente',
                folderUrl: result.folderUrl,
                sheetRow: result.row
            };
        } else {
            throw new Error(result.message || 'Error desconocido en el servidor');
        }
    } catch (error) {
        throw new Error(`Error al enviar reporte: ${error.message}`);
    }
}

