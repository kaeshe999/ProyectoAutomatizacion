// URL del Google Apps Script Web App
// En desarrollo, usamos el proxy de Vite (/api) para evitar CORS.
// En producción, se usa la URL directa.
const APPS_SCRIPT_DIRECT_URL = 'https://script.google.com/macros/s/AKfycbx3qzH0Zf_yUMyOMfxP07syQqMXaxIfXNGLcnwujRk8xHgbzrDi20UydL2FQGooMyd-XQ/exec';
const API_URL = import.meta.env.DEV ? '/api' : APPS_SCRIPT_DIRECT_URL;

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

        const result = await response.json();

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

