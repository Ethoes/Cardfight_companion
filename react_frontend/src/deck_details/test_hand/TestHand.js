// ...existing imports...
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './TestHand.css';

const FIELD_ZONES = [
  { id: 'rg1', label: 'Rear-Guard 1' },
  { id: 'vanguard', label: 'Vanguard' },
  { id: 'rg2', label: 'Rear-Guard 2' },
  { id: 'rg3', label: 'Rear-Guard 3' },
  { id: 'rg4', label: 'Rear-Guard 4' },
  { id: 'rg5', label: 'Rear-Guard 5' },
];

function TestHand() {
  const location = useLocation();
  const { deck, cards } = location.state || {};

  const filteredCards = deck && deck.format === 'Premium'
    ? (cards || []).filter((card) => card.type !== 'G Unit')
    : (cards || []);
  const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);

  const [hand, setHand] = useState(shuffledCards.slice(0, 5));
  const [deckStack, setDeckStack] = useState(shuffledCards.slice(5));
  // Vanguard is now a stack (array)
  const [field, setField] = useState({
    rg1: null,
    vanguard: [],
    rg2: null,
    rg3: null,
    rg4: null,
    rg5: null,
  });
  const [drop, setDrop] = useState([]); // Drop pile (stack)
  const [damage, setDamage] = useState([]); // Damage zone
  const [faceDownDamage, setFaceDownDamage] = useState([]); // Indices of face-down cards
  const [showDrop, setShowDrop] = useState(false); // For viewing drop pile
  const [showVanguard, setShowVanguard] = useState(false); // For viewing vanguard pile
  const [dragged, setDragged] = useState(null);
  const [showDeckMenu, setShowDeckMenu] = useState(false);
  const [deckMenuPos, setDeckMenuPos] = useState({ x: 0, y: 0 });
  const [showDeckTopX, setShowDeckTopX] = useState(false);
  const [deckTopX, setDeckTopX] = useState(1);
  const [showFullDeck, setShowFullDeck] = useState(false);
  const [rotatedField, setRotatedField] = useState({}); // { zoneId: degrees }

  React.useEffect(() => {
    const hideMenu = () => setShowDeckMenu(false);
    if (showDeckMenu) {
      window.addEventListener('click', hideMenu);
      return () => window.removeEventListener('click', hideMenu);
    }
  }, [showDeckMenu]);

  if (!deck || !cards) {
    return <p>No deck selected for testing.</p>;
  }

  // Drag from hand
  const onHandDragStart = (index) => setDragged({ from: 'hand', index });
  // Drag from field
  const onFieldDragStart = (zoneId) => {
    if (zoneId === 'vanguard') {
      setDragged({ from: 'vanguard', index: field.vanguard.length - 1 });
    } else {
      setDragged({ from: 'field', zoneId });
    }
  };
  // Drag from drop
  const onDropPileDragStart = (index) => setDragged({ from: 'drop', index });
  // Drag from vanguard pile
  const onVanguardPileDragStart = (index) => setDragged({ from: 'vanguard', index });
  // Drag from damage
  const onDamageDragStart = (index) => setDragged({ from: 'damage', index });

  // Drop on field
const onFieldDrop = (zoneId) => {
  if (!dragged) return;
  if (zoneId === 'vanguard') {
    if (dragged.from === 'hand') {
      setField({ ...field, vanguard: [...field.vanguard, hand[dragged.index]] });
      setHand(hand.filter((_, idx) => idx !== dragged.index));
    }
    if (dragged.from === 'drop') {
      setField({ ...field, vanguard: [...field.vanguard, drop[dragged.index]] });
      setDrop(drop.filter((_, idx) => idx !== dragged.index));
    }
    if (dragged.from === 'damage') {
      setField({ ...field, vanguard: [...field.vanguard, damage[dragged.index]] });
      setDamage(damage.filter((_, idx) => idx !== dragged.index));
    }
    if (dragged.from === 'field' && dragged.zoneId !== 'vanguard') {
      // Move from a rear-guard to vanguard stack
      if (field[dragged.zoneId]) {
        setField({
          ...field,
          vanguard: [...field.vanguard, field[dragged.zoneId]],
          [dragged.zoneId]: null,
        });
      }
    }
    if (dragged.from === 'vanguard' && typeof dragged.index === 'number') {
      // Move from vanguard pile to top of vanguard pile (reorder)
      const card = field.vanguard[dragged.index];
      const newVanguard = field.vanguard.filter((_, idx) => idx !== dragged.index);
      setField({ ...field, vanguard: [...newVanguard, card] });
    }
  } else {
    // Allow moving from field to field (rear-guard to rear-guard)
    if (dragged.from === 'field' && dragged.zoneId !== zoneId && field[dragged.zoneId] && !field[zoneId]) {
      setField({
        ...field,
        [zoneId]: field[dragged.zoneId],
        [dragged.zoneId]: null,
      });
      // Reset rotation for the source zone
      setRotatedField(prev => {
        const updated = { ...prev };
        delete updated[dragged.zoneId];
        return updated;
      });
    }
    if (dragged.from === 'vanguard' && typeof dragged.index === 'number' && !field[zoneId]) {
      setField({
        ...field,
        [zoneId]: field.vanguard[dragged.index],
        vanguard: field.vanguard.filter((_, idx) => idx !== dragged.index),
      });
    }
    if (dragged.from === 'hand' && !field[zoneId]) {
      setField({ ...field, [zoneId]: hand[dragged.index] });
      setHand(hand.filter((_, idx) => idx !== dragged.index));
    }
    if (dragged.from === 'drop' && !field[zoneId]) {
      setField({ ...field, [zoneId]: drop[dragged.index] });
      setDrop(drop.filter((_, idx) => idx !== dragged.index));
    }
    if (dragged.from === 'damage' && !field[zoneId]) {
      setField({ ...field, [zoneId]: damage[dragged.index] });
      setDamage(damage.filter((_, idx) => idx !== dragged.index));
    }
    // New: Allow moving from fullDeck to field
    if (dragged.from === 'fullDeck' && !field[zoneId]) {
      setField({ ...field, [zoneId]: deckStack[dragged.index] });
      setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
      setShowFullDeck(false);
    }
  }
  setDragged(null);
};

// Drop on hand
const onHandDrop = () => {
  if (!dragged) return;
  // From field to hand
  if (dragged.from === 'field' && dragged.zoneId && field[dragged.zoneId]) {
    setHand([...hand, field[dragged.zoneId]]);
    setField({ ...field, [dragged.zoneId]: null });
  }
  // From vanguard stack to hand
  if (dragged.from === 'vanguard' && typeof dragged.index === 'number') {
    setHand([...hand, field.vanguard[dragged.index]]);
    setField({ ...field, vanguard: field.vanguard.filter((_, idx) => idx !== dragged.index) });
  }
  // From drop to hand
  if (dragged.from === 'drop' && typeof dragged.index === 'number') {
    setHand([...hand, drop[dragged.index]]);
    setDrop(drop.filter((_, idx) => idx !== dragged.index));
  }
  // From damage to hand
  if (dragged.from === 'damage' && typeof dragged.index === 'number') {
    setHand([...hand, damage[dragged.index]]);
    setDamage(damage.filter((_, idx) => idx !== dragged.index));
  }
  // From deckTopX
  if (dragged.from === 'deckTopX') {
    setHand([...hand, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowDeckTopX(false);
  }
  // New: From fullDeck to hand
  if (dragged.from === 'fullDeck') {
    setHand([...hand, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowFullDeck(false);
  }
};

const onDamageCardRightClick = (e, idx) => {
  e.preventDefault();
  setFaceDownDamage((prev) =>
    prev.includes(idx)
      ? prev.filter((i) => i !== idx)
      : [...prev, idx]
  );
};

// Drop on drop pile
const onDropDrop = () => {
  if (!dragged) return;
  // ...existing logic...
    if (dragged.from === 'hand' && typeof dragged.index === 'number') {
    setDrop([...drop, hand[dragged.index]]);
    setHand(hand.filter((_, idx) => idx !== dragged.index));
  }
  if (dragged.from === 'vanguard' && typeof dragged.index === 'number') {
    setDrop([...drop, field.vanguard[dragged.index]]);
    setField({ ...field, vanguard: field.vanguard.filter((_, idx) => idx !== dragged.index) });
  }
  if (dragged.from === 'field' && dragged.zoneId && field[dragged.zoneId]) {
    setDrop([...drop, field[dragged.zoneId]]);
    setField({ ...field, [dragged.zoneId]: null });
  }
  if (dragged.from === 'damage' && typeof dragged.index === 'number') {
    setDrop([...drop, damage[dragged.index]]);
    setDamage(damage.filter((_, idx) => idx !== dragged.index));
  }
  // From deckTopX
  if (dragged.from === 'deckTopX') {
    setDrop([...drop, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowDeckTopX(false);
  }
  // New: From fullDeck to drop
  if (dragged.from === 'fullDeck') {
    setDrop([...drop, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowFullDeck(false);
  }
  setDragged(null);
};

const onDamageDrop = () => {
  if (!dragged) return;
  // From hand to damage
  if (dragged.from === 'hand' && typeof dragged.index === 'number') {
    setDamage([...damage, hand[dragged.index]]);
    setHand(hand.filter((_, idx) => idx !== dragged.index));
  }
  // From field to damage
  if (dragged.from === 'field' && dragged.zoneId && field[dragged.zoneId]) {
    setDamage([...damage, field[dragged.zoneId]]);
    setField({ ...field, [dragged.zoneId]: null });
  }
  // From vanguard stack to damage
  if (dragged.from === 'vanguard' && typeof dragged.index === 'number') {
    setDamage([...damage, field.vanguard[dragged.index]]);
    setField({ ...field, vanguard: field.vanguard.filter((_, idx) => idx !== dragged.index) });
  }
  // From drop to damage
  if (dragged.from === 'drop' && typeof dragged.index === 'number') {
    setDamage([...damage, drop[dragged.index]]);
    setDrop(drop.filter((_, idx) => idx !== dragged.index));
  }
  // From deckTopX
  if (dragged.from === 'deckTopX') {
    setDamage([...damage, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowDeckTopX(false);
  }
  // New: From fullDeck to damage
  if (dragged.from === 'fullDeck') {
    setDamage([...damage, deckStack[dragged.index]]);
    setDeckStack(deckStack.filter((_, idx) => idx !== dragged.index));
    setShowFullDeck(false);
  }
  setDragged(null);
};

  // Draw a card from the deckStack to hand
  const drawCard = () => {
    if (deckStack.length === 0) return;
    setHand([...hand, deckStack[0]]);
    setDeckStack(deckStack.slice(1));
  };

  const onFieldCardRightClick = (e, zoneId) => {
  e.preventDefault();
  setRotatedField(prev => {
    const current = prev[zoneId] || 0;
    // If not rotated, rotate 90deg right. If rotated, rotate back to 0.
    return {
      ...prev,
      [zoneId]: current === 0 ? 90 : 0
    };
  });
};

  return (
    <div className="TestHand-container" style={{ display: 'flex', alignItems: 'flex-start' }}>
      {/* Damage Zone on the left */}
      <div
        className="DamageZone"
        onDragOver={e => e.preventDefault()}
        onDrop={onDamageDrop}
        style={{
          minWidth: 120,
          minHeight: 400,
          background: '#f8d7da',
          border: '2px solid #b71c1c',
          borderRadius: 12,
          marginRight: 24,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        title="Damage Zone"
      >
        <div style={{ fontWeight: 'bold', fontSize: 18, color: '#b71c1c', marginBottom: 8 }}>
          Damage ({damage.length})
        </div>
        {damage.length === 0 && <div style={{ color: '#b71c1c', fontSize: 14 }}>Empty</div>}
        {damage.map((card, idx) => (
          <div
            key={idx}
            style={{ width: 90, marginBottom: -20, cursor: 'grab' }}
            draggable
            onDragStart={() => onDamageDragStart(idx)}
            onContextMenu={(e) => onDamageCardRightClick(e, idx)}
            title="Drag to hand, field, or drop. Right-click to turn face down/up."
          >
            {faceDownDamage.includes(idx) ? (
              <div
                style={{
                  width: '100%',
                  height: 126, // match image aspect ratio
                  borderRadius: 8,
                  background: '#111',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transform: 'rotate(-90deg)', // <-- keep rotated
                  transition: 'transform 0.2s',
                }}
              />
            ) : (
              <img
                src={`data:image/jpeg;base64,${card.image}`}
                alt={card.name || 'Card'}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transform: 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            )}
          </div>
        ))}
      </div>
      {/* Main play area */}
      <div style={{ flex: 1 }}>
        <h2 className="TestHand-title">Test Hand for {deck.name}</h2>
        <div className="VanguardField">
          {/* Top row: 3 zones + deck stack */}
          {FIELD_ZONES.slice(0, 3).map((zone) =>
            zone.id === 'vanguard' ? (
              <div
                key={zone.id}
                className="VanguardField-zone VanguardField-vanguard"
                onDragOver={e => e.preventDefault()}
                onDrop={() => onFieldDrop('vanguard')}
                style={{ cursor: 'pointer', position: 'relative' }}
                title="Click to view Vanguard pile"
                onClick={() => setShowVanguard(true)}
              >
                <div className="VanguardField-label">{zone.label}</div>
                {field.vanguard.length > 0 ? (
                  <img
                    src={`data:image/jpeg;base64,${field.vanguard[field.vanguard.length - 1].image}`}
                    alt={field.vanguard[field.vanguard.length - 1].name || 'Card'}
                    className="VanguardField-card"
                    draggable
                    onDragStart={() => onVanguardPileDragStart(field.vanguard.length - 1)}
                    onContextMenu={e => onFieldCardRightClick(e, 'vanguard')}
                    style={{
                      transform: `rotate(${rotatedField['vanguard'] || 0}deg)`,
                      transition: 'transform 0.2s',
                    }}
                  />
                ) : (
                  <div className="VanguardField-empty">Empty</div>
                )}
                {field.vanguard.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: '#fff',
                    color: '#1976d2',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 18,
                    border: '2px solid #1976d2'
                  }}>
                    {field.vanguard.length}
                  </div>
                )}
              </div>
            ) : (
              <div
                key={zone.id}
                className="VanguardField-zone"
                onDragOver={e => e.preventDefault()}
                onDrop={() => onFieldDrop(zone.id)}
              >
                <div className="VanguardField-label">{zone.label}</div>
                {field[zone.id] ? (
                  <img
                    src={`data:image/jpeg;base64,${field[zone.id].image}`}
                    alt={field[zone.id].name || 'Card'}
                    className="VanguardField-card"
                    draggable
                    onDragStart={() => onFieldDragStart(zone.id)}
                    onContextMenu={e => onFieldCardRightClick(e, zone.id)}
                    style={{
                      transform: `rotate(${rotatedField[zone.id] || 0}deg)`,
                      transition: 'transform 0.2s',
                    }}
                  />
                ) : (
                  <div className="VanguardField-empty">Empty</div>
                )}
              </div>
            )
          )}
          {/* Deck stack in the top row, last column */}
          <div
            className="VanguardField-zone VanguardField-deckstack"
            onClick={drawCard}
            onContextMenu={e => {
              e.preventDefault();
              setShowDeckMenu(true);
              setDeckMenuPos({ x: e.clientX, y: e.clientY });
            }}
            style={{
              cursor: deckStack.length > 0 ? 'pointer' : 'not-allowed',
              background: '#1976d2',
              color: '#fff',
              border: '2px solid #1976d2',
              position: 'relative'
            }}
            title={deckStack.length > 0 ? 'Click to draw a card' : 'Deck is empty'}
          >
            <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>
              Deck
            </div>
            <div style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: '#fff',
              color: '#1976d2',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18,
              border: '2px solid #1976d2'
            }}>
              {deckStack.length}
            </div>
          </div>
          {/* Bottom row: 3 zones + drop zone */}
          {FIELD_ZONES.slice(3).map((zone) => (
            <div
              key={zone.id}
              className="VanguardField-zone"
              onDragOver={e => e.preventDefault()}
              onDrop={() => onFieldDrop(zone.id)}
            >
              <div className="VanguardField-label">{zone.label}</div>
              {field[zone.id] ? (
                <img
                  src={`data:image/jpeg;base64,${field[zone.id].image}`}
                  alt={field[zone.id].name || 'Card'}
                  className="VanguardField-card"
                  draggable
                  onDragStart={() => onFieldDragStart(zone.id)}
                  onContextMenu={e => onFieldCardRightClick(e, zone.id)}
                  style={{
                    transform: `rotate(${rotatedField[zone.id] || 0}deg)`,
                    transition: 'transform 0.2s',
                  }}
                />
              ) : (
                <div className="VanguardField-empty">Empty</div>
              )}
            </div>
          ))}
          {/* Drop zone in bottom row, last column */}
          <div
            className="VanguardField-zone VanguardField-drop"
            onDragOver={e => e.preventDefault()}
            onDrop={onDropDrop}
            style={{
              background: '#bdbdbd',
              color: '#333',
              border: '2px solid #757575',
              position: 'relative',
              cursor: drop.length > 0 ? 'pointer' : 'default'
            }}
            title="Drop Zone"
            onClick={() => setShowDrop(true)}
          >
            <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>
              Drop
            </div>
            {drop.length > 0 && (
              <img
                src={`data:image/jpeg;base64,${drop[drop.length - 1].image}`}
                alt={drop[drop.length - 1].name || 'Card'}
                className="VanguardField-card"
                style={{ marginBottom: 8 }}
                draggable
                onDragStart={() => onDropPileDragStart(drop.length - 1)}
              />
            )}
            <div style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: '#fff',
              color: '#757575',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 18,
              border: '2px solid #757575'
            }}>
              {drop.length}
            </div>
          </div>
        </div>
        {/* Hand */}
        <div
          className="TestHand-bottom-bar"
          onDragOver={e => e.preventDefault()}
          onDrop={onHandDrop}
        >
          {hand.map((card, index) => (
            <div
              key={index}
              className="TestHand-card"
              draggable
              onDragStart={() => onHandDragStart(index)}
              title="Drag to field"
            >
              <img
                src={`data:image/jpeg;base64,${card.image}`}
                alt={card.name || 'Card Image'}
                className="TestHand-card-image"
              />
            </div>
          ))}
        </div>
      </div>
      {/* Vanguard pile modal */}
      {showVanguard && (
        <div className="modal-overlay" onClick={() => setShowVanguard(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <button className="modal-close" onClick={() => setShowVanguard(false)}>X</button>
            <h3>Vanguard Pile ({field.vanguard.length})</h3>
            <div style={{ display: 'flex', gap: 32, marginBottom: 92, justifyContent: 'center' }}>
              {field.vanguard.length === 0 && <div>No cards in vanguard pile.</div>}
              {field.vanguard.map((card, idx) => (
                <div
                  key={idx}
                  style={{ width: 100, cursor: 'grab' }}
                  draggable
                  onDragStart={() => onVanguardPileDragStart(idx)}
                  title="Drag to hand, field, or drop"
                >
                  <img
                    src={`data:image/jpeg;base64,${card.image}`}
                    alt={card.name || 'Card'}
                    style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  />
                  <div style={{ color: '#333', fontSize: 12, textAlign: 'center' }}>{card.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Drop pile modal */}
      {showDrop && (
        <div className="modal-overlay" onClick={() => setShowDrop(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <button className="modal-close" onClick={() => setShowDrop(false)}>X</button>
            <h3>Drop Pile ({drop.length})</h3>
            <div style={{ display: 'flex', gap: 92, marginBottom: 32, justifyContent: 'center' }}>
              {drop.length === 0 && <div>No cards in drop.</div>}
              {drop.map((card, idx) => (
                <div
                  key={idx}
                  style={{ width: 100, cursor: 'grab' }}
                  draggable
                  onDragStart={() => onDropPileDragStart(idx)}
                  title="Drag to hand or field"
                >
                  <img
                    src={`data:image/jpeg;base64,${card.image}`}
                    alt={card.name || 'Card'}
                    style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  />
                  <div style={{ color: '#333', fontSize: 12, textAlign: 'center' }}>{card.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showDeckMenu && (
  <div
    style={{
      position: 'fixed',
      top: deckMenuPos.y,
      left: deckMenuPos.x,
      background: '#fff',
      border: '1px solid #1976d2',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 2000,
      minWidth: 180,
      padding: 8
    }}
    onClick={e => e.stopPropagation()}
    onContextMenu={e => e.preventDefault()}
  >
    <div
      style={{ padding: 8, cursor: 'pointer' }}
      onClick={() => {
        setShowDeckMenu(false);
        setShowDeckTopX(true);
      }}
    >
      Check top X cards
    </div>
    <div
      style={{ padding: 8, cursor: 'pointer' }}
      onClick={() => {
        setShowDeckMenu(false);
        setShowFullDeck(true);
      }}
    >
      Look at whole deck
    </div>
    <div
      style={{ padding: 8, cursor: 'pointer' }}
      onClick={() => {
        setShowDeckMenu(false);
        if (deckStack.length > 0) {
          setField(f => ({
            ...f,
            vanguard: [deckStack[0], ...f.vanguard]
          }));
          setDeckStack(ds => ds.slice(1));
        }
      }}
    >
      Put top card to top of Vanguard pile
    </div>
    <div
      style={{ padding: 8, cursor: 'pointer' }}
      onClick={() => {
        setShowDeckMenu(false);
        setDeckStack(ds => [...ds].sort(() => Math.random() - 0.5));
      }}
    >
      Shuffle
    </div>
    <div
      style={{ padding: 8, cursor: 'pointer', color: '#b71c1c' }}
      onClick={() => setShowDeckMenu(false)}
    >
      Cancel
    </div>
  </div>
)}
{showDeckTopX && (
  <div className="modal-overlay" onClick={() => setShowDeckTopX(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
      <button className="modal-close" onClick={() => setShowDeckTopX(false)}>X</button>
      <h3>Top X Cards</h3>
      <input
        type="number"
        min={1}
        max={deckStack.length}
        value={deckTopX}
        onChange={e => setDeckTopX(Number(e.target.value))}
        style={{ width: 60, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 92, marginBottom: 32, justifyContent: 'center' }}>
        {deckStack.slice(0, deckTopX).map((card, idx) => (
          <div
            key={idx}
            style={{ width: 100, cursor: 'grab' }}
            draggable
            onDragStart={() => setDragged({ from: 'deckTopX', index: idx })}
            title="Drag to hand, field, drop, or damage"
          >
            <img
              src={`data:image/jpeg;base64,${card.image}`}
              alt={card.name || 'Card'}
              style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            />
            <div style={{ color: '#333', fontSize: 12, textAlign: 'center' }}>{card.name}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{showFullDeck && (
  <div className="modal-overlay" onClick={() => setShowFullDeck(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
      <button className="modal-close" onClick={() => setShowFullDeck(false)}>X</button>
      <h3>Full Deck ({deckStack.length})</h3>
      <div style={{ display: 'flex', gap: 92, marginBottom: 32, justifyContent: 'center' }}>
        {deckStack.map((card, idx) => (
          <div
            key={idx}
            style={{ width: 100, cursor: 'grab' }}
            draggable
            onDragStart={() => setDragged({ from: 'fullDeck', index: idx })}
            title="Drag to hand, field, drop, or damage"
          >
            <img
              src={`data:image/jpeg;base64,${card.image}`}
              alt={card.name || 'Card'}
              style={{ width: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            />
            <div style={{ color: '#333', fontSize: 12, textAlign: 'center' }}>{card.name}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default TestHand;