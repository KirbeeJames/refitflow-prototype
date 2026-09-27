import React, { useEffect } from 'react';

export const money = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n ?? 0);
export const moneyShort = n => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 2 }).format(n);
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const LEVEL_PILL = { red: 'pill-red', amber: 'pill-amber', blue: 'pill-blue' };
export const STATUS_PILL = { Complete: 'pill-green', 'In progress': 'pill-blue', Approved: 'pill-green', Pending: 'pill-amber', Rejected: 'pill-red' };
export const CONTRACT_PILL = { Signed: 'pill-green', 'Under Review': 'pill-amber', Draft: 'pill-blue' };

export function Icon({ children }) { return <span aria-hidden="true" style={{ width: 18, display: 'inline-grid', placeItems: 'center', fontSize: 15 }}>{children}</span>; }
export function Progress({ value, color = '#0d9488' }) { return <div className="progress"><span style={{ width: Math.min(100, Math.max(0, value)) + '%', background: color }} /></div>; }

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={'modal card' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex justify-between items-center mb-5"><div className="section-title">{title}</div><button className="btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, span, hint }) {
  return <label className={'field' + (span ? ' span-2' : '')}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

// Controlled form helper: bind(key) wires an input to form state; numbers stay numbers.
export const binder = (form, setForm) => (key, kind = 'text') => ({
  value: form[key] ?? '',
  onChange: e => setForm(f => ({ ...f, [key]: kind === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : kind === 'check' ? e.target.checked : e.target.value })),
  ...(kind === 'check' && { checked: !!form[key], value: undefined }),
  ...(kind === 'number' && { type: 'number', min: 0, step: 'any' }),
});

export function FormActions({ onCancel, submitLabel, error }) {
  return (
    <div className="span-2 flex items-center justify-end gap-2 mt-2">
      {error && <span className="text-xs text-[#c15752] mr-auto" role="alert">{error}</span>}
      <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      <button type="submit" className="btn primary">{submitLabel}</button>
    </div>
  );
}
