import { useState, useCallback, useEffect } from 'react';
import { FORM_FIELDS } from './config/formOptions';
import FormField from './components/FormField';
import PhotoUploader from './components/PhotoUploader';
import { submitReport, lookupEds, mapEdsDataToForm } from './services/api';
import './App.css';

// Indicador visual del estado de búsqueda de EDS
function EdsStatusBadge({ status }) {
    if (status === 'loading') {
        return <div className="eds-badge eds-badge--loading" aria-label="Buscando..."><div className="spinner tiny"></div></div>;
    }
    if (status === 'found') {
        return (
            <div className="eds-badge eds-badge--found" aria-label="EDS encontrada">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        );
    }
    if (status === 'notfound') {
        return (
            <div className="eds-badge eds-badge--notfound" aria-label="EDS no encontrada">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
            </div>
        );
    }
    return null;
}

// Estado inicial del formulario
function getInitialFormData() {
    const data = {};
    FORM_FIELDS.forEach(field => {
        if (field.type === 'date') {
            data[field.name] = new Date().toISOString().split('T')[0];
        } else {
            data[field.name] = '';
        }
    });
    return data;
}

function App() {
    const [formData, setFormData] = useState(getInitialFormData);
    const [photos, setPhotos] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [statusMessage, setStatusMessage] = useState('');
    const [folderUrl, setFolderUrl] = useState('');

    // Estado para el autocompletado de EDS
    const [edsLookupStatus, setEdsLookupStatus] = useState('idle'); // idle | loading | found | notfound
    const [autoFilledFields, setAutoFilledFields] = useState(new Set());

    // Debounce: buscar EDS cuando el usuario deja de escribir (700ms)
    useEffect(() => {
        const edsValue = formData.eds?.trim();
        if (!edsValue || edsValue.length < 2) {
            setEdsLookupStatus('idle');
            return;
        }
        setEdsLookupStatus('loading');
        const timer = setTimeout(async () => {
            const result = await lookupEds(edsValue);
            if (result.status === 'found') {
                const mapped = mapEdsDataToForm(result.data);
                if (Object.keys(mapped).length > 0) {
                    setFormData(prev => ({ ...prev, ...mapped }));
                    setAutoFilledFields(new Set(Object.keys(mapped)));
                    setEdsLookupStatus('found');
                } else {
                    // Encontrado pero sin campos mapeables
                    setEdsLookupStatus('notfound');
                }
            } else if (result.status === 'notfound') {
                setEdsLookupStatus('notfound');
                setAutoFilledFields(new Set());
            } else {
                // Error de red — no molestar al usuario
                setEdsLookupStatus('idle');
            }
        }, 700);
        return () => clearTimeout(timer);
    }, [formData.eds]);

    const handleFieldChange = useCallback((name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Si el usuario edita manualmente un campo auto-rellenado, quitar la marca
        if (name !== 'eds') {
            setAutoFilledFields(prev => {
                if (!prev.has(name)) return prev;
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        }
        // Si cambia el EDS, limpiar autocompletado anterior
        if (name === 'eds') {
            setAutoFilledFields(new Set());
        }
    }, []);

    const handlePhotosChange = useCallback((newPhotos) => {
        setPhotos(newPhotos);
    }, []);

    const validateForm = () => {
        for (const field of FORM_FIELDS) {
            if (field.required && !formData[field.name]) {
                return `El campo "${field.label}" es obligatorio`;
            }
        }
        if (photos.length === 0) {
            return 'Debes agregar al menos una foto de evidencia';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            setStatus('error');
            setStatusMessage(error);
            setTimeout(() => setStatus('idle'), 4000);
            return;
        }

        setStatus('sending');
        setStatusMessage('Enviando reporte...');

        try {
            const result = await submitReport(formData, photos);
            setStatus('success');
            setStatusMessage(result.message);
            setFolderUrl(result.folderUrl || '');

            // Reset form después de 5 segundos
            setTimeout(() => {
                setFormData(getInitialFormData());
                setPhotos([]);
                setStatus('idle');
                setStatusMessage('');
                setFolderUrl('');
            }, 6000);
        } catch (err) {
            setStatus('error');
            setStatusMessage(err.message);
        }
    };

    const resetStatus = () => {
        if (status === 'error') {
            setStatus('idle');
            setStatusMessage('');
        }
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">K</div>
                        <div className="logo-text">
                            <h1>
                                <span className="brand-name">kub</span>
                                <span className="brand-dot">i</span>
                                {' '}
                                <span className="brand-name">LOCKERS</span>
                            </h1>
                            <p className="subtitle">Reporte de Instalación</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Form */}
            <main className="main">
                <form onSubmit={handleSubmit} className="form" onClick={resetStatus}>

                    {/* Sección: Información General */}
                    <section className="form-section">
                        <div className="section-header">
                            <span className="section-icon">📋</span>
                            <h2>Información General</h2>
                        </div>
                        {edsLookupStatus === 'found' && (
                            <div className="eds-autofill-notice">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Datos cargados automáticamente. Puedes editarlos si es necesario.
                            </div>
                        )}
                        {edsLookupStatus === 'notfound' && formData.eds?.trim().length >= 2 && (
                            <div className="eds-autofill-notice eds-autofill-notice--warn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                EDS no encontrada en el listado. Completa los campos manualmente.
                            </div>
                        )}
                        <div className="fields-grid">
                            {FORM_FIELDS.slice(0, 7).map(field => (
                                <FormField
                                    key={field.name}
                                    field={field}
                                    value={formData[field.name]}
                                    onChange={handleFieldChange}
                                    autoFilled={autoFilledFields.has(field.name)}
                                    badge={field.name === 'eds' ? <EdsStatusBadge status={edsLookupStatus} /> : null}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Sección: Estado de Instalación */}
                    <section className="form-section">
                        <div className="section-header">
                            <span className="section-icon">🔧</span>
                            <h2>Estado de Instalación</h2>
                        </div>
                        <div className="fields-grid">
                            {FORM_FIELDS.slice(7, 15).map(field => (
                                <FormField
                                    key={field.name}
                                    field={field}
                                    value={formData[field.name]}
                                    onChange={handleFieldChange}
                                    autoFilled={autoFilledFields.has(field.name)}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Sección: Comentarios */}
                    <section className="form-section">
                        <div className="section-header">
                            <span className="section-icon">💬</span>
                            <h2>Comentarios</h2>
                        </div>
                        {FORM_FIELDS.filter(f => f.type === 'textarea').map(field => (
                            <FormField
                                key={field.name}
                                field={field}
                                value={formData[field.name]}
                                onChange={handleFieldChange}
                            />
                        ))}
                    </section>

                    {/* Sección: Fotos */}
                    <section className="form-section">
                        <div className="section-header">
                            <span className="section-icon">📸</span>
                            <h2>Evidencia Fotográfica</h2>
                        </div>
                        <PhotoUploader
                            photos={photos}
                            onPhotosChange={handlePhotosChange}
                        />
                    </section>

                    {/* Status Messages */}
                    {status !== 'idle' && (
                        <div className={`status-bar ${status}`}>
                            {status === 'sending' && <div className="spinner small"></div>}
                            {status === 'success' && <span className="status-icon">✅</span>}
                            {status === 'error' && <span className="status-icon">❌</span>}
                            <span>{statusMessage}</span>
                            {folderUrl && (
                                <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="folder-link">
                                    Ver carpeta →
                                </a>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`submit-btn ${status === 'sending' ? 'loading' : ''}`}
                        disabled={status === 'sending' || status === 'success'}
                    >
                        {status === 'sending' ? (
                            <>
                                <div className="spinner small white"></div>
                                Enviando...
                            </>
                        ) : status === 'success' ? (
                            '✅ Enviado correctamente'
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Enviar Reporte
                            </>
                        )}
                    </button>
                </form>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>Sistema de Reportes · <span className="footer-brand">kubi LOCKERS</span></p>
            </footer>
        </div>
    );
}

export default App;
