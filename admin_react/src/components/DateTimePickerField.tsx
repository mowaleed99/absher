import React, { useRef, useState } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {/* Field Label & Clear Button */}
      <div
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
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '5px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            title="مسح القيمة المحددة"
          >
            <i className="fa-solid fa-xmark"></i>
            <span>مسح</span>
          </button>
        )}
      </div>

      {/* Input Container */}
      <div
        onClick={handleOpenPicker}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: disabled ? '#080d1a' : '#0d1527',
          border: `1px solid ${
            error
              ? '#ef4444'
              : isFocused
              ? '#38bdf8'
              : isHovered
              ? 'rgba(56, 189, 248, 0.5)'
              : 'var(--border-color)'
          }`,
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          height: '40px',
          overflow: 'hidden',
          boxShadow: isFocused ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
        }}
      >
        {/* Single High-Contrast Cyan Calendar Icon Tile */}
        <div
          onClick={handleOpenPicker}
          style={{
            position: 'absolute',
            right: isRtl ? '6px' : 'auto',
            left: isRtl ? 'auto' : '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            flexShrink: 0,
            zIndex: 2,
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPicker();
          }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: value ? '#f8fafc' : '#94a3b8',
            colorScheme: 'dark',
            fontSize: '0.86rem',
            fontWeight: 600,
            paddingRight: isRtl ? '42px' : '12px',
            paddingLeft: isRtl ? '12px' : '42px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            zIndex: 1,
          }}
        />
      </div>

      {/* Helper text / Validation Error */}
      {error ? (
        <span style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
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
