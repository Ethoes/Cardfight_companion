import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Non-blocking panel: the backdrop lets drag events through so cards can be
 * dragged out of the panel onto the board behind it.
 */
export function Modal({ title, subtitle, onClose, children, actions, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="vg-modal-backdrop">
      <div className={`vg-modal vg-modal--${size}`} role="dialog" aria-modal="false" aria-label={title}>
        <header className="vg-modal__header">
          <div>
            <h3 className="vg-modal__title">{title}</h3>
            {subtitle && <p className="vg-modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="vg-icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="vg-modal__body">{children}</div>
        {actions && <footer className="vg-modal__footer">{actions}</footer>}
      </div>
    </div>
  );
}

/** Right-click menu, kept inside the viewport. */
export function ContextMenu({ x, y, items, onClose, title }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(x, innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(y, innerHeight - rect.height - 8)),
    });
  }, [x, y]);

  useEffect(() => {
    const close = () => onClose();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('click', close);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="vg-menu"
      style={pos}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {title && <div className="vg-menu__title">{title}</div>}
      {items.map((item) => (item.divider ? (
        <div key={item.key} className="vg-menu__divider" />
      ) : (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="vg-menu__item"
          disabled={item.disabled}
          onClick={() => { onClose(); item.onSelect(); }}
        >
          <span>{item.label}</span>
          {item.hint && <span className="vg-menu__hint">{item.hint}</span>}
        </button>
      )))}
    </div>
  );
}
