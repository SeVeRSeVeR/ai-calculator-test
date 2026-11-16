/**
 * Компонент валидированного ввода - упрощённая версия для MVP
 */

import React from 'react';

export interface ValidatedInputProps {
  id: string;
  label?: React.ReactNode;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: { value: any; label: string }[];
  onChange: (value: any) => void;
  value: any;
  errors?: Record<string, string>;
  min?: number;
  max?: number;
  step?: number;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  type,
  placeholder,
  options,
  onChange,
  value,
  errors,
  min,
  max,
  step
}) => {
  const isValid = (newValue: any): boolean => {
    if (!newValue) return false;
    
    switch (type) {
      case 'number':
        return typeof newValue === 'number' && !isNaN(newValue) && isFinite(newValue);
      
      case 'select':
        return options?.some(opt => opt.value === newValue) || true;
      
      default:
        return String(newValue).trim() !== '';
    }
  };

  const getError = (newValue: any): string | undefined => {
    if (!errors) return undefined;
    
    switch (type) {
      case 'number':
        if (!isValid(newValue)) return 'Введите числовое значение';
        if (min !== undefined && newValue < min) return `Минимум ${min}`;
        if (max !== undefined && newValue > max) return `Максимум ${max}`;
        return errors[id];
      
      case 'select':
        const selectedOption = options?.find(opt => opt.value === newValue);
        return selectedOption ? errors[id] : errors[id];
      
      default:
        return errors[id];
    }
  };

  if (type !== 'select') {
    return (
      <div className="validated-input">
        {label && <label htmlFor={id}>{label}</label>}
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(
            type === 'number' ? parseFloat(e.target.value) || null : e.target.value
          )}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
        <span className="error-message" style={{ display: getError(value) ? 'block' : 'none' }}>
          {getError(value)}
        </span>
      </div>
    );
  }

  if (options && options.length > 0) {
    return (
      <div className="validated-input">
        {label && <label htmlFor={id}>{label}</label>}
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value as any)}
        >
          <option value="">Выберите значение</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="error-message" style={{ display: getError(value) ? 'block' : 'none' }}>
          {getError(value)}
        </span>
      </div>
    );
  }

  return null;
};

export default ValidatedInput;
