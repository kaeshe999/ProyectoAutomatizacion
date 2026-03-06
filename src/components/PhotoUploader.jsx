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
    const fileInputRef = useRef(null);

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

            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''} ${photos.length > 0 ? 'has-photos' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

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
                        <p className="upload-text">Toca para tomar o seleccionar fotos</p>
                        <p className="upload-hint">JPG, PNG • Se comprimen automáticamente</p>
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
                    <div
                        className="photo-thumb add-more"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="add-icon">+</span>
                        <span className="add-text">Agregar</span>
                    </div>
                </div>
            )}
        </div>
    );
}
