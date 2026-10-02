// Cuerpos de Chiquilín
import cuerpoNormal from '../assets/chiquilin/cuerpo_normal.png';
import cuerpoDormir from '../assets/chiquilin/cuerpo_dormir.png';
import cuerpoJugar from '../assets/chiquilin/cuerpo_jugar.png';

// Cabezas de Chiquilín
import cabezaNormal from '../assets/chiquilin/cabeza_normal.png';
import cabezaComiendo from '../assets/chiquilin/cabeza_comiendo.png';
import cabezaDormir from '../assets/chiquilin/cabeza_dormir.png';
import cabezaFeliz from '../assets/chiquilin/cabeza_feliz.png';
import cabezaJugar from '../assets/chiquilin/cabeza_jugar.png';
import cabezaRonroneo from '../assets/chiquilin/cabeza_ronroneo.png';

// Accesorios
import gorroBombero from '../assets/accessories/gorro_bombero.png';
import gorroGhast from '../assets/accessories/gorro_ghast.png';
import gorroPolicia from '../assets/accessories/gorro_policia.png';
import gorroPooh from '../assets/accessories/gorro_pooh.png';

import bufandaRojo from '../assets/accessories/accesorio_bufanda_rojo.png';
import collar from '../assets/accessories/accesorio_collar.png';
import corbatin from '../assets/accessories/accesorio_corbatin.png';
import corbatinRojo from '../assets/accessories/accesorio_corbatin_rojo.png';

// Items interactivos
import churu from '../assets/items/churu.png';
import cana from '../assets/items/caña.png';
import cepillo from '../assets/items/cepillo.png';

// Tamaños de visualización (px). "desktop" = PC, tablet y móvil en horizontal;
// "mobile" = móvil en vertical.
export const DISPLAY = {
  // Altura a la que se ve Chiquilín completo (cuerpo + cabeza).
  // Si no cabe en pantalla, se reduce solo.
  chiquilinHeight: { desktop: 420, mobile: 360 },

  // Tamaño máximo de los juguetes (churu, caña, cepillo)
  items: {
    desktop: { bar: 80, loose: 112 }, // en la barra / sueltos en la habitación
    mobile: { bar: 72, loose: 120 },
  },
};

// Cuántos px baja Chiquilín al dormir (cuerpo, cabeza y accesorios juntos).
// Súbelo si aún se ve muy arriba, bájalo si se ve muy abajo.
// Para probar valores sin editar el código: abre la app con  ?sleepDrop=90  al final de la URL.
const sleepDropParam =
  typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('sleepDrop')) : 0;
export const SLEEP_DROP = sleepDropParam || 70;

export const CHIQUILIN_PARTS = {
  bodies: {
    normal: { image: cuerpoNormal, scale: 1, offsetY: 0, offsetX: 0 },
    sleeping: { image: cuerpoDormir, scale: 1, offsetY: -13 + SLEEP_DROP, offsetX: 16 },
    playing: { image: cuerpoJugar, scale: 1.25, offsetY: -27, offsetX: -19 },
  },
  heads: {
    normal: { image: cabezaNormal, scale: 1, offsetY: 0, offsetX: 0 },
    eating: { image: cabezaComiendo, scale: 0.93, offsetY: -3, offsetX: 0 },
    sleeping: { image: cabezaDormir, scale: 1, offsetY: SLEEP_DROP, offsetX: 0 },
    happy: { image: cabezaFeliz, scale: 0.93, offsetY: -3, offsetX: 0 },
    playing: { image: cabezaJugar, scale: 1, offsetY: 0, offsetX: 0 },
    purring: { image: cabezaRonroneo, scale: 0.93, offsetY: -3, offsetX: 0 },
  },
};

// Cada accesorio puede tener scale, offsetX y offsetY de dos formas:
//   offsetY: -76                          → mismo valor en PC y móvil
//   offsetY: { mobile: -76, desktop: -90 } → un valor distinto por dispositivo
// (negativo = más arriba). "mobile" = móvil en vertical; "desktop" = todo lo demás.
// Los valores de "mobile" son los que ya tenías; los de "desktop" empiezan iguales: ajústalos.
export const ACCESSORIES = {
  head: [
    {
      id: 'bombero',
      name: 'Gorro Bombero',
      image: gorroBombero,
      scale: { mobile: 0.4, desktop: 0.4 },
      offsetY: { mobile: -76, desktop: -76 },
      offsetX: { mobile: 0, desktop: 0 },
    },
    {
      id: 'ghast',
      name: 'Gorro Ghast',
      image: gorroGhast,
      scale: { mobile: 0.6, desktop: 0.6 },
      offsetY: { mobile: -60, desktop: -60 },
      offsetX: { mobile: 0, desktop: 0 },
    },
    {
      id: 'policia',
      name: 'Gorro Policía',
      image: gorroPolicia,
      scale: { mobile: 0.4, desktop: 0.4 },
      offsetY: { mobile: -70, desktop: -70 },
      offsetX: { mobile: 0, desktop: 0 },
    },
    {
      id: 'pooh',
      name: 'Gorro Winnie',
      image: gorroPooh,
      scale: { mobile: 0.55, desktop: 0.55 },
      offsetY: { mobile: -58, desktop: -58 },
      offsetX: { mobile: 1, desktop: 1 },
    },
  ],
  neck: [
    {
      id: 'bufanda_rojo',
      name: 'Bufanda Roja',
      image: bufandaRojo,
      scale: { mobile: 0.63, desktop: 0.63 },
      offsetY: { mobile: -10, desktop: -10 },
      offsetX: { mobile: -2, desktop: -2 },
    },
    {
      id: 'collar',
      name: 'Collar',
      image: collar,
      scale: { mobile: 0.55, desktop: 0.55 },
      offsetY: { mobile: 0, desktop: 0 },
      offsetX: { mobile: 0, desktop: 0 },
    },
    {
      id: 'corbatin',
      name: 'Corbatín Negro',
      image: corbatin,
      scale: { mobile: 0.4, desktop: 0.4 },
      offsetY: { mobile: -6, desktop: -6 },
      offsetX: { mobile: 0, desktop: 0 },
    },
    {
      id: 'corbatin_rojo',
      name: 'Corbatín Rojo',
      image: corbatinRojo,
      scale: { mobile: 0.4, desktop: 0.4 },
      offsetY: { mobile: -6, desktop: -6 },
      offsetX: { mobile: 0, desktop: 0 },
    },
  ],
};

// Devuelve el accesorio con scale/offsetX/offsetY ya como números para el dispositivo dado
export const resolveAccessory = (acc, device) => {
  if (!acc) return acc;
  const out = { ...acc };
  for (const key of ['scale', 'offsetX', 'offsetY']) {
    const v = acc[key];
    if (v && typeof v === 'object') out[key] = v[device] ?? v.desktop ?? v.mobile ?? 0;
  }
  return out;
};

export const ITEMS = {
  churu: { id: 'churu', name: 'Churu', image: churu, type: 'food' },
  cana: { id: 'cana', name: 'Caña de pescar', image: cana, type: 'game' },
  cepillo: { id: 'cepillo', name: 'Cepillo', image: cepillo, type: 'groom' },
};