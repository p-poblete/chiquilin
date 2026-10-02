import React, { useEffect } from 'react';
import { CHIQUILIN_PARTS, ACCESSORIES, SLEEP_DROP } from '../../data/assetsMap';
import { CHIQUILIN_STATES } from '../../data/chiquilinStates';

// Valores numéricos seguros (si llegara un objeto { mobile, desktop } sin resolver, usa el valor por defecto)
const num = (v, fallback) => (typeof v === 'number' ? v : fallback);

export const ChiquilinSprite = ({ state, selectedAccessories = {} }) => {
  // Precarga todas las imágenes: así cuerpo y cabeza cambian a la vez y no hay un instante
  // en que una pose ya cambió y la otra imagen todavía se está descargando.
  useEffect(() => {
    const parts = [
      ...Object.values(CHIQUILIN_PARTS.bodies),
      ...Object.values(CHIQUILIN_PARTS.heads),
      ...ACCESSORIES.head,
      ...ACCESSORIES.neck,
    ];
    parts.forEach((p) => {
      const img = new Image();
      img.src = p.image;
      img.decode?.().catch(() => {});
    });
  }, []);

  const getHeadData = () => {
    switch (state) {
      case CHIQUILIN_STATES.SLEEPING:
        return CHIQUILIN_PARTS.heads.sleeping;
      case CHIQUILIN_STATES.EATING:
        return CHIQUILIN_PARTS.heads.eating;
      case CHIQUILIN_STATES.HAPPY:
        return CHIQUILIN_PARTS.heads.happy;
      case CHIQUILIN_STATES.PETTING:
        return CHIQUILIN_PARTS.heads.purring;
      case CHIQUILIN_STATES.CHASING:
        return CHIQUILIN_PARTS.heads.playing;
      default:
        return CHIQUILIN_PARTS.heads.normal;
    }
  };

  const getBodyData = () => {
    if (state === CHIQUILIN_STATES.SLEEPING) return CHIQUILIN_PARTS.bodies.sleeping;
    if (state === CHIQUILIN_STATES.CHASING) return CHIQUILIN_PARTS.bodies.playing;
    return CHIQUILIN_PARTS.bodies.normal;
  };

  const bodyData = getBodyData();
  const headData = getHeadData();
  // Al dormir, cuerpo y cabeza bajan SLEEP_DROP px: los accesorios deben bajar igual
  const poseShiftY = state === CHIQUILIN_STATES.SLEEPING ? SLEEP_DROP : 0;

  // App ya entrega estos accesorios con scale/offsetX/offsetY del dispositivo actual.
  // (Antes se buscaban por id en ACCESSORIES, ignorando esos valores.)
  const headAccData = selectedAccessories.head;
  const neckAccData = selectedAccessories.neck;

  return (
    // Tamaño FIJO: los offsets están en píxeles, así que el sprite no debe cambiar de tamaño
    // entre PC y móvil. App lo escala a la altura de DISPLAY.chiquilinHeight.
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* 1. Base: Cuerpo */}
      {bodyData && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          style={{
            transform: `translate(${bodyData.offsetX ?? 0}px, ${bodyData.offsetY ?? 0}px)`,
          }}
        >
          <img
            src={bodyData.image}
            alt="Cuerpo"
            style={{ transform: `scale(${bodyData.scale ?? 1})` }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* 2. Accesorio de Cuello (detrás de la cabeza) */}
      {neckAccData && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{
            transform: `translate(${num(neckAccData.offsetX, 0)}px, ${num(neckAccData.offsetY, 0) + poseShiftY}px)`,
          }}
        >
          <img
            src={neckAccData.image}
            alt={neckAccData.name}
            style={{ transform: `scale(${num(neckAccData.scale, 0.6)})` }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* 3. Cabeza */}
      {headData && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          style={{
            transform: `translate(${headData.offsetX ?? 0}px, ${headData.offsetY ?? 0}px)`,
          }}
        >
          <img
            src={headData.image}
            alt="Cabeza"
            style={{ transform: `scale(${headData.scale ?? 1})` }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* 4. Accesorio de Cabeza (por encima de la cabeza) */}
      {headAccData && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          style={{
            transform: `translate(${num(headAccData.offsetX, 0)}px, ${num(headAccData.offsetY, 0) + poseShiftY}px)`,
          }}
        >
          <img
            src={headAccData.image}
            alt={headAccData.name}
            style={{ transform: `scale(${num(headAccData.scale, 0.5)})` }}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};