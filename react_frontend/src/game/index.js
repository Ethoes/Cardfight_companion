// Reusable Cardfight!! Vanguard table: engine (pure state + rules helpers),
// hooks (local state, selection / drag & drop) and presentational components.
//
//  engine/      – no React. Reducers + action creators; safe to run on a
//                 server or replay from a network log.
//  hooks/       – useGame (state + undo), useBoardInteraction (select/drag)
//  components/  – PlayerBoard, Hand, PileViewer, CardActionBar, …
import './components/game.css';

export * from './engine';
export { default as useGame } from './hooks/useGame';
export { default as useCheckResolver } from './hooks/useCheckResolver';
export { default as useBoardInteraction, BoardInteractionContext, useInteraction } from './hooks/useBoardInteraction';
export { default as GameCard, CardBack, CardFace } from './components/GameCard';
export { default as DropTarget } from './components/DropTarget';
export { Circle, Pile, DamageZone, CardRow, Hand, CountBadge } from './components/Zones';
export { default as PlayerBoard } from './components/PlayerBoard';
export { default as PileViewer } from './components/PileViewer';
export { default as CardPreview } from './components/CardPreview';
export { default as CardActionBar } from './components/CardActionBar';
export { default as TurnTracker } from './components/TurnTracker';
export { default as ActionToolbar } from './components/ActionToolbar';
export { Modal, ContextMenu } from './components/Overlays';
