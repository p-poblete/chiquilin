import React, { useState, useEffect } from 'react';
import { play } from '../../audio/sounds';

const PRESETS = [
  { id: '25x5', label: '25/5', work: 25, break: 5 },
  { id: '50x10', label: '50/10', work: 50, break: 10 },
  { id: '15x3', label: '15/3', work: 15, break: 3 },
  { id: 'custom', label: 'Personalizado', work: 20, break: 5 },
];

// compact = true (teléfono en vertical): el Pomodoro se dobla en dos filas
//   fila 1: tiempo + plan | fila 2: botones a lo ancho
export const Pomodoro = ({ onClose, onStateChange, onMessage, compact = false }) => {
  const [selectedPreset, setSelectedPreset] = useState('25x5');
  const [workMinutesInput, setWorkMinutesInput] = useState(25);
  const [breakMinutesInput, setBreakMinutesInput] = useState(5);

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' | 'break'

  const handlePresetSelect = (e) => {
    const presetId = e.target.value;
    play('pop');
    setSelectedPreset(presetId);
    setIsActive(false);
    setMode('work');
    setSeconds(0);
    if (onStateChange) onStateChange('IDLE');

    if (presetId !== 'custom') {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setWorkMinutesInput(preset.work);
        setBreakMinutesInput(preset.break);
        setMinutes(preset.work);
      }
    } else {
      setMinutes(workMinutesInput);
    }
  };

  const handleCustomChange = (newWork, newBreak) => {
    const w = Math.max(1, parseInt(newWork) || 1);
    const b = Math.max(1, parseInt(newBreak) || 1);
    setWorkMinutesInput(w);
    setBreakMinutesInput(b);
    if (selectedPreset === 'custom') {
      setIsActive(false);
      setMode('work');
      setMinutes(w);
      setSeconds(0);
      if (onStateChange) onStateChange('IDLE');
    }
  };

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds((prev) => prev - 1);
        } else if (minutes > 0) {
          setMinutes((prev) => prev - 1);
          setSeconds(59);
        } else {
          if (mode === 'work') {
            setMode('break');
            const targetBreak =
              selectedPreset === 'custom'
                ? breakMinutesInput
                : PRESETS.find((p) => p.id === selectedPreset)?.break || 5;
            setMinutes(targetBreak);
            setSeconds(0);
            play('bell');
            if (onMessage) onMessage('Tiempo de descanso. Chiquilin se despierta.');
            if (onStateChange) onStateChange('IDLE');
          } else {
            setMode('work');
            const targetWork =
              selectedPreset === 'custom'
                ? workMinutesInput
                : PRESETS.find((p) => p.id === selectedPreset)?.work || 25;
            setMinutes(targetWork);
            setSeconds(0);
            setIsActive(false);
            play('chime');
            if (onMessage) onMessage('Descanso finalizado. Volvemos al estudio.');
            if (onStateChange) onStateChange('IDLE');
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, mode, selectedPreset, workMinutesInput, breakMinutesInput, onMessage, onStateChange]);

  const toggleTimer = () => {
    if (!isActive) {
      play('start');
      if (mode === 'work') {
        if (onMessage) onMessage('Modo enfoque activo. Chiquilin duerme.');
        if (onStateChange) onStateChange('SLEEPING');
      } else {
        if (onMessage) onMessage('Modo descanso activo.');
        if (onStateChange) onStateChange('IDLE');
      }
    }
    if (isActive) play('pause');
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('work');
    const targetWork =
      selectedPreset === 'custom'
        ? workMinutesInput
        : PRESETS.find((p) => p.id === selectedPreset)?.work || 25;
    setMinutes(targetWork);
    setSeconds(0);
    play('pop');
    if (onMessage) onMessage('Temporizador reiniciado.');
    if (onStateChange) onStateChange('IDLE');
  };

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isWork = mode === 'work';

  // 16px en táctil evita el zoom automático de iOS al enfocar el campo
  const fieldText = compact ? 'text-[16px]' : 'text-xs';

  return (
    // Sin position:fixed: la posición la decide el contenedor (cabecera) de App
    <div
      className={`flex flex-wrap items-center ui-card ${
        compact ? 'w-full justify-between gap-x-3 gap-y-2 px-3 py-2' : 'w-fit max-w-full gap-3 px-4 py-2'
      }`}
    >
      {/* 1. Tiempo */}
      <span
        className={`font-display text-3xl tracking-wide transition-colors duration-300 ${
          isWork ? 'text-black' : 'text-emerald-600'
        }`}
      >
        {formattedTime}
      </span>

      {!compact && <div className="w-px h-6 bg-rose-200/60" />}

      {/* 2. Plan de tiempo */}
      <div className="flex items-center gap-1.5">
        <select
          value={selectedPreset}
          onChange={handlePresetSelect}
          className={`bg-white/80 text-slate-700 ${fieldText} font-semibold px-2 py-1 rounded-lg border border-rose-200/80 focus:outline-none focus:border-rose-300 cursor-pointer`}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {selectedPreset === 'custom' && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <input
              type="number"
              value={workMinutesInput}
              onChange={(e) => handleCustomChange(e.target.value, breakMinutesInput)}
              className={`w-12 bg-white border border-rose-200 rounded text-center text-slate-700 focus:outline-none py-0.5 ${fieldText}`}
              min="1"
              max="120"
              title="Minutos de trabajo"
            />
            <span>/</span>
            <input
              type="number"
              value={breakMinutesInput}
              onChange={(e) => handleCustomChange(workMinutesInput, e.target.value)}
              className={`w-12 bg-white border border-rose-200 rounded text-center text-slate-700 focus:outline-none py-0.5 ${fieldText}`}
              min="1"
              max="60"
              title="Minutos de descanso"
            />
          </div>
        )}
      </div>

      {!compact && <div className="w-px h-6 bg-rose-200/60" />}

      {/* 3. Botones: apilados en escritorio, en una fila completa (segunda línea) en móvil */}
      <div className={compact ? 'basis-full flex gap-2' : 'flex flex-col gap-1'}>
        <button
          onClick={toggleTimer}
          className={`ui-btn rounded-lg font-bold tracking-wide uppercase ${
            compact ? 'flex-1 py-1.5 text-[11px]' : 'px-3 py-0.5 text-[10px]'
          } ${
            isActive
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          }`}
        >
          {isActive ? 'Detener' : 'Iniciar'}
        </button>

        <button
          onClick={resetTimer}
          className={`ui-btn rounded-lg font-semibold text-slate-500 bg-white/80 hover:bg-white ${
            compact ? 'flex-1 py-1.5 text-[11px]' : 'px-3 py-0.5 text-[10px]'
          }`}
        >
          Reiniciar
        </button>
      </div>

      {onClose && (
        <button
          onClick={() => {
            if (onStateChange) onStateChange('IDLE');
            onClose();
          }}
          className="ml-1 text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors"
          title="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  );
};