import { useState, useRef, useCallback } from 'react';

// Comprimir imagen usando canvas
function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve({
                    name: file.name,
                    data: base64,
                    size: Math.round((base64.length * 3) / 4)
                });
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function PhotoUploader({ photos, onPhotosChange }) {
    const [isDragging, setIsDragging] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const processFiles = useCallback(async (files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setCompressing(true);
        try {
            const compressed = await Promise.all(
                imageFiles.map(f => compressImage(f))
            );
            onPhotosChange([...photos, ...compressed]);
        } catch (err) {
            console.error('Error comprimiendo imágenes:', err);
        }
        setCompressing(false);
    }, [photos, onPhotosChange]);

    const handleFileSelect = (e) => {
        if (e.target.files) {
            processFiles(e.target.files);
            // Reset input para poder seleccionar el mismo archivo otra vez
            e.target.value = '';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const openCamera = (e) => {
        e.stopPropagation();
        cameraInputRef.current?.click();
    };

    const openGallery = (e) => {
        e.stopPropagation();
        galleryInputRef.current?.click();
    };

    const removePhoto = (index) => {
        const updated = photos.filter((_, i) => i !== index);
        onPhotosChange(updated);
    };

    return (
        <div className="photo-uploader">
            <label className="photo-label">
                📸 Evidencia Fotográfica
                <span className="required">*</span>
            </label>

            {/* Input oculto para CÁMARA */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Input oculto para GALERÍA */}
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''} ${photos.length > 0 ? 'has-photos' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
            >
                {compressing ? (
                    <div className="upload-status">
                        <div className="spinner"></div>
                        <p>Comprimiendo imágenes...</p>
                    </div>
                ) : (
                    <div className="upload-prompt">
                        <div className="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path d="M24 32V16M24 16L18 22M24 16L30 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 32V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="upload-text">Subir evidencia fotográfica</p>
                        <p className="upload-hint">JPG, PNG • Se comprimen automáticamente</p>

                        <div className="upload-buttons">
                            <button type="button" className="upload-btn camera-btn" onClick={openCamera}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                Cámara
                            </button>
                            <button type="button" className="upload-btn gallery-btn" onClick={openGallery}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                Galería
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {photos.length > 0 && (
                <div className="photo-grid">
                    {photos.map((photo, index) => (
                        <div key={index} className="photo-thumb">
                            <img src={photo.data} alt={`Foto ${index + 1}`} />
                            <button
                                type="button"
                                className="remove-photo"
                                onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                                aria-label="Eliminar foto"
                            >
                                ✕
                            </button>
                            <span className="photo-number">{index + 1}</span>
                        </div>
                    ))}
                    <div className="photo-thumb add-more add-more-split">
                        <button type="button" className="add-split-btn" onClick={openCamera} aria-label="Tomar foto">
                            📷
                        </button>
                        <button type="button" className="add-split-btn" onClick={openGallery} aria-label="Elegir de galería">
                            🖼️
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
