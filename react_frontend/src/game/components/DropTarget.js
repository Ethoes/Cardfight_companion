import React, { useState } from 'react';
import { useInteraction } from '../hooks/useBoardInteraction';

/**
 * Generic zone wrapper: accepts dragged cards, and when a card is selected a
 * click/tap on the zone moves it here. Otherwise `onActivate` is called
 * (e.g. draw from deck, open the drop zone viewer).
 */
export default function DropTarget({
  playerId,
  zone,
  position = 'top',
  onActivate,
  onContextMenu,
  className = '',
  children,
  label,
  title,
  as: Tag = 'div',
  disabled = false,
  style,
}) {
  const ctx = useInteraction();
  const [over, setOver] = useState(false);
  const interactive = !disabled && ctx?.isInteractive(playerId);
  const pending = ctx?.pending;
  const isTarget = interactive && pending && pending.playerId === playerId && pending.zone !== zone;

  const classes = [
    'vg-zone',
    className,
    isTarget ? 'is-target' : '',
    over ? 'is-over' : '',
    onActivate && interactive ? 'is-clickable' : '',
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!interactive) return;
    if (isTarget) {
      e.stopPropagation();
      ctx.placeInto(playerId, zone, { position });
      return;
    }
    onActivate?.(e);
  };

  return (
    <Tag
      className={classes}
      style={style}
      aria-label={label}
      title={title}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onDragOver={interactive ? (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; if (!over) setOver(true); } : undefined}
      onDragLeave={interactive ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); } : undefined}
      onDrop={interactive ? (e) => { e.preventDefault(); e.stopPropagation(); setOver(false); ctx.placeInto(playerId, zone, { position }); } : undefined}
    >
      {children}
    </Tag>
  );
}
