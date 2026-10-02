import { useState, useEffect } from 'react';
import { DISPLAY } from '../data/assetsMap';

const BTN = 44; // lado de los botones 🎁 🎨 🧹
const PAD = 8;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Un solo cálculo decide TODO el layout según el tamaño real de la pantalla:
//  - bottom: barra abajo (teléfono en vertical)
//  - side:   barra a la derecha (PC, tablet, teléfono en horizontal)
// Los tamaños de los ítems se ajustan para que la barra siempre quepa.
const compute = () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const bottom = w < 768 && h >= w;
  const compact = !bottom && h < 520;

  // Móvil vertical: la barra tiene 2 filas (juguetes arriba, botones abajo), así que los
  // juguetes pueden usar todo el ancho: (ancho - márgenes/padding - 2 separaciones) / 3.
  // Resto: columna lateral; 213px = márgenes + padding + 3 botones + divisor + separaciones.
  const box = bottom ? Math.floor((w - 48) / 3) : Math.floor((h - 213) / 3);
  const cap = DISPLAY.items[bottom ? 'mobile' : 'desktop'];
  const itemSize = clamp(box - 8, 32, cap.bar); // -8 por el p-1 del ítem
  const loose = clamp(Math.round(Math.min(w, h) * (bottom ? 0.26 : 0.18)), 64, cap.loose);

  return {
    w,
    h,
    bottom,
    compact,
    itemSize,
    loose,
    half: loose / 2 + 8,
    // alto de la barra (móvil: 2 filas + divisor) o ancho de la columna (lateral)
    barThickness: bottom ? itemSize + 8 + BTN + PAD * 2 + 17 : Math.max(itemSize + 8, BTN) + PAD * 2,
  };
};

export const useLayout = () => {
  const [layout, setLayout] = useState(compute);

  useEffect(() => {
    const update = () => setLayout(compute());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // Variables CSS que usa DraggableItem para el tamaño de sus imágenes
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--bar-item', `${layout.itemSize}px`);
    root.setProperty('--loose-item', `${layout.loose}px`);
  }, [layout.itemSize, layout.loose]);

  return layout;
};