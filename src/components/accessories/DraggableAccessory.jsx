import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

export const DraggableAccessory = ({ 
  accessory, 
  category, 
  onDropOnChiquilin, 
  onDropOnBox, 
  isEquipped 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e) => {
      setIsDragging(false);
      const x = e.clientX;
      const y = e.clientY;

      const dropTarget = document.elementFromPoint(x, y);

      // 1. Detectar si cayó sobre Chiquilín (para equiparlo desde la caja)
      const chiquilinZone = dropTarget?.closest('#chiquilin-target');
      if (chiquilinZone && onDropOnChiquilin) {
        onDropOnChiquilin(accessory, category);
        return;
      }

      // 2. Si es un accesorio equipado en Chiquilín y se suelta fuera de él:
      if (isEquipped) {
        const boxZone = dropTarget?.closest('#accessory-box-target');
        const sideBarZone = dropTarget?.closest('#sidebar-target');

        // Si se suelta en la caja, en la barra lateral o en cualquier lugar libre -> Devolver a la caja
        if (boxZone || sideBarZone || !chiquilinZone) {
          if (onDropOnBox) {
            onDropOnBox(accessory, category);
          }
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, accessory, category, onDropOnChiquilin, onDropOnBox, isEquipped]);

  const handlePointerDown = (e) => {
    e.stopPropagation(); // Evitar disparar eventos sobre Chiquilín al agarrar el accesorio
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        style={
          isEquipped
            ? {
                transform: `translate(${accessory.offsetX || 0}px, ${accessory.offsetY || 0}px) scale(${accessory.scale || 1})`,
              }
            : undefined
        }
        className={`touch-none cursor-grab p-1 transition-transform select-none flex items-center justify-center ${
          isDragging ? 'opacity-20' : 'opacity-100 hover:scale-110'
        }`}
      >
        <img
          src={accessory.image}
          alt={accessory.name}
          className="w-16 h-16 object-contain pointer-events-none drop-shadow-md"
        />
      </div>

      {/* Portal del accesorio flotando durante el arrastre */}
      {isDragging &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${((accessory.scale || 1) * 1.2).toFixed(2)})`,
              zIndex: 999999,
              pointerEvents: 'none',
            }}
            className="touch-none select-none"
          >
            <img
              src={accessory.image}
              alt={accessory.name}
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>,
          document.body
        )}
    </>
  );
};