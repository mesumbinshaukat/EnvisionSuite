import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ text, children, position = 'top' }) {
  const anchorRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    let top = 0, left = 0, translate = '';
    switch (position) {
      case 'bottom':
        top = rect.bottom + window.scrollY + 8; left = rect.left + rect.width/2 + window.scrollX; translate = 'translateX(-50%)'; break;
      case 'left':
        top = rect.top + rect.height/2 + window.scrollY; left = rect.left + window.scrollX - 8; translate = 'translate(-100%, -50%)'; break;
      case 'right':
        top = rect.top + rect.height/2 + window.scrollY; left = rect.right + window.scrollX + 8; translate = 'translateY(-50%)'; break;
      case 'top':
      default:
        top = rect.top + window.scrollY - 8; left = rect.left + rect.width/2 + window.scrollX; translate = 'translate(-50%, -100%)';
    }
    setCoords({ top, left, translate });
  }, [hover, position]);

  return (
    <span ref={anchorRef} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[11px] leading-none select-none cursor-help align-middle"
      onMouseEnter={()=> setHover(true)} onMouseLeave={()=> setHover(false)} aria-label={text} role="img">
      {children ?? 'i'}
      {hover && coords && createPortal(
        <div className="pointer-events-none fixed z-[9999] whitespace-pre rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg" style={{ top: coords.top, left: coords.left, transform: coords.translate }}>
          {text}
        </div>, document.body
      )}
    </span>
  );
}