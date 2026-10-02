import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export const DraggableItem = ({ 
  item, 
  fixedPos, 
  onDropOnChiquilin, 
  onDropOnBox, 
  onDragOverChiquilin, 
  onDropPosition 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  
  const lastXRef = useRef(0);

  // Función para orientar el ítem según la posición de Chiquilín
  const updateFlipByChiquilin = (currentX) => {
    const chiquilinTarget = document.getElementById('chiquilin-target');
    if (chiquilinTarget) {
      const rect = chiquilinTarget.getBoundingClientRect();
      const chiquilinCenterX = rect.left + rect.width / 2;
      setFlipX(currentX > chiquilinCenterX);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });

      // 1. Inclinación/Rotación según la dirección del movimiento
      const deltaX = x - lastXRef.current;
      if (deltaX !== 0) {
        const calculatedRotation = Math.max(-18, Math.min(18, deltaX * 1.5));
        setRotation(calculatedRotation);
        lastXRef.current = x;
      }

      // 2. Efecto espejo ÚNICAMENTE según la posición de Chiquilín
      updateFlipByChiquilin(x);

      // Transmitir evento para interacciones generales
      if (onDragOverChiquilin) {
        const dropTarget = document.elementFromPoint(x, y);
        const chiquilinZone = dropTarget?.closest('#chiquilin-target');
        const isHovering = Boolean(chiquilinZone);
        onDragOverChiquilin(item, { x, y, isHovering });
      }
    };

    const handlePointerUp = (e) => {
      setIsDragging(false);

      const x = e.clientX;
      const y = e.clientY;

      const dropTarget = document.elementFromPoint(x, y);

      // 1. Soltar sobre Chiquilín
      const chiquilinZone = dropTarget?.closest('#chiquilin-target');
      if (chiquilinZone && onDropOnChiquilin) {
        onDropOnChiquilin(item);
        return;
      }

      // 2. Soltar sobre la Caja de Accesorios / Barra (Devolver ítem)
      const boxZone = dropTarget?.closest('#accessory-box-target');
      if (boxZone && onDropOnBox) {
        onDropOnBox(item);
        return;
      }

      // 3. Soltar en una posición libre de la habitación
      if (onDropPosition) {
        onDropPosition(item.id, { x, y });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, item, onDropOnChiquilin, onDropOnBox, onDragOverChiquilin, onDropPosition]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    
    setPos({ x, y });
    lastXRef.current = x;

    // Calcular la orientación inicial estricta hacia Chiquilín
    updateFlipByChiquilin(x);

    setIsDragging(true);
  };

  // 1. Ítem soltado en la habitación (orientado a Chiquilín y conserva su última inclinación)
  if (fixedPos && !isDragging) {
    return (
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'fixed',
          left: `${fixedPos.x}px`,
          top: `${fixedPos.y}px`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipX ? -1 : 1})`,
          zIndex: 40,
        }}
        className="touch-none cursor-grab p-1 hover:scale-110 transition-transform active:cursor-grabbing select-none"
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 md:w-28 md:h-28 object-contain pointer-events-none drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <>
      {/* 2. Ítem en la barra vertical */}
      <div
        onPointerDown={handlePointerDown}
        className={`touch-none cursor-grab p-1 flex items-center justify-center transition-opacity duration-150 ${
          isDragging || fixedPos ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'
        }`}
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 md:w-24 md:h-24 object-contain pointer-events-none drop-shadow-sm"
        />
      </div>

      {/* 3. Ítem en arrastre (Inclinación por movimiento + Espejo por Chiquilín) */}
      {isDragging &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scale(1.15)`,
              zIndex: 999999,
              pointerEvents: 'none',
            }}
            className="touch-none select-none transition-transform duration-75"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
            />
          </div>,
          document.body
        )}
    </>
  );
};