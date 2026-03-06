import { useState } from 'react';

export default function FormField({ field, value, onChange }) {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e) => {
        onChange(field.name, e.target.value);
    };

    const baseClass = `form-field ${isFocused ? 'focused' : ''} ${value ? 'has-value' : ''}`;

    if (field.type === 'select') {
        return (
            <div className={baseClass}>
                <label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                </label>
                <div className="select-wrapper">
                    <select
                        id={field.name}
                        name={field.name}
                        value={value}
                        onChange={handleChange}
                        required={field.required}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    >
                        <option value="">Seleccionar...</option>
                        {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <span className="select-arrow">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </div>
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <div className={baseClass}>
                <label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                </label>
                <textarea
                    id={field.name}
                    name={field.name}
                    value={value}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </div>
        );
    }

    return (
        <div className={baseClass}>
            <label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="required">*</span>}
            </label>
            <input
                id={field.name}
                type={field.type}
                name={field.name}
                value={value}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </div>
    );
}
