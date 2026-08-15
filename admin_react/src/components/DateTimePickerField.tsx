import { useRef } from 'react';
import { useI18n } from '../lib/i18n';

interface DateTimePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  helperText = 'اختياري • يشمل تحديد التاريخ والوقت',
  error,
}: DateTimePickerFieldProps) {
  const { lang } = useI18n();
  const isRtl = lang === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (inputRef.current && typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {/* Label */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--text-main)',
        }}
      >
        <span>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '1px 4px',
            }}
            title="مسح التاريخ والوقت"
          >
            <i className="fa-solid fa-xmark"></i>
            <span>مسح</span>
          </button>
        )}
      </label>

      {/* Input Container */}
      <div
        onClick={handleOpenPicker}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: disabled ? '#080d1a' : '#0d1527',
          border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          height: '38px',
          overflow: 'hidden',
        }}
      >
        {/* Calendar Icon Tile */}
        <div
          onClick={handleOpenPicker}
          style={{
            position: 'absolute',
            right: isRtl ? '10px' : 'auto',
            left: isRtl ? 'auto' : '10px',
            color: value ? '#38bdf8' : 'var(--text-muted)',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="fa-solid fa-calendar-days"></i>
        </div>

        {/* Native datetime-local input */}
        <input
          ref={inputRef}
          type="datetime-local"
          value={value}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            // Allow native interactions while facilitating showPicker
            e.stopPropagation();
          }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            colorScheme: 'dark',
            fontSize: '0.84rem',
            fontWeight: 600,
            paddingRight: isRtl ? '34px' : '10px',
            paddingLeft: isRtl ? '10px' : '34px',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
      </div>

      {/* Helper text / Error message */}
      {error ? (
        <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
