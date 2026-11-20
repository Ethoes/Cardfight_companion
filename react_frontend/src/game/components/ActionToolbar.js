import React from 'react';

/**
 * Renders groups of buttons from a plain config:
 *   [{ label: 'Deck', actions: [{ label, onClick, disabled, title, tone }] }]
 * Pages decide which actions exist; the toolbar only handles presentation.
 */
export default function ActionToolbar({ groups, className = '' }) {
  return (
    <div className={`vg-toolbar ${className}`} role="toolbar">
      {groups.map((group) => (
        <div className="vg-toolbar__group" key={group.label} role="group" aria-label={group.label}>
          <span className="vg-toolbar__label">{group.label}</span>
          <div className="vg-toolbar__buttons">
            {group.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`vg-btn ${a.tone ? `vg-btn--${a.tone}` : ''}`}
                onClick={a.onClick}
                disabled={a.disabled}
                title={a.title}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
