import React from 'react';
import { ChiquilinSprite } from './ChiquilinSprite';

export const Chiquilin = ({
  state,
  onClick,
  onPet,
  selectedAccessories,
  chasingOffset = { x: 0, y: 0 },
  flipHorizontal = false,
}) => {
  return (
    <div
      id="chiquilin-target"
      onClick={onClick}
      onDoubleClick={onPet}
      style={{
        transform: `translate(${chasingOffset.x}px, ${chasingOffset.y}px) scaleX(${
          flipHorizontal ? -1 : 1
        })`,
        transition: 'transform 0.15s ease-out', // Transición suave para perseguir
      }}
      className="cursor-pointer select-none touch-none"
    >
      <ChiquilinSprite state={state} selectedAccessories={selectedAccessories} />
    </div>
  );
};