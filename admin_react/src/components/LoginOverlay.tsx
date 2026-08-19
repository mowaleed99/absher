import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { useI18n } from '../lib/i18n';
import logoImg from '../assets/logo.png';

export function LoginOverlay() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!identifier.trim() || !password) {
      showToast(t('msg.validation_required'), 'error');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await login(identifier.trim(), password);
      if (res.success) {
        showToast(t('msg.login_success'), 'success');
      } else {
        showToast(res.error || t('msg.login_failed'), 'error');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '20px',
      }}
    >
      <div
        className="modal-box"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '2px solid #fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              marginBottom: '1rem',
              boxShadow: '0 0 25px rgba(251, 191, 36, 0.35)',
            }}
          >
            <img src={logoImg} alt="Absher Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
            {t('admin.title')} <span className="badge">{t('admin.badge')}</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('admin.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>اسم المستخدم أو البريد:</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="absher_admin"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.85rem 1.1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: 'var(--text-main)', fontWeight: 600 }}>كلمة المرور:</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 3rem 0.85rem 1.1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                style={{
                  position: 'absolute',
                  insetInlineEnd: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease',
                }}
              >
                <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-glow"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.9rem',
              fontSize: '1rem',
              marginTop: '0.5rem',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> {t('form.saving')}
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i> {t('btn.login')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
