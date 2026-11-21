import React from 'react';
import { zoneLabel } from '../engine';
import GameCard from './GameCard';
import { Modal } from './Overlays';

/**
 * Shows the cards of a zone, top card first. Cards can be dragged onto the
 * board, or tapped to select them and moved with the card action bar.
 */
export default function PileViewer({
  playerId,
  zone,
  cards,            // already ordered for display (top first)
  title,
  subtitle,
  onClose,
  headerControls,
  actions,
  emptyText = 'No cards here.',
}) {
  return (
    <Modal
      title={title ?? `${zoneLabel(zone)} (${cards.length})`}
      subtitle={subtitle ?? 'Drag a card onto the field, or tap it to choose where it goes.'}
      onClose={onClose}
      actions={actions}
      size="lg"
    >
      {headerControls && <div className="vg-viewer__controls">{headerControls}</div>}
      {cards.length === 0 ? (
        <p className="vg-viewer__empty">{emptyText}</p>
      ) : (
        <div className="vg-viewer__grid">
          {cards.map((c, i) => (
            <figure className="vg-viewer__item" key={c.uid}>
              <GameCard instance={{ ...c, rested: false, faceDown: false }} zone={zone} playerId={playerId} />
              <figcaption>
                {i === 0 && cards.length > 1 && <span className="vg-viewer__top">Top · </span>}
                {c.card?.name}
                {c.faceDown && <span className="vg-viewer__flag"> (face down)</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Modal>
  );
}
