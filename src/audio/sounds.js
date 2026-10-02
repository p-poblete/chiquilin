// src/audio/sounds.js
// Motor de sonido (Web Audio). Los archivos van en  public/sounds/  y todos son opcionales:
// si falta alguno simplemente no suena, sin errores.

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const DIR = `${BASE}sounds/`;
const STORAGE_KEY = 'chiquilin_sound_muted';
const MASTER_VOLUME = 0.8;

// nombre → archivo(s) en public/sounds/. Si hay varios, se elige uno al azar.
//   volume: 0–1 | variation: cambio aleatorio de tono (0.06 = ±6%) | loop: se reproduce con startLoop/stopLoop
export const SOUNDS = {
  meow: { files: ['idle1.mp3', 'meow2.ogg'], volume: 0.9, variation: 0.06 }, // clic, juguete atrapado, feliz
  purr: { files: ['purr.mp3'], volume: 0.5, loop: true }, // caricias y cepillo
  eat: { files: ['eat.mp3'], volume: 0.8 }, // churu
  sleep: { files: ['snore.mp3'], volume: 0.6 }, // modo enfoque (duerme)
  chase: { files: ['chase.ogg'], volume: 0.7 }, // caña de pescar
  equip: { files: ['equip.mp3'], volume: 0.8 }, // ponerle un accesorio
  unequip: { files: ['unequip.mp3'], volume: 0.7 }, // quitar accesorio / guardar juguete
  pop: { files: ['pop.mp3'], volume: 0.6 }, // botones, cambiar color
  drop: { files: ['drop.mp3'], volume: 0.7 }, // soltar un juguete en la habitación
  start: { files: ['start.mp3'], volume: 0.7 }, // iniciar Pomodoro
  bell: { files: ['bell.mp3'], volume: 0.9 }, // termina el enfoque → descanso
  chime: { files: ['chime.mp3'], volume: 0.9 }, // termina el descanso
  pickup: { files: ['pickup.mp3'], volume: 0.6 }, // agarrar un juguete o accesorio
  brush: { files: ['brush.mp3'], volume: 0.6, loop: true }, // cepillo pasando sobre Chiquilín
  catch: { files: ['catch.mp3'], volume: 0.8 }, // atrapa el juguete de la caña
  wake: { files: ['wake.mp3'], volume: 0.8 }, // se despierta (termina el enfoque)
  snore: { files: ['snore.mp3'], volume: 0.6 }, // lo tocas mientras duerme
  idle: { files: ['meow1.ogg', 'idle2.mp3'], volume: 0.6, variation: 0.05 }, // maullido ocasional espontáneo
  pause: { files: ['pause.mp3'], volume: 0.6 }, // detener el Pomodoro
};

let ctx = null;
let master = null;
let muted = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
})();
let unlocked = false;
const cache = new Map(); // url → Promise<AudioBuffer | null>
const loops = new Map(); // nombre → { src, gain } (o { pending: true } mientras carga)

const getCtx = () => {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_VOLUME;
  master.connect(ctx.destination);
  return ctx;
};

const load = (file) => {
  const url = DIR + file;
  if (!cache.has(url)) {
    cache.set(
      url,
      (async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const data = await res.arrayBuffer();
          const c = getCtx();
          return c ? await c.decodeAudioData(data) : null;
        } catch {
          return null; // archivo faltante o inválido: se ignora en silencio
        }
      })()
    );
  }
  return cache.get(url);
};

const createSource = async (def) => {
  const c = getCtx();
  if (!c) return null;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const file = def.files[Math.floor(Math.random() * def.files.length)];
  const buffer = await load(file);
  if (!buffer) return null;
  const src = c.createBufferSource();
  src.buffer = buffer;
  if (def.variation) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * def.variation;
  const gain = c.createGain();
  gain.gain.value = def.volume ?? 1;
  src.connect(gain);
  gain.connect(master);
  return { src, gain };
};

export const play = async (name) => {
  const def = SOUNDS[name];
  if (!def || muted) return;
  const node = await createSource(def);
  if (node) node.src.start();
};

export const startLoop = async (name) => {
  const def = SOUNDS[name];
  if (!def || muted || loops.has(name)) return;
  const slot = { pending: true };
  loops.set(name, slot); // reserva el lugar mientras carga
  const node = await createSource(def);
  if (!node) {
    if (loops.get(name) === slot) loops.delete(name);
    return;
  }
  if (loops.get(name) !== slot) return; // se detuvo mientras cargaba
  node.src.loop = true;
  node.src.start();
  loops.set(name, node);
};

export const stopLoop = (name) => {
  const node = loops.get(name);
  loops.delete(name);
  if (!node || !node.src || !ctx) return;
  const t = ctx.currentTime;
  node.gain.gain.setValueAtTime(node.gain.gain.value, t);
  node.gain.gain.linearRampToValueAtTime(0, t + 0.25); // fade-out suave
  node.src.stop(t + 0.3);
};

export const isMuted = () => muted;
export const isUnlocked = () => unlocked;

export const setMuted = (value) => {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* sin almacenamiento disponible */
  }
  if (master) master.gain.value = value ? 0 : MASTER_VOLUME;
  if (value) [...loops.keys()].forEach(stopLoop);
};

// Llamar en el primer toque: los navegadores (sobre todo iOS) solo permiten audio tras un gesto.
// También precarga todos los sonidos.
export const unlock = () => {
  const c = getCtx();
  if (!c) return;
  unlocked = true;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const s = c.createBufferSource();
  s.buffer = c.createBuffer(1, 1, 22050);
  s.connect(c.destination);
  s.start(0);
  Object.values(SOUNDS).forEach((d) => d.files.forEach(load));
};