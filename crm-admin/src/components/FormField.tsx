import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  className?: string;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  min,
  className = '',
  as = 'input',
  children,
  disabled = false,
}) => {
  const inputClasses = `input-field ${error ? 'border-red-500' : ''} ${className}`;
  
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="label-field">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {as === 'input' && (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
          required={required}
          min={min}
          disabled={disabled}
        />
      )}
      
      {as === 'textarea' && (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          className={`${inputClasses} h-32`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      )}
      
      {as === 'select' && (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={inputClasses}
          required={required}
          disabled={disabled}
        >
          {children}
        </select>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
