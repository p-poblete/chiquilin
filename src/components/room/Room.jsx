import React, { useState } from 'react';

const BASEBOARD = '#FFFFFF';
const WOOD = '#E8C9A0';

/**
 * Habitación dibujada con CSS (ya no usa fondo.png).
 *  - bgColor: color de la pared (lo cambia el selector 🎨)
 *  - groundY / focusX: punto del suelo bajo Chiquilín (px); la alfombra y el horizonte se ajustan a él
 */
export const Room = ({ isNight, bgColor = '#FFF5E6', groundY, focusX, children }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Parallax muy leve con el ratón (en táctil no se dispara)
  const handleMouseMove = (e) => {
    setTilt({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    });
  };

  const horizon = groundY != null ? Math.round(groundY - 36) : null; // dónde termina la pared
  const horizonCss = horizon != null ? `${horizon}px` : '60%';
  const cx = focusX != null ? `${Math.round(focusX)}px` : '50%';
  const cy = groundY != null ? `${Math.round(groundY)}px` : '68%';

  const layerStyle = (k) => ({
    position: 'absolute',
    inset: 0,
    transform: `translate(${tilt.x * k}px, ${tilt.y * k * 0.7}px) scale(1.02)`,
    transition: 'transform 0.25s ease-out',
  });

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* ESCENA (sin perspective/preserve-3d: no desplaza a los hijos fixed) */}
      <div style={layerStyle(-4)} className="pointer-events-none">
        {/* Pared */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: horizonCss,
            backgroundColor: bgColor,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.45) 0 22px, rgba(255,255,255,0) 22px 44px)',
            transition: 'background-color 0.5s',
          }}
        >
          {/* Friso (tercio inferior de la pared) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 14,
              height: '24%',
              background: 'rgba(255,255,255,0.5)',
              borderTop: '3px solid rgba(120,80,40,0.10)',
            }}
          />
          {/* Rodapié */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 14,
              background: BASEBOARD,
              borderTop: '2px solid rgba(120,80,40,0.15)',
            }}
          />

          {/* Ventana con arco: de día cielo y nube, de noche luna y estrellas */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(12px, 8vw, 120px)',
              top: '26%',
              width: 'clamp(96px, 20vw, 200px)',
              aspectRatio: '4 / 5',
              borderRadius: '999px 999px 10px 10px',
              border: '7px solid #fff',
              boxShadow: '0 0 0 3px #E9D6BE, 0 7px 0 rgba(120,80,40,0.12)',
              overflow: 'hidden',
              background: isNight
                ? 'linear-gradient(#1E1B4B, #4338A0)'
                : 'linear-gradient(#9ADCFF, #E6F7FF)',
              transition: 'background 1s',
            }}
          >
            {isNight ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(#fff 1.2px, transparent 1.8px)',
                    backgroundSize: '26px 30px',
                    opacity: 0.75,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '16%',
                    top: '16%',
                    width: '28%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: '#FFF6D6',
                    boxShadow: 'inset -7px -2px 0 #F0E2A8, 0 0 18px rgba(255,246,214,0.6)',
                  }}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    top: '22%',
                    width: '46%',
                    height: '14%',
                    borderRadius: 999,
                    background: '#fff',
                    boxShadow: '14px -6px 0 -1px #fff',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '12%',
                    top: '48%',
                    width: '34%',
                    height: '11%',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.9)',
                  }}
                />
              </>
            )}
            {/* Travesaños */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 5, background: '#fff', transform: 'translateX(-50%)' }} />
            <div style={{ position: 'absolute', top: '55%', left: 0, right: 0, height: 5, background: '#fff' }} />
          </div>
        </div>
      </div>

      <div style={layerStyle(3)} className="pointer-events-none">
        {/* Suelo de madera */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: horizonCss,
            bottom: 0,
            backgroundColor: WOOD,
            backgroundImage: [
              'linear-gradient(to bottom, rgba(90,50,20,0.16), rgba(90,50,20,0) 28%)',
              'repeating-linear-gradient(90deg, rgba(120,72,30,0.14) 0 2px, transparent 2px 120px)',
              'repeating-linear-gradient(0deg, rgba(120,72,30,0.07) 0 1px, transparent 1px 56px)',
            ].join(','),
          }}
        />
        {/* Alfombra bajo Chiquilín */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 'min(82vw, 560px)',
            aspectRatio: '5 / 1.15',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '4px solid #fff',
            outline: '3px solid rgba(120,80,40,0.12)',
            background: 'repeating-radial-gradient(ellipse at center, #F6C4CE 0 14px, #FADDE3 14px 28px)',
            boxShadow: '0 8px 0 rgba(120,80,40,0.12)',
          }}
        />
      </div>

      {/* Noche: oscurece la escena (queda por debajo del contenido) y enciende una lámpara sobre Chiquilín */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          background: `radial-gradient(circle at ${cx} ${cy}, rgba(255,214,140,0.28), transparent 55%), rgba(24,24,70,0.38)`,
          opacity: isNight ? 1 : 0,
          transition: 'opacity 1s',
        }}
      />

      {/* CONTENIDO (interactivo) */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};