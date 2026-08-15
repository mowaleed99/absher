import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { useI18n } from '../lib/i18n';

export function LoginOverlay() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              color: '#fff',
              marginBottom: '1rem',
              boxShadow: '0 0 20px var(--primary-glow)',
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
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
