import { useState, useCallback } from 'react';
import { FORM_FIELDS } from './config/formOptions';
import FormField from './components/FormField';
import PhotoUploader from './components/PhotoUploader';
import { submitReport } from './services/api';
import './App.css';

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

    const handleFieldChange = useCallback((name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
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
                        <div className="fields-grid">
                            {FORM_FIELDS.slice(0, 7).map(field => (
                                <FormField
                                    key={field.name}
                                    field={field}
                                    value={formData[field.name]}
                                    onChange={handleFieldChange}
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
