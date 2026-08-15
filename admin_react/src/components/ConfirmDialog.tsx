import React, { createContext, useContext, useState, useCallback } from 'react';
import { useI18n } from '../lib/i18n';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType>({
  confirm: async () => false,
});

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<{
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (dialog) {
      dialog.resolve(true);
      setDialog(null);
    }
  };

  const handleCancel = () => {
    if (dialog) {
      dialog.resolve(false);
      setDialog(null);
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="modal-overlay active" style={{ zIndex: 100000 }}>
          <div className="modal-box" style={{ maxWidth: '480px', padding: '1.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '12px',
                  background: dialog.options.variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: dialog.options.variant === 'danger' ? '#ef4444' : '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                }}
              >
                <i className={`fa-solid ${dialog.options.variant === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-question'}`}></i>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{dialog.options.title}</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>{dialog.options.message}</p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{ padding: '0.6rem 1.2rem' }}
              >
                {dialog.options.cancelText || t('btn.cancel')}
              </button>
              <button
                type="button"
                className={dialog.options.variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={handleConfirm}
                style={{ padding: '0.6rem 1.4rem' }}
              >
                {dialog.options.confirmText || t('btn.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  return useContext(ConfirmDialogContext);
}
