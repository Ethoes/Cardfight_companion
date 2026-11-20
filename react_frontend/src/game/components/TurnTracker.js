import React from 'react';
import { PHASE_LABEL, PHASE_ORDER } from '../engine';

/** Turn counter + phase stepper (Stand → Draw → Ride → Main → Battle → End). */
export default function TurnTracker({ turn, activePlayerName, onNextPhase, onSetPhase, autoPhase, onToggleAuto }) {
  return (
    <div className="vg-turn">
      <div className="vg-turn__count">
        <span className="vg-turn__label">Turn</span>
        <strong>{turn.number}</strong>
        {activePlayerName && <span className="vg-turn__player">{activePlayerName}</span>}
      </div>
      <ol className="vg-turn__phases">
        {PHASE_ORDER.map((phase) => (
          <li key={phase}>
            <button
              type="button"
              className={`vg-phase ${phase === turn.phase ? 'is-active' : ''}`}
              onClick={() => onSetPhase?.(phase)}
              aria-current={phase === turn.phase ? 'step' : undefined}
            >
              {PHASE_LABEL[phase]}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="vg-btn vg-btn--primary" onClick={onNextPhase}>
        {turn.phase === PHASE_ORDER[PHASE_ORDER.length - 1] ? 'End turn' : 'Next phase'}
      </button>
      {onToggleAuto && (
        <label className="vg-check" title="Stand all units at the start of the stand phase and draw a card in the draw phase">
          <input type="checkbox" checked={autoPhase} onChange={(e) => onToggleAuto(e.target.checked)} />
          Auto stand &amp; draw
        </label>
      )}
    </div>
  );
}
