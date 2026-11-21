import React from 'react';
import { CardFace } from './GameCard';

const STATS = [
  ['grade', 'Grade'],
  ['power', 'Power'],
  ['shield', 'Shield'],
  ['critical', 'Critical'],
  ['skill', 'Skill'],
  ['gift', 'Trigger'],
];

/** Enlarged card with its stats and effect text. */
export default function CardPreview({ card, compact = false, emptyText = 'Hover or tap a card to see its details.' }) {
  if (!card) {
    return <div className="vg-preview vg-preview--empty"><p>{emptyText}</p></div>;
  }
  const meta = [card.type, card.nation || card.clan, card.race].filter(Boolean).join(' · ');
  return (
    <div className={`vg-preview ${compact ? 'vg-preview--compact' : ''}`}>
      <div className="vg-preview__image"><CardFace card={card} /></div>
      <div className="vg-preview__text">
        <h3 className="vg-preview__name">{card.name}</h3>
        {meta && <p className="vg-preview__meta">{meta}</p>}
        <dl className="vg-preview__stats">
          {STATS.map(([key, label]) => (card[key] !== null && card[key] !== undefined && card[key] !== '' ? (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{String(card[key]).replace(/^Grade\s*/i, '')}</dd>
            </div>
          ) : null))}
        </dl>
        {card.effect && <p className="vg-preview__effect">{card.effect}</p>}
      </div>
    </div>
  );
}
