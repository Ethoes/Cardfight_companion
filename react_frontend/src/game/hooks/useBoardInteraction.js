import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ZONE, actions, isCircle } from '../engine';

/**
 * Selection / drag-and-drop state for the board.
 *
 * Works with both mouse and touch:
 *  - drag a card onto a zone (desktop), or
 *  - tap a card to select it, then tap a zone (or use the action bar).
 *
 * Every move goes through `dispatchFor(playerId)` so the same hook works for
 * one board (test hand) or several boards (player vs player).
 */
export const BoardInteractionContext = createContext(null);

export const useInteraction = () => useContext(BoardInteractionContext);

const TARGET_ON_CARD_CLICK = (zone) => isCircle(zone) || zone === ZONE.GUARDIAN;

export default function useBoardInteraction({
  dispatchFor,
  interactivePlayers = [],
  interceptCardClick,
  markedUids = [],
}) {
  const [selection, setSelection] = useState(null); // { playerId, uid, zone }
  const [dragging, setDragging] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);

  const pending = dragging || selection;

  const clearSelection = useCallback(() => setSelection(null), []);

  const isInteractive = useCallback(
    (playerId) => interactivePlayers.includes(playerId),
    [interactivePlayers],
  );

  /** Dispatch any player action, but only for boards this client controls. */
  const act = useCallback((playerId, action) => {
    if (interactivePlayers.includes(playerId)) dispatchFor(playerId)(action);
  }, [dispatchFor, interactivePlayers]);

  const moveSource = useCallback((source, playerId, zone, options) => {
    if (!source || source.playerId !== playerId) return false;
    dispatchFor(playerId)(actions.moveCard(source.uid, zone, options));
    return true;
  }, [dispatchFor]);

  /** Place the pending (dragged or selected) card into a zone. */
  const placeInto = useCallback((playerId, zone, options = {}) => {
    const moved = moveSource(pending, playerId, zone, options);
    setDragging(null);
    if (moved) setSelection(null);
    return moved;
  }, [moveSource, pending]);

  const onCardClick = useCallback((playerId, instance, zone, e) => {
    e?.stopPropagation();
    if (interceptCardClick?.(playerId, instance, zone)) return;
    if (!isInteractive(playerId)) {
      setPreviewCard(instance.faceDown ? null : instance.card);
      return;
    }
    if (selection?.uid === instance.uid) {
      setSelection(null);
      return;
    }
    if (selection && selection.playerId === playerId && selection.zone !== zone && TARGET_ON_CARD_CLICK(zone)) {
      placeInto(playerId, zone);
      return;
    }
    setSelection({ playerId, uid: instance.uid, zone });
    if (!instance.faceDown || zone === ZONE.DAMAGE) setPreviewCard(instance.card);
  }, [interceptCardClick, isInteractive, placeInto, selection]);

  const onCardContextMenu = useCallback((playerId, instance, zone, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInteractive(playerId)) return;
    const dispatch = dispatchFor(playerId);
    if (isCircle(zone) || zone === ZONE.GUARDIAN) dispatch(actions.toggleRest(instance.uid));
    else if (zone === ZONE.DAMAGE) dispatch(actions.toggleFaceDown(instance.uid));
  }, [dispatchFor, isInteractive]);

  const onCardDragStart = useCallback((playerId, instance, zone, e) => {
    if (!isInteractive(playerId)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', instance.uid); // required by Firefox
    setDragging({ playerId, uid: instance.uid, zone });
  }, [isInteractive]);

  const onDragEnd = useCallback(() => setDragging(null), []);

  const onCardHover = useCallback((instance) => {
    if (instance && !instance.faceDown) setPreviewCard(instance.card);
  }, []);

  // Escape clears the selection.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelection(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const markedSet = useMemo(() => new Set(markedUids), [markedUids]);

  return useMemo(() => ({
    selection,
    dragging,
    pending,
    previewCard,
    markedUids: markedSet,
    setPreviewCard,
    setSelection,
    clearSelection,
    isInteractive,
    act,
    placeInto,
    onCardClick,
    onCardContextMenu,
    onCardDragStart,
    onDragEnd,
    onCardHover,
  }), [selection, dragging, pending, previewCard, markedSet, clearSelection, isInteractive, act,
    placeInto, onCardClick, onCardContextMenu, onCardDragStart, onDragEnd, onCardHover]);
}
