import React, { useState, useEffect, useRef } from 'react';
import { Room } from './components/room/Room';
import { Chiquilin } from './components/chiquilin/Chiquilin';
import { DraggableItem } from './components/interactions/DraggableItem';
import { DraggableAccessory } from './components/accessories/DraggableAccessory';
import { Pomodoro } from './components/pomodoro/Pomodoro';
import { CHIQUILIN_STATES, REACTION_MESSAGES } from './data/chiquilinStates';
import { ITEMS, ACCESSORIES, DISPLAY, resolveAccessory } from './data/assetsMap';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLayout } from './hooks/useLayout';
import * as sounds from './audio/sounds';

const PASTEL_COLORS = [
  { id: 'cream', name: 'Crema Cálido', hex: '#FFF5E6' },
  { id: 'pink', name: 'Rosa Pastel', hex: '#FFECEC' },
  { id: 'lavender', name: 'Lila Suave', hex: '#F3E8FF' },
  { id: 'blue', name: 'Celeste Bebé', hex: '#E0F2FE' },
  { id: 'mint', name: 'Menta Verde', hex: '#E6F4EA' },
  { id: 'yellow', name: 'Amarillo Pastel', hex: '#FEF9C3' },
];

const EMPTY_POSITIONS = { churu: null, cana: null, cepillo: null };
// Mantiene un juguete suelto completamente dentro de la pantalla (pos = centro del ítem)
const clampToScreen = (pos, half) => ({
  ...pos,
  x: Math.min(Math.max(pos.x, half), window.innerWidth - half),
  y: Math.min(Math.max(pos.y, half), window.innerHeight - half),
});

const BTN = 44;
const TOOL_BUTTON =
  'ui-btn flex items-center justify-center rounded-2xl text-xl';
const PANEL_CLASS =
  'ui-card fixed z-40 select-none p-3 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin]';

export default function App() {
  const layout = useLayout();

  // Sonido: activado/silenciado (se recuerda entre visitas)
  const [soundOn, setSoundOn] = useState(() => !sounds.isMuted());
  const toggleSound = () => {
    const next = !soundOn;
    sounds.setMuted(!next);
    setSoundOn(next);
    if (next) sounds.play('pop');
  };

  // Desbloquea el audio (móviles) y precarga los sonidos en el primer toque
  useEffect(() => {
    const unlock = () => sounds.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  const [chiquilinState, setChiquilinState] = useState(CHIQUILIN_STATES.IDLE);
  const [message, setMessage] = useState('Chiquilín está contigo. ❤️️');
  const [isNight, setIsNight] = useState(false);

  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const [bgColor, setBgColor] = useLocalStorage('room_bg_color', '#FFF5E6');

  const [itemPositions, setItemPositions] = useState(EMPTY_POSITIONS);

  const [chasingOffset, setChasingOffset] = useState({ x: 0, y: 0 });
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const groomTimerRef = useRef(null);
  const [isDraggingAccessory, setIsDraggingAccessory] = useState(false);

  // Tamaño natural (sin escalar) de Chiquilín, para poder llevarlo a la altura de DISPLAY
  const chiquilinBoxRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = chiquilinBoxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setNatural({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    setNatural({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  const [selectedAccessories, setSelectedAccessories] = useLocalStorage('chiquilin_accessories', {
    head: null,
    neck: null,
  });

  useEffect(() => {
    const checkTime = () => {
      const hours = new Date().getHours();
      setIsNight(hours < 6 || hours >= 18);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Al cambiar el layout (rotar, redimensionar) los juguetes sueltos vuelven al área visible.
  useEffect(() => {
    setItemPositions((prev) => {
      let changed = false;
      const next = {};
      for (const [id, pos] of Object.entries(prev)) {
        if (pos) {
          const c = clampToScreen(pos, layout.half);
          if (c.x !== pos.x || c.y !== pos.y) changed = true;
          next[id] = c;
        } else {
          next[id] = pos;
        }
      }
      return changed ? next : prev;
    });
  }, [layout.w, layout.h, layout.half]);

  // Sonidos según el estado de Chiquilín (cubre clic, caricias, juguetes y Pomodoro)
  const prevStateRef = useRef(chiquilinState);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = chiquilinState;
    if (prev === chiquilinState) return;
    if (prev === CHIQUILIN_STATES.PETTING) sounds.stopLoop('purr');
    if (prev === CHIQUILIN_STATES.SLEEPING && chiquilinState === CHIQUILIN_STATES.IDLE) sounds.play('wake');
    switch (chiquilinState) {
      case CHIQUILIN_STATES.EATING:
        sounds.play('eat');
        break;
      case CHIQUILIN_STATES.HAPPY:
        sounds.play('meow');
        break;
      case CHIQUILIN_STATES.PETTING:
        sounds.startLoop('purr');
        break;
      case CHIQUILIN_STATES.SLEEPING:
        sounds.play('sleep');
        break;
      case CHIQUILIN_STATES.CHASING:
        sounds.play('chase');
        break;
      default:
        break;
    }
  }, [chiquilinState]);

  // Maullido espontáneo de vez en cuando si Chiquilín lleva un rato tranquilo
  useEffect(() => {
    if (chiquilinState !== CHIQUILIN_STATES.IDLE) return;
    const id = setTimeout(() => {
      if (!document.hidden && sounds.isUnlocked()) sounds.play('idle');
    }, 45000 + Math.random() * 60000);
    return () => clearTimeout(id);
  }, [chiquilinState]);

  const isSleeping = chiquilinState === CHIQUILIN_STATES.SLEEPING;

  const handleClick = () => {
    if (isSleeping) {
      sounds.play('snore');
      setMessage('Shhh... Chiquilín está durmiendo profundamente. 💤');
      return;
    }
    if (chiquilinState !== CHIQUILIN_STATES.IDLE) return;
    const messages = REACTION_MESSAGES.click;
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);
    setChiquilinState(CHIQUILIN_STATES.HAPPY);

    setTimeout(() => {
      setChiquilinState(CHIQUILIN_STATES.IDLE);
    }, 2000);
  };

  const handlePet = () => {
    if (isSleeping) {
      sounds.play('snore');
      setMessage('Shhh... Chiquilín está durmiendo profundamente. 💤');
      return;
    }
    if (chiquilinState !== CHIQUILIN_STATES.IDLE) return;
    setChiquilinState(CHIQUILIN_STATES.PETTING);
    const messages = REACTION_MESSAGES.pet;
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);

    setTimeout(() => {
      setChiquilinState(CHIQUILIN_STATES.IDLE);
    }, 3000);
  };

  const handleItemDropPosition = (itemId, pos) => {
    // Soltado sobre la barra de herramientas → vuelve a su lugar en la barra
    const bar = document.getElementById('sidebar-target');
    if (bar && ITEMS[itemId]) {
      const r = bar.getBoundingClientRect();
      const m = 8;
      if (pos.x >= r.left - m && pos.x <= r.right + m && pos.y >= r.top - m && pos.y <= r.bottom + m) {
        handleReturnItemToBar(ITEMS[itemId]);
        return;
      }
    }
    sounds.play('drop');
    setItemPositions((prev) => ({
      ...prev,
      [itemId]: clampToScreen(pos, layout.half),
    }));
  };

  const handleItemHover = (item, cursorData) => {
    if (isSleeping) return;

    if (item.type === 'groom' || item.id === 'cepillo') {
      if (cursorData?.isHovering) {
        sounds.startLoop('brush');
        if (chiquilinState !== CHIQUILIN_STATES.PETTING) {
          setChiquilinState(CHIQUILIN_STATES.PETTING);
          setMessage('A Chiquilín le encanta que lo cepilles suavemente. ✨');
        }

        if (groomTimerRef.current) clearTimeout(groomTimerRef.current);
        groomTimerRef.current = setTimeout(() => {
          sounds.stopLoop('brush');
          setChiquilinState(CHIQUILIN_STATES.HAPPY);
          setTimeout(() => setChiquilinState(CHIQUILIN_STATES.IDLE), 1500);
        }, 1200);
      }
    } else if (item.type === 'game' || item.id === 'cana') {
      setChiquilinState(CHIQUILIN_STATES.CHASING);
      setMessage('¡Chiquilín persigue la caña con la mirada! 🎣');

      const targetElement = document.getElementById('chiquilin-target');
      if (targetElement && cursorData) {
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = cursorData.x - centerX;
        const deltaY = cursorData.y - centerY;

        setFlipHorizontal(deltaX < 0);

        // El desplazamiento máximo se adapta al tamaño de la pantalla
        const maxOffset = Math.min(120, Math.min(window.innerWidth, window.innerHeight) * 0.18);
        const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.4));
        const clampedY = Math.max(-maxOffset, Math.min(maxOffset, deltaY * 0.4));

        setChasingOffset({ x: clampedX, y: clampedY });
      }
    }
  };

  const handleItemDrop = (item) => {
    if (isSleeping) {
      setMessage('Chiquilín está durmiendo. No puedes jugar con él ahora. 💤');
      return;
    }

    setChasingOffset({ x: 0, y: 0 });
    setFlipHorizontal(false);

    if (item.type === 'food') {
      setChiquilinState(CHIQUILIN_STATES.EATING);
      setMessage('¡Ñam ñam! A Chiquilín le encantó su Churu. 🍗');
      setTimeout(() => {
        setChiquilinState(CHIQUILIN_STATES.HAPPY);
        setTimeout(() => setChiquilinState(CHIQUILIN_STATES.IDLE), 1500);
      }, 2500);
    } else if (item.type === 'game') {
      setChiquilinState(CHIQUILIN_STATES.HAPPY);
      sounds.play('catch');
      setMessage('¡Chiquilín atrapó el juguete y está muy feliz! 🐾');
      setTimeout(() => {
        setChiquilinState(CHIQUILIN_STATES.IDLE);
      }, 2000);
    } else if (item.type === 'groom') {
      if (groomTimerRef.current) clearTimeout(groomTimerRef.current);
      setChiquilinState(CHIQUILIN_STATES.HAPPY);
      sounds.stopLoop('brush');
      setMessage('¡Chiquilín quedó súper suave y feliz! ✨');
      setTimeout(() => {
        setChiquilinState(CHIQUILIN_STATES.IDLE);
      }, 1500);
    }
  };

  const handleEquipAccessory = (accessory, category) => {
    if (isSleeping) {
      setMessage('No despiertes a Chiquilín para cambiarle la ropa. 💤');
      return;
    }
    sounds.play('equip');
    setSelectedAccessories((prev) => ({
      ...prev,
      [category]: accessory,
    }));
    setMessage(`¡Le queda hermoso el ${accessory.name.toLowerCase()} a Chiquilín! ✨`);
  };

  const handleUnequipAccessory = (accessory, category) => {
    if (isSleeping) {
      setMessage('Chiquilín está durmiendo plácidamente. 💤');
      return;
    }
    setSelectedAccessories((prev) => ({
      ...prev,
      [category]: null,
    }));
    sounds.play('unequip');
    setMessage('Has guardado el accesorio de nuevo en la caja. 📦');
  };

  const handleReturnItemToBar = (item) => {
    sounds.play('unequip');
    setItemPositions((prev) => ({
      ...prev,
      [item.id]: null,
    }));
    setMessage(`Has guardado el ${item.name.toLowerCase()} en la barra. 🧹`);
  };

  const handleResetPositions = () => {
    sounds.play('pop');
    setItemPositions(EMPTY_POSITIONS);
  };

  const allHeadAccessories = ACCESSORIES.head || [];
  const allNeckAccessories = ACCESSORIES.neck || [];

  // Cuadrícula que baja de fila: el panel solo hace scroll vertical (nunca horizontal).
  // En móvil las miniaturas son más pequeñas para que quepan más por fila.
  const renderAccessoryCategory = (label, category, list) => {
    const small = layout.bottom;
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div
          className={`grid gap-1.5 items-center ${
            small
              ? 'grid-cols-[repeat(auto-fill,minmax(3rem,1fr))]'
              : 'grid-cols-[repeat(auto-fill,minmax(4rem,1fr))]'
          }`}
        >
          <button
            onClick={() => handleUnequipAccessory(selectedAccessories[category], category)}
            className={`aspect-square w-full rounded-2xl border flex flex-col items-center justify-center transition-all ${
              !selectedAccessories[category]
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-inner'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-400'
            }`}
            title={`Quitar accesorio de ${label.toLowerCase()}`}
          >
            <span className="text-lg">❌</span>
            <span className="text-[9px] font-medium">Ninguno</span>
          </button>

          {list.map((acc) => {
            if (selectedAccessories[category]?.id === acc.id) return null;
            return (
              <div
                key={acc.id}
                className={small ? '[&_img]:w-10 [&_img]:h-10' : '[&_img]:w-14 [&_img]:h-14'}
                onPointerDownCapture={() => sounds.play('pickup')}
              >
                <DraggableAccessory
                  accessory={resolveAccessory(acc, layout.bottom ? 'mobile' : 'desktop')}
                  category={category}
                  onDropOnChiquilin={(item) => handleEquipAccessory(item, category)}
                  onDragStart={() => setIsDraggingAccessory(true)}
                  onDragEnd={() => setIsDraggingAccessory(false)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const { bottom, compact, barThickness } = layout;

  // Accesorios con las medidas del dispositivo actual. Se busca por id en ACCESSORIES,
  // así los cambios en assetsMap.js se aplican sin borrar lo guardado en localStorage.
  const device = bottom ? 'mobile' : 'desktop';
  const resolveEquipped = (acc, category) =>
    acc ? resolveAccessory((ACCESSORIES[category] || []).find((a) => a.id === acc.id) || acc, device) : acc;
  const equippedAccessories = {
    ...selectedAccessories,
    head: resolveEquipped(selectedAccessories.head, 'head'),
    neck: resolveEquipped(selectedAccessories.neck, 'neck'),
  };

  // Espacio libre para Chiquilín (descontando cabecera y barra)
  const pad = bottom
    ? { top: 136, right: 8, bottom: barThickness + 20, left: 8 }
    : { top: compact ? 70 : 90, right: barThickness + 40, bottom: 24, left: 24 };
  const availW = layout.w - pad.left - pad.right;
  const availH = (layout.h - pad.top - pad.bottom) * 0.95;
  // Altura objetivo (DISPLAY en assetsMap.js), siempre limitada para que quepa en pantalla
  const targetH = DISPLAY.chiquilinHeight[bottom ? 'mobile' : 'desktop'];
  const chiquilinScale = natural.h
    ? Math.max(0.3, Math.min(targetH / natural.h, availH / natural.h, natural.w ? availW / natural.w : Infinity))
    : 1;

  // Punto del suelo bajo Chiquilín: la habitación (horizonte y alfombra) se ajusta a él
  const centerX = pad.left + availW / 2;
  const centerY = pad.top + (layout.h - pad.top - pad.bottom) / 2;
  const groundY = centerY + natural.h * chiquilinScale * 0.42;
  const safeR = 'env(safe-area-inset-right, 0px)';

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: bottom ? 'column' : 'row',
    alignItems: bottom ? 'stretch' : 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
    paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
    // En modo lateral se reserva el ancho de la barra para que el mensaje nunca quede debajo
    paddingRight: bottom ? `max(12px, ${safeR})` : `calc(${barThickness + 28}px + ${safeR})`,
  };

  const barStyle = {
    position: 'fixed',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
    ...(bottom
      ? {
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
          flexDirection: 'column-reverse', // móvil: juguetes arriba, botones abajo
          maxWidth: 'calc(100vw - 16px)',
        }
      : {
          right: `max(12px, ${safeR})`,
          top: '50%',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 16px)',
          overflowY: 'auto',
        }),
  };

  const panelPos = bottom
    ? {
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: `calc(max(8px, env(safe-area-inset-bottom, 0px)) + ${barThickness + 12}px)`,
        width: 'min(92vw, 320px)',
        maxHeight: 'min(34dvh, 250px)',
      }
    : {
        right: `calc(max(12px, ${safeR}) + ${barThickness + 12}px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 380,
        maxHeight: 'calc(100dvh - 24px)',
      };

  const dividerStyle = bottom ? { alignSelf: 'stretch', height: 1, margin: '0 10px' } : { width: 24, height: 1 };

  // display: contents no altera el layout; solo permite oír el "agarrar" sin tocar DraggableItem
  const renderToy = (item) => (
    <div key={item.id} style={{ display: 'contents' }} onPointerDownCapture={() => sounds.play('pickup')}>
      <DraggableItem
        item={item}
        fixedPos={itemPositions[item.id]}
        onDropOnChiquilin={handleItemDrop}
        onDropOnBox={handleReturnItemToBar}
        onDragOverChiquilin={handleItemHover}
        onDropPosition={handleItemDropPosition}
      />
    </div>
  );

  return (
    <Room isNight={isNight} bgColor={bgColor} groundY={groundY} focusX={centerX}>
      {/* Cabecera: Pomodoro + mensaje. Apilados en móvil vertical, en fila en el resto. */}
      <div style={headerStyle}>
        <div style={{ pointerEvents: 'auto', alignSelf: bottom ? 'stretch' : 'flex-start', minWidth: 0, maxWidth: '100%' }}>
          <Pomodoro
            compact={bottom}
            onMessage={(msg) => setMessage(msg)}
            onStateChange={(nextStateKey) => {
              const targetState = CHIQUILIN_STATES[nextStateKey] || CHIQUILIN_STATES.IDLE;
              setChiquilinState(targetState);
            }}
          />
        </div>

        <div
          style={{
            alignSelf: bottom ? 'flex-end' : 'flex-start',
            maxWidth: bottom ? '100%' : '42%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            minWidth: 0,
          }}
        >
          <button
            onClick={toggleSound}
            className="ui-card ui-btn shrink-0 rounded-2xl text-lg flex items-center justify-center"
            style={{ width: 40, height: 40, pointerEvents: 'auto' }}
            title={soundOn ? 'Silenciar' : 'Activar sonido'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <div
            className="ui-card min-w-0 px-3.5 py-2 font-bold text-right break-words"
            style={{ fontSize: bottom || compact ? 12 : 14 }}
          >
            {message}
          </div>
        </div>
      </div>

      {/* Chiquilín: centrado en el espacio que dejan cabecera y barra */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: `${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px`,
        }}
      >
        <div ref={chiquilinBoxRef} style={{ pointerEvents: 'auto', transform: `scale(${chiquilinScale})` }}>
          <Chiquilin
            state={chiquilinState}
            onClick={handleClick}
            onPet={handlePet}
            selectedAccessories={equippedAccessories}
            chasingOffset={chasingOffset}
            flipHorizontal={flipHorizontal}
            onRemoveAccessory={(acc, category) => handleUnequipAccessory(acc, category)}
          />
        </div>
      </div>

      {/* Ítems sueltos por la habitación */}
      {Object.values(ITEMS).map((item) => {
        const pos = itemPositions[item.id];
        if (!pos) return null;
        return (
          <div key={`free-${item.id}`} style={{ display: 'contents' }} onPointerDownCapture={() => sounds.play('pickup')}>
            <DraggableItem
              item={item}
              fixedPos={pos}
              onDropOnChiquilin={handleItemDrop}
              onDropOnBox={handleReturnItemToBar}
              onDragOverChiquilin={handleItemHover}
              onDropPosition={handleItemDropPosition}
            />
          </div>
        );
      })}

      {/* Panel de accesorios */}
      {isBoxOpen && (
        <div
          className={`${PANEL_CLASS} flex flex-col gap-3 transition-opacity ${
            isDraggingAccessory ? 'opacity-0 pointer-events-none' : ''
          }`}
          style={panelPos}
        >
          <span className="font-display text-sm text-amber-800 text-center block border-b-2 border-amber-100 pb-1">
            Accesorios
          </span>
          {renderAccessoryCategory('Cabeza', 'head', allHeadAccessories)}
          <div className="h-px bg-amber-100/80" />
          {renderAccessoryCategory('Cuello', 'neck', allNeckAccessories)}
        </div>
      )}

      {/* Panel de colores */}
      {isColorPickerOpen && (
        <div
          className={`${PANEL_CLASS} flex flex-col gap-2`}
          style={{ ...panelPos, width: bottom ? 'min(80vw, 220px)' : 220, maxHeight: undefined }}
        >
          <span className="font-display text-sm text-pink-800 text-center block border-b-2 border-pink-100 pb-1">
            Fondo Pastel
          </span>
          <div className={`grid gap-2 pt-1 ${bottom ? 'grid-cols-6' : 'grid-cols-3'}`}>
            {PASTEL_COLORS.map((color) => {
              const isSelected = bgColor === color.hex;
              return (
                <button
                  key={color.id}
                  onClick={() => {
                    sounds.play('pop');
                    setBgColor(color.hex);
                    setMessage(`Fondo cambiado a ${color.name.toLowerCase()}. ✨`);
                  }}
                  className={`aspect-square w-full rounded-2xl border-2 transition-all duration-200 flex items-center justify-center shadow-xs ${
                    isSelected ? 'border-pink-500 scale-105 shadow-md ring-2 ring-pink-200' : 'border-white/80 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de herramientas: abajo en móvil vertical (2 filas), lateral en el resto */}
      <div id="sidebar-target" className="ui-card" style={barStyle}>
        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: bottom ? 'row' : 'column', alignItems: 'center', gap: 8 }}>
          <div id="accessory-box-target" style={{ flexShrink: 0 }}>
            <button
              onClick={() => {
                sounds.play('pop');
                setIsBoxOpen(!isBoxOpen);
                setIsColorPickerOpen(false);
              }}
              className={`${TOOL_BUTTON} ${
                isBoxOpen ? 'bg-amber-300 text-amber-900 scale-105' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
              }`}
              style={{ width: BTN, height: BTN }}
              title="Abrir/Cerrar Caja de Accesorios"
            >
              🎁
            </button>
          </div>

          <button
            onClick={() => {
              sounds.play('pop');
              setIsColorPickerOpen(!isColorPickerOpen);
              setIsBoxOpen(false);
            }}
            className={`${TOOL_BUTTON} ${
              isColorPickerOpen ? 'bg-pink-300 text-pink-900 scale-105' : 'bg-pink-100 hover:bg-pink-200 text-pink-800'
            }`}
            style={{ width: BTN, height: BTN, flexShrink: 0 }}
            title="Cambiar Color de Fondo"
          >
            🎨
          </button>

          {Object.values(itemPositions).some(Boolean) && (
            <button
              onClick={handleResetPositions}
              className={`${TOOL_BUTTON} bg-slate-100 hover:bg-slate-200 text-slate-700`}
              style={{ width: BTN, height: BTN, flexShrink: 0 }}
              title="Guardar juguetes"
            >
              🧹
            </button>
          )}
        </div>

        <div className="bg-amber-200/60" style={{ ...dividerStyle, flexShrink: 0 }} />

        {/* Juguetes */}
        <div style={{ display: 'flex', flexDirection: bottom ? 'row' : 'column', alignItems: 'center', gap: 8 }}>
          {renderToy(ITEMS.churu)}
          {renderToy(ITEMS.cana)}
          {renderToy(ITEMS.cepillo)}
        </div>
      </div>
    </Room>
  );
}